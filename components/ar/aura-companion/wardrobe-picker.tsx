"use client";

/**
 * components/ar/aura-companion/wardrobe-picker.tsx — Outfit chip row
 * that lets the visitor pick a wardrobe item directly. Mirrors what
 * Aura's `change_outfit` tool does, but discoverable for visitors who
 * don't think to ask. Active outfit gets a stronger highlight.
 *
 * Extracted from AuraCompanion.tsx per ARCHITECTURE.md Rule 1.
 * Pure presentation + the data registry (WARDROBE_OUTFITS + emoji
 * map). The host owns the currentVrmUrl state.
 */

import wardrobeData from "../../../data/wardrobe.json";

export type WardrobeOutfit = {
  slug: string;
  label: string;
  url: string;
  bytes: number;
};

export const WARDROBE_OUTFITS: WardrobeOutfit[] = wardrobeData.outfits;

// Emoji hints per outfit slug. Decorative only — labels are the
// authoritative identifier in the picker UI.
export const OUTFIT_GLYPH: Record<string, string> = {
  "baby-pink-spice": "👗",
  "bunny-top": "🐰",
  "kawaii-potion": "🧪",
  "pink-blouse-purple-plaid-skirt": "👚",
  "pink-coat": "🧥",
  "purple-dance": "💃",
  "ready-player-one": "🕶",
};

export function WardrobePicker({
  currentVrmUrl,
  onSelect,
}: {
  currentVrmUrl: string;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="aura-wardrobe">
      <span className="aura-wardrobe-tag">Outfit</span>
      <div className="aura-wardrobe-chips">
        {WARDROBE_OUTFITS.map((o) => {
          const isActive = currentVrmUrl === o.url;
          return (
            <button
              key={o.slug}
              type="button"
              onClick={() => onSelect(o.url)}
              className={
                "aura-wardrobe-btn" + (isActive ? " aura-wardrobe-active" : "")
              }
              title={o.label}
              aria-pressed={isActive}
              aria-label={`Wear ${o.label}`}
            >
              <span className="aura-wardrobe-glyph">
                {OUTFIT_GLYPH[o.slug] ?? "👕"}
              </span>
              <span className="aura-wardrobe-name">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
