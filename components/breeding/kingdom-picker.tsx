"use client";

/**
 * components/breeding/kingdom-picker.tsx
 *
 * Horizontal row of five kingdom buttons + an A/B two-slot picker. Clicking
 * a kingdom assigns it to whichever slot was last touched (the "active" slot,
 * highlighted with a pink ring). Slot tabs toggle which one receives the next
 * pick.
 */

import clsx from "clsx";

import { KINGDOMS, type KingdomId } from "lib/breeding/sdf-shaders";

type Props = {
  parentA: KingdomId;
  parentB: KingdomId;
  activeSlot: "A" | "B";
  onSelectSlot: (slot: "A" | "B") => void;
  onPickKingdom: (id: KingdomId) => void;
};

export default function KingdomPicker({
  parentA,
  parentB,
  activeSlot,
  onSelectSlot,
  onPickKingdom,
}: Props) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
      <div className="chrome-label text-pink-200">Kingdoms</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {KINGDOMS.map((k) => {
          const isA = parentA === k.id;
          const isB = parentB === k.id;
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => onPickKingdom(k.id)}
              className={clsx(
                "rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors",
                "border-warm-black-800 bg-warm-black-900/60 text-chrome-200",
                "hover:border-pink-200/60 hover:text-pink-200",
                (isA || isB) && "border-pink-200/50 text-pink-100",
              )}
              aria-pressed={isA || isB}
            >
              {k.label}
              {isA ? (
                <span className="ml-2 text-[0.65rem] text-pink-200">A</span>
              ) : null}
              {isB ? (
                <span className="ml-2 text-[0.65rem] text-pink-200">B</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3">
        <SlotTab
          label="Slot A"
          value={KINGDOMS[parentA]?.label ?? "—"}
          active={activeSlot === "A"}
          onClick={() => onSelectSlot("A")}
        />
        <SlotTab
          label="Slot B"
          value={KINGDOMS[parentB]?.label ?? "—"}
          active={activeSlot === "B"}
          onClick={() => onSelectSlot("B")}
        />
      </div>
      <p className="mt-3 text-[0.7rem] text-chrome-500">
        Click a slot to make it the target, then click a kingdom to fill
        it.
      </p>
    </div>
  );
}

function SlotTab({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-sm border px-3 py-2 text-left transition-colors",
        active
          ? "border-pink-200/70 bg-pink-200/5"
          : "border-warm-black-800 bg-warm-black-900/40 hover:border-chrome-500/40",
      )}
    >
      <div className="chrome-label text-[0.6rem]">{label}</div>
      <div className="mt-1 font-mono text-sm text-chrome-100">{value}</div>
    </button>
  );
}
