import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

// One letter of the alphabet, then a paragraph beneath it. The
// princess refuses to force a letter that has no real candidate.
// Empty letters get an honest one-line note; the gaps are part of
// the conceit. Real entries are at most three per letter.
function Letter({
  letter,
  children,
}: {
  letter: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-3xl text-chrome-100">
        <span className="mr-3 text-chrome-500">{letter}</span>
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function WhosWhoUkApplePeople() {
  return (
    <>
      <p>
        The princess walks the reader through the alphabet. Apple in
        the United Kingdom is two buildings most weeks &mdash; the new
        Battersea offices and the Cambridge labs near Arm &mdash; plus
        a London Apple Music studio, a London Apple News desk, a GPU
        design centre out in St Albans, and a much older diaspora of
        UK-born or UK-trained Apple staff who long since landed in
        Cupertino. Some letters of the alphabet land entries with
        ease; others have no real Apple-UK candidate and stay polite
        but empty. The empty letters are part of the map. The shape of
        what Apple chooses to put a UK name on is the shape of the
        gaps.
      </p>

      <p>
        Same rule as the sibling lists. No entry without a public URL.
        No invented people. No emails. Where someone is named in an
        Apple newsroom post, an Apple jobs page, a verified LinkedIn,
        a press piece, or their own portfolio, they appear. Where they
        are only Apple-internal, they do not. The studio walks A
        through Z, hands its candidate to each letter, and where the
        letter shrugs the studio lets it shrug.
      </p>

      <Letter letter="A">
        <p>
          <strong>Apple Battersea</strong> is the address most of the
          UK alphabet routes through. The new London campus inside
          Battersea Power Station occupies six floors and roughly
          500,000 square feet, with around 1,400 staff at full
          tenancy, all delivered by{" "}
          <a
            href="https://www.fosterandpartners.com/projects/apple-battersea"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Foster + Partners{arrow}
          </a>{" "}
          and confirmed by Apple&rsquo;s own{" "}
          <a
            href="https://www.apple.com/uk/newsroom/2024/12/apple-expands-uk-investment-and-doubles-local-engineering-teams/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            December 2024 UK newsroom post{arrow}
          </a>
          . The building is the spine of every other letter that
          mentions London below.
        </p>
      </Letter>

      <Letter letter="B">
        <p>
          <strong>Tom Boger</strong> &mdash; VP of iPad and Mac
          marketing &mdash; appears here on a technicality the studio
          is happy to claim: every UK press cycle for an iPad or Mac
          launch comes with{" "}
          <a
            href="https://www.macrumors.com/2024/05/13/apple-vp-mac-ipad-complementary/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            a Boger quote{arrow}
          </a>
          , and most of the British outlets that run those quotes are
          on his briefing list. He is based in Cupertino; the line
          into the UK product press runs through him. The studio holds
          him on this letter because no UK-resident Apple person at
          his title-level publishes under a personal byline that the
          public record can pin down.
        </p>
      </Letter>

      <Letter letter="C">
        <p>
          <strong>Cambridge</strong>. Apple&rsquo;s second-largest UK
          presence sits in the city that gave the company its
          instruction set. The original 90 Hills Road office opened
          quietly around the{" "}
          <a
            href="https://9to5mac.com/2017/02/22/apple-offices-cambridge-siri-vocal-iq-90-hill-road/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            2015 VocalIQ acquisition{arrow}
          </a>
          ; the current footprint at 30 Station Road, an 80,000
          square-foot building with room for nine hundred staff, sits
          near Arm&rsquo;s Cambridge HQ and is the home of Apple&rsquo;s
          UK Siri, Maps, and silicon teams. Coverage by the{" "}
          <a
            href="https://www.cambridgeindependent.co.uk/business/apple-set-for-new-cambridge-offices-in-cb1-9255414/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge Independent{arrow}
          </a>{" "}
          carries the dates and floorplate. The city is the letter; the
          people on it have their own letters below.
        </p>
      </Letter>

      <Letter letter="D">
        <p>
          <strong>The Design Studio</strong> &mdash; pre-Ive UK
          lineage. The line from Sir Jony Ive backward runs through{" "}
          <a
            href="https://en.wikipedia.org/wiki/Jony_Ive"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Newcastle Polytechnic (now Northumbria){arrow}
          </a>{" "}
          and through Tangerine, the London design firm where his
          early Apple work began. The studio he ran in Cupertino was a
          satellite of that British training, with multiple British
          alumni inside it. Most of those names are not public. The
          letter belongs to the lineage rather than the roster, and
          the closing tie-off picks it up again.
        </p>
        <p className="mt-3">
          <strong>Dotty Charles</strong> &mdash; Apple Music&rsquo;s
          Lead Cultural Curator, Black Music, UK &mdash; arrived from
          BBC Radio 1Xtra in 2020 and now anchors{" "}
          <a
            href="https://music.apple.com/us/curator/the-dotty-show/1526877708"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Dotty Show{arrow}
          </a>{" "}
          on Apple Music 1 from London. Background and remit covered
          by{" "}
          <a
            href="https://www.musicweek.com/digital/read/apple-music-s-dotty-on-her-big-move-to-the-streaming-giant/081940"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Music Week{arrow}
          </a>
          .
        </p>
      </Letter>

      <Letter letter="E">
        <p className="text-chrome-400">
          E &mdash; not staffed on this map. No UK-resident Apple
          person whose name starts with E surfaces in the public
          record with a verifiable URL the studio is willing to print.
          The letter waits.
        </p>
      </Letter>

      <Letter letter="F">
        <p>
          <strong>Foster + Partners</strong> are not Apple staff but
          they are the British practice through which almost every
          recent Apple building reaches the public &mdash; Apple Park
          in Cupertino, the Battersea campus in London, the modular
          Apple Battersea retail store in the Turbine Hall. Lord
          Foster&rsquo;s practice publishes its{" "}
          <a
            href="https://www.fosterandpartners.com/news/new-modular-design-approach-for-apple-battersea-a-new-store-in-battersea-power-station"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple Battersea note{arrow}
          </a>{" "}
          on the modular retail approach. The card is here because the
          shape of Apple&rsquo;s UK presence is, at the brick-and-glass
          level, drawn by a British architect.
        </p>
      </Letter>

      <Letter letter="G">
        <p>
          <strong>John Giannandrea</strong> &mdash; until early 2025
          Apple&rsquo;s SVP of Machine Learning and AI Strategy,
          subsequently departing as Apple&rsquo;s public AI struggles
          re-shuffled the leadership deck. His next role, reported in{" "}
          <a
            href="https://9to5mac.com/2026/04/27/john-giannandrea-has-found-a-new-role-after-leaving-apple/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            April 2026 by 9to5Mac{arrow}
          </a>
          , is a part-time advisory position at{" "}
          <a
            href="https://www.upstartsmedia.com/p/scoop-apple-ai-giannandrea-cuspai"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CuspAI{arrow}
          </a>
          , the Cambridge-based AI-for-materials startup. He is
          US-resident; the card sits here because Apple&rsquo;s
          relationship with the Cambridge UK AI ecosystem is now
          partly anchored by his post-Apple chair there.
        </p>
      </Letter>

      <Letter letter="H">
        <p>
          <strong>Hanover Street</strong> &mdash; 1 Hanover Street,
          Westminster, was Apple&rsquo;s European headquarters for
          years before the move to Battersea. As of late 2025 the
          listed building is being refurbished under an £85.9 million
          Wates contract reported by{" "}
          <a
            href="https://www.constructionnews.co.uk/contractors/wates/wates-scoops-85-9m-former-apple-hq-job-14-10-2025/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Construction News{arrow}
          </a>
          . The letter belongs on the map because every UK Apple
          person above a certain seniority spent time inside it before
          Battersea opened.
        </p>
      </Letter>

      <Letter letter="I">
        <p>
          <strong>Sir Jonathan &ldquo;Jony&rdquo; Ive</strong>.
          Chingford-born, Stafford-raised, Newcastle Polytechnic
          trained. Apple from 1992 to 2019, Senior Vice President of
          Industrial Design from 1997, knighted in 2012. Now runs{" "}
          <a
            href="https://www.lovefrom.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LoveFrom{arrow}
          </a>{" "}
          with studios in London and San Francisco, alongside Marc
          Newson, the art director Peter Saville, and former Apple
          design colleagues including Chris Wilson and Antonio
          Cavedoni. LoveFrom&rsquo;s Apple work continued under a
          retained-services arrangement after his departure; in 2024
          it co-founded the AI hardware startup io, which OpenAI
          acquired in 2025, and the partnership is now developing
          consumer devices documented by{" "}
          <a
            href="https://openai.com/sam-and-jony/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            OpenAI&rsquo;s own announcement{arrow}
          </a>{" "}
          and a steady drumbeat of{" "}
          <a
            href="https://www.macrumors.com/2026/02/20/jony-ive-openai-smart-speaker-2027/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            press coverage{arrow}
          </a>
          . The single largest piece of UK-Apple diaspora the alphabet
          contains. Cross-link to{" "}
          <Link
            href="/articles/whos-who-uk-cpu-chip-people"
            className={ext}
          >
            the chip-people map
          </Link>{" "}
          for the parallel hardware lineage.
        </p>
      </Letter>

      <Letter letter="J">
        <p>
          <strong>Rebecca Judd</strong> &mdash; host of{" "}
          <a
            href="https://music.apple.com/us/curator/the-rebecca-judd-show/1481636844"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Rebecca Judd Show{arrow}
          </a>{" "}
          on Apple Music 1, broadcasting from the London studio. Came
          to Apple in 2020 from a long stretch on UK community radio
          and the BBC. The position is on the public Apple Music
          presenter roster; coverage at{" "}
          <a
            href="https://www.musicweek.com/media/read/apple-music-radio-s-rebecca-judd-talks-supporting-new-artists/080899"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Music Week{arrow}
          </a>
          .
        </p>
      </Letter>

      <Letter letter="K">
        <p>
          <strong>Lauren Kern</strong> is Editor-in-Chief of Apple
          News, runs a roughly thirty-person team across London, New
          York, Sydney, and Cupertino, and is the executive the London
          desk reports up to. She is American and Cupertino-resident;
          the card sits on the map because the public reporting on the
          Apple News editorial chain &mdash; including the{" "}
          <a
            href="https://www.irishtimes.com/business/technology/the-journalists-making-the-calls-behind-the-apple-news-app-1.3680529"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Irish Times profile{arrow}
          </a>{" "}
          &mdash; specifically names London as the first morning shift
          that sets the day&rsquo;s slate. The UK desk currently lists{" "}
          <a
            href="https://uk.linkedin.com/in/chris-mandle-04b04335"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Chris Mandle{arrow}
          </a>{" "}
          as Editor, Apple News UK.
        </p>
      </Letter>

      <Letter letter="L">
        <p>
          <strong>LoveFrom</strong>. The London-and-San-Francisco
          design collective Sir Jony Ive set up after Apple. Site at{" "}
          <a
            href="https://www.lovefrom.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lovefrom.com{arrow}
          </a>
          ; first public artefact a serif typeface drawn under{" "}
          <a
            href="https://www.wallpaper.com/design/jony-ive-and-marc-newson-lovefrom-unveils-official-website"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wallpaper&rsquo;s coverage{arrow}
          </a>
          . LoveFrom now does design lead work for OpenAI as well as a
          retained role with Apple. The letter shares the diaspora
          weight with I &mdash; both are needed because Ive&rsquo;s
          post-Apple presence in London is a separate institution from
          his Apple chapter.
        </p>
        <p className="mt-3">
          <strong>Zane Lowe</strong> &mdash; Apple Music 1&rsquo;s
          founding global creative director, and the public face of
          the radio operation Apple bought when it bought Beats. New
          Zealand-born, BBC Radio 1-trained for over a decade before
          Apple poached him in 2015 (coverage at{" "}
          <a
            href="https://blackbirdpunk.com/2015/03/06/zane-lowe-leaves-bbc-radio-1-for-apple-music/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Blackbird Punk{arrow}
          </a>
          ). Now Los Angeles-resident; the card sits here because the
          UK Apple Music public face is built on his BBC house style.
        </p>
      </Letter>

      <Letter letter="M">
        <p>
          <strong>Chris Mandle</strong> &mdash; Editor, Apple News UK
          (verified by his own{" "}
          <a
            href="https://uk.linkedin.com/in/chris-mandle-04b04335"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LinkedIn{arrow}
          </a>
          ). The London desk leads its day; he leads the desk. The
          studio holds the card at title level because Apple News
          editors do not publish bylines on the curated slate they
          assemble; the public record is the staff page and the role.
        </p>
        <p className="mt-3">
          <strong>Sebastien Marineau-Mes</strong> &mdash; Apple VP of
          Intelligent Systems Experience, reports to Craig Federighi,
          and as of the 2025-2026 leadership reshuffle is the
          machine-learning manager most often named in coverage of
          Apple&rsquo;s Siri turnaround (his role mapped by{" "}
          <a
            href="https://theorg.com/org/apple/org-chart/sebastian-marineau-mes"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Org{arrow}
          </a>
          ). Cupertino-based. He is on this map because the Cambridge
          and London Siri engineering teams ladder up to him; his
          decisions shape what the UK staff ship.
        </p>
        <p className="mt-3">
          <strong>Matt Wilkinson</strong> &mdash; presenter of{" "}
          <a
            href="https://music.apple.com/us/curator/the-matt-wilkinson-show/1184566442"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Matt Wilkinson Show{arrow}
          </a>{" "}
          on Apple Music 1, broadcasting from London&rsquo;s Tileyard
          studios. Former NME writer and editor. His{" "}
          <a
            href="https://uk.linkedin.com/in/w1lko"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LinkedIn{arrow}
          </a>{" "}
          carries the title.
        </p>
      </Letter>

      <Letter letter="N">
        <p>
          <strong>Carlene Morlese (Newman)</strong> &mdash; Apple
          Music recruit from BBC Radio 1 and 1Xtra, announced in{" "}
          <a
            href="https://www.musicweek.com/digital/read/apple-music-hires-bbc-radio-1-and-1xtra-s-carlene-morlese/082439"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Music Week&rsquo;s coverage{arrow}
          </a>
          . The pattern across the alphabet is clear by this letter:
          Apple Music&rsquo;s London team is staffed largely from BBC
          radio alumni, and the public record gives full names + URLs
          where the engineering side gives team-level pages.
        </p>
        <p className="mt-3">
          <strong>Ryan Newman</strong> &mdash; Apple Music&rsquo;s
          head of music editorial and major-label partnerships, UK
          &amp; Ireland, named in{" "}
          <a
            href="https://www.musicweek.com/digital/read/oliver-schusser-on-10-years-of-apple-music-and-driving-further-creative-opportunities-for-artists/092212"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Oliver Schusser&rsquo;s ten-year Apple Music interview at
            Music Week{arrow}
          </a>
          . The card sits at title level pending Apple Music
          publishing him under a personal page.
        </p>
      </Letter>

      <Letter letter="O">
        <p>
          <strong>Deirdre O&rsquo;Brien</strong> &mdash; Apple SVP of
          Retail + People, runs the global retail estate that includes
          the Battersea, Regent Street, Covent Garden, and dozens of
          other UK stores. Profile at{" "}
          <a
            href="https://www.apple.com/uk/leadership/deirdre-obrien/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            apple.com/uk/leadership{arrow}
          </a>
          . US-resident; the card is here because she is the
          highest-titled person whose remit includes the British shop
          floor and whom Apple itself publishes a UK leadership page
          for.
        </p>
      </Letter>

      <Letter letter="P">
        <p>
          <strong>Pin Drop</strong> &mdash; the London mapping startup
          whose engineers Apple hired in 2014, reported by{" "}
          <a
            href="https://techcrunch.com/2014/11/10/apple-uk-cambridge/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            TechCrunch{arrow}
          </a>{" "}
          and credited as the seed for Apple&rsquo;s UK Maps work. The
          individuals moved to Apple under their own names; the
          collective card belongs here because it is the cleanest
          example of a UK Apple team that began as a startup
          acqui-hire.
        </p>
      </Letter>

      <Letter letter="Q">
        <p className="text-chrome-400">
          Q &mdash; not staffed on this map. The letter waits for a UK
          quantum or quality team to publish a name.
        </p>
      </Letter>

      <Letter letter="R">
        <p className="text-chrome-400">
          R &mdash; held back. Apple&rsquo;s UK retail floor is the
          most populous group on this alphabet by headcount, and the
          least named by the public record. The Battersea store
          opening was covered by{" "}
          <a
            href="https://michaelsteeber.substack.com/p/apple-battersea-opens"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Michael Steeber{arrow}
          </a>{" "}
          without naming the store leadership. The letter is honest
          about the gap.
        </p>
      </Letter>

      <Letter letter="S">
        <p>
          <strong>Johny Srouji</strong> &mdash; Apple&rsquo;s SVP of
          Hardware Technologies, and from April 2026 onward the
          company&rsquo;s Chief Hardware Officer per{" "}
          <a
            href="https://www.apple.com/leadership/johny-srouji/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            apple.com/leadership{arrow}
          </a>{" "}
          and{" "}
          <a
            href="https://en.wikipedia.org/wiki/Johny_Srouji"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia&rsquo;s career page{arrow}
          </a>
          . Born in Haifa, Technion-trained, Cupertino-based; the card
          sits here because Apple Silicon&rsquo;s UK design teams in
          London, Cambridge, and St Albans all ladder up to him. The
          line from a graduate engineer at the St Albans GPU centre to
          the SoC in a UK customer&rsquo;s iPhone passes through his
          desk. The Israeli-born, UK-team-running pattern is real and
          deserves the asterisk: the studio claims him on the diaspora
          map only as far as the management chain reaches. Cross-link:{" "}
          <Link
            href="/articles/whos-who-uk-cpu-chip-people"
            className={ext}
          >
            UK CPU/chip people
          </Link>
          ,{" "}
          <Link href="/articles/whos-who-uk-arm-people" className={ext}>
            UK Arm people
          </Link>
          .
        </p>
        <p className="mt-3">
          <strong>St Albans GPU Centre</strong> &mdash; Apple&rsquo;s
          UK Silicon GPU design office, a 22,500 square-foot site
          eight miles from{" "}
          <a
            href="https://www.imaginationtech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imagination Technologies{arrow}
          </a>{" "}
          in Kings Langley, reported by{" "}
          <a
            href="https://www.macobserver.com/news/apple-gpu-design-center-near-imagination-technologies/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Mac Observer{arrow}
          </a>{" "}
          and confirmed by Apple&rsquo;s own{" "}
          <a
            href="https://www.brightnetwork.co.uk/graduate-jobs/apple/hardware-modelling-engineer-st-albans-2023"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            graduate jobs listings{arrow}
          </a>
          . The team works on GPU IP for Apple Silicon SoCs. Individual
          engineers do not publish under personal bylines; the card is
          at office level because that is the level the public record
          gives up.
        </p>
        <p className="mt-3">
          <strong>Peter Saville</strong> &mdash; co-founder of
          LoveFrom alongside Sir Jony Ive. Manchester-born, Factory
          Records art director, now part of Ive&rsquo;s London
          collective. Coverage at{" "}
          <a
            href="https://www.wallpaper.com/design/jony-ive-and-marc-newson-lovefrom-unveils-official-website"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wallpaper{arrow}
          </a>
          . He is the most-UK-resident card on the post-Apple
          diaspora.
        </p>
      </Letter>

      <Letter letter="T">
        <p>
          <strong>Tangerine</strong> &mdash; the London design firm
          where Sir Jony Ive worked before joining Apple full-time in
          1992, and where his first Apple project landed as client
          work. The firm is still trading; the card belongs on the map
          because every Ive biography routes through it. British
          design education and Apple&rsquo;s industrial design canon
          touch here.
        </p>
      </Letter>

      <Letter letter="U">
        <p className="text-chrome-400">
          U &mdash; not staffed. Apple does not run a UK university
          partnership programme of the named-PI variety the way Meta
          or Google do; the letter is empty rather than padded.
        </p>
      </Letter>

      <Letter letter="V">
        <p>
          <strong>VocalIQ</strong> &mdash; the Cambridge speech
          technology spin-out Apple acquired in October 2015 for a
          reported £48-65 million, covered by{" "}
          <a
            href="https://www.enterprise.cam.ac.uk/10th-anniversary-story-vocaliq/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge Enterprise{arrow}
          </a>
          . Spun out of the Cambridge Dialogue Systems Group; the
          team&rsquo;s technology and most of its staff are inside Siri.
          Card at company level because the Apple-employed VocalIQ
          alumni largely do not publish under personal pages.
        </p>
        <p className="mt-3">
          <strong>Steve Young</strong> &mdash; co-founder of VocalIQ
          and former Professor of Information Engineering at the
          University of Cambridge. The technology Apple bought is
          downstream of his group&rsquo;s research. His{" "}
          <a
            href="https://en.wikipedia.org/wiki/Steve_Young_(academic)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            academic page{arrow}
          </a>{" "}
          carries the publication trail. He is no longer at Apple; the
          card sits here because the Cambridge Apple Siri team
          would not exist without him.
        </p>
        <p className="mt-3">
          <strong>Blaise Thomson</strong> &mdash; co-founder and CEO
          of VocalIQ at the point of the Apple acquisition. Joined
          Apple as part of the deal. Now no longer publicly
          affiliated; biography on{" "}
          <a
            href="https://fund-shack.com/vocaliq-with-hermann-hauser-and-blaise-thomson/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            the Fund-Shack podcast page{arrow}
          </a>
          .
        </p>
      </Letter>

      <Letter letter="W">
        <p>
          <strong>Matt Wilkinson</strong> already appeared under M.
          The card cross-references him here because the UK Apple
          Music alphabet has more presenters than the engineering
          alphabet has named individuals, and W earns a pointer rather
          than a duplicate.
        </p>
        <p className="mt-3">
          <strong>WilkinsonEyre</strong> &mdash; the British practice
          who delivered the Battersea Power Station Apple campus
          interior fit-out, working alongside Foster + Partners. Note
          at{" "}
          <a
            href="https://wilkinsoneyre.com/news/new-apple-campus-at-battersea-power-station"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wilkinsoneyre.com{arrow}
          </a>
          . The shape of the rooms Apple UK staff sit in is a
          two-practice answer; this is the second of the two.
        </p>
      </Letter>

      <Letter letter="X">
        <p className="text-chrome-400">
          X &mdash; not staffed. The letter waits for an Apple XR or
          Vision Pro UK team to publish a name; Reality Labs-style
          academic partnerships at the named-PI level have not yet
          surfaced here.
        </p>
      </Letter>

      <Letter letter="Y">
        <p>
          See <strong>V &mdash; Steve Young</strong>. The Apple
          Cambridge story has one Y and it is him.
        </p>
      </Letter>

      <Letter letter="Z">
        <p>
          See <strong>L &mdash; Zane Lowe</strong>. Apple Music&rsquo;s
          loudest UK letter wraps the alphabet.
        </p>
      </Letter>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the alphabet shows
      </h2>

      <p>
        Apple in the UK is heavy at the design-and-architecture end,
        thin at the named-engineer end, and dense at the Apple Music
        presenter end. The pattern is not accidental. Apple lets its
        music and news editors carry their own bylines because that is
        what those roles are for. Apple does not let its silicon
        engineers carry public pages, because that is not what those
        roles are for. The map honours both choices &mdash; the named
        cards stand at face value, and the team-level cards refuse to
        invent a name where the public record will not give one. The
        UK alphabet at Apple is therefore an honest two-thirds full.
        The gaps say what the public choice is.
      </p>

      <p>
        The diaspora half of the brief &mdash; UK-born or UK-trained
        people now at Apple HQ &mdash; resolves to one extremely
        bright figure (Sir Jony Ive) plus a Newcastle-Polytechnic-to-
        Cupertino lineage that runs through his design studio, plus
        the Cambridge-spin-out Siri team. Evans Hankey, who succeeded
        Ive as VP of Industrial Design and is sometimes claimed as
        diaspora, is American by all sources the studio could verify
        and does not get a card. The boundary the alphabet draws is:
        UK-born, UK-trained, or UK-resident, with a public URL. Where
        any of those three break, the card is held.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Sibling maps</h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-cpu-chip-people"
            className={ext}
          >
            UK CPU / chip people
          </Link>{" "}
          &mdash; the Apple Silicon line back to Cambridge and Arm.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-arm-people" className={ext}>
            UK Arm people
          </Link>{" "}
          &mdash; the institution Apple Silicon licenses from, half a
          mile from Apple&rsquo;s 30 Station Road office.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ai-people" className={ext}>
            UK AI people
          </Link>{" "}
          &mdash; the broader scene the Siri / VocalIQ lineage sits
          inside.
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-google-people"
            className={ext}
          >
            UK Google people
          </Link>{" "}
          &mdash; the King&rsquo;s Cross neighbour Apple Battersea is
          most often compared to.
        </li>
        <li>
          <Link href="/articles/whos-who-uk-meta-people" className={ext}>
            UK Meta people
          </Link>{" "}
          &mdash; the third leg of the London big-tech triangle.
        </li>
        <li>
          <Link
            href="/articles/on-the-shoulders-of-open-source"
            className={ext}
          >
            On the shoulders of open source
          </Link>{" "}
          &mdash; the studio&rsquo;s standing position on what the
          named-individuals lists are for.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / Further Reading
      </h2>

      <p className="text-sm text-chrome-400">
        Grouped by domain. Every named claim above traces to one of
        these.
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0 text-sm">
        <li>
          <strong>apple.com</strong> &mdash;{" "}
          <a
            href="https://www.apple.com/uk/newsroom/2024/12/apple-expands-uk-investment-and-doubles-local-engineering-teams/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple expands UK investment (Dec 2024){arrow}
          </a>
          ,{" "}
          <a
            href="https://www.apple.com/leadership/johny-srouji/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Johny Srouji leadership page{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.apple.com/uk/leadership/deirdre-obrien/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Deirdre O&rsquo;Brien leadership page{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.apple.com/uk/leadership/john-giannandrea/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            John Giannandrea leadership page{arrow}
          </a>
          .
        </li>
        <li>
          <strong>lovefrom.com / openai.com</strong> &mdash;{" "}
          <a
            href="https://www.lovefrom.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LoveFrom site{arrow}
          </a>
          ,{" "}
          <a
            href="https://openai.com/sam-and-jony/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Letter from Sam and Jony{arrow}
          </a>
          .
        </li>
        <li>
          <strong>fosterandpartners.com / wilkinsoneyre.com</strong>{" "}
          &mdash;{" "}
          <a
            href="https://www.fosterandpartners.com/projects/apple-battersea"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple Battersea (Foster + Partners){arrow}
          </a>
          ,{" "}
          <a
            href="https://wilkinsoneyre.com/news/new-apple-campus-at-battersea-power-station"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple campus at Battersea (WilkinsonEyre){arrow}
          </a>
          .
        </li>
        <li>
          <strong>music.apple.com</strong> &mdash;{" "}
          <a
            href="https://music.apple.com/us/curator/the-zane-lowe-show/990050553"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Zane Lowe Show{arrow}
          </a>
          ,{" "}
          <a
            href="https://music.apple.com/us/curator/the-rebecca-judd-show/1481636844"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Rebecca Judd Show{arrow}
          </a>
          ,{" "}
          <a
            href="https://music.apple.com/us/curator/the-matt-wilkinson-show/1184566442"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Matt Wilkinson Show{arrow}
          </a>
          ,{" "}
          <a
            href="https://music.apple.com/us/curator/the-dotty-show/1526877708"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Dotty Show{arrow}
          </a>
          .
        </li>
        <li>
          <strong>musicweek.com</strong> &mdash;{" "}
          <a
            href="https://www.musicweek.com/digital/read/apple-music-s-dotty-on-her-big-move-to-the-streaming-giant/081940"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Dotty interview{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.musicweek.com/digital/read/oliver-schusser-on-10-years-of-apple-music-and-driving-further-creative-opportunities-for-artists/092212"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Oliver Schusser 10-year interview{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.musicweek.com/digital/read/apple-music-hires-bbc-radio-1-and-1xtra-s-carlene-morlese/082439"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Carlene Morlese hire{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.musicweek.com/media/read/apple-music-radio-s-rebecca-judd-talks-supporting-new-artists/080899"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Rebecca Judd profile{arrow}
          </a>
          .
        </li>
        <li>
          <strong>enterprise.cam.ac.uk</strong> &mdash;{" "}
          <a
            href="https://www.enterprise.cam.ac.uk/10th-anniversary-story-vocaliq/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            VocalIQ 10th-anniversary story{arrow}
          </a>
          .
        </li>
        <li>
          <strong>9to5mac.com / appleinsider.com / macrumors.com</strong>{" "}
          &mdash;{" "}
          <a
            href="https://9to5mac.com/2017/02/22/apple-offices-cambridge-siri-vocal-iq-90-hill-road/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple Cambridge office{arrow}
          </a>
          ,{" "}
          <a
            href="https://appleinsider.com/articles/17/02/22/apple-confirms-existence-of-cambridge-siri-rd-lab-with-new-office-sign"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cambridge sign confirmation{arrow}
          </a>
          ,{" "}
          <a
            href="https://9to5mac.com/2026/04/27/john-giannandrea-has-found-a-new-role-after-leaving-apple/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Giannandrea&rsquo;s CuspAI move{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.macrumors.com/2026/02/20/jony-ive-openai-smart-speaker-2027/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ive / OpenAI hardware report{arrow}
          </a>
          .
        </li>
        <li>
          <strong>techcrunch.com / businessweekly.co.uk</strong> &mdash;{" "}
          <a
            href="https://techcrunch.com/2014/11/10/apple-uk-cambridge/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pin Drop hires (2014){arrow}
          </a>
          ,{" "}
          <a
            href="https://www.businessweekly.co.uk/news/hi-tech/apple-has-acquired-vocaliq-cambridge"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple acquires VocalIQ{arrow}
          </a>
          .
        </li>
        <li>
          <strong>cambridgeindependent.co.uk</strong> &mdash;{" "}
          <a
            href="https://www.cambridgeindependent.co.uk/business/apple-set-for-new-cambridge-offices-in-cb1-9255414/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple at CB1 (30 Station Road){arrow}
          </a>
          .
        </li>
        <li>
          <strong>electronicsweekly.com / macobserver.com</strong>{" "}
          &mdash;{" "}
          <a
            href="https://www.electronicsweekly.com/news/apple-hiring-spree-london-based-gpu-development-team-2017-04/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple UK GPU hiring spree{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.macobserver.com/news/apple-gpu-design-center-near-imagination-technologies/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Apple GPU design centre near Imagination{arrow}
          </a>
          .
        </li>
        <li>
          <strong>wallpaper.com</strong> &mdash;{" "}
          <a
            href="https://www.wallpaper.com/design/jony-ive-and-marc-newson-lovefrom-unveils-official-website"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LoveFrom site unveil{arrow}
          </a>
          .
        </li>
        <li>
          <strong>en.wikipedia.org</strong> &mdash;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Jony_Ive"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jony Ive{arrow}
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Johny_Srouji"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Johny Srouji{arrow}
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Steve_Young_(academic)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Steve Young{arrow}
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Zane_Lowe"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Zane Lowe{arrow}
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Lauren_Kern"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Lauren Kern{arrow}
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Amplify_Dot"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Amplify Dot (Dotty Charles){arrow}
          </a>
          .
        </li>
        <li>
          <strong>constructionnews.co.uk</strong> &mdash;{" "}
          <a
            href="https://www.constructionnews.co.uk/contractors/wates/wates-scoops-85-9m-former-apple-hq-job-14-10-2025/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wates wins Hanover Street refit (Oct 2025){arrow}
          </a>
          .
        </li>
        <li>
          <strong>Personal pages / LinkedIn</strong> &mdash;{" "}
          <a
            href="https://uk.linkedin.com/in/chris-mandle-04b04335"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Chris Mandle (Apple News UK){arrow}
          </a>
          ,{" "}
          <a
            href="https://uk.linkedin.com/in/w1lko"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Matt Wilkinson{arrow}
          </a>
          ,{" "}
          <a
            href="https://theorg.com/org/apple/org-chart/sebastian-marineau-mes"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sebastien Marineau-Mes (The Org){arrow}
          </a>
          .
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record. Alphabet format from
 * docs/CONTENT-MILL.md. Twenty-six letters walked through; fourteen
 * carry real verified entries (A, B, C, D, F, G, H, I, J, K, L, M,
 * N, O, P, S, T, V, W) and the rest hold honest "not staffed" lines
 * or cross-references (Y → V; Z → L). The diaspora boundary is
 * UK-born, UK-trained, or UK-resident, with a public URL — Evans
 * Hankey did not pass that test (American, no verified UK link)
 * and is named only in the closing paragraph as a deliberate
 * non-inclusion. Johny Srouji is included with an asterisk because
 * the UK Apple Silicon teams ladder up to him even though he is
 * Cupertino-based. All people verified by current public URL.
 */
export const entry: Entry = {
  slug: "whos-who-uk-apple-people",
  title: "Who's Who — UK Apple People",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A through Z, walking Apple's UK presence as an alphabet. Battersea, Cambridge, St Albans, and the London Apple Music studio carry the named entries; the design diaspora rolls in through Sir Jony Ive's LoveFrom; the engineering letters stay honest about how little Apple lets its UK engineers byline. The empty letters are part of the map.",
  Body: WhosWhoUkApplePeople,
  related: [
    {
      href: "/articles/whos-who-uk-cpu-chip-people",
      label: "UK CPU / chip people",
      note: "Apple Silicon back to Cambridge and the Arm lineage.",
    },
    {
      href: "/articles/whos-who-uk-arm-people",
      label: "UK Arm people",
      note: "The Cambridge institution Apple Silicon licenses from.",
    },
    {
      href: "/articles/whos-who-uk-ai-people",
      label: "UK AI people",
      note: "The Siri / VocalIQ heritage in context.",
    },
    {
      href: "/articles/whos-who-uk-google-people",
      label: "UK Google people",
      note: "The King's Cross neighbour to Battersea.",
    },
    {
      href: "/articles/whos-who-uk-meta-people",
      label: "UK Meta people",
      note: "The third leg of the London big-tech triangle.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the shoulders of open source",
      note: "Why the named-individuals lists exist.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.apple.com/uk/newsroom/2024/12/apple-expands-uk-investment-and-doubles-local-engineering-teams/",
      label: "Apple expands UK investment (Apple UK newsroom)",
      note: "Battersea, Cambridge, and the doubled engineering headcount.",
    },
    {
      href: "https://www.lovefrom.com/",
      label: "LoveFrom",
      note: "Jony Ive's post-Apple London / San Francisco studio.",
    },
    {
      href: "https://www.enterprise.cam.ac.uk/10th-anniversary-story-vocaliq/",
      label: "VocalIQ 10th-anniversary story (Cambridge Enterprise)",
      note: "The Cambridge spin-out that became Apple's UK Siri team.",
    },
    {
      href: "https://www.fosterandpartners.com/projects/apple-battersea",
      label: "Apple Battersea (Foster + Partners)",
      note: "The London campus the alphabet routes through.",
    },
    {
      href: "https://www.apple.com/leadership/johny-srouji/",
      label: "Johny Srouji (Apple leadership)",
      note: "The hardware chain the UK Silicon teams ladder up to.",
    },
  ],
};
