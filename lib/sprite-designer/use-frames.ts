/**
 * lib/sprite-designer/use-frames.ts — Animation frame manager.
 *
 * The "live" canvas is always the active frame; other frames live cold as
 * ImageData. Switching frames swaps the canvas contents.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type FramesApi = {
  frames: ImageData[];
  current: number;
  fps: number;
  setFps: (n: number) => void;
  select: (index: number) => void;
  addBlank: () => void;
  duplicate: () => void;
  remove: () => void;
  reorder: (from: number, to: number) => void;
  setActiveImageData: (data: ImageData) => void;
  replaceAll: (newFrames: ImageData[], initial?: number) => void;
  beginPlayback: () => void;
  stopPlayback: () => void;
  isPlaying: boolean;
};

export function useFrames(
  getCanvas: () => HTMLCanvasElement | null,
  width: number,
  height: number,
): FramesApi {
  // `ImageData` doesn't exist in Node; defer construction to the client.
  const [frames, setFrames] = useState<ImageData[]>(() =>
    typeof window === "undefined" ? [] : [blank(width, height)],
  );
  const [current, setCurrent] = useState(0);
  const [fps, setFps] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setFrames([blank(width, height)]);
    setCurrent(0);
  }, [width, height]);

  const grabCanvas = useCallback((): ImageData | null => {
    const c = getCanvas();
    if (!c) return null;
    return c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
  }, [getCanvas]);

  const pushToCanvas = useCallback(
    (data: ImageData) => {
      const c = getCanvas();
      if (!c) return;
      c.getContext("2d")!.putImageData(data, 0, 0);
    },
    [getCanvas],
  );

  const select = useCallback(
    (index: number) => {
      if (index < 0 || index >= frames.length || index === current) return;
      const live = grabCanvas();
      if (!live) return;
      const next = [...frames];
      next[current] = live;
      setFrames(next);
      pushToCanvas(next[index]);
      setCurrent(index);
    },
    [frames, current, grabCanvas, pushToCanvas],
  );

  const addBlank = useCallback(() => {
    const live = grabCanvas();
    if (!live) return;
    const next = [...frames];
    next[current] = live;
    next.splice(current + 1, 0, blank(width, height));
    setFrames(next);
    setCurrent(current + 1);
    pushToCanvas(next[current + 1]);
  }, [frames, current, width, height, grabCanvas, pushToCanvas]);

  const duplicate = useCallback(() => {
    const live = grabCanvas();
    if (!live) return;
    const next = [...frames];
    next[current] = live;
    next.splice(current + 1, 0, clone(live));
    setFrames(next);
    setCurrent(current + 1);
    pushToCanvas(next[current + 1]);
  }, [frames, current, grabCanvas, pushToCanvas]);

  const remove = useCallback(() => {
    if (frames.length <= 1) return;
    const next = frames.filter((_, i) => i !== current);
    setFrames(next);
    const newIdx = Math.min(current, next.length - 1);
    setCurrent(newIdx);
    pushToCanvas(next[newIdx]);
  }, [frames, current, pushToCanvas]);

  const reorder = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const live = grabCanvas();
      if (!live) return;
      const next = [...frames];
      next[current] = live;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setFrames(next);
      if (current === from) setCurrent(to);
      else if (from < current && to >= current) setCurrent(current - 1);
      else if (from > current && to <= current) setCurrent(current + 1);
      pushToCanvas(next[current]);
    },
    [frames, current, grabCanvas, pushToCanvas],
  );

  const setActiveImageData = useCallback(
    (data: ImageData) => {
      pushToCanvas(data);
    },
    [pushToCanvas],
  );

  const replaceAll = useCallback(
    (newFrames: ImageData[], initial = 0) => {
      if (newFrames.length === 0) return;
      setFrames(newFrames);
      const idx = Math.max(0, Math.min(initial, newFrames.length - 1));
      setCurrent(idx);
      pushToCanvas(newFrames[idx]);
    },
    [pushToCanvas],
  );

  const playRef = useRef<number | null>(null);
  const beginPlayback = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
  }, [isPlaying]);
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playRef.current != null) {
      window.clearInterval(playRef.current);
      playRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const live = grabCanvas();
    if (live) {
      setFrames((prev) => {
        const next = [...prev];
        next[current] = live;
        return next;
      });
    }
    let idx = current;
    playRef.current = window.setInterval(
      () => {
        idx = (idx + 1) % frames.length;
        pushToCanvas(frames[idx]);
        setCurrent(idx);
      },
      1000 / Math.max(1, fps),
    );
    return () => {
      if (playRef.current != null) {
        window.clearInterval(playRef.current);
        playRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  return {
    frames,
    current,
    fps,
    setFps,
    select,
    addBlank,
    duplicate,
    remove,
    reorder,
    setActiveImageData,
    replaceAll,
    beginPlayback,
    stopPlayback,
    isPlaying,
  };
}

function blank(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  // Fill with background colour (#0e0e14) to match the canvas init.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0x0e;
    data[i + 1] = 0x0e;
    data[i + 2] = 0x14;
    data[i + 3] = 0xff;
  }
  return new ImageData(data, w, h);
}

function clone(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}
