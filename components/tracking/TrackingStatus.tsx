"use client";

/**
 * components/tracking/TrackingStatus.tsx — Floating chip that
 * shows the currently-active tracking source. Click to open the
 * TrackingPermission modal.
 *
 * Lightweight by design — no global state, no provider tree. The
 * chip subscribes to the registry through useViewerPose and
 * opens the modal locally. Drop one of these in any layout that
 * wants the operator to see which input is driving the scene.
 */

import { useState } from "react";

import type { TrackingSource } from "lib/tracking";

import { useViewerPose } from "hooks/useViewerPose";

import { TrackingPermission } from "./TrackingPermission";

const SOURCE_GLYPH: Record<TrackingSource, string> = {
  kinect: "K",
  ultraleap: "U",
  "mediapipe-face": "F",
  "mediapipe-hand": "H",
  pointer: "P",
};

const SOURCE_LABEL: Record<TrackingSource, string> = {
  kinect: "Kinect",
  ultraleap: "Ultraleap",
  "mediapipe-face": "Face",
  "mediapipe-hand": "Hand",
  pointer: "Pointer",
};

export type TrackingStatusProps = {
  /** Corner of the viewport to dock against. Default "bottom-right". */
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export function TrackingStatus({
  corner = "bottom-right",
}: TrackingStatusProps): React.ReactElement {
  const { source } = useViewerPose();
  const [open, setOpen] = useState(false);

  const glyph = source ? SOURCE_GLYPH[source] : "…";
  const label = source ? SOURCE_LABEL[source] : "no source";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Viewer tracking source: ${label}. Click to manage.`}
        style={{
          position: "fixed",
          ...cornerStyle(corner),
          zIndex: 60,
          display: "inline-flex",
          alignItems: "center",
          gap: ".4rem",
          padding: ".35rem .65rem",
          borderRadius: 999,
          background: "rgba(15, 18, 23, 0.85)",
          color: "#e9ecf2",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          fontSize: ".75rem",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          cursor: "pointer",
          letterSpacing: ".02em",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            display: "inline-grid",
            placeItems: "center",
            background:
              source && source !== "pointer"
                ? "rgba(120, 200, 140, 0.25)"
                : "rgba(180, 180, 200, 0.2)",
            color:
              source && source !== "pointer" ? "#bff0c5" : "#dadce6",
            fontSize: ".7rem",
            fontWeight: 600,
          }}
        >
          {glyph}
        </span>
        <span>{label}</span>
      </button>
      <TrackingPermission open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function cornerStyle(
  corner: NonNullable<TrackingStatusProps["corner"]>,
): React.CSSProperties {
  const inset = "0.75rem";
  switch (corner) {
    case "top-left":
      return { top: inset, left: inset };
    case "top-right":
      return { top: inset, right: inset };
    case "bottom-left":
      return { bottom: inset, left: inset };
    case "bottom-right":
    default:
      return { bottom: inset, right: inset };
  }
}
