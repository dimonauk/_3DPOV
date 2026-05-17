"use client";

/**
 * app/atelier/cube-composer/cube-shell.tsx — The six inside-out face
 * panels making up the cubemap shell.
 *
 * Extracted from cube-composer-client.tsx. Reads per-face status
 * (active / done / pending) and dispatches to FacePanel for each
 * face. Pure render — no state.
 */

import { FacePanel } from "./face-panel";
import {
  type CubeShellProps,
  FACE_COLOR_ACTIVE,
  FACE_COLOR_DONE,
  FACE_COLOR_PENDING,
  FACE_ORDER,
  FACE_TRANSFORMS,
} from "./types";

export function CubeShell({ faceStatus, equirect }: CubeShellProps) {
  return (
    <group>
      {FACE_ORDER.map((face) => {
        const xf = FACE_TRANSFORMS[face];
        const status = faceStatus[face];
        const color =
          status === "active"
            ? FACE_COLOR_ACTIVE[face]
            : status === "done"
              ? FACE_COLOR_DONE
              : FACE_COLOR_PENDING;
        const opacity = status === "active" ? 0.85 : status === "done" ? 0.7 : 0.4;
        const placeholderOpacity =
          status === "active" ? 0.55 : status === "done" ? 0.4 : 0.15;
        return (
          <FacePanel
            key={face}
            face={face}
            position={xf.position}
            rotation={xf.rotation}
            color={color}
            opacity={equirect ? opacity : placeholderOpacity}
            equirect={equirect}
            isActive={status === "active"}
          />
        );
      })}
    </group>
  );
}
