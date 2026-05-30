/**
 * app/admin/drops/new/new-drop/response-guards.ts
 *
 * Runtime narrowing for the publish endpoint's three response
 * shapes:
 *   - 201 { drop: { id } }                  — created
 *   - 400 { error: "gate_failed", … }       — Oracle / Sieve blocked
 *   - 400 { error: "validation_failed", … } — zod issues
 *
 * Pure; no side effects. Each guard returns a typed `true` so the
 * caller's switch is exhaustive.
 */

import type { GateVerdict } from "lib/drops/types";

export function isDropResponse(
  value: unknown,
): value is { drop: { id: string } } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { drop?: unknown };
  if (typeof v.drop !== "object" || v.drop === null) return false;
  return typeof (v.drop as { id?: unknown }).id === "string";
}

export function isGateFailResponse(value: unknown): value is {
  error: "gate_failed";
  message: string;
  oracle?: GateVerdict;
  sieve?: GateVerdict;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { error?: unknown; message?: unknown };
  return v.error === "gate_failed" && typeof v.message === "string";
}

export function isValidationFailResponse(value: unknown): value is {
  error: "validation_failed";
  issues: ReadonlyArray<{ path: string; message: string }>;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { error?: unknown; issues?: unknown };
  if (v.error !== "validation_failed") return false;
  if (!Array.isArray(v.issues)) return false;
  return v.issues.every(
    (i) =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as { path?: unknown }).path === "string" &&
      typeof (i as { message?: unknown }).message === "string",
  );
}
