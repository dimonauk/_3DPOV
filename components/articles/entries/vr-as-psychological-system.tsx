import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function VrAsPsychologicalSystem() {
  return (
    <>
      <p>
        I started thinking about virtual reality as a psychological
        system, not as a graphics problem, in the first year of my
        undergraduate degree. That was a long time ago. The field
        was small then; the headsets were heavy, the resolutions
        were low, the latency was a problem most people pretended
        wasn&rsquo;t. The technical literature was mostly about
        rendering. The thing I wanted to know about &mdash; what
        happens to a person inside an immersive environment &mdash;
        was already being asked, but quietly, in a few labs that
        weren&rsquo;t building hardware.
      </p>
      <p>
        Two decades and change on, the labs have multiplied, the
        headsets are light enough to wear for an evening, and the
        question I started with has gone from quiet sub-field to
        the centre of how we&rsquo;re going to live with the next
        wave of computing. This article is a brief tour of the
        ideas that have stayed load-bearing across that arc, and
        how they connect to{" "}
        <Link href="/practice" className={ext}>
          the studio&rsquo;s practice
        </Link>
        .
      </p>

      <p>
        <strong>Presence isn&rsquo;t about graphics.</strong>
      </p>
      <p>
        The single most stable finding in immersive-media psychology
        is that{" "}
        <a
          href="https://en.wikipedia.org/wiki/Immersion_(virtual_reality)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          presence{arrow}
        </a>{" "}
        &mdash; the felt sense of "being there" inside a virtual
        environment &mdash; tracks the consistency of sensory-motor
        contingencies far more reliably than it tracks photorealism.
        A low-poly scene with proper head-tracking, low latency, and
        responsive object physics will produce stronger presence
        than a photorealistic scene with any of those broken. Mel
        Slater&rsquo;s "Place Illusion" framework, built up across
        the 2000s and 2010s, is the canonical reference point for
        this.
      </p>
      <p>
        The implication that has shaped the studio: the experience
        of a sustained gesture is what makes the photograph land,
        not the resolution of the print. A six-megapixel photograph
        of a gesture performed with full bodily commitment will
        always read deeper than a hundred-megapixel image of a
        gesture made with a wand and no body behind it. Presence
        in the photograph is the body&rsquo;s presence at the
        capture.
      </p>

      <p>
        <strong>Embodiment and the rubber hand.</strong>
      </p>
      <p>
        The{" "}
        <a
          href="https://en.wikipedia.org/wiki/Body_transfer_illusion"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          rubber-hand illusion and its VR descendants{arrow}
        </a>{" "}
        showed that the brain&rsquo;s representation of body-self is
        soft. Synchronise visual and tactile input on a fake hand
        for ninety seconds and people will flinch when the fake
        hand is threatened. Put a person in a virtual body of a
        different gender, age, or skin colour, run the synchrony
        for long enough, and lasting behavioural shifts follow
        them out of the headset. The body is a model the brain
        updates from afferent traffic; the traffic, not the body,
        is the load-bearing thing.
      </p>
      <p>
        This connects to long-exposure light painting in a way that
        only becomes obvious after you&rsquo;ve done both. When the
        body draws a kata through air, the rig is an extension of
        the body schema &mdash; the brain treats the swung weight,
        and the trail it makes in air, as part of self. The kata
        is fluent only when this extension is fluent. The
        photograph captures not the body and not the rig but the{" "}
        <em>combined system</em>: the body-plus-rig-plus-air, all
        held inside the same proprioceptive envelope. The same
        principle is what will make the studio&rsquo;s{" "}
        <Link
          href="/articles/vr-pov-controllers-the-product"
          className={ext}
        >
          VR-POV bezels
        </Link>{" "}
        feel right rather than weird: the controller is already
        part of the user&rsquo;s body schema; the LED rim on top
        of it is simply another extension along the same vector.
      </p>

      <p>
        <strong>Attention as a resource, not a switch.</strong>
      </p>
      <p>
        Immersive systems compete for attention with the rest of a
        person&rsquo;s perceptual life. The naive design instinct
        is to maximise stimulation &mdash; brighter, louder, more
        novel &mdash; on the assumption that attention will follow.
        The empirical finding is the opposite: attentional capacity
        is finite and selective; novelty fatigues fast; the systems
        that hold attention over hours are the ones that admit
        rhythmic structure and reward sustained focus rather than
        bursts.
      </p>
      <p>
        Long-exposure light-painting is, almost accidentally, an
        attentional architecture rather than a stimulation
        architecture. The performer holds attention on the kata for
        fifteen seconds at a stretch; the camera holds attention on
        the room for the same window; the photograph rewards a
        viewer who looks at it for longer than they were planning
        to. The work is paced for held attention, not for scrolled
        attention. The studio&rsquo;s objects with embedded{" "}
        <Link
          href="/tutorials/lighting-a-waveguide-object"
          className={ext}
        >
          ambient waveguides
        </Link>{" "}
        are the same logic transposed to room-scale: a sculpture
        that asks to be sat with rather than glanced past.
      </p>

      <p>
        <strong>Telepresence, mediation, and what gets lost.</strong>
      </p>
      <p>
        Twenty years of telepresence research has converged on the
        finding that every layer of mediation strips bandwidth from
        the communication, and the bandwidth that gets stripped is
        the bandwidth no one was attending to deliberately. The
        loss isn&rsquo;t the words or the picture; it&rsquo;s the
        micro-timing &mdash; the breath-pause before a sentence,
        the half-second of eye-flicker before a smile. These are
        the channels that carry presence. They are also the
        channels that current videoconferencing eats.
      </p>
      <p>
        This is why the studio&rsquo;s VR-mirror approach
        ({" "}
        <Link
          href="/articles/vr-pov-controllers-the-product"
          className={ext}
        >
          real-world kata captured by a real camera, simultaneously
          rendered in VR
        </Link>
        ) is designed to keep the body in the real room rather than
        replace it with an avatar. The body is the source of the
        micro-timing; mediating it through any avatar at all is a
        net loss. Mirror the gesture. Don&rsquo;t replace the
        gesturer.
      </p>

      <p>
        <strong>What I&rsquo;ve been doing all this time.</strong>
      </p>
      <p>
        Twenty-two years of thinking about VR as a psychological
        system; twelve years of running a movement discipline that
        depended on body-schema fluency; six years of building
        instruments that recorded that fluency to photograph. The
        three arcs were not separate. The poi work was where the
        embodiment ideas lived in the body. The photographs were
        where the attentional-architecture ideas lived in the
        image. The objects with their waveguides were where the
        presence-as-mediation ideas lived in the room. The bezels
        for VR controllers are where all three arcs finally meet
        in a product an ordinary person can buy.
      </p>
      <p>
        Specialists usually pick one of those threads and pull on
        it for a career. The studio picked all of them and pulled
        on all of them at the same speed, on the bet that the
        intersection would matter more than the depth on any
        single thread. That bet is paying out now. The intersection
        is the practice. The practice is the studio.
      </p>

      <p>
        <strong>Selected references and where to start reading.</strong>
      </p>
      <p>
        For a serious dig into presence theory, Mel Slater&rsquo;s
        UCL page is the canonical entry; for the embodiment work,
        Henrik Ehrsson&rsquo;s lab at the Karolinska Institute is
        the standard reference; for the attentional side, Daniel
        Kahneman&rsquo;s <em>Attention and Effort</em> remains the
        load-bearing introductory text despite predating the
        immersive era by thirty years; for telepresence and
        mediation losses, the IEEE VR conference proceedings from
        the past decade are denser and more honest than the
        consumer-press coverage.
      </p>
      <p>
        Specific links in the further-reading block below. None of
        them are easy &mdash; none of this is &mdash; but the door
        is open.
      </p>
    </>
  );
}
