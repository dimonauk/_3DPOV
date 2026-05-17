import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = (
  <span className="ml-0.5 text-chrome-500">&nearr;</span>
);

export default function BuildingAPovLedRig() {
  return (
    <>
      <p>
        Most people who want to write images in air for a camera to find
        buy a commercial pixel poi, and most of them are reasonably
        content with the result. If you are reasonably content, this
        tutorial is not for you. Go in peace; I wish you many parrots
        at many weddings.
      </p>
      <p>
        If you are not reasonably content &mdash; if you have looked at
        a swung photograph and noticed the trails are blurry where they
        should be sharp, or the colours have drifted where they were
        meant to hold steady &mdash; sit down. We are going to build the
        thing that fixes it. It will take a weekend if you are efficient
        and a fortnight if you keep mistaking the data line for the
        power line, which everyone does at least once.
      </p>

      <p>
        <strong>What you are making.</strong> A{" "}
        <a
          href="https://en.wikipedia.org/wiki/Persistence_of_vision"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          persistence-of-vision rig{arrow}
        </a>
        : a strip of addressable LEDs on a balanced chassis, driven by
        a fast microcontroller, synchronised against a rotation sensor
        so the image lands on the same arc of space each time the rig
        swings through it. The eye assembles the image because the eye
        assembles everything. The camera assembles the image because
        the shutter is open for fifteen seconds and the rig has swept
        through the same volume eight or nine times by then. Magic.
        Also: physics.
      </p>

      <p>
        <strong>Bill of materials.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          A{" "}
          <a
            href="https://www.pjrc.com/teensy/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Teensy 4.1{arrow}
          </a>{" "}
          &mdash; the studio&rsquo;s rigs use the 3.1 but the 3.1 has
          been graciously retired by its makers, and the 4.1 will do
          everything you need and several things you do not yet realise
          you need. Get the one with pin headers presoldered unless you
          enjoy soldering.
        </li>
        <li>
          A{" "}
          <a
            href="https://www.ti.com/product/TLC5927"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            TLC5927{arrow}
          </a>{" "}
          LED driver &mdash; or two, depending on how many channels you
          want. Read the{" "}
          <a
            href="https://www.ti.com/lit/ds/symlink/tlc5927.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            datasheet{arrow}
          </a>{" "}
          before you buy. (You will not. I forgive you. Read it
          afterwards.)
        </li>
        <li>
          A short strip of <strong>addressable LEDs</strong>: SK6812 RGBW
          or WS2812B will both work. The SK6812 has a dedicated white
          channel which is useful if you photograph in colour and
          unnecessary if you don&rsquo;t. The{" "}
          <a
            href="https://learn.adafruit.com/adafruit-neopixel-uberguide"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Adafruit NeoPixel guide{arrow}
          </a>{" "}
          covers the choice in unusual depth.
        </li>
        <li>
          A <strong>Hall-effect sensor</strong> with a small magnet
          &mdash; any cheap one will do.{" "}
          <a
            href="https://learn.sparkfun.com/tutorials/hall-effect-sensors"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            SparkFun&rsquo;s tutorial{arrow}
          </a>{" "}
          explains the physics, but the short version is: the magnet
          goes past the sensor, the sensor twitches, the microcontroller
          notices.
        </li>
        <li>
          A balanced chassis. This is studio-specific. Carbon fibre is
          overkill; aluminium is too heavy; injection-moulded ABS that
          you have designed yourself in{" "}
          <a
            href="https://www.openscad.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            OpenSCAD{arrow}
          </a>{" "}
          and had printed at a bureau is just right.
        </li>
        <li>
          Connectors, capacitors, a logic-level shifter (74AHCT125 is
          fine), wire that does not break when bent, heat-shrink in
          three sizes, and a battery you trust.
        </li>
        <li>
          A camera, a tripod, and a dark room. See the studio&rsquo;s{" "}
          <Link
            href="/tutorials/your-first-long-exposure"
            className={ext}
          >
            tutorial on first long exposures
          </Link>{" "}
          if you have not taken one yet.
        </li>
      </ul>

      <p>
        <strong>
          The mechanical bit, which most people get wrong.
        </strong>
      </p>
      <p>
        Balance is more important than weight. A 200g rig that swings
        true will photograph better than a 100g rig that wobbles. Mount
        the LED strip along the rig&rsquo;s spin axis, not perpendicular
        to it. Place the battery and the controller on opposite ends of
        the chassis so the moment-of-inertia is roughly even. Place the
        pivot in the middle of mass, not the middle of length.
      </p>
      <p>
        The magnet for the Hall sensor goes on the part of the rig that
        is stationary relative to the spin. The sensor reads it once
        per revolution. That tick is your timing reference.
      </p>

      <p>
        <strong>
          The electrical bit, which fewer people get wrong but it is
          still worth saying.
        </strong>
      </p>
      <p>
        The Teensy outputs 3.3V logic. WS2812B-style LEDs want 5V data.
        Without a level shifter, the LEDs will mostly work and then
        occasionally produce nonsense at unpredictable moments, which
        is the worst kind of bug. Use the 74AHCT125. It costs less than
        a coffee. Place a 1000&micro;F capacitor across the LED
        strip&rsquo;s power input; this prevents the in-rush current
        from browning out your microcontroller on startup. The Adafruit
        Überguide above is forensic about this. Read it twice.
      </p>
      <p>
        The Hall sensor is straightforward: power, ground, signal. Wire
        the signal to a Teensy GPIO with interrupt capability. Most of
        them have it.
      </p>

      <p>
        <strong>Firmware.</strong>
      </p>
      <p>
        Get{" "}
        <a
          href="https://fastled.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          FastLED{arrow}
        </a>{" "}
        installed &mdash; Teensyduino is the friendliest path. Light up
        one LED. Light up the whole strip. Make it cycle colours. This
        will take you an hour and you will need it; the satisfaction of
        seeing the strip work is fuel for the harder firmware steps.
      </p>
      <p>
        Then: attach an interrupt to the Hall sensor. Have it set a
        timestamp on every tick. The difference between two consecutive
        ticks is your revolution period. Divide it into your desired
        column count &mdash; 100 is a good starting target &mdash; and
        you have a microsecond budget per column. The Teensy can hit
        that budget with room to spare.
      </p>
      <p>
        Each column-update writes a slice of your image to the strip.
        The strip is, briefly, that slice. The rig moves, the slice
        moves, the eye and the camera fill in the rest.
      </p>

      <p>
        <strong>Testing.</strong>
      </p>
      <p>
        Programme a vertical white line as your first image. Take it
        into a dark room with the camera on a tripod, fifteen seconds
        at f/8, ISO 200. Swing the rig steadily. If you see a vertical
        white line in the photograph, congratulations: you have built
        the thing.
      </p>
      <p>
        If you see a wavy ghost of a line that swims around, your sync
        is off. Check the Hall magnet position. Check the interrupt
        latency. Try a slower swing.
      </p>
      <p>
        If you see nothing: your LEDs are not lighting in time. Re-read
        the firmware.
      </p>

      <p>
        <strong>What next.</strong>
      </p>
      <p>
        A vertical line is not interesting. Programme a portrait next;
        the difference between a line and a face is fewer pixels than
        you think. The studio&rsquo;s article on{" "}
        <Link
          href="/articles/why-i-build-my-own-rigs"
          className={ext}
        >
          why these rigs exist
        </Link>{" "}
        goes deeper into the architectural choice of angle-versus-time
        synchronisation, which is the difference between a rig that
        photographs and a rig that performs.
      </p>
      <p>After that, the rest is taste.</p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "building-a-pov-led-rig",
    title: "Building a POV LED Rig",
    date: "2024-02-11",
    kind: "tutorial",
    excerpt:
      "A bill of materials and assembly walkthrough for a first persistence-of-vision rig. Teensy, LED driver, addressable strip, Hall sensor, chassis.",
    Body: BuildingAPovLedRig,
    related: [
      {
        href: "/tutorials/your-first-long-exposure",
        label: "Tutorial — Your First Long-Exposure Light Painting",
        note: "The discipline this rig is built to extend.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The argument that motivates the bench-built approach.",
      },
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The studio's full kit list for context.",
      },
      {
        href: "/practice",
        label: "Practice — Stage IV, POV LED arrays",
      },
    ],
    furtherReading: [
      {
        href: "https://www.pjrc.com/teensy/",
        label: "Teensy microcontrollers — PJRC",
        note: "Vendor home; download the Teensyduino IDE plugin from here.",
      },
      {
        href: "https://www.pjrc.com/teensy/td_pulse.html",
        label: "Teensy hardware timers and pulse generation — PJRC",
        note: "The microsecond-level timing reference you will need for column-by-column LED output.",
      },
      {
        href: "https://www.ti.com/lit/ds/symlink/tlc5927.pdf",
        label: "TLC5927 datasheet (PDF) — Texas Instruments",
        note: "Full pinout, timing, and grayscale handling. Bookmark this; you will refer back constantly.",
      },
      {
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
        label: "NeoPixel Überguide — Adafruit Learn",
        note: "Read end to end before specifying your LED strip. Power budget, level-shifting, capacitor placement.",
      },
      {
        href: "https://fastled.io/",
        label: "FastLED library",
        note: "Cross-platform addressable-LED library. The studio rigs use a custom driver but FastLED is the right place to start.",
      },
      {
        href: "https://learn.sparkfun.com/tutorials/hall-effect-sensors",
        label: "Hall-effect sensors — SparkFun Learn",
        note: "How magnetic-field sensors work and how to wire one for rotation detection.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "Why the rig works at all. The eye and the camera both rely on this.",
      },
    ],
  };
