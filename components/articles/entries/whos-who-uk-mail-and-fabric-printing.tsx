import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkMailAndFabricPrinting() {
  return (
    <>
      <p>
        The UK&rsquo;s 3D-printed-mail community is small, technical,
        and sorted more honestly by the machine than by the postcode.
        Two people in different cities running the same Creality CR-30
        will recognise each other&rsquo;s work at a glance; two
        printers in the same studio running a flat-bed Bambu and a
        belt printer will produce visually different objects from the
        same STL. The tool is the lineage. The tool is the section of
        this article.
      </p>

      <p>
        The scope is narrower than the broader{" "}
        <Link href="/articles/whos-who-uk-3d-printing" className={ext}>
          UK 3D-printing
        </Link>{" "}
        piece would cover &mdash; we are only here for the
        material-layer mail discipline: scale-mail, chain-mail,
        dragon-mail, origami crease patterns, print-in-place
        articulated meshes. The makers below are real, public, and
        their URLs resolve. Where the bench in a given category is
        thin, it is named as thin. The studio would rather flag a gap
        than fill one with invention.
      </p>

      <p>
        Background reading for this piece: the studio&rsquo;s own{" "}
        <Link
          href="/articles/material-layer-mail-printing"
          className={ext}
        >
          Material-Layer Mail Printing
        </Link>{" "}
        article sets the geometry, the{" "}
        <Link
          href="/tutorials/tutorial-dragon-scale-wall-relief"
          className={ext}
        >
          dragon-scale tutorial
        </Link>{" "}
        sets the hands-on workflow, and the{" "}
        <Link
          href="/articles/belt-printed-wall-reliefs"
          className={ext}
        >
          belt-printed wall reliefs
        </Link>{" "}
        piece sets the architectural register. The makers below sit
        across those three contexts.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who run a Creality CR-30 belt printer
      </h2>

      <p>
        The CR-30 is the consumer-affordable belt printer; it shipped
        from a Kickstarter campaign in 2020 and a UK community formed
        around it almost immediately. The angled bed, the conveyor,
        the continuous-Z slogan &mdash; a small grammar that produces
        visually consistent work. UK CR-30 owners tend to know each
        other through the{" "}
        <a
          href="https://www.facebook.com/groups/cr30/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CR-30 Facebook group{arrow}
        </a>{" "}
        and the maker forums; the community is informal and
        technical.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>3D Printing Leeds</strong> &mdash; Leeds. A
          commercial 3D-printing service trading as the James
          Rothschild Partnership. The bench includes continuous belt
          machines that take part length up to a practical maximum of
          2&nbsp;metres, with a published 360&nbsp;mm previous-maximum
          for context on how much the belt format expanded their work.
          They serve London, Manchester, Sheffield and the wider UK
          on small-batch and continuous-run terms; one of the few UK
          commercial outfits visibly trading on the continuous-Z
          capability as a service.{" "}
          <a
            href="https://www.3dprintingleeds.co.uk/continuous-belt-3d-printing/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dprintingleeds.co.uk &mdash; continuous belt 3D printing{arrow}
          </a>
        </li>
        <li>
          <strong>Creality UK</strong> &mdash; the official UK store
          for the CR-30 is{" "}
          <a
            href="https://www.crealityofficial.co.uk/products/cr-30-3d-printer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            crealityofficial.co.uk{arrow}
          </a>
          . Worth listing because the UK CR-30 owner-base passes
          through this storefront; the firmware and belt-replacement
          parts ship from here.
        </li>
      </ul>

      <p>
        The CR-30 bench in the UK is genuinely thin past those two
        anchor points. Most CR-30 work in the UK happens in private
        garages and small studios that do not maintain a public site
        &mdash; the printer attracts the kind of maker who would
        rather print than write. If you are running a CR-30 in the UK
        and would like to be listed here next iteration, the studio
        keeps a private rolodex and updates this article as makers
        surface.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who run an iFactory3D belt printer
      </h2>

      <p>
        The iFactory3D One and One Pro are the German-engineered
        cousins of the CR-30, with a better-tuned belt tensioner and
        a more honest firmware story about build volume. Sold as a
        reseller-led product worldwide; the UK reseller bench is
        small and the user community is mostly continental.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>iFactory3D</strong> &mdash; the manufacturer
          itself, German-based, listed here because their{" "}
          <a
            href="https://ifactory3d.com/en/distributors/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            distributor map{arrow}
          </a>{" "}
          is the canonical source for UK reseller relationships and
          their{" "}
          <a
            href="https://ifactory3d.com/en/one-pro-3d-printer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            One Pro product page{arrow}
          </a>{" "}
          documents the machine the studio recommends for anyone
          starting fresh on a belt printer in 2026.
        </li>
      </ul>

      <p>
        The UK iFactory3D user community is, honestly, harder to find
        than the CR-30 one. The studio would welcome introductions to
        UK iFactory3D owners producing mail; this section will grow
        as those connections form.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who run a flat-bed FDM printer and tile
      </h2>

      <p>
        The largest cohort. A flat-bed FDM machine &mdash; Prusa,
        Bambu, Creality Ender, Voron self-builds &mdash; will print
        scale-mail and chainmail one tile at a time, joined manually
        after print. The geometry is the same; the workflow is more
        manual; the kit is cheaper and far more widely owned.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Digital Taxidermy</strong> &mdash; UK-based design
          studio specialising in print-in-place flexi articulated
          models. The team began experimenting with print-in-place
          moving parts and mechanisms and released their first major
          3D-printable design in January 2020; the catalogue now
          includes flexi-tortoise fidget toys, articulated snake
          designs, and a range of print-in-place models with tactile
          moving parts. Their designs are documented as targeting a
          0.4&nbsp;mm nozzle at 0.2&nbsp;mm layer height &mdash; the
          same calibration sweet spot the studio uses for mail. They
          are the most consistent UK voice on the print-in-place
          hinge-clearance problem the mail discipline shares.{" "}
          <a
            href="https://www.digitaltaxidermy.co.uk/3d-printable-stl-files/print-in-place-models.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            digitaltaxidermy.co.uk &mdash; print-in-place models{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.youtube.com/@digitaltaxidermy"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            YouTube{arrow}
          </a>
        </li>
        <li>
          <strong>Smoj Cosplay</strong> &mdash; a UK-based cosplay
          maker who documented the move from traditional metal
          chainmail to 3D-printed chainmail on cost grounds. The
          writeup at{" "}
          <a
            href="https://cosplay.tjc.me.uk/posts/3d-printing-chainmail/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cosplay.tjc.me.uk{arrow}
          </a>{" "}
          is one of the cleaner public UK accounts of taking a
          community chainmail STL through a flat-bed FDM workflow for
          a wearable costume piece &mdash; useful as a reality check
          on print times, weight, and how the finished material moves
          on a body.
        </li>
        <li>
          <strong>E3D-Online</strong> &mdash; Oxfordshire. Not a
          mail-printing studio in their own right, but the UK&rsquo;s
          most influential FDM-hardware company and a load-bearing
          name in the wider scene. Founded 2012 by Dave, Josh and the
          late{" "}
          <a
            href="https://3dprintingindustry.com/news/the-sanjay-mortimer-reprap-festival-returns-to-manchester-in-2026-248809/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sanjay Mortimer{arrow}
          </a>{" "}
          (whose name now graces an annual RepRap festival in
          Manchester), they ship the HotEnds and nozzles a great
          many UK flat-bed mail-printers run. Listed in this section
          because the hardware lineage matters; the Revo system, the
          ObXidian nozzle, the broader Prusa/Lulzbot/Creality
          ecosystem they enable are what make the flat-bed mail
          workflow tractable at all.{" "}
          <a
            href="https://e3d-online.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            e3d-online.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://e3d-online.com/pages/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            About{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who work with origami and compliant mechanisms
      </h2>

      <p>
        The origami end of the discipline has a deeper academic UK
        bench than the wearable-mail end, which is unusual and worth
        spelling out. Two universities &mdash; Bristol and Cambridge
        &mdash; carry serious origami-engineering research lines, and
        Oxford runs an origami-structures group within its Special
        Structures programme. The work is engineering more than craft,
        but the boundary is porous; the same crease-pattern maths that
        produces a deployable space-structure produces a foldable
        lampshade.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Drew Batchelor</strong> &mdash; Bristol. Design,
          engineering and making; formerly a senior lecturer in
          Product Design and Design Engineering and Associate Head of
          Department at UWE Bristol. Built his third experimental 3D
          printer in autumn 2022 specifically for printing fabric for
          3D-printed fashion and for printing origami &mdash; a
          scratch-built flatbed Cartesian machine, 640&nbsp;mm wide,
          480&nbsp;mm deep, 44&nbsp;mm tall. His 3D-printed origami
          experiments include compliant-mechanism work using
          mechanical furrows to control where the creases form, and
          patterns developed in Rhino Grasshopper based on curved
          folding origami originally by Jun Mitani. The closest the
          UK has to a working studio practice that combines custom-
          printer engineering with origami-pattern design.{" "}
          <a
            href="https://drewbatchelor.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            drewbatchelor.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://drewbatchelor.com/portfolio/3d-printing-origami-experiments/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3D printing origami experiments{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://drewbatchelor.com/portfolio/origami-3d-printer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Origami 3D printer build{arrow}
          </a>
        </li>
        <li>
          <strong>Dr Mark Schenk</strong> &mdash; Bristol. Associate
          Professor in Aerospace Engineering at the University of
          Bristol, within the Bristol Composites Institute. PhD in
          Structural Mechanics from Cambridge under Simon Guest;
          undergraduate and master&rsquo;s at Delft. His research is
          on engineering origami, folded shell structures and the
          mechanics of multi-stable patterns &mdash; the academic
          backbone behind anyone trying to print Miura folds or
          Kresling cylinders that hold their shape under load. The
          studio reads his papers when calibrating its own origami
          panel work.{" "}
          <a
            href="http://www.markschenk.com/research/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            markschenk.com/research{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://research-information.bris.ac.uk/en/persons/mark-schenk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bristol research portal{arrow}
          </a>
        </li>
        <li>
          <strong>Professor Simon Guest</strong> &mdash; Cambridge.
          Head of Civil Engineering and Professor of Structural
          Mechanics at Cambridge; the senior figure in UK origami
          engineering, with research straddling structural mechanics
          and the study of mechanisms. His pin-jointed-framework
          model of origami folding patterns is the load-bearing
          maths behind a generation of compliant-mechanism research
          (including Mark Schenk&rsquo;s). The papers are technical
          but the ideas filter down: if you have ever read a clean
          explanation of why a Miura tile folds rigidly, you have
          probably read his work without knowing.{" "}
          <a
            href="https://www-structures.eng.cam.ac.uk/directory/sdg13@cam.ac.uk"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge Structures Research Group profile{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www3.eng.cam.ac.uk/~sdg13/publications.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Publications{arrow}
          </a>
        </li>
        <li>
          <strong>Oxford Special Structures Group</strong> &mdash;
          Oxford. A research group within the Department of
          Engineering Science with a published origami-structures
          research line covering rigid origami and its application to
          deployable structures and devices. Less visible to the
          public than Bristol and Cambridge but worth knowing if your
          origami interest runs toward space-structure or
          medical-device deployment.{" "}
          <a
            href="https://eng.ox.ac.uk/specialstructuresgroup/research/origami-structures"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Oxford SSG &mdash; origami structures{arrow}
          </a>
        </li>
        <li>
          <strong>British Origami Society</strong> &mdash; a UK
          registered charity, hundreds of members worldwide,
          publishing a bi-monthly magazine (<em>British Origami</em>)
          and running biennial UK conventions. The non-engineering,
          craft-side anchor. Worth following for paper-fold pattern
          inspiration that scales down into printable crease patterns;
          the{" "}
          <a
            href="https://www.britishorigami.org/cp-resource/3d-origami/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3D origami resource page{arrow}
          </a>{" "}
          is a useful starting point.{" "}
          <a
            href="https://www.britishorigami.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            britishorigami.org{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.instagram.com/britishorigami/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Instagram{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest gaps
      </h2>

      <p>
        Two gaps in this who&rsquo;s-who that the studio could not
        close inside this pass and would rather flag than fill with
        guesswork:
      </p>

      <p>
        <em>UK-resident dragon-scale wearable practitioners with a
        public studio brand.</em> The Etsy and community-platform
        searches turn up active sellers on the UK market, but
        attribution is unreliable; many listings are international
        sellers shipping to the UK rather than UK-based studios. A
        future revision will name the verified UK-resident makers
        when the studio has confirmed locations from public sources.
      </p>

      <p>
        <em>UK-based iFactory3D One Pro owners producing mail.</em>{" "}
        The machine is sold in the UK through reseller relationships
        but the UK owner-community has very little public footprint.
        If you are one, the studio would like to hear from you; the
        section above will grow.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Closing
      </h2>

      <p>
        Mail and fabric printing in the UK is a thin discipline with
        a deep technical spine. A handful of belt-printer operators,
        a larger flat-bed cohort, three serious origami-engineering
        research groups, one charity that has kept the paper-fold
        craft alive since the 1960s. The community is small enough
        that knowing the names listed above puts you near every
        public node of it; the rest is private practice in workshops
        and university labs.
      </p>

      <p>
        If you read this and recognise a name that should be here
        and is not, the studio&rsquo;s door is the door. Send a URL,
        not a CV. Real people, real public links, no invention.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-who articles
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-pixel-artists"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK pixel artists
          </Link>
          . The screen-based sibling discipline; same workshop
          register, different output medium.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-fire-art-photographers"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK fire-art photographers
          </Link>
          . The night-and-flame sibling; the studio&rsquo;s home
          scene on the photography side.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-light-painters"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK light painters
          </Link>
          . The by-tool cousin to this article on the photography
          side of the studio.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Studio cross-references
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/material-layer-mail-printing"
            className={ext}
          >
            Material-Layer Mail Printing
          </Link>{" "}
          &mdash; the geometry primer behind the discipline this
          article maps.
        </li>
        <li>
          <Link
            href="/tutorials/tutorial-dragon-scale-wall-relief"
            className={ext}
          >
            Tutorial &mdash; Dragon-Scale Wall Relief
          </Link>{" "}
          &mdash; the hands-on workflow for the studio&rsquo;s
          signature pattern.
        </li>
        <li>
          <Link
            href="/articles/belt-printed-wall-reliefs"
            className={ext}
          >
            Belt-Printed Wall Reliefs
          </Link>{" "}
          &mdash; the architectural register and the economics.
        </li>
        <li>
          <Link href="/articles/the-bench" className={ext}>
            The Bench
          </Link>{" "}
          &mdash; the full studio stack the belt printer sits in.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / Further reading
      </h2>

      <p>
        Grouped by domain. Every external URL named in the prose
        above appears here for audit.
      </p>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        3dprintingleeds.co.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.3dprintingleeds.co.uk/continuous-belt-3d-printing/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Continuous belt 3D printing service page{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        3dprintingindustry.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://3dprintingindustry.com/news/the-sanjay-mortimer-reprap-festival-returns-to-manchester-in-2026-248809/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Sanjay Mortimer RepRap Festival returns to Manchester
            in 2026{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        britishorigami.org
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.britishorigami.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            British Origami Society &mdash; home{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.britishorigami.org/cp-resource/3d-origami/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3D origami resource{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        cam.ac.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www-structures.eng.cam.ac.uk/directory/sdg13@cam.ac.uk"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Professor Simon Guest &mdash; Structures Research Group{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www3.eng.cam.ac.uk/~sdg13/publications.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Simon Guest &mdash; publications{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        cosplay.tjc.me.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://cosplay.tjc.me.uk/posts/3d-printing-chainmail/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Smoj Cosplay &mdash; 3D printing chainmail (because
            I&rsquo;m cheap){arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        creality.com / crealityofficial.co.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.crealityofficial.co.uk/products/cr-30-3d-printer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CR-30 3D Printer &mdash; Creality UK official store{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        digitaltaxidermy.co.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.digitaltaxidermy.co.uk/3d-printable-stl-files/print-in-place-models.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Print-in-place models{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.youtube.com/@digitaltaxidermy"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Digital Taxidermy on YouTube{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        drewbatchelor.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://drewbatchelor.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Drew Batchelor &mdash; portfolio home{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://drewbatchelor.com/portfolio/3d-printing-origami-experiments/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3D printing origami experiments{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://drewbatchelor.com/portfolio/origami-3d-printer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Origami 3D printer build{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        e3d-online.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://e3d-online.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            E3D &mdash; home{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://e3d-online.com/pages/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            About E3D{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        facebook.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.facebook.com/groups/cr30/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CR-30 Facebook user group{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        ifactory3d.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://ifactory3d.com/en/one-pro-3d-printer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            iFactory3D One Pro product page{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://ifactory3d.com/en/distributors/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Distributors{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        instagram.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.instagram.com/britishorigami/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            British Origami Society on Instagram{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        markschenk.com
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="http://www.markschenk.com/research/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mark Schenk &mdash; research homepage{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        ox.ac.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://eng.ox.ac.uk/specialstructuresgroup/research/origami-structures"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Oxford Special Structures Group &mdash; origami
            structures{arrow}
          </a>
        </li>
      </ul>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-chrome-500">
        bris.ac.uk
      </p>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://research-information.bris.ac.uk/en/persons/mark-schenk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mark Schenk &mdash; Bristol research portal{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * Format: by-tool (per the CONTENT-MILL registry). Sections are the
 * machines and the disciplines, not the postcodes. Verified UK
 * practitioners and institutions only; honest gaps flagged for
 * future revision.
 */
export const entry: Entry = {
  slug: "whos-who-uk-mail-and-fabric-printing",
  title:
    "Who's Who — UK mail and fabric printing (scale-mail, chain-mail, dragon-mail, origami)",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A by-tool index of the UK practitioners working in material-layer mail printing — belt-printer operators, flat-bed FDM makers, and the academic origami-engineering research groups at Bristol, Cambridge and Oxford. Real people, public URLs, honest gaps flagged.",
  Body: WhosWhoUkMailAndFabricPrinting,
  related: [
    {
      href: "/articles/material-layer-mail-printing",
      label: "Article — Material-Layer Mail Printing",
      note: "The geometry primer behind the discipline this article maps.",
    },
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Tutorial — Dragon-Scale Wall Relief",
      note: "The hands-on workflow for the studio's signature pattern.",
    },
    {
      href: "/articles/belt-printed-wall-reliefs",
      label: "Belt-Printed Wall Reliefs",
      note: "The architectural register and the economics.",
    },
    {
      href: "/articles/whos-who-uk-pixel-artists",
      label: "Who's Who — UK pixel artists",
      note: "Sibling who's-who, screen-based register.",
    },
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire-art photographers",
      note: "Sibling who's-who, night-and-flame register.",
    },
    {
      href: "/articles/whos-who-uk-light-painters",
      label: "Who's Who — UK light painters",
      note: "Sibling who's-who, by-tool cousin on the photography side.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.3dprintingleeds.co.uk/continuous-belt-3d-printing/",
      label: "3D Printing Leeds — continuous belt 3D printing",
      note: "UK commercial service trading on belt-printer capability.",
    },
    {
      href: "https://www.digitaltaxidermy.co.uk/3d-printable-stl-files/print-in-place-models.html",
      label: "Digital Taxidermy — print-in-place models",
      note: "UK design studio specialising in print-in-place flexi articulated models.",
    },
    {
      href: "https://cosplay.tjc.me.uk/posts/3d-printing-chainmail/",
      label: "Smoj Cosplay — 3D printing chainmail",
      note: "UK cosplay-maker writeup of moving from metal to printed chainmail.",
    },
    {
      href: "https://drewbatchelor.com/",
      label: "Drew Batchelor",
      note: "Bristol-based designer; custom origami-printing flatbed and compliant-mechanism work.",
    },
    {
      href: "http://www.markschenk.com/research/",
      label: "Mark Schenk — research homepage",
      note: "Bristol Associate Professor; engineering-origami research.",
    },
    {
      href: "https://www-structures.eng.cam.ac.uk/directory/sdg13@cam.ac.uk",
      label: "Professor Simon Guest — Cambridge Structures Research Group",
      note: "Cambridge Head of Civil Engineering; senior figure in UK origami-engineering.",
    },
    {
      href: "https://eng.ox.ac.uk/specialstructuresgroup/research/origami-structures",
      label: "Oxford Special Structures Group — origami structures",
      note: "Oxford Department of Engineering Science origami research line.",
    },
    {
      href: "https://www.britishorigami.org/",
      label: "British Origami Society",
      note: "UK registered charity; the craft-side anchor of the discipline.",
    },
    {
      href: "https://e3d-online.com/",
      label: "E3D-Online",
      note: "Oxfordshire FDM hardware company; the load-bearing UK hot-end manufacturer.",
    },
    {
      href: "https://www.creality.com/products/creality-cr-30-3d-printer",
      label: "Creality CR-30 3DPrintMill",
      note: "The consumer belt printer the UK community formed around.",
    },
    {
      href: "https://ifactory3d.com/en/one-pro-3d-printer/",
      label: "iFactory3D One Pro",
      note: "The German-engineered belt printer.",
    },
  ],
};
