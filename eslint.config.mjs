import reactEslintConfig from '@yarnpkg/eslint-config/react';
import eslintConfig      from '@yarnpkg/eslint-config';

export default [
  ...eslintConfig,
  ...reactEslintConfig,
];
