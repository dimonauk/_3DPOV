"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge/use-hdri.ts — HDRI
 * generation hook for the waveguide chamber. Posts the operator's
 * prompt to /api/atelier/waveguide-forge/generate-hdri (admin-guarded
 * passthrough to ComfyUI's flux-equirect-lora-v3 workflow), maps the
 * capability's typed error codes to plain-English copy, drops the
 * result into the chamber outputs drawer.
 *
 * Extracted from waveguide-forge-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useCallback, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { createLogger } from "lib/log";
import { pushAtelierOutput } from "lib/state/atelier-hooks";

const log = createLogger("atelier:waveguide-forge:hdri");

export function useHdri() {
  const { user } = useAuth();
  const [hdriPrompt, setHdriPrompt] = useState("");
  const [hdriUrl, setHdriUrl] = useState<string | null>(null);
  const [hdriBusy, setHdriBusy] = useState(false);
  const [hdriErr, setHdriErr] = useState<string | null>(null);

  const onGenerateHdri = useCallback(async () => {
    const prompt = hdriPrompt.trim();
    if (!prompt) {
      setHdriErr("Type a short prompt first.");
      return;
    }
    if (!user) {
      setHdriErr(
        "Sign in as an operator first — the bench is admin-guarded.",
      );
      return;
    }
    setHdriErr(null);
    setHdriBusy(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        "/api/atelier/waveguide-forge/generate-hdri",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ prompt }),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok || !body.url) {
        // Map the capability's typed codes to plain-English copy.
        let detail = body.error ?? `HTTP ${res.status}`;
        if (body.code === "service-unavailable") {
          detail =
            "ComfyUI is offline — start the bench at port 8188 (or check the Tailscale tunnel).";
        } else if (body.code === "queue-rejected") {
          detail =
            "The bench rejected the workflow — usually the Flux equirect model isn't loaded.";
        } else if (body.code === "execution-failed") {
          detail = "ComfyUI choked mid-render — check the bench logs.";
        } else if (body.code === "output-missing") {
          detail = "The bench finished but produced no image.";
        } else if (body.code === "blob-write-failed") {
          detail =
            "Couldn't park the result in Vercel Blob — check BLOB_READ_WRITE_TOKEN.";
        } else if (res.status === 401 || res.status === 403) {
          detail =
            "Operator allow-list rejected the request — sign in with the studio account.";
        }
        throw new Error(detail);
      }
      const url = body.url;
      setHdriUrl(url);
      pushAtelierOutput({
        chamberSlug: "waveguide-forge",
        kind: "image",
        label: `HDRI · ${prompt.slice(0, 48)}${prompt.length > 48 ? "…" : ""}`,
        blobUrl: url,
        mimeType: "image/png",
      });
      log.info("hdri ready", { promptPreview: prompt.slice(0, 40) });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation failed.";
      log.warn("hdri generation failed", { err });
      setHdriErr(message);
    } finally {
      setHdriBusy(false);
    }
  }, [hdriPrompt, user]);

  return {
    hdriPrompt,
    setHdriPrompt,
    hdriUrl,
    setHdriUrl,
    hdriBusy,
    hdriErr,
    onGenerateHdri,
  };
}
