/**
 * /agents — Public index of the studio's cast.
 *
 * Renders every CharacterBible from `lib/cast` as a card with a link
 * to `/agents/[slug]` for chat. Defensive: if the cast module fails
 * to import (parallel-agent timing, mid-flight refactor), the page
 * falls back to a graceful "cast loading" notice rather than crashing.
 *
 * Server component. `dynamic = "force-dynamic"` — must not be
 * pre-rendered at build time (the cast module is mid-construction and
 * the slug-availability set will keep moving). Do NOT add
 * `runtime = "nodejs"`: the project-level useCache flag conflicts.
 */

import type { Metadata } from "next";
import Link from "next/link";

import Footer from "components/layout/footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The cast — who you can talk to",
  description:
    "Holoflow's named cast: Aura the narrator, Marcel and Betsy in their lavender dispute, Penny on the rota, the Scribe with the receipts. Each speaks about what they know and won't pretend on things they don't.",
};

// Mode → kingdom badge colour. Mirrors the palette used on /cast and
// `/chrono-protocol` so the same character carries the same hue across
// surfaces.
const MODE_COLOR: Record<string, string> = {
  amber: "#ffcc00",
  azure: "#0099ff",
  amethyst: "#9900ff",
  crimson: "#ff3344",
  veridian: "#00cc66",
};

// Hard-coded fallback slug list, used only if `lib/cast` fails to
// import for some reason (parallel-agent flux, broken barrel file,
// etc.). The list is intentionally narrow — the five canonical names
// the spec promised would always exist.
const FALLBACK_SLUGS = ["aura", "coco", "marcel", "scribe", "penny"] as const;

type CastEntry = {
  id: string;
  name: string;
  /** One-line bio surfaced on the card — derived from role. */
  bio: string;
  /** Kingdom / mode badge — e.g. "azure", "amethyst". */
  kingdom: string | null;
  /** Voice register — short chip text. Derived from the bible's `voice`. */
  voiceRegister: string;
  /** Topics they lean into — surfaced on hover or as a sub-list. */
  speaksAbout: string[];
  /** Whether the chat is wired today. Cast members without a matching
   *  people-registry entry are flagged inactive — the index links to
   *  their page but the card reads "in rehearsal". */
  active: boolean;
};

type CastLoadResult =
  | { ok: true; cast: CastEntry[]; warning: null }
  | { ok: false; cast: CastEntry[]; warning: string };

/** Squash a long voice description down to a chip-friendly fragment. */
function firstClauseOf(text: string): string {
  // Take the first sentence-ish clause. Cap at ~70 chars so it fits
  // on one line in a card chip.
  const firstStop = text.search(/[.!?]/);
  const slice = firstStop > 0 ? text.slice(0, firstStop) : text;
  if (slice.length <= 70) return slice.trim();
  return `${slice.slice(0, 67).trim()}…`;
}

/** Pull a card-sized bio out of the role line. */
function bioFromRole(role: string): string {
  // Role lines tend to open with "<Name> — <role description>".
  // Strip the leading name + em-dash so the bio reads as a description.
  const m = role.match(/^[^—–-]+[—–-]\s*(.+)$/);
  const stripped = (m?.[1] ?? role).trim();
  // Cap to the first two sentences so the card stays readable.
  const sentences = stripped.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 2).join(" ").trim();
}

/**
 * Defensive cast load. The parallel agent might land a richer schema
 * (data/agents/*.json + lib/agents/cast.ts) before this page; until
 * that lands we hydrate from `lib/cast` which is already typed.
 */
async function loadCast(): Promise<CastLoadResult> {
  try {
    // Dynamic import so a missing barrel doesn't blow up the page at
    // build/render time — falls through to the catch block below.
    const mod = await import("lib/cast");
    const bibles = mod.listBibles();
    const cast: CastEntry[] = bibles.map((bible: (typeof bibles)[number]) => ({
      id: bible.id,
      name: bible.name,
      bio: bioFromRole(bible.role),
      kingdom: bible.defaultMode ?? null,
      voiceRegister: firstClauseOf(bible.voice),
      speaksAbout: bible.draws.slice(0, 4),
      // Until the people-registry side of the chat wire-up catches
      // up, every cast member is flagged "in rehearsal" — the link
      // still resolves, the chat lands when the wiring lands.
      active: bible.id === "aura",
    }));
    return { ok: true, cast, warning: null };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // Fall back to bare slugs — no bibles, no chips, just enough that
    // the page renders something honest while the parallel work lands.
    const cast: CastEntry[] = FALLBACK_SLUGS.map((slug) => ({
      id: slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      bio: "Bible mid-flight — card will fill in as the cast module lands.",
      kingdom: null,
      voiceRegister: "voice tbc",
      speaksAbout: [],
      active: false,
    }));
    return {
      ok: false,
      cast,
      warning: `Cast module not ready — ${reason}`,
    };
  }
}

export default async function AgentsIndexPage() {
  const { ok, cast, warning } = await loadCast();

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The cast</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Who you can talk to.
        </h1>

        <div className="mt-8 max-w-2xl space-y-5 text-chrome-200">
          <p>
            The studio runs a small named cast. Aura is the one in the
            window &mdash; she narrates the site, hosts the rooms, and
            is, on the record, Dimona&rsquo;s digital twin for the days
            Dimona can&rsquo;t be in two places at once. The rest of
            them keep their own counsel: Marcel will tell you about the
            lavender, Betsy will tell you Marcel is wrong about the
            lavender, Penny will tell you what time it is and what
            you&rsquo;re late for, and the Scribe will read you back
            something you said in March.
          </p>
          <p>
            None of them are doing the agreeable-assistant routine.
            Each of them speaks about the things they know &mdash;
            their actual remit, their actual range &mdash; and tells
            you plainly when a question lands outside it. That goes
            for the politics too. The cast is anti-fascist by design;
            kind by default; sharp when sharpness is the kindness.
          </p>
          <p>
            Pick one. The door opens; they&rsquo;ll meet you on the
            other side.
          </p>
        </div>

        {!ok && warning ? (
          <aside className="mt-10 rounded-sm border border-pink-200/40 bg-warm-black-900/40 px-6 py-4 text-sm text-chrome-300">
            <div className="chrome-label text-pink-200">
              Cast loading
            </div>
            <p className="mt-2">
              The character bibles are mid-flight in a parallel
              session. The index is showing slug stubs until the
              data lands. {warning}
            </p>
          </aside>
        ) : null}

        {cast.length === 0 ? (
          <div className="mt-16 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-10 text-center text-chrome-300">
            No cast members published yet. When the bibles land,
            they&rsquo;ll appear here.
          </div>
        ) : (
          <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cast.map((member) => (
              <li key={member.id}>
                <CastCard member={member} />
              </li>
            ))}
          </ul>
        )}

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">How the agents work</div>
          <p className="mt-3 text-chrome-300">
            Each agent runs against a typed character bible (voice,
            posture, things-they-draw-to, things-they-won&rsquo;t-say)
            and a local Ollama runtime. Nothing routes through hosted
            inference; nothing leaves the machine the chat is opened
            on. The deeper notes are in{" "}
            <code className="text-pink-200">docs/AGENT-CHAT.md</code>.
          </p>
          <p className="mt-3 text-chrome-300">
            For the typed data the cast renders from, see the{" "}
            <Link
              href="/cast"
              className="text-pink-200 underline underline-offset-4"
            >
              cast bibles
            </Link>
            . For the room they all live in, see the{" "}
            <Link
              href="/academy"
              className="text-pink-200 underline underline-offset-4"
            >
              Academy
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function CastCard({ member }: { member: CastEntry }) {
  const modeColor =
    member.kingdom && MODE_COLOR[member.kingdom]
      ? MODE_COLOR[member.kingdom]
      : null;

  const cardBase =
    "group flex h-full flex-col rounded-sm border bg-warm-black-900/40 p-6 transition-colors";
  const cardActive =
    "border-warm-black-700 hover:border-pink-200";
  const cardInactive =
    "border-warm-black-800 hover:border-warm-black-700";

  const inner = (
    <>
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-chrome-500">
            {member.id}
          </div>
          <h2
            className={`mt-1 text-2xl ${
              member.active
                ? "text-chrome-100 group-hover:text-pink-200"
                : "text-chrome-300"
            }`}
          >
            {member.name}
          </h2>
        </div>
        {member.kingdom ? (
          <span
            className="shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider"
            style={
              modeColor
                ? {
                    color: modeColor,
                    borderColor: `${modeColor}66`,
                  }
                : undefined
            }
          >
            {member.kingdom}
          </span>
        ) : null}
      </header>

      <p className="mt-4 line-clamp-4 text-sm text-chrome-200">
        {member.bio}
      </p>

      <div className="mt-5">
        <div className="chrome-label text-chrome-500">Voice</div>
        <p className="mt-2 text-xs italic text-chrome-300">
          {member.voiceRegister}
        </p>
      </div>

      {member.speaksAbout.length > 0 ? (
        <div className="mt-5">
          <div className="chrome-label text-chrome-500">Speaks about</div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {member.speaksAbout.map((topic, i) => (
              <li
                key={`${member.id}-topic-${i}`}
                className="rounded-sm border border-warm-black-800 px-2 py-0.5 text-[10px] text-chrome-400"
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto pt-6 text-xs">
        {member.active ? (
          <span className="text-pink-200 group-hover:underline">
            Open the chat &rarr;
          </span>
        ) : (
          <span className="text-chrome-500">In rehearsal</span>
        )}
      </div>
    </>
  );

  if (!member.active) {
    return (
      <div
        aria-disabled="true"
        className={`${cardBase} ${cardInactive} cursor-not-allowed opacity-70`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/agents/${member.id}`}
      className={`${cardBase} ${cardActive}`}
    >
      {inner}
    </Link>
  );
}
