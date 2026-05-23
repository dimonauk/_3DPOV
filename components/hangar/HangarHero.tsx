/**
 * components/hangar/HangarHero.tsx
 *
 * Hangar-showcase hero. Mirrors the home-hero section in
 * public/hangar-v2.html: oversized "HANGAR" backplate, headline +
 * subhead in Syne / Space Mono, and a four-stat strip.
 *
 * Server component — purely presentational, no interactivity.
 */

const STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "94", label: "Apps in DollyOS" },
  { value: "144", label: "Jewel families" },
  { value: "28", label: "Genome genes" },
  { value: "14", label: "Named characters" },
];

export function HangarHero() {
  return (
    <section className="relative overflow-hidden bg-[var(--paper,#f5f2ec)] px-[60px] py-[88px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none font-[Syne,_sans-serif] text-[clamp(160px,28vw,360px)] font-extrabold leading-[0.85] tracking-[-0.05em] text-[rgba(10,10,15,0.04)]"
      >
        HANGAR
      </div>

      <div className="relative">
        <div className="mb-[18px] font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--dim,#6b6660)]">
          The Hangar — Dolly Dimona's Creative Practice
        </div>

        <h1 className="font-[Syne,_sans-serif] text-[clamp(40px,7vw,96px)] font-extrabold leading-[0.95] tracking-[-0.02em] text-[var(--ink,#0a0a0f)]">
          DESIGNER.
          <br />
          SCULPTOR.
          <br />
          <em className="font-[Fraunces,_serif] italic font-light text-[var(--acc,#ff3d1f)]">
            SYSTEMS
          </em>{" "}
          BUILDER.
        </h1>

        <p className="mt-[22px] max-w-[680px] font-mono text-[12px] leading-[2.1] text-[var(--dim,#6b6660)]">
          I make software that externalises design intent. Poi move patterns
          become jewellery. Light trails become spatial video. Genomes breed
          sculptures. An AI lives in my OS. This is where all of it lives.
        </p>

        <dl className="mt-[40px] grid grid-cols-2 gap-[24px] sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="font-[Syne,_sans-serif] text-[clamp(28px,4vw,48px)] font-extrabold leading-none text-[var(--ink,#0a0a0f)]">
                {s.value}
              </dt>
              <dd className="mt-[8px] font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--dim,#6b6660)]">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
