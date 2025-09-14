module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',           // Regras básicas do ESLint
    'plugin:vue/vue3-recommended', // Regras recomendadas para Vue 3
    'plugin:nuxt/recommended',     // Regras recomendadas para Nuxt
    'prettier',                     // Desativa regras conflitantes com Prettier
  ],
  plugins: ['vue', 'nuxt'],
  rules: {
    // Consoles e debuggers
    'no-console': 'warn',
    'no-debugger': 'warn',

    // Melhor prática em Vue
    'vue/no-unused-components': 'warn',
    'vue/multi-word-component-names': 'off', // desativa obrigatoriedade de nomes multiword

    // Código limpo e consistente
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],

    // Ajustes para Nuxt
    'nuxt/no-cjs-in-config': 'error',

    // Custom rules para preferências corporativas
    'max-len': ['warn', { code: 100, ignoreUrls: true }],
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'always-multiline'],
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      },
    },
    {
      files: ['*.ts', '*.js'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
};
