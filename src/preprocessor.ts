import * as compiler from 'vue-template-compiler'

export function parseVueScript(str: string): string {
  const { script } = compiler.parseComponent(str)

  return script
    ? script.content
    : 'import Vue from "vue";\n\nexport default Vue.extend({});'
}
