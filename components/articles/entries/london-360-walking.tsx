import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function London360WalkingTheCameraEvolution() {
  return (
    <>
      <p>
        The kit is a trekking pole with a selfie stick screwed into
        the top of it and a 360 camera screwed into the top of{" "}
        <em>that</em>. Three things in a column. The pole is the leg
        I am already carrying for the walk; the selfie stick is a
        sixty-centimetre extension that puts the camera roughly a
        metre above my head; the camera looks in every direction at
        once and quietly deletes the stick from its own footage on
        the way to the SD card. From the equirectangular it looks as
        if a small floating eyeball followed me along the South Bank
        at chest height, unsupported.
      </p>
      <p>
        The technique is called the{" "}
        <a
          href="https://www.insta360.com/blog/tips/invisible-selfie-stick-how-to-use.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          invisible selfie stick{arrow}
        </a>{" "}
        and it works because every 360 camera in the last decade has
        used two back-to-back lenses with more than 180&deg; of view
        each, which means the stitch line between the two hemispheres
        is wider than the stick. The software just hands the stitch
        a hint &mdash; <em>cheat the seam over the pole, please</em>{" "}
        &mdash; and the pole is gone. Insta360 named the trick;
        every manufacturer in the category quietly does the same
        thing.
      </p>
      <p>
        I have walked an absurd number of London hours holding that
        column &mdash; Bankside, Limehouse Cut, the alleys behind
        Smithfield, the Regent&rsquo;s Canal towpath from Camden out
        to the Lea, the tideway at low water, the bits of the South
        Bank that turn into a wind tunnel at dusk. Most of the
        photographs are research; a smaller number are deliverables.
        The kit changed during the walking, and the kit changing is
        the story.
      </p>

      <p>
        <strong>
          The home-built rig (~2014) &mdash; the one that actually
          started it.
        </strong>{" "}
        Before there was a consumer 360 camera I trusted to take into
        the street, there was a couple of security cameras built
        together on a monopod. Industrial IP-security kit, the kind
        normally bolted to a car-park ceiling watching a stationary
        scene that does not move. I took the camera, built a mobile
        system around it, fitted a battery pack, dropped the whole
        assembly on the monopod, and walked it into the centre of
        London. The optics were rigorous; the housing was industrial;
        the per-frame image could hold up. I knew while I was
        building it that this was going to matter &mdash; not because
        the photographs would be famous, but because the act of
        building the rig was the act the studio&rsquo;s whole
        practice would turn out to rest on. I built the system in
        bed. Around then I had spent the better part of two years
        off my feet, and those two years were not lost time &mdash;
        they were when the framework for the entire practice got
        designed, mentally, in horizontal silence: the rigs, the
        printer, the pipeline, the loop, the bench-built-not-bought
        position the studio still holds. The home-built 360 rig was
        one of the first concrete expressions of that thinking. The
        disability is part of the practice and has been since that
        period; ho hum, as the studio says about it. The rig still
        works. I keep it. It earned its place on the shelf the same
        way the{" "}
        <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
          Sellotape and Tilt Brush controller
        </Link>{" "}
        earned its place in the drawer ten years later. The framework
        the two years drew was the framework the studio is now
        executing. I was right.
      </p>
      <p>
        The <em>networking</em> was the problem. The camera was
        designed for a fixed installation behind a managed access
        point, talking to a recorder over a copper run. Out on the
        pavement on a phone hotspot, it would spend twenty to thirty
        minutes negotiating an association before it condescended to
        take a frame. I would stand on the kerb with the monopod up,
        watching pedestrians flow past, waiting for one photograph.
        The networking stack assumed a kind of network that does not
        exist in a person&rsquo;s hand on a street. A fixed-install
        camera flown as portable kit is an architecture lesson
        delivered slowly, in person, on the pavement at Liverpool
        Street at two in the afternoon.
      </p>
      <p>
        This is the chapter that turns out to be the origin proof of
        the studio&rsquo;s whole position. Even the first 360 capture
        the studio ever made was a thing the studio had to build for
        itself, because the right tool did not exist at consumer
        scale. The article on{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          why I build my own rigs
        </Link>{" "}
        describes the photographic side of the pattern; the
        modular-versus-rigorous diagnosis in{" "}
        <Link href="/articles/why-i-build-modular" className={ext}>
          Why I Build Modular
        </Link>{" "}
        describes the vendor-side of it. This page is the chapter
        where both of those threads start, ten years before either
        article was written.
      </p>

      <p>
        <strong>
          Samsung Gear 360 (2016) &mdash; the sidegrade.
        </strong>{" "}
        A spherical body slightly smaller than a baseball, two{" "}
        <a
          href="https://en.wikipedia.org/wiki/Samsung_Gear_360"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          15-megapixel f/2.0 fisheyes{arrow}
        </a>{" "}
        on opposite poles, IP53 splash rating, stitched
        3840&nbsp;&times;&nbsp;1920 video and 30-megapixel stills. I
        bought it because it looked like a small alien egg and
        because Samsung were first-out-the-gate at a price a
        one-person studio could justify. The eyeball was charming
        kit. The image was not. The stitch line was visible in any
        frame with detail across it, the dynamic range collapsed the
        moment a London sky did anything other than be grey, and the
        only sensible way to get the files off the camera was through
        a Samsung phone, which I did not own. The eyeball lives in a
        drawer next to the sellotaped Tilt Brush controller from the{" "}
        <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
          origin walk
        </Link>{" "}
        piece. It earned that drawer. It taught me what 360 was for.
      </p>

      <p>
        <strong>
          Ricoh Theta &mdash; the photographer&rsquo;s 360.
        </strong>{" "}
        The Theta line is the camera the architectural and virtual-
        tour crowd settled on, and after the eyeball I rented one for
        a fortnight to see why. The{" "}
        <a
          href="https://en.wikipedia.org/wiki/Ricoh_Theta"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Theta Z1{arrow}
        </a>{" "}
        was the first consumer 360 camera with 1-inch sensors &mdash;
        two of them, back to back &mdash; and a RAW workflow that
        treated the equirectangular as a photograph rather than a
        social-media artefact. The stills off that camera were the
        first 360 frames I held in Lightroom and thought,{" "}
        <em>this is a photograph</em>. The case against was that it
        was a photographer&rsquo;s tool, not a walker&rsquo;s. The
        body was heavy enough to feel the column droop after an hour;
        the video side was a long way behind the stills; the price
        was tour-photographer money, not field-research money. I gave
        the rental back and kept the lesson:{" "}
        <em>sensor size is the only thing that matters in this category</em>
        . I have not had cause to revise that.
      </p>

      <p>
        <strong>
          Insta360 ONE X &rarr; X2 &rarr; X3 &rarr; X4 &mdash; the
          long middle.
        </strong>{" "}
        This is the part of the kit history that took the most years
        and the most walking. The{" "}
        <a
          href="https://www.insta360.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Insta360 catalogue{arrow}
        </a>{" "}
        was the obvious answer for a long time: the cameras stitched
        well, the invisible-stick trick was theirs, the app was
        polished, and the release cadence was relentless. The X2 in
        2020, the X3 in 2022 with 1/2-inch 48-megapixel sensors and a
        touchscreen, the X4 in 2024 with 8K capture and a battery you
        could actually finish a walk on. Each generation was a
        plausible upgrade and I bought the upgrades.
      </p>
      <p>
        What I noticed, walking with all four in turn, was that the
        improvement was not really in the glass. The sensors got a
        bit bigger; the lenses stayed roughly the same speed. What
        got dramatically better was the <em>processing</em>. The
        Insta360 app and Studio software got smarter about
        stabilisation, smarter about reframing &mdash; their{" "}
        <a
          href="https://www.insta360.com/feature/aireframe"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          AI Reframe{arrow}
        </a>{" "}
        tool will watch a 360 clip and propose a cropped 16:9 cut
        through it, picking subjects and panning automatically
        &mdash; smarter about denoise, smarter about colour. The
        cameras leaned harder and harder on the software to fix what
        the sensors were not big enough to capture in the first
        place.
      </p>
      <p>
        This is fine if you are filming yourself snowboarding for
        social. It is not fine if you are walking London at dusk
        trying to take a single photograph that you can print at
        forty centimetres on the long edge. The AI reframe makes
        decisions about your composition; the AI denoise hallucinates
        detail into the brick of an East End wall that was, on the
        night, only suggested by the actual photons. I have a
        catalogue of Insta360 frames where the camera made up a
        building that was not quite the building I was standing in
        front of. Once you see the trick, you can&rsquo;t unsee it.
        The processing is the product. The glass is along for the
        ride.
      </p>

      <p>
        <strong>GoPro MAX &mdash; the brief detour.</strong> I tried
        a GoPro MAX in the middle of the Insta360 years on the theory
        that GoPro&rsquo;s ruggedness would matter more than its
        image quality on a wet towpath. It did. The MAX was an honest
        action camera with a 360 mode bolted on; the stitching was
        reliable, the body would survive being dropped in the canal,
        and the colour science was the colour science of every GoPro
        since the Hero5. None of which is the answer when the brief
        is a photograph. The MAX went back. The ruggedness lesson
        stayed.
      </p>

      <p>
        <strong>
          DJI Osmo 360 &mdash; the camera I am walking with now.
        </strong>{" "}
        DJI released the{" "}
        <a
          href="https://www.dji.com/360"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Osmo 360{arrow}
        </a>{" "}
        in summer 2025 and I bought one inside the first month. The
        spec sheet is the argument: two new-design 1/1.1-inch{" "}
        <em>square</em> CMOS sensors &mdash; the square aspect means
        the entire sensor area gets used for the equirectangular
        instead of cropping a circle out of a rectangle, which DJI
        rate as roughly 25% more useful sensor than the
        round-sensor 1-inch competitors. f/1.9 across both lenses.
        2.4&micro;m pixels. 13.5 stops of dynamic range. 8K/30 360
        video for a hundred minutes continuous. 120-megapixel stills
        off the sphere when you want the print resolution. 10-bit
        colour. It is, in straight optical-and-sensor terms, the
        largest piece of glass-and-silicon ever made in this form
        factor.
      </p>
      <p>
        Walking with it after the X4 is unkind to the X4. Brick is
        brick. The river at blue hour has the depth it had on the
        night. The processing pass in DJI Mimo is decisively
        lighter-handed than Insta360 Studio &mdash; you can tell the
        camera captured a real image first and was asked to grade it
        second, rather than the other way round. That is the
        architectural choice I had been waiting for:{" "}
        <em>glass and sensor before software</em>. The cameras that
        lean on AI to make up the difference are real cameras for the
        briefs they are real cameras for; the brief I am writing for
        is photographs you can print, and the only honest answer to
        that brief is the bigger sensor.
      </p>

      <p>
        <strong>The ecosystem argument.</strong> The other reason the
        Osmo 360 lives on top of the trekking pole now is that the{" "}
        <Link
          href="/articles/the-fleet-five-airframes"
          className={ext}
        >
          rest of the studio&rsquo;s aerial kit is DJI
        </Link>
        . The Mavic 2 Pro, the Neo, the Neo 2, the Avata 360, the
        Mini 5 Pro &mdash;
        same colour pipeline, same Mimo / DaVinci handoff, same
        goggles when I want to review a clip head-mounted, same
        battery philosophy, same controller ecosystem. The Osmo 360
        fits the existing workflow as a ground-level extension of
        the aerial one. A walking shot at chest height and a drone
        shot at thirty metres come off the same edit page graded the
        same way. I am not running two parallel ecosystems any more,
        which is the kind of friction that does not announce itself
        as friction until you remove it.
      </p>
      <p>
        I do not particularly enjoy the &ldquo;all in on one
        manufacturer&rdquo; position philosophically. Practically, on
        a one-person studio budget, the alternative is to maintain
        twice the software, twice the firmware updates, twice the
        accessory drawer. The Osmo 360 was the moment the
        calculation flipped. Glass quality plus ecosystem coherence
        beat the Insta360 software lead, and they beat it
        convincingly enough that I sold the X4 to fund the move.
      </p>

      <p>
        <strong>The pole, still.</strong> The trekking pole survives
        every camera change. The selfie stick survives every camera
        change. The mount at the top is a quarter-inch thread, which
        is the one bit of standardisation the industry has agreed
        on, and every 360 camera I have owned has accepted it. The
        pole is a Black Diamond Z-pole I walk with anyway; the
        selfie stick is a generic carbon-fibre extension off Amazon.
        The whole rig collapses into a backpack and weighs less than
        the Mavic case. It is the most honest piece of kit in the
        studio &mdash; an actual walking tool that holds an actual
        camera in the air, with no electronics between them.
      </p>
      <p>
        The current loop is: walk somewhere in London with the pole
        and the Osmo 360 on top, capture the equirectangulars, take
        them home, run them through DaVinci to grade and to reframe,
        and either keep the sphere intact for a virtual-tour
        deliverable or extract a single 16:9 frame for the{" "}
        <Link href="/photographs" className={ext}>
          photographs page
        </Link>
        . The aerial counterpart of the same walk &mdash; the same
        site, from the air &mdash; lives at{" "}
        <Link href="/aerial" className={ext}>
          /aerial
        </Link>
        . The two sit on either side of the same pipeline.
      </p>
      <p>
        Ten years of 360 cameras, four manufacturers, one pole. Now I
        am going to walk to Rotherhithe before the light goes.
      </p>
    </>
  );
}
