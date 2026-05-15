/**
 * components/atelier/used-in.tsx — "Used in:" chip strip for atelier cards.
 *
 * Server Component. Consumes the cross-reference lookup at
 * `lib/atelier/cross-references.ts` and renders a small row of
 * coloured chips when an asset has known appearances elsewhere on the
 * site. Renders nothing (returns null) when the lookup is empty —
 * cards stay clean for assets that don't have cross-links yet.
 *
 * Pass `<UsedIn kind="mesh" slug={mesh.slug} />` from any card.
 */

import Link from "next/link";

import {
  getAtelierCrossRefs,
  type AtelierRef,
  type AtelierRefKind,
} from "lib/atelier/cross-references";

const KIND_LABEL: Record<AtelierRefKind, string> = {
  demo: "demo",
  article: "article",
  journal: "journal",
  tutorial: "tutorial",
  codex: "codex",
  page: "page",
};

const KIND_TINT: Record<AtelierRefKind, string> = {
  demo: "border-pink-200/40 text-pink-100",
  article: "border-chrome-400/40 text-chrome-100",
  journal: "border-chrome-500/40 text-chrome-200",
  tutorial: "border-pink-200/40 text-pink-200",
  codex: "border-pink-200/30 text-pink-200/90",
  page: "border-warm-black-700 text-chrome-300",
};

export type UsedInProps = {
  kind: "mesh" | "brush" | "genome" | "algorithm" | "kata-move";
  slug: string;
};

export default function UsedIn({ kind, slug }: UsedInProps) {
  const refs = getAtelierCrossRefs(kind, slug);
  if (refs.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="chrome-label">Used in</div>
      <div className="flex flex-wrap gap-1.5">
        {refs.map((ref: AtelierRef, i) => (
          <Link
            key={`${ref.kind}-${ref.href}-${i}`}
            href={ref.href}
            title={ref.context}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] transition hover:bg-pink-200/5 ${
              KIND_TINT[ref.kind]
            }`}
          >
            <span className="uppercase tracking-wider text-[9px] opacity-60">
              {KIND_LABEL[ref.kind]}
            </span>
            <span>{ref.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
