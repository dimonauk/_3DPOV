export default function EditionSizeConventions() {
  return (
    <>
      <p>
        An edition is a finite, numbered run of identical pieces from
        a single artistic source &mdash; the photographic print, the
        cast object, the screenprint, the etching. The convention
        emerged from intaglio printmaking in the 19th century, when
        the plate&rsquo;s gradual wear made &ldquo;identical&rdquo;
        a polite fiction and a stated print number became the only
        honest way to indicate which copy a collector held.<sup>1</sup>
      </p>
      <p>
        Modern photographic and digital-process editions inherit the
        convention without inheriting the original justification: a
        Hahnem&uuml;hle print at copy 23/25 is physically identical to
        copy 2/25, since the inkjet hardware and the digital source
        file haven&rsquo;t degraded between them. The numbering serves
        a different purpose now &mdash; a contract between the artist,
        the collector, and the secondary market that no more than 25
        will ever exist.
      </p>
      <p>Common edition sizes, with the conventions they signal:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>1/1 (unique).</strong> One copy, never repeated.
          Used for hand-worked pieces, monoprints, performance
          documentation where the artefact is treated as the
          performance&rsquo;s only record.
        </li>
        <li>
          <strong>1/3 to 1/5 (small).</strong> The collector edition.
          Often used for rare or hand-worked variants; signals the
          artist&rsquo;s judgement that this piece sits at the top of
          a series. Higher per-copy price.
        </li>
        <li>
          <strong>1/7 to 1/15 (medium).</strong> The discerning
          edition. Common for editions that need to be substantial
          enough to feel collectable but small enough to keep the
          per-copy value meaningful.
        </li>
        <li>
          <strong>1/20 to 1/50 (standard photographic).</strong> The
          fine-art-photography norm. Big enough to be commercially
          viable, small enough to read as serious.<sup>2</sup>
        </li>
        <li>
          <strong>1/100+ (large).</strong> Decorative / poster edition
          territory. Some artists use this size when the piece is
          deliberately accessible-priced. Risk: the secondary market
          treats it as non-collectable.
        </li>
      </ul>
      <p>
        Holo-Flow Studio editions are typically <strong>15 to 30 + 2
        AP</strong> for original captures, <strong>10 to 20 + 2 AP</strong>
        for hand-worked composites. See{" "}
        <strong>
          <a
            href="/codex/artists-proof"
            className="text-pink-200 underline underline-offset-4"
          >
            Artist&rsquo;s proof
          </a>
        </strong>{" "}
        for what the &ldquo;AP&rdquo; means and{" "}
        <strong>
          <a
            href="/codex/certificate-of-authenticity"
            className="text-pink-200 underline underline-offset-4"
          >
            Certificate of authenticity
          </a>
        </strong>{" "}
        for the document each numbered copy ships with.
      </p>
      <p>
        Closing an edition is the artist&rsquo;s contractual obligation
        to never produce another numbered copy in the same format. The
        digital source file is preserved; the studio&rsquo;s practice
        is to mark the file as closed in its provenance manifest and
        to retire the corresponding ICC printer profile from the
        active queue. New formats of the same image (different paper,
        different size, video edition, 3D-printed waveguide derivative)
        are separate editions, separately numbered.<sup>3</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The British Museum&rsquo;s 18th-century print collection has
          examples of plates where the difference between the first
          twenty pulls and the last hundred is plainly visible to the
          naked eye; the print number was the only way a buyer at the
          time could know what they were getting.
        </li>
        <li>
          The most-cited modern reference points are Sebasti&atilde;o
          Salgado&rsquo;s 30-copy editions in his major series and
          Andreas Gursky&rsquo;s 6-copy editions at huge scale. Different
          economic models, both legitimate.
        </li>
        <li>
          The waveguide-object derivative of a photographic edition is
          treated by the studio as a separate edition specifically
          because the conversion (capture &rarr; depth map &rarr;
          printable mesh) is a new artistic decision, not a copy. The
          object&rsquo;s certificate cites the source photograph and
          its edition.
        </li>
      </ol>
    </>
  );
}
