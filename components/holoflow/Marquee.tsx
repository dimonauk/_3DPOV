/**
 * components/holoflow/Marquee.tsx — top-of-fold scrolling capability tape.
 *
 * "◈ Heritage Documentation · ◈ VR Development · …" — runs through the
 * studio's full capability set. Pauses on hover. The track is doubled
 * internally so the loop is seamless.
 */

export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-warm-black-700 bg-warm-black-925 py-2.5">
      <div className="holoflow-marquee-track">
        {doubled.map((item, k) => (
          <span
            key={k}
            className="px-8 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500"
          >
            <span className="text-lavender-300">◈ </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
