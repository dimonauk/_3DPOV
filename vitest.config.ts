/**
 * vitest.config.ts — Test runner config for Holoflow.
 *
 * Two environments via inline `// @vitest-environment` directives in
 * each test:
 *   - `node` (default) for pure functions, server-side capability
 *     code, route handlers
 *   - `happy-dom` for React components, hooks, anything that needs a
 *     DOM. Lighter than jsdom; starts faster.
 *
 * Aliases mirror tsconfig.json baseUrl so test files can import from
 * "lib/foo" and "components/foo" the same way runtime code does.
 *
 * E2E tests (Playwright route sweep) live in tests/e2e/ and are run
 * via `pnpm test:e2e`, NOT via vitest.
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Note: @vitejs/plugin-react is deliberately NOT loaded here. The v6
// release pins vite ^8, but Vitest 4 still bundles vite 7 internally
// and the peer-mismatch crashes config load. None of the seeded tests
// render React yet (they're all pure-function tests). When component
// tests land, pin the plugin to a vite-7-compatible major (e.g.
// @vitejs/plugin-react@4) and re-enable here.

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      lib: path.resolve(root, "lib"),
      components: path.resolve(root, "components"),
      app: path.resolve(root, "app"),
      // server-only is a Next.js build-time marker that throws when
      // imported outside a server context. Vitest doesn't run inside
      // Next so the throw fires unconditionally; alias to an empty
      // shim so .server.ts files can be unit-tested in the node env.
      "server-only": path.resolve(root, "tests/server-only-shim.ts"),
    },
  },
  test: {
    // Default to node; tests that need a DOM declare
    //   // @vitest-environment happy-dom
    // at the top of the file.
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Vitest discovers ./**/*.{test,spec}.{ts,tsx} by default. We
    // narrow to keep node_modules + .next + build artefacts out.
    include: ["lib/**/*.{test,spec}.{ts,tsx}", "components/**/*.{test,spec}.{ts,tsx}", "app/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**", "**/dist/**"],
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI ? { junit: "./tests/junit.xml" } : undefined,
  },
});
