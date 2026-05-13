import type { BrushAsset } from "lib/assets/brushes";

export default function BrushCard({ brush }: { brush: BrushAsset }) {
  return (
    <article className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 hover:border-pink-200/40">
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-5 w-5 rounded-full ring-1 ring-warm-black-700"
          style={{ backgroundColor: brush.dotColor }}
          aria-hidden
        />
        <div className="flex flex-col leading-tight">
          <h3 className="text-base text-chrome-100">{brush.name}</h3>
          <span className="chrome-label text-[0.6rem] text-chrome-500">
            {brush.category}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-chrome-300">{brush.notes}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[0.65rem] uppercase tracking-[0.18em]">
        {brush.spec.params.map((param) => (
          <div
            key={param.n}
            className="flex flex-col gap-1 rounded-sm border border-warm-black-800 bg-warm-black-950/40 px-2 py-1.5"
          >
            <span className="text-chrome-500">{param.n}</span>
            <span className="font-mono text-sm text-chrome-200">
              {param.p.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
