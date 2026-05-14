#!/usr/bin/env node
/**
 * Re-apply the mind-ar Three.js r152+ patch.
 *
 * Run after `pnpm install` if AR routes break with:
 *   "Attempted import error: 'sRGBEncoding' is not exported from 'three'"
 *
 * See patches/mind-ar.md for context.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";

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

// If it's already patched, exit clean — idempotent.
if (!content.includes("sRGBEncoding") && content.includes("SRGBColorSpace")) {
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

const patched = content
  .replace(/sRGBEncoding/g, "SRGBColorSpace")
  .replace(/LinearEncoding/g, "LinearSRGBColorSpace")
  .replace(/outputEncoding/g, "outputColorSpace");

await fs.writeFile(bundle, patched);
console.log("✅ Patched mind-ar bundle: sRGBEncoding → SRGBColorSpace + related");
