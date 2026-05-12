import FirstLight from "components/journal/entries/first-light";
import OnTheApparatus from "components/journal/entries/on-the-apparatus";
import OnTheBenchYearTen from "components/journal/entries/on-the-bench-year-ten";
import TheNightTheCameraWasRight from "components/journal/entries/the-night-the-camera-was-right";
import TheQuestionTheCameraAnswered from "components/journal/entries/the-question-the-camera-answered";
import YearOneFire from "components/journal/entries/year-one-fire";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  {
    slug: "first-light",
    title: "First Light",
    date: "2026-04-22",
    kind: "journal",
    excerpt:
      "First flight of the LED-modified airframes. The platform is flying; the technique is not consistent yet.",
    Body: FirstLight,
    related: [
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The spec sheet for the kit in the air.",
      },
      {
        href: "/aerial",
        label: "Aerial — the fleet, the FPV pipeline",
        note: "The full drone fleet and how it is flown.",
      },
      {
        href: "/practice",
        label: "Practice — Stage V, drones modified",
        note: "Where this work sits in the studio's history.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "The optical effect every POV display depends on. Start here for the underlying principle.",
      },
      {
        href: "https://en.wikipedia.org/wiki/DJI_Mavic",
        label: "DJI Mavic — Wikipedia",
        note: "Background on the Mavic 2 Pro airframe and the Hasselblad L1D-20c imaging system.",
      },
      {
        href: "https://en.wikipedia.org/wiki/First-person_view_(radio_control)",
        label: "First-person view (RC) — Wikipedia",
        note: "Overview of the FPV control discipline the studio's flights run on.",
      },
    ],
  },
  {
    slug: "on-the-apparatus",
    title: "On the Apparatus",
    date: "2026-03-09",
    kind: "journal",
    excerpt:
      "A working set, not a portfolio. The kit currently on the bench, in the workshop, and in the air.",
    Body: OnTheApparatus,
    related: [
      {
        href: "/journal/first-light",
        label: "First Light",
        note: "The kit, in action, on its first LED-modified flight.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "Why the POV rigs are custom-built, not bought.",
      },
      {
        href: "/practice",
        label: "Practice — the full history",
        note: "How the kit accumulated, stage by stage.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.pjrc.com/teensy/td_3_1.html",
        label: "Teensy 3.1 specifications — PJRC",
        note: "Vendor reference for the microcontroller at the heart of the POV rigs.",
      },
      {
        href: "https://www.ti.com/lit/ds/symlink/tlc5927.pdf",
        label: "TLC5927 datasheet — Texas Instruments (PDF)",
        note: "The full technical reference for the 16-channel constant-current LED driver used in the rigs.",
      },
      {
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
        label: "NeoPixel Überguide — Adafruit Learn",
        note: "The canonical tutorial for working with addressable LEDs. Start here if you have never wired up a strip.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Stereolithography",
        label: "Stereolithography (SLA) — Wikipedia",
        note: "The 3D-printing process used for the studio's resin object production.",
      },
      {
        href: "https://www.hahnemuehle.com/en/digital-fineart.html",
        label: "Hahnemühle Digital FineArt papers",
        note: "Manufacturer reference for the cotton-rag and etching papers the studio prints on.",
      },
    ],
  },
  {
    slug: "the-question-the-camera-answered",
    title: "The Question the Camera Answered",
    date: "2025-11-14",
    kind: "journal",
    excerpt:
      "Twelve years in. On how a long exposure made the gesture visible to everyone — and what the studio became next.",
    Body: TheQuestionTheCameraAnswered,
    related: [
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
      },
      {
        href: "/journal/the-night-the-camera-was-right",
        label: "The Night the Camera Was Right",
        note: "The hinge night this piece reflects on.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The technical companion to this piece.",
      },
      {
        href: "/photographs",
        label: "Photographs — light, written in the air",
        note: "What the camera has been answering with.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.homeofpoi.com/lessons_all/",
        label: "Home of Poi — full lesson archive",
        note: "Free tutorials for every fundamental poi move, organised by level. Where most of the studio's first decade began.",
      },
      {
        href: "https://drex.poi.me/",
        label: "Drex Files — poi tutorial site",
        note: "Long-running reference site for cross-follow, antispin, weaves, and the maths behind each.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Long-exposure_photography",
        label: "Long-exposure photography — Wikipedia",
        note: "The technical foundation for everything visible in the studio's photographs.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Poi_(performance_art)",
        label: "Poi (performance art) — Wikipedia",
        note: "Cultural and historical background on poi, including its Māori origin.",
      },
    ],
  },
  {
    slug: "the-night-the-camera-was-right",
    title: "The Night the Camera Was Right",
    date: "2017-09-22",
    kind: "journal",
    excerpt:
      "The hinge night. The first long exposure that came back as object rather than as snapshot. Twenty-five seconds, wet grass, no idea yet what it meant.",
    Body: TheNightTheCameraWasRight,
    related: [
      {
        href: "/journal/the-question-the-camera-answered",
        label: "The Question the Camera Answered",
        note: "The reflection piece that grew out of this night.",
      },
      {
        href: "/practice",
        label: "Practice — Stage II, long exposure",
      },
      {
        href: "/photographs",
        label: "Photographs — what the camera has been holding ever since",
      },
    ],
  },
  {
    slug: "on-the-bench-year-ten",
    title: "On the Bench, Year Ten",
    date: "2023-08-04",
    kind: "journal",
    excerpt:
      "Building the first rig that did what the commercial pois couldn't. A Teensy on a desk, a Hall sensor and a magnet, a vertical white line that was a vertical white line.",
    Body: OnTheBenchYearTen,
    related: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The argument this entry is the field note for.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Tutorial — Building a POV LED Rig",
        note: "The walkthrough version of the same build.",
      },
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The current state of the kit, six years on.",
      },
    ],
  },
  {
    slug: "year-one-fire",
    title: "Year One, Fire",
    date: "2014-11-30",
    kind: "journal",
    excerpt:
      "Before the camera, before the rigs, before any of this. The body learning the geometry. Sock poi, three-beat weaves, eyes closed, then fire.",
    Body: YearOneFire,
    related: [
      {
        href: "/practice",
        label: "Practice — Stage I, poi",
      },
      {
        href: "/about",
        label: "About — the practice",
      },
    ],
  },
];

export const journal: Entry[] = sortByDateDescending(ENTRIES);

export function getJournalEntry(slug: string): Entry | undefined {
  return journal.find((e) => e.slug === slug);
}
