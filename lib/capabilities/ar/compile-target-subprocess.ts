/**
 * lib/capabilities/ar/compile-target-subprocess.ts — opt-in subprocess
 * fallback for the in-process mind-ar compile.
 *
 * When the in-process compile throws (TF.js module-state corruption,
 * sharp binding glitches, memory pressure inside the long-lived Next.js
 * server process, …), spawn `scripts/ar-compile-mind-from-bytes.mjs`
 * as a fresh node subprocess and pipe the same image bytes through it.
 *
 * The subprocess runs identical compile logic in an isolated process —
 * so a success here proves the in-process failure was environmental,
 * not algorithmic. Opt-in only: set `AR_COMPILE_FALLBACK_ENABLED=1` on
 * the bench / dev box. Defaults off in production (Vercel functions
 * can't reliably spawn node scripts at runtime).
 */

import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";

import { createLogger } from "lib/log";

const log = createLogger("capability:ar.compile-target.subprocess");

/**
 * Returns the `.mind` buffer on success, `null` on any failure (so the
 * caller can re-throw the original in-process error rather than masking
 * it).
 */
export async function trySubprocessCompile(
  bytes: Uint8Array,
): Promise<Uint8Array | null> {
  if (process.env.AR_COMPILE_FALLBACK_ENABLED !== "1") return null;

  const scriptPath = path.join(
    process.cwd(),
    "scripts",
    "ar-compile-mind-from-bytes.mjs",
  );

  return new Promise<Uint8Array | null>((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      log.warn("subprocess spawn failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      resolve(null);
      return;
    }

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => stdoutChunks.push(c));
    child.stderr.on("data", (c: Buffer) => stderrChunks.push(c));
    child.on("error", (err: Error) => {
      log.warn("subprocess errored", { err: err.message });
      resolve(null);
    });
    child.on("close", (code: number | null) => {
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      if (code === 0 && stdoutChunks.length > 0) {
        const out = Buffer.concat(stdoutChunks);
        log.info("subprocess compile succeeded", {
          bytes: out.byteLength,
          stderrTail: stderr.slice(-200),
        });
        resolve(new Uint8Array(out.buffer, out.byteOffset, out.byteLength));
      } else {
        log.warn("subprocess compile failed", {
          exitCode: code,
          stderr: stderr.slice(-500),
        });
        resolve(null);
      }
    });

    // Pipe the source image bytes into the subprocess and close stdin.
    child.stdin.on("error", (err: Error) => {
      log.warn("subprocess stdin error", { err: err.message });
    });
    child.stdin.end(Buffer.from(bytes));
  });
}
