/**
 * lib/drops/oracle-gate.ts — Printability Oracle gate for drops.
 *
 * One-line role: given a genomeId, return a pass/fail verdict that the
 * publish flow can use to block drops whose underlying piece can't
 * physically print. Wraps the existing
 * `lib/capabilities/image/print-check.ts` capability.
 *
 * # Why this gate is mandatory
 *
 * The Manifesto's commerce loop terminates in a physical artefact —
 * a fine-art print on the Canon imagePROGRAF PRO-1100 + a fabricated
 * sculpture from the Hangar bench. If the genome's rendered mesh /
 * still cannot meet the bureau's minimum print verdict, publishing
 * the drop would burn buyer trust the first time fabrication fails.
 * The gate is mandatory at publish time, not at order time.
 *
 * # Source of truth
 *
 * The bureau's print-check capability operates on a buffer
 * (`printCheckFromBuffer` in `print-check.server.ts`) or on Drive
 * metadata (`printCheckFromDriveMeta` in `print-check.ts`). The oracle
 * gate at the drop level wants the verdict for the genome's baked
 * still — which lives on the genome record at `bakedStillUrl` (path
 * convention: `gs://holoflow-baked/{genomeId}/still.png`).
 *
 * The lookup is not yet wired — genome records on Firestore today
 * don't carry a `bakedStillUrl` field. Until they do, this gate
 * returns `{ pass: false, reasons: ['genome has no rendered mesh; bake first'] }`
 * for every genome. That's the right default: it forces the admin to
 * bake before publishing, which mirrors the canon ("drops are for
 * pieces that physically exist").
 *
 * When the baked-still wiring lands, this file will:
 *
 *   1. Look up the genome record in Firestore (`genomes/{genomeId}`).
 *   2. Read `bakedStillUrl`.
 *   3. Fetch the buffer (signed Storage URL).
 *   4. Call `printCheckFromBuffer(buf)`.
 *   5. Translate the verdict to a `GateVerdict`:
 *      - `verdict.printable === false`  → `{ pass: false, reasons }`
 *      - `verdict.maxPrintableSize === "screen-only"` → fail
 *      - `verdict.errors.length > 0` → fail with those errors
 *      - Otherwise pass; warnings get surfaced separately by the form.
 *
 * # Returns
 *
 * `Promise<{ pass: boolean, reasons: string[] }>` — a simple shape the
 * publish flow and the admin form can both consume.
 */

import "server-only";

import { getFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

import type { GateVerdict } from "./types";

const log = createLogger("drops.oracle-gate");

/**
 * Run the Printability Oracle gate for a genome.
 *
 * @param genomeId  The genome's stable sequenceId.
 * @returns Pass/fail verdict with operator-readable reasons on fail.
 */
export async function oracleCheck(genomeId: string): Promise<{
  pass: boolean;
  reasons: string[];
}> {
  // Sanity-check the genome id shape early — we want a clear failure
  // message rather than a downstream Firestore lookup error.
  if (!genomeId || typeof genomeId !== "string" || genomeId.trim().length === 0) {
    return {
      pass: false,
      reasons: ["genomeId missing or empty"],
    };
  }

  // Production wiring: look up the genome record in Firestore, read
  // the baked-still URL (set by the bake pipeline), fetch it, hand to
  // the print-check capability.
  //
  // If Firestore isn't configured (preview env, local dev without
  // admin creds), fail closed — the operator gets the "bake first"
  // message and is told to set up admin. Better than silently passing.
  const db = getFirebaseAdminDb();
  if (!db) {
    return {
      pass: false,
      reasons: ["Firebase admin not configured; cannot verify bake state"],
    };
  }

  try {
    const snap = await db.collection("genomes").doc(genomeId).get();
    if (!snap.exists) {
      return {
        pass: false,
        reasons: [`genome ${genomeId} not found in Firestore`],
      };
    }
    const data = snap.data() ?? {};
    const bakedStillUrl =
      typeof data["bakedStillUrl"] === "string" ? data["bakedStillUrl"] : null;
    if (!bakedStillUrl) {
      return {
        pass: false,
        reasons: ["genome has no rendered mesh; bake first"],
      };
    }

    const stillRes = await fetch(bakedStillUrl);
    if (!stillRes.ok) {
      log.warn("baked still fetch failed", {
        genomeId,
        status: stillRes.status,
      });
      return {
        pass: false,
        reasons: [`baked still URL returned ${stillRes.status}`],
      };
    }
    const buf = Buffer.from(await stillRes.arrayBuffer());

    // Lazy-import the server-side print-check so this module stays
    // edge-bundle-compatible. printCheckFromBuffer pulls sharp; we
    // don't want sharp into routes that just need oracle gate types.
    const { printCheckFromBuffer } = await import(
      "lib/capabilities/image/print-check.server"
    );
    const verdict = await printCheckFromBuffer(buf);
    const gate = oracleVerdictFromPrintCheck({
      printable: verdict.printable,
      maxPrintableSize: verdict.maxPrintableSize,
      errors: verdict.errors,
      warnings: verdict.warnings,
    });
    return gate.pass
      ? { pass: true, reasons: [] }
      : { pass: false, reasons: [...gate.reasons] };
  } catch (err) {
    log.error("oracle check threw", {
      genomeId,
      err: err instanceof Error ? err.message : String(err),
    });
    return {
      pass: false,
      reasons: [
        `Oracle check failed unexpectedly: ${err instanceof Error ? err.message : "unknown"}`,
      ],
    };
  }
}

/**
 * Pure translator from a `PrintCheckVerdict` to a `GateVerdict`.
 * Exposed so unit tests can pin the mapping without standing up
 * Firestore. Will be called by `oracleCheck` once the baker is wired.
 *
 * Mapping rules:
 *   - `printable === false` OR `maxPrintableSize === "screen-only"` → fail
 *   - `errors.length > 0` → fail; reasons = errors
 *   - When both fail conditions hold, errors win (more specific)
 *   - Warnings are NOT reasons — they're surfaced separately by the form
 */
export function oracleVerdictFromPrintCheck(verdict: {
  printable: boolean;
  maxPrintableSize: string;
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
}): GateVerdict {
  const reasons: string[] = [];
  if (verdict.errors.length > 0) {
    reasons.push(...verdict.errors);
  } else if (!verdict.printable) {
    reasons.push("Print-check verdict: not printable at any size.");
  } else if (verdict.maxPrintableSize === "screen-only") {
    reasons.push(
      "Print-check verdict: largest printable size is screen-only — too small to fabricate.",
    );
  }
  if (reasons.length > 0) {
    return { pass: false, reasons };
  }
  return { pass: true };
}
