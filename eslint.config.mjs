import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

import tsconfig from './tsconfig.json' with { type: 'json' };

export default tseslint.config(
  { ignores: tsconfig.exclude },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, importPlugin.flatConfigs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: '.',
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-empty-object-type': 'off',

      // allow interfaces to start with I
      '@typescript-eslint/interface-name-prefix': 'off',

      // allow implicit return types
      '@typescript-eslint/explicit-function-return-type': 'off',

      // dont check module boundry types
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // warn on import cycles
      'import/no-cycle': ['warn', { ignoreExternal: true }],

      // force curly braces unless single line
      curly: ['warn', 'multi-or-nest'],

      // no extra boolean casts unless needed
      'no-extra-boolean-cast': ['error', { enforceForInnerExpressions: true }],

      // force consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          fixStyle: 'inline-type-imports',
        },
      ],

      // common promise errors
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'warn',
        {
          checksConditionals: true,
        },
      ],
      // common typos and errors
      'no-self-compare': 'error',
      'no-return-assign': 'warn',
      'no-cond-assign': 'warn',

      // definitions should come first
      '@typescript-eslint/no-use-before-define': 'warn',

      // warn on using commonjs require
      '@typescript-eslint/no-var-requires': 'warn',

      // allow console.logs but output a warning
      'no-console': ['warn'],

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/extensions': [
        'warn',
        'never',
        {
          pattern: {
            json: 'always',
          },
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: ['LoggerService'],
              message: 'Use "~common/logger" instead',
            },
          ],
          patterns: [
            {
              group: ['.store/*'],
              message: 'Virtual package imported',
            },
          ],
        },
      ],

      // Restrict imports between directories
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: ['src/common/**'],
              message: 'Common should not import from other directories',
              from: ['src/*', '!src/common/**'],
            },
            {
              target: ['src/vendors/**'],
              message: 'Common should not import from other directories',
              from: ['src/*', '!src/vendors/**'],
            },
          ],
          basePath: '.',
        },
      ],

      // Enforce a specific module import order
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: '~vendors/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: '~common/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '~database/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '~modules/**',
              group: 'internal',
              position: 'after',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
    },
  },
  {
    files: ['*.(unit|spec|e2e|e2e-spec).ts'],
    rules: {
      'no-console': 'off',
    },
  },
  eslintPluginPrettierRecommended,
);
