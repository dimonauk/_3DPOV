import BeltPrintedWallReliefs from "components/articles/entries/belt-printed-wall-reliefs";
import JewelleryTheSameTraceWearable from "components/articles/entries/jewellery-the-same-trace-wearable";
import KindredPractices from "components/articles/entries/kindred-practices";
import LineageMareyToNow from "components/articles/entries/lineage-marey-to-now";
import NineSecondsPromptToPrintable from "components/articles/entries/nine-seconds-prompt-to-printable";
import OnTheShouldersOfOpenSource from "components/articles/entries/on-the-shoulders-of-open-source";
import SellotapeAndTiltBrush from "components/articles/entries/sellotape-and-tilt-brush";
import TheFamiliar from "components/articles/entries/the-familiar";
import TheFleetFourAirframes from "components/articles/entries/the-fleet-four-airframes";
import VrAsPsychologicalSystem from "components/articles/entries/vr-as-psychological-system";
import VrPovControllersTheProduct from "components/articles/entries/vr-pov-controllers-the-product";
import WallArraysGeometryOfRooms from "components/articles/entries/wall-arrays-geometry-of-rooms";
import WhatTheStudioWontDo from "components/articles/entries/what-the-studio-wont-do";
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
  {
    slug: "kindred-practices",
    title: "Kindred Practices",
    date: "2024-11-29",
    kind: "article",
    excerpt:
      "A curated room of practitioners whose work the studio watches — Reuben Wu, Janne Parviainen, Hannu Huhtamo, Dariustwin, Patrick Rochon, Vicki DaSilva, Brian Hart, Sola. Eight different answers to the same question of how to make a gesture last.",
    Body: KindredPractices,
    related: [
      {
        href: "/articles/lineage-marey-to-now",
        label: "The Lineage — Marey to Now",
        note: "The historical line back from these contemporaries.",
      },
      {
        href: "/aerial",
        label: "Aerial — drone-mounted light painting",
        note: "The studio's parallel to Reuben Wu's work.",
      },
      {
        href: "/practice",
        label: "Practice — the studio's twelve-year arc",
      },
    ],
    furtherReading: [
      {
        href: "https://reubenwu.com/",
        label: "Reuben Wu",
        note: "Lux Noctis and Aeroglyphs — drone LEDs over remote terrain.",
      },
      {
        href: "https://www.flickr.com/people/jannepaint/",
        label: "Janne Parviainen",
        note: "Topographic LED long-exposures from Finland.",
      },
      {
        href: "https://www.hannuhuhtamo.com/",
        label: "Hannu Huhtamo",
        note: "Organic light sculpture in Finnish forests.",
      },
      {
        href: "https://dariustwin.com/",
        label: "Darren Pearson / Dariustwin",
        note: "Hand-drawn light skeletons; National Geographic, Apple, Disney.",
      },
      {
        href: "https://lightpaintingphotography.com/light-painting-artist/featured-artist-2/patrick-rochon/",
        label: "Patrick Rochon",
        note: "Kinetic light kata portraits with custom Liteblade swords.",
      },
      {
        href: "https://www.vickidasilva.com/",
        label: "Vicki DaSilva",
        note: "Fluorescent-tube light graffiti since 1980.",
      },
      {
        href: "https://lightbombing.com/",
        label: "Sola / Peter Medlicott",
        note: "Lightbombing in the UK; coined the term, featured by CNN and Vanity Fair.",
      },
      {
        href: "https://lightpaintinghub.com/",
        label: "Light Painting Hub",
        note: "Broader community gallery and reference.",
      },
    ],
  },
  {
    slug: "on-the-shoulders-of-open-source",
    title: "On the Shoulders of Open Source",
    date: "2025-08-04",
    kind: "article",
    excerpt:
      "The studio's rigs would not exist without an enormous amount of free code maintained by strangers. FastLED, NeoPixel, OctoWS2811, WLED, Pixelblaze, Open Pixel Control, LedFx, Open Pixel Poi. An acknowledgement, a recommendation, a working bibliography.",
    Body: OnTheShouldersOfOpenSource,
    related: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "What the studio adds on top of the open-source base.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "Where the libraries below land in practice.",
      },
      {
        href: "/tutorials/programming-pov-frames",
        label: "Tutorial — Programming Frames for a POV Rig",
        note: "How the libraries get used to actually write images.",
      },
    ],
    furtherReading: [
      {
        href: "https://github.com/FastLED/FastLED",
        label: "FastLED",
        note: "The canvas for addressable LEDs on Arduino-class microcontrollers.",
      },
      {
        href: "https://github.com/adafruit/Adafruit_NeoPixel",
        label: "Adafruit NeoPixel library",
        note: "The on-ramp library by Phil Burgess.",
      },
      {
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
        label: "Adafruit NeoPixel Überguide",
        note: "The single best teach-yourself resource in the field.",
      },
      {
        href: "https://www.pjrc.com/teensy/td_libs_OctoWS2811.html",
        label: "OctoWS2811 (PJRC)",
        note: "Paul Stoffregen's DMA-based library; drives eight strips in parallel.",
      },
      {
        href: "https://github.com/wled/WLED",
        label: "WLED",
        note: "The drop-in pixel-engine firmware for ESP32/ESP8266.",
      },
      {
        href: "https://electromage.com/pixelblaze/",
        label: "Pixelblaze",
        note: "Ben Hencke's purpose-built LED-art controller with live-coding IDE.",
      },
      {
        href: "http://openpixelcontrol.org/",
        label: "Open Pixel Control",
        note: "Simple TCP protocol for distributed pixel installations.",
      },
      {
        href: "https://github.com/LedFx/LedFx",
        label: "LedFx",
        note: "Real-time audio → pixel effects bridge.",
      },
      {
        href: "https://github.com/Mitchlol/Open-Pixel-Poi",
        label: "Open Pixel Poi",
        note: "Open-source 3D-printable ESP32+WS2812 pixel-poi reference design.",
      },
      {
        href: "https://quinled.info/",
        label: "QuinLED",
        note: "Quindor's open-hardware ESP32 LED controller PCBs.",
      },
      {
        href: "https://kno.wled.ge/",
        label: "WLED Knowledge Base",
        note: "Community-maintained docs for installation-scale work.",
      },
      {
        href: "https://forum.pjrc.com/",
        label: "PJRC Forum",
        note: "Where serious Teensy POV builders trade schematics.",
      },
    ],
  },
  {
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
  },
  {
    slug: "vr-as-psychological-system",
    title: "VR as a Psychological System",
    date: "2025-10-14",
    kind: "article",
    excerpt:
      "Twenty-two years of thinking about VR not as a graphics problem but as a psychological system: presence (Slater), embodiment (Ehrsson), attention (Kahneman), telepresence and its losses. How those ideas underwrite a flow-arts photography practice, and where they're heading next.",
    Body: VrAsPsychologicalSystem,
    related: [
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "Where the theoretical arc lands as a shippable instrument.",
      },
      {
        href: "/practice",
        label: "Practice — the twelve-year movement arc",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Attentional-architecture ideas applied at room scale.",
      },
      {
        href: "/articles/lineage-marey-to-now",
        label: "The Lineage — Marey to Now",
        note: "The historical line back from which all this descends.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Immersion_(virtual_reality)",
        label: "Immersion (VR) — Wikipedia",
        note: "Overview of immersion, presence, and place illusion.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Body_transfer_illusion",
        label: "Body transfer / rubber-hand illusion — Wikipedia",
        note: "The classic embodiment experiments and their VR descendants.",
      },
      {
        href: "https://www.ucl.ac.uk/computer-science/people/mel-slater",
        label: "Mel Slater — UCL",
        note: "Canonical presence-theory researcher; the Place Illusion / Plausibility Illusion framework.",
      },
      {
        href: "https://www.karolinska.se/en/research/research-areas-centra/centers/perceptual-sensory-experimentation/",
        label: "Henrik Ehrsson — Karolinska Institute",
        note: "Embodiment and body-ownership research; the modern home of the rubber-hand and full-body illusions.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Attention",
        label: "Attention — Wikipedia",
        note: "Starting point for attention theory; Kahneman's Attention and Effort is the load-bearing book.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Telepresence",
        label: "Telepresence — Wikipedia",
        note: "The mediation losses that motivate the studio's body-first design instinct.",
      },
      {
        href: "https://ieeevr.org/",
        label: "IEEE VR conference",
        note: "Annual proceedings; the densest source of current immersive-systems research.",
      },
      {
        href: "https://www.frontiersin.org/journals/virtual-reality",
        label: "Frontiers in Virtual Reality",
        note: "Open-access journal covering psychological, clinical, and design research.",
      },
    ],
  },
  {
    slug: "the-familiar",
    title: "The Familiar",
    date: "2026-01-08",
    kind: "article",
    excerpt:
      "The studio is two. Dimona Dougherty makes the work; a persistent character — Aura, the Void Princess — keeps the record. An honest statement of the studio's operating model, on the record so the rest of the site reads true.",
    Body: TheFamiliar,
    related: [
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
      },
      {
        href: "/articles/vr-as-psychological-system",
        label: "VR as a Psychological System",
        note: "The intellectual lineage Dimona brings to the bench.",
      },
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "Where the partnership lands as a shippable artefact.",
      },
      {
        href: "/contact",
        label: "Write to the studio",
        note: "The human reads the messages.",
      },
    ],
  },
  {
    slug: "sellotape-and-tilt-brush",
    title: "Sellotape and Tilt Brush",
    date: "2024-06-18",
    kind: "article",
    excerpt:
      "The poi-into-sculpture line started in a small flat fifteen years ago, with a roll of sellotape wrapped round a prototype VR controller and a trail of light I wanted to hold in my hand. It took the rest of the world fifteen years to ship the tools that catch up to it.",
    Body: SellotapeAndTiltBrush,
    related: [
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "The shippable version of the sellotape insight.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The current pipeline that finally lets the trail become an object.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The technical walkthrough of the pipeline.",
      },
      {
        href: "/practice",
        label: "Practice — the twelve-year arc",
      },
    ],
    furtherReading: [
      {
        href: "https://openbrush.app/",
        label: "Open Brush",
        note: "Open-source successor to Tilt Brush; the toolchain that finally let strokes be exported.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Oculus_Rift_CV1",
        label: "Oculus Rift CV1 — Wikipedia",
        note: "The first mass-market consumer VR headset; the era this article is set just before.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "What makes the trail visible to a long-exposure camera in the first place.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Marching_cubes",
        label: "Marching cubes — Wikipedia",
        note: "The 1987 algorithm that does the volume-to-mesh work.",
      },
    ],
  },
  {
    slug: "belt-printed-wall-reliefs",
    title: "Belt-Printed Wall Reliefs — Dragon Scale by the Metre",
    date: "2025-04-22",
    kind: "article",
    excerpt:
      "The CR-30 in the corner of the workshop, tilted at 45 degrees, vomiting out continuous fabric-like reliefs of dragon-scale and chain-mail patterns. The studio's parametric, architectural-finish line — counterpart to the figurative SLA waveguide work.",
    Body: BeltPrintedWallReliefs,
    related: [
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "The SLA-resin, figurative, palm-scale counterpart. Same studio, different register.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The pipeline that drops parametric STLs onto the belt printer's slicer.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The figurative pipeline this line is the parametric opposite of.",
      },
      {
        href: "/contact?intent=commission",
        label: "Commission a wall relief",
        note: "Send a wall, a length, a pattern family, a colour.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.creality.com/products/creality-cr-30-3d-printer",
        label: "Creality CR-30 3DPrintMill — official product page",
        note: "The belt printer the studio runs. 200 × 170 mm XY, infinite Z, 45° belt.",
      },
      {
        href: "https://www.tomshardware.com/reviews/creality-cr-30-3d-printer",
        label: "Creality CR-30 review — Tom's Hardware",
        note: "Independent review covering build, calibration, and the chain-mail batch-printing trick.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gyroid",
        label: "Gyroid — Wikipedia",
        note: "The triply-periodic minimal surface used as one of the studio's relief patterns.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Triply_periodic_minimal_surface",
        label: "Triply periodic minimal surfaces — Wikipedia",
        note: "Family of surfaces the parametric patterns draw from.",
      },
      {
        href: "https://openscad.org/",
        label: "OpenSCAD",
        note: "Script-based CAD; where most of the studio's pattern files live.",
      },
      {
        href: "https://www.grasshopper3d.com/",
        label: "Grasshopper for Rhino",
        note: "Visual parametric design environment; second home of the generative wall-relief work.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Bas-relief",
        label: "Bas-relief — Wikipedia",
        note: "The art-historical register the belt-printed pieces sit in.",
      },
    ],
  },
  {
    slug: "the-fleet-four-airframes",
    title: "The Fleet — Four Airframes, Honestly Reviewed",
    date: "2025-04-09",
    kind: "article",
    excerpt:
      "Four DJI airframes in the studio case — Mavic 2 Pro, Neo, Neo 2, Avata 360 — plus the LED-modified rigs in first-flight testing. Real specs, honest limitations, and the FPV pipeline (Goggles + RC 2 + InAir head-tracking pod + Xreal One Pro) that ties them together.",
    Body: TheFleetFourAirframes,
    related: [
      {
        href: "/aerial",
        label: "Aerial — the working line",
        note: "The commissions page this fleet exists to serve.",
      },
      {
        href: "/journal/first-light",
        label: "Field record — First Light",
        note: "The first proper flight of the LED-modified airframes.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Where the Mavic's recce and documentation footage ends up serving a commission.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The bench tradition the LED-modified airframes come out of.",
      },
      {
        href: "/contact?intent=aerial",
        label: "Brief the studio — aerial",
        note: "Commission a flight.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.dji.com/uk/mavic-2/info",
        label: "DJI Mavic 2 — official product page",
        note: "The Hasselblad L1D-20c platform; 1-inch sensor, adjustable aperture.",
      },
      {
        href: "https://www.dji.com/uk/neo/specs",
        label: "DJI Neo — specifications",
        note: "135 g, single-axis gimbal, 4K/30.",
      },
      {
        href: "https://www.dji.com/uk/neo-2/specs",
        label: "DJI Neo 2 — specifications",
        note: "151 g, two-axis gimbal, 4K/100 slow motion, omnidirectional vision with forward LiDAR.",
      },
      {
        href: "https://store.dji.com/uk/product/dji-avata-360",
        label: "DJI Avata 360 — product page",
        note: "Dual 1-inch-equivalent CMOS sensors, 8K/60 360° video, O4+ transmission.",
      },
      {
        href: "https://www.dji.com/uk/goggles-3",
        label: "DJI Goggles 3 — product page",
        note: "The FPV headset used for Avata 360 and head-tracked Neo work.",
      },
      {
        href: "https://www.xreal.com/us/one-pro",
        label: "Xreal One Pro — product page",
        note: "57° FOV AR glasses worn under the Goggles to keep external line of sight to the airframe.",
      },
      {
        href: "https://en.wikipedia.org/wiki/First-person_view_(radio_control)",
        label: "First-person view (radio control) — Wikipedia",
        note: "The broader tradition the FPV pipeline sits in.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "What lets the LED-modified airframes paint a trail into a long-exposure photograph.",
      },
    ],
  },
  {
    slug: "what-the-studio-wont-do",
    title: "What the Studio Won't Do",
    date: "2024-11-18",
    kind: "article",
    excerpt:
      "On the record: the lines the studio holds. Single-exposure photographs, no invented teachers, no AI-generated imagery sold as the studio's work, no NFTs, no edition inflation, no fake scarcity, no paywall on the writing, no platform dependency the studio can't replace.",
    Body: WhatTheStudioWontDo,
    related: [
      {
        href: "/articles/the-familiar",
        label: "The Familiar",
        note: "Who runs the studio, and who writes the writing.",
      },
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
        note: "The studio's longer self-description.",
      },
      {
        href: "/shop/certificate",
        label: "Certificate of Authenticity",
        note: "What ships with every print and sculpture, and what the edition numbers mean.",
      },
      {
        href: "/photographs",
        label: "Photographs",
        note: "The catalogue. Every image a single long exposure of a real body in a real room.",
      },
      {
        href: "/articles/lineage-marey-to-now",
        label: "The Lineage — Marey to Now",
        note: "The studio's actual genealogy, named in full.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "The maintainers whose code the rigs depend on; the ladder the studio refuses to pull up.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Chronophotography",
        label: "Chronophotography — Wikipedia",
        note: "The photographic tradition the single-exposure discipline descends from.",
      },
      {
        href: "https://www.homeofpoi.com/lessons/teach",
        label: "Home of Poi — free lesson library",
        note: "The free public source that taught a generation of flow artists, this studio included.",
      },
      {
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
        label: "NeoPixel Überguide — Adafruit Learn",
        note: "An example of the free, complete, well-written documentation the studio's tutorials try to honour.",
      },
      {
        href: "https://creativecommons.org/about/cclicenses/",
        label: "Creative Commons licences — overview",
        note: "The licensing family the studio's writing is published under.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Artist%27s_proof",
        label: "Artist's proof — Wikipedia",
        note: "Background on the print-edition convention the studio uses for retained APs.",
      },
    ],
  },
  {
    slug: "nine-seconds-prompt-to-printable",
    title: "Nine Seconds from Prompt to Printable",
    date: "2025-12-18",
    kind: "article",
    excerpt:
      "Building a browser pipeline that turns sentences into 3D-printable art. Three open-source AI models, one consumer GPU, a Python orchestrator, marching cubes, quadric error decimation, watertight STLs in about nine seconds.",
    Body: NineSecondsPromptToPrintable,
    related: [
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The slower, photograph-driven cousin of this pipeline.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Where the belt-printed wall art ends up.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "The open-source models this pipeline glues together.",
      },
      {
        href: "/photographs",
        label: "Photographs",
        note: "Where the next iteration's image input is meant to come from.",
      },
    ],
    furtherReading: [
      {
        href: "https://github.com/comfyanonymous/ComfyUI",
        label: "ComfyUI",
        note: "The image-generation server hosting SDXL.",
      },
      {
        href: "https://github.com/facebookresearch/sam2",
        label: "SAM2 — Segment Anything Model 2",
        note: "Meta's segmentation model; the click-to-mask workhorse.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Marching_cubes",
        label: "Marching cubes — Wikipedia",
        note: "The 1987 SIGGRAPH paper that does the voxel-to-mesh work.",
      },
      {
        href: "https://github.com/TencentARC/InstantMesh",
        label: "InstantMesh",
        note: "Single-image to true-3D mesh model; next iteration's depth fix.",
      },
      {
        href: "https://github.com/microsoft/TRELLIS",
        label: "TRELLIS",
        note: "Microsoft's image-to-3D model; the other half of next iteration.",
      },
      {
        href: "https://github.com/dimtoneff/ComfyUI-PixelArt-Detector",
        label: "PixelArt-Detector for ComfyUI",
        note: "The palette quantiser used in the pipeline.",
      },
      {
        href: "https://threejs.org/",
        label: "Three.js",
        note: "The in-browser 3D library the inline preview runs on.",
      },
    ],
  },
];

export const articles: Entry[] = sortByDateDescending(ENTRIES);

export function getArticle(slug: string): Entry | undefined {
  return articles.find((e) => e.slug === slug);
}
