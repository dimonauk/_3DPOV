import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  description:
    "Holo-Flow Studio — ambient-light waveguides, desktop sculptures, and wall-array art from twelve years of poi practice.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <FeaturedGrid />
      <Carousel />
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-warm-black-800">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(900px 480px at 78% 18%, rgba(255,120,165,0.28), transparent 62%), radial-gradient(780px 520px at 8% 82%, rgba(154,109,255,0.28), transparent 62%), radial-gradient(600px 380px at 50% 100%, rgba(118,222,166,0.18), transparent 65%)",
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-20 pb-28 md:px-8 md:pt-28 md:pb-36">
        <div className="chrome-label">
          Holo-Flow Studio · Twelve years of practice
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Light, held in the hand,
          <br />
          <span className="chrome-sheen">set against the dark.</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-chrome-200">
          Twelve years of poi &mdash; a body, two weights on two cords, fire
          drawn against the river &mdash; compressed into objects. Ambient-light
          waveguides, desktop sculptures, and configurable wall arrays. Each
          piece carries a fragment of a gesture the room remembers.
        </p>
        <div className="mt-10 flex items-center gap-5 text-sm">
          <Link
            href="/search"
            prefetch={true}
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            Enter the catalogue
          </Link>
          <Link
            href="/about"
            className="text-chrome-300 underline underline-offset-4 hover:text-pink-200"
          >
            The practice, the method →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Statement() {
  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-20 md:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="chrome-label">The practice</div>
          <h2 className="mt-3 text-3xl md:text-4xl">
            Twelve years of poi.
            <br />
            Optics as residue.
          </h2>
        </div>
        <div className="prose-gallery md:col-span-3">
          <p>
            Poi is a discipline of held gesture &mdash; two weights on two
            cords, a body moving in planes so precisely that the weights draw
            shapes in the air. Sustained long enough, those shapes imprint. The
            camera sees them. The long exposure holds them. The room the gesture
            was performed in remembers them.
          </p>
          <p>
            Holo-Flow Studio is the instrument we built to make that memory
            portable. Persistence-of-vision displays captured in the field
            become files. The files become <strong>waveguides</strong> cast into
            resin, <strong>sculptures</strong> that live on a desk, and{" "}
            <strong>wall arrays</strong> configured to the room they'll hang in.
          </p>
          <p>
            Each piece is editioned, signed, and accompanied by the field
            record: where the gesture was performed, what hour, what date.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturedGrid() {
  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12 md:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="chrome-label">Current release</div>
          <h2 className="mt-2 text-3xl md:text-4xl">Featured objects.</h2>
        </div>
        <Link
          href="/search"
          className="text-sm text-chrome-300 underline underline-offset-4 hover:text-pink-200"
        >
          The full catalogue →
        </Link>
      </div>
      <ThreeItemGrid />
    </section>
  );
}
