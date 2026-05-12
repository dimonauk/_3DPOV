import JewelleryTheSameTraceWearable from "components/articles/entries/jewellery-the-same-trace-wearable";
import LineageMareyToNow from "components/articles/entries/lineage-marey-to-now";
import WallArraysGeometryOfRooms from "components/articles/entries/wall-arrays-geometry-of-rooms";
import WhyIBuildMyOwnRigs from "components/articles/entries/why-i-build-my-own-rigs";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  {
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
  },
  {
    slug: "lineage-marey-to-now",
    title: "The Lineage — Marey to Now",
    date: "2025-02-19",
    kind: "article",
    excerpt:
      "The genealogy of light-painted photographs: Marey's chronophotographic plate, Gilbreth's chronocyclegraphs, Edgerton's instrument-build attitude, Mili photographing Picasso, the contemporary flow-arts scene. The line back is the work.",
    Body: LineageMareyToNow,
    related: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The technical companion. What the studio adds to the inherited line.",
      },
      {
        href: "/practice",
        label: "Practice — the history of the studio's stages",
      },
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey",
        label: "Étienne-Jules Marey — Wikipedia",
        note: "Founder of chronophotography; the technical ancestor of every long-exposure light photograph.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Frank_Bunker_Gilbreth_Sr.",
        label: "Frank Bunker Gilbreth Sr — Wikipedia",
        note: "Industrial engineer whose chronocyclegraphs are the first light-painted records of human gesture.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Harold_Eugene_Edgerton",
        label: "Harold Edgerton — Wikipedia",
        note: "Inventor of high-speed flash; the instrument-build attitude underwrites everything on the studio bench.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gjon_Mili",
        label: "Gjon Mili — Wikipedia",
        note: "The 1949 Picasso light-painting photographs. The moment the technique becomes art.",
      },
      {
        href: "https://lightpaintinghub.com/",
        label: "Light Painting Hub",
        note: "Contemporary community entry point: practitioners, tutorials, gallery.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Chronophotography",
        label: "Chronophotography — Wikipedia",
        note: "Broad overview of the genre this work descends from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Light_painting",
        label: "Light painting — Wikipedia",
        note: "Contemporary technique and major practitioners.",
      },
    ],
  },
  {
    slug: "wall-arrays-geometry-of-rooms",
    title: "Wall Arrays — the Geometry of Rooms",
    date: "2024-07-18",
    kind: "article",
    excerpt:
      "Wall arrays are not made of bigger sculptures. They are compositions of palm-scale pieces in deliberate layouts, with the dark pieces as load-bearing as the lit ones. Scale, light budget, interaction, install.",
    Body: WallArraysGeometryOfRooms,
    related: [
      {
        href: "/journal/the-first-wall-array",
        label: "Field record — The First Wall Array",
        note: "The commission that worked out how to do this properly.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "Scaling the same pipeline down to the wrist.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "The per-piece optical engineering inside each array element.",
      },
      {
        href: "/contact?intent=commission",
        label: "Commission a wall array",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Installation_art",
        label: "Installation art — Wikipedia",
        note: "Critical context for the genre this work sits in.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Passive_infrared_sensor",
        label: "Passive infrared sensors — Wikipedia",
        note: "How the studio's interactive arrays detect viewer proximity.",
      },
      {
        href: "https://en.wikipedia.org/wiki/DMX512",
        label: "DMX512 — Wikipedia",
        note: "The lighting-control protocol the arrays speak to controllers.",
      },
    ],
  },
  {
    slug: "jewellery-the-same-trace-wearable",
    title: "Jewellery — the Same Trace, Wearable",
    date: "2025-05-31",
    kind: "article",
    excerpt:
      "The same photograph that becomes a sculpture can become a pendant. Pendants, earrings, brooches, bangles — same source, smaller body, the gesture carried into rooms the sculpture will never see.",
    Body: JewelleryTheSameTraceWearable,
    related: [
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "The other end of the same trace, scaled up.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "Optical engineering of the per-piece waveguide.",
      },
      {
        href: "/photographs",
        label: "Photographs — the source material",
      },
      {
        href: "/contact?intent=commission",
        label: "Commission a piece",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Light_pipe",
        label: "Light pipe / waveguide — Wikipedia",
        note: "The optical principle the wearable channels rely on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Inductive_charging",
        label: "Inductive charging — Wikipedia",
        note: "The Qi-adjacent system the studio's pieces charge through.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Lithium_polymer_battery",
        label: "Lithium-polymer batteries — Wikipedia",
        note: "What sits inside the bezel; replaceable, standard part.",
      },
    ],
  },
];

export const articles: Entry[] = sortByDateDescending(ENTRIES);

export function getArticle(slug: string): Entry | undefined {
  return articles.find((e) => e.slug === slug);
}
