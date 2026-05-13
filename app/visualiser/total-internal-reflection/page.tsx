import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import TIRVisualiserShell from "components/visualiser/tir-visualiser-shell";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title:
    "Total Internal Reflection — drag the angle, watch the light get trapped",
  description:
    "An interactive ray-traced visualiser for total internal reflection: drag the incident angle, swap the refractive indices, watch the refracted ray vanish above the critical angle. The first piece in the studio's /visualiser series. Companion to the waveguide articles.",
};

export default function TIRVisualiserPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Visualiser series &middot; 01</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Total Internal Reflection.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            The waveguide pendants on the bench hold their own light.
            Drop a single warm-white LED into a resin form and most of
            the light cannot get out &mdash; it bounces off the inside
            of every surface, runs down the length of the piece, and
            leaks only where the geometry tells it to. The mechanism is
            total internal reflection, and the load-bearing number is
            the critical angle:{" "}
            <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
              &theta;&#x1D04; = arcsin(n&#x2082; / n&#x2081;)
            </code>
            . For the studio&rsquo;s standard resin (n &asymp; 1.50)
            looking out into air (n &asymp; 1.00), that is 41.81&deg;
            from the surface normal. Any internal ray hitting the wall
            at a steeper angle than that has nowhere to go but back
            into the resin.
          </p>
          <p>
            This page is the maths made tangible. Drag the incident
            angle below. Watch the refracted ray dim and vanish the
            moment the angle crosses the critical line; watch the
            reflected ray go from a faint companion to the entire
            story. Swap the materials and the threshold moves &mdash;
            diamond traps at 24.4&deg;, water at 48.6&deg;, ordinary
            glass somewhere in between. The Fresnel readout gives the
            honest percentage of light that reflects at any incident
            angle, not just above the critical line.
          </p>
          <p>
            The prose companion is{" "}
            <Link
              href="/articles/why-the-pendant-glows-from-the-inside"
              className={ext}
            >
              Why the Pendant Glows From the Inside
            </Link>{" "}
            &mdash; that piece is the long-form derivation of every
            number on this page. The wavelength side of the same family
            of mechanisms is in{" "}
            <Link href="/articles/colour-without-pigment" className={ext}>
              Colour Without Pigment
            </Link>
            .
          </p>
        </section>

        <div className="mt-12">
          <Suspense
            fallback={
              <div
                className="aspect-[4/3] w-full animate-pulse rounded-sm border border-warm-black-800"
                style={{ backgroundColor: "#0c0a12" }}
              />
            }
          >
            <TIRVisualiserShell />
          </Suspense>
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label text-pink-200">
            Where this matters in the studio
          </div>
          <p className="mt-3 text-chrome-300">
            Every waveguide piece on the bench &mdash; every pendant,
            every cuff, every wall array &mdash; rests on the
            arithmetic above. The critical angle sets the wall angles
            that trap light, the minimum bend radius for printable
            channels, and the surface treatments that let the trapped
            light escape where the design wants it.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-chrome-300">
            <li>
              &mdash;{" "}
              <Link
                href="/articles/why-the-pendant-glows-from-the-inside"
                className={ext}
              >
                Why the Pendant Glows From the Inside
              </Link>{" "}
              &mdash; the long-form derivation, with the
              minimum-bend-radius formula and the compound-loss
              arithmetic.
            </li>
            <li>
              &mdash;{" "}
              <Link href="/articles/colour-without-pigment" className={ext}>
                Colour Without Pigment
              </Link>{" "}
              &mdash; the wavelength side. Thin-film interference,
              diffraction gratings, photonic crystals: same family of
              tricks, different mechanism.
            </li>
            <li>
              &mdash;{" "}
              <Link href="/stack" className={ext}>
                The stack &mdash; waveguide section
              </Link>{" "}
              &mdash; the kit and material list the bench uses to turn
              this physics into objects.
            </li>
          </ul>
        </section>

        <section className="mt-12 text-xs leading-relaxed text-chrome-500">
          <p>
            The Fresnel reflectance shown in the readout is the
            unpolarised average of the s- and p-polarisation Fresnel
            coefficients &mdash; not Schlick&rsquo;s approximation,
            which loses accuracy near Brewster&rsquo;s angle and at
            grazing incidence. The maths is in{" "}
            <code className="font-mono">lib/visualiser/tir-math.ts</code>{" "}
            and is pure-function and testable. First entry in a{" "}
            <code className="font-mono">/visualiser/*</code> route
            family with a consistent shape: page chrome + R3F canvas +
            controls block + readout. Future entries will follow the
            same skeleton.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
