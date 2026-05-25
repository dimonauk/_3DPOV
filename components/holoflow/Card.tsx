/**
 * Card / MetricCard / Chip / StubBox / SpecTable / LiveDot / DevDot
 *
 * Foundational surface vocabulary from the holoflow-landing-v2 HTML.
 * Kept together because they share the same .card border + radius
 * tokens and are interchangeable inside grids.
 */

import type { ReactNode, HTMLAttributes } from "react";

export function Card({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-md border border-warm-black-700 bg-warm-black-925/60 p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <Card>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
        {label}
      </div>
      <div className="mt-2 font-display text-xl text-chrome-100">{value}</div>
      {sub && <div className="mt-1 font-mono text-[10px] text-chrome-400">{sub}</div>}
    </Card>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-sm border border-warm-black-700 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.04em] text-chrome-300">
      {children}
    </span>
  );
}

/**
 * StubBox — dashed-border reveal panel. Static; server-renderable.
 * For the interactive easter-egg variant, see `<StubBoxEgg>` in
 * `./StubBoxEgg.tsx`.
 */
export function StubBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-warm-black-700 bg-warm-black-925/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-lavender-300">
        {title}
      </div>
      <div className="mt-2 text-sm text-chrome-300">{children}</div>
    </div>
  );
}

export type SpecRow = { k: string; v: ReactNode };
export function SpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-warm-black-700 last:border-b-0">
            <td className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.16em] text-chrome-500">
              {r.k}
            </td>
            <td className="py-2 font-mono text-[11px] text-chrome-100">{r.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LiveDot() {
  return (
    <span className="holoflow-blink inline-block h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_4px_var(--color-teal-400)]" />
  );
}
export function DevDot() {
  return (
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_var(--color-gold-400)]" />
  );
}
