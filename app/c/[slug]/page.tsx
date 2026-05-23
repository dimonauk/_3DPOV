// PPR + notFound() are caching with 200 status at the edge; opt this
// route out so notFound() correctly returns a 404 HTTP status.
export const experimental_ppr = false;
// No `dynamic = "force-dynamic"` — under Next 15.6 canary + Turbopack,
// it produces a 200 + zero-body hang even with sync parent + Suspense
// child. Without it, the page is still rendered per request because
// it awaits `params` + `getCard` inside the suspended subtree, and
// `experimental_ppr = false` blocks edge caching for this route.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getCard, listCardSlugs } from "lib/ar/cards";
import ARLandingClient from "components/ar/ARLandingClient";
import CardEventTracker from "components/ar/CardEventTracker";
import LeadCaptureForm from "components/ar/LeadCaptureForm";
import SaveToWalletButton from "components/ar/SaveToWalletButton";
import AddToAppleWalletButton from "components/ar/AddToAppleWalletButton";
import AddToGoogleWalletButton from "components/ar/AddToGoogleWalletButton";
import ShareCardButtons from "components/ar/ShareCardButtons";
import CalendarEmbed from "components/ar/CalendarEmbed";

interface PageProps {
  // Next 15: params is a Promise — must be awaited.
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listCardSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const card = await getCard(slug);
    if (!card) return { title: "Card not found" };
    return {
      title: `${card.name} — ${card.studio ?? card.role}`,
      description: card.tagline ?? card.role,
      openGraph: {
        title: card.name,
        description: card.tagline ?? card.role,
        images: [{ url: card.ar.targetImage }],
      },
    };
  } catch {
    return { title: "Card" };
  }
}

// Sync parent — async-parent + force-dynamic blocks the entire response
// from streaming until getCard resolves. Sync shell + Suspense child
// lets the fallback flush immediately and the brand-coloured body
// replace it when ready. Most-shared public link in the studio's
// surface; matters most that it doesn't show 0 bytes.
export default function CardPage({ params }: PageProps) {
  return (
    <Suspense fallback={<CardLandingFallback />}>
      <CardLandingBody params={params} />
    </Suspense>
  );
}

async function CardLandingBody({ params }: PageProps) {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) notFound();

  const { primary, secondary, accent, textOnBrand } = card.brand;

  return (
    <main className="card-main">
      <CardEventTracker slug={slug} />
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
            <li><a href={`mailto:${card.contact.email}`}>{card.contact.email}</a></li>
          )}
          {card.contact.phone && (
            <li><a href={`tel:${card.contact.phone}`}>{card.contact.phone}</a></li>
          )}
          {card.contact.website && (
            <li><a href={card.contact.website} target="_blank" rel="noopener noreferrer">{card.contact.website}</a></li>
          )}
          {card.contact.handles?.map(({ platform, handle, url }) => (
            <li key={`${platform}:${handle}`}>
              {url
                ? <a href={url} target="_blank" rel="noopener noreferrer">{platform} {handle}</a>
                : <span>{platform} {handle}</span>}
            </li>
          ))}
        </ul>
        <a className="add-to-contacts" href={`/api/cards/${card.slug}/vcard`}>
          Save to contacts (vCard)
        </a>
      </section>

      <style>{`
        :root {
          --c-primary: ${primary};
          --c-secondary: ${secondary};
          --c-accent: ${accent};
          --c-text-on-brand: ${textOnBrand};
        }
        body { background: #0a0a0a; color: white; margin: 0; }
        .card-main {
          min-height: 100vh;
          font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
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
          max-width: 600px;
          margin: 3rem auto;
          padding: 1.5rem;
          background: #161616;
          border-radius: 1rem;
        }
        .card-contact h2 { font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.7; margin-top: 0; }
        .card-contact ul { list-style: none; padding: 0; }
        .card-contact li { padding: 0.5rem 0; border-bottom: 1px solid #222; }
        .card-contact li:last-child { border-bottom: none; }
        .card-contact a { color: var(--c-accent); text-decoration: none; }
        .card-contact a:hover { text-decoration: underline; }
        .add-to-contacts {
          display: inline-block;
          margin-top: 1rem;
          background: var(--c-primary);
          color: var(--c-text-on-brand) !important;
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          font-weight: 700;
        }
      `}</style>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <SaveToWalletButton
            card={{
              slug,
              name: card.name,
              role: card.role,
              primary,
              secondary,
            }}
            primary={primary}
            textOnBrand={textOnBrand}
          />
          <AddToAppleWalletButton slug={slug} primary={primary} />
          <AddToGoogleWalletButton slug={slug} primary={primary} />
        </div>
        <LeadCaptureForm
          slug={slug}
          ownerName={card.name}
          primary={primary}
          textOnBrand={textOnBrand}
        />
        <ShareCardButtons card={card} slug={slug} />
        {card.calendar && (
          <CalendarEmbed slug={slug} calendar={card.calendar} brand={card.brand} />
        )}
      </main>
  );
}

function CardLandingFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "white",
        margin: 0,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
          color: "white",
          padding: "3rem 1.5rem 2.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            height: "2.5rem",
            width: "60%",
            margin: "0 auto 1rem",
            background: "#2f2f2f",
            borderRadius: "0.25rem",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: "1rem",
            width: "40%",
            margin: "0 auto",
            background: "#2f2f2f",
            borderRadius: "0.25rem",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </header>
      <div
        style={{
          maxWidth: "600px",
          margin: "3rem auto",
          padding: "1.5rem",
          background: "#161616",
          borderRadius: "1rem",
          height: "200px",
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
