/**
 * components/codex/codex-ref.tsx — `<CodexRef>` inline reference.
 *
 * One-line role: wrap a term in article/journal/tutorial prose so it
 * links to the corresponding codex entry, with the entry's summary
 * surfaced as a native browser tooltip on hover.
 *
 * Usage in any article body:
 *
 *   <p>
 *     Marey&rsquo;s photographic gun is the direct ancestor of
 *     <CodexRef slug="long-exposure-photography">long-exposure
 *     photography</CodexRef> as the studio practises it.
 *   </p>
 *
 * Server Component — pulls the codex meta at SSR/build, never ships
 * the codex's body components to the client. Tree-shakeable.
 *
 * Graceful degradation: an unknown slug renders its children bare
 * (no link, no tooltip) so a typo doesn't break the page or expose
 * a broken hyperlink. The Children pass through unchanged.
 *
 * # Aesthetic
 * Dotted underline in `pink-200/60` to signal "this is a defined
 * term", with a solid underline on hover. Matches the studio's
 * chrome-on-midnight palette without competing with regular prose
 * links (which use solid `pink-200` from the start).
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { getCodexEntry } from "lib/codex";

type CodexRefProps = {
  slug: string;
  children: ReactNode;
};

export default function CodexRef({ slug, children }: CodexRefProps) {
  const entry = getCodexEntry(slug);
  if (!entry) {
    // Orphan reference — render the term as plain text. The article
    // still reads; the codex link is just absent.
    return <span>{children}</span>;
  }
  return (
    <Link
      href={`/codex/${entry.slug}`}
      title={`${entry.title} — ${entry.summary}`}
      className="underline decoration-pink-200/60 decoration-dotted underline-offset-2 hover:text-pink-200 hover:decoration-solid"
    >
      {children}
    </Link>
  );
}
