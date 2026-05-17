import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function VrPovControllersTheProduct() {
  return (
    <>
      <p>
        Twelve years of poi taught the body. Ten years of long
        exposure taught the camera. Six years of custom rigs taught
        the firmware. The studio is now building the thing all of
        those years were rehearsal for: a programmable POV LED
        attachment that clips onto a consumer VR controller and
        lets you perform light painting in the real world while
        seeing the gesture appear, live, in VR.
      </p>

      <p>
        <strong>What it is, mechanically.</strong>
      </p>
      <p>
        A pair of slim, 3D-printed clip-on bezels. One slides over
        the head of a{" "}
        <a
          href="https://www.meta.com/quest/quest-3/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Meta Quest 3{arrow}
        </a>{" "}
        Touch Plus controller; another slides over the head of a{" "}
        <a
          href="https://www.valvesoftware.com/en/steam-frame"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Valve Steam Frame{arrow}
        </a>{" "}
        controller. Each bezel mounts a short strip of addressable
        LEDs around the rim that surrounds the controller&rsquo;s
        existing tracking ring, plus a Hall-effect sensor in the
        handle pickup. No drilling, no soldering, no warranty void.
        The controllers go back to gaming when you take the bezels
        off.
      </p>

      <p>
        <strong>What it is, optically.</strong>
      </p>
      <p>
        The LED rim is a one-pixel-wide, sixteen-pixel-tall
        persistence-of-vision display, driven by the same{" "}
        <Link
          href="/tutorials/programming-pov-frames"
          className={ext}
        >
          angular-sync firmware
        </Link>{" "}
        the studio runs on its bench rigs. Swing the controller
        through space and the rim writes a programmed image into
        the air. The camera sees the same single-frame light
        painting the studio has been making for years &mdash; with
        one significant difference. The controller is also reporting
        its 6DoF position, sub-millisecond, into the headset.
      </p>

      <p>
        <strong>The real-world and VR happen at the same time.</strong>
      </p>
      <p>
        In the real world, a long-exposure camera holds the shutter
        open and captures the kata as light against dark. In VR,
        the headset application reads the controller&rsquo;s pose
        stream, samples the same image data the LED rim is writing,
        and renders the gesture as a glowing trail in the virtual
        scene &mdash; matched to the real-world arc to within a
        couple of millimetres. The wearer is in both rooms at once.
        The photograph that comes out of the camera and the
        screenshot that comes out of the headset are the same
        gesture seen by two different observers.
      </p>
      <p>
        For practice, this solves the discipline&rsquo;s oldest
        problem. Long-exposure light painting is performed blind
        &mdash; the body draws the kata without seeing what it is
        making; the photograph reveals it afterwards. The wait is
        beautiful but expensive. With the VR mirror running, the
        performer can see the gesture forming in real time, adjust
        on the next pass, iterate at a speed that until now
        belonged only to video games.
      </p>

      <p>
        <strong>What it ships with.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          The two clip-on bezels, factory-paired to your headset of
          choice. Two-rim default colour palette: warm white +
          full-RGB capable. Charging via the same dock the
          controllers already use; no second cable.
        </li>
        <li>
          The studio&rsquo;s WebXR companion app. Free, runs in any
          WebXR-capable browser ({" "}
          <a
            href="https://www.meta.com/help/quest/browser-features-quest/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Meta Quest Browser{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.steamvr.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            SteamVR Browser{arrow}
          </a>
          ), no app-store gating. Mirrors the real-world gesture
          into the VR scene in real time; records both the LED
          frame data and the VR trail to disk for later reuse.
        </li>
        <li>
          A small frame editor (browser-based) for designing the
          image data the LEDs write. Drop a PNG in, polar-warp it,
          send it to the bezels over Wi-Fi.
        </li>
        <li>
          A real-world calibration card &mdash; place it in front of
          the camera before each session; the companion app reads
          the card and aligns the VR scene to the camera&rsquo;s
          view so the two captures match frame for frame.
        </li>
      </ul>

      <p>
        <strong>What it does NOT do.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          It does not stream to social media. The studio is not
          interested in the live-broadcast performance market; if
          you want that, you can patch the VR scene into OBS
          yourself, but the product does not pretend to be a
          streaming tool.
        </li>
        <li>
          It does not require a subscription. One purchase, all
          updates free forever, source available for the firmware
          and the companion app.
        </li>
        <li>
          It does not change how the controllers feel to use as
          controllers. The bezels add about 40 grams to each
          controller; you notice it for five minutes, then you
          stop noticing.
        </li>
      </ul>

      <p>
        <strong>Status.</strong>
      </p>
      <p>
        First production batch is in fabrication at a partner
        printer in the north of England. Pre-orders are open for
        signed-up members of the studio&rsquo;s mailing list before
        general release; if you want one of the early units, get on
        the dispatch list at the bottom of any page on this site.
      </p>
      <p>
        Pricing will be announced at the same time as the
        general-release date. The pricing target sits below the
        cost of a single bench-built rig &mdash; this is a product
        intended to put the practice in more hands, not to gate-
        keep it.
      </p>

      <p>
        <strong>The longer arc.</strong>
      </p>
      <p>
        The product is the studio&rsquo;s answer to a question that
        has shaped the practice from year one: who else, if they
        had the right instrument, would do this? Twelve years of
        poi taught me that the answer is "more people than the
        flow-arts scene assumes." The studio&rsquo;s editioned
        photographs and{" "}
        <Link
          href="/articles/wall-arrays-geometry-of-rooms"
          className={ext}
        >
          wall arrays
        </Link>{" "}
        and{" "}
        <Link
          href="/articles/jewellery-the-same-trace-wearable"
          className={ext}
        >
          jewellery
        </Link>{" "}
        will continue. So will the{" "}
        <Link href="/aerial" className={ext}>
          aerial work
        </Link>
        . But the bezels are the artefact that makes the practice
        itself transmissible.
      </p>
      <p>
        Twelve years of stealth. Then this. The Princess hands you
        the instrument.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "vr-pov-controllers-the-product",
    title: "VR POV Controllers — the Studio's Product",
    date: "2026-02-08",
    kind: "article",
    excerpt:
      "The thing twelve years of practice was rehearsal for: clip-on POV LED bezels for Meta Quest 3 and Valve Steam Frame controllers. Real-world light painting and VR-mirrored gesture at the same time. The Princess hands you the instrument.",
    Body: VrPovControllersTheProduct,
    related: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The bench tradition the product comes out of.",
      },
      {
        href: "/tutorials/programming-pov-frames",
        label: "Tutorial — Programming Frames for a POV Rig",
        note: "The same firmware runs on the consumer bezels.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "If you want to keep building your own instead.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "The other small-scale product line.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "The output the bezels feed back into.",
      },
      {
        href: "/practice",
        label: "Practice — the twelve-year arc",
      },
    ],
    furtherReading: [
      {
        href: "https://www.meta.com/quest/quest-3/",
        label: "Meta Quest 3",
        note: "The first headset the bezels are fitted to.",
      },
      {
        href: "https://www.valvesoftware.com/en/steam-frame",
        label: "Valve Steam Frame",
        note: "The second headset the bezels are fitted to.",
      },
      {
        href: "https://immersiveweb.dev/",
        label: "Immersive Web — WebXR development",
        note: "The standard the companion app is built against.",
      },
      {
        href: "https://github.com/pmndrs/xr",
        label: "@react-three/xr",
        note: "The library the WebXR companion runs on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "The principle the bezels rely on.",
      },
    ],
  };
