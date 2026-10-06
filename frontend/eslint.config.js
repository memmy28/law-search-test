import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Deutschsprachiger Fließtext enthält laufend literale Anführungszeichen;
      // sie durch &quot; zu ersetzen bringt keinen echten Mehrwert.
      "react/no-unescaped-entities": "off",
      // useApi() setzt den Ladezustand bewusst synchron zurück, wenn sich die URL
      // ändert (sonst zeigt ein Seitenwechsel die alten Daten kurz als "aktuell" an).
      // Nur als Hinweis, kein Fehler.
      "react-hooks/set-state-in-effect": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
