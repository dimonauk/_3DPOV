import Footer from "components/layout/footer";
import Link from "next/link";
import RigSimulatorClient from "./rig-simulator-client";

export const metadata = {
  title: "Rig simulator — POV LED array, simulated end-to-end",
  description:
    "A WebGL-accurate simulation of the studio's POV-LED rig. Real LED chipset (SK9822), real microcontroller timing (Teensy 4.1), real Hall-effect synchronisation, real long-exposure accumulation. Upload an image, watch the rig draw it, export the 4D space-time event cloud the photograph is a projection of.",
};

export default function RigSimulatorPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Rig simulator</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The rig,
          <br />
          before the rig.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          A simulation of the studio&rsquo;s POV-LED rig, accurate to
          the real components on the bench. SK9822 LEDs driven by a
          Teensy 4.1 with TLE5012B Hall-effect synchronisation, on a
          4S LiPo regulated to 5V. Upload a vertical-slice-ready image
          and watch the rig draw it through a simulated long exposure.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          What the simulator outputs is two things at once: the{" "}
          <strong>photograph</strong> &mdash; the 2D projection that a
          camera with the shutter open the same length of time would
          capture &mdash; and the underlying{" "}
          <strong>4D space-time event cloud</strong> &mdash; one point
          per LED per timestep, recorded as{" "}
          <code className="font-mono text-chrome-100">
            (x, y, z, t, r, g, b, intensity)
          </code>
          . The photograph is one projection of the cloud. The 4D
          cloud itself is the canonical source data the studio&rsquo;s
          editioned derivatives (print, 3D-printed waveguide object,
          AR HoloWalk playback, spatial video) all read from.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/codex/pov-led-array"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · POV LED array
          </Link>
          <Link
            href="/codex/teensy"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · Teensy
          </Link>
          <Link
            href="/codex/addressable-leds"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · addressable LEDs
          </Link>
          <Link
            href="/codex/persistence-of-vision"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · persistence of vision
          </Link>
        </div>

        <div className="mt-12">
          <RigSimulatorClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">The 4D insight</div>
          <p className="mt-3">
            A long-exposure photograph of an LED rig is the integration
            over time of a 4D space-time light field. The 4D field is{" "}
            <code className="font-mono text-chrome-100">
              { "{ x, y, z, t, r, g, b, intensity }"}
            </code>{" "}
            per LED per timestep &mdash; for a 30-second exposure with
            a 200-LED rig spinning at 5 revolutions per second updating
            at 60 frame-updates per second, that&rsquo;s 360,000 events.
          </p>
          <p className="mt-4">
            That dataset is identical in shape to a{" "}
            <strong>4D Gaussian Splat</strong> (the format Apple SHARP +
            4DGaussians produce from video). The difference is that
            the studio doesn&rsquo;t have to <em>infer</em> the 4D from
            a 2D recording &mdash; the firmware already knows it. Every
            byte the Teensy clocked into the LEDs was an event at a
            known position and time. The studio can output the 4D
            dataset directly, without losing accuracy to the
            inference step.
          </p>
          <p className="mt-4">
            Every downstream derivative is a different render of the
            same canonical source: print is the time-integration
            projection, the printable waveguide object is the
            depth-of-events mesh, the HoloWalk AR view is the event
            cloud played back from the visitor&rsquo;s viewpoint at
            their walking time-slice. One source, many outputs.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
