import type { SculptureGenome } from "lib/assets/genomes";

export default function GenomeCard({ genome }: { genome: SculptureGenome }) {
  const geneEntries = Object.entries(genome.geneVector).slice(0, 8);
  return (
    <article className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 hover:border-pink-200/40">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-base text-chrome-100">{genome.slug}</h3>
        <span className="chrome-label text-[0.6rem] text-chrome-500">
          gen {genome.generationNumber}
        </span>
      </header>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500">
        <span>{genome.kingdom}</span>
        <span>&middot;</span>
        <span className="font-mono">{genome.genomeId}</span>
        {typeof genome.fitnessScore === "number" ? (
          <>
            <span>&middot;</span>
            <span>fitness {genome.fitnessScore}</span>
          </>
        ) : null}
      </div>
      <p className="text-sm text-chrome-300">{genome.notes}</p>
      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[0.7rem] text-chrome-400">
        {geneEntries.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-2 truncate"
          >
            <dt className="truncate text-chrome-500">{k}</dt>
            <dd className="truncate text-chrome-300">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

