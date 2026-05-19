import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkGooglePeople() {
  return (
    <>
      <p>
        The princess wants you to walk. Google in the United Kingdom is
        not a logo and not a feeling; it is a set of buildings,
        clustered tightly around one Underground station, with named
        people inside doing named work. The trick of writing about
        Google is to treat it as a place &mdash; the way you would
        treat a university campus or a market town &mdash; and to name
        the residents one stop at a time. The corporate brochure
        register is forbidden. The map is the only thing on offer.
      </p>

      <p>
        Same rule as the sibling lists: no entry without a public URL.
        No invented credits. No implied mentorships. If a researcher
        does not publish under their own name &mdash; their academic
        page, their Scholar profile, their personal site, a GitHub
        avatar &mdash; the studio cannot verify them, and so cannot
        list them. The walk that follows is the walk that survived
        that test.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop one &mdash; King&rsquo;s Cross, the S1 / S2 pair
      </h2>

      <p>
        Begin at King&rsquo;s Boulevard, with the canal behind you and
        the station to your right. The two glass-and-timber buildings
        called S1 and S2 on Handyside Street are Google&rsquo;s first
        UK home. The new long building &mdash; the Heatherwick + BIG
        commission, eleven storeys, three hundred metres of timber and
        terraces &mdash; is{" "}
        <a
          href="https://www.kingscross.co.uk/google"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          KGX1{arrow}
        </a>{" "}
        next door. The point of the cluster is that one Tube stop holds
        Google UK&rsquo;s engineering, product, design and DeepMind
        research staff inside a five-minute walk.
      </p>

      <p>
        The most senior UK Googler the press has named over the last
        decade is{" "}
        <a
          href="https://uk.linkedin.com/in/matt-brittin-5aa6391"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Matt Brittin{arrow}
        </a>
        , who ran EMEA business and operations from this site until
        early 2025 and who, in May 2026, was announced as the next BBC
        Director-General. His successor at the head of Google EMEA is{" "}
        <a
          href="https://blog.google/around-the-globe/google-europe/united-kingdom/britain-tech-future/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Debbie Weinstein{arrow}
        </a>
        , previously Managing Director of Google UK &amp; Ireland and
        now President for Europe, Middle East and Africa.
      </p>

      <p>
        On the Chrome side of the building you can find{" "}
        <a
          href="https://samdutton.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Sam Dutton{arrow}
        </a>
        , a long-serving Developer Advocate for Chrome who has lived
        in London since 1986 and who maintains{" "}
        <a
          href="https://github.com/samdutton"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/samdutton{arrow}
        </a>{" "}
        plus the WebRTC sample library at simpl.info. His byline
        appears across web.dev and developer.chrome.com. Standing
        beside him in the same developer-relations orbit is{" "}
        <a
          href="https://addyosmani.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Addy Osmani{arrow}
        </a>
        , who spent the better part of fourteen years on Chrome (Core
        Web Vitals, Lighthouse, DevTools) before stepping over to
        Google Cloud AI as a director, and who still publishes books
        and essays under his own name.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop two &mdash; Pancras Square (DeepMind&rsquo;s house)
      </h2>

      <p>
        Walk south one block. The DeepMind office at{" "}
        <a
          href="https://www.kingscross.co.uk/s2-handyside"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          S2 Handyside{arrow}
        </a>{" "}
        and the registered address at 6 Pancras Square are where the
        research staff actually sit. DeepMind keeps a steady public
        publication record at{" "}
        <a
          href="https://deepmind.google/research/publications/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          deepmind.google/research/publications{arrow}
        </a>
        , which is the right starting point if you want to know who is
        doing what. Most of the names below also keep a personal page
        outside the corporate site &mdash; the studio&rsquo;s rule for
        inclusion.
      </p>

      <p>
        <a
          href="https://scholar.google.com/citations?user=Q0YEc-QAAAAJ&hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Raia Hadsell{arrow}
        </a>{" "}
        is VP of Research and runs DeepMind&rsquo;s Frontier AI unit;
        her homepage at{" "}
        <a
          href="https://raiahadsell.com/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          raiahadsell.com{arrow}
        </a>{" "}
        carries her thesis, talks and a clean reading list. She
        founded TMLR as an open-access alternative to NeurIPS-cycle
        publishing.{" "}
        <a
          href="https://research.google/people/oriolvinyals/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Oriol Vinyals{arrow}
        </a>{" "}
        is VP of Research and a tech lead on Gemini; he is one of the
        co-authors of the original seq2seq paper and the AlphaStar
        lead.
      </p>

      <p>
        <a
          href="https://www.iasongabriel.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Iason Gabriel{arrow}
        </a>{" "}
        is a Senior Staff Research Scientist who teaches moral and
        political philosophy at Oxford and runs the AGI &amp; Society
        team. His paper on AI value alignment is on{" "}
        <a
          href="https://scholar.google.co.uk/citations?user=LLHZcksAAAAJ&hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          his Scholar page{arrow}
        </a>{" "}
        and is the standard reference in the field.{" "}
        <a
          href="https://www.doc.ic.ac.uk/~mpsha/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Murray Shanahan{arrow}
        </a>{" "}
        is a Principal Scientist at DeepMind and Emeritus Professor of
        AI at Imperial; he was the scientific advisor on{" "}
        <em>Ex Machina</em>, his page at{" "}
        <a
          href="https://www.doc.ic.ac.uk/~mpsha/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          doc.ic.ac.uk/~mpsha{arrow}
        </a>{" "}
        is one of the better single-author philosophy-of-AI
        bibliographies online.
      </p>

      <p>
        <a
          href="https://henryshevlin.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Henry Shevlin{arrow}
        </a>{" "}
        joined in May 2026 in the new &ldquo;Philosopher&rdquo; role
        for machine consciousness, splitting his time with Cambridge
        where he is Associate Director of the Leverhulme Centre for
        the Future of Intelligence. The studio reads him with care.
        For the reinforcement-learning side of the building, the public
        names are{" "}
        <a
          href="https://schaul.site44.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Tom Schaul{arrow}
        </a>{" "}
        (prioritised experience replay, intrinsic motivation),{" "}
        <a
          href="https://www.cs.toronto.edu/~vmnih/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Volodymyr Mnih{arrow}
        </a>{" "}
        (the DQN paper that opened the modern RL era) and{" "}
        <a
          href="https://sites.google.com/view/junyoung-ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Junyoung Chung{arrow}
        </a>{" "}
        (AlphaStar, AlphaCode, Veo).
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop three &mdash; the DeepMind founders and senior leadership
      </h2>

      <p>
        The same building holds the leadership tier. The founding
        story is well rehearsed: DeepMind was started in London in 2010
        by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Demis_Hassabis"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Demis Hassabis{arrow}
        </a>
        ,{" "}
        <a
          href="https://en.wikipedia.org/wiki/Shane_Legg"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Shane Legg{arrow}
        </a>{" "}
        and Mustafa Suleyman, sold to Google in 2014, and Hassabis
        shared the 2024 Nobel Prize in Chemistry with John Jumper for
        AlphaFold. Hassabis is CEO. Legg is co-founder and Chief AGI
        Scientist; his blog at{" "}
        <a
          href="https://vetta.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          vetta.org{arrow}
        </a>{" "}
        is where the AGI-by-2028 prediction lives.
      </p>

      <p>
        <a
          href="https://koray.kavukcuoglu.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Koray Kavukcuoglu{arrow}
        </a>{" "}
        is CTO of Google DeepMind and Chief AI Architect at Google; he
        led the teams behind DQN, IMPALA and WaveNet (which is what is
        speaking when Google Assistant speaks).{" "}
        <a
          href="https://research.google/people/105667/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Pushmeet Kohli{arrow}
        </a>{" "}
        is VP of Research and founder of the AI for Science unit &mdash;
        the home of AlphaFold, AlphaGenome, AlphaEarth, AlphaProteo and
        AlphaEvolve. The COO who built the company from a research lab
        into a 2,500-person organisation is{" "}
        <a
          href="https://deepmind.google/discover/blog/our-first-coo-lila-ibrahim-takes-deepmind-to-the-next-level/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Lila Ibrahim{arrow}
        </a>
        , now Chief AI Readiness Officer; she came in 2018 from
        Coursera, after Kleiner Perkins, after eighteen years at Intel.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop four &mdash; Google Cloud London
      </h2>

      <p>
        Cross King&rsquo;s Boulevard again. Google Cloud&rsquo;s UK
        &amp; Ireland operation reports to{" "}
        <a
          href="https://technologymagazine.com/interviews/helen-kelisky"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Helen Kelisky{arrow}
        </a>
        , the Managing Director, who arrived in 2022 after thirty
        years across IBM, Salesforce and OpenText. The Cloud side of
        the building shades into developer relations; the most
        visible UK-publishing engineer there is the previously named
        Addy Osmani, whose director role at Google Cloud AI now covers
        Gemini, Vertex AI and the Agent Development Kit. He still
        writes long-form essays under his own brand at{" "}
        <a
          href="https://addyosmani.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          addyosmani.com{arrow}
        </a>
        , which is the rare case of a Googler who treats their personal
        archive as the canonical record.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop five &mdash; YouTube London
      </h2>

      <p>
        YouTube&rsquo;s UK operations are run out of the same
        King&rsquo;s Cross campus. The Regional Director for EMEA and
        Managing Director for the UK &amp; Ireland business is{" "}
        <a
          href="https://uk.linkedin.com/in/ben-mw"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ben McOwen Wilson{arrow}
        </a>
        , who has been at YouTube for over eight years and has held a
        public profile through the Royal Television Society. The
        previous EMEA chief,{" "}
        <a
          href="https://www.crunchbase.com/person/cecile-frot-coutaz"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          C&eacute;cile Frot-Coutaz{arrow}
        </a>
        , left in 2021 to become CEO of Sky Studios &mdash; the
        revolving door between Google UK leadership and British media
        leadership is busier than it looks.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop six &mdash; Google Research London
      </h2>

      <p>
        Most Google Research output in the UK happens under the
        DeepMind banner now, so the lines blur. The point of the public
        Google Research site at{" "}
        <a
          href="https://research.google/people/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          research.google/people{arrow}
        </a>{" "}
        is that every named researcher has a profile page with a list
        of publications &mdash; the studio&rsquo;s rule (publish under
        your own name, in public) is the rule the institution itself
        uses. A representative example is{" "}
        <a
          href="https://mdenil.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Misha Denil{arrow}
        </a>
        , who spent a decade at DeepMind on language models and now
        keeps mdenil.com as the public bibliography. The studio reads
        any UK-affiliated Google Research paper through this lens: if
        the author cannot be found writing under their own name on the
        public web, the work is not yet legible from the outside.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop seven &mdash; Android, Wear OS, the Belfast presence
      </h2>

      <p>
        Google&rsquo;s Android, Wear OS and Gemini engineering work in
        the UK is split between London and a smaller Belfast presence;
        the company describes it on its{" "}
        <a
          href="https://about.google/intl/ALL_uk/around-the-globe/local-info/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UK local-info page{arrow}
        </a>{" "}
        without naming the engineers, which is normal for product
        teams. The publicly visible Chrome / Chrome OS adjacent staff
        in London &mdash; Sam Dutton, the Chrome DevRel cluster,
        long-tail authors on{" "}
        <a
          href="https://developer.chrome.com/meet-the-team/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          developer.chrome.com{arrow}
        </a>{" "}
        &mdash; are the surface anyone outside the company can verify.
        The Android platform engineers in Belfast do real work and the
        studio omits them only because they do not publish under their
        own name; absence here is the format protecting itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop eight &mdash; Google for Startups, Campus London (closed)
      </h2>

      <p>
        Walk east along Bonhill Street in Shoreditch and you arrive at
        the building that used to be{" "}
        <a
          href="https://www.cnbc.com/2021/06/21/google-campus-london-closes-to-start-ups-post-covid.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Campus London{arrow}
        </a>
        . Opened in 2012 by Eze Vidra, run after him by{" "}
        <a
          href="https://uk.linkedin.com/in/martakrupinska"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Marta Krupinska{arrow}
        </a>
        , it was the central node of London&rsquo;s startup ecosystem
        for nearly a decade. Google closed the dedicated space in 2021
        and the programme now operates without a permanent address.
        Krupinska went on to co-found CUR8 and chair startup boards;
        Vidra is at Remagine Ventures. The Campus building closing is
        itself a piece of the map &mdash; the absence is part of the
        shape.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop nine &mdash; Google Arts &amp; Culture
      </h2>

      <p>
        The Arts &amp; Culture team is split between Paris and London;
        the London-facing creative-lead role belongs to{" "}
        <a
          href="https://uk.linkedin.com/in/freya-murray-63330912"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Freya Murray (Salway){arrow}
        </a>
        , who runs the Arts &amp; Culture Lab. She was previously the
        Creative Lead and stepped up after Laurent Gaveau&rsquo;s 2023
        departure. The Lab is the part of Google that commissioned{" "}
        <a
          href="https://marshmallowlaserfeast.com/information/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Marshmallow Laser Feast{arrow}
        </a>
        &rsquo;s &ldquo;Nest&rdquo; with Erland Cooper for Waltham
        Forest London Borough of Culture, and the Es Devlin{" "}
        <em>A National Portrait</em> piece for the National Portrait
        Gallery. The named senior across the whole programme is{" "}
        <a
          href="https://www.ted.com/speakers/amit_sood"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Amit Sood{arrow}
        </a>
        , VP and founder of Google Arts &amp; Culture, who runs the
        Paris HQ but commissions across both sites. The studio crosses
        paths with this team through the projection / light-art scene
        catalogued elsewhere in the rolodex.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stop ten &mdash; the exit door
      </h2>

      <p>
        Every map of an institution needs an exit door, because the
        people who walked out of it are often more findable than the
        people still inside. The most consequential UK Google exit of
        the decade is{" "}
        <a
          href="https://mustafa-suleyman.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mustafa Suleyman{arrow}
        </a>
        : co-founded DeepMind, left in 2022 to start Inflection with
        Reid Hoffman, moved to Microsoft in March 2024 as CEO of
        Microsoft AI &mdash; bringing the VGGNet co-author{" "}
        <a
          href="https://www.robots.ox.ac.uk/~karen/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Karen Simonyan{arrow}
        </a>{" "}
        with him as Chief Scientist. Karen&rsquo;s page at the Oxford
        Robotics Group is the public archive of the work that became
        VGG.
      </p>

      <p>
        <a
          href="https://davidstarsilver.wordpress.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          David Silver{arrow}
        </a>{" "}
        led AlphaGo and AlphaZero at DeepMind for thirteen years, kept
        a UCL chair throughout, and left in January 2026 to run
        Ineffable Intelligence, the reinforcement-learning startup he
        founded in late 2025 and which raised $1.1bn in April 2026.
        And the further-out exit:{" "}
        <a
          href="https://www.kozyr.com/whycassie"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Cassie Kozyrkov{arrow}
        </a>{" "}
        was Google&rsquo;s first Chief Decision Scientist for almost a
        decade, left in 2023, and now runs the consultancy Kozyr from
        a public archive of essays on Medium. The exit door is part of
        the building; the people who walk out of it are the most
        legible thing about it from outside.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Closing</h2>

      <p>
        Google in the UK is a place, not a feeling. It is two glass
        buildings off the canal, plus an Arts Lab in Paris,
        plus an absent startup campus in Shoreditch, plus a quiet
        Belfast office that does not publish, plus a long roster of
        researchers who do publish. The people are individuals who
        have careers before and careers after; the company is the
        building they walk into for a stretch of years. If you read
        the published work without reading the place, you miss the
        cluster effect. If you read the place without reading the
        published work, you miss what the people are actually doing.
        The walk is the way to read both at once.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-who articles
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            Who&rsquo;s Who: UK AI people
          </Link>{" "}
          &mdash; the DeepMind cluster reads differently when the rest
          of UK AI is the frame.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who: UK VR people
          </Link>{" "}
          &mdash; Google&rsquo;s AR / VR research sits inside a wider
          UK immersive-tech industry.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ar-people" className={ext}>
            Who&rsquo;s Who: UK AR people
          </Link>{" "}
          &mdash; Arts &amp; Culture commissions cross into this scene.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Studio articles this overlaps with
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/on-the-shoulders-of-open-source"
            className={ext}
          >
            On the Shoulders of Open Source
          </Link>{" "}
          &mdash; why the studio reads Gemma, JAX and TensorFlow as
          public infrastructure first and Google products second.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources &amp; further reading
      </h2>

      <p className="text-sm text-chrome-400">
        Grouped by domain. Every name above resolves to one of these
        URLs.
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0 text-sm">
        <li>
          <strong>deepmind.google</strong> &mdash;{" "}
          <a
            href="https://deepmind.google/research/publications/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Publications{arrow}
          </a>
          ,{" "}
          <a
            href="https://deepmind.google/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            About DeepMind{arrow}
          </a>
          ,{" "}
          <a
            href="https://deepmind.google/discover/blog/our-first-coo-lila-ibrahim-takes-deepmind-to-the-next-level/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Lila Ibrahim post{arrow}
          </a>
        </li>
        <li>
          <strong>research.google</strong> &mdash;{" "}
          <a
            href="https://research.google/people/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            People index{arrow}
          </a>
          ,{" "}
          <a
            href="https://research.google/people/oriolvinyals/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Oriol Vinyals{arrow}
          </a>
          ,{" "}
          <a
            href="https://research.google/people/105667/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pushmeet Kohli{arrow}
          </a>
        </li>
        <li>
          <strong>Personal sites</strong> &mdash;{" "}
          <a
            href="https://samdutton.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            samdutton.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://addyosmani.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            addyosmani.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://raiahadsell.com/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            raiahadsell.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.iasongabriel.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            iasongabriel.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://henryshevlin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            henryshevlin.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://schaul.site44.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            schaul.site44.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://mdenil.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mdenil.com{arrow}
          </a>
          ,{" "}
          <a
            href="https://sites.google.com/view/junyoung-ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Junyoung Chung{arrow}
          </a>
          ,{" "}
          <a
            href="https://koray.kavukcuoglu.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            koray.kavukcuoglu.org{arrow}
          </a>
          ,{" "}
          <a
            href="https://vetta.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vetta.org (Shane Legg){arrow}
          </a>
          ,{" "}
          <a
            href="https://mustafa-suleyman.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mustafa-suleyman.ai{arrow}
          </a>
          ,{" "}
          <a
            href="https://davidstarsilver.wordpress.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            David Silver blog{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.kozyr.com/whycassie"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            kozyr.com{arrow}
          </a>
        </li>
        <li>
          <strong>University pages</strong> &mdash;{" "}
          <a
            href="https://www.doc.ic.ac.uk/~mpsha/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Murray Shanahan (Imperial){arrow}
          </a>
          ,{" "}
          <a
            href="https://www.cs.toronto.edu/~vmnih/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Volodymyr Mnih (Toronto){arrow}
          </a>
          ,{" "}
          <a
            href="https://www.robots.ox.ac.uk/~karen/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Karen Simonyan (Oxford){arrow}
          </a>
        </li>
        <li>
          <strong>kingscross.co.uk</strong> &mdash;{" "}
          <a
            href="https://www.kingscross.co.uk/google"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Google at King&rsquo;s Cross{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.kingscross.co.uk/s2-handyside"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            S2 Handyside{arrow}
          </a>
        </li>
        <li>
          <strong>blog.google</strong> &mdash;{" "}
          <a
            href="https://blog.google/around-the-globe/google-europe/united-kingdom/britain-tech-future/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Debbie Weinstein on Google UK{arrow}
          </a>
        </li>
        <li>
          <strong>uk.linkedin.com</strong> &mdash;{" "}
          <a
            href="https://uk.linkedin.com/in/ben-mw"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ben McOwen Wilson{arrow}
          </a>
          ,{" "}
          <a
            href="https://uk.linkedin.com/in/matt-brittin-5aa6391"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Matt Brittin{arrow}
          </a>
          ,{" "}
          <a
            href="https://uk.linkedin.com/in/freya-murray-63330912"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Freya Murray (Salway){arrow}
          </a>
          ,{" "}
          <a
            href="https://uk.linkedin.com/in/martakrupinska"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Marta Krupinska{arrow}
          </a>
        </li>
        <li>
          <strong>About / company sites</strong> &mdash;{" "}
          <a
            href="https://about.google/intl/ALL_uk/around-the-globe/local-info/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            About Google in the UK{arrow}
          </a>
          ,{" "}
          <a
            href="https://developer.chrome.com/meet-the-team/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Meet the Chrome team{arrow}
          </a>
          ,{" "}
          <a
            href="https://github.com/samdutton"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            github.com/samdutton{arrow}
          </a>
        </li>
        <li>
          <strong>Press &amp; reference</strong> &mdash;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Demis_Hassabis"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Demis Hassabis (Wikipedia){arrow}
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Shane_Legg"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Shane Legg (Wikipedia){arrow}
          </a>
          ,{" "}
          <a
            href="https://www.cnbc.com/2021/06/21/google-campus-london-closes-to-start-ups-post-covid.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CNBC on Campus London closing{arrow}
          </a>
          ,{" "}
          <a
            href="https://technologymagazine.com/interviews/helen-kelisky"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Helen Kelisky interview{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.crunchbase.com/person/cecile-frot-coutaz"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            C&eacute;cile Frot-Coutaz{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.ted.com/speakers/amit_sood"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Amit Sood (TED){arrow}
          </a>
          ,{" "}
          <a
            href="https://marshmallowlaserfeast.com/information/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Marshmallow Laser Feast{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: "whos-who-uk-google-people",
  title:
    "Who’s Who: Google people in the UK — a walking tour through King’s Cross",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Google in the UK is a place, not a feeling. A walking tour through King’s Cross, Pancras Square, DeepMind, Cloud, YouTube, Research, Android, Campus, Arts & Culture, and the exit door. Real people, verified by public URL.",
  Body: WhosWhoUkGooglePeople,
  related: [
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "Who’s Who: UK AI people",
      note: "The DeepMind cluster inside the wider UK AI scene.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who’s Who: UK VR people",
      note: "Google AR / VR sits inside this industry.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who’s Who: UK AR people",
      note: "Arts & Culture commissions cross this scene.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Gemma, JAX and TensorFlow as public infrastructure.",
    },
  ],
  furtherReading: [
    {
      href: "https://deepmind.google/research/publications/",
      label: "Google DeepMind — publications",
      note: "The canonical record of DeepMind's published work.",
    },
    {
      href: "https://research.google/people/",
      label: "Google Research — people index",
      note: "Every named Google Research scientist with a public profile.",
    },
    {
      href: "https://www.kingscross.co.uk/google",
      label: "Google at King’s Cross — the buildings",
      note: "The physical place this article walks through.",
    },
    {
      href: "https://about.google/intl/ALL_uk/around-the-globe/local-info/",
      label: "About Google in the UK",
      note: "The company's own UK-presence page.",
    },
  ],
};
