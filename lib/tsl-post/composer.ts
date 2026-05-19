/**
 * lib/tsl-post/composer.ts — One composer per renderer, two backends.
 *
 * Two parallel composers exist per attachStack call:
 *
 *   - A WebGPU `PostProcessing` instance, used when the renderer is a
 *     `WebGPURenderer`. Effects compose into its `outputNode` graph.
 *   - A WebGL `EffectComposer` (from `postprocessing`), used when the
 *     renderer is a plain `WebGLRenderer`. Effects push EffectPass
 *     instances into it in order.
 *
 * Effects can't reach the shared composer through their `attach`
 * signature (which the brief fixes at `(renderer, scene, camera, opts)
 * → teardown`). They reach it through a side-channel registry keyed by
 * the renderer object identity. `attachStack` sets up the registry
 * entry, calls each effect's `attach` in order, then exposes a
 * `render(dt)` on its handle that drives whichever composer landed.
 *
 * Effects flagged `xrSafe: false` are filtered out when the caller
 * passes `xrActive: true`. The composer itself runs identically; only
 * the membership of the stack changes per session state.
 *
 * Visibility-aware: the handle's `render` is a no-op while
 * `document.hidden`. Inside a WebXR session the runtime owns the loop
 * and the visibility hook is a no-op (the XR runtime stops calling
 * back to us when the headset is off the head).
 */

import * as THREE_WEBGPU from "three/webgpu";
import { pass as tslPass } from "three/tsl";
import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { getPostEffect } from "./index";

const log = createLogger("tsl-post:composer");

export type ComposerHandle = {
  /** Tear every attached effect down, in reverse order. */
  dispose: () => void;
  /** Drive the underlying composer. Call from useFrame. */
  render: (dt: number) => void;
  /** Pause the composer when the page becomes hidden. */
  pause: () => void;
  /** Resume after a pause. */
  resume: () => void;
  /** True when at least one effect was registered. */
  readonly hasEffects: boolean;
};

export type AttachStackInput = {
  stack: ReadonlyArray<{ id: string; opts?: Record<string, unknown> }>;
  renderer: unknown;
  scene: unknown;
  camera: unknown;
  /**
   * When true, effects with `xrSafe: false` are skipped. Pass the
   * current SceneStage mode through this — `mode !== "2d"` is the
   * usual binding.
   */
  xrActive?: boolean;
};

/**
 * Per-renderer slot the effect modules read during their `attach`.
 * The slot holds whichever composer matched the renderer's backend
 * plus the accumulated TSL node graph for the WebGPU path. Effects
 * never construct their own composer — they push into this one.
 */
export type ComposerSlot = {
  /** Live for the duration of the attachStack call. */
  renderer: unknown;
  scene: unknown;
  camera: unknown;
  /** WebGPU path: the shared PostProcessing instance and its node. */
  webgpu?: {
    post: unknown;
    /** The current composed TSL output node. Effects rewrap this. */
    node: unknown;
    /** Reapply the node onto `post.outputNode`. */
    commit: () => void;
  };
  /** WebGL path: the shared `postprocessing` EffectComposer. */
  webgl?: {
    composer: { render: (dt: number) => void; dispose: () => void };
    addEffect: (effect: unknown) => void;
  };
};

const slots = new WeakMap<object, ComposerSlot>();

/**
 * Effects read this from their `attach` to find the shared composer.
 * Returns null when no stack is currently attaching, in which case the
 * effect should fall back to its own isolated composer (used by ad-hoc
 * callers that bypass attachStack).
 */
export function __getActiveSlot(renderer: unknown): ComposerSlot | null {
  if (!renderer || typeof renderer !== "object") return null;
  return slots.get(renderer as object) ?? null;
}

/**
 * Attach a stack of effects to a renderer in order. Returns a handle
 * the consumer drives per-frame from `useFrame`. The handle's
 * `dispose` runs teardowns in reverse and unhooks the visibility
 * listener. Idempotent — calling dispose twice is safe.
 */
export function attachStack(input: AttachStackInput): ComposerHandle {
  if (!input.renderer || typeof input.renderer !== "object") {
    log.warn("attachStack got non-object renderer");
    return idleHandle();
  }

  const rendererKey = input.renderer as object;
  const slot: ComposerSlot = {
    renderer: input.renderer,
    scene: input.scene,
    camera: input.camera,
  };

  // Build the WebGPU composer when the renderer is a WebGPURenderer.
  if (isWebGPURenderer(input.renderer)) {
    setupWebGpuSlot(slot);
  }
  // Build the WebGL composer when the renderer is a WebGLRenderer.
  if (!slot.webgpu) {
    setupWebGlSlot(slot);
  }

  slots.set(rendererKey, slot);

  const teardowns: Array<() => void> = [];

  for (const entry of input.stack) {
    const effect = getPostEffect(entry.id);
    if (!effect) {
      log.warn("unknown effect", { id: entry.id });
      continue;
    }
    if (!effect.config.xrSafe && input.xrActive) {
      log.debug("skipping non-XR-safe effect", { id: entry.id });
      continue;
    }
    try {
      const teardown = effect.attach(
        input.renderer,
        input.scene,
        input.camera,
        entry.opts,
      );
      teardowns.push(teardown);
    } catch (err) {
      log.warn("effect attach threw", {
        id: entry.id,
        err: errToObject(err),
      });
    }
  }

  // Commit the WebGPU node once after every effect has rewrapped it.
  slot.webgpu?.commit();

  let visibilityHandler: (() => void) | null = null;
  let paused = false;
  let disposed = false;

  const pause = () => {
    if (paused || disposed) return;
    paused = true;
  };
  const resume = () => {
    if (!paused || disposed) return;
    paused = false;
  };

  if (typeof document !== "undefined") {
    visibilityHandler = () => {
      if (document.hidden) pause();
      else resume();
    };
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  return {
    get hasEffects() {
      return teardowns.length > 0;
    },
    pause,
    resume,
    render: (dt: number) => {
      if (paused || disposed) return;
      try {
        if (slot.webgpu) {
          (slot.webgpu.post as { render?: () => void }).render?.();
          return;
        }
        if (slot.webgl) {
          slot.webgl.composer.render(dt);
        }
      } catch (err) {
        log.warn("composer render threw", { err: errToObject(err) });
      }
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (visibilityHandler && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
      for (let i = teardowns.length - 1; i >= 0; i--) {
        try {
          teardowns[i]?.();
        } catch (err) {
          log.warn("effect teardown threw", { err: errToObject(err) });
        }
      }
      teardowns.length = 0;
      try {
        slot.webgl?.composer.dispose();
        (slot.webgpu?.post as { dispose?: () => void } | undefined)?.dispose?.();
      } catch (err) {
        log.warn("composer dispose threw", { err: errToObject(err) });
      }
      slots.delete(rendererKey);
    },
  };
}

function setupWebGpuSlot(slot: ComposerSlot): void {
  try {
    const renderer = slot.renderer as InstanceType<typeof THREE_WEBGPU.WebGPURenderer>;
    const scene = slot.scene as InstanceType<typeof THREE_WEBGPU.Scene>;
    const camera = slot.camera as InstanceType<typeof THREE_WEBGPU.Camera>;

    const post = new THREE_WEBGPU.PostProcessing(renderer);
    const passNode = tslPass(scene, camera);
    const baseNode = passNode.getTextureNode("output");

    slot.webgpu = {
      post,
      node: baseNode,
      commit: () => {
        (post as unknown as { outputNode: unknown }).outputNode = slot.webgpu!.node;
      },
    };
  } catch (err) {
    log.debug("webgpu slot setup failed", { err: errToObject(err) });
  }
}

function setupWebGlSlot(slot: ComposerSlot): void {
  try {
    const renderer = slot.renderer as import("three").WebGLRenderer;
    const scene = slot.scene as import("three").Scene;
    const camera = slot.camera as import("three").Camera;

    const composer = new PP.EffectComposer(renderer);
    composer.addPass(new PP.RenderPass(scene, camera));

    slot.webgl = {
      composer,
      addEffect: (effect: unknown) => {
        composer.addPass(new PP.EffectPass(camera, effect as InstanceType<typeof PP.Effect>));
      },
    };
  } catch (err) {
    log.debug("webgl slot setup failed", { err: errToObject(err) });
  }
}

function idleHandle(): ComposerHandle {
  return {
    get hasEffects() {
      return false;
    },
    pause: () => undefined,
    resume: () => undefined,
    render: () => undefined,
    dispose: () => undefined,
  };
}

/**
 * Cheap renderer-shape probe. WebGPURenderer has both `backend` and
 * `init`. WebGLRenderer has neither. Shared by every effect.
 */
export function isWebGPURenderer(renderer: unknown): boolean {
  if (!renderer || typeof renderer !== "object") return false;
  const r = renderer as Record<string, unknown>;
  return "backend" in r && typeof r.init === "function";
}
