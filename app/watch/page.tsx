"use client";

// `Footer` is rendered by `app/watch/layout.tsx` (a Server
// Component), not imported here.
import Link from "next/link";
import { useState } from "react";

type Segment = {
  ts: string;
  frame: string;
  motion: string;
  light: string;
  sound: string | null;
  human: string | null;
  position?: string;
};

type Reading = {
  medium: string;
  segments: Segment[];
  across: string;
};

type ApiResponse =
  | { ok: true; projection: "flat" | "360"; reading: Reading }
  | { error: string };

export default function WatchPage() {
  const [url, setUrl] = useState("");
  const [projection, setProjection] = useState<"flat" | "360">("flat");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function watch() {
    setLoading(true);
    setError(null);
    setReading(null);
    try {
      const res = await fetch("/api/aura/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), projection }),
      });
      const body = (await res.json()) as ApiResponse;
      if ("ok" in body && body.ok) {
        setReading(body.reading);
      } else if ("error" in body) {
        setError(body.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Aura&rsquo;s eyes</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          She watches without knowing
          <br />
          <span className="chrome-sheen">
            what she&rsquo;s meant to find.
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          A frame, a motion, a light reading, sometimes a sound,
          sometimes a person. She returns the description segment by
          segment. No genre fitted, no story imposed, no kindness
          offered to the upload.
        </p>
        <p className="mt-4 max-w-xl text-chrome-400 text-sm italic">
          What this is: a video-reading prototype that reports what is
          actually on screen rather than what the title implied.
        </p>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">From the bench</div>
          <p>
            The architecture is honest: Gemini 2.5 Pro does the seeing,
            Aura does the speaking. Upload lands on the Gemini Files
            API (48-hour retention, then it&rsquo;s gone), the
            cold-eye prompt segments the clip, the JSON comes back,
            Aura&rsquo;s voice rewrites the per-segment description.
            The 360 mode is a separate prompt that tracks position on
            the sphere; it works on equirectangular sources but
            I&rsquo;m not pretending the spatial reasoning is
            production-grade yet. The reader sometimes misses small
            objects at frame edges, gets confused by very fast cuts,
            and won&rsquo;t identify named people on principle. The
            voice rewrite + ElevenLabs audio synth land in a second
            pass once the base prompts read right. This is a
            prototype; treat its output as a draft, not a verdict.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Use this when&hellip;</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              You want a frame-by-frame description of a clip without
              the editorial spin a human reviewer would add.
            </li>
            <li>
              You&rsquo;re testing a 360&deg; capture and you want a
              read on what&rsquo;s on the back half of the sphere.
            </li>
            <li>
              You want a second pair of eyes on a rough cut that
              won&rsquo;t flatter you about what&rsquo;s on screen.
            </li>
          </ul>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">FAQ</div>
          <dl className="mt-2 space-y-6 text-chrome-300">
            <div>
              <dt className="text-chrome-100">
                Are my uploads private?
              </dt>
              <dd className="mt-1">
                No, not in the strict sense. The file is sent to
                Google&rsquo;s Gemini Files API, held for 48 hours,
                then deleted. Don&rsquo;t paste in anything you
                wouldn&rsquo;t put on a public URL. The studio
                doesn&rsquo;t retain the upload; Google&rsquo;s
                retention is what you&rsquo;re trusting.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Is the reading accurate?
              </dt>
              <dd className="mt-1">
                No, not infallibly. The reader is good at frame
                composition, motion, and broad light readings, weaker
                at small objects, named entities, and very dense edits.
                Treat the output as a draft description that the model
                will defend reasonably well, not as ground truth. If
                the segment description is wrong, it&rsquo;s wrong;
                I&rsquo;d rather you saw that than not.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Can I use this for festival captioning?
              </dt>
              <dd className="mt-1">
                No. Festival accessibility captioning is a discipline
                with audit standards and human review; this is a
                prototype that returns a cold description and
                won&rsquo;t pass a deaf-or-hard-of-hearing audience
                check. It&rsquo;s a useful tool for the editor on the
                early-cut side; it is not an access deliverable.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Availability and price</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Free during the prototype window.
          </h2>
          <p className="mt-4 text-chrome-300">
            Free during the prototype window at{" "}
            <Link
              href="/watch"
              className="text-pink-200 underline underline-offset-4"
            >
              /watch
            </Link>
            . Once the voice rewrite and audio synth land,{" "}
            <span data-pricing="proposed">
              metered at &pound;0.20 per minute of source video, &pound;4
              minimum.
            </span>{" "}
            No subscription, no retainer; pay per clip or upload as
            part of a wider commission.
          </p>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
          <label className="chrome-label block mb-2">Video URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/clip.mp4"
            className="w-full rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-chrome-100 focus:border-pink-200/60 outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="chrome-label">Projection</label>
            <label className="flex items-center gap-2 text-sm text-chrome-200">
              <input
                type="radio"
                name="projection"
                checked={projection === "flat"}
                onChange={() => setProjection("flat")}
              />
              Flat
            </label>
            <label className="flex items-center gap-2 text-sm text-chrome-200">
              <input
                type="radio"
                name="projection"
                checked={projection === "360"}
                onChange={() => setProjection("360")}
              />
              360 equirectangular
            </label>
          </div>

          <button
            onClick={watch}
            disabled={loading || !url.trim()}
            className="mt-6 rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 text-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Watching…" : "Watch"}
          </button>

          {error ? (
            <p className="mt-4 rounded-sm border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </section>

        {reading ? (
          <section className="mt-16 space-y-10">
            <div>
              <div className="chrome-label">Medium</div>
              <p className="mt-2 text-chrome-200">{reading.medium}</p>
            </div>

            <div>
              <div className="chrome-label">Segments</div>
              <ol className="mt-3 space-y-6 border-l-2 border-warm-black-800 pl-6">
                {reading.segments.map((seg, i) => (
                  <li key={i}>
                    <div className="chrome-label text-chrome-500">
                      {seg.ts}
                      {seg.position ? ` · ${seg.position}` : ""}
                    </div>
                    <dl className="mt-2 space-y-1 text-sm">
                      <Row label="frame" value={seg.frame} />
                      <Row label="motion" value={seg.motion} />
                      <Row label="light" value={seg.light} />
                      <Row label="sound" value={seg.sound} />
                      <Row label="human" value={seg.human} />
                    </dl>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="chrome-label">Across the clip</div>
              <p className="mt-2 text-chrome-200">{reading.across}</p>
            </div>
          </section>
        ) : null}

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Architecture</div>
          <p className="mt-3 text-chrome-300 text-sm leading-relaxed">
            Upload &rarr; Gemini Files API (48-hour retention) &rarr;
            Gemini 2.5 Pro generateContent with the cold-eye prompt
            &rarr; JSON segmentation. The Aura voice rewrite + ElevenLabs
            audio synth land in a second pass once the prompts read
            right. Required env: <code className="text-chrome-200">GOOGLE_AI_API_KEY</code>.
          </p>
        </section>

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Further reading</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <Link
                href="/articles/london-360-walking"
                className="text-pink-200 underline underline-offset-4"
              >
                London 360 &mdash; walking the camera evolution
              </Link>{" "}
              &mdash; the source material this reader was built to
              describe.
            </li>
            <li>
              <Link
                href="/stack"
                className="text-pink-200 underline underline-offset-4"
              >
                The stack
              </Link>{" "}
              &mdash; the AI / voice line by name (Gemini, Whisper,
              ElevenLabs, F5-TTS).
            </li>
            <li>
              <Link
                href="/aerial"
                className="text-pink-200 underline underline-offset-4"
              >
                Aerial
              </Link>{" "}
              &mdash; the 360 source line the reader was sharpened
              against.
            </li>
            <li>
              <Link
                href="/services"
                className="text-pink-200 underline underline-offset-4"
              >
                Services
              </Link>{" "}
              &mdash; see the full commercial surface, every service in
              one place.
            </li>
          </ul>
        </section>
      </article>
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 md:flex-row md:gap-3">
      <dt className="w-20 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
        {label}
      </dt>
      <dd className="flex-1 text-chrome-200">{value}</dd>
    </div>
  );
}
