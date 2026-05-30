import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;
const code =
  "rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100";

export default function YourFirstAddressableLED() {
  return (
    <>
      <p>
        Most tutorials about addressable LEDs assume you already know
        why the wiring is the way it is. You don&rsquo;t. Nobody does
        the first time. The strip arrives, the controller arrives, you
        wire them together the way the marketing photograph showed,
        and either nothing happens or everything happens at random.
        Both outcomes are normal. Both outcomes mean you have skipped
        the rung that this tutorial is.
      </p>
      <p>
        We are going to wire a single WS2812 to a microcontroller,
        with one capacitor and one logic-level shifter, and we are
        going to make it blink. That is the entire deliverable. It
        will take about thirty minutes if you have the parts on the
        bench and an evening if you have to dig for them. By the end
        of it the LED on your breadboard will be cycling red, green,
        blue, and you will know exactly why each wire goes where it
        does, which is the only thing that matters before you scale
        up to a rig of sixteen LEDs and a Hall sensor.
      </p>

      <p>
        <strong>What you are actually making.</strong>
      </p>
      <p>
        One LED. On a breadboard. Cycling colours. It is a deliberately
        small first win &mdash; the studio&rsquo;s position is that
        confidence comes from the chain of small successes, not from
        biting off a sixteen-pixel rig and watching it misfire for a
        fortnight. The reason you build this rung before the rig is
        that every problem the rig might give you is here, contained,
        with one pixel as the diagnostic surface. If this blinks, the
        rig will work. If this doesn&rsquo;t, the rig won&rsquo;t.
      </p>

      <p>
        <strong>Bill of materials.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>One microcontroller.</strong> An Arduino Uno or Nano
          (5V logic, easiest path) or an ESP32 dev board (3.3V logic,
          worth the level-shifter conversation early). The studio
          recommends starting with the Nano because the form factor
          drops into a breadboard cleanly. You will graduate to a{" "}
          <a
            href="https://www.pjrc.com/teensy/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Teensy 4.1{arrow}
          </a>{" "}
          for the actual rig in the next rung; for now, an Uno is fine.
        </li>
        <li>
          <strong>One WS2812 / WS2812B / NeoPixel.</strong> Single
          through-hole or a one-pixel breakout. Adafruit sell them in
          packs of three for under a fiver; AliExpress sell them for
          pennies in strips of sixty if you don&rsquo;t mind cutting
          one off. The{" "}
          <a
            href="https://cdn-shop.adafruit.com/datasheets/WS2812.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            WS2812 datasheet{arrow}
          </a>{" "}
          is short, weirdly translated, and worth reading once. The
          timing diagram on page four is the only diagram in
          microcontroller-land you will need this week.
        </li>
        <li>
          <strong>One 74AHCT125 logic-level shifter.</strong> A
          fourteen-pin DIP package, costs less than a coffee, does
          one thing and does it correctly. Some people will tell you
          this part is optional. They are wrong, and we will get to
          why in a minute.
        </li>
        <li>
          <strong>One 1000&micro;F electrolytic capacitor.</strong>{" "}
          16V rating is plenty. Watch the polarity &mdash; the long
          leg is positive, the stripe down the body is negative. If
          you reverse it, it will pop, possibly with smoke. (It
          won&rsquo;t hurt you. It will smell.)
        </li>
        <li>
          <strong>A breadboard.</strong> Any half-size board does. The
          830-point ones are easier to share with a friend; the
          400-point ones fit in a desk drawer.
        </li>
        <li>
          <strong>Jumper wires.</strong> Male-to-male, a handful, the
          ones that come with the breadboard kit are fine.
        </li>
        <li>
          <strong>A USB cable for the microcontroller</strong> and a
          computer with the{" "}
          <a
            href="https://www.arduino.cc/en/software"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Arduino IDE{arrow}
          </a>{" "}
          installed.
        </li>
        <li>
          <strong>The{" "}
            <a
              href="https://fastled.io/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              FastLED library{arrow}
            </a>
            .</strong>{" "}
          Install it from the Arduino IDE&rsquo;s Library Manager:
          Tools &rarr; Manage Libraries &rarr; search "FastLED" &rarr;
          install. Two minutes.
        </li>
      </ul>

      <p>
        <strong>Total spend.</strong> Under fifteen pounds if you buy
        everything from Adafruit; under five pounds if you tolerate
        the eight-day boat from Shenzhen.
      </p>

      <p>
        <strong>Why the level shifter is not optional.</strong>
      </p>
      <p>
        The WS2812&rsquo;s data line wants a logic-high voltage of at
        least 0.7 times its supply &mdash; so for a 5V strip,
        it&rsquo;s expecting at least 3.5V on the data line. An Uno
        runs its data pins at 5V, so technically you&rsquo;re fine,
        but the WS2812 reads the line by sampling at a specific
        instant in its NRZ protocol, and even on a 5V Uno you will
        occasionally see the strip latch the wrong colour because the
        rising edge of your data line is slightly slow. On a 3.3V
        ESP32, the situation is worse: 3.3V is dangerously close to
        the 3.5V threshold, and the strip will work for ten seconds
        and then produce nonsense for one, repeatedly, which is the
        worst possible failure mode for debugging.
      </p>
      <p>
        The 74AHCT125 reads your microcontroller&rsquo;s 3.3V or 5V
        signal and outputs a clean 5V signal aligned with the
        strip&rsquo;s expectations. It also adds a tiny propagation
        delay that, counter-intuitively, helps the rising edge land
        cleanly. The{" "}
        <a
          href="https://learn.adafruit.com/adafruit-neopixel-uberguide"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Adafruit NeoPixel &Uuml;berguide{arrow}
        </a>{" "}
        is forensic about this. Read the "Best Practices" section once
        before wiring; you will come back to it later when something
        misbehaves, and you will be grateful that you already know
        where to look.
      </p>

      <p>
        <strong>Why the 1000&micro;F capacitor goes where it goes.</strong>
      </p>
      <p>
        Each WS2812 at full white draws around 60mA. One LED is a
        rounding error on your USB supply &mdash; but the inrush
        current at the instant you connect power can spike to ten
        times the steady-state draw. That spike, if it travels back
        up the power rail to your microcontroller, can momentarily
        drop the controller&rsquo;s supply voltage, which causes the
        controller to brown-out and restart in a confused state. The
        symptom is the controller boots, the LED flashes once, the
        controller resets, the LED flashes once, the controller
        resets &mdash; an infinite cosmetic loop that looks like
        success at a casual glance.
      </p>
      <p>
        The 1000&micro;F capacitor across the LED&rsquo;s power and
        ground absorbs the inrush spike. Long leg to positive, short
        leg to ground. Place it physically close to the LED &mdash;
        within an inch &mdash; not next to the microcontroller.
      </p>

      <p>
        <strong>The wiring.</strong>
      </p>
      <p>
        Lay your breadboard out flat. Power rails run along the long
        edges. The middle two columns are the working area.
      </p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          Jumper the Arduino&rsquo;s 5V pin to the breadboard&rsquo;s
          positive rail. Jumper GND to the negative rail.
        </li>
        <li>
          Place the WS2812 in the middle of the breadboard, with its
          three pins (or four, if it&rsquo;s a breakout) spanning
          three columns. The pinout, looking at the LED dome with the
          flat side of the package at the bottom: VDD on the left,
          DOUT on the bottom, VSS on the right, DIN on the top. (If
          your part is a breakout board, the silkscreen will tell you
          which pin is which.)
        </li>
        <li>
          Place the 74AHCT125 across the breadboard&rsquo;s centre
          gully, pin 1 to the upper-left, pin 14 to the upper-right.
          The dot or notch marks pin 1. Connect pin 14 (VCC) to the
          positive rail. Connect pin 7 (GND) to the negative rail.
          Connect pin 1 (the first OE, output-enable) to ground
          &mdash; this enables the buffer.
        </li>
        <li>
          Connect Arduino pin <span className={code}>D6</span> to the
          74AHCT125&rsquo;s pin 2 (the A1 input). Connect the
          74AHCT125&rsquo;s pin 3 (the Y1 output) to the
          WS2812&rsquo;s DIN.
        </li>
        <li>
          Connect the WS2812&rsquo;s VDD to the positive rail, and
          VSS to the negative rail.
        </li>
        <li>
          Place the 1000&micro;F capacitor between the WS2812&rsquo;s
          VDD and VSS lines on the breadboard, as close to the LED
          as your jumpers allow. Long leg to positive, short leg to
          ground. Mind the polarity. Mind the polarity. Mind the
          polarity.
        </li>
      </ol>
      <p>
        DOUT on the WS2812 stays unconnected for now &mdash; in a
        strip of LEDs it would feed the next pixel&rsquo;s DIN, but
        we only have one pixel, so the data terminates here.
      </p>

      <p>
        <strong>The sketch.</strong>
      </p>
      <p>
        Open the Arduino IDE. File &rarr; New. Paste the following:
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-4 text-xs leading-relaxed text-chrome-200">
        <code>{`#include <FastLED.h>

#define NUM_LEDS  1
#define DATA_PIN  6

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(64);  // 25% of max — easy on the eyes
}

void loop() {
  leds[0] = CRGB::Red;   FastLED.show(); delay(500);
  leds[0] = CRGB::Green; FastLED.show(); delay(500);
  leds[0] = CRGB::Blue;  FastLED.show(); delay(500);
}`}</code>
      </pre>
      <p>
        Tools &rarr; Board &rarr; Arduino Uno (or Nano, with the
        appropriate processor variant from the same submenu). Tools
        &rarr; Port &rarr; whichever COM port the IDE just listed.
        Click the arrow icon to upload. The LED should start cycling
        red, green, blue within ten seconds.
      </p>

      <p>
        <strong>The aha.</strong>
      </p>
      <p>
        It blinks. That is the first-light moment for the entire POV
        ladder. The LED on your breadboard is the same chip that will
        be on your rig in two rungs&rsquo; time, doing the same thing
        in a different shape. Everything that follows is a matter of
        adding more pixels, faster updates, and a way to synchronise
        the data to where the rig is in space &mdash; but the
        underlying chip-to-chip conversation is exactly what is
        happening on your bench right now.
      </p>

      <p>
        <strong>If it doesn&rsquo;t blink.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Nothing at all.</strong> Check the polarity of the
          capacitor (the stripe on the body should be on the negative
          rail). Check that the LED&rsquo;s DIN is on the side you
          think it&rsquo;s on &mdash; the WS2812 is directional, and
          wiring it backwards is the most common first-time mistake.
          DIN is the input; DOUT is the output. The data flows DIN
          to DOUT.
        </li>
        <li>
          <strong>One quick flash, then nothing.</strong> The
          controller is brown-out resetting. Move the capacitor
          closer to the LED, or add a second 100&micro;F ceramic in
          parallel. If the brown-out persists, your USB supply
          isn&rsquo;t delivering enough current &mdash; try a wall
          adaptor instead of a laptop USB-C hub.
        </li>
        <li>
          <strong>Wrong colours.</strong> Replace{" "}
          <span className={code}>GRB</span> with{" "}
          <span className={code}>RGB</span> in the FastLED.addLeds
          line. Some clones reverse the colour order; FastLED handles
          it as a compile-time parameter.
        </li>
        <li>
          <strong>It works sometimes.</strong> Your level shifter
          isn&rsquo;t wired right, or you skipped it. The 74AHCT125
          needs its OE pin (pin 1, for the first buffer) pulled to
          ground to enable the output. Check that connection.
        </li>
        <li>
          <strong>The LED is bright white and then dies.</strong> You
          wired the WS2812&rsquo;s VDD and VSS reversed. The chip is
          now dead. Buy three more next time; this is normal first-go
          attrition.
        </li>
      </ul>

      <p>
        <strong>One concept to hold onto.</strong>
      </p>
      <p>
        The WS2812 receives data on a single line using its own NRZ
        protocol &mdash; each bit is encoded as a high pulse, narrow
        for zero, wide for one, with strict timing tolerances of
        about &plusmn;150ns. The chip latches the colour after a
        50&micro;s low pause. This is why the 74AHCT125&rsquo;s clean
        signal matters: the timing tolerances are tighter than your
        microcontroller&rsquo;s rise time would otherwise satisfy.
        The studio&rsquo;s in-prep toy at{" "}
        <Link href="/atelier/ws2812-timing" className={ext}>
          /atelier/ws2812-timing
        </Link>{" "}
        will let you watch the protocol on a simulated oscilloscope
        when it ships &mdash; for now, knowing the protocol exists
        is enough.
      </p>

      <p>
        <strong>What next.</strong>
      </p>
      <p>
        One LED cycling is the foundation. The next rung &mdash;{" "}
        <Link href="/tutorials/building-a-pov-led-rig" className={ext}>
          Building a POV LED Rig
        </Link>{" "}
        &mdash; takes everything you just wired and scales it: a
        sixteen-pixel strip instead of one, a Teensy 4.1 instead of
        an Uno, a Hall sensor that tells the controller where the rig
        is in space, and a balanced chassis that lets the whole thing
        swing without wobbling. The question the next rung answers is:
        how do you get the timing accurate enough that the image lands
        on the same arc of space every revolution, fifteen times in
        a fifteen-second exposure?
      </p>
      <p>
        Pin the LED to a corner of the bench. You&rsquo;ll want it
        when the rig is being a bother.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "your-first-addressable-led",
  title: "Your First Addressable LED",
  date: "2026-05-26",
  kind: "tutorial",
  excerpt:
    "Wiring a single WS2812 / NeoPixel from an Arduino-class microcontroller. Power, data, level-shifting, and the obligatory first blink.",
  Body: YourFirstAddressableLED,
  related: [
    {
      href: "/tutorials/building-a-pov-led-rig",
      label: "Tutorial — Building a POV LED Rig",
      note: "The next rung. One pixel becomes sixteen, the Uno becomes a Teensy, the breadboard becomes a balanced chassis.",
    },
    {
      href: "/atelier/ws2812-timing",
      label: "Atelier — WS2812 Timing (in preparation)",
      note: "Live oscilloscope-style view of the WS2812 NRZ protocol with and without the level shifter.",
    },
    {
      href: "/articles/why-i-build-my-own-rigs",
      label: "Why I Build My Own Rigs",
      note: "The argument for the bench-built approach the rest of the POV ladder rests on.",
    },
    {
      href: "/practice",
      label: "Practice — Stage IV, POV LED arrays",
    },
  ],
  furtherReading: [
    {
      href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
      label: "NeoPixel Überguide — Adafruit Learn",
      note: "The canonical reference for everything WS2812. Read the Best Practices section before wiring; read Powering NeoPixels before scaling up.",
    },
    {
      href: "https://cdn-shop.adafruit.com/datasheets/WS2812.pdf",
      label: "WS2812 datasheet (PDF)",
      note: "Four pages, weirdly translated, contains the NRZ timing diagram you will keep returning to. Page four is the one that matters.",
    },
    {
      href: "https://fastled.io/",
      label: "FastLED library",
      note: "Cross-platform addressable-LED library. Install via the Arduino IDE Library Manager; works with WS2812, SK6812, APA102, and most clones.",
    },
    {
      href: "https://learn.sparkfun.com/tutorials/hall-effect-sensors",
      label: "Hall-effect sensors — SparkFun Learn",
      note: "Not used in this rung but the wiring grammar is the same. You will need it the moment you build the rig.",
    },
    {
      href: "https://www.pjrc.com/teensy/td_pulse.html",
      label: "Teensy hardware timers — PJRC",
      note: "The microsecond-level timing reference. Worth bookmarking before you graduate from the Uno; the rig rung depends on it.",
    },
    {
      href: "https://www.ti.com/lit/ds/symlink/tlc5927.pdf",
      label: "TLC5927 datasheet (PDF) — Texas Instruments",
      note: "The LED driver chip you'll reach for when you scale past sixteen pixels. The studio uses one or two depending on channel count.",
    },
  ],
};
