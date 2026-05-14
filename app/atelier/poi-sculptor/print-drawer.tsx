"use client";

/**
 * app/atelier/poi-sculptor/print-drawer.tsx
 *
 * Collapsible print-bureau panel. Listing of 8 materials with prices.
 * No quote integration in v1 — this surfaces the cost catalogue so the
 * sculpture can be costed at glance before export.
 */

import { useState } from "react";

import { PRINT_MATERIALS } from "lib/poi-sculptor/materials";

export function PrintDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left chrome-label text-chrome-200 hover:text-pink-200"
        aria-expanded={open}
      >
        <span>print bureau · 8 materials</span>
        <span className="font-mono text-xs text-chrome-400">
          {open ? "close" : "open"}
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-warm-black-800 p-5 md:grid-cols-2">
          {PRINT_MATERIALS.map((m) => (
            <article
              key={m.name}
              className="rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm text-chrome-100">{m.name}</h3>
                <span className="font-mono text-xs text-pink-200">{m.price}</span>
              </div>
              <div className="mt-1 chrome-label text-chrome-500">{m.process}</div>
              <p className="mt-2 text-xs text-chrome-300">{m.desc}</p>
              {m.rec && (
                <div className="mt-2 chrome-label text-pink-200">
                  ★ recommended for poi geometry
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
