// PPR + notFound() are caching with 200 status at the edge; opt this
// route out so notFound() correctly returns a 404 HTTP status.
export const experimental_ppr = false;
// And kill edge caching entirely: PPR's static shell was cached as 200
// even when notFound() fired. Server-render every card landing fresh.
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCard, listCardSlugs } from "lib/ar/cards";
import ARLandingClient from "components/ar/ARLandingClient";

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
}

export default async function CardPage({ params }: PageProps) {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) notFound();

  const { primary, secondary, accent, textOnBrand } = card.brand;

  return (
    <main className="card-main">
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
    </main>
  );
}
