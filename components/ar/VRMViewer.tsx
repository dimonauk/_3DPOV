"use client";

/**
 * VRMViewer — VRM avatar renderer for AR cards.
 *
 * Loads a VRM 1.0 humanoid avatar (Aura, a VTuber character, a
 * client's brand mascot) and renders it with an idle animation:
 * subtle breathing, slow Y-axis sway, and head-tracking that
 * follows the camera.
 *
 * Why VRM:
 *   - The studio's Aura companion is already a VRM rig.
 *   - VRM is the standard format for VTuber-style characters.
 *   - The format includes both visuals and rigging (50+ humanoid
 *     bones), so the same file can drive both card AR and full
 *     VTuber pipelines (Aura's WebSocket sleeve, etc.).
 *
 * To enable on a card, set `card.ar.vrm = "/path/to/avatar.vrm"`.
 *
 * Three.js + @pixiv/three-vrm rather than React Three Fiber here
 * because the rest of the AR components are bare three.js — keeps
 * the bundle smaller and the lifecycle simpler.
 */

import { useEffect, useRef } from "react";
import type { Card } from "lib/ar/types";

type VRMViewerProps = { card: Card; vrmUrl: string };

export default function VRMViewer({ card, vrmUrl }: VRMViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const [
        THREE,
        { GLTFLoader },
        { VRMLoaderPlugin, VRMUtils, VRMHumanBoneName },
      ] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("@pixiv/three-vrm"),
      ]);
      if (cancelled) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // --- Scene setup ---
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
      camera.position.set(0, 1.4, 1.2);
      camera.lookAt(0, 1.3, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Lighting — soft three-point.
      const ambient = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(1.5, 2.5, 1.5);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xb8d4f0, 0.4);
      fill.position.set(-1.2, 1.8, -0.6);
      scene.add(fill);

      // --- VRM load ---
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      let vrm: any = null;
      try {
        const gltf = await loader.loadAsync(vrmUrl);
        if (cancelled) return;
        vrm = gltf.userData.vrm;
        if (!vrm) throw new Error("loaded file is not a VRM");

        // Performance: remove unused vertices, freeze morph targets in skin.
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        // Face the camera by default.
        vrm.scene.rotation.y = Math.PI;
        scene.add(vrm.scene);
      } catch (err) {
        console.error("VRMViewer: failed to load avatar", err);
        return;
      }

      // --- Idle animation ---
      const clock = new THREE.Clock();
      let raf = 0;

      const animate = () => {
        const t = clock.getElapsedTime();
        const dt = clock.getDelta();
        // Breathing: subtle Y-scale modulation on the chest.
        if (vrm?.humanoid) {
          const chest = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest);
          if (chest) {
            const breath = Math.sin(t * 1.2) * 0.015;
            chest.position.y = breath;
          }
          // Slow head turn — looks naturally toward the camera.
          const head = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
          if (head) {
            head.rotation.y = Math.sin(t * 0.4) * 0.12;
            head.rotation.x = Math.sin(t * 0.3) * 0.04;
          }
        }
        // Whole-body subtle sway.
        if (vrm?.scene) {
          vrm.scene.rotation.y = Math.PI + Math.sin(t * 0.35) * 0.08;
        }
        if (vrm) vrm.update(dt);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      // --- Resize handler ---
      const handleResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const resizeObs = new ResizeObserver(handleResize);
      resizeObs.observe(container);

      disposeRef.current = () => {
        cancelAnimationFrame(raf);
        resizeObs.disconnect();
        if (vrm?.scene) {
          VRMUtils.deepDispose(vrm.scene);
          scene.remove(vrm.scene);
        }
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cancelled = true;
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
    };
  }, [vrmUrl]);

  return (
    <div className="vrm-root">
      <div
        ref={containerRef}
        className="vrm-canvas"
        style={{
          background: `linear-gradient(180deg, ${card.brand.primary}33, ${card.brand.secondary}11)`,
        }}
      />
      <div className="vrm-caption">VRM avatar · breathing · head tracks viewer</div>
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
        .vrm-caption {
          margin-top: 0.5rem;
          text-align: center;
          font-size: 0.8rem;
          opacity: 0.6;
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>
    </div>
  );
}
