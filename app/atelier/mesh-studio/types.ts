/**
 * app/atelier/mesh-studio/types.ts — Shared types + sidecar probe for
 * the Mesh Studio chamber.
 *
 * Extracted from mesh-studio-client.tsx (formerly 834 lines) per
 * ARCHITECTURE.md Rule 1. The probe + tab definitions live alone so
 * each tab module can import them without circular references on the
 * main client.
 */

import { createLogger } from "lib/log";

const log = createLogger("atelier:mesh-studio:probe");

export const SIDECAR_BASE = "http://127.0.0.1:8765";

export type SidecarStatus =
  | { kind: "probing" }
  | { kind: "online"; version: string; service: string }
  | { kind: "offline"; reason: string };

export async function probeSidecar(): Promise<SidecarStatus> {
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

export type TabId =
  | "overview"
  | "pixelart"
  | "palette"
  | "gallery"
  | "tools"
  | "captures"
  | "firmware";

export type TabDef = {
  id: TabId;
  label: string;
  hint: string;
  glyph: string;
};

export const TAB_DEFS: ReadonlyArray<TabDef> = [
  { id: "overview", label: "Overview", hint: "what the bench exposes", glyph: "◌" },
  { id: "pixelart", label: "Pixel Art", hint: "text → ollama → sprite", glyph: "✦" },
  { id: "palette", label: "Palette", hint: "pixelorama bridge", glyph: "◰" },
  { id: "gallery", label: "Gallery", hint: "every installed tool", glyph: "▦" },
  { id: "tools", label: "Live Tools", hint: "sidecar /tools registry", glyph: "⌘" },
  { id: "captures", label: "Captures", hint: "recent shoots", glyph: "◐" },
  { id: "firmware", label: "POV firmware", hint: "drone / wand", glyph: "⧈" },
];
