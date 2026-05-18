#!/usr/bin/env node
/**
 * Re-apply the mind-ar patches.
 *
 * Two patches applied to dist/mindar-image-three.prod.js:
 *
 *   1. Three.js r152+ encoding rename — without this, AR routes break
 *      with: "Attempted import error: 'sRGBEncoding' is not exported
 *      from 'three'".
 *
 *   2. Strip dead-branch `require("fs")` — webpack honors the bundle's
 *      `if (IS_NODE)` runtime guard and tree-shakes the require, but
 *      Turbopack statically resolves every `require()` call regardless
 *      of reachability. In the browser the guard is always false, so
 *      we replace `require("fs")` with `({})`. If the branch ever
 *      executes (it shouldn't), it fails with "readFileSync is not a
 *      function" — same UX as a module-resolution error, no build
 *      break. Without this patch, dev hits 500 on /c/[slug] with
 *      "Module not found: Can't resolve 'fs'".
 *
 * Run after `pnpm install`. Idempotent: detects both patches before
 * rewriting.
 *
 * See patches/mind-ar.md for context.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const bundle = path.join(
  process.cwd(),
  "node_modules",
  "mind-ar",
  "dist",
  "mindar-image-three.prod.js",
);

let content;
try {
  content = await fs.readFile(bundle, "utf8");
} catch (err) {
  console.error(`Cannot read ${bundle}: ${err.message}`);
  console.error("(Did you run pnpm install? Is mind-ar listed in dependencies?)");
  process.exit(1);
}

const needsEncodingPatch =
  content.includes("sRGBEncoding") || !content.includes("SRGBColorSpace");
const needsFsPatch = /require\(["']fs["']\)/.test(content);

if (!needsEncodingPatch && !needsFsPatch) {
  console.log("✅ mind-ar bundle already patched, nothing to do");
  process.exit(0);
}

// Backup once (don't overwrite an existing backup — that would lose the original)
const backup = `${bundle}.bak`;
try {
  await fs.access(backup);
} catch {
  await fs.writeFile(backup, content);
  console.log(`📦 backed up original to ${path.basename(backup)}`);
}

let patched = content;
const applied = [];

if (needsEncodingPatch) {
  patched = patched
    .replace(/sRGBEncoding/g, "SRGBColorSpace")
    .replace(/LinearEncoding/g, "LinearSRGBColorSpace")
    .replace(/outputEncoding/g, "outputColorSpace");
  applied.push("sRGBEncoding → SRGBColorSpace + related");
}

if (needsFsPatch) {
  // Replace `require("fs")` / `require('fs')` with `({})`. The mind-ar
  // bundle only enters this branch when running under Node (guarded by
  // `IS_NODE`) and reading a "file://"-prefixed input — neither path
  // exists in the browser, so the stub object is functionally dead.
  patched = patched.replace(/require\(["']fs["']\)/g, "({})");
  applied.push('require("fs") → ({})');
}

await fs.writeFile(bundle, patched);
console.log(`✅ Patched mind-ar bundle: ${applied.join(", ")}`);
