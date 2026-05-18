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
  /** Decorative emoji rendered alongside the label. Optional — falls
   *  back to a generic shirt glyph. Sourced from data/wardrobe.json
   *  so adding an outfit doesn't require touching this file. */
  glyph?: string;
};

export const WARDROBE_OUTFITS: WardrobeOutfit[] = wardrobeData.outfits;

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
              <span className="aura-wardrobe-glyph">{o.glyph ?? "👕"}</span>
              <span className="aura-wardrobe-name">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
