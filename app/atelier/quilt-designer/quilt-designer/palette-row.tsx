"use client";

/**
 * app/atelier/quilt-designer/quilt-designer/palette-row.tsx — One row
 * of swatch buttons (primary / secondary / background brush
 * selectors).
 *
 * Extracted from quilt-designer-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { PALETTE } from "./palette";

export function PaletteRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="chrome-label text-chrome-400">{label}</span>
      <div className="grid grid-cols-5 gap-1.5">
        {PALETTE.map((sw) => {
          const selected = sw.hex === value;
          return (
            <button
              key={sw.hex}
              type="button"
              onClick={() => onChange(sw.hex)}
              className={`h-8 rounded-sm border transition-transform hover:scale-105 ${
                selected
                  ? "border-pink-200 ring-1 ring-pink-200"
                  : "border-warm-black-700"
              }`}
              style={{ backgroundColor: sw.hex }}
              title={sw.name}
              aria-label={`${label}: ${sw.name}`}
              aria-pressed={selected ? "true" : "false"}
            />
          );
        })}
      </div>
    </div>
  );
}
