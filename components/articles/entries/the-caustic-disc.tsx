import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheCausticDiscArticle() {
  return (
    <>
      <p>
        The caustic disc is a small object &mdash; palm-sized,
        thirty-six millimetres across, three millimetres thick,
        clear acrylic or optical-grade resin. One face is flat. The
        other carries a precisely-computed relief that is invisible
        to the naked eye unless you tilt it under a strong light.
        Hold the disc over a torch, point the projection at a wall a
        foot or two away, and a specific image resolves in light on
        the wall. A poi antispin flower, or a five-petal rose, or a
        portrait, depending on which disc you bought. The image is
        not printed on the disc. The image is the caustic the disc
        casts.
      </p>
      <p>
        This piece is the first production-ready artefact in the
        studio&rsquo;s new hardware line, and it pairs with the{" "}
        <Link href="/articles/vr-pov-controllers-the-product" className={ext}>
          bezel controllers
        </Link>{" "}
        as the proof that the bench is real. The bezel adds light to
        a gesture. The disc reshapes light into an image. Together
        they are the studio&rsquo;s opening statement on hardware:
        objects that do something specific when you point light
        through them, or carry light around with you, and that you
        can hold in your hand.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What a caustic is
      </h2>
      <p>
        A caustic is the bright pattern formed when light is focused
        through a curved transparent or reflective surface. It is
        the rippling net of light on the floor of a swimming pool;
        the bright crescent inside an empty wine glass on a sunny
        windowsill; the wandering bright filament that runs along a
        kitchen counter from a curved water jug. The word{" "}
        <em>caustic</em> comes from the Greek for &ldquo;burning&rdquo;
        &mdash; the points where light is hot enough to mark a
        surface are precisely where the rays from a curved boundary
        concentrate.
      </p>
      <p>
        Most caustics are accidents of the shape of the object that
        cast them. A wine glass is not designed to project a
        crescent; the crescent is a side effect of the glass being
        a curved transparent body sitting in light. The studio&rsquo;s
        discs reverse this. The image is the brief; the surface that
        produces it is the result. You decide what the wall should
        show, then the disc is shaped to cast exactly that.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The hard part &mdash; the inverse problem
      </h2>
      <p>
        Forward, this is easy: given a surface, simulate the
        refraction, predict the bright pattern. Snell&rsquo;s Law at
        every point, trace the rays, sum the energy density on the
        projection plane. A first-year graphics course.
      </p>
      <p>
        Inverse, it is much harder. Given a target image, find the
        surface that produces it. Two surfaces close together can
        cast wildly different patterns; one surface can cast many
        different patterns depending on the distance and the angle
        of the light. The problem has been the subject of academic
        work since the early 2010s &mdash; the foundational papers
        come from the EPFL Computer Graphics group, with{" "}
        <a
          href="https://www.mitsuba-renderer.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mitsuba{arrow}
        </a>{" "}
        carrying the renderer side of the field. The practical
        recipe is iterative: start with a flat disc, ray-trace the
        caustic it casts, compare to the target, nudge the height
        field, repeat until the loss stops falling. Gradient descent
        on a refractive surface.
      </p>
      <p>
        The studio runs its own optimiser at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          python-services/caustic_optimizer.py
        </code>
        . It takes a target pattern &mdash; a poi-antispin n-petal
        flower, a focused ring, an Archimedes spiral, or an
        arbitrary PNG &mdash; and runs vectorised ray-trace plus
        back-projected feedback on a sixty-four-by-sixty-four grid
        until the height field has settled. The maximum relief is
        half a millimetre. The disc radius is eighteen millimetres
        by default. The projection distance is calibrated at three
        hundred millimetres, which is the focal length the studio
        ships its torches for. The output is an STL ready for the
        printer.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the bench actually does
      </h2>
      <p>
        Three stages, in order. First, the design pass: the target
        image is rasterised onto the grid, the optimiser runs for
        roughly two hundred iterations on a single GPU, the height
        field converges, the loss plot flattens. Mean iteration
        time is around forty seconds on the studio&rsquo;s 3080 Ti
        &mdash; under fifteen minutes per disc on the design side.
        The optimiser writes the STL and a preview PNG that shows
        the predicted caustic alongside the height field and the
        loss curve. The preview is the first checkpoint &mdash; if
        the predicted caustic does not look like the target, the
        disc is not worth fabricating.
      </p>
      <p>
        Second, the fabrication pass. Two production routes, both
        in use on the bench. For clear acrylic, the disc is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Diamond_turning"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          diamond-turned{arrow}
        </a>{" "}
        on a single-point CNC lathe with a sub-micron surface
        finish &mdash; the flat face is the optical reference, and
        the relief face carries the height field. The bench
        outsources this to a partner shop in the Midlands;
        single-point diamond turning on hobby budgets is not yet a
        thing. For optical-grade resin, the disc is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Digital_light_processing"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DLP-printed{arrow}
        </a>{" "}
        on the studio&rsquo;s own Mars 5 Ultra at nineteen-micrometre
        XY resolution and a twenty-micrometre layer height, then
        rinsed, post-cured under UV, wet-sanded through 400-800-
        1500-2000-3000 grit, and polished with Novus 3 / 2 / 1. The
        polishing pass is where most of the work sits. A rough
        surface scatters; a polished surface refracts cleanly.
        Without the polish, the caustic looks like a smear. With it,
        the image resolves.
      </p>
      <p>
        Third, the calibration pass. Each disc is verified against a
        known-good torch &mdash; the studio ships a small
        narrow-beam LED torch with each disc, factory-paired to the
        edition. The torch is calibrated for beam divergence and
        colour temperature; the disc is calibrated for the
        torch&rsquo;s focal characteristics. A photograph of the
        actual projection at three hundred millimetres goes into the
        provenance record. If the image on the wall doesn&rsquo;t
        match the target, the disc fails Q.C. and gets re-polished
        or remade.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What you buy
      </h2>
      <p>
        The editioned object is four things. The disc itself,
        engraved on the rim with the edition number and the target
        identifier. The calibrated torch the disc is paired to,
        with the specified beam pattern and a fresh AA battery. A
        small printed card naming the projection distance, the
        target image, and the recommended ambient-light
        conditions &mdash; caustics are visible in moderately lit
        rooms but disappear in direct sunlight. And the JSON
        provenance record &mdash; the same typed contract every
        editioned piece ships with, cross-linked to{" "}
        <Link href="/articles/provenance-as-discipline" className={ext}>
          Provenance as Discipline
        </Link>
        . The record names the target pattern, the optimiser run,
        the height-field hash, the printer or lathe used, the
        polishing schedule, and the reference photograph of the
        actual projection.
      </p>
      <p>
        The target image is part of the piece&rsquo;s identity. A
        five-petal poi rose disc is a different edition from a
        three-petal one even if everything else about them is the
        same. The studio&rsquo;s first run is twelve discs across
        four poi-antispin patterns (three-petal, four-petal,
        five-petal, seven-petal). The second run takes commissioned
        targets &mdash; you send a high-contrast monochrome image,
        the bench optimises a disc for it, you receive a one-off.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pairing with the bezel
      </h2>
      <p>
        Both objects do something to light. The bezel adds light to
        a controller and writes a programmed image into the air by{" "}
        <Link href="/articles/why-the-pendant-glows-from-the-inside" className={ext}>
          persistence-of-vision
        </Link>
        ; the disc takes ambient light and reshapes it by refraction
        into a fixed projection. The bezel is performative &mdash;
        the gesture writes the image. The disc is static &mdash;
        the image is already in the geometry, waiting for a torch.
        They are the two halves of the studio&rsquo;s working
        thesis: light is the medium, geometry is the instrument, and
        the artefact is the surface that translates one into the
        other.
      </p>
      <p>
        The colour engineering is the cousin discipline.{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        is about steering wavelengths with geometry at the
        micrometre scale. The caustic disc is the same trick at the
        macroscopic scale &mdash; geometry doing the work that
        people instinctively assume a printer or a coating did.
        Neither object has an image painted on it. The image is
        what the geometry forces the light to do.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        When you will see one
      </h2>
      <p>
        The bench is finishing its first batch through the print
        bureau &mdash; the same{" "}
        <Link href="/bureau" className={ext}>
          /bureau
        </Link>{" "}
        route that handles the photographs and the test prints
        handles the discs, because the calibration-and-provenance
        discipline is the same. The opening edition is twelve, four
        poi patterns by three discs each. Pricing sits in the same
        register as a small editioned photograph &mdash; the labour
        is the polishing pass and the verification, not the
        material. The dispatch list at the bottom of any page on
        this site is where the first dozen will be announced.
      </p>
      <p>
        Or, if you want to understand the maths without buying one:
        the optimiser source is in the repository, the academic
        papers are open-access, and a torch and any clear curved
        object will give you the principle on the wall in front of
        you. The bench did not invent caustics. The bench made them
        editable.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-caustic-disc",
    title: "The Caustic Disc",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "The studio's first production-ready artefact: a palm-sized acrylic or resin disc with a precisely-computed refractive surface that, held over a torch, projects a specific image as a focused caustic on the wall. The inverse optics, the optimiser at python-services/caustic_optimizer.py, the polishing pass, the calibrated torch, the provenance record. The pair piece to the bezel — both are objects that translate light into image by geometry.",
    Body: TheCausticDiscArticle,
    related: [
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "The sibling hardware artefact. The bezel adds light to a gesture; the disc reshapes light into an image.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows From the Inside",
        note: "The optics-of-mechanism companion. Same refractive bench, different geometry register.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "Geometry doing the work a coating would. The caustic disc is the same trick at the macroscopic scale.",
      },
      {
        href: "/articles/provenance-as-discipline",
        label: "Provenance as Discipline",
        note: "The typed JSON record every editioned disc ships with, alongside the calibrated torch.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The operational philosophy that underwrites the hardware line. One disc per target, one torch per disc, swappable parts.",
      },
      {
        href: "/bureau",
        label: "Print bureau",
        note: "The calibration-and-provenance route the discs ship through.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Caustic_(optics)",
        label: "Caustic (optics) — Wikipedia",
        note: "The umbrella article. Mathematical definition, examples, and the link out to the inverse-problem literature.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Snell%27s_law",
        label: "Snell's Law — Wikipedia",
        note: "The refraction equation applied at every grid point of the height field.",
      },
      {
        href: "https://www.mitsuba-renderer.org/",
        label: "Mitsuba renderer",
        note: "Open-source physically-based renderer with caustic-optimisation extensions. The reference implementation the field benchmarks against.",
      },
      {
        href: "https://rgl.epfl.ch/publications/Schwartzburg2014HighContrast",
        label: "Schwartzburg et al. — High-contrast computational caustic design (EPFL, 2014)",
        note: "The foundational paper on inverse-caustic surface design. The shape of every caustic-disc optimiser since.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diamond_turning",
        label: "Diamond turning — Wikipedia",
        note: "Sub-micron single-point CNC machining. The acrylic-disc production route.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Digital_light_processing",
        label: "Digital light processing — Wikipedia",
        note: "DLP photopolymer printing. The optical-resin production route on the studio's own bench.",
      },
    ],
  };
