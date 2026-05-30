"use client";

/**
 * components/type3d/mesh-scene/context.ts — Provider context + hook.
 *
 * The React Context that `<MeshSceneProvider>` writes into, plus the
 * `useMeshScene` hook every `<MeshProseLayer>` calls to register
 * itself with the shared canvas.
 *
 * Separated from the provider implementation so child components
 * can import only the hook + context without pulling in the heavy
 * Three.js init code (the bundler still tree-shakes today, but the
 * boundary makes the intent explicit).
 */

import { createContext, useContext } from "react";

import type { MeshSceneContextValue } from "./types";

export const MeshSceneContext = createContext<MeshSceneContextValue | null>(
  null,
);

/** `null` when no provider above. */
export function useMeshScene(): MeshSceneContextValue | null {
  return useContext(MeshSceneContext);
}
