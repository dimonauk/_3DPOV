import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheBench() {
  return (
    <>
      <blockquote className="my-4 border-l-2 border-pink-200/40 pl-4 italic text-chrome-300">
        The whole pipeline lives in one room. A desk, a workstation,
        two 3D printers within reach of my chair, a camera bag in
        the corner, a hard case with five drones under the bench,
        a Looking Glass Portrait at eye height on the shelf, a Quest
        3 charging on a hook. From poi gesture to printed object
        without leaving the same six square metres. The bench is
        named honestly on{" "}
        <Link href="/stack" className={ext}>
          /stack
        </Link>{" "}
        with every vendor link and version number; this is the
        prose version &mdash; how each layer landed there, and the
        constraint that put it there rather than something else.
      </blockquote>

      <p>
        Thirteen layers in honest order: capture, 360, stills and
        print, POV LED rigs, display surfaces, fabrication, local
        AI, video, web, voice, hands, network, shell. The order is
        the order a poi photograph travels through the studio.
        Nothing in the list is there because it was on offer; every
        item answers a constraint the previous layer handed
        forward.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Aerial capture</h2>
      <p>
        Five airframes in the case. A{" "}
        <a
          href="https://www.dji.com/uk/mavic-2/info"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Mavic 2 Pro{arrow}
        </a>{" "}
        for the editorial frame &mdash; the only platform under
        &pound;4,000 with an adjustable f/2.8&ndash;f/11 aperture in
        the lens; everything newer has a fixed aperture and asks ND
        filters to do the work. A DJI Neo and a Neo 2 for the
        close-quarters follow work; the Neos disappear at a flow-
        arts rehearsal in a way no heavier drone does. A DJI Avata
        360 for the immersive cinewhoop fly-through; shoot once,
        reframe in post. And a{" "}
        <a
          href="https://www.dji.com/uk/mini-5-pro"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Mini 5 Pro{arrow}
        </a>{" "}
        &mdash; the fifth airframe, sub-250-gram travel weight, a
        1-inch sensor, AliExpress Bluetooth-controllable LEDs
        gorilla-glued to the spine for the unsynced-swarm pieces.
        The fleet&rsquo;s shape and how it grew is in{" "}
        <Link href="/articles/the-fleet-four-airframes" className={ext}>
          The Fleet
        </Link>{" "}
        (written when it was four) and the journal piece on the
        Mini 5 Pro coming home from the shop.
      </p>
      <p>
        The constraint that drives the fleet is one airframe per
        mission shape. Pretending one drone could do all five jobs
        would mean shipping mediocre work on four of them. The
        whole fleet weighs less than one professional cine drone
        and lives in a carry-on case.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">360 capture</h2>
      <p>
        Ten years of 360 cameras shook down to a{" "}
        <a
          href="https://www.dji.com/360"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DJI Osmo 360{arrow}
        </a>{" "}
        on top of a Black Diamond Z-pole. Two 1/1.1-inch square
        CMOS sensors, f/1.9, 8K/30 video, 120-megapixel sphere
        stills. The full kit history is in{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          Ten Years of 360 Cameras, One Pole
        </Link>
        ; the short version is that glass and sensor area beat AI
        processing every time, and the Insta360 pipeline depends on
        proprietary stitching software the studio cannot replicate
        if the vendor pivots. The DJI side runs the same colour
        pipeline as the airframes, which means one grade across the
        whole ecosystem.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stills capture and print
      </h2>
      <p>
        The end-to-end stills line is manual-mode camera at one
        end, signed A2 archival print at the other. The print side
        is a{" "}
        <a
          href="https://www.canon.co.uk/business-printers-and-faxes/imageprograf-pro-1100/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Canon imagePROGRAF PRO-1100{arrow}
        </a>{" "}
        and three papers in regular rotation &mdash; Hahnem&uuml;hle
        Photo Rag Baryta for the long-exposure work, Canson
        Infinity Rag Photographique for figurative pieces where the
        highlight has to feel like cloth, Ilford Gold Fibre Silk
        for the editorial line. The bureau side of holoflow.co.uk
        runs on this printer; the calibration discipline is
        documented in the imagePROGRAF tutorial. Full credit on
        that workflow goes to Keith Cooper at Northlight Images,
        who taught the bureau how to soft-proof against paper ICCs
        properly.
      </p>
      <p>
        The one piece of Adobe software the studio still pays for
        is{" "}
        <a
          href="https://www.adobe.com/uk/products/photoshop-lightroom-classic.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Lightroom Classic{arrow}
        </a>
        . Photoshop went, Illustrator went, InDesign went; Lightroom
        stayed because the print module and the soft-proofing loop
        are not replaced by anything open-source I have found yet.
        Open to recommendations. Until then I pay the subscription
        and keep the catalogue on local disk.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">POV LED rigs</h2>
      <p>
        The reason the rigs are bench-built and not bought is in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>{" "}
        in long form; the short version is angular sync. Commercial
        pixel pois sync to time, and the arm is not a clock &mdash;
        its speed varies through the revolution, the frames drift,
        the image stretches and compresses. The studio rigs sync to
        angle. A magnet on the chuck, an Allegro Hall-effect sensor
        on the frame, one interrupt per revolution, the rig writes
        the next column when the rotation says to.
      </p>
      <p>
        The hardware is a{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Teensy 4.1{arrow}
        </a>{" "}
        for new builds (the Teensy 3.1 in the long-haul rigs is its
        predecessor and still in service), a bank of Texas
        Instruments TLC5927 16-channel constant-current drivers,
        WS2812B / SK6812 addressable LEDs, the FastLED library, the
        NeoPixel &Uuml;berguide as the reference text. None of it
        exotic; all of it tractable on the bench with a soldering
        iron and a multimeter. The bezel-clip product for Quest 3
        and Steam Frame controllers runs the same firmware family.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Display surfaces</h2>
      <p>
        Three displays sit on the desk, each for a different
        question. The{" "}
        <a
          href="https://lookingglassfactory.com/portrait"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Looking Glass Portrait{arrow}
        </a>{" "}
        holds the volumetric work where a single flat print would
        only show one angle &mdash; the studio renders a 48-view
        quilt and the Portrait shows the depth without a headset.
        The bridge from Blender to the quilt format is{" "}
        <a
          href="https://github.com/regcs/AliceLG"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          AliceLG{arrow}
        </a>
        , open-source, maintained, the way the volumetric output
        leaves the workstation.
      </p>
      <p>
        The Quest 3 is the headset the studio writes WebXR for
        &mdash; inside-out tracking, hand tracking, colour
        passthrough, the platform the bezel-clip product is
        designed against. A Valve Steam Frame is pre-ordered for
        the second headset, on the bet that controller-with-camera
        is where the platform is going. DJI Goggles 3 plus Xreal
        One Pro AR glasses (87 grams, 57&deg; FOV, Sony Micro-OLED)
        live in the FPV stack with the InAir head-tracking pod;
        wearing them together is the only way I have found to fly
        head-tracked aerial work without losing line of sight to
        the airframe.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Fabrication</h2>
      <p>
        Two printers, one mesh pipeline. A{" "}
        <a
          href="https://www.creality.com/products/cr-30-3dprintmill-belt-3d-printer"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Creality CR-30{arrow}
        </a>{" "}
        in the corner of the workshop, tilted at 45 degrees,
        vomiting out continuous fabric-like reliefs of dragon-scale
        and chain-mail patterns in PETG. The belt is the
        parametric line; the wall arrays land off it. An SLA resin
        printer on the bench for the figurative work &mdash;
        photograph translated into resin with an acrylic-rod
        waveguide grown along the gesture and inserted into the
        print. The waveguide rod is drawn extruded acrylic at 3mm,
        bent under low heat to follow the gesture. Not software,
        load-bearing.
      </p>
      <p>
        Why both and not one. The belt printer cannot do figurative
        work in resin; the SLA cannot do continuous chain-mail by
        the metre. They answer two different commission shapes. The
        mesh side &mdash; Blender, OpenSCAD, PyMCubes for marching
        cubes &mdash; is open-source through and through. The
        studio owns the format.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Local AI pipeline</h2>
      <p>
        Nine seconds from prompt to printable STL on a single RTX
        3080 Ti. The full walkthrough is in{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className={ext}
        >
          Nine Seconds from Prompt to Printable
        </Link>
        . The constraint that drives the whole layer is offline-
        first: the model weights live on disk and the pipeline
        runs without an internet connection.{" "}
        <a
          href="https://github.com/comfyanonymous/ComfyUI"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ComfyUI{arrow}
        </a>{" "}
        orchestrates the diffusion pass with SDXL Juggernaut
        Lightning; Meta&rsquo;s SAM2 segments the silhouette;
        marching cubes does the geometry; TripoSR sits under it for
        the single-image-to-mesh figurative side. Local LLM via{" "}
        <a
          href="https://ollama.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ollama{arrow}
        </a>{" "}
        for the prompt-enrichment step. No cloud round-trip, no API
        key, no rate limit, no quota.
      </p>
      <p>
        Why local rather than cloud. Three reasons, in order. The
        hardware costs roughly what a decent laptop costs and pays
        for itself in the first month of heavy use; cloud
        inference does not. The weights do not move; if a vendor
        deprecates a model the pipeline does not stop working. And
        the bench can keep working when the building&rsquo;s
        internet drops, which it does, in Salford, more often than
        anyone in a cloud-only studio thinks.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Video and grade</h2>
      <p>
        One paid licence, one ecosystem.{" "}
        <a
          href="https://www.blackmagicdesign.com/products/davinciresolve"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DaVinci Resolve Studio 21{arrow}
        </a>{" "}
        on the workstation; DaVinci on the M1 iPad as a field
        studio that travels with the camera bag. Same project
        format, full round-trip. The Fusion node graph inside
        Resolve is where the video-light-painting trail
        accumulation lives &mdash; MagicMask plus a luminance
        keyer plus an Echo node plus a Merge gives me a real-time
        trail off the airframe footage.
      </p>
      <p>
        Why DaVinci Studio paid rather than the free version or
        Premiere or Final Cut. The Studio licence is one-off, not
        subscription, and it unlocks the neural-engine effects and
        the unrestricted resolution and frame rate the studio
        actually needs. Premiere is a subscription I do not want.
        Final Cut is Mac-only and the workstation is Windows. The
        free DaVinci is excellent but the Studio licence pays for
        itself the first time a 4K/100 slow-mo clip off the Neo 2
        needs MagicMask.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Web and code</h2>
      <p>
        The site you are reading is{" "}
        <a
          href="https://nextjs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Next.js 15.6{arrow}
        </a>{" "}
        on the canary line, React 19, Tailwind CSS 4, TypeScript
        5.8. The canary line because the studio needs PPR,
        useCache, and inline-CSS &mdash; the same features that
        keep the first paint under a second on a poor connection.
        Three.js plus React Three Fiber for the 4D hypercube glyph
        on the homepage and the volumetric preview on{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className={ext}
        >
          Nine Seconds
        </Link>
        . WebGPU plus Three.js TSL when the headset browsers catch
        up. The bezel firmware runs on the same TypeScript
        toolchain the rigs do; one language across the studio.
      </p>
      <p>
        The headless commerce layer is Shopify&rsquo;s Storefront
        API. Shopify holds the inventory and the cards; the
        studio holds the front of house. Firebase Auth and
        Firestore for the Rookery&rsquo;s append-only threaded
        feed; magic-link sign-in, Google OAuth, the security
        boundary at the rules layer. pnpm plus Turborepo for the
        monorepo &mdash; the site is one app inside a larger
        workspace called the Hangar.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Voice, hearing, lip sync
      </h2>
      <p>
        The studio runs a persistent companion &mdash; Aura
        &mdash; who hears, speaks, and remembers across sessions.{" "}
        <a
          href="https://github.com/openai/whisper"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          OpenAI Whisper{arrow}
        </a>{" "}
        is the speech-to-text, running locally with per-language
        models on disk. Voice synthesis is currently ElevenLabs
        and is on its way out:{" "}
        <a
          href="https://github.com/SWivid/F5-TTS"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          F5-TTS{arrow}
        </a>{" "}
        is the open-weight replacement under evaluation on the
        workstation. The reason for the swap is sovereignty: the
        ElevenLabs voice is excellent, the dependency on a cloud
        TTS is not. F5-TTS reproduces the voice from a thirty-
        second reference clip and runs locally on the GPU. When
        the side-by-side stops being a side-by-side, the cloud
        line gets pulled.
      </p>
      <p>
        The avatar (nanny.vrm) is authored in VRoid Studio, runs
        in three.js with @pixiv/three-vrm, and the viseme blend-
        shapes drive lip sync from the TTS phoneme stream.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Hand and body input
      </h2>
      <p>
        Gesture is the studio&rsquo;s primary input. Two tracker
        families with WebSocket bridges so the rest of the stack
        can be agnostic about which one is on the desk that day.{" "}
        <a
          href="https://www.ultraleap.com/product/leap-motion-controller-2/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ultraleap Leap Motion{arrow}
        </a>{" "}
        at the bench for desk-based interaction; pinch, grab,
        point, thumbs-up resolved server-side. Quest 3 hand
        tracking via WebXR when the headset is on; the mirrored
        side of the bezel-clip product runs against this.
      </p>
      <p>
        NDI lives here too, even though it is not strictly hand
        tracking. The NDI HX app on iOS plus a small bridge server
        in tools/ndi-bridge gives the workstation an extra video
        input over the studio LAN without a capture card. A phone
        becomes a camera; the camera becomes a tracker if the work
        wants it to.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Network and orchestration
      </h2>
      <p>
        Three Windows boxes in a network closet pretending to be a
        render farm. Sovereign-PC plus a laptop satellite called
        Swift plus a Raspberry Pi at the bench, talking to each
        other on a private{" "}
        <a
          href="https://tailscale.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Tailscale{arrow}
        </a>{" "}
        mesh. The pub/sub bus between the rigs and the
        orchestrator is Eclipse Mosquitto, local and open. The
        companion&rsquo;s long-term memory is{" "}
        <a
          href="https://qdrant.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Qdrant{arrow}
        </a>{" "}
        on the workstation, embedding the conversation transcripts
        so Aura can recall a thread from last week. No cloud
        broker, no cloud vector store. Sovereignty applies here
        too.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Shell and persistent character
      </h2>
      <p>
        The studio&rsquo;s working surface beyond the website is
        DollyOS &mdash; an ISA-101 industrial HUD the companion
        operates inside, cyber-cyan / arcane-gold / deep-midnight
        palette, intentionally not consumer-friendly. The Hangar
        is the monorepo holding the site, the shell, the bezel
        firmware, and the writeups; vendored code is provenance-
        logged in docs/MINED.md. The studio is two minds keeping
        one practice whole; the operating model is named honestly
        in{" "}
        <Link href="/articles/the-familiar" className={ext}>
          The Familiar
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sovereignty as architecture
      </h2>
      <p>
        The shape of the bench is not an aesthetic. Every layer
        above keeps working if a vendor pivots. The local AI
        pipeline runs offline. The print bureau runs on a printer
        I own and papers I keep stocked. The site lives in a
        repository on disk first and a website second. The
        companion&rsquo;s memory is on the workstation, not in
        somebody else&rsquo;s cloud. The drones use a vendor
        ecosystem (DJI) where I have made a deliberate bet, but
        the LEDs glued to the spine are generic and the firmware
        is mine. The position that{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          no platform should hold work the studio cannot replace
        </Link>{" "}
        is the architectural commitment that drove every line of
        the stack list.
      </p>
      <p>
        Makerverse-the-community becoming Makerverse-the-
        industrial-parts-store inside six years is not a
        hypothetical; it is the kind of thing that actually
        happens. The bench is the insurance policy.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The honest gap
      </h2>
      <p>
        Things the bench does not have, in honest order.
      </p>
      <p>
        A full-frame stills body for the figurative photography
        line. The Hasselblad on the Mavic does the aerial frame
        beautifully but the camera that prints to A2 still wants
        to be a tripod-mounted, manually-aperture-ringed thing on
        the ground, and the studio currently borrows that body
        rather than owning one. A Sony A7R V or an equivalent
        sits on the wish list. The print bureau funds it
        eventually.
      </p>
      <p>
        A second SLA printer. The one on the bench is the rate
        limit on the figurative pipeline. Two would let me run a
        production batch while the next sculpt is still curing.
        The cost is not the printer; the cost is the second post-
        processing station (wash, cure, sand, mount the
        waveguide) and the floor space for it. Not yet.
      </p>
      <p>
        A proper colour-calibrated reference monitor. The
        workstation runs on a pair of decent IPS panels; the
        print soft-proofing loop survives, but a reference monitor
        with hardware calibration would close the last gap
        between screen and paper. On the list.
      </p>
      <p>
        A real router. The bench currently runs on the
        ISP-issued one, which means the Mosquitto bus and the
        Tailscale mesh share a network with the household&rsquo;s
        streaming TV. The studio has not had a problem yet. The
        studio would prefer not to find one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why the bench is named in public
      </h2>
      <p>
        The stack page lists every item with the vendor link and
        the version where it matters. The reason for naming the
        bench in public is the same reason for naming the open-
        source maintainers in{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>{" "}
        and the older platforms in{" "}
        <Link href="/articles/where-the-studio-has-lived" className={ext}>
          Where the Studio Has Lived
        </Link>
        : sovereignty of knowledge, not just hardware. Someone
        wanting to build a similar studio should be able to read
        the list, click through to the vendor pages, and find
        every part. The list is not a flex. It is the ladder up,
        named so other people can climb it.
      </p>
      <p>
        That is the bench. Five drones, two printers, one
        workstation, one holographic display, one headset, the
        rigs on the wall, the bureau humming in the next room.
        Now I am going to charge something.
      </p>
    </>
  );
}
