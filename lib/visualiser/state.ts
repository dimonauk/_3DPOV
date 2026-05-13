/**
 * useVisualiserState &mdash; a tiny reducer-backed state hook for multi-knob
 * visualisers. Cleaner than maintaining four parallel `useState` slots when a
 * visualiser has half a dozen interlocking parameters.
 *
 * Returns a triple: `[state, patch, reset]`. `patch` accepts a partial object
 * and shallow-merges it into the current state; `reset` returns the initial
 * value the hook was created with. The initial value is captured once via
 * `useRef` so it survives re-renders.
 *
 * Pure helper. No DOM, no Three, no React component code. Importable from any
 * client component.
 */

"use client";

import { useCallback, useReducer, useRef } from "react";

type Action<T> =
  | { type: "patch"; payload: Partial<T> }
  | { type: "reset"; payload: T };

function reducer<T extends object>(state: T, action: Action<T>): T {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.payload };
    case "reset":
      return action.payload;
    default:
      return state;
  }
}

export function useVisualiserState<T extends object>(
  initial: T,
): [T, (patch: Partial<T>) => void, () => void] {
  // Capture the initial value once so `reset` always restores to first-render
  // state even if the caller passes a fresh literal each render.
  const initialRef = useRef<T>(initial);
  const [state, dispatch] = useReducer(reducer<T>, initialRef.current);

  const patch = useCallback((p: Partial<T>) => {
    dispatch({ type: "patch", payload: p });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "reset", payload: initialRef.current });
  }, []);

  return [state, patch, reset];
}
