/**
 * app/holoflow/heritage/page.tsx — Heritage Documentation vertical.
 *
 * Photogrammetry, LiDAR, immersive archiving. Demo canvas placeholder
 * (real point-cloud renderer is heavy; this page is the catalogue).
 * Pattern: SectionHeader + DemoLayout(canvas + ladder) + ProcessSteps
 * + ServicesTable + commission CTA.
 */

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Card,
  DemoCanvas,
  DemoLayout,
  Ladder,
  LadderRung,
  ProcessSteps,
  type ProcessStep,
  SectionHeader,
  ServicesTable,
  type ServiceRow,
  Specs,
  Spec,
  Chip,
} from "components/holoflow";

export const metadata = {
  title: "Heritage Documentation · Holoflow",
  description:
    "Photogrammetry, LiDAR scanning, and immersive archiving of built heritage. From raw capture to WebXR-explorable permanent record.",
};

const PIPELINE: ProcessStep[] = [
  { title: "Site assessment", body: "Access · lighting · resolution · target archive format." },
  { title: "360 + gimbal capture", body: "Insta360 X4 + MQTT gimbal · soulSlice.ts." },
  { title: "Photogrammetry", body: "RealityCapture · Metashape · point cloud + UV mesh." },
  { title: "Blender finishing", body: "Mesh decimation · retopology · texture bake." },
  { title: "WebXR delivery", body: "Three.js · .glb + draco · LOD · offline-first PWA." },
  { title: "Archive sign-off", body: "Heritage England formats · metadata · grant docs." },
];

const SERVICES: ServiceRow[] = [
  { title: "Single-object scan", body: "Sculpture, artefact, monument. 2 mm resolution · 1-day turnaround for under-1m³ objects.", rate: "£750 / day" },
  { title: "Site survey", body: "Full building, ruin, or heritage zone. 3 days capture + 6 days processing typical.", rate: "£2k – £20k" },
  { title: "WebXR experience build", body: "Custom Three.js viewer · LOD strategy · narrative wayfinding · offline PWA.", rate: "From £4k" },
  { title: "Archive consultation", body: "Format strategy · Heritage England compliance · grant co-funding routes.", rate: "£75 / hr" },
];

export default function HeritagePage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="gold" withRule>
        Vertical 01 — Deep Dive
      </ChromeLabel>
      <SectionHeader
        accent="gold"
        eyebrow="Heritage Documentation"
        title={<>Heritage <em className="text-gold-300">Documentation</em></>}
        body="Photogrammetry, LiDAR, and immersive archiving. The pipeline from raw capture to WebXR-explorable permanent record."
      />

      <DemoLayout>
        <div className="flex flex-col gap-4">
          <DemoCanvas
            status="CAPTURE SIM"
            statusTone="gold"
            hud={[
              { text: "POINT CLOUD RENDERER · ACTIVE", tone: "teal" },
              { text: "POINTS: 18,432",                tone: "lavender" },
              { text: "RESOLUTION: 2 mm · HERITAGE GRADE", tone: "gold" },
            ]}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-12 gap-1 opacity-40">
                {Array.from({ length: 144 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1 w-1 rounded-full bg-gold-300"
                    style={{ opacity: 0.2 + Math.random() * 0.8 }}
                  />
                ))}
              </div>
            </div>
          </DemoCanvas>

          <Specs>
            <Spec k="Sensor" v="Insta360 X4 · gimbal-mounted" />
            <Spec k="LiDAR"  v="iPhone 15 Pro · DJI L1 (rented)" />
            <Spec k="SfM"    v="RealityCapture · Metashape" />
            <Spec k="Finishing" v="Blender 4.x · headless batch" />
            <Spec k="Delivery" v=".glb (draco) · WebXR · .usd" />
            <Spec k="Archive" v="Heritage England formats" />
          </Specs>
        </div>

        <div>
          <Ladder title="Heritage Skills Ladder" badge="5 rungs">
            <LadderRung n={1} level="entry" name="Site assessment & capture planning"
              desc="Access · resolution · equipment checklist · lighting." />
            <LadderRung n={2} level="entry" name="Insta360 gimbal rig operation"
              desc="MQTT wiring · soulSlice.ts bridge · pan/tilt · live VLM." />
            <LadderRung n={3} level="mid" name="Blender photogrammetry pipeline"
              desc="Cloud import · mesh reconstruction · UV unwrap · Heritage England export." />
            <LadderRung n={4} level="adv" name="WebXR delivery & viewer build"
              desc="Three.js scene · .glb optimisation · LOD · offline-first PWA." />
            <LadderRung n={5} level="master" name="Archive strategy & grant compliance"
              desc="Format schemas · long-term accessibility · grant co-funding routes." />
          </Ladder>

          <Card className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
              Recent
            </div>
            <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
              48-million-polygon mesh of a Heritage-listed structure. The
              project director had never seen their building from every angle
              simultaneously. They cried. We delivered on a phone-grade PWA so
              the archive will outlast every viewing device.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>2 mm</Chip><Chip>48M polys</Chip><Chip>3 days capture</Chip>
              <Chip>6 days processing</Chip>
            </div>
          </Card>
        </div>
      </DemoLayout>

      <section className="mt-12">
        <ChromeLabel accent="teal">Pipeline</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          Capture → <em className="text-gold-300">archive</em>, in six steps
        </h2>
        <ProcessSteps steps={PIPELINE} accent="gold" />
      </section>

      <section className="mt-10">
        <ChromeLabel accent="gold">Services &amp; rates</ChromeLabel>
        <ServicesTable rows={SERVICES} />
      </section>

      <Card className="mt-10 border-l-2 border-l-gold-400">
        <div className="font-display text-2xl italic text-gold-300">
          Commission a survey.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          Museums, historical sites, cultural organisations. Heritage England
          format compliance, grant co-funding advice, 20 years of VR
          development behind the delivery layer. This is not a drone-with-a-
          camera service.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=heritage">Get a quote</BtnPrimary>
          <BtnGhost href="/pricing">Pricing →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
