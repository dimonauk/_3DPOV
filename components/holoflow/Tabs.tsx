/**
 * TabBar / TabPanel / useTabs — in-page tab switching.
 *
 * Each vertical deep-dive in the source HTML has its own tab bar
 * (Overview · Demo · Ladder · Pipeline). Compose:
 *
 *   const t = useTabs(['Overview', 'Demo']);
 *   <TabBar tabs={t.tabs} active={t.active} onChange={t.setActive} />
 *   <TabPanel active={t.active === 0}>...</TabPanel>
 *   <TabPanel active={t.active === 1}>...</TabPanel>
 */

"use client";

import { useState, type ReactNode } from "react";

export function useTabs(labels: string[], initial = 0) {
  const [active, setActive] = useState(initial);
  return { tabs: labels, active, setActive };
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-warm-black-700">
      {tabs.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`-mb-px border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
            i === active
              ? "border-gold-400 text-chrome-100"
              : "border-transparent text-chrome-500 hover:text-chrome-300"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;
  return <div className="holoflow-fade-up pt-4">{children}</div>;
}
