import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkGarmentWearableTechPeople() {
  return (
    <>
      <p>
        A wearable-tech designer is usually identified, fairly or not,
        by one piece. The dress that flew. The dress that lit up. The
        glove that controlled a synth. The garment that closed around
        the wearer when a stranger came too near. The body of work sits
        in the studio archive, the press cycle moves on, but the single
        signature object is what the public name attaches to. So this
        who&rsquo;s-who organises itself the honest way: each entry
        leads with the one piece, then walks back through the practice
        behind it.
      </p>

      <p>
        The UK end of this scene is small, technically deep, and
        unusually connected to two academic anchors &mdash; the Royal
        College of Art Fashion programme on one side, the University of
        the West of England&rsquo;s Creative Technologies group on the
        other &mdash; with a London-Bristol axis between them. The
        studios that come up here are the ones that publish, perform
        and ship. The list is short on purpose; padded lists in this
        field tend to fold within a year. Real people, public URLs, no
        invented mentors.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link
          href="/articles/jewellery-the-same-trace-wearable"
          className={ext}
        >
          Jewellery, the Same Trace Wearable
        </Link>{" "}
        on body-as-surface,{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          Aura the Body
        </Link>{" "}
        on body-as-narrator, and{" "}
        <Link
          href="/articles/vr-pov-controllers-the-product"
          className={ext}
        >
          VR POV Controllers
        </Link>{" "}
        on body-as-input.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The flying dress &mdash; Studio XO (London)
      </h2>

      <p>
        <strong>Benjamin Males and Nancy Tilbury</strong>, co-founders.
        The signature piece is <em>Volantis</em>, the flying dress worn
        by Lady Gaga at the ArtRave launch of <em>ARTPOP</em> in 2013
        &mdash; twelve electric rotors mounted on a titanium truss with
        a carbon-fibre bodice. Males is the mechanical engineer; Tilbury
        is a Royal College of Art Fashion graduate. The studio became
        the textbook example of fashion-meets-engineering done
        seriously rather than as a publicity stunt. Studio XO itself
        wound down in the late 2010s; the founders carried the practice
        forward in their own work.{" "}
        <a
          href="https://www.benjaminmales.com/lady-gaga-volantis"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          benjaminmales.com/lady-gaga-volantis{arrow}
        </a>{" "}
        &middot;{" "}
        <a
          href="https://www.dezeen.com/2014/04/14/movie-studio-xo-lady-gaga-flying-dress-volantis/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Dezeen film of Volantis{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Galaxy Dress &mdash; CuteCircuit (London)
      </h2>

      <p>
        <strong>Francesca Rosella and Ryan Genz</strong>, co-founders
        2004. The signature is the <em>Galaxy Dress</em>: 24,000
        full-colour LEDs sewn onto conductive nylon ribbon stitched
        through silk chiffon, held in the permanent collection of the
        Museum of Science and Industry in Chicago. Rosella came up
        through Valentino; Genz through Interaction Design and
        Anthropology. The London studio is among the longest-running
        wearable-tech labels in the world and probably the one that has
        normalised the LED-in-couture vocabulary the most. Their other
        widely shown piece is the K-Dress for Katy Perry&rsquo;s Met
        Gala appearance.{" "}
        <a
          href="https://cutecircuit.com/biography/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          cutecircuit.com{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The gloves that control sound &mdash; mi.mu / Imogen Heap (London + Bristol)
      </h2>

      <p>
        <strong>Imogen Heap, Tom Mitchell, Rachel Freire and team</strong>.
        Signature piece: the mi.mu Gloves. Sensors, IMU, posture and
        gesture recognition routed through software that maps movement
        to MIDI for live music. The concept began with Heap in 2010; Dr
        Tom Mitchell at the University of the West of England built the
        machine-learning backbone; textile designer Rachel Freire took
        the e-textile work forward. Released commercially in 2019. Used
        on stage by Ariana Grande, Kris Halpin and others.{" "}
        <a
          href="https://mimugloves.com/about/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mimugloves.com/about{arrow}
        </a>{" "}
        &middot;{" "}
        <a
          href="https://www.rachelfreire.com/about-full"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          rachelfreire.com{arrow}
        </a>{" "}
        &middot;{" "}
        <a
          href="https://people.uwe.ac.uk/Person/TomMitchell"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Tom Mitchell at UWE Bristol{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Spider Dress &mdash; Anouk Wipprecht (Netherlands, working
        with UK labs)
      </h2>

      <p>
        <strong>Anouk Wipprecht</strong> is Dutch rather than UK-based,
        but the work is so frequently shown in London and so often
        collaborates with British engineers and academics that excluding
        her would misrepresent the scene. The signature piece is the
        <em>Spider Dress</em>: 3D-printed exoskeleton with proximity
        sensors that drive eight articulated legs &mdash; the dress
        defends the wearer&rsquo;s personal space. Collaborators have
        included Intel, Autodesk, Materialise, Audi and Cirque du
        Soleil. Listed here for context; the UK reader will encounter
        her at every Wear It / WIRED event in London.{" "}
        <a
          href="http://www.anoukwipprecht.nl/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          anoukwipprecht.nl{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Living Couture Gown &mdash; Auroboros (London)
      </h2>

      <p>
        <strong>Paula Sello and Alissa Aulbekova</strong>, co-founders.
        Signature: the <em>Living</em> couture gown shown at the V&amp;A,
        worn by the AI artist robot Ai-Da &mdash; a dress that grows on
        the body through real-time crystallisation, then continues
        evolving in its digital twin. Auroboros are the brand that
        legibly broke the seal on digital-only collections at a major
        fashion week. The studio is grounded in biomimicry rather than
        in NFT-speculation, which is the distinction worth holding onto
        as the rest of the &ldquo;digital fashion&rdquo; scene churns
        through its hype cycles.{" "}
        <a
          href="https://www.dazeddigital.com/fashion/article/51913/1/auroboros-celestial-couture-alexander-mcqueen-vr-technology-digital-fashion"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Dazed feature on Auroboros{arrow}
        </a>{" "}
        &middot;{" "}
        <a
          href="https://www.dazeddigital.com/fashion/article/54208/1/auroboros-ss22-london-fashion-design-week-android-artist-v-and-a-digital-couture"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Auroboros at LFW SS22{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Garment-as-armour &mdash; Rachel Freire Studio (London)
      </h2>

      <p>
        <strong>Rachel Freire</strong> as a stand-alone studio rather
        than as the mi.mu textile lead. Signature: the conceptual
        collections launched at London Fashion Week from 2009, treating
        clothing as armour and the catwalk as a self-taught fashion
        degree in public; later, the <em>Embodisuit</em> research piece
        on wearable haptic feedback for emotional state. Trained in
        Design for Performance at Central Saint Martins, holds the 2020
        Worshipful Company of Glovers Golden Glove Award for Innovation.
        The studio sits at the joint between costume, garment technology
        and academic research; the dual track is the point.{" "}
        <a
          href="http://www.rachelfreire.com/about-full"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          rachelfreire.com/about{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Faraday suit on stage &mdash; ArcAttack (Wipprecht collab)
      </h2>

      <p>
        For completeness on the Wipprecht catalogue, the Faraday-suit
        chainmail garments worn on stage with ArcAttack&rsquo;s Tesla
        coils are Wipprecht builds &mdash; one of the cleaner examples
        of garment-as-electrical-engineering. Linked for the reader who
        wants to see the spec sheet.{" "}
        <a
          href="https://arcattack.com/about-us/crew/anouk-wipprecht/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          arcattack.com &mdash; Wipprecht profile{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The academic anchors
      </h2>

      <p>
        The two anchor institutions for UK wearable-tech research are
        the <strong>Royal College of Art</strong> Fashion programme in
        Kensington (which trained Tilbury and several Auroboros-adjacent
        designers) and the <strong>UWE Bristol</strong> Creative
        Technologies group (Tom Mitchell&rsquo;s home). The work that
        comes out of these two places is the bench from which most of
        the names above were drawn at one stage or another. Treat them
        as the scaffolding behind the signature pieces.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest gaps
      </h2>

      <p>
        The Manchester end of this scene is under-documented in public
        sources. The University of Manchester has serious materials-side
        e-textile research &mdash; the graphene-yarn work out of
        Professor Sir Kostya Novoselov&rsquo;s group, the embroidered
        NFC-antenna research &mdash; but the practitioner-facing
        designers in the North West are thin on the public web. Same
        for Glasgow and Edinburgh: the GSA Innovation School has
        wearable-tech students who graduate, but the studios they
        found often go quiet within a year or two. Names verifiable by
        URL would be welcome via the studio&rsquo;s contact page.
      </p>

      <p className="mt-6">
        The digital-fashion / NFT-couture end of the scene is also kept
        deliberately short here. Many of the labels that drew press
        between 2021 and 2023 have either pivoted, gone quiet, or
        folded; the studio&rsquo;s editorial position is that
        Auroboros earned the entry by sustaining a research practice
        beyond the speculative window, and that the rest of the names
        need to clear that bar before they make this list.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On signatures and the work behind them
      </h2>

      <p>
        Every entry above leads with one piece, and that is also the
        warning. A signature piece is a synecdoche; the work behind it
        is always larger, less photogenic, and more interesting. Studio
        XO did a hundred garments that were not Volantis. CuteCircuit
        publishes a new collection every quarter. mi.mu has shipped
        firmware revisions for half a decade past the launch the press
        covered. Auroboros now runs a ready-to-wear line that almost
        nobody who saw the V&amp;A gown remembers. The point of the
        index is to send the reader past the signature, into the
        studio.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-jewellery-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK jewellery makers
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
        <li>
          <Link
            href="/articles/whos-who-uk-pixel-artists"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK pixel artists
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
        Studio and designer sites
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://cutecircuit.com/biography/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cutecircuit.com &mdash; Rosella and Genz biography{arrow}
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
        <li>
          <a
            href="http://www.rachelfreire.com/about-full"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rachelfreire.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="http://www.anoukwipprecht.nl/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            anoukwipprecht.nl{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.benjaminmales.com/lady-gaga-volantis"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            benjaminmales.com &mdash; Volantis{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://people.uwe.ac.uk/Person/TomMitchell"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tom Mitchell, UWE Bristol{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://arcattack.com/about-us/crew/anouk-wipprecht/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arcattack.com &mdash; Wipprecht{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">Press</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.dezeen.com/2014/04/14/movie-studio-xo-lady-gaga-flying-dress-volantis/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            dezeen.com &mdash; Studio XO film{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.dazeddigital.com/fashion/article/51913/1/auroboros-celestial-couture-alexander-mcqueen-vr-technology-digital-fashion"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            dazeddigital.com &mdash; Auroboros couture{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.dazeddigital.com/fashion/article/54208/1/auroboros-ss22-london-fashion-design-week-android-artist-v-and-a-digital-couture"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            dazeddigital.com &mdash; Auroboros at LFW{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://wwd.com/feature/lady-gaga-studio-xo-fashion-tech-10446819/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wwd.com &mdash; Studio XO profile{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.fastcompany.com/3027258/geek-gets-chic-with-cutecircuits-high-tech-fashion"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            fastcompany.com &mdash; CuteCircuit{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.engadget.com/2019-04-26-mi-mu-imogen-heap-musical-gloves-price-launch-date.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            engadget.com &mdash; mi.mu launch{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">Reference</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/CuteCircuit"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; CuteCircuit{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Mi.Mu_Gloves"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; mi.mu Gloves{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.manchester.ac.uk/about/news/first-scalable-graphene-yarns-for-wearable-textiles-produced/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            manchester.ac.uk &mdash; graphene yarn for e-textiles{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK garment / wearable-tech designers in the
 * `signature-move` format from docs/CONTENT-MILL.md. Each entry leads
 * with the one piece the practitioner is best known for, then walks
 * back through the studio behind it. Real people, public URLs.
 */
export const entry: Entry = {
  slug: "whos-who-uk-garment-wearable-tech-people",
  title:
    "Who's Who — UK garment and wearable-tech designers, by signature piece",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Wearable-tech designers are usually known by one piece — the dress that flew, the dress that lit up, the glove that controlled a synth. A signature-move index of the UK scene: Studio XO, CuteCircuit, mi.mu, Auroboros, Rachel Freire, the RCA + UWE anchor labs.",
  Body: WhosWhoUkGarmentWearableTechPeople,
  related: [
    {
      href: "/articles/jewellery-the-same-trace-wearable",
      label: "Jewellery, the Same Trace Wearable",
      note: "Body-as-surface, the adjacent argument.",
    },
    {
      href: "/articles/aura-the-body",
      label: "Aura the Body",
      note: "Body-as-narrator. The studio's avatar piece.",
    },
    {
      href: "/articles/vr-pov-controllers-the-product",
      label: "VR POV Controllers",
      note: "Body-as-input. The hardware-of-the-self argument.",
    },
    {
      href: "/articles/whos-who-uk-jewellery-people",
      label: "Who's Who — UK jewellery makers",
      note: "Sibling craft, same body.",
    },
    {
      href: "/articles/whos-who-uk-3d-print-fabrication-people",
      label: "Who's Who — UK 3D print fabrication",
      note: "The fabrication layer behind wearable hardware.",
    },
    {
      href: "/articles/whos-who-uk-mail-and-fabric-printing",
      label: "Who's Who — UK mail and fabric printing",
      note: "Sibling index covering soft-side fabrication.",
    },
  ],
  furtherReading: [
    {
      href: "https://cutecircuit.com/",
      label: "CuteCircuit — London",
      note: "The longest-running UK wearable-tech house. Rosella + Genz.",
    },
    {
      href: "https://mimugloves.com/",
      label: "mi.mu Gloves",
      note: "Imogen Heap's gestural music gloves. UWE Bristol research backbone.",
    },
    {
      href: "https://www.rachelfreire.com/",
      label: "Rachel Freire Studio",
      note: "London e-textile and garment-tech studio. mi.mu textile lead.",
    },
    {
      href: "http://www.anoukwipprecht.nl/",
      label: "Anouk Wipprecht — FashionTech",
      note: "Dutch designer, frequent UK collaborator. Spider Dress, Faraday suits.",
    },
  ],
};
