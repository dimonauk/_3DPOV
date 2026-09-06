import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Performances — Neo London / AntiGravity",
  description:
    "A live act combining poi, real-time laser projection, and an evolving SLA-printed resin sculpture. Book Neo London / AntiGravity for events, installations, and private commissions.",
};

export default function PerformancesPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Live act</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Neo London
          <br />
          <span className="chrome-sheen">AntiGravity.</span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          Poi, driven by hand, drawn again in real-time laser light, next to
          a sculpture that keeps evolving while it prints. Three practices
          that used to be separate — dance, projection, object-making —
          running in the same room, live, off the same gesture.
        </p>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label mb-2">What's in the room</div>
          <h2 className="text-3xl text-chrome-100">Three things happening at once.</h2>
          <div className="mt-8 space-y-8">
            <KitBlock name="The poi">
              <p>
                Twelve years in — cross-follow, antispin, weaves, fire. The
                same practice the studio's photography grew out of, but
                live, not captured after the fact.
              </p>
            </KitBlock>
            <KitBlock name="The laser">
              <p>
                A LaserCube, USB-driven, streaming a real-time point trace
                of the move as it's danced — parametric curves (rhodonea,
                toroid, epitrochoid, and others) with live rotation and
                drift, phrased so one move's exit matches the next move's
                entry the way a real kata actually joins its parts. Not a
                pre-rendered video; the beam is drawing the dance as it
                happens.
              </p>
            </KitBlock>
            <KitBlock name="The sculpture">
              <p>
                An SLA-printed resin waveguide sculpture evolves alongside
                the performance — the same lineage of work as the studio's
                printed objects, but running live rather than arriving
                finished.
              </p>
            </KitBlock>
          </div>
        </section>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label mb-2">The repertoire</div>
          <h2 className="text-3xl text-chrome-100">Named pieces, not improvisation.</h2>
          <div className="prose-gallery mt-5 text-chrome-200">
            <p>
              Each piece is a scored sequence of named moves — chained two
              ways: crossfaded through short blend windows, or phrase-matched
              so the exit of one move lands exactly on the entry of the
              next, the way real poi phrasing actually works. Current
              repertoire:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong>Grounding</strong> — slow, deliberate, an opening
                piece.
              </li>
              <li>
                <strong>Antispin Study</strong> — a technical piece built
                around the antispin flower move.
              </li>
              <li>
                <strong>Fire</strong> — the closing piece, highest tempo.
              </li>
            </ul>
            <p className="mt-4">
              New pieces are built per booking where the brief calls for it
              — a score is just a list of moves, durations, and parameters,
              so the repertoire grows with each commission rather than
              repeating a fixed set.
            </p>
          </div>
        </section>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label mb-2">Booking</div>
          <h2 className="text-3xl text-chrome-100">
            Events, installations, private commissions.
          </h2>
          <p className="prose-gallery mt-5 text-chrome-200">
            Scoped individually, same as any commission — venue, duration,
            and whether the sculpture element travels with the act all
            shape the quote. I reply within two working days with a price
            and a link to an intake call.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link
            href="/commission?type=performance"
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            Book a performance
          </Link>
          <Link
            href="/practice"
            className="rounded-full border border-chrome-400/30 px-6 py-3 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
          >
            The history of the practice
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}

function KitBlock({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="chrome-label mb-2 text-pink-200">{name}</div>
      <div className="prose-gallery text-chrome-300">{children}</div>
    </div>
  );
}
