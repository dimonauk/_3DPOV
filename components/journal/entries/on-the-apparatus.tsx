import Link from "next/link";

export default function OnTheApparatus() {
  return (
    <>
      <p>
        The studio&rsquo;s kit is not a portfolio. It is a working set.
        A list of what is on the bench, in the workshop, in the air.
      </p>

      <p>
        <strong>
          <Link
            href="/practice"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            The POV LED rigs.
          </Link>
        </strong>{" "}
        Custom-built.{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Teensy 3.1<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>
        ,{" "}
        <a
          href="https://www.ti.com/product/TLC5927"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          TLC5927<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        LED drivers, addressable LEDs, 100 updates per revolution,
        Hall-effect rotation sync. The point
        of building them was photographic sharpness. Commercial pixel
        poi are designed for durability &mdash; they take being dropped
        on concrete. That is not the right tradeoff for image quality.
        The rigs on the bench drift less than half a pixel per
        revolution at the rates the arm sustains.
      </p>

      <p>
        <strong>
          <Link
            href="/aerial"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            The drone fleet.
          </Link>
        </strong>{" "}
        Five airframes. Mavic 2 Pro for stills &mdash; Hasselblad
        L1D-20c, one-inch sensor, adjustable aperture. Neo and Neo 2 for
        proximity and follow-cam, including indoors. Avata 360 for FPV
        with an integrated 8K 360 camera, twin 64MP sensors behind
        200-degree lenses. Mini 5 Pro as the sub-250g travel airframe,
        one-inch sensor, carrier for the AliExpress Bluetooth LED swarm.
        All flown FPV through DJI Goggles and an RC 2 controller,
        head-tracked through an InAir pod, the live feed mirrored to{" "}
        <a
          href="https://www.xreal.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Xreal One Pro<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        AR glasses. Aerial work &mdash; editorial, light painting, 360
        &mdash; runs through the same pipeline.
      </p>

      <p>
        <strong>
          <Link
            href="/bureau"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            The print bureau.
          </Link>
        </strong>{" "}
        Canon imagePROGRAF PRO-1100. Twelve-ink pigment, A2+ capable,
        monochrome managed by three separate dilutions of black.
        Calibrated to a single viewing light. The same machine prints
        the studio&rsquo;s editions and clients&rsquo; work.
      </p>

      <p>
        <strong>
          <Link
            href="/search"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            Object production.
          </Link>
        </strong>{" "}
        SLA resin printing. Hand-finishing. Embedded acrylic waveguides
        grown along the trace lines of the source photograph; LEDs
        seated at the waveguide roots, carrying warm light through the
        body.
      </p>

      <p>
        That is what the studio is, before anything else. The kit. What
        is on the bench is what the practice can do.
      </p>
    </>
  );
}
