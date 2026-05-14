export default function CertificateOfAuthenticity() {
  return (
    <>
      <p>
        A certificate of authenticity (CoA) is a document accompanying
        an artwork that records its identity, edition number, materials,
        date of production, and artist&rsquo;s signature. In the art
        market, a legitimate CoA distinguishes an authorised editioned
        copy from a re-print, a forgery, or a private copy that was
        never meant to leave the studio. Its primary use is on resale
        &mdash; the document is what the secondary-market buyer
        actually reads.<sup>1</sup>
      </p>
      <p>
        The CoA conventions inherited from the 20th-century print
        market specify, at minimum:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Title and date of the work.</strong> Both the
          original capture date and the print/object production date.
        </li>
        <li>
          <strong>Edition size and copy number.</strong> Stated as
          &ldquo;copy n of N&rdquo; or &ldquo;AP m of M&rdquo;.
        </li>
        <li>
          <strong>Medium and substrate.</strong> &ldquo;Pigment
          inkjet on Hahnem&uuml;hle Photo Rag 308gsm&rdquo; is
          specific enough.
        </li>
        <li>
          <strong>Dimensions.</strong> Image area + paper size,
          stated in mm or inches.
        </li>
        <li>
          <strong>Artist&rsquo;s signature, in ink, on the document.</strong>{" "}
          A printed signature on the CoA itself is not sufficient
          &mdash; a wet signature is what gives the document its
          legal weight.
        </li>
        <li>
          <strong>Studio identifier and contact.</strong> So a
          future buyer can verify provenance against the studio&rsquo;s
          records.
        </li>
      </ul>
      <p>
        More recent CoA conventions, particularly for digital and
        editioned-photographic work, also include:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Unique serial number.</strong> The CoA&rsquo;s own
          identifier, distinct from the print&rsquo;s edition number.
        </li>
        <li>
          <strong>Cryptographic provenance (C2PA).</strong> A signed
          manifest embedded in the source file binding the original
          capture, the printing process, and the certificate to a
          single auditable trail. The studio adopts C2PA on every new
          edition from 2026 forward.<sup>2</sup>
        </li>
        <li>
          <strong>Per-print provenance metadata.</strong> Capture
          location (where the kata was performed), capture date and
          time, the rig used, the printer used, the ICC profile
          version &mdash; the field record the photograph descends
          from.
        </li>
      </ul>
      <p>
        Holo-Flow Studio certificates ship one per purchased copy,
        printed on the same paper stock as the print itself (Hahnem&uuml;hle
        Photo Rag 308gsm). Each carries the studio&rsquo;s embossed seal,
        a wet signature, the production specifics, and a QR code linking
        to the print&rsquo;s online provenance page on holoflow.co.uk.
        The C2PA manifest is embedded in the source file at edition
        production time and is auditable indefinitely.
      </p>
      <p>
        See{" "}
        <strong>
          <a
            href="/codex/edition-size-conventions"
            className="text-pink-200 underline underline-offset-4"
          >
            Edition size conventions
          </a>
        </strong>{" "}
        for what numbered editions signal, and{" "}
        <strong>
          <a
            href="/codex/artists-proof"
            className="text-pink-200 underline underline-offset-4"
          >
            Artist&rsquo;s proof
          </a>
        </strong>{" "}
        for the AP convention each certificate notes.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The 2010s saw enough high-profile auction-house forgery
          scandals (the Knoedler Gallery affair being the most
          documented) that the resale market hardened around documentary
          authentication. A CoA without verifiable studio of origin
          carries roughly the weight of a handwritten note.
        </li>
        <li>
          C2PA (Coalition for Content Provenance and Authenticity) is
          an open standard developed by Adobe, Microsoft, the BBC and
          others, designed for cryptographically signing media at the
          point of creation. The studio&rsquo;s 2026 adoption brings
          editioned photographic prints onto the same provenance rails
          that broadcast journalism is moving toward.
        </li>
      </ol>
    </>
  );
}
