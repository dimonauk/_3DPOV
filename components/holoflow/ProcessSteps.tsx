/**
 * ProcessSteps — horizontal numbered pipeline.
 *
 * "01 → 02 → 03" reading from left to right with a hairline rail
 * connecting them. Source HTML's .proc/.ps pattern, used for the
 * Neo-London AntiGravity 6-step pipeline.
 */

import type { ReactNode } from "react";

export type ProcessStep = {
  title: string;
  body: ReactNode;
};

export function ProcessSteps({
  steps,
  accent = "teal",
}: {
  steps: ProcessStep[];
  accent?: "teal" | "gold" | "lavender" | "coral" | "pink";
}) {
  const dotBg = {
    teal: "bg-teal-400",
    gold: "bg-gold-400",
    lavender: "bg-lavender-400",
    coral: "bg-coral-400",
    pink: "bg-pink-400",
  }[accent];
  return (
    <ol className="relative my-6 flex list-none gap-0 overflow-x-auto pb-2">
      <span className="pointer-events-none absolute left-0 right-0 top-3.5 h-px bg-gradient-to-r from-transparent via-warm-black-700 to-transparent" />
      {steps.map((s, i) => (
        <li key={i} className="relative w-[150px] shrink-0 px-3 pb-4">
          <span
            className={`relative z-10 inline-flex h-7 w-7 items-center justify-center text-[10px] font-bold text-warm-black-950 ${dotBg}`}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-chrome-100">
            {s.title}
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-chrome-400">{s.body}</div>
        </li>
      ))}
    </ol>
  );
}
