export const metadata = { title: "Certificate of Authenticity" };

export default function CertificatePage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-20 prose-chrono">
      <div className="protocol-label">Policy</div>
      <h1 className="display text-4xl mt-4">Certificate of authenticity</h1>
      <p className="mt-8">
        Every plate released under the Chrono-Protocol ships with a single
        certificate on 300 gsm cotton rag, embossed with the studio seal
        and hand-signed.
      </p>
      <p>
        The certificate records six facts: the collection code, the plate
        reference, the edition number, the coordinates of the
        performance, the hour and date of the kata, and the studio's
        commitment that no further impressions of this plate will ever
        be made.
      </p>
      <p>
        The certificate is the authoritative record. Plates without their
        certificate are outside the archive. The archive maintains a
        private ledger of certificate numbers against owners, held only
        for the purpose of confirming provenance on resale.
      </p>
      <h2 className="display text-2xl mt-10">On reprints</h2>
      <p>
        No edition is re-opened. No plate is re-issued in a different
        size, on a different paper, or under a different code. Two artist
        proofs are retained per edition and are not for sale.
      </p>
    </article>
  );
}
