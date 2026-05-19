import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkVrSculptingPeople() {
  return (
    <>
      <p>
        VR sculpting is a craft that sorts by its tools more obviously
        than almost any other. The Tilt Brush painter makes a different
        object from the Quill animator; the Gravity Sketch product
        designer thinks in surfaces and parametrics; the Adobe Medium
        sculptor works in voxels; the Blocks builder treats every form
        as a low-poly primitive. The tools are the lineages. The
        signatures the artists develop are functions of the tool&rsquo;s
        constraints.
      </p>

      <p>
        The UK is unusual in this scene because one of the major tools
        was built here: Gravity Sketch began as a Royal College of Art
        + Imperial College master&rsquo;s thesis in 2014 and grew into
        the leading VR design tool in the automotive and product
        sectors. The UK&rsquo;s native presence in Quill, Tilt Brush
        diaspora and the Adobe Medium / Blocks world is thinner; the
        scene leans toward the painter-as-individual rather than the
        studio-as-institution, and many of the most visible figures
        work internationally and visit the UK rather than residing
        here. That is the honest texture of this index.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link
          href="/articles/sellotape-and-tilt-brush"
          className={ext}
        >
          Sellotape and Tilt Brush
        </Link>{" "}
        on the studio&rsquo;s own VR-painting position;{" "}
        <Link
          href="/articles/vr-as-psychological-system"
          className={ext}
        >
          VR as a Psychological System
        </Link>{" "}
        on what painting in VR is doing;{" "}
        <Link
          href="/articles/why-i-build-my-own-rigs"
          className={ext}
        >
          Why I Build My Own Rigs
        </Link>{" "}
        on hardware lineage.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Tool one &mdash; Gravity Sketch
      </h2>

      <p>
        Built in London, 2014. The tool the UK can claim as its own.
        Gravity Sketch is the dominant VR sketching and 3D design
        platform in industrial and automotive design &mdash; Ford,
        Jaguar Land Rover, Reebok, BMW and a long list of Tier 1
        product studios use it as their initial concept-to-CAD
        bridge. The UI is two-handed; the work surface is volumetric;
        the output exports cleanly into the rest of the design
        pipeline.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Oluwaseyi Sosanya</strong> &mdash; co-founder and
          (founding) CEO. RCA + Imperial Innovation Design Engineering
          graduate. Previously at Jaguar Land Rover, where the
          frustration that became Gravity Sketch was first observed
          first-hand: designers thinking in 3D, restricted to 2D
          interfaces. See the Gravity Sketch site below for the
          current platform.
        </li>
        <li>
          <strong>Daniela Paredes Fuentes</strong> &mdash; co-founder
          and CXO. RCA + Imperial graduate, named one of the UK&rsquo;s
          most innovative women by Innovate UK in 2019 (&pound;50,000
          Women in Innovation Award). Has held the user-experience
          leadership of the platform across its growth from start-up
          to multi-national enterprise tool.{" "}
          <a
            href="https://www.imperial.ac.uk/news/190512/inventor-3d-sketching-tool-named-uks/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imperial College news{arrow}
          </a>
        </li>
        <li>
          <strong>Daniel Thomas</strong> &mdash; co-founder and CTO.
          The third corner of the founding triangle; the engineering
          lead through Gravity Sketch&rsquo;s $33M Series A in 2022.{" "}
          <a
            href="https://techcrunch.com/2022/04/19/gravity-sketch-draws-33m-for-a-platform-to-design-collaborate-on-and-produce-3d-objects/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            TechCrunch on the Series A{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-6">
        Public-facing studio:{" "}
        <a
          href="https://www.gravitysketch.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          gravitysketch.com{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Tool two &mdash; Quill (the Oculus VR illustration and
        animation tool)
      </h2>

      <p>
        Originally developed inside Oculus Story Studio for the
        animated short <em>Dear Angelica</em> (2016). Sold by Meta in
        September 2021 back to its original creator, Inigo Quilez, and
        now maintained by Quill Theory. The Quill register is
        painterly, animated, and built for short-film authorship rather
        than for product design.
      </p>

      <p className="mt-6">
        The UK Quill bench is small and largely overlaps with the
        general animation industry. The studio could not verify a
        UK-based full-time Quill artist with a stable public portfolio
        at the time of this article &mdash; the form&rsquo;s most
        visible practitioners (Goro Fujita, Wesley Allsbrook, Estella
        Tse) work from the US. The studio&rsquo;s position is to flag
        the gap rather than fill it with names that do not resolve to
        UK residence. Reader corrections welcome via the contact page.{" "}
        <a
          href="https://quill.art/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          quill.art{arrow}
        </a>{" "}
        &middot;{" "}
        <a
          href="https://en.wikipedia.org/wiki/Oculus_Quill"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Quill on Wikipedia{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Tool three &mdash; Tilt Brush (now Open Brush)
      </h2>

      <p>
        Google&rsquo;s painting-in-VR app, made open-source as Open
        Brush after Google sunsetted Tilt Brush in 2021. The original
        Tilt Brush register defined what most non-VR people think VR
        painting looks like &mdash; emissive ribbons, particle-trail
        brushes, the painter walking inside the painting. The UK
        Tilt-Brush diaspora is mostly individual artists who came up
        through the early Vive period, with no concentrated studio.
      </p>

      <p className="mt-6">
        The most-cited international Tilt Brush figures &mdash;
        Estella Tse, who came in through the Google Artist in
        Residence programme &mdash; are not UK-based. The studio
        notes this honestly: the British VR-painting scene tends to
        favour Gravity Sketch and Quill over Tilt Brush, and the
        Tilt-Brush diaspora that exists here is scattered through
        VFX houses rather than identifiable as a separate practice.{" "}
        <a
          href="https://openbrush.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          openbrush.app{arrow}
        </a>{" "}
        &middot;{" "}
        <a
          href="https://www.estellatse.com/tilt-brush-metamorphosis"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Estella Tse &mdash; Metamorphosis{arrow}
        </a>{" "}
        (US, included for tool context)
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Tool four &mdash; Adobe Medium / Blocks (voxel + low-poly)
      </h2>

      <p>
        Adobe Medium (formerly Oculus Medium) is a clay-style voxel
        sculpting tool for VR; Google Blocks is its low-poly
        primitive-builder counterpart. Both have UK practitioners,
        mostly inside game-development and VFX houses rather than as
        artists publishing in their own name. The British practice
        here is again largely studio-internal rather than
        artist-publishing, which makes a public-URL index hard to
        populate honestly.
      </p>

      <p className="mt-6">
        The studio&rsquo;s position is the same as elsewhere on this
        article: where verification thins, the section gets short, not
        padded. Riggers and modellers using these tools end up listed
        in the{" "}
        <Link
          href="/articles/whos-who-uk-3d-mesh-people"
          className={ext}
        >
          UK 3D mesh
        </Link>{" "}
        and{" "}
        <Link
          href="/articles/whos-who-uk-3d-print-fabrication-people"
          className={ext}
        >
          3D print fabrication
        </Link>{" "}
        indices where their full pipeline is public.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Tool five &mdash; the institutional rooms
      </h2>

      <p>
        Two UK institutional anchors carry serious VR / immersive
        practice for the sculpting + scanning side of the scene.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>RCA Snap Visualisation Lab</strong> &mdash; the
          Royal College of Art&rsquo;s multimodal immersive and
          interactive virtual environment, funded by the Spiegel
          Family Fund. Double-height three-sided projection,
          motion-capture support, VR development, immersive design
          reviews. Serves RCA researchers and PhD students across
          inclusive design, intelligent mobility, materials science,
          computer science and robotics. The institutional engine
          behind a lot of UK postgraduate VR practice.{" "}
          <a
            href="https://www.rca.ac.uk/business/snap-visualisation-lab/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rca.ac.uk &mdash; Snap Visualisation Lab{arrow}
          </a>
        </li>
        <li>
          <strong>ScanLAB Projects</strong> &mdash; London. Founded
          2010. Adjacent rather than VR-sculpting-in-the-strict-sense,
          but the studio&rsquo;s point-cloud aesthetic and its
          consistent practice of building immersive installations
          from 3D scans makes it the closest UK studio-equivalent to
          the international VR-sculpting practice. Works for the
          Royal Academy, LACMA, the Venice Biennale, the Photographers&rsquo;
          Gallery, the Barbican. Cross-referenced from{" "}
          <Link
            href="/articles/whos-who-uk-splat-360-people"
            className={ext}
          >
            UK splat / 360 people
          </Link>{" "}
          for the capture side of their pipeline.{" "}
          <a
            href="https://scanlabprojects.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            scanlabprojects.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Tool six &mdash; the gesture lineage (mi.mu and adjacents)
      </h2>

      <p>
        The boundary between VR sculpting and gestural input is thin
        and worth flagging. The UK has serious gesture-as-input
        research running through{" "}
        <a
          href="https://mimugloves.com/about/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mi.mu Gloves{arrow}
        </a>{" "}
        (Imogen Heap + Dr Tom Mitchell at UWE Bristol &mdash; see also
        the{" "}
        <Link
          href="/articles/whos-who-uk-garment-wearable-tech-people"
          className={ext}
        >
          UK garment + wearable-tech
        </Link>{" "}
        index). The mi.mu work is musical performance rather than
        sculpting per se, but the algorithms and the gestural
        vocabulary it produces feed back into VR-painting interfaces
        directly.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest gaps
      </h2>

      <p>
        The painter-publishing-in-their-own-name end of UK VR
        sculpting is genuinely thin. The strongest UK contribution to
        this craft is on the tool-building side (Gravity Sketch),
        the institutional-research side (RCA, ScanLAB, UWE Bristol)
        and the gesture-research side (mi.mu), rather than on the
        Goro-Fujita / Estella-Tse model of a single artist with a
        large body of VR-painting work.
      </p>

      <p className="mt-6">
        This is a gap the studio is watching rather than papering
        over. Several UK animators publish individual Quill or Open
        Brush pieces through their general-portfolio sites; the studio
        is treating those as in-scope but not yet at the verification
        threshold for a named entry here. The category will refresh
        when individual practitioners cross the &ldquo;sustained
        body of work + own URL&rdquo; bar.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On the tools as lineages
      </h2>

      <p>
        Tools are not neutral. A painter who learns to draw in
        Gravity Sketch will think differently about volume than a
        painter who learns in Quill, who will think differently again
        from a painter who learns in Tilt Brush. The studio&rsquo;s
        argument on tool-as-lineage sits in{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>{" "}
        and the original VR-painting position is in{" "}
        <Link
          href="/articles/sellotape-and-tilt-brush"
          className={ext}
        >
          Sellotape and Tilt Brush
        </Link>
        . Both should be read alongside this index.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-vr-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-vtuber-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK VTubers
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-3d-mesh-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK 3D mesh people
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-splat-360-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK splat + 360 people
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
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <p className="mt-2 text-sm text-chrome-400">
        Every external URL touched in research for this article,
        grouped by domain.
      </p>

      <h3 className="mt-6 text-lg text-chrome-100">Tool sites</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.gravitysketch.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gravitysketch.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://quill.art/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            quill.art{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://openbrush.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            openbrush.app{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://mimugloves.com/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mimugloves.com{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Studio and institutional anchors
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
            href="https://www.rca.ac.uk/business/snap-visualisation-lab/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rca.ac.uk &mdash; Snap Visualisation Lab{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.estellatse.com/tilt-brush-metamorphosis"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            estellatse.com (US, tool context){arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">Press</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://techcrunch.com/2022/04/19/gravity-sketch-draws-33m-for-a-platform-to-design-collaborate-on-and-produce-3d-objects/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            techcrunch.com &mdash; Gravity Sketch $33M Series A{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imperial.ac.uk/news/190512/inventor-3d-sketching-tool-named-uks/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imperial.ac.uk &mdash; Paredes Fuentes Innovate UK award
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://smallbusiness.co.uk/daniela-paredes-fuentes-gravity-sketch-2546739/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            smallbusiness.co.uk &mdash; Paredes Fuentes Q&amp;A{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://blog.google/products/google-ar-vr/tilt-brush-artist-residence-meet-estella-tse/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            blog.google &mdash; Tilt Brush Artist in Residence{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">Reference</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Oculus_Quill"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Oculus Quill{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK VR sculpting + virtual painting practitioners in the
 * `by-tool` format from docs/CONTENT-MILL.md. Organised by the VR tool
 * each practitioner / studio works in: Gravity Sketch (UK-built),
 * Quill, Tilt Brush / Open Brush, Adobe Medium + Blocks, the
 * institutional rooms (RCA Snap Lab, ScanLAB), and the gesture-input
 * lineage (mi.mu). Real people, public URLs; UK painter-publishing
 * gaps flagged honestly rather than padded.
 */
export const entry: Entry = {
  slug: "whos-who-uk-vr-sculpting-people",
  title:
    "Who's Who — UK VR sculpting and virtual painting, by the tool",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "VR sculpting sorts by its tools. A who's-who of UK VR painting and 3D-in-VR practice: Gravity Sketch (built in London), Quill, Tilt Brush / Open Brush, Adobe Medium, plus the RCA Snap Lab and ScanLAB Projects as the institutional rooms.",
  Body: WhosWhoUkVrSculptingPeople,
  related: [
    {
      href: "/articles/sellotape-and-tilt-brush",
      label: "Sellotape and Tilt Brush",
      note: "The studio's own VR-painting position.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a Psychological System",
      note: "Why painting in VR is doing something different.",
    },
    {
      href: "/articles/why-i-build-my-own-rigs",
      label: "Why I Build My Own Rigs",
      note: "Hardware lineage.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Tool-as-lineage argument.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Sibling index.",
    },
    {
      href: "/articles/whos-who-uk-3d-mesh-people",
      label: "Who's Who — UK 3D mesh people",
      note: "Mesh-side of the VR pipeline.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.gravitysketch.com/",
      label: "Gravity Sketch",
      note: "Built in London 2014. The UK's home-grown VR design platform.",
    },
    {
      href: "https://quill.art/",
      label: "Quill",
      note: "The Oculus Story Studio VR illustration tool, now maintained by Quill Theory.",
    },
    {
      href: "https://openbrush.app/",
      label: "Open Brush",
      note: "Open-source fork of Google Tilt Brush after sunset.",
    },
    {
      href: "https://www.rca.ac.uk/business/snap-visualisation-lab/",
      label: "RCA Snap Visualisation Lab",
      note: "The institutional VR research engine at the Royal College of Art.",
    },
  ],
};
