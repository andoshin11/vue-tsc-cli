import { LanguageService, flattenDiagnosticMessageText } from 'typescript'

interface DiagnosticError {
  code: string
  message: string
}

export function getErrors(
  file: string,
  service: LanguageService
): DiagnosticError[] {
  const errors: DiagnosticError[] = []
  try {
    service.getSemanticDiagnostics(file).forEach(d => {
      let line = -1
      if (d.file && d.start !== undefined) {
        line = d.file.getLineAndCharacterOfPosition(d.start).line
      }
      const message = flattenDiagnosticMessageText(d.messageText, '\n')
      errors[line] = { code: `TS${d.code}`, message }
    })
  } catch (e) {
    console.log('L24')
    console.log(e)
  }

  return errors
}

export function isVueFile(path: string) {
  return path.endsWith('.vue')
}

/**
 * Determine if it's a pre-processed file
 */
export function isVirtualVueFile(path: string) {
  return path.endsWith('.vue.ts') && !path.includes('node_modules')
}
