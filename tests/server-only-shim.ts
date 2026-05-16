/**
 * tests/server-only-shim.ts — Vitest stub for Next.js's `server-only` package.
 *
 * The real `server-only` package's entry file throws at module-load
 * time unless Next.js has configured a webpack alias that turns it
 * into a noop in server bundles. Vitest doesn't run that alias, so
 * any `.server.ts` file we import in a unit test crashes on the
 * `import "server-only"` line. This shim is the noop.
 *
 * Production code is unaffected — Next's build still resolves the
 * real `server-only` package and applies the boundary check. This
 * alias is only active inside vitest, configured in vitest.config.ts.
 */

export {};
