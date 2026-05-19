/**
 * lib/splat-walker/spark-loader.ts — Singleton dynamic import of
 * Spark.js (`@sparkjsdev/spark`) via esm.sh.
 *
 * Why a singleton: Spark's package bundle uses a webpack asset-module
 * `generator: { filename }` config that Next 15.6 canary's webpack
 * rejects at build time. The trick (lifted from
 * `components/splats/SplatViewer.tsx`) is to load Spark at runtime
 * through esm.sh with a `webpackIgnore` directive — webpack never
 * parses the package and the browser's native ESM loader fetches it
 * on demand. The runtime import expression is built via `Function`
 * so TypeScript also leaves the remote URL alone.
 *
 * Caching the promise saves a round-trip when the splat walker scene
 * mounts/unmounts (route changes, file swaps). The same Spark module
 * graph is reused across every SplatWalkScene instance on the page.
 *
 * Pinned to Spark 0.1.10 — the same version `SplatViewer` already
 * runs in production. Bumping it should happen in lockstep with
 * `SplatViewer` so both surfaces stay on the same module graph.
 */

const SPARK_VERSION = "0.1.10";
const SPARK_ESM_URL = `https://esm.sh/@sparkjsdev/spark@${SPARK_VERSION}`;

export type SparkModule = Record<string, unknown>;

let sparkPromise: Promise<SparkModule> | null = null;

/**
 * Resolve the Spark.js module exports. Memoised across the page —
 * the same promise is returned to every caller.
 */
export function loadSpark(): Promise<SparkModule> {
  if (sparkPromise) return sparkPromise;
  // Build the import via `Function` so TS / webpack don't try to
  // resolve the esm.sh URL statically. The `webpackIgnore` magic
  // comment tells webpack to leave the call alone if it ever does
  // see it.
  sparkPromise = (
    Function(
      `return import(/* webpackIgnore: true */ "${SPARK_ESM_URL}")`,
    )() as Promise<SparkModule>
  ).catch((err: unknown) => {
    sparkPromise = null;
    throw err instanceof Error
      ? err
      : new Error(`Spark.js load failed: ${String(err)}`);
  });
  return sparkPromise;
}

/**
 * Defensive constructor pick — Spark's named exports moved between
 * 0.x versions. Returns the first non-null candidate among the
 * common spellings, or null if none are present.
 */
export function pickSparkExport<T = unknown>(
  spark: SparkModule,
  ...names: string[]
): T | null {
  for (const name of names) {
    const value = spark[name];
    if (value != null) return value as T;
  }
  return null;
}
