import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Bewust gewone <a>-links: page-transitions werkt met echte paginaladingen, niet met
    // next/link (zie src/features/page-transitions/PageTransitions.tsx). De gevendorde
    // onderdelen in src/features zijn gemeten in de bibliotheek en worden hier niet herschreven.
    rules: { "@next/next/no-html-link-for-pages": "off", "@next/next/no-img-element": "off" },
  },
  { files: ["src/features/**", "src/_kwaliteit/**"], rules: { "@typescript-eslint/no-explicit-any": "off", "react-hooks/exhaustive-deps": "off", "react-hooks/refs": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // gevendorde, geminificeerde speler van lottie-icon
    "src/features/lottie-icon/vendor/**",
  ]),
]);

export default eslintConfig;
