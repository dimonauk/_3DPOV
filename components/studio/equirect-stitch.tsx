"use client";
/**
 * equirect-stitch.tsx — OSV / INSV stitch panel for EquirectViewer.
 */
import { useCallback, useMemo, useState } from "react";
import { createLogger } from "lib/log";
import { useHoloFlowDesktop } from "lib/studio/desktop";
import type { SourceAsset } from "lib/studio/types";

const log = createLogger("studio.EquirectViewer");

type StitchState =
  | { phase: "idle" }
  | { phase: "loading"; ratio: number; abort: AbortController }
  | { phase: "done"; blob: Blob }
  | { phase: "error"; message: string };

export function StitchPanel({ source, onSourceReplace }: {
  source: Extract<SourceAsset, { kind: "osv-video" | "insv-video" }>;
  onSourceReplace: ((next: SourceAsset) => void) | undefined;
}) {
  const [state, setState] = useState<StitchState>({ phase: "idle" });
  const desktop = useHoloFlowDesktop();
  const kindLabel = source.kind === "osv-video" ? "OSV" : "INSV";
  const outWidth = 4096, lensFov = 200;
  const fileMB   = useMemo(() => source.raw.size / 1_000_000, [source.raw.size]);
  const duration = source.durationSeconds;

  const onStitch = useCallback(async () => {
    const abort = new AbortController();
    setState({ phase: "loading", ratio: 0, abort });
    try {
      const mod    = await import("lib/studio/stitch");
      const stitch = source.kind === "osv-video" ? mod.stitchOsvToEquirect : mod.stitchInsvToEquirect;
      const blob   = await stitch(source.raw, { lensFov, outWidth, signal: abort.signal, onProgress: (ratio) => setState((p) => p.phase === "loading" ? { ...p, ratio } : p) });
      setState({ phase: "done", blob });
      if (onSourceReplace) {
        const url = URL.createObjectURL(blob);
        const file = new File([blob], source.label.replace(/\.(osv|insv)$/i, ".stitched.mp4"), { type: "video/mp4" });
        onSourceReplace({ kind: "equirect-video", label: file.name, objectUrl: url, width: outWidth, height: Math.round(outWidth / 2), durationSeconds: duration, raw: file });
      }
    } catch (err) {
      if (abort.signal.aborted) { setState({ phase: "idle" }); return; }
      setState({ phase: "error", message: err instanceof Error ? err.message : "Unknown stitch error" });
    }
  }, [source, duration, onSourceReplace]);

  const onCancel = useCallback(() => { if (state.phase === "loading") state.abort.abort(); }, [state]);
  const onDesktopHandoff = useCallback(() => { log.info("desktop handoff requested", { sourceLabel: source.label, desktop }); }, [source, desktop]);

  return (
    <div className="grid h-full place-items-center bg-warm-black-950 px-6">
      <div className="w-full max-w-xl">
        <div className="chrome-label text-pink-200">{kindLabel} INGEST</div>
        <div className="mt-2 font-mono text-xs text-chrome-400">{source.label}</div>
        <div className="mt-1 font-mono text-[10px] text-chrome-500">
          {fileMB.toFixed(1)} MB · {duration > 0 ? `${duration.toFixed(1)} s` : "duration unknown"} · two-stream dual fisheye
        </div>

        {duration > 60 && state.phase === "idle" && (
          <div className="mt-4 rounded-sm border border-amber-400/40 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
            Clip over 60 s — in-browser stitch may run out of memory.{desktop.status === "available" ? " HoloFlow Desktop is reachable and recommended." : " Consider installing HoloFlow Desktop."}
          </div>
        )}

        {state.phase === "idle" && (
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" onClick={onStitch} className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 text-sm text-pink-100 transition-colors hover:bg-pink-200/20">
              Stitch via ffmpeg.wasm
            </button>
            <div className="text-[10px] text-chrome-500">Runs entirely in your browser. ~5–15× slower than native; uses up to ~800 MB per 30 s of 8K source.</div>
            {desktop.status === "available" && (
              <button type="button" onClick={onDesktopHandoff} className="rounded-sm border border-green-400/40 bg-green-400/5 px-4 py-2 text-sm text-green-100 transition-colors hover:bg-green-400/15">
                Use HoloFlow Desktop instead (faster, no memory limits)
              </button>
            )}
          </div>
        )}

        {state.phase === "loading" && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-chrome-300">
              <span>Stitching… {(state.ratio * 100).toFixed(0)}%</span>
              <button type="button" onClick={onCancel} className="rounded-sm border border-warm-black-700 px-2 py-0.5 font-mono text-[10px] text-chrome-300 hover:border-pink-200/60">cancel</button>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-warm-black-800">
              <div className="h-full bg-pink-200 transition-[width] duration-150" style={{ width: `${Math.max(2, state.ratio * 100)}%` }} />
            </div>
            <div className="mt-2 text-[10px] text-chrome-500">ffmpeg.wasm boot + hstack + v360 dfisheye → equirect MP4.</div>
          </div>
        )}

        {state.phase === "done" && (
          <div className="mt-6 rounded-sm border border-green-400/40 bg-green-400/5 px-3 py-2 text-xs text-green-200">
            Stitched {(state.blob.size / 1_000_000).toFixed(1)} MB equirect MP4 ready — loading into viewer…
          </div>
        )}

        {state.phase === "error" && (
          <div className="mt-6 rounded-sm border border-red-400/40 bg-red-400/5 px-3 py-2 text-xs text-red-200">
            Stitch failed: {state.message}
            <button type="button" onClick={() => setState({ phase: "idle" })} className="ml-3 underline">try again</button>
          </div>
        )}
      </div>
    </div>
  );
}
