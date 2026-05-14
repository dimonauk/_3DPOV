export default function Teensy() {
  return (
    <>
      <p>
        Teensy is a family of small, USB-based development boards
        produced by PJRC (Paul Stoffregen, Sherwood, Oregon) since
        2008. The boards are physically the size of a postage stamp,
        run Arduino-compatible firmware, and offer significantly
        higher clock speeds and pin counts than the comparable Arduino
        Nano or similar. The 3.x and 4.x generations have become the
        de-facto standard for hobbyist and small-studio
        light-painting-rig firmware where speed matters.<sup>1</sup>
      </p>
      <p>
        The two generations relevant to the studio&rsquo;s practice:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Teensy 3.1 / 3.2 (current studio standard):</strong>{" "}
          Cortex-M4 at 72MHz, 64KB RAM, 256KB flash, hardware floating
          point, SD card socket on the breakout. The frame buffer for
          a 200-LED-per-array rig at full RGB888 fits comfortably in
          memory; the FPU handles the sin/cos/timing maths for
          Hall-effect-synced rotational rigs without breaking sweat.
        </li>
        <li>
          <strong>Teensy 4.0 / 4.1:</strong> Cortex-M7 at 600MHz,
          1MB RAM, 8MB flash. Overkill for current studio rigs;
          earmarked for the next generation, which will run higher
          LED counts (~500) and probably onboard image processing
          rather than pre-baked frames.
        </li>
      </ul>
      <p>
        What makes the Teensy the right substrate for studio rigs:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Real-time-grade timing.</strong> Hardware-PWM
          channels and DMA support let the firmware push LED frame
          data to the addressable strip at the strip&rsquo;s native
          800kHz protocol rate without CPU jitter. On the Hall-effect
          interrupt the firmware shifts frames sub-millisecond, which
          is what gives the rotational rig its registered image.
        </li>
        <li>
          <strong>Arduino-compatible toolchain.</strong> The firmware
          code reads as Arduino C++ to anyone familiar with the
          ecosystem &mdash; same{" "}
          <code className="font-mono text-chrome-200">setup()</code>{" "}
          /{" "}
          <code className="font-mono text-chrome-200">loop()</code>{" "}
          structure, same libraries. Teaching another technician how
          to maintain the firmware is a low-friction handoff.
        </li>
        <li>
          <strong>Hardware SPI for LED protocols.</strong> APA102 /
          SK9822 LEDs use SPI rather than the WS2812&rsquo;s timing-
          sensitive single-wire protocol; on the Teensy 3.x the
          hardware SPI peripheral does this without CPU involvement.
        </li>
        <li>
          <strong>SD card library.</strong> Frames are pre-rendered
          on the desktop, written to SD, and loaded at performance
          time. The Teensy&rsquo;s SD library handles FAT32 + the SPI
          bus simultaneously without trampling the LED-update timing.
        </li>
      </ul>
      <p>
        The studio&rsquo;s current rig firmware fits in about 3,000
        lines of Teensy C++. The main loop reads the Hall-effect
        position, looks up the corresponding frame slice in the SD
        buffer, and writes it to the LED strip via SPI. The complete
        rig is{" "}
        <strong>
          <a
            href="/codex/teensy"
            className="text-pink-200 underline underline-offset-4"
          >
            Teensy
          </a>
        </strong>{" "}
        + TLC5927 constant-current driver +{" "}
        <strong>
          <a
            href="/codex/addressable-leds"
            className="text-pink-200 underline underline-offset-4"
          >
            addressable LEDs
          </a>
        </strong>{" "}
        + Hall-effect rotation sensor; see{" "}
        <strong>
          <a
            href="/codex/pov-led-array"
            className="text-pink-200 underline underline-offset-4"
          >
            POV LED array
          </a>
        </strong>{" "}
        for the whole-instrument picture.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          PJRC is one of the small handful of one-engineer hardware
          companies (Sparkfun&rsquo;s early years, Adafruit&rsquo;s
          early years, Pimoroni) that has consistently shipped good
          tools for the maker community over a long timeline. The
          Teensy ecosystem has stayed coherent across hardware
          generations in a way most consumer electronics never does.
        </li>
        <li>
          For very-high-speed captures &mdash; the rig moving fast
          enough that the 72MHz Teensy 3.1&rsquo;s frame-update loop
          becomes the bottleneck &mdash; the studio uses Teensy 4.x.
          That moment hasn&rsquo;t arrived for current pieces, but
          the upgrade path exists.
        </li>
      </ol>
    </>
  );
}
