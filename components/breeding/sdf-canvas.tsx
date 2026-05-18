"use client";

/**
 * components/breeding/sdf-canvas.tsx
 *
 * Vanilla Three.js fullscreen ray-march canvas. One renderer per mount, sized
 * by the `size` prop. Drives `uTime`, `uK`, `uParentA`, `uParentB`,
 * `uShowOnlyA`, `uShowOnlyB`. Used three times on the breeding-preview page:
 * two mini canvases (single-parent mode) and one large blend canvas.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  BREEDING_FRAGMENT_SHADER,
  BREEDING_VERTEX_SHADER,
  type KingdomId,
} from "lib/breeding/sdf-shaders";

type Props = {
  parentA: KingdomId;
  parentB: KingdomId;
  kSoftness: number;
  size: number;
  /** when set, only that parent renders (used for mini canvases). */
  showOnly?: "A" | "B";
  className?: string;
};

export default function SdfCanvas({
  parentA,
  parentB,
  kSoftness,
  size,
  showOnly,
  className,
}: Props) {
  const mountRef = useRef<HTMLCanvasElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rafRef = useRef<number | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // one-time setup
  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader: BREEDING_VERTEX_SHADER,
      fragmentShader: BREEDING_FRAGMENT_SHADER,
      uniforms: {
        uResolution: { value: new THREE.Vector2(size, size) },
        uTime: { value: 0 },
        uParentA: { value: parentA },
        uParentB: { value: parentB },
        uK: { value: kSoftness },
        uShowOnlyA: { value: showOnly === "A" ? 1 : 0 },
        uShowOnlyB: { value: showOnly === "B" ? 1 : 0 },
      },
    });
    materialRef.current = material;

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const u = material.uniforms.uTime;
      if (u) u.value = t;
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
      materialRef.current = null;
      rendererRef.current = null;
    };
    // size + showOnly only configured at mount; downstream prop changes
    // are pushed through the uniforms-update effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, showOnly]);

  // live uniform updates
  useEffect(() => {
    const m = materialRef.current;
    if (!m) return;
    const a = m.uniforms.uParentA;
    const b = m.uniforms.uParentB;
    const k = m.uniforms.uK;
    if (a) a.value = parentA;
    if (b) b.value = parentB;
    if (k) k.value = kSoftness;
  }, [parentA, parentB, kSoftness]);

  return (
    <canvas
      ref={mountRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
