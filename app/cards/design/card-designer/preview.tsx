"use client";

/**
 * app/cards/design/card-designer/preview.tsx — Live preview tile
 * shown next to the form in the card designer. Hero gradient,
 * 3D-slot placeholder, contact strip.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1. Pure
 * presentation — receives the full Card and rerenders.
 */

import type { Card } from "lib/ar/types";

export function CardPreview({ card }: { card: Card }) {
  const { primary, secondary, accent, textOnBrand } = card.brand;
  return (
    <div
      className="overflow-hidden rounded-lg border border-warm-black-800 shadow-2xl"
      style={{ background: "#0a0a0a" }}
    >
      {/* Hero */}
      <div
        className="px-6 py-10 text-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          color: textOnBrand,
        }}
      >
        <div className="font-display text-2xl font-bold leading-tight">
          {card.name || "Your Name"}
        </div>
        <div
          className="mt-1 text-sm"
          style={{ color: textOnBrand, opacity: 0.92 }}
        >
          {card.role || "What you do"}
        </div>
        {card.studio && (
          <div
            className="mt-3 text-xs uppercase"
            style={{
              color: textOnBrand,
              letterSpacing: "0.25em",
              opacity: 0.9,
            }}
          >
            {card.studio}
          </div>
        )}
        {card.tagline && (
          <p
            className="mx-auto mt-3 max-w-xs text-xs leading-relaxed"
            style={{ color: textOnBrand, opacity: 0.92 }}
          >
            {card.tagline}
          </p>
        )}
      </div>

      {/* AR placeholder pane */}
      <div
        className="flex items-center justify-center"
        style={{
          aspectRatio: "16 / 11",
          background: `linear-gradient(135deg, ${primary}22, ${secondary}22)`,
          color: textOnBrand,
        }}
      >
        <div className="text-center">
          <div className="text-3xl">◆</div>
          <div
            className="mt-2 text-[0.65rem] uppercase"
            style={{ letterSpacing: "0.15em", opacity: 0.75 }}
          >
            3D preview slot
          </div>
        </div>
      </div>

      {/* Contact strip */}
      <div className="border-t border-warm-black-800 px-6 py-5">
        <div className="text-[0.65rem] uppercase tracking-[0.12em] text-chrome-500">
          Contact
        </div>
        <ul className="mt-2 space-y-1.5 text-xs">
          {card.contact.email && (
            <li>
              <span style={{ color: accent }}>{card.contact.email}</span>
            </li>
          )}
          {card.contact.phone && (
            <li>
              <span style={{ color: accent }}>{card.contact.phone}</span>
            </li>
          )}
          {card.contact.website && (
            <li>
              <span style={{ color: accent }}>{card.contact.website}</span>
            </li>
          )}
          {(card.contact.handles ?? [])
            .filter((h) => h.handle)
            .map((h, i) => (
              <li key={i}>
                <span style={{ color: accent }}>
                  {h.platform} {h.handle}
                </span>
              </li>
            ))}
          {!card.contact.email &&
            !card.contact.phone &&
            !card.contact.website &&
            !(card.contact.handles ?? []).some((h) => h.handle) && (
              <li className="text-chrome-500">No contact details yet.</li>
            )}
        </ul>
      </div>
    </div>
  );
}
