import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // Global configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // React configuration
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    rules: {
      // React rules
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript or not enforcing prop-types
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-unused-state': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-sort-props': 'off', // Too strict for existing codebase

      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Unicorn configuration for best practices (more relaxed)
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      // Essential unicorn rules only
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-destructuring': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': 'off', // Too disruptive for existing codebase
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-for-each': 'off', // forEach is sometimes more readable
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-for-loop': 'warn', // Suggest modern alternatives
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-negated-condition': 'warn',
      'unicorn/no-nested-ternary': 'warn',
      'unicorn/no-new-array': 'error',
      'unicorn/no-null': 'off', // null is sometimes appropriate
      'unicorn/no-reduce': 'off', // reduce can be useful
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/no-unreadable-array-destructuring': 'error',
      'unicorn/no-useless-fallback-in-spread': 'error',
      'unicorn/no-useless-length-check': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/no-zero-fractions': 'error',
      'unicorn/numeric-separators-style': 'off', // Can be too strict
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-at': 'warn',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-dom-node-text-content': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-modern-dom-apis': 'error',
      'unicorn/prefer-module': 'off', // __dirname might be needed in config files
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-string-trim-start-end': 'error',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/prefer-type-error': 'error',
      'unicorn/prevent-abbreviations': [
        'warn',
        {
          replacements: {
            props: false,
            ref: false,
            params: false,
            args: false,
            fn: false,
            func: false,
            dev: false,
            prod: false,
            env: false,
            temp: false,
            tmp: false,
            utils: false,
            util: false,
            el: false,
            elem: false,
            evt: false,
            e: false,
            i: false,
            j: false,
            k: false,
          },
        },
      ],
      'unicorn/require-array-join-separator': 'error',
      'unicorn/require-number-to-fixed-digits-argument': 'error',
      'unicorn/throw-new-error': 'error',
    },
  },

  // General JavaScript best practices
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      // Code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(React|Component)$', // Allow unused React imports
          ignoreRestSiblings: true,
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': 'error',
      'arrow-spacing': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': [
        'warn',
        {
          array: false, // Don't force array destructuring
          object: true,
        },
      ],

      // Error prevention
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-private-class-members': 'error',
      'no-use-before-define': ['error', { functions: false, classes: true }],
      'array-callback-return': 'error',
      'consistent-return': 'warn', // Warn instead of error
      'default-case-last': 'error',
      'no-constructor-return': 'error',
      'no-implicit-coercion': 'warn',
      'no-promise-executor-return': 'off',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'require-atomic-updates': 'error',

      // Style and formatting (should align with Prettier)
      'comma-dangle': ['error', 'always-multiline'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'max-len': [
        'warn',
        {
          code: 120, // Increased from 100 to be more practical
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'eol-last': 'error',
      'no-trailing-spaces': 'error',
    },
  },

  // Configuration files - more relaxed rules
  {
    files: ['**/*.config.{js,mjs,cjs}', '**/vite.config.{js,mjs,cjs}'],
    rules: {
      'no-console': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-node-protocol': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.min.js',
      'coverage/**',
      '.husky/**',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
      '**/setupTests.js',
    ],
  },
];
