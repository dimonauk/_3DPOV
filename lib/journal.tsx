import ElevenMammothsInThreeHours from "components/journal/entries/eleven-mammoths-in-three-hours";
import FirstLight from "components/journal/entries/first-light";
import OnTheApparatus from "components/journal/entries/on-the-apparatus";
import OnTheBenchYearTen from "components/journal/entries/on-the-bench-year-ten";
import TheBenchInHttps from "components/journal/entries/the-bench-in-https";
import TheFirstWallArray from "components/journal/entries/the-first-wall-array";
import TheFleetUpdateMiniFivePro from "components/journal/entries/the-fleet-update-mini-five-pro";
import TheNightTheCameraWasRight from "components/journal/entries/the-night-the-camera-was-right";
import TheNightTheFontsCameBack from "components/journal/entries/the-night-the-fonts-came-back";
import TheQuestionTheCameraAnswered from "components/journal/entries/the-question-the-camera-answered";
import TheWeekBefore from "components/journal/entries/the-week-before";
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
        href: "/tutorials/spinning-fire-poi-safely",
        label: "Tutorial — Spinning Fire Poi Safely",
        note: "The boring stuff that came after this entry's recklessness.",
      },
      {
        href: "/about",
        label: "About — the practice",
      },
    ],
  },
  {
    slug: "the-first-wall-array",
    title: "The First Wall Array",
    date: "2024-05-12",
    kind: "journal",
    excerpt:
      "Field record of the commission that worked out how to do wall arrays properly. Nine pieces, three years of practice, six layout drafts, two days of install. The composition was alive by the second night.",
    Body: TheFirstWallArray,
    related: [
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "The article that grew out of this install.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Tutorial — Lighting a Waveguide Object",
        note: "The per-piece optical engineering.",
      },
      {
        href: "/contact?intent=commission",
        label: "Commission a wall array",
      },
    ],
  },
  {
    slug: "the-fleet-update-mini-five-pro",
    title: "The Fleet Update — Mini 5 Pro and the Bluetooth LEDs",
    date: "2026-04-22",
    kind: "journal",
    excerpt:
      "The fifth airframe came home from the shop. Sub-250-gram DJI Mini 5 Pro, AliExpress Bluetooth LEDs gorilla-glued to the spine, a small Osmo Action body-mounted for ground-level capture. The mission shape that was not possible with four — the unsynchronised LED swarm — is now on the table.",
    Body: TheFleetUpdateMiniFivePro,
    related: [
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "The full fleet article. The Mini 5 Pro is the fifth airframe this entry records.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The architectural cousin — same persistence-of-vision trick at a different scale.",
      },
      {
        href: "/journal/first-light",
        label: "First Light",
        note: "The first quiet step toward the technique this entry is the fleet-scale version of.",
      },
      {
        href: "/aerial",
        label: "Aerial — the working line",
        note: "The commission shape this fleet exists to serve.",
      },
      {
        href: "/stack",
        label: "The Stack",
        note: "The bench, including all five airframes named in full.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.dji.com/uk/mini-5-pro",
        label: "DJI Mini 5 Pro — official product page",
        note: "Sub-250-gram travel airframe; 1-inch sensor.",
      },
      {
        href: "https://www.dji.com/uk/osmo-action-5-pro",
        label: "DJI Osmo Action — official product page",
        note: "Body-mounted action camera; ecosystem-coherent with the rest of the DJI side.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "The optical foundation the LED-swarm photographs depend on.",
      },
    ],
  },
  {
    slug: "the-week-before",
    title: "The week before",
    date: "2026-05-13",
    kind: "journal",
    excerpt:
      "Pre-flight notes. The drone fleet on the bench, the time-sync firmware for first flights, tomorrow's shoot.",
    Body: TheWeekBefore,
  },
  {
    slug: "eleven-mammoths-in-three-hours",
    title: "Eleven mammoths in three hours",
    date: "2026-05-14",
    kind: "journal",
    excerpt:
      "A Wednesday refactor: eleven oversized code files split into smaller, single-purpose siblings under a 300-line cap. Same behaviour, smaller rooms.",
    Body: ElevenMammothsInThreeHours,
    related: [
      {
        href: "/codex/marching-cubes",
        label: "Marching Cubes",
        note: "The algorithm whose 723-line module was the biggest of the eleven.",
      },
      {
        href: "/codex/gyroid-surfaces",
        label: "Gyroid Surfaces",
        note: "The test scene used to confirm the marching-cubes split was behaviour-preserving.",
      },
      {
        href: "/journal/the-bench-in-https",
        label: "The Bench in HTTPS",
        note: "Another piece of quiet studio infrastructure, in the same workshop register.",
      },
    ],
  },
  {
    slug: "the-night-the-fonts-came-back",
    title: "The night the fonts came back",
    date: "2026-05-14",
    kind: "journal",
    excerpt:
      "A Next.js 15.6 canary regression silently dropped the /_next/static prefix from inlined @font-face URLs. The page kept working in Times New Roman. The fix was one flag.",
    Body: TheNightTheFontsCameBack,
    related: [
      {
        href: "/atelier/rig-simulator",
        label: "Rig Simulator",
        note: "The SSR-safe three.js pattern this entry contrasts with — a noisier, easier-to-catch failure mode.",
      },
      {
        href: "/journal/the-bench-in-https",
        label: "The Bench in HTTPS",
        note: "An adjacent piece of studio plumbing in the same workshop register.",
      },
    ],
    furtherReading: [
      {
        href: "https://nextjs.org/docs/app/api-reference/components/font",
        label: "next/font — official documentation",
        note: "The self-hosting font helper that produces the hashed /_next/static/media URLs at build time.",
      },
      {
        href: "https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss",
        label: "experimental.inlineCss — Next.js config reference",
        note: "The flag whose canary behaviour caused the regression.",
      },
    ],
  },
  {
    slug: "the-bench-in-https",
    title: "The Bench in HTTPS",
    date: "2026-05-14",
    kind: "journal",
    excerpt:
      "The studio's Sharp image bench got a tailnet hostname and a real TLS cert today. Same Docker host, one sidecar, no public internet — the bench is now reachable from anywhere I am logged in.",
    Body: TheBenchInHttps,
    related: [
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The wider working set the Sharp bench is part of.",
      },
      {
        href: "/codex/persistence-of-vision",
        label: "Persistence of Vision",
        note: "An adjacent piece of studio infrastructure documented in catalogue mode.",
      },
    ],
    furtherReading: [
      {
        href: "https://tailscale.com/kb/1242/tailscale-serve",
        label: "Tailscale Serve — official documentation",
        note: "The mechanism that puts a private service behind a tailnet hostname with a real cert.",
      },
      {
        href: "https://sharp.pixelplumbing.com/",
        label: "Sharp — high-performance Node.js image processing",
        note: "The libvips-backed image library the studio's print pipeline depends on.",
      },
      {
        href: "https://letsencrypt.org/how-it-works/",
        label: "Let's Encrypt — how it works",
        note: "The ACME-based cert issuer that signs the tailnet hostnames.",
      },
    ],
  },
];

export const journal: Entry[] = sortByDateDescending(ENTRIES);

export function getJournalEntry(slug: string): Entry | undefined {
  return journal.find((e) => e.slug === slug);
}
