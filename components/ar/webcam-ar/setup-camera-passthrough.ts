"use client";

/**
 * components/ar/webcam-ar/setup-camera-passthrough.ts — Builds the
 * Three.js scene that floats the card model in front of the device
 * camera + drives parallax/pinch/hand-lock interactions.
 *
 * Extracted from WebcamARScene.tsx per ARCHITECTURE.md Rule 1.
 * Builder-style: the host passes the container + video + card + a
 * hand-tracking ref (so flicks of state propagate into the live
 * render loop without re-creating the scene), and gets back a
 * disposer plus the renderer's canvas (which the recorder needs).
 *
 * Anchoring modes the loop handles internally:
 *  - Floating: model parented to a group 1.5m in front of the camera,
 *    DeviceOrientationEvent (when granted) drives camera rotation.
 *  - Hand-locked: MediaPipe HandLandmarker is lazy-loaded the first
 *    time handTrackingRef flips to true; thereafter every frame it
 *    runs detectForVideo() and re-positions the anchor at the palm
 *    centre. Disposed in the returned cleanup.
 */

import type { RefObject } from "react";

import type { Card } from "lib/ar/types";
import { createLogger, errToObject } from "lib/log";

import { HAND_MODEL_URL, LM_MIDDLE_MCP, LM_WRIST, MEDIAPIPE_WASM_URL } from "./types";

const log = createLogger("ar.WebcamARScene.cameraPassthrough");

export type CameraPassthroughOptions = {
  container: HTMLDivElement;
  video: HTMLVideoElement;
  card: Card;
  handTrackingRef: RefObject<boolean>;
  onError: (message: string) => void;
};

export type CameraPassthroughHandle = {
  disposer: () => void;
  sceneCanvas: HTMLCanvasElement;
};

export async function setupCameraPassthrough(
  opts: CameraPassthroughOptions,
): Promise<CameraPassthroughHandle> {
  const { container, video, card, handTrackingRef, onError } = opts;

  const [THREE, { GLTFLoader }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/loaders/GLTFLoader.js"),
  ]);

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);
  camera.position.set(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const sceneCanvas = renderer.domElement;

  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(2, 3, 2);
  scene.add(key);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(card.ar.model);
  const model = gltf.scene;

  // Normalise to ~20cm bounding-sphere radius — every card looks
  // the same physical size in the camera regardless of authored scale.
  const box = new THREE.Box3().setFromObject(model);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  if (sphere.radius > 0) {
    const targetRadius = 0.2;
    model.scale.multiplyScalar(targetRadius / sphere.radius);
  }

  const anchor = new THREE.Group();
  anchor.position.set(0, 0, -1.5);
  anchor.add(model);
  scene.add(anchor);

  // Hand-lock visual: soft glowing disc at the palm. Pulses while
  // active so the user knows the tracker is alive even if the hand
  // is held still.
  const footprintGeom = new THREE.RingGeometry(0.04, 0.18, 48).rotateX(-Math.PI / 2);
  const brandColor = (() => {
    try {
      return new THREE.Color(card.brand.primary);
    } catch {
      return new THREE.Color(0xffffff);
    }
  })();
  const footprintMat = new THREE.MeshBasicMaterial({
    color: brandColor,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const footprint = new THREE.Mesh(footprintGeom, footprintMat);
  footprint.position.y = -0.12;
  footprint.visible = false;
  anchor.add(footprint);

  const shouldRotate = card.ar.autoRotate !== false;

  // Device orientation → camera rotation (parallax fallback).
  let orientationActive = false;
  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    orientationActive = true;
    const deg = Math.PI / 180;
    camera.rotation.set(
      (e.beta - 90) * deg * 0.5,
      e.alpha * deg * 0.5,
      -e.gamma * deg * 0.5,
      "YXZ",
    );
  };

  const DOE = (
    window as {
      DeviceOrientationEvent?: typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
    }
  ).DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    try {
      const perm = await DOE.requestPermission();
      if (perm === "granted") {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    } catch {
      // Skip parallax.
    }
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", handleOrientation);
  }

  // Pinch / wheel / tap handlers.
  let lastPinchDist: number | null = null;
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    if (!t0 || !t1) return;
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    const dist = Math.hypot(dx, dy);
    if (lastPinchDist != null) {
      const factor = dist / lastPinchDist;
      anchor.position.z = Math.max(
        -5,
        Math.min(-0.3, anchor.position.z / factor),
      );
    }
    lastPinchDist = dist;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) lastPinchDist = null;
  };
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    anchor.position.z = Math.max(
      -5,
      Math.min(-0.3, anchor.position.z * factor),
    );
  };
  const handleTap = () => {
    // Reset to default float when hand-tracking is off.
    if (!handTrackingRef.current) anchor.position.set(0, 0, -1.5);
  };
  container.addEventListener("touchmove", handleTouchMove, { passive: true });
  container.addEventListener("touchend", handleTouchEnd, { passive: true });
  container.addEventListener("wheel", handleWheel, { passive: false });
  container.addEventListener("click", handleTap);

  // Hand landmarker — lazy-loaded only if/when the user toggles
  // hand tracking. ~10MB WASM + ~5MB model on first activation.
  type HandLandmarkerHandle = {
    landmarker: import("@mediapipe/tasks-vision").HandLandmarker;
    dispose: () => void;
  };
  let handHandle: HandLandmarkerHandle | null = null;
  let handLoading = false;

  const ensureHandLandmarker = async () => {
    if (handHandle || handLoading) return;
    handLoading = true;
    try {
      const { HandLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: "GPU" },
        numHands: 1,
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
      });
      handHandle = {
        landmarker,
        dispose: () => {
          try {
            landmarker.close();
          } catch {
            // ignore
          }
        },
      };
    } catch (err) {
      log.error("HandLandmarker init failed", { err: errToObject(err) });
      onError("Hand tracking failed to initialise");
    } finally {
      handLoading = false;
    }
  };

  // Smoothing for hand anchor — raw MediaPipe landmarks jitter.
  // 1-euro-style low-pass via exponential smoothing.
  const handSmoothed = new THREE.Vector3(0, 0, -1.5);
  const SMOOTH_ALPHA = 0.35;

  const updateAnchorToHand = () => {
    if (!handHandle || !video || video.readyState < 2) return false;
    const result = handHandle.landmarker.detectForVideo(video, performance.now());
    const hand = result.landmarks?.[0];
    if (!hand) return false;
    const wrist = hand[LM_WRIST];
    const mcp = hand[LM_MIDDLE_MCP];
    if (!wrist || !mcp) return false;

    // Palm centre in normalised image coords (0-1 each).
    const px = (wrist.x + mcp.x) * 0.5;
    const py = (wrist.y + mcp.y) * 0.5;

    // MediaPipe x is left-right in image space (0=left). Rear cam
    // maps directly; selfie streams that get CSS-flipped should
    // also mirror this — we assume rear cam here.
    const ndcX = (px - 0.5) * 2;
    const ndcY = -(py - 0.5) * 2; // flip Y (image down → world up)
    const depth = -0.6; // ~60cm in front of camera

    const tan = Math.tan((camera.fov * Math.PI) / 180 / 2);
    const aspect = camera.aspect;
    const worldX = ndcX * tan * aspect * Math.abs(depth);
    const worldY = ndcY * tan * Math.abs(depth);

    handSmoothed.lerp(new THREE.Vector3(worldX, worldY, depth), SMOOTH_ALPHA);
    anchor.position.copy(handSmoothed);
    return true;
  };

  const clock = new THREE.Clock();
  let raf = 0;
  const animate = () => {
    const t = clock.getElapsedTime();

    if (handTrackingRef.current) {
      // Lazy-load on first frame after toggle.
      if (!handHandle) {
        void ensureHandLandmarker();
        footprint.visible = false;
      } else {
        const handFound = updateAnchorToHand();
        footprint.visible = handFound;
        if (handFound) {
          const pulse = 1 + Math.sin(t * 3) * 0.08;
          footprint.scale.setScalar(pulse);
          footprintMat.opacity = 0.22 + Math.sin(t * 3) * 0.08;
        }
      }
    } else {
      footprint.visible = false;
      handSmoothed.set(0, 0, -1.5);
    }

    if (shouldRotate) {
      model.rotation.y = t * 0.3;
    }
    if (!orientationActive && !handTrackingRef.current) {
      camera.position.x = Math.sin(t * 0.2) * 0.08;
      camera.lookAt(anchor.position);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  };
  animate();

  const handleResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const resizeObs = new ResizeObserver(handleResize);
  resizeObs.observe(container);

  const disposer = () => {
    cancelAnimationFrame(raf);
    resizeObs.disconnect();
    window.removeEventListener("deviceorientation", handleOrientation);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
    container.removeEventListener("wheel", handleWheel);
    container.removeEventListener("click", handleTap);
    if (handHandle) handHandle.dispose();
    footprintGeom.dispose();
    footprintMat.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
    model.traverse((obj) => {
      const m = obj as unknown as {
        isMesh?: boolean;
        geometry?: { dispose?: () => void };
        material?: { dispose?: () => void } | Array<{ dispose?: () => void }>;
      };
      if (m.isMesh) {
        m.geometry?.dispose?.();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose?.());
        else mat?.dispose?.();
      }
    });
  };

  return { disposer, sceneCanvas };
}
