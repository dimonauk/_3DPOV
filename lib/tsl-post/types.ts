/**
 * lib/tsl-post/types.ts — Shared contract for the TSL post-process pack.
 *
 * Every effect in `lib/tsl-post/effects/` exports a `TslPostEffect` value:
 * a `config` block plus an `attach` function that wires the effect into a
 * renderer and returns its own teardown. The shape is deliberately small
 * — we want one author-once, run-in-both-renderers story, not a deep
 * plug-in framework.
 *
 * Why the renderer/scene/camera are typed `unknown`:
 *   - three's `WebGLRenderer` and `WebGPURenderer` come from two
 *     different module surfaces (`three` vs `three/webgpu`) and the
 *     latter is not re-exported through the main `three` types in this
 *     repo. Typing as `unknown` lets each effect narrow with its own
 *     import without forcing every caller to thread two type paths.
 *   - `@react-three/fiber` happily passes its own renderer subtype in,
 *     which would otherwise need a structural cast at every call site.
 *
 * XR-safety policy — the most important field on the config:
 *   - `xrSafe: true` means the effect is safe to apply per-eye inside a
 *     WebXR session. Per-eye consistency is the test: bloom, foil-sheen
 *     and grain pass; vignette, DoF and chromatic-aberration fail.
 *   - `xrSafe: false` means the composer skips the effect when the
 *     scene is inside a WebXR session. The PostStackControls UI shows a
 *     small "2D ONLY" chip so the operator knows why a toggle has no
 *     visible result with a headset on.
 *
 * Cost band — `cheap | moderate | expensive`. Drives the UI tint in
 * the controls panel and the perf warning in docs/TSL-POST.md. Not a
 * hard runtime gate; the operator can still stack expensive effects.
 */

export type TslPostCost = "cheap" | "moderate" | "expensive";

export type TslPostEffectConfig = {
  /** Stable id used in `getPostEffect()` and persisted toggle state. */
  id: string;
  /** Display name in the controls panel. Title case, no emoji. */
  name: string;
  /** One-sentence description in workshop-Dimona voice. */
  description: string;
  /**
   * Safe to apply inside a WebXR session?
   *
   * `true` — author the effect uniformly across both eyes. Bloom, foil
   * sweep, grain, god rays at low intensity all qualify.
   *
   * `false` — would break stereo (vignette, DoF, chromatic-aberration)
   * or cause vection (heavy radial sweeps). Composer must skip the
   * effect when the scene is in an XR session.
   */
  xrSafe: boolean;
  /** Hint at GPU cost. Cheap = a few ALU ops. Expensive = a full blur chain. */
  cost: TslPostCost;
};

/**
 * The `attach` callback is the runtime side of an effect. It is given
 * the live renderer, scene and camera plus a free-form options bag and
 * is expected to register itself (compose into the TSL post chain,
 * push into a `postprocessing` EffectComposer, hook a frame loop, etc.)
 * and return a teardown that fully removes itself.
 *
 * The return is a plain teardown function — keep the surface small.
 * Effects that need to be driven per frame (e.g. the postprocessing
 * EffectComposer's `render()` call) attach a side-channel render hook
 * via `lib/tsl-post/composer.ts` internals and unhook in the teardown.
 * The brief mandates the simple shape, so we stay on it.
 *
 * Multiple `attach` calls must compose. The composer wires effects in
 * order and the teardowns run in reverse so partial state cleans up
 * predictably.
 */
export type TslPostAttachOptions = Record<string, unknown>;

export type TslPostAttach = (
  renderer: unknown,
  scene: unknown,
  camera: unknown,
  opts?: TslPostAttachOptions,
) => () => void;

export type TslPostEffectInstance = {
  config: TslPostEffectConfig;
  attach: TslPostAttach;
};

/**
 * Convenience — what the effect modules export. A const value typed
 * `TslPostEffect` documents the shape without requiring an explicit
 * annotation at every call site.
 */
export type TslPostEffect = TslPostEffectInstance;
