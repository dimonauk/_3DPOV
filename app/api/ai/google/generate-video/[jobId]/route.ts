/**
 * app/api/ai/google/generate-video/[jobId]/route.ts — Veo 3 poll handler.
 *
 * The matching POST at `../route.ts` kicked off a long-running
 * operation and handed back `jobId` (Google's operation name). This
 * route polls that operation and, when it's done, returns the video
 * bytes inline as a base64 data URL.
 *
 * # Auth posture
 *
 * Same key as the start call — visitor BYO key wins, otherwise the
 * studio key. The visitor key must match the start request's key for
 * the operation to be readable (operations are project-scoped).
 *
 * # Why inline bytes
 *
 * Veo's response contains a base64-encoded video blob (typically
 * mp4, ~2-8 MB for a few seconds). Inlining as a data URL keeps the
 * route storage-free; the client immediately blobs it and stashes the
 * blob URL in the atelier slice. Larger productions (multi-minute,
 * batched) would need a Drive/Blob landing — that's a follow-up.
 *
 * # Response
 *
 *   { done: true,  status: "ready",  videos: [{ mimeType, dataUrl }] }
 *   { done: false, status: "running" }
 *   { done: true,  status: "error",   error: string }
 */

import { NextResponse } from "next/server";

import { GoogleGenAI, type GenerateVideosOperation } from "@google/genai";

import { googleGenApiKey } from "lib/env";
import { createLogger } from "lib/log";

const log = createLogger("api:ai-google-veo-poll");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { jobId: string };

export async function GET(
  req: Request,
  ctx: { params: Promise<Params> },
) {
  const { jobId: jobIdRaw } = await ctx.params;
  const jobId = decodeURIComponent(jobIdRaw ?? "");
  if (jobId.length === 0) {
    return NextResponse.json(
      { error: "jobId is required" },
      { status: 400 },
    );
  }

  const visitorKey = req.headers.get("X-Visitor-Google-Key") ?? null;
  const usingVisitorKey = visitorKey !== null && visitorKey.trim().length > 0;
  const apiKey = usingVisitorKey ? visitorKey.trim() : googleGenApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No Google AI key configured. The poll needs the same key the start request used.",
        code: "no_key",
      },
      { status: 503 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let operation;
  try {
    // The SDK types the parameter as a full GenerateVideosOperation
    // class instance (which has a private `_fromAPIResponse` method);
    // in practice the only field consulted is `name`, so cast a thin
    // object through.
    operation = await ai.operations.getVideosOperation({
      operation: { name: jobId } as unknown as GenerateVideosOperation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("veo poll failed", { err: message, jobId, usingVisitorKey });
    return NextResponse.json(
      {
        error: `Veo poll failed: ${message}`,
        code: "upstream_failed",
      },
      { status: 502 },
    );
  }

  if (!operation?.done) {
    return NextResponse.json({ done: false, status: "running" });
  }

  if (operation.error) {
    const errMessage =
      typeof operation.error.message === "string"
        ? operation.error.message
        : "Veo operation reported an error.";
    log.warn("veo operation error", {
      jobId,
      err: errMessage,
    });
    return NextResponse.json({
      done: true,
      status: "error",
      error: errMessage,
    });
  }

  const generated = operation.response?.generatedVideos ?? [];
  const videos: Array<{ mimeType: string; dataUrl: string }> = [];
  for (const g of generated) {
    const bytes = g.video?.videoBytes;
    if (!bytes) continue;
    const mimeType = g.video?.mimeType ?? "video/mp4";
    // `videoBytes` from @google/genai is already base64-encoded — wrap
    // straight into a data URL, no re-encode.
    videos.push({
      mimeType,
      dataUrl: `data:${mimeType};base64,${bytes}`,
    });
  }

  if (videos.length === 0) {
    log.warn("veo done but no video bytes", { jobId });
    return NextResponse.json({
      done: true,
      status: "error",
      error:
        "Veo finished but returned no video bytes — usually a safety filter caught it.",
    });
  }

  log.info("veo done", { jobId, count: videos.length, usingVisitorKey });

  return NextResponse.json({
    done: true,
    status: "ready",
    videos,
  });
}
