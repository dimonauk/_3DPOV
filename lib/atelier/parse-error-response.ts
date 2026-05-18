"use client";

/**
 * lib/atelier/parse-error-response.ts — Shared error-response handling
 * for atelier chambers that call /api/* routes.
 *
 * # Why this exists
 *
 * Three chambers (imagen, image-edit, co-drawing) duplicate ~25 lines
 * of "parse the JSON body, fall back to raw text, extract code +
 * retryAfterSec" logic per chamber. Two of the three (imagen,
 * image-edit) implemented it correctly; co-drawing only extracted
 * `error` and missed the rate-limit affordances entirely — visitors
 * who hit the cap saw "rate_limited" with no retry hint.
 *
 * The helper centralises that parsing AND fires a Sonner toast on
 * 429 / "no_key" / "studio_capped" so the visitor sees the affordance
 * even if they've scrolled past the chamber's inline error panel.
 * Sonner's <Toaster> is already mounted at the root layout, so any
 * client component can call `toast.*` without wiring.
 *
 * # Contract
 *
 *   const err = await parseAtelierErrorResponse(res, { chamberSlug: "co-drawing" });
 *   // err is null if res.ok is true, otherwise an AtelierErrorResponse
 *   if (err) {
 *     setOutput({ kind: "error", message: err.message, code: err.code, retryAfterSec: err.retryAfterSec });
 *     return;
 *   }
 *
 * The body is consumed once. Callers pass `res` BEFORE calling
 * `res.json()` themselves.
 *
 * # Toast behaviour
 *
 *   - 429: warning toast with retry time + open-settings hint
 *   - "no_key" code: info toast pointing at settings
 *   - "studio_capped" code: warning toast with retry time + BYO-key hint
 *   - Any other 4xx/5xx: no toast (chamber's inline UI is enough)
 *
 * Toast is suppressed when `silent: true` — used by chambers that
 * already render their own inline 429 affordance (imagen) but want
 * the parser without the duplicate toast.
 */

import { toast } from "sonner";

export type AtelierErrorResponse = {
  /** Human-readable message — never empty. */
  message: string;
  /** Server-supplied error code, when present (`rate_limited`,
   *  `studio_capped`, `no_key`, etc). */
  code?: string;
  /** Seconds the caller should wait before retrying, when the server
   *  attached `retryAfterSec` to the JSON body OR a `Retry-After`
   *  header. */
  retryAfterSec?: number;
};

export type ParseOptions = {
  /** Chamber slug for the toast title. */
  chamberSlug?: string;
  /** Suppress the toast — use when the chamber already renders an
   *  inline 429 affordance and doesn't want the duplicate. */
  silent?: boolean;
};

/**
 * Parse a fetch Response into a typed AtelierErrorResponse, or null
 * if the response was ok (caller should proceed to `res.json()`).
 *
 * On 429 / known error codes, fires a Sonner toast unless `silent`.
 */
export async function parseAtelierErrorResponse(
  res: Response,
  opts: ParseOptions = {},
): Promise<AtelierErrorResponse | null> {
  if (res.ok) return null;

  const text = await res.text();
  let message = `HTTP ${res.status}`;
  let code: string | undefined;
  let retryAfterSec: number | undefined;

  try {
    const parsed = JSON.parse(text) as {
      error?: string;
      message?: string;
      code?: string;
      retryAfterSec?: number;
    };
    if (parsed.error) message = parsed.error;
    else if (parsed.message) message = parsed.message;
    if (parsed.code) code = parsed.code;
    if (typeof parsed.retryAfterSec === "number") {
      retryAfterSec = parsed.retryAfterSec;
    }
  } catch {
    // Server didn't return JSON — keep the raw text if it's short
    // enough to display without overflowing the error UI.
    if (text.length > 0 && text.length < 300) message = text;
  }

  // Honour Retry-After header when the JSON body didn't include it.
  if (retryAfterSec === undefined) {
    const header = res.headers.get("Retry-After");
    if (header) {
      const n = Number(header);
      if (Number.isFinite(n) && n > 0) retryAfterSec = n;
    }
  }

  const result: AtelierErrorResponse = { message };
  if (code !== undefined) result.code = code;
  if (retryAfterSec !== undefined) result.retryAfterSec = retryAfterSec;

  if (!opts.silent) {
    maybeFireToast(res.status, result, opts.chamberSlug);
  }

  return result;
}

function maybeFireToast(
  status: number,
  err: AtelierErrorResponse,
  chamberSlug: string | undefined,
): void {
  const title = chamberSlug
    ? `${chamberSlug}: ${toastTitleForStatus(status, err.code)}`
    : toastTitleForStatus(status, err.code);

  if (status === 429 || err.code === "rate_limited" || err.code === "studio_capped") {
    const retryHint = formatRetryHint(err.retryAfterSec);
    toast.warning(title, {
      description: `${retryHint}${
        err.code === "studio_capped"
          ? " Or open settings and paste your own AI Studio key for unbounded use."
          : ""
      }`,
    });
    return;
  }
  if (err.code === "no_key") {
    toast.info(title, {
      description:
        "Open the chamber's settings and paste your AI Studio key to get going.",
    });
    return;
  }
  // Any other 4xx/5xx: no toast — the chamber's inline UI carries it.
}

function toastTitleForStatus(status: number, code: string | undefined): string {
  if (status === 429 || code === "rate_limited") return "Rate limit hit";
  if (code === "studio_capped") return "Studio cap reached";
  if (code === "no_key") return "API key required";
  return `Request failed (${status})`;
}

function formatRetryHint(retryAfterSec: number | undefined): string {
  if (!retryAfterSec) return "Try again shortly.";
  if (retryAfterSec >= 60) {
    return `Try again in ~${Math.ceil(retryAfterSec / 60)} min.`;
  }
  return `Try again in ${Math.ceil(retryAfterSec)}s.`;
}
