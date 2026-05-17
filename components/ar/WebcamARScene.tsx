"use client";

/**
 * WebcamARScene — composite the card's 3D model into the user's
 * actual space using the device camera, with three anchoring modes:
 *
 *   1. Floating (default) — model sits 1.5m in front of the camera,
 *      DeviceOrientation drives parallax. Works everywhere with
 *      getUserMedia. Zero ML overhead.
 *
 *   2. Hand-locked (toggle: "✋ Hold in hand") — MediaPipe
 *      HandLandmarker runs on the video stream, returns 21 hand
 *      landmarks at ~30fps. The model is re-parented to follow the
 *      palm centre (midpoint of wrist landmark 0 and middle-MCP
 *      landmark 9), giving the impression the user is physically
 *      holding the sculpture / poi / specimen. Aura is excluded —
 *      a companion does not sit in your hand.
 *
 *   3. Floor-anchored via WebXR (button: "📍 Place on floor") —
 *      launches an immersive-ar session with hit-test enabled.
 *      A reticle follows where the user is aiming. Tap once to
 *      plant the model at that spot. 6DOF tracking. Requires
 *      WebXR-AR-capable device (Quest 3 browser, recent Android
 *      Chrome). Unavailable on iOS Safari — the button shows but
 *      explains why if tapped.
 *
 * # Camera + render lifecycle
 *
 * Camera is requested only on user gesture, never on page load.
 * Permission denied / no camera fall back to a 3D preview prompt.
 * On stop or unmount, all media tracks stop, hand landmarker
 * disposes, XR session ends, Three.js resources free.
 */

import { useEffect, useRef, useState } from "react";
import type * as THREE_TYPES from "three";

import { createLogger, errToObject } from "lib/log";

import { webcamARStyles } from "./webcam-ar/styles";
import {
  type ARStatus,
  HAND_MODEL_URL,
  LM_MIDDLE_MCP,
  LM_WRIST,
  MEDIAPIPE_WASM_URL,
  type WebcamARSceneProps,
} from "./webcam-ar/types";
import { useWebcamRecording } from "./webcam-ar/use-recording";

const log = createLogger("ar.WebcamARScene");

export default function WebcamARScene({ card }: WebcamARSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<ARStatus>("idle");
  const [webXRSupported, setWebXRSupported] = useState(false);
  const [handTracking, setHandTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scene-canvas ref is published by startCameraAR so the recorder
  // (and any future compositor) can read pixels from it.
  const rendererCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable refs the render loop reads — avoids stale-closure issues
  // when state flips mid-frame.
  const handTrackingRef = useRef(false);
  useEffect(() => {
    handTrackingRef.current = handTracking;
  }, [handTracking]);

  const { recording, startRecording, stopRecording, abortRecording } =
    useWebcamRecording({
      videoRef,
      sceneCanvasRef: rendererCanvasRef,
      card,
      onError: setError,
    });

  // Feature-detect WebXR immersive-ar on mount.
  useEffect(() => {
    const xr = (navigator as { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    if (!xr) return;
    xr.isSessionSupported("immersive-ar")
      .then((ok) => setWebXRSupported(ok))
      .catch(() => setWebXRSupported(false));
  }, []);

  const stopCamera = () => {
    abortRecording();
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (disposeRef.current) {
      disposeRef.current();
      disposeRef.current = null;
    }
    setHandTracking(false);
    setStatus("idle");
  };

  const startCameraAR = async () => {
    setError(null);
    setStatus("requesting");

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

    // Fire AR-launch analytics — visible to the card owner.
    try { (window as { __holoflow_track?: (s: string, t: string) => void }).__holoflow_track?.(card.slug, "ar_launch"); } catch {}

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

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      // Expose for the recorder — composites video bg + this canvas.
      rendererCanvasRef.current = renderer.domElement;

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

      // Hand-lock visual: soft glowing disc at the palm. Only shown
      // when MediaPipe is actively returning landmarks. Gives users a
      // clear signal that the tracker has them. Pulses gently while
      // active so the user knows the system is alive even if their
      // hand is held still.
      const footprintGeom = new THREE.RingGeometry(0.04, 0.18, 48).rotateX(-Math.PI / 2);
      const brandColor = (() => {
        try { return new THREE.Color(card.brand.primary); } catch { return new THREE.Color(0xffffff); }
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

      const DOE = (window as { DeviceOrientationEvent?: typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> } }).DeviceOrientationEvent;
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
          anchor.position.z = Math.max(-5, Math.min(-0.3, anchor.position.z / factor));
        }
        lastPinchDist = dist;
      };
      const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) lastPinchDist = null;
      };
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        anchor.position.z = Math.max(-5, Math.min(-0.3, anchor.position.z * factor));
      };
      const handleTap = () => {
        // Reset to default float when hand-tracking is off.
        if (!handTrackingRef.current) anchor.position.set(0, 0, -1.5);
      };
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("click", handleTap);

      // ----------------------------------------------------------------
      // Hand landmarker — lazy-loaded only if/when the user toggles
      // hand tracking. ~10MB WASM + ~5MB model on first activation.
      // ----------------------------------------------------------------

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
          const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
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
          setError("Hand tracking failed to initialise");
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

        // MediaPipe x is left-right in image space (0=left). For a
        // rear-cam stream rendered as-is, this maps directly. For a
        // front cam (selfie) the video is usually CSS-flipped — we
        // assume the deployer doesn't selfie-flip here; if they do
        // they should also mirror this.
        const ndcX = (px - 0.5) * 2;        // -1 .. 1
        const ndcY = -(py - 0.5) * 2;       // flip Y (image down → world up)
        const depth = -0.6;                 // ~60cm in front of camera

        // Project NDC at given depth through the camera frustum.
        const tan = Math.tan((camera.fov * Math.PI) / 180 / 2);
        const aspect = camera.aspect;
        const worldX = ndcX * tan * aspect * Math.abs(depth);
        const worldY = ndcY * tan * Math.abs(depth);

        handSmoothed.lerp(new THREE.Vector3(worldX, worldY, depth), SMOOTH_ALPHA);
        anchor.position.copy(handSmoothed);
        return true;
      };

      // ----------------------------------------------------------------
      // Render loop
      // ----------------------------------------------------------------
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
              // Pulse 1.0 -> 1.08 -> 1.0 every ~2s. Subtle but legible.
              const pulse = 1 + Math.sin(t * 3) * 0.08;
              footprint.scale.setScalar(pulse);
              // Opacity also breathes — feels alive.
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

      disposeRef.current = () => {
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

      setStatus("active");
    } catch (err) {
      log.error("failed to start", { err: errToObject(err) });
      setError((err as Error).message ?? "Failed to start AR scene");
      stopCamera();
    }
  };

  // ------------------------------------------------------------------
  // WebXR immersive-ar path with hit-test — own render loop, separate
  // from the camera+canvas path above.
  // ------------------------------------------------------------------
  const startWebXR = async () => {
    if (!webXRSupported) {
      setError(
        "WebXR isn't supported in this browser. Try the Quest 3 browser or recent Android Chrome.",
      );
      return;
    }

    // Stop the camera passthrough scene — XR session has its own
    // camera passthrough handled by the device.
    stopCamera();
    setError(null);
    try { (window as { __holoflow_track?: (s: string, t: string) => void }).__holoflow_track?.(card.slug, "webxr"); } catch {}
    setStatus("loading-model");

    const container = containerRef.current;
    if (!container) return;

    let session: XRSession;
    try {
      session = await (
        navigator as unknown as {
          xr: { requestSession: (m: string, init: object) => Promise<XRSession> };
        }
      ).xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test", "local"],
        // plane-detection is optional — Quest 3 + recent Chrome have
        // it; older Android Chrome may not. Session still works without.
        optionalFeatures: ["plane-detection"],
      });
    } catch (err) {
      log.error("XR session request failed", { err: errToObject(err) });
      setError("WebXR session was refused.");
      setStatus("idle");
      return;
    }

    try {
      const [THREE, { GLTFLoader }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.01, 100);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.xr.enabled = true;
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(2, 3, 2);
      scene.add(key);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(card.ar.model);
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      if (sphere.radius > 0) {
        model.scale.multiplyScalar(0.2 / sphere.radius);
      }
      model.visible = false; // hidden until first plant
      scene.add(model);

      // Reticle — small ring shown on the latest hit-test pose.
      const reticleGeom = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
      const reticleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
      const reticle = new THREE.Mesh(reticleGeom, reticleMat);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      await renderer.xr.setSession(session);

      const referenceSpace = await session.requestReferenceSpace("local");
      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await (
        session as unknown as {
          requestHitTestSource: (opts: { space: XRReferenceSpace }) => Promise<XRHitTestSource>;
        }
      ).requestHitTestSource({ space: viewerSpace });

      const onSelect = () => {
        if (reticle.visible) {
          model.position.setFromMatrixPosition(reticle.matrix);
          model.quaternion.setFromRotationMatrix(reticle.matrix);
          model.visible = true;
        }
      };
      session.addEventListener("select", onSelect);

      // ----------------------------------------------------------------
      // Plane visualisation — translucent quads on detected real-world
      // surfaces. Helps the user see what the device has mapped before
      // they tap to plant. Hidden once the model is placed.
      // ----------------------------------------------------------------
      type AnyXRPlane = {
        planeSpace: XRReferenceSpace;
        polygon: ReadonlyArray<{ x: number; y: number; z: number }>;
        lastChangedTime: number;
      };
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: (() => {
          try { return new THREE.Color(card.brand.primary); } catch { return new THREE.Color(0xffffff); }
        })(),
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const planeEdgeMaterial = new THREE.LineBasicMaterial({
        color: planeMaterial.color,
        transparent: true,
        opacity: 0.65,
      });
      type PlaneEntry = {
        mesh: THREE_TYPES.Mesh;
        edges: THREE_TYPES.LineSegments;
        lastChangedTime: number;
      };
      const planeEntries = new Map<AnyXRPlane, PlaneEntry>();

      const updatePlanes = (frame: XRFrame) => {
        // Hide entirely once model is planted — reduces visual noise.
        if (model.visible) {
          planeEntries.forEach(({ mesh, edges }) => {
            mesh.visible = false;
            edges.visible = false;
          });
          return;
        }
        const detected = (frame as unknown as { detectedPlanes?: ReadonlySet<AnyXRPlane> }).detectedPlanes;
        if (!detected) return;

        // Drop entries for planes the system has forgotten.
        for (const [plane, entry] of planeEntries) {
          if (!detected.has(plane)) {
            scene.remove(entry.mesh);
            scene.remove(entry.edges);
            entry.mesh.geometry.dispose();
            entry.edges.geometry.dispose();
            planeEntries.delete(plane);
          }
        }

        for (const plane of detected) {
          let entry = planeEntries.get(plane);
          if (!entry) {
            const mesh = new THREE.Mesh(new THREE.BufferGeometry(), planeMaterial);
            const edges = new THREE.LineSegments(new THREE.BufferGeometry(), planeEdgeMaterial);
            mesh.matrixAutoUpdate = false;
            edges.matrixAutoUpdate = false;
            scene.add(mesh);
            scene.add(edges);
            entry = { mesh, edges, lastChangedTime: -1 };
            planeEntries.set(plane, entry);
          }

          // Rebuild geometry only when the polygon actually changed.
          if (entry.lastChangedTime !== plane.lastChangedTime) {
            const points = plane.polygon;
            if (points && points.length >= 3) {
              // Triangle fan from first point for the filled quad.
              const tri: number[] = [];
              for (let i = 1; i < points.length - 1; i++) {
                const p0 = points[0]; const pi = points[i]; const pi1 = points[i + 1];
                if (!p0 || !pi || !pi1) continue;
                tri.push(p0.x, p0.y, p0.z, pi.x, pi.y, pi.z, pi1.x, pi1.y, pi1.z);
              }
              entry.mesh.geometry.dispose();
              entry.mesh.geometry = new THREE.BufferGeometry();
              entry.mesh.geometry.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
              entry.mesh.geometry.computeVertexNormals();

              // Boundary line loop.
              const seg: number[] = [];
              for (let i = 0; i < points.length; i++) {
                const a = points[i]; const b = points[(i + 1) % points.length];
                if (!a || !b) continue;
                seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
              }
              entry.edges.geometry.dispose();
              entry.edges.geometry = new THREE.BufferGeometry();
              entry.edges.geometry.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
            }
            entry.lastChangedTime = plane.lastChangedTime;
          }

          const pose = (frame as unknown as { getPose: (sp: XRSpace, ref: XRReferenceSpace) => XRPose | null }).getPose(plane.planeSpace, referenceSpace);
          if (pose) {
            entry.mesh.matrix.fromArray(pose.transform.matrix);
            entry.edges.matrix.fromArray(pose.transform.matrix);
            entry.mesh.visible = true;
            entry.edges.visible = true;
          }
        }
      };

      const clock = new THREE.Clock();
      const xrAnimate = (_t: DOMHighResTimeStamp, frame?: XRFrame) => {
        if (frame) {
          updatePlanes(frame);
          const hits = (
            frame as unknown as { getHitTestResults: (s: XRHitTestSource) => XRHitTestResult[] }
          ).getHitTestResults(hitTestSource);
          if (hits.length > 0) {
            const hit = hits[0];
            if (hit) {
              const pose = hit.getPose(referenceSpace);
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
              }
            }
          } else {
            reticle.visible = false;
          }
        }
        if (model.visible && card.ar.autoRotate !== false) {
          model.rotation.y += clock.getDelta() * 0.3;
        }
        renderer.render(scene, camera);
      };
      renderer.setAnimationLoop(xrAnimate);

      const cleanup = () => {
        renderer.setAnimationLoop(null);
        try {
          session.removeEventListener("select", onSelect);
          (hitTestSource as unknown as { cancel?: () => void }).cancel?.();
        } catch {
          // ignore
        }
        renderer.xr.enabled = false;
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
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
        reticleGeom.dispose();
        reticleMat.dispose();
        planeEntries.forEach(({ mesh, edges }) => {
          mesh.geometry.dispose();
          edges.geometry.dispose();
          scene.remove(mesh);
          scene.remove(edges);
        });
        planeEntries.clear();
        planeMaterial.dispose();
        planeEdgeMaterial.dispose();
        disposeRef.current = null;
        setStatus("idle");
      };
      session.addEventListener("end", cleanup);
      disposeRef.current = () => {
        session.end().catch(() => undefined);
      };

      setStatus("xr-active");
    } catch (err) {
      log.error("WebXR setup failed", { err: errToObject(err) });
      setError((err as Error).message ?? "WebXR session failed");
      session.end().catch(() => undefined);
      setStatus("idle");
    }
  };

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
            📷 Show in my room
          </button>
          {webXRSupported && (
            <button className="wc-btn-secondary" onClick={startWebXR}>
              📍 Place on real floor (WebXR)
            </button>
          )}
          <div className="wc-fine">
            We request your camera only when you tap. Nothing is recorded or
            sent anywhere — the video stays on this device.
          </div>
        </div>
      )}

      {(status === "requesting" || status === "loading-model") && (
        <div className="wc-prompt">
          <div className="wc-hint">
            {status === "requesting" ? "Waiting for camera permission..." : "Loading..."}
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
        className={`wc-canvas ${status === "active" || status === "xr-active" ? "wc-canvas-on" : ""}`}
      />

      {status === "active" && (
        <>
          <div className="wc-overlay">
            <button
              className={`wc-toggle ${handTracking ? "wc-toggle-on" : ""}`}
              onClick={() => {
                setHandTracking((v) => {
                  if (!v) {
                    try { (window as { __holoflow_track?: (s: string, t: string) => void }).__holoflow_track?.(card.slug, "hand_lock"); } catch {}
                  }
                  return !v;
                });
              }}
            >
              {handTracking ? "✋ Holding (tap to release)" : "✋ Hold in hand"}
            </button>
            {webXRSupported && (
              <button className="wc-toggle" onClick={startWebXR}>
                📍 Place on floor
              </button>
            )}
            <button
              className={`wc-toggle ${recording ? "wc-toggle-rec" : ""}`}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? "● Recording — tap to stop" : "● Record"}
            </button>
          </div>
          <button className="wc-stop" onClick={stopCamera} aria-label="Stop AR">
            ✕
          </button>
        </>
      )}

      {status === "xr-active" && (
        <div className="wc-prompt wc-xr-hint">
          <div className="wc-hint">
            Immersive AR session active. Aim at the floor, watch for the white
            ring, then tap once to plant the model.
          </div>
          <button className="wc-btn-small" onClick={stopCamera}>
            End session
          </button>
        </div>
      )}

      {error && status !== "denied" && status !== "idle" && (
        <div className="wc-error wc-error-floating">{error}</div>
      )}

      {/* Global because styled-jsx's babel plugin needs to see static
          CSS in source to compute a scoped className; the styles live
          in styles.ts so this component file stays readable. The
          `wc-*` class prefix is unique to this component, so global
          injection won't collide with anything else. */}
      <style jsx global>{`${webcamARStyles(card)}`}</style>
    </div>
  );
}
