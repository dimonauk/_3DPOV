import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

function Card({
  name,
  located,
  founded,
  technique,
  signature,
  url,
  urlLabel,
  extras,
  children,
}: {
  name: string;
  located: string;
  founded?: string;
  technique: string;
  signature: string;
  url: string;
  urlLabel: string;
  extras?: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 border border-chrome-700 bg-chrome-900/40 p-5">
      <div className="text-xl text-chrome-100">{name}</div>
      <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm text-chrome-300">
        <dt className="text-chrome-500">Located</dt>
        <dd>{located}</dd>
        {founded && (
          <>
            <dt className="text-chrome-500">Founded</dt>
            <dd>{founded}</dd>
          </>
        )}
        <dt className="text-chrome-500">Technique</dt>
        <dd>{technique}</dd>
        <dt className="text-chrome-500">Signature</dt>
        <dd>{signature}</dd>
        <dt className="text-chrome-500">URL</dt>
        <dd>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            {urlLabel}
            {arrow}
          </a>
          {extras &&
            extras.map((e) => (
              <span key={e.href}>
                {" "}
                &middot;{" "}
                <a
                  href={e.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ext}
                >
                  {e.label}
                  {arrow}
                </a>
              </span>
            ))}
        </dd>
      </dl>
      <div className="mt-4 text-chrome-200">{children}</div>
    </div>
  );
}

export default function WhosWhoUkPrintFabrication() {
  return (
    <>
      <p>
        The British 3D-printing service bureau is older than most
        people realise. The earliest of the bureaus in this index
        opened in 1971 as a rapid-prototyping house for engineers and
        only later added additive manufacturing; the most recent
        founded itself in 2014 to print things for designers. Between
        them sits a working ecosystem covering SLS, MJF, SLA, FDM,
        SAF, ceramic, sugar and chocolate &mdash; almost every
        printable substance the working artist or designer is likely
        to want to put through a machine.
      </p>

      <p>
        This who&rsquo;s-who is formatted as a set of index cards.
        Each card carries the firm name, location, founded date,
        printing technique, signature line of business, and URL.
        Underneath, a paragraph of context. Real people, real firms,
        every name verified by public URL. The studio&rsquo;s
        adjacent piece on the print pipeline itself sits at{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className={ext}
        >
          Nine Seconds &mdash; Prompt to Printable
        </Link>
        ; the printability question is the subject of{" "}
        <Link href="/articles/the-printability-oracle" className={ext}>
          The Printability Oracle
        </Link>
        . The mail-and-fabric end of fabrication sits in its own
        rolodex:{" "}
        <Link
          href="/articles/whos-who-uk-mail-and-fabric-printing"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK mail and fabric printing
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        London &mdash; the print-bureau row
      </h2>

      <Card
        name="3DPRINTUK"
        located="London"
        founded="2011"
        technique="MJF, SLS, SAF"
        signature="The UK's largest MJF / SLS / SAF production capacity; carbon-neutral, ISO 9001 + 14001 + JOSCAR-certified."
        url="https://www.3dprint-uk.co.uk/"
        urlLabel="3dprint-uk.co.uk"
        extras={[
          {
            href: "https://uk.linkedin.com/company/3dprintuk",
            label: "LinkedIn",
          },
          {
            href: "https://www.3dnatives.com/en/3d-printing-directory/3dprintuk/",
            label: "3Dnatives directory",
          },
        ]}
      >
        <p>
          Founded by a team of designers in 2011 and now the largest
          UK service for industrial powder-bed processes. The
          house-style is high-volume low-defect output on engineering
          parts &mdash; aerospace, defence, medical, marine, cycling
          &mdash; rather than one-off art prints, though the studio
          knows several sculptors who use them for editioned work.
          Prints over two million parts a year.
        </p>
      </Card>

      <Card
        name="3D People"
        located="Unit 10, Hackney Wick, London E3"
        technique="MJF, SLS"
        signature="On-demand industrial MJF and SLS at studio scale; the East-London bureau the design crowd uses by default."
        url="https://www.3dpeople.uk/"
        urlLabel="3dpeople.uk"
        extras={[
          {
            href: "https://www.3dpeople.uk/about-us/",
            label: "About",
          },
          {
            href: "https://uk.linkedin.com/company/3d-people-uk",
            label: "LinkedIn",
          },
        ]}
      >
        <p>
          The East-London end of the MJF/SLS bench. Smaller than
          3DPRINTUK, located inside the Hackney Wick creative cluster
          which means walk-in capacity for studios in the same
          postcodes. On-demand instant quotes, industrial-grade
          finish, the right bureau when the brief is one-to-fifty
          pieces of a designer&rsquo;s practice work rather than a
          factory run.
        </p>
      </Card>

      <Card
        name="Digits2Widgets"
        located="Camden, London"
        founded="2008"
        technique="SLS"
        signature="Design-centric SLS; one of the oldest London bureaus; founded by Andrew Dawood."
        url="https://www.digits2widgets.com/"
        urlLabel="digits2widgets.com"
        extras={[
          {
            href: "https://medium.com/@3dpbm/3dprintuk-vs-digits2widgets-a-visit-to-londons-premiere-3d-printing-services-126ae23ddca7",
            label: "3DPBM comparison",
          },
        ]}
      >
        <p>
          Founded 2008 by dentist and entrepreneur Andrew Dawood;
          recently moved to a larger studio in Camden. Takes a
          design-centric approach to SLS, which in practice means the
          house will sit with a generative-design or
          intricate-texture file and work out how to get it through
          the powder bed rather than reject it for printability. The
          right bureau for architectural-scale generative work that
          needs a human in the loop.
        </p>
      </Card>

      <Card
        name="iMakr Studio"
        located="79 Clerkenwell Road, London EC1R 5AR"
        founded="2013"
        technique="Multi-technology bureau (FDM, SLA, SLS, scanning)"
        signature="The central-London walk-in shop; print-on-demand, scanning, retail, classes."
        url="https://www.imakr.com/"
        urlLabel="imakr.com"
        extras={[
          {
            href: "https://www.imakrstudio.com/about",
            label: "Studio about",
          },
        ]}
      >
        <p>
          The central-London public face of 3D printing for almost a
          decade. Founded 2013, currently four offices worldwide, runs
          a 3D-scan-yourself service alongside print-on-demand and
          finishing. The Royal Mail&rsquo;s public 3D-printing
          service runs through iMakr from a Central London delivery
          office, which is the kind of detail that tells you this is
          the bureau the rest of the British infrastructure routes
          through when it doesn&rsquo;t want to commit to a vendor of
          its own.
        </p>
      </Card>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Midlands &mdash; the engineering anchor
      </h2>

      <Card
        name="Malcolm Nicholls Limited (MNL)"
        located="Midlands"
        founded="1971"
        technique="SLA (largest in the UK), SLS, FDM (ULTEM / PEEK), metal plating"
        signature="The oldest UK rapid-prototyping house; two of the largest SLA build platforms in the country (800 x 800 x 600mm); the first to ship superior-finish SLS nylon."
        url="https://mnl.co.uk/"
        urlLabel="mnl.co.uk"
        extras={[
          {
            href: "https://mnl.co.uk/3d-printing-services/sla/",
            label: "SLA",
          },
          {
            href: "https://mnl.co.uk/3d-printing-services/sls/",
            label: "SLS",
          },
        ]}
      >
        <p>
          Third-generation family business; rapid-prototyping since
          1971. The point about the SLA build platform is the one that
          matters &mdash; almost no other UK bureau can print an SLA
          part that large in a single pass. The model-making
          inheritance shows in the finishing department; this is the
          bureau the film props industry has historically used when
          the requirement is &ldquo;perfect-looking eight-hundred-
          millimetre object delivered to set on Friday&rdquo;.
        </p>
      </Card>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Peterborough &mdash; the ceramic and SLA centre of excellence
      </h2>

      <Card
        name="Photocentric"
        located="Peterborough"
        founded="circa 2008 (visible-light LCD printer, 2014)"
        technique="LCD vat polymerisation, ceramic SLA (CeraMet 1), photopolymer R&D"
        signature="Invented the LCD-screen-based visible-light 3D printer in 2014; built the UK's largest ceramic-SLA capability."
        url="https://photocentricgroup.com/"
        urlLabel="photocentricgroup.com"
        extras={[
          {
            href: "https://photocentricgroup.com/our-story/",
            label: "Our story",
          },
          {
            href: "https://photocentricgroup.com/research/",
            label: "Research",
          },
        ]}
      >
        <p>
          The most-funded and most-instrumented British photopolymer
          house. CeraMet 1 prints large ceramic parts (full-size
          casting cores included) at a scale and productivity nothing
          else in the UK currently matches. Photocentric&rsquo;s
          5,500-square-metre centre of excellence runs three
          print-farms: industrial parts, dental aligners, and
          ceramics. Worth tracking because most of the next decade of
          UK photopolymer innovation will run through this site.
        </p>
      </Card>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Exeter &mdash; the chocolate spinoff
      </h2>

      <Card
        name="Choc Edge"
        located="Exeter"
        founded="2012 (Choc Creator V1)"
        technique="Chocolate deposition; tempered viscosity-controlled extrusion"
        signature="The first commercial chocolate 3D printer; spun out of University of Exeter; founder Dr Liang Hao."
        url="https://chocedge.com/"
        urlLabel="chocedge.com"
        extras={[
          {
            href: "https://www.crunchbase.com/organization/choc-edge",
            label: "Crunchbase",
          },
          {
            href: "https://medium.com/forwardfooding/choc-edge-revolutionising-the-chocolate-experience-with-3d-printing-a4c5e2906a84",
            label: "Forward Fooding profile",
          },
        ]}
      >
        <p>
          Dr Liang Hao&rsquo;s spinout from Exeter. The technology
          started as a 2007 Master&rsquo;s project; the first machine
          shipped in 2012; EPSRC funded the early R&amp;D. Chocolate
          turned out to be the unexpectedly hard-to-print substance &mdash;
          viscosity and temperature have to be controlled within tight
          margins, layers go down at 0.05mm thickness. The
          studio&rsquo;s reason for naming it is that food-print is a
          coming category, and Choc Edge is the only UK bureau that
          has shipped product in it for over a decade.
        </p>
      </Card>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Independent ceramic 3D printing
      </h2>

      <Card
        name="Jonathan Keep"
        located="Suffolk"
        technique="DIY ceramic extrusion; CAD-to-clay slip pipeline"
        signature="The artist-potter who has documented his own ceramic 3D-printing journal in public for over a decade; the right reference point for the artist end of UK ceramic print."
        url="http://www.keep-art.co.uk/journal_1.html"
        urlLabel="keep-art.co.uk &mdash; journal"
      >
        <p>
          Studio potter who built his own ceramic printer, has been
          writing about it in public since the early 2010s, and gives
          away enough of the pipeline (CAD-to-slip, extrusion
          calibration, firing schedules) that an entire generation of
          ceramic-print artists has come up reading him. The kind of
          public-knowledge contribution that an index article should
          name explicitly.
        </p>
      </Card>

      <Card
        name="3D Alchemy"
        located="Liverpool"
        technique="Ceramic SLA (Zirconia, Alumina)"
        signature="UK service bureau for fine-resolution technical-ceramic SLA &mdash; the engineering-ceramic end rather than the studio-pottery end."
        url="https://www.3d-alchemy.co.uk/3d-printing-in-ceramic.html"
        urlLabel="3d-alchemy.co.uk &mdash; ceramic"
      >
        <p>
          Where the British engineer takes a zirconia or alumina file
          when the part has to be both heat-resistant and
          dimensionally fine. Smaller-profile than Photocentric but
          publicly listed and currently active.
        </p>
      </Card>

      <Card
        name="3D Matters"
        located="UK"
        technique="Ceramic, metal and polymer 3D printing services"
        signature="Cross-substance bureau, named in third-party UK ceramic-print listings as a current vendor."
        url="https://3dmatters.co.uk/"
        urlLabel="3dmatters.co.uk"
      >
        <p>
          The bureau the studio sends ceramic-and-metal mixed-substance
          briefs to when a single workflow is preferable to two
          parallel ones. Publicly listed; running.
        </p>
      </Card>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pop-up and event &mdash; food-print
      </h2>

      <Card
        name="Food Ink"
        located="London (pop-up, 2016) and travelling since"
        technique="Multi-substrate food extrusion; collaboration model with chefs"
        signature="The first 3D-printed restaurant in the world; a London pop-up serving nine courses entirely printed."
        url="https://foodink.io/"
        urlLabel="foodink.io"
      >
        <p>
          Worth naming because the historical first was British and
          almost no other entity has shipped a printed-food consumer
          experience since at any meaningful scale. The current model
          is event-and-collaboration rather than a fixed restaurant.
        </p>
      </Card>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Cards the studio would write if the URLs resolved
      </h2>

      <p>
        Several names in the brief did not resolve to current public
        URLs in the research window and have been deliberately left
        off rather than fudged. The Crafty Robot has shifted product
        and the public-facing site no longer reads as a
        production-bureau page; Iris van Herpen&rsquo;s UK
        fabricators publish under the designer&rsquo;s own brand and
        not as a separately-bookable bureau. Cycraft 3D Printing in
        Stoke turned up in adjacent search but did not resolve to a
        verifiable public site at the time of writing; the studio&rsquo;s
        position is to flag the gap rather than guess.
      </p>

      <p>
        The metal-print bureau bench (Renishaw, GKN, the AMRC up in
        Sheffield) is real and important and deserves its own
        rolodex; this article is the art-and-design slice rather than
        the engineering slice, and crossing the line would dilute
        both. The Sheffield AMRC, Manchester Metal Print and the BAE
        / Rolls-Royce bench are flagged here for a future revision.
        Reader corrections welcome via the contact page.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On craft and on the shape of the field
      </h2>

      <p>
        Britain has a working print bureau bench across almost every
        substance. The interesting pattern is the seniority &mdash;
        MNL has been at it since 1971, Digits2Widgets since 2008,
        Photocentric since around the same time, 3DPRINTUK since
        2011, 3D People and iMakr from the mid-2010s. The newer
        substances (ceramic, chocolate, food) have specialist bureaus
        rather than line items inside the generalists. The studio
        reads this as a healthy ecosystem: the generalists do volume,
        the specialists do depth, and the right brief reaches the
        right machine without going through a long-haul vendor.
      </p>

      <p>
        Cards get added when public URLs can carry the credit and
        removed when the URLs go dark. The honest gap list for the
        next revision: Sheffield AMRC and the metal-print bench;
        food-print beyond Choc Edge and Food Ink; the Manchester /
        Glasgow service bureaus; the academic-bureau cross-over
        (CFPM Sheffield, Loughborough). Reader corrections welcome.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-mail-and-fabric-printing"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK mail and fabric printing
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-3d-mesh-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK 3D-mesh / photogrammetry artists
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-splat-360-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK Gaussian-splat &amp; 360 capture
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-drone-people" className={ext}>
            Who&rsquo;s Who &mdash; UK drone people
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
        Bureau sites
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.3dprint-uk.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dprint-uk.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.3dpeople.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dpeople.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.digits2widgets.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            digits2widgets.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imakr.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imakr.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://mnl.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mnl.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://photocentricgroup.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            photocentricgroup.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://chocedge.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chocedge.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="http://www.keep-art.co.uk/journal_1.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            keep-art.co.uk &mdash; ceramic journal{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.3d-alchemy.co.uk/3d-printing-in-ceramic.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3d-alchemy.co.uk &mdash; ceramic{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://3dmatters.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3dmatters.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://foodink.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            foodink.io{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Press and reference
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://medium.com/@3dpbm/3dprintuk-vs-digits2widgets-a-visit-to-londons-premiere-3d-printing-services-126ae23ddca7"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3DPBM &mdash; 3DPRINTUK vs Digits2Widgets London visit{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.peterboroughtoday.co.uk/news/people/photocentric-in-peterborough-is-using-3d-printing-to-transform-the-future-of-mass-manufacturing-4014559"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Peterborough Today &mdash; Photocentric mass manufacturing{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://engineeringmagazine.co.uk/ncam-to-upgrade-ceramic-am-capability/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Engineering Magazine &mdash; NCAM ceramic AM upgrade{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.confectionerynews.com/Article/2014/07/07/3D-chocolate-printing-to-go-industrial-Choc-Edge/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            confectionerynews.com &mdash; Choc Edge industrial roadmap{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://medium.com/forwardfooding/choc-edge-revolutionising-the-chocolate-experience-with-3d-printing-a4c5e2906a84"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Forward Fooding &mdash; Choc Edge profile{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.tctmagazine.com/additive-manufacturing-3d-printing-news/royal-mail-delivers-3d-printing-service-with-imakr/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            TCT Magazine &mdash; Royal Mail / iMakr partnership{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imakr.com/uk/content/161-royal-mail-3d-printing-service-at-imakr"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imakr.com &mdash; Royal Mail service page{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.commissionit.co.uk/ceramic-3d-printing-in-the-uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            commissionit.co.uk &mdash; UK ceramic 3D printing overview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://3dprintingindustry.com/news/expanding-3d-printing-services-uk-continues-3d-printman-34196"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3D Printing Industry &mdash; UK services overview{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK 3D-print fabrication houses in the `index-cards`
 * format from docs/CONTENT-MILL.md. Each card carries: name,
 * location, founded date, technique, signature, URL. Substances
 * covered: SLS, MJF, SLA, FDM, SAF, ceramic SLA, chocolate, food.
 *
 * Cards: 3DPRINTUK, 3D People, Digits2Widgets, iMakr Studio, MNL,
 * Photocentric, Choc Edge, Jonathan Keep, 3D Alchemy, 3D Matters,
 * Food Ink. Eleven cards in total.
 *
 * Crafty Robot, Iris van Herpen UK fabricators, and Cycraft Stoke
 * were brief candidates but did not resolve to verifiable public
 * URLs at the time of writing and are flagged in prose rather than
 * padded. The metal-print bureau bench (Sheffield AMRC, Renishaw,
 * GKN) is held back for a separate engineering-slice article.
 *
 * All entries verified via public URLs (2026-05-19).
 */
export const entry: Entry = {
  slug: "whos-who-uk-3d-print-fabrication-people",
  title:
    "Who's Who — UK 3D-print fabrication houses, index cards",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "An index-card rolodex of the UK 3D-print fabrication ecosystem — SLS, MJF, SLA, FDM, SAF, ceramic and even chocolate. From MNL (Midlands, 1971) and Digits2Widgets (Camden, 2008) through 3DPRINTUK, 3D People and Photocentric's ceramic-SLA centre of excellence in Peterborough.",
  Body: WhosWhoUkPrintFabrication,
  related: [
    {
      href: "/articles/whos-who-uk-mail-and-fabric-printing",
      label: "Who's Who — UK mail and fabric printing",
      note: "Sibling rolodex; the soft-substrate side of fabrication.",
    },
    {
      href: "/articles/whos-who-uk-3d-mesh-people",
      label: "Who's Who — UK 3D-mesh / photogrammetry artists",
      note: "Where the meshes are made before they reach a printer.",
    },
    {
      href: "/articles/the-printability-oracle",
      label: "The Printability Oracle",
      note: "The studio's working position on what makes a file printable.",
    },
    {
      href: "/articles/nine-seconds-prompt-to-printable",
      label: "Nine Seconds — Prompt to Printable",
      note: "The generative-to-print pipeline these bureaus sit at the end of.",
    },
    {
      href: "/articles/material-layer-mail-printing",
      label: "Material Layer — Mail Printing",
      note: "Adjacent material-handling discipline.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.3dprint-uk.co.uk/",
      label: "3DPRINTUK",
      note: "The largest UK MJF / SLS / SAF capacity; carbon-neutral certified.",
    },
    {
      href: "https://mnl.co.uk/",
      label: "Malcolm Nicholls Limited",
      note: "Rapid-prototyping since 1971; two of the largest SLA platforms in the UK.",
    },
    {
      href: "https://photocentricgroup.com/",
      label: "Photocentric — Peterborough",
      note: "Invented LCD vat polymerisation; the UK's ceramic-SLA anchor.",
    },
    {
      href: "https://www.3dpeople.uk/",
      label: "3D People — Hackney Wick",
      note: "The East-London bureau the design crowd uses by default.",
    },
    {
      href: "https://www.digits2widgets.com/",
      label: "Digits2Widgets — Camden",
      note: "Design-centric SLS since 2008.",
    },
    {
      href: "https://chocedge.com/",
      label: "Choc Edge — Exeter",
      note: "The first commercial chocolate 3D printer; Dr Liang Hao's Exeter spinout.",
    },
    {
      href: "http://www.keep-art.co.uk/journal_1.html",
      label: "Jonathan Keep — ceramic printing journal",
      note: "The artist-potter whose public journal taught a generation.",
    },
  ],
};
