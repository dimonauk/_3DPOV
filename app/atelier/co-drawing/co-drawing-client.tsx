"use client";

/**
 * app/atelier/co-drawing/co-drawing-client.tsx — Co-Drawing chamber UI.
 *
 * Operator draws on a 960x540 canvas; pen colour + clear sit on the
 * right; the prompt bar at the bottom POSTs the canvas (as base64
 * PNG) plus the prompt to `/api/co-drawing/suggest`; the response is
 * a base64 PNG that replaces the canvas content so the operator can
 * sketch on top and run another pass.
 *
 * Touch and mouse both work. The canvas is the visible "model";
 * generated images are drawn as a background image and re-blitted
 * each frame so the next pen stroke goes on top.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:co-drawing");

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "ready"; durationMs: number }
  | { kind: "error"; message: string };

const CANVAS_W = 960;
const CANVAS_H = 540;

export default function CoDrawingClient() {
  useActiveChamber("co-drawing");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });

  const promptFieldId = useId();

  // -------- Canvas init --------
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // -------- Drawing helpers --------
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e.nativeEvent) {
      const t = e.nativeEvent.touches[0];
      if (!t) return { x: 0, y: 0 };
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    const me = e.nativeEvent as MouseEvent;
    return {
      x: me.offsetX * scaleX,
      y: me.offsetY * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    if (e.nativeEvent.type === "touchstart") e.preventDefault();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;
    if (e.nativeEvent.type === "touchmove") e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  // -------- Clear --------
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    backgroundImageRef.current = null;
    setOutput({ kind: "idle" });
  }, []);

  // -------- Save current canvas as PNG --------
  const onSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `co-drawing-${stamp}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }, []);

  // -------- Submit to Gemini --------
  const onSuggest = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const trimmed = prompt.trim();
      if (trimmed.length === 0) {
        setOutput({ kind: "error", message: "Write a prompt first." });
        return;
      }

      // Composite onto a white background to make sure transparent
      // canvases still send a valid PNG.
      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tctx = tmp.getContext("2d");
      if (!tctx) return;
      tctx.fillStyle = "#FFFFFF";
      tctx.fillRect(0, 0, tmp.width, tmp.height);
      tctx.drawImage(canvas, 0, 0);
      const drawingData = tmp.toDataURL("image/png").split(",")[1];

      const startedAt = Date.now();
      setOutput({ kind: "running", startedAt });

      try {
        const res = await fetch("/api/co-drawing/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, drawingData }),
        });
        if (!res.ok) {
          const text = await res.text();
          let message = `HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(text) as { error?: string };
            if (parsed.error) message = parsed.error;
          } catch {
            if (text.length > 0 && text.length < 300) message = text;
          }
          setOutput({ kind: "error", message });
          return;
        }
        const json = (await res.json()) as {
          imageData?: string;
          mimeType?: string;
        };
        if (!json.imageData) {
          setOutput({
            kind: "error",
            message: "Gemini returned no image. Try a different prompt.",
          });
          return;
        }

        const mt = json.mimeType ?? "image/png";
        const dataUrl = `data:${mt};base64,${json.imageData}`;

        // Load + paint over the canvas.
        const img = new window.Image();
        img.onload = () => {
          backgroundImageRef.current = img;
          const c = canvasRef.current;
          if (!c) return;
          const ctx = c.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
        };
        img.src = dataUrl;

        const durationMs = Date.now() - startedAt;
        setOutput({ kind: "ready", durationMs });

        // Drop into atelier recent-outputs ring.
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const bin = atob(json.imageData);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: mt });
        pushAtelierOutput({
          chamberSlug: "co-drawing",
          kind: "image",
          label: `co-drawing-${stamp}.png`,
          blobUrl: URL.createObjectURL(blob),
          mimeType: mt,
          sizeBytes: blob.size,
        });
      } catch (err) {
        log.error("suggest failed", { err });
        setOutput({
          kind: "error",
          message: err instanceof Error ? err.message : "Suggest failed.",
        });
      }
    },
    [prompt],
  );

  // -------- Touch event prevention on canvas --------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const block = (ev: TouchEvent) => {
      if (isDrawing) ev.preventDefault();
    };
    canvas.addEventListener("touchstart", block, { passive: false });
    canvas.addEventListener("touchmove", block, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", block);
      canvas.removeEventListener("touchmove", block);
    };
  }, [isDrawing]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tool bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="chrome-label text-chrome-400">Tools</span>
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-warm-black-700 shadow-inner transition-transform hover:scale-105"
            style={{ backgroundColor: penColor }}
            aria-label="Pen colour"
            title="Pen colour"
          >
            <input
              ref={colorInputRef}
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              className="pointer-events-none absolute h-px w-px opacity-0"
              aria-label="Pick pen colour"
            />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          >
            Save PNG
          </button>
        </div>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
          Brush &middot; 5 px round
        </span>
      </section>

      {/* Canvas */}
      <section className="w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label="Drawing canvas"
          className="h-[30vh] min-h-[320px] w-full touch-none cursor-crosshair rounded-sm border border-warm-black-700 bg-white sm:h-[60vh]"
        />
      </section>

      {/* Prompt bar */}
      <form onSubmit={onSuggest} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5" htmlFor={promptFieldId}>
          <span className="chrome-label text-chrome-400">
            What should Gemini add or change?
          </span>
          <div className="relative">
            <input
              id={promptFieldId}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add a moon in the sky. Keep the line style."
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2.5 pr-28 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            />
            <button
              type="submit"
              disabled={output.kind === "running"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {output.kind === "running" ? "Asking…" : "Suggest"}
            </button>
          </div>
        </label>

        {output.kind === "running" ? (
          <p className="text-xs text-chrome-400">
            Gemini typically returns in 5&ndash;15 seconds. The result
            replaces the canvas; draw on top of it to keep going.
          </p>
        ) : null}

        {output.kind === "ready" ? (
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-emerald-300">
            Ready &middot; {(output.durationMs / 1000).toFixed(1)}s
          </p>
        ) : null}

        {output.kind === "error" ? (
          <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-3 py-2 text-sm text-pink-100">
            {output.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
