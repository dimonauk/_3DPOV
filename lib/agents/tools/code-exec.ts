import "server-only";

/**
 * lib/agents/tools/code-exec.ts — `code.exec` tool.
 *
 * Sandboxed JavaScript evaluation via Node's built-in `node:vm`. Used
 * when a specialist needs to do quick numerical / data-massaging work
 * (rounding tables, JSON shape transforms, regex-debug) without writing
 * a file. NEVER shells out — this is not a Bash escape hatch.
 *
 * # Why `vm`, not `eval`
 *
 * `eval` runs in the calling function's scope and inherits every
 * variable in lexical view. `vm.runInNewContext` constructs a fresh
 * V8 context with the globals we hand it, no closure leakage, no
 * accidental `require`. Same engine, hermetic surface.
 *
 * # What's in the sandbox
 *
 *   - Math, Date, JSON, Array, Object, Number, String, Boolean,
 *     Symbol, BigInt — the data-manipulation core.
 *   - `console.log` — captured to a buffer; that's the output channel.
 *   - `setTimeout` / `setInterval` — NOT exposed (no event loop to
 *     drain inside the timeout).
 *
 * # What's NOT in the sandbox
 *
 *   - `require`, `import` — refused at parse time (we string-scan).
 *   - `process`, `global`, `globalThis` — undefined.
 *   - `fetch`, `XMLHttpRequest` — no network.
 *   - `fs`, `child_process` — no filesystem, no spawn.
 *   - `eval` itself — undefined.
 *
 * # Gates
 *
 *   1. `process.env.AGENT_CODE_EXEC_ENABLED === "1"`.
 *   2. Node runtime only — refuses on the edge runtime (no `vm`).
 *
 * # Budget
 *
 *   - 5-second inner timeout (passed to `runInNewContext({ timeout })`).
 *   - 15-second outer hard wall (we await with our own racing timeout
 *     because the inner one can be defeated by infinite microtask
 *     queues — see Node issue #45413).
 *   - 1MB max source length.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.code-exec");

const MAX_SOURCE_BYTES = 1_000_000;
const INNER_TIMEOUT_MS = 5_000;
const OUTER_TIMEOUT_MS = 15_000;

type CodeExecArgs = { code: string };

function parseArgs(raw: unknown): CodeExecArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.code !== "string" || r.code.length === 0) {
    return "args.code must be a non-empty string";
  }
  if (Buffer.byteLength(r.code, "utf8") > MAX_SOURCE_BYTES) {
    return `args.code exceeds ${MAX_SOURCE_BYTES} bytes`;
  }
  return { code: r.code };
}

/**
 * Cheap pre-flight: reject obvious escape attempts before handing to
 * `vm`. This isn't a security boundary — the real boundary is the
 * sandboxed context itself, which has no `require`. But surfacing
 * "no imports allowed" up front gives a clearer error and saves
 * starting an isolate for code that was going to fail.
 */
function preflight(code: string): string | null {
  // Tolerate the words in strings — we only refuse on bare statement
  // positions. Cheap heuristic: word-boundary match outside obvious
  // string syntax. We trust the sandbox to enforce the real boundary.
  // Strip string literals — multi-line tolerant via [\s\S] instead of the
  // /s dotAll flag (which needs es2018+ in the tsc target).
  const bare = code.replace(/(['"`])(?:\\[\s\S]|(?!\1)[\s\S])*\1/g, "");
  if (/\brequire\s*\(/.test(bare)) return "require_not_allowed";
  if (/\bimport\s*[(*'"a-z_{]/.test(bare)) return "import_not_allowed";
  if (/\beval\s*\(/.test(bare)) return "eval_not_allowed";
  if (/\bprocess\b/.test(bare)) return "process_not_allowed";
  return null;
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  // ── Gate 1: env flag ────────────────────────────────────────────────
  if (process.env.AGENT_CODE_EXEC_ENABLED !== "1") {
    log.warn("code.exec refused — feature flag off", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return { ok: false, error: "code_exec_not_enabled" };
  }

  // ── Gate 2: Node runtime only ───────────────────────────────────────
  // `process.release.name === 'node'` is the standard sniff. Edge
  // runtime doesn't define `process.release`.
  const isNode =
    typeof process !== "undefined" &&
    process.release !== undefined &&
    process.release.name === "node";
  if (!isNode) {
    return { ok: false, error: "node_runtime_required" };
  }

  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  const preflightErr = preflight(parsed.code);
  if (preflightErr) {
    return { ok: false, error: preflightErr };
  }

  try {
    const vm = await import("node:vm");

    // Capture console output. The sandbox's `console` is a small
    // proxy that pushes serialised lines onto this buffer.
    const lines: string[] = [];
    const sandboxConsole = {
      log: (...args: unknown[]) => {
        lines.push(args.map(stringify).join(" "));
      },
      info: (...args: unknown[]) => {
        lines.push(args.map(stringify).join(" "));
      },
      warn: (...args: unknown[]) => {
        lines.push("[warn] " + args.map(stringify).join(" "));
      },
      error: (...args: unknown[]) => {
        lines.push("[error] " + args.map(stringify).join(" "));
      },
    };

    // Build a minimal sandbox. Everything not whitelisted is `undefined`.
    const sandbox: Record<string, unknown> = {
      console: sandboxConsole,
      Math,
      Date,
      JSON,
      Array,
      Object,
      Number,
      String,
      Boolean,
      Symbol,
      BigInt,
      Promise,
      Map,
      Set,
      WeakMap,
      WeakSet,
      RegExp,
      Error,
      TypeError,
      RangeError,
      ArrayBuffer,
      Uint8Array,
      Int8Array,
      Uint16Array,
      Int16Array,
      Uint32Array,
      Int32Array,
      Float32Array,
      Float64Array,
      // Explicitly NOT: require, import, process, global, globalThis,
      // fetch, fs, child_process, setTimeout, setInterval, eval.
    };

    const context = vm.createContext(sandbox);

    // Race the inner vm timeout against our outer wall-clock so an
    // infinite microtask queue can't pin the function.
    const innerResult = new Promise<unknown>((resolve, reject) => {
      try {
        const value = vm.runInContext(parsed.code, context, {
          timeout: INNER_TIMEOUT_MS,
          displayErrors: false,
        });
        resolve(value);
      } catch (err) {
        reject(err);
      }
    });

    const outerGuard = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`code_exec_timeout_${OUTER_TIMEOUT_MS}ms`)),
        OUTER_TIMEOUT_MS,
      ),
    );

    let value: unknown;
    try {
      value = await Promise.race([innerResult, outerGuard]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn("code.exec failed inside vm", {
        taskId: ctx.taskId,
        specialist: ctx.callingSpecialist,
        err: msg,
      });
      return {
        ok: false,
        error: `code_exec_failed: ${msg}`,
      };
    }

    const output = lines.join("\n");
    log.info("code.exec ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      bytes: Buffer.byteLength(parsed.code, "utf8"),
      outputLines: lines.length,
    });

    return {
      ok: true,
      output: {
        output,
        returnValue: stringify(value),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("code.exec setup failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      err: msg,
    });
    return { ok: false, error: `code_exec_setup_failed: ${msg}` };
  }
}

function stringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

export const codeExecTool: Tool = {
  name: "code.exec",
  description:
    "Evaluate a JavaScript snippet in a sandboxed vm context. No require, no imports, no network, no fs. Use for arithmetic, JSON shape transforms, regex tests. Gated: AGENT_CODE_EXEC_ENABLED=1 in the environment, Node runtime only. Capture results via console.log.",
  argsSchema: `{
    "code": "string (required) — JavaScript source, no imports / require, max 1MB. Use console.log to output values; the return value of the last expression is also captured."
  }`,
  run,
};
