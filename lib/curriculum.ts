/**
 * The studio's curriculum — seven learning ladders that take a reader
 * from absolute beginner to where the studio's practice currently sits.
 *
 * Each rung either points at an existing entry on the site (by route)
 * or is marked "in preparation" so the ladder reads honestly today and
 * fills in over time.
 *
 * Underlying belief: anyone willing to sit and learn can get to this
 * work. The ladders are the path; the writing is the rungs.
 */

export type Rung = {
  /** Short title for the rung. */
  title: string;
  /** One-line description of what the rung gives the learner. */
  blurb: string;
  /** Route on this site, or null if the rung is "in preparation." */
  href: string | null;
};

export type Ladder = {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  rungs: Rung[];
};

export const ladders: Ladder[] = [
  {
    slug: "photography",
    title: "Photography to Long-Exposure",
    subtitle: "Camera fundamentals up through printable prints",
    intro:
      "Starts with a camera in manual mode and a dark room; ends with a calibrated, signed long-exposure print on archival paper. Three rungs visible today; one more in preparation.",
    rungs: [
      {
        title: "Camera fundamentals (manual exposure)",
        blurb:
          "In preparation. Aperture, shutter, ISO, the exposure triangle, manual focus, RAW vs JPEG. Read the further-reading Wikipedia ladder on the tutorial below until this lands.",
        href: null,
      },
      {
        title: "Your First Long-Exposure Light Painting",
        blurb:
          "Camera, place, tool, frame, shutter, gesture. The first photograph is always the same.",
        href: "/tutorials/your-first-long-exposure",
      },
      {
        title: "Calibrating the Canon imagePROGRAF PRO-1100",
        blurb:
          "How the bureau actually does it. Monitor at 120 cd/m² and D65 first, paper ICCs from Hahnemühle / Canson / Ilford, soft-proof in Relative Colorimetric, A4 test strip before any A2, sign after a 24-hour cure. With grateful credit to Keith Cooper at Northlight Images.",
        href: "/tutorials/calibrating-the-imageprograf-pro-1100",
      },
      {
        title: "From Photograph to 3D Object",
        blurb:
          "Capture, voxelise, marching cubes, Blender cleanup, OpenSCAD waveguide channel, SLA print + acrylic rod insertion. The full studio pipeline.",
        href: "/tutorials/from-photograph-to-object",
      },
    ],
  },
  {
    slug: "poi",
    title: "Poi to Fire to Performance",
    subtitle: "Movement discipline, eyes closed, then flame",
    intro:
      "Starts with a sock with a tennis ball in it. Ends with a fire kata held confidently in a dark field. The first rungs are the body learning the geometry; the later ones add fuel.",
    rungs: [
      {
        title: "Sock Poi to Three-Beat Weave",
        blurb:
          "In preparation. The first thousand hours: holding the cord, the forward spin, the three-beat weave from cold, eyes closed.",
        href: null,
      },
      {
        title: "Spinning Fire Poi Safely",
        blurb:
          "Not a beginner tutorial. The body needs the kata before fire enters the picture. Kit, site, light-up, kata, end.",
        href: "/tutorials/spinning-fire-poi-safely",
      },
      {
        title: "Year One, Fire",
        blurb:
          "Field record of the first year: sock poi to three-beat weave to first lit chain in the back garden, alone.",
        href: "/journal/year-one-fire",
      },
    ],
  },
  {
    slug: "pov-rigs",
    title: "Wiring to POV LED Rigs",
    subtitle: "Solder a single LED, build a rig that photographs sharp",
    intro:
      "Starts with one LED on a breadboard. Ends with a Teensy-driven persistence-of-vision rig that locks to angle and writes pixel-accurate images into space.",
    rungs: [
      {
        title: "Your First Addressable LED",
        blurb:
          "In preparation. Wiring a single WS2812 / NeoPixel from an Arduino-class microcontroller. Power, data, level-shifting, the obligatory blink.",
        href: null,
      },
      {
        title: "Building a POV LED Rig",
        blurb:
          "Bill of materials, mechanical balance, electrical (level shifter / capacitor / Hall sensor), firmware via FastLED, the first-test debug ladder.",
        href: "/tutorials/building-a-pov-led-rig",
      },
      {
        title: "Programming Frames for a POV Rig",
        blurb:
          "From a regular image to the per-column polar data the firmware wants. Gamma, brightness budgets, the angular reference, three test patterns.",
        href: "/tutorials/programming-pov-frames",
      },
      {
        title: "Why I Build My Own Rigs",
        blurb:
          "The article that argues the bench-built approach. Angle-sync vs time-sync; the architectural choice that makes the photographs land sharp.",
        href: "/articles/why-i-build-my-own-rigs",
      },
    ],
  },
  {
    slug: "drones",
    title: "Drones and Aerial Capture",
    subtitle: "From first hover to FPV cinewhoop 360",
    intro:
      "Starts with a beginner drone in an empty field. Ends with FPV through DJI Goggles plus an InAir head-tracker and a Xreal AR overlay, capturing 8K 360 cinewhoop fly-throughs.",
    rungs: [
      {
        title: "Your First FPV Drone Flight",
        blurb:
          "In preparation. CAA registration, op-id, where to fly legally in the UK, the controller stick map, first hover, first orbit, landing without crashing.",
        href: null,
      },
      {
        title: "Capturing 360 with the Avata",
        blurb:
          "In preparation. The Avata 360 in dual-lens mode, equirectangular capture, mission planning for cinewhoop fly-throughs, post in DaVinci Resolve.",
        href: null,
      },
      {
        title: "Aerial — the studio's fleet, the FPV pipeline",
        blurb:
          "Four airframes, one pipeline. Editorial aerial, FPV cinewhoop fly-throughs, aerial light-painting commissions, 360 immersive capture.",
        href: "/aerial",
      },
      {
        title: "First Light",
        blurb:
          "Field record of the studio's first LED-modified airframe flight.",
        href: "/journal/first-light",
      },
    ],
  },
  {
    slug: "fabrication",
    title: "3D Printing and Object Production",
    subtitle: "From slicer to embedded waveguide",
    intro:
      "Starts with a small SLA printer and a test cube. Ends with a resin sculpture carrying an acrylic waveguide grown along the trace of a photographed gesture.",
    rungs: [
      {
        title: "Your First SLA Print",
        blurb:
          "In preparation. Choosing a small resin printer, setting up the slicer, calibrating exposure, cleaning and curing prints, post-processing the surface.",
        href: null,
      },
      {
        title: "From Photograph to 3D Object",
        blurb:
          "The studio's pipeline: capture, voxelise, marching cubes, Blender cleanup, OpenSCAD channel, SLA print, acrylic rod insertion.",
        href: "/tutorials/from-photograph-to-object",
      },
      {
        title: "Lighting a Waveguide Object",
        blurb:
          "The per-piece optical engineering: LED choice (CRI matters), coupling, scattering, driving, PWM dimming, modes.",
        href: "/tutorials/lighting-a-waveguide-object",
      },
      {
        title: "Belt-Printed Wall Reliefs",
        blurb:
          "The parametric counterpart to figurative SLA work — CR-30 belt printer producing continuous chain-mail and dragon-scale reliefs.",
        href: "/articles/belt-printed-wall-reliefs",
      },
    ],
  },
  {
    slug: "ai-pipeline",
    title: "Local AI Pipelines",
    subtitle: "ComfyUI, SAM2, marching cubes, all on one consumer GPU",
    intro:
      "Starts with installing ComfyUI on a laptop with a decent GPU. Ends with a nine-second local pipeline that turns a text prompt or a photograph into a watertight printable STL.",
    rungs: [
      {
        title: "Your First Local AI Image Generation",
        blurb:
          "In preparation. ComfyUI install, Stable Diffusion model selection, the basic text-to-image graph, why local matters.",
        href: null,
      },
      {
        title: "SAM2 Segmentation",
        blurb:
          "In preparation. Wiring Meta's Segment Anything Model 2 into ComfyUI or a standalone server; the click-to-mask workflow; the embedding cache trick.",
        href: null,
      },
      {
        title: "Nine Seconds from Prompt to Printable",
        blurb:
          "The studio's full local pipeline. SDXL + SAM2 + marching cubes + watertight STL, glued together by a Python orchestrator, running on a single RTX 3080 Ti.",
        href: "/articles/nine-seconds-prompt-to-printable",
      },
    ],
  },
  {
    slug: "immersive",
    title: "WebXR and Immersive Systems",
    subtitle: "Three.js scenes through to VR-mirrored gesture",
    intro:
      "Starts with a Three.js scene in a browser. Ends with a real-world poi performance captured by camera and mirrored live into a WebXR scene through clip-on POV LED bezels.",
    rungs: [
      {
        title: "Your First WebXR Scene",
        blurb:
          "In preparation. React Three Fiber, the WebXR foundations, getting a scene into a Quest 3 browser, the basic controller-input loop.",
        href: null,
      },
      {
        title: "VR as a Psychological System",
        blurb:
          "Twenty-two years of thinking about VR as cognitive system: presence (Slater), embodiment (Ehrsson), attention (Kahneman), telepresence and its losses.",
        href: "/articles/vr-as-psychological-system",
      },
      {
        title: "VR POV Controllers — the Studio's Product",
        blurb:
          "Clip-on POV LED bezels for Meta Quest 3 and Valve Steam Frame controllers. Real-world light painting and VR-mirrored gesture at the same time.",
        href: "/articles/vr-pov-controllers-the-product",
      },
      {
        title: "Sellotape and Tilt Brush",
        blurb:
          "The fifteen-year origin: standing in a small flat with a prototype VR controller, swinging it like poi, watching the trail render as volume.",
        href: "/articles/sellotape-and-tilt-brush",
      },
    ],
  },
];
