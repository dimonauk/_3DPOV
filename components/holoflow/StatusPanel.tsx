/**
 * StatusPanel — sidebar with status-dotted key/value rows.
 *
 * The "System status / Aura soul · online / MQTT · port 1883" panel
 * from the source HTML. Each row carries a tone-coloured dot (green
 * for live, pink for partial, dim for offline).
 */

import type { ReactNode } from "react";

export type StatusTone = "live" | "partial" | "off";
export type StatusRow = { label: string; value: ReactNode; tone: StatusTone };

const DOT_CLS: Record<StatusTone, string> = {
  live: "bg-teal-400 holoflow-blink",
  partial: "bg-pink-400 holoflow-blink",
  off: "bg-chrome-500",
};

export function StatusPanel({
  title,
  rows,
}: {
  title: string;
  rows: StatusRow[];
}) {
  return (
    <div className="border border-warm-black-700 bg-warm-black-925 p-3.5">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-lavender-300">
        {title}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-chrome-400">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_CLS[r.tone]}`} />
            {r.label}
          </span>
          <span className="text-teal-400">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
