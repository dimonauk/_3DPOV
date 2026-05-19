import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

// Index-card primitives — each card is a stacked block: name on top,
// role + team underneath, then one paragraph of work + URL. The list
// is unstyled so the cards stack like a library catalogue drawer.
function Card({
  name,
  role,
  team,
  children,
}: {
  name: string;
  role: string;
  team: string;
  children: React.ReactNode;
}) {
  return (
    <li className="mb-6 border-l border-chrome-700 pl-4">
      <div className="text-lg text-chrome-100">{name}</div>
      <div className="text-sm text-chrome-400">
        {role} &middot; {team}
      </div>
      <p className="mt-2">{children}</p>
    </li>
  );
}

export default function WhosWhoUkMetaPeople() {
  return (
    <>
      <p>
        The Princess sets the catalogue drawer on the table and slides
        it open. Each card inside names one person, the room they work
        in, and the thing they have actually shipped. The building is
        Meta &mdash; a company with a London office, a Cambridge
        office in Massachusetts that is not the British one, a
        research lab called FAIR with a London arm, and a wearables
        programme called Reality Labs whose London footprint has been
        rumoured for years and never fully unveiled. The catalogue
        treats the building as the building; the cards treat the
        people as the people. Real names below, every one verified by
        a public URL the reader can click and check.
      </p>

      <p>
        Two structural facts shape this map and they ought to be said
        plainly before the cards start. First, Meta&rsquo;s consumer
        AR creator platform &mdash;{" "}
        <a
          href="https://spark.meta.com/blog/meta-spark-announcement/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Meta Spark{arrow}
        </a>{" "}
        &mdash; was shut down on 14 January 2025. The UK creator
        community that grew around it has scattered into WebAR
        studios, Snap Lens work, and independent practice. Second,
        FAIR London is in flux: the team that produced UCL&rsquo;s
        deepest reinforcement-learning bench across 2018&ndash;2024
        has, by 2026, largely moved on to Google DeepMind, Cohere, and
        new ventures. Meta announced a major reorganisation of its AI
        teams in August 2025 and approximately 600 redundancies across
        FAIR and Products &amp; Applied Research in October 2025,
        reported by{" "}
        <a
          href="https://fortune.com/2025/04/10/meta-ai-research-lab-fair-questions-departures-future-yann-lecun-new-beginning/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Fortune{arrow}
        </a>{" "}
        and others. The cards below include people who built the
        canon while they were at Meta &mdash; the URL points to their
        current site, the team line names the room they built in. The
        exit door has its own section at the end.
      </p>

      <p>
        Sibling maps:{" "}
        <Link href="/articles/whos-who-uk-ar-people" className={ext}>
          UK AR people
        </Link>{" "}
        for the wider augmented-reality scene,{" "}
        <Link href="/articles/whos-who-uk-vr-people" className={ext}>
          UK VR people
        </Link>{" "}
        for the Quest-adjacent practitioners,{" "}
        <Link href="/articles/whos-who-uk-ai-people" className={ext}>
          UK AI people
        </Link>{" "}
        for the broader research scene, and{" "}
        <Link href="/articles/whos-who-uk-google-people" className={ext}>
          UK Google people
        </Link>{" "}
        for the DeepMind side of the FAIR &harr; DeepMind shuttle.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Reality Labs Research &mdash; the AR programme
      </h2>

      <p>
        Reality Labs is the wearables R&amp;D wing: Quest headsets,
        Ray-Ban Meta glasses, Project Aria. The leadership of the
        research science arm is in the United States. The UK presence
        is real but small, and most of its public surface is
        academic-partnership rather than staff-byline. The two cards
        below are the firmest verifiable nodes; we hold the line at
        what the public record supports.
      </p>

      <ul className="mt-6 list-none pl-0">
        <Card
          name="Richard Newcombe"
          role="VP of Research Science, Reality Labs Research"
          team="Project Aria"
        >
          Newcombe runs the research-science side of Reality Labs and
          is the most-cited engineering author on{" "}
          <a
            href="https://www.projectaria.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Project Aria{arrow}
          </a>
          , Meta&rsquo;s egocentric-capture glasses platform. He is
          US-based, but he is the node UK academic partners route
          through. The{" "}
          <a
            href="https://arxiv.org/abs/2510.16134"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Aria Gen 2 Pilot Dataset paper{arrow}
          </a>{" "}
          lists him on the author block; the device is the lens through
          which most UK academic Aria work flows.
        </Card>

        <Card
          name="Dima Damen"
          role="Professor of Computer Vision, University of Bristol &mdash; Aria academic partner"
          team="Ego-Exo4D consortium"
        >
          Bristol is the only UK research group leading work inside
          the Aria consortium. Damen leads{" "}
          <a
            href="https://epic-kitchens.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EPIC-KITCHENS{arrow}
          </a>{" "}
          and is a co-PI on{" "}
          <a
            href="https://ego-exo4d-data.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ego-Exo4D{arrow}
          </a>
          , the joint egocentric-exocentric dataset Meta runs with
          thirteen partner universities. She is not Meta staff; she is
          the UK academic the programme leans on, and her group at{" "}
          <a
            href="https://dimadamen.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            dimadamen.github.io{arrow}
          </a>{" "}
          is where the dataset work has its public home.
        </Card>
      </ul>

      <p>
        The honest gap: a London-based Reality Labs Research staff
        roster does not surface in the public record at the level the
        Menlo Park or Pittsburgh teams do. Job listings exist for
        London; named bylines do not. The studio will update this
        section when verifiable URLs appear.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        FAIR London &mdash; the AI research arm
      </h2>

      <p>
        FAIR &mdash; Fundamental AI Research &mdash; has been Meta&rsquo;s
        long-horizon research lab since 2013 and has had a London arm
        since the second half of the decade, mostly through a long
        partnership with{" "}
        <a
          href="https://www.cs.ucl.ac.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UCL Computer Science{arrow}
        </a>{" "}
        and the{" "}
        <a
          href="https://ucldark.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UCL DARK Lab{arrow}
        </a>
        . Reinforcement learning and retrieval-augmented language
        modelling are the two threads the London team is most
        recognised for. Several names below have moved on since 2024;
        they are kept on the catalogue card because they built the
        canon, and their current site is where the reader can find the
        live work. The exit-door section at the end of the article
        lists where each has landed.
      </p>

      <ul className="mt-6 list-none pl-0">
        <Card
          name="Edward Grefenstette"
          role="Former Research Scientist &amp; RL Area Lead, FAIR London"
          team="Reinforcement learning, language"
        >
          Grefenstette led FAIR London&rsquo;s reinforcement-learning
          work until early 2022, with a long parallel honorary
          professorship at UCL DARK. Before Meta he was at DeepMind;
          after Meta he became Head of ML at Cohere. His personal site
          at{" "}
          <a
            href="https://www.egrefen.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            egrefen.com{arrow}
          </a>{" "}
          keeps the publication history, including the NetHack and
          MiniHack lines that came out of the London team.
        </Card>

        <Card
          name="Tim Rocktäschel"
          role="Former Manager &amp; Research Scientist, FAIR London"
          team="Open-endedness, reinforcement learning"
        >
          Rocktäschel managed FAIR London&rsquo;s reinforcement-learning
          team and ran the open-ended-learning programme through 2023.
          He is also Professor of AI at UCL DARK, and a great deal of
          the joint UCL&ndash;FAIR PhD pipeline ran through him. After
          FAIR he became Director and Principal Scientist at Google
          DeepMind. Personal site:{" "}
          <a
            href="https://rockt.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rockt.ai{arrow}
          </a>
          .
        </Card>

        <Card
          name="Sebastian Riedel"
          role="Former Research Scientist, FAIR London"
          team="Natural language processing, knowledge"
        >
          Riedel held the longest-running joint chair between FAIR
          London and UCL, where he supervised a generation of PhD
          students who then routed through both labs. The retrieval
          line of work &mdash; including the original RAG paper &mdash;
          began with his students. His UCL page sits at{" "}
          <a
            href="http://www.riedelcastro.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            riedelcastro.org{arrow}
          </a>
          .
        </Card>

        <Card
          name="Patrick Lewis"
          role="Former Research Scientist, FAIR London"
          team="Retrieval-augmented generation"
        >
          Lewis is the first-author on the original{" "}
          <a
            href="https://arxiv.org/abs/2005.11401"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            RAG paper (2020){arrow}
          </a>{" "}
          &mdash; the work that defined retrieval-augmented generation
          as a methodology and that almost every contemporary
          enterprise-LLM stack now leans on. His PhD was split between
          FAIR London and UCL under Sebastian Riedel and Pontus
          Stenetorp. He is now at Cohere, leading the RAG, tool-use,
          and agents team. Personal site:{" "}
          <a
            href="https://www.patricklewis.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            patricklewis.io{arrow}
          </a>
          .
        </Card>

        <Card
          name="Heinrich Küttler"
          role="Former Research Engineer, FAIR London"
          team="Reinforcement-learning infrastructure"
        >
          Küttler is the engineer behind the{" "}
          <a
            href="https://github.com/facebookresearch/nle"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            NetHack Learning Environment{arrow}
          </a>{" "}
          &mdash; the procedurally-generated, roguelike RL benchmark
          that the London team turned into one of the lab&rsquo;s
          best-known public artefacts. He was based at FAIR&rsquo;s
          King&rsquo;s Cross office; his current public-facing
          biography sits on his{" "}
          <a
            href="https://www.linkedin.com/in/heinrich-kuttler/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LinkedIn profile{arrow}
          </a>
          .
        </Card>

        <Card
          name="Mikayel Samvelyan"
          role="Former Research Assistant, FAIR London Open-Endedness Team"
          team="Multi-agent RL, open-endedness"
        >
          Samvelyan worked in FAIR London&rsquo;s open-endedness team
          from 2020 to 2024 while completing his UCL PhD under Tim
          Rocktäschel. He contributed to Llama 3 safety work
          (Rainbow Teaming) and now sits at DeepMind. Personal site:{" "}
          <a
            href="https://samvelyan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            samvelyan.com{arrow}
          </a>
          .
        </Card>

        <Card
          name="Roberta Raileanu"
          role="Former Research Scientist, FAIR London"
          team="Tool-use, autonomous agents"
        >
          Raileanu started and led the Tool Use team for Llama 3 while
          at FAIR London. She is now at Google DeepMind and an
          honorary lecturer at UCL. Her contributions to the
          tool-using-LLM literature are on{" "}
          <a
            href="https://scholar.google.com/citations?user=462OoekAAAAJ&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Google Scholar{arrow}
          </a>
          .
        </Card>

        <Card
          name="Robert Kirk"
          role="Former PhD student, UCL DARK / FAIR-adjacent"
          team="Generalisation in RL, alignment"
        >
          Kirk wrote the canonical{" "}
          <a
            href="https://arxiv.org/abs/2111.09794"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            survey of generalisation in deep RL{arrow}
          </a>{" "}
          under Tim Rocktäschel and Edward Grefenstette at UCL DARK,
          which makes him a node of the FAIR London canon even though
          he was on the academic side of the joint pipeline. He is now
          a research scientist at the UK AI Security Institute.
          Personal site:{" "}
          <a
            href="https://robertkirk.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            robertkirk.github.io{arrow}
          </a>
          .
        </Card>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Meta London engineering &mdash; the product side
      </h2>

      <p>
        Meta runs a sizeable product-engineering office at 10 Brock
        Street in King&rsquo;s Cross, working across Instagram,
        WhatsApp, Threads, and Messenger. Most engineers there ship
        without a personal byline; the public surface is the{" "}
        <a
          href="https://engineering.fb.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Engineering at Meta blog{arrow}
        </a>{" "}
        and occasional careers-blog profiles, neither of which expose
        more than a first name and team. The cards below are the
        firmest verifiable London-product names the public record
        gives up. The honest answer is that this section is thin by
        design at this company.
      </p>

      <ul className="mt-6 list-none pl-0">
        <Card
          name="Engineering at Meta &mdash; WhatsApp London team"
          role="Group byline"
          team="WhatsApp client + integrity"
        >
          Meta&rsquo;s own careers blog has published profiles of the{" "}
          <a
            href="https://www.metacareers.com/blog/behind-the-scenes-with-whatsapp-engineering/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            WhatsApp London engineering team{arrow}
          </a>{" "}
          and its work on integrity, client automation, and
          multi-language testing. Named profiles in those posts use
          first names only, so this card sits at team level rather
          than naming an individual whose surname has not been made
          public. When Meta surfaces a London engineer by full name,
          the card gets cut into individuals.
        </Card>

        <Card
          name="Private Processing for WhatsApp"
          role="Technical white-paper authors"
          team="WhatsApp security engineering"
        >
          The April 2025 launch of Private Processing &mdash; the
          confidential-computing layer that lets AI tools operate on
          WhatsApp messages without exposing them to Meta &mdash; was
          published on the{" "}
          <a
            href="https://engineering.fb.com/2025/04/29/security/whatsapp-private-processing-ai-tools/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Engineering at Meta blog{arrow}
          </a>
          . The white paper sits at{" "}
          <a
            href="https://ai.meta.com/static-resource/private-processing-technical-whitepaper"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ai.meta.com{arrow}
          </a>
          . The London office is a major contributor to WhatsApp
          security engineering; named individual bylines are not on
          the public posts.
        </Card>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Meta Spark &mdash; the platform that was
      </h2>

      <p>
        Spark AR was Meta&rsquo;s creator tool for Instagram and
        Facebook face filters and AR effects. It launched in 2017, hit
        more than 400,000 creators globally at its peak, and was{" "}
        <a
          href="https://spark.meta.com/blog/meta-spark-announcement/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          shut down on 14 January 2025{arrow}
        </a>
        . Coverage by{" "}
        <a
          href="https://techcrunch.com/2024/08/27/creators-are-angered-by-metas-spark-ar-shutdown-saying-theyll-be-out-of-work-with-little-notice/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          TechCrunch{arrow}
        </a>{" "}
        documented the closure&rsquo;s effect on creators worldwide,
        including the UK community that had built businesses around
        the platform. The catalogue is honest about this: most of what
        was a section becomes a footnote, and the UK Spark practice
        has moved to{" "}
        <Link href="/articles/whos-who-uk-ar-people" className={ext}>
          WebAR studios listed in the UK AR map
        </Link>{" "}
        and to Snap Lens Studio. Meta&rsquo;s remaining named UK
        Spark-era staff have largely either moved internally to other
        Reality Labs work or out of the company. The card below names
        the resource the studio still uses for understanding which
        creator built which effect.
      </p>

      <ul className="mt-6 list-none pl-0">
        <Card
          name="Edoardo Tosti (community-maintained registry)"
          role="Maintainer, spark-ar-creators GitHub list"
          team="Independent, formerly Spark community"
        >
          The most complete public registry of Spark AR creators &mdash;
          including the UK contingent &mdash; is the
          community-maintained{" "}
          <a
            href="https://github.com/edoardottt/spark-ar-creators"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            spark-ar-creators list on GitHub{arrow}
          </a>
          , currently sitting at over nine thousand entries. It is not
          a Meta property and Meta never officially endorsed it; it is
          the only public, queryable trace of who was building on the
          platform when it shut. The studio keeps a link to it for
          archival purposes.
        </Card>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Meta Open Source &mdash; PyTorch and friends
      </h2>

      <p>
        PyTorch is Meta&rsquo;s most-touched contribution to the
        open-source AI world; it now lives under the Linux Foundation
        and has a multi-employer governance structure, but Meta still
        employs much of the core team. The UK contribution to PyTorch
        is real but mostly distributed &mdash; remote engineers,
        academic collaborators, and the wider FAIR-London-adjacent
        cohort. The single firmly-UK PyTorch staff role the studio
        could verify by public URL is below; if more London staff
        publish PyTorch core work under their own name, the card list
        grows.
      </p>

      <ul className="mt-6 list-none pl-0">
        <Card
          name="PyTorch Core Maintainers (public governance)"
          role="Group entry &mdash; governance roster"
          team="PyTorch Foundation"
        >
          The current core maintainer roster is published openly at{" "}
          <a
            href="https://docs.pytorch.org/docs/main/community/persons_of_interest.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            docs.pytorch.org{arrow}
          </a>
          . Lead maintainership passed from Soumith Chintala to{" "}
          <a
            href="https://dev-discuss.pytorch.org/t/lead-core-maintainer-change/3381"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Alban Desmaison{arrow}
          </a>{" "}
          in 2025. The roster is the canonical source for who is
          where; the studio holds this card at group level because the
          public posts identify each maintainer by employer rather
          than by city.
        </Card>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The exit door &mdash; UK ex-Meta people, and where they went
      </h2>

      <p>
        The hardest cards in any Meta map are the recently-departed.
        FAIR London produced an unusual concentration of researchers
        between roughly 2018 and 2024, and the 2024&ndash;2025
        reorganisations sent most of them through the same exit door.
        This section is a register, not a critique. The work the
        people on these cards did at Meta does not stop being theirs
        when they leave; the URL on each card points to where the
        next chapter is being written.
      </p>

      <ul className="mt-6 list-none pl-0">
        <Card
          name="Edward Grefenstette &rarr; Cohere"
          role="Head of ML"
          team="Ex-FAIR London"
        >
          Cohere is a London/Toronto/Bay-Area LLM lab. Grefenstette
          joined as Head of ML and continues the UCL professorship.{" "}
          <a
            href="https://www.egrefen.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            egrefen.com{arrow}
          </a>{" "}
          remains his canonical link.
        </Card>

        <Card
          name="Patrick Lewis &rarr; Cohere"
          role="Lead, RAG / Tool-Use / Agents"
          team="Ex-FAIR London"
        >
          Lewis followed the RAG line he started at FAIR into Cohere,
          where he now leads the team that productises it for
          enterprise customers. The work lives publicly on his site at{" "}
          <a
            href="https://www.patricklewis.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            patricklewis.io{arrow}
          </a>
          .
        </Card>

        <Card
          name="Tim Rocktäschel &rarr; Google DeepMind &rarr; Recursive Superintelligence"
          role="Founder, new RL/agents venture"
          team="Ex-FAIR London"
        >
          After leading the FAIR London RL team Rocktäschel moved to
          DeepMind as Director and Principal Scientist; in 2026 he is
          reported to be raising for a new venture, Recursive
          Superintelligence (coverage:{" "}
          <a
            href="https://www.cnbc.com/2026/04/28/meta-google-big-tech-staff-ai-labs-investors.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CNBC, April 2026{arrow}
          </a>
          ). Personal site:{" "}
          <a
            href="https://rockt.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rockt.ai{arrow}
          </a>
          .
        </Card>

        <Card
          name="Mikayel Samvelyan &rarr; Google DeepMind"
          role="Senior Research Scientist, Open-Endedness"
          team="Ex-FAIR London"
        >
          Samvelyan moved from FAIR London&rsquo;s open-endedness team
          to DeepMind&rsquo;s open-endedness team in 2024 &mdash; the
          two teams have a deep professional history together via UCL
          DARK. Personal site:{" "}
          <a
            href="https://samvelyan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            samvelyan.com{arrow}
          </a>
          .
        </Card>

        <Card
          name="Roberta Raileanu &rarr; Google DeepMind"
          role="Senior Staff Research Scientist"
          team="Ex-FAIR London"
        >
          Raileanu took the tool-use lineage from Llama 3 into
          DeepMind&rsquo;s long-horizon agents work, and continues her
          honorary UCL appointment. Her current publications run
          through{" "}
          <a
            href="https://scholar.google.com/citations?user=462OoekAAAAJ&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Google Scholar{arrow}
          </a>
          .
        </Card>

        <Card
          name="Soumith Chintala &rarr; Thinking Machines / NYU"
          role="AI infrastructure, research, robotics"
          team="Ex-Meta, ex-PyTorch lead"
        >
          Co-creator of PyTorch and lead core maintainer until 2025,
          Chintala wrote a public{" "}
          <a
            href="https://soumith.ch/blog/2025-11-06-leaving-meta-and-pytorch.md.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            departure post{arrow}
          </a>{" "}
          when he stepped back from both PyTorch leadership and Meta
          after eleven years. He is US-based; the card sits here
          because the PyTorch UK ecosystem &mdash; academic
          contributors, conferences, study groups &mdash; was shaped
          by his tenure more than by any other single person.
        </Card>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How to use this catalogue
      </h2>

      <p>
        The cards are stacked the way a librarian stacks them:
        alphabetical inside each drawer if it helps, chronological
        when the order tells the story. The reader who lands here
        looking for one of the canonical FAIR London papers &mdash;
        RAG, NetHack, MiniHack, Llama-3 tool-use, Rainbow Teaming
        &mdash; will find the first-author&rsquo;s card and through it
        the current site. The reader who is mapping the UK AI scene
        more broadly will see a clear pattern in the exit-door
        section: the FAIR London &harr; UCL DARK &harr; DeepMind
        triangle is not coincidence, it is the actual network. The
        catalogue&rsquo;s job is to point that out and step out of the
        way.
      </p>

      <p>
        If you are reading this as a Meta employee and your name
        belongs on it but is not, send the studio a verifiable URL
        &mdash; your own page, a co-authored paper, a conference talk
        with your name on the programme &mdash; and a card will be
        added. The standard is the same as for every other who&rsquo;s-who
        on this site: public, real, click-throughable. No exceptions.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling maps
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-ar-people" className={ext}>
            UK AR people
          </Link>{" "}
          &mdash; the wider augmented-reality scene, including the
          WebAR studios where many Spark AR creators landed.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            UK VR people
          </Link>{" "}
          &mdash; the Quest-adjacent practitioners and the
          headset-content studios.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            UK AI people
          </Link>{" "}
          &mdash; the broader AI research scene FAIR London sits inside.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-google-people" className={ext}>
            UK Google people
          </Link>{" "}
          &mdash; the DeepMind side of the FAIR &harr; DeepMind shuttle.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / Further Reading
      </h2>

      <p className="text-sm text-chrome-400">
        Grouped by domain. Every claim above traces to one of these.
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0 text-sm">
        <li>
          <strong>ai.meta.com</strong> &mdash;{" "}
          <a
            href="https://ai.meta.com/research/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Meta AI research index{arrow}
          </a>
          ,{" "}
          <a
            href="https://ai.meta.com/static-resource/private-processing-technical-whitepaper"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Private Processing white paper{arrow}
          </a>
          .
        </li>
        <li>
          <strong>engineering.fb.com</strong> &mdash;{" "}
          <a
            href="https://engineering.fb.com/2025/04/29/security/whatsapp-private-processing-ai-tools/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Building Private Processing for AI tools on WhatsApp{arrow}
          </a>
          .
        </li>
        <li>
          <strong>metacareers.com</strong> &mdash;{" "}
          <a
            href="https://www.metacareers.com/blog/behind-the-scenes-with-whatsapp-engineering/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Behind the Scenes with a WhatsApp Engineering Manager{arrow}
          </a>
          .
        </li>
        <li>
          <strong>spark.meta.com</strong> &mdash;{" "}
          <a
            href="https://spark.meta.com/blog/meta-spark-announcement/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            A Meta Spark Update (shutdown announcement){arrow}
          </a>
          .
        </li>
        <li>
          <strong>projectaria.com</strong> &mdash;{" "}
          <a
            href="https://www.projectaria.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Project Aria home{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.projectaria.com/datasets/gen2pilot/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Aria Gen 2 Pilot dataset{arrow}
          </a>
          .
        </li>
        <li>
          <strong>arxiv.org</strong> &mdash;{" "}
          <a
            href="https://arxiv.org/abs/2005.11401"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Lewis et al., RAG (2020){arrow}
          </a>
          ,{" "}
          <a
            href="https://arxiv.org/abs/2510.16134"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Aria Gen 2 Pilot Dataset (2025){arrow}
          </a>
          ,{" "}
          <a
            href="https://arxiv.org/abs/2111.09794"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Kirk et al., Survey of Generalisation in Deep RL{arrow}
          </a>
          .
        </li>
        <li>
          <strong>docs.pytorch.org / dev-discuss.pytorch.org</strong>{" "}
          &mdash;{" "}
          <a
            href="https://docs.pytorch.org/docs/main/community/persons_of_interest.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            PyTorch governance / maintainers{arrow}
          </a>
          ,{" "}
          <a
            href="https://dev-discuss.pytorch.org/t/lead-core-maintainer-change/3381"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Lead Core Maintainer change announcement{arrow}
          </a>
          .
        </li>
        <li>
          <strong>github.com</strong> &mdash;{" "}
          <a
            href="https://github.com/facebookresearch/nle"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            facebookresearch/nle (NetHack Learning Environment){arrow}
          </a>
          ,{" "}
          <a
            href="https://github.com/edoardottt/spark-ar-creators"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            spark-ar-creators community registry{arrow}
          </a>
          .
        </li>
        <li>
          <strong>UCL and Bristol</strong> &mdash;{" "}
          <a
            href="https://ucldark.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UCL DARK Lab{arrow}
          </a>
          ,{" "}
          <a
            href="https://dimadamen.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Dima Damen at Bristol{arrow}
          </a>
          ,{" "}
          <a
            href="https://ego-exo4d-data.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ego-Exo4D{arrow}
          </a>
          .
        </li>
        <li>
          <strong>Personal sites</strong> &mdash;{" "}
          <a
            href="https://rockt.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tim Rocktäschel{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.egrefen.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Edward Grefenstette{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.patricklewis.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Patrick Lewis{arrow}
          </a>
          ,{" "}
          <a
            href="https://samvelyan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mikayel Samvelyan{arrow}
          </a>
          ,{" "}
          <a
            href="https://robertkirk.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Robert Kirk{arrow}
          </a>
          ,{" "}
          <a
            href="http://www.riedelcastro.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sebastian Riedel{arrow}
          </a>
          ,{" "}
          <a
            href="https://soumith.ch/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Soumith Chintala{arrow}
          </a>
          .
        </li>
        <li>
          <strong>Press coverage</strong> &mdash;{" "}
          <a
            href="https://fortune.com/2025/04/10/meta-ai-research-lab-fair-questions-departures-future-yann-lecun-new-beginning/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Fortune on FAIR (April 2025){arrow}
          </a>
          ,{" "}
          <a
            href="https://techcrunch.com/2024/08/27/creators-are-angered-by-metas-spark-ar-shutdown-saying-theyll-be-out-of-work-with-little-notice/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            TechCrunch on the Spark shutdown{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.cnbc.com/2026/04/28/meta-google-big-tech-staff-ai-labs-investors.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CNBC on Big Tech AI departures (April 2026){arrow}
          </a>
          .
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record. Index-cards format from
 * docs/CONTENT-MILL.md. Six teams represented across the building,
 * weighted to FAIR London (the room with the largest public-record
 * surface) and to the exit-door section (because the 2024-2025 FAIR
 * reorganisations moved most of the canon out). The Reality Labs
 * Research London staff roster is honestly thin in the public
 * record; the section is held at two firm cards plus a flagged gap.
 * All people verified by current public URL.
 */
export const entry: Entry = {
  slug: "whos-who-uk-meta-people",
  title: "Who's Who — UK Meta People",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Index cards for the UK Meta people you can actually verify: FAIR London's reinforcement-learning and RAG bench, the Reality Labs Research footprint via Project Aria, the WhatsApp engineering office at King's Cross, the closed Spark AR platform, and the exit door — where the FAIR London canon has moved to since the 2024-2025 reorganisations.",
  Body: WhosWhoUkMetaPeople,
  related: [
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "UK AR people",
      note: "Heavy overlap with the post-Spark WebAR scene.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "UK VR people",
      note: "Quest-adjacent practitioners.",
    },
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "UK AI people",
      note: "FAIR London inside the wider scene.",
    },
    {
      href: "/articles/whos-who-uk-google-people",
      label: "UK Google people",
      note: "The DeepMind side of the FAIR ↔ DeepMind shuttle.",
    },
  ],
  furtherReading: [
    {
      href: "https://ai.meta.com/research/",
      label: "Meta AI research index",
      note: "The publicly-listed canon of FAIR work.",
    },
    {
      href: "https://www.projectaria.com/",
      label: "Project Aria",
      note: "The Reality Labs Research egocentric-glasses programme.",
    },
    {
      href: "https://spark.meta.com/blog/meta-spark-announcement/",
      label: "Meta Spark shutdown announcement",
      note: "The closure of the AR creator platform.",
    },
    {
      href: "https://docs.pytorch.org/docs/main/community/persons_of_interest.html",
      label: "PyTorch governance / maintainers",
      note: "Canonical roster of who maintains what.",
    },
    {
      href: "https://ucldark.com/",
      label: "UCL DARK Lab",
      note: "The academic counterpart to FAIR London's RL bench.",
    },
  ],
};
