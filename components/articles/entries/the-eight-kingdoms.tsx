import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheEightKingdoms() {
  return (
    <>
      <p>
        The atelier in{" "}
        <Link href="/articles/the-jewellery-algorithms" className={ext}>
          The Jewellery Algorithms
        </Link>{" "}
        has a cabinet with thirty drawers. The drawers are the
        generators &mdash; each one knows how to produce a family of
        forms from a seed and a handful of parameters. This article
        names the room behind the cabinet. The drawers do not sit in
        empty space; they sit in eight rooms, and each room is a
        way-of-looking. The studio calls them kingdoms. Eight
        kingdoms, thirty drawers, twenty-eight-letter alphabet under
        every drawer. The taxonomy goes top to bottom; this article
        starts at the top.
      </p>
      <p>
        A kingdom is a register of form-finding. It is the family
        resemblance a sculpture inherits before the parameters even
        get sampled. Two pieces from different kingdoms can use the
        same drawer &mdash; the L-System grammar, say &mdash; and
        come out looking like they belong to different practices. A
        biomechanical L-system grows like sinew; a thermal one
        creases like origami; an assemblage one stacks like a Louise
        Nevelson wall. Same maths, different room.
      </p>
      <p>
        The studio commits to these eight rooms the way the AR-game
        proving ground at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        commits to four poi modes. A small, complete vocabulary the
        studio refuses to abandon for novelty&rsquo;s sake. Eight is
        enough for the breeding engine to find the work; eight is
        small enough that the operator can hold the whole shape of
        the design space in one head at one time. The kingdoms are
        named in code at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          src/lib/evolution/kingdoms/index.ts
        </code>{" "}
        and the breeding engine reaches for one of them every time a
        new sculpture starts as a seed on the workstation.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom A &mdash; Techno-Industrial
      </h2>
      <p>
        Geometric precision, grown not built. The Techno-Industrial
        register reads as something an engineer left on the bench
        and a generator finished overnight. Crystals, Voronoi
        partitions, phyllotactic arrays at the densities that
        produce sunflower-head packing rather than wandering spirals.
        The kingdom commits to{" "}
        <a
          href="https://en.wikipedia.org/wiki/Crystal_system"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          crystal-system rigour{arrow}
        </a>{" "}
        &mdash; lattice constants, repeat units, well-defined
        symmetry groups. Pieces in this register sit comfortably in
        a Bauhaus interior, a brutalist concrete shelf, an industrial
        loft with exposed steel. The phyllotaxis brush, the crystal
        brush, the Voronoi brush carry most of the kingdom&rsquo;s
        weight in code.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom B &mdash; Expressive / Flow
      </h2>
      <p>
        Pure form, motion frozen in material. The Expressive register
        is what most readers think the studio looks like before they
        know the studio better. Vine-like curls, murmuration
        densities, feathered edges. Pieces in this register read as
        gestural &mdash; the trace of a hand left in resin, the
        smear of a long exposure made solid. The brushes are vine,
        murmuration, feather. The wall pieces in this kingdom are
        the easy sells for a domestic interior because the eye reads
        them as movement rather than as architecture; nobody&rsquo;s
        kitchen wants brutalist concrete; everybody&rsquo;s kitchen
        wants a wave.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom C &mdash; Motion / Dance
      </h2>
      <p>
        Kinetic memory &mdash; the body&rsquo;s arc made solid. The
        Motion kingdom is the studio&rsquo;s most direct expression
        of the practice that funds it. Pieces in this register
        descend from a captured poi path, a long exposure, a Laban
        score. The brushes carry the bias: Lorenz attractors for the
        deterministic-but-unpredictable curves of trained movement;
        murmuration for the swarm-shape of a phrase; comet brushes
        for the velocity-tapered trail of a single accelerating
        gesture. This is the kingdom most directly fed by the
        kinematic-extraction stage of the convergence pipeline
        &mdash; the curvature, velocity, and angular-acceleration
        derived from a real body land in this room before they land
        anywhere else.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom D &mdash; Biomechanical
      </h2>
      <p>
        Organic machinery &mdash; sinew meets circuit. The
        Biomechanical kingdom is where{" "}
        <a
          href="https://en.wikipedia.org/wiki/Biomimicry"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          biomimicry{arrow}
        </a>{" "}
        becomes the design rule. Coral structures, mycelium
        networks, DNA-style double helices, vascular branching that
        obeys{" "}
        <a
          href="https://en.wikipedia.org/wiki/Murray%27s_law"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Murray&rsquo;s Law{arrow}
        </a>{" "}
        in the radii of its tubes. Pieces in this kingdom carry the
        engineering vocabulary of the body &mdash; tubes, joints,
        branching minimisations &mdash; without representing any
        particular organism. They sit on the bench the way a piece
        of weather-bleached driftwood does; the eye reads them as
        something that once carried water or blood. The brushes are
        coral, mycelium, dna. Many of the pendants from{" "}
        <Link href="/articles/jewellery-the-same-trace-wearable" className={ext}>
          Jewellery &mdash; The Same Trace, Wearable
        </Link>{" "}
        land here.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom E &mdash; Origami / 4D Thermal
      </h2>
      <p>
        Crease logic &mdash; geometry that remembers heat. The
        Thermal kingdom commits to a different physical premise:
        these pieces look like they were folded rather than grown.
        Origami-style creases. Reaction-diffusion fields whose
        boundaries read as creases rather than as veins. Barnsley
        fern fractals iterated until the underlying rule is hidden
        inside the leafy mass. The name 4D Thermal comes from the
        printable property the studio is most interested in within
        this register: shape-memory polymers and bistable mechanisms
        that hold one form at room temperature and another after
        gentle heating. Pieces in this kingdom can be designed to
        move once, slowly, and stay where they end up. The brushes
        are phyllotaxis, reaction_diffusion, barnsley.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom F &mdash; Kinetic Mesh / PIP (Protean)
      </h2>
      <p>
        Found objects recombined &mdash; chaos with intent. The
        Protean kingdom is the studio&rsquo;s honest acknowledgement
        that some pieces refuse to belong to a clean family. PIP is
        the bench shorthand for &ldquo;parts in pile&rdquo;: a
        sculpture composed of fragments from other kingdoms,
        recomposed by Voronoi partitions, by reaction-diffusion
        boundaries, by Lorenz-attractor advection of the fragments
        through a velocity field. Pieces in this kingdom resist a
        clean taxonomic call. The brushes overlap with every other
        kingdom because the operation is recombination rather than
        single-family generation. The Protean kingdom is the
        kingdom that earns the cabinet, because without it the
        cabinet would have to refuse work that resists a single
        family &mdash; and the bench would rather take the
        commission and admit the kingdom is messy than refuse it
        for taxonomic neatness.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom G &mdash; Assemblage (Nevelson / LeWitt)
      </h2>
      <p>
        Accumulation as composition &mdash; the sum is the art.
        Where the Protean kingdom recombines, the Assemblage
        kingdom stacks. Louise Nevelson&rsquo;s monochrome wood
        constructions and Sol LeWitt&rsquo;s modular cube
        progressions are the named ancestors. Pieces in this
        kingdom read as walls &mdash; gridded, modular, the whole
        bigger than the sum of any single cell. Crystal lattices at
        macro scale; Voronoi cells used as compositional units
        rather than as boundaries; neural-net-aesthetic grids that
        carry the visual register of large-scale generative work
        without imitating any specific image. The kingdom is the
        natural home for the studio&rsquo;s wall-relief work
        described in{" "}
        <Link href="/articles/belt-printed-wall-reliefs" className={ext}>
          Belt-Printed Wall Reliefs
        </Link>
        ; many of those pieces inherit assemblage as their kingdom
        and the cabinet&rsquo;s drawers as their cells.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom H &mdash; Curvilinear (Kapoor / Reflective)
      </h2>
      <p>
        Infinite interior &mdash; surfaces that swallow light.
        Anish Kapoor&rsquo;s polished concavities and the slime-mould
        smoothness of an organism that finds the shortest path
        between food sources. The Curvilinear kingdom commits to
        unbroken, optically continuous surfaces. The brushes are
        slime_mold, murmuration, hull_manifold. Pieces in this
        kingdom read as objects you cannot quite see the back of
        even when you walk around them &mdash; the surface
        continuity confuses the eye&rsquo;s attempt to map the
        boundary. This is the kingdom most aligned with the
        studio&rsquo;s caustic-projection work, where a polished
        curved surface acts as a lens; pieces in this register
        often carry the work named in{" "}
        <Link
          href="/articles/why-the-pendant-glows-from-the-inside"
          className={ext}
        >
          Why the Pendant Glows from the Inside
        </Link>{" "}
        as their optical strategy.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The 28-letter alphabet under the kingdoms
      </h2>
      <p>
        Underneath the eight kingdoms sits a vocabulary of
        twenty-eight floating-point genes plus a type tag. The full
        list is documented in source at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          apps/prototypes/poi-sculptor/docs/EVOLUTION_ENGINE.md
        </code>{" "}
        and the breeding-engine companion piece{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          How the Studio Breeds Sculptures
        </Link>{" "}
        is the operational walk-through of how the alphabet gets
        crossed and mutated through generations. The twenty-eight
        genes split into four groups &mdash; twelve form, eight
        material, four optics, four waveguide &mdash; and every
        sculpture leaves the bench describable as a single line of
        JSON.
      </p>
      <p>
        Naming a handful of the most striking, with their physical
        ranges in brackets, to give the reader a feel for the
        alphabet without enumerating all of it:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>twist</strong> (0&deg; to 720&deg;) &mdash; how
          many degrees of helical twist the sculpture carries from
          base to top. A zero is an upright vase; a 360 is one full
          spiral turn; a 720 is the kind of double-spiral pendant
          the curvilinear kingdom likes.
        </li>
        <li>
          <strong>cell_density</strong> (0.1 to 0.9) &mdash; the
          internal-structure density. Low values are open lattices
          you can see straight through; high values approach a
          solid body. The biomimetic kingdoms tend to live in the
          middle band.
        </li>
        <li>
          <strong>ior</strong> (1.45 to 1.65) &mdash; the
          refractive-index mapping. The lower end is standard clear
          resin behaving like crown glass; the higher end is
          flint-glass-like, with stronger refraction and a brighter
          internal glow.
        </li>
        <li>
          <strong>grating_pitch</strong> (38 micrometres to 500
          micrometres) &mdash; the diffraction-grating spacing on
          the ctenophore-type surfaces. The lower end is the
          printer&rsquo;s XY resolution at the limit; the higher
          end is coarse enough that the diffraction angles are
          visible without grazing incidence.
        </li>
        <li>
          <strong>murray_exponent</strong> (0.25 to 0.45) &mdash;
          how aggressively the waveguide network branches under
          Murray&rsquo;s Law. Lower is more egalitarian branching;
          higher concentrates flow through fewer trunk channels.
        </li>
        <li>
          <strong>noise_amplitude</strong> (0 to 5 mm) and{" "}
          <strong>noise_frequency</strong> (1 to 20 octaves)
          &mdash; surface-noise pair. Together they decide whether
          the piece reads as a smooth polished body or as a rough
          weathered one. The thermal and biomimetic kingdoms tend
          to push frequency high and amplitude low; the assemblage
          kingdom does the opposite.
        </li>
        <li>
          <strong>tube_radius</strong> (0.5 mm to 3 mm) and{" "}
          <strong>tube_smoothness</strong> (frosted to polished)
          &mdash; the waveguide-tube pair. Decides how much light
          enters the channel network and how much escapes through
          surface scatter on the way through.
        </li>
      </ul>
      <p>
        That is seven of the twenty-eight genes named with their
        ranges. The remainder include aspect ratio, taper, wall
        thickness, symmetry, branching probability, transmission,
        roughness, subsurface scattering, emission, RGB tint
        channels, grating depth, channel-volume ratio,
        whispering-gallery escape-feature density, and a small
        family of structural genes governing closure, vertical
        element count, and similar. The full alphabet lives in code
        and the breeding engine walks through it gene by gene every
        time it produces a child.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why eight, and not five, and not fifty
      </h2>
      <p>
        The number eight is a commitment, not a derivation. Five
        would feel underpopulated &mdash; the design space the
        studio works in needs more rooms than five for the breeding
        engine to find work that surprises the operator. Fifty
        would be unmanageable; the operator would have to navigate
        a taxonomy rather than work inside one. Eight is the size
        at which the operator can call a kingdom by name on first
        sight of a candidate, and at which the breeding engine has
        enough headroom to explore inside a single room over twenty
        or thirty generations without exhausting the room. The same
        logic governs the AR game&rsquo;s commitment to four poi
        modes at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        and the cabinet&rsquo;s commitment to thirty drawers at{" "}
        <Link
          href="/articles/the-jewellery-algorithms"
          className={ext}
        >
          The Jewellery Algorithms
        </Link>
        : a small, complete vocabulary the studio commits to rather
        than chasing every possible form.
      </p>
      <p>
        Each kingdom has a high-gene profile &mdash; the values of
        the twenty-eight genes that, on average, produce work the
        operator recognises as belonging to that kingdom &mdash;
        and a fertile cross-pairing. The cross-pairings are the
        bench&rsquo;s working knowledge of which kingdoms breed
        well together. Biomechanical crossed with Curvilinear
        produces pendants that read as smooth organs. Thermal
        crossed with Assemblage produces wall pieces that read as
        folded panels. Techno-Industrial crossed with Motion
        produces the studio&rsquo;s most recognisable signature
        &mdash; the precise geometric vocabulary of the first
        kingdom carrying the gestural curve of the third.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The kingdoms as a module of the practice
      </h2>
      <p>
        The studio is{" "}
        <Link href="/articles/why-i-build-modular" className={ext}>
          modular at small scale
        </Link>
        . Each kingdom is a module. The bench breeds within a
        single kingdom when the commission asks for a coherent
        family; the bench crosses kingdoms when the commission
        asks for something the cabinet can answer only by
        recombining rooms. The architecture is the same as every
        other module on the bench: a spine of long-lived interfaces
        (the twenty-eight-letter alphabet, the breeding-engine
        operators) with eight modules (the kingdoms) that clip on
        and off without breaking the spine. Adding a ninth kingdom
        is possible in principle; the studio has not needed one
        yet. The cabinet has thirty drawers because the cabinet
        has accumulated thirty commitments; the eight kingdoms
        exist because eight is what the practice has needed.
      </p>
      <p>
        Eight kingdoms, thirty drawers, twenty-eight letters. The
        taxonomy goes top to bottom: a commission picks a kingdom,
        the kingdom opens its likely drawers, the drawer samples a
        seed against the alphabet, the alphabet parameterises the
        form. Four levels of refinement and the candidate is on
        the bench for the operator to score. The breeding engine
        works the same way at every level. That is the practice.
        The cabinet is named in public; the rooms are named in
        public; the alphabet is named in public. Now the practice
        is named end to end, and a reader who wants to commission
        a piece knows the vocabulary the studio will reach for to
        find it.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-eight-kingdoms",
    title: "The Eight Kingdoms",
    date: "2026-05-16",
    kind: "article",
    excerpt:
      "Behind the thirty drawers of the jewellery atelier sit eight rooms — the aesthetic kingdoms the breeding engine works inside. Techno-Industrial, Expressive, Motion, Biomechanical, Thermal, Protean, Assemblage, Curvilinear. Each room is a register of form-finding; underneath all eight sits the twenty-eight-letter genetic alphabet the studio breeds with.",
    Body: TheEightKingdoms,
    related: [
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The genetic-algorithm cousin. The breeding loop that walks the 28-letter alphabet through generations; this article names the eight rooms the loop runs inside.",
      },
      {
        href: "/articles/the-jewellery-algorithms",
        label: "The Jewellery Algorithms",
        note: "The atelier and its thirty drawers. The kingdoms are the rooms the drawers sit in; the drawers are the generators; the alphabet is what the generators sample from.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The architectural frame the kingdoms sit inside. Layer four is the breeding engine; this article is the taxonomy underneath it.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The optical layer the kingdoms inherit. Several kingdoms — Biomechanical, Curvilinear, Thermal — commit to specific optical strategies inside their family resemblance.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows from the Inside",
        note: "The total-internal-reflection physics the Curvilinear and Biomechanical kingdoms rely on. The mechanism behind the optical commitment of two whole rooms.",
      },
      {
        href: "/articles/morphing-things-together",
        label: "Morphing Things Together",
        note: "The unifying operation across substrates. Crossing kingdoms is a morph; the gene-vector crossover is the same operation as the LED-wall morph and the choreography drift.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "The philosophical companion. Eight threads in the practice, eight kingdoms in the cabinet — the same commitment to a small complete vocabulary.",
      },
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The closed circuit the kingdoms sit inside. Body to light to capture to reified object; every kingdom shapes the reified-object step.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "The bench inventory the kingdoms live on. The breeding engine and its workstation listed dispassionately.",
      },
      {
        href: "/atelier/evolution",
        label: "The evolution suite",
        note: "The fourteen-station architecture that sorts specimens into kingdoms. The taxonomy lives in the prose; the operations live in the suite.",
      },
      {
        href: "/atelier#meshes",
        label: "Atelier — Meshes",
        note: "Sample meshes from every kingdom. Two per kingdom across early and late generations of the breeding engine&rsquo;s evolution renders.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Biomimicry",
        label: "Biomimicry — Wikipedia",
        note: "The design principle behind the Biomechanical kingdom. Borrowing structural strategies from biology because the biology has run the optimisation already.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Taxonomy_(biology)",
        label: "Taxonomy (biology) — Wikipedia",
        note: "The classification system the kingdom vocabulary borrows from. Kingdom as a top-level category, narrowing downward through finer family resemblances.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Pattern_formation",
        label: "Pattern formation — Wikipedia",
        note: "The mathematical field underneath several kingdoms — reaction-diffusion in Thermal, phyllotaxis in Techno-Industrial, branching in Biomechanical.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Aesthetics",
        label: "Aesthetics — Wikipedia",
        note: "The philosophical field the kingdoms commit to. Each kingdom is an aesthetic register the studio inhabits rather than every register at once.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Cladistics",
        label: "Cladistics — Wikipedia",
        note: "The taxonomic method of grouping by shared derived characters. The kingdom model is cladistic in spirit — siblings within a kingdom share a high-gene profile.",
      },
      {
        href: "https://en.wikipedia.org/wiki/L-system",
        label: "L-system — Wikipedia",
        note: "Aristid Lindenmayer's grammar for branching growth. Used by drawers in multiple kingdoms — the same generator, different rooms.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diatom",
        label: "Diatom — Wikipedia",
        note: "The marine algae whose silicate lattices inform the Biomechanical kingdom. Nature's hexagonal-lattice waveguide; the studio uses its grammar.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Genetic_algorithm",
        label: "Genetic algorithm — Wikipedia",
        note: "The optimisation method the breeding engine implements. The kingdoms set the high-gene profiles the genetic algorithm explores around.",
      },
    ],
  };
