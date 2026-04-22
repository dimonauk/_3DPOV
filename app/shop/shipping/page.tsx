export const metadata = { title: "Shipping & Returns" };

export default function ShippingPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-20 prose-chrono">
      <div className="protocol-label">Policy</div>
      <h1 className="display text-4xl mt-4">Shipping &amp; returns</h1>

      <h2 className="display text-2xl mt-10">Dispatch</h2>
      <p>
        Plates ship within 3&ndash;5 working days of order, rolled in an
        acid-free archival tube or, for face-mounted plates, crated flat.
        All shipments are fully insured to declared value.
      </p>

      <h2 className="display text-2xl mt-10">Transit</h2>
      <p>
        UK: 2&ndash;3 working days, tracked. EU: 5&ndash;7 working days,
        tracked and signed. US &amp; rest of world: 10&ndash;14 working
        days by courier. Import duties and local taxes are the
        recipient's responsibility.
      </p>

      <h2 className="display text-2xl mt-10">Returns</h2>
      <p>
        Because editions are small and every impression is accounted for,
        plates are returnable only in the event of transit damage.
        Damaged plates must be reported within 72 hours of delivery, with
        photographs of the tube or crate and the plate itself. A
        replacement from the same edition will be sent wherever possible;
        where the edition has closed, a full refund will be issued.
      </p>

      <h2 className="display text-2xl mt-10">Collection</h2>
      <p>
        Plates may be collected in person from the studio in London by
        prior arrangement. Studio visits are by appointment only.
      </p>
    </article>
  );
}
