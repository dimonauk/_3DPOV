import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  firstRefusalWindow,
} from "lib/drops/first-refusal-window";
import {
  getDropBySlug,
  isLimitedSoldOut,
} from "lib/drops/read";

import { DropEditionStatus } from "./edition-status";
import { DropClaimCta } from "./claim-cta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const drop = await getDropBySlug(slug);
  if (!drop) return { title: "Drop not found" };
  return {
    title: `${drop.title} — Holo-Flow Studio`,
    description: drop.summary,
  };
}

export default async function DropDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const drop = await getDropBySlug(slug);
  if (!drop || drop.status !== "published") notFound();
  const window = firstRefusalWindow(drop);
  const soldOut = isLimitedSoldOut(drop);

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <Link
        href="/drops"
        className="chrome-label text-chrome-400 hover:text-pink-200"
      >
        ← Drops
      </Link>

      <div className="mt-6 chrome-label">{drop.kingdom}</div>
      <h1 className="mt-2 text-5xl md:text-6xl leading-[0.95]">
        {drop.title}
      </h1>

      <p className="mt-6 max-w-2xl text-chrome-200 leading-relaxed">
        {drop.summary}
      </p>

      <DropEditionStatus drop={drop} />

      {window.kind === "active" ? (
        <div className="mt-10 rounded border border-amber-300/40 bg-amber-300/5 p-6">
          <div className="chrome-label text-amber-200">First-refusal window</div>
          <p className="mt-2 text-amber-100">
            Patron and Atelier tier supporters can claim now. The window
            ends{" "}
            <time dateTime={window.endsAt}>
              {new Date(window.endsAt).toLocaleString("en-GB", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </time>
            . After that, the room opens to everyone.
          </p>
        </div>
      ) : window.kind === "ended" ? (
        <div className="mt-10 rounded border border-chrome-700 bg-warm-black-900/40 p-6">
          <div className="chrome-label">Open</div>
          <p className="mt-2 text-chrome-200">
            The first-refusal window closed{" "}
            <time dateTime={window.endedAt}>
              {new Date(window.endedAt).toLocaleString("en-GB", {
                dateStyle: "long",
              })}
            </time>
            . The drop is open to everyone.
          </p>
        </div>
      ) : null}

      <div className="mt-10 rounded border border-chrome-700 p-6">
        <div className="chrome-label">Provenance</div>
        <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-chrome-400">Genome</dt>
          <dd className="text-chrome-200 font-mono text-xs">
            {drop.genomeId}
          </dd>
          <dt className="text-chrome-400">Kingdom</dt>
          <dd className="text-chrome-200">{drop.kingdom}</dd>
          <dt className="text-chrome-400">Lineage</dt>
          <dd className="text-chrome-200">
            {drop.parentageChain.length > 0
              ? drop.parentageChain.join(" → ")
              : "First-generation (no parents)"}
          </dd>
          <dt className="text-chrome-400">First-refusal radius</dt>
          <dd className="text-chrome-200">{drop.firstRefusalRadius}</dd>
          <dt className="text-chrome-400">Apple Wallet pass</dt>
          <dd className="text-chrome-200">
            {drop.passkitEnabled
              ? "Minted at claim time"
              : "Not minted for this drop"}
          </dd>
          {drop.publishedAt && (
            <>
              <dt className="text-chrome-400">Published</dt>
              <dd className="text-chrome-200">
                <time dateTime={drop.publishedAt}>
                  {new Date(drop.publishedAt).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </dd>
            </>
          )}
        </dl>
      </div>

      <DropClaimCta drop={drop} window={window} soldOut={soldOut} />

      <div className="mt-16 text-xs text-chrome-500">
        Drop id <code>{drop.id}</code>. The studio fabricates every
        piece in-house — no STL is released. The object you receive is
        the object the studio made.
      </div>
    </article>
  );
}
