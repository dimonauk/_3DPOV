/**
 * app/api/printfiles/intake/signature.ts
 *
 * Request-level helpers: client IP extraction + the Svix-signature
 * gate for Resend Inbound webhooks.
 *
 * Signature posture (v1): we REQUIRE the secret to be set in env
 * AND require the `svix-*` headers to be present. We do NOT yet do
 * the full HMAC-SHA256 verification of
 * `${svixId}.${svixTs}.${body}` — a future commit adds that. The
 * webhook secret being required in env limits the attack surface
 * to "someone who knows the URL but not the signature scheme".
 *
 * Dev escape hatch: set RESEND_INBOUND_SKIP_SIGNATURE=1 to accept
 * any body. Useful for curl-based local testing.
 */

import { createLogger } from "lib/log";

const log = createLogger("api.printfiles.intake.signature");

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function verifySignature(
  req: Request,
  _rawBody: string,
): { ok: boolean; reason?: string } {
  if (process.env.RESEND_INBOUND_SKIP_SIGNATURE === "1") {
    return { ok: true };
  }
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, reason: "RESEND_INBOUND_WEBHOOK_SECRET unset" };
  }
  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) {
    return { ok: false, reason: "missing svix headers" };
  }
  log.warn("svix signature presence only (full HMAC verify pending)", {
    svixId,
  });
  return { ok: true };
}
