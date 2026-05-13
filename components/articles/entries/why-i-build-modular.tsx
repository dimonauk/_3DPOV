import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhyIBuildModular() {
  return (
    <>
      <p>
        The{" "}
        <a
          href="https://www.insta360.com/product/insta360-oner"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Insta360 ONE R{arrow}
        </a>{" "}
        was a no-brainer for me by the time it shipped. I had been
        through a home-built rig that proved cumbersome, sidegraded
        to the Samsung Gear 360 for the 4K stitch, skipped the
        Samsung refresh, and worked through a handful of other
        cameras before settling into the Insta360 ecosystem with the
        ONE X. The ONE X was the sphere that taught me the workflow;
        the ecosystem was the one I had learned to work in by then. I have always loved
        modular kit: cameras you can take apart, computers you can
        upgrade in pieces, instruments that come on as a base unit
        plus the bits you choose. The ONE R put both together. Same
        ecosystem, modular form: a small core, a battery base, three
        lens modules that clipped on with a sprung magnetic rail
        &mdash; a wide-angle 4K, a 1-inch Leica, and a dual-lens 360.
        One body, three cameras, swappable on a tripod thread in the
        time it took to change a battery. I bought one early. The
        thesis of this article arrived in the field, body-mounted on
        a strap rig at a flow-arts rehearsal, swapping the wide
        module out for the 360 module between takes. The same core
        kept its colour pipeline, its app, its firmware family, its
        muscle memory. The lens changed. The camera changed.
      </p>
      <p>
        What I wish Insta360 had become is a serious imaging company.
        What they became is a gimmick-LED-accessory company &mdash;
        ring lights, smartphone gimbals, creator-bundle marketing,
        the X-series spheres optimised for TikTok-export not for
        print. If Insta360 had gone glass-and-serious &mdash; bigger
        sensors, proper log-colour profiles, a flagship modular line
        that treated photographic quality as load-bearing &mdash; I
        would still be there. They didn&rsquo;t. So the studio drifted
        to DJI for the editorial work, because DJI has the rigor
        Insta360 abandoned: Hasselblad glass on the Mavic 2 Pro, the
        D-Log profile for grading, twelve years of camera engineering
        experience, and an ecosystem that links the airframes, the
        gimbals, the 360 ground capture, and the goggles into one
        colour pipeline. DJI does not do modular. Insta360 did
        modular and walked away from it. At consumer scale, the
        choice is{" "}
        <em>modular OR rigorous, never both</em>. The two big vendors
        each chose the half that sells, and the half that sells is
        not the half that makes the photograph a print.
      </p>
      <p>
        The modular line is dying quietly. The ONE RS shipped in 2021
        as a modular refresh &mdash; same architecture as the ONE R,
        faster core, improved low-light, every original ONE R module
        still compatible with the new body. The RS is the upgrade
        path the studio actually has: change the body, keep the
        modules. After the RS, Insta360 moved its new development
        onto single-form factors &mdash; the X3, X4, and X5 spheres,
        the Ace Pro action cams. The modular product remained on the
        shelf but stopped getting the flagship attention. The X
        spheres sold. The modular line did not, at the volumes the
        company wanted.
      </p>
      <p>
        The studio still has the original ONE R on the bench, frame
        on, modules within reach &mdash; no case, because the frame
        is the case; the polycarbonate spine that holds the modules
        is the camera&rsquo;s structural body. It works. I use it. I
        have been thinking about upgrading the body to the RS and
        keeping every module &mdash; the same gesture, the same lens
        choices, the same colour pipeline, a faster core underneath.
        That upgrade path is the philosophy of this article in
        action: the body changes, the modules persist, the muscle
        memory stays. The fact that the RS itself is now the line
        Insta360 has quietly walked away from is the rest of the
        article. I have been thinking about why.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The trap of scale
      </h2>
      <p>
        At consumer scale, modularity is a tax. Each module is a SKU.
        Each pair of modules is a QA combination. Each combination
        owns a tail of retail shelf inches, fulfilment SKUs, returns
        handling, and support hours. Reviewers test the bestseller
        combination and the modules that do not show up in the
        review do not sell, which means the QA you funded for the
        long tail is paid for by the short head, which means the
        long tail gets cut. Backward compatibility breaks at the
        first redesign because keeping the old mount alive is a
        revenue tax on the new product. Eighteen months in, the
        finance team draws the curve and the modular line
        consolidates back to a fixed-form successor.
      </p>
      <p>
        The receipts are recent and visible. The Insta360 ONE R
        retreated to the fixed-shape RS. The{" "}
        <a
          href="https://www.dji.com/uk/osmo-action-2"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Osmo Action 2{arrow}
        </a>{" "}
        launched in 2021 with a magnetic-module attempt &mdash; a
        square camera core, a touchscreen module, a power module,
        stacked through magnets &mdash; and the Action 3 went back
        to a single-piece body inside one cycle. GoPro&rsquo;s
        modular Karma drone, the Karma Grip, the Max Lens Mod and
        the broader Mods accessory line all came and went; the
        flagship is a fixed body. Even Apple, who can absorb the
        cost of anything, has never shipped a modular phone. The
        market punishes shape variance at consumer volume; it
        always has.
      </p>
      <p>
        The one structural survivor is{" "}
        <a
          href="https://frame.work/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Framework{arrow}
        </a>
        , who ship modular laptops to a self-selecting audience that
        actually wants to open the chassis and swap a port. Their
        survival is the proof of the rule, not the exception. They
        sell to the same audience the{" "}
        <a
          href="https://en.wikipedia.org/wiki/Right_to_repair"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          right-to-repair movement{arrow}
        </a>{" "}
        organises &mdash; people who treat the kit as an instrument
        and the manual as part of the instrument &mdash; and they
        keep the modular promise by tying it to a discipline of long-
        lived interfaces, not by selling more shape variance to a
        market that does not want it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why modular works at this studio&rsquo;s scale
      </h2>
      <p>
        The arithmetic flips when the studio is small and the buyer
        is the operator. Every constraint that makes modularity a
        tax at mass scale is reversed at this scale.
      </p>
      <p>
        QA combinatorics do not explode because every unit is hand-
        finished. There is no production line testing every pair of
        modules against every other pair; there is a bench, and the
        thing on it is built and tested as a single working
        artefact before it ships. Each module is its own little run
        of one. The combination it ships in is the combination it
        was tested in.
      </p>
      <p>
        SKU explosion is a feature, not a tax, because each module
        is a separate revenue surface. The bezel-clip is one
        product. The next bezel-clip is a second. The POV rig that
        runs on the same firmware family is a third. The buyer who
        comes for the bezel and walks away with a relief tile,
        because they recognise the colour pipeline, is the
        economics of a small practice working as designed.
      </p>
      <p>
        Backward compatibility is the maker&rsquo;s choice rather
        than the market&rsquo;s. When the studio decides the
        firmware family is moving from a Teensy 3.1 to a Teensy
        4.1, that happens on a bench, with the rigs in front of me,
        on a date I set. There is no quarterly earnings call that
        decides the old mount has to die. If a buyer still wants
        the older bezel for the Quest 3 after the Steam Frame
        version ships, that buyer gets the older bezel. The cost is
        not in shareholder reports; it is in the inventory of
        stocked parts and the half-day it takes to assemble one,
        and the studio funds that out of the price of the unit.
      </p>
      <p>
        Repair-as-service stops being a support overhead and becomes
        a line of work. A bezel that needs a new LED strip is a
        ticket the studio is happy to take, because the same hands
        that built it own the soldering iron that fixes it. The
        large player has to scale repair through a third-party
        network and absorbs the margin loss; the studio repairs at
        the same bench the product was born on, and the buyer pays
        for the time honestly.
      </p>
      <p>
        The buyer is the operator. They are not a consumer who
        learned the word &ldquo;modular&rdquo; from a press release;
        they are someone who already swaps a lens, already changes
        a battery, already routes USB-C between three things on the
        desk. They want the modular kit. They came looking for it.
        Selling modularity to that buyer is not an uphill argument.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The studio is already modular
      </h2>
      <p>
        The studio has been quietly building modular without naming
        it. The pieces are already on the bench.
      </p>
      <p>
        The{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          POV LED rigs
        </Link>{" "}
        are a family, not a single object. The same{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Teensy{arrow}
        </a>{" "}
        core, the same TLC5927 driver bank, the same Hall-effect
        rotation reader, the same FastLED firmware. What varies is
        the LED count per bank, the radius of the arc, the chassis
        the strip rides, and the mount the chassis clips into.
        Poi, staff, hoop, hand-fan, the bezel that clips on to a
        Quest 3 controller &mdash; they are all the same animal
        with different limbs. The firmware family is the spine;
        the limb is the module.
      </p>
      <p>
        The{" "}
        <Link href="/bezel" className={ext}>
          bezel-clip controllers
        </Link>{" "}
        are the explicit modular case. They are, by definition, a
        module: a clip-on bezel for an existing controller, with
        the LED strip and the firmware living on the clip while
        the controller it rides on does the rest. The current
        version fits a Quest 3 controller. The next version fits a
        Valve Steam Frame controller. The version after that fits
        whatever ships next, because the bezel and the controller
        are separate objects that meet at a clip and a standard
        electrical interface, not a fused product.
      </p>
      <p>
        The{" "}
        <Link href="/articles/the-fleet-five-airframes" className={ext}>
          aerial fleet
        </Link>{" "}
        &mdash; five airframes in the carry-on case &mdash; is
        modular at the mission level. A Mavic 2 Pro for the
        editorial frame, a Neo and a Neo 2 for close-quarters
        follow work, an Avata 360 for the immersive cinewhoop
        fly-through, a Mini 5 Pro for travel weight. Each airframe
        is a module for a different mission shape. Pretending one
        airframe could do all five jobs would mean shipping
        mediocre work on four of them. The fleet weighs less than
        one professional cine drone and lives in the same case.
      </p>
      <p>
        The{" "}
        <Link href="/articles/nine-seconds-prompt-to-printable" className={ext}>
          ComfyUI pipeline
        </Link>{" "}
        is a modular graph. The diffusion node is one module; the
        segmentation node is another; the geometry node is the
        third. Swap SDXL for Flux and the rest of the graph keeps
        working. Swap SAM2 for the next segmenter and the
        downstream pipeline does not notice. The graph is the
        spine; the model checkpoint is the module. This is why
        running it locally pays off: when a model is deprecated by
        a vendor, the studio swaps the module and the pipeline
        keeps running.
      </p>
      <p>
        The site you are reading is a modular position on a loop.
        Every layer of the bench is named on{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>
        ; every article is one page on a cross-reference graph;
        every section links to the related sections that
        contextualise it. The whole thing is liftable, page by
        page, on infrastructure the studio owns. The site is the
        same architecture as the rigs &mdash; a spine of shared
        conventions, with modules that lift in and out without
        breaking the spine.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The honest limit
      </h2>
      <p>
        Modular at small scale does not mean infinitely flexible.
        The studio still chooses interfaces, and the studio still
        freezes those interfaces when it has to. The 1/4-20 tripod
        thread is a load-bearing standard across the bench. USB-C
        with Power Delivery is the power interface for everything
        battery-driven. The Teensy SDK is the firmware substrate
        for the rig family, and switching the substrate is a
        decision the studio takes once a decade, not once a
        product cycle. WebXR is the deployment standard for the
        VR-mirrored side. The colour pipeline is one grade, end
        to end, across the airframes and the 360 camera.
      </p>
      <p>
        Those are the constraints the modular logic rests on.
        Modularity is not anarchy; it is a constrained openness.
        The studio chooses the spine deliberately, freezes it for
        long enough to be useful, and varies everything that
        clips onto it. The freedom to swap a module is bought
        with the discipline to hold an interface still.
      </p>
      <p>
        And there is a second limit, just as honest: some layers of
        the practice are <em>commercial concerns</em>. The studio
        builds what it can build well. It does not build what
        requires vendor-grade engineering it cannot supply itself.
        Drones are the load-bearing example. There was no point
        doing aerial work properly until a 360 drone existed that I
        could trust in the air &mdash; non-janky, non-me-made, a
        commercial concern. So the DJI Avata 360 it is, and the
        studio waited until that hardware shipped before the whole
        aerial pipeline became viable. The line between bench-built
        and bought is not ideology; it is the practical question of
        which layer needs which kind of engineering. Build the POV
        rigs, the bezel-clip controllers, the modular waveguides,
        the local-AI orchestration. Buy the airframes, the
        printer, the Looking Glass, the Quest. The studio that
        tries to build its own multi-rotor flight controller on a
        Saturday in Salford crashes that drone on the Sunday. The
        studio that buys the right drone and clips its own LED
        rig to it gets the photograph.
      </p>
      <p>
        And the studio does, occasionally, redesign the spine.
        The Teensy 3.1 rigs are still in service, but the new
        builds are on a Teensy 4.1, which is a real interface
        break I held off as long as I could. The break was on the
        studio&rsquo;s timetable, not a vendor&rsquo;s. The old
        rigs keep working because nothing about them depends on a
        cloud service that can deprecate them. That is the
        sovereignty side of the same argument.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why the article exists
      </h2>
      <p>
        Someone landing on the{" "}
        <Link href="/bezel" className={ext}>
          bezel pre-order page
        </Link>{" "}
        and asking &ldquo;why isn&rsquo;t this from DJI&rdquo;
        deserves a one-link answer, and this is the link. The
        bezel is not from DJI because DJI cannot ship it. Not
        because they lack the engineering &mdash; they have more
        than enough &mdash; but because the economics of a
        consumer hardware company will not let a small-volume
        modular accessory carry the QA, SKU, retail, and support
        weight required at their scale. The studio can ship it
        because the studio is small, the buyer is the operator,
        the QA is per-unit, and the modules clip into a firmware
        family that has been working since 2019.
      </p>
      <p>
        The shape of this studio is not a romantic preference. It
        is the structurally correct answer for a one-person
        practice that intends to last. The modular line is the
        product line a one-person practice can actually carry.
        The mass-market players cannot follow the studio here,
        not because they are not clever but because their
        finance pages will not let them. That is the asymmetry
        the work runs on.
      </p>
      <p>
        Back to the bench.
      </p>
    </>
  );
}
