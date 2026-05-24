/**
 * lib/agents/research/index-internal-docs/parsers.ts
 *
 * Markdown and TSX-entry parsers. Pure functions: take raw text,
 * return a ParsedDoc. No filesystem, no IO. Owns the brittle parts
 * of doc parsing (YAML-ish frontmatter, regex-extracting JSX fields)
 * so the orchestrator stays oblivious.
 */

export type ParsedDoc = {
  /** Display title. */
  title: string;
  /** First paragraph or excerpt. Becomes the summary. */
  firstPara: string;
  /** Tags extracted from frontmatter / heuristics. */
  tags: string[];
  /** First ~3000 chars of body — used for content + classification. */
  excerptText: string;
};

/**
 * Pull a YAML-ish frontmatter block (`---\n...\n---`) from the head
 * of a markdown file. Returns the parsed key/value object and the
 * remaining body. By-hand to avoid a frontmatter parser dep just
 * for this. Strings only — frontmatter beyond strings is rare here.
 */
export function splitFrontmatter(raw: string): {
  fm: Record<string, string | string[]>;
  body: string;
} {
  if (!raw.startsWith("---")) return { fm: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { fm: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const fm: Record<string, string | string[]> = {};
  for (const line of block.split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const valueRaw = (m[2] ?? "").trim();
    if (!key) continue;
    if (valueRaw.startsWith("[") && valueRaw.endsWith("]")) {
      const inner = valueRaw.slice(1, -1);
      fm[key] = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      fm[key] = valueRaw.replace(/^["']|["']$/g, "");
    }
  }
  return { fm, body };
}

export function parseMarkdown(raw: string, filenameTitle: string): ParsedDoc {
  const { fm, body } = splitFrontmatter(raw);
  let title = filenameTitle;
  if (typeof fm.title === "string" && fm.title) title = fm.title;
  else {
    const headingMatch = /^#\s+(.+)$/m.exec(body);
    if (headingMatch && headingMatch[1]) title = headingMatch[1].trim();
  }
  const paraSource = body.replace(/^#+\s.*$/gm, "").trim();
  const firstPara = (paraSource.split(/\n\s*\n/)[0] ?? "").trim().slice(0, 500);
  const tags = Array.isArray(fm.tags)
    ? fm.tags
    : typeof fm.tags === "string"
    ? fm.tags.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    title,
    firstPara,
    tags,
    excerptText: body.slice(0, 3000),
  };
}

/**
 * Tutorial / article / journal entries live in .tsx files. They
 * export a `const entry: Entry = { slug, title, date, excerpt, ... }`
 * record after the React body component. We don't compile them —
 * regex-extract the literal fields we need. The site's entry-record
 * style is consistent enough that this works for all 100+ files.
 */
export function parseTsxEntry(raw: string, filenameTitle: string): ParsedDoc {
  const title = extractTsxStringField(raw, "title") ?? filenameTitle;
  const excerpt = extractTsxStringField(raw, "excerpt") ?? "";
  const bodyMatch =
    /export default function[\s\S]*?return\s*\(\s*([\s\S]*?)\s*\);?\s*\}/m.exec(
      raw,
    );
  const bodyJsx = bodyMatch ? bodyMatch[1] : "";
  const bodyText = (bodyJsx ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
  return {
    title,
    firstPara: excerpt || bodyText.slice(0, 500),
    tags: [],
    excerptText: bodyText,
  };
}

function extractTsxStringField(raw: string, key: string): string | null {
  const re = new RegExp(`${key}\\s*:\\s*([\"\\\`])((?:\\\\.|(?!\\1).)*?)\\1`);
  const m = re.exec(raw);
  return m && typeof m[2] === "string" ? m[2] : null;
}
