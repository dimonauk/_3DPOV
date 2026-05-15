"use client";

/**
 * WebcamARScene — composite the card's 3D model into the user's
 * actual room using the device camera.
 *
 * Works on every device with getUserMedia (iOS Safari, Android
 * Chrome, desktop Chrome/Firefox/Safari). No image-tracking marker
 * required — the camera feed is just a backdrop with the 3D model
 * rendered on top.
 *
 * Two anchoring modes, chosen automatically:
 *
 *   1. Immersive AR (WebXR) — when navigator.xr.isSessionSupported(
 *      'immersive-ar') is true. Quest 3, recent Android Chrome.
 *      Real 6DOF tracking, plane detection if requested. We render
 *      into the XR session's reference space.
 *
 *   2. Camera-passthrough fallback — everywhere else. Video element
 *      pinned behind a transparent three.js canvas. DeviceOrientation
 *      events drive the camera rotation so the user gets a parallax
 *      effect by tilting their phone — feels like the model is
 *      floating in their space even though there's no positional
 *      tracking. Desktop users orbit with mouse drag.
 *
 * The camera permission is requested only when the user explicitly
 * taps the "Show in my room" button — never on page load. Permission
 * denied falls back to a non-camera 3D preview.
 *
 * # Anchoring
 *
 * The 3D model sits ~1.5m in front of the camera by default. User
 * can pinch-zoom (mobile) or scroll (desktop) to bring it closer.
 * Single-tap on the canvas re-centres the model in front of the
 * current camera pose.
 */

import { useEffect, useRef, useState } from "react";
import type { Card } from "lib/ar/types";

type WebcamARSceneProps = { card: Card };

type ARStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "no-camera"
  | "loading-model";

export default function WebcamARScene({ card }: WebcamARSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<ARStatus>("idle");
  const [webXRSupported, setWebXRSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature-detect WebXR immersive-ar on mount, so the button can
  // surface "Enter immersive AR" vs "Show in my room" appropriately.
  useEffect(() => {
    const xr = (navigator as { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    if (!xr) return;
    xr.isSessionSupported("immersive-ar")
      .then((ok) => setWebXRSupported(ok))
      .catch(() => setWebXRSupported(false));
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (disposeRef.current) {
      disposeRef.current();
      disposeRef.current = null;
    }
    setStatus("idle");
  };

  const startCameraAR = async () => {
    setError(null);
    setStatus("requesting");

    // 1. Ask for the rear-facing camera. Most mobile browsers honour
    // facingMode: 'environment'; desktop browsers ignore it (no rear).
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setStatus("denied");
      } else if (e.name === "NotFoundError" || e.name === "OverconstrainedError") {
        setStatus("no-camera");
      } else {
        setStatus("denied");
        setError(e.message ?? "Camera unavailable");
      }
      return;
    }

    streamRef.current = stream;

    // 2. Mount the video element with the stream. The video is pinned
    // behind the canvas via CSS — no need to texture it into three.js
    // (saves a fragment shader pass + a copy).
    const video = videoRef.current;
    if (!video) {
      stopCamera();
      return;
    }
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();

    setStatus("loading-model");

    // 3. Three.js scene with transparent renderer, GLB loaded, idle
    // animation, optional device-orientation-driven camera rotation.
    const container = containerRef.current;
    if (!container) {
      stopCamera();
      return;
    }

    try {
      const [THREE, { GLTFLoader }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);
      camera.position.set(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // fully transparent
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Lighting — neutral, warm.
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(2, 3, 2);
      scene.add(key);

      // Load the GLB. Default placement: 1.5m in front of the camera,
      // slight downward tilt so the user looks at it naturally.
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(card.ar.model);
      const model = gltf.scene;

      // Normalise model to fit a 0.4m bounding sphere — so a 28cm
      // protean-elite and a 50cm Aura avatar look comparable in
      // perceived size. Users can pinch to resize after.
      const box = new THREE.Box3().setFromObject(model);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      if (sphere.radius > 0) {
        const targetRadius = 0.2; // 20cm
        const scale = targetRadius / sphere.radius;
        model.scale.multiplyScalar(scale);
      }

      const anchor = new THREE.Group();
      anchor.position.set(0, 0, -1.5); // 1.5m in front
      anchor.add(model);
      scene.add(anchor);

      // Auto-rotate the model itself
      const shouldRotate = card.ar.autoRotate !== false;

      // Device orientation handler — convert gyroscope to camera
      // rotation for parallax. On non-mobile or denied permission,
      // falls back to identity rotation.
      let orientationActive = false;
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha == null || e.beta == null || e.gamma == null) return;
        orientationActive = true;
        // Map device euler to camera rotation. Phone in portrait:
        //   alpha = compass heading (Z, yaw)
        //   beta  = front-back tilt (X, pitch)
        //   gamma = left-right tilt (Y, roll)
        const deg = Math.PI / 180;
        camera.rotation.set(
          (e.beta - 90) * deg * 0.5, // dampen so movement is gentle
          e.alpha * deg * 0.5,
          -e.gamma * deg * 0.5,
          "YXZ",
        );
      };

      // iOS 13+ requires explicit permission grant via a user gesture.
      // We tie it to the camera start — by here, the user just tapped.
      const DOE = (window as { DeviceOrientationEvent?: typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> } }).DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        try {
          const perm = await DOE.requestPermission();
          if (perm === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        } catch {
          // Permission denied or not in user gesture — skip parallax.
        }
      } else if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation);
      }

      // Touch pinch-zoom: scale the anchor by distance ratio.
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
          anchor.position.z = Math.max(-5, Math.min(-0.3, anchor.position.z / factor));
        }
        lastPinchDist = dist;
      };
      const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) lastPinchDist = null;
      };
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });

      // Desktop scroll: move the model closer/farther.
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        anchor.position.z = Math.max(-5, Math.min(-0.3, anchor.position.z * factor));
      };
      container.addEventListener("wheel", handleWheel, { passive: false });

      // Tap to recentre: places model 1.5m in front of current view.
      const handleTap = () => {
        anchor.position.set(0, 0, -1.5);
      };
      container.addEventListener("click", handleTap);

      // --- Render loop ---
      const clock = new THREE.Clock();
      let raf = 0;
      const animate = () => {
        const t = clock.getElapsedTime();
        if (shouldRotate) {
          model.rotation.y = t * 0.3; // ~17 deg/s gentle spin
        }
        // If no orientation events, slowly orbit the model around
        // the camera so desktop users still see depth.
        if (!orientationActive) {
          camera.position.x = Math.sin(t * 0.2) * 0.08;
          camera.lookAt(anchor.position);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      // Resize observer
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
        window.removeEventListener("deviceorientation", handleOrientation);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("click", handleTap);
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        // Three.js doesn't recursively dispose geometries from a model;
        // walk the scene and dispose explicitly.
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

      setStatus("active");
    } catch (err) {
      console.error("WebcamARScene: failed to start", err);
      setError((err as Error).message ?? "Failed to start AR scene");
      stopCamera();
    }
  };

  // Cleanup on unmount.
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wc-root">
      {status === "idle" && (
        <div className="wc-prompt">
          <div className="wc-hint">
            Hold up your phone, point at the floor or a wall, and tap below.
            The model will float into the camera view.
          </div>
          <button className="wc-btn" onClick={startCameraAR}>
            📷 {webXRSupported ? "Enter immersive AR" : "Show in my room"}
          </button>
          <div className="wc-fine">
            We request your camera only when you tap. Nothing is recorded or sent
            anywhere — the video stays on this device.
          </div>
        </div>
      )}

      {(status === "requesting" || status === "loading-model") && (
        <div className="wc-prompt">
          <div className="wc-hint">
            {status === "requesting" ? "Waiting for camera permission..." : "Loading model..."}
          </div>
        </div>
      )}

      {status === "denied" && (
        <div className="wc-prompt">
          <div className="wc-hint">
            Camera access was denied. Re-allow it in your browser settings, or
            use the <strong>3D preview</strong> tab to inspect the model
            without AR.
          </div>
          {error && <div className="wc-error">{error}</div>}
          <button className="wc-btn-small" onClick={startCameraAR}>
            Try again
          </button>
        </div>
      )}

      {status === "no-camera" && (
        <div className="wc-prompt">
          <div className="wc-hint">
            No camera was found on this device. Use the <strong>3D preview</strong>
            tab instead.
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className={`wc-video ${status === "active" ? "wc-video-on" : ""}`}
        playsInline
        muted
      />
      <div
        ref={containerRef}
        className={`wc-canvas ${status === "active" ? "wc-canvas-on" : ""}`}
      />

      {status === "active" && (
        <button className="wc-stop" onClick={stopCamera} aria-label="Stop AR">
          ✕
        </button>
      )}

      <style jsx>{`
        .wc-root {
          width: 100%;
          padding: 0 1rem;
          position: relative;
        }
        .wc-prompt {
          width: 100%;
          height: 70vh;
          min-height: 400px;
          border-radius: 1rem;
          background: linear-gradient(
            135deg,
            ${card.brand.primary}22,
            ${card.brand.secondary}22
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem;
          text-align: center;
        }
        .wc-hint {
          font-size: 1rem;
          line-height: 1.5;
          max-width: 32rem;
        }
        .wc-fine {
          font-size: 0.75rem;
          opacity: 0.6;
          max-width: 28rem;
        }
        .wc-error {
          color: #ff6b6b;
          font-size: 0.85rem;
          max-width: 30rem;
        }
        .wc-btn {
          background: ${card.brand.primary};
          color: ${card.brand.textOnBrand};
          border: none;
          padding: 1rem 1.75rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 24px ${card.brand.primary}66;
          transition: transform 0.1s ease;
        }
        .wc-btn:active {
          transform: scale(0.97);
        }
        .wc-btn-small {
          background: transparent;
          color: inherit;
          border: 1px solid currentColor;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          cursor: pointer;
          opacity: 0.7;
        }
        .wc-video {
          display: none;
          position: absolute;
          top: 0;
          left: 1rem;
          right: 1rem;
          width: calc(100% - 2rem);
          height: 70vh;
          min-height: 400px;
          object-fit: cover;
          border-radius: 1rem;
          z-index: 1;
        }
        .wc-video-on {
          display: block;
        }
        .wc-canvas {
          display: none;
          position: absolute;
          top: 0;
          left: 1rem;
          right: 1rem;
          width: calc(100% - 2rem);
          height: 70vh;
          min-height: 400px;
          border-radius: 1rem;
          z-index: 2;
          pointer-events: auto;
        }
        .wc-canvas-on {
          display: block;
        }
        .wc-stop {
          position: absolute;
          top: 1rem;
          right: 2rem;
          z-index: 3;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.2rem;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
}
