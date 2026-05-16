"use client";

/**
 * app/atelier/dollhouse/dollhouse-client.tsx — Dollhouse chamber UI.
 *
 * Structured prompt composer over a doll-character bible. The visitor
 * picks a character, an outfit from that character's wardrobe, an
 * action verb, a room, an aesthetic mode and a shot framing. The
 * chamber assembles a single Imagen prompt out of those fields
 * (mode-base + subject + room-lighting + cinematic style block) and
 * POSTs to `/api/ai/google/generate-image` — the same route the
 * Imagen chamber uses.
 *
 * Result is dropped into the atelier recent-outputs drawer so a
 * sibling chamber can pick it up. The bible itself is inlined below
 * (small enough to live with the client); the original lived in
 * `D:/The_Hangar/apps/prototypes/dollhouse-1/data/dollData.ts`.
 */

import { useCallback, useEffect, useId, useMemo, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "lib/state/google-ai-key";

const log = createLogger("atelier:dollhouse");

// ---- The doll bible (ported subset) ------------------------------------

type Character = {
  id: string;
  name: string;
  archetype: string;
  subject: string; // The visual descriptor that goes into the prompt.
  wardrobe: string[];
};

const CHARACTERS: Character[] = [
  {
    id: "DOLLY",
    name: "Dolly Peterson",
    archetype: "The Iron Butterfly",
    subject:
      "Miss Bears, a vintage vinyl fashion doll with glossy pink hair, articulation joints visible, beehive hairdo",
    wardrobe: [
      "Baby Blue Organza Dress",
      "Pink Angora Cardigan",
      "Black Funeral Dress",
      "Tactical Turtleneck",
    ],
  },
  {
    id: "THEO",
    name: "Mayor Theodore 'Jim' Bear",
    archetype: "The Anchor",
    subject:
      "Mayor Theo, a large stuffed teddy bear in formal civic dress, soft mohair fur, hand-stitched eyes",
    wardrobe: [
      "Red Velvet Waistcoat",
      "Mayor Sash",
      "Tweed Jacket with Patches",
      "Pajamas",
    ],
  },
  {
    id: "K17",
    name: "Unit K-17 'Kit'",
    archetype: "The Architect",
    subject:
      "Unit K-17, a small porcelain-shelled robotic kitten with exposed wire braid and faintly glowing optics",
    wardrobe: [
      "Good Girl Pinafore",
      "Naked Chassis",
      "Cyber-Goth Mesh",
      "Disguise Kit",
    ],
  },
];

type Action = { id: string; label: string; promptSuffix: string };

const ACTIONS: Action[] = [
  {
    id: "act_01",
    label: "Maintains perimeter (gardening)",
    promptSuffix:
      "holding gardening shears, aggressively pruning a rose bush",
  },
  {
    id: "act_02",
    label: "Scans for entropy (cleaning)",
    promptSuffix:
      "holding a feather duster like a baton, scanning the room intensely",
  },
  {
    id: "act_03",
    label: "Serves tea (de-escalation)",
    promptSuffix:
      "holding a silver tea tray with perfect posture, smiling too widely",
  },
  {
    id: "act_04",
    label: "Constructs the Doll (engineering)",
    promptSuffix:
      "soldering a wire into a small wooden mannequin, focused expression",
  },
  {
    id: "act_05",
    label: "System purge (weeping)",
    promptSuffix: "sitting on the floor, head in hands, weeping silently",
  },
];

type Room = {
  id: string;
  name: string;
  floor: string;
  lighting: string;
};

const ROOMS: Room[] = [
  {
    id: "B1_01",
    name: "The Workshop (The Bridge)",
    floor: "Undercroft",
    lighting: "Filament Bulb, Industrial Glare",
  },
  {
    id: "L01_02",
    name: "The Living Room (The Kill Box)",
    floor: "Stage",
    lighting: "Golden Hour Sunbeams, Dust Motes",
  },
  {
    id: "L01_04",
    name: "The Kitchen (The Lab)",
    floor: "Stage",
    lighting: "Fluorescent Strip, Sterile",
  },
  {
    id: "L02_01",
    name: "Master Bedroom (Cyber-Boudoir)",
    floor: "Quarters",
    lighting: "Neon Pink/Blue, LED Strips",
  },
];

type Mode = {
  id: "texture" | "optical" | "kinetic";
  name: string;
  base: string;
  neg: string;
};

const MODES: Mode[] = [
  {
    id: "texture",
    name: "Toycore — texture fidelity",
    base: "A photorealistic macro close-up. Visible mold lines, fingerprints on glossy surfaces, uneven mohair fur. Tactile fabric textures.",
    neg: "smooth cgi, cartoon, illustration, drawing",
  },
  {
    id: "optical",
    name: "Real world — optical physics",
    base: "Cinematic medium shot. Tilt-shift photography effect to emphasize scale. Chromatic aberration, dust motes floating in air. Sharp focus on eyes, blurred ears.",
    neg: "flat focus, digital art, vector",
  },
  {
    id: "kinetic",
    name: "Noir — kinetic weight",
    base: "High-grain 35mm film stock, Technicolor Noir palette. Sharp shadows, single-source spotlighting. Psychological thriller atmosphere.",
    neg: "bright, cheerful, low contrast, digital clean",
  },
];

type Shot = { id: string; label: string; prompt: string };

const SHOTS: Shot[] = [
  {
    id: "wide",
    label: "Wide / establishing",
    prompt: "Cinematic wide angle establishing shot",
  },
  {
    id: "medium",
    label: "Medium / portrait",
    prompt: "Medium shot, waist up, standard portrait focal length",
  },
  {
    id: "closeup",
    label: "Close-up / detail",
    prompt: "Extreme close-up macro detail, shallow depth of field",
  },
  {
    id: "overhead",
    label: "God's eye (top down)",
    prompt: "Top-down overhead view, flat lay composition",
  },
  {
    id: "low",
    label: "Hero (low angle)",
    prompt: "Low angle looking up, imposing perspective, heroic framing",
  },
];

const STYLE_BLOCK =
  "Shot on ARRI Alexa 65 with a 100mm Macro Lens, extremely shallow depth of field, soft bokeh. 1:6 Scale miniature world. Materials: Translucent Vinyl Skin with subsurface scattering, Synthetic Nylon Hair (high gloss), Dusty Mohair Fur. Photorealistic, 8k resolution, cinematic color grading --style raw";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

type GeneratedImage = { mimeType: string; dataUrl: string };

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      images: GeneratedImage[];
      durationMs: number;
      promptUsed: string;
    }
  | { kind: "error"; message: string; code?: string; retryAfterSec?: number };

// ---- Small helpers ------------------------------------------------------

function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return new Blob([], { type: "application/octet-stream" });
  const mime = m[1] ?? "application/octet-stream";
  const b64 = m[2] ?? "";
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: mime });
}

function downloadFromDataUrl(dataUrl: string, filename: string): void {
  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Component ----------------------------------------------------------

export default function DollhouseClient() {
  useActiveChamber("dollhouse");

  const [charId, setCharId] = useState<string>(CHARACTERS[0]!.id);
  const character = useMemo(
    () => CHARACTERS.find((c) => c.id === charId) ?? CHARACTERS[0]!,
    [charId],
  );
  const [outfit, setOutfit] = useState<string>(character.wardrobe[0]!);
  // When the character changes, reset the outfit to that character's first item.
  useEffect(() => {
    setOutfit(character.wardrobe[0]!);
  }, [character]);

  const [actionId, setActionId] = useState<string>(ACTIONS[0]!.id);
  const [roomId, setRoomId] = useState<string>(ROOMS[1]!.id);
  const [modeId, setModeId] = useState<Mode["id"]>("texture");
  const [shotId, setShotId] = useState<string>("medium");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");

  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const mode = useMemo(
    () => MODES.find((m) => m.id === modeId) ?? MODES[0]!,
    [modeId],
  );
  const action = useMemo(
    () => ACTIONS.find((a) => a.id === actionId) ?? ACTIONS[0]!,
    [actionId],
  );
  const room = useMemo(
    () => ROOMS.find((r) => r.id === roomId) ?? ROOMS[0]!,
    [roomId],
  );
  const shot = useMemo(
    () => SHOTS.find((s) => s.id === shotId) ?? SHOTS[0]!,
    [shotId],
  );

  const composedPrompt = useMemo(() => {
    const subject = `${character.subject} wearing ${outfit}, ${action.promptSuffix}`;
    return `${shot.prompt}. ${mode.base} of ${subject}. Setting: ${room.name}. Lighting: ${room.lighting}. ${STYLE_BLOCK}`;
  }, [character, outfit, action, room, mode, shot]);

  // Quota badge.
  const quotaMode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

  const charFieldId = useId();
  const outfitFieldId = useId();
  const actionFieldId = useId();
  const roomFieldId = useId();
  const modeFieldId = useId();
  const shotFieldId = useId();
  const aspectFieldId = useId();

  const onGenerate = useCallback(async () => {
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (visitorKey) headers["X-Visitor-Google-Key"] = visitorKey;

    const body: Record<string, unknown> = {
      prompt: composedPrompt,
      aspectRatio,
      numImages: 1,
      negativePrompt: mode.neg,
    };

    try {
      const res = await fetch("/api/ai/google/generate-image", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        let code: string | undefined;
        let retryAfterSec: number | undefined;
        try {
          const parsed = JSON.parse(text) as {
            error?: string;
            code?: string;
            retryAfterSec?: number;
          };
          if (parsed.error) message = parsed.error;
          if (parsed.code) code = parsed.code;
          if (typeof parsed.retryAfterSec === "number") {
            retryAfterSec = parsed.retryAfterSec;
          }
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        const next: OutputState = { kind: "error", message };
        if (code !== undefined) next.code = code;
        if (retryAfterSec !== undefined) next.retryAfterSec = retryAfterSec;
        setOutput(next);
        return;
      }
      const json = (await res.json()) as { images?: GeneratedImage[] };
      const images = Array.isArray(json.images) ? json.images : [];
      if (images.length === 0) {
        setOutput({
          kind: "error",
          message: "Imagen returned no images. Try a different combination.",
        });
        return;
      }
      const durationMs = Date.now() - startedAt;
      setOutput({
        kind: "ready",
        images,
        durationMs,
        promptUsed: composedPrompt,
      });

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      images.forEach((img, i) => {
        const blob = dataUrlToBlob(img.dataUrl);
        const blobUrl = URL.createObjectURL(blob);
        pushAtelierOutput({
          chamberSlug: "dollhouse",
          kind: "image",
          label: `dollhouse-${character.id.toLowerCase()}-${stamp}-${i + 1}.png`,
          blobUrl,
          mimeType: img.mimeType,
          sizeBytes: blob.size,
        });
      });
    } catch (err) {
      log.error("generate failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [aspectRatio, character.id, composedPrompt, mode.neg]);

  const onDownload = useCallback(
    (dataUrl: string, i: number) => {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadFromDataUrl(
        dataUrl,
        `dollhouse-${character.id.toLowerCase()}-${stamp}-${i + 1}.png`,
      );
    },
    [character.id],
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header row: quota mode badge + settings gear */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Quota:{" "}
          <span className="text-chrome-100">
            {quotaMode === "byo" && hasKey
              ? "your AI Studio key"
              : "studio (5/hr)"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          aria-label="Open Google AI quota settings"
        >
          ⚙ Settings
        </button>
      </section>

      {/* Composer grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5" htmlFor={charFieldId}>
          <span className="chrome-label text-chrome-400">Character</span>
          <select
            id={charFieldId}
            value={charId}
            onChange={(e) => setCharId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} &middot; {c.archetype}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={outfitFieldId}>
          <span className="chrome-label text-chrome-400">Outfit</span>
          <select
            id={outfitFieldId}
            value={outfit}
            onChange={(e) => setOutfit(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {character.wardrobe.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={actionFieldId}>
          <span className="chrome-label text-chrome-400">Action</span>
          <select
            id={actionFieldId}
            value={actionId}
            onChange={(e) => setActionId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={roomFieldId}>
          <span className="chrome-label text-chrome-400">Room</span>
          <select
            id={roomFieldId}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {ROOMS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.floor} &middot; {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={modeFieldId}>
          <span className="chrome-label text-chrome-400">Aesthetic mode</span>
          <select
            id={modeFieldId}
            value={modeId}
            onChange={(e) => setModeId(e.target.value as Mode["id"])}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={shotFieldId}>
          <span className="chrome-label text-chrome-400">Shot framing</span>
          <select
            id={shotFieldId}
            value={shotId}
            onChange={(e) => setShotId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {SHOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label
          className="flex flex-col gap-1.5 md:col-span-2"
          htmlFor={aspectFieldId}
        >
          <span className="chrome-label text-chrome-400">Aspect ratio</span>
          <select
            id={aspectFieldId}
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            <option value="16:9">16:9 &middot; cinematic</option>
            <option value="4:3">4:3 &middot; classic</option>
            <option value="1:1">1:1 &middot; square</option>
            <option value="9:16">9:16 &middot; mobile</option>
            <option value="3:4">3:4 &middot; book</option>
          </select>
        </label>
      </section>

      {/* Composed prompt preview */}
      <section className="flex flex-col gap-2">
        <span className="chrome-label text-chrome-400">Composed prompt</span>
        <pre className="overflow-auto rounded-sm border border-warm-black-700 bg-warm-black-950 p-3 text-xs leading-relaxed whitespace-pre-wrap text-chrome-200">
          {composedPrompt}
        </pre>
      </section>

      {/* Generate button + state */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={output.kind === "running"}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {output.kind === "running" ? "Generating…" : "→ Generate frame"}
        </button>

        {output.kind === "running" ? (
          <p className="text-xs text-chrome-400">
            Imagen typically returns in 8&ndash;20 seconds.
          </p>
        ) : null}
      </section>

      {/* Errors */}
      {output.kind === "error" ? (
        <section className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-sm text-pink-100">
          <p>{output.message}</p>
          {output.code === "no_key" ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-3 rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
            >
              Open settings
            </button>
          ) : null}
          {output.code === "studio_capped" ? (
            <p className="mt-2 text-xs text-pink-200/80">
              Cap resets in roughly{" "}
              {output.retryAfterSec
                ? `${Math.ceil(output.retryAfterSec / 60)} min`
                : "an hour"}
              . Or open settings and paste your own AI Studio key for
              unbounded use.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Result */}
      {output.kind === "ready" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="chrome-label text-chrome-400">
              Ready &middot; {output.images.length} frame &middot;{" "}
              {(output.durationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {output.images.map((img, i) => (
              <figure
                key={`${img.mimeType}-${i}`}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={`Dollhouse result ${i + 1}`}
                  className="w-full rounded-sm"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                    {img.mimeType}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDownload(img.dataUrl, i)}
                    className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:bg-pink-200/20"
                  >
                    Download
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-chrome-500">
            Dropped into the recent-outputs drawer at the bottom-right
            of the page; a sibling chamber that accepts an image input
            can pick it up.
          </p>
        </section>
      ) : null}

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
