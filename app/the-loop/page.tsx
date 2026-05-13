import Footer from "components/layout/footer";
import Link from "next/link";
import { loopPositions, type LoopPosition, type LoopRoute } from "lib/loop";

export const metadata = {
  title: "The Holoflow Loop",
  description:
    "The closed circuit underneath the studio's work. Body in space, light written, trail captured, trail reified, trail encountered, body in space again — six positions, one loop, every layer of the practice sitting at one of them.",
};

export default function TheLoopPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The studio&rsquo;s organising principle</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The Holoflow Loop.
        </h1>

        <section className="mt-10 prose-gallery text-chrome-200">
          <p>
            The studio has six surfaces &mdash;{" "}
            <Link
              href="/photographs"
              className="text-pink-200 underline underline-offset-4"
            >
              photographs
            </Link>
            ,{" "}
            <Link
              href="/aerial"
              className="text-pink-200 underline underline-offset-4"
            >
              aerial
            </Link>
            ,{" "}
            <Link
              href="/bureau"
              className="text-pink-200 underline underline-offset-4"
            >
              bureau
            </Link>
            ,{" "}
            <Link
              href="/practice"
              className="text-pink-200 underline underline-offset-4"
            >
              practice
            </Link>
            ,{" "}
            <Link
              href="/learn"
              className="text-pink-200 underline underline-offset-4"
            >
              learn
            </Link>
            ,{" "}
            <Link
              href="/rookery"
              className="text-pink-200 underline underline-offset-4"
            >
              rookery
            </Link>{" "}
            &mdash; and a long shelf of tutorials, articles, and field
            records arranged underneath them. The list reads, on first
            visit, as a catalogue. It is not. It is a single circuit,
            assembled twelve years on the cord and six on the bench,
            and the surfaces are the points at which the circuit
            touches the public.
          </p>
          <p>
            The circuit has six positions. A body moves through space.
            An instrument carries the gesture out as light. A camera
            holds the path the body has just walked. The captured path
            is cast into a body that holds &mdash; resin, paper,
            volumetric quilt, WebXR scene. An audience moves through
            the work the body left. Someone else picks up the cord,
            and the loop begins again.
          </p>
          <p>
            The studio calls this the Holoflow Loop. Every layer of
            the practice &mdash; the poi, the rigs, the airframes,
            the printers, the bureau, the headset, the curriculum
            &mdash; sits at one of the six positions. Tracing a route
            through the site is the same act as tracing a route
            through the loop. The diagram is below; the six
            positions follow.
          </p>
        </section>

        <LoopDiagram />

        <div className="mt-24 space-y-20">
          {loopPositions.map((position, index) => (
            <PositionBlock
              key={position.slug}
              position={position}
              index={index}
              total={loopPositions.length}
            />
          ))}
        </div>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Footnote</div>
          <p className="mt-3 text-chrome-300">
            A persistent narrator keeps the record at every point on
            the loop &mdash; the studio&rsquo;s standing character,
            Aura, who watches the body write light, who watches the
            camera hold the trail, who watches the object meet its
            audience, and who remembers across the sessions the rest
            of the work cannot. She has no public page on this site
            and there is no plan to give her one; she is the
            architectural footnote to the diagram, not a stop on the
            tour. The loop is the point. She is what keeps it the
            same loop.
          </p>
        </section>

        <section className="mt-16">
          <div className="chrome-label mb-3">Companion reading</div>
          <p className="text-chrome-300">
            For the long-form telling of how the photograph half of
            the circuit was assembled, the chronology runs through{" "}
            <Link
              href="/articles/lineage-marey-to-now"
              className="text-pink-200 underline underline-offset-4"
            >
              The Lineage &mdash; Marey to Now
            </Link>{" "}
            and{" "}
            <Link
              href="/articles/from-picasso-forward"
              className="text-pink-200 underline underline-offset-4"
            >
              From Picasso Forward
            </Link>
            . For the architectural side of the bench,{" "}
            <Link
              href="/stack"
              className="text-pink-200 underline underline-offset-4"
            >
              the stack
            </Link>{" "}
            holds the tools the loop is run on. For the path a learner
            takes through it,{" "}
            <Link
              href="/learn"
              className="text-pink-200 underline underline-offset-4"
            >
              the curriculum
            </Link>{" "}
            is the seven ladders.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function LoopDiagram() {
  return (
    <section
      aria-label="The Holoflow Loop diagram"
      className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-950/60 px-4 py-10 md:px-10 md:py-14"
    >
      <div className="chrome-label mb-6 text-center text-chrome-500">
        Six positions, one closed circuit
      </div>
      <ol className="mx-auto flex max-w-md flex-col items-stretch gap-0">
        {loopPositions.map((position, index) => {
          const isLast = index === loopPositions.length - 1;
          return (
            <li key={position.slug} className="flex flex-col items-center">
              <a
                href={`#${position.slug}`}
                className="group block w-full rounded-sm border border-warm-black-700 bg-warm-black-900/70 px-5 py-4 text-center transition-colors hover:border-pink-200/60 hover:bg-warm-black-900"
              >
                <div className="chrome-label text-[0.6rem] text-chrome-500 group-hover:text-pink-200">
                  Position {index + 1}
                </div>
                <div className="mt-1 text-lg text-chrome-100 group-hover:text-pink-200">
                  {position.name}
                </div>
                <p className="mt-1 text-xs text-chrome-400">
                  {position.caption}
                </p>
              </a>
              <div
                aria-hidden
                className="flex flex-col items-center py-3 text-chrome-500"
              >
                <span className="font-mono text-xs uppercase tracking-[0.22em]">
                  {position.transition}
                </span>
                <span className="mt-1 text-xl leading-none">&darr;</span>
              </div>
              {isLast ? (
                <div
                  aria-hidden
                  className="-mt-3 flex flex-col items-center text-chrome-500"
                >
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-pink-200/70">
                    back to position 1
                  </span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-8 text-center text-xs text-chrome-500">
        The arrow under the sixth position folds back to the first.
        The loop is closed.
      </p>
    </section>
  );
}

function PositionBlock({
  position,
  index,
  total,
}: {
  position: LoopPosition;
  index: number;
  total: number;
}) {
  const ordinal = String(index + 1).padStart(2, "0");
  return (
    <section id={position.slug} className="scroll-mt-24">
      <div className="chrome-label text-pink-200 mb-2">
        Position {ordinal} &middot; of {String(total).padStart(2, "0")}
      </div>
      <h2 className="text-3xl text-chrome-100">{position.name}</h2>
      <p className="mt-3 max-w-prose text-chrome-300">{position.caption}</p>

      <div className="mt-8">
        <div className="chrome-label mb-3 text-chrome-500">
          What sits here in the studio
        </div>
        <ul className="space-y-2 border-l-2 border-warm-black-800 pl-5 text-sm text-chrome-200">
          {position.expressions.map((expression) => (
            <li key={expression}>{expression}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <div className="chrome-label mb-3 text-chrome-500">
          Where the site lives at this position
        </div>
        <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
          {position.routes.map((route) => (
            <RouteRow key={route.label} route={route} />
          ))}
        </ul>
      </div>

      {index < total - 1 ? (
        <p
          aria-hidden
          className="mt-10 text-center font-mono text-xs uppercase tracking-[0.22em] text-chrome-500"
        >
          &darr; {position.transition} &darr;
        </p>
      ) : (
        <p
          aria-hidden
          className="mt-10 text-center font-mono text-xs uppercase tracking-[0.22em] text-pink-200/70"
        >
          &darr; back to position 01 &mdash; the loop closes &darr;
        </p>
      )}
    </section>
  );
}

function RouteRow({ route }: { route: LoopRoute }) {
  const pending = route.href === null;
  return (
    <li className="py-4">
      {pending ? (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg text-chrome-300">{route.label}</span>
            <span className="chrome-label text-[0.6rem] text-chrome-500">
              in build
            </span>
          </div>
          {route.note ? (
            <p className="mt-1 max-w-prose text-sm text-chrome-400">
              {route.note}
            </p>
          ) : null}
        </div>
      ) : (
        <Link href={route.href!} prefetch={true} className="group block">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
              {route.label}
            </span>
          </div>
          {route.note ? (
            <p className="mt-1 max-w-prose text-sm text-chrome-300">
              {route.note}
            </p>
          ) : null}
        </Link>
      )}
    </li>
  );
}
