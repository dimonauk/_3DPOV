/**
 * app/aerial/aerial/json-ld.ts — Combined JSON-LD payload for the
 * aerial landing page. Single graph containing:
 *
 *   - ProfessionalService (the aerial-line offering)
 *   - Person (the operator)
 *   - ImageGallery (recent stills, when any are live)
 *
 * Both entities reference each other via @id so search engines can
 * resolve the provider relationship without ambiguity.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import { ABSOLUTE_URL } from "./content";
import type { GalleryItem } from "./gallery";

export function buildServiceJsonLd(items: readonly GalleryItem[]): string {
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${ABSOLUTE_URL}#service`,
        name: "Aerial cinematography and photography — Holo-Flow Studio",
        url: ABSOLUTE_URL,
        provider: { "@id": `${ABSOLUTE_URL}#operator` },
        areaServed: { "@type": "Country", name: "United Kingdom" },
        serviceArea: {
          "@type": "GeoCircle",
          geoMidpoint: {
            "@type": "GeoCoordinates",
            latitude: 53.483,
            longitude: -2.293,
            name: "Salford, Greater Manchester",
          },
        },
        offers: [
          {
            "@type": "Offer",
            name: "Half-day aerial shoot",
            priceCurrency: "GBP",
            price: "450",
            availability: "https://schema.org/InStock",
          },
          {
            "@type": "Offer",
            name: "Full-day aerial shoot",
            priceCurrency: "GBP",
            price: "750",
            availability: "https://schema.org/InStock",
          },
          {
            "@type": "Offer",
            name: "Editioned aerial light-painting print, A2",
            priceCurrency: "GBP",
            price: "350",
            availability: "https://schema.org/PreOrder",
          },
        ],
        knowsAbout: [
          "aerial cinematography",
          "aerial photography",
          "360° equirectangular video",
          "FPV cinewhoop flight",
          "aerial light painting",
          "CAA regulation compliance",
        ],
      },
      {
        "@type": "Person",
        "@id": `${ABSOLUTE_URL}#operator`,
        name: "Dimona Dougherty",
        jobTitle: "Aerial operator + photographer",
        worksFor: {
          "@type": "Organization",
          name: "Holo-Flow Studio",
          url: "https://holoflow.co.uk",
        },
        hasCredential: [
          {
            "@type": "EducationalOccupationalCredential",
            name: "CAA Operator ID",
          },
          {
            "@type": "EducationalOccupationalCredential",
            name: "CAA Flyer ID",
          },
          {
            "@type": "EducationalOccupationalCredential",
            name: "A2 Certificate of Competency",
          },
        ],
      },
      ...(items.length > 0
        ? [
            {
              "@type": "ImageGallery",
              name: "Recent aerial work",
              url: `${ABSOLUTE_URL}#recent-work`,
              image: items
                .filter((i) => !i.isVideo)
                .slice(0, 8)
                .map((i) => ({
                  "@type": "ImageObject",
                  contentUrl: i.media.url,
                  ...(i.media.title ? { name: i.media.title } : {}),
                  ...(i.media.capturedAt
                    ? { datePublished: i.media.capturedAt }
                    : {}),
                })),
            },
          ]
        : []),
    ],
  };
  return JSON.stringify(payload);
}
