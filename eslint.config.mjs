import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "cf-dist/**",
    "docs/**",
    "next-env.d.ts",
  ]),
  {
    files: ["app/AeroStudio.tsx"],
    rules: {
      // Fabric.js canvas objects are intentionally mutable. React state stores
      // the selected object identity while Fabric owns its mutable properties.
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
