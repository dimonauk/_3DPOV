import Footer from "components/layout/footer";
import Link from "next/link";
import { stack, type StackItem } from "lib/stack";

export const metadata = {
  title: "The Stack — the studio's working bench",
  description:
    "Every tool on the bench, named honestly. Aerial, 360, stills and print, POV LED rigs, display surfaces, fabrication, local AI, video, web, voice, hands, network, shell. Sovereign where possible; vendor-named where the SKU is load-bearing.",
};

export default function StackPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The studio&rsquo;s working bench</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The stack.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Everything the studio uses to take a poi gesture through to a
          printed object, an aerial photograph, a Looking Glass quilt,
          or a WebXR scene. Named honestly; vendor links where the
          version is load-bearing; status flags where the line is in
          rotation.
        </p>
        <p className="mt-4 max-w-xl text-chrome-300">
          The architectural commitment is sovereignty: every item below
          keeps working if a vendor pivots or an internet connection
          drops. Cross-references into{" "}
          <Link
            href="/articles"
            className="text-pink-200 underline underline-offset-4"
          >
            the articles
          </Link>{" "}
          and{" "}
          <Link
            href="/tutorials"
            className="text-pink-200 underline underline-offset-4"
          >
            the tutorials
          </Link>{" "}
          land where the bench is the subject of its own write-up.
        </p>

        <nav className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-3">
          {stack.map((section) => (
            <a
              key={section.slug}
              href={`#${section.slug}`}
              className="block rounded-sm border border-warm-black-800 bg-warm-black-900/30 px-3 py-2 text-xs text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="mt-16 space-y-20">
          {stack.map((section) => (
            <StackBlock key={section.slug} section={section} />
          ))}
        </div>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Companion writing</div>
          <p className="mt-3 text-chrome-300">
            For the long-form telling of how the bench accumulated,
            see{" "}
            <Link
              href="/articles/the-bench"
              className="text-pink-200 underline underline-offset-4"
            >
              The Bench
            </Link>
            . For the architectural argument that the rigs are
            bench-built rather than catalogued,{" "}
            <Link
              href="/articles/why-i-build-my-own-rigs"
              className="text-pink-200 underline underline-offset-4"
            >
              Why I Build My Own Rigs
            </Link>
            . For the aerial half of the same line,{" "}
            <Link
              href="/articles/the-fleet-five-airframes"
              className="text-pink-200 underline underline-offset-4"
            >
              The Fleet &mdash; Five Airframes
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function StackBlock({
  section,
}: {
  section: (typeof stack)[number];
}) {
  return (
    <section id={section.slug} className="scroll-mt-24">
      <div className="chrome-label text-pink-200 mb-2">
        {section.subtitle}
      </div>
      <h2 className="text-3xl text-chrome-100">{section.title}</h2>
      <p className="mt-3 max-w-prose text-chrome-300">{section.intro}</p>
      <ul className="mt-6 divide-y divide-warm-black-800 border-y border-warm-black-800">
        {section.items.map((item) => (
          <StackRow key={item.name} item={item} />
        ))}
      </ul>
    </section>
  );
}

function StackRow({ item }: { item: StackItem }) {
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg text-chrome-100 underline underline-offset-4 hover:text-pink-200"
        >
          {item.name}
          <span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>
        {item.status ? (
          <span className="chrome-label text-[0.6rem] text-chrome-500">
            {item.status}
          </span>
        ) : null}
      </div>
      <p className="mt-1 max-w-prose text-sm text-chrome-300">
        {item.note}
      </p>
    </li>
  );
}
