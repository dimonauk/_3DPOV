import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkAudioSynthPeople() {
  return (
    <>
      <p>
        Britain has been making electronic-music instruments for
        almost as long as anyone has. The country invented the BBC
        Radiophonic Workshop in 1958, Electronic Music Studios in
        1969, the EMS VCS3 the same year, and a continuous tradition
        of designer-builders has run since. The current scene reads
        most clearly when you stop trying to sort it geographically
        and instead sort it by lineage &mdash; the line of thinking
        each maker came up inside.
      </p>

      <p>
        This who&rsquo;s-who walks five lineages: the EMS / Putney
        legacy, the Bristol Eurorack circle, the institutional bench
        (BBC R&amp;D, Goldsmiths, the academic studios), the
        modular-as-instrument performers, and the DIY / open-format
        wing that grew out of the YouTube era. Real people, real
        firms, every name with a public URL. Adjacent to the
        light-and-fire crowd in{" "}
        <Link
          href="/articles/whos-who-uk-fire-art-photographers"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK fire art photographers
        </Link>{" "}
        and the LED-programming crowd in{" "}
        <Link
          href="/articles/whos-who-uk-light-painters"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK light painters
        </Link>{" "}
        because the same makers tend to wire all three.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage one &mdash; EMS Putney and the British analogue tradition
      </h2>

      <p>
        Electronic Music Studios was formed in Putney, London, in 1969
        by Peter Zinovieff, Tristram Cary and David Cockerell. The VCS3
        cost &pound;330 against a $1495 Minimoog, ran on a portable
        wooden case, and sold to The Beatles, David Bowie and Pink
        Floyd. Cockerell&rsquo;s Synthi 100 from 1971 sold thirty-one
        units worldwide. EMS as the original company closed in 1979;
        employee Robin Wood carried it through several owners and
        bought back the rights in 1995. The firm still ships, and the
        VCS3 still defines a particular British sound. Peter Zinovieff
        died in 2021 aged 88; the lineage is now alive in the makers
        who acknowledge it.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Robin Wood &mdash; EMS</strong> &mdash; Cornwall.
          Joined EMS in 1970; carried the company through its
          ownership changes; bought the rights in 1995. The reason the
          VCS3 and the Synthi A are still buildable instruments rather
          than museum pieces.{" "}
          <a
            href="https://www.soundonsound.com/news/ems-synth-company-50th-anniversary"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sound on Sound &mdash; EMS 50th anniversary{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Electronic_Music_Studios"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; EMS{arrow}
          </a>
        </li>
        <li>
          <strong>AJH Synth</strong> &mdash; UK. Modular synthesis
          house whose public-facing project of recent record is The
          RadioPhonic, a Eurorack instrument commissioned by Hans
          Zimmer for the original site of the BBC Radiophonic Workshop
          at Maida Vale Studios. The lineage point is made explicitly
          by Zimmer himself; the studio reads it as the cleanest
          living-link between the Putney tradition and the current
          shelf.{" "}
          <a
            href="https://ajhsynth.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ajhsynth.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.fast-and-wide.com/faw-news/19386-the-radiophonic"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The RadioPhonic press release{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage two &mdash; the Bristol Eurorack circle
      </h2>

      <p>
        Bristol is the British Eurorack city. Multiple working
        designer-builder houses sit inside a forty-minute walk of the
        Cube cinema, the city&rsquo;s co-op arts space that has fed
        the scene since the 1990s. The aesthetic is distinct from the
        Berlin or New York shops; Bristol Eurorack is generally
        weirder, more lo-fi-friendly, more sound-art and less
        techno-functional.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Tom Bugs &mdash; BugBrand</strong> &mdash; Bristol.
          Designing, building and selling analogue audio electronics
          since 2005 &mdash; effects processors, sound generators,
          modular synthesisers. The Weevil sold from 2005 to 2015; the
          modular Synth Voice and various standalone delay, filter and
          DRM units followed. Helped at the Cube while building the
          firm. Distinctive lo-fi square-wave-and-ringmod aesthetic
          with body contact and power starvation as design choices.{" "}
          <a
            href="https://www.bugbrand.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bugbrand.co.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://tapeop.com/interviews/bonus/tom-bugs"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tape Op interview{arrow}
          </a>
        </li>
        <li>
          <strong>Future Sound Systems (FSS)</strong> &mdash; Bristol.
          Small Eurorack design and manufacture house in central
          Bristol since 2005; retro-futurist visual identity; ships
          the TG4 Modulator, Makrow, TG3 Filter, FIL4 Timbral Sculptor,
          MTX9 and the standalone Cric synthesiser. Collaborates with
          named artists on bespoke modules.{" "}
          <a
            href="https://www.futuresoundsystems.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            futuresoundsystems.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Elevator Sound</strong> &mdash; Bristol. Synthesiser,
          drum machine and Eurorack modular shop since 2014; equally a
          retail operation and a meeting point for the local scene.
          Calls itself &ldquo;community-minded machine music&rdquo;,
          which is the right phrase.{" "}
          <a
            href="https://www.elevatorsound.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            elevatorsound.com{arrow}
          </a>
        </li>
        <li>
          <strong>BeepBoop Electronics</strong> &mdash; Bristol. One of
          the smaller Bristol designer-builders frequently named on the
          ModWiggler UK-makers list; standalone hardware and Eurorack
          modules.{" "}
          <a
            href="https://www.modwiggler.com/forum/viewtopic.php?t=277622"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            via ModWiggler UK-makers list{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage three &mdash; ALM Busy Circuits and the London bench
      </h2>

      <p>
        London has its own designer-builder cluster, distinct from
        Bristol&rsquo;s. The aesthetic skews more functional and more
        rhythmically-led; Pamela&rsquo;s Workout is a working clock
        source in racks across Europe, not a sound-art object.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>ALM Busy Circuits</strong> &mdash; London. The
          purveyor of carefully-considered, quirky-but-useable Eurorack
          modules. Pamela&rsquo;s New Workout is the headline product
          &mdash; a master clock and modulation source that reveals
          power with use. Regular Superbooth presence. The most
          frequently-recommended UK module house for working
          producers.{" "}
          <a
            href="https://busycircuits.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            busycircuits.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://musictech.com/news/gear/superbooth-2022-best-eurorack-modules-alm-busy-circuits-erica-synths-eventide-look-mum-no-computer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            MusicTech Superbooth coverage{arrow}
          </a>
        </li>
        <li>
          <strong>Blicken Synths</strong> &mdash; UK. Eurorack module
          maker with a small public-facing range; the boutique end of
          the London designer-builder bench.{" "}
          <a
            href="https://www.blickensynths.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            blickensynths.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Expert Sleepers</strong> &mdash; Brighton (and
          Edinburgh per ModWiggler). Eurorack module house known
          internationally for the Disting series; bridges modular and
          DAW worlds.{" "}
          <a
            href="https://www.expert-sleepers.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            expert-sleepers.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>postmodular</strong> &mdash; UK. Distributor and
          curator of UK and European modular makers; the page that
          documents the British end of the catalogue is its own
          functional rolodex.{" "}
          <a
            href="https://postmodular.co.uk/makers/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            postmodular.co.uk &mdash; makers{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage four &mdash; the institutional bench
      </h2>

      <p>
        The British public-service tradition put serious money into
        electronic music when nobody else would. The Radiophonic
        Workshop ran 1958&ndash;1998 inside the BBC and is the most
        famous example; the contemporary equivalents are BBC R&amp;D
        and the academic studios at Goldsmiths, City and the RCM.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>BBC Research &amp; Development &mdash; Audio team</strong>{" "}
          &mdash; UK. Object-based audio, binaural, Next Generation
          Audio (NGA) experimentation; the public-record example is
          the BBC&rsquo;s binaural coverage of the Proms. Matt Firth
          is publicly named as a project engineer in the team. Worth
          tracking because the public-broadcast audio specifications of
          the next decade get drafted here.{" "}
          <a
            href="https://www.bbc.co.uk/rd"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bbc.co.uk/rd{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.thebroadcastbridge.com/content/entry/18459/is-binaural-audio-making-a-comeback"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Broadcast Bridge &mdash; binaural at the BBC{arrow}
          </a>
        </li>
        <li>
          <strong>Goldsmiths &mdash; MMus Sonic Arts and the
          Electronic Music Studios</strong> &mdash; London. The
          Electronic Music Studios at Goldsmiths were founded in 1968
          &mdash; predating EMS Putney by a year &mdash; and still
          run. The MMus Sonic Arts programme teaches surround-sound
          composition, live electronics, interactive performance,
          sound-art installation and audiovisual composition. The
          recently launched Sonics Immersive Media Lab (SIML) is the
          surround-projection-and-sound facility. The
          institutional anchor for sound art in the UK.{" "}
          <a
            href="https://www.gold.ac.uk/pg/mmus-sonic-arts/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gold.ac.uk &mdash; MMus Sonic Arts{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.gold.ac.uk/calendar/?id=8530"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            SIML launch{arrow}
          </a>
        </li>
        <li>
          <strong>Sonic Scope</strong> &mdash; the peer-reviewed
          journal founded in 2019 in association with Goldsmiths and
          MIT Press; the academic record-of-practice the rest of the
          institutional bench publishes into.{" "}
          <a
            href="https://www.sonicscope.org/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sonicscope.org &mdash; about{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage five &mdash; modular as instrument (the performers)
      </h2>

      <p>
        The fifth lineage uses modular synthesis as an
        instrument-on-stage rather than as a studio bench. The body
        of work is recordings and concerts; the racks are personal,
        unrepeatable, sometimes one-evening-only. The studio is
        naming UK-resident or UK-active performers below; the Cafe
        OTO programming is the most reliable UK anchor for the
        international circuit when it tours.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Robert Aiki Aubrey Lowe</strong> &mdash; New York /
          internationally touring; performs regularly at Cafe OTO in
          Dalston and has a sustained UK touring relationship.
          Modular-synthesiser-and-voice practice as
          spontaneous-music; nominated for an Academy Award for the
          original score to <em>Candyman</em> (2021). Worth naming in a
          UK index because the working relationship with Cafe OTO has
          shaped the London modular-performance audience.{" "}
          <a
            href="https://www.cafeoto.co.uk/artists/robert-aiki-aubrey-lowe/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cafe OTO &mdash; artist page{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.thewire.co.uk/about/artists/robert-aiki-aubrey-lowe"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Wire &mdash; artist page{arrow}
          </a>
        </li>
        <li>
          <strong>Cafe OTO</strong> &mdash; Dalston, London. The single
          most important UK venue for modular-as-performance; the
          programming is the rolodex.{" "}
          <a
            href="https://www.cafeoto.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cafeoto.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage six &mdash; the DIY / open-format wing
      </h2>

      <p>
        The most-watched UK synth-maker on the internet is not in any
        of the other lineages and would be uncomfortable in most of
        them. The DIY wing came up through YouTube in the late 2010s,
        formalised its own format (Kosmo, the 20cm-panel alternative
        to Eurorack designed for hand-built construction), and
        currently runs a museum in Ramsgate.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Sam Battle &mdash; Look Mum No Computer</strong>{" "}
          &mdash; Ramsgate, Kent. English musician, YouTuber,
          electronics enthusiast and composer; creator of the Kosmo
          DIY-friendly modular format; built the 1000-oscillator
          synth, the Furby organ, the Raleigh Chopper synth-bike and
          the Game Boy Triple Oscillator. Runs &ldquo;This Museum Is
          Not Obsolete&rdquo; in Ramsgate. Represented the UK at
          Eurovision 2026 with <em>Eins, Zwei, Drei</em>. The
          public face of the DIY wing for an entire generation.{" "}
          <a
            href="https://www.lookmumnocomputer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lookmumnocomputer.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Look_Mum_No_Computer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Look Mum No Computer{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://sdiy.info/wiki/Look_Mum_No_Computer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Synth DIY wiki &mdash; Sam Battle{arrow}
          </a>
        </li>
        <li>
          <strong>This Museum Is Not Obsolete</strong> &mdash;
          Ramsgate. Sam Battle&rsquo;s working museum of repurposed
          analogue devices; the physical anchor for the DIY wing in
          Britain.{" "}
          <a
            href="https://www.thismuseumisnotobsolete.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            thismuseumisnotobsolete.com{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineage seven &mdash; immersive audio design (the application end)
      </h2>

      <p>
        The application end of British audio &mdash; the studios that
        compose, design and deliver sound for installations, films and
        XR work &mdash; sits adjacent to the synth-makers without
        always meeting them. Two London houses are worth naming for
        being publicly active in immersive / spatial sound delivery.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Coda To Coda</strong> &mdash; London. Sound and music
          for films, experiences and games; mixes immersive
          multi-speaker installations for galleries and exhibitions
          from a fully-equipped London studio. The team publicly
          credits both composition and software development as
          in-house disciplines, which is the indicator that the
          delivery pipeline is custom rather than off-the-shelf.{" "}
          <a
            href="https://www.codatocoda.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            codatocoda.com{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Lineages the article doesn&rsquo;t name
      </h2>

      <p>
        The Manchester drum-and-bass / dubstep production scene has
        deep modular knowledge that doesn&rsquo;t publish as
        designer-builder credit; the studio is honest that the index
        skews south. Edinburgh has Expert Sleepers and a healthy small
        cluster around Forest Caf&eacute; that the article names only
        partially. The British rave-rig builders (Bristol Sound
        Systems, the South West sound-system tradition) deserve their
        own article and shouldn&rsquo;t be flattened into this one.
      </p>

      <p>
        The studio adds names when public URLs can carry the credit
        and removes them when the URLs go dark. Reader corrections
        welcome via the contact page; particularly welcome for the
        Edinburgh / Glasgow makers and the Manchester production
        bench.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On craft and on the shape of the field
      </h2>

      <p>
        The continuity is the point. The line from Putney 1969 through
        BugBrand 2005 through The RadioPhonic 2024 is not a
        promotional fiction &mdash; the lineage is in the circuits.
        Britain makes electronic instruments well because it has been
        making them continuously for sixty-five years. The studio
        reads this as a working tradition rather than a series of
        revivals, and the rolodex will refresh as the makers do.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link href="/articles/whos-who-uk-light-painters" className={ext}>
            Who&rsquo;s Who &mdash; UK light painters
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-fire-art-photographers"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK fire art photographers
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-pixel-artists" className={ext}>
            Who&rsquo;s Who &mdash; UK pixel artists
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            Who&rsquo;s Who &mdash; UK AI people
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
        Maker and studio sites
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://ajhsynth.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ajhsynth.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bugbrand.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bugbrand.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.futuresoundsystems.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            futuresoundsystems.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.elevatorsound.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            elevatorsound.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://busycircuits.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            busycircuits.com &mdash; ALM Busy Circuits{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.blickensynths.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            blickensynths.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.expert-sleepers.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            expert-sleepers.co.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://postmodular.co.uk/makers/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            postmodular.co.uk &mdash; makers{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.lookmumnocomputer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lookmumnocomputer.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.thismuseumisnotobsolete.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            thismuseumisnotobsolete.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.codatocoda.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            codatocoda.com{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Institutions and venues
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.bbc.co.uk/rd"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bbc.co.uk/rd &mdash; BBC R&amp;D{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.gold.ac.uk/pg/mmus-sonic-arts/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gold.ac.uk &mdash; MMus Sonic Arts{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.sonicscope.org/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sonicscope.org &mdash; about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.cafeoto.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cafeoto.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Press and interviews
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.fast-and-wide.com/faw-news/19386-the-radiophonic"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            fast-and-wide.com &mdash; The RadioPhonic{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://tapeop.com/interviews/bonus/tom-bugs"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            tapeop.com &mdash; Tom Bugs interview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.juno.co.uk/junodaily/2014/04/14/bugging-the-system-an-interview-with-tom-bugs/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            juno.co.uk &mdash; Tom Bugs interview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.soundonsound.com/news/ems-synth-company-50th-anniversary"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            soundonsound.com &mdash; EMS 50th anniversary{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://musictech.com/news/industry/ems-founder-peter-zinovieff-maker-of-the-synthi-and-vcs3-dies-aged-88/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            musictech.com &mdash; Peter Zinovieff obituary{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://musictech.com/news/gear/superbooth-2022-best-eurorack-modules-alm-busy-circuits-erica-synths-eventide-look-mum-no-computer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            musictech.com &mdash; Superbooth coverage{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.musicradar.com/music-tech/synths/furby-organs-lightsaber-theremins-and-the-1000-oscillator-synth-look-mum-no-computer-on-his-7-craziest-musical-inventions"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            musicradar.com &mdash; Look Mum No Computer 7 inventions{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://tapeop.com/interviews/147/robert-aiki-aubrey-lowe"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            tapeop.com &mdash; Robert Aiki Aubrey Lowe{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.thebroadcastbridge.com/content/entry/18459/is-binaural-audio-making-a-comeback"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            thebroadcastbridge.com &mdash; binaural at the BBC{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Reference
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/EMS_VCS_3"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; EMS VCS3{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Electronic_Music_Studios"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Electronic Music Studios{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/EMS_Synthi_100"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Synthi 100{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Look_Mum_No_Computer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; Look Mum No Computer{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://120years.net/ems-synthesisers-peter-zinovief-united-kingdom-1969/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            120years.net &mdash; EMS history{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.modwiggler.com/forum/viewtopic.php?t=277622"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            modwiggler.com &mdash; UK makers list{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK audio / sound-synthesis people in the `lineages`
 * format from docs/CONTENT-MILL.md. Seven lineages:
 *   1. EMS Putney legacy (Robin Wood, AJH Synth, The RadioPhonic)
 *   2. Bristol Eurorack (BugBrand, FSS, Elevator Sound, BeepBoop)
 *   3. London designer-builders (ALM Busy Circuits, Blicken, Expert Sleepers, postmodular)
 *   4. Institutional bench (BBC R&D, Goldsmiths, Sonic Scope)
 *   5. Modular-as-performance (Lowe, Cafe OTO)
 *   6. DIY / open-format wing (Sam Battle / Look Mum No Computer)
 *   7. Immersive audio design (Coda To Coda)
 *
 * All entries verified via public URLs (2026-05-19). Manchester
 * production scene, Edinburgh modular cluster, and South-West
 * rave-rig tradition are flagged as honest gaps rather than padded.
 */
export const entry: Entry = {
  slug: "whos-who-uk-audio-synth-people",
  title:
    "Who's Who — UK audio & sound-synthesis people, seven lineages",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Britain has been making electronic-music instruments since 1969 and the lineage is unbroken. A who's-who organised by line of thinking — the EMS Putney legacy, the Bristol Eurorack circle, the London designer-builder bench, the BBC and Goldsmiths institutional anchor, the modular performers, the DIY YouTube wing, and the immersive-audio application end.",
  Body: WhosWhoUkAudioSynthPeople,
  related: [
    {
      href: "/articles/whos-who-uk-light-painters",
      label: "Who's Who — UK light painters",
      note: "Sibling index; the makers often wire both rigs.",
    },
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire art photographers",
      note: "Where the modular soundtracks are most often heard live.",
    },
    {
      href: "/articles/whos-who-uk-pixel-artists",
      label: "Who's Who — UK pixel artists",
      note: "Adjacent index; chiptune and pixel art share a community.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "The downstream consumers of spatial audio.",
    },
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "Who's Who — UK AI people",
      note: "Generative-audio practitioners cross both fields.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.bugbrand.co.uk/",
      label: "BugBrand — Bristol",
      note: "Tom Bugs; the lo-fi-with-body-contact aesthetic anchor of Bristol Eurorack.",
    },
    {
      href: "https://busycircuits.com/",
      label: "ALM Busy Circuits — London",
      note: "Pamela's New Workout and the London designer-builder bench.",
    },
    {
      href: "https://ajhsynth.com/",
      label: "AJH Synth",
      note: "The RadioPhonic — Hans Zimmer's commission for the Maida Vale site.",
    },
    {
      href: "https://www.lookmumnocomputer.com/",
      label: "Look Mum No Computer",
      note: "Sam Battle's DIY wing and the Kosmo format.",
    },
    {
      href: "https://www.cafeoto.co.uk/",
      label: "Cafe OTO — Dalston",
      note: "The London venue whose programming functions as the modular-performer rolodex.",
    },
    {
      href: "https://www.gold.ac.uk/pg/mmus-sonic-arts/",
      label: "Goldsmiths — MMus Sonic Arts",
      note: "The institutional anchor; the EMS founded 1968.",
    },
  ],
};
