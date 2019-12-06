import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import { getErrors } from './util'
import { getVueSys } from './vue'

export default class Tester {
  service: ts.LanguageService

  constructor(
    public compilerOptions: ts.CompilerOptions,
    public sources: string[]
  ) {
    const host: ts.LanguageServiceHost = {
      getScriptFileNames: () => sources,
      getScriptVersion: f => '0',
      getScriptSnapshot: f => {
        if (!fs.existsSync(f)) {
          return undefined
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(f).toString())
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
      resolveModuleNames: (
        moduleNames,
        containingFile,
        reusedNames,
        redirectedReference,
        options
      ) => {
        // console.log(28)
        // console.log('User defined resolveModuleNames')
        // console.log(moduleNames)
        // console.log(containingFile)
        // console.log(reusedNames)
        // console.log(redirectedReference)
        // console.log(options)
        const resolutionHost = {
          fileExists: ts.sys.fileExists,
          readFile: ts.sys.readFile
        }
        // nodeModuleNameResolver が怪しい。fallback先を生成している. L28218
        // L28446 nodeModuleNameResolverで渡しているtsExtensionsを追いかける
        // L28618 tryAddingExtensions
        // L27457 getFileNamesFromConfigSpecs
        // L28441 nodeModuleNameResolverWorker
        // L96734 processImportedModules
        const ret = [] as ts.ResolvedModule[]
        moduleNames.forEach(name => {
          // console.log(name)
          const resolved = ts.resolveModuleName(
            name,
            containingFile,
            compilerOptions,
            getVueSys()
          ).resolvedModule
          // console.log('resolved')
          // console.log(resolved)
          if (resolved !== undefined) {
            ret.push(resolved)
          }
        })
        // console.log(ret.length)
        return ret
      }
    }

    this.service = ts.createLanguageService(host, ts.createDocumentRegistry())
  }

  public static fromConfigFile(configPath: string, sources?: string[]): Tester {
    const content = fs.readFileSync(configPath).toString()
    const parsed = ts.parseJsonConfigFileContent(
      JSON.parse(content),
      ts.sys,
      path.dirname(configPath),
      undefined,
      undefined,
      undefined,
      [{ extension: 'vue', isMixedContent: true }]
    )
    // console.log(parsed)
    // console.log('71')
    const vueFiles = this.getVueFile('app/**/*.vue', process.cwd())
    const explicitTypes = this.getExplicitTypes(parsed.options)
    // // const files = parsed.fileNames.reduce((acc, ac) => {
    // //   // console.log(ac)
    // //   // const res = ac.match(/\.[^\.]+$/)
    // //   // const ext = res && res[0]
    // //   // if (ext) {
    // //   //   console.log(ext)
    // //   //   acc[ext] = acc[ext] && acc[ext]++
    // //   // }
    // //   return acc
    // // }, {} as Record<string, number>)
    // // console.log(files)
    // // console.log(parsed.fileNames)
    // throw new Error('stop')

    const files = sources || [
      ...parsed.fileNames,
      ...vueFiles,
      ...explicitTypes
    ]

    return new Tester(parsed.options, files)
  }

  // TODO: receive include option as an array
  static getVueFile(include: string, basePath: string) {
    // console.log('L95')
    // basePath = ts.normalizePath(basePath)
    const combinedPath = path.join(basePath, include)
    const files = glob.sync(combinedPath)
    // console.log(files.map(f => f + '.ts'))
    return files.map(f => f + '.ts')
  }

  static getExplicitTypes(options: ts.CompilerOptions) {
    const { types } = options
    if (!types) return []
    const pattern = `node_modules/@types/{${types.join(',')}}/**/*.d.ts`
    console.log('pattern')
    console.log(pattern)
    const files = glob.sync(pattern)
    console.log(files)

    // throw new Error('hoge')
    return files
  }

  testFiles(reg?: RegExp) {
    // if (!reg) {
    //   this.sources.forEach(source => {
    //     const errors = getErrors(source, this.service)
    //     if (errors) {
    //       console.log(errors)
    //     }
    //   })
    // }
    try {
      // const program = this.service.getProgram()
      // const sourceFile =
      //   program &&
      //   program.getSourceFile('app/containers/News/Content/fixtures.ts')
      // console.log(sourceFile)
      // this.service.getProgram()!.emit()
      this.sources.forEach(source => {
        console.log(source)
        this.service
          // .getSemanticDiagnostics('app/containers/News/Content/fixtures.ts')
          .getSemanticDiagnostics(source)
          .forEach(d => {
            let line = -1
            if (d.file && d.start !== undefined) {
              line = d.file.getLineAndCharacterOfPosition(d.start).line
            }
            const message = ts.flattenDiagnosticMessageText(d.messageText, '\n')
            const error = { code: `TS${d.code}`, message }
            console.log(error)
            console.log('L77')
          })
      })
    } catch (e) {
      console.log('L88')
      // console.trace()
      console.log(e)
    }
  }
}
