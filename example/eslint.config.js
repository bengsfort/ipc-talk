import bengsfort from '@bengsfort/eslint-config-flat';

/** @type {import('eslint').Linter.Config} */
export default [
  {
    ignores: ['dist/'],
  },
  {
    files: ['./lib/**/*.ts', './sandbox/src/**/*.ts'],
  },
  ...bengsfort.configs.strictTypeChecked(import.meta.dirname),
];