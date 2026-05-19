/**
 * lib/drops/sieve-gate.ts — Sieve VLM gate.
 *
 * One-line role: vision-language verdict on a genome's rendered still.
 * Asks the Sieve service "does this piece meet the studio's aesthetic
 * + safety bar?" and returns a pass/fail with one human-readable reason.
 *
 * # The Sieve runs on the bench
 *
 * Per Manifesto §07, the Sieve is a VLM service the studio runs on its
 * own GPU. It's exposed to the public Vercel deployment via a Tailscale
 * Funnel public bridge, the same pattern as the SHARP/InstantMesh
 * services. Auth is a shared bearer token (`SIEVE_BEARER_TOKEN`).
 *
 * Endpoint contract:
 *   POST {SIEVE_SERVICE_URL}/v1/sieve
 *   Authorization: Bearer ${SIEVE_BEARER_TOKEN}
 *   { genomeId: string, bakedStillUrl?: string }
 *
 * Response:
 *   { pass: true,  summary: "…clean, on-brand…" }
 *   { pass: false, summary: "…off-brand element / safety flag…" }
 *
 * # Failure modes (degraded but transparent)
 *
 * If the service is unreachable or the env isn't configured:
 *
 *   - In production (`NODE_ENV === "production"`): fail-closed. Better
 *     to block a publish than to let an unvetted piece through.
 *   - In preview / dev: fail-open with sentinel `sieve-wiring-pending`
 *     so the admin form can be exercised end-to-end. The publish flow
 *     records the sentinel so unverified pieces are findable in the
 *     audit log.
 *
 * # When the wiring lands
 *
 * Set `SIEVE_SERVICE_URL` + `SIEVE_BEARER_TOKEN` env vars. Nothing else
 * to change in this file; the contract above is the canonical shape
 * the bench-side service must implement.
 */

import "server-only";

import { createLogger } from "lib/log";

const log = createLogger("drops.sieve-gate");

type SieveResponse =
  | { pass: boolean; summary?: string; reason?: string }
  | { error: string };

export async function sieveCheck(genomeId: string): Promise<{
  pass: boolean;
  reason: string;
}> {
  const url = process.env.SIEVE_SERVICE_URL;
  const token = process.env.SIEVE_BEARER_TOKEN;
  const inProd = process.env.NODE_ENV === "production";

  if (!url || !token) {
    if (inProd) {
      log.error("Sieve env not configured in production; failing closed");
      return {
        pass: false,
        reason: "Sieve service not configured — operator must set SIEVE_SERVICE_URL + SIEVE_BEARER_TOKEN before publishing.",
      };
    }
    log.warn("Sieve env not configured; failing open with sentinel (non-prod)");
    return { pass: true, reason: "sieve-wiring-pending" };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/v1/sieve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ genomeId }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      log.error("Sieve service returned non-OK", {
        genomeId,
        status: res.status,
      });
      // Fail closed in prod, open in non-prod — same logic as the env
      // gate above. Operator log makes the cause visible either way.
      if (inProd) {
        return {
          pass: false,
          reason: `Sieve service returned ${res.status}; cannot verify.`,
        };
      }
      return { pass: true, reason: `sieve-${res.status}-skipped-non-prod` };
    }

    const body = (await res.json()) as SieveResponse;
    if ("error" in body) {
      log.error("Sieve service error envelope", { genomeId, error: body.error });
      return inProd
        ? { pass: false, reason: `Sieve error: ${body.error}` }
        : { pass: true, reason: "sieve-error-skipped-non-prod" };
    }

    const reason = body.summary ?? body.reason ?? (body.pass ? "sieve-approved" : "sieve-rejected");
    return { pass: body.pass, reason };
  } catch (err) {
    log.error("Sieve call threw", {
      genomeId,
      err: err instanceof Error ? err.message : String(err),
    });
    if (inProd) {
      return {
        pass: false,
        reason: `Sieve unreachable: ${err instanceof Error ? err.message : "unknown"}`,
      };
    }
    return { pass: true, reason: "sieve-unreachable-skipped-non-prod" };
  }
}
