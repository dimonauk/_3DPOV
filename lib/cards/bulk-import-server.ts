import "server-only";

/**
 * Bulk CSV import — parse a CSV of card data and create N cards
 * in one go. Designed for users with multiple cards (speakers in
 * a team, performers in a collective, agents in a sales org, etc.)
 * who want to provision cards without using the designer one by one.
 *
 * CSV column conventions (case-insensitive headers):
 *
 *   slug              optional — will be slugified from name if absent
 *   name              required
 *   role              required
 *   studio            optional
 *   tagline           optional
 *   email             optional
 *   phone             optional
 *   website           optional
 *   primary           optional hex colour (e.g. "#FF6FB5")
 *   secondary         optional hex colour
 *   accent            optional hex colour
 *   textOnBrand       optional hex colour
 *   font              optional ("display" | "serif" | "mono")
 *   linkedin          optional handle / URL
 *   instagram         optional handle / URL
 *   twitter           optional handle / URL
 *   github            optional handle / URL
 *
 * Rows missing required fields are skipped; the result lists every
 * row's outcome so the caller can show a per-row status report.
 *
 * Each row creates a card doc in Firestore under cards/<slug> with
 * the importer's uid as ownerUid. If a slug already exists and is
 * owned by someone else, the row is skipped with a conflict error.
 * If the slug exists and IS owned by the same user, it's overwritten
 * (treat re-import as update).
 */

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export type ImportRow = {
  rowNumber: number; // 1-indexed, matches the spreadsheet row
  slug?: string;
  name?: string;
  role?: string;
  studio?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  website?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  textOnBrand?: string;
  font?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  github?: string;
};

export type RowResult =
  | { rowNumber: number; status: "created"; slug: string }
  | { rowNumber: number; status: "updated"; slug: string }
  | { rowNumber: number; status: "skipped"; reason: string; slug?: string };

const SAFE_SLUG = /^[a-z0-9-]+$/;
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function isHexColor(s: string): boolean {
  return HEX_COLOR.test(s.trim());
}

function normaliseHex(s: string): string {
  let v = s.trim();
  if (!v.startsWith("#")) v = "#" + v;
  return v;
}

/**
 * Parse a CSV string (RFC 4180-ish — handles double-quoted fields
 * including escaped quotes "") into an array of rows. Each row is
 * an object keyed by lowercased header.
 *
 * No dependencies — papaparse / csv-parse would be heavier than
 * needed here for the bounded set of expected columns.
 */
export function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        // Escaped quote? Peek the next char.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      // Eat \r\n pair.
      if (c === "\r" && text[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length === 0) return [];

  const headers = rows[0]!.map((h) => h.trim().toLowerCase());
  const result: Array<Record<string, string>> = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    if (row.length === 1 && row[0]!.trim() === "") continue; // blank line
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c]!;
      const val = (row[c] ?? "").trim();
      if (key) obj[key] = val;
    }
    result.push(obj);
  }
  return result;
}

/**
 * Convert parsed CSV rows into ImportRow shape with row numbers.
 */
export function rowsToImportRows(
  parsed: Array<Record<string, string>>,
): ImportRow[] {
  return parsed.map((p, idx) => ({
    rowNumber: idx + 2, // header is row 1, first data row is row 2
    slug: p.slug || undefined,
    name: p.name || undefined,
    role: p.role || undefined,
    studio: p.studio || undefined,
    tagline: p.tagline || undefined,
    email: p.email || undefined,
    phone: p.phone || undefined,
    website: p.website || undefined,
    primary: p.primary || undefined,
    secondary: p.secondary || undefined,
    accent: p.accent || undefined,
    textOnBrand: p["textonbrand"] || p["text on brand"] || undefined,
    font: p.font || undefined,
    linkedin: p.linkedin || undefined,
    instagram: p.instagram || undefined,
    twitter: p.twitter || p.x || undefined,
    github: p.github || undefined,
  }));
}

/**
 * Run a bulk import as the given user. Returns per-row outcomes.
 */
export async function importCards(
  rows: ImportRow[],
  ownerUid: string,
): Promise<RowResult[]> {
  const db = requireFirebaseAdminDb();
  const results: RowResult[] = [];

  for (const row of rows) {
    if (!row.name) {
      results.push({
        rowNumber: row.rowNumber,
        status: "skipped",
        reason: "missing name",
      });
      continue;
    }
    if (!row.role) {
      results.push({
        rowNumber: row.rowNumber,
        status: "skipped",
        reason: "missing role",
      });
      continue;
    }

    let slug = (row.slug ?? slugify(row.name)).toLowerCase();
    if (!SAFE_SLUG.test(slug)) {
      results.push({
        rowNumber: row.rowNumber,
        status: "skipped",
        reason: "invalid slug — only a-z 0-9 - allowed",
      });
      continue;
    }
    // Reserved slugs we never let users claim.
    if (
      slug === "design" ||
      slug === "mine" ||
      slug === "preview" ||
      slug === "embed"
    ) {
      results.push({
        rowNumber: row.rowNumber,
        status: "skipped",
        slug,
        reason: "slug is reserved",
      });
      continue;
    }

    // Check existing card.
    const ref = db.collection("cards").doc(slug);
    const snap = await ref.get();
    const existing = snap.exists
      ? (snap.data() as { ownerUid?: string })
      : null;
    if (existing && existing.ownerUid && existing.ownerUid !== ownerUid) {
      results.push({
        rowNumber: row.rowNumber,
        status: "skipped",
        slug,
        reason: "slug already taken by another user",
      });
      continue;
    }

    // Validate colours.
    for (const colourField of [
      "primary",
      "secondary",
      "accent",
      "textOnBrand",
    ] as const) {
      const v = row[colourField];
      if (v && !isHexColor(v)) {
        results.push({
          rowNumber: row.rowNumber,
          status: "skipped",
          slug,
          reason: `invalid ${colourField} colour (must be hex like #FF6FB5)`,
        });
      }
    }

    const handles: Array<{ platform: string; handle: string; url?: string }> = [];
    if (row.linkedin) {
      handles.push({
        platform: "linkedin",
        handle: row.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, ""),
        url: row.linkedin.startsWith("http")
          ? row.linkedin
          : `https://www.linkedin.com/in/${row.linkedin}`,
      });
    }
    if (row.instagram) {
      handles.push({
        platform: "instagram",
        handle: row.instagram.replace(/^@/, ""),
        url: row.instagram.startsWith("http")
          ? row.instagram
          : `https://instagram.com/${row.instagram.replace(/^@/, "")}`,
      });
    }
    if (row.twitter) {
      handles.push({
        platform: "x",
        handle: row.twitter.replace(/^@/, ""),
        url: row.twitter.startsWith("http")
          ? row.twitter
          : `https://x.com/${row.twitter.replace(/^@/, "")}`,
      });
    }
    if (row.github) {
      handles.push({
        platform: "github",
        handle: row.github.replace(/^@/, ""),
        url: row.github.startsWith("http")
          ? row.github
          : `https://github.com/${row.github.replace(/^@/, "")}`,
      });
    }

    const cardDoc: Record<string, unknown> = {
      slug,
      name: row.name,
      role: row.role,
      studio: row.studio ?? "",
      tagline: row.tagline ?? "",
      contact: {
        email: row.email ?? "",
        phone: row.phone ?? "",
        website: row.website ?? "",
        handles,
      },
      brand: {
        primary: row.primary ? normaliseHex(row.primary) : "#FF6FB5",
        secondary: row.secondary ? normaliseHex(row.secondary) : "#B488E0",
        accent: row.accent ? normaliseHex(row.accent) : "#FFC1E3",
        textOnBrand: row.textOnBrand ? normaliseHex(row.textOnBrand) : "#FFFFFF",
        font:
          row.font === "display" || row.font === "serif" || row.font === "mono"
            ? row.font
            : "display",
      },
      ar: {
        anchor: "floating",
        autoRotate: true,
      },
      print: {
        unit: "mm",
        widthMm: 90,
        heightMm: 50,
      },
      public: true,
      ownerUid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (existing) {
      // Update existing.
      await ref.set(cardDoc, { merge: true });
      results.push({
        rowNumber: row.rowNumber,
        status: "updated",
        slug,
      });
    } else {
      cardDoc.createdAt = FieldValue.serverTimestamp();
      await ref.set(cardDoc);
      results.push({
        rowNumber: row.rowNumber,
        status: "created",
        slug,
      });
    }
  }

  return results;
}
