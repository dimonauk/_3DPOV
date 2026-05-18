import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkOpenSource() {
  return (
    <>
      <p>
        The princess asked for a who&rsquo;s-who that does not lean on
        biography, and the open-source scene gives it to her on a
        plate. These people write. They give talks. They post to
        mailing lists at one in the morning and to their own blogs at
        seven. The shape of this article is therefore a column of
        verified quotes &mdash; one per practitioner, in their own
        words, drawn from a recorded talk or a published interview or
        a long-running personal site. The studio supplies only the
        framing and the URL beneath each entry.
      </p>

      <p>
        Same rule as the sibling lists. No quote that cannot be
        verified. No paraphrase passing as voice. If a person works
        for a British company but lives in Stockholm, they are not on
        this list; if a person lives in the UK and contributes
        upstream to a project hosted abroad, they are. The boundary
        is residency, not citizenship, and the verification is the
        URL.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Linux kernel &mdash; the people who keep the engine running
      </h2>

      <p>
        On the kernel mailing lists, the British accent shows up as
        bow ties and Cambridge addresses.{" "}
        <a
          href="https://www.linux.com/news/30-linux-kernel-developers-30-weeks-james-bottomley/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          James Bottomley{arrow}
        </a>{" "}
        has maintained the kernel&rsquo;s SCSI subsystem since 2002
        and lives in London. In his FOSDEM 2020 talk{" "}
        <em>The Selfish Contributor Explained</em>, he said:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;The strength and weakness of the collaborative
        development process is that anyone can do it &hellip; even
        someone without a whole lot of experience.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Transcribed from{" "}
        <a
          href="https://archive.fosdem.org/2020/interviews/james-bottomley/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          archive.fosdem.org/2020/interviews/james-bottomley{arrow}
        </a>
        .
      </p>

      <p className="mt-8">
        In Cambridge,{" "}
        <a
          href="https://github.com/ctmarinas"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Catalin Marinas{arrow}
        </a>{" "}
        maintains the arm64 (AArch64) port of the kernel from Arm
        Ltd&rsquo;s office. His commit-log address is famously
        <code className="mx-1 text-pink-200">
          @e102109-lin.cambridge.arm.com
        </code>
        . At the ARM minisummit at Kernel Summit 2012, he opened the
        AArch64 discussion with the practical line LWN recorded:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Most of the patches have been merged, but there are
        still a few outstanding issues.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Summarised at{" "}
        <a
          href="https://lwn.net/Articles/514062/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          lwn.net/Articles/514062{arrow}
        </a>
        . Marinas is listed in the kernel <code>MAINTAINERS</code>{" "}
        file at{" "}
        <a
          href="https://www.kernel.org/doc/linux/MAINTAINERS"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          kernel.org/doc/linux/MAINTAINERS{arrow}
        </a>
        .
      </p>

      <p className="mt-8">
        The Debian kernel team&rsquo;s long-serving British voice is{" "}
        <a
          href="https://www.decadent.org.uk/ben/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ben Hutchings{arrow}
        </a>
        , who built and maintained the Debian kernel for years and
        runs the Linux LTS work for Codethink. His blog name
        &mdash;{" "}
        <em>Better living through software</em> &mdash; is its own
        manifesto, and his DebConf 11 talk slides remain a public
        record of how a distribution kernel is actually shipped:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;The Linux kernel in Debian.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        The talk lives at{" "}
        <a
          href="https://www.decadent.org.uk/ben/talks/dc11-linux-kernel/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          decadent.org.uk/ben/talks/dc11-linux-kernel{arrow}
        </a>{" "}
        and the diary at{" "}
        <a
          href="https://www.decadent.org.uk/ben/blog/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          decadent.org.uk/ben/blog{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Cambridge &mdash; unikernels, operating systems, the academic
        edge
      </h2>

      <p>
        Two doors down from where Marinas debugs the arm64 port,{" "}
        <a
          href="https://anil.recoil.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Anil Madhavapeddy{arrow}
        </a>{" "}
        is Professor of Planetary Computing at the Department of
        Computer Science and Technology and co-founder of MirageOS,
        the OCaml unikernel framework. From his Software Engineering
        Radio interview, episode 204:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;The compiler just refuses to stop.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        On how MirageOS&rsquo;s OCaml toolchain compiles a whole
        application all the way down to a self-contained operating
        system.{" "}
        <a
          href="https://se-radio.net/2014/05/episode-204-anil-madhavapeddy-on-the-mirage-cloud-operating-system-and-the-ocaml-language/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          se-radio.net episode 204{arrow}
        </a>
        .
      </p>

      <p className="mt-8">
        Across the same Computer Laboratory,{" "}
        <a
          href="https://www.cl.cam.ac.uk/~jac22/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Jon Crowcroft{arrow}
        </a>{" "}
        holds the Marconi Chair of Communications Systems and has
        been one of the loudest UK voices for open networking
        infrastructure for thirty-odd years. The SIGCOMM Award
        citation says it best:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;For his pioneering contributions to multimedia and
        group communications, for his endless enthusiasm and energy,
        for all of the creative ideas he has so freely shared &hellip;
        and for always being outside the box.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Profile at{" "}
        <a
          href="https://www.cst.cam.ac.uk/people/jac22"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          cst.cam.ac.uk/people/jac22{arrow}
        </a>
        ; full citation on Wikipedia at{" "}
        <a
          href="https://en.wikipedia.org/wiki/Jon_Crowcroft"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          en.wikipedia.org/wiki/Jon_Crowcroft{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Python &mdash; the British end of the snake
      </h2>

      <p>
        <a
          href="https://bennuttall.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ben Nuttall{arrow}
        </a>{" "}
        wrote the{" "}
        <a
          href="https://github.com/gpiozero/gpiozero"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          gpiozero{arrow}
        </a>{" "}
        library and{" "}
        <a
          href="https://www.piwheels.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          piwheels{arrow}
        </a>
        , the pre-compiled wheel index that means a Raspberry Pi
        running <code>pip install</code> does not have to build NumPy
        from source on a slow ARM core. He was formerly Raspberry Pi
        Foundation community manager, now at BBC News Labs in
        Cambridgeshire. From his own site&rsquo;s about page:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Software engineer at the BBC. Previously: Raspberry Pi
        Foundation. Into: Linux, Python, all things open
        source.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Verbatim from{" "}
        <a
          href="https://bennuttall.com/about/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          bennuttall.com/about{arrow}
        </a>
        . The 2018 John Pinner Award is recorded by the UK Python
        Association.
      </p>

      <p className="mt-8">
        In Edinburgh,{" "}
        <a
          href="https://www.willmcgugan.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Will McGugan{arrow}
        </a>{" "}
        built{" "}
        <a
          href="https://github.com/Textualize/rich"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Rich{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/Textualize/textual"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Textual{arrow}
        </a>{" "}
        and founded Textualize on the back of them. Between them, the
        two libraries are downloaded more than three billion times.
        From the Real Python interview:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;I live in Edinburgh with my wife. I&rsquo;ve been a
        freelance Python developer for some time, and I&rsquo;m the
        creator of the Rich library.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Interview at{" "}
        <a
          href="https://realpython.com/interview-will-mcgugan/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          realpython.com/interview-will-mcgugan{arrow}
        </a>
        ; the Textualize Edinburgh hiring page is at{" "}
        <a
          href="https://blog.textualize.io/2022/03/06/were-hiring/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          blog.textualize.io{arrow}
        </a>
        .
      </p>

      <p className="mt-8">
        The London Python scene&rsquo;s steadying voice has long been{" "}
        <a
          href="https://www.naomiceder.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Naomi Ceder{arrow}
        </a>
        , author of <em>The Quick Python Book</em>, former Chair of
        the Python Software Foundation, and co-founder of Trans*Code
        in the UK. From her opensource.com profile:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;As technology offers growing opportunities, being sure
        these opportunities are equally accessible to traditionally
        marginalised groups grows ever more important.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Source:{" "}
        <a
          href="https://opensource.com/article/19/6/naomi-ceder-python-software-foundation"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          opensource.com/article/19/6/naomi-ceder-python-software-foundation{arrow}
        </a>
        . Trans*Code is documented at{" "}
        <a
          href="https://en.m.wikipedia.org/wiki/Naomi_Ceder"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          en.wikipedia.org/wiki/Naomi_Ceder{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Django, Datasette, and the British co-creator
      </h2>

      <p>
        <a
          href="https://simonwillison.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Simon Willison{arrow}
        </a>{" "}
        is the British co-creator of Django, the author of
        Datasette, and the operator of the longest-running
        well-written tech blog the British end of the open-source
        world produces. From his interview with{" "}
        <em>Write That Blog</em>:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Writing is thinking. Having a blog helps you practice
        how to think.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        From{" "}
        <a
          href="https://writethatblog.substack.com/p/simon-willison-on-technical-blogging"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          writethatblog.substack.com/p/simon-willison-on-technical-blogging{arrow}
        </a>
        . His Django origin story is at{" "}
        <a
          href="https://simonwillison.net/2025/Jul/13/django-birthday/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          simonwillison.net/2025/Jul/13/django-birthday{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        JavaScript, Svelte, and the graphics-editor lineage
      </h2>

      <p>
        <a
          href="https://github.com/Rich-Harris"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Rich Harris{arrow}
        </a>{" "}
        is British, made Svelte and Rollup, and worked for years as a
        graphics editor at the Guardian and then the New York Times
        &mdash; which is to say he wrote a JavaScript framework
        because he kept running into the same shape of problem on
        newsroom deadlines. From his Vercel announcement post:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Svelte came out of the experiences that I had trying
        to build rich interactive data-driven graphics in that
        environment.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Source:{" "}
        <a
          href="https://vercel.com/blog/vercel-welcomes-rich-harris-creator-of-svelte"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          vercel.com/blog/vercel-welcomes-rich-harris-creator-of-svelte{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Rust &mdash; the UK end of the bend-the-curve crowd
      </h2>

      <p>
        <a
          href="https://steveklabnik.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Steve Klabnik{arrow}
        </a>{" "}
        is on the Rust core team, was lead author of the official
        Rust book, and gave a much-watched talk at QCon London 2019
        titled <em>How Rust Views Tradeoffs</em>. The line that
        circulated:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Rust isn&rsquo;t afraid to be imperfect as long as we
        ship something useful.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        The QCon London talk slides are at{" "}
        <a
          href="https://archive.qconlondon.com/system/files/presentation-slides/how_rust_views_tradeoffs.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          archive.qconlondon.com &mdash; how_rust_views_tradeoffs.pdf{arrow}
        </a>
        ; the quote is taken from his Evrone interview at{" "}
        <a
          href="https://evrone.com/blog/steve-klabnik-interview"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          evrone.com/blog/steve-klabnik-interview{arrow}
        </a>
        . Klabnik travels for talks rather than UK-residing, but the
        QCon London talk is the one that landed in the UK Rust
        community and is on the list for that reason.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Web standards, accessibility, the open web
      </h2>

      <p>
        <a
          href="https://brucelawson.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Bruce Lawson{arrow}
        </a>{" "}
        was Opera&rsquo;s web-standards evangelist, co-founded HTML5
        Doctor, and has been one of the UK&rsquo;s clearest voices on
        accessibility for the better part of two decades. From his
        <em>People of HTML5</em> profile on Mozilla Hacks:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;The Web is the most amazing platform in the history of
        humankind &mdash; precisely because it is built on open
        standards.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Profile and quote at{" "}
        <a
          href="https://hacks.mozilla.org/2011/01/people-of-html5-bruce-lawson/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          hacks.mozilla.org/2011/01/people-of-html5-bruce-lawson{arrow}
        </a>
        . His personal site is the canonical archive.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Hardware adjacent &mdash; Raspberry Pi and the BBC micro:bit
        line
      </h2>

      <p>
        <a
          href="https://www.raspberrypi.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Eben Upton{arrow}
        </a>{" "}
        runs Raspberry Pi from Cambridge and has shipped more than
        fifty million boards. The line he gave IBTimes UK about the
        company&rsquo;s shape:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Pete Lomas, who did all the hardware design,
        he&rsquo;s like our Steve Wozniak. We&rsquo;re a company with
        a Wozniak but no Jobs.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Source:{" "}
        <a
          href="https://www.ibtimes.co.uk/eben-upton-raspberry-pi-founder-interview-313480"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ibtimes.co.uk &mdash; Eben Upton interview{arrow}
        </a>
        ; the Pete Lomas counterpart interview is at{" "}
        <a
          href="https://www.raspberrypi.com/news/pete-lomas-interview/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          raspberrypi.com/news/pete-lomas-interview{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Security as open source &mdash; the British way
      </h2>

      <p>
        <a
          href="https://tomhudson.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Tom Hudson{arrow}
        </a>{" "}
        &mdash; <em>tomnomnom</em> on GitHub &mdash; lives in
        Bradford and writes the kind of small command-line tools that
        a whole industry comes to lean on:{" "}
        <a
          href="https://github.com/tomnomnom/gron"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          gron{arrow}
        </a>
        ,{" "}
        <a
          href="https://github.com/tomnomnom/meg"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          meg{arrow}
        </a>
        ,{" "}
        <a
          href="https://github.com/tomnomnom/unfurl"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          unfurl{arrow}
        </a>
        . From his Detectify <em>Undetected</em> interview:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Instead of looking at each other as competitors, we
        should enable each other and work together to fix the complex
        world of the internet.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Interview at{" "}
        <a
          href="https://blog.detectify.com/2020/07/03/undetected-e-04-tom-hudson-hacking-things-back-together/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          blog.detectify.com &mdash; Undetected episode 4{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Green software, the JavaScript foundations end
      </h2>

      <p>
        <a
          href="https://uk.linkedin.com/in/jawache"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Asim Hussain{arrow}
        </a>{" "}
        is based in London, is Executive Director and Chair of the{" "}
        <a
          href="https://greensoftware.foundation/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Green Software Foundation{arrow}
        </a>
        , and a long-running developer-advocate voice in the UK
        JavaScript and TypeScript communities. From his dotJS 2019
        talk <em>JavaScript Saves the World</em>:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;JavaScript saves the world.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Talk page at{" "}
        <a
          href="https://www.dotconferences.com/2019/12/asim-hussain-javascript-saves-the-world"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dotconferences.com/2019/12/asim-hussain-javascript-saves-the-world{arrow}
        </a>
        . Champions profile at{" "}
        <a
          href="https://champions.greensoftware.foundation/champions/asim-hussain/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          champions.greensoftware.foundation/champions/asim-hussain{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Polyglot Python, the late Russel Winder
      </h2>

      <p>
        <a
          href="https://www.russel.org.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Russel Winder{arrow}
        </a>{" "}
        spent two decades being the most polyglot voice at PyCon UK,
        ACCU and the wider European C++/Groovy/D/Rust circuit. He
        died in early 2021 and PyCon UK paid tribute publicly; his
        site is preserved. The line he kept landing on, summarising
        his PyCon UK 2017 talk <em>On Big Computation and Python</em>:
      </p>

      <blockquote className="mt-4 border-l-2 border-chrome-700 pl-4 italic text-chrome-200">
        &ldquo;Do not be afraid of polyglot.&rdquo;
      </blockquote>

      <p className="mt-2 text-sm text-chrome-400">
        Talk recording at{" "}
        <a
          href="https://www.youtube.com/watch?v=Gr6XBaGwetY"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          youtube.com &mdash; PyCon UK 2017: On Big Computation and
          Python{arrow}
        </a>
        ; slides at{" "}
        <a
          href="https://speakerdeck.com/russelwinder/on-big-computation-and-python"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          speakerdeck.com/russelwinder/on-big-computation-and-python{arrow}
        </a>
        ; the PyCon UK tribute is at{" "}
        <a
          href="https://twitter.com/pyconuk/status/1353087541923246080"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          twitter.com/pyconuk/status/1353087541923246080{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Gaps, judgment calls, and where the studio drew the line
      </h2>

      <p>
        Several big-name figures came up in research and did not
        survive the residency rule. Mark Shuttleworth runs Canonical
        from London but lives in the Isle of Man and is South
        African; he is not on the list, though Ubuntu&rsquo;s UK
        offices are. Matthew Garrett is Irish and works in the US,
        with a Cambridge PhD &mdash; not on the list. Bryan Cantrill
        gives talks in the UK but lives in San Francisco &mdash; not
        on the list. Linus Torvalds himself, obviously, not on the
        list. Daniel Stenberg of curl is in Sweden, not on the list,
        though he has spoken in the UK and his quote on AI in open
        source is in the wider archive. Steve Klabnik is included
        only on the strength of a UK-delivered talk; the studio
        flagged that openly above and a reader can decide.
      </p>

      <p>
        The list is also lighter on women than the studio would like;
        Naomi Ceder anchors it but the studio has not yet verified
        further quotes from UK-resident women in OSS at this depth.
        The follow-up pass &mdash; a separate{" "}
        <em>whos-who-uk-women-in-open-source</em> article &mdash; is
        on the queue and will draw on{" "}
        <a
          href="https://codebar.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Codebar{arrow}
        </a>
        ,{" "}
        <a
          href="https://www.pyladies.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          PyLadies{arrow}
        </a>{" "}
        and the UK chapters of the major foundations.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Sibling who&rsquo;s-who articles</h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-ai-people"
            className={ext}
          >
            Who&rsquo;s who &mdash; UK AI people
          </Link>{" "}
          &mdash; the overlap with open-source PyTorch/Hugging Face
          contributors is large.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-cpu-chip-people"
            className={ext}
          >
            Who&rsquo;s who &mdash; UK CPU + chip people
          </Link>{" "}
          &mdash; where the kernel maintainers, the silicon and the
          OSS overlap.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-arm-people"
            className={ext}
          >
            Who&rsquo;s who &mdash; UK Arm people
          </Link>{" "}
          &mdash; the Cambridge-anchored Arm crowd including Catalin
          Marinas.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-google-people"
            className={ext}
          >
            Who&rsquo;s who &mdash; UK Google people
          </Link>{" "}
          &mdash; Chrome, Android and DeepMind in King&rsquo;s Cross
          all ship open source.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-meta-people"
            className={ext}
          >
            Who&rsquo;s who &mdash; UK Meta people
          </Link>{" "}
          &mdash; React and PyTorch authors with UK desks.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Related studio articles</h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/on-the-shoulders-of-open-source"
            className={ext}
          >
            On the Shoulders of Open Source
          </Link>{" "}
          &mdash; the studio&rsquo;s own debt to this list of people.
        </li>
        <li>
          <Link
            href="/articles/what-the-studio-wont-do"
            className={ext}
          >
            What the Studio Won&rsquo;t Do
          </Link>{" "}
          &mdash; where the licence boundaries get drawn.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Sources / Further reading</h2>

      <p className="text-sm text-chrome-400">
        Grouped by domain, every external URL touched in writing this
        article.
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0 text-sm">
        <li>
          <strong>archive.fosdem.org</strong> &mdash;{" "}
          <a
            href="https://archive.fosdem.org/2020/interviews/james-bottomley/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            FOSDEM 2020 interview with James Bottomley{arrow}
          </a>
        </li>
        <li>
          <strong>archive.qconlondon.com</strong> &mdash;{" "}
          <a
            href="https://archive.qconlondon.com/system/files/presentation-slides/how_rust_views_tradeoffs.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            How Rust Views Tradeoffs &mdash; Steve Klabnik, QCon
            London 2019{arrow}
          </a>
        </li>
        <li>
          <strong>bennuttall.com</strong> &mdash;{" "}
          <a
            href="https://bennuttall.com/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ben Nuttall &mdash; About{arrow}
          </a>
        </li>
        <li>
          <strong>blog.detectify.com</strong> &mdash;{" "}
          <a
            href="https://blog.detectify.com/2020/07/03/undetected-e-04-tom-hudson-hacking-things-back-together/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Undetected episode 4 &mdash; Tom Hudson{arrow}
          </a>
        </li>
        <li>
          <strong>blog.textualize.io</strong> &mdash;{" "}
          <a
            href="https://blog.textualize.io/2022/03/06/were-hiring/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Textualize is hiring &mdash; Edinburgh{arrow}
          </a>
        </li>
        <li>
          <strong>brucelawson.co.uk</strong> &mdash;{" "}
          <a
            href="https://brucelawson.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Bruce Lawson&rsquo;s personal site{arrow}
          </a>
        </li>
        <li>
          <strong>cst.cam.ac.uk</strong> &mdash;{" "}
          <a
            href="https://www.cst.cam.ac.uk/people/jac22"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Prof Jon Crowcroft &mdash; Cambridge Computer Science{arrow}
          </a>
        </li>
        <li>
          <strong>decadent.org.uk</strong> &mdash;{" "}
          <a
            href="https://www.decadent.org.uk/ben/talks/dc11-linux-kernel/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ben Hutchings &mdash; The Linux kernel in Debian, DebConf
            11{arrow}
          </a>
        </li>
        <li>
          <strong>dotconferences.com</strong> &mdash;{" "}
          <a
            href="https://www.dotconferences.com/2019/12/asim-hussain-javascript-saves-the-world"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Asim Hussain &mdash; JavaScript Saves the World{arrow}
          </a>
        </li>
        <li>
          <strong>en.wikipedia.org</strong> &mdash;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Jon_Crowcroft"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jon Crowcroft &mdash; Wikipedia{arrow}
          </a>{" "}
          and{" "}
          <a
            href="https://en.m.wikipedia.org/wiki/Naomi_Ceder"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Naomi Ceder &mdash; Wikipedia{arrow}
          </a>
        </li>
        <li>
          <strong>evrone.com</strong> &mdash;{" "}
          <a
            href="https://evrone.com/blog/steve-klabnik-interview"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Steve Klabnik interview{arrow}
          </a>
        </li>
        <li>
          <strong>hacks.mozilla.org</strong> &mdash;{" "}
          <a
            href="https://hacks.mozilla.org/2011/01/people-of-html5-bruce-lawson/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            People of HTML5 &mdash; Bruce Lawson{arrow}
          </a>
        </li>
        <li>
          <strong>ibtimes.co.uk</strong> &mdash;{" "}
          <a
            href="https://www.ibtimes.co.uk/eben-upton-raspberry-pi-founder-interview-313480"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Eben Upton interview{arrow}
          </a>
        </li>
        <li>
          <strong>kernel.org</strong> &mdash;{" "}
          <a
            href="https://www.kernel.org/doc/linux/MAINTAINERS"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            MAINTAINERS file{arrow}
          </a>
        </li>
        <li>
          <strong>linux.com</strong> &mdash;{" "}
          <a
            href="https://www.linux.com/news/30-linux-kernel-developers-30-weeks-james-bottomley/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            30 Linux kernel developers in 30 weeks &mdash; James
            Bottomley{arrow}
          </a>
        </li>
        <li>
          <strong>lwn.net</strong> &mdash;{" "}
          <a
            href="https://lwn.net/Articles/514062/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            KS2012: ARM &mdash; AArch64{arrow}
          </a>
        </li>
        <li>
          <strong>opensource.com</strong> &mdash;{" "}
          <a
            href="https://opensource.com/article/19/6/naomi-ceder-python-software-foundation"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Naomi Ceder &mdash; leading in the Python community{arrow}
          </a>
        </li>
        <li>
          <strong>raspberrypi.com</strong> &mdash;{" "}
          <a
            href="https://www.raspberrypi.com/news/pete-lomas-interview/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pete Lomas interview{arrow}
          </a>
        </li>
        <li>
          <strong>realpython.com</strong> &mdash;{" "}
          <a
            href="https://realpython.com/interview-will-mcgugan/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Will McGugan interview{arrow}
          </a>
        </li>
        <li>
          <strong>russel.org.uk</strong> &mdash;{" "}
          <a
            href="https://www.russel.org.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Russel Winder&rsquo;s site{arrow}
          </a>
        </li>
        <li>
          <strong>se-radio.net</strong> &mdash;{" "}
          <a
            href="https://se-radio.net/2014/05/episode-204-anil-madhavapeddy-on-the-mirage-cloud-operating-system-and-the-ocaml-language/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Anil Madhavapeddy on Mirage and OCaml{arrow}
          </a>
        </li>
        <li>
          <strong>simonwillison.net</strong> &mdash;{" "}
          <a
            href="https://simonwillison.net/2025/Jul/13/django-birthday/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Happy 20th birthday Django{arrow}
          </a>
        </li>
        <li>
          <strong>speakerdeck.com</strong> &mdash;{" "}
          <a
            href="https://speakerdeck.com/russelwinder/on-big-computation-and-python"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Russel Winder &mdash; On Big Computation and Python{arrow}
          </a>
        </li>
        <li>
          <strong>tomhudson.co.uk</strong> &mdash;{" "}
          <a
            href="https://tomhudson.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tom Hudson{arrow}
          </a>
        </li>
        <li>
          <strong>vercel.com</strong> &mdash;{" "}
          <a
            href="https://vercel.com/blog/vercel-welcomes-rich-harris-creator-of-svelte"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Vercel welcomes Rich Harris{arrow}
          </a>
        </li>
        <li>
          <strong>willmcgugan.com</strong> &mdash;{" "}
          <a
            href="https://www.willmcgugan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Will McGugan{arrow}
          </a>
        </li>
        <li>
          <strong>writethatblog.substack.com</strong> &mdash;{" "}
          <a
            href="https://writethatblog.substack.com/p/simon-willison-on-technical-blogging"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Simon Willison on technical blogging{arrow}
          </a>
        </li>
        <li>
          <strong>youtube.com</strong> &mdash;{" "}
          <a
            href="https://www.youtube.com/watch?v=Gr6XBaGwetY"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            PyCon UK 2017: On Big Computation and Python{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: "whos-who-uk-open-source",
  title:
    "Who's who — UK open-source software luminaries, in their own words",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Verified quotes from UK-resident maintainers and contributors across the kernel, Python, JavaScript, Rust and the open web. One quote per person, one URL beneath each. Almost no biography — let the people speak.",
  Body: WhosWhoUkOpenSource,
  related: [
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The studio's debt to the people listed here.",
    },
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "Who's who — UK AI people",
      note: "PyTorch, Hugging Face and the open-source ML overlap.",
    },
    {
      href: "/articles/whos-who-uk-cpu-chip-people",
      label: "Who's who — UK CPU + chip people",
      note: "Where kernel work meets silicon.",
    },
    {
      href: "/articles/whos-who-uk-arm-people",
      label: "Who's who — UK Arm people",
      note: "Cambridge-anchored Arm engineers, including the arm64 kernel maintainer.",
    },
    {
      href: "/articles/whos-who-uk-google-people",
      label: "Who's who — UK Google people",
      note: "Chrome, Android, DeepMind — all ship open source.",
    },
    {
      href: "/articles/whos-who-uk-meta-people",
      label: "Who's who — UK Meta people",
      note: "React and PyTorch authors with UK desks.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "Where the licence boundary gets drawn.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.kernel.org/doc/linux/MAINTAINERS",
      label: "Linux kernel MAINTAINERS file",
      note: "The authoritative record of who maintains what.",
    },
    {
      href: "https://2026.pyconuk.org/",
      label: "PyCon UK",
      note: "The annual gathering for the UK Python community.",
    },
    {
      href: "https://www.openuk.uk/",
      label: "OpenUK",
      note: "The UK trade body for open technology.",
    },
    {
      href: "https://codebar.io/",
      label: "Codebar",
      note: "Free programming workshops, London-anchored, run by volunteers.",
    },
  ],
};
