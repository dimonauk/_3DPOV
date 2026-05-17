/**
 * lib/sprite-designer/use-history.ts — Circular ImageData history for the pixel canvas.
 *
 * Snapshot at end of stroke (one entry per stroke), or explicitly before any
 * destructive operation (K-Centroid, photo→sprite, dimension change). Capped
 * at MAX entries to keep memory finite.
 *
 * Memory: ~width * height * 4 bytes per entry. 50 entries at 64×64 = ~800 kB.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const MAX = 50;

export type History = {
  push: (snapshot: ImageData) => void;
  undo: () => ImageData | null;
  redo: () => ImageData | null;
  reset: (initial: ImageData) => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function useHistory(
  getCanvas: () => HTMLCanvasElement | null,
): History {
  const past = useRef<ImageData[]>([]);
  const future = useRef<ImageData[]>([]);
  const [, forceRerender] = useState(0);
  const bump = useCallback(() => forceRerender((n) => n + 1), []);

  const push = useCallback(
    (snapshot: ImageData) => {
      past.current.push(snapshot);
      if (past.current.length > MAX) past.current.shift();
      future.current = []; // any new edit clears redo
      bump();
    },
    [bump],
  );

  const restore = useCallback(
    (data: ImageData) => {
      const c = getCanvas();
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      if (c.width !== data.width || c.height !== data.height) {
        c.width = data.width;
        c.height = data.height;
      }
      ctx.putImageData(data, 0, 0);
    },
    [getCanvas],
  );

  const undo = useCallback((): ImageData | null => {
    if (past.current.length < 2) return null;
    const c = getCanvas();
    if (!c) return null;
    const current = c
      .getContext("2d")!
      .getImageData(0, 0, c.width, c.height);
    future.current.push(current);
    if (future.current.length > MAX) future.current.shift();
    past.current.pop();
    // past may be empty after pop; nothing to restore in that case.
    const prev = past.current[past.current.length - 1] ?? null;
    if (prev) restore(prev);
    bump();
    return prev;
  }, [bump, getCanvas, restore]);

  const redo = useCallback((): ImageData | null => {
    const next = future.current.pop();
    if (!next) return null;
    past.current.push(next);
    if (past.current.length > MAX) past.current.shift();
    restore(next);
    bump();
    return next;
  }, [bump, restore]);

  const reset = useCallback(
    (initial: ImageData) => {
      past.current = [initial];
      future.current = [];
      bump();
    },
    [bump],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 1,
    canRedo: future.current.length > 0,
  };
}
