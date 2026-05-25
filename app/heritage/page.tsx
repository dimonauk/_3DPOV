"use client";

/**
 * app/heritage/page.tsx — Heritage Documentation vertical deep-dive.
 *
 * Five-tab page composing the holoflow vocabulary. Cribbed from the
 * v5 reference `#p-heritage` section. The "Live Scan Demo" tab is a
 * stubbed canvas placeholder for now — the actual point-cloud
 * renderer lands in Phase E.
 *
 * Voice: catalogue. Tech-stack honest. Heritage England compliance
 * is the load-bearing word for grant-funded projects.
 */

import { useMemo } from "react";

import {
  Card,
  Chip,
  ChromeLabel,
  Ladder,
  LadderRung,
  MetricCard,
  ProcessSteps,
  type ProcessStep,
  SectionHeader,
  Spec,
  Specs,
  StubBox,
  TabBar,
  TabPanel,
  useTabs,
} from "components/holoflow";

const DELIVERABLE_FORMATS = [
  "Heritage England .glb",
  "WebXR scene",
  "Point cloud .e57",
  "Blender .blend",
  "STL for print",
  "PDF report",
  "360 video",
];

const PIPELINE_STEPS: ProcessStep[] = [
  {
    title: "Site assessment",
    body: "Access planning · resolution spec · equipment manifest · Heritage England compliance checklist.",
  },
  {
    title: "Insta360 + MQTT gimbal capture",
    body: "soulSlice.ts bridge · Aura monitors via VLM · session logged · 1–3 days on site.",
  },
  {
    title: "Blender photogrammetry processing",
    body: "Point cloud → mesh reconstruction → UV unwrap → Heritage England export. 5–8 days.",
  },
  {
    title: "WebXR viewer & archive delivery",
    body: "Three.js scene · draco .glb · offline PWA · metadata package · documentation report.",
  },
];

export default function HeritagePage() {
  const t = useTabs([
    "Overview",
    "Live scan demo",
    "Skills ladder",
    "Pipeline",
    "Case studies",
  ]);

  const formatChips = useMemo(
    () => DELIVERABLE_FORMATS.map((f) => <Chip key={f}>{f}</Chip>),
    [],
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
      <ChromeLabel withRule accent="teal">
        Vertical 01
      </ChromeLabel>
      <SectionHeader
        eyebrow="Heritage Documentation"
        title={
          <>
            Heritage <em>Documentation</em>
          </>
        }
        body="Photogrammetry, LiDAR, and immersive archiving. The pipeline from raw capture to WebXR-explorable permanent record."
        accent="teal"
      />

      <TabBar tabs={t.tabs} active={t.active} onChange={t.setActive} />

      {/* ──────────────────────────────── Overview ──── */}
      <TabPanel active={t.active === 0}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Card>
              <h3 className="text-sm font-medium text-chrome-100">What we do</h3>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
                We capture built heritage at millimetre resolution using
                photogrammetry rigs and MQTT-wired Insta360 gimbal
                systems. Output ranges from Heritage England compliant
                .glb archive to fully navigable WebXR experience.
              </p>
            </Card>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Max resolution" value="2 mm" />
              <MetricCard label="Capture" value="1–3 days" />
              <MetricCard label="Processing" value="5–8 days" />
            </div>
            <Card>
              <h3 className="text-sm font-medium text-chrome-100">
                Deliverable formats
              </h3>
              <div className="mt-2 -ml-1">{formatChips}</div>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <Card>
              <h3 className="text-sm font-medium text-chrome-100">Tech stack</h3>
              <Specs>
                <Spec k="Capture" v="Insta360 X4 + custom gimbal rig" />
                <Spec k="Bridge" v="soulSlice.ts · MQTT broker" />
                <Spec k="Processing" v="Blender photogrammetry pipeline" />
                <Spec k="VLM feed" v="Live vision routing · Aura monitored" />
                <Spec k="Delivery" v="Three.js WebXR · offline-first PWA" />
                <Spec k="Archive" v="Heritage England format + metadata" />
              </Specs>
            </Card>
            <StubBox title="Grant co-funding available">
              Some heritage documentation projects may qualify for grant
              co-funding. Mention when enquiring.{" "}
              <em className="text-chrome-500">
                Grant guide in development.
              </em>
            </StubBox>
          </div>
        </div>
      </TabPanel>

      {/* ──────────────────────────────── Live scan demo ──── */}
      <TabPanel active={t.active === 1}>
        <Card className="grid place-items-center bg-warm-black-925/40 py-16">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-400">
              Point cloud renderer
            </div>
            <p className="mt-2 font-mono text-[11px] text-chrome-500">
              Capture-sim canvas widget lands in the TSL pass (Phase E).
              <br />
              For now: this is where the live scan demo plays.
            </p>
          </div>
        </Card>
      </TabPanel>

      {/* ──────────────────────────────── Skills ladder ──── */}
      <TabPanel active={t.active === 2}>
        <Ladder title="Heritage skills ladder" badge="5 rungs">
          <LadderRung
            n={1}
            level="entry"
            name="Site assessment & capture planning"
            desc="Access constraints · resolution requirements · equipment checklist · archive format decision."
          />
          <LadderRung
            n={2}
            level="entry"
            name="Insta360 gimbal rig operation"
            desc="MQTT wiring · soulSlice.ts bridge · pan/tilt control · VLM live feed routing."
          />
          <LadderRung
            n={3}
            level="mid"
            name="Blender photogrammetry pipeline"
            desc="Point cloud import · mesh reconstruction · UV unwrap · Heritage England format export."
          />
          <LadderRung
            n={4}
            level="adv"
            name="WebXR delivery & viewer build"
            desc="Three.js scene · .glb draco compression · offline-first PWA · mobile LOD strategy."
          />
          <LadderRung
            n={5}
            level="master"
            name="Archive strategy & grant compliance"
            desc="Heritage England formats · metadata schemas · long-term accessibility · co-funding routes."
          />
        </Ladder>
      </TabPanel>

      {/* ──────────────────────────────── Pipeline ──── */}
      <TabPanel active={t.active === 3}>
        <Card>
          <h3 className="text-sm font-medium text-chrome-100">
            Capture → archive pipeline
          </h3>
          <div className="mt-4">
            <ProcessSteps steps={PIPELINE_STEPS} />
          </div>
        </Card>
      </TabPanel>

      {/* ──────────────────────────────── Case studies ──── */}
      <TabPanel active={t.active === 4}>
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold-400">
              Case study
            </div>
            <h4 className="mt-2 text-sm font-medium text-chrome-100">
              Victorian railway viaduct
            </h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              14 km structural survey · Insta360 gimbal · Blender
              photogrammetry · 2 mm resolution · VR walkthrough ·
              Heritage England compliant.
            </p>
            <div className="mt-3 flex gap-4 text-[10px] text-chrome-500">
              <span>
                Duration
                <br />
                <b className="text-chrome-100">6 weeks</b>
              </span>
              <span>
                Status
                <br />
                <b className="text-teal-400">Completed</b>
              </span>
            </div>
          </Card>
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-500">
              Case study stub
            </div>
            <h4 className="mt-2 text-sm font-medium text-chrome-100">
              Church interior documentation
            </h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              Listed building · stained glass photogrammetry · archive +
              educational WebXR viewer.{" "}
              <em className="text-chrome-500">In development.</em>
            </p>
          </Card>
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-500">
              Case study stub
            </div>
            <h4 className="mt-2 text-sm font-medium text-chrome-100">
              Industrial archaeology site
            </h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-chrome-400">
              Former factory complex · LiDAR + photogrammetry hybrid ·
              structural analysis integration.{" "}
              <em className="text-chrome-500">Coming soon.</em>
            </p>
          </Card>
        </div>
      </TabPanel>
    </main>
  );
}
