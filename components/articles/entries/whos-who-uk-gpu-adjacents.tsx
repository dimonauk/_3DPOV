import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkGpuAdjacents() {
  return (
    <>
      <p>
        The Princess sets down the tea and points at a map of the
        South East. The dots she circles are not Arm; the studio has
        walked you round Arm already. The dots she circles tonight are
        the houses that sit one room over &mdash; the GPU teams, the
        AI-accelerator labs, the modem houses, the networking-silicon
        offices, the academic departments that feed all of them. Same
        cluster, sibling labs, overlapping rolodexes. If you sat in
        any one of them you would know someone in each of the others
        by first name.
      </p>

      <p>
        This article walks the scene as a set of kindred pairs. The
        conceit is that silicon design is a social practice. The same
        engineer keeps reappearing under different company logos
        across thirty years; the same dinner table seats people from
        three or four rival fabless houses; the same university
        department supplies the headcount for half of them. Pairing
        them by what their work has in common, rather than by the
        building they are currently in, makes the scene legible.
      </p>

      <p>
        Every name below resolves to a public URL. UK-roots discipline
        observed: a company gets listed if it has a UK office and a UK
        lineage to point at; a person gets listed if their
        career-defining work was done at a UK site or a UK university.
        The pieces this one sits next to are{" "}
        <Link href="/articles/whos-who-uk-arm-people" className={ext}>
          the Arm history
        </Link>{" "}
        and{" "}
        <Link href="/articles/whos-who-uk-cpu-chip-people" className={ext}>
          the broader UK CPU and chip people
        </Link>
        . This is the layer underneath both: the cousins, the
        suppliers, the rivals.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pair 1 &mdash; Samsung AI Centre Cambridge: the founders
      </h2>

      <p>
        Samsung opened the AI Centre Cambridge in May 2018 as part of
        a three-city push (Cambridge, Toronto, Moscow) and chose the
        site because it is the densest computer-vision graduate market
        in Europe. The centre was set up to do human-centric AI work
        for Samsung&rsquo;s devices, which in practice meant emotion
        recognition, behaviour analysis, body and gesture tracking,
        the lot that an embedded camera needs to be useful. The two
        people who set it up came from the two laboratories you would
        expect.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.microsoft.com/en-us/research/people/ablake/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Andrew Blake{arrow}
            </a>
          </strong>{" "}
          &mdash; founding head of the Samsung AI Centre Cambridge.
          Previously Director of Microsoft Research Cambridge, where
          he spent two decades and ran the lab that produced Kinect,
          PhotoSynth and a long line of computer-vision firsts. Also a
          research director at the Alan Turing Institute. The Cambridge
          AI scene&rsquo;s most decorated machine-vision chair.
        </li>
        <li>
          <strong>
            <a
              href="https://ibug.doc.ic.ac.uk/maja/biography/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Maja Pantić{arrow}
            </a>
          </strong>{" "}
          &mdash; Research Director of the Samsung AI Centre Cambridge
          from April 2018 to April 2020, drawn from Imperial College
          where she chairs the iBUG group on affective and behavioural
          computing. Helped set up the centre and recruit its first
          cohort. The cited expert on non-verbal human behaviour the
          team formed around. Later moved to AI scientific lead at
          Meta London &mdash; the same lab traced in{" "}
          <Link href="/articles/whos-who-uk-meta-people" className={ext}>
            the Meta who&rsquo;s-who
          </Link>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://www.surrey.ac.uk/people/tao-xiang"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Tao Xiang{arrow}
            </a>
          </strong>{" "}
          &mdash; Professor of Computer Vision and Machine Learning at
          Surrey; Principal Researcher at the Samsung AI Centre
          Cambridge, where he leads the Body Behaviour Group.
          Continued the centre&rsquo;s body and gesture-tracking line
          of work after the founding cohort moved on.
        </li>
      </ul>

      <p>
        Blake and Pantić are a pair in the literal sense &mdash;
        chair and director, hired in the same week, occupied
        neighbouring desks for the first two years. Xiang is the
        continuity. The Body Behaviour Group is the line of research
        the centre is now most public about.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pair 2 &mdash; Imagination Technologies: PowerVR, then Catapult
      </h2>

      <p>
        Imagination Technologies sits in Kings Langley, Hertfordshire,
        and was the GPU half of the British semiconductor IP business
        for two decades. PowerVR powered every iPhone from the
        original through the iPhone 6s, every Sega Dreamcast, a great
        many Android parts, and the GPU IP that ended up in tens of
        billions of devices. Apple went in-house in 2017; Imagination
        was taken off the London Stock Exchange the same year, sold to
        a Beijing-backed private equity firm, and then re-emerged
        under new leadership pushing a RISC-V CPU line called Catapult
        alongside the continuing GPU work.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Hossein_Yassaie"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Sir Hossein Yassaie{arrow}
            </a>
          </strong>{" "}
          &mdash; joined Imagination in 1992, CEO from 1998 to 2016.
          The man who pivoted the company in 1999 from making boards
          to licensing IP, and who steered the PowerVR business into
          becoming the GPU IP behind a generation of Apple silicon.
          Knighted in the 2013 New Year Honours for services to
          technology and innovation. Now Chairman of{" "}
          <a
            href="https://uniphy.global/team/sir-hossein-yassaie/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Uniphy{arrow}
          </a>
          , the holography and user-interface house he chairs after
          Imagination.
        </li>
        <li>
          <strong>
            <a
              href="https://www.imaginationtech.com/news/imagination-technologies-group-ltd-announces-new-ceo-simon-beresford-wylie/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Simon Beresford-Wylie{arrow}
            </a>
          </strong>{" "}
          &mdash; CEO from October 2020 to mid-2025. Previously CEO of
          Arqiva and founding CEO of Nokia Siemens Networks. Steered
          Imagination through the launch of the Catapult RISC-V CPU
          line in December 2021, broadening the company from pure GPU
          into a mixed CPU/GPU/NPU shop. Retired in 2025; Didier
          Lamouche took the interim seat.
        </li>
        <li>
          <strong>
            <a
              href="https://www.imaginationtech.com/news/imagination-launches-risc-v-cpu-family/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Tim Mamtora{arrow}
            </a>
          </strong>{" "}
          &mdash; Chief of Innovation at Imagination. The public face
          of the Catapult RISC-V CPU product line, announced as a
          four-family lineup covering microcontroller, real-time,
          application and automotive parts. The engineering bridge
          between the older PowerVR culture and the newer RISC-V CPU
          one.
        </li>
      </ul>

      <p>
        Yassaie and Beresford-Wylie are a generational pair &mdash;
        the engineer-founder who built the IP business, and the
        professional CEO who steered it through the post-Apple
        transition into a CPU/GPU/NPU combined house. Mamtora is the
        engineering through-line. Imagination is the closest thing the
        UK has to a domestic GPU vendor; it is the only one with a
        thirty-year history in the role.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pair 3 &mdash; Nvidia in the UK
      </h2>

      <p>
        Nvidia&rsquo;s UK presence runs along three sites and the
        Mellanox legacy. Cambridge hosts the AI research collaboration
        with Arm, announced in 2020 alongside the Cambridge-1
        supercomputer &mdash; eighty DGX A100 systems wired together
        with Mellanox InfiniBand, the first supercomputer Nvidia ever
        built for healthcare and life-science researchers, with
        GlaxoSmithKline, AstraZeneca and Oxford Nanopore on the user
        list. Bristol hosts an R&amp;D facility. The networking side
        comes through Mellanox UK, which was based in Reading before
        Nvidia&rsquo;s $6.9 billion acquisition closed in 2020. The
        public face of Nvidia networking now lives in California, not
        the UK, so this slot is short on UK-resident named engineers
        and the studio refuses to invent.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://blogs.nvidia.com/blog/arm-ai-research-center-cambridge-uk/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              The Nvidia + Arm Cambridge AI Lab{arrow}
            </a>
          </strong>{" "}
          &mdash; announced as part of the (eventually-abandoned)
          Nvidia/Arm transaction; the collaboration outlived the deal.
          The physical site sits at the Arm campus on Fulbourn Road.
        </li>
        <li>
          <strong>
            <a
              href="https://www.nvidia.com/en-gb/industries/healthcare-life-sciences/cambridge-1/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Cambridge-1{arrow}
            </a>
          </strong>{" "}
          &mdash; the supercomputer itself, hosted at Kao Data near
          Stansted. The first Nvidia supercomputer built for a
          national health-research community.
        </li>
        <li>
          <strong>
            <a
              href="https://blogs.nvidia.com/blog/author/giladshainer/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Gilad Shainer &mdash; Nvidia Networking (ex-Mellanox)
              {arrow}
            </a>
          </strong>{" "}
          &mdash; SVP of Networking at Nvidia, the ex-Mellanox figure
          who runs the InfiniBand and Spectrum Ethernet lines now
          stitched into Nvidia&rsquo;s DGX systems. Listed as the
          public author for the networking story; not a UK resident,
          but the line of work he runs sits behind every Cambridge-1
          rack and the Reading office his old company kept.
        </li>
        <li>
          <strong>
            <a
              href="https://find-and-update.company-information.service.gov.uk/company/06251613"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Mellanox Technologies UK Ltd{arrow}
            </a>
          </strong>{" "}
          &mdash; the Reading legal entity, registered office at Green
          Park. Still the UK delivery vehicle for Nvidia
          networking. Not a research lab; a sales-and-support office
          with engineering integrations into customer sites.
        </li>
      </ul>

      <p>
        Honest scale: the studio cannot name a single UK-resident
        chip-architect at Nvidia from public sources alone, which is a
        gap and is named as such. The collaboration is real, the
        Cambridge AI Lab is real, the Bristol R&amp;D site is real,
        but the named-engineer rolodex points to California and Tel
        Aviv. If a reader can verify a UK-resident Nvidia silicon
        architect by public URL the studio will add them on the next
        pass.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pair 4 &mdash; The Bristol cluster: Inmos, XMOS, Graphcore
      </h2>

      <p>
        Bristol is the second UK silicon cluster after Cambridge, and
        it is in significant part downstream of one office that opened
        on College Green in December 1978. Inmos was a UK-government
        chip venture funded with a £50 million cheque; it produced the
        transputer, the first microprocessor designed for parallel and
        distributed computing, and seeded a long list of spin-outs.
        XMOS demerged from that lineage in 2005. Graphcore demerged
        from XMOS in 2016. The cluster runs on the same architectural
        idea (many small concurrent processors, message-passing fabric
        between them) across forty years and three companies.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/David_May_(computer_scientist)"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              David May{arrow}
            </a>
          </strong>{" "}
          &mdash; lead architect of the Inmos transputer; co-designer
          of the occam concurrent programming language; co-founder
          and CTO of XMOS from 2005 to February 2014; Professor of
          Computer Science at Bristol. Holds fifty-four patents. The
          person around whom the Bristol cluster is built.
        </li>
        <li>
          <strong>
            <a
              href="https://www.graphcore.ai/nigel-toon"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Nigel Toon{arrow}
            </a>
          </strong>{" "}
          &mdash; co-founder and CEO of Graphcore. Previously CEO of
          XMOS (2012&ndash;2016), CEO of picoChip (Bath), co-founder
          of Icera (Bristol/Cambridge, sold to Nvidia for $367 million
          in 2011), and Altera Europe before any of that. The serial
          CEO of the Bristol cluster.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Graphcore"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Simon Knowles{arrow}
            </a>
          </strong>{" "}
          &mdash; co-founder and CTO of Graphcore, the chip architect
          of the Intelligence Processing Unit (IPU). Originally an
          Inmos transputer engineer; carried the message-passing
          fabric idea through Element 14, picoChip, Icera and
          eventually Graphcore. Exited the company a year after the
          October 2024 SoftBank acquisition.
        </li>
        <li>
          <strong>
            <a
              href="https://www.bluwireless.com/about-us/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Henry Nurser &amp; Mark Barrett &mdash; Blu Wireless{arrow}
            </a>
          </strong>{" "}
          &mdash; the other Inmos descendant in Bristol. Mark Barrett
          co-founded the company in 2009 as Chief Strategy Officer; he
          has forty years in wireless radar, satellite, cellular and
          telecoms. Henry Nurser is CEO and co-founder. Blu Wireless
          ships mmWave system-on-chip parts for 5G private networks,
          defence backhaul and high-speed-rail trackside connectivity
          &mdash; the wireless half of the cluster.
        </li>
      </ul>

      <p>
        May and Toon are the senior pair: chief architect and
        chief executive of the same line of work across three
        successive companies. Knowles is the technical through-line.
        The Bristol cluster&rsquo;s coherence is the message-passing
        fabric idea, persisted across forty years. The cluster also
        spun out picoChip, Meiko, PixelFusion, Motion Media
        Technology, Division and Gnodal at various points; not all
        survived, but the engineering rolodex did.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pair 5 &mdash; Cambridge Silicon Radio &amp; the Qualcomm site
      </h2>

      <p>
        Cambridge Silicon Radio (CSR) was the Bluetooth chip business.
        Spun out of Cambridge Consultants in 1998 by Phil O&rsquo;Donovan,
        James Collier, Glenn Collinson and six others, it grew from a
        nine-person start-up into a FTSE 250 listed fabless
        semiconductor company with more than two thousand staff in
        twenty-three locations by 2015. The first single-chip Bluetooth
        part shipped in 2001 (BlueCore01) and the line went on to
        dominate the headset and earpiece market. Qualcomm acquired
        the business for $2.5 billion in 2015; the Cambridge site
        continues today under Qualcomm branding and is the spine of
        Qualcomm&rsquo;s UK presence.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Phil_O%27Donovan"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Phil O&rsquo;Donovan{arrow}
            </a>
          </strong>{" "}
          &mdash; CSR co-founder and Managing Director; the operator
          who grew the company from nine people to a FTSE 250 listing.
          Fellow of the Royal Academy of Engineering since 2017; now
          a mentor at the Academy&rsquo;s Enterprise Hub.
        </li>
        <li>
          <strong>
            <a
              href="https://cambridgephenomenon.com/showcase/bluetooth-csr/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              James Collier &amp; Glenn Collinson{arrow}
            </a>
          </strong>{" "}
          &mdash; the other two named CSR co-founders, both ex-Cambridge
          Consultants. Their work made commodity-CMOS Bluetooth
          possible at the chip level.
        </li>
        <li>
          <strong>
            <a
              href="https://www.qualcomm.com/company/locations/united-kingdom"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Qualcomm UK &mdash; the ex-CSR Cambridge site{arrow}
            </a>
          </strong>{" "}
          &mdash; the St John&rsquo;s Innovation Park building CSR
          occupied is still in use under Qualcomm branding. The line
          of work continues: Bluetooth, audio SoC, low-power radio.
          The most visible American-owned silicon office in the
          Cambridge belt.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Ip.access"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              ip.access &mdash; the small-cell cousin{arrow}
            </a>
          </strong>{" "}
          &mdash; founded in December 1999 as a wholly-owned subsidiary
          of TTP Group, relocated to Cambourne Business Park in 2006.
          Stephen Mallinson was founding CEO for eleven years; Andy
          Tiller was SVP of Product Management and Marketing.
          Small-cell radios for indoor and enterprise mobile coverage.
          The other piece of the Cambridge wireless-silicon picture.
        </li>
      </ul>

      <p>
        O&rsquo;Donovan and Mallinson are a pair by adjacency, not by
        company &mdash; two Cambridge wireless-silicon CEOs of the
        same decade, one building a public-listed Bluetooth giant,
        the other a private small-cell house, both operating inside a
        ten-mile radius. The Qualcomm site is the long tail of CSR.
        The cluster keeps producing wireless silicon under different
        flags.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pair 6 &mdash; The academic shoulder
      </h2>

      <p>
        Every cluster needs an academic anchor that supplies headcount,
        publishes the methods and serves on the board of half the
        companies in the rolodex. The UK has two: the Cambridge
        Department of Computer Science and Technology (formerly the
        Computer Laboratory), and the University of Bristol Department
        of Computer Science. Their chairs and emeritus professors
        appear on the founding documents of most of the companies
        listed above. The pair below is the cleanest example of the
        academic-to-industry pipeline this scene depends on.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.cl.cam.ac.uk/~ah12/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Sir Andy Hopper{arrow}
            </a>
          </strong>{" "}
          &mdash; Professor of Computer Technology at Cambridge; Head
          of the Computer Laboratory 2004&ndash;2018; Vice-President
          of the Royal Society. The companies on his CV include
          Orbis, Acorn, Olivetti Research Lab, Virata, Solarflare,
          Ubisense, RealVNC and lowRISC. The Cambridge academic
          shoulder for chip design, full stop.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/David_May_(computer_scientist)"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              David May (the Bristol counterpart){arrow}
            </a>
          </strong>{" "}
          &mdash; the Bristol opposite number. Inmos transputer
          architect, XMOS CTO, Bristol professor. The figure around
          whom the Bristol cluster organises itself; the chair whose
          students populate XMOS, Blu Wireless, Graphcore and the rest
          of the Inmos diaspora.
        </li>
        <li>
          <strong>
            <a
              href="https://www.microsoft.com/en-us/research/people/awf/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Andrew Fitzgibbon{arrow}
            </a>
          </strong>{" "}
          &mdash; Partner Scientist on HoloLens at Microsoft Cambridge.
          Core contributor to the Emmy-winning camera-tracker boujou
          (which he co-founded with Andrew Zisserman as 2d3), to the
          Kinect synthetic-training-data pipeline, and science lead on
          the real-time hand tracking in HoloLens. The most decorated
          UK-resident graphics-and-vision engineer at the
          chip-adjacent side of the picture &mdash; not silicon
          design, but the algorithms that the silicon ends up running.
        </li>
      </ul>

      <p>
        Hopper and May are the chairs whose handwriting is on the
        cluster. Fitzgibbon is the example of what the cluster
        produces when graphics, vision and embedded silicon are
        co-designed in the same lab. The studio cares because every
        rig in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          why I build my own rigs
        </Link>{" "}
        is the descendant of work like this; the chips on those
        rigs were architected by people who passed through these
        chairs.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Walking back out
      </h2>

      <p>
        Six pairs, two cities and a Hertfordshire industrial estate.
        The map fits inside the South East with one outlier in Bristol
        and one in Kings Langley. The studio reads this scene from a
        bench in London that runs on Imagination GPU IP somewhere in
        its phone stack, on Bluetooth that traces back to CSR, on
        InfiniBand that traces back to Mellanox UK, on the academic
        groups that publish the algorithms the rest of the work
        rests on. Naming the people behind each box on the diagram is
        the second discipline; crediting the ladder up is the first.
      </p>

      <p>
        The route the studio recommends is to read{" "}
        <Link href="/articles/whos-who-uk-arm-people" className={ext}>
          the Arm history
        </Link>{" "}
        first so the radius makes sense, then this article, then{" "}
        <Link href="/articles/whos-who-uk-cpu-chip-people" className={ext}>
          the broader UK CPU and chip people
        </Link>{" "}
        for everyone the pair structure here had to leave on the
        cutting-room floor. After that,{" "}
        <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
          on the shoulders of open source
        </Link>{" "}
        for the toolchains that knit it all together.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Cross-references
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-arm-people" className={ext}>
            Who&rsquo;s Who: Arm Holdings + the Cambridge silicon scene
          </Link>{" "}
          &mdash; the sibling history of the radius this article sits
          inside.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-cpu-chip-people" className={ext}>
            Who&rsquo;s Who: UK CPU &amp; chip people
          </Link>{" "}
          &mdash; the broader sibling that catches what doesn&rsquo;t
          fit a pair format.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            Who&rsquo;s Who: UK AI people
          </Link>{" "}
          &mdash; where Pantić, Blake and Fitzgibbon also appear in
          their other capacities.
        </li>
        <li>
          <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
            Why I build my own rigs
          </Link>{" "}
          &mdash; the studio&rsquo;s position on the hardware these
          chips end up inside.
        </li>
        <li>
          <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
            On the shoulders of open source
          </Link>{" "}
          &mdash; the toolchains that knit the silicon to the software.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources &amp; Further Reading
      </h2>

      <p className="mt-4 text-sm text-chrome-400">
        Every claim above is anchored to a public URL. Grouped by
        domain for audit.
      </p>

      <h3 className="mt-6 text-lg text-chrome-200">
        research.samsung.com / news.samsung.com
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://research.samsung.com/aicenter_cambridge"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Samsung AI Center Cambridge{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://news.samsung.com/global/samsung-opens-global-ai-centers-in-the-u-k-canada-and-russia"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Samsung opens global AI centres in the UK, Canada and Russia
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://research.samsung.com/research-achievements/aicenter_cambridge"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Samsung AI Center Cambridge &mdash; research achievements
            {arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">
        imaginationtech.com
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.imaginationtech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination Technologies{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imaginationtech.com/news/imagination-technologies-group-ltd-announces-new-ceo-simon-beresford-wylie/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination announces new CEO Simon Beresford-Wylie{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.imaginationtech.com/news/imagination-launches-risc-v-cpu-family/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination launches the Catapult RISC-V CPU family{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">nvidia.com / blogs.nvidia.com</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://blogs.nvidia.com/blog/arm-ai-research-center-cambridge-uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Nvidia and Arm to create AI research centre in Cambridge
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.nvidia.com/en-gb/industries/healthcare-life-sciences/cambridge-1/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Inside Cambridge-1{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://nvidianews.nvidia.com/news/nvidia-building-uks-most-powerful-supercomputer-dedicated-to-ai-research-in-healthcare"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Nvidia announces Cambridge-1 supercomputer for healthcare
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://blogs.nvidia.com/blog/author/giladshainer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Gilad Shainer &mdash; author page, Nvidia networking{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://find-and-update.company-information.service.gov.uk/company/06251613"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mellanox Technologies UK Ltd &mdash; Companies House{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">graphcore.ai / xmos / blu wireless</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.graphcore.ai/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Graphcore &mdash; staff, investors and mission{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.graphcore.ai/nigel-toon"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Nigel Toon &mdash; Graphcore profile{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bristol.ac.uk/research/impact/ref-2021-xmos/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            REF 2021 &mdash; XMOS, University of Bristol{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bluwireless.com/about-us/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Blu Wireless &mdash; about us{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bluwireless.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Blu Wireless &mdash; mmWave technology{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">cambridge wireless &amp; small-cell</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://cambridgephenomenon.com/showcase/bluetooth-csr/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bluetooth &amp; CSR &mdash; Cambridge Phenomenon{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://raeng.org.uk/about-us/fellowship/new-fellows-2017/philip-o-donovan"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Philip O&rsquo;Donovan &mdash; Royal Academy of Engineering
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.qualcomm.com/company/locations/united-kingdom"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Qualcomm UK office locations{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.ipaccess.com/newsrelease/87/ip.access+appoints+new+Chairman+and+further+strengthens+management+team+with+new+Senior+VP+of+Worldwide+Sales+and+Marketing+"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ip.access &mdash; press release{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">en.wikipedia.org</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Hossein_Yassaie"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Hossein Yassaie{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Imagination_Technologies"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination Technologies{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Graphcore"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Graphcore{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/XMOS"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            XMOS{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/David_May_(computer_scientist)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            David May{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Phil_O%27Donovan"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Phil O&rsquo;Donovan{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/CSR_plc"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CSR plc{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Ip.access"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ip.access{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Mellanox_Technologies"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mellanox Technologies{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Andy_Hopper"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andy Hopper{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Maja_Panti%C4%87"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Maja Pantić{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">universities &amp; institutional pages</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://ibug.doc.ic.ac.uk/maja/biography/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Maja Pantić &mdash; iBUG biography, Imperial College
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.surrey.ac.uk/people/tao-xiang"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tao Xiang &mdash; University of Surrey{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.microsoft.com/en-us/research/people/ablake/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andrew Blake &mdash; Microsoft Research{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.microsoft.com/en-us/research/people/awf/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andrew Fitzgibbon &mdash; Microsoft Research HoloLens{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.cl.cam.ac.uk/~ah12/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andy Hopper &mdash; Cambridge Computer Lab home page{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://uniphy.global/team/sir-hossein-yassaie/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sir Hossein Yassaie &mdash; Uniphy team page{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">press &amp; scene</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.electronicsweekly.com/news/business/imagination-zceo-to-retire-as-controversy-swirls-around-china-links-2025-01/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination CEO to retire &mdash; Electronics Weekly{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://cssbristol.co.uk/events/2022-10-18-david-may-talk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Inmos, the transputer and Bristol&rsquo;s tech cluster
            &mdash; CSS Bristol{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://techspark.co/where-did-the-bristol-and-bath-tech-cluster-come-from/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Where did the Bristol &amp; Bath tech cluster come from
            &mdash; techSPARK{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://sciencebusiness.net/news/73219/Transputer-inventor-gets-funding-for-his-latest-semiconductor-start-up"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Transputer inventor gets funding for latest start-up
            &mdash; Science|Business{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.computerweekly.com/feature/CW50-The-Great-British-chip-invention"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CW@50: The great British chip invention &mdash; Computer
            Weekly{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.cambridgeindependent.co.uk/education/samsung-opens-new-ai-centre-in-cambridge-9052417/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Samsung opens new AI centre in Cambridge &mdash; Cambridge
            Independent{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record. Every named person resolves to at least one
 * public URL (their own institutional page, Wikipedia, an industry
 * press piece, Companies House, or their company&rsquo;s own news
 * release).
 *
 * Judgement calls observed:
 *
 *   - Pair 3 (Nvidia UK) was downgraded from a proper pair to a single
 *     section. The Cambridge AI Lab, the Cambridge-1 supercomputer,
 *     the Bristol R&amp;D site and the Mellanox UK Reading entity are
 *     all publicly verifiable, but the public record does not name a
 *     UK-resident Nvidia silicon architect. Gilad Shainer
 *     (ex-Mellanox, now Nvidia SVP Networking) is named as the public
 *     face of the networking line but flagged as non-UK-resident.
 *
 *   - Sequans (originally suggested as part of the RF / modem pair) is
 *     headquartered in Paris and the UK link is thin in public
 *     sources. The pair was rebuilt as CSR + ip.access, both
 *     genuinely Cambridge-resident.
 *
 *   - Marvell UK (also originally suggested) does not surface a
 *     UK-resident named engineer at the level of citability the rest
 *     of the article runs at. Left off to avoid invention.
 *
 *   - The academic-industry pair landed on Hopper + May rather than
 *     a Cambridge-only pairing because the Bristol cluster is half
 *     the story and David May is its anchoring chair.
 */
export const entry: Entry = {
  slug: "whos-who-uk-gpu-adjacents",
  title:
    "Who's Who: UK GPU + silicon-adjacent people",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Six kindred pairs of UK practitioners across Samsung AI Cambridge, Imagination, Nvidia UK, the Bristol cluster (Inmos → XMOS → Graphcore), CSR/Qualcomm Cambridge, and the academic shoulder that feeds all of them. Real people, public URLs, no invented credits.",
  Body: WhosWhoUkGpuAdjacents,
  related: [
    {
      href: "/articles/whos-who-uk-arm-people",
      label: "Who's Who: Arm Holdings + the Cambridge silicon scene",
      note: "The sibling history of the radius this article sits inside.",
    },
    {
      href: "/articles/whos-who-uk-cpu-chip-people",
      label: "Who's Who: UK CPU & chip people",
      note: "The broader sibling.",
    },
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "Who's Who: UK AI people",
      note: "Where Pantić, Blake and Fitzgibbon also appear.",
    },
    {
      href: "/articles/why-i-build-my-own-rigs",
      label: "Why I build my own rigs",
      note: "The hardware these chips end up inside.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the shoulders of open source",
      note: "The toolchains that knit it all together.",
    },
  ],
  furtherReading: [
    {
      href: "https://research.samsung.com/aicenter_cambridge",
      label: "Samsung AI Center Cambridge",
      note: "The centre's own page.",
    },
    {
      href: "https://www.imaginationtech.com/",
      label: "Imagination Technologies",
      note: "PowerVR GPU IP + Catapult RISC-V CPU lines.",
    },
    {
      href: "https://www.graphcore.ai/about",
      label: "Graphcore — staff, investors and mission",
      note: "The IPU and the Bristol-Cambridge AI-accelerator line.",
    },
    {
      href: "https://cssbristol.co.uk/events/2022-10-18-david-may-talk/",
      label: "Inmos, the transputer and Bristol's tech cluster",
      note: "The clearest single talk on the Bristol lineage.",
    },
    {
      href: "https://cambridgephenomenon.com/showcase/bluetooth-csr/",
      label: "Bluetooth & CSR — Cambridge Phenomenon",
      note: "The CSR-to-Qualcomm story, Cambridge side.",
    },
  ],
};
