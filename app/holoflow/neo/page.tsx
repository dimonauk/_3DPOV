/**
 * app/holoflow/neo/page.tsx — Neo-London creative universe.
 *
 * Alternate-1957 London. Layer A/B lattice. Chelsea Academy. OCEAN
 * physics. The Dolly Paradox. The narrative substrate beneath every
 * other vertical. Cards + accordion + timeline + stub-boxes for the
 * fiction documents still in draft.
 */

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Accordion,
  Card,
  Chip,
  DemoCanvas,
  DemoLayout,
  SectionHeader,
  Specs,
  Spec,
  StubBox,
  Timeline,
  type TimelineItem,
  ThreeCol,
  TwoCol,
} from "components/holoflow";

export const metadata = {
  title: "Neo-London · Creative Universe · Holoflow",
  description:
    "Alternate-1957 London. Layer A/B lattice. Chelsea Academy. OCEAN physics. The Dolly Paradox. The narrative substrate beneath every studio practice.",
};

const TIMELINE: TimelineItem[] = [
  { year: "1952",   title: "Chelsea Academy founded", body: "By D. Teaches how to stand, how to speak, how to leave a room." },
  { year: "1957",   title: "The Dolly Paradox event", body: "Temporal recursion at Chelsea Academy. A student arrives who has already graduated." },
  { year: "Present",title: "Layer B fully mapped",   body: "Tube routes confirmed as ley line carriers. Circle Line operating as closed magical circuit." },
  { year: "Soon",   title: "Charming Academy pilot", body: "Real-world cohort. 8 students. Q3 2026." },
];

export default function NeoLondonPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="lavender" withRule>
        Creative Universe
      </ChromeLabel>
      <SectionHeader
        accent="lavender"
        eyebrow="Neo-London"
        title={<>Neo-<em className="text-gold-300">London</em></>}
        body="Alternate 1957 London. Layer A / B lattice. Chelsea Academy. OCEAN physics. The Dolly Paradox. The foundational narrative universe."
      />

      <DemoLayout>
        <div className="flex flex-col gap-4">
          <DemoCanvas
            status="1957 · ACTIVE"
            statusTone="lavender"
            hud={[
              { text: "NEO-LONDON · LAYER A / B LATTICE", tone: "teal" },
              { text: "OCEAN FIELD PROPAGATION · ACTIVE", tone: "lavender" },
              { text: "LAYER: A · O 0.89 · C 0.72",       tone: "gold" },
            ]}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-4xl italic text-lavender-200">
                  ◯
                </div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-chrome-500">
                  Circle Line · closed magical circuit
                </div>
              </div>
            </div>
          </DemoCanvas>

          <Specs>
            <Spec k="Geography"   v="Real London streets · Layer B overlay" />
            <Spec k="Year"        v="1957 (alternate)" />
            <Spec k="Physics"     v="OCEAN field propagation" />
            <Spec k="Substrate"   v="Tube network → ley lines" />
            <Spec k="Academy"     v="Chelsea · founded 1952" />
            <Spec k="Department Store" v="Oxford Street / Selfridges" />
            <Spec k="Walk"        v="20 min · Academy → Store" />
            <Spec k="Compendium"  v="40,000 words · active draft" />
          </Specs>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-lavender-300">
              The Dolly Paradox
            </div>
            <div className="mt-2 text-[12px] font-semibold text-chrome-100">
              Temporal recursion event · Chelsea 1957
            </div>
            <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-400">
              A student arrives who has already graduated. The graduation
              creates the student who attends who creates the graduation. The
              paradox is the load-bearing structure of the entire Layer A/B
              lattice.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>Causality loop</Chip><Chip>Layer B</Chip>
              <Chip>Unresolved</Chip>
            </div>
          </Card>

          <Card>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-lavender-300">
              OCEAN Physics System
            </div>
            <div className="mt-2 text-[12px] font-semibold text-chrome-100">
              Affective field propagation
            </div>
            <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-400">
              Five frequency bands propagating through the Layer A/B
              substrate. Walk into high-Openness and new thoughts arrive
              uninvited. Enter a Neuroticism surge and the walls remember
              every argument ever had inside them.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>O 0.89</Chip><Chip>C 0.72</Chip><Chip>E 0.34</Chip>
              <Chip>A 0.61</Chip><Chip>N 0.15</Chip>
            </div>
          </Card>
        </div>
      </DemoLayout>

      {/* Geography */}
      <section className="mt-12">
        <ChromeLabel accent="teal">Geography</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          Three poles, one <em className="text-gold-300">closed circuit</em>
        </h2>
        <ThreeCol gap="gap-3">
          <Card>
            <div className="font-display text-xl italic text-teal-300">Chelsea</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-500">
              The Academy
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              South-west pole. The school. Madeline archetype — Dolly and five
              school chums walk as a crocodile. Origin point of every story.
            </p>
          </Card>
          <Card>
            <div className="font-display text-xl italic text-pink-400">Oxford St</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-500">
              The Department Store
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              North-east pole. Selfridges. The destination. A 20-minute
              narrative walk through Victoria, Westminster, Oxford Circus.
            </p>
          </Card>
          <Card>
            <div className="font-display text-xl italic text-gold-300">Circle Line</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-500">
              The Master Circuit
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              Closed gold loop. Magical infrastructure. The other tube lines
              are spokes; the Circle is the carrier. Nexus nodes at Victoria
              and Westminster.
            </p>
          </Card>
        </ThreeCol>
      </section>

      {/* Lore accordion + timeline */}
      <section className="mt-12">
        <ChromeLabel accent="lavender">Canon</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          What&rsquo;s <em className="text-gold-300">true</em> in Neo-London
        </h2>
        <TwoCol gap="gap-8">
          <Accordion
            items={[
              { title: "The Chrono-Protocol",   body: "12 years of autobiographical worldbuilding. Neo London runs on the same geography as real London but the infrastructure is magical. The tube network channels ley-line energy. The Circle Line is a closed magical circuit." },
              { title: "The Charming Academy",  body: "Chelsea. The school. Madeline archetype — Dolly and five school chums walk as a crocodile. The origin point of every Neo-London story." },
              { title: "The Department Store",  body: "Oxford Street / Selfridges. The other pole. The destination. A 20-minute narrative walk north from the Academy through Victoria, Westminster, and Oxford Circus." },
              { title: "The Hangar in Neo-London", body: "The studio exists partially in Layer B — a creative and technical infrastructure that straddles the visible and sub-frequency. Aura's soul server is anchored to Layer B field values via somatic.ts." },
            ]}
          />
          <Timeline items={TIMELINE} />
        </TwoCol>
      </section>

      <section className="mt-10">
        <StubBox title="Fiction documents · 5 in development">
          Neo-London Compendium (40 k words) · Chelsea Academy Handbook
          (12 k) · OCEAN Field Measurements · Dolly Paradox Investigative
          File · Resident Register. All active drafts.
        </StubBox>
      </section>

      <Card className="mt-10 border-l-2 border-l-lavender-400">
        <div className="font-display text-2xl italic text-lavender-200">
          Walk the Academy → Store route in person.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          The Neo-London AntiGravity live installation runs the walk as a
          choreographic ritual that generates physical sculptures in real
          time. Pilot venues considered Q4 2026.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=neo-installation">Enquire about residency</BtnPrimary>
          <BtnGhost href="/holoflow/academy">Charming Academy →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
