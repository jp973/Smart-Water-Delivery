module.exports = [
  {
    languageOptions: {
      parser: require("@typescript-eslint/parser"), // Specify the parser function
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module", // Use ECMAScript module
      },
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"), // Correctly load the plugin
    },
    rules: {
      "prefer-const": "warn",
      "no-constant-binary-expression": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
    ignores: ["lib/**/*", "**/*.js"],
  },

  {
    files: ["**/*.ts"],
    rules: {
      "prefer-const": "warn",
      "no-constant-binary-expression": "error",
    },
  },
];

