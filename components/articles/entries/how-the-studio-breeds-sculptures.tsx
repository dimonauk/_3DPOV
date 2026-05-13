import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function HowTheStudioBreedsSculptures() {
  return (
    <>
      <blockquote className="my-4 border-l-2 border-pink-200/40 pl-4 italic text-chrome-300">
        This is the long version of layer four of{" "}
        <Link href="/articles/art-as-door-five-layers" className={ext}>
          Art as Door &mdash; Five Layers
        </Link>
        . The system, named in two paragraphs over there, named in
        full here. How the studio actually breeds the waveguide
        sculptures, from genome to print, with the genetic algorithm
        sat in the middle doing the combinatorics I have no patience
        for.
      </blockquote>

      <h2 className="mt-12 text-2xl text-chrome-100">The thing</h2>
      <p>
        I score sculptures. The engine breeds them. Twenty-five
        candidates per generation in a 5&times;5 grid in the
        browser, one to five stars each, click a button, ninety
        seconds of rendering, twenty-five new ones in the same
        grid. The good genes carry forward; the bad ones don&rsquo;t.
        Twenty or thirty generations later the population has
        converged on a small family of forms I actually want to
        print, and the database knows the ancestry of every one of
        them back to generation zero.
      </p>
      <p>
        That is the whole loop. Three players: generator, human,
        engine. The generator produces the candidates. I am the
        fitness function. The engine carries the population
        forward. Everything below is the parts list.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What a genome looks like
      </h2>
      <p>
        Twenty-eight floating-point numbers, all in the range zero
        to one, plus a type tag. The type tag picks which of five
        biomimetic families the candidate belongs to &mdash; gyroid,
        Turing reaction-diffusion, whispering-gallery-mode rings,
        ctenophore helix, slime mould network &mdash; and the
        twenty-eight numbers parameterise the geometry, the
        material, the optics, and the waveguide network inside.
      </p>
      <p>The numbers split into four groups:</p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Form (12 genes).</strong> Scale (30 to 120 mm),
          aspect ratio (0.3 to 3.0), twist (0 to 720 degrees),
          taper, cell density, wall thickness, symmetry, surface
          noise amplitude and frequency, vertical-element count,
          branching probability, closure (how sealed the top is).
        </li>
        <li>
          <strong>Material (8 genes).</strong> Refractive index
          (1.45 to 1.65), transmission, roughness, subsurface
          scattering, self-emission, RGB tint. These map directly to
          the Principled BSDF in Blender for preview rendering and
          to the chosen resin formulation at print time.
        </li>
        <li>
          <strong>Optics (4 genes).</strong> Diffraction grating
          pitch (38 to 500 micrometres, set by the printer&rsquo;s
          XY resolution at the low end), grating depth, gyroid
          channel volume ratio, whispering-gallery escape-feature
          density.
        </li>
        <li>
          <strong>Waveguide (4 genes).</strong> Base tube radius (0.5
          to 3 mm), tube surface quality (frosted to polished),
          Physarum network node count, Murray&rsquo;s law exponent
          for the tube-radius scaling.
        </li>
      </ul>
      <p>
        That is the alphabet. Twenty-eight letters, one type tag,
        every sculpture the studio prints describable as a single
        line of JSON. The genome is genuinely the recipe &mdash;
        feed it back into the generator and out comes the same
        sculpture, give or take render noise.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How a generation gets made
      </h2>
      <p>
        Generation zero is twenty-five random genomes. Each gene
        sampled uniformly from zero to one with a few
        type-specific constraints &mdash; whispering-gallery rings
        get their symmetry locked to three-, four-, or five-fold;
        slime mould networks have a minimum node count of five so
        the result is actually a network and not a stick. Five
        types &times; five variants = twenty-five. The 5&times;5
        grid is deliberate. Wider would be more diverse and
        unscorable in one sitting. Narrower would converge too
        fast.
      </p>
      <p>
        Each genome goes through the type-specific generator,
        which is a Python script that drives Blender headless. The
        gyroid generator evaluates the implicit surface{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = threshold
        </code>{" "}
        on a 3D grid and marches a mesh out of it. The Turing
        generator runs a Gray-Scott reaction-diffusion simulation
        for 500 to 2000 timesteps and uses the V-field as surface
        displacement. The slime generator runs a Physarum
        polycephalum simulation with poi-petal positions as food
        sources and grows a Steiner-tree-ish network out of the
        result. Each one produces a mesh, gets validated with{" "}
        <a
          href="https://trimesh.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          trimesh{arrow}
        </a>{" "}
        for watertightness and minimum dimension, then gets
        rendered to a 512&times;512 PNG thumbnail with three-point
        lighting plus an uplight for the waveguide glow. Cycles, 64
        samples, GPU, about three seconds per sculpture, so a full
        generation is ninety seconds of render time.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Selection, crossover, mutation
      </h2>
      <p>
        Once I have scored a generation, the engine breeds the next
        one. Three slots, three sources.
      </p>
      <p>
        <strong>Elite (5).</strong> Top five by score, carried
        forward unchanged. No genetic drift on the best of the
        population &mdash; whatever I scored highest is guaranteed
        to appear in the next grid. This is the bit that prevents
        the algorithm from losing the work I have already done.
      </p>
      <p>
        <strong>Bred (15).</strong> Tournament selection with size
        three: pick three random parents, pick the highest-scoring
        of them, that&rsquo;s parent A. Repeat for parent B.
        Uniform crossover means each child gene is independently
        copied from parent A or B with 50/50 probability. Then
        mutation: each gene has a 15% chance of being mutated; of
        those, 95% are Gaussian (small noise, sigma 0.1) and 5%
        are wildcards (completely new random value). The wildcards
        are how the population finds genes the parents didn&rsquo;t
        have between them.
      </p>
      <p>
        <strong>Wildcard (5).</strong> Completely random new
        genomes, one per type. Their job is to keep injecting
        diversity even after the population has converged. They
        almost never score well in the generation they appear in;
        they sometimes have one gene worth keeping that the bred
        population is missing, and a few generations later that
        gene is everywhere. The wildcards are the door staying
        open.
      </p>
      <p>
        Five plus fifteen plus five equals twenty-five. The grid
        size is the constraint that drives the whole composition.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The LLM advisor (optional)
      </h2>
      <p>
        There is an optional layer where a local LLM reads the
        generation, reads the scores, and proposes biased
        crossovers based on whatever pattern it spots. It runs on{" "}
        <a
          href="https://ollama.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ollama{arrow}
        </a>{" "}
        with Qwen 2.5 14B at Q4_K_M quantisation &mdash; about 10
        GB of VRAM, which fits alongside Blender on the RTX 3080
        Ti with a couple of gigabytes to spare. Native JSON output
        mode means I can constrain the response to a valid genome
        schema directly, no parsing fragility.
      </p>
      <p>
        What the advisor adds is the bit a pure GA cannot do:
        domain reasoning across the gene space. &ldquo;The top
        scorers all have transmission above 0.8 and cell density
        between 0.6 and 0.7; propose 15 children that preserve
        that region while exploring the twist axis.&rdquo; The
        engine still does the actual crossover and mutation; the
        LLM is biasing which crossovers get tried. It is faster
        than waiting for a random GA to stumble onto the same
        combination, and it is honest about the role it plays: it
        is a breeding advisor, not a designer. It does not generate
        geometry. It does not generate code. It does not score the
        sculptures. It reads numbers and proposes other numbers.
        That is genuinely the thing it is good at.
      </p>
      <p>
        I keep the advisor switchable because the pure GA still
        works fine without it, and there are some sessions where I
        want surprise more than I want convergence. Reasoning
        models (DeepSeek-R1, QwQ and friends) get explicitly turned
        off &mdash; they spend tokens explaining their reasoning,
        which I did not ask for, and the extra inference time
        gives me nothing the smaller non-reasoning model does not
        already give me.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Fitness, honestly
      </h2>
      <p>
        The fitness function is me. One to five stars per
        sculpture, on the studio&rsquo;s 1&ndash;5 scale:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>1.</strong> Actively unpleasant. Broken geometry.
          No visual interest.
        </li>
        <li>
          <strong>2.</strong> Functional but uninteresting. The
          &ldquo;meh&rdquo; band.
        </li>
        <li>
          <strong>3.</strong> Decent. Has some quality but
          wouldn&rsquo;t print.
        </li>
        <li>
          <strong>4.</strong> Strong. Want to see this developed
          further.
        </li>
        <li>
          <strong>5.</strong> Print this. This is the one.
        </li>
      </ul>
      <p>
        Nothing in this loop is automated decision-making. The
        machine carries the breadth; the maker carries the depth.
        It is the same two-handed pattern as{" "}
        <Link href="/articles/the-familiar" className={ext}>
          the rest of the studio
        </Link>
        . The aesthetic comes from twelve years of doing this work,
        which is not a thing the engine has; the combinatorics come
        from the engine, which is not a thing I have the patience
        for. The split makes both halves more honest than either
        would be alone.
      </p>
      <p>
        Tournament size three is moderate selection pressure. A
        score-2 individual can still parent if it beats two
        score-1s. This matters: aggressive selection pressure
        collapses the population to a single phenotype in five
        generations, which produces convergence but kills the
        surprise. The wildcards plus the moderate tournament size
        plus the elite preservation keeps the population
        exploring even at generation 30.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the ancestry lives
      </h2>
      <p>
        Every genome, every score, every parent-child relationship,
        every render, every STL export gets written to a SQLite
        database on the workstation. The lineage table is just
        child_id, parent_id, method (crossover / mutation / elite /
        wildcard / llm). Any sculpture can be walked back to
        generation zero in one SQL query. The web UI shows the
        ancestry tree on demand &mdash; click a sculpture, see its
        parents, click a parent, see its siblings, climb back as
        far as you like.
      </p>
      <p>
        The reason this matters is not technical. It is provenance.
        A sculpture that came out of generation 28 of a session
        scored across thirty hours of human attention has a
        documentable lineage. I can look at one of my own pieces
        three years later and answer the question &ldquo;why does
        this one look like that&rdquo; with the database open.
        Most generative systems do not let you do this. The studio
        treats it as a discipline, the same way the
        photograph-bureau side treats the single-exposure record
        as a discipline.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What this borrows
      </h2>
      <p>
        The intellectual ancestry of this engine is well-trodden.
        Interactive evolutionary aesthetic is from the 1990s
        directly &mdash; Karl Sims&rsquo;s evolved virtual
        creatures (1994) and his&nbsp;
        <em>Genetic Images</em> installation are the canonical
        ancestor. The genetic-algorithm primitives are textbook:
        tournament selection, uniform crossover, Gaussian mutation,
        elitism. NEAT (NeuroEvolution of Augmenting Topologies)
        from Stanley and Miikkulainen (2002) is the load-bearing
        reference for the structural-genome side of the
        literature; I do not use NEAT directly because the
        sculpture genome is fixed-length, but the
        speciation-via-similarity ideas inform how the population
        is kept diverse.
      </p>
      <p>
        What the studio adds is the integration. The fitness
        function is a human with twelve years of doing the work,
        not a neural-net surrogate. The candidates are real
        printable objects, validated for watertightness and
        minimum dimension before they even get rendered. The
        ancestry is provenance, not just a debugging aid. And the
        twenty-eight-gene alphabet is specifically tuned to the
        biomimetic-optics work the studio does, not a general
        shape-generation system. The borrowing is wide; the
        composition is the studio&rsquo;s.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Session shape
      </h2>
      <p>
        A productive evolution session is thirty minutes to two
        hours. Ten to twenty generations. The first five are
        calibration &mdash; the system learning my taste, my
        scores noisy because I am settling in. Generations 6 to
        15 are convergence; the population shifts toward forms I
        want to print. After 15 the refinement gets subtle; the
        differences between sculptures are gene tweaks rather
        than phenotype shifts.
      </p>
      <p>
        At any point I can export a selected sculpture as an STL
        and drop it into the slicer for the SLA printer. The
        figurative waveguide line on the bench &mdash; the
        sister to the parametric belt-printed work in{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          the colour-without-pigment piece
        </Link>{" "}
        and the cousin to{" "}
        <Link href="/articles/nine-seconds-prompt-to-printable" className={ext}>
          the nine-second AI pipeline
        </Link>{" "}
        on the other half of the same workstation &mdash; gets
        fed real candidates from real sessions. The engine is not
        a thought experiment. The print queue table in the
        database is a list of files about to become objects on{" "}
        <Link href="/articles/the-bench" className={ext}>
          the bench
        </Link>
        .
      </p>
      <p>
        Twenty-eight genes. Twenty-five candidates per turn.
        Twenty or thirty turns. One human at the keyboard. One
        printer at the corner. The engine breeds. I score. The
        population converges. The wildcards keep the door open.
        Generation forty might be more interesting than
        generation four.
      </p>
    </>
  );
}
