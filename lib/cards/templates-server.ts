import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Card template — pre-designed starting point for new cards.
 *
 * Templates live at data/templates/*.json. Each one ships:
 *   - A brand palette (primary / secondary / accent / textOnBrand / font)
 *   - A starter role + tagline that hints at the persona
 *
 * Templates are NOT cards — they have no slug, no contact details,
 * no AR config. They're the "blank with paint already on the walls"
 * that an editor starts from.
 *
 * The /cards/design page reads these via /api/templates and shows a
 * picker grid so non-designers can ship a card without picking
 * colours from scratch.
 */

export type CardTemplate = {
  /** Stable identifier — used in URL params, never renamed */
  id: string;
  /** Human-readable name shown in the picker */
  name: string;
  /** Short paragraph explaining who it's for */
  description: string;
  /** Tags for filtering / search */
  tags: string[];
  /** Brand palette this template starts with */
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    textOnBrand: string;
    font: "display" | "serif" | "mono";
  };
  /** Starting role + tagline — pure suggestions, owner can rewrite */
  starter: {
    role: string;
    tagline: string;
  };
};

const TEMPLATES_DIR = path.join(process.cwd(), "data", "templates");

/**
 * List every available template. Caller's responsibility to cache
 * if they want; this is a fresh disk scan each call (~2-10ms with
 * 8-12 templates) so it's fine to call per request.
 */
export async function listTemplates(): Promise<CardTemplate[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(TEMPLATES_DIR);
  } catch {
    return [];
  }
  const templates: CardTemplate[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(TEMPLATES_DIR, entry), "utf8");
      const parsed = JSON.parse(raw) as CardTemplate;
      if (
        typeof parsed.id === "string" &&
        typeof parsed.name === "string" &&
        typeof parsed.palette?.primary === "string" &&
        typeof parsed.palette?.secondary === "string"
      ) {
        templates.push(parsed);
      }
    } catch {
      // skip malformed template
    }
  }
  return templates;
}

/**
 * Get a single template by id, or null if not found.
 */
export async function getTemplate(id: string): Promise<CardTemplate | null> {
  if (!/^[a-z0-9-]+$/i.test(id)) return null;
  const all = await listTemplates();
  return all.find((t) => t.id === id) ?? null;
}
