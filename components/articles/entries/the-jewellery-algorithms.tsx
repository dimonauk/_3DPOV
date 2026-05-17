import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheJewelleryAlgorithms() {
  return (
    <>
      <p>
        The studio&rsquo;s pendant line is visible at{" "}
        <Link href="/articles/jewellery-the-same-trace-wearable" className={ext}>
          Jewellery &mdash; The Same Trace, Wearable
        </Link>
        . That article names the product. This one names the room
        behind the product. A pendant does not arrive on the bench
        whole; it is summoned from a cabinet of generators, and the
        cabinet has thirty drawers, and each drawer is an algorithm.
      </p>
      <p>
        The room has a name on the bench &mdash; the atelier. The
        word is honest. An atelier is the workshop a maker keeps
        between the studio and the showroom; small, walled, full of
        bench tools. The studio&rsquo;s atelier is digital. It runs
        as a 12&times;12 grid of generators in a browser tab: one
        hundred and forty-four cells, each one breathing out a small
        candidate form, the operator&rsquo;s eye walking the grid and
        choosing.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The cabinet</h2>
      <p>
        Thirty algorithms sit in the cabinet at the time of writing.
        Each one is a class &mdash; a small object that knows how to
        produce one family of forms, given a seed, a size budget, and
        a handful of parameters drawn from the commission. The studio
        names them after the structure they produce, not after the
        mathematician who first wrote them down. A reader who knows
        the underlying mathematics will recognise most names on
        sight; a reader who does not will see them as a vocabulary of
        shapes the atelier knows how to make.
      </p>
      <p>
        Naming a representative sample of the cabinet, not all thirty.
        These are the drawers a commission most often opens.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Spiral &mdash; the oldest drawer
      </h2>
      <p>
        The first algorithm in the cabinet. A point walking outward
        from a centre, leaving a trace behind it. The studio uses it
        for pendants that read as motion arrested mid-rotation
        &mdash; the gesture of a single poi sweep, frozen as a
        wearable line. The maths is Archimedean for the open spirals
        and logarithmic for the tighter coils. The drawer takes two
        parameters in commission terms: how many turns, and how
        quickly the radius grows. Everything else &mdash; the
        thickness of the spiral arm, the bevel on its cross-section,
        the choice of metal cap at its end &mdash; is downstream of
        the algorithm, not part of it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Gyroid &mdash; the impossible surface
      </h2>
      <p>
        The{" "}
        <a
          href="https://en.wikipedia.org/wiki/Gyroid"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Gyroid{arrow}
        </a>{" "}
        is a triply periodic minimal surface &mdash; a shape that
        divides space into two intertwined regions that mirror each
        other without ever touching, and that minimises its surface
        area locally at every point. NASA mathematician Alan Schoen
        described it in 1970. The studio uses it for pendants that
        glow without an LED inside; a Gyroid cell printed in clear
        resin behaves as a diffuse light trap, catching ambient light
        in its interior and emitting it from every external face. The
        atelier&rsquo;s armband and signet pieces in the Gyroid
        Periodic archetype come from this drawer. The drawer takes
        cell size, wall thickness, and a single axis of orientation;
        the maths handles the rest.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Voronoi &mdash; the boundary network
      </h2>
      <p>
        Drop a handful of seed points into a region. For every point
        in the region, ask which seed is nearest. The boundary
        between &ldquo;nearest to seed A&rdquo; and &ldquo;nearest to
        seed B&rdquo; is one edge of a{" "}
        <a
          href="https://en.wikipedia.org/wiki/Voronoi_diagram"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Voronoi diagram{arrow}
        </a>
        . Walk every pair, draw every boundary, and the region
        partitions itself into cells. The studio uses this drawer for
        pieces that read as cracked-mosaic; the cells become facets,
        the boundaries become metal seams in the resin print. A
        commission asking for organic-but-not-curvilinear &mdash;
        ironwork, mineral, lichen on stone &mdash; opens this drawer
        first.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Penrose Tiling &mdash; the aperiodic lattice
      </h2>
      <p>
        Two rhombi, fitted together by a small ruleset, will tile the
        plane forever without ever repeating themselves.{" "}
        <a
          href="https://en.wikipedia.org/wiki/Penrose_tiling"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Roger Penrose described the construction{arrow}
        </a>{" "}
        in 1974; quasicrystalline metals discovered a decade later
        turned out to be Penrose tilings in three dimensions. The
        atelier uses the drawer for pendants and brooches with
        fivefold rotational symmetry that resist the brain&rsquo;s
        attempt to find a pattern. The eye keeps moving around the
        piece because the eye cannot rest on a repeat. Commissions
        that ask for a star without using a star shape land here.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Celtic Knot &mdash; the unbroken weave
      </h2>
      <p>
        An interlace pattern in which one or more strands cross over
        and under one another, never terminating, never branching. The
        traditional Celtic forms &mdash; the triquetra, the
        Carolingian plait, the Book of Kells full-page initials
        &mdash; are the family. The studio&rsquo;s algorithm takes a
        graph (a network of crossings) and renders it as a single
        continuous waveguide; a commission for{" "}
        <a
          href="https://en.wikipedia.org/wiki/Celtic_knot"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          a Celtic knot pendant{arrow}
        </a>{" "}
        becomes, on the bench, a question about how many crossings
        the wearer wants, what the over-under sequence should be, and
        whether the knot terminates in a bezel or wraps back into
        itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Diatom Hex &mdash; the marine lattice
      </h2>
      <p>
        Diatoms are single-celled algae whose silicate shells are
        among the most ornate biological structures known. Many
        species build hexagonal lattices with smaller hexagonal holes
        nested inside the larger ones, sometimes to four orders of
        nesting. The atelier&rsquo;s Diatom Hex drawer reproduces this
        biological pattern as a printable waveguide structure. The
        pieces in this family carry light through the hexagonal
        channels with markedly higher transmission than a solid body
        of the same volume, because the structure is mostly air. A
        pendant from this drawer weighs about a third of what a solid
        pendant of the same envelope would, and gives back twice the
        glow.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Wigner-Seitz &mdash; the cell of nearest space
      </h2>
      <p>
        Take a periodic lattice of points. For each point, draw the
        smallest convex region containing only the space closer to
        that point than to any other. The result is a{" "}
        <a
          href="https://en.wikipedia.org/wiki/Wigner%E2%80%93Seitz_cell"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Wigner-Seitz cell{arrow}
        </a>{" "}
        &mdash; the solid-state-physics term for the primitive cell
        of a crystal lattice, named for Eugene Wigner and Frederick
        Seitz who described it in 1933. The atelier&rsquo;s drawer
        produces faceted pendants whose geometry is determined
        entirely by the underlying lattice the operator chooses
        &mdash; cubic, body-centred cubic, hexagonal close-packed.
        Each lattice produces a characteristic polyhedron. The drawer
        is the studio&rsquo;s answer to a commission that asks for a
        gemstone-cut surface without buying a gemstone.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Enneper &mdash; the saddle that keeps saddling
      </h2>
      <p>
        Alfred Enneper described his surface in 1864. It is a minimal
        surface like the Gyroid &mdash; an{" "}
        <a
          href="https://en.wikipedia.org/wiki/Enneper_surface"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Enneper surface{arrow}
        </a>{" "}
        also minimises its area locally at every point &mdash; but
        where the Gyroid fills space, the Enneper is a sheet that
        folds back on itself, producing a self-intersecting
        cloverleaf in three dimensions. The studio uses the drawer
        for sculptural pendants where the eye should travel along an
        unbroken surface and lose itself in the fold. The maths is
        parameterised by a single integer (the order of the surface)
        and a continuous parameter for scale. The drawer&rsquo;s
        output is unmistakable on sight.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sigil &mdash; the constructed glyph
      </h2>
      <p>
        Not strictly mathematical. The Sigil drawer takes a word, a
        name, or a short phrase, and produces a single continuous
        glyph: the letters overlaid, the redundant strokes removed,
        the remainder simplified to a unified mark. The studio uses
        the drawer for personalised commissions where the wearer wants
        to carry a word without spelling it. The output is always
        unique to the input string; two commissions with the same
        word produce the same glyph, which makes the drawer useful
        for matched pairs (a couple, a parent and child, a memorial
        pair).
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        L-System &mdash; the grammar of branching
      </h2>
      <p>
        Aristid Lindenmayer was a biologist studying the growth of
        plants. In 1968 he described a formal grammar for cell
        division: a starting symbol, a small ruleset that rewrites
        each symbol as a new string of symbols, and an interpreter
        that draws the resulting string as a path with turns and
        branches. An{" "}
        <a
          href="https://en.wikipedia.org/wiki/L-system"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          L-system{arrow}
        </a>{" "}
        run for a few generations produces fern fronds, dendritic
        trees, branching coral. The atelier&rsquo;s drawer produces
        pendants and earrings that look botanically grown rather than
        designed. The drawer takes the ruleset and the iteration
        depth; the maths handles the rest.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The other twenty
      </h2>
      <p>
        The cabinet holds twenty more drawers besides these. Fermat
        Spiral; Diffusion-Limited Aggregation;{" "}
        <a
          href="https://en.wikipedia.org/wiki/Diffusion-limited_aggregation"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DLA{arrow}
        </a>{" "}
        produces the crystalline branching of frost and the spreading
        of lichen. Auxetic Corrugation, for pieces that flex in
        unexpected directions when worn. Geodesic Spines, for the
        Buckminster Fuller register. Swept Sinuous, PCB Trace, Gear,
        Skull SDF, Wing Venation, Reaction-Diffusion (the Turing
        drawer), Tensegrity, Torus Knot, Step Fret, Interlace, Mon
        (the Japanese family crest grammar), Clash Compositor,
        Non-Euclidean, Spinodal, Ribbon Helix, L-System Tube. Each
        one a small classed object on disk, each one capable of
        producing a family of forms from a handful of parameters and
        a seed.
      </p>

      <p>
        The cabinet grows. When a commission asks for something the
        existing thirty drawers cannot deliver, the studio writes a
        new drawer rather than abandoning the commission to a manual
        sculpt. The cabinet is the practice; the drawers are the
        commitments the practice has accumulated.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the operator does
      </h2>
      <p>
        A commission lands on the bench as a brief: the size budget,
        the material (clear / tinted / resin + bronze), the wear mode
        (always-on / breathe / pulse / off), the wearer&rsquo;s
        ergonomic constraints, the optional reference object or
        photograph. The operator reads the brief and opens the
        cabinet at the drawers the brief points toward. A
        commission for a centred, radial, single-stone-scale pendant
        opens Spiral, Fermat, and Sigil. A commission for an open
        lattice that catches ambient light opens Gyroid, Diatom Hex,
        and Wigner-Seitz. A commission for an unbroken weave with
        crossings opens Celtic Knot, Interlace, and Mon.
      </p>
      <p>
        Each drawer, once opened, produces twelve candidates in a
        grid. The operator scans the grid, marks the candidates that
        carry the brief, and reseeds the drawer to produce twelve
        more variations on the marked ones. Three or four cycles of
        this and the cabinet has narrowed the commission to a small
        family of forms the operator wants to take to the bezel
        stage.
      </p>
      <p>
        The bezel stage is where the chain attachment, the LED root,
        the magnetic-pogo charging contact, and the optical
        waveguide network get fitted to the algorithmic body. The
        atelier has a dedicated module for this &mdash; the bail
        injector &mdash; that takes the algorithmic output and adds
        the structural and electrical parts the algorithm did not
        know about. The bail injector reads the form, finds the
        appropriate attachment points, and fits the metal and the
        LED root without disturbing the algorithm&rsquo;s contour.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The fitness score
      </h2>
      <p>
        The studio runs an aesthetic scorer over every candidate the
        cabinet produces. It is not the operator&rsquo;s judgement
        &mdash; the operator is the final arbiter &mdash; but it
        works as a triage filter. The scorer reads the candidate&rsquo;s
        proportion, the distribution of mass around the wearer&rsquo;s
        bezel point, the optical path length from the LED root to the
        candidate&rsquo;s furthest point, and the surface area
        available to the waveguide network. Candidates that fall
        below a threshold on any axis are removed from the grid
        before the operator sees them. The scorer earns its keep on
        the busier drawers (DLA, Reaction-Diffusion, L-System) where
        the algorithm produces many candidates the wearer cannot
        wear.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why the cabinet is named in public
      </h2>
      <p>
        The atelier exists. The pendant lands on the wearer&rsquo;s
        body as a finished object, but the route the object took to
        get there is itself a kind of work, and the studio&rsquo;s
        practice is to name the route. The cabinet is named in
        public for the same reason the bench is named in public on{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>{" "}
        and the practice is named in eight threads on{" "}
        <Link href="/articles/the-practice-in-eight-threads" className={ext}>
          The Practice in Eight Threads
        </Link>
        . The reader who asks where the pendants come from now has
        an answer. The cabinet is the answer.
      </p>
      <p>
        The buyer commissioning a piece is not commissioning a hand-
        sculpted form; they are commissioning a parameter set on an
        algorithm the atelier already knows. The result is uniquely
        theirs &mdash; their brief, their seed, their bezel point,
        their material &mdash; and the algorithmic family is the
        atelier&rsquo;s. A commission is therefore a small
        collaboration between the buyer and a particular drawer in
        the cabinet. The studio&rsquo;s job, every time, is to read
        the brief well enough to open the right drawer first.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-jewellery-algorithms",
    title: "The Jewellery Algorithms",
    date: "2026-05-15",
    kind: "article",
    excerpt:
      "Behind the pendant line is the atelier — a cabinet of thirty algorithmic drawers, each named after the structure it produces. Spiral, Gyroid, Voronoi, Penrose, Celtic Knot, Diatom Hex, Wigner-Seitz, Enneper, Sigil, L-System and twenty more. A commission opens a drawer; the cabinet does the form-finding.",
    Body: TheJewelleryAlgorithms,
    related: [
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — The Same Trace, Wearable",
        note: "The product side of the pendant line. The article this one sits behind.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The sculpture-scale cousin of the atelier — same generator-plus-operator logic, larger objects.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The optical companion. Why the pieces from the cabinet glow without dye.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The architectural frame the atelier sits inside. Layer four is the breeding engine; the atelier is its wearable scale.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows from the Inside",
        note: "The total-internal-reflection physics behind every piece the cabinet outputs.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "Where the atelier physically lives — the same workstation, the same SLA printer, the same six square metres.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "The atelier's tools listed dispassionately on the studio's stack page.",
      },
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The closed circuit the atelier sits inside. Commission to seed to algorithm to candidate to bezel to print.",
      },
      {
        href: "/atelier/algorithms",
        label: "The algorithm cabinet",
        note: "The thirty drawers as a browsable index. Live R3F preview on the ported subset; catalogue entry for the rest.",
      },
      {
        href: "/atelier/algorithms/spiral",
        label: "Algorithm — Spiral",
        note: "The logarithmic / Fermat spiral drawer. Live preview with seed, complexity, density sliders.",
      },
      {
        href: "/atelier/algorithms/gyroid",
        label: "Algorithm — Gyroid",
        note: "Schoen&rsquo;s 1970 triply-periodic minimal surface, sampled as a height-field patch. The diffuse-glow drawer.",
      },
      {
        href: "/atelier/algorithms/celtic-knot",
        label: "Algorithm — Celtic Knot",
        note: "Multi-strand torus-braid with Z-oscillation. The Irish-monastic idiom formalised.",
      },
      {
        href: "/atelier/algorithms/penrose-tiling",
        label: "Algorithm — Penrose Tiling",
        note: "The aperiodic two-tile rhombus deflation. Catalogue entry; runnable source queued.",
      },
      {
        href: "/atelier/algorithms/diatom-hex",
        label: "Algorithm — Diatom Hex",
        note: "The hexagonal-pore frustule pattern. Catalogue entry; runnable source queued.",
      },
      {
        href: "/atelier/evolution",
        label: "The evolution suite",
        note: "Fourteen stations the breeding engine threads the algorithm cabinet through. The cabinet supplies the generators; the suite supplies the lineage.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Voronoi_diagram",
        label: "Voronoi diagram — Wikipedia",
        note: "The boundary-network drawer. Drop seeds, draw the regions of nearest-point assignment.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Penrose_tiling",
        label: "Penrose tiling — Wikipedia",
        note: "The aperiodic-lattice drawer. Two rhombi, a fivefold symmetry, no repeats.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gyroid",
        label: "Gyroid — Wikipedia",
        note: "The triply periodic minimal surface Alan Schoen described in 1970. The cabinet's diffuse-glow drawer.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Wigner%E2%80%93Seitz_cell",
        label: "Wigner-Seitz cell — Wikipedia",
        note: "The primitive-cell-of-a-lattice drawer. A gemstone-cut surface derived from solid-state physics.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Celtic_knot",
        label: "Celtic knot — Wikipedia",
        note: "The unbroken-weave family. Triquetra, plait, Book of Kells initials.",
      },
      {
        href: "https://en.wikipedia.org/wiki/L-system",
        label: "L-system — Wikipedia",
        note: "Aristid Lindenmayer's 1968 formal grammar for branching growth. The botanical drawer.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diffusion-limited_aggregation",
        label: "Diffusion-limited aggregation — Wikipedia",
        note: "The crystalline-branching drawer. Frost on glass, lichen on stone, the dendrite under the microscope.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Enneper_surface",
        label: "Enneper surface — Wikipedia",
        note: "Alfred Enneper's 1864 self-intersecting minimal surface. The fold-back-on-itself drawer.",
      },
    ],
  };
