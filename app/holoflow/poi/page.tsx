/**
 * app/holoflow/poi/page.tsx — Poi & Light Trails.
 *
 * Long-exposure light painting + the mathematical poi vocabulary that
 * feeds BY-GEN. Move catalogue drives the demo canvas selection;
 * GenePanel surfaces the live motion-genome values; light-painter
 * demo links out to the interactive route.
 *
 * Pattern is composition-only — the interactive R3F demos live on
 * dedicated routes; this is the catalogue / context page.
 */

"use client";

import { useState } from "react";

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Card,
  Chip,
  DemoLayout,
  EquationCard,
  GenePanel,
  type EquationMove,
  Ladder,
  LadderRung,
  SectionHeader,
  Specs,
  Spec,
  MoveCatalogue,
} from "components/holoflow";
import { LightStackDemo, PoiCurveDemo } from "components/holoflow/demos";

const MOVES: EquationMove[] = [
  { key: "antispin-2", name: "Antispin 2-petal", equation: "x = sin(t) + sin(−t)\ny = cos(t) + cos(−t)", desc: "Eye-shaped. Simplest antispin." },
  { key: "antispin-3", name: "Antispin 3-petal", equation: "x = sin(t) + sin(−2t)\ny = cos(t) + cos(−2t)", desc: "3-petal triquetra form." },
  { key: "antispin-4", name: "Antispin 4-petal", equation: "x = sin(t) + sin(−3t)\ny = cos(t) + cos(−3t)", desc: "Classic antispin flower." },
  { key: "antispin-5", name: "Antispin 5-petal", equation: "x = sin(t) + sin(−4t)\ny = cos(t) + cos(−4t)", desc: "5-fold symmetry." },
  { key: "antispin-7", name: "Antispin 7-petal", equation: "x = sin(t) + sin(−6t)\ny = cos(t) + cos(−6t)", desc: "Dense 7-petal crown." },
  { key: "inspin-2",   name: "Inspin 2-petal",   equation: "x = sin(t) + sin(t)\ny = cos(t) + cos(t)",   desc: "2-petal inspin loop." },
  { key: "inspin-3",   name: "Inspin 3-petal",   equation: "x = sin(t) + sin(3t)\ny = cos(t) + cos(3t)", desc: "Creates a 4-petal shape." },
  { key: "extension",  name: "Extension",        equation: "x = sin(t) + sin(t)\ny = cos(t) + cos(t)",   desc: "Full extension — one giant circle." },
];

const GENOMES: Record<string, { name: string; r1: number; r2: number; n: number; petals: number; energy: number }> = {
  "antispin-2": { name: "antispin-2",  r1: 1.0, r2: 0.8,  n: -1, petals: 2, energy: 0.62 },
  "antispin-3": { name: "antispin-3",  r1: 1.0, r2: 0.8,  n: -2, petals: 3, energy: 0.74 },
  "antispin-4": { name: "antispin-4",  r1: 1.0, r2: 0.8,  n: -3, petals: 4, energy: 0.81 },
  "antispin-5": { name: "antispin-5",  r1: 1.0, r2: 0.75, n: -4, petals: 5, energy: 0.86 },
  "antispin-7": { name: "antispin-7",  r1: 1.0, r2: 0.7,  n: -6, petals: 7, energy: 0.93 },
  "inspin-2":   { name: "inspin-2",    r1: 1.0, r2: 0.8,  n:  1, petals: 2, energy: 0.42 },
  "inspin-3":   { name: "inspin-3",    r1: 1.0, r2: 0.7,  n:  3, petals: 4, energy: 0.65 },
  "extension":  { name: "extension",   r1: 1.0, r2: 1.0,  n:  1, petals: 1, energy: 0.55 },
};

export default function PoiPage() {
  const [selected, setSelected] = useState("antispin-3");
  const move = MOVES.find((m) => m.key === selected)!;
  const g = GENOMES[selected]!;

  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="coral" withRule>
        Vertical 04 — Deep Dive
      </ChromeLabel>
      <SectionHeader
        accent="coral"
        eyebrow="Poi & Light Trails"
        title={<>Poi &amp; <em className="text-gold-300">Light Trails</em></>}
        body="Long-exposure light-trail photography, Fusion frame-accumulation stacking, and the geometric vocabulary that feeds directly into BY-GEN and jewellery design."
      />

      <section className="mt-8">
        <ChromeLabel accent="teal">Move catalogue</ChromeLabel>
        <p className="mt-2 max-w-2xl font-mono text-[11px] leading-loose text-chrome-400">
          Based on DrexFactor&rsquo;s parametric framework: poi patterns are
          curves where <em>x = R₁·sin(t) + R₂·sin(n·t)</em>,{" "}
          <em>y = R₁·cos(t) + R₂·cos(n·t)</em>. Negative n = antispin.
          Positive n = inspin. Tap any move.
        </p>
        <MoveCatalogue moves={MOVES} selected={selected} onSelect={setSelected} />
      </section>

      <DemoLayout>
        <div className="flex flex-col gap-4">
          <PoiCurveDemo />
          <LightStackDemo />
          <EquationCard move={move} />
        </div>

        <div className="flex flex-col gap-4">
          <GenePanel
            title="Live motion genome"
            accent="lavender"
            rows={[
              { k: "pattern",      v: g.name },
              { k: "R₁ (arm)",     v: g.r1.toFixed(2) },
              { k: "R₂ (poi)",     v: g.r2.toFixed(2) },
              { k: "n (freq)",     v: g.n.toString() },
              { k: "petals",       v: g.petals.toString() },
              { k: "energy",       v: g.energy.toFixed(2) },
            ]}
            fitness={g.energy}
          />

          <Specs>
            <Spec k="Capture"   v="Insta360 X4 · long exposure · dark field" />
            <Spec k="Stacking"  v="DaVinci Resolve Fusion · max-mode accumulation" />
            <Spec k="Output"    v="16-bit TIFF · print grade" />
            <Spec k="Pipeline"  v="locus → tube extrude → bail → boolean" />
            <Spec k="Feeds"     v="BY-GEN path_geometry · Jewel Array" />
          </Specs>
        </div>
      </DemoLayout>

      <section className="mt-12">
        <ChromeLabel accent="gold">Skills ladder</ChromeLabel>
        <Ladder title="Flow Arts Skills Ladder" badge="6 rungs">
          <LadderRung n={1} level="entry" name="Basic poi mechanics"
            desc="Single-beat weave · plane control · timing fundamentals." />
          <LadderRung n={2} level="entry" name="3D geometric vocabulary"
            desc="Butterfly · antispin · extension · pendulum · hyperloop paths." />
          <LadderRung n={3} level="mid" name="Shell curve parameterisation"
            desc="Figure-8 locus · spin_ratio · arm_length · phase_offset · Blender Python script." />
          <LadderRung n={4} level="mid" name="Light trail capture"
            desc="Night session · LED poi · long exposure · dark-field discipline." />
          <LadderRung n={5} level="adv" name="Fusion frame stacking"
            desc="DaVinci Resolve Fusion · max-mode accumulation · 16-bit TIFF · print grade." />
          <LadderRung n={6} level="master" name="Move → genome encoding"
            desc="Locus → BY-GEN path_geometry gene · jewellery silhouette library · bail geometry." />
        </Ladder>
      </section>

      <Card className="mt-10 border-l-2 border-l-coral-400">
        <div className="font-display text-2xl italic text-coral-400">
          12+ years spinning, now legible.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          Every move in the catalogue exists in three forms: a danced
          gesture, a long-exposure photograph, and a 3D-printed waveguide
          object. Editioned light-painting prints and Phygital Twin
          commissions available.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>16-bit print</Chip><Chip>Phygital Twin</Chip>
          <Chip>Certificate of Materialization</Chip>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=poi">Commission a piece</BtnPrimary>
          <BtnGhost href="/holoflow/bygen">BY-GEN engine →</BtnGhost>
          <BtnGhost href="/holoflow/jewel">Jewel Array →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
