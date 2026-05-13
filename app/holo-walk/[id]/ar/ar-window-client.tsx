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
  DeniedOverlay,
  ErrorOverlay,
  InfoStrip,
  IntroCard,
  OutOfRangeStrip,
  RequestingOverlay,
} from "./ar-overlays";

type Phase =
  | "intro"
  | "requesting"
  | "denied"
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
    try {
      await requestPermissions();
      await startGeoTracking();
      const stream = await requestCameraStream();
      streamRef.current = stream;
      if (videoRef.current) {
        await attachStreamToVideo(stream, videoRef.current);
      }
      setPhase("active");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" ||
          (err as { code?: string }).code === "permission-denied");
      setErrorMessage(msg);
      setPhase(isDenied ? "denied" : "error");
    }
  }, []);

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
