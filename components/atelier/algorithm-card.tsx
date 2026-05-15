import {
  algorithmFamilies,
  type AlgorithmCatalogueEntry,
} from "lib/assets/algorithms";
import UsedIn from "components/atelier/used-in";

function familyColor(id: AlgorithmCatalogueEntry["family"]): string {
  const f = algorithmFamilies.find((x) => x.id === id);
  return f?.colorSignal ?? "#888";
}

export default function AlgorithmCard({
  algo,
}: {
  algo: AlgorithmCatalogueEntry;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 hover:border-pink-200/40">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-warm-black-700"
            style={{ backgroundColor: familyColor(algo.family) }}
            aria-hidden
          />
          <h3 className="text-base text-chrome-100">{algo.name}</h3>
        </div>
        <span className="font-mono text-[0.65rem] text-chrome-500">
          #{algo.id.toString().padStart(2, "0")}
        </span>
      </header>
      <div className="text-[0.6rem] uppercase tracking-[0.2em] text-chrome-500">
        {algo.family}
      </div>
      <p className="mt-1 text-sm text-chrome-300">{algo.notes}</p>
      <p className="mt-1 font-mono text-xs text-chrome-500">
        {algo.sourceFile}
      </p>
      <UsedIn kind="algorithm" slug={algo.slug} />
    </article>
  );
}
