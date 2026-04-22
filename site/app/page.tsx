import Link from "next/link";
import { getCollections } from "@/lib/collections";
import { PlatePlaceholder } from "@/components/plate-placeholder";

export default function HomePage() {
  const collections = getCollections().slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-ink"
          style={{
            backgroundImage:
              "radial-gradient(1200px 500px at 70% 10%, rgba(138,51,36,0.35), transparent 60%), radial-gradient(900px 600px at 10% 80%, rgba(47,93,80,0.35), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-28 text-bone">
          <div className="protocol-label text-bone/70">Field Record 001 — Hero Plate</div>
          <h1 className="display mt-6 text-5xl leading-[0.95] md:text-7xl">
            Welcome to the&nbsp;Protocol.
          </h1>
          <p className="mt-8 max-w-xl text-bone/80">
            The Chrono-Protocol is a fieldwork of kata &mdash; gestures held
            against the city until the city answers back. Each pass leaves
            residue: a plate, a record, an artefact. This is the archive.
          </p>
          <div className="mt-10 flex items-center gap-5 text-sm">
            <Link
              href="/collections"
              className="border border-bone/60 px-5 py-3 tracking-protocol hover:bg-bone hover:text-ink transition-colors"
            >
              ENTER THE ARCHIVE
            </Link>
            <Link href="/protocol" className="text-bone/80 underline underline-offset-4">
              Read the protocol
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="protocol-label">Statement</div>
            <h2 className="display mt-3 text-3xl md:text-4xl leading-tight">
              Half artist, half archivist.
            </h2>
          </div>
          <div className="md:col-span-3 prose-chrono">
            <p>
              The Neo-London Chrono-Protocol began as a question: if a gesture
              is practiced in the same spot, at the same hour, long enough to
              fold the room around it &mdash; what does the room remember?
            </p>
            <p>
              Each kata is performed on location. A rotating camera rig &mdash;
              a persistence-of-vision instrument built from a Teensy and a ring
              of LEDs &mdash; records the gesture as a volumetric trace. The
              result is not documentation. It is the residue of a ritual the
              city now carries.
            </p>
            <p>
              The plates offered here are the artefacts of that residue,
              editioned and numbered. They are the Protocol made portable.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="protocol-label">Current Fieldwork</div>
            <h2 className="display mt-2 text-3xl md:text-4xl">Three open collections.</h2>
          </div>
          <Link href="/collections" className="text-sm underline underline-offset-4">
            All collections →
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} className="block group">
                <PlatePlaceholder tint={c.tint} aspect="4/5" hatch="horizontal" />
                <div className="protocol-label mt-4">{c.code}</div>
                <div className="display text-xl mt-1 group-hover:underline underline-offset-4">
                  {c.title}
                </div>
                <div className="text-sm text-ink/70 mt-1">{c.location}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="rule pt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
          <h2 className="display text-3xl md:text-4xl leading-tight">
            The work first. The plates after.
          </h2>
          <p className="text-ink/70 max-w-md">
            Each collection page opens with the kata itself &mdash; its
            coordinates, its hour, its choreography. The print is offered at
            the close, never the open.
          </p>
        </div>
      </section>
    </>
  );
}
