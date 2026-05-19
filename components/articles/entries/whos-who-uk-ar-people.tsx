import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkArPeople() {
  return (
    <>
      <p>
        The Princess sets the chair and the slide projector and says
        the lesson plainly. Augmented reality in the United Kingdom is
        a real industry with real names attached. Digital Catapult
        and Innovate UK have spent a decade ranking London as the
        second city in the world for immersive content production
        after the San Francisco Bay Area. The studios below are who
        the trade press cites when it cites anyone. The artists below
        are who the studios hire when they need an eye instead of an
        engineer. This article is a map &mdash; not a ranking, not a
        critique, and not gossip. Every entry is verified by a public
        URL the reader can click and check.
      </p>

      <p>
        The studio has a particular stake in this map. The print
        bureau ships AR cards as part of its{" "}
        <Link href="/articles/provenance-as-discipline" className={ext}>
          provenance-as-discipline
        </Link>{" "}
        loop: the printed card carries a marker, the marker resolves
        to a WebAR scene, the scene shows the same trace the buyer
        owns from a second angle. Knowing who else in the UK ships AR
        in production, and at what scale, is the difference between
        thinking the studio invented something and knowing the
        studio is one careful node inside a working industry.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">London &mdash; studios</h2>

      <p>
        <a
          href="https://reflexarc.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Reflex Arc{arrow}
        </a>{" "}
        is the studio most readers will already know by reputation
        even if they do not know the name. Three-time BAFTA-nominated,
        the long-running digital partner for David Hockney&rsquo;s
        iPad and AR work, including the Hockney AR companion app
        for the Royal Academy &ldquo;Arrival of Spring&rdquo; show
        and the bespoke painting tool that lets Hockney&rsquo;s team
        render at sixteen thousand pixels for print. Clients include
        Sky and HSBC alongside the cultural work. Spatial computing
        across VR, AR and Vision Pro.
      </p>

      <p>
        <a
          href="https://apache.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Apache{arrow}
        </a>{" "}
        sits in St Albans on the north edge of the city and has been
        running for over thirty years, twelve of them solely on XR.
        Kinect AR body-tracking is the technical signature: the Sky
        X-Men experience where the player&rsquo;s hands grow Wolverine
        claws or summon Storm lightning, and the Disney Hulkbuster
        booth at the Avengers S.T.A.T.I.O.N. installation in London.
        AR plus VR plus full-body capture. Configurator work for
        McLaren and Mercedes-Benz sits alongside.
      </p>

      <p>
        <a
          href="https://www.arcade-xr.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Arcade XR{arrow}
        </a>{" "}
        is the cultural-institution specialist. The Keeper of
        Paintings AR game for the National Gallery, the Westminster
        Hall experience with UK Parliament and historian Dr Matthew
        Smith via StoryFutures, packaging and social AR for Disney,
        the Sky Sports cricket fan experience for The Hundred. Their
        tooling list reads as the full stack: ARKit, ARCore, WebAR,
        Magic Leap, Lens Studio, the now-deprecated Spark AR, Unity,
        Unreal.
      </p>

      <p>
        <a
          href="https://www.noghost.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          No Ghost{arrow}
        </a>{" "}
        is in East London and won the Emmy for{" "}
        <a
          href="https://www.noghost.co.uk/work/madrid-noir"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Madrid Noir{arrow}
        </a>
        , the forty-five-minute VR mystery, then drew a second Emmy
        nomination for Wallace &amp; Gromit in The Grand Getaway.
        Founded in 2015, animation studio first and XR studio second
        &mdash; that order shows in the work. AR plus VR for
        narrative, not for marketing.
      </p>

      <p>
        <a
          href="https://pebblestudios.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Pebble Studios{arrow}
        </a>{" "}
        in Shoreditch was one of the UK&rsquo;s first dedicated VR
        studios and ports the same craft sensibility across to AR
        filters and mobile experiences for Adidas, Samsung,
        L&rsquo;Oreal and Live Nation. Motion-design DNA underneath,
        which shows in the visual quality.
      </p>

      <p>
        <a
          href="https://visualise.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Visualise{arrow}
        </a>{" "}
        sits in the Biscuit Factory in Bermondsey, founded in 2011 by
        Henry Stuart. AR, VR and 360-degree video for international
        brands &mdash; the Louis Vuitton AR work bringing Virgil
        Abloh&rsquo;s last-campaign characters onto the Vend&ocirc;me
        maison facade in Paris is the headline. Headset, mobile and
        large-scale installation, the full range.
      </p>

      <p>
        <a
          href="https://nexusstudios.com/arvr"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Nexus Studios{arrow}
        </a>{" "}
        is the AR-with-animation-pedigree studio. Academy
        Award-nominated as an animation house first, then a long
        collaboration with Google Spotlight Stories: &ldquo;Back to
        the Moon&rdquo; (Emmy-nominated, available in AR, VR,
        360-degree and traditional 2D versions) and &ldquo;Rain or
        Shine&rdquo; (gaze-based interactive VR). Founded in 2000 by
        Charlotte Bavasso and Christopher O&rsquo;Reilly.
      </p>

      <p>
        <a
          href="https://www.holition.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Holition{arrow}
        </a>{" "}
        on Holborn Circus is the retail and beauty AR specialist.
        Charlotte Tilbury&rsquo;s &ldquo;magic mirror&rdquo;
        try-on, Burberry Virtual Studio AR makeup tutorials, the Jo
        Malone Virtual Townhouse, work for LVMH, Herm&egrave;s, Coty,
        Est&eacute;e Lauder and PUIG. Named Creative/Digital Team of
        the Year at The Drum Awards in 2021.
      </p>

      <p>
        <a
          href="https://marshmallowlaserfeast.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Marshmallow Laser Feast{arrow}
        </a>{" "}
        is the art-world end of London XR &mdash; Barnaby Steel,
        Ersin Han Ersin and Robin McNicholas. &ldquo;In the Eyes of
        the Animal&rdquo;, &ldquo;EVOLVER&rdquo;, and &ldquo;Of the
        Oak&rdquo; at Kew Gardens. Barbican, ACMI, Sundance, YCAM.
        Their relationship to AR is closer to the territory{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          The Living Stage
        </Link>{" "}
        sketches than to mobile filters.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">London &mdash; independent artists</h2>

      <p>
        <a
          href="https://www.clarabacou.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Clara Bacou{arrow}
        </a>{" "}
        works between London and Los Angeles as a 3D and AR designer
        and animation director. Snapchat&rsquo;s inaugural Official
        Lens Creator programme, content for Spectacles 3 exhibited at
        Art Basel Miami with Gucci, third place in Lenslist&rsquo;s
        Spectacles Community Challenge with the XR game Axis. Joined
        Meta&rsquo;s Creative Engineering team in 2023 on the Orion
        AR eyewear. Music-visual and stage work for Coldplay,
        Blackpink, Lil Nas X, Elton John.
      </p>

      <p>
        <a
          href="https://shahwalishayan.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Shahwali Shayan{arrow}
        </a>{" "}
        runs the Shahnanigans studio out of London and lectures at
        the Royal College of Art. AR campaigns for Samsung, Disney,
        Netflix, Adobe, Hugo Boss, Sony Music. The{" "}
        <a
          href="https://ghosts.shahnanigans.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          GhostsOfThePast{arrow}
        </a>{" "}
        installation around Tate Modern was his RCA graduation
        project. AR developer plus multidisciplinary artist plus
        teacher &mdash; the three-way combination is rarer than it
        sounds.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">London &mdash; platforms, labs, R&amp;D</h2>

      <p>
        <a
          href="https://nianticlabs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Niantic{arrow}
        </a>{" "}
        has a real London office and a real research lab inside it.
        The lab was seeded by the 2018 acquisition of Matrix Mill,
        the UCL computer-vision spin-out in Covent Garden, and now
        carries Niantic&rsquo;s AR Cloud / Lightship work for
        computer vision and machine learning. After Niantic acquired{" "}
        <a
          href="https://www.8thwall.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          8th Wall{arrow}
        </a>{" "}
        in 2022 and wound the platform down to open source under MIT
        in early 2026, the WebAR creator community in London still
        treats the &ldquo;Hello 8th Wall&rdquo; workshop pattern as
        the entry point. The Niantic Studio editor remains the
        tooling.
      </p>

      <p>
        <a
          href="https://about.meta.com/uk/realitylabs/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Meta Reality Labs Research &mdash; London{arrow}
        </a>{" "}
        runs the AR research programme out of the city specifically
        for machine perception and 3D scene understanding work, plus
        the AI-agent perception layer behind the Orion eyewear
        roadmap. The recruitment posts are public; the talent
        density is the stated reason for picking London over
        elsewhere in Europe.
      </p>

      <p>
        <a
          href="https://www.digicatapult.org.uk/technologies/immersive/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Digital Catapult{arrow}
        </a>{" "}
        is the public-sector connective tissue for UK immersive. The
        CreativeXR acceleration programme &mdash; run jointly with
        Arts Council England &mdash; has put one-point-two million
        pounds of R&amp;D money into sixty immersive prototypes and a
        further eight hundred and fifty thousand into twelve in
        production. Immersive Labs sit in London, Brighton,
        Tees Valley and Belfast. If a UK AR project credits public
        funding, this is usually where the trail starts.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Manchester / North-West</h2>

      <p>
        <a
          href="https://www.aircards.co/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Aircards{arrow}
        </a>{" "}
        is the WebAR studio that won the Auggie Award for Most
        Innovative WebAR App in 2023 (Pot Noodle &ldquo;Slurp&rdquo;).
        UK office, transatlantic operation. WebAR specifically &mdash;
        no-app-required, mobile browser, marker and markerless. Snap,
        TikTok, Meta, ARCore, ARKit, visionOS, Unreal, Unity,
        Fortnite, Roblox. Clients include Samsung, Warner Bros, NHL,
        John Deere, Manchester City.
      </p>

      <p>
        <a
          href="https://holdens.agency/our-services/ar-vr-mr/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Holdens{arrow}
        </a>{" "}
        is the longest-running Manchester AR shop &mdash; the first
        agency in the city to ship AR commercially, back in 2016.
        Marketing-led rather than art-led, but the consistent
        Manchester presence makes them a fixed reference point.
      </p>

      <p>
        <a
          href="https://thinklab.salford.ac.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          THINKlab &mdash; University of Salford{arrow}
        </a>{" "}
        sits on the seventh floor of the Maxwell Building and runs
        the academic side of the North-West immersive scene. Smart
        cities, resilient cities, collaborative virtual environments,
        drone-disaster visualisation, the EU CROSS DRIVE space-mission
        planning project, the RHS Bridgewater virtual garden. Not a
        consumer-AR studio &mdash; an applied-XR research lab with
        commercial commissions.
      </p>

      <p>
        <a
          href="https://www.mediacityuk.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          MediaCityUK{arrow}
        </a>{" "}
        at Salford Quays hosts the MediaCity Immersive Technologies
        Innovation Hub (MITIH), Greater Manchester&rsquo;s cluster
        for XR, virtual production, esports and games. Over two
        hundred and fifty creative and tech businesses on site.
        BEYOND Conference runs from there each year. The Immersive
        Futures Lab inside BEYOND is the regular meet-the-prototypes
        moment for the region.
      </p>

      <p>
        <a
          href="https://www.thesharpproject.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          The Sharp Project{arrow}
        </a>{" "}
        is the two-hundred-thousand-square-foot converted Sharp
        warehouse, opened 2011, hosting creative digital businesses
        and green-screen production. Less an AR studio in itself
        than the building several of them rent space inside.
      </p>

      <p>
        <a
          href="https://www.mmu.ac.uk/about-us/faculties/business-law/business-school/research/projects/creative-ar-vr"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Manchester Metropolitan &mdash; Creative AR/VR Hub{arrow}
        </a>{" "}
        runs the business-school side of the North-West AR research
        question: who pays, how scale happens, what the commercial
        AR/VR sector looks like as it grows.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Bristol</h2>

      <p>
        Bristol is the second city of UK XR after London, and the
        density is concentrated in one building.
      </p>

      <p>
        <a
          href="https://www.watershed.co.uk/studio/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Pervasive Media Studio{arrow}
        </a>{" "}
        on Bristol&rsquo;s historic dockside &mdash; collaboration
        between Watershed, the University of Bristol and UWE Bristol
        &mdash; hosts over two hundred resident artists, creative
        companies, technologists and academics. The studio&rsquo;s
        residents have an annual turnover of thirteen-point-seven
        million pounds and over two hundred and fifty jobs attached.
        Founded in 2008. The single most important UK XR community
        space outside London.
      </p>

      <p>
        <a
          href="https://weareanagram.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Anagram{arrow}
        </a>{" "}
        &mdash; Amy Rose and May Abdalla, long-time Pervasive Media
        Studio residents &mdash; make narrative XR. &ldquo;The
        Collider&rdquo; for two participants exploring power.
        &ldquo;Door Into the Dark&rdquo; won the 2015 Tribeca
        Storyscapes Award. Venice Film Festival Grand Jury Prize 2021
        in the VR section. Sandbox Immersive Art Award 2019.
      </p>

      <p>
        <a
          href="https://zubr.co/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Zubr{arrow}
        </a>{" "}
        is the Bristol AR/VR studio with the longest production track
        record &mdash; founded 2015, over four hundred shipped
        projects. The sub-brand{" "}
        <a
          href="https://curio.zubr.co/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Curio{arrow}
        </a>{" "}
        is the museums/heritage line: apps, AR binoculars,
        interactive trails, 3D scanning for galleries and historical
        sites. Multiple Sparkies and Museum + Heritage awards.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Brighton</h2>

      <p>
        Brighton runs the third regional cluster, smaller than
        Bristol but visible. The Digital Catapult Centre Brighton
        Immersive Lab and the{" "}
        <a
          href="https://www.wiredsussex.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Wired Sussex{arrow}
        </a>{" "}
        Immersive Studio inside the Drill Hall are the two anchor
        venues. The FutureScope Heritage XR programme tied three
        studios to the Grade I-listed Corn Exchange: BAFTA-nominated
        Immersive Networks Collective, OmBeond, and the AR-specific{" "}
        <a
          href="https://www.linkedin.com/company/sensecity-ar/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          SENSEcity{arrow}
        </a>
        .{" "}
        <a
          href="https://brightondome.org/creative-technology/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Brighton Dome&rsquo;s Creative Technology programme{arrow}
        </a>{" "}
        commissions XR work into the venue itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Edinburgh / Scotland</h2>

      <p>
        Scotland&rsquo;s formal XR pivot is the{" "}
        <a
          href="https://efi.ed.ac.uk/scotlands-new-9m-virtual-production-studios-set-to-transform-the-creative-industries/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CoSTAR Realtime Lab{arrow}
        </a>{" "}
        &mdash; a nine-million-pound investment led by the University
        of Edinburgh with Abertay University, with the first
        dedicated virtual-production studio opened at Chroma
        Developments&rsquo; Water&rsquo;s Edge in Dundee in February
        2025 and further facilities at the University of Edinburgh
        and Edinburgh College of Art on the way. Virtual production
        is AR-adjacent more than AR-direct, but the work covers
        motion capture, real-time CGI compositing and AR for
        spectator experiences at concerts, events and museums.
        Independent studios on the ground include{" "}
        <a
          href="https://lay3d.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          lay3d{arrow}
        </a>{" "}
        for AR and VR development and{" "}
        <a
          href="https://neon8.scot/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Neon8{arrow}
        </a>{" "}
        for VR production.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Other UK</h2>

      <p>
        <a
          href="https://www.enginecreative.co.uk/services/spatial-experiences/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Engine Creative{arrow}
        </a>{" "}
        works out of Northampton and runs the spatial-experiences
        line for brands including Barclaycard, BiC, Camelot, Meta
        and Travis Perkins. Their REYDAR platform is the in-house
        3D / AR / spatial-experience product, built off a decade of
        agency work. Credited with the world&rsquo;s first AR
        magazine and the UK&rsquo;s first AR album cover.
      </p>

      <p>
        <a
          href="https://euphoriaxr.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          EuphoriaXR{arrow}
        </a>{" "}
        runs from Watford on the north-west edge of London and ships
        WebAR, WebVR, AI-driven XR apps and enterprise training
        simulations across UK and US markets. Founded 2016.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Research and academia</h2>

      <p>
        <a
          href="https://vr.cs.ucl.ac.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UCL Immersive Virtual Environments Laboratory{arrow}
        </a>{" "}
        sits inside the VECG (Virtual Environments and Computer
        Graphics) group in Computer Science. VR, AR, MR, smart
        geometry processing, digital reality, graphics and
        illumination, sensors and systems. The Matrix Mill spin-out
        that Niantic acquired came from this lineage.
      </p>

      <p>
        <a
          href="https://www.imperial.ac.uk/a-z-research/intelligent-digital-systems/research/computer-vision/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Imperial College Computer Vision{arrow}
        </a>{" "}
        is the second London lab worth the line. Real-time scene
        understanding for robotics, self-driving and AR/VR &mdash;
        the underpinning machine vision that lets AR experiences
        register to the world geometrically rather than just visually.
      </p>

      <p>
        <a
          href="https://www.storyfutures.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          StoryFutures &mdash; Royal Holloway{arrow}
        </a>{" "}
        is the twelve-million-pound, four-and-a-half-year AHRC
        Creative Industries Cluster centre that has shaped a
        significant portion of UK immersive R&amp;D since launch.
        Partners include Brunel, the University for the Creative
        Arts, BBC Studios, Pinewood Studios and the National Film
        and Television School. The StoryFutures Academy runs the
        UK&rsquo;s National Centre for Immersive Storytelling. The
        StoryTrails project put untold local histories into AR and
        VR across UK towns for UNBOXED.
      </p>

      <p>
        Salford&rsquo;s{" "}
        <a
          href="https://thinklab.salford.ac.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          THINKlab{arrow}
        </a>{" "}
        sits in this section too &mdash; covered above under the
        North-West heading but worth re-listing here as the
        applied-XR academic counterpart to the London labs.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Tools, meets, conferences</h2>

      <p>
        The trade calendar has settled into a small number of
        recurring fixtures. AWE&rsquo;s European arm merged with
        Stereopsia and now runs as{" "}
        <a
          href="https://unitedxr.eu/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UnitedXR Europe{arrow}
        </a>{" "}
        out of Brussels each December &mdash; the largest XR trade
        event reachable from the UK on a day return. The{" "}
        <a
          href="https://www.meetup.com/awenitenorthernxr/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          AWE Nite Northern XR{arrow}
        </a>{" "}
        Meetup covers Manchester and Leeds for monthly meets;
        equivalent London meets run through Digital Catapult and the
        various Snap / Meta creator briefings.{" "}
        <a
          href="https://www.digicatapult.org.uk/case-studies/study/creativexr/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CreativeXR{arrow}
        </a>{" "}
        and the MediaCity Immersive Futures Lab inside BEYOND are
        the regular places to see UK prototypes that are not yet
        commercial.
      </p>

      <p>
        On tooling, the platform map at time of writing reads:
        Niantic Studio (the open-source descendant of 8th Wall) for
        WebAR; Snap Lens Studio for Snap; Apple ARKit and AR Quick
        Look (USDZ) for iOS; Google ARCore and Scene Viewer
        (glTF/GLB) for Android; visionOS for headset AR; Unity and
        Unreal under the AAA work; Three.js and A-Frame and
        model-viewer for the WebAR layer the studio ships AR cards
        on top of.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Closing</h2>

      <p>
        Augmented reality in the UK is not the headset story
        covered in{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          VR as Psychological System
        </Link>{" "}
        or the Tilt-Brush-and-sellotape origin sketched in{" "}
        <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
          Sellotape and Tilt Brush
        </Link>
        . AR&rsquo;s native question &mdash; what to register where,
        and how the digital trace and the physical surface meet
        &mdash; is closer in spirit to{" "}
        <Link href="/articles/the-convergence" className={ext}>
          The Convergence
        </Link>{" "}
        and to the print-bureau loop described under{" "}
        <Link href="/articles/provenance-as-discipline" className={ext}>
          provenance-as-discipline
        </Link>
        . The names above are the people the studio expects readers
        to encounter as they follow this thread further into the UK
        AR scene. If a name is missing from this map, the studio
        wants to know &mdash; this article will grow.
      </p>

      <p>
        Sibling who&rsquo;s-who articles in this archive:
      </p>
      <ul className="mt-4 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-fire-art-photographers" className={ext}>
            Who&rsquo;s Who &mdash; UK fire-art photographers
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * Every studio, individual, lab and conference in this article was
 * verified by a public URL at write time. Cross-checks included
 * Digital Catapult press releases, Watershed Pervasive Media
 * Studio resident pages, BAFTA / Emmy nomination listings, and the
 * studios' own work pages. No private mentor / tutor / collaboration
 * claims are made; the article is intentionally a map rather than a
 * roster of personal relationships.
 */
export const entry: Entry = {
  slug: "whos-who-uk-ar-people",
  title: "Who's Who — UK AR people",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A verified map of the UK augmented reality scene — studios, independent artists, research labs and meets. London, Manchester / Salford, Bristol, Brighton, Edinburgh and elsewhere. Every entry carries a public URL.",
  Body: WhosWhoUkArPeople,
  related: [
    {
      href: "/articles/provenance-as-discipline",
      label: "Provenance as Discipline",
      note: "Why the studio ships AR cards as a provenance loop.",
    },
    {
      href: "/articles/the-convergence",
      label: "The Convergence",
      note: "The wider thinking AR registers itself against.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as Psychological System",
      note: "The headset-side sibling to this map.",
    },
    {
      href: "/articles/sellotape-and-tilt-brush",
      label: "Sellotape and Tilt Brush",
      note: "Where the studio's own immersive practice began.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.digicatapult.org.uk/technologies/immersive/",
      label: "Digital Catapult — Immersive",
      note: "Public-sector connective tissue for UK immersive.",
    },
    {
      href: "https://www.storyfutures.com/",
      label: "StoryFutures — Royal Holloway",
      note: "AHRC Creative Industries Cluster, immersive R&D.",
    },
    {
      href: "https://www.watershed.co.uk/studio/",
      label: "Pervasive Media Studio — Watershed, Bristol",
      note: "The largest UK XR community outside London.",
    },
    {
      href: "https://unitedxr.eu/",
      label: "UnitedXR Europe",
      note: "The successor to AWE EU; the European XR trade event.",
    },
    {
      href: "https://reflexarc.co.uk/",
      label: "Reflex Arc — David Hockney digital partner",
      note: "Three-time BAFTA-nominated London AR/VR/Vision Pro studio.",
    },
  ],
};
