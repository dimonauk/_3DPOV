import Footer from "components/layout/footer";
import Link from "next/link";
import {
  evolutionStations,
  stationKindColours,
  type EvolutionStation,
} from "lib/evolution/stations";
import EvolutionDiagram from "components/atelier/evolution-diagram";

export const metadata = {
  title:
    "The evolution suite — fourteen stations the studio breeds with",
  description:
    "S0 to S19. Performance Gateway, Crossbreeding, Fitness Arena, Freeform Lab, Narrative Lab, Megalith Forge, Vault Explorer, Waveguide Optics, Morphogenetic Crucible, Live Installation, Genome Archive, HoloFlow Hub, Mosaic Wall, Morphological Gardener. The breeding-engine architecture the bench runs.",
};

const byOrder = [...evolutionStations].sort((a, b) => a.order - b.order);

function StationCard({ station }: { station: EvolutionStation }) {
  const colour = stationKindColours[station.kind];
  return (
    <article className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
      <header className="flex items-baseline gap-3">
        <span
          className="font-mono text-[0.7rem] text-chrome-300"
          style={{ color: colour }}
        >
          {station.id}
        </span>
        <h3 className="text-base text-chrome-100">{station.name}</h3>
      </header>
      <div className="mt-1 text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
        {station.kind}
      </div>
      <p
        className="mt-3 text-sm text-chrome-300"
        dangerouslySetInnerHTML={{ __html: station.purpose }}
      />
      <p className="mt-2 font-mono text-[0.65rem] text-chrome-600">
        {station.sourceFile}
      </p>
      {station.feedsInto.length > 0 ? (
        <p className="mt-2 text-[0.65rem] text-chrome-500">
          feeds &rarr; {station.feedsInto.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

export default function EvolutionPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Evolution suite</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Fourteen stations the bench breeds with.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Every sculpture in the studio is a genome before it is a
          mesh. The breeding engine walks the genomes through
          fourteen stations &mdash; a Performance Gateway at the top,
          a Morphological Gardener at the bottom, and a dozen others
          between them that score, blend, archive, sculpt, narrate,
          and finally cull. The architecture below names each one and
          shows how they connect.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The suite&rsquo;s full interactive form runs at port 5139
          on the bench. This page surfaces the fourteen-station
          architecture without porting the interactive UI; per-station
          interactivity is queued for a later migration pass.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; back to the atelier
          </Link>
          <Link
            href="/articles/how-the-studio-breeds-sculptures"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &mdash; how the studio breeds sculptures
          </Link>
          <Link
            href="/articles/the-eight-kingdoms"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &mdash; the eight kingdoms
          </Link>
        </div>

        {/* DIAGRAM ---------------------------------------------------- */}
        <section className="mt-12">
          <div className="chrome-label text-pink-200 mb-2">
            The flow
          </div>
          <h2 className="text-3xl text-chrome-100">
            How the stations connect.
          </h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Performance Gateway captures a signal at the top. The
            signal enters breeding at S2 and (in the manual branch)
            S5. Fitness scoring at S4 funnels survivors back upstream
            for further breeding. The narrative and forge stations
            (S6 in two flavours) annotate and scale the genome.
            Archival at S7 and S15 persists the lineage. S10 evaluates
            optical performance for waveguide pieces. S12 does
            high-dimensional barycentric blending. S14 turns the
            engine into a live public installation. S17 routes
            everything; S18 and S19 are the mosaic + gardener views
            that mass-cull a generation in one pass.
          </p>
          <div className="mt-6">
            <EvolutionDiagram />
          </div>
        </section>

        {/* STATIONS LIST --------------------------------------------- */}
        <section className="mt-16">
          <div className="chrome-label text-pink-200 mb-2">
            The fourteen stations
          </div>
          <h2 className="text-3xl text-chrome-100">
            By number, by name.
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {byOrder.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </section>

        {/* CROSS-REFS ------------------------------------------------ */}
        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Where the suite lives</div>
          <p className="mt-3 text-chrome-300">
            The interactive suite runs on the bench at port 5139 of
            The Hangar&rsquo;s Dolly_OS. The architecture above is the
            public-facing view; the actual UI &mdash; genome editors,
            mosaic walls, live-installation arenas &mdash; lives on
            the studio side. For the prose on the breeding loop, see{" "}
            <Link
              href="/articles/how-the-studio-breeds-sculptures"
              className="text-pink-200 underline underline-offset-4"
            >
              how the studio breeds sculptures
            </Link>
            . For the algorithm cabinet the engine samples from, see{" "}
            <Link
              href="/atelier/algorithms"
              className="text-pink-200 underline underline-offset-4"
            >
              the algorithm cabinet
            </Link>
            . For the kingdoms the engine sorts specimens into, see{" "}
            <Link
              href="/articles/the-eight-kingdoms"
              className="text-pink-200 underline underline-offset-4"
            >
              the eight kingdoms
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
