#!/usr/bin/env node
/**
 * scripts/scaffold-specialist.mjs
 *
 * Scaffolds a new specialist for the Holoflow Studio cast. Given a slug,
 * a display name, a role, a kingdom, a voice register, the topics they
 * speak about, their preferred model, their tool allow-list, and the
 * path to their VRM, writes:
 *
 *   1. data/agents/<slug>.json — the cast bible (JSON), schema-matching
 *      `CastMember` in lib/agents/cast.ts.
 *   2. lib/agents/specialists/<slug>.ts — the typed `Specialist` record
 *      consumed by the crew runner.
 *   3. lib/agents/specialists/<slug>.PURPOSE.md — per the convention in
 *      docs/AGENT-FILE-DOCS.md.
 *
 * Then updates:
 *
 *   4. lib/agents/specialists/index.ts — adds the import + entry in the
 *      `allSpecialists` tuple alphabetically.
 *   5. lib/agents/cast.ts — adds the JSON import + the `CastMember` cast
 *      + the export, alphabetically.
 *
 * # Usage
 *
 *   node scripts/scaffold-specialist.mjs \
 *     --slug "babette" \
 *     --display-name "Babette" \
 *     --role "The Lensmaker" \
 *     --kingdom "biomech" \
 *     --voice "warm but rigorous, calibrates against light + materials" \
 *     --speaks-about "lenses, depth, focal length, the rig" \
 *     --prefer-model "claude-sonnet-4-6" \
 *     --tools "memory.recall,memory.remember,research.recall,print.check" \
 *     --vrm "/avatars/babette.vrm"
 *
 * # Flags
 *
 *   --slug <kebab>          required, must not already exist
 *   --display-name <text>   required, shown in cast cards
 *   --role <text>           required, CrewAI-style label
 *   --kingdom <one-of-8>    required
 *   --voice <text>          required, voiceRegister description
 *   --speaks-about <csv>    required, comma-separated topic list
 *   --prefer-model <name>   required, bare model id (provider auto-inferred)
 *   --tools <csv>           optional, defaults to a small allow-list
 *   --vrm <path>            optional, defaults to /avatars/<slug>.vrm
 *   --force                 overwrite existing files
 *   --dry-run               print the plan, write nothing
 *   --help, -h              print usage
 *
 * # Exit codes
 *
 *   0  success
 *   1  bad arguments, validation failure, or fatal filesystem error
 *
 * # Idempotency
 *
 *   Without --force, refuses to overwrite. With --force, every existing
 *   target is replaced and the registry is patched again (idempotently;
 *   duplicate import lines are de-duplicated).
 *
 * # Atomicity
 *
 *   Tracks every file written. On any failure the script unlinks the
 *   newly-created files and restores any registry file from its on-disk
 *   snapshot taken before the run.
 */

import { existsSync } from "node:fs";
import {
  mkdir,
  readFile,
  writeFile,
  unlink,
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------
// Repo root
// ---------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------
// Constants — kept in lockstep with lib/agents/specialist-template.ts
// ---------------------------------------------------------------------

const KINGDOMS = [
  "choreographic",
  "curvilinear",
  "biomech",
  "techno",
  "assemblage",
  "artistic",
  "architectural",
  "ritual",
];

const DEFAULT_TOOLS = ["memory.recall", "memory.remember"];

/**
 * Standard never-list. Copied verbatim from data/agents/aura.json — the
 * studio's marketing-fluff allergy is the same for every specialist; the
 * specialist-specific items go in via a TODO marker.
 */
const STANDARD_NEVER_LIST = [
  "leveraging",
  "synergy",
  "innovative",
  "seamless",
  "seamlessly",
  "elevate",
  "cutting-edge",
  "revolutionary",
  "transformative",
  "game-changing",
  "groundbreaking",
  "embark on a journey",
  "unlock the power of",
  "welcome to",
  "discover",
  "delight",
  "delightful",
  "immersive (without specs)",
  "curated experience",
  "bespoke (as marketing flourish)",
  "as a large language model",
  "I'm just an AI",
  "I apologize for the confusion",
  "how can I help you today",
  "let me know if there's anything else",
  "I'd be happy to help",
  "TODO: add specialist-specific never-list items here",
];

// ---------------------------------------------------------------------
// ANSI
// ---------------------------------------------------------------------

const useColour =
  process.stdout.isTTY && !process.argv.includes("--no-colour") && !process.argv.includes("--no-color");

const c = {
  reset: useColour ? "\x1b[0m" : "",
  bold: useColour ? "\x1b[1m" : "",
  dim: useColour ? "\x1b[2m" : "",
  red: useColour ? "\x1b[31m" : "",
  green: useColour ? "\x1b[32m" : "",
  yellow: useColour ? "\x1b[33m" : "",
  cyan: useColour ? "\x1b[36m" : "",
};

function info(msg) {
  console.log(msg);
}
function ok(msg) {
  console.log(`${c.green}✓${c.reset} ${msg}`);
}
function warn(msg) {
  console.warn(`${c.yellow}!${c.reset} ${msg}`);
}
function fail(msg) {
  console.error(`${c.red}×${c.reset} ${msg}`);
}

// ---------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
  printUsage();
  process.exit(argv.length === 0 ? 1 : 0);
}

const flags = {
  slug: getArg("--slug"),
  displayName: getArg("--display-name"),
  role: getArg("--role"),
  kingdom: getArg("--kingdom"),
  voice: getArg("--voice"),
  speaksAbout: getArg("--speaks-about"),
  preferModel: getArg("--prefer-model"),
  tools: getArg("--tools"),
  vrm: getArg("--vrm"),
  force: argv.includes("--force"),
  dryRun: argv.includes("--dry-run"),
};

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

const errors = [];

function requireFlag(name, value) {
  if (!value || String(value).trim().length === 0) {
    errors.push(`--${name} is required.`);
  }
}

requireFlag("slug", flags.slug);
requireFlag("display-name", flags.displayName);
requireFlag("role", flags.role);
requireFlag("kingdom", flags.kingdom);
requireFlag("voice", flags.voice);
requireFlag("speaks-about", flags.speaksAbout);
requireFlag("prefer-model", flags.preferModel);

if (flags.slug) {
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(flags.slug)) {
    errors.push(
      `--slug must be kebab-case (lowercase, hyphens, no leading/trailing hyphen). Got: ${flags.slug}`,
    );
  } else if (flags.slug.length < 2 || flags.slug.length > 40) {
    errors.push(`--slug must be 2-40 characters. Got: ${flags.slug.length}.`);
  }
}

if (flags.kingdom && !KINGDOMS.includes(flags.kingdom)) {
  errors.push(
    `--kingdom must be one of: ${KINGDOMS.join(", ")}. Got: ${flags.kingdom}.`,
  );
}

if (errors.length > 0) {
  fail("Validation failed:");
  for (const e of errors) console.error(`  - ${e}`);
  console.error("");
  printUsage();
  process.exit(1);
}

const slug = flags.slug;
const displayName = flags.displayName;
const role = flags.role;
const kingdom = flags.kingdom;
const voiceRegister = flags.voice;
const speaksAbout = flags.speaksAbout
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
const preferModel = flags.preferModel;
const tools = (flags.tools ?? DEFAULT_TOOLS.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
const vrmFile = flags.vrm ?? `/avatars/${slug}.vrm`;

// Detect existing slug (collision check).
const bibleTarget = join(REPO_ROOT, "data", "agents", `${slug}.json`);
const specialistTarget = join(REPO_ROOT, "lib", "agents", "specialists", `${slug}.ts`);
const purposeTarget = join(REPO_ROOT, "lib", "agents", "specialists", `${slug}.PURPOSE.md`);
const indexTarget = join(REPO_ROOT, "lib", "agents", "specialists", "index.ts");
const castTarget = join(REPO_ROOT, "lib", "agents", "cast.ts");

if (!flags.force) {
  const collisions = [];
  if (existsSync(bibleTarget)) collisions.push(rel(bibleTarget));
  if (existsSync(specialistTarget)) collisions.push(rel(specialistTarget));
  if (existsSync(purposeTarget)) collisions.push(rel(purposeTarget));
  if (collisions.length > 0) {
    fail(`Refusing to overwrite existing files:`);
    for (const f of collisions) console.error(`  - ${f}`);
    console.error("");
    console.error("Pass --force to overwrite, or pick a different --slug.");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------
// Build artefacts
// ---------------------------------------------------------------------

const provider = inferProvider(preferModel);

const systemPromptTemplate =
  `You are ${displayName}, ${role}.\n\n` +
  `Voice register: ${voiceRegister}.\n\n` +
  `You speak about: ${speaksAbout.join("; ")}.\n\n` +
  `[TODO: fill in backstory paragraph here]\n\n` +
  `Hard boundaries:\n` +
  `  - Do not impersonate other specialists.\n` +
  `  - Do not invent biographical detail about Dimona or other real people unless documented.\n` +
  `  - Do not use the holoflow-voice never-list of marketing fluff words.\n` +
  `  - [TODO: specialist-specific boundary clauses here]\n\n` +
  `British spelling. Catalogue voice when in doubt.`;

/** @type {object} */
const bible = {
  slug,
  displayName,
  kingdom,
  voiceRegister,
  oneLineBio: role,
  longBio: "",
  preferredModel: {
    provider,
    model: preferModel,
  },
  systemPrompt: systemPromptTemplate,
  doNotSay: [...STANDARD_NEVER_LIST],
  speaksAbout,
  doesNotSpeakAbout: [
    "TODO: list topics this specialist hands off or declines",
  ],
  vrmFile,
  active: false,
};

const bibleJson = JSON.stringify(bible, null, 2) + "\n";

const specialistTs = renderSpecialistTs({
  slug,
  displayName,
  role,
  voiceRegister,
  speaksAbout,
  provider,
  preferModel,
  tools,
  systemPromptTemplate,
});

const purposeMd = renderPurposeMd({ slug, displayName, role });

// ---------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------

info("");
info(`${c.bold}Scaffolding specialist:${c.reset} ${c.cyan}${displayName}${c.reset} (${slug})`);
info(`  kingdom         : ${kingdom}`);
info(`  voice register  : ${voiceRegister}`);
info(`  model           : ${provider}/${preferModel} via aperture`);
info(`  tools           : ${tools.join(", ")}`);
info(`  vrm             : ${vrmFile}`);
info(`  speaks about    : ${speaksAbout.length} topic(s)`);
info("");

if (flags.dryRun) {
  info(`${c.dim}-- DRY RUN — no files written --${c.reset}`);
  info("");
  info("Would write:");
  info(`  ${rel(bibleTarget)}`);
  info(`  ${rel(specialistTarget)}`);
  info(`  ${rel(purposeTarget)}`);
  info("Would update:");
  info(`  ${rel(indexTarget)}`);
  info(`  ${rel(castTarget)}`);
  info("");
  process.exit(0);
}

// ---------------------------------------------------------------------
// Execute — atomic with rollback
// ---------------------------------------------------------------------

/**
 * Tracks files we created (for unlink) and registry snapshots (for restore).
 * @type {{ created: string[]; restore: Array<{ path: string; content: string }> }}
 */
const txn = { created: [], restore: [] };

try {
  await ensureDir(dirname(bibleTarget));
  await ensureDir(dirname(specialistTarget));

  // 1. Cast bible JSON
  if (existsSync(bibleTarget) && flags.force) {
    txn.restore.push({ path: bibleTarget, content: await readFile(bibleTarget, "utf8") });
  } else {
    txn.created.push(bibleTarget);
  }
  await writeFile(bibleTarget, bibleJson, "utf8");
  ok(rel(bibleTarget));

  // 2. Specialist .ts
  if (existsSync(specialistTarget) && flags.force) {
    txn.restore.push({ path: specialistTarget, content: await readFile(specialistTarget, "utf8") });
  } else {
    txn.created.push(specialistTarget);
  }
  await writeFile(specialistTarget, specialistTs, "utf8");
  ok(rel(specialistTarget));

  // 3. .PURPOSE.md
  if (existsSync(purposeTarget) && flags.force) {
    txn.restore.push({ path: purposeTarget, content: await readFile(purposeTarget, "utf8") });
  } else {
    txn.created.push(purposeTarget);
  }
  await writeFile(purposeTarget, purposeMd, "utf8");
  ok(rel(purposeTarget));

  // 4. specialists/index.ts
  txn.restore.push({
    path: indexTarget,
    content: existsSync(indexTarget) ? await readFile(indexTarget, "utf8") : "",
  });
  await patchSpecialistsIndex(indexTarget, slug);
  ok(`${rel(indexTarget)} updated`);

  // 5. cast.ts
  txn.restore.push({
    path: castTarget,
    content: existsSync(castTarget) ? await readFile(castTarget, "utf8") : "",
  });
  await patchCastTs(castTarget, slug);
  ok(`${rel(castTarget)} updated`);

  // Summary
  info("");
  info(`${c.bold}NEXT STEPS:${c.reset}`);
  info(`  - Fill in [TODO] sections in ${rel(bibleTarget)}`);
  info(`  - Write ${displayName}'s longBio paragraph in the bible.`);
  info(`  - Replace the generic systemPrompt template with ${displayName}'s voice.`);
  info(`  - Run: node scripts/index-internal-docs.mjs --specialist ${slug}  (when available)`);
  info(`  - Set "active": true in the bible once the voice has been reviewed.`);
  info(`  - Run: pnpm exec tsc --noEmit  to confirm everything compiles.`);
  info("");
  process.exit(0);
} catch (err) {
  fail(`Scaffold failed: ${err instanceof Error ? err.message : String(err)}`);
  warn("Rolling back...");
  await rollback(txn);
  warn("Rollback complete.");
  process.exit(1);
}

// =====================================================================
// Helpers
// =====================================================================

function getArg(name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}

function rel(p) {
  return relative(REPO_ROOT, p).replaceAll("\\", "/");
}

async function ensureDir(d) {
  await mkdir(d, { recursive: true });
}

/**
 * Provider auto-inference from bare model name. Mirrors the route table
 * in lib/agents/model-router.ts.
 */
function inferProvider(model) {
  const m = model.toLowerCase();
  if (m.startsWith("claude")) return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4")) return "openai";
  if (m.startsWith("gemini")) return "google";
  if (m.startsWith("llama") || m.includes("mistral") || m.includes("dolphin") || m.includes("phi")) return "ollama";
  // Default conservative pick — the operator can edit the JSON after.
  return "anthropic";
}

function renderSpecialistTs(opts) {
  const {
    slug,
    displayName,
    role,
    voiceRegister,
    speaksAbout,
    provider,
    preferModel,
    tools,
    systemPromptTemplate,
  } = opts;

  const toolsLiteral = tools.map((t) => `    ${JSON.stringify(t)},`).join("\n");
  const promptLiteral = JSON.stringify(systemPromptTemplate);

  return `/**
 * lib/agents/specialists/${slug}.ts — ${displayName} as crew specialist.
 *
 * SCAFFOLDED by scripts/scaffold-specialist.mjs on ${today()}.
 *
 * This file was generated from a one-line description. The systemPrompt
 * is a TEMPLATE — fill in ${displayName}'s voice, backstory, and the
 * specialist-specific boundary clauses before flipping
 * data/agents/${slug}.json#active to true.
 *
 * Voice register: ${voiceRegister}.
 *
 * The cast bible at data/agents/${slug}.json is the source of truth for
 * the JSON-shaped fields (oneLineBio, doNotSay, speaksAbout, etc.). This
 * file is the crew-runner-shaped sibling — same character, different
 * consumer.
 */

import "server-only";

import type { Specialist } from "lib/agents/crew/types";

// ---------------------------------------------------------------------
// System prompt — template. Replace placeholders before going live.
// ---------------------------------------------------------------------

const SYSTEM_PROMPT = ${promptLiteral};

// ---------------------------------------------------------------------
// Specialist record
// ---------------------------------------------------------------------

export const ${slug}: Specialist = {
  slug: ${JSON.stringify(slug)},
  displayName: ${JSON.stringify(displayName)},
  role: ${JSON.stringify(role)},
  goal:
    "TODO: one-sentence north star — what ${displayName} exists to do.",
  backstory:
    "TODO: 2-3 sentences. ${displayName} speaks about ${speaksAbout.join(", ")}. Voice: ${voiceRegister}.",
  preferredModel: {
    provider: ${JSON.stringify(provider)},
    model: ${JSON.stringify(preferModel)},
    via: "aperture",
  },
  tools: [
${toolsLiteral}
  ] as const,
  allowDelegation: false,
  systemPrompt: SYSTEM_PROMPT,
};
`;
}

function renderPurposeMd(opts) {
  const { slug, displayName, role } = opts;
  return `---
file: lib/agents/specialists/${slug}.ts
role: lib-module
what: ${displayName} as a crew specialist — typed Specialist record consumed by the crew runner.
why: |
  Wraps the cast bible at data/agents/${slug}.json in the crew-side
  Specialist record so the crew runner can dispatch to ${displayName}
  with a pre-built system prompt, a pre-routed model, and a tool
  allow-list.
deps:
  - data/agents/${slug}.json
  - lib/agents/crew/types
callers:
  - lib/agents/specialists/index.ts
exports:
  - ${slug} (named, typed Specialist)
last_audited: ${today()}
---

# \`${slug}.ts\` — purpose twin

## Role

${displayName} (${role}) as a crew specialist. Holds the system prompt,
preferred model, tool allow-list, and the typed \`Specialist\` record
the crew runner consumes.

## Public surface

- \`${slug}\` — named export, typed \`Specialist\` from
  \`lib/agents/crew/types\`.

## Depends on

- \`lib/agents/crew/types\` — the \`Specialist\` shape this file produces.
- \`data/agents/${slug}.json\` (sibling source-of-truth; not imported, but
  every voice change here must match the bible).

## Does not

- **Does not orchestrate.** \`allowDelegation: false\`. Aura is the
  orchestrator; if ${displayName} needs to hand off, the operator
  edits this file by hand.
- **Does not invoke an LLM.** This file is data + types only. The
  runner in \`lib/agents/crew/\` does the calling.
- **Does not synthesise prompts.** \`SYSTEM_PROMPT\` is pre-built. The
  runner concatenates it with task context; it does not re-derive.

## Bordering files

- \`data/agents/${slug}.json\` — the cast bible.
- \`lib/agents/specialists/index.ts\` — the registry that exports this
  in the \`allSpecialists\` tuple.
- \`lib/agents/cast.ts\` — the CastMember registry that imports the
  JSON sibling.

## TODO

This file was scaffolded by \`scripts/scaffold-specialist.mjs\`. Before
flipping \`active: true\` in the bible:

- Replace the \`SYSTEM_PROMPT\` template with ${displayName}'s actual
  voice (cross-link to the \`holoflow-voice\` skill).
- Write the \`goal\` and \`backstory\` fields.
- Audit the never-list — strip the generic items, add the
  ${displayName}-specific ones.
- Confirm tools are correct.
- Confirm the model choice is justified (Sonnet is the default;
  Opus is reserved for heavy reasoning loads).
`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Patches lib/agents/specialists/index.ts to:
 *  - add `import { <slug> } from "./<slug>"` alphabetically among the
 *    other imports;
 *  - add the slug to the `export { ... }` line;
 *  - add the slug to the `allSpecialists` tuple, alphabetically (after
 *    aura, which always leads as orchestrator).
 *
 * If the file doesn't exist yet, generates a fresh one with the new
 * specialist as the only entry (this is the bootstrap path).
 */
async function patchSpecialistsIndex(path, newSlug) {
  if (!existsSync(path)) {
    const fresh = `/**
 * lib/agents/specialists/index.ts — Crew specialist registry.
 *
 * Re-exports the typed \`Specialist\` records and the \`allSpecialists\`
 * tuple so the crew runner can be given a uniform list.
 */

import "server-only";

import { ${newSlug} } from "./${newSlug}";

export { ${newSlug} };

export const allSpecialists = [${newSlug}] as const;

export type SpecialistSlug = (typeof allSpecialists)[number]["slug"];

export function getSpecialist(slug: string) {
  return allSpecialists.find((s) => s.slug === slug);
}
`;
    await writeFile(path, fresh, "utf8");
    return;
  }

  let src = await readFile(path, "utf8");

  // Collect existing slugs from `import { X } from "./X";` lines.
  const importRegex = /import\s+\{\s*([a-zA-Z][a-zA-Z0-9-]*)\s*\}\s+from\s+"\.\/([a-zA-Z][a-zA-Z0-9-]*)";/g;
  const existing = new Set();
  for (const m of src.matchAll(importRegex)) {
    existing.add(m[1]);
  }

  if (existing.has(newSlug)) {
    // Already registered — no-op (idempotent).
    return;
  }

  const allSlugs = [...existing, newSlug];
  // Aura always leads; everyone else alphabetical.
  const others = allSlugs.filter((s) => s !== "aura").sort();
  const ordered = allSlugs.includes("aura") ? ["aura", ...others] : others;

  // Insert the new import line. Find the block of `import { ... } from "./..."`
  // lines and replace it wholesale, alphabetised (aura still first if present).
  const importLines = ordered
    .filter((s) => existing.has(s) || s === newSlug)
    .slice()
    .sort()
    .map((s) => `import { ${s} } from "./${s}";`)
    .join("\n");

  // Replace the first run of those imports.
  src = src.replace(
    /(?:import\s+\{\s*[a-zA-Z][a-zA-Z0-9-]*\s*\}\s+from\s+"\.\/[a-zA-Z][a-zA-Z0-9-]*";\s*)+/,
    `${importLines}\n\n`,
  );

  // Replace the `export { ... }` line.
  const exportList = ordered.join(", ");
  src = src.replace(
    /export\s+\{[^}]*\};/,
    `export { ${exportList} };`,
  );

  // Replace the `allSpecialists` tuple.
  src = src.replace(
    /export\s+const\s+allSpecialists\s*=\s*\[[^\]]*\]\s*as\s+const;/,
    `export const allSpecialists = [${ordered.join(", ")}] as const;`,
  );

  await writeFile(path, src, "utf8");
}

/**
 * Patches lib/agents/cast.ts to:
 *  - add `import <slug>Json from "data/agents/<slug>.json";` after the
 *    existing JSON imports;
 *  - add `const <slug> = <slug>Json as CastMember;` after the existing
 *    casts;
 *  - add the slug to the `cast` readonly array (alphabetical, aura first);
 *  - add the slug to the trailing `export { ... }`.
 */
async function patchCastTs(path, newSlug) {
  if (!existsSync(path)) {
    throw new Error(`cast.ts not found at ${path}. Expected an existing registry.`);
  }

  let src = await readFile(path, "utf8");

  const jsonImportRegex = /import\s+([a-zA-Z][a-zA-Z0-9]*)Json\s+from\s+"data\/agents\/([a-zA-Z][a-zA-Z0-9-]*)\.json";/g;
  const existing = new Set();
  for (const m of src.matchAll(jsonImportRegex)) {
    existing.add(m[2]);
  }

  if (existing.has(newSlug)) {
    // Idempotent.
    return;
  }

  // Add the JSON import after the last existing JSON import.
  const newJsonImport = `import ${newSlug}Json from "data/agents/${newSlug}.json";\n`;
  const lastJsonImportMatch = [...src.matchAll(jsonImportRegex)].pop();
  if (lastJsonImportMatch) {
    const end = lastJsonImportMatch.index + lastJsonImportMatch[0].length;
    src = src.slice(0, end) + "\n" + newJsonImport + src.slice(end + 1);
  } else {
    // Bootstrap path — unlikely given the registry is established.
    src = newJsonImport + src;
  }

  // Add the CastMember cast after the last existing cast.
  const castRegex = /const\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*([a-zA-Z][a-zA-Z0-9]*)Json\s+as\s+CastMember;/g;
  const lastCastMatch = [...src.matchAll(castRegex)].pop();
  const newCastLine = `const ${newSlug} = ${newSlug}Json as CastMember;`;
  if (lastCastMatch) {
    const end = lastCastMatch.index + lastCastMatch[0].length;
    src = src.slice(0, end) + "\n" + newCastLine + src.slice(end);
  }

  // Patch the `cast` array — aura first, rest alphabetical.
  const allSlugs = [...existing, newSlug];
  const others = allSlugs.filter((s) => s !== "aura").sort();
  const ordered = allSlugs.includes("aura") ? ["aura", ...others] : others;

  src = src.replace(
    /export\s+const\s+cast\s*:\s*ReadonlyArray<CastMember>\s*=\s*\[[\s\S]*?\]\s+as\s+const;/,
    `export const cast: ReadonlyArray<CastMember> = [\n  ${ordered.join(",\n  ")},\n] as const;`,
  );

  // Patch the trailing `export { aura, coco, marcel, scribe, penny };`
  src = src.replace(
    /export\s+\{\s*([a-zA-Z][a-zA-Z0-9-]*(?:\s*,\s*[a-zA-Z][a-zA-Z0-9-]*)*)\s*\}\s*;\s*$/,
    `export { ${ordered.join(", ")} };\n`,
  );

  await writeFile(path, src, "utf8");
}

/**
 * Rollback. Removes anything we created; restores anything we modified.
 */
async function rollback(txn) {
  for (const p of txn.created) {
    try {
      await unlink(p);
    } catch {
      // Best-effort.
    }
  }
  for (const { path, content } of txn.restore) {
    try {
      if (content === "") {
        await unlink(path).catch(() => {});
      } else {
        await writeFile(path, content, "utf8");
      }
    } catch {
      // Best-effort.
    }
  }
}

function printUsage() {
  console.log(`scaffold-specialist — generate a new Holoflow Studio specialist.

Usage:
  node scripts/scaffold-specialist.mjs \\
    --slug "babette" \\
    --display-name "Babette" \\
    --role "The Lensmaker" \\
    --kingdom "biomech" \\
    --voice "warm but rigorous, calibrates against light + materials" \\
    --speaks-about "lenses, depth, focal length, the rig" \\
    --prefer-model "claude-sonnet-4-6" \\
    --tools "memory.recall,memory.remember,research.recall,print.check" \\
    --vrm "/avatars/babette.vrm"

Required flags:
  --slug <kebab>          unique kebab-case identifier (2-40 chars)
  --display-name <text>   human-readable name
  --role <text>           CrewAI-style role label (e.g. "The Lensmaker")
  --kingdom <one-of-8>    one of: ${KINGDOMS.join(", ")}
  --voice <text>          voice register, plain English
  --speaks-about <csv>    comma-separated list of topics
  --prefer-model <name>   bare model id (provider auto-inferred from prefix)

Optional flags:
  --tools <csv>           tool allow-list (default: ${DEFAULT_TOOLS.join(",")})
  --vrm <path>            VRM path (default: /avatars/<slug>.vrm)
  --force                 overwrite existing files
  --dry-run               print the plan, write nothing
  --help, -h              this message

Exit codes:
  0 success
  1 bad args, validation failure, or fatal filesystem error
`);
}
