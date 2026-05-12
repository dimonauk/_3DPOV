import BuildingAPovLedRig from "components/tutorials/entries/building-a-pov-led-rig";
import FromPhotographToObject from "components/tutorials/entries/from-photograph-to-object";
import ProgrammingPovFrames from "components/tutorials/entries/programming-pov-frames";
import SpinningFirePoiSafely from "components/tutorials/entries/spinning-fire-poi-safely";
import YourFirstLongExposure from "components/tutorials/entries/your-first-long-exposure";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  {
    slug: "your-first-long-exposure",
    title: "Your First Long-Exposure Light Painting",
    date: "2022-03-15",
    kind: "tutorial",
    excerpt:
      "A beginner walkthrough. Camera, place, tool, frame, shutter, gesture. The first photograph is always the same.",
    Body: YourFirstLongExposure,
    related: [
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "The next instrument up. Same discipline, programmable.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "When the off-the-shelf tools stop being enough.",
      },
      {
        href: "/practice",
        label: "Practice — the history of light painting at the studio",
      },
      {
        href: "/aerial",
        label: "Aerial — light painting from above",
        note: "Drone-mounted sources, for when the body cannot reach.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Long-exposure_photography",
        label: "Long-exposure photography — Wikipedia",
        note: "Foundational article covering shutter speed, motion capture, and the technique's history.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Exposure_(photography)",
        label: "Exposure (photography) — Wikipedia",
        note: "The exposure triangle: aperture, shutter, ISO. Read this once and the camera settings start making sense.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Aperture",
        label: "Aperture — Wikipedia",
        note: "What f/numbers mean, how aperture controls depth of field and light gathering.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Film_speed",
        label: "Film speed (ISO) — Wikipedia",
        note: "ISO sensitivity explained. Why low ISO means cleaner photographs.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Depth_of_field",
        label: "Depth of field — Wikipedia",
        note: "What controls how much of the scene is in focus at once.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Light_painting",
        label: "Light painting — Wikipedia",
        note: "The full history and the major contemporary practitioners. Many entry points for what to try next.",
      },
      {
        href: "https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey",
        label: "Étienne-Jules Marey — Wikipedia",
        note: "The 19th-century French scientist whose chronophotography is the direct ancestor of light painting.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Fire_performance",
        label: "Fire performance — Wikipedia",
        note: "Safety, fuels, and discipline overview. Read before you go near open flame.",
      },
    ],
  },
  {
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
  },
  {
    slug: "from-photograph-to-object",
    title: "From Photograph to 3D Object",
    date: "2025-09-18",
    kind: "tutorial",
    excerpt:
      "The studio's pipeline. How a long-exposure photograph becomes voxel data, becomes a mesh, becomes a resin print with embedded waveguides.",
    Body: FromPhotographToObject,
    related: [
      {
        href: "/tutorials/your-first-long-exposure",
        label: "Tutorial — Your First Long-Exposure Light Painting",
        note: "Step one: get the source photograph right.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "The instrument that makes the photographs precise enough to translate.",
      },
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The studio's printer and post-processing setup.",
      },
      {
        href: "/practice",
        label: "Practice — Stage VI, the objects",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Voxel",
        label: "Voxel — Wikipedia",
        note: "The volumetric pixel: what the studio's photographs are converted into before becoming a mesh.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Marching_cubes",
        label: "Marching cubes algorithm — Wikipedia",
        note: "The standard algorithm for turning voxel data into a printable surface mesh.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Stereolithography",
        label: "Stereolithography (SLA) — Wikipedia",
        note: "The resin-printing process the studio uses. Read this to understand why SLA is the right choice for embedded waveguides.",
      },
      {
        href: "https://docs.blender.org/manual/en/latest/modeling/meshes/index.html",
        label: "Blender Mesh modelling documentation",
        note: "Free, professional 3D software. The studio uses it for the cleanup pass between voxel data and print-ready geometry.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Light_pipe",
        label: "Light pipe / waveguide — Wikipedia",
        note: "The optical principle behind the acrylic channels embedded in the studio's objects.",
      },
      {
        href: "https://www.openscad.org/documentation.html",
        label: "OpenSCAD documentation",
        note: "Programmatic CAD. Useful for parametric waveguide channel design.",
      },
    ],
  },
  {
    slug: "spinning-fire-poi-safely",
    title: "Spinning Fire Poi Safely",
    date: "2019-06-04",
    kind: "tutorial",
    excerpt:
      "Not a beginner tutorial. The body needs the kata before fire enters the picture. Kit, site, light-up, kata, end — read whole before you light anything.",
    Body: SpinningFirePoiSafely,
    related: [
      {
        href: "/tutorials/your-first-long-exposure",
        label: "Tutorial — Your First Long-Exposure Light Painting",
        note: "The discipline this presumes you have done.",
      },
      {
        href: "/practice",
        label: "Practice — Stage I, poi",
      },
      {
        href: "/journal/year-one-fire",
        label: "Field record — Year One, Fire",
        note: "Before any of the safety mattered.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Fire_performance",
        label: "Fire performance — Wikipedia",
        note: "Safety, fuels, and discipline overview. Read before going anywhere near open flame.",
      },
      {
        href: "https://homeofpoi.com/lessons_view/Fire+Safety",
        label: "Home of Poi — fire safety lessons",
        note: "Free, video-led safety walkthroughs from the longest-running poi-instruction community.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Kerosene",
        label: "Kerosene / paraffin lamp oil — Wikipedia",
        note: "Properties of the fuel, including flash point and combustion byproducts.",
      },
    ],
  },
  {
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
  },
];

export const tutorials: Entry[] = sortByDateDescending(ENTRIES);

export function getTutorial(slug: string): Entry | undefined {
  return tutorials.find((e) => e.slug === slug);
}
