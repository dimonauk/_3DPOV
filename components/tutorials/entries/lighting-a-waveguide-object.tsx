import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function LightingAWaveguideObject() {
  return (
    <>
      <p>
        The waveguide is the easy bit. Drill a channel through your
        printed body, push a clear acrylic rod into it, polish the
        ends. Light any visible-spectrum source against the rod end
        and the rod glows along its length. The whole optical
        principle is in the GCSE physics syllabus under{" "}
        <a
          href="https://en.wikipedia.org/wiki/Total_internal_reflection"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          total internal reflection{arrow}
        </a>
        .
      </p>
      <p>
        The hard bit is making it look good in a room.
      </p>

      <p>
        <strong>The LED, chosen properly.</strong>
      </p>
      <p>
        Default for the studio: a warm-white SMD LED at 2700K, 90+
        CRI, around 30 lumens. Specifically{" "}
        <a
          href="https://www.cree-led.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Cree XLamp{arrow}
        </a>{" "}
        or Nichio 219 family parts &mdash; the CRI matters, because
        a 70-CRI LED will make the resin look greenish-grey rather
        than warm. The visual difference between a 70-CRI and 90-CRI
        LED at the same colour temperature is the difference between
        "ah, a glowing thing" and "ah, that&rsquo;s a sculpture."
      </p>
      <p>
        For tinted resin pieces, the LED is still warm white. The
        tint of the resin colours the glow; running a tinted-resin
        piece with an already-coloured LED stacks two filters and
        loses brightness for no gain. White light through coloured
        glass is the right answer almost always.
      </p>

      <p>
        <strong>Coupling the LED to the waveguide.</strong>
      </p>
      <p>
        Three options, in order of optical quality:
      </p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Optical adhesive.</strong> A drop of UV-cure
          adhesive (e.g.{" "}
          <a
            href="https://www.norlandprod.com/adhesives/noa61.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Norland NOA61{arrow}
          </a>
          ) between the LED dome and the polished acrylic rod end.
          Cure with a 365nm UV pen. Refractive-index matched, near-
          lossless coupling. The right answer for permanent pieces.
        </li>
        <li>
          <strong>Air gap, polished rod end.</strong> The rod end is
          polished optically flat (start at 800-grit, finish at
          12,000-grit, then a final pass on a felt wheel with cerium
          oxide); the LED sits 1mm behind it in a milled pocket. No
          adhesive, no permanent bond. Useful for serviceable
          pieces where the LED might need replacing.
        </li>
        <li>
          <strong>Air gap, unpolished rod end.</strong> The default
          for prototypes. About 30% of the light bounces around the
          end of the rod instead of entering it. Looks fine but
          dimmer than it should be. Don&rsquo;t ship pieces this way.
        </li>
      </ol>

      <p>
        <strong>Scattering, by design.</strong>
      </p>
      <p>
        A waveguide that&rsquo;s perfectly polished along its length
        carries the light to the far end and emits it there. That&rsquo;s
        a flashlight, not a sculpture. To make the rod glow along
        its length you need scattering centres in the rod surface:
        either textured walls (lightly sanded, fine grit, randomised
        directions) or controlled kinks (gentle bends that exceed
        the rod&rsquo;s critical angle locally and emit at the
        bend).
      </p>
      <p>
        The studio&rsquo;s default approach: 1500-grit sand the
        outside of the rod along its full length before insertion,
        with the grit direction randomised. This creates millions of
        microscopic scattering sites; each one emits a few photons
        sideways out of the rod. The result is a soft even glow
        along the trace. For sharper "intersection" highlights at
        specific points, leave 80% of the rod sanded and polish a
        2cm section optically smooth at the intersection &mdash; the
        polished section carries the light through unaffected and
        the next sanded section emits it.
      </p>

      <p>
        <strong>Driving the LED.</strong>
      </p>
      <p>
        At 30 lumens, the LED draws around 25mA at 3V &mdash; about
        75mW. Trivial draw. The right driver is a constant-current
        chip ({" "}
        <a
          href="https://www.ti.com/product/LM3445"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          TI LM3445{arrow}
        </a>{" "}
        or any of a thousand similar) running off a 5V buck-
        regulated supply. Don&rsquo;t drive the LED through a
        resistor from raw battery voltage; the brightness will sag
        as the cell discharges. A constant-current driver keeps the
        LED at the same brightness from full charge to empty.
      </p>
      <p>
        For ambient pieces (intended to be on for hours), set the
        drive current at half the LED&rsquo;s nominal &mdash; this
        roughly doubles its life and reduces heat by a quarter.
        Heat in a small piece is a problem; the resin softens around
        65&deg;C, which a poorly-driven LED can reach in under an
        hour.
      </p>

      <p>
        <strong>Dimming, when called for.</strong>
      </p>
      <p>
        PWM dim at 1kHz+ to avoid the LED visibly flickering in
        photographs and video. PWM at 60Hz is fine to the eye but
        appears as banding in any photograph of the piece, which
        spoils press and Instagram coverage. The constant-current
        drivers linked above all support PWM dimming via an enable
        pin; tie a small microcontroller (an{" "}
        <a
          href="https://www.adafruit.com/product/3500"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ATtiny{arrow}
        </a>
        , an{" "}
        <a
          href="https://www.raspberrypi.com/products/raspberry-pi-pico/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          RP2040{arrow}
        </a>
        , anything) to that pin and run your dim curve in software.
      </p>

      <p>
        <strong>Modes.</strong>
      </p>
      <p>
        The studio&rsquo;s default firmware for a single-piece
        waveguide object runs four modes: always-on at full
        brightness, always-on at ambient (40%), breathe (slow sine
        between ambient and 80%), and off. Switching between modes
        is a brief contact closure on a hidden hall-effect sensor
        &mdash; touch a small magnet to the bezel for two seconds.
        No app. No Bluetooth. The piece is independent of any
        external system for its lifetime.
      </p>

      <p>
        For wall arrays the controller is on a separate DMX driver
        &mdash; see the article on{" "}
        <Link
          href="/articles/wall-arrays-geometry-of-rooms"
          className={ext}
        >
          wall arrays and the geometry of rooms
        </Link>{" "}
        for the array-scale lighting design.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "lighting-a-waveguide-object",
    title: "Lighting a Waveguide Object",
    date: "2023-11-08",
    kind: "tutorial",
    excerpt:
      "The waveguide is the easy bit. The hard bit is making it look good in a room. LED choice (CRI matters), coupling (optical adhesive vs polished air-gap), scattering (sand the rod), driving (constant current, not a resistor), modes.",
    Body: LightingAWaveguideObject,
    related: [
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The pipeline that produces the body around the waveguide.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Per-array lighting design at scale.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "Wearable-scale variant with battery + magnetic charge.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows From the Inside",
        note: "The optics article behind this tutorial. Total internal reflection, evanescent leakage, critical angle, in long form.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The structural-colour cousin. Where the colour of the lit waveguide comes from.",
      },
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The studio's object-production kit list.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Total_internal_reflection",
        label: "Total internal reflection — Wikipedia",
        note: "The optical principle the waveguide relies on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Color_rendering_index",
        label: "Colour rendering index (CRI) — Wikipedia",
        note: "Why a 90+ CRI LED makes the resin look warm rather than greenish-grey.",
      },
      {
        href: "https://www.norlandprod.com/adhesives/noa61.html",
        label: "Norland NOA61 — UV-cure optical adhesive",
        note: "Refractive-index-matched glue for permanent LED→rod coupling.",
      },
      {
        href: "https://www.ti.com/product/LM3445",
        label: "TI LM3445 — constant-current LED driver",
        note: "The chip class to drive a small LED at flat brightness from a battery.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Pulse-width_modulation",
        label: "Pulse-width modulation — Wikipedia",
        note: "How LEDs are dimmed without flicker showing up in photographs.",
      },
    ],
  };
