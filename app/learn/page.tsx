import Footer from "components/layout/footer";
import Link from "next/link";
import { ladders } from "lib/curriculum";

export const metadata = {
  title: "Learn — the studio's curriculum",
  description:
    "Seven learning ladders that take a reader from absolute beginner to where the Holo-Flow Studio practice currently sits. Photography, poi, POV LED rigs, drones, 3D printing, local AI pipelines, and WebXR.",
};

export default function LearnPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The studio&rsquo;s curriculum</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Learn.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The studio&rsquo;s position is that this work is learnable. The
          tutorials and articles here are organised into seven parallel
          ladders. Pick a route, work the rungs in order, fill in
          anything I haven&rsquo;t written yet from the further-reading
          links on each tutorial.
        </p>
        <p className="mt-4 max-w-xl text-chrome-300">
          Some rungs are still in preparation &mdash; marked clearly,
          not pretending otherwise. As they get written they get
          linked.
        </p>

        <div className="mt-16 space-y-16">
          {ladders.map((ladder) => (
            <LadderBlock key={ladder.slug} ladder={ladder} />
          ))}
        </div>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Two parallel browsing surfaces</div>
          <p className="mt-3 text-chrome-300">
            This page organises the writing by learning path. The{" "}
            <Link
              href="/tutorials"
              className="text-pink-200 underline underline-offset-4"
            >
              tutorials index
            </Link>{" "}
            shows the same pieces in reverse-chronological order if you
            just want to browse what&rsquo;s landed recently. The{" "}
            <Link
              href="/articles"
              className="text-pink-200 underline underline-offset-4"
            >
              articles index
            </Link>{" "}
            holds the longer-form pieces that sit alongside the
            ladders.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function LadderBlock({
  ladder,
}: {
  ladder: (typeof ladders)[number];
}) {
  return (
    <section>
      <div className="chrome-label text-pink-200 mb-2">
        {ladder.subtitle}
      </div>
      <h2 className="text-3xl text-chrome-100">{ladder.title}</h2>
      <p className="mt-3 max-w-prose text-chrome-300">{ladder.intro}</p>
      <ol className="mt-6 space-y-5 border-l-2 border-warm-black-800 pl-6">
        {ladder.rungs.map((rung, i) => (
          <RungRow key={`${ladder.slug}-${i}`} rung={rung} index={i} />
        ))}
      </ol>
    </section>
  );
}

function RungRow({
  rung,
  index,
}: {
  rung: (typeof ladders)[number]["rungs"][number];
  index: number;
}) {
  const pending = rung.href === null;
  return (
    <li>
      <div className="chrome-label mb-2 text-chrome-500">
        Rung {index + 1}
        {pending ? " · in preparation" : ""}
      </div>
      {pending ? (
        <div>
          <h3 className="text-xl text-chrome-300">{rung.title}</h3>
          <p className="mt-1 max-w-prose text-sm text-chrome-400">
            {rung.blurb}
          </p>
        </div>
      ) : (
        <Link
          href={rung.href!}
          prefetch={true}
          className="group block"
        >
          <h3 className="text-xl text-chrome-100 group-hover:text-pink-200">
            {rung.title}
          </h3>
          <p className="mt-1 max-w-prose text-sm text-chrome-300">
            {rung.blurb}
          </p>
        </Link>
      )}
    </li>
  );
}
