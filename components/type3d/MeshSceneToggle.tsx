"use client";

/**
 * components/type3d/MeshSceneToggle.tsx — opt-out switch.
 *
 * Small button-style toggle that lets the reader disable the
 * mesh-prose system entirely. Persists the preference in
 * localStorage under `holoflow.mesh-scene.opt-out` and
 * broadcasts a custom event so any `useMeshSceneAvailable`
 * hooks in the same tab pick up the change without a reload.
 *
 * Place this alongside the existing accessibility controls in
 * the footer or the settings drawer. Single-purpose, no
 * cascading dependencies — drops in anywhere.
 */

import { useEffect, useState } from "react";

import {
  getMeshSceneOptOut,
  setMeshSceneOptOut,
} from "hooks/useMeshSceneAvailable";

export type MeshSceneToggleProps = {
  className?: string;
  /** Optional label override. */
  label?: string;
};

export function MeshSceneToggle({
  className,
  label = "3D body text",
}: MeshSceneToggleProps) {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);

  useEffect(() => {
    setOptedOut(getMeshSceneOptOut());
    const onChange = (): void => setOptedOut(getMeshSceneOptOut());
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onChange);
      window.addEventListener("holoflow:mesh-scene-toggle", onChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("holoflow:mesh-scene-toggle", onChange);
      }
    };
  }, []);

  if (optedOut === null) {
    // Avoid a server/client mismatch by not rendering the
    // toggle state until the localStorage read has happened
    // on the client. Render a stable placeholder.
    return (
      <button
        type="button"
        disabled
        className={className}
        aria-label={`${label} — loading preference`}
      >
        {label}
      </button>
    );
  }

  const isOn = !optedOut;

  return (
    <button
      type="button"
      onClick={() => setMeshSceneOptOut(isOn)}
      aria-pressed={isOn}
      className={className}
      title={
        isOn
          ? `${label} is on. Click to switch back to HTML body text.`
          : `${label} is off. Click to render body text as 3D mesh.`
      }
    >
      <span aria-hidden="true">{isOn ? "On" : "Off"}</span>
      <span className="sr-only">
        {isOn
          ? `${label} is currently on. Activating this button switches body text back to HTML.`
          : `${label} is currently off. Activating this button renders body text as 3D mesh.`}
      </span>
      <span className="ml-2">{label}</span>
    </button>
  );
}
