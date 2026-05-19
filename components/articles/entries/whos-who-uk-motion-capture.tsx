import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkMotionCapture() {
  return (
    <>
      <p>
        The Princess sets the chair and the slide projector and tells
        you motion capture is a thing that happens in rooms. A volume,
        a suit, a single phone on a tripod, a stage rigged with
        seventeen sensors, a research lab with eye-trackers and
        physiological belts &mdash; each is a room with its own walls
        and its own inhabitants. To map the UK practice you walk a
        route through six of them. Geography matters less than what
        each room is for; an Oxford volume, a Pinewood volume and a
        Salford volume all belong to the same family because the
        ceiling is hung with the same rigs.
      </p>

      <p>
        The studio reaches for mocap as an avenue, not a side hobby.
        The work overlaps{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          VR-as-psychological-system
        </Link>
        ,{" "}
        <Link href="/articles/vr-pov-controllers-the-product" className={ext}>
          body-as-input
        </Link>{" "}
        and{" "}
        <Link href="/articles/choreographing-with-laban" className={ext}>
          choreographing-with-laban
        </Link>{" "}
        directly. Marey&rsquo;s chrono-photographic gun founded the
        whole lineage; see{" "}
        <Link href="/articles/lineage-marey-to-now" className={ext}>
          lineage-marey-to-now
        </Link>
        . The names below are the ones the studio actually consults
        when a piece of work needs a body inside it instead of a hand
        keyframe. Every entry is verifiable by a public URL. No
        invented credits.
      </p>

      <p>
        The rooms are: the optical volume; the inertial suit; the
        markerless single-camera; the face-and-hand specialist room;
        the performance-capture-for-stage room; and the build-your-own
        room. Walk them in order.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room one &mdash; the optical volume
      </h2>

      <p>
        The first room is the one the public pictures when it pictures
        mocap. A black-walled volume, the ceiling hung with red-eyed
        cameras, a performer in a velcro suit stippled with
        retro-reflective markers, the floor marked with calibration
        crosses. The maths of the room is triangulation: each marker
        is seen by at least two cameras, three when the body folds,
        and the system solves a skeleton from the marker cloud
        sixty-to-one-hundred-twenty times a second. The UK has
        disproportionately many of these rooms because the maths was
        invented down the M40 from where the cameras are now built.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.vicon.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Vicon{arrow}
            </a>
          </strong>{" "}
          &mdash; Yarnton, Oxfordshire. The cameras hanging on most of
          the ceilings in this article. Spun out of Oxford Medical
          Systems in 1984; the Valkyrie cameras are the current
          flagship. The room&rsquo;s grandparent.
        </li>
        <li>
          <strong>
            <a
              href="https://www.audiomotion.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Audiomotion{arrow}
            </a>
          </strong>{" "}
          &mdash; Wheatley, Oxford, now in 40,000sqft at Rebellion Film
          Studios. 160 Vicon cameras and one of the largest volumes in
          the world. Captured the zombies for World War Z, the chariots
          for Exodus, the ice-rink for The Nutcracker and the Four
          Realms.
        </li>
        <li>
          <strong>
            <a
              href="https://www.centroid3d.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Centroid Motion Capture{arrow}
            </a>
          </strong>{" "}
          &mdash; Pinewood-adjacent, now near Uxbridge. Established
          1996, 84 Motion Analysis Raptor cameras plus 148 in reserve,
          thirteen performers simultaneously, with offices at Pinewood
          and Shepperton. Pinewood&rsquo;s preferred supplier for the
          three UK studios.
        </li>
        <li>
          <strong>
            <a
              href="https://www.imaginariumstudios.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Imaginarium Studios{arrow}
            </a>
          </strong>{" "}
          &mdash; Ealing originally, now at Pinewood and Tileyard in
          King&rsquo;s Cross with SIDE. Founded 2011 by Andy Serkis and
          Jonathan Cavendish. Star Wars work, The Tempest with the RSC,
          Amazon&rsquo;s The Girlfriend.
        </li>
        <li>
          <strong>
            <a
              href="https://www.themocapstudio.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              The Mocap Studio{arrow}
            </a>
          </strong>{" "}
          &mdash; London. The volume that publishes its rates and aims
          itself at animation, VFX and VR clients who do not need the
          Pinewood scale. The accessible end of the optical-room
          market.
        </li>
        <li>
          <strong>
            <a
              href="https://www.studiot3d.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              StudioT3D{arrow}
            </a>
          </strong>{" "}
          &mdash; London and Gateshead. Volume plus virtual production
          stage, run by{" "}
          <a
            href="https://www.target3d.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Target3D{arrow}
          </a>
          , the UK&rsquo;s sole OptiTrack distributor and the hardware
          integrator behind a large fraction of the country&rsquo;s
          mocap installs.
        </li>
        <li>
          <strong>
            <a
              href="https://www.dock10.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              dock10{arrow}
            </a>
          </strong>{" "}
          &mdash; MediaCityUK, Salford. Vicon-equipped volume embedded
          inside a working broadcast facility, used for AR presenter
          rigs and real-time character work as well as standard
          capture sessions.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room two &mdash; the inertial suit
      </h2>

      <p>
        The second room is wearable. No volume, no ceiling rigs &mdash;
        instead seventeen-or-so inertial measurement units stitched
        into a lycra suit, each one streaming acceleration and
        orientation over Wi-Fi. Drift correction by foot-contact
        constraints, optionally fused with a single witness camera.
        You can take it outside. You can take it into a stage door.
        You can take it into a circus tent. That portability is the
        whole point of the room; it is where mocap meets the practices
        that refuse to be lifted into a black-walled cube.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.xsens.com/products/motion-capture"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Xsens (now part of Movella){arrow}
            </a>
          </strong>{" "}
          &mdash; the high-end suit. Xsens Link is the flagship, used
          by the larger UK studios for on-location work where an
          optical volume cannot be built. Streams into Unreal, Unity
          and MotionBuilder live.
        </li>
        <li>
          <strong>
            <a
              href="https://www.rokoko.com/products/smartsuit-pro"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Rokoko Smartsuit Pro II{arrow}
            </a>
          </strong>{" "}
          &mdash; the suit the indie UK animator scene actually owns.
          Wi-Fi, real-time streaming into Blender / Houdini / Unreal,
          paired with Smartgloves for finger capture. The price point
          that put inertial mocap inside a one-person studio.
        </li>
        <li>
          <strong>
            <a
              href="https://captivate-action.com/motion-capture-training/performance-capture-intensive-course/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Captivate Action{arrow}
            </a>
          </strong>{" "}
          &mdash; Bullards Place, E2. Directed by Lyndall Grant. First
          company in the UK and Australia to train actors specifically
          for performance capture; the Performance Capture Intensive
          remains the canonical course for the on-suit side of the
          work.
        </li>
        <li>
          <strong>
            <a
              href="https://www.target3d.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Target3D{arrow}
            </a>
          </strong>{" "}
          &mdash; suit support, integration and rental for clients who
          want inertial without buying the kit. The studio behind a
          large fraction of UK location-mocap shoots, even when
          uncredited.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room three &mdash; the markerless single-camera room
      </h2>

      <p>
        The third room is the one that did not exist five years ago.
        A single phone on a tripod, or four to eight machine-vision
        cameras around a 10m x 10m square, and a neural network
        trained on millions of human poses turns video into a
        skeleton with no markers, no suit, no calibration cube. The
        accuracy is not yet the Vicon volume&rsquo;s accuracy; the
        access is incomparably wider. The UK is unusually central to
        this room because two of the companies pushing the state of
        the art the hardest sit inside it.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://move.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Move AI{arrow}
            </a>
          </strong>{" "}
          &mdash; the UK markerless pioneer since 2019. Genesis is
          their flagship post-process tool; Move Live runs at under
          100ms latency in a 10m x 10m space with four to eight
          cameras. Clients include EA, Nike, Ubisoft. The Disguise
          partnership puts the same tech inside virtual-production
          LED stages.
        </li>
        <li>
          <strong>
            <a
              href="https://radicalmotion.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              RADiCAL{arrow}
            </a>
          </strong>{" "}
          &mdash; single-camera real-time markerless from any webcam or
          phone. Not UK-headquartered, but a heavy presence in the UK
          indie animation pipeline because the entry price is a
          subscription rather than a volume. Core tech acquired by
          Autodesk in 2026; the consumer product continues.
        </li>
        <li>
          <strong>
            <a
              href="https://www.target3d.co.uk/thecaptury"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              The Captury (via Target3D){arrow}
            </a>
          </strong>{" "}
          &mdash; multi-camera markerless that lives between the
          single-phone and the marker volume. Distributed in the UK by
          Target3D; used for sports biomechanics and clinical-gait work
          as much as for entertainment.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room four &mdash; the face-and-hand specialist room
      </h2>

      <p>
        The fourth room is small and lit hard. A head-mounted camera
        rig on a counter-weighted arm, or a four-camera dome around a
        seated performer, capturing skin geometry at video rates. The
        room exists because the body solver and the face solver are
        different problems: a hand has twenty-plus degrees of freedom,
        a face has hundreds of muscle activations, and the optical
        volume next door cannot resolve either at the fidelity the
        finished pixel needs. Scotland and Manchester both ended up
        unexpectedly important here.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://di4d.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              DI4D &mdash; Dimensional Imaging{arrow}
            </a>
          </strong>{" "}
          &mdash; Glasgow, founded 2003 by Colin Urquhart. 4D facial
          performance capture with no markers, no make-up, no
          structured light. Blade Runner 2049, the Call of Duty:
          Modern Warfare trilogy, Black Ops 6, the F1 series. Now
          acquired by Clear Angle Studios.
        </li>
        <li>
          <strong>
            <a
              href="https://www.clearanglestudios.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Clear Angle Studios{arrow}
            </a>
          </strong>{" "}
          &mdash; the UK&rsquo;s lead 3D-capture and processing
          company. Eighteen full-body photogrammetry rigs (204 cameras,
          32 lights, 1.2-second capture), the Dorothy head-scan system,
          cyberscanning rigs at 200+ DSLRs apiece. Owns the DI4D tech
          and IP since the 2024 acquisition.
        </li>
        <li>
          <strong>
            <a
              href="https://facewaretech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Faceware Technologies{arrow}
            </a>
          </strong>{" "}
          &mdash; the spin-off from Image Metrics, which itself came
          out of the University of Manchester. US-headquartered now,
          UK roots. Trusted by Rockstar, Ubisoft, ILM. The head-mounted
          camera most often seen on a UK performer&rsquo;s helmet.
        </li>
        <li>
          <strong>
            <a
              href="https://oxfordroadcorridor.com/organisations/cubic-motion/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Epic Games Animation UK (formerly Cubic Motion){arrow}
            </a>
          </strong>{" "}
          &mdash; Manchester Science Park, Bright Building. Facial
          animation tech behind God of War, Spider-Man, Hellblade:
          Senua&rsquo;s Sacrifice. Acquired by Epic in March 2020 and
          folded into the Unreal Engine team alongside 3Lateral.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room five &mdash; performance capture for stage
      </h2>

      <p>
        The fifth room is unusual: the volume is the theatre itself,
        the performer is on a stage in front of an audience, and the
        rig drives an avatar projected back into the same space in
        real time. This room is small, expensive, and disproportionately
        important to the studio because it is where mocap stops being
        post-production and becomes a live medium &mdash; the closest
        the work comes to{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          the living stage
        </Link>
        . The UK has more of this work than its share, mostly because
        the Royal Shakespeare Company let it happen in 2016.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.rsc.org.uk/the-tempest/gregory-doran-2016-production/video-creating-the-tempest"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Royal Shakespeare Company &mdash; The Tempest{arrow}
            </a>
          </strong>{" "}
          &mdash; the watershed. November 2016, Stratford then London,
          400th anniversary of Shakespeare&rsquo;s death. Mark Quartley
          performed Ariel live in a 17-sensor suit driving a projected
          avatar in real time. Imaginarium Studios, Intel and Vicon on
          the engineering side. First major stage production with live
          mocap.
        </li>
        <li>
          <strong>
            <a
              href="https://waynemcgregor.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Studio Wayne McGregor (formerly Random Dance){arrow}
            </a>
          </strong>{" "}
          &mdash; the choreographer&rsquo;s lab. Founded 1992. Real-time
          mocap in +/-Human alongside Random International&rsquo;s
          drone flock; ABBA Voyage&rsquo;s capture sessions. Resident
          choreographer at the Royal Ballet, which means the dancers
          carry the practice into a very large institution&rsquo;s
          working memory.
        </li>
        <li>
          <strong>
            <a
              href="https://www.cssd.ac.uk/short-courses/artist-development-programme/acting-motion-capture"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Royal Central School of Speech &amp; Drama &mdash; PTEQ{arrow}
            </a>
          </strong>{" "}
          &mdash; Swiss Cottage. The Centre for Performance Technology
          and Equity runs the only dedicated MOCAP-showreel service for
          UK actors plus the two-day Introduction to Motion Capture
          for Performance. The 2024 Motion Capture, Performance and
          Pedagogy symposium tried to codify the teaching practice.
        </li>
        <li>
          <strong>
            <a
              href="https://www.lamda.ac.uk/short-courses/motion-capture"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              LAMDA &mdash; Motion Capture for Performance{arrow}
            </a>
          </strong>{" "}
          &mdash; a 30-camera MOCAP studio at the academy and a
          two-day artist-led course aimed at actors with no prior
          mocap. Sister institution to Central; together they hold the
          actor-training side of the practice.
        </li>
        <li>
          <strong>
            <a
              href="https://www.themocapvaults.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              The Mocap Vaults &mdash; SummitUK / Enter the Volume{arrow}
            </a>
          </strong>{" "}
          &mdash; London + LA. Industry-veteran-run actor workshops on
          a professional stage; the SummitUK event puts performers in
          suit for two days with HD scene footage out the other end
          for showreel. The least-academic and arguably most-effective
          training option in the room.
        </li>
        <li>
          <strong>
            <a
              href="http://eavi.goldsmithsdigital.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Goldsmiths EAVI &mdash; Embodied AudioVisual Interaction{arrow}
            </a>
          </strong>{" "}
          &mdash; New Cross. The research lab where mocap sits next to
          eye-tracking, BCI and physiological bio-interfaces in the
          same room. Dr Dan Strutt&rsquo;s work on the digital dance
          aesthetic and the open-source Goldsmiths Mocap Streamer
          (AHRC-funded) is the cleanest UK academic line on dance +
          inertial capture.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room six &mdash; build your own
      </h2>

      <p>
        The sixth room has no walls. It is a Discord, a GitHub repo, a
        Patreon, and a pile of webcams on a desk. The premise: mocap
        should be possible without selling a kidney for a Vicon volume
        or even a Smartsuit. Computer vision plus a stack of consumer
        cameras plus a pose-estimation network gets you most of the
        way there, for free. The UK is well-represented in this room
        because the relevant universities push out PhDs who refuse to
        gate their tooling. The studio reaches into this room more
        than any of the others &mdash; see{" "}
        <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
          on-the-shoulders-of-open-source
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://freemocap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              FreeMoCap{arrow}
            </a>
          </strong>{" "}
          &mdash; the open-source markerless system. Multiple webcams,
          MediaPipe-class pose networks under the hood, all processing
          local. Research-grade output for the price of the cameras.
          Active Discord, regularly updated GitHub.
        </li>
        <li>
          <strong>
            <a
              href="https://github.com/zju3dv/EasyMocap"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              EasyMocap{arrow}
            </a>
          </strong>{" "}
          &mdash; Zhejiang University, but the UK indie scene runs it.
          Multi-view markerless mocap with SMPL body model fitting,
          robust enough that small studios use it for first-pass
          animation cleanup.
        </li>
        <li>
          <strong>
            <a
              href="https://research.gold.ac.uk/id/eprint/32701/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Goldsmiths Mocap Streamer{arrow}
            </a>
          </strong>{" "}
          &mdash; the AHRC-funded open-source streamer Dr Dan Strutt
          and team built during Covid. Inertial-mocap data shared
          across the network so dancers in different countries can
          perform in the same virtual space, real-time. The clearest
          UK-academic-to-open-source line in the room.
        </li>
        <li>
          <strong>
            <a
              href="https://www.camera.ac.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              CAMERA &mdash; University of Bath{arrow}
            </a>
          </strong>{" "}
          &mdash; Centre for the Analysis of Motion, Entertainment
          Research and Applications. Four stages: optical mocap, 4D
          volumetric, virtual production, face/body light-stage
          photogrammetry. The MyWorld-funded research arm that
          regularly releases open papers and tooling into the same
          ecosystem the build-your-own crowd reads.
        </li>
        <li>
          <strong>
            <a
              href="https://www.salford.ac.uk/courses/undergraduate/motion-capture-for-the-creative-industries"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              University of Salford &mdash; DipHE Motion Capture{arrow}
            </a>
          </strong>{" "}
          &mdash; the UK&rsquo;s first dedicated diploma in motion
          capture technology. Two-year course built with Cloud
          Imperium and dock10. The undergraduate end of the
          build-your-own room: students who graduate fluent in
          assembling, calibrating and running their own rigs.
        </li>
        <li>
          <strong>
            <a
              href="https://www.bournemouth.ac.uk/study/courses/msc-computer-animation-visual-effects"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Bournemouth NCCA{arrow}
            </a>
          </strong>{" "}
          &mdash; the National Centre for Computer Animation. Ranks as
          the UK&rsquo;s top animation school. AccessMocap is the
          NCCA&rsquo;s in-house service. The graduate pipeline that
          fills most of the rooms above.
        </li>
        <li>
          <strong>
            <a
              href="https://www.port.ac.uk/about-us/our-facilities/teaching-and-learning-spaces/motion-capture-studio"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              University of Portsmouth &mdash; CCIXR{arrow}
            </a>
          </strong>{" "}
          &mdash; the Centre for Creative and Immersive Extended
          Reality. 48 Vicon Vantage optical cameras plus a 40-camera
          Vicon Origin active system, run as a student-and-commercial
          facility. Alumni go to Rockstar, Vicon itself, Imaginarium
          and Weta.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Walking back out
      </h2>

      <p>
        Six rooms, one practice. The point of the route is not that
        the rooms are separate; it is that a working mocap project
        almost always borrows from at least three of them. A Vicon
        volume for the body, a Faceware helmet for the face, a Rokoko
        suit for the second-unit shoot on location, and a FreeMoCap
        rig at home for the artist&rsquo;s own preparation. The studio
        consults this map when deciding which room to step into for a
        given piece of work &mdash; usually starting with the cheapest
        room that can carry the result, working up only when it has
        to. The names above are the ones it would trust the result
        with.
      </p>

      <p>
        If the avenue interests you for your own practice, the order
        the studio recommends is: read{" "}
        <Link href="/articles/lineage-marey-to-now" className={ext}>
          lineage-marey-to-now
        </Link>{" "}
        first to know whose shoulders the cameras stand on, then{" "}
        <Link href="/articles/choreographing-with-laban" className={ext}>
          choreographing-with-laban
        </Link>{" "}
        to know what the body is actually saying, then{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          aura-the-body
        </Link>{" "}
        for the embodied-performance reading, then{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          the-living-stage
        </Link>{" "}
        and{" "}
        <Link href="/articles/the-convergence" className={ext}>
          the-convergence
        </Link>{" "}
        for where the practice is going. After that, hire one of the
        rooms above.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Cross-references
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/choreographing-with-laban" className={ext}>
            Choreographing with Laban
          </Link>{" "}
          &mdash; the body language behind any usable capture.
        </li>
        <li>
          <Link href="/articles/aura-the-body" className={ext}>
            Aura, the Body
          </Link>{" "}
          &mdash; the embodied-performance reading the studio brings.
        </li>
        <li>
          <Link href="/articles/the-living-stage" className={ext}>
            The Living Stage
          </Link>{" "}
          &mdash; performance plus technology in real time.
        </li>
        <li>
          <Link href="/articles/the-convergence" className={ext}>
            The Convergence
          </Link>{" "}
          &mdash; mocap as one of the converging mediums.
        </li>
        <li>
          <Link href="/articles/vr-as-psychological-system" className={ext}>
            VR as Psychological System
          </Link>{" "}
          &mdash; mocap-for-VR overlap.
        </li>
        <li>
          <Link href="/articles/vr-pov-controllers-the-product" className={ext}>
            VR POV Controllers &mdash; the Product
          </Link>{" "}
          &mdash; the body-as-input thread.
        </li>
        <li>
          <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
            Sellotape and Tilt Brush
          </Link>{" "}
          &mdash; embodied drawing as adjacent practice.
        </li>
        <li>
          <Link href="/articles/the-mathematics-of-morphing" className={ext}>
            The Mathematics of Morphing
          </Link>{" "}
          &mdash; pose interpolation between captured frames.
        </li>
        <li>
          <Link href="/articles/lineage-marey-to-now" className={ext}>
            Lineage: Marey to Now
          </Link>{" "}
          &mdash; the chrono-photographic ancestor of every camera
          here.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-fire-art-photographers" className={ext}>
            Who&rsquo;s Who &mdash; UK Fire Art Photographers
          </Link>{" "}
          &mdash; sibling map.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ar-people" className={ext}>
            Who&rsquo;s Who &mdash; UK AR People
          </Link>{" "}
          &mdash; sibling map.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: "whos-who-uk-motion-capture",
  title: "Who's Who — UK Motion Capture Practitioners",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Motion capture in the UK, walked as six rooms: the optical volume, the inertial suit, the markerless single-camera, the face-and-hand specialist room, the performance-capture-for-stage room, and the build-your-own room. Every entry verifiable by a public URL.",
  Body: WhosWhoUkMotionCapture,
  related: [
    {
      href: "/articles/choreographing-with-laban",
      label: "Choreographing with Laban",
      note: "The body language behind any usable capture.",
    },
    {
      href: "/articles/aura-the-body",
      label: "Aura, the Body",
      note: "The embodied-performance reading.",
    },
    {
      href: "/articles/the-living-stage",
      label: "The Living Stage",
      note: "Performance plus technology in real time.",
    },
    {
      href: "/articles/lineage-marey-to-now",
      label: "Lineage: Marey to Now",
      note: "The chrono-photographic ancestor of every mocap camera.",
    },
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK Fire Art Photographers",
      note: "Sibling map.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR People",
      note: "Sibling map.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.vicon.com/",
      label: "Vicon — Yarnton",
      note: "The cameras hanging on most of the ceilings in this article.",
    },
    {
      href: "https://www.audiomotion.com/",
      label: "Audiomotion — Oxford",
      note: "One of the largest UK volumes.",
    },
    {
      href: "https://www.centroid3d.com/",
      label: "Centroid Motion Capture — Pinewood / Uxbridge",
      note: "Pinewood's preferred mocap supplier.",
    },
    {
      href: "https://www.imaginariumstudios.co.uk/",
      label: "Imaginarium Studios",
      note: "Andy Serkis's London performance-capture house.",
    },
    {
      href: "https://move.ai/",
      label: "Move AI",
      note: "UK markerless single-camera pioneer.",
    },
    {
      href: "https://di4d.com/",
      label: "DI4D — Glasgow",
      note: "4D facial performance capture, now part of Clear Angle.",
    },
    {
      href: "https://freemocap.org/",
      label: "FreeMoCap",
      note: "The open-source markerless system.",
    },
    {
      href: "https://www.camera.ac.uk/",
      label: "CAMERA — University of Bath",
      note: "Research centre with optical, 4D volumetric, virtual-production and light-stage rooms.",
    },
  ],
};
