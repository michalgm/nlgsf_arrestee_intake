import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { "@stylistic": stylistic, js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "@stylistic/indent": ["error", 2],
      "no-unused-vars": ["error", {
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }]
    },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);
