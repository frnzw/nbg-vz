// eslint.config.js
import js from "@eslint/js";
import eslintPluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";
import vueEslintParser from "vue-eslint-parser";
import globals from "globals"; // Explicitly installed package to define global environment variables

export default [
  // 0. Environment Setup (Browser Globals)
  // Defines global variables like 'document', 'console', and 'fetch' for all relevant files.
  {
    files: ["**/*.{js,vue,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser, // Merges all standard browser globals from the 'globals' package.
      },
    },
  },

  // 1. Base: Recommended ESLint rules
  // Applies standard code quality checks globally.
  js.configs.recommended,

  // ---

  // 2. Vue-specific configuration for .vue and .js files
  {
    files: ["**/*.{js,vue}"],
    plugins: {
      vue: eslintPluginVue,
    },
    languageOptions: {
      parser: vueEslintParser, // Use the dedicated parser for Vue files
      // Globals needed for Vue 3's Composition API features (e.g., defineProps)
      globals: {
        "vue/setup-compiler-macros": true,
      },
      ecmaVersion: 2021, // Use ES2021 syntax
      sourceType: "module",
    },

    // Extends from the highly recommended Vue 3 rule set
    ...eslintPluginVue.configs["vue3-recommended"],

    // Custom rules and overrides (Vuetify compatibility)
    rules: {
      // Off: Allows single-word component names (common for Vuetify components)
      "vue/multi-word-component-names": "off",
      // Off: Allows component names that may conflict with native HTML tags
      "vue/no-reserved-component-names": "off",
    },
  },

  // ---

  // 3. Prettier Integration (Disables conflicting rules)
  // Must be the last entry to ensure it successfully turns off all conflicting ESLint rules.
  // Actual formatting is handled by the VSCodium Prettier extension.
  eslintConfigPrettier,
];
