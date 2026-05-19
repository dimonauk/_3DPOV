import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkArmPeople() {
  return (
    <>
      <p>
        The Princess pours a small cup of tea and points at a turkey
        barn in Cambridgeshire. Inside the barn, in the autumn of 1990,
        twelve engineers from Acorn Computers are unpacking desks they
        carried in themselves. The company they are starting is called
        Advanced RISC Machines. Forty years later more than three
        hundred billion of their chips have shipped, and almost every
        phone, watch, fridge, drone and car you can name runs on a
        descendant of the instruction set one of them sketched at her
        desk over the lunch hour.
      </p>

      <p>
        This article walks the history in ten chapters and pins the
        real people to each one. The point is not to canonise Arm; the
        point is to make legible the Cambridge silicon scene that
        radiates outward from Fulbourn Road. The studio cares because
        every piece of hardware it touches &mdash; the rigs in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          why I build my own rigs
        </Link>
        , the boards behind the LED traces, the phones the audience
        watches the work on &mdash; runs on Arm cores, and most of the
        engineers who designed those cores live or once lived inside an
        hour of King&rsquo;s Cross. The rest of the global chip diaspora
        was seeded from here. Every name below is verifiable by public
        URL. No invented credits.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 1 &mdash; Acorn, 1985
      </h2>

      <p>
        The story begins not at Arm but at Acorn Computers, a startup
        Hermann Hauser and Chris Curry had built around the BBC Micro.
        The Acorn team needed a faster processor for their next machine
        and could not find one on the market they liked, so they did
        the unreasonable thing and designed their own. Three people on
        a project: an instruction set, a chip design, and a working
        prototype delivered in months on a budget that would not buy a
        single mask set today. The chip they made was called the Acorn
        RISC Machine. It powered the BBC Micro as a second processor in
        1986 and the Acorn Archimedes in 1987.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Sophie_Wilson"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Sophie Wilson{arrow}
            </a>
          </strong>{" "}
          &mdash; designed the original ARM instruction set at her
          desk at Acorn, wrote the simulator, and authored BBC BASIC
          before that. The architecture she sketched in 1983 is now the
          most widely used processor architecture in the world.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Steve_Furber"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Steve Furber{arrow}
            </a>
          </strong>{" "}
          &mdash; turned Wilson&rsquo;s instruction set into silicon. Co-
          designed the BBC Micro. Now Emeritus ICL Professor of
          Computer Engineering at Manchester; see chapter ten for what
          he did next.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Hermann_Hauser"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Hermann Hauser{arrow}
            </a>
          </strong>{" "}
          &mdash; co-founded Acorn with Chris Curry in 1978, signed off
          on the ARM project, and was instrumental in spinning the team
          out in 1990. Co-founded{" "}
          <a
            href="https://www.amadeuscapital.com/team/hermann-hauser/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Amadeus Capital Partners{arrow}
          </a>{" "}
          in 1997, which has since funded a meaningful slice of the
          UK deep-tech roster.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Andy_Hopper"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Andy Hopper{arrow}
            </a>
          </strong>{" "}
          &mdash; Research Director of Acorn 1979&ndash;85, helped
          conceive the ARM project, and went on to head the Cambridge
          Computer Lab 2004&ndash;18. Vice-President of the Royal
          Society. The Cambridge end of the academic shoulder.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 2 &mdash; The spin-out, 1990
      </h2>

      <p>
        Apple was looking for a low-power processor for the Newton and
        had taken a shine to the Acorn part. Acorn was a competitor in
        education and could not sell to them directly, so the three-way
        deal was hatched in the autumn of 1990: Acorn, Apple, and VLSI
        Technology co-funded a new joint venture called Advanced RISC
        Machines Ltd. Twelve engineers walked across from Acorn into
        the turkey barn at Harvey&rsquo;s Farm, Cherry Hinton. Apple put
        in $1.5 million. The Newton came out, did not set the world on
        fire, and the company nearly died &mdash; until the new chief
        executive realised the way out was not to sell chips but to
        license the designs.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Robin_Saxby"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Sir Robin Saxby{arrow}
            </a>
          </strong>{" "}
          &mdash; first CEO, 1991&ndash;2001. The man who decided Arm
          would license IP rather than fab silicon. That single
          decision is the reason the company exists today.
        </li>
        <li>
          <strong>
            <a
              href="https://archivesit.org.uk/interviews/simon-segars/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              The original twelve{arrow}
            </a>
          </strong>{" "}
          &mdash; Jamie Urquhart, Mike Muller, Tudor Brown, Lee Smith,
          John Biggs, Harry Oldham, Dave Howard, Pete Harrod, Harry
          Meekings, Al Thomas, Andy Merritt and David Seal. The
          founding engineering staff.
        </li>
        <li>
          <strong>
            <a
              href="https://www.newelectronics.co.uk/content/interviews/mike-muller-chief-technology-officer-arm/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Mike Muller{arrow}
            </a>
          </strong>{" "}
          &mdash; co-founder, VP Marketing 1992&ndash;96, EVP Business
          Development, then Chief Technology Officer from October 2000.
          Drove the strategic direction of the Cortex era.
        </li>
        <li>
          <strong>
            <a
              href="https://www.businessweekly.co.uk/tech-trail/tech-profiles/arm-mighty-oak-grew-acorn"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Tudor Brown{arrow}
            </a>
          </strong>{" "}
          &mdash; co-founder, served as President, COO, EVP
          Development, CTO and Engineering Director across his career
          at Arm. The continuous engineering spine of the early decades.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 3 &mdash; Mobile dominance, the 2000s
      </h2>

      <p>
        Through the late 1990s and early 2000s the licensing model
        compounded. ARM7TDMI became the brain of the first generation
        of feature phones and then of the iPod. ARM9 and ARM11 carried
        the practice into the smartphone era. When Cortex-A arrived in
        2005 it cleanly separated the family into application
        processors (the A series, big and fast), real-time controllers
        (the R series) and microcontrollers (the M series, small and
        cheap). The M series is the one that ended up everywhere &mdash;
        in your fridge, your watch, your earbuds, your central heating
        controller. By 2010 Arm was inside ninety-five per cent of the
        world&rsquo;s mobile phones.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Simon_Segars"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Simon Segars{arrow}
            </a>
          </strong>{" "}
          &mdash; joined Arm in 1991 as the sixteenth employee, led the
          development of the ARM7 and ARM9 cores that powered the first
          digital mobile phones, became VP Engineering in 2001, and was
          CEO from July 2013 to February 2022. Steered the SoftBank
          acquisition in 2016. Elected Fellow of the Royal Society in
          2024.
        </li>
        <li>
          <strong>
            <a
              href="https://www.linkedin.com/in/josephyiu/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Joseph Yiu{arrow}
            </a>
          </strong>{" "}
          &mdash; Distinguished Engineer, system architecture, Arm.
          Joined in 2001, moved to the processor division in 2005, and
          has worked on a wide swathe of Cortex-M processor and
          design-kit projects since. Wrote the definitive reference
          guides to Cortex-M0, M3 and M4. The Cortex-M family&rsquo;s
          most public technical author.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Sophie_Wilson"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Sophie Wilson, again{arrow}
            </a>
          </strong>{" "}
          &mdash; the parallel thread. While Arm was scaling, Wilson
          and six others spun Acorn&rsquo;s DSP work out as Element 14
          in 1999, which Broadcom bought in 2000 for $450 million.
          Firepath, the SIMD LIW processor she architected there, went
          on to win 75% of the world&rsquo;s central-office DSL
          business. She has been at Broadcom Cambridge ever since.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 4 &mdash; big.LITTLE, 2011
      </h2>

      <p>
        By the early 2010s the problem was no longer raw performance;
        it was battery. The answer Arm landed on was structural: pair a
        small, slow, power-frugal core with a big, fast, hungry one,
        let the operating system migrate threads between them as the
        load changes, and burn watts only when watts are needed. The
        scheme was called big.LITTLE. The Cortex-A7 and the Cortex-A15
        were the first pairing. The maths needed both microarchitectures
        to be binary-compatible and to share the same instruction set
        extensions, so the same task could resume on the other core
        mid-execution.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.anandtech.com/show/7574/ask-the-experts-arms-cortex-a53-lead-architect-peter-greenhalgh"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Peter Greenhalgh{arrow}
            </a>
          </strong>{" "}
          &mdash; lead architect of the Cortex-A7 and Cortex-A53. Led
          the development and deployment of big.LITTLE. Previously
          owned key units in the Cortex-R4, Cortex-A5 and Cortex-A8
          microarchitectures. Now SVP Technology and Fellow at Arm.
          Holds twenty CPU microarchitecture patents.
        </li>
        <li>
          <strong>
            <a
              href="https://old.hotchips.org/wp-content/uploads/hc_archives/hc29/HC29.22-Tuesday-Pub/HC29.22.80-Architectdure-Pub/HC29,22,820-DynamiQ-Greenhaigh-ARM.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              DynamiQ {arrow}
            </a>
          </strong>{" "}
          &mdash; the 2017 evolution of big.LITTLE that Greenhalgh
          presented at Hot Chips 29. A single cluster can mix up to
          eight cores of different microarchitectures, sharing a
          coherent L3. The current shape of every Cortex-A part you
          will meet.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 5 &mdash; Server and Neoverse, 2018 onward
      </h2>

      <p>
        Arm in the data centre had been a recurrent rumour since 2010
        and a recurrent disappointment. The decisive turn came in
        October 2018 when Arm announced the Neoverse roadmap as a
        dedicated infrastructure line, separate from the Cortex-A
        family, with annual cadence and a clear performance target.
        AWS unveiled Graviton at re:Invent the following month, built
        on the Neoverse Cosmos platform by Annapurna Labs, the Israeli
        team AWS had acquired in 2015. By 2024 more than half of new
        CPU capacity going into the AWS fleet was Graviton. The
        rumour was finally true.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://newsroom.arm.com/author/drew-henry"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Drew Henry{arrow}
            </a>
          </strong>{" "}
          &mdash; founding general manager of Arm&rsquo;s Infrastructure
          Line of Business 2017&ndash;19. Guided the launch of Neoverse
          and established Arm as a serious cloud architecture.
        </li>
        <li>
          <strong>
            <a
              href="https://newsroom.arm.com/news/arm-and-aws-working-together-to-reinvent-the-cloud"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Annapurna Labs &mdash; Billy Hrvoye and Nafea Bshara{arrow}
            </a>
          </strong>{" "}
          &mdash; the AWS silicon team that designs Graviton. Israeli-
          founded, not UK, but listed here because the chip they build
          is the lever that pulls Neoverse into the world.
        </li>
        <li>
          <strong>
            <a
              href="https://fuse.wikichip.org/news/1751/arm-targets-data-centers-with-new-roadmaps-architectures-and-standards/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Neoverse N1, V1, V2 &mdash; the platform team{arrow}
            </a>
          </strong>{" "}
          &mdash; the Cambridge, Austin and Sophia Antipolis design
          centres collectively. Annual cadence; named platforms at each
          step.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 6 &mdash; NEON and SVE
      </h2>

      <p>
        Vector extensions are the part of an instruction set that lets
        a single instruction operate on a wide register full of data at
        once. NEON arrived with ARMv7 in 2005 and made the smartphone
        possible at the codec level &mdash; H.264, audio decoders,
        camera pipelines, everything that pushes pixels by the lane.
        SVE, the Scalable Vector Extension, came a decade later and
        broke the fixed-width assumption: code is written once and runs
        on any vector width from 128 to 2048 bits in 128-bit increments.
        The decisive deployment was Fujitsu&rsquo;s A64FX in 2019, which
        powered the Fugaku supercomputer to the top of the TOP500.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://arxiv.org/abs/1803.06185"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Nigel Stephens{arrow}
            </a>
          </strong>{" "}
          &mdash; Lead ISA Architect and Arm Fellow. First author on
          the 2018 paper that documented the Scalable Vector Extension.
          Ran the multi-year project across Arm Research and the
          Architecture and Technology group; presented NEON before that.
        </li>
        <li>
          <strong>
            <a
              href="https://developer.arm.com/community/arm-research/b/articles/posts/the-arm-scalable-vector-extension-sve"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              The SVE paper team{arrow}
            </a>
          </strong>{" "}
          &mdash; Stephens plus twelve named co-authors from Arm
          Cambridge, Arm Austin and the research arm. The clearest
          public roster of vector-extension authorship.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 7 &mdash; Mali GPU, 2006 onward
      </h2>

      <p>
        Arm did not build a GPU in-house; it bought one. In June 2006
        the company acquired Falanx Microsystems in Trondheim, a spin-
        out of a Norwegian University of Science and Technology
        research project, and renamed it Arm Norway. The product line
        was already called Mali &mdash; Serbo-Croatian for &ldquo;small
        &rdquo;, the team thought it suited a mobile GPU. The Utgard
        family (Mali-200 through 470) led to Midgard, then Bifrost in
        2016, then Valhall in 2019. Cambridge and Austin contributed
        engineering across all four generations. By 2014 more than half
        of all Android phones shipped with a Mali.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Arm_Norway"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Arm Norway (formerly Falanx Microsystems){arrow}
            </a>
          </strong>{" "}
          &mdash; the Trondheim office. Continues to develop the Mali
          architecture in collaboration with Cambridge and Austin.
        </li>
        <li>
          <strong>
            <a
              href="https://old.hotchips.org/wp-content/uploads/hc_archives/hc28/HC28.22-Monday-Epub/HC28.22.10-GPU-HPC-Epub/HC28.22.110-Bifrost-JemDavies-ARM-v04-9.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Jem Davies{arrow}
            </a>
          </strong>{" "}
          &mdash; Arm Fellow, VP and GM of the Media Processing Group
          and later the Machine Learning Group. Presented Bifrost at
          Hot Chips 28 in 2016. Generally credited as the figure who
          made Mali a market-leading GPU line.
        </li>
        <li>
          <strong>
            <a
              href="https://www.imaginationtech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Imagination Technologies &mdash; the Cambridge GPU cousin
              {arrow}
            </a>
          </strong>{" "}
          &mdash; PowerVR, the GPU that powered every iPhone before
          Apple went in-house. Headquartered in Kings Langley,
          Hertfordshire. Sir Hossein Yassaie was CEO 1998&ndash;2016 and
          built the IP business that put Imagination&rsquo;s graphics
          into tens of billions of devices.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 8 &mdash; Ethos NPU, 2019 onward
      </h2>

      <p>
        The neural processing unit is the recent addition to the Arm
        IP catalogue. The Ethos line splits into the Ethos-N family
        (larger, paired with Cortex-A) and the Ethos-U family (much
        smaller, paired with Cortex-M for always-on inference on
        microcontrollers). Ethos-U55 launched in 2020 and Ethos-U65 in
        2021 with double the performance. The accelerators sit
        alongside the CPU as a coprocessor; the toolchain compiles
        TensorFlow Lite Micro models down to the NPU&rsquo;s tiny
        instruction set. Linux kernel support is landing for 6.19.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://www.eenewseurope.com/en/jem-davies-of-arm-talks-machine-learning/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Jem Davies (machine learning era){arrow}
            </a>
          </strong>{" "}
          &mdash; moved from leading Arm&rsquo;s graphics and vision
          business to lead machine learning, which became Project
          Trillium and then the Ethos product line. Same Fellow as
          chapter seven, second act.
        </li>
        <li>
          <strong>
            <a
              href="https://www.arm.com/products/silicon-ip-cpu/ethos/ethos-u65"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Ethos-U &mdash; the microNPU line{arrow}
            </a>
          </strong>{" "}
          &mdash; the part the studio actually cares about. The
          Cortex-M-paired accelerator that lets tiny microcontrollers
          run convolutional networks at the watt-budget of a coin cell.
          The line of work that bridges chapter ten and{" "}
          <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
            on the shoulders of open source
          </Link>
          .
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 9 &mdash; Armv9 and confidential compute, 2021
      </h2>

      <p>
        Armv9 was announced in March 2021 as the first new
        architectural baseline in a decade. Two pillars: SVE2 as the
        default vector path (rolling SVE&rsquo;s scalable model into
        every general-purpose Armv9 part) and the Arm Confidential
        Compute Architecture (CCA), which introduces a fourth execution
        world called a Realm. A Realm is created dynamically by ordinary
        software and is opaque to the hypervisor and the host operating
        system. The same memory pages encrypted in flight; the trust
        boundary moves inside the CPU rather than outside it.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://newsroom.arm.com/news/arm-cca-will-put-confidential-compute-in-the-hands-of-every-developer"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Richard Grisenthwaite{arrow}
            </a>
          </strong>{" "}
          &mdash; SVP and Chief Architect at Arm, the public face of
          Armv9 and the CCA. Defined the Realms model and wrote the
          architectural rationale.
        </li>
        <li>
          <strong>
            <a
              href="https://www.arm.com/company/leadership"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Rene Haas{arrow}
            </a>
          </strong>{" "}
          &mdash; CEO since February 2022. Joined Arm in October 2013
          from seven years at Nvidia (where he ran the computing
          products business). Was Arm&rsquo;s Chief Commercial Officer
          before being appointed President of IP Products Group in
          January 2017. Took the company public on Nasdaq in 2023.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Chapter 10 &mdash; The diaspora
      </h2>

      <p>
        Forty years on, the Cambridge-radius silicon scene is denser
        than any other in Europe. Some of that is Arm directly,
        including its alumni who founded or seeded the next wave. Some
        is the wider Acorn diaspora &mdash; Element 14, CSR, ARC, Frontier
        Silicon &mdash; that left the same Mott Building and the same
        pub round the corner. Some is the academic side: Manchester,
        Cambridge, lowRISC, the open hardware projects that pulled the
        next generation of engineers in. Listed below are the verified
        UK-roots threads; the studio holds the line that &ldquo;ex-Arm
        now in California&rdquo; only counts if there is still a UK
        office or a UK lineage to point at.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Steve_Furber"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Steve Furber &mdash; Manchester, SpiNNaker{arrow}
            </a>
          </strong>{" "}
          &mdash; left Acorn in 1990 for the ICL chair at Manchester
          and built the AMULET asynchronous-processor research group.
          SpiNNaker is a million-Arm-core neuromorphic computer
          optimised for spiking neural networks. SpiNNaker 2 is in
          deployment now. The clearest line from Arm to neuromorphic
          research that exists.
        </li>
        <li>
          <strong>
            <a
              href="https://www.amadeuscapital.com/team/hermann-hauser/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Hermann Hauser &mdash; Amadeus Capital Partners{arrow}
            </a>
          </strong>{" "}
          &mdash; co-founded Amadeus in 1997 with Anne Glover; over $1
          billion raised, more than 190 portfolio companies. The
          Cambridge end of the deep-tech VC ladder. Funded CSR,
          Solexa, Icera, and a long list of others.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/Sophie_Wilson"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Sophie Wilson &mdash; Broadcom Cambridge{arrow}
            </a>
          </strong>{" "}
          &mdash; led Element 14 out of Acorn in 1999; Broadcom bought
          the team for $450 million in 2000 and kept the Cambridge
          office. Wilson&rsquo;s Firepath went on to dominate central-
          office DSL. The single most visible Acorn alum still
          shipping silicon from Cambridge.
        </li>
        <li>
          <strong>
            <a
              href="https://en.wikipedia.org/wiki/CSR_plc"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              CSR (Cambridge Silicon Radio){arrow}
            </a>
          </strong>{" "}
          &mdash; Bluetooth IP, spun out of Cambridge Consultants in
          1998 by Phil O&rsquo;Donovan, James Collier, Glenn Collinson
          and six others. Listed on FTSE 250, sold to Qualcomm in 2015
          for $2.5 billion. The site is still in Cambridge under
          Qualcomm branding.
        </li>
        <li>
          <strong>
            <a
              href="https://www.imaginationtech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Imagination Technologies &mdash; Kings Langley{arrow}
            </a>
          </strong>{" "}
          &mdash; PowerVR and the recent Catapult RISC-V CPU line. Not
          ex-Arm, but the parallel UK semiconductor IP house; its
          engineering rolodex overlaps Arm&rsquo;s by a long arc.
        </li>
        <li>
          <strong>
            <a
              href="https://www.graphcore.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Graphcore &mdash; Bristol &amp; Cambridge{arrow}
            </a>
          </strong>{" "}
          &mdash; the IPU. Founded by Nigel Toon and Simon Knowles in
          2016, both of whom came out of Icera (which Hauser had also
          backed; Nvidia bought it in 2011 for $367 million). Acquired
          by SoftBank in October 2024 for more than $600 million,
          which puts it under the same roof as Arm.
        </li>
        <li>
          <strong>
            <a
              href="https://lowrisc.org/news/andy-hopper-joins-lowrisc-cic-board-as-independent-chair/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              lowRISC &mdash; Cambridge{arrow}
            </a>
          </strong>{" "}
          &mdash; the not-for-profit collaborative engineering company
          that produces open-source RISC-V silicon, with Andy Hopper as
          independent chair of the CIC board. The open-hardware end of
          the same shoulder.
        </li>
        <li>
          <strong>
            <a
              href="https://research.manchester.ac.uk/en/publications/spinnaker-a-spiking-neural-network-architecture"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              SpiNNaker research group &mdash; Manchester{arrow}
            </a>
          </strong>{" "}
          &mdash; the academic end of the diaspora. A million Arm
          cores wired into a custom packet-switched fabric to simulate
          spiking neural networks at biological rates. Direct
          Furber-shaped descendant of the original Acorn project.
        </li>
        <li>
          <strong>
            <a
              href="https://www.apple.com/uk/leadership/johny-srouji/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Apple Silicon &mdash; the UK touchpoint{arrow}
            </a>
          </strong>{" "}
          &mdash; the Apple cores are designed primarily in California
          under Johny Srouji, who has been Apple&rsquo;s Chief Hardware
          Officer since 2026. The UK-roots claim here is the
          architecture itself: every Apple M-series and A-series
          processor is built on the Arm instruction set that left
          Cambridge. The fabrication moved; the ISA never did.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Walking back out
      </h2>

      <p>
        Ten chapters, one barn. The point of the route is that almost
        every name in modern consumer silicon traces back to three
        people sat at a desk in Cambridge in 1985 and twelve who
        followed them out of Acorn five years later. The studio reads
        this lineage when it picks the hardware its rigs are built on,
        when it credits the open-source toolchains that ship with every
        Cortex-M, and when it sketches the next piece of work that will
        run on someone&rsquo;s Mali GPU and someone&rsquo;s Ethos NPU.
        Every commit in every IDE the studio touches sits, eventually,
        on a chip a few of these people designed.
      </p>

      <p>
        If the avenue interests you, the order the studio recommends is:
        read{" "}
        <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
          on the shoulders of open source
        </Link>{" "}
        first to know whose work the toolchains rest on, then{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          why I build my own rigs
        </Link>{" "}
        to see how the studio actually uses these chips, then loop back
        to the sibling who&rsquo;s-who articles below for the rest of
        the UK silicon picture. After that, walk past the Castle in
        Cambridge and find the Mott Building.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Cross-references
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-cpu-chip-people" className={ext}>
            Who&rsquo;s Who: UK CPU &amp; chip people
          </Link>{" "}
          &mdash; the sibling, broader than Arm. Forthcoming.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            Who&rsquo;s Who: UK AI people
          </Link>{" "}
          &mdash; Ethos NPU and Project Trillium touch this one.
          Forthcoming.
        </li>
        <li>
          <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
            On the shoulders of open source
          </Link>{" "}
          &mdash; the toolchain credit the studio carries forward.
        </li>
        <li>
          <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
            Why I build my own rigs
          </Link>{" "}
          &mdash; the studio&rsquo;s position on the hardware these
          chips end up inside.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources &amp; Further Reading
      </h2>

      <p className="mt-4 text-sm text-chrome-400">
        Every claim in the chapters above is anchored to a public URL.
        Grouped by domain for audit.
      </p>

      <h3 className="mt-6 text-lg text-chrome-200">arm.com / arm newsroom / developer.arm.com</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://newsroom.arm.com/blog/arm-official-history"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The official history of Arm{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://newsroom.arm.com/news/arm-cca-will-put-confidential-compute-in-the-hands-of-every-developer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm CCA &mdash; confidential compute architecture{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://newsroom.arm.com/news/arm-and-aws-working-together-to-reinvent-the-cloud"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm and AWS &mdash; Re:Invent the cloud{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://developer.arm.com/community/arm-research/b/articles/posts/the-arm-scalable-vector-extension-sve"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm Scalable Vector Extension &mdash; research overview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.arm.com/products/silicon-ip-cpu/ethos/ethos-u65"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ethos-U65 microNPU product page{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.arm.com/company/leadership"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm Leadership{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">en.wikipedia.org</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Sophie_Wilson"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sophie Wilson{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Steve_Furber"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Steve Furber{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Hermann_Hauser"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Hermann Hauser{arrow}
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
            href="https://en.wikipedia.org/wiki/Robin_Saxby"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Robin Saxby{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Simon_Segars"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Simon Segars{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Rene_Haas"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Rene Haas{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Arm_Holdings"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm Holdings{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Arm_Norway"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm Norway (Falanx){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Mali_(processor)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mali (processor){arrow}
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
            href="https://en.wikipedia.org/wiki/Phil_O'Donovan"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Phil O&rsquo;Donovan{arrow}
          </a>
        </li>
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
            href="https://en.wikipedia.org/wiki/Johny_Srouji"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Johny Srouji{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">archivesit.org.uk</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://archivesit.org.uk/acorns-to-oaks-five-personal-stories-behind-acorn-computers-and-arm/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Acorns to Oaks &mdash; five personal stories behind Acorn
            and Arm{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://archivesit.org.uk/interviews/simon-segars/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Simon Segars interview &mdash; Archives of IT{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://archivesit.org.uk/interviews/dr-hermann-hauser/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Hermann Hauser interview &mdash; Archives of IT{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://archivesit.org.uk/interviews/andrew-andy-hopper/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Andy Hopper interview &mdash; Archives of IT{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">academic + technical</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://arxiv.org/abs/1803.06185"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The ARM Scalable Vector Extension &mdash; Stephens et al.,
            2018{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://old.hotchips.org/wp-content/uploads/hc_archives/hc29/HC29.22-Tuesday-Pub/HC29.22.80-Architectdure-Pub/HC29,22,820-DynamiQ-Greenhaigh-ARM.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            DynamiQ &mdash; Peter Greenhalgh, Hot Chips 29{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://old.hotchips.org/wp-content/uploads/hc_archives/hc28/HC28.22-Monday-Epub/HC28.22.10-GPU-HPC-Epub/HC28.22.110-Bifrost-JemDavies-ARM-v04-9.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bifrost GPU architecture &mdash; Jem Davies, Hot Chips 28
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.anandtech.com/show/7574/ask-the-experts-arms-cortex-a53-lead-architect-peter-greenhalgh"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cortex-A53 lead architect Q&amp;A &mdash; AnandTech{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://research.manchester.ac.uk/en/publications/spinnaker-a-spiking-neural-network-architecture"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            SpiNNaker &mdash; spiking neural network architecture
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://lowrisc.org/news/andy-hopper-joins-lowrisc-cic-board-as-independent-chair/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lowRISC &mdash; Andy Hopper joins board{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-200">press + scene</h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://thechipletter.substack.com/p/the-arm-story-part-1-from-acorns-6e2"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Arm Story, Part 1 &mdash; The Chip Letter{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://thechipletter.substack.com/p/the-arm-story-part-2-archimedes-to-4fd"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Arm Story, Part 2 &mdash; Archimedes to Advanced RISC
            Machines{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://thechipletter.substack.com/p/the-arm-story-part-3-creating-a-global-1b0"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Arm Story, Part 3 &mdash; Creating a Global Standard
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.theregister.com/2020/12/01/arm_at_30/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm at 30 &mdash; The Register{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.businessweekly.co.uk/posts/40-years-of-the-arm-chip-from-cambridge-to-the-world"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            40 years of the ARM chip &mdash; Business Weekly{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://fuse.wikichip.org/news/1751/arm-targets-data-centers-with-new-roadmaps-architectures-and-standards/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm targets data centres with Neoverse &mdash; WikiChip Fuse
            {arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.eenewseurope.com/en/jem-davies-of-arm-talks-machine-learning/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jem Davies on Arm machine learning &mdash; eeNews{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://semiengineering.com/one-on-one-mike-muller-2/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            One-on-One with Mike Muller &mdash; Semi Engineering{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.amadeuscapital.com/team/hermann-hauser/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Hermann Hauser &mdash; Amadeus Capital{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.graphcore.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Graphcore{arrow}
          </a>
        </li>
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
      </ul>
    </>
  );
}

/**
 * Colocated entry record. Every named person is anchored to at least
 * one verified public URL (Wikipedia, Arm Newsroom, Archives of IT,
 * Hot Chips proceedings, arXiv, or the practitioner&rsquo;s own
 * institutional page). UK-roots discipline observed: ex-Arm engineers
 * who are now in California with no UK office or UK lineage to point
 * at are deliberately not listed. Apple Silicon is included only via
 * Srouji&rsquo;s leadership page because the lineage claim is the ISA
 * itself, not a UK-resident team. No emails, no portraits, no
 * speculation about identity or affiliation.
 */
export const entry: Entry = {
  slug: "whos-who-uk-arm-people",
  title:
    "Who's Who: Arm Holdings + the Cambridge silicon scene",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Ten chapters of Arm history, from Sophie Wilson's desk at Acorn in 1985 to the Armv9 confidential-compute realms of 2021, with the real people who designed each layer pinned to each chapter. The Cambridge silicon diaspora at the end.",
  Body: WhosWhoUkArmPeople,
  related: [
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the shoulders of open source",
      note: "The toolchain credit the studio carries forward.",
    },
    {
      href: "/articles/why-i-build-my-own-rigs",
      label: "Why I build my own rigs",
      note: "The hardware these chips end up inside.",
    },
    {
      href: "/articles/whos-who-uk-cpu-chip-people",
      label: "Who's Who: UK CPU & chip people",
      note: "The broader sibling. Forthcoming.",
    },
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "Who's Who: UK AI people",
      note: "Where Ethos NPU and Project Trillium touch. Forthcoming.",
    },
  ],
  furtherReading: [
    {
      href: "https://newsroom.arm.com/blog/arm-official-history",
      label: "The official history of Arm — Arm Newsroom",
      note: "The company's own account, useful as anchor.",
    },
    {
      href: "https://thechipletter.substack.com/p/the-arm-story-part-1-from-acorns-6e2",
      label: "The Arm Story — The Chip Letter (three-part series)",
      note: "Independent technical history, well-cited.",
    },
    {
      href: "https://archivesit.org.uk/acorns-to-oaks-five-personal-stories-behind-acorn-computers-and-arm/",
      label: "Acorns to Oaks — Archives of IT",
      note: "Five oral histories from the original founders.",
    },
    {
      href: "https://arxiv.org/abs/1803.06185",
      label: "The ARM Scalable Vector Extension — Stephens et al.",
      note: "The clearest academic roster for chapter six.",
    },
    {
      href: "https://research.manchester.ac.uk/en/publications/spinnaker-a-spiking-neural-network-architecture",
      label: "SpiNNaker — University of Manchester",
      note: "Furber's neuromorphic descendant of the original ARM project.",
    },
  ],
};
