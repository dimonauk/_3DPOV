import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function TissueBody() {
  return (
    <>
      <p>
        Tissue is the computational-design add-on that quietly underpins
        most of the studio&rsquo;s tessellated work &mdash; the
        dragon-scale wall panel, the hex-mail bedhead, every
        repeat-pattern surface that needs to drape over a non-flat
        substrate. Alessandro Zomparelli has been maintaining it since
        2015 and it does one thing exceptionally well: take a small
        repeating unit, take a target surface, project the unit onto
        each face of the surface, deform it to match the surface
        curvature, output a single dense mesh.
      </p>

      <p>
        The goal of this tutorial: tessellate a low-poly leaf module
        across a curved surface to produce a dense organic shell suitable
        for printing or rendering. The constraints: do it without
        leaving the viewport, in one sitting, with the standard
        Tissue operators only.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-tissue",
  title: "Tissue — tessellation across curved surfaces in Blender",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Forty-five minutes. Use the Tissue extension's Tessellate operator to project a small leaf module across a curved surface and produce a single dense organic shell. The geometric backbone of the studio's dragon-scale + hex-mail family.",
  Body: TissueBody,
  related: [
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Tutorial — Dragon-Scale Wall Relief",
      note: "Where tessellation meets the bed — the printable side of this geometry.",
    },
    {
      href: "/articles/material-layer-mail-printing",
      label: "Article — Material-Layer Mail Printing",
      note: "The geometry primer the tessellation pipeline is built on.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/tissue/",
      label: "Tissue — extensions.blender.org",
      note: "Official extension listing, install path.",
    },
    {
      href: "https://github.com/alessandro-zomparelli/tissue",
      label: "Tissue on GitHub",
      note: "Source, examples, tutorial gallery.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "Blender 4.2+ with the Tissue extension installed.",
      "Comfortable with the modifier stack and the difference between Object and Edit modes.",
      "A clear mental model of what a 'face' is in topology — Tissue projects one mesh onto every face of another, so quad-vs-tri-vs-ngon matters.",
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
        name: "Tissue (Blender extension)",
        version: "0.3.71+",
        url: "https://extensions.blender.org/add-ons/tissue/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Author the component",
        body: "Add a plane, scale to 1 × 1, drop into Edit Mode, model a simple leaf shape — a flat asymmetric blade with one tip and a stem at the origin. Keep it under 100 verts; Tissue's runtime cost scales with component complexity × target face count.\n\nUV-unwrap the leaf with a basic Smart UV Project so the eventual tessellation carries the material. Exit Edit Mode and rename the object 'Leaf_Component'.",
      },
      {
        title: "Build the target surface",
        body: "Add a Subdivision-Surface-modified plane, scale to 5 × 5, apply two subdivisions. Move some vertices in Edit Mode so the surface curves — a gentle dome works for a first pass.\n\nThe target is going to receive one Leaf_Component per face, so the face count of the target determines the leaf count of the result. A 5 × 5 plane subdivided twice gives 400 faces — 400 leaves.\n\nRename this 'Target_Surface'.",
      },
      {
        title: "Run Tissue > Tessellate",
        body: "Select Target_Surface, hold Shift, select Leaf_Component (component must be the active selection). Open the Tissue tab in the N-panel (3D View > Sidebar > Tissue).\n\nClick 'Tessellate'. A dialog opens — set Mode to 'Constant', Rotation to 'Default', Z-Scale to 1.0. Click OK. Tissue projects one Leaf_Component onto every face of Target_Surface, deformed to match the local curvature.\n\nThe result is a new object, 'Tessellated_<name>', appearing as one unified mesh. The original Leaf_Component and Target_Surface are preserved for re-tessellation.",
      },
      {
        title: "Tune with the live update",
        body: "In the N-panel, Tissue exposes the tessellation parameters live. Change Rotation to 'Random' to break up the regularity — leaves now alternate angles. Change Z-Scale to 0.5 — leaves flatten against the surface. Change Mode to 'Adaptive' — leaves resize proportionally to the size of the face they sit on.\n\nClick 'Update Tessellation' after each change; the tessellated mesh recomputes in-place. Iterate until the surface reads the way you want.",
      },
      {
        title: "Output paths",
        body: "Two paths from here. For render: leave the tessellation as a single mesh, apply a leaf-vein material, render. For print: select Tessellated_<name>, apply scale, run the 3D Print Toolbox's Check All to confirm manifoldness.\n\nFor the studio's dragon-scale pipeline, swap Leaf_Component for the scale module and Target_Surface for a 30° curved panel — the same Tissue call now produces a printable scale-mail panel with curvature baked in.",
      },
    ],
    finalResult:
      "A dense organic shell — 400 leaves projected across a curved surface, each one deformed to local curvature, exported as either a render-ready mesh or a print-ready STL. The same operator handles tens of thousands of components on heavier scenes; the studio uses it for everything from scale-mail panels to architectural lattices.",
    variations: [
      "Swap the leaf for a tetrahedron — the surface becomes a spiked organic crust.",
      "Use the Adaptive mode with a target surface that varies in face size — the components grow and shrink to match.",
      "Animate the Z-Scale parameter to make the surface bloom over time, then bake the animation to render frames.",
      "Combine with the Boolean Tool extension to subtract a scale-mail tessellation from a base panel — produces a perforated cover plate.",
    ],
    troubleshooting: [
      {
        symptom: "Tessellation produces overlapping geometry at the seams",
        cause: "Leaf_Component vertices extend beyond the unit square — Tissue's projection assumes the component fits in 1 × 1.",
        fix: "Re-scale Leaf_Component so all vertices fit inside the unit cube, then re-tessellate.",
      },
      {
        symptom: "Leaves come out perpendicular to the surface instead of flat against it",
        cause: "Component normal is pointing the wrong way — Tissue projects the component along its +Z axis.",
        fix: "Select Leaf_Component, recalculate normals, then ensure the leaf lies in the XY plane with its +Z up.",
      },
      {
        symptom: "Update Tessellation freezes Blender on heavy meshes",
        cause: "Target face count × component vert count exceeds Blender's runtime budget.",
        fix: "Reduce the target's subdivision level for iteration; bump it back up once the parameters are settled, then run one final tessellation.",
      },
    ],
  },
  base,
);
