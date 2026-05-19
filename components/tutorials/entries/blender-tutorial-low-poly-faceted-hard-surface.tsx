import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every asset in the studio&rsquo;s WebXR scenes carries a
        deliberate visual contract: flat shading on geometric faces,
        crisp silhouette edges, zero PBR specularity. The aesthetic
        comes directly from the early PlayStation-era low-poly register
        &mdash; each polygon reads as its own shard of colour, and the
        object communicates through silhouette and proportion rather than
        material surface. Getting that look in Blender 5.1 is not the
        same process it was in 3.x, and getting it to survive a GLB
        export intact is the part most tutorials skip.
      </p>

      <p>
        The mechanism is Blender&rsquo;s <strong>Smooth by Angle</strong>{" "}
        modifier, introduced as the formal replacement for the Auto Smooth
        checkbox that was removed from Object Properties in 4.1. The
        modifier is live and non-destructive: it writes a custom normal
        attribute into the mesh data at render time, and the{" "}
        <code>KhronosGroup/glTF-Blender-IO</code> exporter (the built-in
        glTF exporter) preserves that attribute through GLB export. This
        means the faceting that reads correctly in Blender&rsquo;s
        viewport reads identically in the browser &mdash; no post-export
        surprises, no &ldquo;it looked right in Blender&rdquo; friction.
      </p>

      <p>
        This tutorial builds a wall-mount control panel from scratch: box
        model, inset face, bevel chamfers, Smooth by Angle at 30°, manual
        Sharp marks on the silhouette edges, flat studio-palette material,
        GLB export with Draco compression and WebP textures. The
        companion{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          Low-poly, high-facet shading
        </Link>{" "}
        article covers the theory; the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={ext}>
          Blender-to-site asset pipeline
        </Link>{" "}
        tutorial covers what happens after the GLB is exported.
        The{" "}
        <Link href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds" className={ext}>
          Cohesive low-poly cell-shaded VRM worlds
        </Link>{" "}
        article explains why the studio leans into this register across
        every surface from props to characters.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-low-poly-faceted-hard-surface",
  title: "Faceted low-poly hard-surface in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "One hour. Build a wall-mount control panel using Blender 5.1’s Smooth by Angle modifier — the 4.1+ replacement for the removed Auto Smooth checkbox — mark sharp silhouette edges, assign a flat studio-palette material, and export a GLB that carries the faceting intact into the browser. The foundational hard-surface workflow for the studio’s WebXR aesthetic.",
  Body,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly, high-facet shading",
      note: "The theory behind why the studio uses faceted normals rather than smooth shading for WebXR props.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "How the hard-surface aesthetic connects to character design and overall scene language.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender-to-site asset pipeline",
      note: "What to do with the GLB once it’s exported — the Holoflow WebXR exporter and scene catalogue.",
    },
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Article — Low-poly graphics in VR",
      note: "Performance and perceptual arguments for keeping polygon counts intentionally low in spatial content.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/normals.html",
      label: "Blender Manual — Mesh Normals (CC-BY-SA 4.0, Blender Foundation)",
      note: "Authoritative reference for how Smooth by Angle works internally and how custom normals are stored.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "KhronosGroup/glTF-Blender-IO (Apache-2.0)",
      note: "The built-in Blender glTF exporter. Understanding its normal export path explains why Smooth by Angle survives GLB round-trips. Sibling repos: glTF-Sample-Assets (CC0) and the glTF spec itself.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Sample-Assets",
      label: "KhronosGroup/glTF-Sample-Assets (CC0)",
      note: "Reference GLB files from the Khronos Group — useful for comparing normal export fidelity against known-good assets.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "1 hour",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "Blender 5.1 installed.",
      "Comfortable with Edit Mode, face/edge/vertex select modes, and the modifier stack.",
      "Knows how to orbit, pan, and zoom the 3D viewport without thinking about it.",
      "Has exported at least one GLB from Blender before — the export dialog should not be new territory.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The glTF-Blender-IO exporter ships built-in since 2.80. No add-ons required for this tutorial.",
      },
    ],
    steps: [
      {
        title: "Block out the panel proportions",
        body: "Add a cube (Shift-A > Mesh > Cube). In Object Mode, scale it to panel proportions: S X 0.8 → Enter, S Y 0.07 → Enter, S Z 0.5 → Enter. Then apply the scale immediately — Ctrl-A > Apply Scale. This is non-optional: the GLB exporter bakes the transform on export anyway, but having a clean identity transform prevents confusion if you parent or instance the mesh later.\n\nThe resulting block is 80 cm wide, 7 cm deep, 50 cm tall — the studio's standard wall-mount format, sized to read well against a WebXR room's 3 m walls.",
      },
      {
        title: "Inset the front face",
        body: "Tab into Edit Mode. Switch to Face Select (3 on keyboard). Click the front face — the large +Y face. It should highlight orange.\n\nPress I to Inset. In the operator panel (F9 or bottom-left of viewport), set Thickness to 0.06 and Depth to −0.012. The negative depth extrudes the inner face backward into the block, so the border reads as a raised rail around a recessed panel. This is the key geometric move: one inset, no booleans, clean quads throughout.\n\nExit Edit Mode (Tab).",
      },
      {
        title: "Add bevel chamfers",
        body: "Back in Edit Mode (Tab), select all (A). Press Ctrl-B to start a bevel. Scroll the mouse wheel down once to set Segments to 1 — you want exactly one chamfer loop at each edge, not a smooth round. Move the mouse until the width reads approximately 0.025 m in the header. Click to confirm.\n\nThe bevel does two things: it softens the silhouette under bright lights (avoids the 'floating razor blade' look of unbevelled edges), and more critically, it adds topology at every corner for Smooth by Angle to split normals against. Without this topology, the modifier has no edge to anchor a sharp normal transition on.\n\nExit Edit Mode.",
      },
      {
        title: "Apply Smooth by Angle (Blender 5.1)",
        body: "With the panel selected in Object Mode, right-click in the 3D viewport > Shade Smooth by Angle. A small popup asks for the angle threshold — leave it at 30° and confirm.\n\nBlender adds a 'Smooth by Angle' geometry-node modifier to the stack (visible in the Properties panel > Object Data > Geometry Node Groups, or in the Modifier Properties tab). The modifier computes per-face custom normals: any two faces whose dihedral angle exceeds 30° will shade independently (hard edge). Faces closer than 30° share a smoothed normal.\n\nAt 30°, the steep 90° corners of the panel read as crisp facets. The shallow 5–6° chamfer faces share normals with their neighbours — intentional, since those bevel loops are structural topology, not visual features.",
      },
      {
        title: "Mark silhouette edges Sharp",
        body: "Tab into Edit Mode, switch to Edge Select (2). Select the four vertical edges on the extreme left and right of the panel — these are the silhouette edges when the panel is viewed face-on.\n\nCtrl-E > Mark Sharp. The edges turn cyan. Sharp marks override the Smooth by Angle threshold: regardless of the dihedral angle, these edges will always split normals. This gives the panel a hard outline under side lighting — the cel-silhouette look the studio's art direction requires.\n\nRotate the viewport after marking and watch the terminator (the shadow line) snap to a hard edge at the silhouette. That's the effect we're after.",
      },
      {
        title: "Assign a flat material",
        body: "Properties panel > Material > New. Name it holoflow_flat_dustrose.\n\nSet Base Color to the studio's Dust Rose: hex #D1ADA8 (sRGB 0.820 / 0.680 / 0.660). Set Roughness to 1.0. Set Specular IOR Level to 0.0.\n\nThe cel-shading on the Holoflow site lives in a TSL post-processing pass, not in the GLB material. Sending a flat diffuse with zero specular means the renderer has nothing to fight against — the material is a pure colour target for the post shader to shade over. Any PBR specularity in the asset would bleed through the cel threshold and create ghosting arcs around highlights.\n\nSwitch the viewport to Material Preview (Z menu > Material Preview) to confirm the flat rose appearance.",
      },
      {
        title: "Export to GLB",
        body: "File > Export > glTF 2.0. In the export dialog right panel:\n  Format: GLB\n  Include: Selected Objects (optional — cleaner if you have other objects in scene)\n  Transform: Y Up — checked\n  Data > Mesh: Apply Modifiers — checked\n  Data > Compression: Draco — checked, Level 6\n  Data > Images: WebP format\n  Data > Normals: checked (critical — this is what carries the custom normals)\n\nNavigate to public/library/glbs/low-poly/faceted-hard-surface/ and save as faceted_hard_surface_panel.glb.\n\nAlternatively, run blueprint.py from the command line and it does all of this automatically.",
      },
      {
        title: "Verify in a glTF viewer",
        body: "Drag the GLB into https://gltf.report or the Babylon.js sandbox. Rotate the model under their default light. The faceted shading should read identically to the Blender viewport — same crisp face boundaries, same hard silhouette corners. If the normals look smooth or the faceting has collapsed, the most common cause is that 'Apply Modifiers' was not checked on export, so the Smooth by Angle modifier was not baked into the custom normal attribute.",
      },
    ],
    finalResult:
      "A 680-polygon hard-surface wall panel exported as a ~12 KB GLB (Draco 6). The faceted shading reads correctly in both Blender and any glTF-capable renderer. The file is ready to drop into the Holoflow WebXR sculpture gallery or any three.js scene that reads glTF binary.",
    variations: [
      "Repeat the inset step twice to get two recessed sub-panels — useful for a two-gauge instrument panel.",
      "Add a cylinder boolean (Ctrl-B > Boolean > Difference with a cylinder) for a porthole or ventilation grille. The Smooth by Angle modifier handles the resulting n-gon boundary cleanly.",
      "Set the Smooth by Angle threshold to 15° for a more crystalline faceted read, or 45° for a subtler shading break at just the sharpest corners.",
      "Swap the Dust Rose fill colour for the studio's other palette entries — Steel Blue (#6A8FAA), Celadon (#8FBFB0), or Coal (#1A1A1F) — to build a set of panel variants for a scene.",
      "Export multiple panels as separate GLBs and register them all in the sculpture-gallery catalogue for a WebXR wall of hardware.",
    ],
    troubleshooting: [
      {
        symptom: "Faceting collapsed to smooth shading after GLB export",
        cause: "'Apply Modifiers' was unchecked on export. The Smooth by Angle modifier was not baked into the custom normal attribute, so the viewer received only the base smooth normals.",
        fix: "Re-export with Apply Modifiers checked. Alternatively run blueprint.py which sets export_apply=True unconditionally.",
      },
      {
        symptom: "Shade Smooth by Angle is missing from the right-click menu",
        cause: "Object is in Edit Mode rather than Object Mode when right-clicking.",
        fix: "Tab back to Object Mode, then right-click.",
      },
      {
        symptom: "The bevel produces triangles or n-gons instead of clean quads",
        cause: "The source mesh had non-manifold edges or existing bevel weights before the Ctrl-B operation.",
        fix: "In Edit Mode, Mesh > Clean Up > Merge by Distance first to remove duplicate vertices. Then re-bevel.",
      },
      {
        symptom: "GLB file is unexpectedly large (>500 KB for this mesh)",
        cause: "Draco compression was not applied, or the mesh accumulated too many vertices from the bevel.",
        fix: "Check that Draco is enabled at level 6 in the export dialog. If the mesh has more than ~2000 vertices after bevelling, the bevel width or segment count was set too high.",
      },
    ],
  },
  base,
);
