"use client";

/**
 * components/tsl-post/PostStackControls.tsx
 *
 * Overlay panel for the postprocess-lab showcase. Each effect from
 * `ALL_POST_EFFECTS` becomes a chip the operator can toggle on or off.
 * Chips carry two badges:
 *
 *   - XR-safety: green "XR OK" / amber "CAVEAT" / red "2D ONLY"
 *   - Cost band: pink-on-warm-black mono pill — "cheap" / "moderate"
 *     / "expensive"
 *
 * The component is a controlled UI: the parent owns the stack array
 * (effect ids in composition order) and passes it down. We emit
 * `onChange(nextIds)` whenever the operator toggles a chip. The
 * showcase keeps the array in `useState` and re-runs `attachStack` on
 * each change inside an effect.
 *
 * Styling matches the rest of the studio chrome — warm-black plate,
 * pink-200 accent, mono micro-text. No new CSS; classes are Tailwind
 * tokens already on the site.
 */

import { useCallback, useMemo } from "react";

import {
  ALL_POST_EFFECTS,
  type TslPostCost,
  type TslPostEffect,
} from "lib/tsl-post";

export type PostStackControlsProps = {
  /** Active effect ids in composition order. */
  active: ReadonlyArray<string>;
  /** Emitted when the operator toggles a chip. */
  onChange: (next: ReadonlyArray<string>) => void;
  /** Whether the scene is currently inside an XR session. */
  xrActive?: boolean;
  /** Optional title above the chip row. */
  title?: string;
};

export function PostStackControls({
  active,
  onChange,
  xrActive = false,
  title = "Post-process stack",
}: PostStackControlsProps) {
  const activeSet = useMemo(() => new Set(active), [active]);

  const toggle = useCallback(
    (id: string) => {
      if (activeSet.has(id)) {
        onChange(active.filter((x) => x !== id));
      } else {
        // Preserve the global ALL_POST_EFFECTS order rather than
        // dumping the new id at the end — composition order matters.
        const desired = ALL_POST_EFFECTS.map((e) => e.config.id);
        const nextSet = new Set([...active, id]);
        onChange(desired.filter((x) => nextSet.has(x)));
      }
    },
    [active, activeSet, onChange],
  );

  return (
    <div
      className="rounded-md border border-warm-black-700 bg-warm-black-900/85 p-3 backdrop-blur"
      role="group"
      aria-label={title}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-wider text-chrome-300">
          {title}
        </span>
        <span className="font-mono text-[0.55rem] uppercase tracking-wider text-chrome-400">
          {active.length} / {ALL_POST_EFFECTS.length} on
          {xrActive ? " — XR" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_POST_EFFECTS.map((e) => (
          <EffectChip
            key={e.config.id}
            effect={e}
            on={activeSet.has(e.config.id)}
            xrActive={xrActive}
            onToggle={() => toggle(e.config.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EffectChip({
  effect,
  on,
  xrActive,
  onToggle,
}: {
  effect: TslPostEffect;
  on: boolean;
  xrActive: boolean;
  onToggle: () => void;
}) {
  const { id, name, description, xrSafe, cost } = effect.config;
  // In an XR session, non-safe effects are inert — show as disabled
  // rather than letting the operator wonder why nothing happens.
  const inertInXR = xrActive && !xrSafe;
  const base =
    "group inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-colors";
  const idle =
    "border-chrome-400/30 bg-warm-black-800/70 text-chrome-200 hover:border-pink-200 hover:text-pink-100";
  const activeClass = "border-pink-200/70 bg-pink-200/15 text-pink-100";
  const dim =
    "pointer-events-none border-warm-black-700 bg-warm-black-900/70 text-chrome-500";
  const cls = inertInXR ? `${base} ${dim}` : `${base} ${on ? activeClass : idle}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={`${name} — ${description}`}
      title={`${name}: ${description}`}
      className={cls}
    >
      <span>{name}</span>
      <SafetyBadge xrSafe={xrSafe} id={id} />
      <CostBadge cost={cost} />
    </button>
  );
}

function SafetyBadge({ xrSafe, id }: { xrSafe: boolean; id: string }) {
  // cel-post is the one caveated effect we ship (outlines drift in
  // stereo) — narrow with the id rather than a third config flag.
  const caveat = xrSafe && id === "cel-post";
  if (!xrSafe) {
    return (
      <span className="rounded-full border border-pink-600/60 bg-pink-600/10 px-1.5 py-px text-[0.5rem] text-pink-200">
        2D ONLY
      </span>
    );
  }
  if (caveat) {
    return (
      <span className="rounded-full border border-amber-400/60 bg-amber-400/10 px-1.5 py-px text-[0.5rem] text-amber-200">
        CAVEAT
      </span>
    );
  }
  return (
    <span className="rounded-full border border-mint-300/50 bg-mint-300/10 px-1.5 py-px text-[0.5rem] text-mint-200">
      XR OK
    </span>
  );
}

function CostBadge({ cost }: { cost: TslPostCost }) {
  const tone =
    cost === "cheap"
      ? "border-chrome-300/40 bg-chrome-300/10 text-chrome-200"
      : cost === "moderate"
        ? "border-lavender-200/40 bg-lavender-200/10 text-lavender-100"
        : "border-pink-500/60 bg-pink-500/10 text-pink-200";
  return (
    <span
      className={`rounded-full border px-1.5 py-px text-[0.5rem] uppercase tracking-wide ${tone}`}
    >
      {cost}
    </span>
  );
}

export default PostStackControls;
