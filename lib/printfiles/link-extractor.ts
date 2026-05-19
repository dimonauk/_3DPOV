/**
 * lib/printfiles/link-extractor.ts — parse Drive / Dropbox /
 * WeTransfer / one-drive links out of an email body so the printfiles
 * engine can fetch large files (>20 MB Resend Inbound cap) that the
 * customer couldn't attach directly.
 *
 * # Why this exists
 *
 * Resend Inbound caps attachments at ~25 MB total payload. Many real
 * STLs / GLBs (high-poly scans, full statues) are 30-100 MB. Operators
 * tell customers "send a Drive/Dropbox link if your file is too big"
 * — this module extracts those links from the email body.
 *
 * # Supported sources
 *
 *   - Google Drive (`drive.google.com/file/d/<id>/...`)
 *   - Dropbox (`www.dropbox.com/s/<hash>/...` + `dropbox.com/scl/fi/...`)
 *   - WeTransfer (`wetransfer.com/downloads/<token>`)
 *   - OneDrive (`1drv.ms/...`, `onedrive.live.com/...`)
 *   - Direct https URLs ending in a recognised file extension
 *
 * # Not supported (deliberately)
 *
 *   - Mega.nz (browser-only download flow, no direct URL)
 *   - Box (auth-required)
 *   - GitHub releases (rare for STLs; if it happens, falls into the
 *     direct-link extension matcher)
 */

const ACCEPTED_EXT = /\.(stl|glb|gltf|3mf|obj)(\?|#|$)/i;

const PROVIDERS: Array<{
  id: ExtractedLink["provider"];
  match: (url: URL) => boolean;
  /** Convert the user-facing URL into a direct-download URL if the
   *  source's normal URL serves an HTML interstitial. Return null
   *  if the URL can't be converted (e.g. Drive folder vs file). */
  toDirectUrl: (url: URL) => string | null;
}> = [
  {
    id: "google-drive",
    match: (u) => /^drive\.google\.com$/i.test(u.hostname),
    toDirectUrl: (u) => {
      const m = /^\/file\/d\/([^/]+)/.exec(u.pathname);
      if (!m) return null;
      return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    },
  },
  {
    id: "dropbox",
    match: (u) =>
      /^(www\.)?dropbox\.com$/i.test(u.hostname) ||
      u.hostname.endsWith(".dropbox.com"),
    toDirectUrl: (u) => {
      // Dropbox: replace ?dl=0 with ?dl=1, OR force ?dl=1
      const url = new URL(u.toString());
      url.searchParams.set("dl", "1");
      return url.toString();
    },
  },
  {
    id: "onedrive",
    match: (u) =>
      /^(1drv\.ms|onedrive\.live\.com|.*\.sharepoint\.com)$/i.test(u.hostname),
    toDirectUrl: (u) => {
      // OneDrive: append ?download=1
      const url = new URL(u.toString());
      url.searchParams.set("download", "1");
      return url.toString();
    },
  },
  {
    id: "wetransfer",
    // WeTransfer: their /downloads/<token> URL requires a JS-driven
    // click-through; the actual file URL is computed by their JS.
    // We can't trivially extract; flag for operator follow-up.
    match: (u) => /^(www\.)?wetransfer\.com$/i.test(u.hostname),
    toDirectUrl: () => null,
  },
  {
    id: "direct",
    match: () => true, // catch-all — checked last
    toDirectUrl: (u) => u.toString(),
  },
];

export type ExtractedLink = {
  /** The link as it appeared in the email. */
  rawUrl: string;
  /** A URL we can `fetch()` to get the bytes, if extractable. */
  directUrl: string | null;
  provider: "google-drive" | "dropbox" | "onedrive" | "wetransfer" | "direct";
  /** Best guess at a filename from the URL path. May be empty. */
  inferredFilename: string;
  /** True when the link's URL path obviously points at an STL/GLB/etc.
   *  We accept any provider link even when this is false (Drive
   *  shortlinks don't carry the extension), but fail-soft on dubious
   *  ones in the fetch step. */
  hasAcceptedExtension: boolean;
};

/**
 * Strip common HTML noise out of a body so the URL regex doesn't trip
 * on entity-encoded URLs or anchor tags. Returns a plain-text view of
 * the body with `&amp;` decoded and `<a href="X">` flattened to bare
 * `X` strings.
 */
function flatten(body: string): string {
  let out = body;
  // Decode the most common entities. Full HTML decode is overkill for
  // a URL extractor that just needs `&amp;` → `&` and similar.
  out = out
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  // Flatten <a href="X">label</a> → "X label"
  out = out.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, "$1 $2");
  // Strip remaining tags
  out = out.replace(/<[^>]+>/g, " ");
  return out;
}

/**
 * Extract all candidate file-share links from an email body. Returns
 * them in the order they appear in the body (caller usually wants the
 * first one when there are multiple — that's typically the primary
 * link with subsequent ones being signature/footer URLs).
 */
export function extractLinks(body: string): ExtractedLink[] {
  const text = flatten(body);
  // Permissive URL regex — captures http(s):// up to next whitespace
  // or quote. Strips trailing punctuation that's almost certainly
  // sentence-level (periods, commas, parens, etc.).
  const urlRe = /https?:\/\/[^\s<>"'`)\]]+/gi;
  const matches = text.match(urlRe) ?? [];

  const seen = new Set<string>();
  const out: ExtractedLink[] = [];
  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;:!?)\]]+$/, "");
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    let parsed: URL;
    try {
      parsed = new URL(cleaned);
    } catch {
      continue;
    }
    const provider = PROVIDERS.find((p) => p.match(parsed))!;
    const directUrl = provider.toDirectUrl(parsed);
    const inferredFilename = filenameFromUrl(parsed);
    const hasAcceptedExtension = ACCEPTED_EXT.test(parsed.pathname);
    // Skip clearly-irrelevant direct links (e.g., signature URLs to
    // a portfolio site). For non-direct providers we keep the link
    // regardless — Drive/Dropbox URLs don't expose the extension.
    if (provider.id === "direct" && !hasAcceptedExtension) continue;
    out.push({
      rawUrl: cleaned,
      directUrl,
      provider: provider.id,
      inferredFilename,
      hasAcceptedExtension,
    });
  }
  return out;
}

/**
 * Best filename guess from a URL path. Falls back to a generic
 * "model.stl" if the path doesn't expose anything.
 */
function filenameFromUrl(url: URL): string {
  const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
  if (!last) return "";
  // Drop query / fragment slop that some providers smuggle in.
  const cleaned = last.split(/[?#]/)[0] ?? "";
  // Decode percent-encoded characters once (best-effort).
  try {
    return decodeURIComponent(cleaned);
  } catch {
    return cleaned;
  }
}
