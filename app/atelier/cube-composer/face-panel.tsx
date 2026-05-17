"use client";

/**
 * app/atelier/cube-composer/face-panel.tsx — A single panel of the
 * inside-out cube shell.
 *
 * Extracted from cube-composer-client.tsx. Each face mounts one of
 * these with its world-space position + rotation; uniforms live for
 * one (face, equirect) pair and update in place when the panorama or
 * highlight state changes (no material re-creation).
 */

import { useEffect, useMemo, useRef } from "react";
import { BackSide, type Mesh, type Texture, Vector3 } from "three";

import { FACE_VERT_SHADER, FACE_FRAG_SHADER } from "./shaders";
import { CUBE_RADIUS, FACE_BASIS, type CubeFace } from "./types";

export function FacePanel({
  face,
  position,
  rotation,
  color,
  opacity,
  equirect,
  isActive,
}: {
  face: CubeFace;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  equirect: Texture | null;
  isActive: boolean;
}) {
  const ref = useRef<Mesh>(null);

  // Build uniforms once per (face, equirect) pair. The shader is created
  // lazily so the colour-only path still works when no panorama has
  // landed yet.
  const uniforms = useMemo(() => {
    const basis = FACE_BASIS[face];
    return {
      uEquirect: { value: equirect },
      uRight: { value: new Vector3(...basis.right) },
      uUp: { value: new Vector3(...basis.up) },
      uForward: { value: new Vector3(...basis.forward) },
      uTint: { value: isActive ? 0.35 : 0.0 },
      uTintColor: { value: new Vector3(1, 1, 1) },
      uOpacity: { value: opacity },
    };
  }, [face, equirect, isActive, opacity]);

  // Keep uniforms live without re-mounting the material.
  useEffect(() => {
    uniforms.uEquirect.value = equirect;
    uniforms.uTint.value = isActive ? 0.35 : 0.0;
    uniforms.uOpacity.value = opacity;
  }, [uniforms, equirect, isActive, opacity]);

  return (
    <mesh ref={ref} position={position} rotation={rotation} name={face}>
      <planeGeometry args={[CUBE_RADIUS * 2, CUBE_RADIUS * 2]} />
      {equirect ? (
        <shaderMaterial
          vertexShader={FACE_VERT_SHADER}
          fragmentShader={FACE_FRAG_SHADER}
          uniforms={uniforms}
          transparent
          side={BackSide}
        />
      ) : (
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={BackSide}
        />
      )}
    </mesh>
  );
}
