import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheMathematicsOfMorphingArticle() {
  return (
    <>
      <p>
        Pick any animation on the studio&rsquo;s bench &mdash; a
        breath cycle in Aura&rsquo;s shoulders, the spiral walking
        across a fifteen-metre LED wall, the baseline-to-peak swing
        of a wave gesture, an SVG node sliding three pixels right
        &mdash; and the load-bearing decision is not which two states
        the thing moves between. It is the shape of the curve that
        carries it. The endpoints are usually obvious. The curve is
        where the work is. This piece is about the catalogue of
        thirty-one named easing functions the studio leans on for
        every animated channel in its kit. Companion to{" "}
        <Link href="/articles/morphing-things-together" className={ext}>
          Morphing Things Together
        </Link>{" "}
        &mdash; that one names the four substrates the studio morphs;
        this one names the maths that shapes the morph itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the equations came from
      </h2>
      <p>
        The catalogue is older than the bench. Robert Penner published
        his easing equations between 1998 and 2002 &mdash; first in
        ActionScript for the Flash animator community, later
        canonicalised in his book{" "}
        <em>Programming Macromedia Flash MX</em>. The set he wrote
        down covers the polynomial ramps (quad, cubic, quart, quint),
        sinusoidal, exponential, circular, back, elastic, and bounce.
        Twenty-eight functions if you count in/out/in-out as separate
        curves, which they are. Add linear, smoothstep and a
        half-sine bump and you have the studio&rsquo;s thirty-one.
      </p>
      <p>
        The same dozen curves keep being re-derived because they sit
        at honest places in the design space &mdash; the cheapest
        polynomial that does not look mechanical, the smoothest
        symmetric ramp, the curve that overshoots a bit, the curve
        that decays like a dropped ball. CSS standardised four into
        the spec; the rest live in the libraries every animator
        reaches for. They are not bench-original. The studio uses
        what everyone else uses. The bench bit is choosing which
        curve to put on which channel.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Five pairs, characterised
      </h2>
      <p>
        Listing all thirty-one would be a table, not an article. The
        table lives in{" "}
        <code className="text-pink-200">lib/math/easing.ts</code>{" "}
        &mdash; canonical names, equations, the loose-string
        registry that resolves Python-side aliases for legacy JSON
        sequences. Here are five pairs worth characterising, because
        the difference between them is the whole aesthetic argument.
      </p>
      <p>
        <strong>Linear vs easeInOutCubic.</strong> Linear is the
        metronome &mdash; constant velocity, zero acceleration, the
        movement of a thing that has decided nothing. Used honestly
        it is fine; a pixel pulse driving a clock display wants
        linear because the audience is reading time, not watching
        motion. Used dishonestly it reads as a bug. The symmetric
        cubic ease is the studio&rsquo;s default well-behaved curve:
        starts slow, accelerates through the middle, decelerates
        into rest. The wave gesture in{" "}
        <code className="text-pink-200">motion.gesture</code> rides
        on this curve from baseline to peak and back; today the
        function is inlined in{" "}
        <code className="text-pink-200">gesture.ts</code> and queued
        to route through the catalogue.
      </p>
      <p>
        <strong>SineIn vs expoIn.</strong> Both are easings-in &mdash;
        slow start, fast end &mdash; but the rate of acceleration
        differs by an order of magnitude. Sine is gentle; the first
        third of the curve barely moves, the last third hurries.
        Exponential is brutal; the first eighty percent is invisible,
        the last twenty arrives all at once. The studio uses sine
        for breath cycles in the idle layer &mdash; the chest rises
        as if it had thought about rising &mdash; and reserves
        exponential for arrivals where something is meant to read as
        a hit, not a glide.
      </p>
      <p>
        <strong>BounceOut vs elasticOut.</strong> Both overshoot. The
        bounce decays like a dropped ball: four parabolic arcs,
        each shorter and lower than the last, ending in rest. The
        elastic is a damped sine wave: the value oscillates either
        side of the target, settling by exponential decay. Bounce
        wants weight. Elastic wants rubber. A poi pendant arriving
        at its rest position on the wall display might bounce; a UI
        toggle confirming a state might elastic. Asking either one
        to do the other&rsquo;s job is the kind of mistake that
        makes a finished piece feel slightly wrong without anyone
        being able to name why.
      </p>
      <p>
        <strong>EaseOutCirc vs easeOutQuart.</strong> Both are
        deceleration curves with a similar gross shape but different
        approach to the endpoint. Circular is geometrically derived
        &mdash; it is literally the bottom-right quadrant of a unit
        circle &mdash; and lands with a near-vertical tangent. Quartic
        lands gently, the velocity sliding to zero. The studio uses
        circular when a thing should arrive decisively (a panel
        sliding into place) and quartic when a thing should arrive
        as if it had always been arriving (a colour fading into a
        backdrop).
      </p>
      <p>
        <strong>EaseInBack vs easeInQuad.</strong> Quadratic ease-in
        is the polite version: gentle start, no overshoot. Back
        ease-in dips backward first &mdash; the value goes briefly
        negative before charging forward &mdash; like a fist pulling
        back before a punch. The Hangar&rsquo;s LED-wall pieces use
        back for transitions where a card should feel reluctant
        before it goes; the quadratic version reads as the same
        movement minus the personality.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the curves live in the studio
      </h2>
      <p>
        The catalogue is not academic. Every animated channel on the
        bench is reaching into it.
      </p>
      <p>
        The breath cycle in{" "}
        <code className="text-pink-200">motion.idle</code> &mdash;
        the layer that keeps Aura alive between explicit commands
        &mdash; is a sine wave on time. Inhale eases in, exhale
        eases out, the curve repeats every four-or-so seconds. The
        sinusoid is not decorative; it is what stops the chest from
        looking mechanically pumped.
      </p>
      <p>
        The baseline &rarr; peak &rarr; baseline interpolation in{" "}
        <code className="text-pink-200">motion.gesture</code> uses
        easeInOutCubic in two halves: attack from baseline to peak,
        release from peak to baseline, with an optional hold between.
        Today the curve is inline in{" "}
        <code className="text-pink-200">gesture.ts</code>; the
        catalogue is the cleaner home for it. The architectural
        intent is that every gesture eventually names its curve as
        an EasingName and the runtime resolves it through{" "}
        <code className="text-pink-200">byName()</code>.
      </p>
      <p>
        The Hangar&rsquo;s LED-wall pieces (the source of the Python
        the TypeScript was ported from &mdash; see{" "}
        <code className="text-pink-200">python-services/morphing_engine.py</code>{" "}
        in the original repo) run the full Penner stack. Pattern A
        morphs to Pattern B over some seconds; the pixel-by-pixel
        interpolation is linear, but the time parameter feeding into
        that interpolation is shaped by whichever easing curve the
        operator picked for the piece. A breath pattern wants
        easeInOutSine. An attention-grab wants easeOutElastic. A
        panic-pulse wants linear with a step function.
      </p>
      <p>
        The four morphing operations named in{" "}
        <Link href="/articles/morphing-things-together" className={ext}>
          Morphing Things Together
        </Link>{" "}
        all eventually pick a curve. The substrates differ &mdash;
        pixels, vertices, gene weights, Laban Effort axes &mdash; but
        the shape that gets put on time is one of the thirty-one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Composing two curves
      </h2>
      <p>
        Thirty-one entries; the design space is much larger. Two
        utility blends in{" "}
        <code className="text-pink-200">lib/visualiser/morphing-math.ts</code>{" "}
        extend the catalogue without adding to it.{" "}
        <code className="text-pink-200">cosineLerp(a, b, t)</code>{" "}
        is a half-cosine interpolation &mdash; equivalent to
        easeInOutSine but kept under a familiar name for callers
        porting from the Python.{" "}
        <code className="text-pink-200">mixCurves(a, b, w)</code>{" "}
        returns a new curve that is a pointwise blend of two named
        ones. Pass easeInQuad and easeOutElastic with w=0.4 and you
        get a curve that starts gently and overshoots a little; you
        did not need to name it, the studio did not need to add it to
        the catalogue. One paragraph of code, an entirely new
        aesthetic available.
      </p>
      <p>
        The studio uses this most often for transitioning between
        moods. Aura&rsquo;s breath cycle in a relaxed state runs on
        a slow sine; in an alert state it runs on something closer
        to a damped triangle. The crossfade from one to the other
        is{" "}
        <code className="text-pink-200">mixCurves</code> driving the
        breath generator&rsquo;s time parameter, weight rising from
        zero to one across a few seconds. The body shifts mood
        without the shift being legible as an event.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The bench discipline
      </h2>
      <p>
        Three refusals, each the marker of an animator on autopilot.
      </p>
      <p>
        <strong>Linear when it is wrong.</strong> Linear is fine for
        clocks and progress bars and anything where the audience is
        reading the value itself. It is wrong for anything organic.
        A linear breath cycle is a metronome with a chest attached.
        A linear hand wave looks like a robot waving. Most of the
        time, if the channel is on a body or a body-adjacent surface,
        linear is the wrong answer and the engineer reached for it
        because it was the first one in the registry.
      </p>
      <p>
        <strong>EaseInOutCubic as a default for everything.</strong>{" "}
        The symmetric cubic is the studio&rsquo;s polite default
        precisely because it is hard to spot when it is wrong. It is
        well-behaved, smooth, unobjectionable. It is also bland. A
        kit where every channel rides on easeInOutCubic reads as a
        single voice talking about thirty different things. The
        discipline is to pick a curve per channel; the breath wants
        sine, the wave wants cubic, the bounce-on-rest wants
        easeOutBack, the elastic confirmation wants easeOutElastic.
        The catalogue exists so the choice is not a guess.
      </p>
      <p>
        <strong>Bounce where bounce is not honest.</strong> Bounce is
        the loudest curve in the catalogue. Used on a thing that has
        weight &mdash; a pendant settling against the LED wall, a UI
        chip dropping into a slot &mdash; it earns its keep. Used on
        a colour fade or a soft transition it reads as a costume,
        not a movement. Same for elastic. The discipline is to ask
        whether the substrate would behave that way in the world. If
        it would not, the curve is decoration.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to read on
      </h2>
      <p>
        The catalogue itself lives in{" "}
        <code className="text-pink-200">lib/math/easing.ts</code>{" "}
        &mdash; thirty-one functions, the EasingName union, the
        loose-string registry. The animation-config layer that wraps
        them &mdash; duration, loop mode, normalised time, sequence
        sampling &mdash; is in{" "}
        <code className="text-pink-200">lib/visualiser/morphing-math.ts</code>.
        The companion article is{" "}
        <Link href="/articles/morphing-things-together" className={ext}>
          Morphing Things Together
        </Link>
        ; the choreography context is{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          The Living Stage
        </Link>
        .
      </p>
      <p>
        For the original Penner equations the textbook is{" "}
        <em>Programming Macromedia Flash MX</em> (2002, friendsofED).
        For the modern incarnation,{" "}
        <a
          href="https://easings.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          easings.net{arrow}
        </a>{" "}
        is the canonical reference &mdash; visual previews of every
        named curve, the equations alongside. The W3C{" "}
        <a
          href="https://www.w3.org/TR/css-easing-1/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CSS Easing Functions Level 1{arrow}
        </a>{" "}
        covers cubic-bezier, steps, and the named keywords. The
        curve is the load-bearing decision. The endpoints are
        usually obvious. Pick the curve on purpose.
      </p>
    </>
  );
}
