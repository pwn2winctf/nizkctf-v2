module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: ['standard', 'plugin:@typescript-eslint/recommended', 'plugin:json/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'markdown'],
  rules: {}
}
