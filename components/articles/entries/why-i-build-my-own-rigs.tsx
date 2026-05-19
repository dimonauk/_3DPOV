import Link from "next/link";

import { MeshAsset } from "components/three";
import type { Entry } from "lib/writing";

export default function WhyIBuildMyOwnRigs() {
  return (
    <>
      <p>
        The first programmable rig I bought, around 2019, was a pixel
        poi from one of the established hobbyist brands. It was an
        extraordinary piece of kit by any reasonable measure. It
        survived being dropped. It read image files from an SD card. It
        synced to a wireless trigger. It would do thirty consecutive
        performances on a single charge. Tens of thousands of dancers
        around the world were using the same hardware in clubs and
        festivals, and it worked.
      </p>
      <p>For photographic light painting, it was wrong.</p>
      <p>
        The trade-off the commercial pixel poi makes is the trade-off
        any commercial flow-arts tool makes. Performance environments
        are unforgiving in physical ways &mdash; concrete floors, sweaty
        hands, the weight of a fast spin pulling on a tether.
        Performance environments are forgiving in image-quality ways
        &mdash; the camera is rarely on, the audience integrates the
        image with their eyes, fractional blur is invisible at distance
        and to memory. Durability beats sharpness, every time. That is
        the right tradeoff for the market the rigs are sold to.
      </p>
      <p>
        Photographic light painting is the opposite tradeoff. The
        camera is on. The audience is the photograph. Fractional blur
        is the entire object. Image quality matters more than anything
        else, including how well the rig survives a drop.
      </p>
      <p>
        When I started building, I gave up everything the commercial
        rigs were optimised for and bought everything they were not
        optimised for. The{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          rigs on the studio bench
        </Link>{" "}
        cannot take a hard fall. They are not weatherproof. They will
        not run for thirty consecutive performances on a single charge.
        They will do one or two takes a night. What they will do
        &mdash; and what the commercial rigs cannot &mdash; is hold the
        image to a pixel at the speeds the arm sustains.
      </p>

      <MeshAsset id="example-mesh-vercel" />
      <p className="mt-2 text-sm text-chrome-400">
        The Mk7 chassis, printable and AR-placeable. The current
        bench rig in mesh form, rotated for inspection.
      </p>

      <p>
        The components are not exotic. A{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Teensy 3.1<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        microcontroller, a bank of{" "}
        <a
          href="https://www.ti.com/product/TLC5927"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          TLC5927<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        16-channel constant-current LED drivers, addressable LEDs in a
        one-dimensional strip on a balanced chassis, a{" "}
        <a
          href="https://en.wikipedia.org/wiki/Hall_effect_sensor"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Hall-effect rotation sensor<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        reading off a magnet at the pivot. The frame rate at 100 updates
        per revolution lands a photograph that does not require any
        cleanup in post. The image data goes into the rig before the
        performance; the rig writes the image into space; the camera
        reads the image off the air.
      </p>
      <p>
        The architectural choice is the only one that matters.
        Commercial rigs sync to time. Time-synced rigs drift, because
        the arm is not a clock &mdash; its speed varies through the
        revolution. The studio rigs sync to angle. The Hall sensor
        reads where the rig is, not when it is. At the angles where
        the arm slows, the rig draws fewer columns; at the angles
        where the arm speeds up, the rig draws more. The picture in
        the photograph is the picture programmed into the rig, not a
        stretched and compressed approximation of it.
      </p>
      <p>
        This is why I build them. Not as a flex. Because the
        off-the-shelf option produces a different photograph than the
        one I want to take, and the difference is unfixable in post.
        The picture has to be right when it leaves the rig.
      </p>
      <p>
        The studio sells the{" "}
        <Link
          href="/photographs"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          photographs
        </Link>
        . The rigs stay on the bench.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "why-i-build-my-own-rigs",
    title: "Why I Build My Own Rigs",
    date: "2024-04-03",
    kind: "article",
    excerpt:
      "An argument for the bench, not the catalogue. Why commercial pixel poi are the wrong instrument for photographic light painting.",
    Body: WhyIBuildMyOwnRigs,
    related: [
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The kit list, dispassionately.",
      },
      {
        href: "/tutorials/your-first-long-exposure",
        label: "Tutorial — Your First Long-Exposure Light Painting",
        note: "Where the practice starts, before the rigs.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "The studio's bill-of-materials and assembly walkthrough.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The structural cousin. Why the rig family is modular at this studio's scale and consolidates everywhere else.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The photographic-kit version of the same bench-built pattern. The home-built 360 rig is its 2014 ancestor.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "Solo level two (The Trail) is the angular-sync architecture of this article, played.",
      },
      {
        href: "/practice",
        label: "Practice — Stage IV, POV LED arrays",
        note: "The stage at which the studio rigs took over.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "The optical foundation every POV display depends on.",
      },
      {
        href: "https://www.pjrc.com/teensy/",
        label: "Teensy microcontrollers — PJRC",
        note: "Vendor home for the Teensy boards the studio uses. Start with the Teensy 4.1 today; the 3.1 in the rigs is its predecessor.",
      },
      {
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
        label: "NeoPixel Überguide — Adafruit Learn",
        note: "The reference tutorial for addressable LEDs. Power, data, timing, and the gotchas you will hit.",
      },
      {
        href: "https://fastled.io/",
        label: "FastLED library",
        note: "Open-source library for driving addressable LEDs from Arduino-compatible microcontrollers. Where most LED-art software lives.",
      },
      {
        href: "https://learn.sparkfun.com/tutorials/hall-effect-sensors",
        label: "Hall-effect sensors — SparkFun Learn",
        note: "Introduction to magnetic-field sensors and how to use them for rotation detection.",
      },
      {
        href: "https://www.ti.com/lit/ds/symlink/tlc5927.pdf",
        label: "TLC5927 datasheet (PDF) — Texas Instruments",
        note: "Full electrical reference for the LED driver chip at the centre of the studio rigs.",
      },
    ],
  };
