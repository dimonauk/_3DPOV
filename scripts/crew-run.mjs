#!/usr/bin/env node
/**
 * scripts/crew-run.mjs — one-shot CLI for the crew system.
 *
 * Exercises the multi-specialist crew end-to-end from the command
 * line. Pretty-prints the step-by-step trail to stdout, writes the
 * final answer to `tmp/crew-runs/<task-id>.md`, logs aggregate token
 * usage at the end.
 *
 * Usage:
 *   node scripts/crew-run.mjs "Draft a 200-word product description for the bench-printed wall relief at /drops/<slug>"
 *
 * Single-specialist short-circuit (skip the planner, run one cast
 * member's ReAct loop directly):
 *   node scripts/crew-run.mjs --assignTo marcel "Check printability of /drops/aurora-relief/baked.stl"
 *
 * Other flags:
 *   --orchestrator <slug>     override the planning specialist (default: "aura")
 *   --max-iterations <n>      cap on dispatch loop iterations (default: 5)
 *   --no-write                skip writing the markdown artefact
 *   --json                    emit the full CrewRun as JSON instead of pretty trail
 *
 * Operator + CI use. Zero deps beyond `lib/agents/*` — pure ESM
 * imports of the same modules the website uses at runtime.
 *
 * Note: this script imports `runCrew` and `allSpecialists` from the
 * crew runner module. That module is part of a parallel task — if
 * the import errors with "Cannot find module", the runner hasn't
 * landed yet and this script can't run end-to-end. The ReAct loop
 * underneath is independently usable via `runReactLoop`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Make TypeScript-via-tsx friendly. When run directly under Node, the
// caller should use `tsx scripts/crew-run.mjs ...` or pre-compile.
// The imports below are spelled relative-to-repo so they resolve
// identically under both node + tsx with the repo's tsconfig paths
// flattened by the runtime loader.
const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");

// --- imports ---------------------------------------------------------
// These follow tsconfig path aliases (`lib/agents/...`). Require a
// loader that honours them — the repo's `tsx` runner is the supported
// path. See `package.json` scripts.
const { runCrew } = await import("lib/agents/crew/runner.js").catch(
  importBoom("lib/agents/crew/runner — multi-specialist orchestrator (planned)"),
);
const { allSpecialists } = await import("lib/agents/crew/specialists.js").catch(
  importBoom("lib/agents/crew/specialists — cast-bible-to-Specialist[] adapter (planned)"),
);
const { buildToolRegistry } = await import("lib/agents/tools/registry.js").catch(
  importBoom("lib/agents/tools/registry — default tool registry builder (planned)"),
);

// runReactLoop is the engine — always available, even without the
// orchestrator. The --assignTo path uses it directly.
const { runReactLoop } = await import("lib/agents/loop/react-loop.js");

function importBoom(label) {
  return (err) => {
    console.error(`\n[crew-run] missing module: ${label}`);
    console.error(`[crew-run] underlying error: ${err?.message ?? err}`);
    console.error(
      `[crew-run] hint: this script depends on the crew runner — see docs/CREW-SYSTEM.md`,
    );
    process.exit(2);
  };
}

// --- arg parsing -----------------------------------------------------

function parseArgs(argv) {
  const out = {
    task: "",
    assignTo: null,
    orchestrator: "aura",
    maxIterations: 5,
    noWrite: false,
    asJson: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--assignTo" || a === "--assign-to") {
      out.assignTo = argv[++i];
    } else if (a === "--orchestrator") {
      out.orchestrator = argv[++i];
    } else if (a === "--max-iterations") {
      out.maxIterations = parseInt(argv[++i], 10) || 5;
    } else if (a === "--no-write") {
      out.noWrite = true;
    } else if (a === "--json") {
      out.asJson = true;
    } else if (a === "--help" || a === "-h") {
      printUsage();
      process.exit(0);
    } else if (a.startsWith("--")) {
      console.error(`[crew-run] unknown flag: ${a}`);
      process.exit(2);
    } else {
      rest.push(a);
    }
  }
  out.task = rest.join(" ").trim();
  return out;
}

function printUsage() {
  process.stdout.write(
    [
      "Usage: node scripts/crew-run.mjs [flags] \"<task description>\"",
      "",
      "Flags:",
      "  --assignTo <slug>         skip the planner; run one specialist's ReAct loop directly",
      "  --orchestrator <slug>     planning specialist (default: aura)",
      "  --max-iterations <n>      iteration cap (default: 5)",
      "  --no-write                don't write tmp/crew-runs/<id>.md",
      "  --json                    emit the full CrewRun as JSON",
      "",
      "Examples:",
      "  node scripts/crew-run.mjs \"Draft a 200-word product description for /drops/aurora-relief\"",
      "  node scripts/crew-run.mjs --assignTo marcel \"Check printability of /drops/aurora-relief/baked.stl\"",
      "",
    ].join("\n"),
  );
}

// --- pretty printers -------------------------------------------------

const COLOURS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function c(colour, text) {
  if (!process.stdout.isTTY) return text;
  return `${COLOURS[colour] ?? ""}${text}${COLOURS.reset}`;
}

function printCrewTrail(run) {
  process.stdout.write(`\n${c("bold", "Trail")}\n`);
  for (const step of run.trail ?? []) {
    switch (step.kind) {
      case "plan":
        process.stdout.write(
          `  ${c("magenta", "plan")}     by ${step.by}\n           ${step.reasoning}\n`,
        );
        break;
      case "delegate":
        process.stdout.write(
          `  ${c("cyan", "delegate")} ${step.by} → ${step.to}\n           ${step.subtask}\n`,
        );
        break;
      case "tool": {
        const status = step.error ? c("red", "✗") : c("green", "✓");
        process.stdout.write(
          `  ${c("yellow", "tool")}     ${status} ${step.by}::${step.tool}\n` +
            `           args: ${oneLine(step.args)}\n` +
            (step.error
              ? `           error: ${step.error}\n`
              : `           result: ${oneLine(step.result)}\n`),
        );
        break;
      }
      case "answer":
        process.stdout.write(
          `  ${c("green", "answer")}   by ${step.by}\n${indent(step.text, "           ")}\n`,
        );
        break;
      case "stop":
        process.stdout.write(`  ${c("red", "stop")}     ${step.reason}\n`);
        break;
      default:
        process.stdout.write(`  ${c("dim", JSON.stringify(step))}\n`);
    }
  }
}

function printReactTrail(result, specialistSlug) {
  process.stdout.write(`\n${c("bold", "Trail")} (${specialistSlug})\n`);
  for (const step of result.trail ?? []) {
    switch (step.kind) {
      case "thought":
        process.stdout.write(`  ${c("dim", "thought")}  ${step.text}\n`);
        break;
      case "action": {
        const ok = step.result?.ok;
        const status = ok ? c("green", "✓") : c("red", "✗");
        process.stdout.write(
          `  ${c("yellow", "action")}   ${status} ${step.tool}\n` +
            `           args: ${oneLine(step.args)}\n` +
            `           result: ${oneLine(step.result)}\n`,
        );
        break;
      }
      case "answer":
        process.stdout.write(
          `  ${c("green", "answer")}\n${indent(step.text, "           ")}\n`,
        );
        break;
    }
  }
}

function oneLine(v) {
  if (v === undefined) return "(none)";
  if (v === null) return "null";
  if (typeof v === "string") return v.length > 200 ? `${v.slice(0, 200)}…` : v;
  try {
    const s = JSON.stringify(v);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return String(v);
  }
}

function indent(s, prefix) {
  return String(s ?? "")
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

// --- output writer ---------------------------------------------------

async function writeArtefact(taskId, payload) {
  const dir = join(REPO_ROOT, "tmp", "crew-runs");
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${taskId}.md`);
  await writeFile(path, payload, "utf8");
  return path;
}

function buildMarkdownArtefact({ taskId, task, run, mode, specialist }) {
  const lines = [
    `# Crew run — ${taskId}`,
    "",
    `- Mode: \`${mode}\``,
    specialist ? `- Specialist: \`${specialist}\`` : null,
    `- Generated: ${new Date().toISOString()}`,
    "",
    "## Task",
    "",
    task,
    "",
    "## Final answer",
    "",
    run.output ?? "(no output)",
    "",
    "## Usage",
    "",
    `- input tokens: ${run.totalUsage?.inputTokens ?? run.usage?.inputTokens ?? 0}`,
    `- output tokens: ${run.totalUsage?.outputTokens ?? run.usage?.outputTokens ?? 0}`,
    `- iterations: ${run.iterations ?? "n/a"}`,
    "",
    "## Trail",
    "",
    "```json",
    JSON.stringify(run.trail ?? [], null, 2),
    "```",
    "",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

// --- task-id ---------------------------------------------------------

function makeTaskId(prefix) {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`;
}

// --- main ------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.task) {
    printUsage();
    process.exit(2);
  }

  const taskId = makeTaskId(args.assignTo ? `solo-${args.assignTo}` : "crew");

  process.stdout.write(`${c("bold", "[crew-run]")} ${taskId}\n`);
  process.stdout.write(`${c("dim", "task:")} ${args.task}\n`);

  let pretty;
  let artefact;
  let usage;
  let iterations;
  let ok;

  if (args.assignTo) {
    // Single-specialist short-circuit via the ReAct loop directly.
    const specialists = allSpecialists();
    const specialist = specialists.find((s) => s.slug === args.assignTo);
    if (!specialist) {
      console.error(
        `[crew-run] unknown specialist '${args.assignTo}'. Known: ${specialists.map((s) => s.slug).join(", ")}`,
      );
      process.exit(2);
    }
    const tools = buildToolRegistry({ taskId });
    const result = await runReactLoop({
      specialist,
      task: args.task,
      tools,
      maxIterations: args.maxIterations * 2, // single-loop allowance is higher
      callingTaskId: taskId,
    });
    pretty = () => printReactTrail(result, specialist.slug);
    artefact = buildMarkdownArtefact({
      taskId,
      task: args.task,
      run: result,
      mode: "react-loop",
      specialist: specialist.slug,
    });
    usage = result.usage;
    iterations = result.iterations;
    ok = result.ok;
    if (args.asJson) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      pretty();
      process.stdout.write(`\n${c("bold", "Final answer")}\n${result.output}\n`);
      if (result.error) {
        process.stdout.write(`\n${c("red", "Error:")} ${result.error}\n`);
      }
    }
  } else {
    // Full crew run.
    const run = await runCrew({
      task: { id: taskId, description: args.task },
      specialists: allSpecialists(),
      orchestrator: args.orchestrator,
      tools: buildToolRegistry({ taskId }),
      maxIterations: args.maxIterations,
    });
    pretty = () => printCrewTrail(run);
    artefact = buildMarkdownArtefact({
      taskId,
      task: args.task,
      run,
      mode: "crew",
    });
    usage = run.totalUsage;
    iterations = run.iterations;
    ok = run.ok;
    if (args.asJson) {
      process.stdout.write(`${JSON.stringify(run, null, 2)}\n`);
    } else {
      pretty();
      process.stdout.write(`\n${c("bold", "Final answer")}\n${run.output}\n`);
    }
  }

  if (!args.noWrite) {
    const path = await writeArtefact(taskId, artefact);
    process.stdout.write(`\n${c("dim", "wrote")} ${path}\n`);
  }

  process.stdout.write(
    `\n${c("bold", "Usage")} input=${usage?.inputTokens ?? 0} output=${
      usage?.outputTokens ?? 0
    } iterations=${iterations ?? 0} ok=${ok ? c("green", "true") : c("red", "false")}\n`,
  );

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(`\n[crew-run] crashed: ${err?.stack ?? err}`);
  process.exit(1);
});
