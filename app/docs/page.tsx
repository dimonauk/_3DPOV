import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Docs — the studio's architecture canon",
  description:
    "The reading order for the substrate. Five-rule architecture canon, the brick language, the capability registry plan, the Box 3 quarry inventory, migration principles, the attribution ledger, and the Hangar coverage map.",
};

const REPO_URL =
  "https://github.com/holoflowstudio/holoflow-co-uk/blob/main/docs";

type DocEntry = {
  slug: string;
  title: string;
  blurb: string;
  reading_order: number;
};

const DOCS: readonly DocEntry[] = [
  {
    slug: "ARCHITECTURE.md",
    title: "Architecture canon",
    blurb:
      "The five rules: 300-line cap, headless capabilities, atomise on entry, everything in the loop, every file has a .PURPOSE.md twin. Start here.",
    reading_order: 1,
  },
  {
    slug: "BRICK_LANGUAGE.md",
    title: "Brick language",
    blurb:
      "Duplo × Technics × VR × Tetris × Cubism × Puzzles — the visual and spatial design language for the substrate's downstream VR-Lego affordance.",
    reading_order: 2,
  },
  {
    slug: "CAPABILITY_REGISTRY_PLAN.md",
    title: "Capability registry plan",
    blurb:
      "Atomisation map: each of the 14 capability stubs and where its module ports from. Aura-Alive lift in detail.",
    reading_order: 3,
  },
  {
    slug: "BOX_3_INVENTORY.md",
    title: "Box 3 inventory",
    blurb:
      "The open-source quarry — pens, gists, demo repos we crib parts from. Status legend: queued / examined / lifted / bibliography.",
    reading_order: 4,
  },
  {
    slug: "MIGRATION_PRINCIPLES.md",
    title: "Migration principles",
    blurb:
      "Two-box model + session-archaeology + affordance-shape placement + genome-everything + the five-step border ritual.",
    reading_order: 5,
  },
  {
    slug: "ATTRIBUTIONS.md",
    title: "Attributions",
    blurb:
      "The credit ledger. Box 3 lifts (parameters / shader math borrowed), Hangar derivations, real npm dependencies, consulted reference architectures.",
    reading_order: 6,
  },
  {
    slug: "HANGAR_MAP.md",
    title: "Hangar map",
    blurb:
      "Living coverage tracker. What's migrated, in progress, queued, surveyed-only, new, skipped, or private. The migration's accounting layer.",
    reading_order: 7,
  },
  {
    slug: "HANGAR_RECONCILIATION.md",
    title: "Hangar reconciliation",
    blurb:
      "Per-article reconciliation between site canon and Hangar canon. Classes A / B / C — what's missing, what's drifting, what's settled.",
    reading_order: 8,
  },
  {
    slug: "COMMERCE_ROADMAP.md",
    title: "Commerce roadmap",
    blurb:
      "The studio's commercial surface — bureau, aerial commissions, rookery tiers, bezel pre-orders, caustic discs. Pricing + scope + state-of-wiring.",
    reading_order: 9,
  },
  {
    slug: "ASSET_MIGRATION.md",
    title: "Asset migration",
    blurb:
      "GLB meshes, genomes, evolution-station outputs ported from the Hangar to public/assets/.",
    reading_order: 10,
  },
  {
    slug: "PLAY_GAME_PLAN.md",
    title: "Play game plan",
    blurb:
      "The /play surface's 12-level shape — eight solo + four braided. Solo 1-4 in preview state with argument-routes.",
    reading_order: 11,
  },
  {
    slug: "CHRONO_PROTOCOL_BUILD_PLAN.md",
    title: "Chrono-Protocol build plan",
    blurb:
      "Eight-wave roadmap for the AR-game-shaped surface at /chrono-protocol. The five-mode wheel canon implementation.",
    reading_order: 12,
  },
  {
    slug: "SHARP_PIPELINE.md",
    title: "SHARP pipeline",
    blurb:
      "Apple SHARP single-image gaussian-splat pipeline — capture, convert, register, publish. The companion to /tutorials/from-360-to-splat.",
    reading_order: 13,
  },
  {
    slug: "CCTV_PIPELINE.md",
    title: "CCTV pipeline",
    blurb:
      "Open-data CCTV markers for Shell 9's condensed-London surface. Overpass API → SQLite cache → MapLibre markers.",
    reading_order: 14,
  },
  {
    slug: "BACKWARDS_DESIGN.md",
    title: "Backwards design",
    blurb:
      "Each customer outcome the studio offers, traced back to the bench discipline that enables it. The site's commercial spine.",
    reading_order: 15,
  },
];

export default function DocsHubPage() {
  const sorted = [...DOCS].sort((a, b) => a.reading_order - b.reading_order);

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The reading order</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The studio&rsquo;s docs.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Fifteen documents that together describe the substrate, the
          canon, the migration discipline, the commercial surface,
          and the pipelines. They live in the repository at{" "}
          <span className="font-mono text-chrome-100">/docs/</span>.
          This page is the reading order.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Start with{" "}
          <Link
            href={`${REPO_URL}/ARCHITECTURE.md`}
            className="text-pink-200 underline underline-offset-4"
          >
            Architecture canon
          </Link>{" "}
          if you&rsquo;ve never seen the substrate. Skip to{" "}
          <Link
            href={`${REPO_URL}/MIGRATION_PRINCIPLES.md`}
            className="text-pink-200 underline underline-offset-4"
          >
            Migration principles
          </Link>{" "}
          if you&rsquo;re onboarding to contribute. Read{" "}
          <Link
            href={`${REPO_URL}/COMMERCE_ROADMAP.md`}
            className="text-pink-200 underline underline-offset-4"
          >
            Commerce roadmap
          </Link>{" "}
          if you&rsquo;re here to buy.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
          <Link
            href="/pipelines"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            pipelines
          </Link>
          <Link
            href="/apps"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            apps
          </Link>
        </div>

        <ol className="mt-12 space-y-4">
          {sorted.map((doc) => (
            <li key={doc.slug}>
              <Link
                href={`${REPO_URL}/${doc.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5 transition-colors hover:border-pink-200/40"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-chrome-500">
                    {String(doc.reading_order).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg text-chrome-100 group-hover:text-pink-100">
                    {doc.title}
                  </h3>
                  <span className="ml-auto font-mono text-[10px] text-chrome-500 group-hover:text-pink-200">
                    {doc.slug}
                  </span>
                </div>
                <p className="mt-2 text-sm text-chrome-300">{doc.blurb}</p>
              </Link>
            </li>
          ))}
        </ol>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Not yet on this page</div>
          <p className="mt-3">
            The studio&rsquo;s private docs (the Hangar canon, the
            character bibles in detail, the bench notebook) are not
            published. They live in a separate repository at{" "}
            <span className="font-mono text-chrome-100">D:\The_Hangar</span>.
            Migration to the public site is governed by{" "}
            <Link
              href={`${REPO_URL}/MIGRATION_PRINCIPLES.md`}
              className="text-pink-200 underline underline-offset-4"
            >
              Migration principles
            </Link>{" "}
            &mdash; not everything that&rsquo;s in the Hangar will
            become public.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
