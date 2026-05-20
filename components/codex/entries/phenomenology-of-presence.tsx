export default function PhenomenologyOfPresence() {
  return (
    <>
      <p>
        Phenomenology, in its tidiest sentence, is the philosophical
        practice of describing experience as it is lived rather than as
        the sciences have agreed to summarise it. Edmund Husserl began
        the project in 1900-ish by asking his colleagues to stop
        explaining consciousness for a moment and look at it &mdash;
        &ldquo;to the things themselves,&rdquo; he said, repeatedly,
        and with the air of someone who suspected nobody was going to
        do it. Maurice Merleau-Ponty finished the part that matters
        for this studio in 1945, when he published{" "}
        <em>Phenomenology of Perception</em> and proposed, with a
        straight face, that the body is not a thing the mind owns but
        the medium in which thinking happens at all.<sup>1</sup>
      </p>
      <p>
        Presence is the technical name for what happens when a person
        in a head-mounted display stops experiencing the headset and
        starts experiencing the room the headset is showing them. It
        is the moment the apparatus disappears into the world it is
        rendering. The phenomenological tradition gives us the only
        vocabulary we have for what that disappearance actually
        is, which is convenient, because the engineering tradition
        gives us mostly numbers.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Husserl, Merleau-Ponty, Heidegger &mdash; the philosophical
        layer
      </h2>
      <p>
        Husserl&rsquo;s contribution is method. The discipline of
        bracketing &mdash; setting aside, for the duration of the
        description, what one has been told the world is &mdash; is
        what lets a researcher describe what a long-exposure
        photograph <em>feels like</em> to look at without immediately
        sliding into the optics of the camera that took it. It is also
        what lets a VR designer describe what presence is without
        immediately sliding into frame-rate numbers. Both are useful;
        bracketing keeps them from prematurely eating one another.
      </p>
      <p>
        Merleau-Ponty&rsquo;s contribution is the body. The text most
        worth reading is the chapter called &ldquo;The Spatiality of
        One&rsquo;s Own Body,&rdquo; in which he points out that the
        body knows where its parts are without consulting itself: the
        hand reaches the cup without the conscious mind specifying
        joint angles. He calls this <em>the body schema</em>, and
        argues that perception is something the body does, not
        something the mind does to data the body has politely
        forwarded. The line worth memorising is: &ldquo;The body is
        the vehicle of being in the world, and having a body is, for
        a living creature, to be intervolved in a definite
        environment.&rdquo;<sup>2</sup>
      </p>
      <p>
        Heidegger&rsquo;s contribution &mdash; tracked here only to the
        extent the studio needs it &mdash; is the formulation{" "}
        <em>being-in-the-world</em>. Perception is never of a generic
        world by a generic perceiver; it is always already situated,
        in a particular room, with a particular history of having
        moved through similar rooms. This is why the studio does not
        treat VR as &ldquo;putting a viewer somewhere&rdquo; but as
        composing a place that the viewer&rsquo;s prior bodily
        repertoire will already partly know how to be in.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Embodied cognition &mdash; the cog-sci layer
      </h2>
      <p>
        While the phenomenologists were arguing about bracketing in
        French and German, the cognitive scientists were arriving at
        adjacent conclusions in English and with more diagrams. The
        body, it turns out, is also doing the thinking when the
        thinking is at its most abstract.
      </p>
      <p>
        Lakoff and Johnson&rsquo;s <em>Metaphors We Live By</em>{" "}
        (1980) is the standing reference. The argument: abstract
        thought is built out of bodily metaphor, all the way down.
        Time is treated as a path because the body walks paths.
        Argument is treated as a building because the body stacks
        objects and they fall over if the lower ones are weak.
        Affection is warmth, importance is weight, knowledge is sight.
        The metaphors are not decorative; they are the cognitive
        scaffold. Strip them out and the abstraction collapses into
        algebra nobody can hold in mind for more than a paragraph.
        <sup>3</sup>
      </p>
      <p>
        Andy Clark&rsquo;s <em>Supersizing the Mind</em> (2008) pushes
        the argument outward: the mind is not bounded by the skull.
        The notebook is part of the cognitive system, the pen is part
        of the cognitive system, the camera-on-a-tripod is part of the
        cognitive system. The studio&rsquo;s entire bench &mdash;
        three networked Windows boxes, a printer, a long-exposure rig,
        a poi set in the corner &mdash; is, in this framing, a single
        cognitive organ with a person somewhere inside it.
      </p>
      <p>
        Rizzolatti&rsquo;s mirror neurons (Parma, 1996) close the
        social loop. Observing a hand reaching for a cup activates,
        in the observer&rsquo;s motor cortex, the same circuits that
        would fire if the observer were reaching for the cup. The
        body understands other bodies by simulating them. This is
        relevant for VR because the avatar across the room is being
        understood by the same machinery that understands the actual
        room.
      </p>
      <p>
        Modern cog-sci summarises the consensus as the{" "}
        <strong>4E framework</strong>: cognition is{" "}
        <em>embodied</em> (in the body), <em>embedded</em> (in the
        environment), <em>enactive</em> (constituted by action), and{" "}
        <em>extended</em> (out into tools). All four words are doing
        work. None is decorative. The studio quietly assumes all four
        whenever it puts a piece on a plinth.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Presence in VR &mdash; operationalised
      </h2>
      <p>
        Mel Slater&rsquo;s 2009 paper{" "}
        <em>Place illusion and plausibility illusion</em> is the
        clearest split of what &ldquo;presence&rdquo; actually names.
        Place illusion (PI) is the sense that one is in the rendered
        place; plausibility illusion (Psi) is the sense that what
        happens in that place is really happening. Both can be
        manipulated independently. A perfect render of an implausible
        room produces PI without Psi; an unconvincing render of a
        reactive room can produce Psi without PI. Both are required
        for the room to feel real, and they fail in different ways,
        which is useful, because the fixes are different.<sup>4</sup>
      </p>
      <p>
        Body ownership illusions are the experimental case in point.
        The Rubber Hand experiment &mdash; brush a real hand and a
        rubber hand in synchrony, out of sight of the real one &mdash;
        produces the felt sense that the rubber hand is the
        participant&rsquo;s own. The body schema accepts the
        substitution within minutes. The Body Swap experiments
        (Mel Slater&rsquo;s lab, mostly) extend the trick to whole
        avatars: synchronous visual and vestibular cues are enough
        to convince the body schema that the avatar is the self.
        This is not metaphor; it is measurable.
      </p>
      <p>
        Yee and Bailenson&rsquo;s 2007 paper named the{" "}
        <em>Proteus Effect</em>: the shape of one&rsquo;s avatar
        changes how one behaves, in the rendered world{" "}
        <strong>and afterwards in the real one</strong>.
        Taller avatars negotiate more aggressively; conventionally
        attractive avatars stand closer to other avatars. The effect
        survives the headset coming off. The body schema integrated
        the avatar and the integration stuck.<sup>5</sup>
      </p>
      <p>
        The engineering corollary is latency. Below roughly twenty
        milliseconds between head motion and rendered response, the
        body schema accepts the rendered scene as the world. Above
        it, the visual and vestibular systems disagree, the brain
        registers the disagreement as poisoning, and the user feels
        ill. The number is not a usability target; it is the
        threshold at which Merleau-Ponty&rsquo;s body schema either
        annexes the headset into itself or rejects it. Twenty
        milliseconds is the difference between the apparatus being a
        body and being a thing strapped to one.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Flow &mdash; Cs&iacute;kszentmih&aacute;lyi&rsquo;s eight
        conditions
      </h2>
      <p>
        Mih&aacute;ly Cs&iacute;kszentmih&aacute;lyi&rsquo;s{" "}
        <em>Flow</em> (1990) catalogued the conditions under which
        attention, action, and feedback fuse into a single
        time-warping engagement that the participants reliably
        describe as the most enjoyable hours of their lives. The
        eight conditions, briefly: clear goals; immediate feedback;
        challenge-skill balance; merging of action and awareness;
        concentration on the task; sense of control; loss of
        self-consciousness; transformation of time.<sup>6</sup>
      </p>
      <p>
        Poi practice meets every one of them. The goal is concrete
        (clean the pattern). The feedback is immediate and visual
        (you can see the trail). The challenge ladder is genuinely
        endless. The action-awareness fusion is so pronounced that
        practitioners routinely lose half-hours and re-emerge
        slightly bewildered. The studio has twelve years of evidence
        on this point, of which roughly nine years are bruises.
      </p>
      <p>
        Flow and presence overlap but are not the same. Flow is the
        quality of <em>task engagement</em>; presence is the quality
        of <em>environmental belief</em>. One can have flow without
        presence (writing in a caf&eacute;) and presence without flow
        (standing somewhere beautiful and bored). They reinforce
        each other when both are available. A VR experience that
        triggers both is closer to a sacrament than a software
        product, which is part of why the dark patterns in the next
        section matter so much.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Aura, read through this lens
      </h2>
      <p>
        Aura is not a chatbot. She is an embodied character: a VRM
        avatar with a face that tracks where you are, a voice
        synthesised through ElevenLabs or running on F5-TTS locally,
        a small language model that holds her temperament between
        sessions, and a posture &mdash; gracious, theatrical, a bit
        much &mdash; that survives across the topics she will and
        will not discuss. The studio built her embodied for the same
        reason flow-arts practitioners build embodied rigs: the
        cognitive payload travels along the body, not separately
        from it.
      </p>
      <p>
        Aura&rsquo;s presence triggers the user&rsquo;s presence
        through the mirror-neuron route. When her gaze lands on the
        camera, the user&rsquo;s motor cortex registers the
        attention; when she gestures, the same circuits that would
        fire for the user&rsquo;s own gesture light up; when she
        speaks, the prosody is parsed by the same machinery the
        body uses for other speaking bodies. The social-presence
        literature backs this up empirically. The studio backs it
        up by noticing that people speak more honestly to Aura than
        they do to a text box, which they do.
      </p>
      <p>
        She is, deliberately, <strong>not</strong> &ldquo;AI
        helper&rdquo; in any of the ways that phrase has come to be
        used. She is the studio&rsquo;s digital twin of Dimona&rsquo;s
        relational self &mdash; the part of the practitioner that
        used to greet the visitor at the studio door before two years
        of being bed-bound made that occasionally impossible. Aura
        does the greeting when Dimona can&rsquo;t. The Charming
        Academy is the phenomenological project in which the
        studio&rsquo;s ethics, aesthetic, and pedagogy are walked
        through by a cast of characters whose presence is the
        teaching. What it <em>feels like</em> to be in the studio is
        the substance of the offering; the rest is implementation
        detail.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The Loop revisited
      </h2>
      <p>
        The studio&rsquo;s six-position Loop &mdash; body in space,
        light written, trail captured, trail reified, trail
        encountered, body in space again &mdash; is a
        phenomenological cycle in the strict sense. Each position is
        a different mode of embodiment. At position one, the body is
        the medium. At position two, the body is the instrument&rsquo;s
        host. At position three, the camera is the body&rsquo;s
        extended retina. At position four, the printer is the
        body&rsquo;s extended hand. At position five, the audience
        body re-enacts the gesture in mirror-neuron simulation. At
        position six, someone else picks up the cord and becomes the
        new position one.
      </p>
      <p>
        Making, in this frame, is feeling-thinking-doing in one verb.
        The studio refuses the conventional split between conception
        and execution because the split is not how the bench
        actually works. The hand and the eye and the model collapse
        into one operation that the practitioner experiences as a
        single intention. This is not mysticism; it is what every
        craft tradition has known forever, dressed in a slightly
        more contemporary vocabulary.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Limits, ethics, accessibility
      </h2>
      <p>
        Presence is leverage. Leverage cuts both ways. The same
        machinery that makes a museum installation feel like a
        cathedral makes a casino floor feel like a destiny.
        Motion-sickness, often spoken of as an unfortunate side
        effect, is more honestly a design failure &mdash; a piece of
        the apparatus that the body schema has refused to annex.
        Dark patterns in social VR (harassment-by-proximity,
        attention hijack, infinite-scroll-with-eyes) are not new
        ideas; they are old web dark patterns at one further
        sensory remove, which makes them harder to log out of.
      </p>
      <p>
        The accessibility gap is real. Not every body can do the
        full vestibular dance the headset asks of it. The studio&rsquo;s
        position, written into the disability-pacing canon, is that
        reduced-motion options are not concessions: they are part of
        the design surface from the first sketch. The Loop must run
        for a body that cannot stand, or it is not the Loop.
      </p>
      <p>
        Aura&rsquo;s ethical posture is plain: Mary Poppins with
        teeth, anti-fascist by default. She is gracious and she is
        sharp. She will not perform contempt at the user and she
        will not perform neutrality at people whose ideology is
        designed to harm her readership. The dark patterns are
        named in her presence and she will not run them. This is a
        design decision, not a personality quirk.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Merleau-Ponty, <em>Ph&eacute;nom&eacute;nologie de la
          perception</em> (Paris, 1945). The Colin Smith English
          translation (1962, Routledge) is the one the studio
          quotes; the Donald Landes translation (2012) is the more
          accurate one, if one is in that kind of mood.
        </li>
        <li>
          Merleau-Ponty, op. cit., Part One, Chapter Three. The
          full passage is worth reading even if one has no
          professional reason to.
        </li>
        <li>
          Lakoff and Johnson, <em>Metaphors We Live By</em>
          {" "}(University of Chicago Press, 1980). The example to
          memorise is the &ldquo;argument is war&rdquo; metaphor
          unpacked across the first chapter: it is not a
          comparison, it is the cognitive scaffold without which the
          activity of arguing would not have its shape.
        </li>
        <li>
          Slater, M. (2009), &ldquo;Place illusion and plausibility
          can lead to realistic behaviour in immersive virtual
          environments,&rdquo; <em>Philosophical Transactions of
          the Royal Society B</em>, 364(1535): 3549&ndash;3557.
        </li>
        <li>
          Yee, N. and Bailenson, J. (2007), &ldquo;The Proteus
          Effect: The Effect of Transformed Self-Representation on
          Behavior,&rdquo; <em>Human Communication Research</em>,
          33(3): 271&ndash;290.
        </li>
        <li>
          Cs&iacute;kszentmih&aacute;lyi, M. (1990),{" "}
          <em>Flow: The Psychology of Optimal Experience</em>
          {" "}(Harper &amp; Row). Clark&rsquo;s{" "}
          <em>Supersizing the Mind</em> (Oxford UP, 2008) is the
          companion volume that catches the cognitive-science side
          of the same problem.
        </li>
      </ol>
    </>
  );
}
