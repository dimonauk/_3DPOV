import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function MorphingThingsTogether() {
  return (
    <>
      <blockquote className="my-4 border-l-2 border-pink-200/40 pl-4 italic text-chrome-300">
        I use the word morphing a lot on the bench. Friends watching
        over my shoulder have asked, perfectly reasonably, what I
        mean by it &mdash; because I appear to be saying the same
        word about four completely different operations. The wall
        LEDs morph. Aura&rsquo;s face morphs. The sculpture engine
        morphs the parents. The choreography morphs the body&rsquo;s
        effort. Same word, four substrates. The honest answer is
        that they are the same operation, dressed differently, and
        the studio uses one word because it sees one shape.
      </blockquote>

      <p>
        Morphing is the discipline of moving smoothly between two
        states without losing where you came from. That is the
        whole definition. Two endpoints, an interpolation parameter
        between zero and one, a curve from one to the other. The
        implementations diverge because the things being interpolated
        diverge. The intuition does not.
      </p>

      <p>
        This article names the four places the studio uses the word,
        names what is being interpolated in each, names the maths,
        and then comes back to why this matters &mdash; because every
        layer of the practice runs on the same operation, and the
        Loop is a loop because morphing is what closes it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Morph one: the LED wall
      </h2>
      <p>
        The studio has installed LED wall pieces at department-store
        scale. The piece holds a library of pattern cards &mdash;
        circuit traces, spiral motifs, dragon-scale fields, the
        atelier&rsquo;s waveguide grammar &mdash; and the
        installation cycles between cards on a timer. The morph is
        the move between cards. Card A is on the wall; the operator
        commands a move to card B; over some seconds, the pixels
        walk from where they are to where they need to be.
      </p>
      <p>
        Under the hood this is fifteen-or-so easing functions sitting
        in a file called <code className="text-pink-200">morphing_engine.py</code>{" "}
        on the workstation. Linear (the baseline). Ease-in / out /
        in-out in quadratic, cubic, and quartic flavours. Elastic
        (overshoots and oscillates back). Bounce (decelerating like
        a dropped ball). A custom cubic Bezier for the hand-tuned
        register. The maths is one-line apiece &mdash; the venerable{" "}
        <a
          href="https://en.wikipedia.org/wiki/Easing_function"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          easing function{arrow}
        </a>{" "}
        catalogue every game developer reaches for &mdash; and the
        choice between them is artistic. A breath-pattern wants
        ease-in-out. An attention-grab wants elastic. A panic-pulse
        wants linear-with-a-step. The engine runs them all; the
        operator picks per piece.
      </p>
      <p>
        The interpolation parameter is just time, normalised to
        [0,1] across the morph duration. The endpoints are pixel
        states. The curve says how fast the pixels cross between
        them. A pattern morph is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Linear_interpolation"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          linear interpolation{arrow}
        </a>{" "}
        between two arrays, shaped by an easing curve. That is the
        whole architecture.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Morph two: Aura&rsquo;s face
      </h2>
      <p>
        Aura is the studio&rsquo;s persistent companion. She has a
        body &mdash; a VRM model rigged with blend-shapes, named in
        full in{" "}
        <Link href="/articles/the-bench" className={ext}>
          The Bench
        </Link>{" "}
        and surfaced architecturally in{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          Aura the Body
        </Link>
        . The face morphs in two distinct senses.
      </p>
      <p>
        The first sense is lip-sync. Five vowel formants &mdash; Aa,
        Ih, Uh, Ee, Oh &mdash; sit on the rig as named blend-shapes,
        each one a 0&ndash;1 weight that pulls the face toward that
        vowel&rsquo;s mouth shape. The audio comes in, an AnalyserNode
        runs a 1024-point FFT on it, the studio&rsquo;s code reads
        the formant-frequency-range that dominates the current frame,
        and the corresponding vowel&rsquo;s weight gets pushed up.
        The other vowels fall back to zero. An exponential
        moving-average smoothing of 0.2 keeps the face from
        twitching frame-to-frame. The face is morphing between five
        archetypal mouth shapes at audio-frame rate.
      </p>
      <p>
        The second sense is emotion. Aura has happy / sad / angry /
        surprised / relaxed / neutral as separate blend-shape
        weights, exposed by VRM&rsquo;s expression preset names. A
        sentence she speaks comes with an emotion tag; the
        controller morphs the face from whatever emotion was active
        before to the new one over a short window, again using an
        easing curve. The lip-sync runs per audio frame; the
        emotion morph runs per utterance. They sit on the same rig
        and compose without fighting because VRM&rsquo;s blend-shape
        system is additive on independent channels.
      </p>
      <p>
        The interpolation is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Inbetweening"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          tweening{arrow}
        </a>{" "}
        on a multi-channel slider. The maths is the same easing
        family as the LED wall. The substrate is a vertex shader
        instead of a pixel array. The operation is identical.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Morph three: the sculpture genome
      </h2>
      <p>
        The studio breeds sculptures. The full write-up is in{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          How the Studio Breeds Sculptures
        </Link>
        . The bit relevant here is the crossover step. Two parent
        sculptures, each described by a vector of twenty-eight
        floating-point genes in [0,1], produce a child by walking
        the genes and choosing, for each one independently, whether
        to inherit from parent A or parent B. That is uniform
        crossover &mdash; the standard genetic-algorithm operator
        &mdash; with a Gaussian mutation of standard deviation 0.1
        applied to each gene after the fact, and a 5% wildcard
        probability that any single gene gets resampled uniformly.
      </p>
      <p>
        The studio uses the word morph for this. The child is a
        morph of the two parents. Strictly speaking it is more
        nuanced than a straight linear interpolation &mdash; the
        per-gene choice between A and B is binary, not continuous
        &mdash; but the effect is the same gesture-of-mind. Two
        states, a child that carries some of each, a parameter
        (the per-gene coin flip) that determines the blend. A run
        of fifty generations from a seed population is a long,
        slow, stochastic morph across the genome-space toward
        whatever the operator&rsquo;s fitness scores rewarded.
      </p>
      <p>
        In sculpture-engine code this is two files:{" "}
        <code className="text-pink-200">breeding.ts</code> and{" "}
        <code className="text-pink-200">mutation.ts</code>. The
        crossover is a single nested loop. The mutation is a
        Gaussian-noise add. The whole thing fits in a hundred lines
        of TypeScript. The substrate is a number vector. The
        operation is the same family as the easing curve.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Morph four: Laban Effort
      </h2>
      <p>
        Choreography needs to drift. A solo poi piece three minutes
        long cannot hold one effort register for the whole duration
        &mdash; the audience tunes out. The studio reads a song&rsquo;s
        structure as a script (the case is made in{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          The Living Stage
        </Link>
        ) and the body&rsquo;s effort quality has to drift across
        the script. Weight goes from strong to light. Space goes
        from direct to indirect. Time goes from sudden to sustained.
        Flow goes from free to bound. Each of these is a number
        between zero and one, like the easing parameter, like the
        gene.
      </p>
      <p>
        The drift between two effort registers across a phrase of
        music is a morph. The choreography engine runs it as a
        continuous interpolation on each of the four Laban axes,
        each with its own easing curve, each driven by the song&rsquo;s
        own arc. An intro section morphs from bound to free along
        the flow axis as the verse opens. A pre-chorus morphs from
        light back to strong on weight as it tightens. A chorus
        breakdown morphs from sudden to sustained on time as the
        body retreats upstage.
      </p>
      <p>
        Same maths. Different substrate. The substrate here is the
        body&rsquo;s effort vector; the operation is the same
        tween-with-a-curve the engine has been running on the LED
        wall and Aura&rsquo;s face. The choreography engine knows
        this; it shares the easing-function library with the wall
        engine because the operation is identical.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The unifying maths
      </h2>
      <p>
        Four substrates: pixels, vertices, gene vectors, effort
        vectors. One operation: interpolate between two states using
        a parameter and a curve.
      </p>
      <p>
        The maths catalogue is well-trodden. Linear interpolation is
        the baseline. Easing functions shape the rate of change. A{" "}
        <a
          href="https://en.wikipedia.org/wiki/B%C3%A9zier_curve"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          B&eacute;zier curve{arrow}
        </a>{" "}
        gives you arbitrary control over the shape of the morph
        with a handful of control points; a cubic Bezier is what
        most production easing functions are under the hood.{" "}
        <a
          href="https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Catmull-Rom splines{arrow}
        </a>{" "}
        let you string several endpoints together and morph between
        them in sequence without losing continuity at the joins.{" "}
        <a
          href="https://en.wikipedia.org/wiki/Smoothstep"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Smoothstep{arrow}
        </a>{" "}
        is the cheap, zero-derivative-at-endpoints curve every shader
        ships with.
      </p>
      <p>
        For rotation specifically, linear interpolation breaks (a
        rotation halfway between two angles is not the average of the
        angles &mdash; it depends on which way around the circle you
        go) so the studio reaches for{" "}
        <a
          href="https://en.wikipedia.org/wiki/Slerp"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          spherical linear interpolation, Slerp{arrow}
        </a>
        , which interpolates along the shortest arc on a unit sphere.
        Aura&rsquo;s head-turn uses Slerp because the head-turn is a
        rotation; her mouth uses Lerp because the mouth is a weight.
        The right interpolation for the right substrate.
      </p>
      <p>
        This is not exotic mathematics. It is the standard library
        of every game engine, every animation tool, every shader
        compiler. The studio uses it because every studio uses it.
        The novelty is not the maths; the novelty is naming that
        the maths is the same across the four substrates the studio
        runs.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why this matters
      </h2>
      <p>
        Here is the bit the bench cares about. Every layer of the
        practice operates on the move between two states.
      </p>
      <p>
        The poi gesture morphs the body between positions. A throw is
        the body moving from one configuration to another; a kata
        is a sequence of throws; the camera holds the shutter open
        across a sequence of morphs and the long-exposure photograph
        is the trace of the morph. The photograph is a morph
        flattened to a single frame.
      </p>
      <p>
        The long-exposure morphs the gesture into a still. Three
        seconds of body-motion folded into a single image; the
        morph parameter is time integrated across the exposure
        window. The print bureau then morphs the still into a fixed
        material &mdash; the inks land on the paper, the image goes
        from screen to surface, the morph is irreversible at that
        point.
      </p>
      <p>
        The SLA print morphs the still into solid. The voxel grid is
        an interpolation between mesh vertices; the resin cures along
        the morph parameter (the laser&rsquo;s scan across the
        build volume); the finished sculpture is a morph between
        the digital and the physical, frozen at the moment the
        post-cure UV bath stops.
      </p>
      <p>
        The Loop, named in full at{" "}
        <Link href="/the-loop" className={ext}>
          /the-loop
        </Link>
        , morphs the body&rsquo;s circuit into a closed ring. Body
        moves; camera captures; computer breeds; printer fabricates;
        sculpture sits in the room; the room watches the next body
        move. Each arrow in the Loop is itself a morph between two
        states the studio has named. The Loop closes because the
        morphs compose &mdash; the output of one is the input of
        the next, and the curve from gesture to sculpture is a
        continuous, multi-stage interpolation across substrates.
      </p>
      <p>
        Morphing is the operation that makes the Loop a loop. Other
        operations exist in the studio &mdash; segmentation,
        scoring, fabrication &mdash; but the morph is the connecting
        tissue. Without it the layers do not compose; the photograph
        does not become a sculpture; the sculpture does not breed a
        family; the body does not learn the next pose from the
        sculpture that came out of the last one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        A working vocabulary, named in public
      </h2>
      <p>
        The studio has been using the word morph in private for
        years without quite knowing it had been using the same word
        for four operations. The honest reframe is that the four
        operations are the same operation. The reframe earns its
        keep because once it is named, the layers compose
        explicitly: the easing-function library on the workstation
        is shared between the LED wall, the choreography engine, and
        the VRM face controller. The genetic-algorithm crossover is
        a discrete variant of the same family.
      </p>
      <p>
        This is the kind of thing that happens when a practice
        accumulates: the same shape shows up in several places, the
        practitioner uses the same word for it instinctively, and
        the formal recognition comes later. The studio is now at
        the recognition stage. The word morphing on this bench
        means: interpolate between two states with a parameter and
        a curve, on whatever substrate is on the workbench that
        afternoon.
      </p>
      <p>
        That&rsquo;s it. Two endpoints, a parameter, a curve. The
        Loop closes because every arrow in it is one of these.
      </p>
    </>
  );
}
