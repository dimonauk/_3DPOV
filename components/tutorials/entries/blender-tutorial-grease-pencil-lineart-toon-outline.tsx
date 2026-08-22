import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GpLineartBody() {
  return (
    <>
      <p>
        The <strong>GP_LINEART modifier</strong> makes Blender raycast the
        scene from the camera&apos;s exact position and trace two classes of
        edge: <em>contour</em> edges where a camera-facing face meets a
        back-facing face (the silhouette), and <em>crease</em> edges where
        adjacent face normals diverge beyond a threshold angle. The result is
        a set of Grease Pencil strokes that live on a separate GP object as an
        ink overlay above the shaded mesh — no post-processing, no Compositor,
        just a modifier that rebuilds its strokes every frame.
      </p>

      <h2>Line Art raycasts geometry, not pixels</h2>
      <p>
        This is the key distinction from Freestyle (which runs as a
        post-render image pass). Line Art operates on the <em>evaluated 3D
        geometry</em> before any pixel is drawn: it walks every edge of the
        source mesh, tests which edges satisfy the selected criteria (contour,
        crease, material boundary), and writes them as world-space polyline
        strokes into the target GP layer. The strokes are genuine 3D objects —
        you can select them, move them, and drive their attributes with other
        modifiers. Because the computation is 3D rather than 2D, the strokes
        never suffer from the anti-aliasing halo that Freestyle occasionally
        produces, and they respect depth ordering automatically.
      </p>

      <h2>Crease threshold: which edges become ink lines</h2>
      <p>
        The crease threshold is a minimum dihedral angle (the angle between two
        adjacent face normals) below which an edge is ignored. A flat plane has
        dihedral = 0° — no crease line regardless of threshold. An icosphere at
        subdivision level 2 has each adjacent pair of triangular faces at
        roughly 68° apart; setting the threshold to 30° means <em>every</em>{" "}
        internal edge exceeds it and produces a stroke. Raise the threshold to
        65° and only the sharpest transitions — near the original 20 icosahedron
        edges — survive. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-custom-split-normals"
          className={lk}
        >
          custom split normals tutorial
        </Link>{" "}
        which uses the same dihedral-angle concept in the opposite direction:
        split normals <em>hide</em> the seam from the renderer, while Line Art
        crease edges <em>draw</em> it explicitly.
      </p>

      <h2>GPv2 vs GPv3 in Blender 5.1</h2>
      <p>
        Blender 5.1 ships two parallel Grease Pencil systems. The legacy GPv2
        object type (<code>GPENCIL</code>, modifier type{" "}
        <code>GP_LINEART</code>) is production-stable and fully documented. The
        new GPv3 object type (<code>GREASEPENCIL</code>, modifier type{" "}
        <code>GREASE_PENCIL_LINEART</code>) landed in 4.3 and is being actively
        refined; several edge-case properties changed signature between 4.3 and
        5.0. This blueprint uses GPv2 because its bpy API is stable and the
        export pipeline is identical. When GPv3 Line Art settles — expected by
        5.2 — the migration is a one-line object-type swap and a modifier-type
        rename. The{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel shader tutorial
        </Link>{" "}
        covers the render-side complement: toon ramp shading on the mesh
        itself. Combine both for a full comic-book look.
      </p>

      <h2>Exporting ink lines to GLB for WebXR</h2>
      <p>
        When you export with <code>export_apply=True</code>, the Line Art
        modifier bakes its current-frame strokes into actual mesh geometry —
        flat quad ribbon strips that follow the camera-space ink positions at
        that frame. Both the toon sphere and its ink shell land in the same GLB
        as sibling objects. In a Three.js or WebXR scene, the ink quads are
        billboard-like planes a fraction of a unit thick; at the typical avatar
        scale they are sub-millimetre, invisible from the side, and read as
        crisp outlines from any angle within ±80° of the bake camera. For a
        dynamic ink shell on an animated character, see the{" "}
        <Link
          href="/tutorials/blender-addon-vrm-format"
          className={lk}
        >
          VRM format add-on tutorial
        </Link>{" "}
        — VRM avatars can carry a separate ink-shell mesh with the same
        armature binding as the body, so the outlines deform with the skeleton.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature weight paint tutorial
        </Link>{" "}
        covers the weight painting you would need for that rig.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-grease-pencil-lineart-toon-outline",
  title:
    "Grease Pencil Line Art — View-Dependent Ink Silhouette and Crease Outlines",
  date: "2026-06-05",
  kind: "tutorial",
  excerpt:
    "Use the GP_LINEART modifier to auto-trace a faceted icosphere's silhouette and crease edges as Grease Pencil strokes — with a full explanation of why the outline shifts every frame when the camera moves, how crease threshold selects which edges become ink, and how both mesh and strokes export together in a WebXR-ready GLB.",
  Body: GpLineartBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    goal: "A flat-shaded icosphere with live ink outlines driven by the GP_LINEART modifier, rendered in EEVEE, exported as a dual-object GLB (mesh + ink shell).",
    supplies: {
      materials: [
        { name: "Blender 5.1" },
        {
          name: "grease_pencil_lineart.blend (generated by blueprint.py)",
        },
      ],
      tools: [
        { name: "GPENCIL object (GPv2)" },
        { name: "GP_LINEART modifier" },
        { name: "EEVEE Next renderer" },
        { name: "bpy (for blueprint.py)" },
      ],
    },
    steps: [
      {
        title: "Create the faceted icosphere",
        body: "Add → Mesh → Ico Sphere: Subdivisions=2, Radius=1.0. In Object Mode, select it and go Object → Shade Flat. Flat shading is non-negotiable here: smooth normals blend across edges and Line Art cannot detect creases on a mesh that looks smooth from the renderer's perspective. Assign a Diffuse BSDF material (Color=#ec8a56, Roughness=1.0) — no specular, no clearcoat, full matte.",
      },
      {
        title: "Create the Grease Pencil object",
        body: "Add → Grease Pencil → Blank. Rename the object to 'lineart_ink'. In Object Data Properties (the green squiggle icon), the layers panel shows a default 'GP_Layer' — rename it to 'Lines'. Create a new material slot: Add Material → New. In the Material Properties with the GP object active, set stroke Color to black (#000000), enable Show Stroke, disable Show Fill. This material is what Line Art will paint its generated strokes with.",
      },
      {
        title: "Add and wire the Line Art modifier",
        body: "With 'lineart_ink' selected, go to Modifier Properties → Add Modifier → Generate → Line Art. Set Source Type = Object, Source Object = toon_sphere. Set Target Layer = 'Lines' and Target Material = ink_stroke_mat (slot 0). Enable Contour and Crease. Set Crease Threshold to 30°. Set Thickness = 3. Switch to Rendered Viewport (Z → Rendered) — ink lines should appear immediately around the sphere's silhouette and along every facet edge.",
      },
      {
        title: "Tune crease threshold live",
        body: "With the modifier panel open and the viewport in Rendered mode, drag Crease Threshold from 1° → 70°. At 1°, every edge draws an ink line and the sphere looks cross-hatched. At 30° (default), the icosphere facets draw cleanly. At 65°, only the 30 original icosahedron crease edges survive. The threshold is the primary artistic control: lower = more detailed, busier; higher = clean, silhouette-dominant. For a character face mesh, 25–40° typically captures every jaw, cheekbone, and eye-socket edge while ignoring near-coplanar skin panels.",
      },
      {
        title: "Observe view-dependence by orbiting the viewport",
        body: "Middle-mouse-drag to orbit the 3D viewport around the sphere. Watch the contour stroke shift continuously — it is always the locus of edges where a front-facing polygon meets a back-facing polygon from YOUR current view. Crease strokes (the internal facet edges) stay fixed on the mesh surface but which ones are camera-visible vs. occluded changes as you orbit. This is the fundamental property that makes Line Art different from a fixed UV-baked outline: every frame is correct for the current camera.",
      },
      {
        title: "Export mesh + ink shell to GLB",
        body: "File → Export → glTF 2.0: Format=GLB, Apply Modifiers=on (this bakes the Line Art strokes at frame 1), Draco Compression Level=6, Image Format=WebP, export all objects (deselect 'Selected Objects'). The GLB contains two primitives: the icosphere mesh and the ink ribbon quads. In Three.js, load normally — the ink quads render as opaque black geometry in front of the mesh at any camera angle near the bake viewpoint.",
      },
    ],
    finalResult:
      "A .blend with a live GP_LINEART modifier: orbit the viewport and watch ink strokes roll around the sphere in real time. An EEVEE render showing warm salmon facets framed by crisp black outlines. A Draco-compressed GLB under 120 KB containing both the toon mesh and the static ink shell.",
    variations: [
      "Animated ink reveal: keyframe Opacity from 0.0 to 1.0 on the Line Art modifier over 30 frames. The ink outlines fade in over the already-visible mesh — a classic reveal animation that reads as if an artist is drawing the outline on screen.",
      "Multi-material boundary lines: assign two materials to the icosphere (upper hemisphere = warm salmon, lower = cool slate). In the Line Art modifier, enable Material Boundary. A clean stroke appears exactly at the equatorial material seam — useful for costume panel lines on a character mesh.",
      "Character ink shell: replace the icosphere with a VRM-compatible head mesh. Parent the GP object to the same armature, enable 'Follow Parent' on the GP layer. The ink silhouette deforms with the rig — the contour rebuilds each pose frame so the outline always reads correctly for the current animation pose.",
    ],
    troubleshooting: [
      {
        symptom: "No ink strokes visible in the rendered viewport",
        cause:
          "Either the viewport is not in Rendered mode, or GP overlays are disabled.",
        fix: "Press Z → Rendered to enter rendered shading mode. Check the Overlays dropdown (top-right of viewport) — ensure 'Grease Pencil' is ticked. If strokes still don't appear, verify that the Target Layer name in the modifier matches the layer name exactly (case-sensitive: 'Lines' ≠ 'lines').",
      },
      {
        symptom: "Contour strokes appear but crease edges do not",
        cause:
          "Crease Threshold is set above the actual dihedral angle of the mesh edges, so no edges qualify.",
        fix: "Lower Crease Threshold toward 1°. For a subdivision-2 icosphere, every edge is ~68° dihedral, so any threshold below 68° should produce crease strokes. If the mesh was smooth-shaded, crease detection may fail — apply Object → Shade Flat first.",
      },
      {
        symptom:
          "GLB exported but the ink lines are missing in the Three.js viewer",
        cause:
          "The GP object was not included in the export, or Apply Modifiers was off so Line Art strokes were not baked into geometry.",
        fix: "Re-export with Apply Modifiers=on and Selected Objects=off (export all). After export, open the GLB in a viewer like gltf.report and confirm two mesh primitives are listed: the icosphere and the GP ribbon strips. If the GP object type is GREASEPENCIL (v3), the gltf exporter in Blender 5.1 may not yet export it — use a GPENCIL (v2) object as this blueprint does.",
      },
    ],
  },
  base,
);
