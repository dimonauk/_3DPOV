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
 *      Chrome). Unavailable on iOS Safari.
 *
 * # Orchestrator only
 *
 * This file owns the camera lifecycle state machine, the stream/
 * scene/recording ref bag, and the WebXR feature detect. Three.js
 * scenes live in webcam-ar/setup-camera-passthrough.ts and
 * webcam-ar/setup-webxr-session.ts; recording in
 * webcam-ar/use-recording.ts; CSS in webcam-ar/styles.ts; chrome
 * (prompts + buttons) in webcam-ar/overlay.tsx. See
 * ARCHITECTURE.md Rule 1 (300-line cap, atomise on entry).
 */

import { useEffect, useRef, useState } from "react";

import { createLogger, errToObject } from "lib/log";

import { WebcamAROverlay } from "./webcam-ar/overlay";
import { setupCameraPassthrough } from "./webcam-ar/setup-camera-passthrough";
import { setupWebXRSession } from "./webcam-ar/setup-webxr-session";
import { webcamARStyles } from "./webcam-ar/styles";
import { type ARStatus, type WebcamARSceneProps } from "./webcam-ar/types";
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

  // Scene-canvas ref is published by the camera-passthrough setup so
  // the recorder can read pixels from it.
  const rendererCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable ref the camera-passthrough render loop reads — avoids
  // stale-closure issues when state flips mid-frame.
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
    const xr = (navigator as {
      xr?: { isSessionSupported: (m: string) => Promise<boolean> };
    }).xr;
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
    try {
      (window as { __holoflow_track?: (s: string, t: string) => void }).__holoflow_track?.(
        card.slug,
        "ar_launch",
      );
    } catch {
      // analytics is best-effort
    }

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
      const { disposer, sceneCanvas } = await setupCameraPassthrough({
        container,
        video,
        card,
        handTrackingRef,
        onError: setError,
      });
      rendererCanvasRef.current = sceneCanvas;
      disposeRef.current = disposer;
      setStatus("active");
    } catch (err) {
      log.error("failed to start", { err: errToObject(err) });
      setError((err as Error).message ?? "Failed to start AR scene");
      stopCamera();
    }
  };

  const startWebXR = async () => {
    if (!webXRSupported) {
      setError(
        "WebXR isn't supported in this browser. Try the Quest 3 browser or recent Android Chrome.",
      );
      return;
    }

    // XR session has its own camera passthrough handled by the device.
    stopCamera();
    setError(null);
    try {
      (window as { __holoflow_track?: (s: string, t: string) => void }).__holoflow_track?.(
        card.slug,
        "webxr",
      );
    } catch {
      // analytics is best-effort
    }
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
      const disposer = await setupWebXRSession({
        container,
        session,
        card,
        onSessionEnd: () => {
          disposeRef.current = null;
          setStatus("idle");
        },
      });
      disposeRef.current = disposer;
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
      <WebcamAROverlay
        status={status}
        card={card}
        webXRSupported={webXRSupported}
        handTracking={handTracking}
        recording={recording}
        error={error}
        onStartCamera={startCameraAR}
        onStartWebXR={startWebXR}
        onStop={stopCamera}
        onToggleHand={() => setHandTracking((v) => !v)}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      <video
        ref={videoRef}
        className={`wc-video ${status === "active" ? "wc-video-on" : ""}`}
        playsInline
        muted
      />
      <div
        ref={containerRef}
        className={`wc-canvas ${
          status === "active" || status === "xr-active" ? "wc-canvas-on" : ""
        }`}
      />

      {/* Global because styled-jsx's babel plugin needs to see static
          CSS in source to compute a scoped className; the styles live
          in styles.ts so this component file stays readable. The
          `wc-*` class prefix is unique to this component, so global
          injection won't collide with anything else. */}
      <style jsx global>{`${webcamARStyles(card)}`}</style>
    </div>
  );
}
