"use client";

/**
 * MindAR image-tracked AR scene.
 *
 * When the device camera detects the printed card, the GLB model materialises
 * anchored to the card surface. Move the phone — the model tracks with the
 * card in 3D space.
 *
 * Must be loaded with `dynamic(() => import(...), { ssr: false })` from a
 * parent component. Requires:
 *   - HTTPS (camera permission only works in secure context)
 *   - User gesture to start (the Start button below handles this)
 *   - Mobile camera (front- or rear-facing — rear preferred)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Card } from "lib/ar/types";

type Status = "idle" | "loading" | "ready" | "running" | "scanning" | "tracked" | "error";

export default function MindARScene({ card }: { card: Card }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (!containerRef.current) return;
    setStatus("loading");
    setError(null);

    try {
      // Dynamic import — MindAR's bundle is ~370KB, no point loading until user taps Start
      const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js");

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: card.ar.targetMind,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
        maxTrack: 1,
      });

      const { renderer, scene, camera } = mindarThree;
      const anchor = mindarThree.addAnchor(0);

      // Lights — softer ambient + a key directional that picks out the model.
      const ambient = new THREE.AmbientLight(
        0xffffff,
        card.ar.lighting?.ambientIntensity ?? 1.0,
      );
      const directional = new THREE.DirectionalLight(
        0xffffff,
        card.ar.lighting?.directionalIntensity ?? 1.5,
      );
      const angleRad = ((card.ar.lighting?.directionalAngle ?? 30) * Math.PI) / 180;
      directional.position.set(Math.sin(angleRad), Math.cos(angleRad), 0.5);
      scene.add(ambient, directional);

      // Load the GLB and mount on the anchor.
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(card.ar.model);
      const model = gltf.scene;
      model.scale.setScalar(card.ar.modelScale);
      const [px, py, pz] = card.ar.modelPosition;
      const [rx, ry, rz] = card.ar.modelRotation;
      model.position.set(px, py, pz);
      model.rotation.set(rx, ry, rz);
      anchor.group.add(model);

      // Track found/lost callbacks so we can update the on-screen hint.
      anchor.onTargetFound = () => setStatus("tracked");
      anchor.onTargetLost = () => setStatus("scanning");

      await mindarThree.start();
      setStatus("scanning");

      // Auto-rotate (cosmetic — useful for placeholder geometry, can disable per-card)
      let rafId = 0;
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        if (card.ar.autoRotate) {
          const dt = clock.getDelta();
          model.rotation.y += dt * 0.6;
        }
        renderer.render(scene, camera);
      });

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        renderer.setAnimationLoop(null);
        mindarThree.stop();
        mindarThree.renderer.dispose();
        // MindAR injects a <video> into the container — explicit cleanup
        const video = containerRef.current?.querySelector("video");
        if (video) {
          const stream = (video.srcObject as MediaStream | null);
          stream?.getTracks().forEach((t) => t.stop());
        }
      };
    } catch (err: any) {
      setStatus("error");
      // Distinguish camera-permission denial from genuine errors.
      if (err?.name === "NotAllowedError" || /permission/i.test(err?.message ?? "")) {
        setError("Camera permission was blocked. Tap the camera icon in your address bar to allow it, then reload.");
      } else if (err?.name === "NotFoundError" || /no.*camera|device/i.test(err?.message ?? "")) {
        setError("No camera found on this device. AR card mode needs a phone or tablet with a rear camera.");
      } else {
        setError(err?.message ?? "Unknown error initialising AR. Try reloading.");
      }
      console.error("MindAR error:", err);
    }
  }, [card]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="ar-scene-root">
      {/* MindAR injects camera <video> and Three <canvas> as children */}
      <div ref={containerRef} className="ar-scene-stage" />

      {status === "idle" && (
        <div className="ar-overlay">
          <h2 className="ar-overlay-title">{card.name}</h2>
          <p className="ar-overlay-body">{card.ar.description}</p>
          <button onClick={start} className="ar-btn-primary">
            Start AR — point your camera at the card
          </button>
          <p className="ar-overlay-hint">Camera permission required. No recording, nothing leaves your device.</p>
        </div>
      )}

      {status === "loading" && (
        <div className="ar-overlay">
          <p>Loading AR engine…</p>
        </div>
      )}

      {status === "scanning" && (
        <div className="ar-hint-bottom">
          Point at the printed card
        </div>
      )}

      {status === "tracked" && (
        <div className="ar-hint-bottom ar-hint-tracked">
          Tracking — move around to see all sides
        </div>
      )}

      {status === "error" && (
        <div className="ar-overlay">
          <h3>Couldn&apos;t start AR</h3>
          <p>{error}</p>
          <button onClick={start} className="ar-btn-secondary">Try again</button>
        </div>
      )}

      <style jsx>{`
        .ar-scene-root {
          position: fixed; inset: 0;
          background: #000;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ar-scene-stage {
          position: absolute; inset: 0;
        }
        .ar-scene-stage :global(video),
        .ar-scene-stage :global(canvas) {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .ar-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; padding: 2rem; text-align: center;
          background: linear-gradient(135deg, ${card.brand.primary}, ${card.brand.secondary});
        }
        .ar-overlay-title { font-size: 2rem; font-weight: 700; margin: 0; }
        .ar-overlay-body { max-width: 30ch; opacity: 0.92; line-height: 1.45; }
        .ar-overlay-hint { font-size: 0.8rem; opacity: 0.7; max-width: 32ch; }
        .ar-btn-primary {
          background: white; color: ${card.brand.primary};
          padding: 0.9rem 1.6rem; border: none; border-radius: 999px;
          font-weight: 700; cursor: pointer; font-size: 1rem;
        }
        .ar-btn-primary:active { transform: scale(0.97); }
        .ar-btn-secondary {
          background: transparent; color: white; border: 1px solid white;
          padding: 0.7rem 1.4rem; border-radius: 999px; cursor: pointer;
        }
        .ar-hint-bottom {
          position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          padding: 0.6rem 1.2rem; border-radius: 999px;
          font-size: 0.9rem; pointer-events: none;
        }
        .ar-hint-tracked {
          background: ${card.brand.primary}cc;
        }
      `}</style>
    </div>
  );
}
