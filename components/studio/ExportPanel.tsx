"use client";

/**
 * components/studio/ExportPanel.tsx — export controls.
 *
 * v0 capabilities:
 *   - Capture the current view as a PNG (immediate, via the canvas).
 *   - Print preview metadata for the active keyframe.
 *   - Submit a splat-training job to HoloFlow Desktop (M2 wedge —
 *     payload-schema demo; see the blob-URL TODO below before
 *     calling this "real").
 *
 * v1 will add:
 *   - WebCodecs video encode (render the keyframe path as an MP4) via
 *     `mp4-muxer` / Mediabunny.
 *   - Direct file-upload to HoloFlow Desktop so the splat path doesn't
 *     depend on the operator pre-staging source files.
 *   - USDZ export (snapshot card path).
 *
 * Orchestrator only. Types in export-panel/types.ts; source→payload
 * mapping in splat-support.ts; status block + streaming detail in
 * splat-status.tsx; small UI helpers in sub-controls.tsx;
 * constants in constants.ts. Per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useMemo, useState } from "react";

import {
  streamDesktopJobEvents,
  submitDesktopJob,
  useHoloFlowDesktop,
} from "lib/studio/desktop";
import {
  coverageReport,
  renderForPrint,
  targetPixelDimensions,
  type PaperSize,
  type PrintFormat,
  type PrintOrientation,
  type PrintPpi,
  type PrintSpec,
} from "lib/studio/print-export";
import { handoffToTopaz } from "lib/studio/topaz-handoff";
import type { Keyframe, SourceAsset } from "lib/studio/types";

import { DEFAULT_VARIANTS } from "./export-panel/constants";
import { canSubmitToSplat360 } from "./export-panel/splat-support";
import { SplatStatusBlock } from "./export-panel/splat-status";
import { RadioRow, Row, stem } from "./export-panel/sub-controls";
import type {
  JobEvent,
  PrintRenderState,
  SubmitJob,
  SubmitState,
} from "./export-panel/types";

type Props = {
  source: SourceAsset;
  keyframes: Keyframe[];
};

export default function ExportPanel({ source, keyframes }: Props) {
  const desktop = useHoloFlowDesktop();
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  // Print state — paper / quality / orientation / format + render status.
  const [paperSize, setPaperSize] = useState<PaperSize>("A2");
  const [printPpi, setPrintPpi] = useState<PrintPpi>(300);
  const [orientation, setOrientation] = useState<PrintOrientation>("landscape");
  const [printFormat, setPrintFormat] = useState<PrintFormat>("png");
  const [printState, setPrintState] = useState<PrintRenderState>({
    status: "idle",
  });

  // Use keyframe 0 as the print's reframe — matches the operator's
  // intuition that "what I see is what I print". (Animation paths land
  // when the MP4 export does.)
  const activeKeyframe = keyframes[0];

  const onCapturePng = useCallback(() => {
    // Grab the active R3F canvas — it's the first <canvas> in the
    // viewport region. We rely on `preserveDrawingBuffer: true` set
    // on the Canvas in EquirectViewer.
    const canvas = document.querySelector<HTMLCanvasElement>("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stem(source.label)}_view.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }, [source.label]);

  // ── Print derived values ────────────────────────────────────────────
  const printSpec: PrintSpec = useMemo(
    () => ({ paperSize, ppi: printPpi, orientation, format: printFormat }),
    [paperSize, printPpi, orientation, printFormat],
  );

  const printDims = useMemo(
    () => targetPixelDimensions(paperSize, printPpi, orientation),
    [paperSize, printPpi, orientation],
  );

  const sourceWidth = "width" in source ? source.width : 0;
  const printCoverage = useMemo(
    () =>
      coverageReport(sourceWidth, activeKeyframe?.fov ?? 75, printDims.w),
    [sourceWidth, activeKeyframe, printDims.w],
  );

  const canPrint =
    !!activeKeyframe &&
    (source.kind === "equirect-image" || source.kind === "equirect-video");

  const printBusy = printState.status === "rendering";

  const runPrintRender = useCallback(async (): Promise<Blob | null> => {
    if (!activeKeyframe || !canPrint) return null;
    setPrintState({ status: "rendering", ratio: 0 });
    try {
      const blob = await renderForPrint({
        source,
        keyframe: activeKeyframe,
        spec: printSpec,
        onProgress: (ratio) =>
          setPrintState({ status: "rendering", ratio }),
      });
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPrintState({ status: "error", message });
      return null;
    }
  }, [activeKeyframe, canPrint, printSpec, source]);

  const onRenderToFile = useCallback(async () => {
    const blob = await runPrintRender();
    if (!blob) return;
    const filename = `${stem(source.label)}_${paperSize}_${printPpi}ppi.${printFormat}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPrintState({
      status: "done",
      method: "file",
      message: `Saved ${filename} (${(blob.size / 1_000_000).toFixed(1)} MB).`,
    });
  }, [paperSize, printFormat, printPpi, runPrintRender, source.label]);

  const onRenderToTopaz = useCallback(async () => {
    const blob = await runPrintRender();
    if (!blob) return;
    const filename = `${stem(source.label)}_${paperSize}_${printPpi}ppi.${printFormat}`;
    const desktopUrl = desktop.status === "available" ? desktop.url : null;
    const result = await handoffToTopaz(blob, filename, { desktopUrl });
    setPrintState({
      status: "done",
      method: "topaz",
      message: `${result.method.toUpperCase()} · ${result.message}`,
    });
  }, [desktop, paperSize, printFormat, printPpi, runPrintRender, source.label]);

  const splatSupport = canSubmitToSplat360(source);

  const onGenerateSplat = useCallback(async () => {
    if (desktop.status !== "available") return;
    if (!splatSupport.ok) return;

    setSubmitState({ status: "submitting" });

    const payload: SubmitJob = {
      source: splatSupport.buildPayload(),
      variants: DEFAULT_VARIANTS,
    };

    let jobId: string;
    try {
      const result = await submitDesktopJob(desktop.url, payload);
      jobId = result.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitState({ status: "error", message });
      return;
    }

    const events: JobEvent[] = [];
    setSubmitState({ status: "streaming", jobId, events: [] });

    try {
      for await (const ev of streamDesktopJobEvents(desktop.url, jobId)) {
        events.push(ev);
        // Allocate a fresh array each tick so React notices the change.
        setSubmitState({
          status: "streaming",
          jobId,
          events: events.slice(),
        });
      }
      const finalEv = events[events.length - 1];
      setSubmitState({
        status: "done",
        jobId,
        events: events.slice(),
        finalPhase: finalEv?.phase ?? "done",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitState({ status: "error", message });
    }
  }, [desktop, splatSupport]);

  const splatBusy =
    submitState.status === "submitting" || submitState.status === "streaming";
  const splatDisabled =
    desktop.status !== "available" || !splatSupport.ok || splatBusy;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <section>
        <div className="chrome-label">SOURCE</div>
        <dl className="mt-2 space-y-1 font-mono text-xs">
          <Row label="kind" value={source.kind} />
          <Row label="file" value={source.label} />
          {"width" in source ? (
            <Row label="size" value={`${source.width}×${source.height}`} />
          ) : null}
          <Row
            label="duration"
            value={`${source.durationSeconds.toFixed(2)}s`}
          />
        </dl>
      </section>

      <section>
        <div className="chrome-label">PRINT</div>
        <div className="mt-2 flex flex-col gap-3 font-mono text-xs text-chrome-300">
          <RadioRow
            label="paper"
            value={paperSize}
            options={[
              { value: "A4", label: "A4" },
              { value: "A3", label: "A3" },
              { value: "A2", label: "A2 (PRO-1100)" },
            ]}
            onChange={(v) => setPaperSize(v)}
            disabled={printBusy}
          />
          <RadioRow
            label="quality"
            value={printPpi}
            options={[
              { value: 150, label: "150 PPI (Poster)" },
              { value: 220, label: "220 PPI (Photo)" },
              { value: 300, label: "300 PPI (Pro)" },
            ]}
            onChange={(v) => setPrintPpi(v)}
            disabled={printBusy}
          />
          <RadioRow
            label="orient"
            value={orientation}
            options={[
              { value: "landscape", label: "Landscape" },
              { value: "portrait", label: "Portrait" },
            ]}
            onChange={(v) => setOrientation(v)}
            disabled={printBusy}
          />
          <RadioRow
            label="format"
            value={printFormat}
            options={[
              { value: "png", label: "PNG" },
              { value: "tiff", label: "TIFF (needs tiff dep)", disabled: true },
            ]}
            onChange={(v) => setPrintFormat(v)}
            disabled={printBusy}
          />

          <dl className="space-y-1">
            <Row label="output" value={`${printDims.w} × ${printDims.h} px`} />
            <Row
              label="src effective"
              value={
                sourceWidth > 0
                  ? `${printCoverage.effectiveSourcePx} px (${(printCoverage.coverage * 100).toFixed(0)}%)`
                  : "—"
              }
            />
          </dl>

          {sourceWidth > 0 && printCoverage.needsUpscale ? (
            <div className="rounded-sm border border-amber-400/40 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200">
              Source = {sourceWidth}px equirect, FOV ={" "}
              {activeKeyframe?.fov.toFixed(0)}° → effective source{" "}
              {printCoverage.effectiveSourcePx} px. Upscale needed:{" "}
              {printCoverage.upscaleFactor.toFixed(1)}×. Recommend Topaz
              Photo AI.
            </div>
          ) : null}

          {!canPrint ? (
            <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-chrome-400">
              Print export needs an equirect image or video. Stitch OSV /
              INSV first.
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onRenderToFile}
              disabled={!canPrint || printBusy}
              className={
                !canPrint || printBusy
                  ? "cursor-not-allowed rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-left text-chrome-500"
                  : "rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-2 text-left text-pink-100 hover:border-pink-200/80"
              }
            >
              {printBusy && printState.status === "rendering"
                ? `Rendering… ${(printState.ratio * 100).toFixed(0)}%`
                : "Render → file"}
            </button>
            <button
              type="button"
              onClick={onRenderToTopaz}
              disabled={!canPrint || printBusy}
              className={
                !canPrint || printBusy
                  ? "cursor-not-allowed rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-left text-chrome-500"
                  : "rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-2 text-left text-pink-100 hover:border-pink-200/80"
              }
            >
              Render + Open in Topaz Photo AI
            </button>
          </div>

          {printState.status === "rendering" ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-black-800">
              <div
                className="h-full bg-pink-200 transition-[width] duration-150"
                style={{
                  width: `${Math.max(2, printState.ratio * 100)}%`,
                }}
              />
            </div>
          ) : null}

          {printState.status === "done" ? (
            <div className="rounded-sm border border-pink-200/30 bg-pink-200/5 px-3 py-2 text-pink-100">
              {printState.message}
            </div>
          ) : null}

          {printState.status === "error" ? (
            <div className="rounded-sm border border-red-400/40 bg-red-400/5 px-3 py-2 text-red-200">
              Print render failed: {printState.message}
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="chrome-label">EXPORT</div>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onCapturePng}
            className="rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-2 text-left font-mono text-xs text-pink-100 hover:border-pink-200/80"
          >
            Capture current view → PNG
          </button>

          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-left font-mono text-xs text-chrome-500"
          >
            Render keyframes → MP4 (M1.1 — needs `mp4-muxer` / Mediabunny)
          </button>

          <button
            type="button"
            onClick={onGenerateSplat}
            disabled={splatDisabled}
            className={
              splatDisabled
                ? "cursor-not-allowed rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-left font-mono text-xs text-chrome-500"
                : "rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-2 text-left font-mono text-xs text-pink-100 hover:border-pink-200/80"
            }
          >
            {splatBusy ? "Submitting splat job…" : "Generate splat → splat360"}
          </button>

          <SplatStatusBlock
            desktopState={desktop}
            splatSupport={splatSupport}
            submitState={submitState}
          />
        </div>
      </section>

      <section>
        <div className="chrome-label">KEYFRAMES</div>
        <ul className="mt-2 space-y-1 font-mono text-xs text-chrome-300">
          {keyframes.map((kf, i) => (
            <li key={i} className="flex justify-between">
              <span>kf {i}</span>
              <span>
                t={kf.time.toFixed(1)}s · yaw {kf.yaw.toFixed(0)}° · pitch{" "}
                {kf.pitch.toFixed(0)}° · fov {kf.fov.toFixed(0)}°
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
