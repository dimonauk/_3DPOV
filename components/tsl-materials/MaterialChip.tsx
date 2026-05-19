/**
 * components/tsl-materials/MaterialChip.tsx — Server component.
 *
 * A pure-CSS swatch that approximates a TSL preset's look for
 * editorial use — article inlines, catalogue listings, the showcase
 * page header. No JS, no Three. The CSS background string lives on
 * the preset itself (`preset.chip`) so a swatch change tracks the
 * underlying material in one edit.
 *
 * Sizes:
 *   - "sm" (24px) — inline next to a name in prose.
 *   - "md" (48px) — listings + filter strips.
 *   - "lg" (96px) — the showcase header card.
 */
import type { TslMaterialPreset } from "lib/tsl-materials";

export type MaterialChipProps = {
  preset: TslMaterialPreset;
  /** Display size. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Render the preset name + category beneath the swatch. */
  withLabel?: boolean;
  /** Extra wrapper class — useful for grid placement. */
  className?: string;
};

const PX: Record<NonNullable<MaterialChipProps["size"]>, number> = {
  sm: 24,
  md: 48,
  lg: 96,
};

export function MaterialChip({
  preset,
  size = "md",
  withLabel = false,
  className = "",
}: MaterialChipProps) {
  const dim = PX[size];
  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <span
        aria-label={`${preset.name} swatch`}
        title={`${preset.name} — ${preset.category}`}
        className="inline-block rounded-full border border-warm-black-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.55)]"
        style={{
          width: dim,
          height: dim,
          background: preset.chip,
        }}
      />
      {withLabel && (
        <span className="font-mono text-[0.6rem] uppercase tracking-wider text-chrome-300">
          {preset.name}
          <span className="ml-2 text-chrome-500">{preset.category}</span>
        </span>
      )}
    </div>
  );
}

export default MaterialChip;
