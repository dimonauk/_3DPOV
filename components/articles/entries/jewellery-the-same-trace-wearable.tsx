import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function JewelleryTheSameTraceWearable() {
  return (
    <>
      <p>
        The same photograph that becomes a sculpture can become a
        pendant. The technique is identical &mdash; voxel-trace the
        captured gesture, surface the mesh, embed an acrylic
        waveguide along the trace &mdash; but the body is smaller,
        the LED is smaller, and the wearer carries the gesture into
        rooms the sculpture will never see.
      </p>

      <p>
        <strong>What scales, and what doesn&rsquo;t.</strong>
      </p>
      <p>
        The pipeline scales beautifully down to about 35mm. Below
        that, the acrylic waveguide channel narrows to the point
        that the LED at the root can&rsquo;t deliver enough light to
        carry through the body. The studio&rsquo;s smallest signed
        piece is a 28mm pendant in clear resin with a 1.2mm
        waveguide channel and a 2mm warm-white SMD LED at the root,
        powered by a rechargeable 6mm cell that lasts about eight
        hours on a full charge. Anything smaller than that, the
        light gets eaten by the cross-section before it&rsquo;s
        finished travelling the trace.
      </p>
      <p>
        Above 35mm the design space is generous. Earrings (two
        matched, derived from the same kata at different rotation
        offsets), brooches (single, larger), pendants (medallion-
        scale), bangles (the trace wrapped around a wrist, lit). All
        come from the same source photographs as the sculptures and
        share their field records.
      </p>

      <p>
        <strong>Power, properly.</strong>
      </p>
      <p>
        Wearable lit jewellery is an unsolved problem in fashion. The
        usual answers are bad: a battery in a pocket connected by a
        thin wire (catches on everything), a coin cell that runs for
        two hours then needs replacing (uneconomical, ecologically
        graceless), or a permanent battery that has to be cut out at
        end of life (un-repairable, un-recyclable).
      </p>
      <p>
        The studio&rsquo;s pieces use a magnetic-pogo charging
        contact on the back of the bezel: place the piece on a small
        induction-puck on your bedside table when you take it off,
        charge complete in 90 minutes. The cell is removable for
        service after 1000 cycles (a few years of daily wear). No
        permanent battery glue-trap, no wire down the back of the
        neck. The puck design is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Inductive_charging"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          standard Qi-adjacent{arrow}
        </a>
        ; the cell is a standard 6mm-or-10mm lithium-polymer that
        you can buy from any electronics distributor.
      </p>

      <p>
        <strong>Wear modes.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Always on.</strong> Default. The LED runs at low
          brightness through the waveguide, visible in normal indoor
          light, the trace glowing softly from inside. About eight
          hours on a charge.
        </li>
        <li>
          <strong>Breathe.</strong> A slow sine wave over thirty
          seconds. Sustainable for longer wear (about twelve hours)
          and easier on the eye in close conversation.
        </li>
        <li>
          <strong>Off.</strong> The piece reads as a clear-resin
          sculpture, the trace visible but unlit. Battery indefinite.
          Useful in formal contexts where the light would over-read.
        </li>
        <li>
          <strong>Pulse.</strong> A short two-flash sequence every
          minute. Reserved for performance contexts; not for daily
          wear.
        </li>
      </ul>
      <p>
        Mode is set with a small magnet held to the side of the
        piece for two seconds. No app. No Bluetooth. No firmware
        updates the wearer ever has to think about.
      </p>

      <p>
        <strong>Pairing with the source piece.</strong>
      </p>
      <p>
        Each jewellery edition pairs to a parent photograph and,
        usually, to a parent sculpture or wall array. The field
        record on the back of the bezel names the kata, the
        location, the date, and the parent edition number. An
        owner who has both the sculpture and the pendant has the
        same gesture in two scales &mdash; one in the room, one on
        the body.
      </p>

      <p>
        <strong>Editioning and pricing.</strong>
      </p>
      <p>
        Jewellery editions are small (typically 10&ndash;25 pieces
        per source photograph), signed on the bezel, certificated
        in the same archive as the sculptures and prints. The
        price band sits below the sculptures but above the prints;
        the labour is in the optical channel, not in the metal.
        Current pieces are offered in:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          Clear UV-cure resin (default, lightest, most luminous)
        </li>
        <li>
          Tinted resin (amber, pink, cyan &mdash; matched to the
          source photograph&rsquo;s dominant colour)
        </li>
        <li>
          Resin-and-bronze (the bezel and chain are cast bronze;
          the body is clear resin)
        </li>
      </ul>

      <p>
        Commissions for new katas are accepted. The pipeline from
        "perform the gesture" to "wear the gesture" is around six
        weeks for a single piece; longer for a series. Write in via{" "}
        <Link href="/contact?intent=commission" className={ext}>
          the contact form
        </Link>{" "}
        &mdash; tell me the gesture you want and the scale you want
        to wear it at.
      </p>

      <p>
        The same trace that hangs on a wall can hang from a neck.
        The studio is in the business of holding gestures; the
        choice of scale is yours.
      </p>
    </>
  );
}
