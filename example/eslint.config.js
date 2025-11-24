import path from 'node:path';
import bengsfort from '@bengsfort/eslint-config-flat';

/** @type {import('eslint').Linter.Config} */
export default [
  {
    ignores: ['./dist/'],
  },
  {
    files: [
      './src/**/*.ts',
    ],
    ignores: [
      './src/node/'
    ],
    ...bengsfort.configs.strictTypeChecked(
      path.join(import.meta.dirname, 'tsconfig.json')
    ),
  },
  {
    files: [
      './src/node/**/*.ts',
    ],
    ...bengsfort.configs.strictTypeChecked(
      path.join(import.meta.dirname, 'tsconfig.node.json')
    ),
  },
];
