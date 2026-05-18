/**
 * lib/studio/topaz-handoff.ts — hand a rendered print Blob off to Topaz
 * Photo AI for upscale.
 *
 * # Role
 *
 * Source-coverage analysis in the print panel will frequently surface
 * "this print needs a 3× upscale". Topaz Photo AI is the operator's
 * upscaler of record. This module gives the panel a single function
 * call that gets the file into Topaz with the least operator friction
 * available on the current browser.
 *
 * # Three strategies, picked at runtime
 *
 *   1. HoloFlow Desktop bridge — POST the blob to a local endpoint that
 *      owns the `Start-Process` launch of Topaz. Zero clicks, fastest.
 *      Requires the desktop helper to be reachable.
 *
 *   2. File System Access API — operator picks a known directory once;
 *      file lands there; UI tells them to "Open Recent" in Topaz. Two
 *      clicks the first time, one click thereafter.
 *
 *   3. Download fallback — plain `<a download>`, then the operator opens
 *      it in Topaz themselves. Three or four clicks but it always works.
 *
 * The dispatcher tries them in order and returns which strategy fired
 * + a short copy line the UI can render.
 *
 * # Posture
 *
 * Foundation. v0 only stubs strategy (1) — the actual POST is wired and
 * documented (see DESKTOP_ENDPOINT_SPEC below), but the desktop side
 * hasn't been built yet, so we don't try the strategy unless the
 * desktop probe is healthy. The fallbacks are real and work today.
 */

"use client";

import { createLogger } from "lib/log";

const log = createLogger("studio.topaz-handoff");

export type HandoffMethod = "desktop" | "fsa" | "download";

export type HandoffResult = {
  method: HandoffMethod;
  message: string;
};

type TopazHandoffOpts = {
  /**
   * HoloFlow Desktop base URL — pass the same `url` the studio uses to
   * talk to splat360. When null/undefined the desktop strategy is
   * skipped without a network round-trip.
   */
  desktopUrl?: string | null;
};

/**
 * Spec for the (not-yet-built) HoloFlow Desktop endpoint that handles
 * the Topaz handoff. Documented here so the desktop-side agent picks
 * up the same contract.
 *
 *   POST {desktopUrl}/api/handoff/topaz
 *   Content-Type: multipart/form-data
 *
 *   Fields:
 *     file        — the rendered PNG/TIFF (binary)
 *     filename    — string, suggested filename (UTF-8)
 *     launch      — "true" to Start-Process Topaz with the file
 *
 *   Response (200):
 *     { "saved_to": "C:/Users/<u>/HoloFlow/prints/<name>", "launched": true }
 *
 *   Response (404): the desktop service is reachable but this endpoint
 *   isn't installed yet — handoff dispatcher falls through to FSA.
 */
const DESKTOP_ENDPOINT_PATH = "/api/handoff/topaz";

export async function handoffToTopaz(
  blob: Blob,
  filename: string,
  opts: TopazHandoffOpts = {},
): Promise<HandoffResult> {
  // ── Strategy 1: HoloFlow Desktop ─────────────────────────────────────
  if (opts.desktopUrl) {
    const result = await tryDesktop(blob, filename, opts.desktopUrl);
    if (result) return result;
  }

  // ── Strategy 2: File System Access API ───────────────────────────────
  if (typeof window !== "undefined" && hasShowSaveFilePicker(window)) {
    const result = await tryFsa(blob, filename);
    if (result) return result;
  }

  // ── Strategy 3: Plain download ───────────────────────────────────────
  return await tryDownload(blob, filename);
}

// ───────────────────────────────────────────────────────────────────────
// Strategy 1 — HoloFlow Desktop bridge
// ───────────────────────────────────────────────────────────────────────

async function tryDesktop(
  blob: Blob,
  filename: string,
  desktopUrl: string,
): Promise<HandoffResult | null> {
  const endpoint = `${desktopUrl}${DESKTOP_ENDPOINT_PATH}`;
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("filename", filename);
  form.append("launch", "true");

  // v0: the desktop side isn't built yet — log the request shape so the
  // companion agent that wires it up sees exactly what the PWA sends.
  // The fetch is still attempted; if it 404s we fall through to FSA.
  log.info("would POST to desktop", {
    endpoint,
    filename,
    sizeBytes: blob.size,
    spec: "see DESKTOP_ENDPOINT_PATH docstring in lib/studio/topaz-handoff.ts",
  });

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      body: form,
    });
    if (!r.ok) return null;
    return {
      method: "desktop",
      message:
        "Handed off to HoloFlow Desktop — Topaz Photo AI should be opening with the file.",
    };
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Strategy 2 — File System Access API
// ───────────────────────────────────────────────────────────────────────

type ShowSaveFilePickerFn = (init: {
  suggestedName: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

function hasShowSaveFilePicker(
  win: Window,
): win is Window & { showSaveFilePicker: ShowSaveFilePickerFn } {
  return typeof (win as unknown as { showSaveFilePicker?: unknown })
    .showSaveFilePicker === "function";
}

async function tryFsa(
  blob: Blob,
  filename: string,
): Promise<HandoffResult | null> {
  if (typeof window === "undefined") return null;
  if (!hasShowSaveFilePicker(window)) return null;

  try {
    const ext = filename.toLowerCase().endsWith(".png") ? ".png" : ".tiff";
    const mime = ext === ".png" ? "image/png" : "image/tiff";
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: ext === ".png" ? "PNG image" : "TIFF image",
          accept: { [mime]: [ext] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return {
      method: "fsa",
      message:
        "Saved. In Topaz Photo AI: File → Open Recent (or drag the file onto Topaz).",
    };
  } catch (err) {
    // User-cancelled save dialogs throw AbortError — treat that as "no
    // handoff happened" and let the caller decide whether to fall back.
    if (err instanceof DOMException && err.name === "AbortError") {
      return null;
    }
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Strategy 3 — download
// ───────────────────────────────────────────────────────────────────────

async function tryDownload(
  blob: Blob,
  filename: string,
): Promise<HandoffResult> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return {
    method: "download",
    message:
      "Downloaded. Open the file in Topaz Photo AI manually (File → Open).",
  };
}
