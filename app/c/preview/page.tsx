"use client";

// Opt out of static prerendering: useSearchParams() / useAuth() /
// signInWithGoogle() all require runtime so static generation is
// pointless here.
export const dynamic = "force-dynamic";

/**
 * app/c/preview/page.tsx — Renders an AR card from a URL hash fragment.
 *
 * The /cards/design page encodes the card JSON into the URL hash as
 * `#data=<urlsafe-base64-utf8-json>`. This route reads the hash, decodes
 * it, and renders the same landing surface as the studio-hosted /c/<slug>
 * pages. No server lookup, no database — the URL IS the card.
 *
 * Static routes take precedence over [slug] in Next.js, so this works
 * regardless of whether a card with slug="preview" ever gets hosted.
 */

import nextDynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Card } from "lib/ar/types";

const ARLandingClient = nextDynamic(
  () => import("components/ar/ARLandingClient"),
  { ssr: false },
);

function decodeFragment(frag: string): Card | null {
  try {
    const padded = frag + "=".repeat((4 - (frag.length % 4)) % 4);
    const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Card;
  } catch {
    return null;
  }
}

export default function CardPreviewPage() {
  const [card, setCard] = useState<Card | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const match = hash.match(/^data=(.+)$/);
    if (!match) {
      setCard(null);
      return;
    }
    setCard(decodeFragment(match[1]!));
  }, []);

  // Loading — hash not parsed yet (server render + first client tick).
  if (card === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-warm-black-950 text-chrome-300">
        <div>Loading preview…</div>
      </main>
    );
  }

  // Empty / broken hash — point at the designer.
  if (!card) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warm-black-950 px-6 py-20 text-center text-chrome-200">
        <div className="chrome-label text-pink-200">
          No card data in this URL
        </div>
        <h1 className="max-w-md text-3xl">
          This preview URL doesn&rsquo;t carry a card payload.
        </h1>
        <p className="max-w-md text-sm text-chrome-400">
          Card preview URLs look like{" "}
          <code className="text-pink-200">/c/preview#data=…</code> &mdash; the
          long string after <code className="text-pink-200">#data=</code> is
          the card itself, base64-encoded. Open the designer to build one.
        </p>
        <Link
          href="/cards/design"
          className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
        >
          Open the designer &rarr;
        </Link>
      </main>
    );
  }

  // Valid card — render the same surface as the studio-hosted /c/[slug].
  const { primary, secondary, accent, textOnBrand } = card.brand;

  return (
    <main className="card-main">
      <div className="preview-banner">
        <span className="preview-banner-label">Preview</span>
        <span className="preview-banner-msg">
          This card lives in the URL, not the studio.
        </span>
        <Link href="/cards/design" className="preview-banner-cta">
          Edit
        </Link>
      </div>

      <header className="card-hero">
        <h1>{card.name}</h1>
        <p className="role">{card.role}</p>
        {card.studio && <p className="studio">{card.studio}</p>}
        {card.tagline && <p className="tagline">{card.tagline}</p>}
      </header>

      <ARLandingClient card={card} />

      <section className="card-contact">
        <h2>Get in touch</h2>
        <ul>
          {card.contact.email && (
            <li>
              <a href={`mailto:${card.contact.email}`}>{card.contact.email}</a>
            </li>
          )}
          {card.contact.phone && (
            <li>
              <a href={`tel:${card.contact.phone}`}>{card.contact.phone}</a>
            </li>
          )}
          {card.contact.website && (
            <li>
              <a
                href={card.contact.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {card.contact.website}
              </a>
            </li>
          )}
          {card.contact.handles?.map(({ platform, handle, url }) => (
            <li key={`${platform}:${handle}`}>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {platform} {handle}
                </a>
              ) : (
                <span>
                  {platform} {handle}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <footer className="preview-footer">
        <p>
          Want a permanent URL like{" "}
          <code>holoflow.co.uk/c/{card.slug || "you"}</code>?
        </p>
        <Link href="/cards" className="preview-footer-link">
          See the studio-hosted option &rarr;
        </Link>
      </footer>

      <style>{`
        :root {
          --c-primary: ${primary};
          --c-secondary: ${secondary};
          --c-accent: ${accent};
          --c-text-on-brand: ${textOnBrand};
        }
        body { background: #0a0a0a; color: white; margin: 0; }
        .card-main { min-height: 100vh; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
        .preview-banner {
          display: flex; align-items: center; gap: 1rem;
          background: rgba(255, 111, 181, 0.12);
          border-bottom: 1px solid rgba(255, 111, 181, 0.3);
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
        }
        .preview-banner-label {
          background: var(--c-primary); color: var(--c-text-on-brand);
          padding: 0.15rem 0.6rem; border-radius: 999px;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .preview-banner-msg { color: #ddd; flex: 1; }
        .preview-banner-cta {
          color: var(--c-accent); text-decoration: underline;
          text-underline-offset: 3px;
        }
        .card-hero {
          background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
          color: var(--c-text-on-brand);
          padding: 3rem 1.5rem 2.5rem;
          text-align: center;
        }
        .card-hero h1 { margin: 0 0 0.25rem; font-size: clamp(1.75rem, 6vw, 2.75rem); font-weight: 800; letter-spacing: -0.01em; }
        .role { margin: 0; opacity: 0.92; font-size: 1rem; }
        .studio { margin: 0.75rem 0 0; font-weight: 700; letter-spacing: 0.25em; font-size: 0.85rem; text-transform: uppercase; }
        .tagline { margin: 0.75rem auto 0; max-width: 38ch; line-height: 1.5; opacity: 0.92; font-size: 0.95rem; }
        .card-contact {
          max-width: 600px; margin: 3rem auto; padding: 1.5rem;
          background: #161616; border-radius: 1rem;
        }
        .card-contact h2 {
          font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase;
          opacity: 0.7; margin-top: 0;
        }
        .card-contact ul { list-style: none; padding: 0; }
        .card-contact li { padding: 0.5rem 0; border-bottom: 1px solid #222; }
        .card-contact li:last-child { border-bottom: none; }
        .card-contact a { color: var(--c-accent); text-decoration: none; }
        .card-contact a:hover { text-decoration: underline; }
        .preview-footer {
          max-width: 600px; margin: 2rem auto 4rem;
          padding: 1.5rem; text-align: center;
          font-size: 0.85rem; color: #888;
        }
        .preview-footer code { color: var(--c-accent); }
        .preview-footer-link {
          display: inline-block; margin-top: 0.5rem;
          color: var(--c-primary); text-decoration: underline;
          text-underline-offset: 4px;
        }
      `}</style>
    </main>
  );
}
