export default function C2paContentProvenance() {
  return (
    <>
      <p>
        C2PA &mdash; the Coalition for Content Provenance and
        Authenticity &mdash; is an open technical standard for
        cryptographically binding a piece of media to a verifiable
        record of its origin and history. The coalition was founded in
        February 2021 as a merger of two earlier efforts (Adobe&rsquo;s
        Content Authenticity Initiative and Microsoft &amp; BBC&rsquo;s
        Project Origin) under the Joint Development Foundation. The
        version 1.0 specification was published in January 2022;
        version 2.0, with hardware-attested capture and more flexible
        assertion schemas, followed in 2024.<sup>1</sup>
      </p>
      <p>
        The mechanism in summary: a creating tool (camera, editor,
        printer driver) writes a signed <em>manifest</em> into the
        media file. The manifest contains a list of assertions
        &mdash; capture device, capture time, software pipeline,
        ingredients of any composite, applied edits &mdash; and a
        cryptographic signature from a recognised certificate
        authority. Subsequent edits append to the manifest rather than
        replacing it, so the resulting file carries a chain of custody
        in the same way a Git commit history does. Any participant in
        the chain can be verified independently; a missing or broken
        link is visible.
      </p>
      <p>
        Adoption in 2026 sits at a useful but partial level. Leica
        ships C2PA-signed capture on the M11-P and SL3. Sony added it
        to the Alpha 1 II via firmware. Adobe writes manifests from
        every Creative Cloud application. Microsoft writes manifests
        for AI-generated images out of Bing and Copilot. The major
        news agencies (Reuters, AFP, BBC) have moved to C2PA-signed
        ingest, and the EU AI Act provisions reaching enforcement in
        2026 explicitly cite C2PA as one acceptable mechanism for the
        AI-content-disclosure requirement.
      </p>
      <p>
        For the studio, C2PA is the technical layer underneath the
        provenance discipline that the editioning practice already
        depended on. Every editioned print sold from 2026 forward
        carries a C2PA manifest embedded in the source file, signed at
        the moment of capture, with the printing pipeline&rsquo;s
        assertions appended at production time. A future buyer
        verifying the chain reads back the original capture date, the
        rig used, the ICC profile, and the studio&rsquo;s
        signature.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The founder list reads as a who-of-who of the
          provenance-anxiety world circa 2021: Adobe, Microsoft, the
          BBC, Intel, Sony, Arm, Truepic. The absence of Apple from
          the founder list is conspicuous; Apple has subsequently
          adopted compatible mechanisms in iCloud Photos metadata
          without formally joining the coalition.
        </li>
        <li>
          The signature on the studio&rsquo;s manifests is issued by
          DigiCert under the studio&rsquo;s legal entity, not by the
          camera body. A camera-attested manifest is technically
          stronger but requires capture hardware the studio does not
          yet operate. The pipeline-attested manifest is the working
          compromise until the rig firmware grows secure-enclave
          signing of its own.
        </li>
      </ol>
    </>
  );
}
