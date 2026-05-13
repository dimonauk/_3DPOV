/**
 * The Holoflow Loop — the studio's organising principle, named.
 *
 * Six positions in a closed circuit. A body moves through space; a
 * camera holds the path; the path becomes an object; the object meets
 * an audience; the audience moves through it; a body is in space again.
 * Every layer of the studio — practice, rigs, capture, fabrication,
 * display, transmission — sits at one of the six.
 *
 * Each position carries the studio activities that express it and the
 * site routes that already live at that position. Where a route is
 * marked in-build, `href` is null, mirroring the convention in
 * `lib/curriculum.ts`. No invented routes; every entry below points at
 * something that resolves today or is openly named as pending.
 */

export type LoopRoute = {
  /** Route on this site, or null if the route is "in build." */
  href: string | null;
  /** Display label for the link. */
  label: string;
  /** Optional one-line note placing the route inside the position. */
  note?: string;
};

export type LoopPosition = {
  /** Anchor slug for in-page navigation and the diagram links. */
  slug: string;
  /** Display name for the position. */
  name: string;
  /** One-line caption rendered in the diagram. */
  caption: string;
  /** The transition that follows this position in the loop. */
  transition: string;
  /** Studio activities, one line each, that express this position. */
  expressions: string[];
  /** Existing site routes that live at this position. */
  routes: LoopRoute[];
};

export const loopPositions: LoopPosition[] = [
  {
    slug: "body-in-space",
    name: "Body in space",
    caption: "A gesture, sustained, in air the camera can see.",
    transition: "gesture",
    expressions: [
      "Twelve years of poi practice — the movement discipline the loop rests on.",
      "Kata rehearsed in the dark before the shutter is ever opened.",
      "The body as the first instrument; everything downstream is a translation of this.",
    ],
    routes: [
      {
        href: "/practice",
        label: "Practice",
        note: "The twelve-year arc of how the body learned the geometry.",
      },
      {
        href: "/journal/year-one-fire",
        label: "Year One, Fire",
        note: "Field record of the first year on the cord, eyes closed.",
      },
    ],
  },
  {
    slug: "light-written",
    name: "Light written",
    caption: "An instrument carries the gesture as photons.",
    transition: "long exposure",
    expressions: [
      "POV LED rigs, Teensy-driven, angular-sync to the body's rotation.",
      "A drone-LED swarm of five airframes for aerial light at architectural scale.",
      "Fire poi when the brief wants flame as the brush.",
      "Bezel-clip controllers for Meta Quest 3 and Valve Steam Frame — the rig in somebody else's hand.",
    ],
    routes: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The architectural argument for angular sync over time sync.",
      },
      {
        href: "/articles/the-fleet-five-airframes",
        label: "The Fleet — Five Airframes",
        note: "The airframe side of the line; five airframes, one pipeline.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        label: "Building a POV LED Rig",
        note: "Bill of materials, mechanical balance, firmware, first-test debug ladder.",
      },
      {
        href: "/tutorials/spinning-fire-poi-safely",
        label: "Spinning Fire Poi Safely",
        note: "Kit, site, light-up, kata, end — the disciplined version of flame.",
      },
    ],
  },
  {
    slug: "trail-captured",
    name: "Trail captured",
    caption: "The camera holds the path the body has just walked.",
    transition: "segment → mesh → render",
    expressions: [
      "Stills on the Mavic 2 Pro through Lightroom Classic to the Canon imagePROGRAF PRO-1100.",
      "360 capture on the DJI Osmo 360, trekking-pole eyeball through ten years of pole work.",
      "Video with the DaVinci Fusion trail-accumulation graph — MagicMask plus LuminanceKeyer plus Echo.",
      "A nine-second local pipeline that turns a photograph or prompt into a watertight printable mesh.",
    ],
    routes: [
      {
        href: "/tutorials/your-first-long-exposure",
        label: "Your First Long-Exposure Light Painting",
        note: "The first photograph; the camera, the place, the tool, the frame.",
      },
      {
        href: "/articles/london-360-walking",
        label: "London 360 — Walking the Camera Evolution",
        note: "Ten years of 360 cameras, four manufacturers, one pole.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The local pipeline that closes the gap from photograph to mesh.",
      },
      {
        href: "/aerial",
        label: "Aerial",
        note: "The fleet, the FPV pipeline, the aerial light-painting brief.",
      },
    ],
  },
  {
    slug: "trail-reified",
    name: "Trail reified",
    caption: "The captured path is cast into a body that holds.",
    transition: "print · sphere · hologram · VR · AR",
    expressions: [
      "SLA waveguide objects — the gesture grown through acrylic rods inside resin.",
      "CR-30 belt-printed wall reliefs — continuous parametric chain-mail in PETG.",
      "Looking Glass Portrait quilts for the volumetric work; a 48-view depth without a headset.",
      "A2 archival pigment prints on Hahnemühle, Canson, and Ilford papers.",
      "WebXR scenes that carry the same trail into a head-mounted display.",
    ],
    routes: [
      {
        href: "/visualiser/marching-cubes",
        label: "Visualiser — Marching cubes",
        note: "Interactive — the algorithm that turns a captured field into a printable mesh. The bridge at this position, opened.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "From Photograph to 3D Object",
        note: "Capture, voxelise, marching cubes, Blender, OpenSCAD channel, SLA, acrylic rod.",
      },
      {
        href: "/tutorials/lighting-a-waveguide-object",
        label: "Lighting a Waveguide Object",
        note: "Per-piece optical engineering: LED choice, coupling, scattering, PWM.",
      },
      {
        href: "/articles/belt-printed-wall-reliefs",
        label: "Belt-Printed Wall Reliefs",
        note: "The parametric counterpart to the figurative SLA pieces.",
      },
      {
        href: "/articles/jewellery-the-same-trace-wearable",
        label: "Jewellery — the Same Trace Wearable",
        note: "The pendant scale of the photograph-to-object pipeline.",
      },
      {
        href: "/bureau",
        label: "Print bureau",
        note: "The signed A2 archival pigment side of the practice.",
      },
      {
        href: "/photographs",
        label: "Photographs",
        note: "The editioned image — finished work in its first physical form.",
      },
      {
        href: "/atelier#genomes",
        label: "Atelier — Genomes",
        note: "The lineage layer of reification: the engine&rsquo;s accepted genomes are the published record of what the trail-to-object pipeline has bred.",
      },
    ],
  },
  {
    slug: "trail-encountered",
    name: "Trail encountered",
    caption: "An audience moves through the work the body left.",
    transition: "audience moves through it",
    expressions: [
      "/photographs reads as a gallery; the visitor walks the frames the body walked.",
      "/aerial holds the airframe pipeline as a brief surface; commissions land here.",
      "/bureau is the print side of the encounter — paper, calibration, signed editions.",
      "The bezel-clip product carries the rig into a stranger's hand inside a headset.",
      "An AR draw-mode game extends the encounter into the visitor's own walk.",
    ],
    routes: [
      {
        href: "/photographs",
        label: "Photographs",
        note: "The image gallery — the audience's first encounter with the trail.",
      },
      {
        href: "/aerial",
        label: "Aerial",
        note: "The aerial brief surface; commissions enter the loop here.",
      },
      {
        href: "/bureau",
        label: "Print bureau",
        note: "Where a signed archival print is ordered and despatched.",
      },
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "Clip-on bezels: the rig in the audience's hand.",
      },
      {
        href: "/play",
        label: "Play",
        note: "AR draw-mode prototype; the visitor's gesture re-enters the loop at position one.",
      },
    ],
  },
  {
    slug: "body-in-space-again",
    name: "Body in space — again",
    caption: "Someone else picks up the cord. The loop closes.",
    transition: "and the loop begins again",
    expressions: [
      "The Rookery — the studio's quiet network for the people doing this work next.",
      "The curriculum on /learn — seven ladders from absolute beginner to the bench.",
      "The AR game's draw mode, where the visitor's own gesture re-enters the loop at position one.",
    ],
    routes: [
      {
        href: "/rookery",
        label: "The Rookery",
        note: "The append-only feed for the next pair of hands.",
      },
      {
        href: "/learn",
        label: "Learn (curriculum)",
        note: "Seven learning ladders; rungs that are honest about where they are.",
      },
      {
        href: "/play",
        label: "Play",
        note: "AR draw mode — the visitor's own gesture lands the loop at position one.",
      },
    ],
  },
];

export function getLoopPosition(slug: string): LoopPosition | undefined {
  return loopPositions.find((p) => p.slug === slug);
}
