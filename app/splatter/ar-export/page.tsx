/**
 * app/splatter/ar-export/page.tsx — AR export targets on the website.
 */

"use client";

import { useState } from "react";

import {
    BenchStatusBanner,
    useBenchInfo,
} from "components/splatter/BenchStatus";

type Target = "webxr" | "usdz" | "gltf" | "mindar" | "lookingglass";
const ALL: Target[] = ["webxr", "usdz", "gltf", "mindar", "lookingglass"];

export default function ArExportPage() {
  const [splat, setSplat] = useState("");
  const [out, setOut] = useState("");
  const [targets, setTargets] = useState<Target[]>(["webxr"]);
  const [watermark, setWatermark] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    info: benchInfo,
    error: benchError,
    loading: benchLoading,
  } = useBenchInfo();

  const toggle = (t: Target) =>
    setTargets((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/splatter/bench/api/ar/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splat_path: splat,
          out_dir: out,
          targets,
          watermark: watermark || null,
          geo_anchor: null,
        }),
      });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`${r.status}: ${body.slice(0, 200)}`);
      }
      setResult(await r.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <div className="chrome-label">Splatter · AR Export</div>
      <h1 className="mt-4 text-4xl">AR export</h1>
      <p className="mt-3 max-w-2xl text-chrome-300">
        Take any splat to phone-ready AR. USDZ for iOS Quick Look, glTF with
        KHR_gaussian_splatting for the web, mind-ar for printed AR cards, WebXR
        for Quest 3 / Vision Pro, Looking Glass quilt for the lens.
      </p>

      <div className="mt-8">
        <BenchStatusBanner
          info={benchInfo}
          error={benchError}
          loading={benchLoading}
        />
      </div>

      <div className="mt-8 space-y-3">
        <Field
          label="Splat path"
          value={splat}
          onChange={setSplat}
          placeholder=".ply / .splat / .ksplat"
        />
        <Field
          label="Output dir"
          value={out}
          onChange={setOut}
          placeholder="destination folder"
        />
        <Field
          label="Watermark"
          value={watermark}
          onChange={setWatermark}
          placeholder="(optional)"
        />

        <div className="grid grid-cols-[120px_1fr] items-center gap-3">
          <label className="text-sm text-chrome-400">Targets</label>
          <div className="flex flex-wrap gap-3">
            {ALL.map((t) => (
              <label
                key={t}
                className="flex items-center gap-1 text-sm text-chrome-100"
              >
                <input
                  type="checkbox"
                  checked={targets.includes(t)}
                  onChange={() => toggle(t)}
                />{" "}
                {t}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-6 rounded-sm bg-chrome-100 px-5 py-2 text-sm font-medium text-warm-black-950 disabled:opacity-50"
        disabled={!splat || !out || loading || !benchInfo?.reachable}
        onClick={run}
      >
        {loading ? "exporting…" : "Export"}
      </button>

      {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

      {!benchInfo?.reachable && !benchLoading && (
        <div className="mt-4 rounded-sm border-l-4 border-amber-400 bg-warm-black-900/30 p-4 text-sm text-chrome-300">
          The bench is offline or not configured. AR export requires the desktop
          sidecar.
        </div>
      )}

      {result !== null && (
        <pre className="mt-6 max-h-80 overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 text-xs text-chrome-200">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3">
      <label className="text-sm text-chrome-400">{label}</label>
      <input
        className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
