"use client";

/**
 * components/ar/webcam-ar/overlay.tsx — Status-driven prompts and
 * the floating control overlay (hand-toggle, WebXR launch, record
 * button, stop button) for WebcamARScene.
 *
 * Extracted from WebcamARScene.tsx per ARCHITECTURE.md Rule 1. Pure
 * presentation — every action is a callback supplied by the host
 * client, every state flag is a prop. The host owns the camera
 * lifecycle and recording state; this file just renders the chrome.
 */

import type { Card } from "lib/ar/types";

import type { ARStatus } from "./types";

export function WebcamAROverlay({
  status,
  card,
  webXRSupported,
  handTracking,
  recording,
  error,
  onStartCamera,
  onStartWebXR,
  onStop,
  onToggleHand,
  onStartRecording,
  onStopRecording,
}: {
  status: ARStatus;
  card: Card;
  webXRSupported: boolean;
  handTracking: boolean;
  recording: boolean;
  error: string | null;
  onStartCamera: () => void;
  onStartWebXR: () => void;
  onStop: () => void;
  onToggleHand: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  return (
    <>
      {status === "idle" && (
        <div className="wc-prompt">
          <div className="wc-hint">
            Hold up your phone, point at the floor or a wall, and tap below.
            The model will float into the camera view.
          </div>
          <button className="wc-btn" onClick={onStartCamera}>
            📷 Show in my room
          </button>
          {webXRSupported && (
            <button className="wc-btn-secondary" onClick={onStartWebXR}>
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
            {status === "requesting"
              ? "Waiting for camera permission..."
              : "Loading..."}
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
          <button className="wc-btn-small" onClick={onStartCamera}>
            Try again
          </button>
        </div>
      )}

      {status === "no-camera" && (
        <div className="wc-prompt">
          <div className="wc-hint">
            No camera was found on this device. Use the{" "}
            <strong>3D preview</strong> tab instead.
          </div>
        </div>
      )}

      {status === "active" && (
        <>
          <div className="wc-overlay">
            <button
              className={`wc-toggle ${handTracking ? "wc-toggle-on" : ""}`}
              onClick={() => {
                if (!handTracking) {
                  try {
                    (window as {
                      __holoflow_track?: (s: string, t: string) => void;
                    }).__holoflow_track?.(card.slug, "hand_lock");
                  } catch {
                    // analytics is best-effort
                  }
                }
                onToggleHand();
              }}
            >
              {handTracking ? "✋ Holding (tap to release)" : "✋ Hold in hand"}
            </button>
            {webXRSupported && (
              <button className="wc-toggle" onClick={onStartWebXR}>
                📍 Place on floor
              </button>
            )}
            <button
              className={`wc-toggle ${recording ? "wc-toggle-rec" : ""}`}
              onClick={recording ? onStopRecording : onStartRecording}
            >
              {recording ? "● Recording — tap to stop" : "● Record"}
            </button>
          </div>
          <button className="wc-stop" onClick={onStop} aria-label="Stop AR">
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
          <button className="wc-btn-small" onClick={onStop}>
            End session
          </button>
        </div>
      )}

      {error && status !== "denied" && status !== "idle" && (
        <div className="wc-error wc-error-floating">{error}</div>
      )}
    </>
  );
}
