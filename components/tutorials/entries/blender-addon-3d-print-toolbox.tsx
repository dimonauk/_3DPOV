import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function PrintToolboxBody() {
  return (
    <>
      <p>
        Every printable file the studio ships has gone through the same
        seven checks before it leaves Blender, and the 3D Print Toolbox
        is the panel that runs them. The Toolbox is one of Blender&rsquo;s
        oldest official add-ons &mdash; Campbell Barton wrote the first
        version in 2013 &mdash; and it is the unromantic but essential
        bit of the printable-art pipeline. Manifoldness, wall thickness,
        intersecting faces, overhang angle, mesh volume, sharp edges,
        degenerate geometry: all of it lives in one sidebar.
      </p>

      <p>
        The goal of this tutorial: take a sculpt-mode mesh that looks
        printable but isn&rsquo;t, run it through the Toolbox, fix
        what the validators flag, and export a clean STL with confidence
        that the slicer will not refuse it.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-3d-print-toolbox",
  title: "3D Print Toolbox — Blender's printable-mesh sanity panel",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Thirty minutes at the bench. Take an unverified mesh, run it through the 3D Print Toolbox extension's validators, fix the manifold + wall-thickness + intersecting-face issues it flags, and export a clean STL the slicer will accept on the first attempt.",
  Body: PrintToolboxBody,
  related: [
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Tutorial — Dragon-Scale Wall Relief",
      note: "Where this validator workflow ends up on the bed.",
    },
    {
      href: "/tutorials/from-photograph-to-object",
      label: "Tutorial — From Photograph to Object",
      note: "Photogrammetry-fed meshes that especially need this pass.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/print3d-toolbox/",
      label: "3D Print Toolbox — extensions.blender.org",
      note: "Official extension listing, version history, install.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/addons/mesh/3d_print_toolbox.html",
      label: "Blender manual — 3D Print Toolbox",
      note: "Reference for every operator the add-on exposes.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "30 minutes",
    difficulty: "novice",
    cost: "free",
    prerequisites: [
      "Blender 4.2+ with the 3D Print Toolbox extension installed via Edit > Preferences > Get Extensions.",
      "A mesh you want to print. A sculpt-mode head, a CAD-imported part, a photogrammetry scan — all benefit equally.",
      "Know your printer's minimum feature size — typically 0.4 mm nozzle = 0.8 mm minimum wall.",
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
        name: "3D Print Toolbox (Blender extension)",
        version: "1.3.3+",
        url: "https://extensions.blender.org/add-ons/print3d-toolbox/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Enable the Toolbox panel",
        body: "Edit > Preferences > Get Extensions, search '3D Print', enable. The Toolbox appears in View3D > Sidebar (N) > 3D-Print.\n\nThe sidebar has four sections: Analyse, Clean Up, Statistics, Export. The flow is top-to-bottom — analyse, clean, verify, export.",
      },
      {
        title: "Run Analyse > Check All",
        body: "Select your mesh. Click 'Check All' in the Analyse section. The Toolbox runs through: Solid (manifold), Intersections, Distorted (degenerate faces), Edge Sharp, Overhang, Wall Thickness.\n\nResults appear as numbered counts beside each test. Anything non-zero is a problem. Click the count to highlight the offending geometry in the viewport.",
      },
      {
        title: "Set the print thresholds for your machine",
        body: "Above the Analyse panel, set 'Thickness' to your nozzle's minimum supported wall — 0.8 mm for a 0.4 mm nozzle. Set 'Angle' for overhang to your printer's safe angle (typically 45° unsupported on FDM, anything down to 70° on SLA).\n\nRerun Check All. The Wall Thickness and Overhang results now reflect your machine, not Blender's defaults. This is the step most people skip; it's also why their first prints fail.",
      },
      {
        title: "Clean what you can",
        body: "The Clean Up section has the automatic repairs: Make Manifold (the headline operator — flips normals, fills holes, removes duplicated verts, deletes non-manifold edges), Delete Loose, Degenerate Dissolve, Fix Non-Planar Faces.\n\nRun 'Make Manifold' first. It's destructive, so save first. The operator fixes the majority of validation failures in one click on most meshes.\n\nRe-run Check All. The Solid count should now be 0; Intersections may need manual work if Make Manifold couldn't infer the topology.",
      },
      {
        title: "Hand-fix the rest",
        body: "Anything Make Manifold couldn't fix needs Edit Mode. Use the Toolbox's 'Select' subsection to highlight Non-Manifold, Distorted, or Intersecting faces, then fix in the usual ways — F to fill, J to join, X to dissolve.\n\nThe most common manual fix: two surfaces that intersect but don't share geometry. Boolean Union them (B + Ctrl in the boolean modifier, or Bool Tool extension) so they become a single watertight shell.",
      },
      {
        title: "Read the Statistics panel and export",
        body: "Statistics shows Volume and Area — useful for filament cost estimation. Volume × density (PLA = 1.24 g/cm³) = print weight; weight ÷ kg-price = material cost. The studio rule: if the Volume isn't sensible, the mesh is still broken.\n\nExport > Format = STL (or 3MF if you have the 3MF I/O extension). Apply scale and rotation first via Object > Apply > All Transforms — STL strips the scene graph, so anything not applied is lost.",
      },
    ],
    finalResult:
      "A manifold, wall-thick, non-self-intersecting STL with confidence the slicer will load it on the first attempt. Volume reads sensibly, statistics line up with what the part looks like, and you have a numbered record of what was wrong before so you can fix the source instead of the export next time.",
    variations: [
      "Add a hollow with a 2 mm wall via Mesh > Hollow (in the Toolbox) — useful for resin prints to reduce material.",
      "Use the 'Volume' statistic to compute filament cost in a spreadsheet before committing to the print.",
      "Bake the analysis as a vertex-colour heatmap (wall thickness as cold-to-hot) for visual review of the whole mesh.",
    ],
    troubleshooting: [
      {
        symptom: "'Check All' reports zero issues but the slicer still rejects the mesh",
        cause: "Scale isn't applied; the STL exports in whatever the object's scale was, which can be 0.001 if the mesh came from millimetre CAD.",
        fix: "Object > Apply > All Transforms before export. The STL will then carry the right scale.",
      },
      {
        symptom: "Make Manifold deletes half the mesh",
        cause: "The mesh had so many non-manifold edges that the operator decided the 'inside' was small relative to the 'outside'.",
        fix: "Undo, then run Mesh > Normals > Recalculate Outside first. Then re-run Make Manifold; it now knows which side is which.",
      },
      {
        symptom: "Wall Thickness reports failure on a sculpt that looks thick enough",
        cause: "The sculpt has internal cavities or self-intersections producing thin shell regions.",
        fix: "Run Voxel Remesh first (Object > Voxel Remesh) at 1 mm resolution; the result is a single closed shell with no internal geometry, then re-run the Toolbox.",
      },
    ],
  },
  base,
);
