/**
 * app/theme/page.tsx — theme selector.
 *
 * The user's surface for switching between options on each axis of
 * the theming registry. Reads `lib/theme/registry.ts` so newly-added
 * axes and options appear automatically.
 *
 * Selections persist to localStorage via `lib/theme/store.ts`.
 */

"use client";

import { Background } from "components/holoflow/Background";
import { ChromeLabel } from "components/holoflow/ChromeLabel";
import { REGISTRY, type Selection } from "lib/theme/registry";
import { useTheme } from "lib/theme/store";

export default function ThemePage() {
  const selection = useTheme((s) => s.selection);
  const set = useTheme((s) => s.set);
  const reset = useTheme((s) => s.reset);

  const axes = Object.entries(REGISTRY) as Array<[keyof typeof REGISTRY, (typeof REGISTRY)[keyof typeof REGISTRY]]>;

  return (
    <>
      <Background />
      <article className="relative mx-auto max-w-4xl px-6 py-20">
        <ChromeLabel accent="lavender" withRule>
          Theme · Cumulative Registry
        </ChromeLabel>
        <h1 className="mt-4 font-display text-4xl font-light leading-tight">
          Theme settings
        </h1>
        <p className="mt-3 max-w-2xl font-mono text-[11px] leading-relaxed text-chrome-400">
          Every UI evolution becomes a new <em>option</em> on a registry{" "}
          <em>axis</em> — the previous one stays selectable. Switch any axis
          and the change is live.
        </p>

        <div className="mt-10 space-y-8">
          {axes.map(([axisId, axis]) => (
            <section
              key={axisId}
              className="rounded-sm border border-warm-black-700 bg-warm-black-925/60 p-5"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl">{axis.label}</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-500">
                  {axis.options.length} options
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-chrome-400">
                {axis.describes}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {axis.options.map((opt) => {
                  const active =
                    selection[axisId as keyof Selection] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`flex flex-col gap-1 rounded-sm border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-lavender-400 bg-lavender-400/5"
                          : "border-warm-black-700 hover:border-chrome-400"
                      }`}
                      onClick={() =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        set(axisId as any, opt.key as any)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-chrome-100">{opt.label}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-chrome-500">
                          {opt.addedAt}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] leading-relaxed text-chrome-400">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-sm border border-warm-black-700 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-chrome-300 hover:border-chrome-400"
          >
            Reset to defaults
          </button>
          <span className="font-mono text-[10px] text-chrome-500">
            Saved to localStorage · holoflow.theme
          </span>
        </div>
      </article>
    </>
  );
}
