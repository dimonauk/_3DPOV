/**
 * app/api/atelier/cube-composer/generate-panorama/route.ts —
 * The cube-composer chamber's panorama-generation route.
 *
 * One-line role: admin-guarded thin wrapper around the
 * `viz.generate-comfyui` capability that submits the
 * `flux-equirect-lora-v3` workflow to the bench and returns the
 * resulting equirect image URL so the chamber can map it onto the
 * cube faces.
 *
 * Why `flux-equirect-lora-v3` over `sdxl-360-panorama`: per
 * `lib/capabilities/viz/generate-comfyui.PURPOSE.md`, the Flux LoRA v3
 * workflow is the "best 360 quality on the bench" — preferred for any
 * hero-grade backdrop. The SDXL variant stays as a fallback for callers
 * who want a smaller/faster pull, but is not exposed on this route.
 *
 * # Body
 * JSON `{ prompt: string }`.
 *
 * # Timing
 * The bench takes ~45-90s for a 4K equirect from Flux + LoRA. We bump
 * the Vercel function timeout to 300s to keep a comfortable margin for
 * cold-start + queue.
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

const log = createLogger("atelier:cube-composer:panorama");

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
        workflow: "flux-equirect-lora-v3",
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
