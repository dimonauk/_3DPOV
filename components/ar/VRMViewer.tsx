"use client";

/**
 * VRMViewer — VRM avatar renderer for AR cards with animation playback.
 *
 * Loads a VRM 1.0 humanoid avatar (Aura, a VTuber character, a client's
 * brand mascot) and animates it via a Three.js AnimationMixer driven by
 * .vrma files. 11 clips ship in /cards/animations/ — 1 idle loop + 10
 * one-shot emotes (Angry / Blush / Clapping / Goodbye / Jump /
 * LookAround / Relax / Sad / Sleepy / Thinking).
 *
 * Idle: idle_loop.vrma plays on a continuous LoopRepeat as soon as the
 * VRM mounts. Subtle breathing, weight shifts, eye tracking — all baked
 * into the .vrma, no procedural code.
 *
 * One-shots: playOneShot(name) crossfades into the emote, lets it
 * play once, then crossfades back to idle. Safe to interrupt — calling
 * twice in quick succession just transitions cleanly.
 *
 * Programmatic control: the viewer subscribes to two window events
 * other components can dispatch:
 *
 *   "aura:play-animation"  detail: { name: AnimationName }
 *   "aura:return-to-idle"  detail: none
 *
 * AuraCompanion fires these in response to tool results from the
 * per-card agent (e.g. play_animation tool) and from the in-panel
 * animation picker buttons.
 *
 * Picker UI: optional row of emoji buttons rendered below the canvas
 * when showPicker is true. Default ON for the Avatar tab; off for AR
 * scene mounts where the chrome would clutter the AR view.
 */

import { useEffect, useRef, useState } from "react";
import { createLogger, errToObject } from "lib/log";
import type { Card } from "lib/ar/types";
import {
  ALL_ANIMATIONS,
  ANIMATION_GLYPH,
  type AnimationName,
} from "lib/vrm/animationMap";

const log = createLogger("ar.VRMViewer");

type VRMViewerProps = {
  card: Card;
  vrmUrl: string;
  /** Show the inline animation picker row. Defaults true. */
  showPicker?: boolean;
};

/** Custom event names — referenced by AuraCompanion + picker UI. */
const PLAY_EVENT = "aura:play-animation";
const IDLE_EVENT = "aura:return-to-idle";

export default function VRMViewer({
  card,
  vrmUrl,
  showPicker = true,
}: VRMViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const controllerRef = useRef<{
    playOneShot: (name: AnimationName) => Promise<void>;
    returnToIdle: () => void;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // Progressive cleanup: each resource registers its own teardown
    // hook as it's created. If React unmounts mid-load (fast nav,
    // route change during VRM fetch), the cleanup callback below
    // runs every registered hook, releasing everything that exists
    // at the moment of cancellation. The previous shape only wired
    // a single disposeRef.current AFTER the full pipeline succeeded,
    // so renderer + scene + listeners allocated during load could
    // be orphaned on cancellation.
    const cleanupFns: Array<() => void> = [];
    const runCleanup = () => {
      while (cleanupFns.length > 0) {
        const fn = cleanupFns.pop();
        try {
          fn?.();
        } catch {
          // Best-effort teardown; never throw during cleanup.
        }
      }
    };
    disposeRef.current = runCleanup;

    (async () => {
      const [
        THREE,
        { GLTFLoader },
        { VRMLoaderPlugin, VRMUtils },
        { AnimationController },
      ] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("@pixiv/three-vrm"),
        import("lib/vrm/animationController"),
      ]);
      if (cancelled) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // --- Scene ---
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
      camera.position.set(0, 1.4, 1.2);
      camera.lookAt(0, 1.3, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      cleanupFns.push(() => {
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      });

      // Three-point lighting.
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(1.5, 2.5, 1.5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xb8d4f0, 0.4);
      fill.position.set(-1.2, 1.8, -0.6);
      scene.add(fill);

      // --- VRM ---
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let vrm: any = null;
      let controller: InstanceType<typeof AnimationController> | null = null;
      let mixer: import("three").AnimationMixer | null = null;
      try {
        const gltf = await loader.loadAsync(vrmUrl);
        if (cancelled) return;
        vrm = gltf.userData.vrm;
        if (!vrm) throw new Error("loaded file is not a VRM");

        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        // Face the camera.
        vrm.scene.rotation.y = Math.PI;
        scene.add(vrm.scene);
        cleanupFns.push(() => {
          if (vrm?.scene) {
            VRMUtils.deepDispose(vrm.scene);
            scene.remove(vrm.scene);
          }
        });

        // Animation mixer + controller.
        mixer = new THREE.AnimationMixer(vrm.scene);
        controller = new AnimationController(vrm, mixer);
        controllerRef.current = controller;
        cleanupFns.push(() => {
          // Defensive flush before controller.dispose() — bounds the
          // tab-switch-under-load class of leak by stopping every
          // action and releasing the cached clip→action binding for
          // the GLB root, even if the AnimationController's own
          // teardown ever drifts from stopping every action.
          try {
            mixer?.stopAllAction();
            if (mixer && vrm?.scene) {
              mixer.uncacheRoot(vrm.scene);
            }
          } catch {
            // Best-effort; never throw during cleanup.
          }
          controller?.dispose();
          controllerRef.current = null;
        });
        await controller.startIdle();
        if (cancelled) return;
        setReady(true);
      } catch (err) {
        log.error("failed to load avatar", { err: errToObject(err) });
      }

      // --- Window event subscribers ---
      const onPlay = (e: Event) => {
        const detail = (e as CustomEvent<{ name?: string }>).detail;
        const name = detail?.name as AnimationName | undefined;
        if (!controller || !name) return;
        if (!(ALL_ANIMATIONS as string[]).includes(name)) {
          log.warn("unknown animation", { name });
          return;
        }
        void controller.playOneShot(name);
      };
      const onIdle = () => {
        controller?.returnToIdle();
      };
      window.addEventListener(PLAY_EVENT, onPlay);
      window.addEventListener(IDLE_EVENT, onIdle);
      cleanupFns.push(() => {
        window.removeEventListener(PLAY_EVENT, onPlay);
        window.removeEventListener(IDLE_EVENT, onIdle);
      });

      // --- Render loop ---
      const clock = new THREE.Clock();
      let raf: number | null = null;
      const animate = () => {
        const dt = clock.getDelta();
        if (mixer) mixer.update(dt);
        if (vrm) vrm.update(dt);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();
      cleanupFns.push(() => {
        if (raf !== null) cancelAnimationFrame(raf);
      });

      // --- Resize ---
      const handleResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const resizeObs = new ResizeObserver(handleResize);
      resizeObs.observe(container);
      cleanupFns.push(() => resizeObs.disconnect());
    })();

    return () => {
      cancelled = true;
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
    };
  }, [vrmUrl]);

  const playLocal = (name: AnimationName) => {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { name } }));
  };

  return (
    <div className="vrm-root">
      <div
        ref={containerRef}
        className="vrm-canvas"
        style={{
          background: `linear-gradient(180deg, ${card.brand.primary}33, ${card.brand.secondary}11)`,
        }}
      />
      {showPicker && (
        <div className="vrm-picker">
          {ALL_ANIMATIONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => playLocal(name)}
              disabled={!ready}
              title={name}
              className="vrm-picker-btn"
              aria-label={`Play ${name} animation`}
            >
              <span className="vrm-picker-glyph">
                {ANIMATION_GLYPH[name]}
              </span>
              <span className="vrm-picker-label">{name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="vrm-caption">
        VRM avatar · {ready ? "10 emotes loaded · idle loop" : "loading…"}
      </div>
      <style jsx>{`
        .vrm-root {
          width: 100%;
          padding: 0 1rem;
        }
        .vrm-canvas {
          width: 100%;
          height: 70vh;
          min-height: 400px;
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
        }
        .vrm-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          justify-content: center;
          margin-top: 0.7rem;
        }
        .vrm-picker-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: rgba(255, 111, 181, 0.08);
          border: 1px solid rgba(255, 111, 181, 0.25);
          color: rgba(255, 255, 255, 0.9);
          font-family: inherit;
          font-size: 0.75rem;
          padding: 0.32rem 0.6rem;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .vrm-picker-btn:hover:not(:disabled) {
          background: rgba(255, 111, 181, 0.18);
          border-color: rgba(255, 111, 181, 0.6);
        }
        .vrm-picker-btn:disabled {
          opacity: 0.35;
          cursor: wait;
        }
        .vrm-picker-glyph {
          font-size: 1rem;
          line-height: 1;
        }
        .vrm-picker-label {
          font-weight: 500;
        }
        .vrm-caption {
          margin-top: 0.55rem;
          text-align: center;
          font-size: 0.78rem;
          opacity: 0.55;
          font-family: system-ui, -apple-system, sans-serif;
        }
        @media (max-width: 520px) {
          .vrm-picker-label {
            display: none;
          }
          .vrm-picker-btn {
            padding: 0.4rem 0.55rem;
          }
        }
      `}</style>
    </div>
  );
}
