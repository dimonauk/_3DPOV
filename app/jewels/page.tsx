"use client";

/**
 * app/jewels/page.tsx — Jewel Array vertical.
 *
 * 144-cell generative jewellery catalogue across 8 taxonomic
 * categories (18 cells each). Zustand store + web worker pipeline
 * + spatial R3F components. Cribbed from the v5 `#p-jewel` section.
 *
 * Five tabs: Categories, 3D Viewer (Phase E), Surface Treatments,
 * Skills Ladder, Commission. The viewer canvas lands in Phase E
 * (TSL); this page is the prose + taxonomy + ladder scaffold.
 */

import {
  Card,
  Chip,
  ChromeLabel,
  Ladder,
  LadderRung,
  MetricCard,
  SectionHeader,
  Spec,
  Specs,
  StubBox,
  TabBar,
  TabPanel,
  useTabs,
} from "components/holoflow";

type Category = {
  glyph: string;
  name: string;
  accent: string; // colour token
  count: number;
  blurb: string;
};

const CATEGORIES: Category[] = [
  { glyph: "▱", name: "Biomimetic", accent: "text-teal-400", count: 18, blurb: "Voronoi cuticle · coral bumps" },
  { glyph: "⬡", name: "Geometric", accent: "text-lavender-300", count: 18, blurb: "Platonic crossbreeds" },
  { glyph: "⊕", name: "Cultural-Hist.", accent: "text-gold-300", count: 18, blurb: "Celtic · Byzantine · Edo" },
  { glyph: "✦", name: "Witchcore", accent: "text-pink-300", count: 18, blurb: "Sigil mutation · seed phrase" },
  { glyph: "⊛", name: "Retrofuturist", accent: "text-coral-300", count: 18, blurb: "1950s space-age · fins" },
  { glyph: "⚭", name: "Mech-Organic", accent: "text-teal-300", count: 18, blurb: "Gear forms + organic growth" },
  { glyph: "⊗", name: "Surreal-Scale", accent: "text-lavender-200", count: 18, blurb: "Impossible scales · wearable" },
  { glyph: "▣", name: "Memphis-Cyber", accent: "text-gold-400", count: 18, blurb: "Sottsass + Tron. Cursed." },
];

const SURFACE_TREATMENTS = [
  "Voronoi cuticle",
  "Coral bumps",
  "Anodised iridescent",
  "Verdigris patina",
  "Cold-cast brass",
  "Lichen overlay",
  "Resin amber",
  "Polished obsidian",
];

export default function JewelsPage() {
  const t = useTabs([
    "Categories",
    "3D viewer",
    "Surface treatments",
    "Skills ladder",
    "Commission",
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
      <ChromeLabel withRule accent="pink">
        Vertical 05
      </ChromeLabel>
      <SectionHeader
        eyebrow="Jewel Array"
        title={
          <>
            Jewel <em>Array</em>
          </>
        }
        body="144-cell generative jewellery catalogue across 8 taxonomic categories. Zustand store, web-worker pipeline, spatial R3F components."
        accent="pink"
      />

      <TabBar tabs={t.tabs} active={t.active} onChange={t.setActive} />

      {/* ──────── Categories ──── */}
      <TabPanel active={t.active === 0}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Card key={c.name}>
              <div className={`text-2xl leading-none ${c.accent}`}>{c.glyph}</div>
              <div className="mt-2 text-xs font-medium text-chrome-100">
                {c.name}
              </div>
              <div className={`mt-1 text-xl font-medium ${c.accent}`}>
                {c.count}
              </div>
              <div className="mt-1 font-mono text-[10px] leading-snug text-chrome-500">
                {c.blurb}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricCard label="Total cells" value="144" sub="8 × 18" />
          <MetricCard label="Shell earring pairs" value="35" sub="inverted-U bail" />
          <MetricCard label="Blender objects" value="358" />
          <MetricCard label="Surface treatments" value="8" />
        </div>
      </TabPanel>

      {/* ──────── 3D viewer ──── */}
      <TabPanel active={t.active === 1}>
        <Card className="grid place-items-center bg-warm-black-925/40 py-16">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-pink-300">
              R3F + WebGPU jewel viewer
            </div>
            <p className="mt-2 font-mono text-[11px] text-chrome-500">
              Spatial preview lands in the TSL pass (Phase E).
              <br />
              Category · surface treatment · subdiv level all driven by
              a shared Zustand slice.
            </p>
          </div>
        </Card>
      </TabPanel>

      {/* ──────── Surface treatments ──── */}
      <TabPanel active={t.active === 2}>
        <Card>
          <h3 className="text-sm font-medium text-chrome-100">
            Surface treatments
          </h3>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
            Eight finishes applied as displacement + shader passes in
            Blender. Each category × treatment combo is its own .blend
            with bake nodes wired for low/high LOD export.
          </p>
          <div className="mt-3 -ml-1">
            {SURFACE_TREATMENTS.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
          <Specs className="mt-4">
            <Spec k="Pipeline" v="Displace → Smooth → Subdivision → Bake" />
            <Spec k="LOD strategy" v="Low (web) + High (print) per cell" />
            <Spec k="Worker" v="OffscreenCanvas displacement preview" />
            <Spec k="Storage" v="Web Worker + IndexedDB cell cache" />
          </Specs>
        </Card>
      </TabPanel>

      {/* ──────── Skills ladder ──── */}
      <TabPanel active={t.active === 3}>
        <Ladder title="Jewel Array skills ladder" badge="5 rungs">
          <LadderRung
            n={1}
            level="entry"
            name="Category taxonomy"
            desc="8 categories · 18 cells each · naming conventions · cross-references."
          />
          <LadderRung
            n={2}
            level="entry"
            name="Cell creation in Blender"
            desc="Base mesh · UV layout · pivot conventions · category metadata."
          />
          <LadderRung
            n={3}
            level="mid"
            name="Surface treatment pipeline"
            desc="Displacement + shader composition · LOD bake · low/high export pairs."
          />
          <LadderRung
            n={4}
            level="adv"
            name="R3F viewer with shared Zustand"
            desc="Cell selection · surface picker · subdiv slider · OffscreenCanvas worker."
          />
          <LadderRung
            n={5}
            level="master"
            name="Edition publishing + provenance"
            desc="Drop publish gate · genome lineage · COA generation · edition signing."
          />
        </Ladder>
      </TabPanel>

      {/* ──────── Commission ──── */}
      <TabPanel active={t.active === 4}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="text-sm font-medium text-chrome-100">
              Commission a piece
            </h3>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              Brief → category + surface treatment selection → cell
              evolution via BY-GEN → resin or FDM print. Edition size
              is your call: single bespoke, limited run, or open.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-block border border-pink-300 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-pink-300 transition-colors hover:bg-pink-300 hover:text-warm-black-950"
            >
              Brief a piece →
            </a>
          </Card>
          <StubBox title="Jewel Array drop pipeline">
            Cells listed for first-refusal to Patrons (15 min), then
            Members (15 min), then open. Edition size + tier inclusion
            set per drop in /admin/drops/new.{" "}
            <em className="text-chrome-500">Live on /drops.</em>
          </StubBox>
        </div>
      </TabPanel>
    </main>
  );
}
