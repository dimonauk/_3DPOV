import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

const card =
  "mt-6 border border-chrome-700/60 bg-chrome-900/30 p-5 text-chrome-200";
const cardTitle = "text-xl text-chrome-100";
const cardMeta = "mt-1 text-xs uppercase tracking-wider text-chrome-400";
const cardLine = "mt-3";

export default function WhosWhoUkJewelleryPeople() {
  return (
    <>
      <p>
        Contemporary UK jewellery is a craft of small workshops and
        index cards. The bench is sized for two; the order book is kept
        on a card; the recipe for a particular alloy or patina is on
        another card, in pencil, taped to the wall above the rolling
        mill. So this who&rsquo;s-who borrows the format. Each entry is
        an index card &mdash; maker, workshop, signature material,
        signature line of work, and the URL where the public can buy or
        commission.
      </p>

      <p>
        The London end is anchored by three places that operate like
        institutions: Hatton Garden as the trade district,{" "}
        <a
          href="https://www.goldsmiths-centre.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          The Goldsmiths&rsquo; Centre{arrow}
        </a>{" "}
        in Clerkenwell as the educational + workshop hub (130-plus
        makers and businesses in residence at any given moment), and
        the Worshipful Company of Goldsmiths as the trade governance.
        Most contemporary jewellers in the cards below pass through
        all three at one point or another.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link
          href="/articles/jewellery-the-same-trace-wearable"
          className={ext}
        >
          Jewellery, the Same Trace Wearable
        </Link>{" "}
        on the studio&rsquo;s own jewellery practice;{" "}
        <Link
          href="/articles/the-jewellery-algorithms"
          className={ext}
        >
          The Jewellery Algorithms
        </Link>{" "}
        on the parametric / generative side;{" "}
        <Link
          href="/articles/why-the-pendant-glows-from-the-inside"
          className={ext}
        >
          Why the Pendant Glows from the Inside
        </Link>{" "}
        on internal-light wearables.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The cards &mdash; sculptural and statement
      </h2>

      <div className={card}>
        <div className={cardTitle}>Shaun Leane</div>
        <div className={cardMeta}>
          London &middot; Hatton Garden origins &middot; trad-trained
        </div>
        <p className={cardLine}>
          Started age sixteen in Hatton Garden at English Traditional
          Jewellery; later defined an entire register of body-ornament
          through his long collaboration with Alexander McQueen
          (1992-2010): the coiled-metal corset, the body halo, the
          mouthpiece. Four-time UK Jewellery Designer of the Year. The
          line that runs through his work is &ldquo;technical perfection
          meeting body sculpture.&rdquo;
        </p>
        <p className={cardLine}>
          <a
            href="https://shaunleane.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            shaunleane.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.vam.ac.uk/articles/mcqueens-collaborators-shaun-leane"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            V&amp;A on Leane and McQueen{arrow}
          </a>
        </p>
      </div>

      <div className={card}>
        <div className={cardTitle}>Stephen Webster</div>
        <div className={cardMeta}>
          Mayfair workshop &middot; Burlington Arcade flagship &middot;
          house founded 1989
        </div>
        <p className={cardLine}>
          The Mount Street / Burlington Arcade pillar of contemporary
          British fine jewellery. Mayfair-based design and workshop;
          the signature line of work is provocative coloured-stone
          settings &mdash; opal and black sapphire framed by ethical
          gold, the &ldquo;Crystal Haze&rdquo; technique of stacking
          quartz over coloured stone. Webster also chairs the brand&rsquo;s
          homeware extension.
        </p>
        <p className={cardLine}>
          <a
            href="https://www.stephenwebster.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            stephenwebster.com{arrow}
          </a>
        </p>
      </div>

      <div className={card}>
        <div className={cardTitle}>Solange Azagury-Partridge</div>
        <div className={cardMeta}>
          London &middot; pieces in V&amp;A + Les Arts D&eacute;coratifs
        </div>
        <p className={cardLine}>
          One of the few contemporary British jewellers whose pieces
          sit in the permanent collections of both the V&amp;A
          (London) and Les Arts D&eacute;coratifs at the Louvre. The
          signature line is colour-as-narrative: enamels, paintwork
          and saturated stones used as if the piece were a small
          painting. Sister brand <em>Hotlips by Solange</em> is the
          high-street-friendly counterpart.
        </p>
        <p className={cardLine}>
          <a
            href="https://solange.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            solange.co.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://hotlipsbysolange.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hotlipsbysolange.co.uk{arrow}
          </a>
        </p>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The cards &mdash; bench engraving and signet
      </h2>

      <div className={card}>
        <div className={cardTitle}>Castro Smith</div>
        <div className={cardMeta}>
          London &middot; hand-engraver, goldsmith &middot; signet
          specialist
        </div>
        <p className={cardLine}>
          Award-winning London goldsmith whose signature is
          reverse-engraving signet rings by hand using ancient
          seal-engraving techniques &mdash; the figure cut into the
          metal in negative, then often coloured with patinas or
          contrast inlay. Pieces in the collection of the Museum of
          Arts and Design (New York) and stocked at Maxfield and
          TWIST.
        </p>
        <p className={cardLine}>
          <a
            href="https://castrosmith.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            castrosmith.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://madmuseum.org/jewelry/artist/castro-smith"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Museum of Arts and Design{arrow}
          </a>
        </p>
      </div>

      <div className={card}>
        <div className={cardTitle}>Hannah Martin</div>
        <div className={cardMeta}>
          Clerkenwell showroom &middot; Central Saint Martins +
          Cartier-trained &middot; founded 2006
        </div>
        <p className={cardLine}>
          Sculptural, gender-fluid fine jewellery handcrafted in
          London. Signature lines: <em>Vincent</em>,{" "}
          <em>Somebody&rsquo;s Sins</em>, <em>Aguila Dorada</em>,{" "}
          <em>It&rsquo;s Only Rock n Roll</em>. The studio reads the
          body as androgynous and the metalwork as architecture.
          Sister practice <em>Hannah Martin Pierced</em> handles body
          piercing.
        </p>
        <p className={cardLine}>
          <a
            href="https://www.hannahmartinlondon.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hannahmartinlondon.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://hannahmartinpierced.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hannahmartinpierced.com{arrow}
          </a>
        </p>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The cards &mdash; cast and lost-wax narrative
      </h2>

      <div className={card}>
        <div className={cardTitle}>Rosh Mahtani &mdash; Alighieri</div>
        <div className={cardMeta}>
          Hatton Garden &middot; founded 2014 &middot; recycled metals
        </div>
        <p className={cardLine}>
          Demi-fine talismans cast from wax sculptures by the founder.
          The brief: every piece is a fragment of Dante&rsquo;s{" "}
          <em>Divine Comedy</em>, which Mahtani studied at Oxford.
          Produced in Hatton Garden in 100% recycled bronze, silver
          and gold; the studio&rsquo;s position is heirloom-pricing
          rather than luxury-pricing. Won the British Fashion Council
          Fashion Awards 2019 Independent British Brand.
        </p>
        <p className={cardLine}>
          <a
            href="https://www.alighieri.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            alighieri.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://londonfashionweek.co.uk/designers/alighieri"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LFW designer page{arrow}
          </a>
        </p>
      </div>

      <div className={card}>
        <div className={cardTitle}>Imogen Belfield</div>
        <div className={cardMeta}>
          London &middot; Sir John Cass-trained &middot; interned with
          Shaun Leane
        </div>
        <p className={cardLine}>
          Sculptural one-off &ldquo;rockesque&rdquo; rings and golden
          nugget pendants set with precious stones, in a textural
          register that pulls from nature, architecture and science.
          Made by hand in the UK. Interned with Shaun Leane during
          McQueen / Daphne Guinness catwalk projects &mdash; the
          lineage shows in the silhouettes.
        </p>
        <p className={cardLine}>
          <a
            href="https://imogenbelfield.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imogenbelfield.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.goldsmiths-centre.org/community/our-craftspeople/imogen-belfield/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            at the Goldsmiths&rsquo; Centre{arrow}
          </a>
        </p>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The cards &mdash; institutional anchors
      </h2>

      <div className={card}>
        <div className={cardTitle}>The Goldsmiths&rsquo; Centre</div>
        <div className={cardMeta}>
          42 Britton Street, Clerkenwell &middot; founded 2007 &middot;
          a Goldsmiths&rsquo; Company project
        </div>
        <p className={cardLine}>
          The UK&rsquo;s leading educational charity for jewellers and
          silversmiths. Fully-equipped jewellery and silversmithing
          workshops + design studios to rent, a 130-plus maker
          community, courses, technical training, business support and
          funding. Built into a restored Victorian school + modern
          workshop block. If a contemporary UK jeweller is not in
          their own private workshop, this is statistically the next
          most likely address.
        </p>
        <p className={cardLine}>
          <a
            href="https://www.goldsmiths-centre.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            goldsmiths-centre.org{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.goldsmiths-centre.org/community/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            community page{arrow}
          </a>
        </p>
      </div>

      <div className={card}>
        <div className={cardTitle}>Hatton Garden (the district)</div>
        <div className={cardMeta}>
          EC1N &middot; London&rsquo;s jewellery district since the
          19th century &middot; trade rather than retail-first
        </div>
        <p className={cardLine}>
          The street where most British jewellers either trained,
          source from, or share a building with their casters and
          setters. Not a card for a single maker, but the index for
          everyone above. Several of the contemporary bench-jewellers
          listed in the Goldsmiths&rsquo; Centre community walk five
          minutes between the two.
        </p>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest gaps
      </h2>

      <p>
        This is a contemporary-and-public-facing index. The art-jewellery
        end &mdash; one-off conceptual pieces shown at the Crafts
        Council, the studio jewellers operating through annual fairs
        rather than direct sale &mdash; is real, deep, and largely
        absent from a public-URL discipline. Some of those names
        live on the Goldsmiths&rsquo; Centre community page rather
        than on their own sites; for now, the Centre&rsquo;s directory
        is the studio&rsquo;s referral.
      </p>

      <p className="mt-6">
        Scottish silversmithing has its own lineage that this index
        does not cover (the GSA Silversmithing &amp; Jewellery
        programme in Glasgow has a distinct house style). A future
        revision will add a Scotland section once the studio can
        verify a handful of practitioner sites per name. Reader
        corrections welcome via the contact page; the studio&rsquo;s
        editorial position is to leave a section short rather than
        pad it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On bench tradition and the new tools
      </h2>

      <p>
        The studio&rsquo;s position on the contemporary UK bench is
        that the new tools &mdash; CAD, lost-PLA casting from FDM
        masters, in-house Form 3 / Asiga prints into investment
        &mdash; have not replaced the lineage; they have rearranged
        which parts of the workflow the apprenticeship has to cover.
        The makers in this index ship work that looks like contemporary
        UK jewellery because it is held to the bench standard set by
        Hatton Garden and the Goldsmiths&rsquo; Company a long time
        before any of them logged into Rhino. The cross-reference for
        the parametric / generative side sits in{" "}
        <Link href="/articles/the-jewellery-algorithms" className={ext}>
          The Jewellery Algorithms
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-garment-wearable-tech-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK garment and wearable-tech
            designers
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-3d-print-fabrication-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK 3D print fabrication
          </Link>
        </li>
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
        Every external URL touched in research, grouped by domain.
      </p>

      <h3 className="mt-6 text-lg text-chrome-100">Designer sites</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://shaunleane.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            shaunleane.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.stephenwebster.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            stephenwebster.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://solange.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            solange.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://castrosmith.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            castrosmith.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.hannahmartinlondon.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hannahmartinlondon.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.alighieri.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            alighieri.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://imogenbelfield.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            imogenbelfield.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://hotlipsbysolange.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hotlipsbysolange.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://hannahmartinpierced.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hannahmartinpierced.com{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Institutional anchors
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.goldsmiths-centre.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            goldsmiths-centre.org{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.goldsmiths-centre.org/community/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            goldsmiths-centre.org/community{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.vam.ac.uk/articles/mcqueens-collaborators-shaun-leane"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vam.ac.uk &mdash; McQueen + Leane{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://madmuseum.org/jewelry/artist/castro-smith"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            madmuseum.org &mdash; Castro Smith{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://londonfashionweek.co.uk/designers/alighieri"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            londonfashionweek.co.uk &mdash; Alighieri{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">Reference</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Shaun_Leane_(jeweller)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Shaun Leane{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Solange_Azagury-Partridge"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Solange Azagury-Partridge{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK contemporary jewellers in the `index-cards` format
 * from docs/CONTENT-MILL.md. Each entry styled as a tactile library /
 * recipe card: maker, workshop, signature material + line of work,
 * URL. Real people, public URLs.
 */
export const entry: Entry = {
  slug: "whos-who-uk-jewellery-people",
  title: "Who's Who — UK contemporary jewellers, on index cards",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Contemporary UK jewellery is a craft of small workshops and index cards. A who's-who of the London bench scene — Shaun Leane, Stephen Webster, Solange Azagury-Partridge, Castro Smith, Hannah Martin, Rosh Mahtani, Imogen Belfield — anchored by Hatton Garden and the Goldsmiths' Centre.",
  Body: WhosWhoUkJewelleryPeople,
  related: [
    {
      href: "/articles/jewellery-the-same-trace-wearable",
      label: "Jewellery, the Same Trace Wearable",
      note: "The studio's own jewellery position.",
    },
    {
      href: "/articles/the-jewellery-algorithms",
      label: "The Jewellery Algorithms",
      note: "Parametric and generative side of the practice.",
    },
    {
      href: "/articles/why-the-pendant-glows-from-the-inside",
      label: "Why the Pendant Glows from the Inside",
      note: "Internal-light wearable jewellery.",
    },
    {
      href: "/articles/whos-who-uk-garment-wearable-tech-people",
      label: "Who's Who — UK garment + wearable-tech",
      note: "Sibling index.",
    },
    {
      href: "/articles/whos-who-uk-3d-print-fabrication-people",
      label: "Who's Who — UK 3D print fabrication",
      note: "Lost-PLA and resin masters for casting.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.goldsmiths-centre.org/",
      label: "The Goldsmiths' Centre",
      note: "Clerkenwell. The UK educational + workshop hub for jewellers and silversmiths.",
    },
    {
      href: "https://shaunleane.com/pages/visionary",
      label: "Shaun Leane Visionary Collection",
      note: "The McQueen-era body-ornament work that defined a register.",
    },
    {
      href: "https://www.vam.ac.uk/articles/mcqueens-collaborators-shaun-leane",
      label: "V&A on McQueen and Leane",
      note: "Institutional reading on the partnership.",
    },
  ],
};
