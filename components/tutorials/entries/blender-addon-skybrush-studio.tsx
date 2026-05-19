import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function SkybrushBody() {
  return (
    <>
      <p>
        A drone show is a piece of choreography that happens to be
        performed by aircraft. The choreographer is sitting in front of
        Blender; the dancers are in a hangar somewhere, charging. The
        bridge between the two is the Skybrush Studio add-on, which
        turns a Blender scene of animated empties into an audited,
        time-coded, collision-checked flight programme that a fleet of
        drones can perform. The studio runs it because the same
        creative grammar that drives the Looking Glass plinths and the
        long-exposure POI rigs also drives drone work &mdash; you are
        sculpting light with motion, the only difference is the size of
        the room.
      </p>

      <p>
        The goal of this tutorial: produce a 60-second swarm sequence
        of 50 simulated drones forming a single recognisable shape,
        validated for safety, and exported to{" "}
        <code>.skyc</code> &mdash; Skybrush&rsquo;s compiled show
        format &mdash; ready to drop into the desktop player for review.
        The constraints: do it without a real fleet, using the add-on&rsquo;s
        own simulator and validators. The point is the workflow, not the
        cleared airspace.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-skybrush-studio",
  title: "Skybrush Studio — drone choreography in Blender",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An hour at the bench. Take 50 animated empties in a Blender scene, run them through the Skybrush Studio add-on's safety + collision validators, and export a .skyc show file you can play back in the desktop simulator. The first step on the studio's drone-show pipeline.",
  Body: SkybrushBody,
  related: [
    {
      href: "/articles/the-bench",
      label: "The Bench",
      note: "The studio stack the drone-show pipeline lives inside.",
    },
    {
      href: "/tutorials/programming-pov-frames",
      label: "Tutorial — Programming POV frames",
      note: "Sibling motion-graphics tutorial on a smaller spinning canvas.",
    },
  ],
  furtherReading: [
    {
      href: "https://skybrush.io/",
      label: "Skybrush — official site",
      note: "Documentation, licensing, supported aircraft.",
    },
    {
      href: "https://doc.collmot.com/public/skybrush-studio-for-blender/latest/",
      label: "Skybrush Studio for Blender — official docs",
      note: "Author-side reference for every panel and operator.",
    },
    {
      href: "https://github.com/skybrush-io/studio-blender",
      label: "Skybrush Studio Blender — GitHub",
      note: "Source, issues, release notes.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an hour at the bench, plus add-on install",
    difficulty: "intermediate",
    cost: "free — Skybrush has a no-cost community tier for simulation; commercial flight requires a paid licence",
    prerequisites: [
      "Blender 4.4 or 5.x, with the Skybrush Studio add-on installed and the vendored sbstudio deps loaded (the add-on installer handles this).",
      "Comfortable with empties, parenting, and the timeline. No Geometry Nodes required for this pass.",
      "Read the basic safety section of the Skybrush docs once. The simulator is harmless; the assumption that real flight is also harmless is not.",
    ],
    supplies: {
      tools: [
        {
          name: "Blender 4.4 or 5.x",
          note: "The bench is on 5.1; the add-on declares 4.4 minimum.",
        },
        {
          name: "Skybrush Studio add-on",
          note: "Installed via the Skybrush installer, which copies the add-on into Blender's user add-ons folder and vendors the sbstudio Python deps.",
          suppliers: [
            {
              name: "Skybrush — downloads",
              url: "https://skybrush.io/download/",
              price: "free for community / simulation",
            },
          ],
        },
        {
          name: "Skybrush Viewer (desktop player)",
          note: "Plays back a .skyc file without a fleet. Cross-platform.",
          suppliers: [
            {
              name: "Skybrush — downloads",
              url: "https://skybrush.io/download/",
              price: "free",
            },
          ],
        },
      ],
    },
    software: [
      {
        name: "Blender",
        version: "4.4+ (5.1 on the studio bench)",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Skybrush Studio for Blender",
        version: "4.3.0 on the studio bench",
        url: "https://skybrush.io/download/",
        cost: "free / commercial tiers",
        platforms: ["windows", "macos", "linux"],
        note: "The Blender-side authoring add-on. Vendors its sbstudio deps so it works offline.",
      },
    ],
    steps: [
      {
        title: "Create the swarm",
        body: "In a new Blender scene, add 50 Empty objects in a hexagonal close-packed grid. The Skybrush sidebar (View3D > Sidebar > Skybrush) has a 'Create Takeoff Grid' operator that does this in one click — set the count, the spacing (1.5 m default for educational drones), and the formation.\n\nThis is the swarm at takeoff. Every empty becomes a drone in the export.",
      },
      {
        title: "Define the target formation",
        body: "Model a low-poly icon — a simple 3D logo, a 50-vertex outline, a parametric heart. The shape can be any mesh; what matters is the vertex count, which must match (or exceed) the swarm size.\n\nUse the Skybrush 'Formation > Create from Object' operator to register the mesh as a formation. The add-on samples the mesh's vertices as drone positions.",
      },
      {
        title: "Animate the transition",
        body: "Skybrush's 'Transitions' panel handles the path-planning between formations. Add a keyframe at frame 1 for the takeoff grid, a keyframe at frame 1500 (60 seconds at 25 fps) for the icon formation, and let the add-on compute the per-drone trajectory.\n\nThe add-on runs the Hungarian algorithm under the hood to match drone-to-target positions while minimising total travel distance. You see the result as animated empties — every drone has its own bezier path.",
      },
      {
        title: "Run the safety validators",
        body: "The 'Safety Check' panel in the Skybrush sidebar exposes the validators: minimum drone-to-drone distance (default 1 m), maximum acceleration, maximum velocity, altitude ceiling, geo-fence breaches.\n\nRun all checks. The add-on highlights any frame where a constraint is violated; tighten the transition timing or formation spacing until every check is green. This is the step that takes the most time; do not skip it. Real drones colliding because the simulator was hand-waved is a much worse Saturday afternoon than tweaking timings.",
      },
      {
        title: "Preview in Blender",
        body: "Press Spacebar. The empties play through the choreography in the viewport. Use Blender's draw types to colour the empties — the Skybrush 'LED Effects' panel will let you author per-drone colour over time, baked into the .skyc export.\n\nIterate until the choreography reads. The viewport is the truth at this stage; the desktop player is for verification.",
      },
      {
        title: "Export to .skyc and open in Skybrush Viewer",
        body: "Skybrush sidebar > Export > Skybrush compiled show (.skyc). The exporter bundles the per-drone trajectories, the LED programme, and the safety report into a single binary.\n\nOpen the .skyc in Skybrush Viewer (the free desktop player). It renders the swarm against a black sky with the timeline scrubbing across the bottom. This is the version you would hand to a pilot or a client for review.",
      },
    ],
    finalResult:
      "A 60-second drone-show sequence — 50 simulated aircraft taking off from a hexagonal grid, traversing collision-checked trajectories, forming a recognisable shape, returning safely to ground. Exported to .skyc, playable in Skybrush Viewer without any hardware. The pipeline the studio uses to prototype every show before it touches the airspace.",
    variations: [
      "Swap the target formation for a parametric one from a Sverchok / Geometry Nodes node tree — animate the parameter and watch the swarm morph.",
      "Author LED colour by sampling a texture — the swarm becomes a flying 3D pixel grid.",
      "Chain three formations with cross-fades for a longer piece; the add-on handles the trajectory recomputation per leg.",
    ],
    troubleshooting: [
      {
        symptom: "Safety check fails on 'minimum distance violation' in mid-transition",
        cause: "Two drones cross paths inside the safety bubble.",
        fix: "Increase transition time, increase formation spacing, or use the add-on's 'Staggered Departure' option to offset takeoff times by 0.5 s per drone.",
      },
      {
        symptom: "Formation has fewer vertices than the swarm",
        cause: "The target mesh isn't large enough to absorb every drone.",
        fix: "Subdivide the mesh or duplicate vertices until the count matches the swarm size.",
      },
      {
        symptom: "The vendored sbstudio Python deps fail to import on first launch",
        cause: "Blender's user-data path was overridden; the add-on can't find its bundled wheel cache.",
        fix: "Reinstall via the official Skybrush installer rather than dropping the folder in by hand — it knows where Blender's add-on path is and writes the vendor wheels alongside.",
      },
    ],
  },
  base,
);
