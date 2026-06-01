/**
 * components/atelier/tool-page.tsx
 *
 * Shared shell for every /atelier/* tool page.
 *
 * Eliminates ~40 lines of repeated header markup from each of the 50+
 * atelier chamber pages. Wraps children in the standard article +
 * Footer; optionally renders a cross-reference chip strip and a prose
 * notes section below the tool.
 *
 * Usage:
 *   <AtelierToolPage
 *     label="Atelier · Poi sculptor"
 *     headline={<>The poi move,<br />as printable solid.</>}
 *     body="Twenty-one parametric poi-flow moves…"
 *     secondary="Every move is parametric: t runs from 0…"
 *     chips={[
 *       { href: "/codex/poi",     label: "codex · poi" },
 *       { href: "/bureau",        label: "print bureau" },
 *     ]}
 *     notes={{ label: "What the move actually is", body: "…" }}
 *   >
 *     <PoiSculptorClient />
 *   </AtelierToolPage>
 */

import Footer from "components/layout/footer";
import Link from "next/link";
import type { ReactNode } from "react";

export type AtelierChip = { href: string; label: string };

export type AtelierNotes = {
  label: string;
  /** One or more prose paragraphs — strings or JSX */
  body: ReactNode | ReactNode[];
};

export type AtelierToolPageProps = {
  /** Small overline — e.g. "Atelier · Poi sculptor" */
  label: string;
  /** Big headline — can include <br /> and <em> */
  headline: ReactNode;
  /** First (lighter) body paragraph */
  body: ReactNode;
  /** Second (dimmer) body paragraph — optional */
  secondary?: ReactNode;
  /** Cross-reference chip links below the body */
  chips?: AtelierChip[];
  /** Optional notes / explainer section below the tool */
  notes?: AtelierNotes;
  /** The tool itself */
  children: ReactNode;
};

export function AtelierToolPage({
  label,
  headline,
  body,
  secondary,
  chips,
  notes,
  children,
}: AtelierToolPageProps) {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        {/* ── overline ── */}
        <div className="chrome-label">{label}</div>

        {/* ── headline ── */}
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          {headline}
        </h1>

        {/* ── body ── */}
        <p className="mt-6 max-w-2xl text-chrome-200">{body}</p>
        {secondary && (
          <p className="mt-4 max-w-2xl text-chrome-300">{secondary}</p>
        )}

        {/* ── cross-ref chips ── */}
        {chips && chips.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
            {chips.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── tool ── */}
        <div className="mt-12">{children}</div>

        {/* ── notes ── */}
        {notes && (
          <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
            <div className="chrome-label">{notes.label}</div>
            {Array.isArray(notes.body) ? (
              notes.body.map((p, i) => (
                <p key={i} className={i === 0 ? "mt-3" : "mt-4"}>
                  {p}
                </p>
              ))
            ) : (
              <p className="mt-3">{notes.body}</p>
            )}
          </section>
        )}
      </article>
      <Footer />
    </>
  );
}
