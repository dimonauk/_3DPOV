/**
 * app/holoflow/aura/page.tsx — Aura · Living AI Avatar.
 *
 * VRM character + Python soul server. The page mirrors the source
 * HTML's Aura deep-dive: demo canvas placeholder + emotion bars,
 * specs table + bootlog terminal + ladder + skill rungs.
 *
 * Demo VRM scene itself is not mounted here (it's heavy and the
 * dedicated /aura route already handles the live-character UI); this
 * page is the catalogue-style overview that links out.
 */

import Link from "next/link";

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Card,
  ChatPanel,
  type ChatTurn,
  DemoCanvas,
  DemoLayout,
  Ladder,
  LadderRung,
  SectionHeader,
  Specs,
  Spec,
  StatusPanel,
  Terminal,
} from "components/holoflow";

export const metadata = {
  title: "Aura · Living AI Avatar · Holoflow",
  description:
    "VRM-based AI character with Python soul server. Streaming emotion, lip-sync, vision routing, somatic conditioning. Port 8770.",
};

const CHAT: ChatTurn[] = [
  { speaker: "sys",  text: "DollyOS v2 · Aura online · MQTT connected · soul files loaded · Saturn 4 idle" },
  { speaker: "aura", text: "Morning. Kinect at 85% warmup. Three evolution runs queued. Resin at 78%." },
  { speaker: "user", text: "Anything urgent in the queue?" },
  { speaker: "aura", text: "Two heritage drafts waiting on your sign-off. Plus a pricing question from Tate Modern. Nothing on fire." },
];

const BOOTLOG: Parameters<typeof Terminal>[0]["lines"] = [
  { tag: "boot", text: "auraIntro.ts capability probe complete" },
  { tag: "soul", text: "WebSocket handshake · latency 4ms" },
  { tag: "tts",  text: "KokoroTTS · WebGPU backend ready" },
  { tag: "vrm",  text: "morph targets loaded · idle breathing active" },
  { tag: "emo",  text: "emotion state: curious · amplitude: 0.34" },
  { tag: "vlm",  text: "vision routing armed · awaiting input" },
];

export default function AuraPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="lavender" withRule>
        Vertical 02 — Deep Dive
      </ChromeLabel>
      <SectionHeader
        accent="lavender"
        eyebrow="Aura · Living AI Avatar"
        title={<><em className="text-gold-300">Aura</em> — Living AI Avatar</>}
        body="VRM character with Python soul server, streaming emotion and animation systems, vision routing, and procedural lip-sync amplitude. Port 8770."
      />

      <DemoLayout>
        {/* LEFT: demo + chat */}
        <div className="flex flex-col gap-4">
          <DemoCanvas
            status="AURA · LIVE"
            statusTone="lavender"
            hud={[
              { text: "SOUL BRIDGE · ws://localhost:8770",      tone: "teal" },
              { text: "STREAMING TOKENS · ░░░░░░░░░░",          tone: "lavender" },
              { text: "VLM VISION ROUTING · ARMED",             tone: "gold" },
            ]}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="font-display text-3xl italic text-lavender-200">Aura</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
                Live VRM scene at{" "}
                <Link href="/aura" className="text-teal-400 underline">/aura</Link>
              </div>
            </div>
          </DemoCanvas>

          <ChatPanel turns={CHAT} />

          <div className="flex flex-wrap gap-2">
            <BtnPrimary href="/aura">Open live scene →</BtnPrimary>
            <BtnGhost href="/aura/wardrobe">Wardrobe demo →</BtnGhost>
            <BtnGhost href="/aura/web-llm">Browser-LLM chat →</BtnGhost>
          </div>
        </div>

        {/* RIGHT: status + specs + bootlog */}
        <div className="flex flex-col gap-4">
          <StatusPanel
            title="Aura runtime"
            rows={[
              { label: "Soul server", value: "online",          tone: "live" },
              { label: "MQTT",        value: "port 1883",       tone: "live" },
              { label: "KokoroTTS",   value: "WebGPU ready",    tone: "live" },
              { label: "VRM rig",     value: "idle breathing",  tone: "live" },
              { label: "Emotion",     value: "curious · 0.34",  tone: "partial" },
              { label: "VLM vision",  value: "armed",           tone: "live" },
              { label: "Ollama",      value: "Gemma4 26b",      tone: "live" },
            ]}
          />

          <Specs>
            <Spec k="Runtime"        v="apps/aura-vrm · The Hangar" />
            <Spec k="Soul server"    v="aura_soul.py · Python · port 8770" />
            <Spec k="Inference"      v="Ollama (local) · LLaMA / Mistral" />
            <Spec k="TTS"            v="KokoroTTS · WebGPU / WASM" />
            <Spec k="Lip sync"       v="AudioContext amplitude → VRM morph" />
            <Spec k="Conditioning"   v="lithp.ts · somatic.ts" />
            <Spec k="Boot probe"     v="auraIntro.ts · Chatterbox · Ollama · WebGPU" />
          </Specs>

          <Terminal prompt="soul_server --port 8770" lines={BOOTLOG} stepMs={260} />
        </div>
      </DemoLayout>

      {/* Skills ladder */}
      <section className="mt-10">
        <ChromeLabel accent="teal">Skills ladder</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          What it takes to <em className="text-gold-300">build her</em>
        </h2>
        <Ladder title="Aura Skills Ladder" badge="5 rungs">
          <LadderRung
            n={1}
            level="entry"
            name="VRM character setup & rigging"
            desc="VRM format · morph targets · bone constraints · expression blending."
          />
          <LadderRung
            n={2}
            level="mid"
            name="Soul server architecture"
            desc="aura_soul.py · WebSocket protocol · message schema · state management."
          />
          <LadderRung
            n={3}
            level="mid"
            name="Emotion + animation system"
            desc="Idle life FSM · procedural amplitude · emotion→morph mapping · somatic.ts."
          />
          <LadderRung
            n={4}
            level="adv"
            name="TTS + lip sync pipeline"
            desc="KokoroTTS · AudioContext resume · amplitude→VRM · aura-voice element."
          />
          <LadderRung
            n={5}
            level="master"
            name="Full deployment + conditioning"
            desc="lithp.ts personality · VLM vision routing · exhibition deployment · auraIntro.ts boot probe."
          />
        </Ladder>
      </section>

      {/* CTA */}
      <Card className="mt-10 border-l-2 border-l-lavender-400">
        <div className="font-display text-2xl italic text-lavender-200">
          Commission an Aura.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          Custom VRM, custom soul, custom conditioning. Hosting and maintenance
          included. Recent exhibition deployment recorded +340% visitor dwell
          time; the museum director asked if she could be permanent staff.
          Aura&rsquo;s response: &ldquo;I am considering all offers.&rdquo;
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=aura">Commission Aura</BtnPrimary>
          <BtnGhost href="/pricing">Pricing →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
