import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function OnTheShouldersOfOpenSource() {
  return (
    <>
      <p>
        The studio&rsquo;s rigs would not exist without an enormous
        amount of free code maintained by strangers. This is an
        acknowledgement, a recommendation, and a working bibliography
        for anyone who wants to build down the same road.
      </p>

      <p>
        <strong>The libraries.</strong>
      </p>

      <p>
        <a
          href="https://github.com/FastLED/FastLED"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          FastLED{arrow}
        </a>{" "}
        is the canvas. High-performance Arduino library for
        addressable LED chipsets (WS2812, APA102, SK6812, dozens
        more) with built-in colour math, palettes and noise
        primitives. The library was originated by{" "}
        <a
          href="https://blog.adafruit.com/2019/09/05/daniel-garcia-focalintent-the-originator-of-fastled-has-passed-away/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Daniel Garcia (focalintent){arrow}
        </a>
        , who died in the Conception dive-boat fire in 2019. His
        memory is preserved in the library header and across the
        maker community.{" "}
        <a
          href="https://github.com/FastLED/FastLED"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Zach Vorhies{arrow}
        </a>{" "}
        and contributors have shepherded it ever since. Every
        photograph the studio has taken with a custom rig owes
        Garcia a debt.
      </p>

      <p>
        <a
          href="https://github.com/adafruit/Adafruit_NeoPixel"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Adafruit_NeoPixel{arrow}
        </a>{" "}
        is the on-ramp. Lightweight, by{" "}
        <a
          href="https://learn.adafruit.com/users/pburgess"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Phil Burgess
        </a>
        ; if you can blink one WS2812 you can build a rig from
        there. The companion documentation &mdash; the famous{" "}
        <a
          href="https://learn.adafruit.com/adafruit-neopixel-uberguide"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          NeoPixel Überguide{arrow}
        </a>{" "}
        &mdash; is the single best teach-yourself resource in the
        field. Read it whole before you buy any LEDs.
      </p>

      <p>
        <a
          href="https://www.pjrc.com/teensy/td_libs_OctoWS2811.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          OctoWS2811{arrow}
        </a>{" "}
        is what makes high-pixel-count POV staves and poi feasible.{" "}
        <a
          href="https://github.com/PaulStoffregen"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Paul Stoffregen&rsquo;s
        </a>{" "}
        DMA-based library for{" "}
        <a
          href="https://www.pjrc.com/teensy/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Teensy
        </a>{" "}
        drives eight LED strips in parallel at near-zero CPU cost.
        The studio&rsquo;s rigs use one of these to write 100
        columns per revolution while leaving the microcontroller
        free to read the Hall sensor.
      </p>

      <p>
        <a
          href="https://github.com/wled/WLED"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          WLED{arrow}
        </a>{" "}
        is the drop-in brain. ESP32/ESP8266 firmware that turns a
        cheap board into a Wi-Fi-controlled pixel engine with a web
        UI, presets, segments, E1.31/Art-Net/DDP input, and a huge
        effects library. Originally by{" "}
        <a
          href="https://github.com/Aircoookie"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Christian Schwinne (Aircoookie){arrow}
        </a>
        ; now community-maintained under the wled org. The
        studio&rsquo;s wall arrays run WLED on their controllers.
      </p>

      <p>
        <a
          href="https://electromage.com/pixelblaze/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Pixelblaze{arrow}
        </a>{" "}
        is purpose-built for performative LED art:{" "}
        <a
          href="https://www.bhencke.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ben Hencke&rsquo;s
        </a>{" "}
        Wi-Fi controller with a browser-based live-coding IDE, a
        tiny JIT-compiled language tuned for live editing, sensor
        input, and 3D pixel-mapping. If the studio ever needed an
        off-the-shelf brain instead of building its own, Pixelblaze
        would be the answer.
      </p>

      <p>
        <a
          href="http://openpixelcontrol.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Open Pixel Control{arrow}
        </a>{" "}
        is the lingua franca for distributed installations &mdash; a
        simple TCP byte-stream protocol from Micah Elizabeth Scott
        / Google Creative Lab. Useful when a single Processing or
        Python script wants to drive a wall of physical pixels.
      </p>

      <p>
        <a
          href="https://github.com/LedFx/LedFx"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          LedFx{arrow}
        </a>{" "}
        bridges audio into pixel effects across WLED, ESPixelStick
        and OPC devices. Music-reactive rooms, gallery installations
        scored to soundscapes &mdash; LedFx is how the studio
        prototypes that kind of thing before building bespoke
        firmware.
      </p>

      <p>
        <a
          href="https://github.com/Mitchlol/Open-Pixel-Poi"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Open Pixel Poi{arrow}
        </a>{" "}
        is the closest open-source ancestor to the studio&rsquo;s
        rigs &mdash; a 3D-printable ESP32+WS2812 reference design
        with firmware, KiCad, STLs and a Flutter app. The
        studio&rsquo;s rigs differ (Teensy + angular sync), but
        anyone starting fresh today might begin here rather than
        from scratch.
      </p>

      <p>
        <strong>The teachers.</strong>
      </p>

      <p>
        Beyond Phil Burgess&rsquo;s Adafruit work above:{" "}
        <a
          href="https://learn.sparkfun.com/tutorials/addressable-led-strip-hookup-guide/all"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          SparkFun Learn{arrow}
        </a>{" "}
        is the second perspective worth holding for triangulation;{" "}
        <a
          href="https://kno.wled.ge/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          the WLED Knowledge Base{arrow}
        </a>{" "}
        is community-maintained docs for installation-scale work;{" "}
        <a
          href="https://forum.pjrc.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          the PJRC forum{arrow}
        </a>{" "}
        is where serious Teensy POV builders trade schematics and
        timing tricks;{" "}
        <a
          href="https://reddit.com/r/FastLED"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          r/FastLED{arrow}
        </a>{" "}
        is the help community pointed to from the FastLED repo
        itself.
      </p>

      <p>
        <strong>The hardware.</strong>
      </p>

      <p>
        For installation-scale work,{" "}
        <a
          href="https://quinled.info/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          QuinLED{arrow}
        </a>{" "}
        (Quindor) makes open-hardware ESP32 controller PCBs sized
        properly for the power budgets these projects actually
        draw. The studio uses Dig-Octa boards in the larger wall
        arrays.
      </p>

      <p>
        <strong>What the studio adds back.</strong>
      </p>

      <p>
        The studio is a heavy consumer of these projects and a small
        contributor. Pull requests on the firmware side of the
        custom rigs are open at the studio&rsquo;s GitHub; field
        photographs that show what the libraries can actually do
        sit{" "}
        <Link href="/photographs" className={ext}>
          on the website
        </Link>
        . If a maintainer of any of the above projects passes
        through Salford, the studio buys the coffee.
      </p>
    </>
  );
}
