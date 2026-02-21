module.exports = [
  {
    ignores: ["node_modules", ".next", "dist", "out", "**/*.ts", "**/*.tsx"]
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  }
];
