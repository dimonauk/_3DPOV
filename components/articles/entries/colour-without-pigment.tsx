import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function ColourWithoutPigment() {
  return (
    <>
      <p>
        The waveguide sculptures on the bench do something most
        people read as paint. They are blue, or green, or a kind of
        oil-slick magenta that walks around the form as the viewer
        walks around the room. There is no paint. There is no
        pigment in the resin. The colour is in the geometry. I want
        to write this down because the question keeps arriving:
        &ldquo;is that finished with a coating?&rdquo; No. The
        finish is the shape itself.
      </p>
      <p>
        The proper name for this is <strong>structural colour</strong>,
        and the principle has been used by biology for at least four
        hundred million years. The studio is borrowing the trick. The
        purpose of this piece is to write down the trick in plain
        prose, so the work makes sense without the reader needing to
        sit a physics paper.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Pigment vs structure</h2>
      <p>
        Pigment is wavelength selection by absorption. A red pigment
        absorbs every part of the spectrum that hits it, except the
        red part, which is reflected. The blue and the green
        wavelengths get turned into a small amount of heat. You see
        what is left over. It is a subtractive process &mdash; the
        pigment removes wavelengths, the rest reaches your eye.
      </p>
      <p>
        Structural colour does the opposite. The material itself is
        often clear, or weakly tinted, or even white. The colour
        comes from the way a microscopic structure inside the
        material steers light by interference, diffraction, or
        scattering. Nothing is absorbed. Nothing is lost to heat.
        The light gets routed, not consumed. This is why structural
        colours look so much more vivid than pigments &mdash; they
        waste no photons. A Morpho butterfly&rsquo;s wing scale is
        twice as bright per square millimetre as the best blue
        pigment ever ground.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where biology already does it
      </h2>
      <p>
        Once you know the trick exists, you start seeing it
        everywhere.
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>The Morpho butterfly.</strong> The brilliant
          tropical blue is a stack of ridges on the wing scale,
          spaced about 200 nanometres apart. Layers of clear chitin
          and air, interfering. The blue is air and protein,
          arranged.
        </li>
        <li>
          <strong>The Green Hairstreak (<em>Callophrys rubi</em>).</strong>{" "}
          The green comes from a three-dimensional structure called
          a gyroid, embedded in the wing scale. The wing is, at
          microscopic scale, a labyrinth. Light gets in, bounces
          predictably, comes back out green.
        </li>
        <li>
          <strong>The peacock.</strong> Two-dimensional array of
          melanin rods, with a dark layer behind. Same family of
          mechanism &mdash; rods spaced about 150 nanometres apart.
          The reason it looks different from different angles is
          because the mechanism is geometric and the geometry has
          orientation.
        </li>
        <li>
          <strong>Comb jellies (Ctenophora).</strong> Beating rows
          of cilia that act as a moving diffraction grating. The
          rainbow that runs along their bodies is the same
          principle as a CD viewed from the side &mdash; periodic
          structure splitting white light into its component
          wavelengths.
        </li>
        <li>
          <strong>Opal.</strong> Tightly packed spheres of silica,
          roughly 200 to 350 nanometres each, in a regular lattice.
          The colour shifts depending on the spacing. Not a
          pigment. A geometry.
        </li>
      </ul>
      <p>
        None of these creatures are doing anything chemically
        clever to make these colours. They are doing something
        geometrically clever. The colour is in the arrangement.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Three families of mechanism
      </h2>
      <p>
        The bench works with three of these. They are worth naming
        because the sculptures on the catalogue use them, mixed
        and matched, depending on the piece.
      </p>
      <p>
        <strong>Thin-film interference.</strong> Two reflective
        surfaces, very close together, with light bouncing between
        them. The two reflections recombine and interfere &mdash;
        the wavelengths that match the gap come out brighter, the
        wavelengths that don&rsquo;t come out cancelled. This is
        the oil-slick-on-a-puddle effect, or the soap-bubble
        rainbow. The gap thickness controls the colour: about 100
        nanometres reads as blue, 130 as green, 160 as red.
      </p>
      <p>
        <strong>Diffraction gratings.</strong> A surface with a
        periodic pattern of grooves at roughly the scale of visible
        light. Each groove acts as a tiny source of bent light, and
        the bent beams interfere with each other to produce
        spectra in specific directions. This is the rainbow on the
        underside of a CD. The pitch &mdash; the spacing between
        grooves &mdash; sets which wavelengths end up where. Fine
        pitch lands blue. Coarse pitch lands red.
      </p>
      <p>
        <strong>Photonic crystals.</strong> Three-dimensional
        version of the same idea. A repeating structure inside a
        volume, with a unit cell on the order of visible light, can
        forbid certain wavelengths from propagating through it
        &mdash; like a frequency-selective mirror, but built from
        geometry alone. The gyroid is the canonical example, and
        the Green Hairstreak butterfly is the canonical user.
      </p>
      <p>
        The optical engine underneath all three of these is
        ordinary ray refraction at the boundary between two
        materials, governed by Snell&rsquo;s Law and switched into
        total internal reflection above a critical angle. The{" "}
        <Link
          href="/visualiser/total-internal-reflection"
          className={ext}
        >
          TIR visualiser
        </Link>{" "}
        runs that one boundary live &mdash; drag the angle slider,
        watch the refracted ray vanish at the critical angle,
        which is the moment a structural-colour mechanism becomes a
        waveguide.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the studio can actually do
      </h2>
      <p>
        The studio&rsquo;s resin printer has a horizontal
        resolution of about 19 micrometres &mdash; nineteen
        thousand nanometres. That is roughly a hundred times larger
        than the features biology uses for true structural colour.
        Which means the bench cannot, today, print a Morpho wing
        scale. The print process is not fine enough. This is
        honest.
      </p>
      <p>
        What the bench CAN print:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Diffraction gratings at the larger end of the
          visible-rainbow scale.</strong> A grating with grooves
          spaced 19 to 200 micrometres produces visible rainbows at
          oblique viewing angles &mdash; the angles you actually
          look at a sculpture from. This is the working register
          for the velocity-mapped surfaces on the waveguide pieces:
          fast bits of the captured movement become fine pitch,
          slow bits become coarse pitch, and you see a spectral
          gradient running along the form that follows the
          gesture.
        </li>
        <li>
          <strong>Macro gyroids.</strong> Not at the nanometre scale
          a butterfly uses, but at a millimetre scale where the
          light behaves through ordinary internal reflection
          instead of photonic-crystal interference. The colour does
          not come for free, but the form is biologically faithful
          and the optical channelling is real.
        </li>
        <li>
          <strong>Thin-film interference, indirectly.</strong>{" "}
          Through coatings on the finished resin, or by laminating
          a vacuum-deposited interference film over the resin
          surface. This is post-process work, not in-print. The
          chemistry stays under wraps for the moment but the
          principle is the one above.
        </li>
      </ul>
      <p>
        The roadmap is straightforward. Each generation of resin
        printer gets finer. The cinema-class hardware is already
        down to single-digit micrometres for the inkjet
        photopolymer process &mdash; about half the scale needed to
        approach the red end of the visible spectrum honestly. By
        the time the consumer machines catch up, the geometry will
        already have been designed. The work is patient.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why this matters for the work
      </h2>
      <p>
        Two reasons.
      </p>
      <p>
        First: the colour is provenance. A pigment can be added to
        anything. A blue paint is the same blue paint regardless of
        what carries it. But a structural colour comes from the
        thing&rsquo;s geometry &mdash; and the geometry of a
        studio waveguide sculpture is derived from a captured
        gesture, on a captured body, on a captured day. The colour
        is therefore as personal as a fingerprint. You cannot
        forge it with paint. You would have to fake the geometry,
        and the geometry holds the gesture.
      </p>
      <p>
        Second: it is honest about light. The waveguide pieces sit
        in rooms with daylight and lamps and the changing colour
        temperature of the sky. A pigment-coloured sculpture would
        be a single colour on a constant resin substrate. The
        structural pieces walk the spectrum as the light walks the
        day. They are alive in a way painted objects are not. The
        light is not decoration. It is co-author.
      </p>
      <p>
        This is the optical engineering layer behind every{" "}
        <Link href="/articles/jewellery-the-same-trace-wearable" className={ext}>
          waveguide pendant
        </Link>{" "}
        and every{" "}
        <Link href="/articles/wall-arrays-geometry-of-rooms" className={ext}>
          wall array
        </Link>{" "}
        the studio prints. The mathematics is centuries old. The
        biology is hundreds of millions of years older than that.
        The studio is, as ever, standing on shoulders.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to read further
      </h2>
      <p>
        For the deep version, look at Pete Vukusic&rsquo;s
        biomimetic-optics papers and the textbook{" "}
        <a
          href="https://global.oup.com/academic/product/the-optics-of-life-9780691139913"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          The Optics of Life{arrow}
        </a>{" "}
        by S&oacute;nke Johnsen. For the friendly version, the BBC
        Natural History Unit has a half-hour episode on Morpho
        butterflies that explains the layer geometry with
        scanning-electron-microscope footage that does the job
        better than any equation. For the practitioner version,
        spend an evening reading the abstracts on the Photonics
        Research journal &mdash; the field publishes its results
        openly and the recent ones are surprisingly accessible.
      </p>
      <p>
        Or, simpler: pick up a peacock feather, hold it at
        different angles in front of a lamp, and watch the green
        become blue become gold. That is the entire principle,
        already in your hand.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "colour-without-pigment",
    title: "Colour Without Pigment",
    date: "2025-08-21",
    kind: "article",
    excerpt:
      "The waveguide pieces are blue, green, and oil-slick magenta without paint. The colour is in the geometry — structural colour, the trick biology has used for hundreds of millions of years. Thin-film interference, diffraction gratings, photonic crystals; what the studio can print today and what waits for the next generation of resin printers.",
    Body: ColourWithoutPigment,
    related: [
      {
        href: "/visualiser/total-internal-reflection",
        label: "Visualiser — Total Internal Reflection",
        note: "Interactive — drag the angle slider, watch TIR engage. The one-boundary optical engine underneath thin-film, gratings, and photonic crystals.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The companion piece. Where the optics live inside the larger architecture of the work.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "The wearable pieces these mechanisms power.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Structural colour at room scale.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "How to actually light the resulting piece so the optics read.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Structural_coloration",
        label: "Structural coloration — Wikipedia",
        note: "The umbrella term covering all three mechanisms in the piece.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Thin-film_interference",
        label: "Thin-film interference — Wikipedia",
        note: "The soap-bubble mechanism, formal version.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diffraction_grating",
        label: "Diffraction grating — Wikipedia",
        note: "The CD-rainbow mechanism, with the grating equation.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Photonic_crystal",
        label: "Photonic crystals — Wikipedia",
        note: "The volumetric version of the same family of ideas.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Morpho",
        label: "Morpho butterflies — Wikipedia",
        note: "The most-studied biological example, with electron-microscope structural references.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gyroid",
        label: "Gyroid — Wikipedia",
        note: "The triply-periodic minimal surface the Green Hairstreak builds inside its wing scales.",
      },
      {
        href: "https://www.nature.com/articles/nphoton.2010.244",
        label: "Vukusic & Sambles — Photonic structures in biology (Nature Photonics)",
        note: "The reference review paper of the biological structural-colour literature.",
      },
    ],
  };
