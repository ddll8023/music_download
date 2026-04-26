module.exports = {
  env: { browser: true, node: true, es2022: true },
  parser: 'vue-eslint-parser',
  parserOptions: { parser: '@typescript-eslint/parser', sourceType: 'module' },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
    'vue/html-self-closing': ['error', { html: { void: 'always' } }],
    'vue/component-name-in-template-casing': ['error', 'PascalCase']
  }
}
