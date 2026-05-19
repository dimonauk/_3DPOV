"use client";

/**
 * components/tracking/TrackingPermission.tsx — Consent modal for
 * webcam-based viewer tracking.
 *
 * Two responsibilities:
 *   1. Surface what the camera is for and what does/doesn't leave
 *      the device.
 *   2. Ask the browser for camera permission, then bump the
 *      tracking registry so it can promote from the pointer
 *      fallback up to the best webcam-based source.
 *
 * Consent is persisted to localStorage via lib/tracking/webcam so
 * the user is asked once per device, not once per visit. The
 * Kinect bridge is exempt — it streams from the user's own bench
 * and is gated by the bridge's bearer token, not this modal.
 */

import { useEffect, useState } from "react";

import {
  acquireWebcam,
  readConsent,
  reevaluate,
  releaseWebcam,
  writeConsent,
  type ConsentDecision,
  type TrackingSource,
} from "lib/tracking";

import { useViewerPose } from "hooks/useViewerPose";

export type TrackingPermissionProps = {
  open: boolean;
  onClose: () => void;
};

const SOURCE_LABEL: Record<TrackingSource, string> = {
  kinect: "Azure Kinect (bench)",
  ultraleap: "Ultraleap (Leap Motion 2)",
  "mediapipe-face": "Webcam — face landmarks",
  "mediapipe-hand": "Webcam — hand landmarks",
  pointer: "Pointer fallback",
};

export function TrackingPermission({
  open,
  onClose,
}: TrackingPermissionProps): React.ReactElement | null {
  const { source } = useViewerPose();
  const [consent, setConsent] = useState<ConsentDecision>("ask");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConsent(readConsent());
  }, [open]);

  if (!open) return null;

  const handleGrant = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      // Surface the browser's native permission prompt. On
      // success the helper writes consent for us; we then
      // release immediately so the tracker (not us) owns the
      // long-lived capture handle.
      await acquireWebcam();
      releaseWebcam();
      setConsent(readConsent());
      await reevaluate();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      writeConsent("denied");
      setConsent("denied");
    } finally {
      setBusy(false);
    }
  };

  const handleDeny = (): void => {
    writeConsent("denied");
    setConsent("denied");
    void reevaluate();
    onClose();
  };

  const handleReset = async (): Promise<void> => {
    writeConsent("ask");
    setConsent("ask");
    setError(null);
    await reevaluate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Viewer tracking permission"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#0f1217",
          color: "#e9ecf2",
          padding: "1.5rem",
          borderRadius: 12,
          maxWidth: 480,
          width: "calc(100% - 2rem)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Viewer tracking</h2>
        <p style={{ marginTop: ".75rem", lineHeight: 1.55, fontSize: ".95rem" }}>
          The 3D scene responds to where you are sitting in front of the
          monitor. With a webcam, head-and-eye position drives the camera
          so the parallax becomes spatial rather than decorative.
        </p>
        <ul style={{ marginTop: ".75rem", paddingLeft: "1.2rem", lineHeight: 1.5, fontSize: ".9rem" }}>
          <li>
            All inference runs locally in your browser. No video frame
            ever leaves the device.
          </li>
          <li>
            We don&apos;t record. The MediaPipe pipeline reads frames,
            extracts landmark points, and discards the raw image.
          </li>
          <li>
            The Azure Kinect path (when wired) streams from your own
            bench machine over Tailscale &mdash; same privacy posture.
          </li>
          <li>
            You can revoke at any time via the browser&apos;s site settings
            or the reset button below.
          </li>
        </ul>
        <p style={{ marginTop: ".75rem", fontSize: ".85rem", opacity: 0.75 }}>
          Currently active source:{" "}
          <strong>{source ? SOURCE_LABEL[source] : "none"}</strong>
        </p>
        {error ? (
          <p
            role="alert"
            style={{
              marginTop: ".75rem",
              fontSize: ".85rem",
              color: "#ff9a9a",
            }}
          >
            {error}
          </p>
        ) : null}
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: ".5rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {consent === "denied" ? (
            <button
              type="button"
              onClick={() => {
                void handleReset();
              }}
              style={buttonStyle("ghost")}
            >
              Reset decision
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeny}
              disabled={busy}
              style={buttonStyle("ghost")}
            >
              Keep pointer only
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              void handleGrant();
            }}
            disabled={busy || consent === "denied"}
            style={buttonStyle("solid")}
          >
            {busy ? "Asking your browser…" : "Enable camera tracking"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={buttonStyle("ghost")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function buttonStyle(variant: "solid" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: ".55rem .9rem",
    borderRadius: 8,
    fontSize: ".9rem",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.15)",
  };
  if (variant === "solid") {
    return {
      ...base,
      background: "#e9ecf2",
      color: "#0f1217",
      borderColor: "#e9ecf2",
    };
  }
  return {
    ...base,
    background: "transparent",
    color: "#e9ecf2",
  };
}
