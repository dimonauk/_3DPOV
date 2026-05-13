import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheFleetUpdateMiniFivePro() {
  return (
    <>
      <p>
        The fifth airframe came home from the shop yesterday. It is
        sitting next to the case under the bench, in its own little
        zip-up shell, charging. Salford grey out of the window; the
        river the colour of the sky. A small box for a small drone.
      </p>
      <p>
        The{" "}
        <a
          href="https://www.dji.com/uk/mini-5-pro"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Mini 5 Pro{arrow}
        </a>{" "}
        earned the slot for the obvious reason: sub-250 grams, a
        one-inch sensor, and the carry-on bag fits all five
        airframes plus a controller plus the goggles plus the
        Xreals plus a charging brick. The{" "}
        <Link href="/articles/the-fleet-five-airframes" className={ext}>
          fleet write-up
        </Link>{" "}
        called out the editorial frame as the Mavic&rsquo;s job and
        nothing else&rsquo;s; the Mini 5 Pro is the first thing
        DJI has shipped under 250 grams with a sensor the Mavic
        would not be embarrassed by. Not a Mavic replacement
        &mdash; the Mavic stays in the case for the print
        deliverables &mdash; but a credible second platform for
        any commission where the brief includes the word
        &ldquo;travel&rdquo; in any sense.
      </p>
      <p>
        Honest comparison. The Neos are lighter and quieter and
        cheaper but their sensors are 1/2-inch and 12 megapixels;
        they are documentation tools, not photograph tools. The
        Avata 360 is its own thing &mdash; 360 capture, cinewhoop
        body, immersive fly-through &mdash; and not interchangeable
        with anything. The Mavic 2 Pro is the editorial frame and
        the only platform under &pound;4,000 with an adjustable
        aperture in the lens. The Mini 5 Pro slots in between the
        Mavic and the Neos: not the print platform, more than a
        documentation drone, the airframe I will reach for when
        the bag has to fly on a budget airline or walk an hour to
        a hilltop.
      </p>
      <p>
        The other reason it earned the slot is the LEDs. A pack of{" "}
        <a
          href="https://www.aliexpress.com/wholesale?SearchText=bluetooth+drone+led"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          AliExpress Bluetooth-controllable LED bars{arrow}
        </a>{" "}
        arrived the same week. Generic, cheap, app-controllable
        from a phone, gorilla-glued to the airframe spine in about
        fifteen minutes of work. The obviousness of the move is the
        small thrill: the studio rigs are months of bench work and
        custom firmware and Hall-effect sync; for the airborne
        unsynced-swarm case, a tenner of LEDs and a tube of glue
        does the job. The Vifly LEDs are still on the Avata and
        the Neos when the brief asks for clean colour science. The
        AliExpress side does the long-tail variety &mdash; the
        cases where five different airframes need to be running
        five different patterns at once and nobody is grading the
        result.
      </p>
      <p>
        The body-mounted witness camera is an{" "}
        <a
          href="https://www.insta360.com/product/insta360-oner"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Insta360 ONE R{arrow}
        </a>{" "}
        with the modules. Wide-angle module on for the swarm pieces,
        the 360 dual-lens module on when the brief wants a sphere of
        the body running the kata, the 1-inch Leica module on when
        the brief is editorial-grade. Same core, three optical
        configurations, swap in the field on a single tripod thread.
        Ground-level capture of the swarm above, body-mounted at
        chest height, so the rig walks through the kata while the
        camera holds the line at the height of my own eye. It is not
        the editorial camera; it is the witness camera, riding the
        body that is running the swarm.
      </p>
      <p>
        The ONE R is the camera I always wished DJI made. Modular,
        swappable, one body and many roles. The reason DJI does not
        ship that shape, and the reason Insta360 quietly walked away
        from it in favour of the fixed-form X-series, is the
        same reason every consumer modular-product line eventually
        gets killed: it does not survive the move to mass scale. Too
        many SKUs, too many failure surfaces across the
        combinations, too many users who want one good camera, not a
        kit. The modular logic only works when the buyer is also the
        operator and the manufacturer is small enough to make to
        order. That is a useful observation to write down, because
        it describes the studio more honestly than I had previously
        noticed.
      </p>
      <p>
        What changes with five. The mission shape that was not
        possible with four is the unsynchronised LED swarm. Five
        airframes doing five different DJI QuickShots over a site
        at the same time, each with the LEDs running their own
        pattern, a long-exposure camera below catching the
        volumetric light field. The result is a photograph of a
        thing that does not exist until the frames stack in
        Fusion. Holograms in the sky that are not actually
        holograms; light fields painted by drones that are not
        actually field-aware. The body knows where it is. The
        camera knows what it sees. The drones do not have to know
        about each other; the photograph is the integration step.
      </p>
      <p>
        This is the technique that{" "}
        <Link href="/journal/first-light" className={ext}>
          First Light
        </Link>{" "}
        was the first quiet step toward. That entry was one
        airframe, three flights, mixed results. This is a fleet,
        same site, parallel cameras, the trail accumulating in
        post rather than synchronised at flight. The architectural
        cousin to the bench-built rigs is{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>{" "}
        &mdash; same persistence-of-vision trick at a different
        scale, same studio refusal to be talked into a single
        catalogue answer.
      </p>
      <p>
        Next outing: a hilltop east of the city, before the season
        turns. Five airframes up at dusk, the camera on a tripod
        below, the Osmo on the chest, the LEDs on Bluetooth, the
        brief one word long &mdash; <em>weather</em>. The full
        fleet, the new technique, the photograph in stacked
        frames. The bench is on{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>
        ; the working line is{" "}
        <Link href="/aerial" className={ext}>
          /aerial
        </Link>
        ; the result will end up in the field notes when the
        camera has anything to say about it.
      </p>
    </>
  );
}
