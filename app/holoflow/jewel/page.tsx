/**
 * app/holoflow/jewel/page.tsx — Jewel Array.
 *
 * 144-cell generative jewellery catalogue across 8 taxonomic
 * categories. Each category is a Card with glyph + count + hover.
 * Demo canvas placeholder; the full Zustand/R3F catalogue lives at
 * /jewels (or wherever the studio's commerce stack mounts it).
 */

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Card,
  Chip,
  DemoCanvas,
  DemoLayout,
  Ladder,
  LadderRung,
  MetricCard,
  SectionHeader,
  Specs,
  Spec,
} from "components/holoflow";

export const metadata = {
  title: "Jewel Array · 144-cell generative jewellery · Holoflow",
  description:
    "144-cell generative jewellery catalogue across 8 taxonomic categories. Zustand store, web-worker pipeline, spatial R3F components.",
};

type Cat = { glyph: string; name: string; count: number; tone: "teal" | "lavender" | "gold" | "pink" | "coral" };
const CATEGORIES: Cat[] = [
  { glyph: "⌬", name: "Biomimetic",     count: 18, tone: "teal"     },
  { glyph: "⬡", name: "Geometric",      count: 18, tone: "lavender" },
  { glyph: "⊕", name: "Cultural-Hist.", count: 18, tone: "gold"     },
  { glyph: "✦", name: "Witchcore",      count: 18, tone: "pink"     },
  { glyph: "⊛", name: "Retrofuturist",  count: 18, tone: "coral"    },
  { glyph: "⌭", name: "Mech-Organic",   count: 18, tone: "teal"     },
  { glyph: "⊗", name: "Surreal-Scale",  count: 18, tone: "lavender" },
  { glyph: "▣", name: "Memphis-Cyber",  count: 18, tone: "gold"     },
];

const TONE_CLS = {
  teal: "text-teal-400",
  lavender: "text-lavender-200",
  gold: "text-gold-300",
  pink: "text-pink-400",
  coral: "text-coral-400",
} as const;

export default function JewelPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="pink" withRule>
        Vertical 05 — Deep Dive
      </ChromeLabel>
      <SectionHeader
        accent="pink"
        eyebrow="Jewel Array"
        title={<>Jewel <em className="text-gold-300">Array</em></>}
        body="144-cell generative jewellery catalogue across 8 taxonomic categories. Zustand store, web-worker pipeline, spatial R3F components."
      />

      <DemoLayout>
        <div className="flex flex-col gap-4">
          <DemoCanvas
            status="RENDERING"
            statusTone="gold"
            hud={[
              { text: "CATEGORY: BIOMIMETIC",       tone: "teal" },
              { text: "SURFACE: VORONOI CUTICLE",   tone: "lavender" },
              { text: "BLENDER: DISPLACE → SMOOTH → SUBD", tone: "gold" },
            ]}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-5xl italic text-teal-300">⌬</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
                  Biomimetic cell · live preview at <span className="text-teal-400">/jewels</span>
                </div>
              </div>
            </div>
          </DemoCanvas>

          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Categories" value="8"   sub="Taxonomic axes" />
            <MetricCard label="Cells / cat" value="18"  sub="3 × 6 grid" />
            <MetricCard label="Total"      value="144" sub="Edition cap" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Specs>
            <Spec k="Storage"    v="Zustand store · TaxonomyEngine.ts" />
            <Spec k="Pipeline"   v="Web Worker · Blender bake" />
            <Spec k="Renderer"   v="R3F · spatial cells" />
            <Spec k="Source"     v="BY-GEN genome · poi-derived" />
            <Spec k="Output"     v="STL · Saturn 4 resin · D:/print-queue" />
            <Spec k="Edition"    v="Capped at 18 / category · signed" />
          </Specs>

          <Card className="border-l-2 border-l-pink-400">
            <div className="font-display text-xl italic text-pink-400">
              Witchcore best-seller
            </div>
            <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
              Started as a joke, became the best-selling category. Some
              customers have reported dreaming about their earrings.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>50 generations</Chip>
              <Chip>Reported dreams: 7</Chip>
            </div>
          </Card>
        </div>
      </DemoLayout>

      {/* 8-cat grid */}
      <section className="mt-12">
        <ChromeLabel accent="lavender">Taxonomy</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          Eight categories, eighteen <em className="text-gold-300">each</em>
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <Card key={c.name} className="text-center">
              <div className={`font-display text-2xl ${TONE_CLS[c.tone]}`}>
                {c.glyph}
              </div>
              <div className="mt-2 text-[11px] text-chrome-100">{c.name}</div>
              <div className={`mt-1 font-display text-lg italic ${TONE_CLS[c.tone]}`}>
                {c.count}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Skills ladder */}
      <section className="mt-12">
        <ChromeLabel accent="teal">Skills ladder</ChromeLabel>
        <Ladder title="Jewellery Skills Ladder" badge="5 rungs">
          <LadderRung n={1} level="entry" name="Blender mesh fundamentals"
            desc="Manifold geometry · tube meshes · modifier stacks · UV." />
          <LadderRung n={2} level="mid" name="Biomimetic surface treatments"
            desc="Voronoi cuticle · coral bumps · barnacle rings · displacement." />
          <LadderRung n={3} level="mid" name="Shell curve bail construction"
            desc="Poi locus → tube extrude → mirror → inverted-U bail → boolean." />
          <LadderRung n={4} level="adv" name="Jewel Array system"
            desc="Zustand store · web worker pipeline · spatial R3F · TaxonomyEngine.ts." />
          <LadderRung n={5} level="master" name="BY-GEN → print pipeline"
            desc="Genome → Blender bake · VLM scoring · STL export · D:/print-queue." />
        </Ladder>
      </section>

      <Card className="mt-10 border-l-2 border-l-pink-400">
        <div className="font-display text-2xl italic text-pink-400">
          Commission a piece.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          Single bespoke or limited edition. From a BY-GEN brief through
          genome mutation, VLM aesthetic scoring, and Elegoo Saturn 4 resin
          print. Includes the Certificate of Materialization documenting
          lineage and provenance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=parametric">Commission a piece</BtnPrimary>
          <BtnGhost href="/holoflow/bygen">BY-GEN engine →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
