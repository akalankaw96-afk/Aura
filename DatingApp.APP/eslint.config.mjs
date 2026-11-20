// ESLint flat config (S01-T14): Next.js core-web-vitals + TypeScript rules.
// Run with `npm run lint`. CI runs it on every push (.github/workflows/ci.yml).
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Existing screens still carry some of these; they are cleaned up as each screen is touched (TD-02).
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Console output goes through lib/log.ts (dev only) — S05-T06, BUG-021.
      "no-console": "warn",
    },
  },
];

export default eslintConfig;
