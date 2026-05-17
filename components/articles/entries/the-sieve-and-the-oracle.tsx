import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheSieveAndTheOracleArticle() {
  const ext = "underline underline-offset-4 hover:text-pink-200";

  return (
    <>
      <p>
        Editioned work crosses two gates before it leaves the bench.
        The first is the Sieve &mdash; mechanical, fast, deterministic.
        The second is the Oracle &mdash; slow, considered, mine. The
        Sieve runs first because it catches what can be caught
        mechanically; the Oracle runs second because what it catches
        cannot be caught any other way. They are two different
        instruments and they do not collapse into one. This is one of
        the disciplines the studio has held for a while without naming;
        I am writing it down because the next layer of bench tooling
        leans on the distinction, and because anyone buying an
        editioned piece is owed an honest account of what happened
        between &ldquo;the print came off the printer&rdquo; and
        &ldquo;the print left the studio.&rdquo;
      </p>

      <p>
        <strong>The Sieve.</strong>
      </p>
      <p>
        The Sieve is the mechanical pass. Every check it runs has a
        right answer, a wrong answer, and a script that decides which
        is which. The paper-profile loaded into the print driver
        matches the paper on the platen. The edition number is unique
        against the ledger and falls inside the stated edition size.
        The certificate-of-authenticity fields are populated &mdash;
        edition number, kata, hour, date, paper, signature line. The
        reference-light photograph of the print has been taken and
        filed against the order. The ICC profile is the one the bureau
        soft-proofed against in{" "}
        <Link href="/articles/the-right-paper-for-a-light-painting" className={ext}>
          the paper-and-soft-proof procedure
        </Link>
        . The file&rsquo;s hash matches the master in the editions
        ledger so nobody printed an earlier draft by mistake. None of
        these are taste questions. Each of them has a binary answer
        and a place in the workflow where the answer is read.
      </p>
      <p>
        Most of the Sieve runs without me. The print job carries its
        own paper profile because the bureau&rsquo;s template hard-
        codes it; the edition counter is a Firestore document that
        rejects duplicates; the COA fields are required-fields on the
        order form; the reference-light shot is a checklist item that
        the workflow refuses to advance without. The Sieve is dull on
        purpose. Dull is the correct register for mechanical checks
        because the moment a mechanical check requires interpretation
        it stops being a mechanical check and becomes a small,
        unattributed Oracle done badly.
      </p>
      <p>
        The Sieve has to run first. Mechanical defects are cheap to
        catch and expensive to leave in &mdash; a missing reference-
        light shot discovered three weeks later is a phone call and a
        re-photograph; a wrong edition number discovered after the
        print has been signed is a real problem. Running the Sieve
        first means the Oracle never has to spend its attention on
        anything the script could have caught.
      </p>

      <p>
        <strong>The Oracle.</strong>
      </p>
      <p>
        The Oracle is the slow pass. I sit at the bench under the
        studio&rsquo;s reference light, with the print in front of me
        and a known-good edition from the same line within reach. I
        look at the print. I hold it next to the reference. I decide
        whether it belongs in the line. The decision is not algorithmic
        and I do not pretend it is.
      </p>
      <p>
        What the Oracle catches, in practice: this print of the pendant
        looks right under gallery light but reads dull at the reference
        light I work to, so the buyer&rsquo;s hang will read closer to
        the studio reference than the gallery loan. The trail in this
        exposure ended a millisecond before it should have &mdash;
        barely visible, but I know the kata and the trail finishes
        before the kata does, and that is wrong. The shadow lift on the
        background landed half a stop heavier than the rest of the
        edition; the print is technically clean and metrically inside
        tolerance, and it still does not belong in the line. This is
        the kind of print I would accept from anyone else but not from
        me, on this work, in this edition.
      </p>
      <p>
        The Oracle has refusal authority. The Sieve can pass something
        the Oracle later rejects, and when that happens the print does
        not ship. The studio absorbs the cost &mdash; ink, paper, time,
        the slot on the bench that piece was occupying &mdash; and a
        new print is pulled. There is no override. The Sieve is a
        filter against the script; the Oracle is a filter against my
        own standard, and the second is the one collectors actually
        pay for. The{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          studio&rsquo;s refusals page
        </Link>{" "}
        names this register at a higher altitude; the Oracle is what
        that register looks like at the bench, on a particular Tuesday,
        with a particular print, against a particular reference.
      </p>

      <p>
        <strong>Why they must stay separate.</strong>
      </p>
      <p>
        The temptation is to fold them together. Run one pass, ask one
        question &mdash; does this print ship? &mdash; and trust the
        person at the bench to think about everything at once. I have
        watched this fail in two specific ways, both of which I now
        design against.
      </p>
      <p>
        One, charisma washes through. A print that is mechanically off
        &mdash; the wrong paper, an edition number that does not
        reconcile, a missing reference-light shot &mdash; can read as
        emotionally right under the reference light and the person at
        the bench, who is also me, talks themself past the mechanical
        defect on the strength of how the print looks. That is the
        Oracle doing the Sieve&rsquo;s job, badly. A separate Sieve,
        run first, with a script that does not care how the print
        looks, refuses to let charisma overwrite the ledger. The
        ledger is load-bearing on the edition&rsquo;s value &mdash;
        the buyer is paying partly for the integrity of the number
        being what it says &mdash; and a charismatic print on a
        broken number is not the edition the buyer agreed to.
      </p>
      <p>
        Two, taste-fatigue dulls the Oracle. If the same pass is
        also running mechanical checks &mdash; loading profiles,
        chasing ledger entries, photographing the print under the
        reference light, populating the COA &mdash; the attention I
        bring to the considered judgement is already spent by the
        time I get to it. The Oracle&rsquo;s output is a slow look,
        a comparison, a yes or a no, and that pass deteriorates
        sharply under cognitive load. Splitting the two means the
        Oracle pass arrives with attention unspent and the look is
        the look. Boring as it sounds, the discipline is mostly
        about protecting that attention from being eroded by tasks
        the script could have done.
      </p>

      <p>
        <strong>What this means for collectors.</strong>
      </p>
      <p>
        If a print crossed both gates, two things are true. The
        mechanical record is intact &mdash; the COA fields reconcile,
        the edition number is uniquely yours, the paper named on the
        certificate is the paper under your ink, the reference-light
        photograph exists and is filed against the order, the file
        hash matches the master. And the print belongs in the line in
        my judgement &mdash; under the studio&rsquo;s reference light,
        next to its siblings, on the day the print was signed. The
        first you can audit; the second you trust the person whose
        signature is on the certificate. That is the structure of an
        edition, and it is the structure the{" "}
        <Link href="/bureau" className={ext}>
          bureau
        </Link>{" "}
        runs every print through.
      </p>
      <p>
        The Provenance JSON system will make the Sieve&rsquo;s record
        readable. Each print will leave the bench with a small
        certificate file alongside the paper one &mdash; the same
        edition number, the same paper, the same hash, the same
        reference-light shot reference, the same date, the same
        signature record. The mechanical record becomes auditable for
        anyone the print is sold on to in a decade. The Oracle&rsquo;s
        decision is not in that file because it cannot be; the
        signature is the proxy for it, and the signature is honest
        because the Oracle pass is real.
      </p>

      <p>
        <strong>What this means for the studio&rsquo;s AI substrate.</strong>
      </p>
      <p>
        The same shape is showing up in the bench&rsquo;s software
        layer. The Sieve maps onto the typed contract on{" "}
        <Link href="/stack" className={ext}>
          <code>agent.dialogue</code>
        </Link>{" "}
        &mdash; the system prompt, the JSON output schema, the
        validator that catches a malformed intent before it reaches
        the speaker. The Oracle maps onto the considered response
        itself, the LLM turn that reads the retrieved memory from{" "}
        <code>agent.memory</code> and decides what to say next. The
        validator is mechanical; the response is considered; they are
        separable for the same reason the bench pass is separable, and
        I would rather have two small components doing one thing each
        than one large component doing both badly. Don&rsquo;t read
        more into the parallel than is there. The bench discipline
        came first and the code is following it, not the other way
        round.
      </p>

      <p>
        <strong>The honest verdict.</strong>
      </p>
      <p>
        Two passes. Sieve first, Oracle second. Refusal authority sits
        with the Oracle; ledger authority sits with the Sieve;
        collapsing the two costs the studio its credibility in both
        directions. The discipline is not glamorous and it is not the
        kind of thing the storefront mentions on the listing &mdash;
        the listing names the edition size and the paper and the
        signature, and the work happens behind it. Naming it here, on
        the record, means anyone who wonders what stands behind a
        certificate from this bench can read the procedure that
        produced it.
      </p>
      <p>Right. Back to the bench.</p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-sieve-and-the-oracle",
    title: "The Sieve and the Oracle",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "Editioned work crosses two gates before it leaves the bench. The Sieve is mechanical — paper profile, edition number, COA fields, reference-light photograph, file hash. The Oracle is considered — me, under the studio's reference light, deciding whether the print belongs in the line. The Sieve runs first; the Oracle has refusal authority; they do not collapse into one pass.",
    Body: TheSieveAndTheOracleArticle,
    related: [
      {
        href: "/articles/provenance-as-discipline",
        label: "Provenance as Discipline",
        note: "The typed record the Sieve produces; the structural cousin to this piece.",
      },
      {
        href: "/bureau",
        label: "Print bureau",
        note: "Where the two-pass discipline runs every print through.",
      },
      {
        href: "/articles/the-right-paper-for-a-light-painting",
        label: "The Right Paper for a Light Painting",
        note: "The soft-proof procedure the Sieve checks against.",
      },
      {
        href: "/articles/what-the-studio-wont-do",
        label: "What the Studio Won't Do",
        note: "The refusals register, at higher altitude. The Oracle is what that register looks like at the bench.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The wider working environment the two passes sit inside.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Quality_control",
        label: "Quality control — Wikipedia",
        note: "Background on the two-stage inspection pattern this discipline is a domain-specific case of.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Inter-rater_reliability",
        label: "Inter-rater reliability — Wikipedia",
        note: "Why subjective judgement needs anchoring against a known-good reference, and why the Oracle works against an exemplar from the same line.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Edition_(printmaking)",
        label: "Edition (printmaking) — Wikipedia",
        note: "Why edition-numbering integrity is load-bearing on value, and why the Sieve protects the ledger before charisma can talk past it.",
      },
    ],
  };
