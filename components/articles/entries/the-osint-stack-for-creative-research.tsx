import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheOsintStackForCreativeResearch() {
  return (
    <>
      <p>
        This is the workshop companion to{" "}
        <Link href="/articles/osint-for-finding-your-people" className={ext}>
          OSINT for finding your people
        </Link>
        . The other article holds the discipline; this one is the
        kit list. Each tool gets its own paragraph: what it does,
        where to get it, when the studio reaches for it, and an
        honest verdict on what it is not good at. The whole stack
        runs locally on a workshop machine, no cloud
        OSINT-as-a-service involved.
      </p>

      <p>
        <strong>Maigret.</strong>{" "}
        <a
          href="https://github.com/soxoj/maigret"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/soxoj/maigret{arrow}
        </a>
        . A username sweep across roughly 2,500 sites. You hand
        it a handle and it tells you which platforms have an
        account at that name. The studio&rsquo;s most common use
        is the question &ldquo;is this Instagram handle the same
        person as this Flickr handle?&rdquo; A clean Maigret run
        will line up half a dozen platforms in a coherent column
        and the answer is obvious. The studio runs Maigret as a
        first pass on any verified handle, treats the results as
        leads not conclusions, and then opens each candidate in
        a browser tab to read in human eyes. Verdict: brilliant
        for usernames; no good at emails; expect false positives
        on common dictionary handles.
      </p>

      <p>
        <strong>ExifTool.</strong>{" "}
        <a
          href="https://exiftool.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          exiftool.org{arrow}
        </a>
        . The canonical image-metadata reader by Phil Harvey.
        Hand it a JPEG and it returns the camera body, often the
        lens, often the firmware version, sometimes the GPS
        coordinates, the date and time the shutter fired,
        sometimes the photographer&rsquo;s name if they wrote it
        into the camera. The studio uses ExifTool on the
        studio&rsquo;s own photographs at archive time, and
        sparingly on a public image when a portfolio claims a
        particular camera and the studio wants to corroborate
        before quoting. Honest about the limits: Instagram
        strips almost everything, Facebook strips almost
        everything, X strips almost everything, Flickr keeps
        most of it, a portfolio site self-hosted on the
        artist&rsquo;s domain often keeps everything. If a
        photograph has been laundered through a major platform,
        ExifTool will have very little to say.
      </p>

      <p>
        <strong>archive.today and the Wayback Machine.</strong>{" "}
        <a
          href="https://archive.today/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          archive.today{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://web.archive.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          web.archive.org{arrow}
        </a>
        . Two snapshot services with complementary coverage.
        archive.today freezes a single page rendered as the
        snapshotter saw it, paywalls and all, and gives back a
        permanent short URL. The Wayback Machine crawls
        continuously and lets you read a domain across years.
        The studio takes a snapshot of any page it intends to
        quote in an article, pastes the snapshot URL into the
        article&rsquo;s working notes, and treats the snapshot
        as the citation of record. The discipline is one of the
        cheapest improvements a research practice can make and
        the studio recommends it to every artist it talks to.
      </p>

      <p>
        <strong>Reverse-image search, four engines.</strong> Use
        all four. The right answer is whichever one finds it
        first.{" "}
        <a
          href="https://images.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Google Images{arrow}
        </a>{" "}
        is the broad sweep,{" "}
        <a
          href="https://lens.google/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Google Lens{arrow}
        </a>{" "}
        is its more recent and often stronger sibling,{" "}
        <a
          href="https://yandex.com/images/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Yandex{arrow}
        </a>{" "}
        is the one with the eye for faces and places (and the
        one Bellingcat has historically rated highest for that
        task), and{" "}
        <a
          href="https://tineye.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          TinEye{arrow}
        </a>{" "}
        is the one that finds the earliest known appearance of
        an image. The studio&rsquo;s use is narrow: trace a
        photograph back to its uploader so the credit can be
        right. None of the four is reliable on heavily
        recompressed or composited images; expect to crop and
        re-search.
      </p>

      <p>
        <strong>Sherlock.</strong>{" "}
        <a
          href="https://github.com/sherlock-project/sherlock"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/sherlock-project/sherlock{arrow}
        </a>
        . The older sibling to Maigret. Same idea, smaller site
        list, faster on a small handful of well-known platforms.
        The studio uses Maigret in practice but Sherlock is
        worth knowing because plenty of tutorials still reach
        for it first and the output is straightforward to read.
        If a workshop has Sherlock installed and not Maigret,
        Sherlock will still answer the basic question.
      </p>

      <p>
        <strong>Bellingcat&rsquo;s Online Investigations
        Toolkit.</strong>{" "}
        <a
          href="https://bellingcat.gitbook.io/toolkit"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          bellingcat.gitbook.io/toolkit{arrow}
        </a>
        . The canonical curated index, kept current by the
        people who set the discipline. The studio treats it as
        the textbook: when a question arrives that the in-house
        kit does not answer, the toolkit is the first place to
        look for the right tool and the right method. Most of
        what is in it is overkill for peer-discovery work, and
        that is fine; the small subset that applies is enough.
      </p>

      <p>
        <strong>OSINT Framework.</strong>{" "}
        <a
          href="https://osintframework.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          osintframework.com{arrow}
        </a>
        . A bookmark-tree by category. Visually it is a
        branching diagram of every kind of public-source query
        anyone has thought to catalogue. The studio uses it
        about once a quarter, when an unusual question
        (&ldquo;public photographs of a particular festival in
        2017&rdquo;) needs a starting node and the toolkit has
        not chosen one yet. Not a daily tool. Worth a bookmark.
      </p>

      <p>
        <strong>Browser extensions worth installing.</strong>{" "}
        <a
          href="https://github.com/ninoseki/mitaka"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mitaka{arrow}
        </a>{" "}
        adds a right-click context menu that hands a selected
        string (a domain, a URL, an IP, an email, a hash) to the
        right lookup service in one click. It saves the friction
        of remembering which database answers which question.
        The Wayback Machine ships its own browser extension that
        flags broken links with a one-click route to the most
        recent capture; install it once and broken links stop
        being a problem. These two are the studio&rsquo;s only
        permanent extensions on a research browser. Everything
        else is a tab.
      </p>

      <p>
        <strong>What not to install.</strong>{" "}
        <a
          href="https://www.spiderfoot.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Spiderfoot{arrow}
        </a>{" "}
        is overkill for peer discovery and fingerprints
        aggressively while it runs; the studio does not use it.
        Maltego&rsquo;s paid tier is brilliant for serious
        investigative journalism and disproportionate to the job
        of finding a fire-poi photographer in Manchester; price
        and complexity both rule it out. Anything that demands
        paid API keys to find artists is the wrong shape of
        spend for an artist-led practice, and the studio walks
        away from those. Free, local, transparent, and
        proportionate is the rule.
      </p>

      <p>
        <strong>Running it all locally.</strong> The studio
        keeps a Python virtual environment at{" "}
        <code className="rounded bg-chrome-900/60 px-1.5 py-0.5 text-chrome-200">
          D:/Tools/osint/
        </code>{" "}
        with Maigret installed, ExifTool on the path, and no
        telemetry beyond whatever each tool sends to perform
        the searches it has been asked to perform. No cloud
        OSINT-as-a-service, no third-party dashboard, no
        credentials handed to a startup whose business model is
        opaque. The principle is the same one in{" "}
        <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
          on the shoulders of open source
        </Link>
        : free code, locally run, audited if needed. A
        workshop machine should be answerable to its workshop.
      </p>

      <p>
        For the discipline these tools serve &mdash; the ethics,
        the line, the corroboration rule, the handoff to a real
        conversation &mdash; the companion article is{" "}
        <Link href="/articles/osint-for-finding-your-people" className={ext}>
          OSINT for finding your people
        </Link>
        . Read both before opening a research tab.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "the-osint-stack-for-creative-research",
  title: "The OSINT Stack for Creative Research",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Tool-by-tool: Maigret, ExifTool, archive.today, the reverse-image stack, Sherlock, the Bellingcat toolkit, and the browser extensions that earn their place. What the studio runs, locally, with no cloud OSINT-as-a-service.",
  Body: TheOsintStackForCreativeResearch,
  related: [
    {
      href: "/articles/osint-for-finding-your-people",
      label: "OSINT for Finding Your People",
      note: "The companion piece — the discipline these tools serve.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Why the kit is free, local, and auditable.",
    },
    {
      href: "/articles/provenance-as-discipline",
      label: "Provenance as Discipline",
      note: "Citation discipline, applied to images.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The lines that govern how these tools get used.",
    },
    {
      href: "/articles/jon-the-photographer",
      label: "Jon the Photographer",
      note: "An example of identifying a public brand by working backwards.",
    },
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire-art photographers",
      note: "Where the stack ends up in print.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Same.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "Same.",
    },
    {
      href: "/articles/whos-who-uk-light-painters",
      label: "Who's Who — UK light painters",
      note: "Same.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "Same.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/soxoj/maigret",
      label: "Maigret — username sweep across 2,500+ sites",
      note: "The studio's first-pass tool.",
    },
    {
      href: "https://exiftool.org/",
      label: "ExifTool — image metadata reader",
      note: "Phil Harvey's canonical CLI.",
    },
    {
      href: "https://github.com/sherlock-project/sherlock",
      label: "Sherlock — older sibling to Maigret",
      note: "Smaller list, still useful.",
    },
    {
      href: "https://bellingcat.gitbook.io/toolkit",
      label: "Bellingcat — Online Investigations Toolkit",
      note: "The canonical curated index.",
    },
    {
      href: "https://osintframework.com/",
      label: "OSINT Framework — bookmark tree",
      note: "Worth a bookmark for the unusual question.",
    },
    {
      href: "https://archive.today/",
      label: "archive.today",
      note: "Snapshot a single page.",
    },
    {
      href: "https://web.archive.org/",
      label: "Wayback Machine",
      note: "Snapshot a whole domain, over time.",
    },
    {
      href: "https://github.com/ninoseki/mitaka",
      label: "Mitaka — right-click OSINT extension",
      note: "Worth installing.",
    },
  ],
};
