/**
 * components/aura/aura-launcher/path-gating.ts — Allow/deny path
 * lists for the Aura launcher + the `pathContext` blurb that tells
 * Aura where the visitor currently is.
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1. Pure
 * functions — the orchestrator uses `shouldShow` to gate the mount,
 * and `pathContext` to ground replies in the current page.
 */

/** Paths where Aura shows. Match by prefix (or by equality for "/"). */
export const SHOW_ON_PATHS = [
  // Homepage — concierge greeting + route-finding for first-time
  // visitors. "/" only matches exactly via the equality check; it
  // does NOT prefix-match every URL.
  "/",
  // Cards platform: the gallery, the designer, bulk import.
  // Per-card landings live at /c/[slug] and are HIDDEN below so
  // the card's own Aura panel (AuraCompanion) wins on those routes.
  "/cards",
  // Visitor's saved wallet collection.
  "/wallet",
  // Original allow-list (long-form content + studio chambers).
  "/articles",
  "/journal",
  "/tutorials",
  "/codex",
  "/research",
  "/atelier",
  "/holo-walk",
  "/aerial",
  "/cast",
  "/bureau",
  "/play",
  "/chrono-protocol",
  "/aura",
];

/** Paths where Aura is explicitly hidden, even if prefix-matched. */
export const HIDE_ON_PATHS = [
  "/admin",
  "/api",
  "/studio",
  "/aura/web-llm", // the dedicated chat page has its own embedded UI
  // The per-card landing pages have their own card-scoped Aura panel
  // (components/ar/AuraCompanion.tsx) inside the Avatar tab — two
  // Auras would compete for the visitor's attention.
  "/c",
  // Owner-only backstage. She doesn't host the host — owners working
  // on their own card management aren't visitors needing routing.
  // (Future: a "backstage mode" persona that drafts replies + summarises
  // analytics. For now, stay out of their way.)
  "/cards/mine",
];

export function shouldShow(pathname: string | null): boolean {
  if (!pathname) return false;
  if (
    HIDE_ON_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return false;
  }
  return SHOW_ON_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function pathContext(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (!first)
    return "The visitor is on the homepage — first impression. The hypercube hero dominates above the fold. Read what they're looking for and route them: /cards for the AR business card gallery + designer, /atelier for the studio's portfolio, /shop for editioned waveguide sculptures + prints. Or just answer their question.";
  const rest = segments.slice(1).join("/");

  // Codex entries: produce a richer "you're reading about X" prompt so
  // Aura grounds her answers in the specific topic. The slug is the
  // topic — no codex-data import needed (avoids pulling 33 body
  // components into the launcher bundle).
  if (first === "codex" && segments.length > 1) {
    const slug = segments[1] ?? "";
    const topic = slug.replace(/-/g, " ").trim();
    if (topic) {
      return `The visitor is reading the studio's codex entry on "${topic}". Ground your replies in what you know about this topic. Where relevant, point them at the studio's own codex.`;
    }
  }

  // Cards platform: /cards/design and /cards/mine/import get special
  // sub-page treatment so Aura knows the visitor is mid-task, not
  // just browsing.
  if (first === "cards" && segments.length > 1) {
    const sub = segments[1];
    if (sub === "design") {
      return 'The visitor is at the AR business card designer (/cards/design). They can: scan a physical business card to autofill the form (📸 AI Scanner button at the top), pick from 9 templates, or start blank. Bulk CSV import is at /cards/mine/import for owners. Encourage them to try the scanner — it costs about a tenth of a cent and saves typing.';
    }
  }
  if (first === "wallet") {
    return "The visitor is browsing their saved card wallet (/wallet). These are AR business cards they've collected from scanning others'.";
  }
  if (first === "c" && segments.length > 1) {
    const slug = segments[1] ?? "";
    return `The visitor is on the public card landing for "${slug}" (/c/${slug}). NOTE: this page has its own per-card Aura panel inside the Avatar tab — you (site-wide Aura) are HIDDEN here, so this branch never fires in practice. Kept for safety.`;
  }

  const blurbs: Record<string, string> = {
    articles: "The visitor is reading an article",
    journal: "The visitor is reading a journal entry",
    tutorials: "The visitor is reading a tutorial",
    codex: "The visitor is browsing the codex",
    photographs: "The visitor is in the photograph gallery",
    aerial: "The visitor is on the aerial / drone page",
    atelier: "The visitor is in the atelier",
    "holo-walk": "The visitor is on a HoloWalk page",
    research: "The visitor is on the research notebook",
    play: "The visitor is on the play page",
    cast: "The visitor is meeting the cast",
    bureau: "The visitor is at the bureau",
    "chrono-protocol": "The visitor is in the chrono protocol",
    aura: "The visitor is on an Aura-specific page",
    cards:
      "The visitor is in the public AR business cards gallery (/cards). Demo cards by Dimona + the studio. They can browse, scan QR codes, or hit 'Design a new card' to make their own at /cards/design.",
  };
  const base = blurbs[first] ?? `The visitor is on /${first}`;
  return rest ? `${base} (${rest}).` : `${base}.`;
}
