"use client";

/**
 * components/holo-walk/location-banter.tsx — Penny + Marcel banter
 * for a HoloWalk location.
 *
 * Mounts on the location detail page; lazily fetches a banter
 * exchange via /api/aura/holo-walk-banter when the visitor scrolls
 * the section into view (or after a small delay if it's already
 * on-screen). Renders as a two-column dialogue card.
 *
 * Quiet by default — the surface starts empty + offers a "summon
 * the cast" button; tapping it kicks the fetch and the banter
 * appears. No autoplay, no per-page-load cost unless the visitor
 * asks for it.
 */

import { useCallback, useRef, useState } from "react";

type Turn = {
  speaker: string;
  emotion?: string;
  text: string;
};

const SPEAKER_LABELS: Record<string, string> = {
  penny: "Penny",
  marcel: "Marcel",
  aura: "Aura",
  betsy: "Betsy",
  trixie: "Trixie",
  baby: "Baby",
  scribe: "The Scribe",
  millie: "Millie",
  tim: "Tim",
  "excavation-bot": "Excavation Bot",
};

const SPEAKER_TINT: Record<string, string> = {
  penny: "text-pink-100",
  marcel: "text-chrome-200",
  aura: "text-pink-200",
  betsy: "text-chrome-100",
  trixie: "text-pink-300",
  baby: "text-chrome-300",
  scribe: "text-chrome-200",
  millie: "text-pink-100",
  tim: "text-chrome-300",
  "excavation-bot": "text-chrome-400",
};

export type LocationBanterProps = {
  locationId: string;
  /** Comma-separated cast ids; defaults to "penny,marcel". */
  cast?: string;
};

export default function LocationBanter({
  locationId,
  cast,
}: LocationBanterProps) {
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref-based in-flight guard so the callback doesn't depend on the
  // `busy` state — keeping `busy` in the deps array re-creates the
  // callback every state flip, defeating the point of useCallback
  // and causing the button's onClick reference to churn each render.
  // The ref reads the live value at call-time, which is what we want.
  const inFlightRef = useRef(false);

  const summon = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/aura/holo-walk-banter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, cast }),
      });
      if (!res.ok) {
        // Friendly copy for the 429 path so a rate-limited visitor
        // gets actionable text instead of a raw "429: rate_limited"
        // dump. Other statuses fall through to the raw body.
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const seconds = retryAfter ? Number(retryAfter) : NaN;
          throw new Error(
            Number.isFinite(seconds) && seconds > 0
              ? `The cast needs a moment — try again in ${Math.ceil(seconds)}s.`
              : "The cast needs a moment — too many requests, try again shortly.",
          );
        }
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status}: ${body.slice(0, 200)}`);
      }
      const json = (await res.json()) as { turns?: Turn[] };
      setTurns(json.turns ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [locationId, cast]);

  return (
    <section className="mt-12 rounded-md border border-warm-black-800 bg-warm-black-950/60 p-6">
      <div className="chrome-label">Cast aside</div>
      <h2 className="mt-3 text-2xl text-chrome-100">
        What the cast is saying about this spot.
      </h2>
      <p className="mt-2 max-w-xl text-sm text-chrome-400">
        Two members of the studio&rsquo;s cast can step over and react
        in voice to where the photograph was taken. Tap to summon;
        you&rsquo;ll get a short exchange of brief turns.
      </p>

      {turns === null && !busy && (
        <button
          type="button"
          onClick={() => void summon()}
          className="chrome-label mt-6 rounded-sm border border-pink-200/40 bg-pink-200/10 px-6 py-3 text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
        >
          Summon the cast
        </button>
      )}

      {busy && (
        <div className="mt-6 text-sm text-chrome-400">
          The cast is collecting themselves…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      {turns && turns.length > 0 && (
        <div className="mt-6 space-y-4">
          {turns.map((t, i) => (
            <div
              key={i}
              className="border-l-2 border-warm-black-800 pl-4"
            >
              <div className="chrome-label">
                <span className={SPEAKER_TINT[t.speaker] ?? "text-chrome-200"}>
                  {SPEAKER_LABELS[t.speaker] ?? t.speaker}
                </span>
                {t.emotion && t.emotion !== "neutral" ? (
                  <span className="ml-2 text-chrome-500">
                    · {t.emotion}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-chrome-100">
                {t.text}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => void summon()}
            disabled={busy}
            className="mt-2 text-xs text-chrome-400 underline underline-offset-4 hover:text-pink-200 disabled:opacity-50"
          >
            again, with different beats
          </button>
        </div>
      )}

      {turns && turns.length === 0 && (
        <div className="mt-6 text-sm text-chrome-400">
          The cast looked at each other and shrugged. Try again, or
          give them more to react to.
        </div>
      )}
    </section>
  );
}
