import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;
const code =
  "rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100";

export default function ProgrammingPovFrames() {
  return (
    <>
      <p>
        You have{" "}
        <Link
          href="/tutorials/building-a-pov-led-rig"
          className={ext}
        >
          the rig
        </Link>
        . You have made it draw a vertical white line. The next
        question is how to make it draw something other than a
        vertical white line: a photograph, a pattern, a typeface, a
        portrait.
      </p>
      <p>
        The image data the rig writes is structured to fit the way
        the rig moves through space. You can&rsquo;t just throw a
        JPEG at it and hope. This tutorial covers how to get from a
        regular image to the per-column frame data the firmware
        actually wants.
      </p>

      <p>
        <strong>What the rig sees.</strong>
      </p>
      <p>
        Imagine the strip of LEDs on the rig as a one-pixel-wide,
        N-pixel-tall display. As the rig spins, the display moves
        through angle. The firmware writes one full vertical column
        of pixels per angular sample. At 100 samples per revolution
        and 16 LEDs on the strip, that&rsquo;s a 100&times;16 grid of
        pixels per revolution &mdash; written as a polar image,
        sampled radially. Wrap the grid into a circle and you have
        your output space.
      </p>
      <p>
        The image you want to display is rectangular. The image the
        rig prints is polar. Step one is unwrapping yours into theirs.
      </p>

      <p>
        <strong>Preparing the source image.</strong>
      </p>
      <p>
        Take a regular image &mdash; a photograph or an illustration
        &mdash; and render it through a polar warp so that the
        original&rsquo;s vertical axis maps to the radial axis of the
        rig, and the original&rsquo;s horizontal axis maps to angle.
        The two axes need to be sized correctly: the original&rsquo;s
        width becomes 100 columns (or whatever your angular sample
        count is); the original&rsquo;s height becomes N pixels
        radially.
      </p>
      <p>
        Concretely in Python with{" "}
        <a
          href="https://numpy.org/doc/stable/reference/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          NumPy{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://pillow.readthedocs.io/en/stable/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Pillow{arrow}
        </a>
        :
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-4 text-xs leading-relaxed text-chrome-200">
        <code>{`from PIL import Image
import numpy as np

src = np.array(Image.open("source.png").convert("RGB"))  # (H, W, 3)
ANGULAR = 100   # samples per revolution — match your firmware
RADIAL  = 16    # LEDs on the strip

# Resize the source to (RADIAL, ANGULAR) — this IS the polar image.
img = Image.fromarray(src).resize((ANGULAR, RADIAL), Image.LANCZOS)
polar = np.array(img)  # shape (RADIAL, ANGULAR, 3)`}</code>
      </pre>
      <p>
        At this point <span className={code}>polar</span> is your
        per-column frame data, one column per angular sample, one
        pixel per LED on the strip. The columns can be written
        straight to the rig.
      </p>

      <p>
        <strong>Gamma and brightness.</strong>
      </p>
      <p>
        LEDs are linear-output devices that humans see in a logarithmic
        way; cameras are somewhere between. A pixel value of 255
        produces a much bigger jump in the photograph than the
        difference between 128 and 129 does, even though the integers
        suggest they&rsquo;re the same step. Apply a gamma curve to
        the polar image before writing it; the studio uses a gamma of
        2.2 by default, lifted from{" "}
        <a
          href="https://en.wikipedia.org/wiki/Gamma_correction"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          standard sRGB-to-linear{arrow}
        </a>
        :
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-4 text-xs leading-relaxed text-chrome-200">
        <code>{`linear = (polar.astype(np.float32) / 255.0) ** 2.2
gamma_corrected = (linear * 255).clip(0, 255).astype(np.uint8)`}</code>
      </pre>

      <p>
        <strong>Writing the frame data.</strong>
      </p>
      <p>
        The Teensy firmware expects a flat byte array, ANGULAR &times;
        RADIAL &times; 3 bytes. Write it row-major over angle (one
        column written at a time, in angle order) and column-major
        over radius (top of strip first):
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-4 text-xs leading-relaxed text-chrome-200">
        <code>{`flat = gamma_corrected.transpose(1, 0, 2).reshape(-1)
# Now flat[0..N*3] is column 0; flat[N*3..2*N*3] is column 1; etc.
flat.tofile("image.bin")`}</code>
      </pre>
      <p>
        Drop <span className={code}>image.bin</span> onto the
        microcontroller&rsquo;s SD card (or program-flash it; the
        studio rigs run from flash for speed). The firmware reads it
        on power-on, then writes column N to the strip each time the
        Hall sensor reports the rig is at angle N.
      </p>

      <p>
        <strong>The angular reference matters.</strong>
      </p>
      <p>
        Where the rig writes column zero in space depends on where
        you set the Hall-sensor magnet. The studio rigs put the magnet
        at the top of the spin (12 o&rsquo;clock from the
        performer&rsquo;s point of view); the firmware reads that
        tick and starts at column zero from there. If your image
        looks rotated in the photograph &mdash; "the parrot&rsquo;s
        head is at the bottom" &mdash; rotate your source image
        before warping, not the firmware. The firmware should be
        agnostic to image content.
      </p>

      <p>
        <strong>Brightness budget.</strong>
      </p>
      <p>
        Each WS2812B at full white draws around 60mA. Sixteen LEDs at
        full white is roughly 1A. A typical 18650-cell pack can
        deliver that; full white for the entire image is rare, and
        the camera will integrate the per-LED average across the
        exposure. If the rig browns out during a spin, lower the
        peak brightness in software rather than capping the supply.
        The{" "}
        <a
          href="https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Adafruit power notes{arrow}
        </a>{" "}
        are the canonical reference.
      </p>

      <p>
        <strong>Test patterns.</strong>
      </p>
      <p>
        Three patterns the studio runs every time it brings out a
        new rig:
      </p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Vertical white line.</strong> ANGULAR&times;RADIAL
          with one column set to (255, 255, 255), all other columns
          zero. The photograph should show a straight vertical line
          at one specific angle. If it wobbles, sync is off.
        </li>
        <li>
          <strong>RGB stripes.</strong> Three columns at columns 0,
          33, 66 set to pure red, green, blue. The photograph should
          show three clean stripes 120&deg; apart. If the colours
          smear into each other, the LEDs are receiving the data
          late or the gamma is wrong.
        </li>
        <li>
          <strong>Photograph of a face.</strong> An actual portrait.
          If the face is recognisable to a stranger looking at the
          photograph for the first time, the rig is ready for real
          work.
        </li>
      </ol>

      <p>
        After the third test pattern, the bench part of the practice
        is done. The next part is choreography &mdash; getting the
        body to walk the right spatial path while the rig writes the
        image. That&rsquo;s not a tutorial. That&rsquo;s a thousand
        hours of poi practice and a notebook.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "programming-pov-frames",
    title: "Programming Frames for a POV Rig",
    date: "2024-09-22",
    kind: "tutorial",
    excerpt:
      "From a regular image to the per-column polar data the rig actually wants. Gamma, brightness budgets, the angular reference, and the three test patterns the studio runs on every new rig.",
    Body: ProgrammingPovFrames,
    related: [
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "The hardware this tutorial presumes you have on the bench.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The architectural argument for angle-sync vs time-sync.",
      },
      {
        href: "/play",
        label: "Play — solo level two, The Trail",
        note: "The angular-sync architecture this tutorial walks through, played in a browser instead of programmed.",
      },
      {
        href: "/practice",
        label: "Practice — Stage IV, POV LED arrays",
      },
      {
        href: "/journal/on-the-bench-year-ten",
        label: "On the Bench, Year Ten",
        note: "The field record of the first rig that did this properly.",
      },
    ],
    furtherReading: [
      {
        href: "https://numpy.org/doc/stable/reference/index.html",
        label: "NumPy — official reference",
        note: "Array operations, polar transforms, the underlying maths of the image prep.",
      },
      {
        href: "https://pillow.readthedocs.io/en/stable/",
        label: "Pillow — Python Imaging Library",
        note: "Open-source image read/resize/write toolkit.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gamma_correction",
        label: "Gamma correction — Wikipedia",
        note: "Why a linear-to-sRGB curve matters for LED output.",
      },
      {
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels",
        label: "NeoPixel power — Adafruit Learn",
        note: "Current budgets, supply sizing, the gotchas of running addressable LEDs at full brightness.",
      },
      {
        href: "https://www.pjrc.com/teensy/td_pulse.html",
        label: "Teensy hardware timers — PJRC",
        note: "Microsecond-level pulse generation for column-by-column writes.",
      },
    ],
  };
