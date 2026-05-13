import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function ThePracticeInEightThreads() {
  return (
    <>
      <p>
        The studio writes a lot. Roughly thirty articles on the site
        now, each one arguing a single thread of how the work fits
        together &mdash; why the rigs are bench-built, why the
        printer is in the corner, why the AI pipeline runs offline,
        why the door at the Rookery is the price of a subscription.
        Read in isolation, every piece is a thread. Read together,
        the threads make a braid. I have never written down the
        whole braid in one place, and{" "}
        <Link href="/about" className={ext}>
          /about
        </Link>{" "}
        gestures at it without naming it explicitly. This is the
        piece that names it. Eight threads, one trunk article. A
        reader who reads only this one knows what the studio
        actually argues before they read any other.
      </p>
      <p>
        The eight threads are not a slogan list. They are the eight
        positions the work keeps returning to, and they are the
        eight solo levels the proving ground at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        teaches by being them. The AR game is the practice
        pedagogy applied to thought: master each move alone, then
        learn the weave. The braid &mdash; the 2-braid, the 3-beat,
        the 5-beat, the full weave &mdash; only makes sense once
        you can hold each thread in your hand on its own. So that
        is the order this piece walks in. Eight threads in order,
        then the braid.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        1. Modularity at small scale
      </h2>
      <p>
        Modular kit is a tax at consumer scale and a feature at
        studio scale. The arithmetic is honest in both directions.
        At mass volume, every module is a SKU, every pair of
        modules is a QA combination, every backward-compatibility
        promise is a tax on the next quarter&rsquo;s product. The
        finance pages run the numbers and the modular line
        consolidates back into a fixed body inside eighteen months.
        Insta360 walked away from the ONE R architecture; the
        Osmo Action 2 went back to a single-piece body inside one
        cycle; GoPro&rsquo;s Mods line came and went. The market
        punishes shape variance at scale.
      </p>
      <p>
        At this studio&rsquo;s scale, the same logic flips. Every
        unit is hand-finished; QA happens on the bench in front of
        me; each module is a separate revenue surface; backward
        compatibility is on a timetable the studio sets, not a
        vendor sets. The bezel-clip, the POV rigs, the modular
        waveguides, the ComfyUI graph, the site you are reading
        &mdash; all of them are the same architecture. A spine of
        long-lived interfaces with modules that clip on and off
        without breaking the spine. The argument is in long form
        at{" "}
        <Link href="/articles/why-i-build-modular" className={ext}>
          Why I Build Modular
        </Link>
        ; the bench inventory that proves it is at{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>
        .
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/module" className={ext}>
          The Module
        </Link>{" "}
        &mdash; the first solo. The player picks the right brush for
        the prompt; the swap that consumer hardware cannot afford is
        the swap the game is built on.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        2. Persistence of vision as angle, not clock
      </h2>
      <p>
        The arm is not a clock. Its speed varies through the
        revolution &mdash; faster at the bottom of the swing,
        slower at the top, faster again on the recovery. A
        commercial pixel poi that syncs to time draws frames at
        a fixed rate and the image stretches at the slow part and
        compresses at the fast part. The photograph is a smear of
        the picture the rig was meant to write. The studio rigs
        sync to angle. A magnet at the pivot, an{" "}
        <a
          href="https://en.wikipedia.org/wiki/Hall_effect_sensor"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Allegro Hall-effect sensor{arrow}
        </a>{" "}
        on the frame, one interrupt per revolution. The rig writes
        the next column when the rotation tells it to. The picture
        in the photograph is the picture programmed into the rig.
      </p>
      <p>
        That is the architectural choice. It is not an upgrade on
        the commercial product; it is a different instrument
        answering a different question.{" "}
        <a
          href="https://en.wikipedia.org/wiki/Persistence_of_vision"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Persistence of vision{arrow}
        </a>{" "}
        is what makes the eye assemble a smear of frames into a
        single image; angular-sync is the choice that makes the
        smear land where the rig intended. The long form is at{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>{" "}
        and the firmware walk-through is at{" "}
        <Link href="/tutorials/programming-pov-frames" className={ext}>
          Programming Frames for a POV Rig
        </Link>
        .
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/trail" className={ext}>
          The Trail
        </Link>{" "}
        &mdash; the second solo. A single pointer, a single gesture,
        the trail accumulating the way a long exposure accumulates
        light. Hold the gesture continuous and the curve emerges;
        let it lapse to time-sync and the curve becomes dots. The
        body learns the lesson the rig was built to honour.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        3. The Loop closes in one session
      </h2>
      <p>
        The Loop has six positions: body, light, capture, reify,
        encounter, body. The body draws a trail; the trail is the
        light; the camera captures the light; the capture is
        reified as object (print, sculpture, mesh, hologram); the
        viewer encounters the reified object; the encounter returns
        as a gesture in another body. Six positions, one closed
        circuit. The diagram lives at{" "}
        <Link href="/the-loop" className={ext}>
          /the-loop
        </Link>{" "}
        and the worked example at{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className={ext}
        >
          Nine Seconds from Prompt to Printable
        </Link>{" "}
        is the loop closing in a single afternoon &mdash; prompt to
        STL in the time it takes to make a cup of tea.
      </p>
      <p>
        The thing the Loop argues that no individual stage argues
        is that the practice is recursive. The gesture that enters
        at position one returns at position six as someone
        else&rsquo;s prompt. The studio is not a pipeline that
        ends at the print; the print ends at the next gesture. The
        published Rookery trails are the visible part of this
        loop running across the community &mdash; one
        member&rsquo;s drawing seeds another member&rsquo;s reply
        seeds another member&rsquo;s drawing. The trail is the
        photograph; the photograph is the sculpture; the sculpture
        is the prompt; the prompt is the trail.
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/loop" className={ext}>
          The Loop
        </Link>{" "}
        &mdash; the third solo. The visitor draws a trail; the
        trail freezes; the freeze becomes a small marching-cubes
        mesh; the mesh rotates in front of the visitor. The loop
        has closed when the body that drew it sees what it left
        behind.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        4. Cold-eye watching
      </h2>
      <p>
        The studio has a video-reading prototype that watches
        footage and describes what is on the canvas. The prototype
        is not a critic. It does not say whether the work is good.
        It says what is in the frame: a curve here, a brightness
        gradient there, a colour that lifts off the background at
        roughly this hue. The seeing is the proof. The studio
        turned the prototype inward and pointed it at the
        visitor&rsquo;s own gesture. Aura describes what is on the
        canvas, not what the visitor intended. The gap between the
        intention and the trace is the lesson.
      </p>
      <p>
        Cold-eye watching is not cynicism. It is the discipline of
        reading the work the way the work actually is, before
        deciding what to do about it. It is the same discipline
        the studio applies to its own kit &mdash; the bench list
        at{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>{" "}
        and the honest gaps in{" "}
        <Link href="/articles/the-bench" className={ext}>
          The Bench
        </Link>{" "}
        are written in the same register: this is the thing on the
        desk, this is what it does, this is what it does not do.
        The watcher is at{" "}
        <Link href="/watch" className={ext}>
          /watch
        </Link>
        ; the working-method companion is{" "}
        <Link href="/articles/spiral-cognition" className={ext}>
          Spiral Cognition
        </Link>
        , which is the same cold-eye applied to the studio&rsquo;s
        own process.
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/witness" className={ext}>
          The Witness
        </Link>{" "}
        &mdash; the fourth solo. Aura narrates the drawing as it
        happens; the player sees the gap between what they meant
        to draw and what the canvas actually shows.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        5. Sovereignty &mdash; local-first architecture
      </h2>
      <p>
        Every layer of the bench keeps working if a vendor pivots
        or the connection drops. The AI pipeline is the
        load-bearing example. The model weights live on disk; the
        diffusion pass runs on the local GPU;{" "}
        <a
          href="https://ollama.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ollama{arrow}
        </a>{" "}
        runs the prompt-enrichment LLM locally; the segmenter is a
        model checkpoint, not an API key. If the building&rsquo;s
        internet drops, which it does in Salford more often than
        anyone in a cloud-only studio thinks, the bench keeps
        working. Same for the print bureau, the rigs&rsquo;
        firmware, the companion&rsquo;s long-term memory in{" "}
        <a
          href="https://qdrant.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Qdrant{arrow}
        </a>
        , the site repository on disk.
      </p>
      <p>
        Sovereignty here is architectural, not aesthetic.{" "}
        <a
          href="https://en.wikipedia.org/wiki/Sovereignty"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          The word{arrow}
        </a>{" "}
        is being used in its honest sense: the studio owns the
        instruments of its own production. Vendors are partners
        where their engineering is honestly better than the
        bench&rsquo;s; vendors are not single points of failure.
        DJI sells the airframes because flight controllers are a
        company-with-twelve-years problem; the LEDs glued to the
        spine are generic, and the firmware is mine. The
        commitment is named in long form at{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>{" "}
        and the bench list it rests on is at{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>
        .
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/sovereignty" className={ext}>
          Sovereignty
        </Link>{" "}
        &mdash; the fifth solo. A toggle severs the visitor&rsquo;s
        network connection. The trail logic keeps working. The
        proof is the demonstration the visitor&rsquo;s own router
        can run on demand.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        6. Self-taught learnability
      </h2>
      <p>
        The studio learned this work by sitting and building. Read
        the data sheet, attempt the circuit, fail, re-read,
        attempt again. Watch the YouTube channel, copy the move,
        miss the move, slow the video, copy it again. No teachers.
        Books, forums, source code, the data sheets that the
        chip vendors publish for free. The position the studio
        holds is that this is teachable, brick on brick, and that
        the same ladder is available to anyone willing to sit
        and climb it. The ladders are written down at{" "}
        <Link href="/learn" className={ext}>
          /learn
        </Link>{" "}
        &mdash; seven of them, each with rungs, each rung a
        concrete exercise.
      </p>
      <p>
        Self-taught is not a virtue claim. It is the description
        of how this work actually got built and the answer to the
        question someone landing on the site might reasonably ask:
        could I learn this? Yes. Twelve years of practice condensed
        into the published ladders, the open-source bibliography
        in{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>
        , and the workshop dispatches in the journal. The journal
        entry at{" "}
        <Link href="/journal/year-one-fire" className={ext}>
          Year One, Fire
        </Link>{" "}
        is the bottom rung, written honestly.
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/curriculum" className={ext}>
          The Curriculum
        </Link>{" "}
        &mdash; the sixth solo. The player picks one of the seven
        ladders and performs the first rung as a game exercise.
        The body has now done the act the studio writes about.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        7. Trans-led community and dignified gating
      </h2>
      <p>
        The Rookery is the community half of the studio. Members
        post trails to a shared wall; replies are append-only;
        the door is a subscription. The subscription is the
        moderation. A paid door does at the door what hand-
        moderation does inside a free community: it lets the
        people who want to be here in, and lets the people who do
        not want to be here choose not to walk through. The
        studio is trans-led; bigots will not work with me;
        saying so on the door is the kindest thing the
        architecture can do for everyone. Trans people who want
        to share work get a wall to share it on. People who
        object to that get a price tag and a quiet walk past.
      </p>
      <p>
        The framing here is architectural, not personal. Naming
        it once at the door means I do not have to fight the
        same fight inside every thread. The door is the policy;
        the wall behind it is the work. The full statement is at{" "}
        <Link href="/rookery/about" className={ext}>
          /rookery/about
        </Link>
        ; the tiers are at{" "}
        <Link href="/rookery/tiers" className={ext}>
          /rookery/tiers
        </Link>
        ; the feed itself is at{" "}
        <Link href="/rookery" className={ext}>
          /rookery
        </Link>
        . A community of practice gated by the price of dinner
        out, not by anyone&rsquo;s opinion of anyone else&rsquo;s
        identity.
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/perch" className={ext}>
          The Perch
        </Link>{" "}
        &mdash; the seventh solo. The player publishes a trail to
        the Rookery feed; the subscription gate is the door the
        level routes through. The visitor&rsquo;s gesture becomes
        someone else&rsquo;s prompt, which is the Loop&rsquo;s
        sixth position made literal.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        8. Augmentation of reach on terms the body can sustain
      </h2>
      <p>
        The studio works five airframes hard. A{" "}
        <a
          href="https://www.dji.com/uk/mavic-2/info"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Mavic 2 Pro{arrow}
        </a>{" "}
        for the editorial frame; a Neo and a Neo 2 for close-
        quarters follow work; a Mini 5 Pro for travel weight; an
        Avata 360 for the cinewhoop fly-through. Drones extend
        the body&rsquo;s working envelope into the airspace
        without requiring the body to be in the airspace. The
        bezel-clip extends gesture into VR scene-space without
        requiring the body to stand at the centre of a physical
        stage. Both are the same logic, applied to two different
        volumes. Augmentation of reach, on terms the body can
        sustain.
      </p>
      <p>
        The disability is part of the practice. Ho hum, as the
        studio says about it. Named once, named architecturally,
        not the subject. The constraint shaped the kit; the kit
        is what makes the work bookable. The remote-pilot link is
        the access ramp; the controller in the player&rsquo;s
        hand is the access ramp for VR; the body that designed
        them is the body that built the bench. The long form is
        at{" "}
        <Link href="/articles/ungrounded" className={ext}>
          Ungrounded
        </Link>{" "}
        and the fleet companion is at{" "}
        <Link
          href="/articles/the-fleet-four-airframes"
          className={ext}
        >
          The Fleet &mdash; Four Airframes
        </Link>{" "}
        (written when the case held four; the case now holds
        five).
      </p>
      <p>
        The proving level is{" "}
        <Link href="/play/bezel" className={ext}>
          The Bezel
        </Link>{" "}
        &mdash; the eighth solo. The visitor draws a trail in 3D
        space with a controller-as-bezel, in WebXR, before the
        physical clip ships. The body extends through the
        controller; the controller extends into the scene; the
        scene records the gesture. The same trail that landed on
        the CMOS for twelve years now lands in scene-space, and
        the photograph &mdash; rendered out of the scene rather
        than caught off a sensor &mdash; still lands on a wall.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The braid
      </h2>
      <p>
        Eight threads, named separately. The honest thing to say
        next is that they do not stay separate. The work happens
        when they braid. The proving ground at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        names the braids in poi vocabulary because poi is the
        body discipline the studio learned this pedagogy from:
        master each move alone, then weave them.
      </p>
      <p>
        The 2-braid is the first weave &mdash; any two threads at
        once. Module plus Trail is the typical pair: pick the
        right brush, then draw the gesture. Witness plus
        Sovereignty is the harder one: Aura watches you draw with
        the connection cut. The lesson the 2-braid teaches is
        what no single thread teaches &mdash; that the threads
        inform each other.
      </p>
      <p>
        The 3-beat weave is the classic poi move applied to
        thought. Three threads in rhythm, alternating, the rhythm
        itself the lesson. The body learns the three-beat by
        repeating it until the pattern lives in the shoulder
        rather than the head; the philosophical 3-beat works the
        same way. The 5-beat is the advanced weave &mdash; five
        threads, tighter rhythm, failure modes that multiply, the
        discipline becoming recovery rather than perfection.
        Most performances at five fail somewhere; the lesson is
        finishing anyway.
      </p>
      <p>
        The full weave is all eight threads active at once, held
        for a minute. Module choice, angular-sync trail, the
        closed loop, Aura&rsquo;s cold-eye, sovereignty mode, a
        curriculum rung, a Perch publish, the Bezel controller in
        scene-space. The whole philosophy operating
        simultaneously in one performance. The pedagogy is
        recursive: the player proves the studio&rsquo;s argument
        by performing it. Modularity is proven by the brush
        swap; angular-sync is proven by the trail rendering;
        the loop is proven by closing; the architecture proves
        itself by being run.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The eight threads in one sentence
      </h2>
      <p>
        The studio builds modular bench-grown instruments for an
        angular-sync gesture pipeline that closes the Loop in
        one session under a cold-eye watcher, runs sovereignly
        on local hardware, is teachable from the bottom rung up,
        is published behind a quiet trans-led door, and extends
        the body&rsquo;s reach into airspace and scene-space on
        terms the body can sustain.
      </p>
      <p>
        That is the practice. Eight threads, one sentence, one
        braid. Now back to the bench.
      </p>
    </>
  );
}
