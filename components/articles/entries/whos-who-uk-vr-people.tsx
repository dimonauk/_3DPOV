import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkVrPeople() {
  return (
    <>
      <p>
        The princess is going to teach you the lay of the land. UK
        virtual reality is not one scene. It is several. The headset
        gamers in Farnborough do not turn up to the same parties as the
        volumetric capture engineers in Wimbledon, who do not write the
        same grant applications as the academic presence researchers at
        UCL, who do not share a Slack with the LED-volume virtual
        production crews in Greenwich. The work travels in different
        pipelines, comes off the back of different funders, and is sold
        to different buyers. A who&rsquo;s-who is a map of who runs
        which pipeline.
      </p>

      <p>
        London holds the lion&rsquo;s share &mdash; second most
        immersive-tech companies of any city in the world after San
        Francisco, by the{" "}
        <a
          href="https://www.grow.london/immersive-london"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          grow.london{arrow}
        </a>{" "}
        count &mdash; but Manchester, Salford, Bristol, Brighton,
        Sunderland, Sheffield, Edinburgh, Dundee and Farnborough all
        carry studios doing serious VR work. The studio&rsquo;s own
        practice lives in the seam between hardware (POV controllers,
        wearable rigs) and software (WebXR, splat capture, embodied
        agents), and the people below are the ones whose pipelines the
        studio reads, borrows from, or stands next to at the same
        festivals.
      </p>

      <p>
        Same rule as the sibling lists: no entry without a public URL.
        No invented credits. No implied mentorships. If the studio has
        not stood in the same room as someone, the page says so by
        omission. What follows is the list that survived that test.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">London</h2>

      <p>
        London runs the spectrum from one-person artist practices to
        Microsoft-partnered volumetric stages. The set below is the
        one whose work the studio has read, watched, or used as
        reference for the{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          psychological-system thread
        </Link>{" "}
        and the{" "}
        <Link href="/articles/vr-pov-controllers-the-product" className={ext}>
          POV-controllers product line
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Sean Rodrigo &mdash; Continuum VR.</strong> London
          virtual reality artist working in VR painting, previs and
          training. Commissioned work for Digital Catapult, Framestore,
          Mercedes, Adobe, Barclays Eagle Labs. Closest practice in
          the UK to the studio&rsquo;s own VR-drawing thread covered in{" "}
          <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
            Sellotape and Tilt Brush
          </Link>
          .{" "}
          <a
            href="https://virtualrealityartist.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            virtualrealityartist.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Gravity Sketch.</strong> 3D sketching tool for VR,
          spun out of the Royal College of Art in 2014. Founders
          Guillaume Couche, Pierre Paslier, Oluwaseyi Sosanya and
          Daniela Paredes Fuentes met on the RCA Innovation Design
          Engineering MA. Now used by Ford, Nissan, Reebok and 60+
          universities. The tool the studio reaches for when a
          two-dimensional sketch will not hold the form &mdash;
          relevant to{" "}
          <Link href="/articles/the-mathematics-of-morphing" className={ext}>
            the morphing thread
          </Link>
          .{" "}
          <a
            href="https://gravitysketch.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gravitysketch.com{arrow}
          </a>
        </li>
        <li>
          <strong>Henry Stuart &mdash; Visualise.</strong> Fitzrovia.
          London VR / AR / 360 agency founded 2011. Sixty-plus VR
          experiences for BBC, Audi, Wimbledon, The Economist,
          M&eacute;decins Sans Fronti&egrave;res, Samsung, O2. Stuart
          has been speaking on VR production at international events
          since 2006.{" "}
          <a
            href="https://visualise.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            visualise.com{arrow}
          </a>
        </li>
        <li>
          <strong>YORD.</strong> XR &amp; AI creative studio with a
          London office (HQ in Prague). Founded 2019 by Adam and
          David. Clients include Apple, Meta, LEGO, Bentley. Strong on
          enterprise-grade immersive product builds.{" "}
          <a
            href="https://yordstudio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            yordstudio.com{arrow}
          </a>
        </li>
        <li>
          <strong>Anthony Matchett &mdash; MelodyVR (now LiveOne).</strong>{" "}
          London VR music platform, founded 2015 with co-founder
          Steven Hancock. Built the largest VR music library in the
          world &mdash; live captures from Disclosure, Kygo,
          Underworld, the BBC Philharmonic. The reference point for
          anyone thinking about VR + live performance, which the
          studio circles in{" "}
          <Link href="/articles/the-living-stage" className={ext}>
            The Living Stage
          </Link>
          .{" "}
          <a
            href="https://www.crunchbase.com/person/anthony-matchett"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Anthony Matchett profile{arrow}
          </a>
        </li>
        <li>
          <strong>Pixomondo London.</strong> Virtual production
          studio with an LED volume in the UK, opened September 2021.
          Alex Webster heads the London division. Pixomondo runs the
          LED volume that shot <em>The Mandalorian</em>; the London
          stage joined a network across Frankfurt, Stuttgart, LA,
          Toronto, Montreal. Sibling pipeline to the{" "}
          <Link href="/articles/the-living-stage" className={ext}>
            staging
          </Link>{" "}
          and{" "}
          <Link href="/articles/the-fleet-five-airframes" className={ext}>
            aerial
          </Link>{" "}
          work the studio runs.{" "}
          <a
            href="https://www.pixomondo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pixomondo.com{arrow}
          </a>
        </li>
        <li>
          <strong>Reflex Arc.</strong> Three-time BAFTA-nominated XR
          and spatial-computing studio. Richard England leads. Clients
          include Sky, HSBC and a string of cultural institutions, plus
          long-running digital work with David Hockney. Founded 2011.{" "}
          <a
            href="https://reflexarc.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            reflexarc.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>APACHE.</strong> XR studio (St Albans / London
          orbit) running AR, VR and full-body tracking. Thirty-two
          years old; the last twelve years focused on immersive only.
          Clients across major Hollywood studios &mdash; AR/VR
          extensions of motion-picture and TV IP.{" "}
          <a
            href="https://apache.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            apache.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>ARCADE XR (1UP Studios).</strong> AR/XR storytelling
          for cultural and heritage sites. Built the Storyality
          platform with StoryFutures and UK Parliament; built the AR
          layer for Camden&rsquo;s Music Walk of Fame and the Camden
          People&rsquo;s Museum. The studio&rsquo;s{" "}
          <Link href="/articles/london-360-walking" className={ext}>
            360 walking
          </Link>{" "}
          work shares a problem space with theirs.{" "}
          <a
            href="https://www.arcade-xr.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arcade-xr.com{arrow}
          </a>
        </li>
        <li>
          <strong>No Ghost.</strong> Emmy-winning immersive content
          studio, London. Made <em>Madrid Noir</em> (Children &amp;
          Family Emmy, Outstanding Interactive Media) and{" "}
          <em>Wallace &amp; Gromit: The Grand Getaway</em> with
          Aardman and Atlas V on Meta Quest. Twenty artists,
          developers and writers. Founded 2015. Sits in the same
          narrative-VR field the studio thinks about in{" "}
          <Link href="/articles/art-as-door-five-layers" className={ext}>
            Art as Door
          </Link>
          .{" "}
          <a
            href="https://www.noghost.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            noghost.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Wagstaffs Design.</strong> Belvedere Road, SE1.
          PropTech VR / AR / 3D agency, co-founder of VU.CITY (the
          immersive 3D model of London used by planners, developers
          and the GLA). Lead practice for how VR meets the built
          environment in the UK.{" "}
          <a
            href="https://www.wagstaffsdesign.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wagstaffsdesign.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Marshmallow Laser Feast.</strong> Hackney Wick.
          Founded 2011 by Robin McNicholas, Barney Steel and Ersin
          Han Ersin, with Nell Whitley as executive producer.{" "}
          <em>In the Eyes of the Animal</em>, <em>We Live in an Ocean
          of Air</em>, <em>EVOLVER</em> (Cannes Immersive 2024). The
          most internationally exhibited London VR-art studio and the
          one whose pointillist aesthetic has had the largest stylistic
          influence on UK immersive art. Cross-reads{" "}
          <Link href="/articles/the-convergence" className={ext}>
            The Convergence
          </Link>
          .{" "}
          <a
            href="https://marshmallowlaserfeast.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            marshmallowlaserfeast.com{arrow}
          </a>
        </li>
        <li>
          <strong>Anthony Geffen &mdash; Atlantic Productions / Alchemy VR.</strong>{" "}
          London. CEO of Atlantic Productions; set up Alchemy VR to
          produce the Attenborough VR titles. Won the first-ever BAFTA
          awarded to a VR experience for{" "}
          <em>David Attenborough&rsquo;s Great Barrier Reef Dive</em>.
          Five-year partnership with the Natural History Museum.{" "}
          <a
            href="https://atlanticproductions.tv/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            atlanticproductions.tv{arrow}
          </a>
        </li>
        <li>
          <strong>Factory 42.</strong> London immersive studio behind{" "}
          <em>Hold the World with David Attenborough</em> (D&amp;AD
          award) inside the Natural History Museum, and the{" "}
          <em>Green Planet AR</em> experience. Stephen Stewart
          publishes on adapting their VR pipelines for Apple Vision
          Pro.{" "}
          <a
            href="https://uktin.net/navigate-uk-telecoms/uktin-membership/profile/factory-42"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Factory 42 profile{arrow}
          </a>
        </li>
        <li>
          <strong>Maze Theory.</strong> London VR game developer
          founded 2018. <em>Doctor Who: The Edge of Time</em>,{" "}
          <em>Peaky Blinders: The King&rsquo;s Ransom</em>. Heavy on
          BBC-IP VR adaptations &mdash; the closest UK studio to
          AAA-licensed VR storytelling.{" "}
          <a
            href="https://mazetheory.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mazetheory.com{arrow}
          </a>
        </li>
        <li>
          <strong>Dimension Studio.</strong> Wimbledon. Volumetric
          capture studio launched by Digital Catapult, Hammerhead and
          Microsoft Mixed Reality Capture. 106-camera rig; one of
          three Microsoft-partnered MRC studios in the world (with
          Redmond and SF). Volumetric captures of Madonna,
          Michael Bubl&eacute;, Andy Murray.{" "}
          <a
            href="https://www.dimensionstudio.co/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            dimensionstudio.co{arrow}
          </a>
        </li>
        <li>
          <strong>All Seeing Eye.</strong> London immersive studio
          behind <em>Immersive Histories: Dambusters</em> at the RAF
          Museum &mdash; 1:1 Lancaster reconstruction with VR, haptics,
          hand-tracking and mocap performance. Built with No. 617
          Squadron historian Robert Owen. Funded through Digital
          Catapult / Arts Council CreativeXR.{" "}
          <a
            href="https://allseeingeye.co/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            allseeingeye.co{arrow}
          </a>
        </li>
        <li>
          <strong>PRELOADED.</strong> London BAFTA-winning immersive
          games studio, founded 2000. Phil Stuart is co-founder and
          Executive Creative Director. Clients include McDonald&rsquo;s,
          LEGO, the BBC; technology partners include Niantic, Magic
          Leap, HTC and Google. Now part of Learning Technologies
          Group.{" "}
          <a
            href="https://preloaded.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            preloaded.com{arrow}
          </a>
        </li>
        <li>
          <strong>Sol Rogers &mdash; REWIND.</strong> Founded
          REWIND in 2011 as a VFX house, pivoted to immersive.
          Clients include HBO, Paramount, BBC, NBC, Nike, Sony,
          Bj&ouml;rk, Rolls-Royce. Rogers chairs Immerse UK and sits
          on the BAFTA VR Advisory Group. Now also at Magnopus.{" "}
          <a
            href="https://www.rewind.co/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rewind.co{arrow}
          </a>
        </li>
        <li>
          <strong>Surround Vision.</strong> The Old Truman Brewery,
          Brick Lane E1. Ten-plus years of 360 / VR production. Built
          the &ldquo;piggy-back&rdquo; carbon 360 rig used by Sky
          Sports OB. Volumetric, live VR, sports, fashion, culture.{" "}
          <a
            href="https://surroundvision.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            surroundvision.com{arrow}
          </a>
        </li>
        <li>
          <strong>Sliced Bread Animation.</strong> London VR /
          AR / animation studio. Marketing and corporate VR work, with
          a strong publishing thread on VR-pipeline practicalities.
          Speak at Develop:Brighton on production realities most
          studios will not put on a slide.{" "}
          <a
            href="https://sbanimation.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sbanimation.com{arrow}
          </a>
        </li>
        <li>
          <strong>Catherine Allen &mdash; Limina Immersive.</strong>{" "}
          BAFTA-winning immersive specialist. Led two of the
          BBC&rsquo;s first VR experiences (2015&ndash;16); founded
          Limina Immersive in late 2016 as a VR events and research
          company. Limina ran the UK&rsquo;s first VR-arts cinema
          out of Watershed Bristol. A bridge person between London
          and the Bristol scene.{" "}
          <a
            href="https://www.catherineallen.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            catherineallen.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.liminaimmersive.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            liminaimmersive.com{arrow}
          </a>
        </li>
        <li>
          <strong>Anrick Bregman &mdash; Unit9.</strong> London-based
          cross-disciplinary new-realities director: VR, AR, film,
          games. Director at Unit9, one of the larger digital
          production houses in the city.{" "}
          <a
            href="https://www.unit9.com/director/anrick"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            unit9.com/director/anrick{arrow}
          </a>
        </li>
        <li>
          <strong>East City Films.</strong> Shoreditch. Production
          studio behind <em>Walk to Westerbork</em>,{" "}
          <em>Letters from Drancy</em> and a strand of VR /
          immersive non-fiction work for Channel 4, MTV, Columbia,
          Sony.{" "}
          <a
            href="https://eastcityfilms.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            eastcityfilms.com{arrow}
          </a>
        </li>
        <li>
          <strong>Mo-Sys Engineering.</strong> Greenwich. Camera
          tracking and virtual-production technology, converting an
          old Greenwich power station into an eight-stage virtual
          production hub. The Mo-Sys StarTracker is the camera-
          tracking standard for half the LED volumes in Europe.{" "}
          <a
            href="https://www.mo-sys.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mo-sys.com{arrow}
          </a>
        </li>
        <li>
          <strong>disguise.</strong> London-headquartered virtual
          production / extended-reality media-server company. The
          disguise VX hardware drives the LED volumes at MARS, CUBE
          and many of the UK virtual-production stages. Runs the
          London virtual-production training course with MARS Volume.{" "}
          <a
            href="https://www.disguise.one/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            disguise.one{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Manchester / Salford / North-West
      </h2>

      <p>
        Salford Quays is where the north-west VR ecosystem clusters.
        MediaCityUK runs an Immersive Technologies Innovation Hub; the
        University of Salford&rsquo;s MediaCity building is wired for
        VR, motion capture and game-engine production. dock10
        operates the largest virtual studio in the region.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Scenegraph Studios.</strong> Greater Manchester.
          XR-as-a-Service studio working across Unreal, Omniverse,
          cloud rendering, AI and motion capture. Built{" "}
          <em>Spirit VR</em> for mental-wellbeing applications, also
          Fortnite-universe builds (games, gigs, art galleries,
          fashion shows). The closest North-West parallel to the
          studio&rsquo;s own{" "}
          <Link href="/articles/aura-the-body" className={ext}>
            embodied-VR work
          </Link>
          .{" "}
          <a
            href="https://scenegraphstudios.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            scenegraphstudios.com{arrow}
          </a>
        </li>
        <li>
          <strong>Recode XR Studio.</strong> Manchester. New XR and
          virtual-production studio &mdash; LED volume plus AI-driven
          workflows for film, TV, commercials and branded content.{" "}
          <a
            href="https://recode-xr-studio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            recode-xr-studio.com{arrow}
          </a>
        </li>
        <li>
          <strong>dock10.</strong> MediaCityUK, Salford. Television
          facility built into MediaCityUK; in 2019 launched a 4K UHD
          virtual studio using Unreal Engine, for real-time
          photorealistic broadcast production. Operates the largest
          virtual studio in the North-West.{" "}
          <a
            href="https://www.dock10.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            dock10.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>THINKlab &mdash; University of Salford.</strong> Part
          of the School of Science, Engineering &amp; Environment.
          VR research across resilient cities, smart cities,
          collaborative engineering and virtual training environments.
          Built <em>Virtual Chernobyl</em>, the RHS Bridgewater VR
          model, the Design4Energy VR neighbourhood planner, and the
          MOBILISE disaster-risk platform.{" "}
          <a
            href="https://www.salford.ac.uk/our-facilities/thinklab"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            salford.ac.uk/our-facilities/thinklab{arrow}
          </a>
        </li>
        <li>
          <strong>MediaCity Immersive Technologies Innovation Hub (MITIH).</strong>{" "}
          The convening body for North-West immersive tech &mdash;
          virtual production, AI, AR/VR and game-engine work. Where
          most Manchester / Salford XR companies first connect with
          industry partners.{" "}
          <a
            href="https://www.mediacityuk.co.uk/immersive-technologies-innovation-hub/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mediacityuk.co.uk MITIH{arrow}
          </a>
        </li>
        <li>
          <strong>Silverchip.</strong> Manchester. AR/VR development
          house with a healthcare-VR specialism. Long-running clinical
          and training builds for NHS partners.{" "}
          <a
            href="https://www.silverchip.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            silverchip.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Imitating the Dog.</strong> Leeds (close-orbit to
          the North-West circuit). Twenty years of work fusing live
          performance with digital and mixed-reality technology.
          Their{" "}
          <em>Frankenstein</em>, <em>Dracula: The Untold Story</em>{" "}
          and <em>Night of the Living Dead &mdash; Remix</em> with
          Leeds Playhouse are the UK&rsquo;s strongest examples of
          mixed-reality theatre using real-time compositing.{" "}
          <a
            href="https://www.imitatingthedog.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imitatingthedog.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Other UK &mdash; Bristol, Brighton, Sheffield, Sunderland,
        Edinburgh, Dundee, Hampshire
      </h2>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Anagram (Amy Rose &amp; May Abdalla).</strong>{" "}
          Pervasive Media Studio, Watershed, Bristol. Co-founded
          2013.{" "}
          <em>Door Into the Dark</em> (Tribeca Storyscapes 2015),{" "}
          <em>The Collider</em> (Sandbox Immersive 2019),{" "}
          <em>Goliath</em> (Grand Jury Prize, Venice 2021). The most
          decorated UK non-fiction immersive practice.{" "}
          <a
            href="https://weareanagram.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            weareanagram.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Pervasive Media Studio &mdash; Watershed Bristol.</strong>{" "}
          Partnership between Watershed, UWE Bristol and the
          University of Bristol. Home to the Bristol VR Lab; supports
          Anagram, Duncan Speakman, Tomo Kihara, Limina Immersive and
          a rotating residency of immersive artists. The
          UK&rsquo;s most consistent producer of festival-tier
          non-fiction VR.{" "}
          <a
            href="https://www.watershed.co.uk/studio/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            watershed.co.uk/studio{arrow}
          </a>
        </li>
        <li>
          <strong>Future Visual.</strong> Brighton. Founded 2015 by
          Tim Fleming and Iestyn Lloyd. VISIONxR&trade; platform for
          enterprise VR training and collaboration. IATA was an
          early client; works heavily in aviation and behaviour-
          change training.{" "}
          <a
            href="https://www.futurevisual.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            futurevisual.com{arrow}
          </a>
        </li>
        <li>
          <strong>Patrick &amp; Tamsin O&rsquo;Luanaigh &mdash; nDreams.</strong>{" "}
          Farnborough, Hampshire. Founded 2006; now the largest pure-
          play VR game developer in the world. Patrick stepped down
          as CEO in June 2025 (Tom Gillo succeeded him); Patrick
          stayed on as Chairman. Acquired by Aonic for $110m in
          November 2023.{" "}
          <a
            href="https://ndreams.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ndreams.com{arrow}
          </a>
        </li>
        <li>
          <strong>Coatsink (Tom Beardsmore &amp; Paul Crabb).</strong>{" "}
          Sunderland. Founded December 2009. VR titles{" "}
          <em>Shadow Point</em>, <em>Onward</em>,{" "}
          <em>Augmented Empire</em>. Acquired by Thunderful Group in
          October 2020 in a deal that could be worth £65.5m; operates
          as an independent studio under Thunderful Games.{" "}
          <a
            href="https://coatsink.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            coatsink.com{arrow}
          </a>
        </li>
        <li>
          <strong>Sumo Digital.</strong> Sheffield. Founded 2003;
          acquired CCP Newcastle&rsquo;s VR studio in January 2018,
          folding VR work into a wider AAA pipeline. Sheffield is the
          principal studio.{" "}
          <a
            href="https://www.sumo-digital.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sumo-digital.com{arrow}
          </a>
        </li>
        <li>
          <strong>Edify.</strong> Scotland-based VR education
          platform, developed in partnership with the University of
          Glasgow. Library of high-definition learning environments,
          a lesson editor, a marketplace and a no-headset
          &ldquo;VR-by-proxy&rdquo; mode that streams to Zoom and
          Teams. £2.5m+ in funding since 2017, including Innovate UK.{" "}
          <a
            href="https://www.edify.ac/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            edify.ac{arrow}
          </a>
        </li>
        <li>
          <strong>CoSTAR Realtime Lab &mdash; Dundee.</strong> Led
          by Abertay University in partnership with the University
          of Edinburgh, CodeBase, Interface and Chroma Developments.
          Virtual-production research lab; merges CGI, AR and motion
          capture for immersive digital sets across film, gaming and
          live performance. Hosts a new virtual film academy.{" "}
          <a
            href="https://www.abertay.ac.uk/news/2025/new-virtual-production-film-academy-launches-at-costar-realtime-lab-in-dundee/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CoSTAR Realtime Lab Dundee{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The research side</h2>

      <p>
        UK academic VR is unusually strong on{" "}
        <em>presence</em> and <em>embodiment</em> research &mdash;
        the empirical question of why a virtual environment makes a
        body feel like it is somewhere else. That tradition is the
        bedrock the studio leans on for{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          the VR-as-psychological-system thread
        </Link>{" "}
        and the embodied-agent work in{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          Aura the Body
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Mel Slater &mdash; VECG &amp; Immersive VR Lab, UCL.</strong>{" "}
          Founded the Virtual Environments and Computer Graphics
          group at UCL; EPSRC Senior Research Fellow since 1999. The
          UK&rsquo;s most cited VR-presence researcher. Now also
          ICREA Research Professor at Universitat de Barcelona where
          he leads the Event Lab. The UCL VR Lab continues under VECG.{" "}
          <a
            href="https://vr.cs.ucl.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vr.cs.ucl.ac.uk{arrow}
          </a>
        </li>
        <li>
          <strong>William Steptoe.</strong> UCL Computer Science (VR /
          AR research). Avatars, embodiment, presence; the &ldquo;
          Beaming&rdquo; project on telepresence. Also worked at
          Facebook / Reality Labs.{" "}
          <a
            href="http://www0.cs.ucl.ac.uk/people/W.Steptoe.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UCL CS profile{arrow}
          </a>
        </li>
        <li>
          <strong>Goldsmiths VR Lab.</strong> Ben Pimlott Building.
          Multi-camera mocap stage, 8.1 Ambisonic surround, custom
          Oculus Rift / Leap Motion rigs. Hosts the MA / MSc Virtual
          and Augmented Reality. Marco Gillies teaches and writes from
          inside it.{" "}
          <a
            href="https://www.gold.ac.uk/pg/ma-virtual-augmented-reality/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Goldsmiths MA/MSc VR/AR{arrow}
          </a>
        </li>
        <li>
          <strong>NCCA &mdash; Bournemouth University.</strong>{" "}
          National Centre for Computer Animation, established 1989.
          Research across computer animation, 3D intelligent virtual
          humans, computer vision, gaming, immersive tech, physics-
          based simulation and digital twins. Long pipeline of UK
          VFX / VR talent.{" "}
          <a
            href="https://www.bournemouth.ac.uk/research/centres-institutes/national-research-centre-computer-animation"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bournemouth NCCA{arrow}
          </a>
        </li>
        <li>
          <strong>StoryFutures &amp; StoryFutures Academy.</strong>{" "}
          Run by Royal Holloway, University of London, with the
          National Film and Television School. The UK&rsquo;s
          National Centre for Immersive Storytelling. Mentoring
          scheme run by ILM Immersive (Lucasfilm&rsquo;s immersive
          arm). Catalysed 40+ R&amp;D collaborations, 16 new
          products, 100+ companies in network.{" "}
          <a
            href="https://www.storyfutures.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            storyfutures.com{arrow}
          </a>
        </li>
        <li>
          <strong>Royal College of Art &mdash; Innovation Design Engineering / IRC.</strong>{" "}
          The MA that produced Gravity Sketch. InnovationRCA still
          incubates VR / XR product spinouts.{" "}
          <a
            href="https://www.rca.ac.uk/business/innovationrca/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            InnovationRCA{arrow}
          </a>
        </li>
        <li>
          <strong>BBC R&amp;D / BBC Taster.</strong> The BBC&rsquo;s
          experimental publishing platform &mdash; first home for
          UK public-service VR including <em>We Wait</em> (with
          Aardman). Where two of Catherine Allen&rsquo;s early BBC
          VR pieces lived.{" "}
          <a
            href="https://www.bbc.co.uk/taster"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bbc.co.uk/taster{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Where the scene meets</h2>

      <p>
        Pipelines need rooms. The UK VR / XR calendar is small enough
        that you will see the same faces three or four times a year if
        you go to the right four events.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>VRARA London.</strong> The London chapter of the
          VR/AR Association &mdash; bi-monthly meetups, panels and
          industry case studies. Sponsored The Economist Impact&rsquo;s
          Enterprise Metaverse Summit. The convening body for the
          enterprise side of the London scene.{" "}
          <a
            href="https://www.thevrara.com/london"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            thevrara.com/london{arrow}
          </a>
        </li>
        <li>
          <strong>Digital Catapult &amp; CreativeXR.</strong> London.
          UK&rsquo;s industry body for immersive tech. Ran the
          CreativeXR programme with Arts Council England &mdash; three
          full cohorts, sixty teams, £851k of production funding,
          and the launchpad for No Ghost, All Seeing Eye, Anagram and
          others on this page.{" "}
          <a
            href="https://www.digicatapult.org.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            digicatapult.org.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Raindance Immersive.</strong> London. Curated by
          Mar&iacute;a Raku&scaron;anov&aacute;. Indie-leaning
          immersive festival; runs both as a physical London event and
          a month-long social-VR festival on VRChat and Resonite.
          The UK&rsquo;s most reliably independent VR-art
          curation.{" "}
          <a
            href="https://raindance.org/immersive/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            raindance.org/immersive{arrow}
          </a>
        </li>
        <li>
          <strong>Develop:Brighton.</strong> Games-industry conference
          with a substantial VR / XR track; where the UK headset-
          studios meet (nDreams, Coatsink, Maze Theory, Sliced Bread)
          and where Sliced Bread runs the candid VR-pipeline talks.{" "}
          <a
            href="https://www.developconference.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            developconference.com{arrow}
          </a>
        </li>
        <li>
          <strong>Immerse UK.</strong> National network for the UK
          immersive industries. Chaired in recent years by Sol Rogers.
          The grant / policy-facing organisation that ties the regions
          together.{" "}
          <a
            href="https://www.immerseuk.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            immerseuk.org{arrow}
          </a>
        </li>
        <li>
          <strong>BFI London Film Festival &mdash; Immersive strand.</strong>{" "}
          Public-facing VR programming inside the BFI&rsquo;s annual
          festival. The festival that put <em>Goliath</em>,{" "}
          <em>Only Expansion</em> and a string of Anagram pieces in
          front of British audiences first.{" "}
          <a
            href="https://www.bfi.org.uk/london-film-festival"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bfi.org.uk/london-film-festival{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Why this list exists</h2>

      <p>
        The studio sits inside this map but does not duplicate any
        single entry on it. The closest neighbours are Sean Rodrigo
        on the artist-practice side and Gravity Sketch on the tool
        side; the closest peers on staging are Marshmallow Laser
        Feast and Anagram; the closest peers on hardware are nDreams
        and Mo-Sys. The studio&rsquo;s own line &mdash; POV
        controllers, splat capture, embodied agents, the{" "}
        <Link href="/articles/the-convergence" className={ext}>
          convergence of forms
        </Link>{" "}
        &mdash; runs at the seam between all of these and belongs to
        none of them exclusively.
      </p>

      <p>
        A who&rsquo;s-who is a map. The list above is what travels in
        public, with a URL behind every name. If a person or studio
        belongs on this page and is not yet on it, that is an omission
        the studio will correct &mdash; the brief was strictness, not
        completeness, and the next pass widens the net.
      </p>

      <p>
        The siblings:{" "}
        <Link href="/articles/whos-who-uk-fire-art-photographers" className={ext}>
          Who&rsquo;s Who &mdash; UK fire-art photographers
        </Link>{" "}
        is the photography-side companion;{" "}
        <Link href="/articles/whos-who-uk-ar-people" className={ext}>
          Who&rsquo;s Who &mdash; UK AR people
        </Link>{" "}
        is the augmented-reality companion. The studio&rsquo;s own
        thinking on adjacent practice is gathered in{" "}
        <Link href="/articles/kindred-practices" className={ext}>
          Kindred Practices
        </Link>
        .
      </p>
    </>
  );
}

/**
 * Colocated entry record for the UK VR who's-who.
 *
 * Strictness rule applied: every name has a public URL behind it.
 * No claimed mentorships of the studio. No invented credits. The
 * Pixomondo / Mo-Sys / disguise entries are virtual-production
 * adjacent rather than pure VR, but included because UK VR talent
 * routinely moves through those pipelines.
 */
export const entry: Entry = {
  slug: "whos-who-uk-vr-people",
  title: "Who's Who — UK VR people",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A map of UK VR practitioners — artists, studios, researchers — across London, Manchester, Bristol, Brighton, Sheffield, Sunderland, Edinburgh and Dundee. Every name verified by public URL.",
  Body: WhosWhoUkVrPeople,
  related: [
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire-art photographers",
      note: "Sibling list, on the photography side of the studio's archive.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "Sibling list, augmented-reality companion.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a psychological system",
      note: "The studio's frame for why presence-and-embodiment research is the bedrock.",
    },
    {
      href: "/articles/vr-pov-controllers-the-product",
      label: "POV controllers — the product",
      note: "The hardware line that sits in parallel to the studios on this list.",
    },
    {
      href: "/articles/kindred-practices",
      label: "Kindred Practices",
      note: "The studio's own adjacent-practice round-up.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.digicatapult.org.uk/expertise/blogs/post/the-uks-eight-immersive-studios-to-watch/",
      label: "Digital Catapult — eight UK immersive studios to watch",
      note: "The industry-body shortlist that anchors several entries above.",
    },
    {
      href: "https://www.grow.london/immersive-london",
      label: "grow.london — Immersive London",
      note: "Official London & Partners writeup of the city's immersive sector.",
    },
    {
      href: "https://creativexr.co.uk/",
      label: "CreativeXR",
      note: "Digital Catapult / Arts Council programme — cohort companies cross-referenced throughout.",
    },
    {
      href: "https://www.storyfutures.com/",
      label: "StoryFutures",
      note: "Royal Holloway / NFTS — UK National Centre for Immersive Storytelling.",
    },
    {
      href: "https://www.thevrara.com/london",
      label: "VR/AR Association — London chapter",
      note: "The convening body referenced in the closing section.",
    },
  ],
};
