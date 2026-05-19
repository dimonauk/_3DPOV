import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function FreestyleSvgBody() {
  return (
    <>
      <p>
        Freestyle is Blender&rsquo;s non-photoreal line renderer
        &mdash; it traces silhouettes, ridges, creases, and material
        boundaries as actual stylised strokes rather than shaded
        pixels. Freestyle outputs a raster image by default; the
        Freestyle SVG Exporter extension lets it write vector instead.
        That single change is what powers the studio&rsquo;s
        screen-print pipeline, the laser-cut + plotter side of the
        bench, and any cel-shaded-looking poster that needs to scale
        without going jagged.
      </p>

      <p>
        The goal of this tutorial: take a low-poly 3D model, render it
        as Freestyle lines, export the lines to .svg, open the SVG in
        Inkscape, and confirm that every stroke is editable as
        scalable vector geometry. The unlock is that &ldquo;rendering&rdquo;
        in this context becomes &ldquo;authoring vector art via a 3D
        viewport&rdquo;.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-freestyle-svg-exporter",
  title: "Freestyle SVG Exporter — turning Blender into a vector renderer",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An hour. Render a low-poly model with Blender's Freestyle line renderer, export the result as scalable vector SVG, and open it in Inkscape with every silhouette + crease as an editable path. The pipeline behind the studio's screen-print + plotter work.",
  Body: FreestyleSvgBody,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly, high-facet shading",
      note: "The aesthetic register Freestyle lines complement directly.",
    },
    {
      href: "/tutorials/calibrating-the-imageprograf-pro-1100",
      label: "Tutorial — Calibrating the ImagePROGRAF Pro-1100",
      note: "The print-side companion when the SVG becomes a poster.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/freestyle-svg-exporter/",
      label: "Freestyle SVG Exporter — extensions.blender.org",
      note: "Official extension listing.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/render/freestyle/index.html",
      label: "Blender manual — Freestyle",
      note: "The underlying line renderer — what the SVG exporter wraps.",
    },
    {
      href: "https://inkscape.org/",
      label: "Inkscape — open-source vector editor",
      note: "The downstream tool for finishing the exported SVG.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an hour",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "Blender 4.2+ with the Freestyle SVG Exporter extension installed.",
      "Familiar with Blender's render settings and the Properties editor.",
      "A low-poly model with clean topology. Hard-surface beats organic — Freestyle reads ridges and creases far better on edge-defined geometry.",
    ],
    supplies: {
      tools: [
        {
          name: "Inkscape (or any SVG editor)",
          note: "Open-source vector editor. Confirms the SVG is editable and offers the final styling pass.",
          suppliers: [
            {
              name: "Inkscape — official downloads",
              url: "https://inkscape.org/release/",
              price: "free",
            },
          ],
        },
      ],
    },
    software: [
      {
        name: "Blender",
        version: "4.2+",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Freestyle SVG Exporter (Blender extension)",
        version: "1.0.0+",
        url: "https://extensions.blender.org/add-ons/freestyle-svg-exporter/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Switch the render engine and enable Freestyle",
        body: "Use Cycles or EEVEE for the render — Freestyle works on both. In the Render Properties tab, scroll to the 'Freestyle' subsection and tick the box.\n\nIn the Output Properties tab, set resolution to whatever the final piece needs — for a screen-print at A2, set 1080p first and rely on the vector output to scale.",
      },
      {
        title: "Author the line style",
        body: "View Layer Properties > Freestyle Line Set has the controls. Default settings produce silhouette lines only; tick 'Crease' to add internal edges, 'Border' for object boundaries, 'Material Boundary' to detect material changes.\n\nIn the Freestyle Line Style block below, set Thickness to a base value (1.0 px is a sensible default; the SVG carries this as the stroke-width attribute), Colour to black, and leave the modifiers empty for a first pass. Variable thickness, dashed lines, calligraphic strokes are all available under the Modifiers panel.",
      },
      {
        title: "Enable the SVG export",
        body: "Render Properties > Freestyle SVG Export. Tick 'SVG Export'. The path defaults to the render output directory. The exporter writes one .svg per frame, named to match the image render.\n\nNote: the exporter writes regardless of whether you also write a raster — the .svg is in addition to the standard render output, not instead of it.",
      },
      {
        title: "Render",
        body: "F12 (or Render > Render Image). Blender renders the scene with the standard engine, then runs the Freestyle pass over the result. The Freestyle pass takes longer than the shading pass on most scenes; that's normal.\n\nWhen the render finishes, an .svg appears in the output directory next to the .png. The .png is the raster preview; the .svg is the deliverable.",
      },
      {
        title: "Open in Inkscape",
        body: "Open the .svg in Inkscape. Every visible line in the render is an editable path. Click a silhouette — the cursor selects a single editable Bezier curve. Drag a vertex; the line updates.\n\nUse Inkscape to colour-fill the closed paths (Object > Fill and Stroke), to add type, to compose multiple Freestyle renders into a single piece. Save the result as a working .svg for plotter / vinyl-cut / screen-print prep.",
      },
      {
        title: "Cross-fade across a sequence",
        body: "For animated SVGs, render the timeline rather than a single frame — the exporter writes one .svg per frame. Use a small Python script (or the studio's animate-svg helper) to read them back as keyframes for a CSS or Lottie animation.\n\nThe usual studio output: 24 SVGs at 1 fps for a one-second rotating sigil, baked into a Lottie file for the website.",
      },
    ],
    finalResult:
      "A clean SVG of a 3D model rendered as scalable vector lines, opened in Inkscape with every silhouette and crease as an editable Bezier path. The pipeline that turns a Blender scene into print-shop output without ever raster-rasterising the line work. Doubles as the path-data source for any web animation that needs hand-drawn-looking strokes.",
    variations: [
      "Set Freestyle to render only the Border, exclude all other line types — produces pure silhouette posters.",
      "Use a calligraphic modifier on the line style to taper strokes by length — adds a hand-drawn quality.",
      "Render an entire timeline with different camera angles per frame — produces a flip-book SVG sequence for storyboards.",
    ],
    troubleshooting: [
      {
        symptom: "No .svg appears next to the rendered .png",
        cause: "The SVG export was enabled but the path is wrong or the directory isn't writable.",
        fix: "Set an absolute output path in Output Properties and confirm Blender can write there. The exporter is silent on permission errors.",
      },
      {
        symptom: "Lines come out hairline-thin in Inkscape",
        cause: "The exporter writes stroke-width in scene-pixel units, which Inkscape may interpret as smaller than expected at A2.",
        fix: "Open the .svg in a text editor and search-replace stroke-width values, or scale all strokes in Inkscape with Edit > Select All > Object > Object Properties > stroke width.",
      },
      {
        symptom: "Crease lines visible in the viewport are missing from the SVG",
        cause: "Freestyle's crease angle threshold defaults to 134°; sharper creases register, softer ones don't.",
        fix: "View Layer > Freestyle > Crease Angle, lower the threshold to 100° to capture more creases. Or mark specific edges in Edit Mode as Freestyle-marked (Edge > Mark Freestyle Edge).",
      },
    ],
  },
  base,
);
