import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkPixelArtists() {
  return (
    <>
      <p>
        Pixel art is a constraint medium and the screen sets the
        constraint. A four-shade Game Boy is a different studio from a
        sixteen-colour NES, and both are different studios again from
        a 32x32 LED matrix above a Soho bar. The painter does not move
        between palettes the way an oil painter moves between brushes;
        the painter moves between machines, and each machine has its
        own ruleset, its own dithering culture, its own way of being
        wrong.
      </p>

      <p>
        This who&rsquo;s-who is sorted by the screen the artist
        targets. The same painter can appear in two sections when the
        body of work demands it, with the second mention noted. The
        point of an index is to send the reader to the working
        artist&rsquo;s own page; the studio&rsquo;s editorial job is
        to put them under the right heading and step out of the way.
      </p>

      <p>
        The studio&rsquo;s position on palette as a material sits in{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>
        , and the constraint argument sits in{" "}
        <Link href="/articles/from-picasso-forward" className={ext}>
          From Picasso Forward
        </Link>
        . Read those alongside this if the reader is new to the form.
        Real people only below, all verified by a public URL.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Game Boy tone &mdash; four shades on a green slab
      </h2>

      <p>
        The original DMG has a four-shade palette that reads almost
        more like a graphic-design exercise than a paint set. The
        Color came later and added swappable sixteen-bit palettes, but
        the discipline is the same. The UK has an unusually deep bench
        on this screen, mostly because the tooling sits here too.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Chris Maltby</strong> &mdash; Rugby, Warwickshire.
          Author of{" "}
          <a
            href="https://www.gbstudio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GB Studio{arrow}
          </a>
          , the drag-and-drop Game Boy game maker that exports real
          ROMs and runs on real hardware. GB Studio began as the
          tooling for{" "}
          <em>Untitled GB Game</em>, his entry to{" "}
          <a
            href="https://itch.io/jam/bored-pixels-jam-3"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bored Pixels Jam 3{arrow}
          </a>{" "}
          in 2018; he then turned the scaffolding into the application
          that now anchors a whole revival scene.{" "}
          <a
            href="https://www.chrismaltby.com/projects/gbstudio"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chrismaltby.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://chrismaltby.itch.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            itch.io{arrow}
          </a>
        </li>
        <li>
          <strong>Matthew Applegate &mdash; Pixelh8</strong> &mdash;
          Suffolk. Chiptune composer and educator whose practice
          treats the Game Boy and the Speak &amp; Spell as instruments
          rather than nostalgia. Performed at BBC Maida Vale, Bletchley
          Park and the National Museum of Computing; founded an
          alternative-provision technology school in Ipswich and won
          the BAFTA Young Game Designer Mentor Award in 2019. Returned
          to recording with <em>Hard Reset</em> in 2024.{" "}
          <a
            href="https://pixelh8.co.uk/biography/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixelh8.co.uk{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        The wider UK Game Boy demoscene gathers on the GB Studio
        community channels and around the annual{" "}
        <a
          href="https://itch.io/jam/bored-pixels-jam-3"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Bored Pixels Jam{arrow}
        </a>
        . Many of the artists are pseudonymous and posting on itch.io
        rather than carrying portfolios; the studio&rsquo;s position
        is to credit only what is verifiable, and to send the reader to
        the jam page rather than name names that don&rsquo;t resolve.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        NES, Master System, the 16-colour fixed-palette tone
      </h2>

      <p>
        A fixed palette of fifty-odd colours, a budget of three or
        four per sprite, an attribute table that decides where colour
        even can change. The discipline is closer to mosaic than to
        painting. The British contribution here is older than most
        people remember, and the lineage is alive.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Gary J Lucken &mdash; Army of Trolls</strong> &mdash;
          Bournemouth, Dorset (London-born). Probably the most widely
          published British pixel artist working today, in the sense
          that you have almost certainly seen his work on a magazine
          cover, a BBC commission or a Minecraft skin pack without
          knowing it. Clients include the BBC, Honda, Sony, The
          Guardian and Nestl&eacute;; long-running portfolio at Army of
          Trolls. The style sits in the NES / 8-bit-arcade key, with
          forays into more saturated 16-bit work for commercial briefs.{" "}
          <a
            href="http://www.armyoftrolls.co.uk/website/html/games.htm"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            armyoftrolls.co.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://society6.com/a/artists/armyoftrolls"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Society6 store{arrow}
          </a>
        </li>
        <li>
          <strong>Rachel Cunningham &mdash; Rachel Ham</strong> &mdash;
          Little Clacton, Essex. A pixel artist whose visible
          discipline is the demake &mdash; taking a modern game and
          reimagining it in an 8-bit / 16-bit fixed-palette key. Came
          up through her Etsy shop in 2019 and the UK convention
          circuit; the work travels well on prints, stickers and gaming
          mousepads because the reduction is doing the heavy lifting,
          not the resolution.{" "}
          <a
            href="https://www.behance.net/rachelcham"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Behance{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.etsy.com/shop/RachelsHamShop"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Etsy &mdash; RachelsHamShop{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://x.com/rachels_ham"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            @rachels_ham{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Mega Drive / Genesis tone &mdash; the British 16-bit
      </h2>

      <p>
        The Mega Drive palette is the screen Britain knows best.
        Gremlin and Bitmap Brothers built their houses on it; a
        Southampton studio runs the modern shop. The signature is
        chunky outlines, jewel saturations and a colour-on-colour
        attitude that emerged out of the Mega Drive&rsquo;s 9-bit
        limit and stuck.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Dan Malone</strong> &mdash; the artist behind{" "}
          <em>Speedball 2: Brutal Deluxe</em> and{" "}
          <em>The Chaos Engine</em>, the two games most often cited
          when British 16-bit gets a paragraph in a design book.
          Applied to Palace Software in 1985 after seeing an advert
          for &ldquo;a 2000 AD style artist&rdquo;, worked alongside
          Mark John Coleman to define the Bitmap Brothers look, and
          went on to EA, Sony and System 3. Now publishes a working
          portfolio openly.{" "}
          <a
            href="https://www.artstation.com/danmalone"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ArtStation{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.deviantart.com/danmalone"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            DeviantArt{arrow}
          </a>
        </li>
        <li>
          <strong>Henk Nieborg</strong> &mdash; Gelselaar, Netherlands;
          art director at the UK studio Bitmap Bureau. Listed under the
          Mega Drive heading because his Bitmap Bureau output (
          <em>Xeno Crisis</em>, <em>Battle Axe</em>,{" "}
          <em>Terminator 2D: No Fate</em>) targets the Mega Drive
          palette and ships on real Mega Drive cartridges. Pushing
          pixels since 1985; credits include Shantae, Contra 4 and the
          background art on most projects he touches.{" "}
          <a
            href="https://www.artstation.com/goatboy"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ArtStation{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.bitmapbureau.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bitmap Bureau{arrow}
          </a>
        </li>
        <li>
          <strong>Mike Tucker</strong> &mdash; Southampton. Co-founder
          (with Matthew Cope) of{" "}
          <a
            href="https://www.bitmapbureau.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bitmap Bureau{arrow}
          </a>{" "}
          in 2016. Background in mobile games at IOMO and Megadev
          before pivoting the studio explicitly toward 2D pixel work
          on retro hardware; the studio name was chosen to signal that
          commitment. The producer-architect of the modern British
          Mega Drive house, even when the art comes through Henk.{" "}
          <a
            href="https://uk.linkedin.com/in/mmtucker"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LinkedIn{arrow}
          </a>
        </li>
        <li>
          <strong>Jabir Grant</strong> &mdash; Scotland. Sprite
          animator on{" "}
          <em>Final Vendetta</em> at Bitmap Bureau, where he spent
          more than two years drawing every sprite animation in the
          game. The kind of credit that does not chase the spotlight
          and that the studio thinks deserves the spotlight in any
          case.{" "}
          <a
            href="https://www.bitmapbureau.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            via Bitmap Bureau{arrow}
          </a>
        </li>
        <li>
          <strong>Pixel Pusher Games</strong> &mdash; UK. A small
          studio working in the Snatcher / Sierra register, building
          homebrew titles for real Mega Drive cartridges: a
          post-cyberpunk visual novel (<em>Chords</em>) and a
          first-person horror adventure (<em>Crypt of Dracula</em>).
          Treat the Mega Drive as the platform the genre never got.{" "}
          <a
            href="https://www.pixelpushergames.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixelpushergames.co.uk{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        The legacy side of this section &mdash; Gremlin Graphics in
        Sheffield, the Bitmap Brothers in London &mdash; lives on in
        Sumo Digital&rsquo;s back catalogue and in occasional revivals
        like <em>Zool Redimensioned</em> out of the Sumo Academy. The
        lineage cross-references{" "}
        <Link href="/articles/from-picasso-forward" className={ext}>
          From Picasso Forward
        </Link>{" "}
        and the emulation-as-study argument in{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        PC-98 / X68000 tone &mdash; the Japanese 16-bit micro
      </h2>

      <p>
        The Japanese personal-computer screens of the late 80s and
        early 90s &mdash; PC-98, X68000, the Sharp side of the bus
        &mdash; have a distinct palette and a distinct dithering
        culture, anime-adjacent rather than arcade-adjacent. The UK
        bench here is thin and mostly self-taught from emulator
        captures; the studio could not verify any UK-located
        full-time practitioner in this tradition during research.
        Marked as a gap rather than filled with names that don&rsquo;t
        resolve. Reader corrections welcome at the studio rolodex.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        PICO-8 and fantasy-console tone
      </h2>

      <p>
        The modern constraint engine. Sixteen colours fixed by Joseph
        White&rsquo;s palette, 128x128 pixels, a 32k cartridge limit.
        PICO-8 is not a UK product but the UK community around it is
        active and bleeds heavily into the GB Studio crowd. The studio
        is treating the section as a holding area while research
        verifies specific UK-located cart authors with public
        portfolios beyond the BBS; this is a real scene, but
        verification needs more than one URL per name.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Jon Davies &mdash; SovanJedi</strong> &mdash; UK.
          Freelance pixel artist with nearly twenty years in the
          industry; credits include{" "}
          <em>Super House of Dead Ninjas</em>, <em>Binding of Isaac</em>,{" "}
          <em>Inmost</em>, <em>Cursed to Golf</em>, and the recent{" "}
          <em>X-Men &lsquo;97</em> and <em>Marvel: Cosmic Invasion</em>{" "}
          pixel work. The portfolio sits across resolutions but
          consistently in the modern indie-pixel register that PICO-8
          and Aseprite both push toward.{" "}
          <a
            href="https://jontendo.format.com"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jontendo.format.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://bsky.app/profile/sovanjedi.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bluesky{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://pixeljoint.com/p/61711.htm"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pixel Joint{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Hi-bit indie tone &mdash; FEZ, Hyper Light, Celeste-adjacent
      </h2>

      <p>
        The post-2014 register: real pixels but not real hardware
        budgets, dithered gradients done at sub-pixel resolution,
        free-floating palettes that drift toward Hyper Light&rsquo;s
        pinks and Celeste&rsquo;s teals without committing to a
        machine. The UK has a publisher-and-studio cluster here more
        than a lone-painter cluster.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Chucklefish</strong> &mdash; London. Independent
          developer and publisher founded by Finn Brice in 2011.
          Published <em>Stardew Valley</em> on first release (rights
          since returned to ConcernedApe) and built the in-house pixel
          house around <em>Starbound</em> and <em>Wargroove</em>, with{" "}
          <em>Witchbrook</em> still in development. The team identifies
          openly as &ldquo;charming pixel art&rdquo; people and
          recruits accordingly.{" "}
          <a
            href="https://chucklefish.org/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chucklefish.org{arrow}
          </a>
        </li>
        <li>
          <strong>Brave At Night</strong> &mdash; UK. The studio
          behind <em>Yes, Your Grace</em>, published by No More Robots,
          and behind the{" "}
          <a
            href="https://www.braveatnight.co.uk/pixelatedfest"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            PixElated Festival{arrow}
          </a>{" "}
          &mdash; the Steam-based pixel-game showcase that has become
          one of the most useful curated entry points into the modern
          pixel scene. Curators as much as makers, which the studio
          thinks is the more useful role.{" "}
          <a
            href="https://www.braveatnight.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            braveatnight.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Mode 7 Games</strong> &mdash; Oxford. Paul
          Kilduff-Taylor and Ian Hardingham&rsquo;s studio, best known
          for <em>Frozen Synapse</em> and for publishing{" "}
          <em>Tokyo 42</em> by SMAC Games. The Frozen Synapse
          postmortem on Game Developer notes the early pixel-art
          plan was abandoned for a more readable top-down look; the
          studio is included here for the publishing role in the
          modern UK indie-pixel ecosystem rather than for in-house
          pixel work specifically.{" "}
          <a
            href="https://www.mode7.games/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mode7.games{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        LED matrix and physical-pixel work
      </h2>

      <p>
        When the pixel becomes a real physical light, the constraint
        shifts again. The grid is rarely above 64x64; the brightness
        budget is per-LED; the colour space is whatever the WS2812 or
        HUB75 driver allows. This is the most under-named section in
        UK practice &mdash; most of the work is anonymous signage and
        nightclub backdrops &mdash; and the studio is being honest
        about the verification gap rather than filling it with names
        that resolve to product pages.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Pixel Artworks</strong> &mdash; London. Immersive
          experience design and production studio whose installation
          portfolio uses LED, projection and pixel-mapped surfaces
          across retail and museum work. The corporate end of the
          pixel-as-surface practice rather than the artist-led end, but
          the work is genuinely pixel-thinking once you look at the
          render pipelines.{" "}
          <a
            href="https://pixelartworks.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixelartworks.com{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        The artist-led LED-matrix end of UK practice &mdash; the
        festival-circuit booths, the Hackney Wick studios doing
        WS2812 walls for music venues, the touring rigs &mdash; is
        real, and the studio knows several of the practitioners by
        first name; but the public-URL discipline of this index means
        none of them get listed here until they put a portfolio up
        that links back. A revision of this article will fill the
        section. The closest current cross-reference is the
        light-painting who&rsquo;s-who, which covers some of the same
        rigs in a different mode &mdash;{" "}
        <Link
          href="/articles/whos-who-uk-light-painters"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK light painters
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Print, zine and book pixel work
      </h2>

      <p>
        Pixel art as a graphic identity outside the game. Book covers,
        magazine spreads, museum publications, conference branding.
        The British contribution here is unusually strong because the
        UK has the press infrastructure for it &mdash; one publisher
        in particular has built the modern shelf.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Sam Dyer &mdash; Bitmap Books</strong> &mdash;
          Bristol. Founded the independent publishing house in 2014;
          the catalogue now runs to roughly forty titles covering NES,
          SNES, Commodore 64, Master System, GBA and most of the rest
          of the canon, all in thread-sewn editions with metallic inks
          and slipcase variants. Treats pixel art as a design field in
          its own right rather than as nostalgia merchandise. The
          studio&rsquo;s position is that this is the most important
          press operation in pixel art globally, not just in the UK.{" "}
          <a
            href="https://www.bitmapbooks.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bitmapbooks.com{arrow}
          </a>
        </li>
        <li>
          <strong>Warren Clark &mdash; Woostar&rsquo;s Pixels</strong>{" "}
          &mdash; Corby, Northamptonshire. Art director on the
          multiplayer-action-RPG side of mobile game development and
          a prolific print-and-Instagram pixel painter. The Instagram
          practice of running &ldquo;guess the film&rdquo; pixel
          studies is the public face; the prints and assets live on
          ArtStation and itch.io.{" "}
          <a
            href="https://www.artstation.com/woostarpixels"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ArtStation{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.instagram.com/woostarspixels/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Instagram{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://lionheart963.itch.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            itch.io{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On craft and on lineage
      </h2>

      <p>
        Pixel art rewards a particular kind of restraint. The painter
        who can ship a sprite that reads at sixteen pixels has thought
        harder about silhouette than most painters who work at a
        thousand. The British scene has known this since Speedball and
        Chaos Engine; the Bitmap Bureau team know it now; the
        Game-Boy-revival generation around GB Studio is rediscovering
        it weekly. The studio&rsquo;s adjacent pieces are{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        on palette,{" "}
        <Link
          href="/articles/the-mathematics-of-morphing"
          className={ext}
        >
          The Mathematics of Morphing
        </Link>{" "}
        on sprite-to-sprite transition,{" "}
        <Link href="/articles/emulation-as-a-creative-tool" className={ext}>
          Emulation as a Creative Tool
        </Link>{" "}
        and{" "}
        <Link href="/articles/byo-rom-browser-emulators" className={ext}>
          BYO ROM &mdash; Browser Emulators
        </Link>{" "}
        on study-through-capture, and{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>{" "}
        on why tools like GB Studio matter.
      </p>

      <p>
        This is a who&rsquo;s-who of working artists, not of dead
        institutions. Names are added when a URL can carry the credit
        and removed when the URL goes dark. The studio reads pixel
        art as a live tradition and will refresh this piece on the
        same schedule it refreshes the others.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-fire-art-photographers"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK fire art photographers
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ar-people" className={ext}>
            Who&rsquo;s Who &mdash; UK AR people
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-motion-capture"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK motion capture
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-light-painters"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK light painters
          </Link>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <p className="mt-2 text-sm text-chrome-400">
        Every external URL touched in research for this article,
        grouped by domain. The studio&rsquo;s minimum citation
        discipline.
      </p>

      <h3 className="mt-6 text-lg text-chrome-100">
        Artist and studio sites
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="http://www.armyoftrolls.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            armyoftrolls.co.uk &mdash; Gary J Lucken{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://pixelh8.co.uk/biography/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixelh8.co.uk &mdash; Matthew Applegate biography{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.chrismaltby.com/projects/gbstudio"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chrismaltby.com &mdash; Chris Maltby, GB Studio{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.gbstudio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gbstudio.dev &mdash; GB Studio project page{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bitmapbureau.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bitmapbureau.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bitmapbooks.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bitmapbooks.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://chucklefish.org/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chucklefish.org/about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.braveatnight.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            braveatnight.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.mode7.games/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mode7.games{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.pixelpushergames.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixelpushergames.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://pixelartworks.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixelartworks.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://jontendo.format.com"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jontendo.format.com &mdash; Jon Davies / SovanJedi{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        ArtStation and Behance
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.artstation.com/danmalone"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            artstation.com/danmalone{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.artstation.com/goatboy"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            artstation.com/goatboy &mdash; Henk Nieborg{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.artstation.com/woostarpixels"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            artstation.com/woostarpixels &mdash; Warren Clark{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.behance.net/rachelcham"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            behance.net/rachelcham &mdash; Rachel Ham{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.deviantart.com/danmalone"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            deviantart.com/danmalone{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Community platforms
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://pixeljoint.com/p/61711.htm"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixeljoint.com &mdash; SovanJedi profile{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://lospec.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lospec.com &mdash; palettes and tutorials{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://itch.io/jam/bored-pixels-jam-3"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            itch.io &mdash; Bored Pixels Jam 3{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://chrismaltby.itch.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chrismaltby.itch.io{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://lionheart963.itch.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lionheart963.itch.io &mdash; Warren Clark{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://society6.com/a/artists/armyoftrolls"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            society6.com &mdash; Army of Trolls store{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.etsy.com/shop/RachelsHamShop"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            etsy.com &mdash; RachelsHamShop{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Interviews and press
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.retrovideogamer.co.uk/community/rvg-interviews/rvg-interviews-henk-nieborg/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            retrovideogamer.co.uk &mdash; Henk Nieborg interview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.arcadeattack.co.uk/henk-nieborg/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arcadeattack.co.uk &mdash; Henk Nieborg{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://justonemoregame.wordpress.com/2009/06/26/interview-edges-pixel-perfectionist-gary-army-of-trolls-lucken/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            justonemoregame &mdash; Gary Lucken interview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.timeextension.com/news/2024/11/bitmap-brothers-legend-dan-malone-had-no-input-whatsoever-in-the-speedball-reboot"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            timeextension.com &mdash; Dan Malone on the Speedball
            reboot{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.wepc.com/features/creating-final-vendetta/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wepc.com &mdash; Mike Tucker on Final Vendetta{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://godisageek.com/2022/06/final-fight-and-streets-of-rage-1-and-2-were-pretty-much-the-benchmark-an-interview-with-mike-tucker-of-bitmap-bureau-on-final-vendetta/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            godisageek.com &mdash; Bitmap Bureau interview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.timelessgaming.co.uk/blogs/news/rachels-ham-pixel-artist"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            timelessgaming.co.uk &mdash; Rachel Ham profile{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.gamedeveloper.com/audio/postmortem-mode-7-games-i-frozen-synapse-i-"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gamedeveloper.com &mdash; Frozen Synapse postmortem{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.tnmoc.org/notes-from-the-museum/2018/11/30/pixelh8-monster"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            tnmoc.org &mdash; Pixelh8 at the National Museum of
            Computing{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">Reference</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/The_Bitmap_Brothers"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; The Bitmap Brothers{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Pixelh8"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Pixelh8{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Mode_7_Games"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Mode 7 Games{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Sumo_Digital"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Sumo Digital{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK pixel artists in the `by-venue` format from
 * docs/CONTENT-MILL.md, where the "venue" is the screen / surface
 * each artist targets rather than a geographical venue.
 *
 * All entries verified via public URLs at the time of writing
 * (2026-05-18). Sections with thin verification (PC-98 / X68000,
 * artist-led LED matrix) are flagged in the prose rather than padded
 * with names that don't resolve, per CONTENT-MILL.md.
 */
export const entry: Entry = {
  slug: "whos-who-uk-pixel-artists",
  title: "Who's Who — UK pixel artists, by the screen they target",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Pixel art is a constraint medium and the screen sets the constraint. A who's-who of UK pixel artists sorted by the surface they target — Game Boy, NES, Mega Drive, PICO-8, hi-bit indie, LED matrix, and the print page. Real people, public URLs.",
  Body: WhosWhoUkPixelArtists,
  related: [
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "Palette as a material — the studio's foundation piece for this index.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint-driven art and the lineage pixel painters work in.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Sprite-to-sprite transition as a precursor to morphing.",
    },
    {
      href: "/articles/emulation-as-a-creative-tool",
      label: "Emulation as a Creative Tool",
      note: "Why emulator capture is the right reference toolchain.",
    },
    {
      href: "/articles/the-emulation-stack-for-creative-research",
      label: "The Emulation Stack for Creative Research",
      note: "Mesen and the rest of the study toolkit.",
    },
    {
      href: "/articles/byo-rom-browser-emulators",
      label: "BYO ROM — Browser Emulators",
      note: "Studying a screen in the browser, no install.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Why tools like GB Studio matter.",
    },
    {
      href: "/articles/whos-who-uk-light-painters",
      label: "Who's Who — UK light painters",
      note: "The adjacent scene where the pixel becomes a literal light.",
    },
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire art photographers",
      note: "Sibling index.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Sibling index.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "Sibling index.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "Sibling index.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.bitmapbooks.com/",
      label: "Bitmap Books — Bristol",
      note: "The modern shelf of pixel-art publications. Sam Dyer's house.",
    },
    {
      href: "https://www.gbstudio.dev/",
      label: "GB Studio",
      note: "Chris Maltby's Game Boy game maker. The tool the modern UK Game Boy scene grew out of.",
    },
    {
      href: "https://www.bitmapbureau.com/",
      label: "Bitmap Bureau — Southampton",
      note: "Modern British 16-bit. Henk Nieborg + Mike Tucker.",
    },
    {
      href: "https://www.braveatnight.co.uk/pixelatedfest",
      label: "PixElated Festival",
      note: "Brave At Night's Steam-based pixel-game showcase.",
    },
    {
      href: "https://pixeljoint.com/",
      label: "Pixel Joint",
      note: "Global pixel-art community where many UK painters publish.",
    },
    {
      href: "https://lospec.com/",
      label: "Lospec",
      note: "Palette database and tutorial library, including HD Index Painting.",
    },
  ],
};
