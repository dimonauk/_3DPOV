#!/usr/bin/env node
/**
 * gen-purpose-stubs.mjs
 *
 * Walks the repo and generates blank `.PURPOSE.md` stubs for every
 * load-bearing source file that does not already have one. See
 * `docs/AGENT-FILE-DOCS.md` for the convention this script implements,
 * and `scripts/gen-purpose-stubs.md` for usage examples.
 *
 * Pure Node ESM. No dependencies. Idempotent.
 *
 *   node scripts/gen-purpose-stubs.mjs           # write missing stubs
 *   node scripts/gen-purpose-stubs.mjs --dry-run # report only
 *   node scripts/gen-purpose-stubs.mjs --root <path>  # scope to a subtree
 *   node scripts/gen-purpose-stubs.mjs --help
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep, basename, extname } from "node:path";
import { argv, exit, stdout } from "node:process";

// -----------------------------------------------------------------------------
// CLI args
// -----------------------------------------------------------------------------

const args = parseArgs(argv.slice(2));

if (args.help) {
  printHelp();
  exit(0);
}

const repoRoot = args.root ?? process.cwd();
const dryRun = args.dryRun;
const verbose = args.verbose;

// -----------------------------------------------------------------------------
// ANSI colour (no-op when stdout isn't a TTY)
// -----------------------------------------------------------------------------

const useColour = stdout.isTTY && !args.noColour;
const c = (code) => (s) => (useColour ? `\x1b[${code}m${s}\x1b[0m` : s);
const dim = c("2");
const bold = c("1");
const green = c("32");
const cyan = c("36");
const yellow = c("33");
const red = c("31");
const grey = c("90");

// -----------------------------------------------------------------------------
// Convention rules (kept in lockstep with docs/AGENT-FILE-DOCS.md)
// -----------------------------------------------------------------------------

/** Directories to walk. Anything outside these is ignored. */
const SCAN_ROOTS = ["app", "lib", "components"];

/** Directories to never descend into, even inside SCAN_ROOTS. */
const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  ".vercel",
  ".git",
  "tests",
  "test",
  "__tests__",
  "services",
  "dist",
  "build",
  "out",
  "coverage",
  ".cache",
]);

/**
 * Files that are NOT load-bearing and don't need a .PURPOSE.md.
 * Matches by basename — paths with a leading dot, or matching one of
 * these exact filenames, are skipped.
 */
const EXEMPT_BASENAMES = new Set([
  "types.ts",
  "types.tsx",
  "index.ts", // re-export barrels — see EXEMPTION_EXCEPTIONS
  "constants.ts",
  "styles.ts",
  "globals.css",
  "loading.tsx",
  "not-found.tsx",
  "error.tsx",
  "template.tsx",
  "default.tsx",
  "opengraph-image.tsx", // generator file, not a logic module
  "twitter-image.tsx",
  "icon.tsx",
  "apple-icon.tsx",
  "manifest.ts",
  "robots.ts",
  "sitemap.ts",
]);

/**
 * Paths that LOOK exempt by basename but in this repo are load-bearing.
 * If a file path ends with one of these, it gets a .PURPOSE.md anyway.
 */
const EXEMPTION_EXCEPTIONS = [
  // The capability registry's side-effecting populator.
  "lib/capabilities/index.ts",
  // The cast-bibles index file is the registry of every character.
  "lib/cast/index.ts",
];

/** Suffix-based exemptions. */
const EXEMPT_SUFFIXES = [
  ".test.ts",
  ".test.tsx",
  ".spec.ts",
  ".spec.tsx",
  ".d.ts",
  ".test.mjs",
  ".spec.mjs",
];

/** File extensions we consider source code at all. */
const SOURCE_EXTS = new Set([".ts", ".tsx"]);

// -----------------------------------------------------------------------------
// Walk + classify
// -----------------------------------------------------------------------------

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (verbose) console.error(grey(`  (cannot read ${dir}: ${err.message})`));
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

function isSourceFile(path) {
  const ext = extname(path);
  return SOURCE_EXTS.has(ext);
}

function isExempt(absPath) {
  const base = basename(absPath);
  if (base.endsWith(".PURPOSE.md")) return true;
  for (const sfx of EXEMPT_SUFFIXES) {
    if (base.endsWith(sfx)) return true;
  }
  if (EXEMPT_BASENAMES.has(base)) {
    // Check the exception list — if this exact path is load-bearing
    // despite its name, it's not exempt.
    const rel = relative(repoRoot, absPath).split(sep).join("/");
    return !EXEMPTION_EXCEPTIONS.includes(rel);
  }
  // Server-side capability halves: covered by the sibling <verb>.PURPOSE.md.
  // Skip <name>.server.ts.
  if (/\.server\.ts$/.test(base)) return true;
  return false;
}

/**
 * Infer `role:` from the relative path. Matches the table in
 * docs/AGENT-FILE-DOCS.md.
 */
function inferRole(relPath) {
  const p = relPath.split(sep).join("/");
  if (p.startsWith("app/")) {
    if (p.endsWith("/route.ts")) return "route-handler";
    if (p.endsWith("/page.tsx") || p.endsWith("/layout.tsx")) {
      return "server-component";
    }
    if (/-client\.tsx$/.test(p)) return "client-component";
    if (/\/_(helpers|parts|utils)\.tsx?$/.test(p)) return "helper";
    return "client-component"; // most other app/ tsx files are client islands
  }
  if (p.startsWith("lib/capabilities/")) return "capability";
  if (p.startsWith("lib/state/")) return "state-slice";
  if (p.startsWith("lib/algorithms/")) return "algorithm";
  if (p.startsWith("lib/")) return "lib-module";
  if (p.startsWith("components/hooks/") || /\/use[A-Z]/.test(p)) return "hook";
  if (p.startsWith("components/")) return "component";
  return "lib-module";
}

/** Compute the sibling .PURPOSE.md path for a given source path. */
function purposePathFor(srcPath) {
  const dir = dirname(srcPath);
  const base = basename(srcPath, extname(srcPath));
  return join(dir, `${base}.PURPOSE.md`);
}

/** Today's date in YYYY-MM-DD, UTC. */
function todayIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Stub body. Pre-fills YAML frontmatter, leaves the prose as TODO. */
function buildStub(relPath, role) {
  const base = basename(relPath);
  return `---
file: ${relPath.split(sep).join("/")}
role: ${role}
what: TODO — one-line what this file is.
why: |
  TODO — short paragraph or bullets — why it exists, what problem it
  solves, what would break without it.
deps: []
callers: []
exports: []
gotchas: []
last_audited: ${todayIso()}
---

# \`${base}\` — purpose twin

## TODO

Replace this stub: describe what the file is and why it exists in the
system. See \`docs/AGENT-FILE-DOCS.md\` for the convention and a worked
example. The expected sections are:

- **Role** — one-sentence what + a paragraph of why.
- **Public surface** — exports + their contracts.
- **Internal** — private helpers worth a sentence each.
- **Depends on** — modules this file imports, with a phrase each.
- **Does not** — explicit non-goals. The most valuable section.
- **Bordering files** — siblings and downstream consumers.

Delete the \`## TODO\` heading once the doc is written.
`;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

function main() {
  const stats = {
    scanned: 0,
    eligible: 0,
    alreadyDocumented: 0,
    created: 0,
    skipped: 0,
  };
  const created = [];
  const missing = [];

  console.log(bold("gen-purpose-stubs"));
  console.log(grey(`  root:    ${repoRoot}`));
  console.log(grey(`  mode:    ${dryRun ? "dry-run" : "write"}`));
  console.log(grey(`  scans:   ${SCAN_ROOTS.join(", ")}`));
  console.log("");

  const sourceFiles = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(repoRoot, root);
    if (!existsSync(abs)) {
      console.log(yellow(`  warning: ${root}/ not found, skipping`));
      continue;
    }
    walk(abs, sourceFiles);
  }

  for (const file of sourceFiles) {
    stats.scanned++;
    if (!isSourceFile(file)) {
      stats.skipped++;
      continue;
    }
    if (isExempt(file)) {
      stats.skipped++;
      continue;
    }
    stats.eligible++;
    const purpose = purposePathFor(file);
    const relPurpose = relative(repoRoot, purpose);
    const relSrc = relative(repoRoot, file);
    if (existsSync(purpose)) {
      stats.alreadyDocumented++;
      if (verbose) console.log(grey(`  ok    ${relPurpose}`));
      continue;
    }
    missing.push({ src: relSrc, purpose: relPurpose, abs: purpose, role: inferRole(relSrc) });
  }

  if (missing.length === 0) {
    console.log(green("  All eligible files already have .PURPOSE.md siblings."));
    printSummary(stats);
    return;
  }

  for (const m of missing) {
    if (dryRun) {
      console.log(`  ${yellow("would create")}  ${m.purpose}  ${dim(`(${m.role})`)}`);
      continue;
    }
    const body = buildStub(m.src, m.role);
    mkdirSync(dirname(m.abs), { recursive: true });
    writeFileSync(m.abs, body, "utf8");
    created.push(m.purpose);
    stats.created++;
    console.log(`  ${green("created")}      ${m.purpose}  ${dim(`(${m.role})`)}`);
  }

  console.log("");
  printSummary({ ...stats, created: dryRun ? missing.length : stats.created }, dryRun);

  if (dryRun && missing.length > 0) {
    console.log("");
    console.log(cyan(`  Run without --dry-run to write ${missing.length} stub${missing.length === 1 ? "" : "s"}.`));
  }
}

function printSummary(s, dry = false) {
  console.log(bold("summary"));
  console.log(`  scanned:           ${s.scanned}`);
  console.log(`  eligible:          ${s.eligible}`);
  console.log(`  already documented: ${green(s.alreadyDocumented)}`);
  console.log(`  ${dry ? "would create" : "created"}:       ${dry ? yellow(s.created) : green(s.created)}`);
  console.log(grey(`  skipped (exempt):  ${s.skipped}`));
}

function printHelp() {
  console.log(`gen-purpose-stubs.mjs

Walks the repo and writes blank .PURPOSE.md stubs for every load-bearing
source file that does not have one yet. See docs/AGENT-FILE-DOCS.md for
the convention.

Usage:
  node scripts/gen-purpose-stubs.mjs [options]

Options:
  --dry-run         Report what would be created without writing.
  --root <path>     Scope the scan to a subtree. Default: cwd.
  --verbose         Log each file checked, including those already documented.
  --no-colour       Disable ANSI colour.
  --help, -h        This message.

Exit codes:
  0   success (stubs created, or nothing to do)
  1   bad args or fatal error
`);
}

function parseArgs(raw) {
  const out = { dryRun: false, root: null, verbose: false, help: false, noColour: false };
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--verbose" || a === "-v") out.verbose = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--no-colour" || a === "--no-color") out.noColour = true;
    else if (a === "--root") {
      const next = raw[++i];
      if (!next) {
        console.error(red(`--root requires a path argument`));
        exit(1);
      }
      out.root = next;
    } else {
      console.error(red(`unknown argument: ${a}`));
      console.error(`run with --help to see usage`);
      exit(1);
    }
  }
  return out;
}

// Run.
main();
