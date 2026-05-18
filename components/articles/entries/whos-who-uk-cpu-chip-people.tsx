import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkCpuChipPeople() {
  return (
    <>
      <p>
        The UK does not fabricate chips at volume any more &mdash; the
        last serious British fab line dates to the Inmos era &mdash;
        but the country has spent four decades exporting the next
        best thing, which is the design of the chip. The architecture.
        The instruction set. The pipeline. The compiler. The licence.
        Cambridge ships the blueprint and Taiwan prints it. The
        people below are the ones who drew the blueprints, taught
        them to others or published them widely enough that the
        reader can follow the line back to its source.
      </p>

      <p>
        This piece sorts by signature move &mdash; the one thing each
        person is best known for, named first, then them. The format
        keeps the article honest. If a name cannot be tied to a clear
        public artefact &mdash; an instruction set, a chip, a
        compiler, a paper, a foundation &mdash; it does not appear
        here. The studio&rsquo;s position on open silicon and shared
        infrastructure sits inside{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>
        ; the reason a small studio cares about whose CPU is in its
        bench is in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>
        .
      </p>

      <p>
        UK boundary call: people whose career-defining chip work was
        done at a UK company or UK university are in; people who were
        born here but did their architecture work abroad are noted as
        diaspora and not entered as a UK practitioner. Real people,
        public URLs, no invented credits, no claimed mentorships of
        the studio. The same brief as every other piece in this
        series.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The ARM architecture lineage
      </h2>

      <p>
        Cambridge, mostly. The original ARM instruction set was drawn
        on graph paper in a back room of Acorn Computers in 1983 and
        every Apple, Android, Nintendo and embedded device since has
        been paying rent on that drawing.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>The ARM instruction set itself &mdash; Sophie
          Wilson</strong>. Co-designer of the original ARM ISA in
          1983, author of BBC BASIC, later Chief Architect of
          Broadcom&rsquo;s Firepath processor. Fellow of the Royal
          Society, CBE. The single most consequential British chip
          designer alive; over 230 billion ARM cores shipped since
          1985, and the instruction set she drafted is the spine of
          all of them.{" "}
          <a
            href="https://royalsociety.org/people/sophie-wilson-12544/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Royal Society fellow page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://computerhistory.org/profile/sophie-wilson/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Computer History Museum profile{arrow}
          </a>
        </li>
        <li>
          <strong>The first ARM silicon &mdash; Steve Furber</strong>.
          Principal designer of the BBC Micro and the first ARM
          processor at Acorn; ICL Professor of Computer Engineering
          (Emeritus) at the University of Manchester, where he leads
          SpiNNaker &mdash; a neuromorphic machine running a million
          ARM cores in parallel to model the human brain. CBE, FRS,
          FREng. If Wilson drew the architecture, Furber made the
          first one work.{" "}
          <a
            href="https://royalsociety.org/people/stephen-furber-11472/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Royal Society fellow page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Steve_Furber"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Steve Furber{arrow}
          </a>
        </li>
        <li>
          <strong>The Acorn-into-Arm spinout &mdash; Hermann
          Hauser</strong>. Co-founder of Acorn Computers in 1978,
          author of the ARM spinout decision in 1990, later founder
          of Amadeus Capital Partners and a steady patron of the
          Cambridge cluster. KBE, FRS. The reason ARM Holdings is a
          standalone IP licensor and not an internal Acorn department.{" "}
          <a
            href="https://www.amadeuscapital.com/team/hermann-hauser/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Amadeus Capital &mdash; Hermann Hauser{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://royalsociety.org/people/hermann-hauser-11593/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Royal Society fellow page{arrow}
          </a>
        </li>
        <li>
          <strong>The ARM research-director years at Acorn &mdash;
          Sir Andy Hopper</strong>. Research Director of Acorn
          1979&ndash;85, conceiver of the project that became the
          ARM microprocessor, later Head of the Cambridge Computer
          Lab 2004&ndash;18 and Treasurer of the Royal Society. Chair
          of lowRISC&rsquo;s board. The senior figure who keeps
          appearing in the citation chain when the open question is
          &ldquo;who steered this thing?&rdquo;{" "}
          <a
            href="https://www.cst.cam.ac.uk/people/ah12"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge CST profile{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://lowrisc.org/news/andy-hopper-joins-lowrisc-cic-board-as-independent-chair/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lowRISC board appointment{arrow}
          </a>
        </li>
        <li>
          <strong>The Arm Holdings founding &mdash; Sir Robin
          Saxby</strong>. Arm&rsquo;s first CEO from 1991, the
          architect of the IP-licensing model that gave Arm its 95
          per cent share of the mobile-phone CPU market. FRS, FREng,
          knighted 2002. Without the licensing model, the architecture
          would have stayed inside Acorn and the world would look
          materially different.{" "}
          <a
            href="https://royalsociety.org/people/robin-saxby-12233/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Royal Society fellow page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://enterprisehub.raeng.org.uk/mentors/sir-robin-saxby-freng/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            RAEng Enterprise Hub profile{arrow}
          </a>
        </li>
        <li>
          <strong>The CTO chair across thirty years &mdash; Mike
          Muller</strong>. Co-founder and Chief Technology Officer of
          Arm Holdings from 1990 to 2019; ran hardware strategy and
          portable products at Acorn before the spinout. The CTO seat
          at Arm was a single body for almost three decades and it
          was his.{" "}
          <a
            href="https://www.itpro.com/business-strategy/careers-training/34434/arm-co-founder-mike-muller-announces-retirement"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            IT Pro &mdash; retirement announcement{arrow}
          </a>
        </li>
        <li>
          <strong>The COO who shipped it &mdash; Tudor Brown
          MBE</strong>. Co-founder of Arm, Principal Engineer at
          founding, CTO then COO then President 2008&ndash;12, FREng.
          Cambridge Electrical Sciences. The engineering-discipline
          spine of the executive team through Arm&rsquo;s
          flotation-to-acquisition decade.{" "}
          <a
            href="https://www.marvell.com/company/leadership/tudor-brown.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Marvell board profile{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.eetimes.com/tudor-brown-lessons-from-arm/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EE Times &mdash; Lessons from Arm{arrow}
          </a>
        </li>
        <li>
          <strong>The Armv6-to-Armv9 architecture &mdash; Richard
          Grisenthwaite</strong>. EVP, Chief Architect and Fellow at
          Arm; led the long-term architecture from Armv6 onwards,
          shipped TrustZone, multiprocessor extensions, virtualisation,
          and partnered with Fujitsu on SVE for Fugaku. Cambridge-
          based. The current Armv9 generation is his programme. If
          you compile against AArch64, you are compiling against an
          ISA he ratified.{" "}
          <a
            href="https://newsroom.arm.com/author/richard-grisenthwaite"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm Newsroom author page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.innovatecambridge.com/steering-committee/richard-grisenthwaite/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Innovate Cambridge steering committee{arrow}
          </a>
        </li>
        <li>
          <strong>The Arm of the present &mdash; Rene Haas</strong>.
          CEO of Arm since February 2022 and a board director;
          ex-Nvidia compute-products GM, joined Arm in 2013, led the
          2023 IPO. American but the seat is in Cambridge; included
          as the current public face of the UK-headquartered company.{" "}
          <a
            href="https://newsroom.arm.com/news/arm-appoints-rene-haas-as-ceo"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm Newsroom &mdash; CEO appointment{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.arm.com/company/leadership"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arm leadership page{arrow}
          </a>
        </li>
        <li>
          <strong>The software side of Arm &mdash; Andrew
          Sloss</strong>. Co-author of <em>ARM System
          Developer&rsquo;s Guide</em> (Morgan Kaufmann, 2004),
          long-serving Arm engineer with the processor since 1987,
          BSc Computer Science, Hertfordshire. The book is the
          reference text from which a generation of ARM systems
          programmers learned the instruction set in working detail.{" "}
          <a
            href="https://shop.elsevier.com/books/arm-system-developers-guide/sloss/978-1-55860-874-0"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Elsevier &mdash; ARM System Developer&rsquo;s Guide{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The GPU lineage
      </h2>

      <p>
        Two companies between them account for most British GPU IP
        in shipped silicon: Imagination Technologies in Kings Langley
        and Arm&rsquo;s Mali team in Cambridge. The lineage runs
        through tile-based deferred rendering on the Imagination
        side, and through the post-PowerVR-licensing world that
        Apple ended in 2017 on the diaspora side.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Tile-based deferred rendering &mdash; Simon
          Fenney</strong>. One of the original architects of the
          1992 &ldquo;Trident Project&rdquo; at what became
          Imagination, the route into the tile-based deferred-rendering
          approach that has powered every PowerVR generation and, by
          extension, every iPhone GPU through to 2017. Still listed
          at the company three decades later.{" "}
          <a
            href="https://blog.imaginationtech.com/back-to-the-start-powervr-25/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination blog &mdash; PowerVR 25{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.imaginationtech.com/news/imagination-powervr-architecture-marks-30-anniversary/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            PowerVR 30th anniversary release{arrow}
          </a>
        </li>
        <li>
          <strong>Imagination as an IP house &mdash; Sir Hossein
          Yassaie</strong>. CEO of Imagination Technologies
          1998&ndash;2016, joined the company in 1992, knighted
          2013 for services to technology. Built the licensing
          business that put PowerVR into the original iPhone and
          every Apple SoC up to the A10. Stepped down 2016 ahead
          of the Apple-departure crisis of 2017.{" "}
          <a
            href="https://en.wikipedia.org/wiki/Hossein_Yassaie"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Hossein Yassaie{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.anandtech.com/show/10019/ceo-of-imagination-technologies-steps-down"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            AnandTech &mdash; departure 2016{arrow}
          </a>
        </li>
        <li>
          <strong>The Mali GPU roadmap &mdash; Jem Davies</strong>.
          Eighteen years at Arm, latterly Arm Fellow and VP of
          Technology in the Media Processing Division, setting the
          Mali GPU and video roadmap; founding GM of Arm&rsquo;s
          Machine Learning Group; four patents in CPU and GPU
          design. Cambridge. Left Arm in 2021. Mali shipped to
          become the world&rsquo;s highest-volume GPU IP under his
          stewardship.{" "}
          <a
            href="https://www.anandtech.com/show/8226/ask-the-experts-arm-fellow-jem-davies-answers-your-gpu-questions"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            AnandTech &mdash; ask the experts (Jem Davies){arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://siliconcatalyst.com/advisor-jem-davies"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Silicon Catalyst advisor page{arrow}
          </a>
        </li>
        <li>
          <strong>Imagination through the Canyon Bridge years
          &mdash; Simon Beresford-Wylie</strong>. CEO of Imagination
          Technologies from late 2010s through the Chinese-ownership
          period; ex-CEO of Arqiva. Announced 2025 retirement. Listed
          because the public-facing leadership of the surviving UK
          GPU IP house is part of the lineage record.{" "}
          <a
            href="https://www.imaginationtech.com/news/imagination-technologies-group-ltd-announces-new-ceo-simon-beresford-wylie/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination press release{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.electronicsweekly.com/news/business/imagination-zceo-to-retire-as-controversy-swirls-around-china-links-2025-01/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Electronics Weekly &mdash; retirement notice{arrow}
          </a>
        </li>
        <li>
          <strong>The GPU compiler bridge &mdash; Andrew
          Richards</strong>. Co-founder and CEO of Codeplay Software
          in Edinburgh, makers of compilers for games consoles,
          special-purpose processors and GPUs since 2002; chaired the
          SYCL standards group; Codeplay acquired by Intel in 2022 to
          anchor oneAPI. Not a chip designer but the person who made
          UK GPUs talk to UK code at scale.{" "}
          <a
            href="https://codeplay.com/company/team/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Codeplay team page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.nextplatform.com/2022/06/01/to-cure-iron-anemia-with-sycl-intel-buys-codeplay/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Next Platform &mdash; Intel buys Codeplay{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The AI accelerator lineage
      </h2>

      <p>
        The British answer to Nvidia is a Bristol startup that
        designed an Intelligence Processing Unit on the assumption
        that AI workloads are graph workloads, not dense linear
        algebra. The mathematics behind that choice overlaps with{" "}
        <Link
          href="/articles/the-mathematics-of-morphing"
          className={ext}
        >
          The Mathematics of Morphing
        </Link>{" "}
        more than is generally acknowledged.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>The IPU itself &mdash; Simon Knowles</strong>.
          Co-founder and CTO of Graphcore in Bristol; previously
          co-founder of Icera (sold to Nvidia for $367M in 2011) and
          a long career at Element 14 and STMicroelectronics. The
          architectural choice to build for graphs rather than
          tensors is his signature.{" "}
          <a
            href="https://www.graphcore.ai/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Graphcore &mdash; about{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Graphcore"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Graphcore{arrow}
          </a>
        </li>
        <li>
          <strong>The Graphcore company &mdash; Nigel Toon</strong>.
          Co-founder and CEO of Graphcore; previously co-founder of
          Icera, prior career at Altera and Picochip. Acquired by
          SoftBank in July 2024 for around $500m; retained as CEO and
          director. The British AI-silicon company that did not fold
          when the funding round paused.{" "}
          <a
            href="https://www.eetimes.com/ai-chip-startup-graphcore-acquired-by-softbank/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EE Times &mdash; SoftBank acquisition{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.graphcore.ai/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Graphcore &mdash; about{arrow}
          </a>
        </li>
        <li>
          <strong>The transputer-to-XMOS line &mdash; Professor
          David May</strong>. Emeritus Professor of Computer Science
          at Bristol, lead architect of the Inmos transputer (the
          first microprocessor designed for parallel computing) and
          co-designer of the Occam programming language; co-founder
          and CTO of XMOS in 2005. FRS 1990, FREng 2010. The British
          multicore tradition runs through this one person.{" "}
          <a
            href="http://people.cs.bris.ac.uk/~dave/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bristol home page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://royalsociety.org/people/david-may-11915/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Royal Society fellow page{arrow}
          </a>
        </li>
        <li>
          <strong>XMOS as a company &mdash; Ali Dixon</strong>.
          Co-founder of XMOS in 2005, then a Bristol PhD student;
          along with James Foster, Noel Hurley, David May and
          Hitesh Mehta. XMOS xcore processors now ship into the AIoT
          market with edge AI workloads on the same many-thread
          architecture.{" "}
          <a
            href="https://en.wikipedia.org/wiki/XMOS"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; XMOS{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://setsquared-bristol.co.uk/news/setsquared-bristol-case-study-xmos/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            SETsquared Bristol case study{arrow}
          </a>
        </li>
        <li>
          <strong>The Edinburgh embedded processor &mdash; Nigel
          Topham</strong>. Professor at Edinburgh Informatics,
          Director of the Institute for Computing Systems
          Architecture; led the ARC-600 design at ARC International
          (the second-most-shipped embedded processor architecture
          after ARM7) and the EnCore research processor at Edinburgh.
          One of the few chairs in the UK actively teaching
          microarchitecture as a discipline.{" "}
          <a
            href="https://homepages.inf.ed.ac.uk/npt/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Edinburgh Informatics home page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.inf.ed.ac.uk/people/staff/Nigel_Topham.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            School profile{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The RISC-V and open silicon lineage
      </h2>

      <p>
        Where the studio&rsquo;s sympathies sit. The UK has two
        anchor institutions in open silicon and they share a
        postcode: lowRISC in Cambridge and Codasip&rsquo;s design
        centre, also in Cambridge and Bristol. The reason the studio
        cares is in{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>{" "}
        and{" "}
        <Link
          href="/articles/what-the-studio-wont-do"
          className={ext}
        >
          What the Studio Won&rsquo;t Do
        </Link>{" "}
        &mdash; closed silicon is a long-term liability.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>OpenTitan and the Ibex core &mdash; Robert
          Mullins</strong>. Professor of Computer Architecture at
          Cambridge; co-founder and director of lowRISC, co-founder
          of the Raspberry Pi Foundation. lowRISC stewards OpenTitan
          &mdash; the first commercial-quality open-source silicon
          Root of Trust &mdash; and the Ibex 32-bit RISC-V core that
          has taped out multiple times. The cleanest example in the
          UK of open silicon shipping into production.{" "}
          <a
            href="https://www.cl.cam.ac.uk/~rdm34/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge CST home page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://lowrisc.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lowRISC.org{arrow}
          </a>
        </li>
        <li>
          <strong>The RISC-V LLVM backend &mdash; Alex
          Bradbury</strong>. Co-founder and CTO of lowRISC; the
          person who proposed and shipped the upstream RISC-V LLVM
          backend out of experimental status for LLVM 9.0. If you
          compile RISC-V code with clang, the path through the
          compiler was largely paved by him.{" "}
          <a
            href="https://lowrisc.org/news/the-risc-v-llvm-backend-in-clang-llvm-9-0/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lowRISC &mdash; RISC-V LLVM 9.0 announcement{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://github.com/asb"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GitHub &mdash; asb{arrow}
          </a>
        </li>
        <li>
          <strong>Codasip&rsquo;s UK design centre &mdash; Codasip
          Cambridge / Bristol team</strong>. Codasip is a
          European RISC-V processor IP company with strategic UK
          design centres in Cambridge and Bristol, currently
          building the A90 and A110 high-performance out-of-order
          RISC-V cores intended to compete at the applications-CPU
          level. Listed here as a named programme rather than a
          single person because the public-facing UK leads have
          turned over; the company is the verifiable artefact.{" "}
          <a
            href="https://codasip.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            codasip.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.electropages.com/blog/2021/10/codasip-announces-uk-hiring-risc-v-development"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Electropages &mdash; Codasip UK hiring{arrow}
          </a>
        </li>
        <li>
          <strong>The RISC-V chief architect (UK diaspora) &mdash;
          Krste Asanovi&cacute;</strong>. Co-founder and Chief
          Architect of SiFive and Chief Architect of RISC-V
          International, Professor Emeritus at UC Berkeley.
          Cambridge-educated (BA Electrical and Information Sciences,
          1984&ndash;87); SiFive opened a Cambridge office in 2022.
          Diaspora caveat &mdash; the architecture work was done at
          Berkeley &mdash; but the Cambridge connection is real and
          the office is here.{" "}
          <a
            href="https://people.eecs.berkeley.edu/~krste/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Berkeley home page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.cambridgeindependent.co.uk/business/sifive-founder-cambridge-still-has-a-great-mix-of-ancient-9269255/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge Independent interview{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The HPC and scientific computing lineage
      </h2>

      <p>
        The UK does not build a Top500 machine from its own silicon,
        but it integrates them, runs them and writes the science
        codes for them. Two centres carry most of the load: EPCC in
        Edinburgh and Research Computing Services in Cambridge.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>ARCHER2 and EPCC &mdash; Professor Mark
          Parsons</strong>. Director of EPCC and Dean of Research
          Computing at the University of Edinburgh; ex-CERN, joined
          EPCC in 1994. EPCC hosts ARCHER2 (HPE Cray EX,
          ~28&nbsp;PFLOP/s, 748,544 AMD EPYC cores) and was named the
          UK&rsquo;s first National Supercomputing Centre. The
          public sequel is the £750m next-generation Edinburgh
          supercomputer announced for the same site.{" "}
          <a
            href="https://www.epcc.ed.ac.uk/about-us/our-team/prof-mark-parsons"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EPCC profile{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.epcc.ed.ac.uk/hpc-services/archer2"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EPCC &mdash; ARCHER2 service page{arrow}
          </a>
        </li>
        <li>
          <strong>Cambridge Research Computing and Dawn &mdash; Dr
          Paul Calleja</strong>. Director of Cambridge Research
          Computing Services and the Cambridge Open Zettascale Lab;
          oversaw the Dawn AI supercomputer (Intel Xeon plus Intel
          Data Center GPU Max, deployed late 2023) at the West
          Cambridge data centre. The UK&rsquo;s most visible
          industrial-academic HPC bridge for the AI workloads of
          the 2020s.{" "}
          <a
            href="https://www.hpc.cam.ac.uk/d-w-n"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge RCS &mdash; Dawn page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.zettascale.hpc.cam.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge Open Zettascale Lab{arrow}
          </a>
        </li>
        <li>
          <strong>FPGA-based HPC &mdash; Professor Wim
          Vanderbauwhede</strong>. Professor of Computing Science at
          Glasgow; co-author of <em>High-Performance Computing Using
          FPGAs</em> (Springer); built a single-FPGA processor
          carrying more than a thousand cores. The principal British
          academic voice on reconfigurable-fabric HPC.{" "}
          <a
            href="https://www.gla.ac.uk/schools/computing/staff/wimvanderbauwhede/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Glasgow staff page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.gla.ac.uk/news/archiveofnews/2010/december/headline_183814_en.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Glasgow news &mdash; 1000 cores on a chip{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The teaching and writing lineage
      </h2>

      <p>
        Where the next generation actually learns. The writing here
        is the bottleneck; the teaching is downstream of it. Sophie
        Wilson appears again because she has written and spoken at
        length about the ARM architecture for thirty years, and the
        public record of her lectures is itself a teaching artefact.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>The ARM lecture circuit &mdash; Sophie
          Wilson</strong>. Beyond the original ISA work, Wilson&rsquo;s
          interviews and lectures &mdash; Computer History Museum,
          Royal Society, Science Museum &mdash; are the primary
          public record of how the ARM was designed. The teaching
          contribution is the recorded thinking.{" "}
          <a
            href="https://blog.sciencemuseum.org.uk/celebrating-sophie-wilson-and-40-years-of-the-arm-microprocessor/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Science Museum &mdash; 40 years of ARM{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.cs4fn.org/computerarchitecture/sophiewilson.php"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cs4fn &mdash; Sophie Wilson{arrow}
          </a>
        </li>
        <li>
          <strong>The standard ARM textbook &mdash; Andrew Sloss,
          Dominic Symes and Chris Wright</strong>. <em>ARM System
          Developer&rsquo;s Guide: Designing and Optimizing System
          Software</em> (Morgan Kaufmann, 2004). The book that
          taught the working details to a generation. Symes and
          Wright are the under-cited co-authors; the studio names
          them here because the book has a single byline in casual
          reference and three in fact.{" "}
          <a
            href="https://www.oreilly.com/library/view/arm-system-developers/9781558608740/xhtml/B9781558608740500009.htm"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            O&rsquo;Reilly &mdash; About the Authors{arrow}
          </a>
        </li>
        <li>
          <strong>SpiNNaker as teaching machine &mdash; Steve
          Furber</strong>. Beyond the original ARM work, Furber&rsquo;s
          public lectures and Manchester teaching on SpiNNaker have
          made neuromorphic computing a recognisable UK discipline.
          The Archives of IT interview is the long-form record.{" "}
          <a
            href="https://archivesit.org.uk/interviews/professor-steve-furber/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Archives of IT &mdash; Steve Furber interview{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://queue.acm.org/detail.cfm?id=1716385"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ACM Queue &mdash; A Conversation with Steve Furber{arrow}
          </a>
        </li>
        <li>
          <strong>The Cambridge cluster as oral history &mdash;
          Archives of IT</strong>. Not a person but a body of work:
          the Archives of IT project has recorded long-form
          interviews with Wilson, Furber, Hauser, Hopper and Saxby
          among others. The single most useful free-to-access
          primary-source set for British silicon history.{" "}
          <a
            href="https://archivesit.org.uk/acorns-to-oaks-five-personal-stories-behind-acorn-computers-and-arm/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Acorns to Oaks &mdash; Acorn and Arm stories{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Who is missing from this list
      </h2>

      <p>
        Several real groups did not make this draft because the
        public attribution thins: the Arm Mali architecture team in
        Cambridge beyond Davies has many senior engineers whose
        public output is patents and conference talks rather than
        named architecture roles, and the studio prefers a working
        URL on a domain the person or their employer controls. Hailo
        has UK-registered entities in London (Harling House, Great
        Suffolk Street) but no public technical architect by name in
        the UK office &mdash; the chip work is Tel Aviv and the
        Edinburgh angle in the original brief did not verify, so the
        Hailo line is one of presence rather than people. The Open
        Compute UK community is a presence in London and Manchester
        data centres but the chip-design contribution is largely
        American.
      </p>

      <p>
        Diaspora cases worth following separately: Krste
        Asanovi&cacute; (Cambridge-educated, Berkeley career, SiFive
        Cambridge office); the British engineers in senior roles at
        Apple Silicon in Cupertino after the 2017 Imagination split;
        Stan Boland (UK-born, ex-Icera with Knowles and Toon, now
        UK-resident again). They appear in adjacent lists rather
        than this one. If you design silicon in the UK under a
        public byline and you are not here, the editor reads the
        inbox.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Closing</h2>

      <p>
        Four decades of British chip design sit between a graph-paper
        ISA sketch in 1983 and an open-source Root of Trust shipping
        in 2024. The line is unbroken &mdash; Acorn into Arm into
        Imagination into Graphcore into lowRISC &mdash; and it runs
        almost entirely through Cambridge, Bristol, Manchester and
        Edinburgh, with a single notable spur into Kings Langley.
        The studio&rsquo;s position is that the future belongs to
        open silicon and the people listed in the RISC-V section are
        the ones building it. The rest of the list is the standing
        on whose shoulders that future is built; see{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>{" "}
        for the wider argument and{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>{" "}
        for why a one-person studio sits awake at night thinking
        about whose CPU runs the bench.
      </p>

      <p>
        Sibling who&rsquo;s-who pieces in the series:
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            Who&rsquo;s Who &mdash; UK AI people
          </Link>{" "}
          (forthcoming)
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who &mdash; UK VR people
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
        Sources / Further Reading
      </h2>

      <p className="mb-2 text-sm text-chrome-400">
        Grouped by domain. Every external URL touched in the
        article above appears below.
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <strong>arm.com / newsroom.arm.com / careers.arm.com</strong>
          &nbsp;&mdash; Arm leadership page; Grisenthwaite Newsroom
          author page; Haas CEO appointment.
        </li>
        <li>
          <strong>royalsociety.org</strong> &mdash; Royal Society
          fellow pages for Wilson, Furber, Hauser, Hopper, Saxby and
          May.
        </li>
        <li>
          <strong>cl.cam.ac.uk / cst.cam.ac.uk</strong> &mdash;
          Robert Mullins Cambridge home pages; Andy Hopper CST
          profile.
        </li>
        <li>
          <strong>lowrisc.org</strong> &mdash; lowRISC home; Andy
          Hopper board appointment; RISC-V LLVM 9.0 announcement.
        </li>
        <li>
          <strong>codasip.com / electropages.com</strong> &mdash;
          Codasip company page; UK hiring announcement.
        </li>
        <li>
          <strong>graphcore.ai / eetimes.com</strong> &mdash;
          Graphcore About page; SoftBank acquisition coverage.
        </li>
        <li>
          <strong>bristol.ac.uk / setsquared-bristol.co.uk /
          cs.bris.ac.uk</strong> &mdash; David May home page; XMOS
          SETsquared case study.
        </li>
        <li>
          <strong>imaginationtech.com / blog.imaginationtech.com /
          design-reuse.com / electronicsweekly.com</strong> &mdash;
          PowerVR history; Yassaie and Beresford-Wylie CEO
          announcements.
        </li>
        <li>
          <strong>codeplay.com / nextplatform.com</strong> &mdash;
          Codeplay team page; Intel acquisition coverage.
        </li>
        <li>
          <strong>epcc.ed.ac.uk / archer2.ac.uk / inf.ed.ac.uk /
          homepages.inf.ed.ac.uk</strong> &mdash; EPCC and ARCHER2
          pages; Mark Parsons profile; Nigel Topham profiles.
        </li>
        <li>
          <strong>hpc.cam.ac.uk / zettascale.hpc.cam.ac.uk</strong>
          &nbsp;&mdash; Cambridge Research Computing; Dawn page;
          Zettascale Lab.
        </li>
        <li>
          <strong>gla.ac.uk</strong> &mdash; Wim Vanderbauwhede
          staff page and 1000-cores news item.
        </li>
        <li>
          <strong>computerhistory.org / sciencemuseum.org.uk /
          cs4fn.org / archivesit.org.uk</strong> &mdash; Sophie
          Wilson and Steve Furber teaching / oral history artefacts.
        </li>
        <li>
          <strong>shop.elsevier.com / oreilly.com</strong> &mdash;
          <em> ARM System Developer&rsquo;s Guide</em> reference
          pages.
        </li>
        <li>
          <strong>theorg.com / siliconcatalyst.com /
          anandtech.com</strong> &mdash; Jem Davies advisor and
          fellow profiles.
        </li>
        <li>
          <strong>marvell.com / itpro.com /
          enterprisehub.raeng.org.uk / amadeuscapital.com</strong>
          &nbsp;&mdash; Tudor Brown, Mike Muller, Robin Saxby and
          Hermann Hauser leadership pages.
        </li>
        <li>
          <strong>people.eecs.berkeley.edu /
          cambridgeindependent.co.uk</strong> &mdash; Krste
          Asanovi&cacute; home page and Cambridge interview.
        </li>
        <li>
          <strong>en.wikipedia.org</strong> &mdash; reference
          backstops for Steve Furber, XMOS, Hossein Yassaie and
          Graphcore where the primary URL is institutional.
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * Inclusion rule: a working public URL on a domain the person or
 * their employer (or a verified publisher) controls, AND a
 * verifiable chip-design / architecture / compiler / open-silicon
 * artefact attributable to them by name. UK boundary call: career-
 * defining work done at a UK company or UK university, or a
 * UK-based current role. Diaspora cases (Krste Asanović,
 * UK-born engineers at Apple Silicon) noted in the closing section
 * with caveat, not entered as primary UK practitioners.
 *
 * Format: signature-move — each entry names the artefact first
 * (the ARM ISA, tile-based deferred rendering, OpenTitan, the
 * Armv6-to-Armv9 architecture, etc.) then the person. The conceit
 * keeps the article honest because every entry must have a
 * nameable artefact attached.
 *
 * Refresh: no entry was invented; Hailo UK presence verified by
 * Companies House but no named UK technical architect in public
 * record, so Hailo appears as "presence not people" in the closing
 * section. Edinburgh angle for Hailo (in original brief) did not
 * verify and is omitted.
 */
export const entry: Entry = {
  slug: "whos-who-uk-cpu-chip-people",
  title:
    "Who's Who — UK CPU and chip-design people, by signature move",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "An index of British silicon: the people who drew the ARM instruction set, designed the PowerVR GPU, built the IPU at Graphcore, opened the RISC-V LLVM backend, and run the supercomputers in Edinburgh and Cambridge. Real people, public URLs, signature moves named first.",
  Body: WhosWhoUkCpuChipPeople,
  related: [
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Why the studio sides with open silicon.",
    },
    {
      href: "/articles/why-i-build-my-own-rigs",
      label: "Why I Build My Own Rigs",
      note: "Why a one-person studio cares whose CPU runs the bench.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Graph-shaped compute, the architectural bet behind the IPU.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "Closed silicon as a long-term liability.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Sibling piece in the who's-who series.",
    },
    {
      href: "/articles/whos-who-uk-pixel-artists",
      label: "Who's Who — UK pixel artists",
      note: "Sibling piece in the who's-who series.",
    },
  ],
  furtherReading: [
    {
      href: "https://royalsociety.org/people/sophie-wilson-12544/",
      label: "Sophie Wilson — Royal Society fellow page",
      note: "The original ARM instruction set, drafted 1983.",
    },
    {
      href: "https://royalsociety.org/people/stephen-furber-11472/",
      label: "Steve Furber — Royal Society fellow page",
      note: "First ARM silicon; SpiNNaker at Manchester.",
    },
    {
      href: "https://archivesit.org.uk/acorns-to-oaks-five-personal-stories-behind-acorn-computers-and-arm/",
      label: "Archives of IT — Acorns to Oaks",
      note: "Long-form oral history of the Acorn-to-Arm transition.",
    },
    {
      href: "https://newsroom.arm.com/author/richard-grisenthwaite",
      label: "Richard Grisenthwaite — Arm Newsroom author page",
      note: "The Armv6-to-Armv9 architecture.",
    },
    {
      href: "https://lowrisc.org/",
      label: "lowRISC",
      note: "OpenTitan, Ibex, the cleanest UK open-silicon programme.",
    },
    {
      href: "https://codasip.com/",
      label: "Codasip",
      note: "RISC-V processor IP; UK design centres in Cambridge and Bristol.",
    },
    {
      href: "https://www.graphcore.ai/about",
      label: "Graphcore — about",
      note: "The IPU; Bristol; the British answer to Nvidia.",
    },
    {
      href: "https://codeplay.com/company/team/",
      label: "Codeplay Software — team",
      note: "Edinburgh; SYCL; the GPU compiler bridge to Intel oneAPI.",
    },
    {
      href: "https://www.imaginationtech.com/",
      label: "Imagination Technologies",
      note: "PowerVR; Kings Langley; tile-based deferred rendering.",
    },
    {
      href: "http://people.cs.bris.ac.uk/~dave/",
      label: "Professor David May — Bristol home page",
      note: "Inmos transputer, Occam, XMOS; the British multicore tradition.",
    },
    {
      href: "https://www.epcc.ed.ac.uk/",
      label: "EPCC — Edinburgh Parallel Computing Centre",
      note: "ARCHER2; the UK's first National Supercomputing Centre.",
    },
    {
      href: "https://www.hpc.cam.ac.uk/",
      label: "Cambridge Research Computing Services",
      note: "Dawn AI supercomputer; the Cambridge HPC anchor.",
    },
  ],
};
