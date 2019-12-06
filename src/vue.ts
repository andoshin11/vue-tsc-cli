import * as ts from 'typescript'
import { isVirtualVueFile } from './util'
import { parseVueScript } from './preprocessor'

export function getVueSys() {
  const vueSys: ts.System = {
    ...ts.sys,
    fileExists(path) {
      // console.log('L9')
      // console.trace()
      // console.log(path)
      if (isVirtualVueFile(path)) {
        return ts.sys.fileExists(path.slice(0, -'.ts'.length))
      }
      // console.log(path)
      return ts.sys.fileExists(path)
    },
    readFile(path, encoding) {
      if (isVirtualVueFile(path)) {
        const fileText = ts.sys.readFile(path.slice(0, -'.ts'.length), encoding)
        return fileText ? parseVueScript(fileText) : fileText
      }
      const fileText = ts.sys.readFile(path, encoding)
      return fileText
    }
  }

  if (ts.sys.realpath) {
    const { realpath } = ts.sys
    vueSys.realpath = path => {
      if (isVirtualVueFile(path)) {
        return realpath(path.slice(0, -'.ts'.length)) + '.ts'
      }
      return realpath(path)
    }
  }

  return vueSys
}
