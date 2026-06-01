/**
 * scripts/migrate-atelier-pages.mjs
 *
 * Converts atelier tool pages from manual header markup to AtelierToolPage.
 * Safe: backs up originals to _vNold before writing.
 * Run: node scripts/migrate-atelier-pages.mjs
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ATELIER   = path.join(__dirname, "../app/atelier");

const dirs = fs.readdirSync(ATELIER).filter(d =>
  fs.statSync(path.join(ATELIER, d)).isDirectory()
);

let converted = 0, skipped = 0;

for (const dir of dirs) {
  const file = path.join(ATELIER, dir, "page.tsx");
  if (!fs.existsSync(file)) { skipped++; continue; }

  const src = fs.readFileSync(file, "utf8");

  // Skip client pages and already-converted pages
  if (src.startsWith('"use client"') || src.startsWith("'use client'")) { skipped++; continue; }
  if (src.includes("AtelierToolPage")) { skipped++; continue; }

  // Must have the chrome-label pattern
  if (!src.includes("chrome-label")) { skipped++; continue; }

  // ── Extract parts ──────────────────────────────────────────────────

  // label: <div className="chrome-label">...</div>
  const labelM = src.match(/<div className="chrome-label">([^<]+)<\/div>/);
  if (!labelM) { skipped++; continue; }
  const label = labelM[1].trim();

  // headline: text inside <h1 ...>...</h1> (strip tags, keep <br />, <em>)
  const h1M = src.match(/<h1 [^>]+>([\s\S]+?)<\/h1>/);
  if (!h1M) { skipped++; continue; }
  const headlineRaw = h1M[1].trim();
  // Check if it's complex JSX (has components other than br/em/span)
  const isComplexH1 = /[A-Z][A-Za-z]+/.test(headlineRaw.replace(/<br\s*\/?>/g, "").replace(/<\/?em>/g, "").replace(/<\/?(span|strong|b|i)[^>]*>/g, ""));

  // body: first <p className="mt-6 max-w-2xl text-chrome-200">
  const bodyM = src.match(/<p className="mt-6 max-w-2xl text-chrome-200">([\s\S]+?)<\/p>/);
  if (!bodyM) { skipped++; continue; }
  const bodyRaw = bodyM[1].trim();
  // Skip if body contains JSX components
  if (/[A-Z][A-Za-z]+/.test(bodyRaw.replace(/<[^>]+>/g, ""))) { skipped++; continue; }
  const body = bodyRaw.replace(/<[^>]+>/g, "").replace(/&mdash;/g, "—").replace(/&rsquo;/g, "'").replace(/&nbsp;/g, " ");

  // secondary (optional)
  const secM = src.match(/<p className="mt-4 max-w-2xl text-chrome-300">([\s\S]+?)<\/p>/);
  const secondary = secM
    ? secM[1].trim().replace(/<[^>]+>/g, "").replace(/&mdash;/g, "—").replace(/&rsquo;/g, "'")
    : undefined;

  // chips (optional)
  const chipsBlockM = src.match(/<div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">([\s\S]+?)<\/div>/);
  const chips = [];
  if (chipsBlockM) {
    const hrefRe = /href="([^"]+)"[^>]*>([^<]+)</g;
    let m;
    while ((m = hrefRe.exec(chipsBlockM[1])) !== null) {
      chips.push({ href: m[1], label: m[2].trim() });
    }
  }

  // find the client component import + JSX usage
  // Pattern: import XxxClient from "./xxx-client"  or  import Xxx from "..."
  const clientImportM = src.match(/import\s+(\w+)\s+from\s+"\.\/[^"]+"/g) || [];
  const clientImports = clientImportM.filter(i => !i.includes("Footer")).join("\n");

  // children: content inside <div className="mt-12">
  const childrenM = src.match(/<div className="mt-12">([\s\S]+?)<\/div>/);
  const children = childrenM ? childrenM[1].trim() : "{ /* TODO */ }";

  // skip if children is complex (contains multiple lines or components with props)
  if (children.split("\n").length > 6) { skipped++; continue; }

  // other imports (not Footer, not client components we already grabbed)
  const otherImports = src
    .split("\n")
    .filter(l =>
      l.startsWith("import") &&
      !l.includes("Footer") &&
      !l.includes('"./') &&
      !l.includes("AtelierToolPage")
    )
    .join("\n");

  // ── Build new file ─────────────────────────────────────────────────
  const metaM = src.match(/export const metadata[\s\S]+?^};/m);
  const meta  = metaM ? metaM[0] : "";

  const funcNameM = src.match(/export default function (\w+)/);
  const funcName  = funcNameM ? funcNameM[1] : `${dir.replace(/-./g, m => m[1].toUpperCase())}Page`;

  const chipsStr = chips.length > 0
    ? `chips={[\n    ${chips.map(c => `{ href: "${c.href}", label: "${c.label}" }`).join(",\n    ")},\n  ]}`
    : "";

  const headlineStr = isComplexH1
    ? `headline={<>${headlineRaw}</>}`
    : `headline="${headlineRaw.replace(/<br\s*\/?>/g, " ").replace(/<\/?em>/g, "").trim()}"`;

  const newSrc = `import { AtelierToolPage } from "components/ui";
${clientImports}
${otherImports.includes("import") ? otherImports : ""}

${meta}

export default function ${funcName}() {
  return (
    <AtelierToolPage
      label="${label}"
      ${headlineStr}
      body="${body.replace(/"/g, "'")}"
      ${secondary ? `secondary="${secondary.replace(/"/g, "'")}"` : ""}
      ${chipsStr}
    >
      ${children}
    </AtelierToolPage>
  );
}
`.replace(/\n{3,}/g, "\n\n");

  // ── Backup + write ─────────────────────────────────────────────────
  const backup = file.replace("page.tsx", "page_vNold.tsx");
  fs.writeFileSync(backup, src);
  fs.writeFileSync(file, newSrc);
  console.log(`✓ ${dir}`);
  converted++;
}

console.log(`\nDone: ${converted} converted, ${skipped} skipped.`);
