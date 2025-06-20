import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // Ignore generated files
    ignores: [
      ".next/",
      "dist/",
      "build/",
      "node_modules/",
      "coverage/",
      "*.js",
      "*.mjs",
      "*.cjs",
      "app/generated/",
    ],
  },
  // Extend Next.js configs
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript"
  ),
  // --- TEMPORARY: Add a specific config to override rules you want to ignore ---
  {
    // This targets all TypeScript and JavaScript files
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      // TypeScript ESLint Rules to ignore
      "@typescript-eslint/no-unused-vars": "off", // Turns off unused variable errors
      "@typescript-eslint/no-explicit-any": "off", // Turns off 'any' errors
      "@typescript-eslint/no-empty-object-type": "off", // Turns off {} type errors
      "@typescript-eslint/no-unsafe-function-type": "off", // Turns off Function type errors
      "@typescript-eslint/no-empty-interface": "off", // Turns off empty interface errors
      "@typescript-eslint/no-wrapper-object-types": "off", // Turns off Object vs object errors
      "@typescript-eslint/no-require-imports": "off", // Turns off require() errors
      "@typescript-eslint/no-unused-expressions": "off", // Turns off unused expressions

      // React Hook Rules to ignore
      "react-hooks/rules-of-hooks": "off", // Turns off React Hooks rules

      // Next.js specific rules to ignore
      "@next/next/no-img-element": "off", // Turns off img tag warning/error

      // Other general ESLint rules you might see
      "no-unused-vars": "off", // Standard ESLint rule for unused vars (might be needed if TS one isn't enough)
      "no-this-alias": "off", // Turns off 'this' aliasing (though this comes from '@typescript-eslint' in your previous output)
    }
  }
];

export default eslintConfig; 