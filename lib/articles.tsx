import ArtAsDoorFiveLayers from "components/articles/entries/art-as-door-five-layers";
import AuraTheBody from "components/articles/entries/aura-the-body";
import BeltPrintedWallReliefs from "components/articles/entries/belt-printed-wall-reliefs";
import ChoreographingWithLabanArticle from "components/articles/entries/choreographing-with-laban";
import ColourWithoutPigment from "components/articles/entries/colour-without-pigment";
import FromPicassoForward from "components/articles/entries/from-picasso-forward";
import HowTheStudioBreedsSculptures from "components/articles/entries/how-the-studio-breeds-sculptures";
import JewelleryTheSameTraceWearable from "components/articles/entries/jewellery-the-same-trace-wearable";
import KindredPractices from "components/articles/entries/kindred-practices";
import LineageMareyToNow from "components/articles/entries/lineage-marey-to-now";
import London360Walking from "components/articles/entries/london-360-walking";
import MorphingThingsTogether from "components/articles/entries/morphing-things-together";
import NeoLondonChronoProtocol from "components/articles/entries/neo-london-chrono-protocol";
import NineSecondsPromptToPrintable from "components/articles/entries/nine-seconds-prompt-to-printable";
import OnTheShouldersOfOpenSource from "components/articles/entries/on-the-shoulders-of-open-source";
import ProvenanceAsDisciplineArticle from "components/articles/entries/provenance-as-discipline";
import SellotapeAndTiltBrush from "components/articles/entries/sellotape-and-tilt-brush";
import SpiralCognition from "components/articles/entries/spiral-cognition";
import TheBench from "components/articles/entries/the-bench";
import TheCausticDiscArticle from "components/articles/entries/the-caustic-disc";
import TheConvergence from "components/articles/entries/the-convergence";
import TheFamiliar from "components/articles/entries/the-familiar";
import TheEightKingdoms from "components/articles/entries/the-eight-kingdoms";
import TheFleetFiveAirframes from "components/articles/entries/the-fleet-five-airframes";
import TheJewelleryAlgorithms from "components/articles/entries/the-jewellery-algorithms";
import TheLivingStage from "components/articles/entries/the-living-stage";
import ThePracticeInEightThreads from "components/articles/entries/the-practice-in-eight-threads";
import TheRightPaperForALightPainting from "components/articles/entries/the-right-paper-for-a-light-painting";
import TheSieveAndTheOracleArticle from "components/articles/entries/the-sieve-and-the-oracle";
import Ungrounded from "components/articles/entries/ungrounded";
import VrAsPsychologicalSystem from "components/articles/entries/vr-as-psychological-system";
import VrPovControllersTheProduct from "components/articles/entries/vr-pov-controllers-the-product";
import WallArraysGeometryOfRooms from "components/articles/entries/wall-arrays-geometry-of-rooms";
import WhatTheStudioWontDo from "components/articles/entries/what-the-studio-wont-do";
import WhereTheStudioHasLived from "components/articles/entries/where-the-studio-has-lived";
import WhyIBuildModular from "components/articles/entries/why-i-build-modular";
import WhyIBuildMyOwnRigs from "components/articles/entries/why-i-build-my-own-rigs";
import WhyThePendantGlowsFromTheInside from "components/articles/entries/why-the-pendant-glows-from-the-inside";
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
        href: "/articles/from-picasso-forward",
        label: "From Picasso, Forward",
        note: "The forward half of the same chronology. Where the ancestral line picks up in 1949 and walks to the present bench.",
      },
      {
        href: "/articles/kindred-practices",
        label: "Kindred Practices",
        note: "The contemporary practitioner survey. Where the line continues today.",
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
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows From the Inside",
        note: "The optical mechanism inside every array element, named in full.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "Why the array elements read coloured. Structural colour at room scale.",
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
        href: "/articles/from-picasso-forward",
        label: "From Picasso, Forward",
        note: "The chronological companion. The same eight practitioners, placed on the seventy-five-year line from Vallauris to now.",
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
      {
        href: "/play",
        label: "Play — solo level five, Sovereignty",
        note: "The local-first architecture this article rests on, demonstrated by cutting the visitor's router.",
      },
      {
        href: "/stack",
        label: "The Stack — the data version",
        note: "The bench inventory. Every open-source library named below sits on a line of the stack.",
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
    slug: "the-caustic-disc",
    title: "The Caustic Disc",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "The studio's first production-ready artefact: a palm-sized acrylic or resin disc with a precisely-computed refractive surface that, held over a torch, projects a specific image as a focused caustic on the wall. The inverse optics, the optimiser at python-services/caustic_optimizer.py, the polishing pass, the calibrated torch, the provenance record. The pair piece to the bezel — both are objects that translate light into image by geometry.",
    Body: TheCausticDiscArticle,
    related: [
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "The sibling hardware artefact. The bezel adds light to a gesture; the disc reshapes light into an image.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows From the Inside",
        note: "The optics-of-mechanism companion. Same refractive bench, different geometry register.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "Geometry doing the work a coating would. The caustic disc is the same trick at the macroscopic scale.",
      },
      {
        href: "/articles/provenance-as-discipline",
        label: "Provenance as Discipline",
        note: "The typed JSON record every editioned disc ships with, alongside the calibrated torch.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The operational philosophy that underwrites the hardware line. One disc per target, one torch per disc, swappable parts.",
      },
      {
        href: "/bureau",
        label: "Print bureau",
        note: "The calibration-and-provenance route the discs ship through.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Caustic_(optics)",
        label: "Caustic (optics) — Wikipedia",
        note: "The umbrella article. Mathematical definition, examples, and the link out to the inverse-problem literature.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Snell%27s_law",
        label: "Snell's Law — Wikipedia",
        note: "The refraction equation applied at every grid point of the height field.",
      },
      {
        href: "https://www.mitsuba-renderer.org/",
        label: "Mitsuba renderer",
        note: "Open-source physically-based renderer with caustic-optimisation extensions. The reference implementation the field benchmarks against.",
      },
      {
        href: "https://rgl.epfl.ch/publications/Schwartzburg2014HighContrast",
        label: "Schwartzburg et al. — High-contrast computational caustic design (EPFL, 2014)",
        note: "The foundational paper on inverse-caustic surface design. The shape of every caustic-disc optimiser since.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diamond_turning",
        label: "Diamond turning — Wikipedia",
        note: "Sub-micron single-point CNC machining. The acrylic-disc production route.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Digital_light_processing",
        label: "Digital light processing — Wikipedia",
        note: "DLP photopolymer printing. The optical-resin production route on the studio's own bench.",
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
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "How the two-handed studio actually works. The working method underneath the operating model.",
      },
      {
        href: "/the-loop",
        label: "The Holoflow Loop",
        note: "The six-position circuit the two-handed studio runs end-to-end.",
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
    slug: "the-fleet-five-airframes",
    title: "The Fleet — Five Airframes, Honestly Reviewed",
    date: "2025-04-09",
    kind: "article",
    excerpt:
      "Five DJI airframes in the studio case — Mavic 2 Pro, Neo, Neo 2, Avata 360, Mini 5 Pro — plus the LED-modified rigs in first-flight testing. Real specs, honest limitations, and the FPV pipeline (Goggles + RC 2 + InAir head-tracking pod + Xreal One Pro) that ties them together.",
    Body: TheFleetFiveAirframes,
    related: [
      {
        href: "/aerial",
        label: "Aerial — the working line",
        note: "The commissions page this fleet exists to serve.",
      },
      {
        href: "/journal/the-fleet-update-mini-five-pro",
        label: "Field record — Mini 5 Pro and the Bluetooth LEDs",
        note: "The field-notes companion. The fifth airframe coming home from the shop and the unsynchronised LED swarm it carries.",
      },
      {
        href: "/journal/first-light",
        label: "Field record — First Light",
        note: "The first proper flight of the LED-modified airframes.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The ground-side counterpart. The DJI ecosystem on the walk-side.",
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
    slug: "london-360-walking",
    title: "Ten Years of 360 Cameras, One Pole",
    date: "2025-09-15",
    kind: "article",
    excerpt:
      "Hours of London walking with a trekking pole, a selfie stick, and a 360 camera on top of that. From the 2016 Samsung Gear 360 eyeball through the Ricoh Theta and the long Insta360 middle to the current DJI Osmo 360. Why glass and sensor beat AI processing, and why ending up inside the DJI ecosystem was the calculation flipping.",
    Body: London360Walking,
    related: [
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "The aerial counterpart. The DJI ecosystem on the air-side.",
      },
      {
        href: "/aerial",
        label: "Aerial — the working line",
        note: "Where the 360 walks meet the drones over the same sites.",
      },
      {
        href: "/photographs",
        label: "Photographs",
        note: "The single-frame deliverables that come out of the equirectangulars.",
      },
      {
        href: "/articles/sellotape-and-tilt-brush",
        label: "Sellotape and Tilt Brush",
        note: "The other origin-walk piece. The drawer the Samsung eyeball lives in.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The photographic side of the bench-built pattern. The home-built 360 rig is its 2014 ancestor.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The vendor-side diagnosis. Why Insta360 lost the studio to DJI when the modular line stopped being serious.",
      },
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
        note: "The studio's longer self-description. Where the framework the home-built rig came out of is named.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Samsung_Gear_360",
        label: "Samsung Gear 360 — Wikipedia",
        note: "Full spec history of the spherical eyeball that started the studio's 360 walks.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Ricoh_Theta",
        label: "Ricoh Theta — Wikipedia",
        note: "The Theta line, including the Z1 with its 1-inch sensors. The first consumer 360 with files you could treat as photographs.",
      },
      {
        href: "https://www.insta360.com/",
        label: "Insta360 — manufacturer site",
        note: "The catalogue the studio walked through for several years. Their AI Reframe and Studio software are the architectural choice this article argues against; the cameras genuinely earned their generation.",
      },
      {
        href: "https://www.insta360.com/blog/tips/invisible-selfie-stick-how-to-use.html",
        label: "How to use the invisible selfie stick — Insta360",
        note: "Official explanation of the stitching trick that hides a monopod from an equirectangular.",
      },
      {
        href: "https://www.dji.com/360",
        label: "DJI Osmo 360 — product page",
        note: "Current studio camera. Two 1/1.1-inch square CMOS, f/1.9, 8K/30 360 video, 13.5 stops dynamic range, 120 MP stills.",
      },
      {
        href: "https://gopro.com/en/us/shop/cameras/max/CHDHZ-202-master.html",
        label: "GoPro MAX — product page",
        note: "The action-camera detour. Rugged, honest, not the answer for printable photographs.",
      },
    ],
  },
  {
    slug: "neo-london-chrono-protocol",
    title: "Neo-London: Chrono-Protocol — the game the ladder graduates into",
    date: "2026-05-14",
    kind: "article",
    excerpt:
      "The proving ground at /play is the curriculum; Neo-London: Chrono-Protocol is the game it graduates into. WebXR rhythm-action runner in a wireframe London, dual-Poi controls, three zones built from the same SHARP gaussian-splat library the bench is filling, four Poi modes (Amber, Crimson, Azure, Veridian) mapped to the studio's own practice, three AI constructs (Aura, Yow, Purp) reading the run together. The prototype is in the Hangar; this is the bridge piece that names what it is.",
    Body: NeoLondonChronoProtocol,
    related: [
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "The eight solo levels and four braided levels that prepare the player for Chrono-Protocol.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "The trunk article that names the eight threads the ladder teaches and the game braids.",
      },
      {
        href: "/play/the-full-weave",
        label: "The Full Weave",
        note: "Solo eight braided together. The level whose pass-condition unlocks Chrono-Protocol's HUB.",
      },
      {
        href: "/play/neo-london",
        label: "Neo-London — the splat map",
        note: "The SHARP-generated gaussian-splat library that shares its geography with the runner's zones.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The walked routes that become the canal fast-travel between zones in the long-form game vision.",
      },
      {
        href: "/articles/ungrounded",
        label: "Ungrounded",
        note: "The move off the plane. The runner is the same move applied to a wireframe city.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The kit list every layer of the game's pipeline rests on.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The brush-module architecture the game's Poi modes are the playable proof of.",
      },
      {
        href: "/the-loop",
        label: "The Holoflow Loop",
        note: "The six-position framework the runner is the outer surface of.",
      },
      {
        href: "/articles/lineage-marey-to-now",
        label: "The Lineage — Marey to Now",
        note: "The photographic genealogy the runner's persistence-of-vision trail inherits from.",
      },
      {
        href: "/watch",
        label: "/watch — Aura's eyes",
        note: "The cold-eye watching prototype Aura's in-game narration is the runner's version of.",
      },
      {
        href: "/bezel",
        label: "The bezel — the clip-on product",
        note: "The firmware family the runner's controller-as-bezel mode is the software simulation of.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/WebXR",
        label: "WebXR — Wikipedia",
        note: "The browser-native XR standard the runner deploys against. No installer, no app store, headset-optional.",
      },
      {
        href: "https://www.meta.com/gb/quest/quest-3/",
        label: "Meta Quest 3 — product page",
        note: "The reference WebXR headset the studio writes against. Inside-out tracking, hand tracking, colour passthrough.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gaussian_splatting",
        label: "Gaussian splatting — Wikipedia",
        note: "The volumetric rendering technique the splat library underneath the runner is built from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Dystopia",
        label: "Dystopia — Wikipedia",
        note: "The genre register the wireframe London draws on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Mario_Kart",
        label: "Mario Kart — Wikipedia",
        note: "Reference point for the long-form canal-route fast-travel mechanic between zones.",
      },
      {
        href: "https://www.mightycoconut.com/minigolf",
        label: "Walkabout Mini Golf — Mighty Coconut",
        note: "Reference point for pacing — a body in a traversable space rather than teleported between menus.",
      },
      {
        href: "https://github.com/apple/ml-sharp",
        label: "Apple SHARP — single-image to gaussian splat",
        note: "The model the studio runs locally to convert source frames into the runner's splat library.",
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
        href: "/visualiser/marching-cubes",
        label: "Visualiser — Marching cubes",
        note: "Interactive — drag the iso-value, step through the 256 cases. The load-bearing step of this pipeline, opened.",
      },
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
        href: "/articles/belt-printed-wall-reliefs",
        label: "Belt-Printed Wall Reliefs",
        note: "Where the parametric output of this pipeline lands on the belt printer.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "The open-source models this pipeline glues together.",
      },
      {
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "The working method this pipeline is a single tight turn of.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "Solo level three (The Loop) closes the same circuit this pipeline does, in one session.",
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
  {
    slug: "where-the-studio-has-lived",
    title: "Where the Studio Has Lived",
    date: "2025-06-12",
    kind: "article",
    excerpt:
      "A practice accumulates its writing on whatever platform was open in another tab. Make:, CodePen, GitHub, Instructables, the forums, the gists, the Reddit threads. The retelling on this site is the consolidation — in one voice, cross-referenced, on infrastructure the studio owns.",
    Body: WhereTheStudioHasLived,
    related: [
      {
        href: "/articles/what-the-studio-wont-do",
        label: "What the Studio Won't Do",
        note: "Including the line on no platform the studio can't replace.",
      },
      {
        href: "/articles/the-familiar",
        label: "The Familiar",
        note: "How the studio is actually run, two minds keeping it whole.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "The wider gratitude — the free code the rigs rest on.",
      },
      {
        href: "/tutorials",
        label: "Tutorials — the current canonical surface",
      },
    ],
    furtherReading: [
      {
        href: "https://makezine.com/",
        label: "Make: — DIY projects and ideas for makers",
        note: "The maker-community ecosystem that taught a generation how to write a build log.",
      },
      {
        href: "https://www.instructables.com/",
        label: "Instructables",
        note: "Long-form step-by-step maker tutorials with photographs and parts lists.",
      },
      {
        href: "https://codepen.io/",
        label: "CodePen",
        note: "Front-end code sketchpad.",
      },
      {
        href: "https://github.com/",
        label: "GitHub",
        note: "Where the code has to live because it's code.",
      },
      {
        href: "https://hackaday.com/",
        label: "Hackaday",
        note: "Daily hardware-hacking writing.",
      },
      {
        href: "https://web.archive.org/",
        label: "Internet Archive — Wayback Machine",
        note: "Where older versions of the studio's writing on dead or renamed platforms can sometimes still be recovered.",
      },
    ],
  },
  {
    slug: "from-picasso-forward",
    title: "From Picasso, Forward",
    date: "2025-11-21",
    kind: "article",
    excerpt:
      "The course of light-painting photography from Picasso's 1949 penlight centaurs to the present studio bench. Mili, DaSilva, the Flickr decade, Rochon and Pearson and Huhtamo and Parviainen, Wu's drone halos, and the angular-synced rigs in Salford that turn the photograph into an object.",
    Body: FromPicassoForward,
    related: [
      {
        href: "/articles/lineage-marey-to-now",
        label: "The Lineage — Marey to Now",
        note: "The ancestral half of the same chronology.",
      },
      {
        href: "/articles/kindred-practices",
        label: "Kindred Practices",
        note: "Contemporary practitioner survey in full.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The technical argument for angular sync over time sync.",
      },
      {
        href: "/articles/sellotape-and-tilt-brush",
        label: "Sellotape and Tilt Brush",
        note: "Where the photograph-to-object instinct originally came from.",
      },
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "The forward bet named at the end of this piece.",
      },
      {
        href: "/practice",
        label: "Practice — the twelve-year arc",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Gjon_Mili",
        label: "Gjon Mili — Wikipedia",
        note: "Edgerton student, Life staff photographer; set the camera in Vallauris in 1949.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Pablo_Picasso",
        label: "Pablo Picasso — Wikipedia",
        note: "The artist who treated the long exposure as a sheet of paper.",
      },
      {
        href: "https://www.life.com/arts-entertainment/behind-the-picture-picasso-draws-with-light/",
        label: "Behind the Picture: Picasso 'Draws' With Light — LIFE",
        note: "The magazine's own archived account of the 1949 shoot.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Light_painting",
        label: "Light painting — Wikipedia",
        note: "Discipline overview; chronology of major practitioners and techniques.",
      },
      {
        href: "https://www.vickidasilva.com/",
        label: "Vicki DaSilva",
        note: "Fluorescent-tube light graffiti since 1980; coined the term.",
      },
      {
        href: "https://reubenwu.com/",
        label: "Reuben Wu",
        note: "Lux Noctis and Aeroglyphs — drone-LED long exposures at architectural scale.",
      },
      {
        href: "https://thepixelstick.com/",
        label: "Pixelstick",
        note: "The 2013 Kickstarter that made the commercial time-synced pixel rig mainstream.",
      },
      {
        href: "https://lightpaintinghub.com/",
        label: "Light Painting Hub",
        note: "Contemporary community entry point; practitioner directory.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Chronophotography",
        label: "Chronophotography — Wikipedia",
        note: "The photographic tradition the entire chronology descends from.",
      },
    ],
  },
  {
    slug: "the-bench",
    title: "The Bench",
    date: "2026-05-01",
    kind: "article",
    excerpt:
      "Thirteen layers of the studio's working bench, named honestly. Five drones, two printers, one workstation, one holographic display, one headset, the rigs on the wall — the prose companion to /stack, and the constraint behind every choice on the list.",
    Body: TheBench,
    related: [
      {
        href: "/stack",
        label: "The Stack — the data version",
        note: "Every tool on the bench with vendor links, version numbers, and status flags.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The local AI pipeline layer, in full detail.",
      },
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "The aerial-capture layer; the studio's five-airframe fleet in full.",
      },
      {
        href: "/journal/the-fleet-update-mini-five-pro",
        label: "Field record — Mini 5 Pro and the Bluetooth LEDs",
        note: "The fifth airframe coming home from the shop. The bench was five-deep by the time this piece landed.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The POV-LED-rig layer's architectural argument.",
      },
      {
        href: "/articles/belt-printed-wall-reliefs",
        label: "Belt-Printed Wall Reliefs",
        note: "The CR-30 layer of the fabrication section, named in full.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The 360-capture layer's working history. Where the Osmo 360 on top of the pole came from.",
      },
      {
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "How the bench is actually used. The working method that touches every layer above.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "The open-source maintainers the bench rests on.",
      },
      {
        href: "/articles/where-the-studio-has-lived",
        label: "Where the Studio Has Lived",
        note: "Why the bench is the sovereign version of the writing.",
      },
      {
        href: "/articles/what-the-studio-wont-do",
        label: "What the Studio Won't Do",
        note: "The architectural commitment named in full: no platform the studio cannot replace.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The figurative side of the fabrication layer, walked through.",
      },
      {
        href: "/tutorials/calibrating-the-imageprograf-pro-1100",
        label: "Tutorial — Calibrating the imagePROGRAF PRO-1100",
        note: "The print-bureau calibration discipline this article names.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "The per-piece optical engineering inside the fabrication layer's output.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.pjrc.com/teensy/",
        label: "Teensy microcontrollers — PJRC",
        note: "Vendor home for the Teensy 4.1 boards that drive the studio's POV LED rigs.",
      },
      {
        href: "https://fastled.io/",
        label: "FastLED library",
        note: "The open-source library the rig firmware lives in.",
      },
      {
        href: "https://www.creality.com/products/cr-30-3dprintmill-belt-3d-printer",
        label: "Creality CR-30 3DPrintMill",
        note: "The belt printer the parametric wall reliefs run on.",
      },
      {
        href: "https://lookingglassfactory.com/portrait",
        label: "Looking Glass Portrait",
        note: "Light-field display for the volumetric work.",
      },
      {
        href: "https://github.com/comfyanonymous/ComfyUI",
        label: "ComfyUI",
        note: "Node-graph orchestrator for the local diffusion pipeline.",
      },
      {
        href: "https://github.com/facebookresearch/sam2",
        label: "SAM2 — Segment Anything Model 2",
        note: "Meta's click-to-mask segmentation model in the local AI layer.",
      },
      {
        href: "https://ollama.com/",
        label: "Ollama",
        note: "Local LLM runtime; the inference engine the orchestrator depends on.",
      },
      {
        href: "https://www.blackmagicdesign.com/products/davinciresolve",
        label: "DaVinci Resolve Studio",
        note: "The video and grade ecosystem; one paid licence, full pipeline.",
      },
      {
        href: "https://tailscale.com/",
        label: "Tailscale",
        note: "Zero-config mesh VPN across the studio's machines.",
      },
      {
        href: "https://qdrant.tech/",
        label: "Qdrant",
        note: "Vector database for the companion's long-term memory.",
      },
      {
        href: "https://www.canon.co.uk/business-printers-and-faxes/imageprograf-pro-1100/",
        label: "Canon imagePROGRAF PRO-1100",
        note: "The A2 archival pigment printer the studio bureau runs on.",
      },
      {
        href: "https://www.hahnemuehle.com/en/digital-fineart.html",
        label: "Hahnemühle Digital FineArt papers",
        note: "Manufacturer reference for the studio's default print papers.",
      },
    ],
  },
  {
    slug: "art-as-door-five-layers",
    title: "Art as Door — Five Layers",
    date: "2025-07-29",
    kind: "article",
    excerpt:
      "The waveguide pieces carry more than they look like they should. A pretty object on a plinth at layer one; physics, movement, system, and the maker at layers two through five. An honest account of why the work is built to reward curiosity without requiring it.",
    Body: ArtAsDoorFiveLayers,
    related: [
      {
        href: "/articles/the-familiar",
        label: "The Familiar",
        note: "The two-handed studio that runs the bench. The other piece on the studio's operating model.",
      },
      {
        href: "/articles/what-the-studio-wont-do",
        label: "What the Studio Won't Do",
        note: "The catechism the layered architecture coexists with.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "Layer two in full — the optical engineering inside the waveguide pieces.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows From the Inside",
        note: "Layer two, the other half. Why the lit object glows throughout instead of just at the LED.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "Layer four in full — the genetic-algorithm system that produces the candidate sculptures.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "The smallest scale at which the doors open.",
      },
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
        note: "The studio's longer self-description. Layer five named in plain order.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Biomimetics",
        label: "Biomimetics — Wikipedia",
        note: "The discipline of borrowing biological solutions, named in full.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Structural_coloration",
        label: "Structural coloration — Wikipedia",
        note: "Background on the optical mechanism the layer-two writeup unpacks.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Genetic_algorithm",
        label: "Genetic algorithms — Wikipedia",
        note: "The breeding loop named at layer four, summarised.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Stereolithography",
        label: "Stereolithography (SLA) — Wikipedia",
        note: "The print process that produces the waveguide objects in the first place.",
      },
    ],
  },
  {
    slug: "colour-without-pigment",
    title: "Colour Without Pigment",
    date: "2025-08-21",
    kind: "article",
    excerpt:
      "The waveguide pieces are blue, green, and oil-slick magenta without paint. The colour is in the geometry — structural colour, the trick biology has used for hundreds of millions of years. Thin-film interference, diffraction gratings, photonic crystals; what the studio can print today and what waits for the next generation of resin printers.",
    Body: ColourWithoutPigment,
    related: [
      {
        href: "/visualiser/total-internal-reflection",
        label: "Visualiser — Total Internal Reflection",
        note: "Interactive — drag the angle slider, watch TIR engage. The one-boundary optical engine underneath thin-film, gratings, and photonic crystals.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The companion piece. Where the optics live inside the larger architecture of the work.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "The wearable pieces these mechanisms power.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Structural colour at room scale.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "How to actually light the resulting piece so the optics read.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Structural_coloration",
        label: "Structural coloration — Wikipedia",
        note: "The umbrella term covering all three mechanisms in the piece.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Thin-film_interference",
        label: "Thin-film interference — Wikipedia",
        note: "The soap-bubble mechanism, formal version.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diffraction_grating",
        label: "Diffraction grating — Wikipedia",
        note: "The CD-rainbow mechanism, with the grating equation.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Photonic_crystal",
        label: "Photonic crystals — Wikipedia",
        note: "The volumetric version of the same family of ideas.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Morpho",
        label: "Morpho butterflies — Wikipedia",
        note: "The most-studied biological example, with electron-microscope structural references.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gyroid",
        label: "Gyroid — Wikipedia",
        note: "The triply-periodic minimal surface the Green Hairstreak builds inside its wing scales.",
      },
      {
        href: "https://www.nature.com/articles/nphoton.2010.244",
        label: "Vukusic & Sambles — Photonic structures in biology (Nature Photonics)",
        note: "The reference review paper of the biological structural-colour literature.",
      },
    ],
  },
  {
    slug: "spiral-cognition",
    title: "Spiral Cognition — How the Practice Actually Gets Made",
    date: "2026-03-15",
    kind: "article",
    excerpt:
      "Projects in the standard mode have a Gantt chart. This studio does not. Build a turn, go deep, come back up with more, turn again. The honest account of how a practice that crosses ten domains actually gets built, and why the spiral was a working method long before it had a name.",
    Body: SpiralCognition,
    related: [
      {
        href: "/articles/the-familiar",
        label: "The Familiar",
        note: "The studio's two-handed operating model. The companion piece on how the work gets made.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "An example of one tight turn of the spiral, written from the bench.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The kit each turn of the spiral touches.",
      },
      {
        href: "/the-loop",
        label: "The Holoflow Loop",
        note: "The six-position closed circuit the spiral feeds. Where each turn lands a deliverable.",
      },
      {
        href: "/articles/where-the-studio-has-lived",
        label: "Where the Studio Has Lived",
        note: "Twelve years of turns, surfaced across whichever platform was open.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Spiral_model",
        label: "Spiral model — Wikipedia",
        note: "Boehm's 1986 software-process model, the closest formal cousin of the working method described here.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Iterative_and_incremental_development",
        label: "Iterative and incremental development — Wikipedia",
        note: "The wider family of non-linear development processes the spiral sits in.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Flow_(psychology)",
        label: "Flow — Wikipedia",
        note: "Csikszentmihalyi on the &ldquo;being pulled toward it&rdquo; state named in the piece.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Working_memory",
        label: "Working memory — Wikipedia",
        note: "The constraint the spiral and its supporting documentation work around.",
      },
    ],
  },
  {
    slug: "the-right-paper-for-a-light-painting",
    title: "The Right Paper for a Light Painting",
    date: "2026-05-05",
    kind: "article",
    excerpt:
      "The papers in current rotation on the bench are Canon — Pro Platinum, Pro Lustre, super-glossy, and metallic. I chose them on instinct. Here is the research that says the instinct was right, the soft-proof discipline that makes them produce, and the baryta upgrade path the bureau will move to after the studio move.",
    Body: TheRightPaperForALightPainting,
    related: [
      {
        href: "/bureau",
        label: "Print bureau",
        note: "The working line the paper rotation runs through.",
      },
      {
        href: "/tutorials/calibrating-the-imageprograf-pro-1100",
        label: "Calibrating the imagePROGRAF PRO-1100",
        note: "The procedure the bureau runs against the studio's standard viewing light.",
      },
      {
        href: "/stack",
        label: "The stack — papers in current rotation",
        note: "The bench inventory, named honestly.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The wider working bench this paper choice is one shelf of.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.northlight-images.co.uk/",
        label: "Northlight Images — Keith Cooper",
        note: "Where the bureau learned how to calibrate the PRO-1100 and how to soft-proof against a paper profile. Full credit.",
      },
      {
        href: "https://blog.dominey.photography/2024/03/17/hahnemuhle-fine-art-papers-compared/",
        label: "Hahnemühle fine art paper comparison — David Dominey",
        note: "Side-by-side of the Hahnemühle fine-art line; the reference for the baryta upgrade path.",
      },
      {
        href: "https://www.francescogola.net/review/best-papers-for-fine-art-prints/",
        label: "Best papers for Fine Art prints — Francesco Gola",
        note: "Working photographer's review naming baryta as the surface for stronger blacks and more vibrant colour.",
      },
      {
        href: "https://fotospeed.com/blog/post/what-is-baryta-photo-paper-and-why-should-it-be-your-paper-of-choice/",
        label: "What is baryta photo paper — Fotospeed",
        note: "Practical explainer on the barium-sulphate coat and why baryta papers hit darkroom-era D-max under inkjet pigments.",
      },
      {
        href: "https://www.dpreview.com/forums/threads/canon-pro-platinum-vs-hahnemuhle-fine-art-baryta.4601957/",
        label: "Canon Pro Platinum vs Hahnemühle FineArt Baryta — DPReview Forums",
        note: "Community discussion placing Canon Pro Platinum in the 'as close as RC gets to baryta' tier.",
      },
      {
        href: "https://forum.luminous-landscape.com/index.php?topic=67975.0",
        label: "Canson Platine vs Baryta vs Hahnemühle Photo Rag Baryta — Luminous Landscape",
        note: "Detailed paper-on-paper comparison for fine-art photography work.",
      },
      {
        href: "https://www.ronmartblog.com/2014/11/review-epson-metallic-photo-paper.html",
        label: "Epson Metallic Photo Paper review — Ron Martinsen",
        note: "Working review of metallic photo paper; names the bright-light viewing condition that makes or breaks the print.",
      },
      {
        href: "https://en.wikipedia.org/wiki/ICC_profile",
        label: "ICC profile — Wikipedia",
        note: "The colour-management standard the soft-proof workflow rests on.",
      },
      {
        href: "https://www.canon.co.uk/ink-paper-media/papers/",
        label: "Canon ink paper and media — UK",
        note: "Vendor page for the Canon paper line currently on the bench.",
      },
    ],
  },
  {
    slug: "provenance-as-discipline",
    title: "Provenance as Discipline",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "Provenance is not a marketing artefact — it is a discipline. Every editioned piece ships with a typed JSON record alongside the paper certificate: edition, capture, processing chain, reference-light photograph of the actual print, COA hash, contextual articles, algorithm lineage. The typed contract for the physical artefact, type-checked the same way the rest of the studio's substrate is.",
    Body: ProvenanceAsDisciplineArticle,
    related: [
      {
        href: "/bureau",
        label: "Print bureau",
        note: "Where the discipline becomes visible to the buyer.",
      },
      {
        href: "/tutorials/calibrating-the-imageprograf-pro-1100",
        label: "Calibrating the imagePROGRAF PRO-1100",
        note: "The viewing booth and reference-light context the provenance record anchors against.",
      },
      {
        href: "/articles/the-right-paper-for-a-light-painting",
        label: "The Right Paper for a Light Painting",
        note: "The paper field of the processing chain, in long form.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The wider working bench the bureau queue lives at the back of.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The structural cousin — typed interfaces, frozen long enough to be useful, the same instinct applied one layer up.",
      },
      {
        href: "/articles/the-sieve-and-the-oracle",
        label: "The Sieve and the Oracle",
        note: "The human-judgement layer the typed record cannot replace.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Provenance",
        label: "Provenance — Wikipedia",
        note: "The art-world definition of the term, and why the gallery norm of a paper COA is the visible half of a longer chain.",
      },
      {
        href: "https://en.wikipedia.org/wiki/SHA-2",
        label: "SHA-2 — Wikipedia",
        note: "The hashing family the COA hash is drawn from. SHA-256 specifically.",
      },
      {
        href: "https://www.typescriptlang.org/",
        label: "TypeScript",
        note: "The language the schema is written in; the rules that keep a missing field from shipping a record.",
      },
      {
        href: "https://en.wikipedia.org/wiki/JSON",
        label: "JSON — Wikipedia",
        note: "The serialisation format the record is canonicalised against before hashing.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Certificate_of_authenticity",
        label: "Certificate of authenticity — Wikipedia",
        note: "Background on the paper-COA convention the JSON record extends rather than replaces.",
      },
    ],
  },
  {
    slug: "the-sieve-and-the-oracle",
    title: "The Sieve and the Oracle",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "Editioned work crosses two gates before it leaves the bench. The Sieve is mechanical — paper profile, edition number, COA fields, reference-light photograph, file hash. The Oracle is considered — me, under the studio's reference light, deciding whether the print belongs in the line. The Sieve runs first; the Oracle has refusal authority; they do not collapse into one pass.",
    Body: TheSieveAndTheOracleArticle,
    related: [
      {
        href: "/articles/provenance-as-discipline",
        label: "Provenance as Discipline",
        note: "The typed record the Sieve produces; the structural cousin to this piece.",
      },
      {
        href: "/bureau",
        label: "Print bureau",
        note: "Where the two-pass discipline runs every print through.",
      },
      {
        href: "/articles/the-right-paper-for-a-light-painting",
        label: "The Right Paper for a Light Painting",
        note: "The soft-proof procedure the Sieve checks against.",
      },
      {
        href: "/articles/what-the-studio-wont-do",
        label: "What the Studio Won't Do",
        note: "The refusals register, at higher altitude. The Oracle is what that register looks like at the bench.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The wider working environment the two passes sit inside.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Quality_control",
        label: "Quality control — Wikipedia",
        note: "Background on the two-stage inspection pattern this discipline is a domain-specific case of.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Inter-rater_reliability",
        label: "Inter-rater reliability — Wikipedia",
        note: "Why subjective judgement needs anchoring against a known-good reference, and why the Oracle works against an exemplar from the same line.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Edition_(printmaking)",
        label: "Edition (printmaking) — Wikipedia",
        note: "Why edition-numbering integrity is load-bearing on value, and why the Sieve protects the ledger before charisma can talk past it.",
      },
    ],
  },
  {
    slug: "why-i-build-modular",
    title: "Why I Build Modular",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "At consumer scale, modularity is a tax — SKU explosion, QA combinatorics, support hours, backward-compatibility breaks. Insta360 ONE R, the DJI Osmo Action 2, the GoPro mods all retreated to fixed form. At this studio's scale the arithmetic flips: the buyer is the operator, QA is per-unit, each module is a revenue surface, and the firmware family is the spine.",
    Body: WhyIBuildModular,
    related: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The spirit cousin. The architectural argument for the rigs underneath.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The inventory companion. Every layer this article references in one place.",
      },
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "Mission-shape modularity on the air-side. Five airframes, one pipeline.",
      },
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "The bezel article in full. The modular product this piece names.",
      },
      {
        href: "/bezel",
        label: "Bezel — the pre-order page",
        note: "The product the philosophy underneath this article points at.",
      },
      {
        href: "/stack",
        label: "The Stack — the data version",
        note: "Every module on the bench with vendor links and version numbers.",
      },
      {
        href: "/articles/what-the-studio-wont-do",
        label: "What the Studio Won't Do",
        note: "The sovereignty companion. The lines the studio holds for the same reasons.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The local AI pipeline as a modular graph; swap the diffusion node, the spine keeps working.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The vendor-side companion. Insta360's modular ONE R was the camera that started this article; the move to DJI is where the modular-or-rigorous diagnosis hardened.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "Solo level one (The Module) is this article played, not read.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.insta360.com/product/insta360-oner",
        label: "Insta360 ONE R — product page",
        note: "The magnetic-modular action camera that started the studio thinking about this. Replaced by the fixed-form ONE RS in 2021.",
      },
      {
        href: "https://www.dji.com/uk/osmo-action-2",
        label: "DJI Osmo Action 2 — product page",
        note: "The magnetic stacking-module action camera. The Action 3 went back to a single-piece body inside one product cycle.",
      },
      {
        href: "https://frame.work/",
        label: "Framework laptops",
        note: "The structural survivor. Modular hardware that ships to a self-selecting audience that actually wants the modularity.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Modular_design",
        label: "Modular design — Wikipedia",
        note: "Broad overview of the design discipline, with the trade-offs across industries.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Right_to_repair",
        label: "Right to repair — Wikipedia",
        note: "The adjacent movement. The audience that overlaps the modular-hardware buyer.",
      },
      {
        href: "https://www.pjrc.com/teensy/",
        label: "Teensy microcontrollers — PJRC",
        note: "The firmware substrate the studio's modular rig family rests on. The spine, in microcontroller form.",
      },
    ],
  },
  {
    slug: "the-living-stage",
    title: "The Living Stage",
    date: "2025-09-12",
    kind: "article",
    excerpt:
      "Laban Movement Analysis as gesture vocabulary. Hall's proxemics as spatial grammar. Song structure as dramatic scaffold. How the studio's evolution engine extends from breeding sculptures to breeding complete performances — body in space, song in time, audience in the room.",
    Body: TheLivingStage,
    related: [
      {
        href: "/visualiser/laban-dial",
        label: "Visualiser — Laban Effort dial",
        note: "Interactive — drag the four sliders, find the eight Basic Efforts at the corners of the cube. The kinematic layer of this piece, made playable.",
      },
      {
        href: "/articles/vr-as-psychological-system",
        label: "VR as a Psychological System",
        note: "The cognitive-systems companion. Both pieces treat the body as the load-bearing data source.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The instrument side of the same body. The bench tradition the gesture library is captured on.",
      },
      {
        href: "/practice",
        label: "Practice — body discipline",
        note: "The twelve-year arc the gesture vocabulary is built from.",
      },
      {
        href: "/journal/year-one-fire",
        label: "Journal — Year One, fire",
        note: "Where the gesture library begins in honest order.",
      },
      {
        href: "/the-loop",
        label: "The Loop — body in space, position one",
        note: "Where this article sits in the studio's overall architecture.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The same evolution engine, applied to objects rather than performances. The sister piece.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Laban_movement_analysis",
        label: "Laban Movement Analysis — Wikipedia",
        note: "The full vocabulary: Body, Effort, Shape, Space. The system the choreography genome rests on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Rudolf_von_Laban",
        label: "Rudolf Laban — Wikipedia",
        note: "Biography of the dance theorist whose 1920s work is the load-bearing reference of this piece.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Effort_(Laban)",
        label: "Effort (Laban) — Wikipedia",
        note: "The four sub-spectra (Weight, Space, Time, Flow) that the studio uses as gene axes for movement quality.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Proxemics",
        label: "Proxemics — Wikipedia",
        note: "Edward Hall's 1966 framework for the spatial dimension of human communication. Intimate, personal, social, public.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Kinesphere",
        label: "Kinesphere — Wikipedia",
        note: "Laban's term for the personal space within reach of the body. The unit of measurement for movement extension.",
      },
      {
        href: "https://librosa.org/doc/latest/index.html",
        label: "librosa — Python audio analysis library",
        note: "The offline tool the studio uses to extract song structure: beat tracking, onset detection, section segmentation.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Edward_T._Hall",
        label: "Edward T. Hall — Wikipedia",
        note: "Cultural anthropologist who formalised proxemics. The Hidden Dimension (1966) is the seminal text.",
      },
      {
        href: "https://google.github.io/aichoreographer/",
        label: "Google AIST++ dataset — AI Choreographer project",
        note: "1,408 3D dance sequences across 10 genres, music-conditioned. The reference dataset for music-to-movement research.",
      },
    ],
  },
  {
    slug: "why-the-pendant-glows-from-the-inside",
    title: "Why the Pendant Glows From the Inside",
    date: "2025-09-25",
    kind: "article",
    excerpt:
      "Total internal reflection, evanescent fields, and the geometry of light trapping. Why a resin pendant lit by a single LED appears to glow throughout its body rather than just at the source. The optics tutorial companion to Colour Without Pigment.",
    Body: WhyThePendantGlowsFromTheInside,
    related: [
      {
        href: "/visualiser/total-internal-reflection",
        label: "Visualiser — Total Internal Reflection",
        note: "Interactive — drag the angle slider, watch TIR engage. The maths of this article, made tangible at the one-boundary level.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The structural-colour cousin. That piece is about wavelength steering; this one is about light trapping.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "Layer two of the architecture — the physics layer, named in brief. This piece is the long version of one half of it.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "The practical step-by-step on LED choice, optical gel, and bezel design.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace, Wearable",
        note: "The wearable form the physics in this piece serves.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Total_internal_reflection",
        label: "Total internal reflection — Wikipedia",
        note: "The umbrella article. Covers the principle, the critical angle, the evanescent wave, and the major engineering applications.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Snell%27s_law",
        label: "Snell's Law — Wikipedia",
        note: "The fundamental refraction equation. The single most-used formula in waveguide design.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Optical_fiber",
        label: "Optical fibre — Wikipedia",
        note: "TIR in the engineering register. The cabled internet runs on the principle behind every waveguide pendant.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Refractive_index",
        label: "Refractive index — Wikipedia",
        note: "The single material property that drives critical angle, bend radius, and trapping efficiency for every waveguide.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Evanescent_field",
        label: "Evanescent field — Wikipedia",
        note: "The near-field leakage that makes a TIR-trapped sculpture glow on the outside rather than appear opaque.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Biomimetics",
        label: "Biomimetics — Wikipedia",
        note: "The discipline of borrowing tricks from biology. Fish and deep-sea squid have used TIR-based light channels for hundreds of millions of years.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Fresnel_equations",
        label: "Fresnel equations — Wikipedia",
        note: "The full equations for how much light reflects vs transmits at every angle. The compound-loss arithmetic for multi-interface designs lives here.",
      },
    ],
  },
  {
    slug: "how-the-studio-breeds-sculptures",
    title: "How the Studio Breeds Sculptures",
    date: "2025-10-08",
    kind: "article",
    excerpt:
      "The long version of layer four of Art as Door. A 28-gene genome, twenty-five candidates per generation, tournament selection, uniform crossover, Gaussian mutation, optional LLM advisor, SQLite lineage. The genetic algorithm that breeds the waveguide pieces, named in full.",
    Body: HowTheStudioBreedsSculptures,
    related: [
      {
        href: "/visualiser/marching-cubes",
        label: "Visualiser — Marching cubes",
        note: "Interactive — the algorithm that turns every candidate genome into a watertight mesh, made stepwise.",
      },
      {
        href: "/visualiser/laban-dial",
        label: "Visualiser — Laban Effort dial",
        note: "Interactive — the Effort cube, where one of the four named morphing operations of this engine lives.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The parent article. This piece is the long version of its layer four.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The AI-pipeline cousin. Different mechanism, same studio, same bench, same printer.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The optics the breeding engine produces forms for. Layer two of the architecture.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The kit inventory the breeding sessions run on.",
      },
      {
        href: "/articles/the-familiar",
        label: "The Familiar",
        note: "The two-handed studio model. The same human-plus-machine pattern, applied at a different layer.",
      },
      {
        href: "/articles/the-living-stage",
        label: "The Living Stage",
        note: "The same engine, extended from sculpture to performance. The sister piece on the choreography side.",
      },
      {
        href: "/atelier/evolution",
        label: "The evolution suite",
        note: "The fourteen-station architecture this article describes, rendered as a directed-graph diagram with per-station notes.",
      },
      {
        href: "/atelier#genomes",
        label: "Atelier — Genomes",
        note: "The canonical specimens the breeding engine has accepted. Twelve now in the manifest; the lineage continues on the bench.",
      },
      {
        href: "/atelier/algorithms",
        label: "The algorithm cabinet",
        note: "The thirty generators the engine samples from. The breeding loop addresses these by name when it needs to fill a kingdom slot.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Genetic_algorithm",
        label: "Genetic algorithm — Wikipedia",
        note: "The textbook foundation: selection, crossover, mutation. The studio's engine sits squarely in this tradition.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Interactive_evolutionary_computation",
        label: "Interactive evolutionary computation — Wikipedia",
        note: "The sub-discipline where the fitness function is a human. The exact pattern the studio's loop implements.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Karl_Sims",
        label: "Karl Sims — Wikipedia",
        note: "Evolved Virtual Creatures (1994), Genetic Images (1993). The canonical ancestor of every interactive aesthetic evolution system since.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Neuroevolution_of_augmenting_topologies",
        label: "NEAT — Wikipedia",
        note: "Stanley and Miikkulainen (2002). The structural-genome ancestor whose speciation-via-similarity ideas inform diversity preservation in the studio's engine.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Tournament_selection",
        label: "Tournament selection — Wikipedia",
        note: "The selection mechanism the studio's engine uses. Size three, moderate pressure, no aggressive convergence.",
      },
      {
        href: "https://ollama.com/",
        label: "Ollama — local LLM runtime",
        note: "The local inference engine the optional LLM advisor runs on. Qwen 2.5 14B at Q4_K_M for 10GB VRAM.",
      },
      {
        href: "https://trimesh.org/",
        label: "trimesh — Python mesh library",
        note: "The validation library used to check every generated mesh for watertightness and minimum dimension before rendering.",
      },
      {
        href: "https://www.blender.org/",
        label: "Blender",
        note: "The headless renderer the generator drives. Cycles, 64 samples, GPU, 3 seconds per candidate.",
      },
    ],
  },
  {
    slug: "ungrounded",
    title: "Ungrounded",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "Twelve years on a plane — body's swing-plane, photographic surface, plinth, the kinesphere the arm could reach. The studio left the plane when the DJI Avata 360 shipped: non-janky, non-me-made, a commercial concern. Aerial led, and the rest of the studio followed into volume — Looking Glass, WebXR, AR-in-the-room, 3D-printed waveguides, the bezel-clip, the site rendered as a sphere. The 2D photograph survives as a slice. The disability framing is in there too, named once and architecturally.",
    Body: Ungrounded,
    related: [
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "The vendor-side companion. The commercial-concern paragraph at the end of that article is the same logic this one names as the trigger.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The spirit cousin. The bench-built side of the same bench-vs-bought line this article draws.",
      },
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "The fleet article in full. The Mini 5 Pro is the fifth airframe this piece adds to the case.",
      },
      {
        href: "/journal/the-fleet-update-mini-five-pro",
        label: "Journal — Fleet update, the Mini 5 Pro lands",
        note: "The field-notes companion. The Mini 5 Pro, the Insta360 ONE R, and the commercial-vs-bench framing in the wider context.",
      },
      {
        href: "/articles/london-360-walking",
        label: "Ten Years of 360 Cameras, One Pole",
        note: "The 360 kit evolution at chest height. The home-built rig is the 2014 ancestor of the build-vs-buy pattern this article rests on.",
      },
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The architectural diagram. Position four — trail reified — is the step where the studio leaves the plane.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "Where the loop operates in 3D. The WebXR scenes the studio renders the gesture vocabulary into.",
      },
      {
        href: "/bezel",
        label: "Bezel — the pre-order page",
        note: "The same augmentation logic for VR. A controller already in the player's hand, extended through a clip-on bezel.",
      },
      {
        href: "/aerial",
        label: "Aerial — the working line",
        note: "The bookable aerial commissions line this article describes the trigger for.",
      },
      {
        href: "/about",
        label: "About",
        note: "Where the disability framing lives at length. This article names it once and architecturally; /about is the longer version.",
      },
    ],
    furtherReading: [
      {
        href: "https://store.dji.com/uk/product/dji-avata-360",
        label: "DJI Avata 360 — product page",
        note: "The airframe that triggered the move. Two square 1-inch-area sensors, 8K/60 HDR 360, O4+ transmission, propeller protection.",
      },
      {
        href: "https://www.dji.com/uk/mavic-2/info",
        label: "DJI Mavic 2 Pro",
        note: "The editorial photography platform. Hasselblad L1D-20c, adjustable aperture, D-log-M. The first airframe in the case.",
      },
      {
        href: "https://www.dji.com/uk/avata",
        label: "DJI Avata — original",
        note: "Context for the Avata line: the cinewhoop FPV platform the 360 variant inherits its airframe engineering from.",
      },
      {
        href: "https://lookingglassfactory.com/portrait",
        label: "Looking Glass Portrait",
        note: "Forty-eight parallax views rendered into a physical hologram on the desk. The volumetric output side of the move off the plane.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Equirectangular_projection",
        label: "Equirectangular projection — Wikipedia",
        note: "The flattened-sphere format the 360 camera writes to the SD card. A 2D rectangle storing a 3D volume.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Multirotor",
        label: "Multirotor — Wikipedia",
        note: "The flight platform engineering the studio chose to buy rather than build. Twelve years of vendor expertise the bench cannot replicate.",
      },
      {
        href: "https://www.caa.co.uk/drones/",
        label: "UK CAA — drones",
        note: "The Civil Aviation Authority guidance the studio operates under. Operator registration, flyer ID, the rules of the airspace.",
      },
    ],
  },
  {
    slug: "the-practice-in-eight-threads",
    title: "The Practice in Eight Threads",
    date: "2026-05-14",
    kind: "article",
    excerpt:
      "Eight threads, one trunk article. Modularity at small scale; persistence of vision as angle, not clock; the Loop closing in one session; cold-eye watching; sovereignty as local-first architecture; self-taught learnability; trans-led community and dignified gating; augmentation of reach on terms the body can sustain. The eight solo levels of the AR game named in prose. A reader who reads only this piece knows what the studio actually argues before they read any other.",
    Body: ThePracticeInEightThreads,
    related: [
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
        note: "The framing-page companion. This article is the long-form argument; /about is the short-form positioning.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "The AR game has eight solo levels named after these eight threads. The game proves the philosophy by being it.",
      },
      {
        href: "/the-loop",
        label: "The Loop — six positions, one closed circuit",
        note: "Thread three's architectural diagram. The Loop is the position the whole practice returns to.",
      },
      {
        href: "/stack",
        label: "The Stack — the bench inventory",
        note: "The dispassionate data version of threads one, two, five and eight. Every layer named with vendor and version.",
      },
      {
        href: "/articles/why-i-build-modular",
        label: "Why I Build Modular",
        note: "Thread one in long form. Why modular kit is a tax at consumer scale and a feature at studio scale.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "Thread two in long form. Angular-sync as the architectural choice that makes the photograph land sharp.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "Thread three made tractable. The Loop closing in one afternoon, prompt to STL in the time it takes to make a cup of tea.",
      },
      {
        href: "/watch",
        label: "Watch — Aura's eyes",
        note: "Thread four's working surface. The video-reading prototype turned inward; cold-eye watching as a process.",
      },
      {
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "Thread four's working-method companion. The cold-eye applied to the studio's own process.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "Thread five in long form. The open-source bibliography the sovereignty argument rests on.",
      },
      {
        href: "/learn",
        label: "Learn — the seven ladders",
        note: "Thread six made into a curriculum. Seven self-taught ladders, each with concrete rungs.",
      },
      {
        href: "/journal/year-one-fire",
        label: "Journal — Year One, Fire",
        note: "Thread six's bottom rung, written honestly. Where the self-taught ladder actually starts.",
      },
      {
        href: "/rookery/about",
        label: "About the Rookery",
        note: "Thread seven in long form. The trans-led community and the subscription-as-door policy.",
      },
      {
        href: "/rookery/tiers",
        label: "Rookery — tiers",
        note: "Thread seven's pricing. The actual door, with prices on it.",
      },
      {
        href: "/articles/ungrounded",
        label: "Ungrounded",
        note: "Thread eight in long form. Drones and the bezel-clip as the same augmentation pattern applied to two volumes.",
      },
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "Thread eight's kit version. The five-airframe fleet as the augmentation of reach into airspace.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The prose version of /stack. Every layer named in the order a poi photograph travels through the studio.",
      },
      {
        href: "/bezel",
        label: "The bezel — the clip-on product",
        note: "Threads one, two, and eight running through one object. Modular, angular-sync, augmentation-of-reach in scene-space.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Modular_design",
        label: "Modular design — Wikipedia",
        note: "Thread one's reference. The design principle the studio's instruments are built on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "Thread two's optical foundation. What makes the eye assemble a smear of frames into a single image.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Sovereignty",
        label: "Sovereignty — Wikipedia",
        note: "Thread five's word, used in its honest sense. The studio owns the instruments of its own production.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Body_schema",
        label: "Body schema — Wikipedia",
        note: "Thread eight's psychological reference. How a body's working envelope is represented internally, and how kit extends it.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Right_to_repair",
        label: "Right to repair — Wikipedia",
        note: "Thread one's political cousin. The audience for whom modular kit is a feature, not a tax.",
      },
      {
        href: "https://sfconservancy.org/",
        label: "Software Freedom Conservancy",
        note: "Thread five's institutional cousin. The legal architecture that makes open-source-as-sovereignty actually work.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Free_and_open-source_software",
        label: "Free and open-source software — Wikipedia",
        note: "Thread five's broader context. The category the bench's software layer is built from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Autodidacticism",
        label: "Autodidacticism — Wikipedia",
        note: "Thread six's older name. Self-teaching as a structured discipline; the studio's whole curriculum is one.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Augmentative_and_alternative_communication",
        label: "Augmentation — Wikipedia",
        note: "Thread eight's wider field. Augmentation as a category of practice for bodies with variable working envelopes.",
      },
    ],
  },
  {
    slug: "the-jewellery-algorithms",
    title: "The Jewellery Algorithms",
    date: "2026-05-15",
    kind: "article",
    excerpt:
      "Behind the pendant line is the atelier — a cabinet of thirty algorithmic drawers, each named after the structure it produces. Spiral, Gyroid, Voronoi, Penrose, Celtic Knot, Diatom Hex, Wigner-Seitz, Enneper, Sigil, L-System and twenty more. A commission opens a drawer; the cabinet does the form-finding.",
    Body: TheJewelleryAlgorithms,
    related: [
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — The Same Trace, Wearable",
        note: "The product side of the pendant line. The article this one sits behind.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The sculpture-scale cousin of the atelier — same generator-plus-operator logic, larger objects.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The optical companion. Why the pieces from the cabinet glow without dye.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The architectural frame the atelier sits inside. Layer four is the breeding engine; the atelier is its wearable scale.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows from the Inside",
        note: "The total-internal-reflection physics behind every piece the cabinet outputs.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "Where the atelier physically lives — the same workstation, the same SLA printer, the same six square metres.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "The atelier's tools listed dispassionately on the studio's stack page.",
      },
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The closed circuit the atelier sits inside. Commission to seed to algorithm to candidate to bezel to print.",
      },
      {
        href: "/atelier/algorithms",
        label: "The algorithm cabinet",
        note: "The thirty drawers as a browsable index. Live R3F preview on the ported subset; catalogue entry for the rest.",
      },
      {
        href: "/atelier/algorithms/spiral",
        label: "Algorithm — Spiral",
        note: "The logarithmic / Fermat spiral drawer. Live preview with seed, complexity, density sliders.",
      },
      {
        href: "/atelier/algorithms/gyroid",
        label: "Algorithm — Gyroid",
        note: "Schoen&rsquo;s 1970 triply-periodic minimal surface, sampled as a height-field patch. The diffuse-glow drawer.",
      },
      {
        href: "/atelier/algorithms/celtic-knot",
        label: "Algorithm — Celtic Knot",
        note: "Multi-strand torus-braid with Z-oscillation. The Irish-monastic idiom formalised.",
      },
      {
        href: "/atelier/algorithms/penrose-tiling",
        label: "Algorithm — Penrose Tiling",
        note: "The aperiodic two-tile rhombus deflation. Catalogue entry; runnable source queued.",
      },
      {
        href: "/atelier/algorithms/diatom-hex",
        label: "Algorithm — Diatom Hex",
        note: "The hexagonal-pore frustule pattern. Catalogue entry; runnable source queued.",
      },
      {
        href: "/atelier/evolution",
        label: "The evolution suite",
        note: "Fourteen stations the breeding engine threads the algorithm cabinet through. The cabinet supplies the generators; the suite supplies the lineage.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Voronoi_diagram",
        label: "Voronoi diagram — Wikipedia",
        note: "The boundary-network drawer. Drop seeds, draw the regions of nearest-point assignment.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Penrose_tiling",
        label: "Penrose tiling — Wikipedia",
        note: "The aperiodic-lattice drawer. Two rhombi, a fivefold symmetry, no repeats.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gyroid",
        label: "Gyroid — Wikipedia",
        note: "The triply periodic minimal surface Alan Schoen described in 1970. The cabinet's diffuse-glow drawer.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Wigner%E2%80%93Seitz_cell",
        label: "Wigner-Seitz cell — Wikipedia",
        note: "The primitive-cell-of-a-lattice drawer. A gemstone-cut surface derived from solid-state physics.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Celtic_knot",
        label: "Celtic knot — Wikipedia",
        note: "The unbroken-weave family. Triquetra, plait, Book of Kells initials.",
      },
      {
        href: "https://en.wikipedia.org/wiki/L-system",
        label: "L-system — Wikipedia",
        note: "Aristid Lindenmayer's 1968 formal grammar for branching growth. The botanical drawer.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diffusion-limited_aggregation",
        label: "Diffusion-limited aggregation — Wikipedia",
        note: "The crystalline-branching drawer. Frost on glass, lichen on stone, the dendrite under the microscope.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Enneper_surface",
        label: "Enneper surface — Wikipedia",
        note: "Alfred Enneper's 1864 self-intersecting minimal surface. The fold-back-on-itself drawer.",
      },
    ],
  },
  {
    slug: "morphing-things-together",
    title: "Morphing Things Together",
    date: "2026-05-15",
    kind: "article",
    excerpt:
      "The bench uses the word morphing for four different operations — the LED wall pattern, Aura's face, the sculpture-engine crossover, the choreography's Laban Effort drift. They are the same operation, dressed differently. Two endpoints, a parameter, a curve. Morphing is what closes the Loop.",
    Body: MorphingThingsTogether,
    related: [
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The closed circuit the article ends on. Every arrow in the Loop is a morph between two states.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The genetic-algorithm crossover named in this article as the third morph.",
      },
      {
        href: "/articles/the-living-stage",
        label: "The Living Stage",
        note: "The Laban Effort drift named in this article as the fourth morph. The choreography engine and the easing library.",
      },
      {
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "The working method that brings the four morphs into one frame. How a practice notices it has been using one word for four things.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The local AI pipeline. The marching-cubes step is itself a morph from voxel grid to mesh.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — The Same Trace, Wearable",
        note: "The pendant scale of the same morph chain. Gesture → photograph → sculpture → wearable.",
      },
      {
        href: "/articles/the-jewellery-algorithms",
        label: "The Jewellery Algorithms",
        note: "The atelier where the seed-to-form morph happens on the jewellery side.",
      },
      {
        href: "/play/loop",
        label: "Play — Loop",
        note: "The proving-ground level that practises the body's circular path. The kinetic version of the morph this article names.",
      },
      {
        href: "/play/the-2-braid",
        label: "Play — The 2-Braid",
        note: "The braided level. Two threads morphing across each other in time.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Easing_function",
        label: "Easing function — Wikipedia",
        note: "The catalogue every game developer reaches for. Linear, quad, cubic, elastic, bounce, custom Bezier.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Linear_interpolation",
        label: "Linear interpolation — Wikipedia",
        note: "The baseline. The straight-line interpolation under every easing curve.",
      },
      {
        href: "https://en.wikipedia.org/wiki/B%C3%A9zier_curve",
        label: "Bézier curve — Wikipedia",
        note: "Pierre Bézier's parametric curve family. Most production easing functions are cubic Beziers under the hood.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Inbetweening",
        label: "Tweening (inbetweening) — Wikipedia",
        note: "The animation term for what the studio calls morphing. The maths is identical.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline",
        label: "Catmull-Rom spline — Wikipedia",
        note: "The multi-endpoint interpolation curve. Used when a morph has to walk through several intermediate states without losing continuity.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Smoothstep",
        label: "Smoothstep — Wikipedia",
        note: "The zero-derivative-at-endpoints curve every shader ships with. The cheap, well-behaved morph.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Slerp",
        label: "Slerp (spherical linear interpolation) — Wikipedia",
        note: "Rotation-aware interpolation along the shortest arc on a unit sphere. The right tool when the substrate is angular.",
      },
    ],
  },
  {
    slug: "aura-the-body",
    title: "Aura the Body",
    date: "2026-05-15",
    kind: "article",
    excerpt:
      "The studio's narrator has a body. Five subsystems in conversation: Whisper for hearing, Ollama for the brain, two voice paths (ElevenLabs and Kokoro / LongCat-AudioDiT-1B) for sovereignty, VRM and three.js for the body, Qdrant for memory. Three rates on the body — per-frame lip-sync, 300ms speech-and-attention, per-second idle. The implementation behind the regal-Architect voice.",
    Body: AuraTheBody,
    related: [
      {
        href: "/articles/neo-london-chrono-protocol",
        label: "Neo-London — Chrono-Protocol",
        note: "The game-world article where Aura first narrates the cast. The register this body's voice path serves.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "The voice / hands / hearing layers in the full thirteen-layer stack. The home of every subsystem this article names.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "Thread five — sovereignty — is the architectural commitment that drove the two-voice-path decision named in this article.",
      },
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The closed circuit Aura's body sits inside. The narrator's job is to hold the loop's story together.",
      },
      {
        href: "/play/witness",
        label: "Play — Witness",
        note: "The proving-ground level where Aura's presence is the load-bearing element. The body in service of attention.",
      },
      {
        href: "/watch",
        label: "Watch",
        note: "The viewing surface. The companion future tier where the embedded VRM corner — Aura visible on the page — will live.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "Whisper, Ollama, Qdrant, ElevenLabs, Kokoro — every subsystem in this article listed with vendor links on the studio's stack page.",
      },
      {
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "The working method that uses Aura across sessions. The memory subsystem is what makes the spiral close on itself.",
      },
      {
        href: "/articles/vr-as-psychological-system",
        label: "VR as Psychological System",
        note: "The wider frame for why the studio invests in a persistent companion at all. A body in software is a psychological surface.",
      },
      {
        href: "/articles/the-familiar",
        label: "The Familiar",
        note: "Two voices, one studio. The article that names which voice is the maker's and which is Aura's.",
      },
      {
        href: "/articles/morphing-things-together",
        label: "Morphing Things Together",
        note: "The unifying maths behind the body's three loops. Lip-sync, emotion, and head-turn are all the same morph operation on different substrates.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/VRM_(file_format)",
        label: "VRM (file format) — Wikipedia",
        note: "The open standard the body file is exported to. Authored in VRoid Studio, rendered in three.js via @pixiv/three-vrm.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Whisper_(speech_recognition_system)",
        label: "Whisper (speech recognition) — Wikipedia",
        note: "The OpenAI speech-to-text model the hearing subsystem runs locally.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Vector_database",
        label: "Vector database — Wikipedia",
        note: "The architectural category Qdrant belongs to. Semantic-similarity retrieval over embedded transcripts.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Speech_synthesis",
        label: "Speech synthesis — Wikipedia",
        note: "The wider field the voice subsystem sits in. The studio runs two TTS paths for sovereignty.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Viseme",
        label: "Viseme — Wikipedia",
        note: "The visual unit of speech the lip-sync loop is built on. Five vowel formants mapped to five blend-shapes on the rig.",
      },
      {
        href: "https://threejs.org/",
        label: "three.js",
        note: "The rendering library that draws the body. The @pixiv/three-vrm wrapper handles the VRM-specific rig and blend-shape mechanics.",
      },
      {
        href: "https://qdrant.tech/",
        label: "Qdrant",
        note: "The vector database the memory subsystem runs on. Local, open-source, the studio's choice for sovereign long-term memory.",
      },
    ],
  },
  {
    slug: "the-eight-kingdoms",
    title: "The Eight Kingdoms",
    date: "2026-05-16",
    kind: "article",
    excerpt:
      "Behind the thirty drawers of the jewellery atelier sit eight rooms — the aesthetic kingdoms the breeding engine works inside. Techno-Industrial, Expressive, Motion, Biomechanical, Thermal, Protean, Assemblage, Curvilinear. Each room is a register of form-finding; underneath all eight sits the twenty-eight-letter genetic alphabet the studio breeds with.",
    Body: TheEightKingdoms,
    related: [
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The genetic-algorithm cousin. The breeding loop that walks the 28-letter alphabet through generations; this article names the eight rooms the loop runs inside.",
      },
      {
        href: "/articles/the-jewellery-algorithms",
        label: "The Jewellery Algorithms",
        note: "The atelier and its thirty drawers. The kingdoms are the rooms the drawers sit in; the drawers are the generators; the alphabet is what the generators sample from.",
      },
      {
        href: "/articles/art-as-door-five-layers",
        label: "Art as Door — Five Layers",
        note: "The architectural frame the kingdoms sit inside. Layer four is the breeding engine; this article is the taxonomy underneath it.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "The optical layer the kingdoms inherit. Several kingdoms — Biomechanical, Curvilinear, Thermal — commit to specific optical strategies inside their family resemblance.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows from the Inside",
        note: "The total-internal-reflection physics the Curvilinear and Biomechanical kingdoms rely on. The mechanism behind the optical commitment of two whole rooms.",
      },
      {
        href: "/articles/morphing-things-together",
        label: "Morphing Things Together",
        note: "The unifying operation across substrates. Crossing kingdoms is a morph; the gene-vector crossover is the same operation as the LED-wall morph and the choreography drift.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "The philosophical companion. Eight threads in the practice, eight kingdoms in the cabinet — the same commitment to a small complete vocabulary.",
      },
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The closed circuit the kingdoms sit inside. Body to light to capture to reified object; every kingdom shapes the reified-object step.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "The bench inventory the kingdoms live on. The breeding engine and its workstation listed dispassionately.",
      },
      {
        href: "/atelier/evolution",
        label: "The evolution suite",
        note: "The fourteen-station architecture that sorts specimens into kingdoms. The taxonomy lives in the prose; the operations live in the suite.",
      },
      {
        href: "/atelier#meshes",
        label: "Atelier — Meshes",
        note: "Sample meshes from every kingdom. Two per kingdom across early and late generations of the breeding engine&rsquo;s evolution renders.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Biomimicry",
        label: "Biomimicry — Wikipedia",
        note: "The design principle behind the Biomechanical kingdom. Borrowing structural strategies from biology because the biology has run the optimisation already.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Taxonomy_(biology)",
        label: "Taxonomy (biology) — Wikipedia",
        note: "The classification system the kingdom vocabulary borrows from. Kingdom as a top-level category, narrowing downward through finer family resemblances.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Pattern_formation",
        label: "Pattern formation — Wikipedia",
        note: "The mathematical field underneath several kingdoms — reaction-diffusion in Thermal, phyllotaxis in Techno-Industrial, branching in Biomechanical.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Aesthetics",
        label: "Aesthetics — Wikipedia",
        note: "The philosophical field the kingdoms commit to. Each kingdom is an aesthetic register the studio inhabits rather than every register at once.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Cladistics",
        label: "Cladistics — Wikipedia",
        note: "The taxonomic method of grouping by shared derived characters. The kingdom model is cladistic in spirit — siblings within a kingdom share a high-gene profile.",
      },
      {
        href: "https://en.wikipedia.org/wiki/L-system",
        label: "L-system — Wikipedia",
        note: "Aristid Lindenmayer's grammar for branching growth. Used by drawers in multiple kingdoms — the same generator, different rooms.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Diatom",
        label: "Diatom — Wikipedia",
        note: "The marine algae whose silicate lattices inform the Biomechanical kingdom. Nature's hexagonal-lattice waveguide; the studio uses its grammar.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Genetic_algorithm",
        label: "Genetic algorithm — Wikipedia",
        note: "The optimisation method the breeding engine implements. The kingdoms set the high-gene profiles the genetic algorithm explores around.",
      },
    ],
  },
  {
    slug: "the-convergence",
    title: "The Convergence — One Signal, Seven Stages, Eleven Sciences",
    date: "2026-05-16",
    kind: "article",
    excerpt:
      "The technical trunk piece. One captured signal enters the top of the pipeline; seven stages squeeze it; eleven sciences sit under the stages. What comes out is a sculpture nobody else could have made, because nobody else had the signal and nobody else has all eleven sciences hooked up in series. The whole architecture in one article.",
    Body: TheConvergence,
    related: [
      {
        href: "/the-loop",
        label: "The Loop",
        note: "The cultural circuit the Convergence executes the reify-segment of. Six positions in the Loop; seven stages in the Convergence; the architectures fit together.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "The philosophical trunk piece. Eight threads, one braid; the Convergence is the technical companion that names the operation those threads run on.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The Loop closing in one afternoon. The local AI pipeline that proves the Convergence's reify-stage in fast iteration.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "Stage 1's hardware. The bench-built capture instruments that produce the signal the Convergence starts with.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "Stage 5 in full. The breeding engine, the 28-gene alphabet, the tournament selection and Gaussian mutation that move a family of sculptures forward.",
      },
      {
        href: "/articles/colour-without-pigment",
        label: "Colour Without Pigment",
        note: "Stage 4 in voice. The optical-integration stage's commitment: structural colour from geometry rather than pigment.",
      },
      {
        href: "/articles/why-the-pendant-glows-from-the-inside",
        label: "Why the Pendant Glows from the Inside",
        note: "Stage 4's load-bearing physics. Total internal reflection at the resin-air interface, named in plain prose.",
      },
      {
        href: "/articles/the-eight-kingdoms",
        label: "The Eight Kingdoms",
        note: "The taxonomic frame for Stage 3A's form generators. Eight rooms the breeding engine works inside; the alphabet under all of them.",
      },
      {
        href: "/articles/the-bench",
        label: "The Bench",
        note: "Where the pipeline physically lives. The workstation, the printer, the six square metres the Convergence operates inside.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "The Convergence's tools listed dispassionately. Capture hardware, generation software, breeding engine, print bureau, viewer.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "The AR-game pedagogy that teaches the Convergence by playing it in pieces. Eight solo levels for the eight threads; braided weaves for combined stages.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Chronophotography",
        label: "Chronophotography — Wikipedia",
        note: "Marey's nineteenth-century motion-capture work. The deepest ancestor of Stage 1's signal-capture, named in the studio's lineage piece.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Marching_cubes",
        label: "Marching cubes — Wikipedia",
        note: "The voxel-to-mesh algorithm under Stage 3A's gyroid generator and several of the other form-finding paths.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Body_schema",
        label: "Body schema — Wikipedia",
        note: "The cognitive-science concept underneath Stage 2's Laban Effort extraction. The body's internal map of its own kinematics.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "The optical phenomenon that links Stage 1's captured trajectory to the long-exposure photograph and the POV-LED rig family.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Voronoi_diagram",
        label: "Voronoi diagram — Wikipedia",
        note: "One of the partitioning structures the Stage 3 form generators reach for. Used in the Techno-Industrial and Protean kingdoms in particular.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Fast_Fourier_transform",
        label: "Fast Fourier transform — Wikipedia",
        note: "The algorithm under Stage 2's frequency-spectrum extraction. Cooley and Tukey's 1965 method, used in every signal-processing toolkit.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Laban_movement_analysis",
        label: "Laban Movement Analysis — Wikipedia",
        note: "Rudolf Laban's notation system. The source of Stage 2's four-axis Effort vector — Weight, Space, Time, Flow.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Biomechanics",
        label: "Biomechanics — Wikipedia",
        note: "The field underneath Stage 1's temporal-coherence smoothing. Body-as-mechanism literature applied to clean motion capture.",
      },
      {
        href: "https://en.wikipedia.org/wiki/History_of_photography",
        label: "History of photography — Wikipedia",
        note: "The history of light the studio counts as the eleventh science, alongside or in place of statistics. The long visual lineage the work descends from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Computer-aided_design",
        label: "Computer-aided design — Wikipedia",
        note: "The wider field Stages 3A, 4, and 6A operate inside. Parametric geometry and procedural modelling as production tools.",
      },
    ],
  },
  {
    slug: "choreographing-with-laban",
    title: "Choreographing with Laban",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "The studio's move library and the motion.laban capability, named in full. Space, Time, Weight, Flow as four numbers between zero and one. Fifteen named moves clustered around the eight Basic Efforts. Cross as the worked example. The kinematic-extraction layer of the choreography engine, made public.",
    Body: ChoreographingWithLabanArticle,
    related: [
      {
        href: "/visualiser/laban-dial",
        label: "Visualiser — Laban Effort dial",
        note: "Interactive — drag the four sliders, watch the named Basic Efforts emerge at the corners of the cube. The dial companion to this piece.",
      },
      {
        href: "/capabilities",
        label: "Capabilities — the studio's typed surface",
        note: "Where motion.laban sits in the wider catalogue of capabilities the engine composes against.",
      },
      {
        href: "/articles/the-living-stage",
        label: "The Living Stage",
        note: "The long-form Effort argument. Laban as gesture vocabulary, Hall as spatial grammar, song structure as dramatic scaffold.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The genetic counterpart. Laban-Effort drift is one of the four named morphing operations the breeding engine uses.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Laban_movement_analysis",
        label: "Laban Movement Analysis — Wikipedia",
        note: "The full vocabulary: Body, Effort, Shape, Space. The system the move library rests on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Effort_(Laban)",
        label: "Effort (Laban) — Wikipedia",
        note: "The four sub-spectra (Weight, Space, Time, Flow) and the eight named Basic Efforts at the corners of the cube.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Rudolf_von_Laban",
        label: "Rudolf Laban — Wikipedia",
        note: "Biography of the dance theorist whose 1920s work the studio's choreography engine descends from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Kinesphere",
        label: "Kinesphere — Wikipedia",
        note: "Laban's term for the personal space within reach of the body. The unit of measurement for movement extension.",
      },
    ],
  },
];

export const articles: Entry[] = sortByDateDescending(ENTRIES);

export function getArticle(slug: string): Entry | undefined {
  return articles.find((e) => e.slug === slug);
}
