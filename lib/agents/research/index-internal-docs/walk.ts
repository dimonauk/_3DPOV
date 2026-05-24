/**
 * lib/agents/research/index-internal-docs/walk.ts
 *
 * Recursive filesystem walk with extension filter + a tolerant stat
 * helper that returns null instead of throwing on missing paths.
 * The only IO module in the indexer; everything else is pure.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export async function safeStat(
  p: string,
): Promise<import("node:fs").Stats | null> {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

export async function walkDirectory(
  root: string,
  extensions: readonly string[],
): Promise<string[]> {
  const out: string[] = [];
  const stat = await safeStat(root);
  if (!stat || !stat.isDirectory()) return out;
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(root, ent.name);
    if (ent.isDirectory()) {
      const nested = await walkDirectory(full, extensions);
      out.push(...nested);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (extensions.includes(ext)) out.push(full);
    }
  }
  return out;
}
