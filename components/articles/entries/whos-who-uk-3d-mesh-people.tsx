import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkMeshPeople() {
  return (
    <>
      <p>
        Photogrammetry has a longer working memory than splatting. The
        process &mdash; photograph an object from every angle, solve
        for the geometry, deliver a mesh and a texture &mdash; has
        been a working craft in the UK since the late 1990s; it
        predates the consumer DSLRs that made it cheap, and predates
        the GPUs that made it fast. The practitioners come from at
        least six different professional rooms, and the rooms do not
        always speak to one another.
      </p>

      <p>
        This who&rsquo;s-who walks through six rooms of mesh work in
        the UK. Each is a different professional culture &mdash; the
        rig, the gallery, the dig, the building, the cartridge, the
        bench. The same physics; different deliverables; different
        rates; different conferences. The studio&rsquo;s position is
        that the rooms are interesting precisely because they
        don&rsquo;t merge. Real people only below, every name verified
        by public URL. The neighbouring splat scene is the subject of{" "}
        <Link
          href="/articles/whos-who-uk-splat-360-people"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK Gaussian-splat &amp; 360 capture
        </Link>{" "}
        and overlaps where the deliverables converge.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room one &mdash; the rig (film and games body capture)
      </h2>

      <p>
        The first room is built around a circular array of fifty to
        two hundred cameras, fired in synchrony, that captures an
        actor or an object as a single multi-view dataset. The
        deliverable is a watertight mesh with displacement maps and
        4K colour, ready for a film engine or game engine.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Clear Angle Studios</strong> &mdash; UK. Eighteen
          full-body photogrammetry systems with two hundred and four
          cameras and thirty-two lights; capture in 1.2 seconds; client
          list across film and games. The benchmark in this room.{" "}
          <a
            href="https://www.clearanglestudios.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            clearanglestudios.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Repronauts</strong> &mdash; The Chocolate Factory,
          North London. Photogrammetry and structured-light body, head
          and object scanning; experienced 3D-artist team in-house, so
          the deliverable is finished meshes and textures, not raw
          rig footage.{" "}
          <a
            href="https://repronauts.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            repronauts.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://repronauts.com/3d-scanning/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            scanning services{arrow}
          </a>
        </li>
        <li>
          <strong>Visual Skies</strong> &mdash; UK. 3D and 4D scanning
          specialists with a publicly listed team; the 4D side
          (sequential body-capture) is rarer in the UK and worth
          marking out. Film, games, AR/VR clientele.{" "}
          <a
            href="https://visualskies.com/scanning-experts/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            visualskies.com{arrow}
          </a>
        </li>
        <li>
          <strong>Sample &amp; Hold</strong> &mdash; central London. A
          smaller-footprint 3D scanning service running the current
          photogrammetry hardware-and-software stack; the boutique end
          of the room.{" "}
          <a
            href="http://www.sampleandhold.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sampleandhold.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room two &mdash; the gallery (Factum Arte and the conservation
        houses)
      </h2>

      <p>
        The second room is built around a different deliverable: not a
        mesh for an engine, but a one-to-one facsimile, surface
        accurate to the order of microns, often physically reproduced
        as a panel, plaster cast or carved replica. The practice sits
        at the intersection of conservation, photography and
        printmaking; the British end of it is anchored in one figure
        and one studio with a permanent London presence.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Adam Lowe &mdash; Factum Arte &amp; Factum Foundation</strong>{" "}
          &mdash; Oxford-born, working internationally; the
          foundation maintains an office at 27 Crosby Row, London SE1
          3YD, with associated spaces in Madrid and Milan. Founded
          Factum Arte in 2001 (with Manuel Franquelo and Fernando
          Garcia-Guereta) and Factum Foundation in 2009; trained at
          the Ruskin School of Drawing and the RCA; awarded an OBE in
          the 2025 King&rsquo;s Birthday Honours for services to the
          Arts. The studio&rsquo;s position is that this is the most
          important figure in British heritage-scanning of the last
          quarter-century.{" "}
          <a
            href="https://factumfoundation.org/the-foundation/our-team/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            factumfoundation.org &mdash; team{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.factum-arte.com/pag/701/3d-scanning-for-cultural-heritage-conservation"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            heritage-scanning programme{arrow}
          </a>
        </li>
        <li>
          <strong>Factum Arte / ScanLAB joint work</strong> &mdash;
          recorded the fa&ccedil;ade of San Petronio in Bologna, the
          refectory at Santa Maria delle Grazie in Milan (which holds
          Leonardo&rsquo;s <em>Last Supper</em>), and the long
          documentation of the Tomb of Seti I in the Valley of the
          Kings. Worth crediting as a working partnership because the
          UK end of these projects is genuinely co-authored.{" "}
          <a
            href="https://www.factum-arte.com/pag/701/3d-scanning-for-cultural-heritage-conservation"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Factum &mdash; conservation programme{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room three &mdash; the dig (Historic England, Heritage3D, the
        landscape-archaeology bench)
      </h2>

      <p>
        The third room is the archaeology shed: handheld scanners,
        terrestrial lidar, photogrammetric rectification, all aimed at
        the working site. The deliverables are records that will
        outlast the buildings they describe. The UK has a formal
        institutional anchor for this work, and a body of professional
        guidance that goes back to 2006.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Historic England &mdash; geospatial imaging team</strong>{" "}
          &mdash; the public-sector bench. Published the foundational
          UK guidance document on 3D laser scanning for heritage
          (originally 2007, multiple revisions since); the
          institutional reference work that the rest of the sector
          calibrates against.{" "}
          <a
            href="https://historicengland.org.uk/images-books/publications/3d-laser-scanning-heritage/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            historicengland.org.uk &mdash; 3D laser scanning guidance{arrow}
          </a>
        </li>
        <li>
          <strong>Heritage3D</strong> &mdash; a UK-wide professional
          guidance initiative that began in 2006 to formalise good
          practice for laser scanning in archaeology and architecture;
          the seedling that Historic England&rsquo;s current programme
          grew from. Worth naming because the institutional history
          matters when you&rsquo;re reading older meshes.{" "}
          <a
            href="https://historicengland.org.uk/images-books/publications/3d-laser-scanning-heritage/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            (referenced in Historic England guidance){arrow}
          </a>
        </li>
        <li>
          <strong>ThinkScan Solutions</strong> &mdash; UK. Cross-sector
          3D scanning specialist with a heritage / archaeology / art
          line of business; the commercial bench that Historic
          England&rsquo;s guidance work feeds into.{" "}
          <a
            href="https://www.thinkscan.co.uk/sectors-industries/3d-scanning-for-cultural-heritage-arts"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            thinkscan.co.uk &mdash; heritage{arrow}
          </a>
        </li>
        <li>
          <strong>OR3D</strong> &mdash; UK. Geospatial 3D scanning
          house with a stated heritage line; the kind of vendor a
          regional museum hires when the in-house team needs an
          outside specialist.{" "}
          <a
            href="https://www.or3d.co.uk/geospatial/heritage/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            or3d.co.uk &mdash; heritage{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room four &mdash; the British Museum and the digitisation labs
      </h2>

      <p>
        The fourth room is the museum bench itself &mdash; the
        scientific-research wing of an institution scanning its own
        collection rather than commissioning an outside vendor. The
        most-cited example is the British Museum&rsquo;s
        photogrammetry programme inside the World Conservation and
        Exhibitions Centre.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>British Museum &mdash; Scientific Research, World
          Conservation and Exhibitions Centre</strong>. Operates the
          Arago Photogrammetry Rig, which scans objects through
          multiple wavelengths (infrared, ultraviolet, visible) for
          multi-layered records; the rig sat at the heart of the
          digitisation of the Rosetta Stone, and the Assyrian-relief
          programme used handheld structured-light scanners to cover
          205 square metres of relief. The institution names the
          equipment in public; it tends not to name the individual
          operators, which the studio reads as a deliberate culture of
          institutional rather than personal credit.{" "}
          <a
            href="https://www.britishmuseum.org/membership/how-your-money-helps/fundraising-scientific-research"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            britishmuseum.org &mdash; scientific research{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.artec3d.com/cases/british-museum-captures-its-assyrian-relief-collection-3d"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Assyrian-relief case study{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://isprs-archives.copernicus.org/articles/XLVIII-M-2-2023/1173/2023/isprs-archives-XLVIII-M-2-2023-1173-2023.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ISPRS paper on BM digital replicas (PDF){arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        The peer institutions &mdash; the V&amp;A, the Natural History
        Museum, the National Museums Scotland &mdash; all run smaller
        equivalent programmes. The studio is not naming individuals
        from those benches in this revision because the publication
        trail is thinner and the discipline of this index is one URL
        per name. A future pass will fill this section.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room five &mdash; the architectural cartridge (ScanLAB and the
        building-scale practice)
      </h2>

      <p>
        The fifth room is large-scale terrestrial laser scanning of
        buildings, landscapes and temporary events &mdash; the rig
        loaded into a Transit and aimed at a place. The deliverable is
        a point cloud you can navigate, that becomes a film, an
        artwork, a planning record, or all three. The British studio
        that turned this into a recognisable visual language is the
        same one that sits at the head of the splat tour.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Matthew Shaw and William Trossell &mdash; ScanLAB
          Projects</strong> &mdash; London. Listed here as well as in
          the splat index because the studio is genuinely
          cross-room: the laser-scanning practice that built the
          aesthetic feeds directly into the splat work they ship
          today. Royal Academy, LACMA, Venice Biennale, Barbican,
          Photographers&rsquo; Gallery; teach at the Bartlett School
          of Architecture, UCL.{" "}
          <a
            href="https://scanlabprojects.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            scanlabprojects.co.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://gazelliarthouse.com/artists/scanlab-projects/overview/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Gazelli Art House &mdash; gallery representation{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Room six &mdash; the bench (freelance and small-studio
        photogrammetry)
      </h2>

      <p>
        The sixth room is the one-person bench: a freelance
        photogrammetrist with a DSLR, a turntable, a calibrated lamp
        kit and a workstation running Metashape, RealityCapture or
        the recent open-source ports. Plenty of working UK
        practitioners sit here; the discipline of public URL is
        thinner in this room than any other, so the studio names the
        firms that publish portfolios and flags the gap for the rest.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>3Dify</strong> &mdash; Brighton. Indie photogrammetry
          studio doing full-colour body, head and object scans for
          artists, galleries, museums and digital installations; the
          public face of the room.{" "}
          <a
            href="https://www.3dify.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dify.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Superscan3D</strong> &mdash; UK. Photogrammetric
          scanning of sculpture, with a stated focus on the artist /
          gallery / commission market; the right vendor when an
          individual sculptor needs a one-off rather than a rig
          afternoon.{" "}
          <a
            href="http://superscan3d.com/3d-scanning-sculpture/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            superscan3d.com{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        The wider freelance bench &mdash; the painters, modellers and
        environment artists who do their own photogrammetry as part of
        a larger practice &mdash; is genuinely large in the UK and
        almost entirely invisible to a search engine. They publish to
        ArtStation, Sketchfab and personal sites rather than to
        marketing landing pages. A future revision of this article
        will spend time inside ArtStation and Sketchfab; for now, the
        room is honestly under-represented.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On craft and on the shape of the field
      </h2>

      <p>
        Mesh work has settled into a recognisable shape in Britain:
        the rig houses are well-capitalised and concentrated, the
        gallery practice has one anchor figure and a long tail, the
        archaeology bench has formal guidance and a stable client
        base, the museum labs run programmes named after their
        equipment, the architectural-scale practice has the British
        point-cloud aesthetic, and the freelance bench is alive but
        invisible. The boundaries between rooms are where the
        interesting work happens; ScanLAB&rsquo;s move into splats,
        Factum&rsquo;s collaborations with ScanLAB, the
        British Museum&rsquo;s use of structured-light handhelds for
        Assyrian reliefs &mdash; all of these are room-crossings, and
        all of them are public.
      </p>

      <p>
        The studio adds names when public URLs can carry the credit
        and removes them when the URLs go dark. The honest gap list
        for the next revision is: peer-museum digitisation operators
        (V&amp;A, NHM, NMS); the Edinburgh / Glasgow archaeology
        bench; the freelance ArtStation / Sketchfab UK tag; the
        Bristol photogrammetry crowd around the South West Creative
        Technology Network. Reader corrections welcome via the
        contact page.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-splat-360-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK Gaussian-splat &amp; 360 capture
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-3d-print-fabrication-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK 3D-print fabrication houses
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-drone-people" className={ext}>
            Who&rsquo;s Who &mdash; UK drone people
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-motion-capture" className={ext}>
            Who&rsquo;s Who &mdash; UK motion capture
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <p className="mt-2 text-sm text-chrome-400">
        Every external URL touched in research for this article,
        grouped by domain.
      </p>

      <h3 className="mt-6 text-lg text-chrome-100">
        Studio sites
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.clearanglestudios.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            clearanglestudios.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://repronauts.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            repronauts.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://visualskies.com/scanning-experts/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            visualskies.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="http://www.sampleandhold.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sampleandhold.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.3dify.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dify.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="http://superscan3d.com/3d-scanning-sculpture/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            superscan3d.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://scanlabprojects.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            scanlabprojects.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.thinkscan.co.uk/sectors-industries/3d-scanning-for-cultural-heritage-arts"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            thinkscan.co.uk &mdash; heritage{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.or3d.co.uk/geospatial/heritage/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            or3d.co.uk &mdash; heritage{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Factum group
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.factum-arte.com/pag/701/3d-scanning-for-cultural-heritage-conservation"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            factum-arte.com &mdash; heritage scanning{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://factumfoundation.org/the-foundation/our-team/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            factumfoundation.org &mdash; team{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Factum_Arte"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Factum Arte{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Institutional and academic
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://historicengland.org.uk/images-books/publications/3d-laser-scanning-heritage/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            historicengland.org.uk &mdash; 3D laser scanning guidance{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.britishmuseum.org/membership/how-your-money-helps/fundraising-scientific-research"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            britishmuseum.org &mdash; scientific research{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://isprs-archives.copernicus.org/articles/XLVIII-M-2-2023/1173/2023/isprs-archives-XLVIII-M-2-2023-1173-2023.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            isprs-archives.copernicus.org &mdash; BM digital replicas (PDF){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.artec3d.com/cases/british-museum-captures-its-assyrian-relief-collection-3d"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            artec3d.com &mdash; British Museum Assyrian relief case study{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://libguides.exeter.ac.uk/digitalhumanities/photogrammetry"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            University of Exeter &mdash; digital humanities photogrammetry guide{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://gazelliarthouse.com/artists/scanlab-projects/overview/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gazelliarthouse.com &mdash; ScanLAB representation{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK 3D-mesh / photogrammetry practitioners in the
 * `six-rooms` format from docs/CONTENT-MILL.md. The six rooms:
 *   1. The rig (Clear Angle, Repronauts, Visual Skies, Sample & Hold)
 *   2. The gallery (Factum Arte + Factum Foundation, Adam Lowe)
 *   3. The dig (Historic England, Heritage3D, ThinkScan, OR3D)
 *   4. The museum bench (British Museum + Arago rig)
 *   5. The architectural cartridge (ScanLAB Projects)
 *   6. The freelance bench (3Dify, Superscan3D + flagged gaps)
 *
 * All entries verified via public URLs (2026-05-19). Peer-museum
 * digitisation operators and the freelance ArtStation/Sketchfab UK
 * crowd are flagged in prose as honest gaps rather than padded.
 */
export const entry: Entry = {
  slug: "whos-who-uk-3d-mesh-people",
  title:
    "Who's Who — UK 3D-mesh & photogrammetry, six working rooms",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Photogrammetry in Britain runs through six professional rooms — the rig houses for film and games, the Factum-anchored gallery practice, the Historic-England-led archaeology bench, the British Museum's in-house labs, ScanLAB's architectural-scale work, and the freelance one-person bench. A who's-who organised by where the work actually happens.",
  Body: WhosWhoUkMeshPeople,
  related: [
    {
      href: "/articles/whos-who-uk-splat-360-people",
      label: "Who's Who — UK Gaussian-splat & 360 capture",
      note: "The neighbouring scene; meshes feed splats and splats feed meshes.",
    },
    {
      href: "/articles/whos-who-uk-3d-print-fabrication-people",
      label: "Who's Who — UK 3D-print fabrication houses",
      note: "Where the meshes get printed.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "The performing-body neighbours.",
    },
    {
      href: "/articles/whos-who-uk-drone-people",
      label: "Who's Who — UK drone people",
      note: "The aerial source for landscape photogrammetry.",
    },
    {
      href: "/articles/on-splat-licences",
      label: "On Splat Licences",
      note: "The licensing argument that meshes are caught up in too.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.factum-arte.com/pag/701/3d-scanning-for-cultural-heritage-conservation",
      label: "Factum Arte — heritage scanning programme",
      note: "Adam Lowe's programme; the British gallery-conservation anchor.",
    },
    {
      href: "https://scanlabprojects.co.uk/",
      label: "ScanLAB Projects",
      note: "Matthew Shaw & William Trossell; the British point-cloud aesthetic.",
    },
    {
      href: "https://historicengland.org.uk/images-books/publications/3d-laser-scanning-heritage/",
      label: "Historic England — 3D laser scanning for heritage",
      note: "The institutional guidance document the sector calibrates against.",
    },
    {
      href: "https://www.clearanglestudios.co.uk/",
      label: "Clear Angle Studios",
      note: "The 204-camera body-rig benchmark for film and games.",
    },
    {
      href: "https://www.britishmuseum.org/membership/how-your-money-helps/fundraising-scientific-research",
      label: "British Museum — Scientific Research",
      note: "The Arago Photogrammetry Rig and the in-house digitisation programme.",
    },
  ],
};
