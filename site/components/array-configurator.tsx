"use client";

import { useState } from "react";
import type { ArrayPanelOption, ArrayWork } from "@/lib/works";

export function ArrayConfigurator({
  slug,
  work,
  tint,
}: {
  slug: string;
  work: ArrayWork;
  tint: string;
}) {
  const [selected, setSelected] = useState<ArrayPanelOption>(work.options[0]);

  return (
    <div>
      <fieldset>
        <legend className="protocol-label mb-3">Configuration</legend>
        <div className="grid grid-cols-2 gap-2">
          {work.options.map((opt) => {
            const active = opt.panels === selected.panels;
            return (
              <button
                key={opt.panels}
                type="button"
                onClick={() => setSelected(opt)}
                className={`border p-3 text-left text-sm transition-colors ${
                  active ? "border-ink bg-ink text-bone" : "border-ink/20 hover:border-ink/50"
                }`}
              >
                <div className="font-mono">{opt.panels} panels</div>
                <div className={`text-xs ${active ? "text-bone/70" : "text-ink/60"}`}>
                  £{opt.priceGBP}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <div className="protocol-label mb-3">Preview</div>
        <div
          className="grid border border-ink/15 bg-ink/5 p-4 gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(selected.panels, 5)}, 1fr)`,
          }}
        >
          {Array.from({ length: selected.panels }).map((_, i) => (
            <div
              key={i}
              className="aspect-square border border-ink/10"
              style={{
                backgroundImage: `linear-gradient(${(i * 31) % 360}deg, ${tint}, transparent 70%)`,
              }}
            />
          ))}
        </div>
        <div className="mt-2 text-xs text-ink/60">
          Each panel {work.panelDimensions}. Arrangement on commission — the
          studio matches panels to your wall at dispatch.
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between border-t border-ink/10 pt-6">
        <div>
          <div className="protocol-label">Configured price</div>
          <div className="display text-3xl mt-1 font-mono">£{selected.priceGBP}</div>
        </div>
        <div className="text-xs text-ink/60">Tax &amp; shipping at checkout</div>
      </div>

      <form action="/api/checkout" method="post" className="mt-6">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="panels" value={selected.panels} />
        <button
          type="submit"
          className="w-full border border-ink bg-ink text-bone py-4 tracking-protocol text-sm hover:bg-bone hover:text-ink transition-colors"
        >
          PROCEED TO CHECKOUT
        </button>
      </form>
    </div>
  );
}
