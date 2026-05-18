"use client";

/**
 * app/holo-walk/[id]/ar/ar-window-client.tsx — Magic-window AR view.
 *
 * One-line role: full-screen camera feed + GPS-anchored R3F overlay of the
 * sculpture, with photo / video / share controls.
 * Full purpose in ar-window-client.PURPOSE.md.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SculptureFigure } from "components/three/SculptureFigure";
import {
  attachStreamToVideo,
  computeARTransform,
  releaseStream,
  requestCameraStream,
  type ARTransform,
} from "lib/capabilities/ar/window";
import {
  requestPermissions,
  startGeoTracking,
  stopGeoTracking,
} from "lib/capabilities/geo/position";
import {
  capturePhoto,
  probeRecordingSupport,
  shareBlob,
  startRecording,
  type RecordingHandle,
} from "lib/capabilities/media/capture";
import type { SculptureLocation } from "lib/holo-walk/locations";
import { useGeoStore } from "lib/state/geo";

import {
  ArrivedOverlay,
  CaptureBar,
  CompassDeniedOverlay,
  DeniedOverlay,
  ErrorOverlay,
  GpsUnavailableOverlay,
  InfoStrip,
  IntroCard,
  OutOfRangeStrip,
  RequestingOverlay,
} from "./ar-overlays";

type Phase =
  | "intro"
  | "requesting"
  | "denied"
  | "compass-denied"
  | "gps-unavailable"
  | "active"
  | "out-of-range"
  | "arrived"
  | "error";

const INITIAL_TRANSFORM: ARTransform = {
  targetPos: [0, 1.6, -10] as const,
  bearing: 0,
  distanceMeters: Infinity,
  arrived: false,
  outOfRange: true,
};

/** R3F-side bridge: each frame, recompute the AR transform and report it back. */
function ARFrameBridge({
  location,
  onTransform,
  onCanvas,
}: {
  location: SculptureLocation;
  onTransform: (t: ARTransform) => void;
  onCanvas: (el: HTMLCanvasElement) => void;
}) {
  const reportedCanvas = useRef(false);
  useFrame(({ gl }) => {
    if (!reportedCanvas.current) {
      reportedCanvas.current = true;
      onCanvas(gl.domElement);
    }
    const state = useGeoStore.getState();
    const pos = state.position;
    const headingDeg = state.heading?.degrees ?? 0;
    if (!pos) return;
    const t = computeARTransform(
      { lat: pos.lat, lon: pos.lon, headingDegrees: headingDeg },
      {
        lat: location.coords.lat,
        lon: location.coords.lon,
        renderFromM: location.range.renderFromM,
        renderToM: location.range.renderToM,
      },
    );
    onTransform(t);
  });
  return null;
}

export default function ARWindowClient({
  location,
}: {
  location: SculptureLocation;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recElapsed, setRecElapsed] = useState(0);
  const [transform, setTransform] = useState<ARTransform>(INITIAL_TRANSFORM);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingHandleRef = useRef<RecordingHandle | null>(null);

  const canRecord = useMemo(() => probeRecordingSupport().canRecord, []);

  // Phase transitions driven by transform (active <-> out-of-range <-> arrived).
  useEffect(() => {
    if (phase !== "active" && phase !== "out-of-range" && phase !== "arrived") return;
    if (transform.arrived && phase !== "arrived") setPhase("arrived");
    else if (transform.outOfRange && phase !== "out-of-range") setPhase("out-of-range");
    else if (!transform.arrived && !transform.outOfRange && phase !== "active") setPhase("active");
  }, [transform, phase]);

  // Recording timer.
  useEffect(() => {
    if (!recording || recordingStartedAt === null) return;
    const id = window.setInterval(() => {
      setRecElapsed(Math.floor((performance.now() - recordingStartedAt) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [recording, recordingStartedAt]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (recordingHandleRef.current?.isRecording()) {
        recordingHandleRef.current.cancel();
      }
      releaseStream(streamRef.current);
      streamRef.current = null;
      stopGeoTracking();
    };
  }, []);

  const handleStart = useCallback(async () => {
    setPhase("requesting");
    setErrorMessage(null);
    // Clear any stale lastError from a previous attempt so the GPS
    // watcher below has a clean slate to write into.
    useGeoStore.getState().setLastError(null);
    // Retry from denied/error releases any stream the previous attempt
    // captured — otherwise back-to-back retries leak camera handles
    // (and the camera LED stays on, freaking the visitor out).
    if (streamRef.current) {
      releaseStream(streamRef.current);
      streamRef.current = null;
    }
    let acquiredStream: MediaStream | null = null;
    try {
      // iOS Safari requires DeviceOrientationEvent.requestPermission()
      // for compass access. If the visitor denied it, the AR sight
      // lines silently break (sculpture appears in the wrong direction).
      // Block the start instead of letting them walk into a useless
      // experience — the AR overlay tells them to enable Motion access
      // and try again.
      const perms = await requestPermissions();
      // Detect iOS by feature-detecting the requestPermission API.
      // On non-iOS, `orientation` resolves true implicitly.
      const isIOSStylePermission =
        typeof window !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (window.DeviceOrientationEvent as any)?.requestPermission ===
          "function";
      if (isIOSStylePermission && !perms.orientation) {
        setPhase("compass-denied");
        return;
      }
      await startGeoTracking();
      acquiredStream = await requestCameraStream();
      streamRef.current = acquiredStream;
      if (videoRef.current) {
        await attachStreamToVideo(acquiredStream, videoRef.current);
      }
      setPhase("active");
    } catch (err) {
      // attachStreamToVideo can throw AFTER the camera is hot — release
      // the stream we acquired so the visitor doesn't see a "denied"
      // overlay over a still-lit camera LED. Tracked via the local
      // `acquiredStream` because the ref may have been overwritten by
      // a concurrent retry (unlikely but cheap to be precise).
      if (acquiredStream) {
        releaseStream(acquiredStream);
        if (streamRef.current === acquiredStream) streamRef.current = null;
      }
      const msg = err instanceof Error ? err.message : String(err);
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" ||
          (err as { code?: string }).code === "permission-denied");
      setErrorMessage(msg);
      setPhase(isDenied ? "denied" : "error");
    }
  }, []);

  // GPS-fix watchdog: when the watcher reports timeout / unavailable
  // and we're still in the "requesting" or "active" phase, transition
  // to a fallback overlay so the visitor isn't stuck on a spinner. A
  // successful fix clears `lastError` and bumps `position`, which lets
  // the transform effect take over.
  const lastGeoError = useGeoStore((s) => s.lastError);
  const geoPosition = useGeoStore((s) => s.position);
  useEffect(() => {
    if (geoPosition) return; // got a fix — let the transform path run
    if (!lastGeoError) return;
    if (lastGeoError.code === "denied") {
      // Denied at the watcher level (not at requestPermissions) — treat
      // like the original NotAllowedError branch.
      if (phase === "requesting" || phase === "active") setPhase("denied");
      return;
    }
    if (lastGeoError.code === "timeout" || lastGeoError.code === "unavailable") {
      if (phase === "requesting") setPhase("gps-unavailable");
    }
  }, [lastGeoError, geoPosition, phase]);

  const handlePhoto = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;
    try {
      const blob = await capturePhoto(videoRef.current, overlayCanvasRef.current);
      await shareBlob(blob, {
        fileName: `${location.id}-${Date.now()}.jpg`,
        title: `HoloWalk · ${location.name}`,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }, [location.id, location.name]);

  const handleToggleRecording = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;
    try {
      if (recording && recordingHandleRef.current) {
        const blob = await recordingHandleRef.current.stop();
        recordingHandleRef.current = null;
        setRecording(false);
        setRecordingStartedAt(null);
        await shareBlob(blob, {
          fileName: `${location.id}-${Date.now()}.mp4`,
          title: `HoloWalk · ${location.name}`,
        });
      } else {
        const handle = await startRecording(videoRef.current, overlayCanvasRef.current);
        recordingHandleRef.current = handle;
        setRecording(true);
        setRecordingStartedAt(performance.now());
        setRecElapsed(0);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      // Recording handle may be live even though we couldn't stop
      // gracefully — cancel it so the underlying MediaRecorder /
      // encoder releases its buffers. If it's already stopped, cancel
      // is a no-op.
      if (recordingHandleRef.current) {
        try {
          recordingHandleRef.current.cancel();
        } catch {
          // best-effort — already in an error path
        }
        recordingHandleRef.current = null;
      }
      setRecording(false);
      setRecordingStartedAt(null);
    }
  }, [location.id, location.name, recording]);

  const sculptureVisible = phase === "active";
  const sculptureFaded = phase === "out-of-range";

  return (
    <div className="absolute inset-0 overflow-hidden bg-warm-black-950">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />

      <Canvas
        className="!absolute inset-0"
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 1.6, 0], fov: 70, near: 0.1, far: 1000 }}
        style={{ background: "transparent", pointerEvents: "none" }}
        onCreated={({ gl }) => {
          overlayCanvasRef.current = gl.domElement;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.6} />
        <ARFrameBridge
          location={location}
          onTransform={setTransform}
          onCanvas={(el) => {
            overlayCanvasRef.current = el;
          }}
        />
        {(sculptureVisible || sculptureFaded) && (
          <SculptureFigure
            location={location}
            position={transform.targetPos}
            autoRotate={false}
            bloom={true}
            scale={sculptureFaded ? 0.4 : 1}
          />
        )}
      </Canvas>

      {phase === "intro" && <IntroCard location={location} onStart={handleStart} />}
      {phase === "requesting" && <RequestingOverlay />}
      {phase === "denied" && (
        <DeniedOverlay
          onRetry={handleStart}
          errorMessage={errorMessage}
          locationId={location.id}
        />
      )}
      {phase === "compass-denied" && (
        <CompassDeniedOverlay
          onRetry={handleStart}
          locationId={location.id}
        />
      )}
      {phase === "gps-unavailable" && (
        <GpsUnavailableOverlay
          onRetry={handleStart}
          locationId={location.id}
          errorMessage={lastGeoError?.message ?? null}
        />
      )}
      {phase === "error" && (
        <ErrorOverlay
          errorMessage={errorMessage}
          onRetry={handleStart}
          locationId={location.id}
        />
      )}
      {phase === "arrived" && <ArrivedOverlay location={location} />}

      {(phase === "active" || phase === "out-of-range") && (
        <>
          <InfoStrip transform={transform} />
          {phase === "out-of-range" && (
            <OutOfRangeStrip
              distanceMeters={transform.distanceMeters}
              location={location}
            />
          )}
          <CaptureBar
            onPhoto={handlePhoto}
            onShare={handlePhoto}
            onToggleRecord={handleToggleRecording}
            recording={recording}
            recElapsed={recElapsed}
            canRecord={canRecord}
          />
        </>
      )}
    </div>
  );
}
