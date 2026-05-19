/**
 * tests/visual/config.ts — The targets for the visual regression sweep.
 *
 * Each row here is one route × one viewport combo to be screenshotted
 * and diffed against a stored baseline. Add new surfaces by appending
 * a row. Keep labels filesystem-safe (lowercase, hyphen-separated).
 *
 * The waitForSelector / warmupMs fields are the difference between
 * a stable snapshot and a flaky one — see tests/visual/README.md for
 * the patterns. If you don't set them, you'll get whatever the page
 * looks like ~500ms after `domcontentloaded`, which is fine for the
 * server-rendered magazine surfaces but a black canvas for anything
 * that mounts a WebGPU/WebGL scene on the client.
 *
 * The maskSelectors field excludes regions from the diff — use it for
 * animated canvases (AmbientField, SceneStage, MeshText3D) where
 * frame-to-frame variance would otherwise blow past the 0.5% tolerance.
 */

export type VisualViewport = {
  width: number;
  height: number;
};

export type VisualTarget = {
  /** URL path relative to HOLOFLOW_BASE_URL — e.g. "/atelier/splat-walk". */
  route: string;
  /** Filesystem-safe identifier used in the snapshot filename. */
  label: string;
  /** Viewport for this run. Two rows per route gives desktop + mobile. */
  viewport: VisualViewport;
  /**
   * CSS selector to wait for before screenshotting. Avoids racing against
   * late-mounted client components like SceneStage. Selector is `await`ed
   * with a 10s timeout; if it never resolves the runner will still snap
   * (with a warning) so you can see what the page looked like.
   */
  waitForSelector?: string;
  /**
   * Extra delay (ms) AFTER waitForSelector resolves. Use this for
   * client-rendered 3D where the canvas is mounted but still black for
   * the first frame or two while the scene wires up. Keep this as small
   * as you can get away with — every ms here is multiplied by 2 viewports
   * × N targets.
   */
  warmupMs?: number;
  /**
   * Selectors whose regions are masked out (painted solid) before the
   * pixel diff runs. Use for any animated canvas / WebGL surface /
   * timestamp / random shimmer where run-to-run variance is expected.
   */
  maskSelectors?: string[];
};

// Standard desktop viewport — wide enough to show the magazine grids.
const DESKTOP: VisualViewport = { width: 1440, height: 900 };
// iPhone-ish mobile viewport.
const MOBILE: VisualViewport = { width: 375, height: 812 };

// Selectors we mask everywhere — the chrome that animates on every page.
const GLOBAL_ANIMATED_MASKS: string[] = [
  // AmbientField runs a persistent canvas in the background of several
  // magazine surfaces — never identical frame to frame.
  "[data-ambient-field]",
  // Generic catch for any canvas we wrap with our reserved attribute.
  "[data-visual-mask]",
  // The site-wide loading toast / clock pill in the corner, if present.
  "[data-clock-pill]",
];

// Routes that mount a heavy client scene (WebGPU/WebGL) — these need
// a real warmup window or you'll baseline a black frame.
const SCENE_WARMUP_MS = 1500;

// Generic post-DCL settle for pure-CSS magazine surfaces. Keeps the
// network-idle race from snapping a half-paint.
const STATIC_WARMUP_MS = 300;

/**
 * Make both viewport rows from a single declaration. Saves a lot of
 * repetition — and means the desktop/mobile labels stay in lockstep.
 */
function pair(
  route: string,
  baseLabel: string,
  opts: Omit<VisualTarget, "route" | "label" | "viewport"> = {},
): VisualTarget[] {
  return [
    { route, label: baseLabel, viewport: DESKTOP, ...opts },
    { route, label: baseLabel, viewport: MOBILE, ...opts },
  ];
}

export const VISUAL_TARGETS: VisualTarget[] = [
  // Front door + magazine surfaces. Mostly server-rendered chrome.
  ...pair("/", "home", {
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/articles", "articles", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/journal", "journal", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/tutorials", "tutorials", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/whoswho", "whoswho", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/news", "news", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/feed", "feed", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
  ...pair("/codex", "codex", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),

  // Atelier — these are the dangerous ones. Almost all mount a Three /
  // WebGPU canvas after first paint, so warmup + canvas mask are both
  // load-bearing. If you see flakes here, raise SCENE_WARMUP_MS first.
  ...pair("/atelier/material-library", "atelier-material-library", {
    waitForSelector: "canvas, main",
    warmupMs: SCENE_WARMUP_MS,
    maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas"],
  }),
  ...pair("/atelier/postprocess-lab", "atelier-postprocess-lab", {
    waitForSelector: "canvas, main",
    warmupMs: SCENE_WARMUP_MS,
    maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas"],
  }),
  ...pair("/atelier/scene-stage-demo", "atelier-scene-stage-demo", {
    waitForSelector: "canvas, main",
    warmupMs: SCENE_WARMUP_MS,
    maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas"],
  }),
  ...pair("/atelier/sculpture-gallery", "atelier-sculpture-gallery", {
    waitForSelector: "canvas, main",
    warmupMs: SCENE_WARMUP_MS,
    maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas"],
  }),
  ...pair("/atelier/splat-walk", "atelier-splat-walk", {
    waitForSelector: "canvas, main",
    warmupMs: SCENE_WARMUP_MS,
    maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas"],
  }),

  // Splat catalogue index — mostly a card grid (server-rendered) but
  // the per-card thumbnails come from blob storage and are stable.
  ...pair("/splats", "splats", {
    waitForSelector: "main",
    warmupMs: STATIC_WARMUP_MS,
    maskSelectors: GLOBAL_ANIMATED_MASKS,
  }),
];
