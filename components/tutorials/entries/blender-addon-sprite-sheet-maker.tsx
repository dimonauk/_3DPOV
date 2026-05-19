import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function SpriteSheetBody() {
  return (
    <>
      <p>
        A sprite sheet is the trick that lets a 2D game show 3D motion
        without paying the 3D runtime cost. You render a 3D model from
        a fixed camera over a rotation, lay every frame out in a grid,
        and the runtime samples the grid by index to play the
        animation. The Sprite Sheet Maker extension automates the
        render-and-grid step for Blender; what you get is a single PNG
        that drops straight into any sprite engine, the studio&rsquo;s
        WebXR Game Framework included.
      </p>

      <p>
        The goal of this tutorial: take a Blender animation of a
        spinning model, render it into a 16-frame rotation sprite
        sheet, with optional pixelation for the studio&rsquo;s
        low-poly-cell-shaded register. Twenty minutes from cold.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-sprite-sheet-maker",
  title: "Sprite Sheet Maker — 3D model to game-ready sprite sheet",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Twenty minutes. Use the Sprite Sheet Maker extension to render a spinning Blender model into a single PNG grid of 16 frames, with optional palette quantisation, drop straight into the WebXR Game Framework's sprite catalogue.",
  Body: SpriteSheetBody,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly, high-facet shading",
      note: "The aesthetic register sprite sheets serve in the framework.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "The sibling pipeline for full 3D assets — sprites are the cheap alternative.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/sprite-sheet-maker/",
      label: "Sprite Sheet Maker — extensions.blender.org",
      note: "Official extension listing.",
    },
    {
      href: "https://github.com/ManasMakde/SpriteSheetMaker/",
      label: "Sprite Sheet Maker — GitHub",
      note: "Source, issues, examples.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "20 minutes",
    difficulty: "novice",
    cost: "free",
    prerequisites: [
      "Blender 5.1+ with the Sprite Sheet Maker extension installed (it requires 5.1 as a minimum).",
      "A model centred at world origin — sprite sheets assume a fixed orbiting camera.",
      "A clear idea of the frame count needed: 8 frames for chunky retro rotation, 16 for smoother, 32 for almost-seamless. Higher counts mean larger sheets.",
    ],
    supplies: {},
    software: [
      {
        name: "Blender",
        version: "5.1+",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Sprite Sheet Maker (Blender extension)",
        version: "5.1.3+",
        url: "https://extensions.blender.org/add-ons/sprite-sheet-maker/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Ships its own pillow wheel for the pixelation pass.",
      },
    ],
    steps: [
      {
        title: "Centre the model and set up the camera",
        body: "Move the model so its origin is at world origin. Add a camera, parent it to an empty placed at world origin, and rotate the empty 360° over the timeline (one keyframe at frame 1 with Z rotation 0°, one at frame 17 with Z rotation 360°).\n\nSet the timeline end to 16 — Sprite Sheet Maker will render one frame per timeline frame.",
      },
      {
        title: "Set the render resolution",
        body: "Properties > Output > set Resolution to the per-cell size you want (128 × 128 is typical for retro sprites, 256 × 256 for smoother). The final sheet is grid_w × grid_h cells, so 4 × 4 of 128² is a 512 × 512 PNG.\n\nSet Output > File Format to PNG with RGBA — transparency is essential for the sprite to read against arbitrary backgrounds.",
      },
      {
        title: "Open the Sprite Sheet Maker panel",
        body: "The panel lives in View3D > Sidebar > Sprite Sheet. Set Rows to 4, Columns to 4 (= 16 frames). Set Frame Range to 'Use Scene' to render the 16 timeline frames you authored.",
      },
      {
        title: "Optional — enable pixelation",
        body: "For the studio's low-poly-cell-shaded register, enable Pixelation. Set the target pixel size (64 × 64 inside a 128 × 128 cell gives a chunky retro feel; 96 × 96 keeps more detail).\n\nChoose a palette: the extension ships with Pico-8, Apollo, Dawnbringer-32, Endesga-32. Apollo and Dawnbringer-32 are the studio's defaults for character work; Pico-8 for HUD elements.",
      },
      {
        title: "Render the sheet",
        body: "Click 'Render Sprite Sheet' in the panel. Sprite Sheet Maker renders every timeline frame, applies the per-frame pixelation if enabled, and stitches the result into a single PNG.\n\nThe output appears in the directory configured at the top of the panel. One file, transparent background, exact grid layout, ready for use.",
      },
      {
        title: "Drop into the framework",
        body: "For the WebXR Game Framework: copy the PNG to public/sprites/<your-sprite>.png, register it in the sprite catalogue with grid dimensions (rows × columns) and frame rate. The runtime samples the grid by frame index — frame 0 is top-left, advancing left-to-right then top-to-bottom.\n\nFor other engines: the framework convention matches Phaser, Pixi, Unity's SpriteSheet importer, Godot's AnimatedSprite — the sheet is universal once it exists.",
      },
    ],
    finalResult:
      "A single transparent PNG containing 16 frames of a rotating 3D model on a 4 × 4 grid, optionally pixelated to a palette of your choice. Ready to drop into the WebXR Game Framework as a sprite, or into any 2D engine that consumes sheet PNGs. Per-frame render cost is paid once; runtime cost is the cheapest 2D draw call.",
    variations: [
      "Render an attack / idle / walk animation as separate sheets — store as three PNGs and switch sheets at runtime per state.",
      "Use a higher row count (8 × 8 = 64 frames) for almost-fluid rotation — the framework will sample at the runtime's chosen fps.",
      "Render with the freestyle line renderer enabled for cel-shaded sprites with crisp outlines.",
      "Combine with the studio's screen-print pipeline — the same sheet renders into a poster artwork.",
    ],
    troubleshooting: [
      {
        symptom: "Frames render but the sheet output is blank",
        cause: "Per-cell PNG has alpha = 0 because EEVEE's transparent film wasn't enabled.",
        fix: "Properties > Render > Film > tick 'Transparent'. The sheet stitcher composites the per-frame PNGs; if they're invisible, the sheet is invisible.",
      },
      {
        symptom: "Pixelation produces a jagged dither rather than clean blocks",
        cause: "Resolution was set too high for the pixelation target — the down-sample is interpolating.",
        fix: "Set the render resolution equal to the pixelation resolution (e.g. render at 64 × 64 if pixelation target is 64 × 64). The cells then stretch back up on output without resampling.",
      },
      {
        symptom: "Model drifts across cells between frames",
        cause: "Model origin not at world origin, or camera parent rotation not centred on the model.",
        fix: "Apply origin to geometry (Object > Set Origin > Origin to Geometry), then place the camera-parent empty at world origin. The model now stays centred per frame.",
      },
    ],
  },
  base,
);
