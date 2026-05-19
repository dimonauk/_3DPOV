import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkMicrosoftPeople() {
  return (
    <>
      <p>
        Microsoft in the UK is one of those institutions that has been
        around long enough to grow its own vocabulary. The press uses
        the words loosely; the people inside use them precisely. The
        princess will walk you through the dictionary. Each entry is a
        term &mdash; a lab, a campus, an era &mdash; and the
        definition is the people who work there under their own name.
        The company is the dictionary; the entries are the words.
      </p>

      <p>
        The studio&rsquo;s rule is the same as on every sibling
        who&rsquo;s-who: real people, public URL, no email. If a
        researcher does not publish their work, their slides or their
        bibliography somewhere a stranger can find it, the studio
        cannot verify them, and so cannot list them. What follows is
        what survived that test. Some entries are short. That is the
        format protecting itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        1. MSR Cambridge &mdash; the lab off Station Road
      </h2>

      <p>
        <em>Microsoft Research Cambridge</em>, founded 1997 at 21
        Station Road, is the UK research lab that produced the Kinect
        body-tracking pipeline, Infer.NET, the Glasgow Haskell
        Compiler stewardship of two decades, and the Project Tokyo
        accessibility line. Around a hundred researchers, almost all
        publishing. The standard public anchor is{" "}
        <a
          href="https://www.microsoft.com/en-us/research/lab/microsoft-research-cambridge/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          microsoft.com/en-us/research/lab/microsoft-research-cambridge{arrow}
        </a>
        .
      </p>

      <p>
        <a
          href="https://www.microsoft.com/en-us/research/people/cmbishop/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Christopher Bishop{arrow}
        </a>{" "}
        is the textbook in person; <em>Pattern Recognition and
        Machine Learning</em> (2006) is the book a generation of UK
        ML researchers learned the field from. He ran MSR Cambridge
        from 2015 to 2022 and is now Microsoft Technical Fellow and
        Director of Microsoft Research AI for Science. The current
        Lab Director is{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/adityan/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Aditya Nori{arrow}
        </a>
        , who built InnerEye for cancer-care imaging.{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/asellen/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Abigail Sellen{arrow}
        </a>{" "}
        is VP and Distinguished Scientist at the same lab, a Royal
        Society Fellow whose human-AI interaction work goes back to
        her doctorate under Don Norman.
      </p>

      <p>
        The historical entry under this term has to be{" "}
        <a
          href="https://en.wikipedia.org/wiki/Andrew_Blake_(scientist)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Andrew Blake{arrow}
        </a>
        , who founded the Computer Vision Group at MSR Cambridge in
        1999 and ran the lab from 2010 to 2015; he and his team won
        the Royal Academy of Engineering MacRobert gold medal for the
        machine-learning pipeline inside Kinect. He left in 2015 to
        run the Alan Turing Institute and now chairs the Samsung AI
        Centre across the road in Cambridge. His old colleague{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/awf/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Andrew Fitzgibbon{arrow}
        </a>
        , Royal Academy of Engineering Silver Medal, co-built the
        boujou 3D camera tracker before Microsoft, was the science
        lead on HoloLens real-time hand tracking, and moved to
        Graphcore in 2022.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        2. MSR Cambridge &mdash; the inhabited present
      </h2>

      <p>
        The same lab has a current generation worth naming. The
        Human-Computer Interaction wing is the one outsiders feel most
        directly: their papers are about how knowledge work changes
        when an AI sits next to it.{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/serintel/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Sean Rintel{arrow}
        </a>{" "}
        is Senior Principal Research Manager and the public face of
        the lab&rsquo;s remote-and-hybrid-work research.{" "}
        <a
          href="https://advait.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Advait Sarkar{arrow}
        </a>{" "}
        keeps a clean personal bibliography at advait.org, lectures at
        UCL and Cambridge, and co-wrote the CHI 2024 Best Paper on
        the metacognitive costs of generative AI. The accessibility
        line of the lab is run by{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/cecilym/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Cecily Morrison{arrow}
        </a>
        , Senior Principal Research Manager, who led Project Tokyo and
        Find My Things for blind and low-vision users; her long-term
        collaborator{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/cutrell/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ed Cutrell{arrow}
        </a>{" "}
        sits in the Ability Group alongside her.
      </p>

      <p>
        The systems side of the lab, less press-friendly but
        load-bearing, was led for two decades by{" "}
        <a
          href="https://rowstron.azurewebsites.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ant Rowstron{arrow}
        </a>
        , whose own page documents twenty-six years at Microsoft
        Cambridge and the Optics for the Cloud programme. The
        probabilistic-programming line that produced Infer.NET still
        traces to{" "}
        <a
          href="https://tminka.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Tom Minka{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://www.microsoft.com/en-us/research/people/jwinn/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          John Winn{arrow}
        </a>
        , who designed it from 2004 onwards in the Machine Learning
        and Perception group and shipped it as open source in 2018.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        3. AI for Science &mdash; the lab inside the lab
      </h2>

      <p>
        <em>Microsoft Research AI for Science</em> is the unit
        Christopher Bishop spun out of MSR Cambridge in 2022. The
        public site is at{" "}
        <a
          href="https://www.microsoft.com/en-us/research/lab/microsoft-research-ai-for-science/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          research.microsoft.com/en-us/research/lab/microsoft-research-ai-for-science{arrow}
        </a>
        , with sites in the UK, the Netherlands and Germany. The unit
        produced MatterGen (materials, <em>Nature</em>), BioEmu
        (protein dynamics, <em>Science</em> cover), and the TamGen
        tuberculosis-drug generator with the Gates Foundation.
        Christopher Bishop runs it; he is the named Director on the
        public page. The Amsterdam-based but UK-collaborating
        Distinguished Scientist on the same team was{" "}
        <a
          href="https://www.cusp.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Max Welling{arrow}
        </a>
        , co-inventor of variational autoencoders, who left to
        co-found CuspAI in Cambridge in 2024.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        4. Microsoft AI &mdash; the Mustafa Suleyman era
      </h2>

      <p>
        <em>Microsoft AI</em> is the consumer AI division formed in
        March 2024 when Microsoft hired{" "}
        <a
          href="https://mustafa-suleyman.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mustafa Suleyman{arrow}
        </a>{" "}
        from Inflection to run it. He is British, DeepMind co-founder
        (covered in the{" "}
        <Link href="/articles/whos-who-uk-google-people" className={ext}>
          Google walking tour
        </Link>
        ), and now Executive Vice President and CEO of Microsoft AI.
        Microsoft AI&rsquo;s Chief Scientist is{" "}
        <a
          href="https://www.robots.ox.ac.uk/~karen/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Karén Simonyan{arrow}
        </a>
        , the VGGNet co-author whose Oxford Robotics Group page
        remains the public bibliography of the work that became VGG.
        Both arrived together; the Inflection-to-Microsoft transfer
        was reviewed by the UK Competition and Markets Authority in
        2024 and cleared.
      </p>

      <p>
        Microsoft AI opened a London hub in Paddington in April 2024,
        run by{" "}
        <a
          href="https://scholar.google.com/citations?user=4A91qjAAAAAJ&hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Jordan Hoffmann{arrow}
        </a>
        , an ex-DeepMind, ex-Inflection scientist; he was lead author
        on the Chinchilla scaling-laws paper, which is one of the
        more-cited results in the modern foundation-model literature.
        In November 2025 Suleyman announced the{" "}
        <a
          href="https://microsoft.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          MAI Superintelligence Team{arrow}
        </a>
        , with London on the named list of hiring sites; the
        public roster is incomplete by design, but Suleyman and
        Simonyan are the two confirmed names at the top, and Jordan
        Hoffmann remains the named London anchor.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        5. Microsoft Reading &mdash; the campus on the Thames Valley
      </h2>

      <p>
        <em>Microsoft Reading</em> is the five-building UK
        headquarters on Thames Valley Park, the address that handles
        UK sales, enterprise, partner programmes, M365, Surface, Xbox
        marketing and the bulk of UK government engagement. The
        public page is at{" "}
        <a
          href="https://www.microsoft.com/en-gb/about/offices/reading/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          microsoft.com/en-gb/about/offices/reading{arrow}
        </a>
        . The CEO of Microsoft UK is{" "}
        <a
          href="https://ukstories.microsoft.com/features/microsoft-announces-regional-leadership-changes/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Darren Hardman{arrow}
        </a>
        , who took the role on 1 November 2024 from AWS UK &amp;
        Ireland.
      </p>

      <p>
        His predecessor{" "}
        <a
          href="https://ukstories.microsoft.com/features/microsoft-announces-regional-leadership-changes/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Clare Barclay{arrow}
        </a>{" "}
        moved upstairs to run Microsoft EMEA as President of
        Enterprise and Industry; she did twenty-six years at the
        company, mostly out of Reading, and is the most senior
        UK-resident Microsoft executive in the public record.
        Reading&rsquo;s job-listings page at{" "}
        <a
          href="https://careers.microsoft.com/v2/global/en/locations/reading.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          careers.microsoft.com/reading{arrow}
        </a>{" "}
        is the surface that tells you what the campus actually does
        on a Tuesday afternoon: cloud solution architects, customer
        success managers, partner technology strategists, M365
        product marketing, mixed-reality field engineering. The
        engineers exist; they do not publish under their own name, so
        they do not list here. Absence is the format protecting
        itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        6. GitHub UK &mdash; the Microsoft acquisition that kept its
        name
      </h2>

      <p>
        <em>GitHub</em> was acquired by Microsoft in 2018 for $7.5bn,
        kept its brand, kept Nat Friedman as CEO until 2021, then
        passed to{" "}
        <a
          href="https://github.blog/author/ashtom/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Thomas Dohmke{arrow}
        </a>
        , who has a PhD in mechanical engineering from the University
        of Glasgow and ran GitHub through the launch of Copilot,
        Copilot Workspace, GitHub Models and Copilot agents until his
        departure in August 2025. His farewell post is at{" "}
        <a
          href="https://github.blog/news-insights/company-news/goodbye-github/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.blog/goodbye-github{arrow}
        </a>
        . GitHub still keeps an office in London; the most visible UK
        face of the research-and-prototyping arm{" "}
        <a
          href="https://githubnext.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          GitHub Next{arrow}
        </a>{" "}
        is{" "}
        <a
          href="https://githubnext.com/team/idan/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Idan Gazit{arrow}
        </a>
        , Senior Director of Research, who keeps a personal page on
        the GitHub Next site and was an early architect of the team.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        7. Accessibility &mdash; the work the studio reads first
      </h2>

      <p>
        <em>Accessibility</em> at Microsoft is the most coherent
        UK-publishing programme in the company. The Chief
        Accessibility Officer{" "}
        <a
          href="https://sheffield.ac.uk/cs/news/jenny-lay-flurrie-chief-accessibility-officer-microsoft-awarded-honorary-degree-university-sheffield"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Jenny Lay-Flurrie{arrow}
        </a>{" "}
        is from Birmingham, deaf since childhood, holds an honorary
        degree from the University of Sheffield, and runs the global
        Microsoft accessibility programme from Redmond &mdash; she is
        the highest-ranking British accessibility executive in big
        tech.
      </p>

      <p>
        The UK-resident lead on the same programme is{" "}
        <a
          href="https://abilitynet.org.uk/webinars/accessibility-insights-hector-minto-microsoft"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Hector Minto{arrow}
        </a>
        , Global Lead Technology Evangelist for Accessibility at
        Microsoft and the UK Government&rsquo;s Disability and Access
        Ambassador for the Technology and Web Sector. The research
        line that ships into this programme is the Ability Group at
        MSR Cambridge &mdash; Cecily Morrison, Ed Cutrell and
        colleagues already listed in entry two &mdash; whose
        bibliography is the bridge between the accessibility-product
        team and the studio&rsquo;s reading list. The studio reads
        this line first because it is the part of Microsoft most
        clearly aligned with the studio&rsquo;s own brief about who
        the work is for.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        8. The diaspora &mdash; the exit door
      </h2>

      <p>
        Every dictionary has entries that are now archaic; every
        company has people who walked out of it and became more
        legible afterwards. The most consequential UK Microsoft
        diaspora entry is{" "}
        <a
          href="https://simon.peytonjones.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Simon Peyton Jones{arrow}
        </a>
        , who spent twenty-three years at MSR Cambridge as the
        steward of Haskell and the Glasgow Haskell Compiler, and
        left in November 2021 to become an Engineering Fellow at Epic
        Games working on Verse with Tim Sweeney. His personal site is
        the canonical bibliography. Andrew Blake (entry one) is in
        the same column &mdash; ex-MSR Cambridge, now Samsung AI
        Centre Cambridge. Andrew Fitzgibbon is in the same column too
        &mdash; ex-MSR Cambridge HoloLens, now Graphcore. The
        Cambridge cluster recycles itself; the building changes, the
        people do not move very far.
      </p>

      <p>
        The other column of the diaspora is the founder column.{" "}
        <a
          href="https://www.cusp.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CuspAI{arrow}
        </a>{" "}
        in Cambridge was co-founded in 2024 by Max Welling out of
        Microsoft Research AI for Science, with Chad Edwards; it
        raised a Series A at a $520m valuation in September 2025 and
        is the cleanest example of the AI-for-Science line walking
        out the front door of the lab and incorporating itself two
        streets away. Mustafa Suleyman&rsquo;s own arc is the
        opposite direction: out of DeepMind, into Inflection, then
        into Microsoft. The diaspora is not one-directional. People
        leave Microsoft for the UK startup scene; people from the UK
        AI scene join Microsoft. The exit door swings both ways.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Closing</h2>

      <p>
        Microsoft in the UK is a dictionary of overlapping terms.
        Cambridge is one entry, Reading is another, GitHub is a
        third, accessibility runs through several at once, and the
        Mustafa Suleyman era reshuffled the typography but did not
        replace it. The people are the words. The words define each
        other &mdash; Christopher Bishop defines AI for Science, AI
        for Science defines the journals it publishes in, the
        journals define the next intake of researchers. If you read
        a Microsoft UK paper, the right question to ask is not
        &ldquo;is this Microsoft work&rdquo; but &ldquo;which
        entry of the dictionary did it come from&rdquo;. The answer
        is usually one of these eight.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-who articles
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            Who&rsquo;s Who: UK AI people
          </Link>{" "}
          &mdash; MSR Cambridge and Microsoft AI sit inside the wider
          UK AI scene.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-google-people" className={ext}>
            Who&rsquo;s Who: UK Google people
          </Link>{" "}
          &mdash; the DeepMind cluster and the Suleyman exit.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-meta-people" className={ext}>
            Who&rsquo;s Who: UK Meta people
          </Link>{" "}
          &mdash; the other big-tech UK research presence.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-arm-people" className={ext}>
            Who&rsquo;s Who: UK ARM people
          </Link>{" "}
          &mdash; the other Cambridge corporate research presence.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Studio articles this overlaps with
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who: UK VR people
          </Link>{" "}
          &mdash; HoloLens UK engineering crosses into this scene.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-cpu-chip-people"
            className={ext}
          >
            Who&rsquo;s Who: UK CPU / chip people
          </Link>{" "}
          &mdash; the Graphcore and ARM-in-Cambridge orbit catches a
          lot of the Microsoft diaspora.
        </li>
        <li>
          <Link
            href="/articles/on-the-shoulders-of-open-source"
            className={ext}
          >
            On the Shoulders of Open Source
          </Link>{" "}
          &mdash; why the studio reads Infer.NET, GHC and Verse as
          public infrastructure first and Microsoft products second.
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
          <strong>microsoft.com / research</strong> &mdash;{" "}
          <a
            href="https://www.microsoft.com/en-us/research/lab/microsoft-research-cambridge/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            MSR Cambridge lab{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/lab/microsoft-research-ai-for-science/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            AI for Science lab{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/cmbishop/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Christopher Bishop{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/adityan/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Aditya Nori{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/asellen/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Abigail Sellen{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/awf/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andrew Fitzgibbon{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/cecilym/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cecily Morrison{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/cutrell/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ed Cutrell{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/serintel/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sean Rintel{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.microsoft.com/en-us/research/people/jwinn/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            John Winn{arrow}
          </a>
        </li>
        <li>
          <strong>microsoft.com / corporate</strong> &mdash;{" "}
          <a
            href="https://www.microsoft.com/en-gb/about/offices/reading/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Reading office{arrow}
          </a>
          ,{" "}
          <a
            href="https://careers.microsoft.com/v2/global/en/locations/reading.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Reading careers{arrow}
          </a>
          ,{" "}
          <a
            href="https://ukstories.microsoft.com/features/microsoft-announces-regional-leadership-changes/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UK leadership announcement{arrow}
          </a>
          ,{" "}
          <a
            href="https://microsoft.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Microsoft AI / Superintelligence Team{arrow}
          </a>
        </li>
        <li>
          <strong>Personal sites</strong> &mdash;{" "}
          <a
            href="https://rowstron.azurewebsites.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ant Rowstron{arrow}
          </a>
          ,{" "}
          <a
            href="https://tminka.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tom Minka{arrow}
          </a>
          ,{" "}
          <a
            href="https://advait.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Advait Sarkar{arrow}
          </a>
          ,{" "}
          <a
            href="https://simon.peytonjones.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Simon Peyton Jones{arrow}
          </a>
          ,{" "}
          <a
            href="https://mustafa-suleyman.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mustafa Suleyman{arrow}
          </a>
        </li>
        <li>
          <strong>University pages</strong> &mdash;{" "}
          <a
            href="https://www.robots.ox.ac.uk/~karen/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Karén Simonyan (Oxford){arrow}
          </a>
          ,{" "}
          <a
            href="https://sheffield.ac.uk/cs/news/jenny-lay-flurrie-chief-accessibility-officer-microsoft-awarded-honorary-degree-university-sheffield"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jenny Lay-Flurrie (Sheffield){arrow}
          </a>
        </li>
        <li>
          <strong>Scholar / publication archives</strong> &mdash;{" "}
          <a
            href="https://scholar.google.com/citations?user=4A91qjAAAAAJ&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jordan Hoffmann{arrow}
          </a>
        </li>
        <li>
          <strong>github.com / github.blog</strong> &mdash;{" "}
          <a
            href="https://githubnext.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GitHub Next{arrow}
          </a>
          ,{" "}
          <a
            href="https://githubnext.com/team/idan/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Idan Gazit{arrow}
          </a>
          ,{" "}
          <a
            href="https://github.blog/author/ashtom/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Thomas Dohmke author page{arrow}
          </a>
          ,{" "}
          <a
            href="https://github.blog/news-insights/company-news/goodbye-github/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Dohmke farewell post{arrow}
          </a>
        </li>
        <li>
          <strong>cusp.ai</strong> &mdash;{" "}
          <a
            href="https://www.cusp.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CuspAI{arrow}
          </a>
        </li>
        <li>
          <strong>abilitynet.org.uk</strong> &mdash;{" "}
          <a
            href="https://abilitynet.org.uk/webinars/accessibility-insights-hector-minto-microsoft"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Hector Minto interview{arrow}
          </a>
        </li>
        <li>
          <strong>Press &amp; reference</strong> &mdash;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Andrew_Blake_(scientist)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andrew Blake (Wikipedia){arrow}
          </a>
          ,{" "}
          <a
            href="https://blogs.microsoft.com/blog/2024/03/19/mustafa-suleyman-deepmind-and-inflection-co-founder-joins-microsoft-to-lead-copilot/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Suleyman joining Microsoft (blog){arrow}
          </a>
          ,{" "}
          <a
            href="https://techcrunch.com/2024/04/08/microsoft-ai-gets-a-new-london-hub-headed-up-by-former-inflection-and-deepmind-scientist-jordan-hoffmann/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            TechCrunch on Microsoft AI London{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: "whos-who-uk-microsoft-people",
  title:
    "Who’s Who: Microsoft people in the UK — the company as a dictionary",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Microsoft in the UK is a dictionary of overlapping terms — MSR Cambridge, AI for Science, the Mustafa Suleyman era, Reading, GitHub UK, accessibility, the diaspora. Eight entries, real people, verified by public URL.",
  Body: WhosWhoUkMicrosoftPeople,
  related: [
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "Who’s Who: UK AI people",
      note: "MSR Cambridge and Microsoft AI inside the wider UK AI scene.",
    },
    {
      href: "/articles/whos-who-uk-google-people",
      label: "Who’s Who: UK Google people",
      note: "The DeepMind cluster and the Suleyman exit door.",
    },
    {
      href: "/articles/whos-who-uk-meta-people",
      label: "Who’s Who: UK Meta people",
      note: "The other big-tech UK research presence.",
    },
    {
      href: "/articles/whos-who-uk-arm-people",
      label: "Who’s Who: UK ARM people",
      note: "The other Cambridge corporate-research orbit.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Infer.NET, GHC, Verse — public infrastructure first.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.microsoft.com/en-us/research/lab/microsoft-research-cambridge/",
      label: "Microsoft Research Cambridge — lab page",
      note: "The canonical anchor for the Station Road lab.",
    },
    {
      href: "https://www.microsoft.com/en-us/research/lab/microsoft-research-ai-for-science/",
      label: "Microsoft Research AI for Science",
      note: "Christopher Bishop's spun-out unit.",
    },
    {
      href: "https://microsoft.ai/",
      label: "Microsoft AI — Superintelligence Team",
      note: "The Mustafa Suleyman era, public site.",
    },
    {
      href: "https://www.microsoft.com/en-gb/about/offices/reading/",
      label: "Microsoft Reading campus",
      note: "The UK headquarters on Thames Valley Park.",
    },
  ],
};
