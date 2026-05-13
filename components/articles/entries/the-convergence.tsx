import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheConvergence() {
  return (
    <>
      <p>
        The site has a lot of articles about pieces. The rigs are
        in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>
        . The first long exposure is in{" "}
        <Link href="/tutorials/your-first-long-exposure" className={ext}>
          the long-exposure tutorial
        </Link>
        . The local AI pipeline is in{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className={ext}
        >
          Nine Seconds from Prompt to Printable
        </Link>
        . The breeding engine is in{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          How the Studio Breeds Sculptures
        </Link>
        . The print bureau is at{" "}
        <Link href="/bureau" className={ext}>
          /bureau
        </Link>
        . The optics are in{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        and{" "}
        <Link
          href="/articles/why-the-pendant-glows-from-the-inside"
          className={ext}
        >
          Why the Pendant Glows from the Inside
        </Link>
        . Each piece argues one thread. This article is the one
        that shows them as one operation.
      </p>
      <p>
        The studio calls it the Convergence on the bench. One
        captured signal &mdash; a poi path tracked through time
        with position, velocity, and acceleration &mdash; enters
        the top of the pipeline. Seven processing stages squeeze
        it. Eleven sciences sit under the stages, each one a piece
        of trodden literature the studio leans on rather than
        invents. What comes out the other end is a sculpture
        nobody else could have made, because nobody else had the
        signal, and nobody else has all eleven sciences hooked up
        in series.
      </p>
      <p>
        The trunk piece on this site for the philosophical
        argument is{" "}
        <Link
          href="/articles/the-practice-in-eight-threads"
          className={ext}
        >
          The Practice in Eight Threads
        </Link>
        : eight threads, one braid, named in one place. This is
        the technical trunk piece. The Convergence is the
        operation those eight threads run on; the seven stages
        below are how the operation actually executes on the
        workstation.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The signal at the top
      </h2>
      <p>
        Everything starts with one time-series. A specific body, a
        specific moment, three seconds to thirty seconds of motion
        captured by one of three input modalities the bench
        supports. The Azure Kinect tracks the reflective poi
        head at full body scale; the Leap Motion tracks the
        hands at 27 degrees of freedom per hand; an IMU mounted
        on the poi tip gives ground-truth velocity and
        acceleration. The output is a stream of position vectors
        sampled at the rig&rsquo;s frame rate &mdash; the same
        stream a long-exposure camera would have integrated into
        a single blurred image, kept here as the raw signal
        before the camera collapses it.
      </p>
      <p>
        The signal is the irreplaceable input. Nobody else has
        this body at this moment. The sculpture that comes out
        the bottom of the pipeline is provably provenanced
        because the signal at the top is provably specific. The
        whole architecture rests on this point.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 1 &mdash; Capture and temporal coherence
      </h2>
      <p>
        Raw sensor data is noisy. The first stage smooths the
        capture with a Gaussian-weighted moving average across a
        small window &mdash; about five frames either side of
        the current sample &mdash; which eliminates jitter while
        preserving intentional motion. The science underneath is
        signal processing as it has been done in biomechanics
        labs for decades; the studio uses the same temporal-
        coherence constraint that systems like MoSculp apply
        when reconstructing bodies from video, applied here to
        a single tracked tip rather than to a full skeleton.
      </p>
      <p>
        The output of Stage 1 is{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          poi_path(t)
        </code>
        : a clean time-series of position, velocity, and
        acceleration. Everything downstream operates on this.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 2 &mdash; Kinematic extraction
      </h2>
      <p>
        The second stage is where the signal becomes numbers
        every downstream stage can use. From the clean
        time-series, the studio derives a small dictionary of
        quantities, each one feeding a different downstream
        operation. The structural backbone of this stage is the
        following table, lifted from the bench&rsquo;s notes
        and named here in full:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Speed</strong> &mdash; the magnitude of the
          velocity vector. Feeds the diffraction-grating pitch
          on ctenophore-type surfaces and the feed rate of the
          reaction-diffusion simulation in Stage 3B.
        </li>
        <li>
          <strong>Angular velocity</strong> &mdash; speed
          divided by radius from the body&rsquo;s centre.
          Feeds the moir&eacute; twist angle in Stage 4 and the
          whispering-gallery-mode resonance selection.
        </li>
        <li>
          <strong>Curvature</strong> &mdash; the rate at which
          the path bends. The cross-product of velocity and
          acceleration divided by velocity cubed. Feeds the
          wall thickness of the swept surface in Stage 3A and
          the fine surface detail decisions in Stage 4.
        </li>
        <li>
          <strong>Acceleration</strong> &mdash; the second
          time-derivative of position. Feeds the
          reaction-diffusion kill rate in Stage 3B and the
          mutation intensity in Stage 5.
        </li>
        <li>
          <strong>Fourier spectrum</strong> &mdash; the
          fast-Fourier transform of the velocity over time. The
          fundamental frequencies become the chirp pattern in
          the diffraction grating; the harmonic content becomes
          the modulation envelope.
        </li>
        <li>
          <strong>Petal-tip extrema</strong> &mdash; local
          maxima of radial distance from the body&rsquo;s
          centre. Become food sources for the slime-mould
          waveguide solver in Stage 3C.
        </li>
        <li>
          <strong>Laban Effort vector</strong> &mdash; four
          numbers between zero and one describing Weight,
          Space, Time, and Flow, derived as kinematic proxies
          (mean acceleration, displacement over path length,
          velocity variance over mean, smoothness of the jerk
          envelope). Feed the choreography conditioning in
          Stage 6C and the material parameters in Stage 4.
        </li>
      </ul>
      <p>
        Seven derived quantities from one signal. Each one is a
        named hand-off to a specific downstream stage. The
        kinematic-extraction stage is the bottleneck through
        which every later operation has to pull what it needs;
        the rest of the pipeline is fanning out from this point.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 3 &mdash; Form, surface, waveguide (the three
        parallel substages)
      </h2>
      <p>
        Stage 3 is the first place the pipeline branches. The
        signal&rsquo;s derived quantities feed three parallel
        operations: form generation, surface patterning, and
        waveguide-network construction. The three operations
        produce the macro geometry, the meso-scale surface
        texture, and the internal optical network that together
        compose the sculpture.
      </p>
      <p>
        <strong>Stage 3A &mdash; Form generation.</strong> The
        macro shape comes from one of five generators, picked
        by the type tag of the sculpture genome named in{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          How the Studio Breeds Sculptures
        </Link>
        . A swept surface that rides the poi path like a
        ribbon, with its cross-section&rsquo;s radius modulated
        by speed; a phyllotactic structure whose golden-angle
        placement is perturbed by the angular velocity at each
        element; a gyroid whose threshold breathes with
        velocity; a ctenophore-type helix whose grating pitch
        chirps along the body; a slime-mould network whose
        nodes sit at the petal-tip extrema. Five families, one
        chosen per sculpture, each feeding the signal&rsquo;s
        derived quantities into the underlying maths.
      </p>
      <p>
        <strong>Stage 3B &mdash; Surface patterning.</strong>{" "}
        The meso-scale texture comes from a{" "}
        <a
          href="https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Gray-Scott reaction-diffusion simulation{arrow}
        </a>{" "}
        running on the unwrapped sculpture surface. The
        simulation is seeded not by random noise &mdash; the
        common practice &mdash; but by the projected poi path,
        so the pattern radiates from the actual movement trace.
        The simulation&rsquo;s parameters vary spatially across
        the surface: fast regions feed denser patterns; high-
        acceleration regions produce sparser stripes. The
        resulting texture is the velocity field made into
        chemistry, the chemistry made into bumps, the bumps
        made into optics.
      </p>
      <p>
        <strong>Stage 3C &mdash; Waveguide network.</strong>{" "}
        The internal optical network is grown by a Physarum
        polycephalum simulation seeded with the petal-tip
        extrema as food sources. The slime-mould algorithm runs
        for about ten thousand steps, then an adaptive-
        conductivity pass prunes weak connections and reinforces
        strong ones for another thousand. The resulting network
        follows Murray&rsquo;s Law &mdash; the cube of the
        parent radius equals the sum of cubes of the child
        radii &mdash; and gets meshed as a branching tube
        system. Light entering at the base node travels through
        the network and exits at the petal-tip termini, lit by
        the geometry the body&rsquo;s path drew.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 4 &mdash; Optical integration
      </h2>
      <p>
        Once the geometry exists, the optics get verified and
        adjusted. The fourth stage runs the equations that
        decide whether the sculpture will actually glow the way
        the brief asked it to. Total internal reflection at the
        resin-air interface is the load-bearing physics; the
        critical angle of about 41.8 degrees at refractive
        index 1.50 sets the minimum bend radius for every
        waveguide channel. The light-budget across the
        sculpture height is computed as exponential decay along
        the optical path length; tall pieces need wider
        channels near the top to retain enough light for the
        glow to read. The caustic-projection lens cap, when
        the kingdom asks for one, is shaped iteratively to
        project the original poi flower pattern as a light
        signature on the wall behind the piece &mdash; proof
        of provenance, made visible.
      </p>
      <p>
        This stage is where the equations from the optics
        literature land in the bench&rsquo;s actual decisions.
        Snell&rsquo;s law for refraction; Fresnel coefficients
        for the percentage of light reflected at each surface;
        the diffraction-grating equation for the rainbow
        dispersion produced by the chirped-pitch surfaces; the
        twisted-bilayer moir&eacute; period for the shells that
        sparkle as the viewer walks around them. The studio
        does not invent the optics; the optics are the
        well-trodden physics of glass and resin. The studio
        composes the optics, decides which equations apply to
        which kingdom, and routes the geometry through the
        verifier.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 5 &mdash; Evolution
      </h2>
      <p>
        A single sculpture is rarely the answer to a commission.
        The fifth stage breeds families. The genome &mdash;
        twenty-eight floats plus a type tag, named in full in{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          the breeding-engine article
        </Link>{" "}
        and indexed in{" "}
        <Link href="/articles/the-eight-kingdoms" className={ext}>
          The Eight Kingdoms
        </Link>{" "}
        &mdash; gets evolved across generations using
        tournament selection, blended crossover, and Gaussian
        mutation with adaptive temperature. The fitness function
        is the operator at the keyboard; an optional local LLM
        advisor reads scored populations and proposes biased
        crossovers, but it never scores. The discipline is
        explicit: the machine carries the breadth; the maker
        carries the depth.
      </p>
      <p>
        After twenty to thirty generations, the population
        converges on a small family of sculptures the operator
        wants to print. Every individual carries a full lineage
        back to generation zero in the workstation&rsquo;s
        SQLite database. The provenance is structural &mdash;
        each piece has documented ancestry inside the
        evolutionary process and outside of it via the signal
        it descended from.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 6 &mdash; Print, exhibition, score (three parallel
        outputs)
      </h2>
      <p>
        Stage 6 branches again, into three outputs that together
        compose the finished work.
      </p>
      <p>
        <strong>Stage 6A &mdash; Physical print.</strong> The
        STL goes through the slicer to the SLA printer at the
        corner of the bench &mdash; the path named in{" "}
        <Link href="/articles/the-bench" className={ext}>
          The Bench
        </Link>{" "}
        and finished at the print bureau at{" "}
        <Link href="/bureau" className={ext}>
          /bureau
        </Link>
        . Post-cure UV bath, polish, attachment of the LED
        root, photograph for the studio archive. The companion
        decisions about paper and ink for any photographic side
        of the output are in{" "}
        <Link
          href="/articles/the-right-paper-for-a-light-painting"
          className={ext}
        >
          The Right Paper for a Light Painting
        </Link>
        .
      </p>
      <p>
        <strong>Stage 6B &mdash; Digital exhibition.</strong>{" "}
        The same mesh exports as a glTF binary and renders in a
        three.js viewer with physically-based materials. The
        digital twin is the bench&rsquo;s archive copy and the
        commissioning client&rsquo;s preview surface; the
        modular system at{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>{" "}
        runs the viewer on the studio&rsquo;s own hardware.
      </p>
      <p>
        <strong>Stage 6C &mdash; Choreographic score.</strong>{" "}
        The same signal that seeded the sculpture also generates
        a performance score. The Laban Effort vector from Stage
        2 conditions a choreographic diffusion model; the
        kinesphere maps to Hall&rsquo;s proxemic zones (intimate
        under 0.45 m, personal 0.45 to 1.2 m, social 1.2 to 3.6
        m, public over 3.6 m); the song structure if a
        soundtrack accompanies the piece maps to staging zones.
        The output is the performance instruction set that
        accompanies the sculpture as its parallel expression.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stage 7 &mdash; The object
      </h2>
      <p>
        The seventh stage is the place the pipeline lands. A
        physical sculpture sits on a plinth or hangs on a wall;
        a digital twin runs in the browser; a performance score
        accompanies the piece if it asked to be performed; a
        provenance certificate names the signal at the top, the
        chain of operators through the pipeline, the lineage
        through the breeding engine, the printer it came off,
        the bath that cured it, the paper any photograph was
        printed on. The object exists in the room with the
        viewer, and the viewer&rsquo;s encounter with it is the
        sixth position of{" "}
        <Link href="/the-loop" className={ext}>
          the Loop
        </Link>{" "}
        &mdash; the gesture that started in another body
        returning as a gesture in this one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The eleven sciences underneath the seven stages
      </h2>
      <p>
        Each stage rests on a body of published literature the
        studio leans on. Naming them here, in the order they
        first appear in the pipeline:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Biomechanics.</strong> The body-as-mechanism
          literature that defines what counts as a clean
          motion-capture signal. Temporal-coherence smoothing
          in Stage 1 is biomechanics-flavoured signal
          processing.
        </li>
        <li>
          <strong>Mechanics</strong> (kinematics in particular).
          Stage 2&rsquo;s derived quantities &mdash; velocity,
          acceleration, curvature, angular velocity &mdash; are
          the textbook kinematic decomposition of a
          parameterised path.
        </li>
        <li>
          <strong>Choreography</strong> (Laban Movement
          Analysis specifically). The four-axis Effort vector
          comes from Rudolf Laban&rsquo;s notation system and
          its later kinematic formalisations.
        </li>
        <li>
          <strong>Computer graphics.</strong> The swept-surface
          generation in Stage 3A uses the Frenet-Serret frame
          along the path &mdash; standard differential geometry
          repurposed as procedural modelling.
        </li>
        <li>
          <strong>Pattern formation</strong> (reaction-diffusion
          specifically). Stage 3B&rsquo;s Gray-Scott simulation
          is straight out of Turing&rsquo;s 1952 chemistry
          paper, dressed in the studio&rsquo;s seeding strategy.
        </li>
        <li>
          <strong>Biology</strong> (slime-mould computing
          specifically). Stage 3C&rsquo;s Physarum solver
          implements work by Toshiyuki Nakagaki and the
          adaptive-conductivity model of Atsushi Tero, used
          here as a biomimetic network optimiser.
        </li>
        <li>
          <strong>Biomimicry</strong> (Murray&rsquo;s Law
          specifically). The tube-radius scaling in the
          waveguide network follows the rule that blood
          vessels, river deltas, and the slime mould all
          discover independently &mdash; the cube of the
          parent equals the sum of cubes of the children.
        </li>
        <li>
          <strong>Optics.</strong> Total internal reflection,
          Snell&rsquo;s law, Fresnel coefficients, diffraction
          gratings, moir&eacute; superlattices,
          whispering-gallery resonance &mdash; the optical
          stack is plain physics applied to clear resin.
        </li>
        <li>
          <strong>Materials science.</strong> The
          refractive-index range, the resin&rsquo;s loss
          coefficient (about 0.28 to 1.2 per centimetre at
          visible wavelengths), the printer&rsquo;s XY
          resolution at 19 micrometres &mdash; the bench&rsquo;s
          numbers come from the material literature for
          photopolymer resins.
        </li>
        <li>
          <strong>Computer science</strong> (genetic algorithms
          specifically). Tournament selection, blend crossover,
          Gaussian mutation with adaptive temperature, elitism
          plus wildcards &mdash; Stage 5 implements textbook
          evolutionary computation as the breeding loop.
        </li>
        <li>
          <strong>Statistics</strong> (signal processing
          specifically). The Fourier-spectrum extraction in
          Stage 2 and the temporal smoothing in Stage 1 are
          statistics in their applied dress; spectral methods
          for periodic motion analysis.
        </li>
      </ul>
      <p>
        Eleven sciences. A flag the honest version of this
        article should carry: the eleventh science the
        bench&rsquo;s notes name is the history of light
        rather than statistics &mdash; the long visual lineage
        from Marey&rsquo;s chronophotography through Edgerton
        and the persistence-of-vision literature that the
        sculpture descends from. Both are defensible; the
        studio uses statistics in the actual code, and the
        history of light is what the work consciously
        descends from. Either reading is honest. The
        practice rests on both.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why this works as one operation
      </h2>
      <p>
        Each science is published. Each algorithm has been
        proven elsewhere. The composition is the
        studio&rsquo;s. Nobody else has all eleven sciences
        hooked up in series and seeded by the same captured
        signal at the top; the work the bench produces is
        irreproducible by anyone who was not there at the
        moment of capture. That is the architectural premise
        the convergence rests on, and it is the answer to the
        most reasonable question a visitor can ask: why is
        this a studio and not a download? Because the studio
        is the place the eleven sciences are composed, and
        the signal is the place that composition starts.
      </p>
      <p>
        The Loop at{" "}
        <Link href="/the-loop" className={ext}>
          /the-loop
        </Link>{" "}
        has six positions; the Convergence has seven stages.
        The mapping is honest: the Loop is the cultural
        circuit (body, light, capture, reify, encounter,
        body), and the Convergence is the technical breakdown
        of the reify-and-back-to-body segment. Stages 1 and 2
        are the Loop&rsquo;s capture position turned inside
        out. Stages 3, 4, and 5 are the reify position
        expanded into its three substages (form, optics,
        evolution). Stage 6 is the reified object emerging
        across three parallel outputs. Stage 7 is the
        encounter that becomes the next gesture in another
        body. Seven stages map onto five Loop positions plus
        one expansion plus one return; the architectures fit
        together.
      </p>
      <p>
        The AR-game proving ground at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        teaches the Convergence by playing it in pieces. Each
        of its eight solo levels proves one stage of the
        pipeline in isolation. The braided weaves prove
        combined stages &mdash; the 2-braid runs two stages at
        once, the 3-beat runs three, the full weave runs all
        eight threads of the practice and through them the
        whole Convergence in a single performance. The
        pedagogy is recursive: the player proves the
        studio&rsquo;s architecture by performing it. The
        proving ground exists because the Convergence is the
        kind of system best taught by being practised in
        pieces and then woven.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The piece that names the pipeline as one thing
      </h2>
      <p>
        That is the Convergence. One signal at the top, seven
        stages in series with parallel branches at Stage 3 and
        Stage 6, eleven sciences underneath the stages, and a
        sculpture-plus-twin-plus-score at the bottom. The
        article is meant to be read once; the threads it names
        are the threads the rest of the site argues
        individually. The pendant that arrives in a buyer&rsquo;s
        hand is the bottom of the pipeline; the body that
        captured the signal is the top; the eleven sciences
        between them are the trodden literature the studio
        composes rather than invents. The Convergence is the
        practice as one object, and the practice is the
        Convergence as one operation. Now back to the bench.
      </p>
    </>
  );
}
