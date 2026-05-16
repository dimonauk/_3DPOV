/**
 * app/play/agent-town/page.tsx — Server shell for Agent Town.
 *
 * # Purpose
 * The studio's cast, simulated. A small top-down grid the named cast
 * wanders around in. Click a tile to inspect that voice; press the
 * banter button to ask the on-screen cast to react in concert via
 * `agent.banter`. Sibling to /play/neo-london.
 *
 * # Why this shape
 * Server component owns the metadata + the prose + the banter server
 * action. The simulation itself is an interactive Canvas + React island
 * (`agent-town-client.tsx`). Plain DOM/Canvas — no Phaser, no Three —
 * because the source app's renderer was a hundred lines of shape draws
 * and a wander loop, and the Holoflow site has no Phaser in its lockfile.
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
import { createLogger } from "lib/log";

import AgentTownClient from "./agent-town-client";

export const metadata = {
  title: "Agent Town — the cast, simulated",
  description:
    "The studio's named cast — Aura, Penny, Marcel, Baby, Millie, Betsy, Trixie, Tim — wandering a top-down floor. Click one to inspect. Press banter to ask the room to react. The agent.banter capability, surfaced as a play surface.",
};

const routeLog = createLogger("route:/play/agent-town");

async function generateBanterAction(
  context: BanterContext,
): Promise<BanterResult> {
  "use server";
  const actionLog = createLogger("action:play.agent-town.banter");
  const activeIds = context.activeSpeakers.filter(
    (id): id is CastMemberId => id in bibles,
  );
  if (activeIds.length === 0) {
    actionLog.warn("no active speakers had matching bibles", {
      asked: context.activeSpeakers,
    });
    return { turns: [], tickMs: context.telemetry.tickMs ?? 12_000 };
  }
  actionLog.info("respondBanter call", {
    activeIds,
    chronoMode: context.telemetry.chronoMode,
  });
  return respondBanter({ ...context, activeSpeakers: activeIds }, bibles);
}

export default function AgentTownPage() {
  routeLog.info("render");

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          The cast, simulated &middot; a play surface
        </div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Agent Town.
        </h1>

        <section className="mt-10 prose-gallery text-chrome-200">
          <p>
            A top-down floor. Each shape is one of the studio&rsquo;s
            named cast, wandering inside their home room. Click a shape
            to inspect that voice &mdash; the role, the current task,
            the mood it&rsquo;s in. Press the banter button to ask the
            cast on the floor to react in concert: a one-to-three line
            exchange grounded in each speaker&rsquo;s bible and the
            scene state the floor reports back.
          </p>
          <p>
            Mechanically this is the{" "}
            <Link
              href="/capabilities"
              className="text-pink-200 underline underline-offset-4"
            >
              <span className="font-mono">agent.banter</span> capability
            </Link>{" "}
            wrapped in a play surface &mdash; the same brick the demo
            page at{" "}
            <Link
              href="/demo/cast-banter"
              className="text-pink-200 underline underline-offset-4"
            >
              /demo/cast-banter
            </Link>{" "}
            exposes as a clinical scene-builder, here surfaced as a
            small simulation you can poke at. Each shape&rsquo;s
            current task is forwarded into the banter call as the
            last-event hint, so the exchange responds to what the
            shapes were doing when you pressed the button.
          </p>
          <p>
            Sibling to{" "}
            <Link
              href="/play/neo-london"
              className="text-pink-200 underline underline-offset-4"
            >
              /play/neo-london
            </Link>{" "}
            &mdash; not a chamber of the atelier (that&rsquo;s for
            making things), a play surface for the cast.
          </p>
        </section>

        <AgentTownClient
          available={isConfigured("GOOGLE_AI_API_KEY")}
          generate={generateBanterAction}
        />

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-sm text-chrome-300">
          <div className="chrome-label mb-3 text-chrome-500">
            What this is
          </div>
          <p>
            Eight named voices wander a six-room floor at 24 frames a
            second. The renderer is plain Canvas 2D. The cast roster is
            read from{" "}
            <span className="font-mono text-chrome-100">lib/cast</span>{" "}
            so each shape on the floor maps one-to-one to a real
            character bible. Banter goes through the same{" "}
            <span className="font-mono text-chrome-100">
              respondBanter
            </span>{" "}
            server action the rest of the site uses; the floor passes
            the selected agent (if any) plus the others currently
            on-mic, and the active task strings get joined into the{" "}
            <span className="font-mono">lastEvent</span> the banter
            prompt reacts to.
          </p>
        </section>

        <section className="mt-12">
          <div className="chrome-label mb-3 text-chrome-500">
            Cross-references
          </div>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            <li className="py-4">
              <Link
                href="/cast"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  The cast
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Every bible the simulation reads from. Aura, Penny,
                  Marcel, Baby, Millie, Betsy, Trixie, Tim.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/demo/cast-banter"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Cast banter demo
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The clinical scene-builder for the same brick. Pick
                  speakers, pick a mode, set a last event, watch them
                  speak.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/capabilities"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Capabilities
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The full capability registry &mdash; where{" "}
                  <span className="font-mono">agent.banter</span> sits
                  alongside the other studio bricks.
                </p>
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
