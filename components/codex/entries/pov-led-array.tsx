export default function PovLedArray() {
  return (
    <>
      <p>
        A persistence-of-vision LED array &mdash; POV LED array &mdash;
        is a display formed by a line (or grid) of addressable LEDs
        whose individual elements are updated rapidly while the array
        itself moves through physical space. To a still observer the
        array appears as a streak of flickering points. To a
        long-exposure camera, the array writes a two-dimensional (or,
        given motion in space, three-dimensional) image into the frame.
      </p>
      <p>
        The principle was demonstrated in mechanical form by Patrick
        D&rsquo;Arcy in 1768. Its electronic implementation became
        common with the arrival of inexpensive microcontrollers and
        addressable LED strips in the 2000s, and especially with the
        advent of WS2812 / SK6812 (&ldquo;NeoPixel&rdquo;) LEDs around
        2013.
      </p>
      <p>A working POV LED array combines:</p>
      <ul className="ml-6 list-disc space-y-1">
        <li>A linear (or planar) bank of individually-addressable LEDs.</li>
        <li>
          A microcontroller capable of pushing frame data to the LEDs
          fast enough that the eye, or the camera, integrates the trace.
        </li>
        <li>
          A means of synchronising the frame index against the
          array&rsquo;s position in space. For rotational rigs this is
          typically a Hall-effect sensor reading a magnet on the shaft;
          for handheld rigs it can be a time-based assumption or an IMU.
        </li>
        <li>
          A pre-prepared image, decomposed into vertical slices, served
          one slice at a time as the rig moves.
        </li>
      </ul>
      <p>
        Commercial implementations include Bitbanger Labs&rsquo;
        Pixelstick (a 200-LED bar designed to be walked through frame,
        introduced 2014), the Pixel Poi line (LED poi chassis loaded
        from SD card), and Magiblade staves. Open-hardware reference
        designs include Adafruit&rsquo;s MiniPOV series.<sup>1</sup>
      </p>
      <p>
        Bespoke studio rigs, including the Holo-Flow Studio rigs,
        typically sacrifice the durability of commercial pois for
        tighter timing, brighter LEDs, custom firmware, and image
        quality. The studio&rsquo;s current generation is built around
        Teensy 3.1 microcontrollers, TLC5927 constant-current drivers,
        addressable LEDs running 100 updates per revolution synced to a
        Hall-effect rotation reference, with frame data prepared in
        software and loaded onto an SD card before performance.<sup>2</sup>
      </p>
      <p>
        What the camera captures from a POV LED array is not the body
        carrying the rig &mdash; it is the programmed image, briefly
        resident as light in physical space. See{" "}
        <strong>
          <a
            href="/codex/persistence-of-vision"
            className="text-pink-200 underline underline-offset-4"
          >
            Persistence of vision
          </a>
        </strong>{" "}
        for the optical foundation.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The studio&rsquo;s argument with the commercial rigs &mdash;
          documented at length in{" "}
          <strong>
            <a
              href="/articles/why-i-build-my-own-rigs"
              className="text-pink-200 underline underline-offset-4"
            >
              Why I Build My Own Rigs
            </a>
          </strong>{" "}
          &mdash; is not that they don&rsquo;t work. It is that they
          work for the use case they were designed for (handheld
          single-bar light-painting at consumer prices) and not for the
          studio&rsquo;s use case (precise per-revolution-synced
          rotational rigs producing geometric primitives the camera can
          later read as printable mesh).
        </li>
        <li>
          The Teensy + TLC5927 + addressable LED stack is the working
          generation. Earlier generations used ATmega328 + APA102; the
          frame rate at the LEDs was not the bottleneck even there. The
          bottleneck was always the synchronisation jitter at the
          shaft, which is why every new rig generation pushes harder on
          the Hall-effect side of the timing budget.
        </li>
      </ol>
    </>
  );
}
