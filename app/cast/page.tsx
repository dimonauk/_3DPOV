import Footer from "components/layout/footer";
import Link from "next/link";

import LiveBanter from "components/cast/live-banter";
import { listBibles, type CharacterBible } from "lib/cast";
import type { ChronoModeSlug } from "lib/chrono-protocol";

export const metadata = {
  title: "Cast — the studio's named characters",
  description:
    "Five character bibles drive the studio's dialogue and motion: Aura (hostess), Penny (operational intelligence), Marcel (creative lead in the lavender arc), Betsy (Marcel's antagonist), Trixie (Iron-Ribbon pipeline friction). Each is typed data, consumed by agent.dialogue and agent.banter.",
};

const MODE_COLOR: Record<ChronoModeSlug, string> = {
  amber: "#ffcc00",
  azure: "#0099ff",
  amethyst: "#9900ff",
  crimson: "#ff3344",
  veridian: "#00cc66",
};

const PENDING_CAST: { name: string; note: string }[] = [
  { name: "Baby", note: "the prefect — enforces standards, has authority" },
  { name: "The Scribe", note: "documentation and memory — keeper of the canon" },
  { name: "Millie", note: "Trixie's counterpart in the Iron Ribbon arc" },
  { name: "Tim", note: "technical agent" },
  { name: "Excavation Bot", note: "retrieval / archaeology agent" },
  { name: "(five further slots)", note: "named but not canonised in current arcs" },
];

function OceanBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 text-[10px] text-chrome-400">
      <span className="w-24 font-mono uppercase tracking-wider">
        {label}
      </span>
      <div className="relative h-1 flex-1 bg-warm-black-800">
        <div
          className="absolute inset-y-0 left-0 bg-pink-200/40"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono">{pct}</span>
    </div>
  );
}

function CharacterCard({ bible }: { bible: CharacterBible }) {
  const mode = bible.defaultMode as ChronoModeSlug;
  const ocean = bible.oceanBaseline;
  return (
    <article className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-chrome-400">{bible.id}</div>
          <h2 className="mt-1 text-2xl text-chrome-100">{bible.name}</h2>
        </div>
        <div
          className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider"
          style={{
            color: MODE_COLOR[mode],
            borderColor: `${MODE_COLOR[mode]}66`,
          }}
        >
          {mode}
        </div>
      </header>

      <p className="mt-4 text-sm text-chrome-200">{bible.role}</p>

      <section className="mt-5">
        <div className="chrome-label">Voice</div>
        <p className="mt-2 text-xs text-chrome-300">{bible.voice}</p>
      </section>

      <section className="mt-4">
        <div className="chrome-label">Posture</div>
        <p className="mt-2 text-xs text-chrome-300">{bible.posture}</p>
      </section>

      <section className="mt-5">
        <div className="chrome-label">OCEAN baseline</div>
        <div className="mt-2 space-y-1">
          <OceanBar label="openness" value={ocean.openness} />
          <OceanBar label="conscientious" value={ocean.conscientiousness} />
          <OceanBar label="extraversion" value={ocean.extraversion} />
          <OceanBar label="agreeable" value={ocean.agreeableness} />
          <OceanBar label="neuroticism" value={ocean.neuroticism} />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="chrome-label">Catchphrases</div>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-chrome-300">
            {bible.catchphrases.slice(0, 4).map((c) => (
              <li key={c}>&ldquo;{c}&rdquo;</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="chrome-label">Forbidden</div>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-chrome-400 line-through">
            {bible.forbidden.slice(0, 4).map((f) => (
              <li key={f}>&ldquo;{f}&rdquo;</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-5">
        <div className="chrome-label">Draws to</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-chrome-300">
          {bible.draws.slice(0, 4).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

export default function CastPage() {
  const bibles = listBibles();

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The cast</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Five bibles, five voices.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The studio&rsquo;s named characters live as typed data
          under <span className="font-mono text-chrome-100">lib/cast/</span>.
          Each bible names a role, a voice register, a posture, a default
          ChronoMode, an OCEAN baseline, what they draw to, and what
          they never say. The dialogue + banter capabilities consume
          these bibles to keep each character&rsquo;s voice stable
          across turns.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Aura&rsquo;s bible is locked. Penny + Marcel are grounded
          against the Hangar&rsquo;s Charming Academy canon. Betsy +
          Trixie are first-pass &mdash; written from the cast-table
          role + the Iron Ribbon / lavender arcs &mdash; and want
          validation before they ground production dialogue.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
          <Link
            href="/pipelines"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            pipelines
          </Link>
          <Link
            href="/apps"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            apps
          </Link>
        </div>

        <div className="mt-12">
          <LiveBanter />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {bibles.map((b) => (
            <CharacterCard key={b.id} bible={b} />
          ))}
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8">
          <div className="chrome-label">Pending bibles</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Six characters named, not yet typed.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-chrome-300">
            The Charming Academy canon names fourteen agents. The
            five above have bibles; six more are scoped by role but
            haven&rsquo;t been written up. They live in the
            dollyos-world skill canon and surface in the dialogue
            layer once their bibles land.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            {PENDING_CAST.map((p) => (
              <li
                key={p.name}
                className="rounded-sm border border-warm-black-800 bg-warm-black-950/50 p-4"
              >
                <div className="text-chrome-200">{p.name}</div>
                <div className="mt-1 text-xs text-chrome-400">{p.note}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Where the bibles plug in</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-mono text-chrome-100">agent.dialogue</span>{" "}
              loads a bible per turn; the bible&rsquo;s voice +
              draws + refusals + forbidden phrases assemble the
              LLM system prompt.
            </li>
            <li>
              <span className="font-mono text-chrome-100">agent.banter</span>{" "}
              loads several bibles at once for multi-character
              exchanges (the Pipeline Banter composition at{" "}
              <Link
                href="/pipelines"
                className="text-pink-200 underline underline-offset-4"
              >
                /pipelines
              </Link>
              ).
            </li>
            <li>
              The character&rsquo;s <span className="font-mono">defaultMode</span>{" "}
              seeds the ChronoMode register on first interaction;
              the LLM can pick a different mode per turn.
            </li>
            <li>
              The <span className="font-mono">oceanBaseline</span>{" "}
              feeds Aura&rsquo;s slice on load and drifts through
              <span className="font-mono"> nudgeOcean</span> as
              conversations resolve.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
