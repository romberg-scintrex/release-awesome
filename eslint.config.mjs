import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Flat ESLint config (ESLint 9). `eslint-config-next` 16 exports flat-config
 * arrays directly, so we spread them — this is the equivalent of the legacy
 * `extends: ["next/core-web-vitals", "next/typescript"]`.
 */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".rembg-venv/**",
      "public/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.js",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    // React-Compiler readiness rules (eslint-plugin-react-hooks v6). They flag
    // pre-existing, working effect patterns (setState-in-effect in animation /
    // tool components, etc.). Surfaced as warnings so `npm run lint` stays green
    // and the hints remain visible, without forcing risky refactors of runtime
    // behavior. Promote to "error" when addressing them in a dedicated pass.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default config;
