/**
 * app/api/atelier/sculpture-gallery/image-to-glb/route.ts
 *
 * Sculpture-gallery operator route. Multipart POST with an `image`
 * field; the route uploads the bytes to the Hangar's ComfyUI bench
 * (POST /upload/image), then dispatches the `hunyuan3d-2mv-turbo`
 * workflow via `comfyUIGenerateServer`, overriding node "2" (LoadImage)
 * to reference the uploaded filename and node "5" (Hunyuan3dImageTo3D)
 * with a randomised seed so each run is non-deterministic. Returns a
 * shape the sculpture-gallery client renders in <model-viewer>.
 *
 * # Auth posture
 * Operator-only via the shared Firebase admin guard (matches
 * /api/admin/import/* and the image-to-3d operator route).
 *
 * # Timing
 * Hunyuan3D-2mv-turbo finishes in ~53 s on the bench's 3080 Ti. Vercel
 * function timeout is bumped to 300 s for headroom on cold GPU starts.
 */

import "server-only";

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

const log = createLogger("atelier:sculpture-gallery:image-to-glb");

const COMFYUI_SERVICE_URL =
  process.env["COMFYUI_SERVICE_URL"] ?? "http://localhost:8188";
const COMFYUI_AUTH_TOKEN = process.env["COMFYUI_AUTH_TOKEN"] ?? "";

function authHeaders(): Record<string, string> {
  return COMFYUI_AUTH_TOKEN
    ? { Authorization: `Bearer ${COMFYUI_AUTH_TOKEN}` }
    : {};
}

function isComfyUIError(err: unknown): err is ComfyUIGenerateError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

/**
 * POST the raw image bytes to ComfyUI's `/upload/image` endpoint.
 * Returns the filename ComfyUI assigned (typically equal to the
 * uploaded `name`, but the bench may rename on collision). The
 * subfolder is empty by default — files land directly under
 * `ComfyUI/input/`.
 */
async function uploadImageToComfyUI(
  bytes: Uint8Array,
  filename: string,
  mimeType: string,
): Promise<{ name: string; subfolder: string }> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  form.append("image", blob, filename);
  form.append("overwrite", "true");
  const res = await fetch(`${COMFYUI_SERVICE_URL}/upload/image`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ComfyUI /upload/image rejected: ${res.status} ${res.statusText} ${detail}`,
    );
  }
  const body = (await res.json()) as {
    name?: string;
    subfolder?: string;
    type?: string;
  };
  return {
    name: body.name ?? filename,
    subfolder: body.subfolder ?? "",
  };
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'image' field." },
      { status: 400 },
    );
  }

  const filename =
    "name" in file && typeof (file as File).name === "string"
      ? (file as File).name
      : "input.png";
  const mimeType = file.type || "image/png";
  const bytes = new Uint8Array(await file.arrayBuffer());

  log.info("dispatch", {
    uploadedBy: admin.uid,
    bytes: bytes.byteLength,
    filename,
    mimeType,
  });

  try {
    // 1. Stage the source image inside ComfyUI's input folder so the
    //    workflow's LoadImage node can read it. `/upload/image` is the
    //    bench's built-in multipart upload — no plugin required.
    const uploaded = await uploadImageToComfyUI(bytes, filename, mimeType);
    // ComfyUI's LoadImage expects either "name" or "subfolder/name"
    // (relative to ComfyUI/input/). When subfolder is empty, just pass
    // the bare filename.
    const refName = uploaded.subfolder
      ? `${uploaded.subfolder}/${uploaded.name}`
      : uploaded.name;

    log.info("comfyui upload ok", { refName });

    // 2. Dispatch hunyuan3d-2mv-turbo. The workflow's LoadImage node
    //    "2" gets the uploaded filename; the Hunyuan3dImageTo3D node
    //    "5" is NOT a KSampler so the server's auto-seed-mutation
    //    doesn't fire — we pass an explicit per-call seed so each
    //    generation is non-deterministic.
    const seed = Math.floor(Math.random() * 2 ** 32);
    const result = await comfyUIGenerateServer(
      {
        workflow: "hunyuan3d-2mv-turbo",
        // Prompt is metadata-only for Hunyuan3D (it conditions on the
        // image, not text). Recorded in `sourceRef.comfyui.prompt`.
        prompt: `image-to-glb from ${filename}`,
        params: {
          "2": { image: refName },
          "5": { seed },
        },
      },
      { uploadedBy: admin.uid },
    );

    log.info("generation complete", {
      mediaId: (result.meta?.["mediaId"] as string) ?? null,
      bytes: result.bytes,
      durationSeconds: result.meta?.["durationSeconds"] ?? null,
    });

    return NextResponse.json({
      glbUrl: result.url,
      glbBytes: result.bytes,
      generatedAt: result.generatedAt,
      meta: result.meta,
    });
  } catch (err) {
    if (isComfyUIError(err)) {
      const status =
        err.code === "service-unavailable"
          ? 503
          : err.code === "workflow-unknown"
            ? 500
            : err.code === "queue-rejected"
              ? 502
              : err.code === "output-missing"
                ? 502
                : err.code === "blob-write-failed"
                  ? 500
                  : 500;
      log.warn("comfyui error", { code: err.code, message: err.message });
      return NextResponse.json(
        { error: err.message, code: err.code },
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
