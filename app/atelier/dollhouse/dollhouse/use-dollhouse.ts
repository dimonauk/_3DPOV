"use client";

/**
 * app/atelier/dollhouse/dollhouse/use-dollhouse.ts — State machine
 * for the dollhouse composer. Owns the selection state (character,
 * outfit, action, room, mode, shot, aspect), derives the composed
 * prompt, and runs the Imagen call against the same
 * /api/ai/google/generate-image route the Imagen chamber uses.
 *
 * Extracted from dollhouse-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "lib/state/google-ai-key";

import {
  ACTIONS,
  CHARACTERS,
  MODES,
  type Mode,
  ROOMS,
  SHOTS,
  STYLE_BLOCK,
} from "./bible";
import { dataUrlToBlob, downloadFromDataUrl } from "./data-url";
import type { AspectRatio, GeneratedImage, OutputState } from "./types";

const log = createLogger("atelier:dollhouse:state");

export function useDollhouse() {
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

  return {
    charId,
    setCharId,
    character,
    outfit,
    setOutfit,
    actionId,
    setActionId,
    roomId,
    setRoomId,
    modeId,
    setModeId,
    shotId,
    setShotId,
    aspectRatio,
    setAspectRatio,
    composedPrompt,
    output,
    onGenerate,
    onDownload,
  };
}
