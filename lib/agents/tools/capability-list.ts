import "server-only";

/**
 * lib/agents/tools/capability-list.ts — `capability.list` tool.
 *
 * Reads the studio's capability registry (`lib/capabilities`) and
 * returns the registered capabilities — id, kind, status, summary,
 * dependsOn, stateSlices. Optional `kind` filter narrows the list.
 *
 * # Why this exists
 *
 * Specialists need to know what the studio can actually do, in its
 * own atomic vocabulary, when planning a multi-step task. Without
 * this tool a specialist asked "can the studio render a splat from
 * a 360 photo?" would have to guess from training data; with it
 * the specialist can list `viz.splat-generate` + `viz.splat-render`
 * + their dependsOn chain and answer concretely.
 *
 * # Graceful degradation
 *
 * If the capability index fails to import (mid-refactor, stale build),
 * we return `{ count: 0, capabilities: [] }` with `degraded: true`
 * and a warn log. Better than throwing and surfacing the specialist's
 * `circuit_open` to the visitor.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.capability-list");

type CapabilityListArgs = { kind?: string };

function parseArgs(raw: unknown): CapabilityListArgs | string {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object") return "args must be an object";
  const r = raw as Record<string, unknown>;
  const out: CapabilityListArgs = {};
  if (typeof r.kind === "string" && r.kind.trim().length > 0) out.kind = r.kind.trim();
  return out;
}

type RegistryEntry = {
  id: string;
  kind: string;
  name: string;
  summary: string;
  status: string;
  source: string;
  stateSlices?: string[];
  dependsOn?: string[];
};

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }

  try {
    // Trigger registration side-effects by importing the index, then
    // pull the registry view via the _base helpers.
    await import("lib/capabilities");
    const base = (await import("lib/capabilities/_base")) as {
      listCapabilities: () => RegistryEntry[];
    };

    const all = base.listCapabilities();
    const filtered = parsed.kind
      ? all.filter((c) => c.kind === parsed.kind)
      : all;

    const capabilities = filtered.map((c) => ({
      id: c.id,
      kind: c.kind,
      name: c.name,
      status: c.status,
      summary: c.summary,
      stateSlices: c.stateSlices ?? [],
      dependsOn: c.dependsOn ?? [],
    }));

    log.info("capability.list ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      kind: parsed.kind,
      total: all.length,
      filtered: capabilities.length,
    });

    return {
      ok: true,
      output: {
        count: capabilities.length,
        total: all.length,
        capabilities,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("capability.list registry import failed; returning empty list", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      err: msg,
    });
    return {
      ok: true,
      output: {
        count: 0,
        capabilities: [],
        degraded: true,
        reason: msg,
      },
    };
  }
}

export const capabilityListTool: Tool = {
  name: "capability.list",
  description:
    "List the studio's registered capabilities (lib/capabilities). Each entry has id, kind, name, status (registered | stub | deprecated), summary, dependsOn, stateSlices. Use when planning a task to see what atomic operations the studio already knows how to do.",
  argsSchema: `{
    "kind": "string (optional) — filter by CapabilityKind: vrm | audio | motion | agent | input | viz | algo | shell | world | geo | ar | media | commerce"
  }`,
  run,
};
