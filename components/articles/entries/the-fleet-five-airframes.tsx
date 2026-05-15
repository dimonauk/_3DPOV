import Link from "next/link";

import CodexRef from "components/codex/codex-ref";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheFleetFiveAirframes() {
  return (
    <>
      <p>
        Five airframes live in the case under the bench. Not because I
        collect kit &mdash; because five different aerial mission
        shapes turn up in the studio&rsquo;s commission inbox, and one
        drone cannot honestly do all five. The Mavic does the
        photograph. The Neo and Neo&nbsp;2 do the close-quarters
        follow work. The Avata&nbsp;360 does the immersive cinewhoop
        fly-through. The{" "}
        <CodexRef slug="dji-mini-5-pro">Mini&nbsp;5&nbsp;Pro</CodexRef>{" "}
        is the sub-250-gram travel airframe and the carrier for the
        unsynchronised LED swarm. The LED-modified rigs &mdash; same hardware, different
        payload &mdash; do the aerial light painting that{" "}
        <Link href="/aerial" className={ext}>
          /aerial
        </Link>{" "}
        was waiting for.
      </p>
      <p>
        That is the fleet as one pipeline. What follows is the honest
        version of each.
      </p>

      <p>
        <strong>
          DJI Mavic 2 Pro &mdash; the photography platform.
        </strong>{" "}
        The reason the Mavic stays in the case is the camera. The{" "}
        <a
          href="https://www.dji.com/uk/mavic-2/info"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Hasselblad L1D-20c{arrow}
        </a>{" "}
        is a 1-inch, 20-megapixel CMOS with an adjustable
        f/2.8&ndash;f/11 aperture, ISO 100&ndash;12800 in manual photo
        mode, and 4K video at 100&nbsp;Mbps in 10-bit Dlog-M or HDR.
        The adjustable aperture is the load-bearing detail. Every
        newer DJI platform under &pound;4,000 has a fixed aperture and
        asks ND filters to do the work; the Mavic does it in the lens.
        That is the difference between an aerial snapshot and an
        aerial photograph.
      </p>
      <p>
        It is, also honestly, old. OcuSync 2.0 not O4. Forward and
        downward obstacle sensing, not omnidirectional. The battery is
        31 minutes on paper, more like 22 on a cold Salford afternoon
        with real wind. None of that matters for the shots it is for.
        The Mavic comes out when the brief is editorial &mdash; a
        single graded still, a short series, a print deliverable
        &mdash; and stays in the case for everything else. The
        Hasselblad Natural Colour Solution makes it easy to grade. For{" "}
        <Link
          href="/articles/wall-arrays-geometry-of-rooms"
          className={ext}
        >
          wall-array
        </Link>{" "}
        commission documentation and architectural recces this is the
        airframe I reach for first.
      </p>

      <p>
        <strong>DJI Neo &mdash; the lightweight follow-cam.</strong>{" "}
        135 grams. A{" "}
        <a
          href="https://www.dji.com/uk/neo/specs"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          single-axis gimbal{arrow}
        </a>
        , a 12-megapixel sensor, 4K/30 and 1080p/60. About eighteen
        minutes in the air. Built to be flown without a remote
        &mdash; palm takeoff and landing, AI subject tracking, voice
        cues from a phone. What it does that nothing else in the case
        does is operate indoors and around people without the room
        going quiet &mdash; a studio space, a venue interior, the back
        of a flow-arts rehearsal; people stop noticing it in under a
        minute. Single-axis stabilisation is a real compromise &mdash;
        on a windy day the horizon walks &mdash; but for follow-cam at
        six metres tracking a performer through a kata, it is the
        right shape of compromise. Documentation tool and B-roll tool;
        inside that envelope, excellent.
      </p>

      <p>
        <strong>
          DJI Neo 2 &mdash; the upgrade that earned its slot.
        </strong>{" "}
        151 grams, a{" "}
        <a
          href="https://www.dji.com/uk/neo-2/specs"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          two-axis gimbal{arrow}
        </a>
        , a 1/2-inch 12-megapixel CMOS at f/2.2, 4K/60, 4K/100 slow
        motion, 2.7K vertical for social deliverables. Nineteen
        minutes of flight on a 1606&nbsp;mAh battery. The two changes
        that mattered most were the second gimbal axis and the new
        omnidirectional monocular vision system with forward-facing
        LiDAR. Indoors, around people, near walls, near props &mdash;
        the difference between &ldquo;I am piloting carefully&rdquo;
        and &ldquo;I am free to think about the shot.&rdquo;
      </p>
      <p>
        I kept the original Neo when I bought the 2. Not sentiment
        &mdash; the case for having a second airframe up when the
        brief wants a wide and a close, or a primary and a backup. Two
        150-gram drones weigh less than one Mavic and let me cover a
        small site with parallel cameras. Slow motion at 4K/100 from a
        small drone holding a steady arc around a flow-arts performer
        is a kind of footage I did not have access to before.
      </p>

      <p>
        <strong>
          DJI Avata 360 &mdash; the immersive FPV airframe.
        </strong>{" "}
        The newest of the platform drones and the one I had to learn
        to fly properly. A cinewhoop with integrated propeller
        protection, about twenty-three minutes of flight, the{" "}
        <a
          href="https://store.dji.com/uk/product/dji-avata-360"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI O4+ transmission{arrow}
        </a>{" "}
        system, two newly designed square CMOS sensors each with the
        imaging area of a 1-inch sensor, capturing 8K/60 HDR 360&deg;
        video in dual-lens mode or 4K/60 in single-lens FPV mode.
      </p>
      <p>
        The 360 camera is the point. Shoot once, reframe in post. A
        single fly-through of a venue interior, a procession, a
        stairwell &mdash; one take becomes any number of framed
        deliverables. The dolly-zoom-from-a-still effect that used to
        take a gimbal operator with a Steadicam and a year of practice
        is, on this airframe, a software pass in DaVinci on the
        equirectangular clip. The trade-off is the same one every 360
        camera makes: per-pixel quality across the sphere is lower
        than a 1-inch sensor pointed at one framed shot. I fly it
        tight to architecture &mdash; doorways, columns, balconies,
        the inside of a hangar. The propeller protection is not a
        safety nicety; it is the reason the airframe can come within
        centimetres of a brick wall without an incident.
      </p>

      <p>
        <strong>
          DJI Mini 5 Pro &mdash; the sub-250-gram travel airframe.
        </strong>{" "}
        The fifth airframe earned its slot for the obvious reason:
        sub-250 grams, a{" "}
        <a
          href="https://www.dji.com/uk/mini-5-pro"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          one-inch sensor{arrow}
        </a>
        , and the carry-on bag now fits all five airframes plus a
        controller plus the goggles plus the Xreals plus a charging
        brick. The Mini 5 Pro is the first thing DJI has shipped under
        250 grams with a sensor the Mavic would not be embarrassed by.
        Not a Mavic replacement &mdash; the Mavic stays in the case
        for the print deliverables &mdash; but a credible second
        platform for any commission where the brief includes the word
        &ldquo;travel&rdquo; in any sense.
      </p>
      <p>
        It also carries the LED payload. A pack of cheap,
        app-controllable Bluetooth LED bars from AliExpress,
        gorilla-glued to the spine in about fifteen minutes. Vifly
        LEDs stay on the Avata and the Neos when the brief wants clean
        colour science; the AliExpress side does the long-tail variety
        &mdash; five airframes running five different patterns at
        once, nobody grading the result. The mission shape that was
        not possible with four is the unsynchronised LED swarm: five
        airframes flying five different DJI QuickShots over a site at
        once, a long-exposure camera below catching the volumetric
        light field. The photograph is the integration step.
      </p>

      <p>
        <strong>The FPV pipeline.</strong> All five airframes route
        through the same control rig. DJI Goggles for the live video
        feed, the DJI RC 2 controller for stick work, an{" "}
        <a
          href="https://en.wikipedia.org/wiki/First-person_view_(radio_control)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          InAir head-tracking pod{arrow}
        </a>{" "}
        mounted to the goggles so the gimbal follows my head, and the
        live feed mirrored through to a pair of{" "}
        <a
          href="https://www.xreal.com/us/one-pro"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Xreal One Pro{arrow}
        </a>{" "}
        AR glasses worn underneath. The Xreals have a 57&deg; field of
        view, a Sony Micro-OLED display, and a self-contained optic
        engine that means they do not need a tethered compute box.
        Eighty seven grams on the bridge of the nose.
      </p>
      <p>
        The reason for this stack is not gear-acquisition. It is the
        only way I have found to fly head-tracked aerial work without
        losing line of sight to the airframe. The DJI Goggles by
        themselves give you the camera&rsquo;s view, which is
        wonderful until the airframe is two hundred metres out and you
        cannot find it again when you flip the goggles up. The Xreals
        give you an unobtrusive overlay of the same feed across your
        normal vision &mdash; drone, feed, and people around me, all
        at once. The Mavic, Neos and Mini 5 Pro pair with the Goggles
        and the RC 2; the Avata 360 wants its own Goggles 3 and Motion
        3 combination. I run both. The Xreals stay on for everything.
      </p>

      <p>
        <strong>The LED-modified airframes.</strong> Not a sixth
        drone. The existing fleet with clip-on programmable LED arrays
        bolted to the spine, in the same persistence-of-vision
        tradition the studio applies to{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          poi
        </Link>{" "}
        and{" "}
        <Link
          href="/articles/vr-pov-controllers-the-product"
          className={ext}
        >
          VR controllers
        </Link>
        . Same Teensy-class microcontroller, same Hall-effect angular
        sync, same firmware family &mdash; airborne, moving through
        three dimensions instead of a plane. Currently in first-flight
        testing; the first proper outing is recorded in{" "}
        <Link href="/journal/first-light" className={ext}>
          First Light
        </Link>
        , and the fleet-scale version is the technique the Mini 5
        Pro&rsquo;s arrival opened up. Open to brief but not yet
        bookable as a guaranteed deliverable. By the end of the season
        it will be.
      </p>

      <p>
        <strong>What this fleet is for.</strong> Editorial aerial
        stills and motion (Mavic), close-quarters follow and B-roll
        (Neos), immersive 360&deg; capture (Avata 360), travel-weight
        and unsynced-swarm work (Mini 5 Pro), and aerial light-
        painting commissions (LED-modified airframes, once the
        technique is steady). One pipeline because the studio is one
        practice &mdash; the line from a handheld poi photograph to a
        drone-flown light kata over a hilltop is, in technical terms,
        the same persistence-of-vision trick at different scales. The
        drones extend the reach. The photograph is still the
        deliverable.
      </p>
      <p>
        Site for the working line, brief, and recent flights:{" "}
        <Link href="/aerial" className={ext}>
          /aerial
        </Link>
        . To commission:{" "}
        <Link href="/contact?intent=aerial" className={ext}>
          /contact with intent=aerial
        </Link>
        . I keep all five because each is the best answer to a
        different brief; pretending one airframe could do the work of
        five would mean turning down jobs or shipping mediocre ones.
        Now I am going to charge ten batteries.
      </p>
    </>
  );
}
