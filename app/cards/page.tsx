/**
 * app/cards/page.tsx — AR business cards landing.
 *
 * Server component. Lists the studio's hosted card holders and explains
 * the AR card pipeline. The CTA pushes visitors to /cards/design where
 * they build their own card in the browser; the studio-hosted option is
 * the upsell.
 */

import Link from "next/link";
import { getAllCards } from "lib/ar/cards";

export const dynamic = "force-static";

export const metadata = {
  title: "AR business cards — Holo-Flow Studio",
  description:
    "Printed business cards that bloom into a 3D scene when scanned. Design your own in the browser. Get the studio to host it permanently.",
};

export default async function CardsLandingPage() {
  const cards = (await getAllCards()).filter((c) => c.public);

  return (
    <>
      <section className="relative overflow-hidden border-b border-warm-black-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[#100618]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 via-transparent to-violet-500/15" />
        </div>
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-20 pb-24 md:px-8 md:pt-28 md:pb-32">
          <div className="chrome-label">Holo-Flow Studio &middot; AR cards</div>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Cards that bloom
            <br />
            <span className="chrome-sheen">when you scan them.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-chrome-200">
            A printed business card, 85&times;55&thinsp;mm, that quietly carries
            an AR landing page. Scan the QR with a phone camera and the card
            comes alive: a 3D model anchored over the front, contact details
            ready to save, gestures and trails specific to your work. Designed
            in the browser, printed on cotton-rag, hosted by the studio.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5 text-sm">
            <Link
              href="/cards/design"
              prefetch={true}
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Design your own &rarr;
            </Link>
            <Link
              href="/c/dimona"
              className="rounded-full border border-chrome-400/30 px-6 py-3 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
            >
              See a live card
            </Link>
            <Link
              href="/services#bespoke-ar-cards"
              className="text-chrome-300 underline underline-offset-4 hover:text-pink-200"
            >
              Studio-hosted pricing &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-20 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="chrome-label">How it works</div>
            <h2 className="mt-3 text-3xl md:text-4xl">
              One card,
              <br />
              three layers.
            </h2>
          </div>
          <ol className="prose-gallery md:col-span-3">
            <li>
              <strong>The print.</strong> A double-sided business card with
              your photograph or pattern on the front and your details + QR on
              the back. Cotton-rag matte, 85&times;55&thinsp;mm, 3&thinsp;mm
              bleed, ships from Salford. The print works as a business card on
              its own &mdash; the AR is the bonus layer.
            </li>
            <li>
              <strong>The landing.</strong> Scan the QR with any phone camera.
              You land on{" "}
              <code className="text-pink-200">holoflow.co.uk/c/&lt;you&gt;</code>{" "}
              &mdash; a one-page site in your brand colours with your contact
              details and a &ldquo;Save to phone&rdquo; vCard button.
            </li>
            <li>
              <strong>The AR.</strong> Point the camera at the printed front
              and a 3D model materialises on top of it &mdash; your sculpture,
              your logo, an Aura companion, a piece of poi-light geometry.
              Move the phone, the model tracks the card in space. iOS gets
              Quick Look; Android gets Scene Viewer; the desktop gets a 3D
              preview.
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-warm-black-800 bg-warm-black-900/40">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8 md:py-20">
          <div className="chrome-label">Two paths</div>
          <h2 className="mt-3 max-w-3xl text-3xl md:text-4xl">
            Browser-built or studio-hosted.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <article className="rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-6 md:p-8">
              <div className="chrome-label text-pink-200">A &middot; Free</div>
              <h3 className="mt-2 font-display text-2xl text-chrome-100">
                Design it yourself
              </h3>
              <p className="mt-3 text-sm text-chrome-300">
                Open the in-browser designer, fill in your details, choose
                your colours, get a live preview of your AR card. Download a
                share URL that works anywhere &mdash; no studio hosting, no
                account. The card uses the placeholder model; image-tracked
                AR isn&rsquo;t enabled on the free tier.
              </p>
              <Link
                href="/cards/design"
                className="mt-6 inline-block rounded-full border border-pink-200/40 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
              >
                Open the designer &rarr;
              </Link>
            </article>
            <article className="rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-6 md:p-8">
              <div className="chrome-label text-pink-200">
                B &middot; Studio &middot; from &pound;120
              </div>
              <h3 className="mt-2 font-display text-2xl text-chrome-100">
                Get the studio to host it
              </h3>
              <p className="mt-3 text-sm text-chrome-300">
                The studio compiles your image-tracking target, generates a
                custom GLB from your gesture / logo / sculpture, hosts the
                card permanently at{" "}
                <code className="text-pink-200">/c/&lt;you&gt;</code>, and
                prints a small batch on cotton-rag. The full pipeline. Send
                an email; we quote per brief.
              </p>
              <Link
                href="/contact?intent=ar-card"
                className="mt-6 inline-block rounded-full border border-chrome-400/30 px-5 py-2 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
              >
                Commission a card &rarr;
              </Link>
            </article>
          </div>
        </div>
      </section>

      {cards.length > 0 && (
        <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-20 md:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="chrome-label">Currently in circulation</div>
              <h2 className="mt-2 text-3xl md:text-4xl">
                Studio-hosted cards.
              </h2>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <li key={card.slug}>
                <Link
                  href={`/c/${card.slug}`}
                  className="block overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950/40 transition-colors hover:border-pink-200/40"
                >
                  <div
                    className="aspect-[85/55] p-6 text-white"
                    style={{
                      background: `linear-gradient(135deg, ${card.brand.primary}, ${card.brand.secondary})`,
                      color: card.brand.textOnBrand,
                    }}
                  >
                    <div
                      className="text-xs uppercase tracking-[0.2em] opacity-80"
                      style={{ color: card.brand.textOnBrand }}
                    >
                      {card.studio ?? "Holo-Flow Studio"}
                    </div>
                    <div className="mt-2 font-display text-2xl">
                      {card.name}
                    </div>
                    <div className="mt-1 text-sm opacity-90">{card.role}</div>
                  </div>
                  <div className="border-t border-warm-black-800 px-6 py-4 text-xs text-chrome-400">
                    <span className="text-pink-200">/c/{card.slug}</span>
                    {card.tagline ? <> &middot; {card.tagline}</> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
