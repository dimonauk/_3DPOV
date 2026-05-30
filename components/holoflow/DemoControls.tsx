/**
 * DemoControls — horizontal row of mode-toggle buttons under a demo
 * canvas. Active option carries a teal border + teal text; others
 * are dimmed chrome.
 */

"use client";

export type DemoControlOption<K extends string = string> = {
  key: K;
  label: string;
};

export function DemoControls<K extends string>({
  value,
  onChange,
  options,
}: {
  value: K;
  onChange: (key: K) => void;
  options: DemoControlOption<K>[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
              active
                ? "border-teal-400 text-teal-400"
                : "border-warm-black-700 text-chrome-500 hover:border-teal-400 hover:text-teal-400"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
