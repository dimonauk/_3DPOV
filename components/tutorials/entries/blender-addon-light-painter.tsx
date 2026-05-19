import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function LightPainterBody() {
  return (
    <>
      <p>
        Placing lights in Blender is a chore. You add a light, drag it
        across the viewport, rotate it, adjust the cone, render, look
        at the highlight, realise it&rsquo;s in the wrong place, drag
        it back, repeat. Spencer Magnusson&rsquo;s Light Painter
        extension turns the loop inside out: you paint a stroke on the
        surface you want lit, and the add-on places + orients an area
        light to put the highlight on that stroke.
      </p>

      <p>
        The studio uses Light Painter for product-style renders of
        sculptures and printed pieces &mdash; the workflow that wants
        precise highlight placement without ten minutes of light-arm
        wrangling. The goal of this tutorial: paint a single rim-light
        stroke on a sculpture, paint a second key-light stroke,
        render. Twenty minutes from cold.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-light-painter",
  title: "Light Painter — paint highlights, get lights placed for you",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Twenty minutes. Use the Light Painter extension to paint a rim-light and a key-light stroke onto a sculpture's surface; the add-on places, sizes, and orients area lights to put highlights exactly where you painted. The studio's product-render workflow without the light-arm wrangling.",
  Body: LightPainterBody,
  related: [
    {
      href: "/tutorials/lighting-a-waveguide-object",
      label: "Tutorial — Lighting a Waveguide Object",
      note: "The physical lighting companion to this digital workflow.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Where the lit render lands on the website.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/light-painter/",
      label: "Light Painter — extensions.blender.org",
      note: "Official extension listing.",
    },
    {
      href: "https://projects.blender.org/SMagnusson/light-painter",
      label: "Light Painter source — projects.blender.org",
      note: "Maintainer's project page, issues, latest builds.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "20 minutes",
    difficulty: "novice",
    cost: "free",
    prerequisites: [
      "Blender 4.2+ with the Light Painter extension installed.",
      "A model to light. Sculpts, prints, hard-surface objects all work.",
      "An HDRI or solid-colour world set up. Light Painter places key + fill; the world handles ambient.",
    ],
    supplies: {},
    software: [
      {
        name: "Blender",
        version: "4.2+",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Light Painter (Blender extension)",
        version: "1.5.6+",
        url: "https://extensions.blender.org/add-ons/light-painter/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Set the scene + world",
        body: "Open your model. Confirm the camera is in a sensible spot — Light Painter places lights relative to camera direction, so a wrong camera produces nonsense lights.\n\nIn World Properties, set the background to a low-intensity HDRI (the studio uses a 0.2 strength Polyhaven studio HDRI) or a flat dark grey at strength 0.05. The painted lights should dominate the look.",
      },
      {
        title: "Switch into Light Paint mode",
        body: "Select the model. Switch to Edit Mode (Tab). Light Painter's panel appears in the N-panel under the 'Light Paint' tab.\n\nThree paint modes are available: Single, Mesh, Volume. Single is the right starting point — paints a single area light per stroke.",
      },
      {
        title: "Paint the key light",
        body: "Click 'Add Light > Sun / Area / Spot' depending on what you want. Area is the studio default — soft, broad, controllable.\n\nA crosshair cursor appears. Click on the surface where you want the highlight to land, drag to set the highlight's spread, release. The add-on creates an area light, positions it perpendicular to the surface normal at the click point, scales it to match the drag, and points it back at the click point.\n\nViewport render preview (Shift+Z, then 'Rendered' shading) immediately shows the highlight in the right place.",
      },
      {
        title: "Paint the rim light",
        body: "Repeat — click on the opposite side of the model, in a grazing position where you want a rim to read. The add-on places a second area light. Adjust its colour to a warm orange for cinematic separation, or leave white for clean product.\n\nBack in Object Mode, the two area lights appear in the Outliner — fully editable, scrubbable, animatable. Light Painter is a placement tool; the lights are normal Blender lights once created.",
      },
      {
        title: "Tune the per-light controls",
        body: "Each created light has a Light Painter sub-panel in the Light data tab. Adjustable per-light: distance from surface (how far back the area sits), spread angle, falloff curve.\n\nDecrease 'distance' to push the light closer — sharper, harsher. Increase 'spread' to widen the highlight footprint — softer. The viewport updates live.",
      },
      {
        title: "Render and iterate",
        body: "F12. The render shows the model lit by exactly the highlights you painted. Repaint by selecting the corresponding light and using 'Update Position' in the Light Painter sub-panel — repaints the stroke and re-places the light.\n\nFor the studio's product workflow: key + rim + fill (a smaller area pointed at the shadow side) is the canonical three-light setup; Light Painter places all three in under three minutes total.",
      },
    ],
    finalResult:
      "A sculpture lit with exact highlight placement, achieved by painting strokes onto its surface rather than dragging light fixtures around the viewport. The workflow the studio uses for every product render destined for the website.",
    variations: [
      "Use Mesh mode to paint with a mesh-defined light shape — a stroke produces a custom-shaped area light that bends with the surface.",
      "Use Volume mode for atmospheric haze with directional volumetric scattering.",
      "Animate the 'Update Position' over keyframes by re-painting on different frames to author a moving light without manually keyframing transforms.",
    ],
    troubleshooting: [
      {
        symptom: "Painted stroke doesn't produce a highlight where expected",
        cause: "Surface normals are flipped at the click point.",
        fix: "Recalculate normals (Mesh > Normals > Recalculate Outside) before painting. Light Painter reads normals to orient the light.",
      },
      {
        symptom: "Light placed behind the model instead of in front",
        cause: "The model's normals point inward.",
        fix: "Same fix — Recalculate Outside. Or paint on a different face whose normal is correct, then re-attach the light position with Update Position.",
      },
      {
        symptom: "Highlight reads as a single hot dot instead of a soft area",
        cause: "Area light scale too small relative to scene scale.",
        fix: "Increase Light Painter's 'spread' parameter for that light, or scale the area light up directly in the Light Data tab.",
      },
    ],
  },
  base,
);
