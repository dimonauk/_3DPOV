"use client";

/**
 * app/atelier/gaze-heatmap/gaze-heatmap-client.tsx
 *
 * MVP gaze chamber: load a JSON of GazeSamples, render to an equirect
 * canvas in HEATMAP / FOVEAL_VIEW / SCANPATH mode, expose summary
 * statistics + top dwell zones in the side panel.
 *
 * Lifted-and-stripped from Shadrerapp GazeHeatmap (Apache-2.0).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  computeDwellZones,
  computeStatistics,
  filterByTimeRange,
  loadFromJson,
  type DwellZone,
  type GazeSample,
  type StatisticSet,
} from "lib/capabilities/input/gaze";
import {
  renderEquirectToCanvas,
  type AnalysisMode,
} from "lib/capabilities/viz/heatmap-equirect";

const MODES: { id: AnalysisMode; label: string; gloss: string }[] = [
  { id: "HEATMAP", label: "heatmap", gloss: "gaussian intensity accumulation" },
  { id: "FOVEAL_VIEW", label: "foveal mask", gloss: "what they did see, rest darkened" },
  { id: "SCANPATH", label: "scanpath", gloss: "dashed trace + node dots" },
];

export default function GazeHeatmapClient() {
  const [samples, setSamples] = useState<GazeSample[]>([]);
  const [mode, setMode] = useState<AnalysisMode>("HEATMAP");
  const [blobRadiusDeg, setBlobRadiusDeg] = useState(5.0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const parsed = loadFromJson(data);
        if (parsed.length === 0) {
          setUploadError(
            "No valid gaze samples in this file. Expecting an array of { t, yaw_deg, pitch_deg }.",
          );
          return;
        }
        setSamples(parsed);
      } catch (err) {
        setUploadError(
          err instanceof Error
            ? `Could not parse: ${err.message}`
            : "Could not parse this file as gaze JSON.",
        );
      }
    };
    reader.onerror = () => {
      setUploadError("Could not read the file.");
    };
    reader.readAsText(file);
    // Reset the input so re-uploading the same file fires onload again.
    e.target.value = "";
  }, []);

  const timeRange = useMemo<[number, number]>(() => {
    if (samples.length === 0) return [0, 100];
    return [samples[0]!.t, samples[samples.length - 1]!.t];
  }, [samples]);

  const filtered = useMemo(
    () => filterByTimeRange(samples, timeRange),
    [samples, timeRange],
  );

  const stats: StatisticSet | null = useMemo(
    () => computeStatistics(filtered),
    [filtered],
  );

  const dwellZones: DwellZone[] = useMemo(
    () => computeDwellZones(filtered, 15, 10),
    [filtered],
  );

  // Render to the canvas whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 2048;
    canvas.height = 1024;
    renderEquirectToCanvas(ctx, {
      samples: filtered,
      background: null,
      timeRange,
      blobRadiusDegrees: blobRadiusDeg,
      mode,
    });
  }, [filtered, timeRange, blobRadiusDeg, mode]);

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-3">
        <div className="aspect-[2/1] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
            width={2048}
            height={1024}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-chrome-300">
          <label className="cursor-pointer rounded-sm border border-warm-black-700 px-3 py-1 hover:border-pink-200/40">
            upload gaze.json
            <input
              type="file"
              accept="application/json"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          {uploadError && (
            <span className="rounded-sm border border-coral-500/60 bg-coral-500/10 px-2 py-0.5 text-[10px] text-coral-300">
              {uploadError}
            </span>
          )}
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-sm border px-3 py-1 ${
                mode === m.id
                  ? "border-pink-200 text-pink-100"
                  : "border-warm-black-700 hover:border-pink-200/40"
              }`}
              title={m.gloss}
            >
              {m.label}
            </button>
          ))}
          <label className="flex items-center gap-2">
            blob radius
            <input
              type="range"
              min={1}
              max={30}
              step={0.5}
              value={blobRadiusDeg}
              onChange={(e) => setBlobRadiusDeg(parseFloat(e.target.value))}
            />
            <span className="font-mono text-chrome-400">
              {blobRadiusDeg.toFixed(1)}°
            </span>
          </label>
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 text-xs text-chrome-300">
          <div className="chrome-label mb-2">Statistics</div>
          {stats ? (
            <dl className="grid grid-cols-2 gap-2 font-mono">
              <dt>samples</dt>
              <dd className="text-chrome-100">{samples.length}</dd>
              <dt>total time</dt>
              <dd className="text-chrome-100">{stats.totalTime.toFixed(1)}s</dd>
              <dt>mean velocity</dt>
              <dd className="text-chrome-100">{stats.meanVelocity.toFixed(1)} °/s</dd>
              <dt>comfort band</dt>
              <dd className="text-chrome-100">
                {(stats.comfortBandFraction * 100).toFixed(0)}%
              </dd>
              <dt>yaw swing</dt>
              <dd className="text-chrome-100">{stats.maxYawSwing.toFixed(0)}°</dd>
              <dt>saccades</dt>
              <dd className="text-chrome-100">{stats.saccadeCount}</dd>
              <dt>scanpath idx</dt>
              <dd className="text-chrome-100">{stats.scanpathIndex.toFixed(2)}</dd>
            </dl>
          ) : (
            <p className="text-chrome-500">load a gaze.json to see statistics</p>
          )}
        </div>

        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 text-xs text-chrome-300">
          <div className="chrome-label mb-2">Top dwell zones</div>
          {dwellZones.length > 0 ? (
            <ol className="flex flex-col gap-1 font-mono">
              {dwellZones.map((zone, i) => (
                <li key={i} className="flex items-baseline justify-between gap-2">
                  <span className="text-chrome-100">
                    {zone.centroid[0].toFixed(0)}°, {zone.centroid[1].toFixed(0)}°
                  </span>
                  <span className="text-chrome-500">
                    {zone.samples.length} samples
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-chrome-500">— no zones yet —</p>
          )}
        </div>
      </aside>
    </div>
  );
}
