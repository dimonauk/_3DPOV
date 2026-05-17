import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const code = "mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs";

export default function EditioningASingleExposure() {
  return (
    <>
      <p>
        A single-exposure light-painting photograph is, on the
        negative side of the ledger, easier to make than a composite.
        One frame, one shutter, no layers. On the positive side, it
        is harder to defend. A collector who pays five hundred pounds
        for a print wants to know that the photograph at copy 7 of 25
        is the same photograph as copy 1 of 25, that the artist will
        not quietly run a second edition under a different title, and
        that the file on the studio&rsquo;s drive cannot be
        re-emerged in another five years as a &ldquo;rediscovered
        variant&rdquo;. None of this is paranoia. The market has been
        burned by all of it.
      </p>
      <p>
        This tutorial is how the studio answers those questions in
        the boring, paperwork-shaped way that is, in the end, the
        only honest one. Numbering, certificates, archival storage,
        what to do when the edition runs out. Useful if you are about
        to put your first photograph into an edition and would like
        to do it once, properly, rather than three times, awkwardly.
      </p>

      <h2 className="mt-10 text-2xl">Pick the edition size before you print the first one</h2>

      <p>
        The edition size is a contract with everyone who buys into
        the run. Changing it later devalues the copies already sold,
        and quietly extending an edition once it is &ldquo;sold out&rdquo;
        is the kind of move the secondary market notices and never
        forgets. Decide once, write it down on the certificate, never
        revise.
      </p>
      <p>
        The studio&rsquo;s default for original captures is{" "}
        <strong>15 to 30 + 2 AP</strong>; for hand-worked composites,{" "}
        <strong>10 to 20 + 2 AP</strong>. The conventions that drive
        those numbers are catalogued at{" "}
        <Link href="/codex/edition-size-conventions" className={ext}>
          edition size conventions
        </Link>
        ; the short version is that anything under 10 reads as a
        collector run and prices accordingly, anything over 50 reads
        as a poster, and the middle is where photographic editions
        live because that is where photographic editions have always
        lived.
      </p>
      <p>
        AP stands for{" "}
        <Link href="/codex/artists-proof" className={ext}>
          artist&rsquo;s proof
        </Link>{" "}
        &mdash; copies retained by the studio, numbered{" "}
        <code className={code}>AP 1/2</code> and{" "}
        <code className={code}>AP 2/2</code>, sold only at the end of
        the edition&rsquo;s commercial life when their scarcity has
        turned them into the most valuable copies in the run. The
        studio&rsquo;s rule is two APs, no exceptions. Three feels
        greedy; one is administratively brittle (lose the only proof
        in a basement flood and the edition has no archival reserve).
      </p>

      <h2 className="mt-10 text-2xl">Numbering and the master file</h2>

      <p>
        The numbering convention the studio uses on every print:
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`<title-slug>__<edition-size>__<copy-number>__<paper-code>__<YYYYMM>.tif

# example
crow-spiral-bankside__e25__07-of-25__hpr308__202605.tif`}
      </pre>
      <p>
        Two underscores between fields, lowercase throughout,{" "}
        <code className={code}>hpr308</code> for Hahnem&uuml;hle Photo
        Rag 308 and the equivalent codes for every paper in rotation.
        The paper code matters because the print is the print on its
        paper; a re-print on a different substrate is, formally,
        another edition.
      </p>
      <p>
        The master file lives at{" "}
        <code className={code}>archive/photographs/&lt;title-slug&gt;/master.tif</code>.
        16-bit TIFF, no layers, ProPhoto RGB colour space, the
        soft-proof applied for the paper of record. The studio takes
        a SHA-256 of the master the moment the edition is signed off
        and writes it into the edition&rsquo;s registry row. If a
        file claiming to be the master ever shows up later with a
        different hash, it isn&rsquo;t the master.
      </p>
      <p>
        For the printing workflow upstream of this, the studio&rsquo;s{" "}
        <Link href="/tutorials/calibrating-the-imageprograf-pro-1100" className={ext}>
          PRO-1100 calibration tutorial
        </Link>{" "}
        is the prerequisite read. The point of an edition is that
        every copy is identical; a wobbly print workflow undoes the
        contract before the ink dries.
      </p>

      <h2 className="mt-10 text-2xl">Issue the certificate of authenticity</h2>

      <p>
        One copy, one certificate. Both signed in wet ink. The print
        gets a signature and an edition number on the back in
        pencil; the certificate carries the same information in
        legible form and travels with the print. A buyer who loses
        the certificate is in the same position as a car owner who
        loses the V5C: the thing is still theirs, but resale will be
        twice the work.
      </p>
      <p>
        The minimum fields, every time:
      </p>
      <ul className="ml-6 list-disc space-y-2 text-chrome-300">
        <li>Title of the work.</li>
        <li>Capture date and print date (both, not either).</li>
        <li>Edition size and copy number, stated as &ldquo;copy n of N&rdquo;.</li>
        <li>Paper, ink, dimensions of image area and paper, in millimetres.</li>
        <li>Studio name, address, and a wet signature.</li>
        <li>The master file&rsquo;s SHA-256, in small type, at the foot.</li>
      </ul>
      <p>
        The hash at the foot is the studio&rsquo;s addition to the
        standard set out at{" "}
        <Link href="/codex/certificate-of-authenticity" className={ext}>
          certificate of authenticity
        </Link>
        . The collector will probably never look at it. The
        secondary-market specialist forty years from now will, and
        will be quietly grateful to whoever thought to put it there.
      </p>

      <h2 className="mt-10 text-2xl">Archival storage</h2>

      <p>
        Three copies of the master, in two formats, on two media,
        in two physical locations. The rule is older than the
        studio, and the studio borrowed it from museum conservation
        practice without modification: 3-2-2. The studio&rsquo;s
        current implementation is master TIFF on a NAS at the
        bench, master TIFF on an LTO-9 tape in a fireproof at home,
        and a derived PNG/JPEG pair on cold storage with the
        bureau. If any one location burns, the edition survives. If
        any two burn, the studio has had a very specific kind of
        catastrophically bad day and the photograph is the least of
        the problems.
      </p>
      <p>
        Prints not yet sold live in archival sleeves, flat, in
        unbuffered conservation boxes, in a dark cupboard at room
        temperature with a dehumidifier targeting 45 to 55 percent
        relative humidity. Inkjet pigment on rag paper is
        comfortably stable for a century in those conditions; the
        rated lifetimes from Hahnem&uuml;hle and Canson are best
        understood as a floor, not a ceiling. Don&rsquo;t store
        prints standing on edge in a damp shed. The studio has
        opinions about that, learned the way most opinions are.
      </p>

      <h2 className="mt-10 text-2xl">When the edition runs out</h2>

      <p>
        The honest answer is the one nobody wants to hear: you
        don&rsquo;t reprint. You retire.
      </p>
      <p>
        Once copy 25 of 25 has shipped and both APs have left the
        studio, the edition is closed. The master is marked{" "}
        <code className={code}>retired</code> in the registry, the
        soft-proof profile is archived alongside it, and any future
        request to print &ldquo;just one more&rdquo; for a
        well-meaning relative is answered with the same word the
        well-meaning relative will not enjoy hearing. The exception
        is a different edition: a different paper, a different
        size, a different finish, declared as such on its own
        certificate with its own numbering. That is a new edition
        of the same image, not a continuation of the old one, and
        the collector who bought into the first edition needs to be
        notified before the second one opens. The studio&rsquo;s
        usual practice is to wait five years before re-editioning
        an image, and to use a clearly different paper. Smaller
        editions get longer waits.
      </p>
      <p>
        The reward for all this paperwork is that the studio gets
        to look the seventh collector of any given run in the eye
        and tell them the truth about what they own. The paperwork
        is the contract; the contract is what makes a print an
        edition rather than a poster. Now go fill out the
        certificate for the one you just signed.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "editioning-a-single-exposure",
    title: "Editioning a single exposure",
    date: "2026-05-14",
    kind: "tutorial",
    excerpt:
      "The boring, paperwork-shaped part of selling photographs. Edition size, numbering convention, master-file hashing, certificates of authenticity, 3-2-2 archival storage, and what to do when the edition runs out (you don't reprint, you retire).",
    Body: EditioningASingleExposure,
    related: [
      {
        href: "/tutorials/calibrating-the-imageprograf-pro-1100",
        label: "Tutorial — Calibrating the imagePROGRAF PRO-1100",
        note: "The print workflow upstream of this one. Identical copies require identical calibration.",
      },
      {
        href: "/codex/edition-size-conventions",
        label: "Codex — Edition size conventions",
        note: "Why 15 to 30 + 2 AP, and what the other sizes signal.",
      },
      {
        href: "/codex/certificate-of-authenticity",
        label: "Codex — Certificate of authenticity",
        note: "The full field list the studio's CoA template carries.",
      },
      {
        href: "/codex/artists-proof",
        label: "Codex — Artist's proof",
        note: "Why the studio keeps two, sells them last, and never makes a third.",
      },
      {
        href: "/photographs",
        label: "Photographs",
        note: "The editions the paperwork exists to serve.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Edition_(printmaking)",
        label: "Edition (printmaking) — Wikipedia",
        note: "Where the numbering convention came from, and the 19th-century intaglio practice that justifies it.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Artist%27s_proof",
        label: "Artist's proof — Wikipedia",
        note: "Foundational article on the AP convention and the secondary-market behaviour around it.",
      },
      {
        href: "https://www.hahnemuehle.com/en/digital-papers/fineart-photo/fineart-photo-rag.html",
        label: "Hahnemühle Photo Rag 308 — product page",
        note: "The paper the studio's default certificates declare. Rated for >100 years archival under proper storage.",
      },
      {
        href: "https://www.canson-infinity.com/en/products/baryta-prestige-ii",
        label: "Canson Baryta Prestige II — product page",
        note: "The alternative paper of record for the studio's gloss-finish editions.",
      },
      {
        href: "https://en.wikipedia.org/wiki/SHA-2",
        label: "SHA-256 — Wikipedia",
        note: "The hashing algorithm used to bind a certificate to a specific master file.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Linear_Tape-Open",
        label: "LTO (Linear Tape-Open) — Wikipedia",
        note: "The cold-storage medium the studio uses for one of the three master copies.",
      },
      {
        href: "https://www.archivalmethods.com/",
        label: "Archival Methods — conservation supplies",
        note: "Sleeves, conservation boxes, and the rest of the dark-cupboard kit. The studio buys from them.",
      },
    ],
  };
