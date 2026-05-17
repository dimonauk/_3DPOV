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
 * Formerly 834 lines in one file (sidecar probe + 7 tabs + 4 shared
 * widgets + static inventory). Split per ARCHITECTURE.md Rule 1:
 *
 *   types.ts            — sidecar status, tab defs, probe
 *   inventory-data.ts   — PIXELORAMA_EXTENSIONS_PREVIEW + STATIC_INVENTORY
 *   widgets.tsx         — SidecarBar, PaletteSwatch, StatCard,
 *                         BridgeOfflineNote (shared across tabs)
 *   tabs/overview.tsx   — OverviewTab
 *   tabs/pixel-art.tsx  — PixelArtTab (subject + frames + size form)
 *   tabs/palette.tsx    — PaletteTab (Pixelorama bridge UI)
 *   tabs/gallery.tsx    — GalleryTab (Hangar inventory search)
 *   tabs/tools.tsx      — ToolsTab + ToolRegistryPreview
 *   tabs/captures.tsx   — CapturesTab
 *   tabs/firmware.tsx   — FirmwareTab
 *
 * This file is now the orchestrator only: sidecar probe lifecycle,
 * active-tab state, left-rail navigation, content-panel dispatch.
 */

import { useEffect, useState } from "react";

import { useActiveChamber } from "lib/state/atelier-hooks";

import { CapturesTab } from "./tabs/captures";
import { FirmwareTab } from "./tabs/firmware";
import { GalleryTab } from "./tabs/gallery";
import { OverviewTab } from "./tabs/overview";
import { PaletteTab } from "./tabs/palette";
import { PixelArtTab } from "./tabs/pixel-art";
import { ToolsTab } from "./tabs/tools";
import {
  probeSidecar,
  TAB_DEFS,
  type SidecarStatus,
  type TabId,
} from "./types";
import { SidecarBar } from "./widgets";

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
