"use client";

/**
 * app/academy/academy/cohort-card.tsx — One of the six pastel
 * student cards. Shows name + swatch + specialty + role; expands
 * to the five OCEAN bars when selected.
 *
 * Extracted from academy-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { CohortMember } from "./cohort-data";
import { OceanBar } from "./ocean-bar";

export function CohortCard({
  member,
  isToday,
  onSelect,
  selected,
}: {
  member: CohortMember;
  isToday: boolean;
  onSelect: (name: string) => void;
  selected: boolean;
}) {
  const [O, C, E, A, N] = member.ocean;
  return (
    <button
      type="button"
      onClick={() => onSelect(member.name)}
      className={`group rounded-sm border bg-warm-black-900/40 p-5 text-left transition-colors ${
        selected
          ? "border-pink-200/80"
          : "border-warm-black-800 hover:border-pink-200/40"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 rounded-full border border-warm-black-700"
            style={{ background: member.pastelSwatch }}
            aria-hidden="true"
          />
          <div>
            <div className="text-lg text-chrome-100">{member.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-400">
              {member.pastel}
            </div>
          </div>
        </div>
        {isToday && (
          <span className="rounded-full border border-pink-200/40 bg-pink-200/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-pink-200">
            on rotation
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-chrome-200">{member.specialty}</p>
      <p className="mt-1 text-[11px] text-chrome-400">{member.role}</p>

      {selected && (
        <div className="mt-4 space-y-1 border-t border-warm-black-800 pt-3">
          <OceanBar label="openness" value={O} />
          <OceanBar label="conscientious" value={C} />
          <OceanBar label="extraversion" value={E} />
          <OceanBar label="agreeable" value={A} />
          <OceanBar label="neuroticism" value={N} />
        </div>
      )}
    </button>
  );
}
