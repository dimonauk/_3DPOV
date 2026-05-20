export default function BiomimeticsAndBiomimicry() {
  return (
    <>
      <p>
        Two words that mostly get used as synonyms, and shouldn&rsquo;t.{" "}
        <strong>Biomimetic</strong> work copies a biological{" "}
        <em>form</em> &mdash; the shape of the gecko foot, the geometry
        of the lotus leaf, the cross-section of the shark denticle.{" "}
        <strong>Biomimicry</strong>, as Janine Benyus framed it in{" "}
        <em>Biomimicry: Innovation Inspired by Nature</em> (1997), copies
        a biological <em>strategy</em> &mdash; the process by which an
        organism solves a problem, including its energy budget, its
        material cycle, its embedding in an ecosystem.{" "}
        <strong>Bioinspired</strong> is the loosest of the three: the
        finished thing reminds you of biology, but the lineage is
        decorative rather than analytical. The studio uses all three,
        and tries to be honest about which.<sup>1</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />

      <h2 className="text-2xl font-serif text-chrome-100">
        Part 1 &mdash; The foundational principles
      </h2>

      <p>
        <strong>The three levels of biomimicry.</strong> Benyus
        separates the practice into three levels, each strictly
        contained in the next. <em>Form</em> is the silhouette &mdash;
        a fin-shaped propeller, a hexagonal honeycomb panel, a gyroid
        infill borrowed from butterfly scales.{" "}
        <em>Process</em> is the manufacturing rule &mdash; how does the
        spider extrude silk at body temperature in water rather than
        spinning it at four hundred degrees in solvent?{" "}
        <em>Ecosystem</em> is the systems-level fit &mdash; does the
        thing close its loop, feed the next thing, decompose without
        residue? Most engineering that calls itself biomimetic stops at
        form. The interesting and harder work happens at the other two
        levels.<sup>2</sup>
      </p>

      <p>
        <strong>Why evolution is an effective design search.</strong>{" "}
        Treat the genome of a species as a point in design-space and
        natural selection as a stochastic optimiser. Three properties
        make the optimiser unusually effective. First, the timescale is
        long &mdash; hundreds of millions of years of continuous
        iteration on the same body plan, against shifting fitness
        criteria. Second, the fitness function is ruthless &mdash; if
        the design loses against a predator, against the cold, against
        the next generation, it does not get to iterate. Third, the
        process is massively parallel &mdash; every individual is a
        proposed solution, evaluated simultaneously against the same
        environment. A modern genetic algorithm running on a GPU can
        evaluate tens of thousands of candidates per second, which
        sounds fast until you realise the planet has been running the
        same algorithm at population scales of trillions, in continuous
        wall-clock time, since the Cambrian. Biology is not
        intelligent design; it is a search that has had a very long
        time to converge.<sup>3</sup>
      </p>

      <p>
        <strong>When biomimicry fails.</strong> The unromantic
        observation that grounds the rest of this entry: copying biology
        is not automatic engineering wisdom. Three failure modes recur.
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Scale mismatch.</strong> Insect wings work because
          they exploit unsteady aerodynamic effects (leading-edge
          vortices, clap-and-fling) that only operate at low Reynolds
          number. Scale a dragonfly up to wingspan of an A380 and the
          physics changes regime entirely; the geometry no longer
          flies. The early-twentieth-century history of ornithopter
          aeronautics is largely the history of this lesson being
          relearned.
        </li>
        <li>
          <strong>Context mismatch.</strong> The shark denticle
          reduces drag in seawater at swimming speeds. Stuck onto an
          airliner&rsquo;s skin at cruise it does something different,
          and on some surface treatments worse. The geometry encodes
          assumptions about its medium that don&rsquo;t travel with the
          shape.
        </li>
        <li>
          <strong>Naive form-copying without function.</strong> A
          building shaped like a termite mound is not necessarily
          ventilated like one; the airflow of the Eastgate Centre in
          Harare works because the architects studied{" "}
          <em>the air paths</em> termites build, not the silhouette.
          Pick the wrong abstraction and you get architecture-as-zoo
          rather than biomimicry.
        </li>
      </ul>
      <p>
        The corollary, which the rest of this entry leans on heavily:
        biomimicry done well asks <em>which problem is the organism
        solving?</em> first, and <em>what does it look like?</em>{" "}
        second.<sup>4</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />

      <h2 className="text-2xl font-serif text-chrome-100">
        Part 2 &mdash; Canonical case studies
      </h2>

      <p>
        Each of the following is a well-attested transfer from a
        biological system to engineered product. The studio cares
        about them because each one maps onto a current or planned
        capability in Holoflow&rsquo;s bench, named in the right-hand
        column of each.
      </p>

      <ul className="ml-6 list-disc space-y-3">
        <li>
          <strong>Lotus effect &rarr; hydrophobic coatings &rarr; resin
          surface treatment.</strong> Barthlott and Neinhuis&rsquo;s
          1997 paper in <em>Planta</em>, &ldquo;The Purity of the
          Sacred Lotus,&rdquo; identified that the leaf of{" "}
          <em>Nelumbo nucifera</em> stays clean not by being smooth but
          by being micro-rough: papillae of around ten micrometres,
          themselves covered in epicuticular wax crystals at the
          hundred-nanometre scale. Water beads at contact angles above
          a hundred and fifty degrees and rolls off, lifting dirt with
          it. The pattern transferred into hydrophobic coatings
          (StoCoat Lotusan and many that followed) and into the
          self-cleaning resin coatings the studio uses on outdoor
          waveguide pieces.
        </li>
        <li>
          <strong>Gecko adhesion &rarr; dry van der Waals adhesives
          &rarr; AR card mounting.</strong> The gecko&rsquo;s toe-pad
          carries millions of setae, each branching into hundreds of
          spatula-tipped nano-fibres. The aggregate van der Waals force
          across all those contact points lets the animal hang from a
          wet ceiling without glue. Andre Geim&rsquo;s 2003 gecko-tape
          paper and Mark Cutkosky&rsquo;s Stickybot at Stanford turned
          the geometry into directional dry adhesives. The studio uses
          a commercial gecko-tape variant on the back of the AR-card
          line: cards re-mount cleanly after handling without
          residue.<sup>5</sup>
        </li>
        <li>
          <strong>Burdock &rarr; Velcro &rarr; fastening systems.</strong>{" "}
          Georges de Mestral, walking his dog in 1941, examined the
          burs his dog kept collecting under the microscope and noticed
          the hook-and-loop geometry. The patent was granted in 1955.
          The relevant point isn&rsquo;t the success of Velcro &mdash;
          it&rsquo;s that the entire transfer took fourteen years and
          required de Mestral to first <em>look at the bur</em>{" "}
          properly. This is the operational habit biomimicry asks for:
          take the organism apart with intent.
        </li>
        <li>
          <strong>Whale tubercles &rarr; turbine efficiency &rarr; FPV
          drone propellers.</strong> The leading edge of the humpback
          flipper is scalloped with tubercles. Frank Fish&rsquo;s 2004
          and 2011 papers showed that the bumps delay flow separation
          and broaden the stall envelope. WhalePower and Lumify both
          commercialised tubercle-edged wind-turbine blades and, more
          recently, drone propellers with serrated leading edges. The
          studio&rsquo;s FPV practice borrows the same idea: scalloped
          propeller edges trade a touch of peak efficiency for
          dramatically quieter and more stable behaviour at high
          angles of attack.
        </li>
        <li>
          <strong>Mantis-shrimp eye &rarr; polarisation-aware cameras
          &rarr; the Mantispol project.</strong> The stomatopod
          compound eye is the most sophisticated optical instrument in
          biology &mdash; sixteen photoreceptor types, dynamic
          polarisation sensing, trinocular vision in a single eye. The
          design has been mined for everything from cancer-imaging
          polarimeters (Viktor Gruev&rsquo;s lab at Illinois) to the
          studio&rsquo;s in-progress Mantispol capture rig, which uses
          a polarisation-aware sensor to separate specular highlights
          from diffuse colour during gaussian-splat capture of
          resin pieces.
        </li>
        <li>
          <strong>Cephalopod skin &rarr; adaptive camouflage &rarr; e-ink
          and iridescent materials.</strong> Octopuses, cuttlefish, and
          squid restructure their skin in milliseconds by combining
          chromatophore expansion (pigment), iridophore tuning
          (structural colour), and papillae erection (texture). The
          studio&rsquo;s interest is one stack down: the iridophores
          themselves are Bragg reflectors built from stacked thin films
          of reflectin protein. Synthetic thin-film iridescence on
          resin surfaces uses the same physics and gets the same
          angle-dependent colour shifts.
        </li>
        <li>
          <strong>Bone trabeculae &rarr; topology-optimised lattices
          &rarr; TPMS sculpture lattices.</strong> The interior of long
          bones is a graded lattice that places material along
          principal stress directions and leaves the rest empty.
          Topology optimisation, formalised by Bends&oslash;e and
          Sigmund in the 1990s, is the engineering version: solve for
          the material distribution that minimises compliance under a
          load budget. The studio&rsquo;s gyroid and Schwarz-P
          sculpture lattices are an aesthetic relative &mdash; the
          structures don&rsquo;t carry real load, but they read as
          honest because the underlying mathematics is the same as
          bone&rsquo;s. See{" "}
          <a
            href="/codex/gyroid-surfaces"
            className="text-pink-200 underline underline-offset-4"
          >
            gyroid surfaces
          </a>
          {" "}for the implicit equations.
        </li>
        <li>
          <strong>Spider silk &rarr; high-strength polymers &rarr; resin
          material exploration.</strong> Dragline silk has the
          strength-to-weight of high-tensile steel and the toughness of
          Kevlar, and the spider extrudes it from a water-based dope at
          body temperature. Bolt Threads, AMSilk, and Spiber have all
          chased synthetic versions for nearly two decades; none yet
          match the natural material. The studio cares about the
          process question more than the polymer: how do you get a
          high-performance material out of a low-energy process? The
          bench answer remains the printers we have, but the question
          governs how we evaluate every new resin.
        </li>
        <li>
          <strong>Bird flocking (boids) &rarr; swarm choreography
          &rarr; drone light-painting.</strong> Craig Reynolds&rsquo;
          1987 boids paper distilled the apparent intelligence of
          starling murmurations into three local rules: separation,
          alignment, cohesion. The studio&rsquo;s drone-choreography
          work in Skybrush uses the same family of local rules to
          generate flockable swarms with collision avoidance baked in,
          then overlays scripted formations as global attractors. The
          biomimetic insight is procedural, not formal: flock geometry
          is not stored in a table, it emerges from rules each
          individual runs.
        </li>
      </ul>

      <p>
        Three of those cases sit at the form level (lotus, gecko,
        burdock), three at the form-plus-process level (tubercles,
        cephalopod, bone), and three reach for process or ecosystem
        (mantis-shrimp imaging, spider silk, boids). Notice how the
        ambition rises with the cost of the abstraction.
      </p>

      <hr className="my-12 border-warm-black-800" />

      <h2 className="text-2xl font-serif text-chrome-100">
        Part 3 &mdash; The eight kingdoms in light of biomimicry
      </h2>

      <p>
        Holoflow&rsquo;s sculpture taxonomy (see the synthesis note on
        the 28-gene alphabet) carves output into eight kingdoms:
        choreographic, curvilinear, biomech, techno, assemblage,
        artistic, architectural, ritual. Each kingdom is a probability
        bias profile over the genome &mdash; not a hard category but a
        weighting. Asking which kingdoms are <em>biomimetic</em> turns
        out to be a useful sieve.
      </p>

      <table className="my-6 w-full text-sm text-chrome-200">
        <thead>
          <tr className="border-b border-warm-black-800 text-left">
            <th className="py-2 pr-4">Kingdom</th>
            <th className="py-2 pr-4">Biomimetic in shape</th>
            <th className="py-2 pr-4">Biomimetic in process</th>
            <th className="py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">choreographic</td>
            <td className="py-2 pr-4">low</td>
            <td className="py-2 pr-4">high</td>
            <td className="py-2">
              The frozen residue of a body in motion &mdash; the
              process is biological by definition; the shape only as
              far as the body is a body.
            </td>
          </tr>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">curvilinear</td>
            <td className="py-2 pr-4">high</td>
            <td className="py-2 pr-4">medium</td>
            <td className="py-2">
              Gyroid, Schwarz-P, reaction-diffusion textures. Form
              borrowed directly from organisms; the surface-tension
              physics underneath is the same as in the soap film and
              the cell membrane.
            </td>
          </tr>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">biomech</td>
            <td className="py-2 pr-4">very high</td>
            <td className="py-2 pr-4">high</td>
            <td className="py-2">
              The most explicitly biomimetic kingdom &mdash; bone
              trabeculae, vertebra silhouettes, spinal column
              motifs. Both form and the topology-optimisation
              process are mined from biology.
            </td>
          </tr>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">techno</td>
            <td className="py-2 pr-4">low</td>
            <td className="py-2 pr-4">low</td>
            <td className="py-2">
              Crystalline, repeating, machined-looking. The
              anti-biomimetic kingdom &mdash; useful as the contrast
              partner.
            </td>
          </tr>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">assemblage</td>
            <td className="py-2 pr-4">medium</td>
            <td className="py-2 pr-4">low</td>
            <td className="py-2">
              Composite of fragments. The bricolage process is human;
              the parts can be either.
            </td>
          </tr>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">artistic</td>
            <td className="py-2 pr-4">variable</td>
            <td className="py-2 pr-4">low</td>
            <td className="py-2">
              The kingdom that takes liberty with everything.
              Biomimicry is one of its tools, not its frame.
            </td>
          </tr>
          <tr className="border-b border-warm-black-900">
            <td className="py-2 pr-4 font-mono">architectural</td>
            <td className="py-2 pr-4">medium</td>
            <td className="py-2 pr-4">medium</td>
            <td className="py-2">
              Termite-mound ventilation, tree-branching load paths,
              honeycomb panels. The kingdom where Benyus&rsquo;s
              ecosystem level is most legible.
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-mono">ritual</td>
            <td className="py-2 pr-4">low</td>
            <td className="py-2 pr-4">variable</td>
            <td className="py-2">
              Gesture-as-shape. The biology in it is the
              human body and the rest is anthropology.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Two patterns fall out. The kingdoms that score highest on{" "}
        <em>shape</em> biomimicry are biomech and curvilinear &mdash;
        the ones whose forms are literally read off organisms. The
        kingdoms that score highest on <em>process</em> biomimicry are
        choreographic, biomech, and architectural &mdash; the ones
        whose making rules come from biological systems. Techno is the
        explicit anti-biomimetic kingdom, and it earns its keep by
        being the contrast against which the others register.
      </p>

      <hr className="my-12 border-warm-black-800" />

      <h2 className="text-2xl font-serif text-chrome-100">
        Part 4 &mdash; Operational practice
      </h2>

      <p>
        <strong>AskNature.org.</strong> The canonical biomimicry
        library, run by the Biomimicry Institute. Indexes biological
        strategies by function (&ldquo;attach reversibly&rdquo;,
        &ldquo;manage drag&rdquo;, &ldquo;produce colour without
        pigment&rdquo;) rather than by organism. The function-first
        ordering is the operationally useful part &mdash; you start
        with a problem and AskNature points you at the species that
        have solved it. The studio uses it as the first lookup when
        scoping a new sculpture line.
      </p>

      <p>
        <strong>Life&rsquo;s Principles.</strong> Benyus and her
        collaborators distilled twenty-seven principles from her wider
        survey of biological strategies, organised under six headings:
        <em>evolve to survive, be locally attuned and responsive, use
        life-friendly chemistry, be resource efficient, integrate
        development with growth, adapt to changing conditions.</em>{" "}
        Used well, the list is a checklist for whether a design has
        absorbed biology at the ecosystem level; used badly, it&rsquo;s
        a poster. The studio treats it as the former.
      </p>

      <p>
        <strong>The biomimetic design loop.</strong> Vincent et al.
        (2006) and the Biomimicry Institute&rsquo;s teaching materials
        converge on a four-step loop:
      </p>
      <ol className="ml-6 list-decimal space-y-2">
        <li>
          <strong>Scope.</strong> Frame the problem as a function, not
          as an object. &ldquo;Stick a card to a wall and remove it
          cleanly&rdquo; rather than &ldquo;design a card mount.&rdquo;
        </li>
        <li>
          <strong>Discover.</strong> Find biological systems that
          solve the function. AskNature, the primary literature,
          conversations with biologists.
        </li>
        <li>
          <strong>Abstract.</strong> Distil the strategy from the
          organism. What is the geckopads&rsquo; <em>principle</em>{" "}
          (van der Waals contact over a hierarchically branched
          surface), independent of toe anatomy?
        </li>
        <li>
          <strong>Emulate.</strong> Build the abstracted principle in
          a different substrate, at a different scale, for the
          original engineering context.
        </li>
      </ol>
      <p>
        The loop is not linear &mdash; failed emulation sends you back
        to abstract, and sometimes to discover. The discipline is in
        keeping the steps separate. The Vincent paper warns
        specifically against collapsing &ldquo;discover&rdquo; and
        &ldquo;emulate&rdquo; into &ldquo;copy.&rdquo;<sup>6</sup>
      </p>

      <p>
        <strong>Where it shows up on the studio&rsquo;s bench.</strong>{" "}
        Four current and planned bench tools rest on these principles:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>The biomimetic 5&times;5 array</strong> &mdash; the
          Three.js prototype at{" "}
          <code className="font-mono text-chrome-200">
            /prototypes/biomimetic-array
          </code>
          {" "}lays ten biomimetic builders (bird bone, bird feather,
          butterfly, leaf vein, shark denticle, dragonfly wing,
          Voronoi foam, spirulina helix, nautilus chamber, plus one
          slot) across a ten-by-ten grid of variants. Each builder is
          an abstraction of an organism&rsquo;s structural principle,
          parameterised so the row variants (Base / Macro / Micro /
          Dense / Sparse) walk the parameter space. The grid is the
          studio&rsquo;s working biomimetic palette.
        </li>
        <li>
          <strong>Gyroid waveguides</strong> &mdash; the gyroid is
          present in butterfly wing scales, in beetle exoskeletons,
          and in block-copolymer phases. The studio&rsquo;s waveguide
          sculptures borrow the form at centimetre scale; the resin
          casting then runs light through it. See{" "}
          <a
            href="/codex/gyroid-surfaces"
            className="text-pink-200 underline underline-offset-4"
          >
            gyroid surfaces
          </a>{" "}
          and{" "}
          <a
            href="/codex/reaction-diffusion-and-tpms"
            className="text-pink-200 underline underline-offset-4"
          >
            reaction-diffusion and TPMS
          </a>
          .
        </li>
        <li>
          <strong>Drone-flocking choreography</strong> &mdash; the
          Skybrush pipeline runs Reynolds-style local rules to choreograph
          drone swarms for light-painting work. The biology is the
          starling; the abstraction is the three local rules; the
          emulation is the firmware. Three steps of Benyus&rsquo;s loop
          visible in a single output.
        </li>
        <li>
          <strong>The kingdoms taxonomy</strong> &mdash; the eight
          kingdoms are a gene-bias taxonomy first and an aesthetic
          taxonomy second. They&rsquo;re the studio&rsquo;s working
          attempt at the operational question: which biological
          strategies does this piece descend from, and with what
          weighting?
        </li>
      </ul>

      <p>
        The honest summary is that biomimicry, like any other lens, is
        a discipline of asking the right question. The studio reaches
        for it most often when a shape is plausible-looking but
        unmotivated; running the four-step loop usually either supplies
        a motivation or tells the studio the shape was a costume
        rather than a strategy. The cases where it tells us the latter
        are the ones we keep, because that&rsquo;s the cheap end of the
        failure curve.
      </p>

      <hr className="my-12 border-warm-black-800" />

      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/gyroid-surfaces"
          className="text-pink-200 underline underline-offset-4"
        >
          gyroid surfaces
        </a>
        ,{" "}
        <a
          href="/codex/reaction-diffusion-and-tpms"
          className="text-pink-200 underline underline-offset-4"
        >
          reaction-diffusion and TPMS
        </a>
        ,{" "}
        <a
          href="/codex/waveguide-object"
          className="text-pink-200 underline underline-offset-4"
        >
          waveguide objects
        </a>
        ,{" "}
        <a
          href="/codex/signed-distance-fields"
          className="text-pink-200 underline underline-offset-4"
        >
          signed distance fields
        </a>
        , the eight-kingdom canon (synthesis note 17), and the
        forthcoming{" "}
        <a
          href="/codex/differential-geometry"
          className="text-pink-200 underline underline-offset-4"
        >
          differential geometry
        </a>{" "}
        entry. The long-form companion lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/SYNTHESIS-BIOMIMETICS.md
        </code>
        .
      </p>

      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Janine M. Benyus,{" "}
          <em>Biomimicry: Innovation Inspired by Nature</em>, William
          Morrow, 1997. The book that named the field and stocked it
          with examples; still the right place to start.
        </li>
        <li>
          Julian F. V. Vincent, Olga A. Bogatyreva, Nikolaj R.
          Bogatyrev, Adrian Bowyer and Anja-Karina Pahl,{" "}
          <em>Biomimetics: its practice and theory</em>, Journal of the
          Royal Society Interface 3(9), pp.&nbsp;471&ndash;482, 2006.
          The methodological paper. Frames biomimetics as a formal
          discipline, contrasts it against bioinspiration, and
          introduces the TRIZ-aligned analytical workflow.
        </li>
        <li>
          Bharat Bhushan,{" "}
          <em>Biomimetics: lessons from nature &mdash; an overview</em>,
          Philosophical Transactions of the Royal Society A 367(1893),
          pp.&nbsp;1445&ndash;1486, 2009. Surveys the surface-physics
          end of the field &mdash; lotus, gecko, shark &mdash; with the
          quantitative detail the popular accounts leave out.
        </li>
        <li>
          Wilhelm Barthlott and Christoph Neinhuis,{" "}
          <em>
            Purity of the sacred lotus, or escape from contamination
            in biological surfaces
          </em>
          , Planta 202(1), pp.&nbsp;1&ndash;8, 1997. The paper that
          named the lotus effect.
        </li>
        <li>
          The Biomimicry Institute,{" "}
          <a
            href="https://asknature.org"
            className="text-pink-200 underline underline-offset-4"
          >
            asknature.org
          </a>
          . Function-indexed library of biological strategies. The
          studio&rsquo;s first lookup when scoping a new line.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The terminology is not universally agreed. Vincent et al.
          (2006) prefer <em>biomimetics</em> as the umbrella term and
          treat <em>biomimicry</em> as a particular school within it
          (Benyus&rsquo;s); other writers reverse the hierarchy. The
          studio uses Benyus&rsquo;s order because her three-level
          framing is the more practically useful one, but the
          dictionary entries differ from journal to journal. When in
          doubt, name the level (form / process / ecosystem) rather
          than relying on the word.
        </li>
        <li>
          The temptation to skip from form to ecosystem and call it
          done is strong. Most sustainability marketing that brands
          itself biomimetic operates this way: borrow a leaf-shaped
          silhouette, claim ecosystem-level virtue. The middle level
          &mdash; the process &mdash; is where the actual work sits.
        </li>
        <li>
          The argument breaks down at edge cases. Evolution is
          path-dependent and gets stuck in local optima &mdash; the
          mammalian retina is wired backwards relative to the
          octopus&rsquo;s; the laryngeal nerve loops down round the
          aorta and back up; sexual selection produces peacock tails.
          The optimiser is good, not perfect. Biomimicry done well
          notices when it is copying a local optimum rather than a
          general principle.
        </li>
        <li>
          The corollary&rsquo;s corollary: a substantial fraction of
          biomimicry research isn&rsquo;t research at all but
          rebranding. A paper that takes a known engineering structure,
          notices that a similar shape exists in biology, and writes a
          biomimetic gloss on it has added precisely zero. The Vincent
          paper is sharp about this and the studio sides with it.
        </li>
        <li>
          The dry-adhesive line has been commercialised under multiple
          brands; the variant the studio buys is Geckskin (University
          of Massachusetts Amherst spinout). It is not literally
          gecko-derived &mdash; the abstraction is van der Waals
          contact across a compliant backing, the implementation is
          fibrous polyurethane on woven fabric.
        </li>
        <li>
          The four-step loop maps onto Vincent&rsquo;s &ldquo;TRIZ for
          biomimetics&rdquo; framework with minor relabelling. TRIZ
          (the Soviet inventive-problem-solving methodology) supplies
          the contradictions matrix &mdash; the formal way of saying
          &ldquo;this design wants two incompatible things at once;
          how does biology resolve the contradiction?&rdquo; The
          studio uses the four-step loop as a working day-to-day tool
          and reaches for TRIZ only when stuck.
        </li>
      </ol>
    </>
  );
}
