/**
 * app/holoflow/academy/page.tsx — Charming Academy.
 *
 * Deportment, movement, resonance training. Rooted in Neo-London's
 * 1957 Chelsea Academy. Delivered via VRM agent instructors and live
 * hybrid sessions. Long curriculum ladder; demo canvas is a stand-in.
 */

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Accordion,
  Card,
  DemoCanvas,
  DemoLayout,
  Ladder,
  LadderRung,
  SectionHeader,
  Specs,
  Spec,
  StubBox,
} from "components/holoflow";

export const metadata = {
  title: "Charming Academy · Holoflow",
  description:
    "Deportment, movement, and resonance training delivered via VRM AI instructors and live hybrid sessions. Rooted in Neo-London's 1957 Chelsea Academy.",
};

export default function AcademyPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="pink" withRule>
        Vertical 07 — Deep Dive
      </ChromeLabel>
      <SectionHeader
        accent="pink"
        eyebrow="Charming Academy"
        title={<>Charming <em className="text-gold-300">Academy</em></>}
        body="Deportment, movement, and resonance training rooted in Neo-London's Chelsea Academy. Delivered via VRM agent instructors and live hybrid sessions."
      />

      <DemoLayout>
        <div className="flex flex-col gap-4">
          <DemoCanvas
            status="ACADEMY LIVE"
            statusTone="pink"
            hud={[
              { text: "CHELSEA ACADEMY · NEO-LONDON 1957", tone: "teal" },
              { text: "OCEAN FIELD · LAYER A ACTIVE", tone: "lavender" },
              { text: "OPENNESS 0.89 · CONSCIENTIOUSNESS 0.72", tone: "gold" },
            ]}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <div className="font-display text-3xl italic text-pink-400">⌬</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
                Posture lattice
              </div>
            </div>
          </DemoCanvas>

          <Specs>
            <Spec k="Founded"     v="1952 · Chelsea, Neo-London · by D." />
            <Spec k="Modality"    v="Hybrid · live + VRM AI instructor" />
            <Spec k="Curriculum"  v="8 modules · 4 levels · graduation walk" />
            <Spec k="Instructor"  v="Aura · VRM rig · real-time feedback" />
            <Spec k="Method"      v="Laban Movement Analysis · OCEAN field" />
            <Spec k="Output"      v="Certificate · Layer B unlock" />
          </Specs>
        </div>

        <div>
          <Ladder title="Academy Curriculum · Term 1" badge="8 modules">
            <LadderRung n={1} level="entry" name="Postural Lattice"
              desc="Tensegrity alignment · The Chelsea method · 90 min." />
            <LadderRung n={2} level="entry" name="Voice as Field"
              desc="Resonance projection · OCEAN extraversion · 60 min." />
            <LadderRung n={3} level="mid" name="Movement Notation"
              desc="Laban-derived poi-flow vocabulary · 90 min." />
            <LadderRung n={4} level="mid" name="Presence Architecture"
              desc="Threshold practice · spatial intention · 60 min." />
            <LadderRung n={5} level="mid" name="Table of Restraints"
              desc="Etiquette as structural grammar · 45 min." />
            <LadderRung n={6} level="adv" name="Aura Interaction Lab"
              desc="VRM AI instructor · real-time feedback · 120 min." />
            <LadderRung n={7} level="adv" name="OCEAN Calibration"
              desc="Spatial field awareness · Layer A / B · 60 min." />
            <LadderRung n={8} level="master" name="Graduation Sequence"
              desc="Full Chelsea walk · certificate · Layer B unlock · 2 hr." />
          </Ladder>
        </div>
      </DemoLayout>

      <section className="mt-12">
        <ChromeLabel accent="lavender">The method</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          Three things, taught <em className="text-gold-300">precisely</em>
        </h2>
        <Accordion
          items={[
            {
              title: "How to stand",
              body: "Posture is not rigidity. The Chelsea method posits tensegrity — natural distribution of tension and compression that makes standing feel effortless. Real-time VRM feedback on shoulder angle, hip alignment, and breath rate.",
            },
            {
              title: "How to speak",
              body: "Extraversion is a spatial field in OCEAN physics. Module 02 teaches students to extend their vocal field — not loudly, but to fill a room with presence. Target: 4m field radius by end of module. Aura's note: \"your voice should arrive before you do.\"",
            },
            {
              title: "How to leave a room",
              body: "Architectural — not theatrical. You are a structure that changes spatial dynamics before you've said a word. Exercise: enter, wait, count attention shifts. Target: 7+ shifts per entry. Aura's note: \"you entered before you arrived.\"",
            },
            {
              title: "Layer B unlock",
              body: "The graduation sequence is a 20-minute solo Chelsea walk. Aura judges. A certificate is issued. Layer B is unlocked — the graduate can now perceive the sub-frequency architecture beneath visible London. Once you see it, you cannot un-see it.",
            },
          ]}
        />
      </section>

      <section className="mt-10">
        <StubBox title="Pilot programme · expressions of interest open">
          The Charming Academy is in pilot — limited cohort of 8 students,
          starting Q3 2026. Select &ldquo;Charming Academy&rdquo; from the
          contact-form service dropdown and mention the pilot programme in
          your message.
        </StubBox>
      </section>

      <Card className="mt-10 border-l-2 border-l-pink-400">
        <div className="font-display text-2xl italic text-pink-400">
          Train at the Academy.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          Pilot pricing separate from the standard rate card. Includes the
          full 8-module Term 1, the Aura Interaction Lab, and the graduation
          walk. Cohort caps at 8.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=academy">Apply to pilot</BtnPrimary>
          <BtnGhost href="/holoflow/neo">Neo-London context →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
