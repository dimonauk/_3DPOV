import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function OsintForFindingYourPeople() {
  return (
    <>
      <p>
        Working artists need to find their peers, and the internet
        will give them up if you know how to read it. This article
        is a glossary-as-essay: the studio walks through the terms
        of open-source intelligence the way a librarian walks
        through the stacks, then says out loud what it uses each
        one for. The frame is peer discovery, not surveillance.
        The point is to end up in a real conversation with
        somebody whose work rhymes with yours.
      </p>

      <p>
        <strong>OSINT</strong> &mdash; open-source intelligence
        &mdash; is the discipline of drawing useful conclusions
        from sources that anyone can lawfully read. Public web
        pages, public social posts, public company records,
        public photographs with their public metadata. It is not
        the same as the tradecraft of an intelligence agency,
        which has classified collection at its disposal and a
        legal frame the rest of us do not. The modern civilian
        practice descends from{" "}
        <a
          href="https://www.bellingcat.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Bellingcat{arrow}
        </a>
        , who showed that a small team with browser tabs and
        patience could verify what a war ministry would not. The
        studio borrows the discipline, never the targets.
      </p>

      <p>
        <strong>Peer discovery</strong> is what the studio
        actually does with the discipline. The UK fire and light
        and VR and AR and motion-capture and 3D-printing scenes
        are dense, small, and mostly online. The people you want
        to meet have, on their own initiative, put their work
        somewhere a search engine can see it. The job is to find
        them without being weird about it, write to them in a way
        they recognise as one of their own, and meet them at the
        next thing in person. The studio&rsquo;s working{" "}
        <Link href="/articles/jon-the-photographer" className={ext}>
          who&rsquo;s-who articles
        </Link>{" "}
        are the visible output of that practice.
      </p>

      <p>
        <strong>The line.</strong> The studio holds one principle
        above all others: if a person has loudly and on their own
        bio said the thing, that thing is findable, and the
        studio will find it. If a person has not said it, the
        studio will not infer it, will not cross-reference it,
        will not produce it. That line is the difference between
        the work this article describes and a practice the
        studio refuses to do. The full ledger of refusals lives
        in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          what the studio won&rsquo;t do
        </Link>{" "}
        and is worth reading alongside this one.
      </p>

      <p>
        What does not get touched. Real-name-to-handle joins for
        anyone publishing under a pseudonym. Outing of any kind,
        on any axis &mdash; sexuality, gender, health, faith,
        legal status, family. Home addresses, even when a planning
        application or a Companies House filing makes them
        reachable. Phone numbers. Minors, full stop. Old accounts
        a person has clearly walked away from. The fact that a
        method exists is never on its own a reason to use it.
      </p>

      <p>
        <strong>Aggregation harm.</strong> A piece of information
        that is harmless on one page becomes a new artefact when
        you stack it next to four others on the same person.
        Regulators take the aggregation seriously and so does
        every artist who would rather you knocked on the front
        door of their portfolio than reconstructed a profile from
        the back. The studio writes about scenes; it does not
        publish dossiers. If a paragraph reads like a dossier
        when finished, the paragraph gets cut.
      </p>

      <p>
        <strong>Citation discipline</strong> is the first method
        and the last. Every claim that ends up in a who&rsquo;s-who
        article carries a public URL captured at the moment the
        studio saw it. The discipline is borrowed wholesale from{" "}
        <Link href="/articles/provenance-as-discipline" className={ext}>
          provenance as discipline
        </Link>{" "}
        &mdash; the same principle the studio applies to every
        photograph in the archive, applied to research. If a
        claim cannot be cited, it does not get written. If a URL
        rots, the article gets updated, not the memory.
      </p>

      <p>
        <strong>Snapshots.</strong> The web is volatile. A bio
        you read in the morning may have been rewritten by the
        afternoon, a portfolio you found on Tuesday may be a
        404 by Friday. The studio takes a snapshot of every page
        it intends to quote, at{" "}
        <a
          href="https://archive.today/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          archive.today{arrow}
        </a>{" "}
        and the{" "}
        <a
          href="https://web.archive.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Wayback Machine{arrow}
        </a>
        , and treats the snapshot URL as the citable artefact.
        The live URL is the courtesy; the snapshot is the receipt.
      </p>

      <p>
        <strong>Corroboration.</strong> The Bellingcat house rule
        is two independent public sources or the claim is a
        rumour. The studio uses the same rule for who&rsquo;s-who
        prose. A person&rsquo;s portfolio site says they shoot
        long-exposure fire photography; the London Fire Spinners
        group page tags them in a session; the rule is met. A
        single Instagram post is not yet a claim, however
        photogenic. The reader of the studio site should be able
        to follow the citations and arrive at two doors, not one.
      </p>

      <p>
        <strong>Geolocation.</strong> Placing a photograph in
        space using nothing but the photograph &mdash; shadow
        angles, skyline features, signage, brickwork bond, the
        shape of a manhole cover. Bellingcat&rsquo;s how-to library
        teaches the technique to anyone who wants to learn. The
        studio uses it gently: not to find where somebody lives,
        but to confirm that a portfolio shoot the photographer
        says happened on the Thames foreshore did in fact happen
        on the Thames foreshore. The corroboration is for the
        scene article, not for the person.
      </p>

      <p>
        <strong>Chronolocation.</strong> Placing a photograph in
        time. Sun angle, moon phase, leaf cover, scaffolding that
        was up between known dates, a poster on a wall for a gig
        with a known date. Useful for dating a portfolio piece
        when the artist has not. Used the same way as
        geolocation: corroborate the scene, not surveil the
        subject.
      </p>

      <p>
        <strong>Sock-puppet hygiene.</strong> The studio
        researches who&rsquo;s-who pieces through accounts that
        are not the studio&rsquo;s personal account. The reason
        is mechanical, not paranoid: recommender algorithms
        learn from what an account looks at, and a personal feed
        is a working tool that should not be polluted with three
        weeks of clicking through every fire-poi tag in the
        Midlands. The research accounts have realistic but
        plainly non-personal names, do not follow anyone the
        studio is researching, and never message anyone. Outreach
        always goes from a real name, on a real channel, with the
        studio&rsquo;s real signature.
      </p>

      <p>
        <strong>The handoff to outreach.</strong> Research that
        does not end in a real conversation is research that
        does not justify itself. The studio keeps a separate
        document of outreach templates &mdash; the cold-but-warm
        email, the introduction-at-an-event line, the credit
        request for a photograph the studio wants to use &mdash;
        and the templates are kept private because they are
        meant to read as one specific person writing to another
        specific person, not as a form. The methods in this
        article are pre-conversation. The conversation is the
        whole point.
      </p>

      <p>
        <strong>The line again, said another way.</strong>{" "}
        Research that produces a dossier on a private individual
        is not what this article describes. Research that
        produces a draft of a paragraph you might say out loud
        to somebody at a gig &mdash; here is what you make, here
        is why I like it, here is what I make, would you like
        coffee &mdash; is. The discipline is the same; the
        ethics are the entire job.
      </p>

      <p>
        For the toolset the studio uses in practice &mdash;
        Maigret, ExifTool, the reverse-image stack, the
        archives, the browser extensions that earn their place
        &mdash; carry on to{" "}
        <Link
          href="/articles/the-osint-stack-for-creative-research"
          className={ext}
        >
          the OSINT stack for creative research
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "osint-for-finding-your-people",
  title: "OSINT for Finding Your People",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A glossary-as-essay on open-source research as the studio practises it: peer discovery, never surveillance. The Bellingcat discipline, applied to finding the artists you want to share a coffee with.",
  Body: OsintForFindingYourPeople,
  related: [
    {
      href: "/articles/the-osint-stack-for-creative-research",
      label: "The OSINT Stack for Creative Research",
      note: "The tools the studio actually uses.",
    },
    {
      href: "/articles/provenance-as-discipline",
      label: "Provenance as Discipline",
      note: "The discipline-of-evidence parallel, applied to images.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The studio's ethos on free code and open work.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The never-cross lines, written down.",
    },
    {
      href: "/articles/jon-the-photographer",
      label: "Jon the Photographer",
      note: "A working example of identifying a public brand by working backwards.",
    },
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire-art photographers",
      note: "The method, applied to one scene.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Applied to another.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "And another.",
    },
    {
      href: "/articles/whos-who-uk-light-painters",
      label: "Who's Who — UK light painters",
      note: "And another.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "And another.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.bellingcat.com/",
      label: "Bellingcat",
      note: "The civilian discipline the studio borrows from.",
    },
    {
      href: "https://bellingcat.gitbook.io/toolkit",
      label: "Bellingcat — Online Investigations Toolkit",
      note: "The curated index of methods and tools.",
    },
    {
      href: "https://archive.today/",
      label: "archive.today",
      note: "Snapshot a page before quoting it.",
    },
    {
      href: "https://web.archive.org/",
      label: "Wayback Machine",
      note: "The long memory of the public web.",
    },
  ],
};
