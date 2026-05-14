import type { ComponentType } from "react";
import AugmentedReality from "components/codex/entries/augmented-reality";
import KolorAutopanoHistorical from "components/codex/entries/kolor-autopano-historical";
import LongExposurePhotography from "components/codex/entries/long-exposure-photography";
import OnePressThreeSixtyCapture from "components/codex/entries/one-press-three-sixty-capture";
import PanoTwoVrTourBuilding from "components/codex/entries/pano2vr-tour-building";
import PersistenceOfVision from "components/codex/entries/persistence-of-vision";
import Poi from "components/codex/entries/poi";
import PovLedArray from "components/codex/entries/pov-led-array";
import PtguiHuginLightroomStitching from "components/codex/entries/ptgui-hugin-lightroom-stitching";
import SpatialAudioExplained from "components/codex/entries/spatial-audio-explained";
import ThreeSixtyPhotography from "components/codex/entries/three-sixty-photography";
import UkCaaDroneRegulations2026 from "components/codex/entries/uk-caa-drone-regulations-2026";
import VirtualReality from "components/codex/entries/virtual-reality";

export type CodexCategory =
  | "Practice"
  | "Apparatus"
  | "Capture"
  | "Capture (Immersive)"
  | "Drone"
  | "Production"
  | "Print"
  | "Commerce"
  | "Community";

export type CodexSource = { label: string; url?: string };

export type CodexEntry = {
  slug: string;
  title: string;
  category: CodexCategory;
  /** ISO YYYY-MM-DD. Used for the timestamp byline. */
  date: string;
  /** One- or two-sentence plain-text summary for the index. */
  summary: string;
  /** Optional status note (e.g. "Updated from author's 2017 tutorial"). */
  status?: string;
  /** Slugs of related entries. Orphan refs render as 'pending'. */
  seeAlso?: string[];
  sources?: CodexSource[];
  /** Body component. Renders its own footnotes inline at the bottom. */
  Body: ComponentType;
};

const ENTRIES: CodexEntry[] = [
  {
    slug: "three-sixty-photography",
    title: "360° photography",
    category: "Capture",
    date: "2026-05-12",
    summary:
      "Recording a complete sphere of light around a point and unfolding it onto a rectangle. The patient method, the modern method, the selfie-presence problem, and the equirectangular projection's contribution to the world's stretched-noodle population.",
    seeAlso: [
      "one-press-three-sixty-capture",
      "ptgui-hugin-lightroom-stitching",
      "virtual-reality",
      "augmented-reality",
    ],
    sources: [
      {
        label:
          "The author's own published tutorial: '360 Photography Bootcamp,' VeeR VR / Medium, 28 Nov 2017",
        url: "https://medium.com/@letsveer/360-photography-bootcamp-how-to-set-up-your-camera-for-panoramic-shooting-d7e82e2d6608",
      },
      {
        label: "Wikipedia: Equirectangular projection",
        url: "https://en.wikipedia.org/wiki/Equirectangular_projection",
      },
      {
        label: "Wikipedia: 360-degree video",
        url: "https://en.wikipedia.org/wiki/360-degree_video",
      },
      {
        label: "Wikipedia: VR180",
        url: "https://en.wikipedia.org/wiki/VR180",
      },
      {
        label: "Adobe: Working with VR / 360° in Premiere Pro",
        url: "https://helpx.adobe.com/premiere-pro/using/vr-video.html",
      },
      {
        label: "DaVinci Resolve 360° / VR documentation (Blackmagic Design)",
        url: "https://www.blackmagicdesign.com/products/davinciresolve",
      },
      {
        label:
          "Insta360 community + tutorial library (curated drop-in for learners)",
        url: "https://www.insta360.com/community",
      },
      {
        label: "Ricoh Theta developer documentation",
        url: "https://api.ricoh/docs/theta-web-api-v2.1/",
      },
    ],
    Body: ThreeSixtyPhotography,
  },
  {
    slug: "virtual-reality",
    title: "Virtual reality (VR)",
    category: "Capture (Immersive)",
    date: "2026-05-12",
    summary:
      "The technique of placing a person inside a computer-generated environment so convincingly that they will, given enough time, walk into the coffee table. Sensorama to Quest, with the coffee-table problem as the recurring unit of measurement.",
    seeAlso: ["augmented-reality", "three-sixty-photography", "spatial-audio-explained"],
    sources: [
      {
        label: "Wikipedia: Virtual reality",
        url: "https://en.wikipedia.org/wiki/Virtual_reality",
      },
      {
        label: "Wikipedia: Apple Vision Pro",
        url: "https://en.wikipedia.org/wiki/Apple_Vision_Pro",
      },
      {
        label: "Wikipedia: Sensorama (Morton Heilig, 1962)",
        url: "https://en.wikipedia.org/wiki/Sensorama",
      },
      {
        label: "Wikipedia: Sword of Damocles (Ivan Sutherland, 1968)",
        url: "https://en.wikipedia.org/wiki/The_Sword_of_Damocles_(virtual_reality)",
      },
      {
        label: "WebXR Device API specification (W3C)",
        url: "https://immersiveweb.dev/",
      },
      {
        label: "Meta Quest developer hub",
        url: "https://developers.meta.com/horizon/",
      },
      {
        label: "Apple visionOS developer documentation",
        url: "https://developer.apple.com/visionos/",
      },
    ],
    Body: VirtualReality,
  },
  {
    slug: "augmented-reality",
    title: "Augmented reality (AR)",
    category: "Capture (Immersive)",
    date: "2026-05-12",
    summary:
      "Computer-generated overlay on top of the real world. Optical see-through versus video passthrough, three hard problems, and one specific use case where the studio finds it genuinely useful (flying drones FPV with telemetry layered on the real view).",
    seeAlso: ["virtual-reality"],
    sources: [
      {
        label: "Wikipedia: Augmented reality",
        url: "https://en.wikipedia.org/wiki/Augmented_reality",
      },
      {
        label: "Wikipedia: Mixed reality",
        url: "https://en.wikipedia.org/wiki/Mixed_reality",
      },
      {
        label: "Wikipedia: Extended reality (XR)",
        url: "https://en.wikipedia.org/wiki/Extended_reality",
      },
      {
        label: "Xreal developer documentation",
        url: "https://docs.xreal.com/",
      },
      {
        label: "Microsoft HoloLens retrospective (HoloLens 2 EOL notice)",
        url: "https://learn.microsoft.com/en-us/hololens/hololens2-end-of-support",
      },
      {
        label:
          "Apple Developer guidelines: visionOS terminology ('spatial computing')",
        url: "https://developer.apple.com/visionos/",
      },
      {
        label:
          "InAir head-tracking pod & FPV drone overlay community (r/fpv)",
        url: "https://www.reddit.com/r/fpv/",
      },
    ],
    Body: AugmentedReality,
  },
  {
    slug: "spatial-audio-explained",
    title: "Spatial audio for VR",
    category: "Capture (Immersive)",
    date: "2026-05-02",
    status: "Updated from the author's 2017 VeeR VR tutorial.",
    summary:
      "Audio that changes as the listener's head turns. Ambisonics, HRTFs, the 2017 toolkit audited for which platforms survived, and the studio's current Reaper + ATK working pipeline.",
    seeAlso: ["virtual-reality", "three-sixty-photography", "one-press-three-sixty-capture"],
    sources: [
      {
        label:
          "The author's own 2017 article: 'Spatial Audio Explained,' VeeR VR / Medium, 23 Nov 2017",
        url: "https://medium.com/@letsveer/spatial-audio-explained-top-5-vr-spatial-audio-platforms-and-software-5f0d90dea88",
      },
      {
        label: "Wikipedia: Ambisonics",
        url: "https://en.wikipedia.org/wiki/Ambisonics",
      },
      {
        label: "Wikipedia: Head-related transfer function (HRTF)",
        url: "https://en.wikipedia.org/wiki/Head-related_transfer_function",
      },
      {
        label: "Ambisonic Toolkit (ATK) — free, open-source",
        url: "https://www.ambisonictoolkit.net/",
      },
      {
        label: "Reaper DAW (60-day free trial, evaluation-priced licence)",
        url: "https://www.reaper.fm/",
      },
      {
        label: "Valve Steam Audio (free, open-source)",
        url: "https://valvesoftware.github.io/steam-audio/",
      },
      {
        label: "Meta XR Audio SDK documentation",
        url: "https://developers.meta.com/horizon/documentation/native/audio-sdk/",
      },
      {
        label: "Google Resonance Audio (archived but still working)",
        url: "https://resonance-audio.github.io/resonance-audio/",
      },
    ],
    Body: SpatialAudioExplained,
  },
  {
    slug: "kolor-autopano-historical",
    title: "Kolor Autopano Pro/Giga (historical)",
    category: "Production",
    date: "2026-04-30",
    status: "Tool discontinued 2018. Preserved as record.",
    summary:
      "Between 2010 and 2018, the most capable consumer-priced panoramic stitcher. Bought by GoPro in 2015. Killed in 2018 without an officially supported migration path. The studio still mourns it on alternate Wednesdays.",
    seeAlso: ["ptgui-hugin-lightroom-stitching", "three-sixty-photography"],
    sources: [
      {
        label:
          "The author's own 2017 article: 'Kolor Autopano,' VeeR VR / Medium, 1 Dec 2017",
        url: "https://medium.com/@letsveer/kolor-autopano-create-a-panorama-with-autopano-pro-giga-32111f7bc9ae",
      },
      {
        label:
          "Wayback Machine archive of Kolor.com (pre-shutdown reference)",
        url: "https://web.archive.org/web/2018/https://www.kolor.com/",
      },
      {
        label:
          "Wikipedia: Scale-invariant feature transform (SIFT, the algorithm Autopano used)",
        url: "https://en.wikipedia.org/wiki/Scale-invariant_feature_transform",
      },
      {
        label:
          "GoPro press release: acquisition of Kolor (2015)",
        url: "https://newsroom.gopro.com/2015-04-09-GoPro-Adds-Critical-Spherical-Software-To-Capture-Solutions-With-Acquisition-Of-Kolor",
      },
    ],
    Body: KolorAutopanoHistorical,
  },
  {
    slug: "ptgui-hugin-lightroom-stitching",
    title: "Stitching in PTGui, Hugin & Lightroom (2026)",
    category: "Production",
    date: "2026-04-30",
    status: "New. Replaces the dead Kolor Autopano workflow.",
    summary:
      "Three tools that now cover the territory Kolor Autopano held alone. PTGui is the working professional's pick; Hugin is free; Lightroom is what you already have. Which to pick, with workflow for each.",
    seeAlso: [
      "kolor-autopano-historical",
      "three-sixty-photography",
      "one-press-three-sixty-capture",
    ],
    sources: [
      { label: "PTGui (official)", url: "https://ptgui.com/" },
      {
        label: "PTGui Pro feature documentation",
        url: "https://ptgui.com/info/pro.html",
      },
      {
        label: "Hugin (official, free, open-source)",
        url: "https://hugin.sourceforge.io/",
      },
      {
        label: "Hugin tutorials (community-maintained)",
        url: "https://wiki.panotools.org/Hugin",
      },
      {
        label: "Adobe: Create panoramas in Lightroom Classic",
        url: "https://helpx.adobe.com/lightroom-classic/help/panorama-photo-merge.html",
      },
      {
        label: "panotools.org — the panoramic photography knowledge base",
        url: "https://wiki.panotools.org/",
      },
    ],
    Body: PtguiHuginLightroomStitching,
  },
  {
    slug: "pano2vr-tour-building",
    title: "Pano2VR for virtual tours",
    category: "Production",
    date: "2026-04-29",
    status: "Updated from the author's 2017 VeeR VR tutorial. Tool still alive.",
    summary:
      "The long-survivor of desktop virtual-tour tools — Garden Gnome Software has maintained it since 2007. Updated 2026 workflow for two-node tours with WebVR / WebXR output, plus alternatives worth knowing.",
    seeAlso: [
      "three-sixty-photography",
      "ptgui-hugin-lightroom-stitching",
      "one-press-three-sixty-capture",
    ],
    sources: [
      {
        label:
          "The author's own 2017 article: 'Pano2VR Ultimate User Guide,' VeeR VR / Medium, 8 Nov 2017",
        url: "https://medium.com/@letsveer/pano2vr-ultimate-user-guide-how-to-create-a-two-node-mini-tour-ea20b34a42e8",
      },
      {
        label: "Garden Gnome Pano2VR (official)",
        url: "https://ggnome.com/pano2vr/",
      },
      {
        label: "Marzipano (free, open-source, browser-based)",
        url: "https://www.marzipano.net/",
      },
      {
        label: "Kuula (browser-based virtual tour hosting)",
        url: "https://kuula.co/",
      },
      {
        label: "Matterport (commercial virtual tour platform)",
        url: "https://matterport.com/",
      },
      {
        label: "WebVR / WebXR specification",
        url: "https://immersiveweb.dev/",
      },
    ],
    Body: PanoTwoVrTourBuilding,
  },
  {
    slug: "one-press-three-sixty-capture",
    title: "One-press 360° capture (2026)",
    category: "Capture (Immersive)",
    date: "2026-04-29",
    status: "New. Replaces the Microsoft ICE stitching workflow.",
    summary:
      "Between 2017 and 2026 the consumer 360° camera went from prototype to default. The current camera options, the pipeline, when to drop back to the manual workflow, and a note on GPano metadata for the platforms that still won't recognise their own output.",
    seeAlso: [
      "three-sixty-photography",
      "ptgui-hugin-lightroom-stitching",
      "spatial-audio-explained",
    ],
    sources: [
      {
        label: "Insta360 (X4 / X5 official, plus their tutorial library)",
        url: "https://www.insta360.com/",
      },
      {
        label: "Ricoh Theta (Z1 + ecosystem)",
        url: "https://theta360.com/",
      },
      {
        label: "GoPro Max 2 official",
        url: "https://gopro.com/en/us/shop/cameras/max",
      },
      {
        label: "DJI Avata 360 specifications",
        url: "https://www.dji.com/avata-360",
      },
      {
        label: "Canon RF 5.2mm F2.8 L Dual Fisheye (VR180)",
        url: "https://www.usa.canon.com/shop/p/rf-5-2mm-f2-8-l-dual-fisheye",
      },
      {
        label: "ExifTool by Phil Harvey (the metadata standard)",
        url: "https://exiftool.org/",
      },
      {
        label: "Google GPano metadata specification (archived)",
        url: "https://developers.google.com/streetview/spherical-metadata",
      },
      {
        label: "DaVinci Resolve VR/360° toolset documentation",
        url: "https://www.blackmagicdesign.com/products/davinciresolve",
      },
    ],
    Body: OnePressThreeSixtyCapture,
  },
  {
    slug: "persistence-of-vision",
    title: "Persistence of vision",
    category: "Capture",
    date: "2026-05-14",
    summary:
      "The optical phenomenon by which a flickering or rapidly-changing light source appears as a continuous trace. D'Arcy 1768 → Roget 1824 → modern vision-science disaggregation. Foundation of every entry under Apparatus and Capture in this codex.",
    seeAlso: ["pov-led-array", "long-exposure-photography"],
    sources: [
      {
        label: "Wikipedia: Persistence of vision",
        url: "https://en.wikipedia.org/wiki/Persistence_of_vision",
      },
      {
        label: "Patrick D'Arcy, 1768 — Royal Society Memoirs",
        url: "https://royalsocietypublishing.org/",
      },
      {
        label: "Peter Mark Roget, Royal Society of London, 1824",
      },
    ],
    Body: PersistenceOfVision,
  },
  {
    slug: "poi",
    title: "Poi",
    category: "Practice",
    date: "2026-05-14",
    summary:
      "Movement discipline of Māori origin in which a performer swings a pair of weights on flexible cords through geometric patterns around the body. Aotearoa origin pre-1500 CE; global flow-arts diffusion since the 1990s. The studio practice is twelve years deep in this lineage.",
    seeAlso: ["pov-led-array", "long-exposure-photography"],
    sources: [
      {
        label: "Wikipedia: Poi (performance art)",
        url: "https://en.wikipedia.org/wiki/Poi_(performance_art)",
      },
      {
        label: "Te Papa Tongarewa: What makes a poi",
        url: "https://www.tepapa.govt.nz/discover-collections/read-watch-play/poi/what-makes-poi-traditional-materials",
      },
      {
        label: "SpinPoi: History of Poi",
        url: "https://spinpoi.com/what-is-poi/",
      },
    ],
    Body: Poi,
  },
  {
    slug: "pov-led-array",
    title: "Persistence-of-vision LED array (POV LED array)",
    category: "Apparatus",
    date: "2026-05-14",
    summary:
      "A line or grid of addressable LEDs whose elements update rapidly while the array moves through space. To a long-exposure camera, the array writes a 2D (or 3D, given motion in depth) image into the frame. Pixelstick / Pixel Poi / studio Teensy rigs.",
    seeAlso: ["persistence-of-vision", "long-exposure-photography", "poi"],
    sources: [
      {
        label: "Adafruit: MiniPOV4 reference design",
        url: "https://learn.adafruit.com/minipov4-diy-full-color-persistence-of-vision-light-painting-kit",
      },
      {
        label: "Bitbanger Labs: Pixelstick",
        url: "https://www.thepixelstick.com/",
      },
      {
        label: "Holo-Flow Studio: studio rig specs (Teensy 3.1 + TLC5927)",
      },
    ],
    Body: PovLedArray,
  },
  {
    slug: "long-exposure-photography",
    title: "Long-exposure photography",
    category: "Capture",
    date: "2026-05-14",
    summary:
      "Leaving the shutter open long enough that the image integrates light over time. f/8–f/11 at ISO 50–100 with the focus taped, in genuinely dark locations, tuned to the duration of the kata rather than the brightness of the scene.",
    seeAlso: ["persistence-of-vision", "pov-led-array"],
    sources: [
      {
        label: "General photographic theory (any introductory text)",
      },
      {
        label: "Holo-Flow Studio: working conventions",
      },
    ],
    Body: LongExposurePhotography,
  },
  {
    slug: "uk-caa-drone-regulations-2026",
    title: "UK CAA drone regulations (2026)",
    category: "Drone",
    date: "2026-05-14",
    summary:
      "From 1 January 2026, the UK CAA's drone regulations apply with a 100g registration threshold (down from 250g) and a clarified competency framework. Operator ID, Flyer ID, A2 CofC, insurance — what the working artist needs to fly legally.",
    seeAlso: [],
    sources: [
      {
        label: "CAA, drone regulations effective 1 January 2026",
        url: "https://www.caa.co.uk/drones/",
      },
      {
        label: "DJI Viewpoints: 2026 UK rules summary",
        url: "https://viewpoints.dji.com/blog/new-uk-drone-regulations",
      },
      {
        label: "Impact Aerial: A2 CofC walkthrough",
        url: "https://www.impactaerial.co.uk/",
      },
    ],
    Body: UkCaaDroneRegulations2026,
  },
];

export const codex: CodexEntry[] = [...ENTRIES].sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title),
);

export function getCodexEntry(slug: string): CodexEntry | undefined {
  return codex.find((e) => e.slug === slug);
}

/**
 * Reverse cross-reference: which other Codex entries list the given
 * slug in their `seeAlso` array. Computed at build time over the
 * static registry; cheap.
 */
export function getCodexReferencedBy(slug: string): CodexEntry[] {
  return codex.filter((e) => e.seeAlso?.includes(slug));
}

/**
 * Cross-system lookup: a slug in a Codex entry's `seeAlso` can
 * resolve to another Codex entry, an article, a tutorial, or a
 * journal entry. This helper returns the URL + display title for
 * any of those, or undefined if the slug doesn't resolve anywhere.
 *
 * The writing.tsx registries are imported lazily inside the function
 * body so the Codex doesn't take a hard dep on them at module load.
 */
export type LinkedItem = {
  slug: string;
  title: string;
  href: string;
  kind: "codex" | "article" | "tutorial" | "journal";
};

export function findLinkedItem(slug: string): LinkedItem | undefined {
  const c = getCodexEntry(slug);
  if (c) {
    return { slug: c.slug, title: c.title, href: `/codex/${c.slug}`, kind: "codex" };
  }
  // Lazy-require the writing registries — keeps the Codex module
  // independent and avoids circular imports during build.
  try {
    const { getArticle } = require("./articles") as typeof import("./articles");
    const a = getArticle(slug);
    if (a) {
      return { slug: a.slug, title: a.title, href: `/articles/${a.slug}`, kind: "article" };
    }
  } catch {
    /* articles registry not present at runtime */
  }
  try {
    const { getTutorial } = require("./tutorials") as typeof import("./tutorials");
    const t = getTutorial(slug);
    if (t) {
      return { slug: t.slug, title: t.title, href: `/tutorials/${t.slug}`, kind: "tutorial" };
    }
  } catch {
    /* tutorials registry not present at runtime */
  }
  return undefined;
}

export function getCodexByCategory(): Map<CodexCategory, CodexEntry[]> {
  const map = new Map<CodexCategory, CodexEntry[]>();
  for (const entry of codex) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }
  return map;
}

export const CODEX_CATEGORY_ORDER: CodexCategory[] = [
  "Practice",
  "Apparatus",
  "Capture",
  "Capture (Immersive)",
  "Drone",
  "Production",
  "Print",
  "Commerce",
  "Community",
];

export function slugifyCategory(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
