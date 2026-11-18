import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      eqeqeq: ['error', 'always'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Import across folders with the aliases: @/, @engine, @content, @ui, @test.',
            },
          ],
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
);
