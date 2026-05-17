import Link from "next/link";

import Footer from "components/layout/footer";
import { mediaList } from "lib/capabilities/media/library";
import type { Media } from "lib/capabilities/media/library-types";
import { isFirebaseAdminConfigured } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";

import { ABSOLUTE_URL, FLEET, HOW_IT_WORKS, USE_WHEN } from "./aerial/content";
import { pickGalleryItems } from "./aerial/gallery";
import { buildServiceJsonLd } from "./aerial/json-ld";
import { RecentWork } from "./aerial/recent-work";

const log = createLogger("page.aerial");

export const metadata = {
  title: "Aerial — photography, cinematography, light painting from above",
  description:
    "Aerial cinematography and photography from Holo-Flow Studio, Salford. Five airframes, one FPV pipeline, CAA-registered. Editorial stills, follow-cam B-roll, 360° fly-throughs, and LED-modified airframes for aerial light painting.",
  alternates: { canonical: ABSOLUTE_URL },
  openGraph: {
    title: "Aerial — Holo-Flow Studio",
    description:
      "Five airframes, one FPV pipeline, CAA-registered. Editorial stills, 360° fly-throughs, and LED-modified airframes for aerial light painting.",
    url: ABSOLUTE_URL,
    siteName: "Holo-Flow Studio",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Aerial — Holo-Flow Studio",
    description:
      "Five airframes, one FPV pipeline, CAA-registered. Editorial stills, 360° fly-throughs, light-painting prints.",
  },
};

// Force per-request rendering — the page reads from Firestore live for
// the recent-work gallery slice. Mirrors the pattern in
// app/research/cctv-3d-archive/page.tsx, which is the proven shape in
// this codebase for "marketing page with a small live media-library
// surface" under Next 15.6 canary + PPR. Without this, the canary's
// PPR + revalidate interaction can leave the page rendering an empty
// shell on the first dev visit.
export const dynamic = "force-dynamic";

export default async function AerialPage() {
  // Defence-in-depth: even with revalidate-driven static generation,
  // wrap the fetch so a transient Firestore error or missing env in
  // any environment falls through to the empty-state placeholder
  // rather than 500-ing the whole page.
  let records: Media[] = [];
  if (isFirebaseAdminConfigured()) {
    try {
      records = (await mediaList({ subject: "aerial", limit: 12 })).items;
    } catch (err) {
      log.error("mediaList failed", { err: errToObject(err) });
    }
  }

  const gallery = pickGalleryItems(records);
  const jsonLd = buildServiceJsonLd(gallery);

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        {/*
          JSON-LD Service + Person + ImageGallery payload. Placed inside
          the <article> per the Next.js metadata docs pattern — placing
          a <script> as a direct Fragment child can confuse React's
          server/client child reconciliation in App Router + PPR.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />

        {/* ── Hero ───────────────────────────────────────────────── */}
        <header className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <div className="chrome-label">A working line</div>
            <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
              The studio flies
              <br />
              <span className="chrome-sheen">its own line.</span>
            </h1>
            <p className="mt-8 max-w-xl text-chrome-200">
              A five-airframe fleet, one FPV pipeline, CAA-registered,
              Salford-based. Editorial stills, follow-cam B-roll,
              immersive 360&deg; fly-throughs, and &mdash; first-flight
              this season &mdash; LED-modified airframes for aerial light
              painting.
            </p>
            <p className="mt-4 max-w-xl text-chrome-400 text-sm italic">
              What this is: a one-person aerial cinematography and
              photography line accepting commissions across the UK.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/contact?intent=aerial"
                className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
              >
                Brief the studio &rarr;
              </Link>
              <Link
                href="#fleet"
                className="rounded-full border border-warm-black-700 px-6 py-3 chrome-label text-chrome-200 transition-colors hover:border-chrome-400 hover:text-chrome-100"
              >
                See the fleet
              </Link>
            </div>
          </div>

          {/*
            Hero visual placeholder — pure CSS chrome strip with a
            slow-shifting gradient so the page has visual weight without
            depending on a hero asset that may not be in /public yet.
            The animation respects prefers-reduced-motion via the
            `motion-safe` modifier.
          */}
          <div
            aria-hidden
            className="relative hidden h-64 overflow-hidden rounded-md border border-warm-black-800 md:block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-warm-black-900 to-warm-black-950" />
            <div className="motion-safe:animate-pulse absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,111,181,0.18),transparent_60%)]" />
            <div className="absolute left-4 top-4 chrome-label text-chrome-400">
              CAA-registered &middot; Salford
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-chrome-500 font-mono">
              5 airframes &middot; 1 operator
            </div>
            {/* Decorative scan-line so the strip reads as instrument-panel, not empty box */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-pink-200/30" />
          </div>
        </header>

        {/* ── Use this when ──────────────────────────────────────── */}
        <section className="mt-16">
          <div className="chrome-label mb-4">Use this when&hellip;</div>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_WHEN.map((card) => (
              <div
                key={card.label}
                className="rounded-md border border-warm-black-800 bg-warm-black-950/60 p-5"
              >
                <div className="chrome-label text-pink-200">{card.label}</div>
                <h3 className="mt-2 text-lg text-chrome-100">{card.title}</h3>
                <p className="mt-2 text-sm text-chrome-300">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The fleet ──────────────────────────────────────────── */}
        <section id="fleet" className="mt-16 scroll-mt-20">
          <div className="chrome-label mb-4">The fleet</div>
          <h2 className="mb-6 text-2xl text-chrome-100">
            Five airframes, one pipeline.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET.map((entry) => (
              <article
                key={entry.name}
                className="flex flex-col gap-2 rounded-md border border-warm-black-800 bg-warm-black-950/60 p-5"
              >
                <header className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base text-chrome-100">{entry.name}</h3>
                  {entry.tag ? (
                    <span className="rounded-full border border-pink-200/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-pink-200">
                      {entry.tag}
                    </span>
                  ) : null}
                </header>
                <div className="chrome-label text-chrome-400">{entry.role}</div>
                <p className="mt-1 text-sm text-chrome-300">{entry.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Recent work ────────────────────────────────────────── */}
        <RecentWork gallery={gallery} />

        {/* ── From the bench (preserved prose) ───────────────────── */}
        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">From the bench</div>
          <p>
            I fly the fleet myself. DJI Goggles + RC 2 controller,
            head-tracked through an InAir pod, with the live feed mirrored
            to Xreal One Pro AR glasses. Simultaneous gimbal control,
            AR-overlaid telemetry, and external situational awareness
            without losing line of sight to the airframe. Real flights,
            not hover-and-shoot. Insurance and op-id are in the bag;
            I&rsquo;ll fly in the rain if the airframe rating permits and
            the brief is honest about the look that gives you.
          </p>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section className="mt-16">
          <div className="chrome-label mb-4">How it works</div>
          <h2 className="mb-6 text-2xl text-chrome-100">
            Brief, fly, deliver.
          </h2>
          <ol className="grid gap-4 md:grid-cols-2">
            {HOW_IT_WORKS.map((s) => (
              <li
                key={s.step}
                className="flex gap-4 rounded-md border border-warm-black-800 bg-warm-black-950/60 p-5"
              >
                <div className="chrome-label text-pink-200">{s.step}</div>
                <div>
                  <div className="text-chrome-100">{s.title}</div>
                  <p className="mt-1 text-sm text-chrome-300">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section className="mt-16">
          <div className="chrome-label mb-4">FAQ</div>
          <dl className="space-y-6 text-chrome-300">
            <div>
              <dt className="text-chrome-100">
                Are you insured and CAA-registered?
              </dt>
              <dd className="mt-1">
                Yes. Operator ID and flyer ID in hand, public liability in
                force, A2 Certificate of Competency on file. Paperwork
                forwarded on request before the recce.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">Can you fly indoors?</dt>
              <dd className="mt-1">
                Yes &mdash; the Neo and Neo 2 are sized for it, the Avata
                360 in cinewhoop trim handles tighter interiors when the
                brief justifies the noise. CAA rules treat indoor flight
                as outside the open-category framework, so the constraint
                is the venue&rsquo;s, not mine.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">Will you fly my wedding?</dt>
              <dd className="mt-1">
                Probably not. The studio&rsquo;s aerial line is editorial,
                architectural, and performance-led; the wedding-photography
                pipeline is its own discipline and I&rsquo;m not the right
                person for it. If you want a single editioned aerial
                portrait of the venue, that I&rsquo;ll do.
              </dd>
            </div>
          </dl>
        </section>

        {/* ── Booking + price ────────────────────────────────────── */}
        <section className="mt-16 rounded-md border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Booking and price</div>
          <h2 className="mt-3 text-2xl text-chrome-100">Available now.</h2>
          <p className="mt-4 text-chrome-300">
            Bookable today via{" "}
            <Link
              href="/contact?intent=aerial"
              className="text-pink-200 underline underline-offset-4"
            >
              /contact?intent=aerial
            </Link>
            .{" "}
            <span data-pricing="proposed">
              Half-day shoots from &pound;450; full-day from &pound;750;
              editioned aerial light-painting prints from &pound;350/A2
            </span>{" "}
            once the technique opens for commission. Travel from Salford at
            HMRC mileage rates. Standard work is confirmed within a week;
            aerial light painting is open to brief but not yet guaranteed.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/contact?intent=aerial"
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Brief the studio &rarr;
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-warm-black-700 px-6 py-3 chrome-label text-chrome-200 transition-colors hover:border-chrome-400 hover:text-chrome-100"
            >
              See every service
            </Link>
          </div>
        </section>

        {/* ── Further reading ────────────────────────────────────── */}
        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Further reading</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <Link
                href="/articles/the-fleet-five-airframes"
                className="text-pink-200 underline underline-offset-4"
              >
                The Fleet &mdash; Five Airframes
              </Link>{" "}
              &mdash; every airframe, the architectural argument for each.
            </li>
            <li>
              <Link
                href="/stack"
                className="text-pink-200 underline underline-offset-4"
              >
                The stack
              </Link>{" "}
              &mdash; every airframe, controller, and bridge by name.
            </li>
            <li>
              <Link
                href="/journal/first-light"
                className="text-pink-200 underline underline-offset-4"
              >
                First Light
              </Link>{" "}
              &mdash; the first LED-modified flight, recorded in the
              journal.
            </li>
            <li>
              <Link
                href="/contact?intent=aerial"
                className="text-pink-200 underline underline-offset-4"
              >
                /contact?intent=aerial
              </Link>{" "}
              &mdash; book the line.
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

      {/*
        Sticky-bottom CTA. Mobile-first: pill anchored to the bottom of
        the viewport so the "brief the studio" path is always one tap
        away as the visitor scrolls long-form copy. Hidden on
        ≥md viewports where the inline CTAs above remain on-screen.
      */}
      <Link
        href="/contact?intent=aerial"
        className="pointer-events-auto fixed inset-x-4 bottom-4 z-40 flex items-center justify-center rounded-full border border-pink-200/50 bg-warm-black-950/90 px-6 py-3 chrome-label text-pink-100 shadow-lg backdrop-blur md:hidden"
      >
        Brief the studio &rarr;
      </Link>

      <Footer />
    </>
  );
}
