"use client";

/**
 * app/atelier/mesh-studio/mesh-studio-client.tsx — Mesh Studio chamber.
 *
 * Ports the bench-side Toolbox shell from
 * `apps/holoflow-mesh-studio/src/features/toolbox/Toolbox.tsx`. The
 * Toolbox is a multi-tool surface with a left-rail of sub-tabs and a
 * per-tab content panel. In the bench app each tab queries the local
 * FastAPI sidecar at 127.0.0.1:8765 for live data; on the public site
 * that sidecar isn't reachable, so each tab probes once on mount and
 * falls through to a read-only catalogue if the probe fails.
 *
 * The chamber doesn't try to bring across every feature of the source
 * app (Light Forge, Compute Lab, Studio genome loop — each is its own
 * surface). It brings the Toolbox, because that's the inventory + the
 * generator + the round-trip bench-to-print surface, all in one place.
 *
 * Sub-tabs are React state, not separate routes. They live in
 * `TAB_DEFS` below.
 */

import { useEffect, useMemo, useState } from "react";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:mesh-studio");

// ---------------------------------------------------------------------------
// Sidecar probe
// ---------------------------------------------------------------------------

const SIDECAR_BASE = "http://127.0.0.1:8765";

type SidecarStatus =
  | { kind: "probing" }
  | { kind: "online"; version: string; service: string }
  | { kind: "offline"; reason: string };

async function probeSidecar(): Promise<SidecarStatus> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${SIDECAR_BASE}/status`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return { kind: "offline", reason: `HTTP ${res.status}` };
    const data = (await res.json()) as { service?: string; version?: string };
    return {
      kind: "online",
      version: data.version ?? "?",
      service: data.service ?? "holoflow-services",
    };
  } catch (err) {
    log.info("sidecar probe failed", { err: String(err) });
    return { kind: "offline", reason: "unreachable" };
  }
}

// ---------------------------------------------------------------------------
// Sub-tab definitions
// ---------------------------------------------------------------------------

type TabId =
  | "overview"
  | "pixelart"
  | "palette"
  | "gallery"
  | "tools"
  | "captures"
  | "firmware";

type TabDef = {
  id: TabId;
  label: string;
  hint: string;
  glyph: string;
};

const TAB_DEFS: ReadonlyArray<TabDef> = [
  { id: "overview", label: "Overview", hint: "what the bench exposes", glyph: "◌" },
  { id: "pixelart", label: "Pixel Art", hint: "text → ollama → sprite", glyph: "✦" },
  { id: "palette", label: "Palette", hint: "pixelorama bridge", glyph: "◰" },
  { id: "gallery", label: "Gallery", hint: "every installed tool", glyph: "▦" },
  { id: "tools", label: "Live Tools", hint: "sidecar /tools registry", glyph: "⌘" },
  { id: "captures", label: "Captures", hint: "recent shoots", glyph: "◐" },
  { id: "firmware", label: "POV firmware", hint: "drone / wand", glyph: "⧈" },
];

// ---------------------------------------------------------------------------
// Top-level client
// ---------------------------------------------------------------------------

export default function MeshStudioClient() {
  useActiveChamber("mesh-studio");

  const [tab, setTab] = useState<TabId>("overview");
  const [status, setStatus] = useState<SidecarStatus>({ kind: "probing" });

  useEffect(() => {
    let cancelled = false;
    probeSidecar().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 text-chrome-200">
      <SidecarBar status={status} />

      <div className="flex flex-col md:flex-row">
        {/* Left sub-tab rail */}
        <nav className="flex-none border-b border-warm-black-800 p-3 md:w-56 md:border-b-0 md:border-r">
          <div className="chrome-label mb-2 text-chrome-400">Toolbox</div>
          <div className="flex flex-row flex-wrap gap-1 md:flex-col">
            {TAB_DEFS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-start gap-2 rounded-sm border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-pink-200/60 bg-pink-200/10 text-pink-100"
                      : "border-transparent text-chrome-400 hover:border-warm-black-700 hover:bg-warm-black-900"
                  }`}
                >
                  <span className="font-mono text-sm leading-tight">{t.glyph}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium leading-tight text-chrome-100">
                      {t.label}
                    </span>
                    <span className="block text-[10px] leading-snug text-chrome-400">
                      {t.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active tab content */}
        <section className="min-h-[520px] flex-1 p-5">
          {tab === "overview" && <OverviewTab status={status} />}
          {tab === "pixelart" && <PixelArtTab status={status} />}
          {tab === "palette" && <PaletteTab status={status} />}
          {tab === "gallery" && <GalleryTab />}
          {tab === "tools" && <ToolsTab status={status} />}
          {tab === "captures" && <CapturesTab status={status} />}
          {tab === "firmware" && <FirmwareTab status={status} />}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared chrome — sidecar status pill across the top
// ---------------------------------------------------------------------------

function SidecarBar({ status }: { status: SidecarStatus }) {
  const tone =
    status.kind === "online"
      ? "border-emerald-400/30 bg-emerald-900/10 text-emerald-200"
      : status.kind === "offline"
        ? "border-warm-black-700 bg-warm-black-900 text-chrome-400"
        : "border-warm-black-700 bg-warm-black-900 text-chrome-400";
  const label =
    status.kind === "online"
      ? `sidecar online · ${status.service} v${status.version}`
      : status.kind === "offline"
        ? `sidecar offline · ${status.reason} · read-only catalogue`
        : "probing sidecar…";
  return (
    <div className={`flex items-center justify-between border-b px-4 py-2 ${tone}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{label}</span>
      <span className="font-mono text-[10px] tracking-wider text-chrome-500">
        {SIDECAR_BASE}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-2xl text-chrome-100">What the workshop holds</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Six surfaces, one bench. Each surface is a sub-tab on the
          left. The same Toolbox runs on the studio&rsquo;s
          machine at port 5138; this chamber mirrors the layout so a
          visitor can read the inventory of installed tools, the
          generator forms, and the round-trip flow even when the
          sidecar is asleep.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {TAB_DEFS.filter((t) => t.id !== "overview").map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-4"
          >
            <span className="font-mono text-lg leading-none text-pink-200">{t.glyph}</span>
            <div className="min-w-0">
              <dt className="text-sm text-chrome-100">{t.label}</dt>
              <dd className="mt-1 text-xs text-chrome-400">{t.hint}</dd>
            </div>
          </div>
        ))}
      </dl>

      {status.kind === "offline" ? (
        <aside className="rounded-sm border border-warm-black-700 bg-warm-black-900 p-4 text-xs text-chrome-400">
          <p className="text-chrome-200">Want the live surface?</p>
          <p className="mt-1">
            Start the sidecar on the bench:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 font-mono text-[11px] text-emerald-200">
{`cd D:\\The_Hangar\\engines\\holoflow-services
.\\start.bat`}
          </pre>
          <p className="mt-2">
            First run: <code className="font-mono text-chrome-200">pip install -r requirements.txt</code> first.
          </p>
        </aside>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pixel art tab — the Ollama → spritesheet generator (ported form)
// ---------------------------------------------------------------------------

const SIZE_OPTIONS = [8, 12, 16, 24, 32];
const FRAME_OPTIONS = [1, 2, 4, 6, 8, 12, 16, 24, 32];

function PixelArtTab({ status }: { status: SidecarStatus }) {
  const [subject, setSubject] = useState("");
  const [frames, setFrames] = useState(1);
  const [size, setSize] = useState(16);
  const [paletteName] = useState("holoflow-8");
  const [gifFps, setGifFps] = useState(8);
  const [openInPixelorama, setOpenInPixelorama] = useState(false);
  const [extraStyle, setExtraStyle] = useState("");

  const isAnimation = frames > 1;
  const canGenerate = status.kind === "online" && subject.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-2xl text-chrome-100">Pixel Art generator</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Text in, sprite out. The bench routes the subject through a
          local Ollama model, snaps the result to a fixed palette,
          renders frames as PNG + spritesheet + animated GIF, optional
          hand-off to Pixelorama for touch-ups.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Subject &middot; what to draw
          </span>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="flickering torch flame, cute cyan robot face, witch on a broomstick"
            rows={2}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Frames</span>
            <select
              value={frames}
              onChange={(e) => setFrames(Number(e.target.value))}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
            >
              {FRAME_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "1 (single sprite)" : `${n} frames`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Canvas size</span>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
            >
              {SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} × {n} cells
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              {isAnimation ? `GIF · ${gifFps} fps` : "GIF fps (animation only)"}
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={gifFps}
              onChange={(e) => setGifFps(Number(e.target.value))}
              disabled={!isAnimation}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 disabled:opacity-30 focus:border-pink-200/60 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Palette &middot; {paletteName}
            </span>
            <div className="flex items-center gap-1.5 rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2">
              <PaletteSwatch
                colors={[
                  "#FF66CC",
                  "#FF9966",
                  "#FFCC66",
                  "#66FFAA",
                  "#66CCFF",
                  "#9966FF",
                  "#E4E4EC",
                  "#0E0E14",
                ]}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Style hint &middot; optional</span>
            <input
              type="text"
              value={extraStyle}
              onChange={(e) => setExtraStyle(e.target.value)}
              placeholder="chibi, menacing, stained glass"
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-chrome-300">
            <input
              type="checkbox"
              checked={openInPixelorama}
              onChange={(e) => setOpenInPixelorama(e.target.checked)}
              className="accent-pink-200"
            />
            Open in Pixelorama when done
          </label>
          <div className="flex-1" />
          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => log.info("pixelart generate requested", { subject, frames, size })}
            className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-50"
            title={status.kind === "online" ? undefined : "sidecar required"}
          >
            {isAnimation
              ? `→ Generate ${frames}-frame animation`
              : "→ Generate sprite"}
          </button>
        </div>

        {status.kind !== "online" ? (
          <BridgeOfflineNote
            what="pixel art bridge"
            mount="/pixelart"
            extra="bench-side path: pixelart_bridge.py mounted in main.py"
          />
        ) : null}
      </div>
    </div>
  );
}

function PaletteSwatch({ colors }: { colors: ReadonlyArray<string> }) {
  return (
    <div className="flex overflow-hidden rounded-sm border border-warm-black-800">
      {colors.map((c, i) => (
        <div
          key={`${c}-${i}`}
          className="h-7 w-5"
          style={{ background: c }}
          title={c}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Palette tab — Pixelorama bridge (ported form, simplified)
// ---------------------------------------------------------------------------

const PIXELORAMA_EXTENSIONS_PREVIEW: ReadonlyArray<{
  id: string;
  category: string;
  what: string;
  featured?: boolean;
}> = [
  {
    id: "Voxelorama",
    category: "3D",
    what: "Generate 3D voxel meshes from layered pixel art. Export to .obj for the sculpture pipeline.",
    featured: true,
  },
  {
    id: "Skeletor",
    category: "Animation",
    what: "Bone-rig pixel sprites. Hand-keyframed animation without redrawing every cell.",
    featured: true,
  },
  {
    id: "LospecPaletteImporter",
    category: "Palette",
    what: "Pull any palette from lospec.com directly into the swatches panel.",
    featured: true,
  },
  { id: "PixelLab", category: "Filter", what: "Procedural pixel art filters: outlines, dithering presets, palette snap." },
  { id: "FrameTagger", category: "Animation", what: "Name + colour-code frame ranges for cleaner export." },
  { id: "TileEditor", category: "Tiles", what: "Auto-tile mode for terrain sprites." },
  { id: "AsepriteImport", category: "I/O", what: "Read .aseprite files directly." },
  { id: "PNG-strip-split", category: "I/O", what: "Split horizontal spritesheets into one PNG per frame." },
];

function PaletteTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-2xl text-chrome-100">Pixelorama bridge</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Send sprites from the studio into Pixelorama for touch-ups,
          send them through Voxelorama for layered-pixel-to-mesh, pick
          up the resulting .obj on the way back. The bridge watches two
          folders &mdash; one outgoing (sprites pending), one incoming
          (exports waiting).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Installed" value={status.kind === "online" ? "yes" : "—"} accent={status.kind === "online" ? "good" : undefined} />
        <StatCard label="Extensions" value={String(PIXELORAMA_EXTENSIONS_PREVIEW.length) + "+"} />
        <StatCard label="Sprites pending" value="—" />
        <StatCard label="Exports waiting" value="—" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={status.kind !== "online"}
          onClick={() => log.info("pixelorama launch requested")}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
        >
          ▶ Launch Pixelorama
        </button>
        <button
          type="button"
          disabled={status.kind !== "online"}
          onClick={() => log.info("send sprite requested")}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
        >
          ↗ Send current sprite
        </button>
      </div>

      <section>
        <h3 className="chrome-label mb-3 border-b border-warm-black-800 pb-2 text-chrome-400">
          Featured extensions
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {PIXELORAMA_EXTENSIONS_PREVIEW.map((x) => (
            <div
              key={x.id}
              className={`rounded-sm border p-3 ${
                x.featured
                  ? "border-pink-200/40 bg-pink-200/5"
                  : "border-warm-black-800 bg-warm-black-900/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${x.featured ? "text-pink-100" : "text-chrome-100"}`}
                >
                  {x.id}
                </span>
                <span className="ml-auto rounded-sm border border-warm-black-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-chrome-500">
                  {x.category}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-chrome-400">{x.what}</p>
            </div>
          ))}
        </div>
      </section>

      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="pixelorama bridge"
          mount="/pixelorama"
          extra="bench-side path: pixelorama_bridge.py mounted in main.py"
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery tab — static inventory of every installed tool
// ---------------------------------------------------------------------------

const STATIC_INVENTORY: ReadonlyArray<{
  category: string;
  items: ReadonlyArray<{ name: string; what: string; path: string }>;
}> = [
  {
    category: "Pixel art pipeline",
    items: [
      { name: "pixeldetector", what: "Detect grid-aligned pixel art", path: "D:\\The_Hangar\\tools\\pixeldetector" },
      { name: "Image-to-Pixel", what: "Convert any image to pixel art", path: "D:\\The_Hangar\\tools\\Image-to-Pixel" },
      { name: "ComfyUI-PixelArt-Detector", what: "ComfyUI custom node for sprite output", path: "engines\\comfyui\\custom_nodes\\ComfyUI-PixelArt-Detector" },
    ],
  },
  {
    category: "3D / mesh",
    items: [
      { name: "voxel2mesh", what: "Voxel grid → mesh", path: "tools\\voxel2mesh" },
      { name: "mesh-voxelization", what: "Mesh → voxel grid", path: "tools\\mesh-voxelization" },
      { name: "nii2mesh", what: "NIfTI volume → mesh + niimath QEM", path: "tools\\nii2mesh" },
      { name: "softxels", what: "Soft voxel physics", path: "tools\\softxels" },
      { name: "webgpu-marching-cubes", what: "GPU-accelerated marching cubes", path: "tools\\webgpu-marching-cubes" },
      { name: "lithophane", what: "Image → relief STL (used by the lithophane chamber)", path: "tools\\lithophane" },
      { name: "image-to-stl", what: "Alt image-to-STL pipeline", path: "tools\\image-to-stl" },
    ],
  },
  {
    category: "Image AI",
    items: [
      { name: "InstantMesh", what: "Image → 3D mesh (alt to TRELLIS)", path: "tools\\InstantMesh" },
      { name: "Unique3D", what: "Image → 3D (mesh + texture)", path: "tools\\Unique3D" },
      { name: "AutoSeg-SAM2", what: "Automatic segmentation with SAM2", path: "tools\\AutoSeg-SAM2" },
      { name: "astro-stacker", what: "Star trail / starscape image stacking", path: "tools\\astro-stacker" },
    ],
  },
  {
    category: "Audio reactivity",
    items: [
      { name: "aubio-beat-osc", what: "Aubio beat → OSC (for live LED sync)", path: "tools\\aubio-beat-osc" },
      { name: "audio-reactive-led-strip", what: "FFT → LED strip in real time", path: "tools\\audio-reactive-led-strip" },
    ],
  },
  {
    category: "Drone show",
    items: [
      { name: "skybrush-server", what: "Drone formation server", path: "drone_show\\skybrush-server" },
      { name: "studio-blender", what: "Blender plugin for choreographing drone shows", path: "drone_show\\studio-blender" },
    ],
  },
  {
    category: "POV firmware",
    items: [
      { name: "ImagePainting", what: "BMP → POV LED stick firmware", path: "firmware\\drone_pov\\ImagePainting" },
      { name: "Lightpainter2", what: "POV light painting firmware (v2)", path: "firmware\\drone_pov\\Lightpainter2" },
      { name: "pov-library", what: "POV core library", path: "firmware\\drone_pov\\pov-library" },
      { name: "light-stick", what: "Generic light stick firmware", path: "firmware\\drone_pov\\light-stick" },
      { name: "LumiFur_Controller", what: "Drone LED controller", path: "firmware\\drone_pov\\LumiFur_Controller" },
    ],
  },
  {
    category: "AI 3D — ComfyUI nodes",
    items: [
      { name: "ComfyUI-3D-Pack", what: "Meta-suite for TRELLIS / Hunyuan / TripoSG", path: "engines\\comfyui\\custom_nodes\\ComfyUI-3D-Pack" },
      { name: "ComfyUI-TRELLIS2", what: "Dedicated TRELLIS.2 wrapper", path: "engines\\comfyui\\custom_nodes\\ComfyUI-TRELLIS2" },
    ],
  },
];

function GalleryTab() {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return STATIC_INVENTORY;
    return STATIC_INVENTORY.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.what.toLowerCase().includes(q) ||
          i.path.toLowerCase().includes(q),
      ),
    })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl text-chrome-100">Hangar inventory</h2>
          <p className="mt-2 max-w-2xl text-sm text-chrome-400">
            Every tool installed on the bench, categorised. The paths
            are local to the studio rig; useful if you&rsquo;ve cloned
            the same monorepo and want to find where a tool lives.
          </p>
        </div>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter…"
          className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none md:w-64"
        />
      </header>

      {filtered.map((group) => (
        <section key={group.category}>
          <h3 className="chrome-label mb-3 border-b border-warm-black-800 pb-2 text-chrome-400">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {group.items.map((item) => (
              <div
                key={item.path}
                className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3"
              >
                <div className="text-sm text-chrome-100">{item.name}</div>
                <div className="mt-1 text-xs text-chrome-400">{item.what}</div>
                <div className="mt-1.5 truncate font-mono text-[10px] text-chrome-500">
                  {item.path}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live tools / captures / firmware — each probes the sidecar
// ---------------------------------------------------------------------------

function ToolsTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl text-chrome-100">Live tools registry</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Pulled from <code className="font-mono text-chrome-200">/tools</code> on the
          sidecar. Each entry is a one-button runner: feed it the image
          on the bench or pick a file, the sidecar runs the
          corresponding Python tool, the result lands as a download.
        </p>
      </header>
      <ToolRegistryPreview />
      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="tools registry"
          mount="/tools"
          extra="returns a JSON list of every Python tool the sidecar exposes"
        />
      ) : null}
    </div>
  );
}

function ToolRegistryPreview() {
  const preview: ReadonlyArray<{ id: string; name: string; what: string; endpoint: string }> = [
    { id: "lithophane", name: "Lithophane", what: "Image → relief STL", endpoint: "POST /lithophane" },
    { id: "image-segment-bg", name: "Background segment", what: "Image → alpha mask", endpoint: "POST /image-segment-bg" },
    { id: "image-extract-trails", name: "Light trails", what: "Image → trail polylines JSON", endpoint: "POST /image-extract-trails" },
    { id: "voxelize", name: "Voxelize mesh", what: "STL → voxel grid info JSON", endpoint: "POST /voxelize" },
    { id: "mesh-repair", name: "Repair mesh", what: "STL → watertight STL", endpoint: "POST /mesh-repair" },
    { id: "audio-beats", name: "Beat detect", what: "Audio → BPM + onsets JSON", endpoint: "POST /audio-beats" },
    { id: "raw-decode", name: "RAW decode", what: ".CR2/.NEF/.ARW → PNG", endpoint: "POST /raw-decode" },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {preview.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3"
        >
          <span className="h-2 w-2 flex-none rounded-full bg-chrome-500" />
          <div className="min-w-0 flex-1">
            <div className="text-sm text-chrome-100">{t.name}</div>
            <div className="mt-0.5 text-xs text-chrome-400">{t.what}</div>
            <div className="mt-1 truncate font-mono text-[10px] text-chrome-500">{t.endpoint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapturesTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl text-chrome-100">Recent captures</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          The bench keeps a flat directory of recent image / RAW shoots
          at <code className="font-mono text-chrome-200">D:\HoloFlow\projects</code>.
          When the sidecar is online this tab lists the newest 100 with
          size + modified-time + a click-through.
        </p>
      </header>
      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="captures listing"
          mount="/captures"
          extra="walks the captures dir and returns name/size/mtime"
        />
      ) : (
        <p className="text-xs text-chrome-400">
          The captures listing is wired up server-side; UI grid lands in a follow-up.
        </p>
      )}
    </div>
  );
}

function FirmwareTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl text-chrome-100">POV firmware shelves</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          The bench tracks five firmware projects for POV light wands +
          drone LEDs. Each entry is a folder under{" "}
          <code className="font-mono text-chrome-200">firmware/drone_pov/</code> with
          flags for Arduino, PlatformIO, and README presence so you can
          tell at a glance which build chain is wired.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-2">
        {[
          { name: "ImagePainting", what: "BMP → POV LED stick firmware" },
          { name: "Lightpainter2", what: "POV light painting firmware (v2)" },
          { name: "pov-library", what: "POV core library" },
          { name: "light-stick", what: "Generic light stick firmware" },
          { name: "LumiFur_Controller", what: "Drone LED controller" },
        ].map((f) => (
          <li
            key={f.name}
            className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3"
          >
            <div className="text-sm text-chrome-100">{f.name}</div>
            <div className="mt-0.5 text-xs text-chrome-400">{f.what}</div>
          </li>
        ))}
      </ul>
      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="firmware listing"
          mount="/firmware"
          extra="walks firmware/drone_pov/ and reports build-chain flags"
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  const tone =
    accent === "good"
      ? "text-emerald-200"
      : accent === "bad"
        ? "text-pink-200"
        : "text-chrome-100";
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 px-3 py-2">
      <div className="chrome-label text-chrome-500">{label}</div>
      <div className={`mt-0.5 font-mono text-sm tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function BridgeOfflineNote({
  what,
  mount,
  extra,
}: {
  what: string;
  mount: string;
  extra: string;
}) {
  return (
    <aside className="rounded-sm border border-warm-black-700 bg-warm-black-900 p-3 text-xs text-chrome-400">
      <span className="chrome-label mr-2 text-chrome-300">{what} offline</span>
      mounted at <code className="font-mono text-chrome-200">{mount}</code> on the sidecar.
      {" "}
      {extra}.
    </aside>
  );
}
