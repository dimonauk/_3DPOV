/**
 * EquationCard + MoveCatalogue — clickable parametric-equation tiles.
 *
 * From the Poi Lab's .move-cat / .mc pattern. Each tile shows a move
 * name, its parametric equation in mono, and a short description.
 * Selecting a tile fires onChange(key) so the parent canvas can
 * re-render the chosen pattern.
 */

"use client";

export type EquationMove = {
  key: string;
  name: string;
  /** Parametric equation in mono — keep tight, one or two lines. */
  equation: string;
  /** One-line description of the resulting shape. */
  desc: string;
};

export function MoveCatalogue({
  moves,
  selected,
  onSelect,
}: {
  moves: EquationMove[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {moves.map((m) => {
        const active = m.key === selected;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            className={`block border bg-warm-black-925 p-3 text-left transition-colors ${
              active
                ? "border-teal-400 bg-warm-black-875"
                : "border-warm-black-700 hover:border-teal-400/40 hover:bg-warm-black-875"
            }`}
          >
            <div className="text-[11px] font-semibold text-chrome-100">{m.name}</div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[9px] leading-snug text-teal-400">
              {m.equation}
            </pre>
            <div className="mt-1 font-mono text-[9px] leading-snug text-chrome-500">
              {m.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function EquationCard({ move }: { move: EquationMove }) {
  return (
    <div className="border border-warm-black-700 bg-warm-black-950 p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-chrome-500">
        Parametric equation
      </div>
      <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-teal-400">
        {move.equation}
      </pre>
    </div>
  );
}
