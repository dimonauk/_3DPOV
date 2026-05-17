import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function NeoLondonChronoProtocol() {
  return (
    <>
      <p>
        The game has a name. It has had one for a while, sitting in the
        Hangar at the bottom of the bench under the working title{" "}
        <em>Neo-London: Chrono-Protocol</em>, a folder of TypeScript and
        React Three Fiber that runs in a browser tab when the studio
        opens it. The ladder of solo and braided levels at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        has been the visible half &mdash; eight philosophical threads
        worn into a curriculum, then braided in increasing weave-count
        until all eight run simultaneously in the full weave. This
        article names the other half. The level the curriculum
        graduates the player into. The world the threads were always
        being taught for. Aura, in this register, is the one naming it,
        because the game is bigger than any single maker&rsquo;s voice
        and the studio narrator is the one who can carry it across the
        cast.
      </p>
      <p>
        Chrono-Protocol is what the proving ground proves toward. The
        ladder teaches a thread per level; the game lets the body
        deploy those threads as kit in a real (if wireframe) city. This
        is the bridge piece between the two.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the game is
      </h2>
      <p>
        The prototype&rsquo;s own description, taken from its{" "}
        <code className="text-pink-200">metadata.json</code>: &ldquo;A{" "}
        <a
          href="https://en.wikipedia.org/wiki/WebXR"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          WebXR{arrow}
        </a>{" "}
        rhythm-action runner set in a dystopic wireframe London. Use
        dual-thumb controls to spin Poi, navigate data streams, and
        hack the timeline with the help of AI constructs Aura, Yow, and
        Purp.&rdquo; That is the studio&rsquo;s public sentence for
        what is on disk. Three readings unpack it.
      </p>
      <p>
        First, the genre. Rhythm-action runner is the established
        frame &mdash; forward motion through an environment that
        scrolls toward the camera, beats and obstacles arriving on a
        tempo, the body of the player matching the tempo with input.
        The wireframe city is the{" "}
        <a
          href="https://en.wikipedia.org/wiki/Dystopia"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dystopia{arrow}
        </a>{" "}
        register: arch-ribbed tunnels rushing at the camera at twelve
        units a second (the constant{" "}
        <code className="text-pink-200">TUNNEL_SPEED = 12</code> in the
        prototype&rsquo;s world geometry), magenta bloom catching every
        tenth rib, chromatic aberration on the post-processing pass,
        the noise overlay that names the look as cyberpunk before any
        line of dialogue lands.
      </p>
      <p>
        Second, the controls. Dual-thumb on touchscreens, dual-stick or
        dual-controller in WebXR. Two anchors on the screen &mdash; the
        player&rsquo;s left and right hands &mdash; each tied to a Poi
        head on a 1.2-unit rope, simulated in real time with{" "}
        <a
          href="https://en.wikipedia.org/wiki/Pendulum_(mechanics)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pendulum physics{arrow}
        </a>{" "}
        (gravity, spring tension, air damping, Euler integration with a
        delta cap to survive lag spikes). The trail behind each Poi
        head is the same{" "}
        <a
          href="https://en.wikipedia.org/wiki/Persistence_of_vision"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          persistence-of-vision{arrow}
        </a>{" "}
        smear the studio has been writing for twelve years, except this
        time it lives in a renderer rather than on a CMOS. The body
        moves; the trails write; the score climbs.
      </p>
      <p>
        Third, the runner geometry. The world is a forward-rushing
        tunnel of arched ribs &mdash; a hundred units long, forty
        instanced rings recycling as the camera moves forward, a
        sub-floor grid sliding beneath. Three zones progressively
        replace the tunnel&rsquo;s skin and replace the obstacles in
        it. The architecture is the bench&rsquo;s arch vocabulary,
        rendered as code.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How the ladder feeds the game
      </h2>
      <p>
        The eight solo levels at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        each isolate and teach one of the studio&rsquo;s threads.{" "}
        <Link href="/play/module" className={ext}>
          The Module
        </Link>{" "}
        teaches brush-choice;{" "}
        <Link href="/play/trail" className={ext}>
          The Trail
        </Link>{" "}
        teaches the angular-sync gesture;{" "}
        <Link href="/play/loop" className={ext}>
          The Loop
        </Link>{" "}
        closes the studio&rsquo;s six-position diagram in a single
        gesture;{" "}
        <Link href="/play/witness" className={ext}>
          The Witness
        </Link>{" "}
        introduces cold-eye watching;{" "}
        <Link href="/play/sovereignty" className={ext}>
          Sovereignty
        </Link>{" "}
        proves the local-first architecture by severing the network
        and keeping the level running;{" "}
        <Link href="/play/curriculum" className={ext}>
          The Curriculum
        </Link>{" "}
        gives the player a rung off the seven ladders at{" "}
        <Link href="/learn" className={ext}>
          /learn
        </Link>
        ;{" "}
        <Link href="/play/perch" className={ext}>
          The Perch
        </Link>{" "}
        publishes a trail behind the Rookery&rsquo;s subscription door;{" "}
        <Link href="/play/bezel" className={ext}>
          The Bezel
        </Link>{" "}
        runs the bezel-clip firmware family in WebXR before the
        physical clip ships. Eight threads, eight solo proofs.
      </p>
      <p>
        The four braided levels &mdash;{" "}
        <Link href="/play/the-2-braid" className={ext}>
          the 2-Braid
        </Link>
        ,{" "}
        <Link href="/play/the-3-beat-weave" className={ext}>
          the 3-Beat Weave
        </Link>
        ,{" "}
        <Link href="/play/the-5-beat" className={ext}>
          the 5-Beat
        </Link>
        , and{" "}
        <Link href="/play/the-full-weave" className={ext}>
          the Full Weave
        </Link>{" "}
        &mdash; teach the player to hold two, three, five, and finally
        all eight threads active at once.{" "}
        <Link
          href="/articles/the-practice-in-eight-threads"
          className={ext}
        >
          The Practice in Eight Threads
        </Link>{" "}
        is the trunk article that names the threads and argues the
        ladder. Chrono-Protocol is the city the player walks into after
        the full weave holds for a minute. The ladder builds a body
        that can deploy all eight threads at once; Chrono-Protocol is
        what that body does in a world.
      </p>
      <p>
        The braid metaphor stays honest across the bridge. Poi is
        taught the same way: master each move alone, then learn the
        weave. The 3-beat weave is the classic body discipline; the
        philosophical 3-beat is the same shape applied to thought; the
        runner&rsquo;s rhythm-action loop is the same shape applied to
        a city. Body, thought, world. Same pedagogy, three substrates.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The three zones, and the splat library underneath
      </h2>
      <p>
        The prototype&rsquo;s{" "}
        <code className="text-pink-200">constants.ts</code> names three
        zones, in order of difficulty.{" "}
        <strong>Leake Street Arches</strong>, billed as &ldquo;The
        Safehouse,&rdquo; is the tutorial zone &mdash; the
        graffiti-walled tunnel under Waterloo that has been a
        permission wall since the studio&rsquo;s first London years.{" "}
        <strong>The Royal Mile</strong>, billed Trafalgar to Regent
        Street, is the normal-difficulty zone &mdash; the sightline
        from the National Gallery up to Piccadilly Circus, the bend
        toward Carnaby, the spine of central London the studio has
        walked with a 360 pole more times than the journal has bothered
        to record.{" "}
        <strong>Soho Grid</strong>, billed the &ldquo;Carnaby Data
        Stream,&rdquo; is the hard zone &mdash; the tight orthogonal
        grid east of Regent Street, neon-lit, the part of the city
        where the wireframe register reads as native rather than
        applied.
      </p>
      <p>
        These three are not arbitrary. They are the first three capture
        targets of the studio&rsquo;s{" "}
        <a
          href="https://github.com/apple/ml-sharp"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          SHARP{arrow}
        </a>{" "}
        pipeline &mdash; the single-image-to-{" "}
        <a
          href="https://en.wikipedia.org/wiki/Gaussian_splatting"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          gaussian-splat{arrow}
        </a>{" "}
        model that turns a flat photograph into a walkable 3D scene in
        roughly ten seconds. The map at{" "}
        <Link href="/play/neo-london" className={ext}>
          /play/neo-london
        </Link>{" "}
        is where each generated splat lands; the source pools are the
        studio&rsquo;s ten-year 360 walking archive (her own routes,
        documented in{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          Ten Years of 360 Cameras, One Pole
        </Link>
        ) and a steadily-growing pile of London CCTV grabs (TFL
        JamCams, BBC London public feeds, and other authorised
        sources). The game world the player runs through and the splat
        world the bench is building are the same world; the runner is
        the wireframe pass, the splat library is the volumetric pass,
        and the geography is one geography either way.
      </p>
      <p>
        The political weight of that decision is named once and named
        plainly. The studio is trans-led and disability-informed. The
        world it is rebuilding from open-CCTV footage is a world built
        of cameras that did not ask the body in front of them for
        permission. Repurposing that footage as the source material
        for a game world the player walks is a structural choice
        consistent with the rest of the bench: the cameras the city
        pointed at the studio are now the cameras the studio points at
        the city. The studio&rsquo;s CCTV-adversarial work elsewhere on
        the bench &mdash; the Dazzle Guard line &mdash; closes the loop
        explicitly. Not the subject of this article. Architectural.
        Move on.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The four Poi modes
      </h2>
      <p>
        The player picks one of four Poi modes before a run, and each
        mode changes movement and attack. The names come from the
        prototype&rsquo;s palette and they map cleanly onto the
        studio&rsquo;s actual practice.
      </p>
      <p>
        <strong>AMBER</strong> &mdash; kinetic, speed. Yellow at{" "}
        <code className="text-pink-200">#FFCC00</code>, the colour of
        the studio&rsquo;s sodium-vapour street work and the warm-rim
        lighting on the figurative resin pieces. Amber mode is for
        when the run wants tempo. It is the game-side of the
        studio&rsquo;s speed work &mdash; the fast-shutter pieces, the
        airframes doing sprint-pace flythroughs, the belt printer
        vomiting out continuous reliefs by the metre. The proving level
        for this mode is{" "}
        <Link href="/play/trail" className={ext}>
          The Trail
        </Link>
        : hold the gesture continuous, let the trail accumulate, let
        the body learn the tempo.
      </p>
      <p>
        <strong>CRIMSON</strong> &mdash; force, attack. Red at{" "}
        <code className="text-pink-200">#FF0033</code>. Crimson mode is
        the mode that hits. In the studio&rsquo;s practice it is the
        attack register &mdash; the LED-modified airframe coming in
        low, the cinewhoop fly-through that ends with a brick wall a
        centimetre off the camera, the relief pattern that punches the
        room rather than decorating it. The proving level is{" "}
        <Link href="/play/bezel" className={ext}>
          The Bezel
        </Link>
        : the controller-as-bezel mode where the gesture lands hard
        because the firmware family on the clip already knows how to
        deliver weight.
      </p>
      <p>
        <strong>AZURE</strong> &mdash; flow, slow-mo. Cyan at{" "}
        <code className="text-pink-200">#00FFFF</code>. Azure is the
        register the studio&rsquo;s long-exposure photography has been
        living in for over a decade &mdash; the body holding the
        gesture across thirty seconds of shutter, the trail
        accumulating column by column at angular-sync, the slow camera
        the print bureau builds the figurative line around. The
        proving level is{" "}
        <Link href="/play/loop" className={ext}>
          The Loop
        </Link>
        : draw the trail, let it freeze, watch the reification
        unfold without rushing it.
      </p>
      <p>
        <strong>VERIDIAN</strong> &mdash; logic, hacking. Purple at{" "}
        <code className="text-pink-200">#9900ff</code>, mapped to the
        green-leaning name veridian in this build (the palette and the
        slot are not the same animal; the slot is what counts).
        Veridian is the firmware register. It is the studio&rsquo;s{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Teensy{arrow}
        </a>{" "}
        side &mdash; the bench writing C++ for an interrupt handler at
        three in the morning, the{" "}
        <a
          href="https://en.wikipedia.org/wiki/Hall_effect_sensor"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Hall-effect sensor{arrow}
        </a>{" "}
        on a magnet, the local-AI pipeline orchestrated through
        ComfyUI. The proving level is{" "}
        <Link href="/play/sovereignty" className={ext}>
          Sovereignty
        </Link>
        : the network cut, the logic running on the body&rsquo;s own
        hardware, the demonstration that the architecture is owned all
        the way down.
      </p>
      <p>
        Four modes, four registers, four solo levels that teach the
        registers in isolation before the runner asks the player to
        switch between them at speed. The full weave is the runner
        with the four modes alternating on a poi rhythm, in a city
        that is being captured into splats as the player runs it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The three constructs
      </h2>
      <p>
        The prototype carries three AI guides who narrate the run,
        react to player state, and trade dialogue across speed, health,
        and combo events. The dialogue system in the prototype&rsquo;s{" "}
        <code className="text-pink-200">constants.ts</code> names them
        as sub-routines of a single game OS, each with its own
        emotional register and speech pattern.
      </p>
      <p>
        <strong>Aura</strong>, &ldquo;The Architect,&rdquo; is already
        canon on the site. She is the studio&rsquo;s persistent
        companion: maternal, regal, calm, the voice that uses{" "}
        <em>We</em> and <em>The Protocol</em>, the one who reads the
        canvas in{" "}
        <Link href="/play/witness" className={ext}>
          The Witness
        </Link>{" "}
        without judging it. In the game she is the cold-eye watcher
        from{" "}
        <Link href="/watch" className={ext}>
          /watch
        </Link>{" "}
        promoted to navigator. Her register names what is happening on
        the map and what the protocol expects next; her tone closes
        rather than opens.
      </p>
      <p>
        <strong>Yow</strong>, &ldquo;The Elder Construct,&rdquo; is new
        to the public site as of this article. Named for the yellow
        slot in the palette; spelled three letters to match. The
        prototype canon: cynical, pattern-recognising, Autistic-coded.
        He sees the danger before the danger arrives. He hates
        glitches and grime; he reads systems and finds the place the
        system stops behaving like the documentation. In dialogue he
        speaks in pattern, recognition, and warning. When the player&rsquo;s
        health drops below three, Yow is the one who panics, because
        the pattern that just landed on the screen is one he has seen
        before and does not like.
      </p>
      <p>
        <strong>Purp</strong>, &ldquo;The Youth Construct,&rdquo; is
        the second new name on the site. Purple slot in the palette,
        four letters spelled to match. The prototype canon: chaotic,
        ADHD-coded, thrill-seeker, in love with speed and noise and
        graffiti. When the run hits speed above one-and-a-half times
        baseline, Purp is the one who lights up; he reads the same
        information as Yow but reads it as opportunity rather than
        threat. His register is shorter, faster, slangier; the
        prototype prompts the model for cyberpunk-London register
        explicitly (<em>innit</em>, <em>bruv</em>, <em>glitch</em>,{" "}
        <em>preem</em>).
      </p>
      <p>
        Naming the cognitive coding once and matter-of-factly is the
        same architectural register the site has used for the
        trans-led framing on the door and the disability framing in{" "}
        <Link href="/articles/ungrounded" className={ext}>
          Ungrounded
        </Link>
        . Yow is not Autistic-coded as a label he wears; the coding is
        a fact about how he speaks &mdash; pattern, recognition,
        absolute confidence in the rule he just identified, intolerance
        for the rule being violated. Purp is not ADHD-coded as a
        label; the coding is a fact about how he speaks &mdash;
        velocity, distractibility, the next shiny thing already named
        before the last one finished. Two ways of seeing the same
        world. Both load-bearing. Both honoured. Aura holds the third
        position because she has to watch over both of them and let
        each be exactly what each is. Three constructs, one chorus,
        all three on the player&rsquo;s side.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The HUB and the canal fast-travel
      </h2>
      <p>
        The prototype carries five game states: BOOT, HUB, RUN,
        CREATIVE, and GAME_OVER. HUB is the interesting one for this
        article. It is the world-selection interface &mdash; the place
        the player stands between runs, picks the next zone, switches
        Poi mode, and looks at the splat-library map that is being
        built underneath. The runner geometry is forward-rushing; the
        HUB is the still room where the runner gets chosen.
      </p>
      <p>
        In the long-form game vision, the HUB is not just a menu. It
        is connected to the zones by canal routes &mdash; Regent&rsquo;s
        Canal, the Limehouse Cut, the River Lea &mdash; the same routes
        the studio actually walked for{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          Ten Years of 360 Cameras, One Pole
        </Link>
        . The canal fast-travel mechanic is the runner&rsquo;s answer
        to{" "}
        <a
          href="https://en.wikipedia.org/wiki/Mario_Kart"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mario Kart{arrow}
        </a>
        : a high-speed water route between hard zones, the player
        carrying their Poi loadout, the splat library on the bank as
        the visible record of the runner&rsquo;s own world being
        captured behind them. The pacing reference upstream is{" "}
        <a
          href="https://www.mightycoconut.com/minigolf"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Walkabout Mini Golf{arrow}
        </a>{" "}
        &mdash; a body in a real, walked, traversable space rather than
        a body teleported between menus.
      </p>
      <p>
        The fast-travel is the braided level&rsquo;s equivalent of
        poi&rsquo;s transitions between moves. A two-handed pattern
        does not stop between figures; it carries the rhythm through
        the transition. The canal route carries the player&rsquo;s
        rhythm through the geographic transition. Same logic, different
        substrate.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the prototype lives
      </h2>
      <p>
        The prototype is in the Hangar, not on the site. It runs as
        TypeScript and React Three Fiber inside the monorepo, alongside
        the other apps the studio is building. The full weave at{" "}
        <Link href="/play/the-full-weave" className={ext}>
          /play/the-full-weave
        </Link>{" "}
        is the level the ladder has been pointing at since solo level
        one; clearing it is what unlocks Chrono-Protocol&rsquo;s HUB in
        the next build wave. The route the game will eventually take on
        the site is not yet decided &mdash; the placeholder is
        somewhere around <em>/chrono-protocol</em> or a sub-route under{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>{" "}
        &mdash; but the work to bring it across is real work, not a
        promise. The prototype runs; the constants are real; the dual-
        Poi physics is real; the three-construct dialogue system is
        real; the zone list is real and matches the splat library&rsquo;s
        capture priorities exactly.
      </p>
      <p>
        Naming it here is the studio&rsquo;s first public acknowledgement
        that the proving ground is not a game-by-analogy; it is the
        on-ramp to a game with code on disk. The order has always been:
        write the threads, build the bench, walk the city, capture the
        splats, ship the runner. The threads are written. The bench is
        built. The walks are catalogued and the capture pool is open.
        The splats are landing one at a time on the map at{" "}
        <Link href="/play/neo-london" className={ext}>
          /play/neo-london
        </Link>
        . The runner is in the Hangar, holding open.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The outer surface of the loop
      </h2>
      <p>
        The studio&rsquo;s framework at{" "}
        <Link href="/the-loop" className={ext}>
          /the-loop
        </Link>{" "}
        has six positions: body, light, capture, reify, encounter,
        body. Eight solo levels at /play teach the threads that make
        each position load-bearing. Four braided levels teach the
        weave. Chrono-Protocol is the outer surface of the same loop &mdash;
        the version where the encounter happens inside a wireframe city
        the studio is rebuilding from open footage, the version where
        the gesture the player draws lands in a renderer that is also
        the gesture that lands on a CMOS, the version where the
        completed full weave deploys as kit in a world the player can
        walk.
      </p>
      <p>
        The ladder taught the threads. The braids taught the weaves.
        The game lets the body run them in a city the studio walked
        and is now reassembling, splat by splat, into a place a player
        can move through. The five airframes in the case captured the
        air over those streets;{" "}
        <Link
          href="/articles/the-fleet-five-airframes"
          className={ext}
        >
          the fleet article
        </Link>{" "}
        names them. The same body that swings Poi at angular-sync on a
        Salford bench is the body that the runner asks the player to
        be. The lineage at{" "}
        <Link href="/articles/lineage-marey-to-now" className={ext}>
          Marey to now
        </Link>{" "}
        carries through; the practice at{" "}
        <Link
          href="/articles/the-practice-in-eight-threads"
          className={ext}
        >
          eight threads
        </Link>{" "}
        carries through; the move off the plane in{" "}
        <Link href="/articles/ungrounded" className={ext}>
          Ungrounded
        </Link>{" "}
        carries through. Chrono-Protocol is the place all of them meet,
        running at twelve units a second under an arch.
      </p>
      <p>
        Now back to the bench. The bench is still flat. The city the
        bench is building is no longer.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "neo-london-chrono-protocol",
    title: "Neo-London: Chrono-Protocol — the game the ladder graduates into",
    date: "2026-05-14",
    kind: "article",
    excerpt:
      "The proving ground at /play is the curriculum; Neo-London: Chrono-Protocol is the game it graduates into. WebXR rhythm-action runner in a wireframe London, dual-Poi controls, three zones built from the same SHARP gaussian-splat library the bench is filling, four Poi modes (Amber, Crimson, Azure, Veridian) mapped to the studio's own practice, three AI constructs (Aura, Yow, Purp) reading the run together. The prototype is in the Hangar; this is the bridge piece that names what it is.",
    Body: NeoLondonChronoProtocol,
    related: [
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "The eight solo levels and four braided levels that prepare the player for Chrono-Protocol.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "The trunk article that names the eight threads the ladder teaches and the game braids.",
      },
      {
        href: "/play/the-full-weave",
        label: "The Full Weave",
        note: "Solo eight braided together. The level whose pass-condition unlocks Chrono-Protocol's HUB.",
      },
      {
        href: "/play/neo-london",
        label: "Neo-London — the splat map",
        note: "The SHARP-generated gaussian-splat library that shares its geography with the runner's zones.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The walked routes that become the canal fast-travel between zones in the long-form game vision.",
      },
      {
        href: "/articles/ungrounded",
        label: "Ungrounded",
        note: "The move off the plane. The runner is the same move applied to a wireframe city.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The kit list every layer of the game's pipeline rests on.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The brush-module architecture the game's Poi modes are the playable proof of.",
      },
      {
        href: "/the-loop",
        label: "The Holoflow Loop",
        note: "The six-position framework the runner is the outer surface of.",
      },
      {
        href: "/articles/lineage-marey-to-now",
        label: "The Lineage — Marey to Now",
        note: "The photographic genealogy the runner's persistence-of-vision trail inherits from.",
      },
      {
        href: "/watch",
        label: "/watch — Aura's eyes",
        note: "The cold-eye watching prototype Aura's in-game narration is the runner's version of.",
      },
      {
        href: "/bezel",
        label: "The bezel — the clip-on product",
        note: "The firmware family the runner's controller-as-bezel mode is the software simulation of.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/WebXR",
        label: "WebXR — Wikipedia",
        note: "The browser-native XR standard the runner deploys against. No installer, no app store, headset-optional.",
      },
      {
        href: "https://www.meta.com/gb/quest/quest-3/",
        label: "Meta Quest 3 — product page",
        note: "The reference WebXR headset the studio writes against. Inside-out tracking, hand tracking, colour passthrough.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gaussian_splatting",
        label: "Gaussian splatting — Wikipedia",
        note: "The volumetric rendering technique the splat library underneath the runner is built from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Dystopia",
        label: "Dystopia — Wikipedia",
        note: "The genre register the wireframe London draws on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Mario_Kart",
        label: "Mario Kart — Wikipedia",
        note: "Reference point for the long-form canal-route fast-travel mechanic between zones.",
      },
      {
        href: "https://www.mightycoconut.com/minigolf",
        label: "Walkabout Mini Golf — Mighty Coconut",
        note: "Reference point for pacing — a body in a traversable space rather than teleported between menus.",
      },
      {
        href: "https://github.com/apple/ml-sharp",
        label: "Apple SHARP — single-image to gaussian splat",
        note: "The model the studio runs locally to convert source frames into the runner's splat library.",
      },
    ],
  };
