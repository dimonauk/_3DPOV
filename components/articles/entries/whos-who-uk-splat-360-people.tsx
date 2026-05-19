import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkSplat360People() {
  return (
    <>
      <p>
        Gaussian splatting arrived in late 2023 as a paper, and within
        eighteen months had eaten most of the previous decade&rsquo;s
        photogrammetry workflows for breakfast. Britain happened to be
        well placed when it landed; the country already had the
        laser-scanning houses, the 360-camera production companies, the
        academic groups who&rsquo;d been doing structure-from-motion
        for two decades, and one of the small handful of firms in the
        world actually shipping splat tooling at scale. This
        who&rsquo;s-who is a walking tour of where that practice
        clusters in the UK now, anchored in London because most of it
        is, with marked stops further out.
      </p>

      <p>
        The tour starts in Bloomsbury, walks through Hackney and the
        old Truman Brewery, takes the train to Cambridge for a
        software-house detour, then catches the M40 to Oxford and the
        long line to Surrey. Real people, real organisations, every
        name carrying a public URL. The studio&rsquo;s position on
        splat licensing sits in{" "}
        <Link href="/articles/on-splat-licences" className={ext}>
          On Splat Licences
        </Link>{" "}
        and should be read alongside this index.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop one &mdash; Bloomsbury, the Bartlett, ScanLAB Projects
      </h2>

      <p>
        Start at the Bartlett School of Architecture, UCL. The
        laser-scanning house that has done the most to make
        point-cloud-as-aesthetic a recognisable visual language in this
        country teaches here, and the studio sits a short walk away.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Matthew Shaw and William Trossell &mdash; ScanLAB
          Projects</strong> &mdash; London. Founded as a creative
          studio half art-half research-lab, ScanLAB are the people
          who scanned Stephen Hawking&rsquo;s office, melting Arctic
          ice, former concentration camps and cacti blooms in the
          Sonoran Desert; the work has shown at the Royal Academy,
          LACMA, the Venice Biennale, the Barbican and the
          Photographers&rsquo; Gallery. They taught at the Bartlett
          while they built the studio and still do. The seminal British
          point-cloud aesthetic is theirs.{" "}
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
            href="https://scanlabprojects.co.uk/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            studio &amp; team{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        From the Bartlett, head east through Bloomsbury, cross the
        City, and walk to Brick Lane. The next two stops sit within
        ten minutes of each other.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop two &mdash; Brick Lane, Surround Vision
      </h2>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Surround Vision</strong> &mdash; The Old Truman
          Brewery, 91 Brick Lane, London E1 6QL. A 360 and VR film
          studio with more than a decade of end-to-end production
          credits; sports, arts, documentary, fashion and culture, plus
          volumetric and live VR. The shop the UK reaches for when a
          broadcaster needs a 360 rig at festival scale, with a second
          location in Weybridge. The studio&rsquo;s in-house team
          predates most current splat-conversion pipelines but the
          source footage is exactly what those pipelines now consume.{" "}
          <a
            href="https://surroundvision.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            surroundvision.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://surroundvision.co.uk/vr-360-creative-production-services/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            services{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop three &mdash; North London, the body-scan houses
      </h2>

      <p>
        Take the Overground north. The capture-for-film-and-games
        cluster lives in the old industrial sheds around Wood Green,
        Tottenham and Hackney Wick, where rigs of two hundred cameras
        are easier to build because the ceilings are tall enough.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Repronauts</strong> &mdash; The Chocolate Factory,
          North London. Specialists in photogrammetry and
          structured-light body, head and object capture; the team
          publishes the meshes and textures as the deliverable rather
          than the rig footage, which is the giveaway that the work
          flows downstream into film and games. The North London side
          of this cluster.{" "}
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
          <strong>Clear Angle Studios</strong> &mdash; UK. Eighteen
          full-body photogrammetry systems, two hundred and four
          cameras, thirty-two lights, capture geometry and textures and
          look-dev reference in 1.2 seconds. The number-of-cameras
          headline is the one to remember; this is the rig clients hire
          when the brief is &ldquo;every actor in the show, in one
          afternoon&rdquo;.{" "}
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
          <strong>Sample &amp; Hold</strong> &mdash; central London. A
          3D scanning service company with a small in-town studio doing
          the latest photogrammetry hardware-and-software stack;
          smaller footprint than the body-rig houses but on the same
          downstream pipeline.{" "}
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
        Stop four &mdash; Brighton, indie photogrammetry
      </h2>

      <p>
        The tour leaves London for an hour. Brighton has a single
        public-facing photogrammetry studio worth naming here, doing
        the artist-and-cultural end rather than the body-scan-for-game
        end.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>3Dify</strong> &mdash; Brighton. Full-colour
          photorealistic 3D body scans, hyper-real head and object
          scans for artists, galleries, museums and digital
          installations. The pipeline that the London body-rig houses
          do at industrial scale, run at studio scale for a different
          clientele.{" "}
          <a
            href="https://www.3dify.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dify.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop five &mdash; Cambridge, VividQ and the splat-as-display crowd
      </h2>

      <p>
        The train from King&rsquo;s Cross to Cambridge is fifty
        minutes. The point of the detour is the holography end of the
        splat ecosystem; VividQ&rsquo;s engine renders Gaussian-splat
        scenes onto holographic displays without going through a
        polygonal intermediate stage, which is a category of pipeline
        only a handful of firms in the world ship.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Darren Milne and Tom Durrant &mdash; VividQ</strong>{" "}
          &mdash; Cambridge. Founded 2017. Computer-generated
          holography software for headset and head-up displays;
          $30M+ raised through the Series A; collaborations with
          chip-makers, AR-headset OEMs and (per recent press) the
          Gaussian-splat ecosystem. The British holography-rendering
          house.{" "}
          <a
            href="https://www.vividq.com/technology"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vividq.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.vividq.com/news/pushing-boundaries-with-vividqs-holographic-headset-prototype"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            headset prototype write-up{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop six &mdash; Oxford and London, Niantic Spatial
      </h2>

      <p>
        The most-cited piece of UK splat infrastructure is American at
        the headquarters and British at the lab. Niantic&rsquo;s
        spatial-computing research groups sit in London and Oxford, and
        the person who first put the original 3D Gaussian Splatting
        paper in front of the research org did it from London.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Charlie Houseago &mdash; Niantic Spatial</strong>{" "}
          &mdash; London. Spatial-computing researcher; the named
          credit in Niantic&rsquo;s own write-up of how splats
          entered the company is &ldquo;Charlie saw the paper and
          presented it to the London research group&rdquo;. Worth
          naming because the lineage is otherwise easy to lose.{" "}
          <a
            href="https://nianticlabs.com/news/splats-change-everything"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Niantic Labs &mdash; splats-change-everything{arrow}
          </a>
        </li>
        <li>
          <strong>Niantic Spatial &mdash; London and Oxford research
          groups</strong>. The team behind SPZ (the open-source
          file format for Gaussian splats), Scaniverse, and the
          Niantic Spatial Platform; team and research locations
          publicly listed as London and Oxford. The infrastructure
          house.{" "}
          <a
            href="https://www.nianticspatial.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            nianticspatial.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Niantic_Spatial"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            company entry{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop seven &mdash; Guildford, the Surrey academic cluster
      </h2>

      <p>
        Take the South Western Railway out of Waterloo. The University
        of Surrey&rsquo;s Centre for Vision, Speech and Signal
        Processing has been on the structure-from-motion problem for
        decades and has been publishing on splat compression and
        accuracy since 2024.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>University of Surrey &mdash; CVSSP</strong> &mdash;
          Guildford. Splat compression research, novel-view synthesis,
          radiance-field accuracy work; the institutional anchor for
          splat science in the south-east. The studio is naming the
          group rather than individuals because the publication churn
          is fast enough that any single-author shout-out will date.{" "}
          <a
            href="https://www.surrey.ac.uk/centre-vision-speech-signal-processing"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            surrey.ac.uk &mdash; CVSSP{arrow}
          </a>
        </li>
        <li>
          <strong>Imperial College London &mdash; Dyson Robotics Lab
          and the splat acceleration group</strong>. Imperial is on the
          rendering-acceleration end of splats (Lingjun Gao, Wayne Luk
          on neural sorting and axis-oriented rasterisation, 2025);
          again, naming the group not the seminar list because the
          paper turnover is too fast.{" "}
          <a
            href="https://www.imperial.ac.uk/dyson-robotics-lab/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imperial.ac.uk &mdash; Dyson Robotics Lab{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://arxiv.org/abs/2506.07069"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arxiv:2506.07069{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stops the tour doesn&rsquo;t reach
      </h2>

      <p>
        Manchester and Glasgow both have splat-curious individuals and
        small studios; the studio knows them by reputation and not by
        the discipline of a public URL. The Manchester side of the
        scene is real but under-documented in the press, and naming
        names from a private rolodex would break the discipline of
        this index. Reader corrections welcome via the contact page;
        anyone with a public portfolio doing UK splat work outside the
        cities named above is a candidate for the next revision.
      </p>

      <p>
        The drone-photogrammetry-as-splat-source end is also thinner
        than it should be in print. Liam Byrne&rsquo;s ArtStation
        captures of Dalkey Island and Killiney Hill are well known on
        the splat community side; he&rsquo;s Irish-based but the
        technique is shared with the UK aerial-capture practitioners
        covered separately in{" "}
        <Link href="/articles/whos-who-uk-drone-people" className={ext}>
          Who&rsquo;s Who &mdash; UK drone people
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On the discipline of the field
      </h2>

      <p>
        Splat and 360 capture is genuinely young as a working practice.
        The paper that gave it the current shape is from 2023; the
        production-ready toolchain is from 2024; the licence questions
        are from 2025 and not yet resolved. Britain is, unusually, at
        or near the front of all three of those waves &mdash; the
        infrastructure house (Niantic Spatial), the rendering house
        (VividQ), the aesthetic house (ScanLAB), the bodywork houses
        (Clear Angle, Repronauts) and the academic clusters (Surrey,
        Imperial, UCL via the Bartlett) all sit on the same island.
        The studio reads that as a working scene rather than a
        scattered set of vendors, and the rolodex will refresh as the
        scene does.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-3d-mesh-people" className={ext}>
            Who&rsquo;s Who &mdash; UK 3D-mesh / photogrammetry artists
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-drone-people" className={ext}>
            Who&rsquo;s Who &mdash; UK drone people
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
          <Link href="/articles/whos-who-uk-motion-capture" className={ext}>
            Who&rsquo;s Who &mdash; UK motion capture
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
        Studio and company sites
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
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
            href="https://surroundvision.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            surroundvision.com{arrow}
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
            href="https://www.vividq.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vividq.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.nianticspatial.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            nianticspatial.com{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Press and research
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://nianticlabs.com/news/splats-change-everything"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            nianticlabs.com &mdash; splats-change-everything{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://nianticlabs.com/news/scaniverse4"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            nianticlabs.com &mdash; Scaniverse 4 launch{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Niantic_Spatial"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Niantic Spatial{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.silicon.co.uk/press-release/vividq-secures-7-5-million-in-additional-funding-to-productize-its-market-defining-holographic-displays"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            silicon.co.uk &mdash; VividQ Series A extension{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imveurope.com/article/expansion-plans-continue-holography-start-vividq-funding-now-ps22m"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imveurope.com &mdash; VividQ expansion{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://arxiv.org/abs/2506.07069"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arxiv:2506.07069 &mdash; Imperial splat acceleration paper{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.buildingcentre.co.uk/news/articles/3d-laser-scanning-and-point-cloud-visualisation-by-scanlab"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            buildingcentre.co.uk &mdash; ScanLAB profile{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Academic and institutional
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.surrey.ac.uk/centre-vision-speech-signal-processing"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            surrey.ac.uk &mdash; CVSSP{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imperial.ac.uk/dyson-robotics-lab/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imperial.ac.uk &mdash; Dyson Robotics Lab{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.aaschool.ac.uk/public/whats-on/scanlab-projects-experiments-in-observation-capture"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            aaschool.ac.uk &mdash; ScanLAB exhibition{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK Gaussian-splat / 360-capture practitioners in the
 * `walking-tour` format from docs/CONTENT-MILL.md. The tour starts at
 * the Bartlett, walks east through Brick Lane and the North London
 * body-rig cluster, takes the train to Brighton, then to Cambridge
 * for VividQ, Oxford/London for Niantic Spatial, and Guildford for
 * Surrey's CVSSP. Imperial is included as the south-Kensington
 * academic node alongside UCL.
 *
 * All entries verified via public URLs (2026-05-19). Manchester /
 * Glasgow clusters and the drone-photogrammetry-as-splat-source end
 * are flagged in prose rather than padded.
 */
export const entry: Entry = {
  slug: "whos-who-uk-splat-360-people",
  title:
    "Who's Who — UK Gaussian-splat & 360 capture, a walking tour",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Gaussian splatting arrived in 2023 and Britain happened to be ready. A walking-tour who's-who of UK splat and 360 practitioners — from ScanLAB at the Bartlett, through the Brick Lane and North London capture houses, to VividQ in Cambridge, Niantic Spatial in London and Oxford, and the Surrey and Imperial academic clusters.",
  Body: WhosWhoUkSplat360People,
  related: [
    {
      href: "/articles/on-splat-licences",
      label: "On Splat Licences",
      note: "The licensing argument that should be read alongside this index.",
    },
    {
      href: "/articles/whos-who-uk-3d-mesh-people",
      label: "Who's Who — UK 3D-mesh / photogrammetry artists",
      note: "Sibling index on the mesh side of capture.",
    },
    {
      href: "/articles/whos-who-uk-drone-people",
      label: "Who's Who — UK drone people",
      note: "The aerial source that feeds splat reconstructions.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "The downstream consumers of splat scenes.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "The body-capture neighbours.",
    },
  ],
  furtherReading: [
    {
      href: "https://scanlabprojects.co.uk/",
      label: "ScanLAB Projects — London",
      note: "Matthew Shaw and William Trossell, the studio that made the British point-cloud look.",
    },
    {
      href: "https://www.nianticspatial.com/",
      label: "Niantic Spatial",
      note: "The London/Oxford research org behind Scaniverse and SPZ.",
    },
    {
      href: "https://www.vividq.com/",
      label: "VividQ — Cambridge",
      note: "The British holography-rendering house, splat-aware.",
    },
    {
      href: "https://surroundvision.com/",
      label: "Surround Vision — Brick Lane",
      note: "The 360 production house with the decade-long credit list.",
    },
    {
      href: "https://www.clearanglestudios.co.uk/",
      label: "Clear Angle Studios",
      note: "The big-rig body-capture house.",
    },
    {
      href: "https://nianticlabs.com/news/splats-change-everything",
      label: "Splats Change Everything — Niantic Labs",
      note: "Where the lineage of UK splat adoption is publicly written down.",
    },
  ],
};
