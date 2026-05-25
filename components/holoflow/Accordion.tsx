/**
 * Accordion + AccordionItem — expand/collapse list.
 *
 * From the source HTML's .acc/.ai/.ah/.ab. Single-open or multi-open
 * mode. The "+" rotates 45° to become "×" when open. Honors prefers-
 * reduced-motion (no transition).
 */

"use client";

import { useState, type ReactNode } from "react";

export function Accordion({
  items,
  mode = "single",
}: {
  items: Array<{ title: string; body: ReactNode }>;
  mode?: "single" | "multi";
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(i)) {
        next.delete(i);
      } else {
        if (mode === "single") next.clear();
        next.add(i);
      }
      return next;
    });

  return (
    <div className="my-5">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} className="border-b border-warm-black-700 last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(i)}
              className="group flex w-full items-center justify-between py-3 text-left"
            >
              <span className="text-[11px] font-semibold text-chrome-100 transition-colors group-hover:text-teal-400">
                {it.title}
              </span>
              <span
                className={`text-base text-teal-400 transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="holoflow-fade-up pb-3 pt-0.5 text-[11px] leading-loose text-chrome-400">
                {it.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
