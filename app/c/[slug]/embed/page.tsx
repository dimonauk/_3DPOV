import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "lib/ar/cards";
import ARLandingClient from "components/ar/ARLandingClient";
import CardEventTracker from "components/ar/CardEventTracker";

/**
 * /c/[slug]/embed — minimal iframe-friendly card renderer.
 *
 * Used by the embed widget — third-party sites drop a <iframe> on
 * their page pointing here, and we render just the essentials:
 *
 *   • Name + role (small banner)
 *   • 3D viewer (the headline visual)
 *   • Small "Open full card →" link to the canonical /c/<slug>
 *   • "Powered by Holo-Flow" footer with a link out
 *
 * No navbar, no footer, no lead-capture, no wallet buttons, no
 * webhook/analytics surfaces. Transparent body so the host page's
 * background bleeds through if they want.
 *
 * Headers: no X-Frame-Options or CSP frame-ancestors restriction,
 * so any domain can embed.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) return { title: "Holo-Flow card" };
  return {
    title: `${card.name} — ${card.role}`,
    description: card.tagline ?? `Embed of ${card.name}'s Holo-Flow card`,
  };
}

export default async function CardEmbedPage({ params }: Params) {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) notFound();

  const primary = card.brand.primary;
  const secondary = card.brand.secondary;
  const textOnBrand = card.brand.textOnBrand;

  return (
    <main className="embed-root">
      <CardEventTracker slug={slug} />

      <header className="embed-banner">
        <div className="embed-name">{card.name}</div>
        <div className="embed-role">{card.role}</div>
      </header>

      <div className="embed-viewer">
        <ARLandingClient card={card} />
      </div>

      <footer className="embed-footer">
        <a
          href={`/c/${slug}`}
          target="_top"
          rel="noopener"
          className="embed-open"
        >
          Open full card →
        </a>
        <a
          href="https://holoflow.co.uk"
          target="_top"
          rel="noopener"
          className="embed-watermark"
        >
          Powered by Holo-Flow
        </a>
      </footer>

      {/* Auto-resize broadcaster: tells embed.js the height to set
          on the parent iframe. Re-fires on resize and on layout
          shifts via ResizeObserver. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              if (window.parent === window) return;
              var slug = ${JSON.stringify(slug)};
              var lastHeight = 0;
              function broadcast(){
                try {
                  var h = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                  );
                  if (Math.abs(h - lastHeight) < 4) return;
                  lastHeight = h;
                  window.parent.postMessage(
                    { type: 'holoflow:height', slug: slug, height: h },
                    '*'
                  );
                } catch (e) {}
              }
              broadcast();
              window.addEventListener('load', broadcast);
              window.addEventListener('resize', broadcast);
              if (typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(broadcast).observe(document.body);
              }
              setInterval(broadcast, 2000);
            })();
          `
        }}
      />

      <style>{`
        html, body { background: transparent !important; margin: 0; padding: 0; }
        .embed-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, ${primary}11, ${secondary}11);
          color: inherit;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        .embed-banner {
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid ${primary}33;
          background: linear-gradient(135deg, ${primary}22, ${secondary}22);
        }
        .embed-name {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .embed-role {
          font-size: 0.8rem;
          opacity: 0.8;
        }
        .embed-viewer {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 0 1rem;
        }
        .embed-footer {
          padding: 0.6rem 1.25rem;
          font-size: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid ${primary}22;
        }
        .embed-open,
        .embed-watermark {
          color: inherit;
          text-decoration: none;
          opacity: 0.7;
        }
        .embed-open {
          font-weight: 600;
          color: ${primary};
          opacity: 1;
        }
        .embed-watermark:hover {
          opacity: 1;
        }
      `}</style>
    </main>
  );
}
