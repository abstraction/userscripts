/* eslint-disable userscripts/filename-user */
/* eslint-disable userscripts/no-invalid-metadata */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    greasemonkey: true
  },
  extends: [
    'plugin:userscripts/recommended',
    'plugin:prettier/recommended' // Only this line for prettier
  ],
  overrides: [
    {
      env: {
        node: true
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'error', // Will show error for console.log statements
    'prettier/prettier': 'error' // Enforces Prettier formatting
  }
};
