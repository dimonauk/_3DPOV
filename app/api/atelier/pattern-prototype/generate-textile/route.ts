/**
 * app/api/atelier/pattern-prototype/generate-textile/route.ts —
 * The pattern-prototype chamber's textile-generation route.
 *
 * One-line role: admin-guarded thin wrapper around the
 * `viz.generate-comfyui` capability that submits the `flux1-dev-fp8`
 * workflow to the bench and returns a raster image URL the chamber
 * displays as a wall-art preview + tileable backdrop.
 *
 * The sibling Gemini path on this chamber drafts an SVG pattern
 * function (vector); this path drafts a flat raster textile (Flux1-dev).
 * Same chamber, second creation mode.
 *
 * # Body
 * JSON `{ prompt: string }`.
 *
 * # Timing
 * Flux1-dev FP8 on the bench is ~10-30s for a single still. Vercel
 * function timeout bumped to 300s to cover cold-start + queue.
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import { comfyUIGenerateServer } from "lib/capabilities/viz/generate-comfyui.server";
import type { ComfyUIGenerateError } from "lib/capabilities/viz/generate-comfyui";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("atelier:pattern-prototype:textile");

function isComfyError(err: unknown): err is ComfyUIGenerateError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

export async function POST(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Expected JSON body { prompt }." },
      { status: 400 },
    );
  }

  const prompt =
    typeof payload["prompt"] === "string" ? payload["prompt"].trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing 'prompt'." }, { status: 400 });
  }

  log.info("dispatch", {
    uploadedBy: admin.uid,
    promptPreview: prompt.slice(0, 80),
  });

  try {
    const started = Date.now();
    const result = await comfyUIGenerateServer(
      {
        workflow: "flux1-dev-fp8",
        prompt,
      },
      { uploadedBy: admin.uid },
    );
    const durationMs = Date.now() - started;
    log.info("done", {
      promptId: (result.meta as { promptId?: string }).promptId,
      bytes: result.bytes,
      durationMs,
    });
    return NextResponse.json({
      url: result.url,
      bytes: result.bytes,
      generatedAt: result.generatedAt,
      durationMs,
    });
  } catch (err) {
    if (isComfyError(err)) {
      const code = err.code;
      const status =
        code === "service-unavailable"
          ? 503
          : code === "workflow-unknown"
            ? 500
            : code === "queue-rejected" || code === "execution-failed"
              ? 502
              : code === "output-missing" || code === "blob-write-failed"
                ? 500
                : 500;
      log.warn("comfy-error", { code });
      return NextResponse.json(
        { error: err.message, code },
        { status },
      );
    }
    log.error("internal error", { err });
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error.",
        code: "generation-failed",
      },
      { status: 500 },
    );
  }
}
