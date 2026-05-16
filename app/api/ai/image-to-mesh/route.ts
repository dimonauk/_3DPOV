/**
 * app/api/ai/image-to-mesh/route.ts — Visitor-facing image → 3D mesh proxy.
 *
 * Accepts multipart: `image` (file) + `provider` (string) + optional
 * `images[]` for multi-view providers (instantmesh). POSTs to the
 * bench-side wrapper via `imageToMeshServer` from the capability.
 *
 * # Auth posture
 *
 * Operator-only for now. The bench's GPU is expensive and these models
 * run for tens of seconds per call; opening to anonymous visitors
 * needs rate-limiting + quota first. `requireAdminUser` from the
 * existing google admin guard gates the route.
 *
 * # Status
 *
 * The capability `imageToMeshServer` currently throws
 * `provider-unavailable` because the bench-side wrapper isn't wired
 * yet. The route catches this and returns 503 with the documented
 * bench contract in the body — the chamber UI surfaces this as
 * "provider pending, here's what needs to land on bench".
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import {
  imageToMeshServer,
} from "lib/capabilities/viz/image-to-mesh.server";
import type {
  ImageToMeshError,
  ImageToMeshProvider,
} from "lib/capabilities/viz/image-to-mesh";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api:image-to-mesh");

const VALID_PROVIDERS: ReadonlySet<ImageToMeshProvider> = new Set([
  "triposr",
  "hy-wu",
  "unique3d",
  "instantmesh",
]);

function isImageToMeshError(err: unknown): err is ImageToMeshError {
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const providerRaw = form.get("provider");
  const provider =
    typeof providerRaw === "string" ? providerRaw : "";
  if (!VALID_PROVIDERS.has(provider as ImageToMeshProvider)) {
    return NextResponse.json(
      {
        error: `Invalid provider "${provider}". Expected one of: ${[...VALID_PROVIDERS].join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // The route accepts the file(s) but doesn't upload bytes anywhere
  // yet — the capability stub throws before reaching that step. When
  // the bench wrapper lands, the route will upload to a transient
  // Blob URL, hand the URL to imageToMeshServer, and the server side
  // does the multipart POST to the bench.
  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'image' field." },
      { status: 400 },
    );
  }

  log.info("dispatch", {
    provider,
    uploadedBy: admin.uid,
    bytes: file.size,
  });

  try {
    const record = await imageToMeshServer(
      {
        provider: provider as ImageToMeshProvider,
        source: {
          kind: "image-single",
          url: "stub://placeholder-until-bench-wrapper-lands",
        },
      },
      { uploadedBy: admin.uid },
    );
    return NextResponse.json({ record });
  } catch (err) {
    if (isImageToMeshError(err)) {
      const status =
        err.code === "provider-unavailable"
          ? 503
          : err.code === "source-invalid"
            ? 400
            : err.code === "licence-conflict"
              ? 422
              : 500;
      log.warn("provider-error", { provider, code: err.code });
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
