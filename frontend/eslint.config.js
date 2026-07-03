import nextPlugin from "eslint-config-next";

export default [
  {
    ignores: [".next", "node_modules", "dist"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "warn",
    },
  },
];
