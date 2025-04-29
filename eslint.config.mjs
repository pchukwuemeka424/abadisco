import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow underscore-prefixed variables and parameters to be unused
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_", // Ignore unused arguments starting with "_"
          varsIgnorePattern: "^_", // Ignore unused variables starting with "_"
        },
      ],
      // Disable the explicit-any rule to prevent build errors
      "@typescript-eslint/no-explicit-any": "off",
      
      // Disable the unescaped entities rule
      "react/no-unescaped-entities": "off",
      
      // Make React hooks exhaustive deps a warning instead of error
      "react-hooks/exhaustive-deps": "warn",
      
      // Make img element usage a warning instead of error
      "@next/next/no-img-element": "warn",
      
      // Make HTML links for pages a warning instead of error
      "@next/next/no-html-link-for-pages": "warn"
    },
  },
];

export default eslintConfig;
