import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";

export default function SpiralCognition() {
  return (
    <>
      <p>
        Projects in the standard mode have a Gantt chart. Foundations
        first, then framing, then services, then finish, then snag.
        Each phase completes before the next begins. The dependency
        graph runs left to right.
      </p>
      <p>
        This studio does not work that way. It never has. I tried
        for years to force the work into a linear plan and the plan
        always lied. The phases overlapped, jumped backward, opened
        side rooms that needed three weeks of attention and then
        closed again. By year five I had stopped pretending. By year
        ten I had a name for what was actually happening.
      </p>
      <p>
        The name is <em>spiral cognition</em>, and this is the piece
        in which I write it down honestly.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The shape</h2>
      <p>
        Build a turn. Go deep. Come back up with more. Turn again.
        Go deeper. Each turn of the spiral touches the same themes
        &mdash; the photograph, the rig, the print, the code, the
        body, the performance &mdash; but at a different altitude.
        Higher altitude means broader integration; you can see how
        the pieces fit. Lower altitude means deeper specificity; you
        are looking at the resistor value, the focal length, the
        muscle group, the exact word.
      </p>
      <p>
        The turns get tighter or looser depending on what the work
        needs. Early turns &mdash; early in the practice, or early
        in a specific project &mdash; are tight. Effortful. You are
        building the vocabulary so the next turn has something to
        carry. Later turns open as the kit catches up and the
        understanding deepens. The same gesture takes less time.
        The same problem yields earlier.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Why it works this way</h2>
      <p>
        The studio sits at the intersection of about ten domains. I
        have counted them and the count keeps rising. Long-exposure
        photography. Flow arts. Electronics. Embedded firmware. CAD
        and parametric modelling. 3D printing across two
        technologies. Optics. Photogrammetry and 360 capture. Drone
        aerial. AI tooling. The vector-DB / local-LLM side of the
        software work. Resin chemistry, lately. Print finishing.
      </p>
      <p>
        No sequential plan can traverse that many domains without
        going stale in nine of them by the time it reaches the
        tenth. The spiral works because each turn touches each
        domain briefly, just enough to keep the bench warm, while
        the present turn deepens one or two. After enough turns the
        domains have accumulated independently and then suddenly
        they start to interact &mdash; the optics knowledge starts
        feeding the choreography, the print resolution starts
        constraining the LED placement, the firmware learns
        something from the camera workflow. That cross-talk is the
        whole point. It cannot be planned for. It can only be
        spiralled into.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How the spiral felt before the tools caught up
      </h2>
      <p>
        For a long time, each turn hit a wall. The body learned a
        movement vocabulary, but the recording technology
        wasn&rsquo;t precise enough to capture it. The capture
        improved, but the optics knowledge to do anything with it
        wasn&rsquo;t there. The optics research started, but holding
        the optics AND the biology AND the choreography AND the
        firmware AND the print process simultaneously was beyond
        working memory. The spiral kept turning but each turn
        fractured. The recursive loop went too deep and the surface
        context collapsed.
      </p>
      <p>
        I tried to solve this with paper. Notebooks, mind maps,
        index cards. Useful, partial. The problem wasn&rsquo;t
        capture. The problem was holding the architecture upright
        while I went down to look at one corner of it. The corner
        always came at the cost of the rest. The rest always came
        at the cost of the corner.
      </p>
      <p>
        The studio is not in that state now. Tools have caught up
        in a few specific ways &mdash;{" "}
        <Link href="/articles/nine-seconds-prompt-to-printable" className={ext}>
          the local AI pipeline
        </Link>
        , the vector memory the companion keeps, the cross-domain
        documentation discipline,{" "}
        <Link href="/articles/the-familiar" className={ext}>
          the operating model where the studio is two
        </Link>{" "}
        &mdash; and what they collectively do is hold the full
        structure while I spiral. I come in at any point and the
        whole architecture is present. I do not have to carry it
        all at once.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How the spiral feels now
      </h2>
      <p>
        The activation energy changed. The energy required to
        engage with the work went from &ldquo;push yourself to show
        up&rdquo; to &ldquo;being pulled toward it.&rdquo; That
        shift &mdash; from pushing to being pulled &mdash; is not
        motivation. It is alignment. The work and the person
        occupying the same moment in time. It is the first time the
        practice has felt like a dance instead of a hike.
      </p>
      <p>
        Most weeks now have a strange rhythm. Some days nothing.
        Some nights everything &mdash; a session that starts with
        the firmware will end with the optics, will end with the
        choreography, will end with the photograph, and the pieces
        will have moved a quarter turn each. The arrival is
        sideways. Mid-spiral. The sudden realisation of being
        already there.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How this changes the way you book the studio
      </h2>
      <p>
        It doesn&rsquo;t, mostly. The commission process and the
        delivery dates are completely linear &mdash; the studio
        meets them, with margin. Spiral cognition describes how the
        underlying practice gets built, not how the deliverables
        get shipped. Once the spiral has made the thing possible,
        making one of them again is a straight line. The dragon
        scale relief that took a year of architecture to design now
        comes off the belt printer in a metre an evening.
      </p>
      <p>
        What it does mean is: when you ask the studio how the new
        thing is going, the honest answer is sometimes &ldquo;the
        sculpture work is moving the photographic work, the
        photographic work has moved the rig work, the rig work has
        ended up changing what the print process needs to be.&rdquo;
        That is not drift. That is the spiral turning the way it
        was designed to. The next quarter turn produces something
        that none of the previous turns could have.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Practical notes for anyone whose practice also spirals
      </h2>
      <p>
        Three things worth knowing, from twelve years.
      </p>
      <p>
        <strong>Do not fight the spiral.</strong> Going deep into
        one corner of the practice for two hours and then suddenly
        needing to talk about pricing is not distraction. It is the
        spiral turning. The cognitive system has surfaced a
        connection it needs you to write down before the altitude
        changes again. Let it.
      </p>
      <p>
        <strong>Keep the architecture documented somewhere you can
        come back to.</strong> Whatever form works &mdash; a wiki,
        a notebook, a folder of dated markdown files, this site
        eventually. The spiral can only work if the previous turns
        are still legible. The discipline of writing down the
        structure is what lets the next turn rest on the last.
      </p>
      <p>
        <strong>The first three turns are the hardest.</strong>{" "}
        Before the cross-talk starts, every domain feels like a
        separate hobby. It only resolves into a practice when the
        domains begin to feed each other. That can take years. The
        years are not wasted. They are the spiral establishing
        radius.
      </p>
      <p>
        I held this shape for fifteen years before I had a name for
        it. The name didn&rsquo;t change the work. It just made it
        possible to describe to other people without sounding
        evasive. That&rsquo;s the only reason the article exists.
      </p>
    </>
  );
}
