import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function Ungrounded() {
  return (
    <>
      <p>
        For twelve years the studio worked on a plane. The poi swing
        through an arc the arm describes; the long exposure is a flat
        photographic surface; the sculpture sits on a plinth roughly
        at eye height; even the POV LED rigs operate in the same
        kinesphere the body can reach. Everything the studio made
        landed on a flat surface, or in the body&rsquo;s swing-plane,
        or in the depth of a single printed page. The kit reached as
        far as the arm reached and the photograph stayed inside the
        rectangle. That was the constraint. Name it plainly: the
        studio was a two-dimensional practice with three-dimensional
        gestures baked into it, and the photograph was always going to
        be a flat slice through a body that knew it was bigger than
        the frame.
      </p>
      <p>
        That changed when the studio left the plane. The trigger was
        not a thesis. It was a piece of kit shipping. Until that piece
        of kit shipped, the move was provisional &mdash; rehearsed in
        the head during two years off my feet, sketched in journals,
        but not bookable. After it shipped, the move was real.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The kit that did the unground
      </h2>
      <p>
        There was no point doing drones properly until a 360 drone
        existed that the studio could trust in the air &mdash;
        non-janky, non-me-made, a commercial concern. That is the
        load-bearing sentence of this article and it is the same logic
        the studio applies everywhere it touches a vendor. Build what
        the bench can build well; buy what requires engineering the
        bench cannot honestly supply. A multi-rotor flight platform
        with omnidirectional obstacle sensing, an{" "}
        <a
          href="https://en.wikipedia.org/wiki/Multirotor"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          industrial-grade transmission stack{arrow}
        </a>
        , a 360-camera sensor pair calibrated against the airframe,
        and a controller pipeline that links the goggles, the
        gimbal, and the live feed into one colour pipeline &mdash;
        that is not a Saturday-in-Salford project. That is a company
        with twelve years of drone engineering behind it.
      </p>
      <p>
        The studio waited. The Mavic 2 Pro had been on the bench for
        years as a stills platform; the Neo and Neo 2 came in as
        follow-cam tools once they shipped; the Mini 5 Pro is the
        carry-on body for travel work; the airframes filled mission-
        specific gaps in the case under the bench. But none of them
        unlocked the aerial line on their own, because none of them
        captured the volumetric airspace around the drone &mdash; only
        the forward-facing slice the gimbal was pointed at. The move
        from 2D-bound to 3D-capable practice required a flight
        platform with serious 360 capture engineering built into the
        airframe itself. The{" "}
        <a
          href="https://store.dji.com/uk/product/dji-avata-360"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Avata 360{arrow}
        </a>{" "}
        was that platform. Two newly designed square CMOS sensors,
        each with the imaging area of a 1-inch sensor, capturing
        8K/60 HDR 360&deg; video around the airframe in dual-lens
        mode. O4+ transmission. Twenty-three minutes of flight inside
        propeller protection that lets the airframe come within
        centimetres of brick. Shoot once, reframe in post, with the
        whole sphere on the SD card.
      </p>
      <p>
        That airframe is what made the studio&rsquo;s aerial line
        bookable. The other four &mdash; the{" "}
        <a
          href="https://www.dji.com/uk/mavic-2/info"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mavic 2 Pro{arrow}
        </a>{" "}
        for the editorial frame, the Neo and Neo 2 for the
        close-quarters follow work, the Mini 5 Pro for travel weight
        &mdash; sit around the Avata 360 as mission-specific tools.
        Five airframes in the case, four of them flying the same
        forward-facing optical logic the studio had been working with
        since 2014, and one of them capturing the whole volume around
        itself. The fleet article at{" "}
        <Link href="/articles/the-fleet-four-airframes" className={ext}>
          The Fleet
        </Link>{" "}
        was written when the case held four. The case now holds five.
        The fifth is the one this article is about.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What changed when the studio left the plane
      </h2>
      <p>
        Aerial was the first move, and once it landed, the rest of
        the studio went volumetric in cascade. Every layer of the
        bench that had been operating on a plane found its 3D
        equivalent and rolled into it. The list is the architecture.
      </p>
      <p>
        The 360 aerial capture is 3D in space. An equirectangular
        frame is, by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Equirectangular_projection"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          definition{arrow}
        </a>
        , a sphere flattened to a rectangle for storage; the original
        capture is the volume around the lens. The studio&rsquo;s
        deliverables can now ship as a sphere, a virtual-tour walk-
        through, a head-mounted reframe, or a single 16:9 still cropped
        out of the volume. The 2D photograph the studio used to ship
        as the deliverable is now a slice through a larger volumetric
        work.
      </p>
      <p>
        The{" "}
        <a
          href="https://lookingglassfactory.com/portrait"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Looking Glass Portrait{arrow}
        </a>{" "}
        is the output side of the same shift. A holographic display
        renders the same scene as forty-eight parallax views landing
        in physical space in front of the panel; the viewer&rsquo;s
        eyes pick the two views their head position selects and
        assemble depth out of the parallax. The studio&rsquo;s
        photographic outputs no longer have to be printed flat. The
        same sculpture, the same poi trail, the same captured volume
        can land as a hologram on the desk.
      </p>
      <p>
        The{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        WebXR scenes are 3D in scene-space. The proving ground for the
        loop &mdash; what used to be a flat web page with a gallery on
        it &mdash; is now a volumetric scene the visitor moves through
        with gesture, gaze, and controller. The trails the body draws
        in WebXR are the same trails the photograph captures, except
        they are written in scene-space coordinates that the renderer
        can walk a camera through after the fact.
      </p>
      <p>
        The AR game braids levels into the player&rsquo;s own room.
        Where the early prototypes happened on a 2D screen showing a
        3D scene, the current build runs through the headset&rsquo;s
        passthrough and places level geometry on the floor the player
        is actually standing on. The same trail-drawing logic, except
        the canvas is now the room.
      </p>
      <p>
        The{" "}
        <Link href="/bezel" className={ext}>
          bezel-clip
        </Link>{" "}
        is the VR side of the POV LED rig. A controller already in the
        player&rsquo;s hand, with an LED strip clipped to its bezel,
        wired into the same{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Teensy{arrow}
        </a>{" "}
        firmware family the studio&rsquo;s poi run on. The gesture
        that drew a flat trail in front of a camera is the same
        gesture that draws a trail through headset space. Same arm,
        same arc, different volume.
      </p>
      <p>
        The 3D-printed waveguide objects are the trail reified out of
        the 2D photograph and into solid form. A long-exposure
        captures a trail; the studio prints the trail as a physical
        waveguide that holds and re-emits light. The photograph
        becomes an object. The object lives on the plinth. The plinth
        is no longer a metaphor; it is where the work ends up.
      </p>
      <p>
        The{" "}
        <Link href="/sphere" className={ext}>
          /sphere
        </Link>{" "}
        view is the cross-reference graph rendered volumetrically.
        What used to be a flat list of articles on a page is now a
        graph the visitor rotates, with the article they are reading
        at the centre and every adjacent piece arranged in 3D around
        it. The site you are reading became, page by page, a
        volumetric work.
      </p>
      <p>
        Everything in the studio is now 3D. The 2D photograph survived
        as a single useful slice through the larger volumetric work,
        which is the same thing the studio always wanted the
        photograph to be &mdash; an evidence frame for a gesture that
        was never really flat in the first place.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Loop&rsquo;s &ldquo;trail reified&rdquo; is the move off
        the plane
      </h2>
      <p>
        The architectural reading lives at{" "}
        <Link href="/the-loop" className={ext}>
          /the-loop
        </Link>
        . The Loop has six positions; the fourth is{" "}
        <em>trail reified</em>, the step where the trace of the body
        becomes a solid artefact. Until the studio left the plane,
        that step happened on paper &mdash; the photograph was the
        reification, ink on a flat surface. The move into volume is
        what makes the reification step honest. The trail becomes a
        waveguide. The waveguide becomes a sculpture. The sculpture
        becomes a hologram. The hologram becomes a scene-space anchor.
        Each of those is the same step, executed in a different
        material. The Loop did not change; the material did.
      </p>
      <p>
        Reading the Loop as a 2D process worked when the practice was
        2D. Reading it as a volumetric process is the reading the
        practice now requires, because the practice is now
        volumetric. The diagram on{" "}
        <Link href="/the-loop" className={ext}>
          /the-loop
        </Link>{" "}
        is the same diagram; the substrate the diagram describes is
        the one that just changed.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        I was grounded
      </h2>
      <p>
        I was grounded.
      </p>
      <p>
        Two years in bed designing the framework was being grounded in
        the most literal sense. The home-built 360 rig that opens the
        story on{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          ten years of 360 cameras, one pole
        </Link>{" "}
        was assembled in bed; the framework the studio is now
        executing was drawn, mentally, in horizontal silence across
        those two years. After that, walking with a trekking pole and
        capturing 360 at chest height was still 2D-plane work &mdash;
        the camera at a metre above my head, the photograph still
        coming off a body whose working envelope was a small arc.
      </p>
      <p>
        The drones are an augmentation of access. They let a body
        whose working envelope is variable operate at altitude
        through a remote-pilot link. Not by fixing the body; by
        extending its working envelope through technology the studio
        controls. The airframe goes up to thirty metres because that
        is where the photograph needs the camera; the pilot stays on
        the ground because that is where this pilot can sustain a
        shoot. The disability is part of the practice and has been
        since the two years in bed. Ho hum, as the studio says about
        it. Named once, named architecturally, not the subject.
      </p>
      <p>
        The honest version is that the bench-built-not-bought
        position rests on a body that can sustain bench work, and the
        bench work needed an aerial extension that did not require
        the body to be in the air. The Avata 360 is that extension.
        The remote-pilot link is the access ramp. The disability is
        the constraint the access ramp is built around, the same way
        the rest of the kit is built around constraints &mdash;
        sensor size, firmware family, the 1/4-20 thread on top of the
        pole. Constraints are how the studio makes decisions.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The bezel-clip is the same logic for VR
      </h2>
      <p>
        The{" "}
        <Link href="/bezel" className={ext}>
          bezel-clip
        </Link>{" "}
        is the augmentation pattern in headset space. A gesture in 3D
        scene-space without requiring the body to be in 3D physical
        space. The player stands in their room, hands at a normal
        working height, and the controller draws trails through a
        volume the headset renders around them. The body does not
        have to climb a stage, swing a tethered weight, or hold a
        kata for a long exposure. The trail still gets drawn. The
        gesture still gets captured. The photograph &mdash; rendered
        out of the WebXR scene rather than caught off a CMOS &mdash;
        still lands on a wall.
      </p>
      <p>
        The pattern is the same pattern the drone uses. Extend the
        body&rsquo;s reach through controllable technology so the
        body can sustain the work. The drone extends reach upward
        through airspace. The bezel-clip extends reach inward through
        headset space. Both are the studio&rsquo;s answer to the same
        constraint, applied to two different volumes.
      </p>
      <p>
        The deeper version is on{" "}
        <Link href="/about" className={ext}>
          /about
        </Link>{" "}
        and the kit version is on{" "}
        <Link href="/articles/vr-pov-controllers-the-product" className={ext}>
          VR POV controllers &mdash; the product
        </Link>
        . Both pages name the same thing the disability framing names
        on this one: the studio designs for a body it can sustain,
        and the kit is the design.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The studio is no longer on a plane
      </h2>
      <p>
        That is the shift. The poi swing in three dimensions and the
        camera now captures them in three. The aerial work captures
        the volume around the airframe rather than the slice in front
        of it. The Looking Glass renders the volume back on the desk.
        The WebXR scene puts the gesture inside a renderer the
        visitor walks through. The AR game places level geometry on
        the player&rsquo;s floor. The 3D print reifies the trail into
        solid waveguide. The site renders its own graph as a sphere.
        The 2D photograph survives as a slice. Everything else is
        volume.
      </p>
      <p>
        The kit that did the unground was a commercial-grade flight
        platform with a serious 360 capture rig in one airframe; the
        studio waited for that platform to ship and built the aerial
        line around it on the day it arrived. The kit that does the
        unground in VR is the bezel-clip, extending a controller
        already in the player&rsquo;s hand into the same gesture
        vocabulary the studio has been writing for twelve years. Both
        are bench-built modules clipped onto bought hardware. Both
        are the same logic. Both extend the studio&rsquo;s reach
        without requiring the body to be in the place the work lands.
      </p>
      <p>
        The studio is{" "}
        <a
          href="https://www.caa.co.uk/drones/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CAA-registered{arrow}
        </a>
        , the airframes are insured, and the working line for aerial
        commissions is at{" "}
        <Link href="/aerial" className={ext}>
          /aerial
        </Link>
        . The bench is still the bench &mdash; the literal desk in
        Salford, the soldering iron, the printer doing its
        belt-printed thing in the corner &mdash; but the volume the
        practice operates inside is now the volume above it, the
        volume around the headset, and the volume the visitor
        navigates through on the site. Back to the bench. The bench
        is still flat; everything the bench makes, no longer.
      </p>
    </>
  );
}
