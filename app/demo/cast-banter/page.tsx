/**
 * app/demo/cast-banter/page.tsx — Server shell for the multi-character banter demo.
 *
 * # Purpose
 * The site's demonstrable home for the `agent.banter` capability. Where
 * `/demo/aura-talks` shows one voice speaking, this shows two-to-five
 * voices reacting in concert to a telemetry tick, grounded in the
 * studio's character bibles. Provides the prose (Dimona's bench
 * register) and the cross-links into /cast, /capabilities, /pipelines
 * (Pipeline Banter), and the lipsync sibling. Embeds the interactive
 * client.
 *
 * # Why this shape
 * Server component so the metadata + prose land in the static HTML and
 * the route is cheap to crawl. The interactive scene-builder is its own
 * client island.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import {
  respondBanter,
  type BanterContext,
  type BanterResult,
} from "lib/capabilities/agent/banter";
import { bibles, type CastMemberId } from "lib/cast";
import { isConfigured } from "lib/env";

import CastBanterDemoClient from "./cast-banter-demo-client";

export const metadata = {
  title: "Cast banter — agent.banter with the studio's named voices",
  description:
    "A scene-builder for the agent.banter capability. Pick two or more cast members, set a ChronoMode and a telemetry tick, watch the cast banter back in their bibles' voices. Pipeline Banter, surfaced.",
};

async function generateBanterAction(
  context: BanterContext,
): Promise<BanterResult> {
  "use server";
  const activeIds = context.activeSpeakers.filter(
    (id): id is CastMemberId => id in bibles,
  );
  return respondBanter({ ...context, activeSpeakers: activeIds }, bibles);
}

export default function CastBanterDemoPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Demo &middot; agent.banter</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The cast banters.
          <br />
          <span className="chrome-sheen">Telemetry in, voices out.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-chrome-200">
          <span className="font-mono text-chrome-100">agent.banter</span>{" "}
          is the multi-voice sibling of{" "}
          <span className="font-mono text-chrome-100">agent.dialogue</span>.
          You hand it a telemetry snapshot &mdash; speed, ChronoMode,
          combo, health, last event &mdash; and the subset of the cast
          who are currently on-mic. It assembles each speaker&rsquo;s
          bible into one multi-voice system prompt, calls Gemini once
          with a JSON response schema, and hands back a one-to-three
          line exchange typed as{" "}
          <span className="font-mono text-chrome-100">
            {"{ speaker, emotion, text }[]"}
          </span>
          . No hardcoded triple; any subset of the named cast can
          banter.
        </p>

        <p className="mt-4 max-w-2xl text-chrome-300">
          Below: a scene-builder. Toggle the speaker chips to put cast
          members on-mic, pick a ChronoMode, write what just happened
          in the world, nudge the telemetry sliders, and press{" "}
          <span className="text-pink-200">Generate banter</span>. The
          response renders as a chat transcript with the speaker chip
          colour-coded by their default ChronoMode register.
        </p>

        <p className="mt-4 max-w-2xl text-chrome-300">
          If{" "}
          <span className="font-mono text-chrome-200">
            GOOGLE_AI_API_KEY
          </span>{" "}
          isn&rsquo;t configured, the demo falls back to a canned
          exchange synthesised from the bibles&rsquo; own{" "}
          <span className="font-mono text-chrome-200">catchphrases</span>{" "}
          array. The fallback is signalled clearly above the transcript
          so you always know which version you&rsquo;re reading. The
          moment the key lands in{" "}
          <span className="font-mono text-chrome-200">.env.local</span>{" "}
          (or Vercel project settings), the real Gemini call activates
          with no other change.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/cast"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            cast bibles
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capability registry
          </Link>
          <Link
            href="/pipelines"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            pipelines &mdash; Pipeline Banter
          </Link>
          <Link
            href="/demo/aura-talks"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling: lipsync chain
          </Link>
        </div>

        <CastBanterDemoClient
          available={isConfigured("GOOGLE_AI_API_KEY")}
          generate={generateBanterAction}
        />

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What the brick does</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              The client gathers{" "}
              <span className="font-mono text-chrome-100">
                BanterContext
              </span>{" "}
              &mdash; active speakers, ChronoMode, last event,
              telemetry &mdash; and posts it to the server action.
            </li>
            <li>
              The action calls{" "}
              <span className="font-mono text-chrome-100">
                respondBanter(context, bibles)
              </span>{" "}
              from{" "}
              <span className="font-mono">
                lib/capabilities/agent/banter.ts
              </span>{" "}
              with the registry of{" "}
              <span className="font-mono">lib/cast</span> bibles.
            </li>
            <li>
              The capability builds one system prompt from the speaker
              bibles (voice, posture, draws, refusals, catchphrases,
              forbidden), summarises the telemetry into a user
              payload, and calls Gemini once with an enum-constrained
              JSON response schema.
            </li>
            <li>
              The response is parsed back to{" "}
              <span className="font-mono text-chrome-100">
                BanterTurn[]
              </span>{" "}
              with speakers filtered to the active set and emotions
              normalised to the six-value enum.
            </li>
            <li>
              The client renders the transcript. In production, the
              caller would chain each turn through{" "}
              <span className="font-mono">audio.tts</span> per
              speaker. The demo stops at text so you can read the
              voices side by side.
            </li>
          </ol>
        </section>
      </article>
      <Footer />
    </>
  );
}
