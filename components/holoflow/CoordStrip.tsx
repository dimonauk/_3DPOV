/**
 * CoordStrip — the "51.5798°N · 0.1837°E · Romford" coordinates row.
 *
 * Used directly above the hero eyebrow tag. First two items render in
 * lavender (location data), the rest in dim chrome (annotations).
 */

export function CoordStrip({ items }: { items: string[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-6 font-mono text-[0.5rem] tracking-[0.26em] text-chrome-500">
      {items.map((it, k) => (
        <span key={k} className={k < 2 ? "text-lavender-200" : ""}>
          {it}
        </span>
      ))}
    </div>
  );
}
