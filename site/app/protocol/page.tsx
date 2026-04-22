export const metadata = {
  title: "The Protocol",
};

export default function ProtocolPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 prose-chrono">
      <div className="protocol-label">Document 000</div>
      <h1 className="display text-5xl mt-4 leading-[1]">The Protocol</h1>

      <p className="mt-10 text-lg">
        The Chrono-Protocol is a standing set of rules for making work in
        the city. It is not a method and not a manifesto. It is closer to a
        liturgy &mdash; a fixed order of things, repeated at fixed places
        and hours, until the places answer.
      </p>

      <h2 className="display text-2xl mt-12">I. The kata</h2>
      <p>
        A kata is a gesture held long enough to become a fact. For the
        Protocol, each kata is chosen for one reason only: it can be
        performed on location, without permission, and leaves no
        permanent mark. A walking circle. A standing figure. A slow turn.
      </p>

      <h2 className="display text-2xl mt-12">II. The rig</h2>
      <p>
        The recording instrument is a rotating persistence-of-vision
        display &mdash; a ring of 96 LEDs driven by a Teensy 3.1, spun
        against a hall-sensor reference. At revolution rate, the ring
        resolves as a volume. The camera exposes for the length of the
        kata. The result is a single-frame composite of the body's
        passage through space.
      </p>
      <p>
        The rig is the direct descendant of the 3DPOV display documented
        elsewhere in the studio. The Protocol is what happens when that
        instrument is taken out of the workshop and into the street.
      </p>

      <h2 className="display text-2xl mt-12">III. The plate</h2>
      <p>
        Each collection yields one or more plates. They are printed in
        small, numbered editions on archival paper, signed, and
        accompanied by a certificate of authenticity bearing the
        collection code, the coordinates, the hour, and the date of
        performance.
      </p>

      <h2 className="display text-2xl mt-12">IV. The archive</h2>
      <p>
        Every kata is logged whether or not it yields a plate. Failed
        performances, weather-cancelled sessions, unreleased records
        &mdash; these are the underside of the Protocol and are kept with
        the same care as the published work. A selection from the
        archive is released to subscribers twice yearly.
      </p>

      <h2 className="display text-2xl mt-12">V. The promise</h2>
      <p>
        No edition is ever re-opened. No plate is ever re-printed beyond
        its stated edition plus two artist proofs. The certificate is the
        record. The record is the work.
      </p>
    </article>
  );
}
