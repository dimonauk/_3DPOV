#!/usr/bin/env node
/**
 * scripts/migrate-articles-registry.mjs — one-shot writing-registry
 * migrator. Generalises across lib/{articles,journal,tutorials}.tsx;
 * defaults to articles when no argv is passed.
 *
 * Usage:
 *   node scripts/migrate-articles-registry.mjs            # articles
 *   node scripts/migrate-articles-registry.mjs journal    # journal
 *   node scripts/migrate-articles-registry.mjs tutorials  # tutorials
 *
 * Migrates lib/<target>.tsx from a central ENTRIES array to the
 * colocated-`entry`-export pattern per docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * For each entry in ENTRIES:
 *  - Locate the component file at components/articles/entries/<slug>.tsx
 *  - Append `export const entry: Entry = { slug, title, date, kind,
 *    excerpt, Body: <ComponentName>, related?, furtherReading? }` to it
 *  - Ensure `import type { Entry } from "lib/writing"` is present
 *
 * Then rewrite lib/articles.tsx to:
 *  - Replace `import Component from "...";` lines with
 *    `import { entry as <slug>Entry } from "...";`
 *  - Replace each `{ slug, title, ... },` block with `<slug>Entry,`
 *
 * Skips entries whose Body export is already migrated (idempotent —
 * detects the named `entry` export and leaves it alone).
 *
 * Safe to re-run.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const TARGET = process.argv[2] ?? "articles";
if (!["articles", "journal", "tutorials"].includes(TARGET)) {
  console.error(`Unknown target ${TARGET}; expected one of articles|journal|tutorials`);
  process.exit(2);
}
const ARTICLES_TSX = path.join(REPO, `lib/${TARGET}.tsx`);
const ENTRIES_DIR = path.join(REPO, `components/${TARGET}/entries`);
const IMPORT_PREFIX = `components/${TARGET}/entries/`;

const slugToEntryName = (slug) =>
  `${slug
    .split("-")
    .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("")}Entry`;

// Read source articles.tsx.
const src = await readFile(ARTICLES_TSX, "utf8");

// Parse import map: default-import name → file slug.
const importMap = new Map();
const importRegex = new RegExp(
  String.raw`^import (\w+) from "components\/${TARGET}\/entries\/([^"]+)";$`,
  "gm",
);
for (const m of src.matchAll(importRegex)) {
  importMap.set(m[1], m[2]);
}

// Find ENTRIES bounds.
const entriesStart = src.indexOf("const ENTRIES: Entry[] = [");
const entriesEnd = src.indexOf("\n];", entriesStart);
if (entriesStart < 0 || entriesEnd < 0) {
  throw new Error("ENTRIES array not found");
}
const entriesBody = src.slice(entriesStart, entriesEnd + 3);

// Find each top-level entry object — depth-aware brace matching, starting at "  {".
const entries = [];
let i = 0;
while (i < entriesBody.length) {
  // Find next top-level "  {" — preceded by either "[" or ",".
  const objStart = entriesBody.indexOf("\n  {", i);
  if (objStart < 0) break;
  // Walk forward tracking nested braces, respecting strings.
  let depth = 0;
  let pos = objStart + 1;
  let inString = null;
  let escape = false;
  let inTemplate = false;
  while (pos < entriesBody.length) {
    const c = entriesBody[pos];
    if (escape) {
      escape = false;
    } else if (c === "\\") {
      escape = true;
    } else if (inString) {
      if (c === inString) inString = null;
    } else if (inTemplate) {
      if (c === "`") inTemplate = false;
    } else if (c === '"' || c === "'") {
      inString = c;
    } else if (c === "`") {
      inTemplate = true;
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        // Found end of object.
        entries.push(entriesBody.slice(objStart + 1, pos + 1));
        i = pos + 1;
        break;
      }
    }
    pos++;
  }
  if (depth !== 0) {
    throw new Error("brace mismatch parsing ENTRIES");
  }
}

// For each entry, find the slug + Body component name.
function parseEntry(text) {
  const slug = text.match(/slug:\s*"([^"]+)"/)?.[1];
  const body = text.match(/Body:\s*(\w+)/)?.[1];
  if (!slug || !body) throw new Error(`could not parse slug/Body from:\n${text.slice(0, 200)}`);
  const fileSlug = importMap.get(body);
  if (!fileSlug) throw new Error(`no import for component ${body}`);
  return { slug, body, fileSlug, text };
}

const parsed = entries.map(parseEntry);
console.log(`Parsed ${parsed.length} entries.`);

let migratedCount = 0;
let skippedCount = 0;

for (const e of parsed) {
  const file = path.join(ENTRIES_DIR, `${e.fileSlug}.tsx`);
  let content;
  try {
    content = await readFile(file, "utf8");
  } catch (err) {
    console.warn(`SKIP ${e.slug} — component file missing: ${err.message}`);
    continue;
  }

  if (content.includes("export const entry:")) {
    skippedCount++;
    continue;
  }

  // Ensure Entry type import.
  let next = content;
  if (!next.includes('import type { Entry }') && !next.includes('import { Entry }')) {
    // Insert after the last top-of-file import; or at the top if no imports.
    const lastImport = next.match(/^(import .+\n)+/m);
    if (lastImport) {
      const insertAt = lastImport.index + lastImport[0].length;
      next =
        next.slice(0, insertAt) +
        `\nimport type { Entry } from "lib/writing";\n` +
        next.slice(insertAt);
    } else {
      next = `import type { Entry } from "lib/writing";\n\n${next}`;
    }
  }

  // Append the entry export.
  const trimmed = next.replace(/\s+$/, "");
  next =
    trimmed +
    `\n\n/**\n * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.\n */\nexport const entry: Entry = ${e.text};\n`;

  await writeFile(file, next, "utf8");
  migratedCount++;
}

console.log(`Migrated ${migratedCount} component files (${skippedCount} already migrated).`);

// Rewrite lib/articles.tsx.
const newSrc = (() => {
  let out = src;

  // Replace each default-import with named-entry-import, in path order.
  for (const [bodyName, fileSlug] of importMap.entries()) {
    const entryName = slugToEntryName(fileSlug);
    const oldImport = `import ${bodyName} from "${IMPORT_PREFIX}${fileSlug}";`;
    const newImport = `import { entry as ${entryName} } from "${IMPORT_PREFIX}${fileSlug}";`;
    if (out.includes(oldImport)) {
      out = out.replace(oldImport, newImport);
    }
  }

  // Now collapse the ENTRIES array — replace the parsed body section
  // with one-liner references in the same order as `parsed`.
  const refs = parsed.map((e) => `  ${slugToEntryName(e.fileSlug)},`).join("\n");
  const newEntries = `const ENTRIES: Entry[] = [\n${refs}\n];`;
  out = out.replace(entriesBody, newEntries);

  return out;
})();

await writeFile(ARTICLES_TSX, newSrc, "utf8");
console.log(`Rewrote ${ARTICLES_TSX}.`);
