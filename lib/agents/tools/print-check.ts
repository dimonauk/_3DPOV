import "server-only";

/**
 * lib/agents/tools/print-check.ts — `print.check` tool.
 *
 * Fetches a URL the specialist hands us, feeds the bytes to
 * `printCheckFromBuffer`, returns the verdict (largest safe print size +
 * warnings/errors).
 *
 * Defensive about input: must be http(s), must be an image-ish
 * content-type or at least decode-able by sharp downstream. Bytes are
 * capped at 50 MB so a runaway URL can't OOM the function.
 */

import { createLogger } from "lib/log";
import { printCheckFromBuffer } from "lib/capabilities/image/print-check.server";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.print-check");

const FETCH_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

type PrintCheckArgs = { imageUrl: string };

function parseArgs(raw: unknown): PrintCheckArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.imageUrl !== "string" || r.imageUrl.trim().length === 0) {
    return "args.imageUrl must be a non-empty string";
  }
  try {
    const u = new URL(r.imageUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "args.imageUrl must be http:// or https://";
    }
  } catch {
    return "args.imageUrl is not a valid URL";
  }
  return { imageUrl: r.imageUrl };
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }

  try {
    const res = await fetch(parsed.imageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) {
      return { ok: false, error: `image_fetch_http_${res.status}` };
    }
    const lenHeader = res.headers.get("content-length");
    if (lenHeader && Number(lenHeader) > MAX_IMAGE_BYTES) {
      return { ok: false, error: "image_too_large" };
    }
    const arr = await res.arrayBuffer();
    if (arr.byteLength > MAX_IMAGE_BYTES) {
      return { ok: false, error: "image_too_large" };
    }
    const buf = Buffer.from(arr);
    const verdict = await printCheckFromBuffer(buf);
    log.info("print.check ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      url: parsed.imageUrl,
      bytes: buf.byteLength,
      recommended: (verdict as { recommendedSize?: unknown }).recommendedSize,
    });
    return { ok: true, output: verdict };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("print.check failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      url: parsed.imageUrl,
      err: msg,
    });
    return { ok: false, error: `print_check_failed: ${msg}` };
  }
}

export const printCheckTool: Tool = {
  name: "print.check",
  description:
    "Check whether an image is print-ready on the studio's Canon PRO-1100 and return the largest safe ISO-A size + warnings. Use when the user asks 'can this be printed' or wants a print verdict.",
  argsSchema: `{
    "imageUrl": "string (required) — http(s) URL of the image to check"
  }`,
  run,
};
