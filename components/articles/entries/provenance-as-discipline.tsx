import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function ProvenanceAsDisciplineArticle() {
  return (
    <>
      <p>
        Provenance is not a marketing artefact. It is a discipline. A
        gallery hands you a paper certificate with the buyer&rsquo;s
        name and the edition number on it and calls that provenance.
        That is the document. The discipline is the rule that no
        edition leaves the bench unless a typed, machine-readable
        record of how it came to be exists on disk alongside it,
        signed, hashed, and indexed against the bureau queue. The
        document is the visible half. The record is the half that
        makes the document mean something a decade from now.
      </p>
      <p>
        This article is the studio&rsquo;s commitment, stated in
        public so it can be held to it. Every editioned piece &mdash;
        every signed photograph, every sculpture from the breeding
        engine, every pendant off the atelier line &mdash; ships with
        a typed JSON record. The record is the typed contract for
        the physical artefact. Same shape of thinking as the
        capability registry under{" "}
        <code className="text-pink-200">lib/capabilities/</code>;
        same shape of thinking as the algorithm registry under{" "}
        <code className="text-pink-200">lib/algorithms/</code>. The
        site has been type-checking its bricks for a year. Extending
        that discipline to the print and the print&rsquo;s lineage is
        the natural next step.
      </p>

      <p>
        <strong>What goes in the record.</strong>
      </p>
      <p>
        Eight fields, every one required, every one validated before
        the record will write. Missing a field means the record will
        not ship, which means the print will not ship, which means
        the bench has caught itself before the buyer ever sees the
        gap.
      </p>
      <p>
        One, <em>edition</em>. The edition number and the edition
        size. <span className="font-mono text-pink-200">07/25</span>{" "}
        is not a marketing flourish; it is the position of this
        artefact within a closed sequence. When the edition sells
        through, the record marks the edition closed, and no further
        record with that slug can validate.
      </p>
      <p>
        Two, <em>capture</em>. Camera body, lens, ISO, shutter,
        focal length, aperture where it applies, date, location to
        the precision the buyer is comfortable with, and the lighting
        conditions on the night. For a long-exposure light-painting
        photograph the capture record is unusually rich &mdash; the
        rig, the LED programme on the rig, the gesture path, the
        ambient temperature, the moon phase if it was outdoor work.
        For sculptures and atelier work the capture record names the
        source photograph instead.
      </p>
      <p>
        Three, <em>processing chain</em>. The ICC profile loaded for
        the soft-proof. The paper. The printer. The reference-light
        reading taken against the print under the studio&rsquo;s
        standard viewing booth. The signing date. The off-gas wait
        between the print coming off the platen and the signature
        going on. Anything that touched the file between the camera
        and the cured print is named.
      </p>
      <p>
        Four, <em>reference-light photograph</em>. Not the file
        &mdash; the physical paper, photographed under the bureau&rsquo;s
        5000K CRI-95+ viewing light against a reference colour
        chart. This is a small section of its own below; it is the
        load-bearing field most galleries do not capture.
      </p>
      <p>
        Five, <em>COA hash</em>. A SHA-256 of the canonical
        serialisation of the record. The hash is printed on the
        paper certificate that ships with the artefact. Change one
        byte of the JSON and the hash no longer matches the
        certificate. Tamper-evident, not tamper-proof; the
        distinction matters, and the next section covers it.
      </p>
      <p>
        Six, <em>contextual articles</em>. References to the
        write-ups on this site that frame the work &mdash; the
        article on the rig family that made the trace, the
        calibration tutorial the bureau ran against, the lineage
        piece that places the photograph in its genre. The buyer
        does not have to read them. They have to be findable.
      </p>
      <p>
        Seven, <em>algorithms and pipeline</em>. For pieces where the
        generation pipeline matters &mdash; the breeding-engine
        sculptures, the atelier jewellery, anything off the local-AI
        line &mdash; the record names the algorithm family, the seed,
        the parent in the lineage chain, the fitness score the Oracle
        gated against, and the model weights on disk. For
        photographs the algorithm field is empty. Empty is a valid
        value; the record still requires the field to be present.
      </p>
      <p>
        Eight, <em>signatures</em>. The studio&rsquo;s signing key.
        The optional collector counter-signature when the piece
        changes hands. The chain of custody, recorded once and never
        rewritten, append-only.
      </p>

      <p>
        <strong>Why typed JSON rather than a freeform document.</strong>
      </p>
      <p>
        A freeform document is whatever the writer remembers to
        include on the day they write it. A typed JSON record is
        whatever the schema says it must include, every time, or it
        does not validate. The schema lives in source control with
        the rest of the studio&rsquo;s typed substrate. A missing
        field is a type error. The bureau&rsquo;s release pipeline
        will not let a record with a type error reach the buyer; the
        same{" "}
        <a
          href="https://www.typescriptlang.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          TypeScript{arrow}
        </a>{" "}
        rules that protect the rest of the site protect the
        provenance file.
      </p>
      <p>
        This is not legal-speak. This is bench discipline applied to
        paperwork. The same instinct that makes the print bureau
        soft-proof against the paper ICC before committing the A2
        makes the studio soft-proof the record against the schema
        before committing the certificate. A failed schema check is
        a free lesson at the cheapest possible step. The cost of a
        bad record discovered a decade later, when the collector
        wants to resell and cannot prove the chain, is many orders
        of magnitude higher.
      </p>
      <p>
        The record sits alongside the print&rsquo;s data file in the
        bureau queue. One folder per piece: the original capture
        file, the soft-proofed file, the reference-light photograph,
        the JSON record, the certificate PDF generated from the
        record. The folder is the artefact. The print is the visible
        instance of it.
      </p>

      <p>
        <strong>The reference-light photograph.</strong>
      </p>
      <p>
        This is the field that does the long work. The bureau
        photographs the finished print under its standard viewing
        light &mdash; 5000K, CRI 95+, the same booth named in{" "}
        <Link
          href="/tutorials/calibrating-the-imageprograf-pro-1100"
          className={ext}
        >
          the imagePROGRAF calibration tutorial
        </Link>{" "}
        &mdash; against a reference colour chart in the same frame.
        That photograph is the print as it left the bench, anchored
        to a known light, with a known chart in shot for any later
        eye to read against.
      </p>
      <p>
        Three things this enables. Restoration: a print returned to
        the bureau in ten years, asking to be matched, has a fixed
        reference rather than a memory. Insurance: a claim against
        loss or damage names the reference-light image as the
        documentary baseline, not the original file (the file is the
        recipe; the print under reference light is the dish as
        plated). Re-print: a buyer asking for a second copy of an
        open-edition piece, or the studio re-issuing a closed edition
        under written collector agreement decades on, runs the
        soft-proof against the recorded reference rather than against
        whatever the monitor of that future day happens to be doing.
        The print is the photograph the studio took of the print.
      </p>

      <p>
        <strong>The COA hash.</strong>
      </p>
      <p>
        A signature alone says the studio said this. A hash says
        nobody has changed it since the studio said it. The paper
        certificate carries the studio&rsquo;s signature and the
        SHA-256 hash of the JSON record together; either alone is
        weaker. Anyone with a hashing utility &mdash; including the
        collector, including a future bureau, including any
        downstream party in the chain &mdash; can verify the JSON
        they hold against the hash on the certificate. Mismatch is a
        red flag. Match is not proof, but it is a stronger starting
        position than the gallery norm.
      </p>

      <p>
        <strong>What this gives the collector.</strong>
      </p>
      <p>
        Confidence to resell, gift, restore, or insure. Without the
        record, the print is a private artefact &mdash; it lives in
        a private room and the chain of custody dies with the
        receipt. With the record, it is a <em>piece</em>: an
        artefact with a position in an edition, a verifiable lineage
        to a known bench on a known date, a documentary baseline
        under known light, and a hash that lets every later party
        decide for themselves whether the paperwork they are holding
        is the paperwork the studio issued.
      </p>
      <p>
        Most galleries supply a paper COA. The studio supplies a
        JSON record as well. The COA is the visible half a collector
        hangs alongside the print. The record is the half a
        future-anyone can read, parse, verify, and pass forward.
      </p>

      <p>
        <strong>Connection to the studio&rsquo;s typed substrate.</strong>
      </p>
      <p>
        The capability registry types its bricks. Every capability
        in{" "}
        <code className="text-pink-200">lib/capabilities/</code> is a
        typed contract: inputs, outputs, the shape of the answer it
        returns. The algorithm registry types its algorithms. Every
        entry in{" "}
        <code className="text-pink-200">lib/algorithms/</code> is a
        typed contract: parameters, seed, the geometry it grows.
        The provenance system types its prints. Every editioned
        artefact is a typed contract: edition, capture, processing,
        reference, hash, context, lineage, signature. Same
        philosophy at three different layers of the bench. The bench
        cares enough about its own paperwork to type-check it.

      </p>

      <p>
        <strong>What still needs human judgement.</strong>
      </p>
      <p>
        The schema does not decide whether a piece is ready to
        ship. That is the{" "}
        <Link href="/articles/the-sieve-and-the-oracle" className={ext}>
          Oracle
        </Link>
        &rsquo;s job &mdash; the human-judgement layer that runs
        after the sieve has filtered the technically-valid from the
        technically-broken. A record can be schema-valid and still
        wrong: a print where the trail clips a colour the eye reads
        as wrong, a sculpture the breeding engine produced but no
        one wants to live with. The provenance record cannot save a
        piece the Oracle would not have shipped. It can only carry
        forward, faithfully, the artefacts the Oracle did ship.
      </p>
      <p>
        That is the honest division. The discipline is what makes
        the typed half work. The judgement is what makes the typed
        half worth working on. Both are load-bearing. Neither is
        sufficient alone.
      </p>
      <p>
        Back to the bench.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "provenance-as-discipline",
    title: "Provenance as Discipline",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "Provenance is not a marketing artefact — it is a discipline. Every editioned piece ships with a typed JSON record alongside the paper certificate: edition, capture, processing chain, reference-light photograph of the actual print, COA hash, contextual articles, algorithm lineage. The typed contract for the physical artefact, type-checked the same way the rest of the studio's substrate is.",
    Body: ProvenanceAsDisciplineArticle,
    related: [
      {
        href: "/bureau",
        label: "Print bureau",
        note: "Where the discipline becomes visible to the buyer.",
      },
      {
        href: "/tutorials/calibrating-the-imageprograf-pro-1100",
        label: "Calibrating the imagePROGRAF PRO-1100",
        note: "The viewing booth and reference-light context the provenance record anchors against.",
      },
      {
        href: "/articles/the-right-paper-for-a-light-painting",
        label: "The Right Paper for a Light Painting",
        note: "The paper field of the processing chain, in long form.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The wider working bench the bureau queue lives at the back of.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The structural cousin — typed interfaces, frozen long enough to be useful, the same instinct applied one layer up.",
      },
      {
        href: "/articles/the-sieve-and-the-oracle",
        label: "The Sieve and the Oracle",
        note: "The human-judgement layer the typed record cannot replace.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Provenance",
        label: "Provenance — Wikipedia",
        note: "The art-world definition of the term, and why the gallery norm of a paper COA is the visible half of a longer chain.",
      },
      {
        href: "https://en.wikipedia.org/wiki/SHA-2",
        label: "SHA-2 — Wikipedia",
        note: "The hashing family the COA hash is drawn from. SHA-256 specifically.",
      },
      {
        href: "https://www.typescriptlang.org/",
        label: "TypeScript",
        note: "The language the schema is written in; the rules that keep a missing field from shipping a record.",
      },
      {
        href: "https://en.wikipedia.org/wiki/JSON",
        label: "JSON — Wikipedia",
        note: "The serialisation format the record is canonicalised against before hashing.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Certificate_of_authenticity",
        label: "Certificate of authenticity — Wikipedia",
        note: "Background on the paper-COA convention the JSON record extends rather than replaces.",
      },
    ],
  };
