import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function ChoreographingWithLabanArticle() {
  return (
    <>
      <p>
        Most of the work in this studio is captured movement &mdash; a
        body on the cord, a hand on the controller, a poi tracing a
        trail through a long-exposure frame. Before a gesture can be
        scored, blended, evolved or printed, it has to be reduced to
        something the maths can hold. The shape I reach for, every
        time, is Laban Effort. Four numbers between zero and one.
        Four axes. One point inside a cube. That is the
        kinematic-extraction layer of the studio&rsquo;s choreography
        engine, and this piece is the bench-side walkthrough of it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The four axes
      </h2>
      <p>
        Rudolf Laban&rsquo;s 1920s framing of human movement &mdash;
        refined across the century into{" "}
        <a
          href="https://en.wikipedia.org/wiki/Laban_movement_analysis"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Laban Movement Analysis{arrow}
        </a>{" "}
        &mdash; rests on four interlocking continua. Each runs zero
        to one in the studio&rsquo;s convention; the canonical maths
        in{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/visualiser/laban-math.ts
        </code>{" "}
        keeps them signed (-1 to +1) and the capability does the
        bridging.
      </p>
      <p>
        <strong>Space</strong> &mdash; flexible to direct. How
        focused the attentional line of the gesture is. A poi
        wandering across a wide arc with no clear target is
        flexible; a hand pointed at one face is direct. On the
        bench: an antispin flower is direct in space because every
        petal lands in the same place every revolution; a Lissajous
        3:2 is indirect because the trail never quite repeats.
      </p>
      <p>
        <strong>Time</strong> &mdash; sustained to sudden. The
        velocity envelope. A breath-paced pendulum is sustained; a
        snap-release at the end of a wind-up is sudden. Winding up
        the swing is a Press in the corner taxonomy below; the
        snap-release is a Punch. Same body, same arm, different
        moment of the same gesture.
      </p>
      <p>
        <strong>Weight</strong> &mdash; light to strong. Whether
        the torso is committed. A wrist-only twirl is light; a
        full-shoulder windmill with the hips behind it is strong.
        The capability reads this off the magnitude of the spine,
        hip and chest Euler vectors &mdash; the heavier the torso
        commitment, the closer to one.
      </p>
      <p>
        <strong>Flow</strong> &mdash; free to bound. The degree of
        muscular restraint. Free flow is the gift offered &mdash;
        an open hand, an uncurled arm, the poi released into its
        own momentum. Bound flow is the gift held back &mdash;
        controlled, taut, the wrists doing micro-corrections every
        beat. The cross is bound; the fountain is free. Both can
        be the right answer for a given measure of music; neither
        is a value judgement.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The eight Basic Efforts
      </h2>
      <p>
        The corners of the cube spanned by Space, Time and Weight
        are the eight Basic Efforts Laban himself named. The studio
        uses them as anchor labels: every captured gesture is a
        point inside the cube, and the nearest corner is the
        single-word headline for its quality. Flow conditions but
        does not corner.
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Float</strong> &mdash; indirect, sustained, light.
          The Lissajous 3:2 lives here.
        </li>
        <li>
          <strong>Glide</strong> &mdash; direct, sustained, light.
          The pendulum, taken straight.
        </li>
        <li>
          <strong>Wring</strong> &mdash; indirect, sustained, strong.
          The three-beat weave when held under tempo.
        </li>
        <li>
          <strong>Press</strong> &mdash; direct, sustained, strong.
          The forward windmill, full extension, hips behind it.
        </li>
        <li>
          <strong>Flick</strong> &mdash; indirect, sudden, light.
          The end of a wave, where the wrist lets go.
        </li>
        <li>
          <strong>Dab</strong> &mdash; direct, sudden, light. The
          nod. The point that is almost a touch.
        </li>
        <li>
          <strong>Slash</strong> &mdash; indirect, sudden, strong.
          The hyperloop at speed.
        </li>
        <li>
          <strong>Punch</strong> &mdash; direct, sudden, strong.
          The cross. The snap-release after a wind-up.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The move library
      </h2>
      <p>
        The library lives at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/cast/move-library.ts
        </code>
        . Fifteen entries at the time of writing: ten poi spins,
        three hand gestures, one body pose, one named transition
        phrase. Every entry carries a typed Laban-Effort coordinate
        plus a one-paragraph description and a pointer back to the
        Hangar source it was ported from. Some of those samples, in
        the order the file holds them:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Cross</strong> (poi) &mdash; space 1.0, time 0.0,
          weight 1.0, flow 1.0. The corner of Punch, with bound
          flow. The only fully canonical entry; see below.
        </li>
        <li>
          <strong>Fountain</strong> (poi) &mdash; space 0.4, time
          0.3, weight 0.3, flow 0.3. Soft, breath-like, near
          Float/Glide.
        </li>
        <li>
          <strong>Hyperloop</strong> (poi) &mdash; space 0.3, time
          0.7, weight 0.7, flow 0.3. Near the Slash corner; the
          five-petal cardioid at speed.
        </li>
        <li>
          <strong>Wave</strong> (hand) &mdash; space 0.85, time 0.7,
          weight 0.4, flow 0.3. The hostess&rsquo;s greeting,
          held longer than is strictly polite.
        </li>
        <li>
          <strong>Held presence</strong> (body) &mdash; space 0.8,
          time 0.2, weight 0.7, flow 0.85. The Aura default. Not
          standing but presenting.
        </li>
        <li>
          <strong>Butterfly &rarr; Cross</strong> (transition)
          &mdash; space 0.65, time 0.15, weight 0.7, flow 0.85.
          The four-to-eight-beat tilt that swaps planes.
        </li>
      </ul>
      <p>
        Cross is the only entry whose coordinates come from a
        full written-up move document. The Hangar file at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          apps/prototypes/poi-sculptor/move_library/cross/MOVE.md
        </code>{" "}
        carries a Laban Quality Mapping table that the library
        lifts verbatim: Weight strong (full arm extension), Time
        sustained (even velocity throughout), Space direct (the
        anchor barely moves &mdash; the planes do the work), Flow
        bound (the wrists holding the orthogonal planes against
        the precession of body rotation). The document also names
        the failure mode: when the wrist extensors fatigue, the
        planes collapse and the cross becomes a diagonal smear.
        There is no middle ground &mdash; either the planes are
        held or they aren&rsquo;t.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the capability does
      </h2>
      <p>
        The capability lives at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/capabilities/motion/laban.ts
        </code>
        . Its job is small and well-defined: take a stream of pose
        samples &mdash; timestamped Euler triples for every bone
        the rig exposes &mdash; and return the dominant Effort
        vector plus the closest Basic Effort name. Time is read off
        the mean angular speed across the sample window. Weight is
        the mean torso magnitude (hips plus spine plus chest).
        Flow is one minus the normalised standard deviation of
        per-frame speed: a steady gesture is bound, a jittery one
        is free. Space is endpoint distance over total path for
        the lead hand: a straight reach is direct, a wandering one
        is indirect.
      </p>
      <p>
        The heuristics are readable and tunable. The capability is
        the surface; the maths under it can be refined &mdash; jerk
        integrals, curvature, weighted body regions &mdash; without
        breaking any caller. Name the contract, keep the
        implementation honest about what it does today.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where this composes
      </h2>
      <p>
        The engine doesn&rsquo;t just classify gestures. It
        interpolates them. Two named moves can be blended by their
        Laban coordinates and the result is the path between them
        &mdash; not in pose space, where the answer would be a mess
        of bone Eulers, but in Effort space, where the answer is a
        single point inside the cube that moves smoothly from one
        named anchor to another.{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          interpolateMoves(&quot;butterfly&quot;,
          &quot;cross&quot;, 0.5)
        </code>{" "}
        is a real call that returns a real EffortVector
        halfway between the two. The transition phrase in the
        library &mdash; Butterfly &rarr; Cross &mdash; is the
        same idea written out as a named move.
      </p>
      <p>
        The interactive version of all of this is at{" "}
        <Link href="/visualiser/laban-dial" className={ext}>
          /visualiser/laban-dial
        </Link>
        . Drag the four sliders; the pink point moves inside the
        cube; the closest named corner lights up. The broader
        capability map is at{" "}
        <Link href="/capabilities" className={ext}>
          /capabilities
        </Link>
        , and the long-form Effort argument lives in{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          The Living Stage
        </Link>
        . The genetic counterpart &mdash; where Laban-Effort
        drift is one of four named morphing operations the
        breeding engine uses &mdash; is{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          How the Studio Breeds Sculptures
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The honest gap
      </h2>
      <p>
        Only one move in the library is fully canonical: the cross.
        Its coordinates are lifted verbatim from the written-up
        Hangar document. A handful of others &mdash; three-beat
        weave, forward windmill &mdash; inherit a Press tag from
        the older choreography script and are defensible by
        inspection. Every other set of coordinates is a working
        estimate by the porter, calibrated against the Effort
        definitions but not yet against a captured sample. They
        will be tuned, one move at a time, as the bench captures
        real takes against each named gesture. Treat the library
        as an open invitation. The schema is stable; the
        coordinates are honest about being provisional. Corrections
        welcome.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Back to the bench
      </h2>
      <p>
        The cube is the reduction the engine needs to do its work,
        and the move library is the vocabulary the studio has named
        so far. Neither is the gesture. The gesture is the body on
        the cord, the wrist holding the wheel plane against the
        precession, the breath at the bottom of the pendulum. The
        maths lets the engine carry the combinatorics while the body
        keeps doing the only part the body can do. Two-handed, as
        ever. The engine breeds. The body holds the planes.
      </p>
    </>
  );
}
