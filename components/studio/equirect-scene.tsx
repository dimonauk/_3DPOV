"use client";
/**
 * equirect-scene.tsx — R3F scene internals for EquirectViewer.
 * Scene, EquirectSphere, useEquirectTexture, ViewportHUD.
 */
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Keyframe, SourceAsset } from "lib/studio/types";

export function Scene({ source, activeKeyframe, onKeyframeChange }: {
  source: SourceAsset; activeKeyframe: Keyframe; onKeyframeChange: (kf: Keyframe) => void;
}) {
  const { camera, gl } = useThree();
  const yawRef   = useRef(activeKeyframe.yaw);
  const pitchRef = useRef(activeKeyframe.pitch);
  const fovRef   = useRef(activeKeyframe.fov);

  useEffect(() => {
    yawRef.current = activeKeyframe.yaw;
    pitchRef.current = activeKeyframe.pitch;
    fovRef.current = activeKeyframe.fov;
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = activeKeyframe.fov; camera.updateProjectionMatrix(); }
  }, [activeKeyframe, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    let dragging = false, lastX = 0, lastY = 0;
    const onPointerDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const sensitivity = (fovRef.current / 75) * 0.2;
      yawRef.current   -= (e.clientX - lastX) * sensitivity;
      pitchRef.current -= (e.clientY - lastY) * sensitivity;
      pitchRef.current  = Math.max(-89, Math.min(89, pitchRef.current));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
      onKeyframeChange({ ...activeKeyframe, yaw: yawRef.current, pitch: pitchRef.current, fov: fovRef.current });
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      fovRef.current = Math.max(20, Math.min(120, fovRef.current + (e.deltaY > 0 ? 2 : -2)));
      if (camera instanceof THREE.PerspectiveCamera) { camera.fov = fovRef.current; camera.updateProjectionMatrix(); }
      onKeyframeChange({ ...activeKeyframe, yaw: yawRef.current, pitch: pitchRef.current, fov: fovRef.current });
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [activeKeyframe, camera, gl, onKeyframeChange]);

  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const yr = THREE.MathUtils.degToRad(yawRef.current);
    const pr = THREE.MathUtils.degToRad(pitchRef.current);
    camera.lookAt(new THREE.Vector3(Math.cos(pr) * Math.sin(yr), Math.sin(pr), -Math.cos(pr) * Math.cos(yr)));
  });

  return <EquirectSphere source={source} />;
}

function EquirectSphere({ source }: { source: SourceAsset }) {
  const texture = useEquirectTexture(source);
  if (!texture) return null;
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

function useEquirectTexture(source: SourceAsset): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let mounted = true;
    let videoEl: HTMLVideoElement | null = null;
    if (source.kind === "equirect-image" || source.kind === "dual-fisheye-image") {
      new THREE.TextureLoader().load(source.objectUrl, (t) => {
        if (!mounted) return;
        t.colorSpace = THREE.SRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; setTex(t);
      });
    } else if (source.kind === "equirect-video" || source.kind === "dual-fisheye-video") {
      videoEl = document.createElement("video");
      videoEl.src = source.objectUrl; videoEl.crossOrigin = "anonymous";
      videoEl.muted = true; videoEl.loop = true; videoEl.playsInline = true;
      void videoEl.play();
      const t = new THREE.VideoTexture(videoEl);
      t.colorSpace = THREE.SRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; setTex(t);
    }
    return () => { mounted = false; if (videoEl) { videoEl.pause(); videoEl.src = ""; } };
  }, [source]);
  return tex;
}

export function ViewportHUD({ active }: { active: Keyframe }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-800 bg-warm-black-950/70 px-2 py-1 font-mono text-[10px] text-chrome-300 backdrop-blur">
      yaw {active.yaw.toFixed(1)}° · pitch {active.pitch.toFixed(1)}° · fov {active.fov.toFixed(0)}°
    </div>
  );
}
