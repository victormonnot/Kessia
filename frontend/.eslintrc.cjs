module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "node_modules"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.3" } },
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "react/prop-types": "off",
    // The UI is entirely in French; raw apostrophes in JSX text are valid and
    // pervasive, so this rule is pure noise here.
    "react/no-unescaped-entities": "off",
  },
  overrides: [
    {
      // Vendored shadcn/ui primitives intentionally co-export variant helpers
      // (buttonVariants, badgeVariants…) next to their component.
      files: ["src/components/ui/**"],
      rules: { "react-refresh/only-export-components": "off" },
    },
  ],
};
