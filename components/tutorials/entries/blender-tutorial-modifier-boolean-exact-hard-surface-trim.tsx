import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function BooleanExactHardSurfaceTrimBody() {
  return (
    <>
      <p>
        Blender 5.1 ships two Boolean solvers:{" "}
        <strong>Fast</strong> (the legacy Carve/BSP path) and{" "}
        <strong>Exact</strong> (halfedge mesh boolean with exact rational
        arithmetic). For trim-sheet work — where cutter faces often share a
        plane with the base mesh — Exact is the only solver that produces
        reliable results. Fast can silently fail or output inverted normals when
        cutter and base surfaces are coplanar or nearly tangent, which is nearly
        every realistic hard-surface scenario. Use Exact by default; only
        fall back to Fast when the mesh is extremely dense and a millisecond of
        solve time actually matters.
      </p>
      <p>
        The modifier stack order is the main conceptual hurdle. A{" "}
        <code>SOLIDIFY</code> modifier must sit above the Boolean stack so that
        cutters pierce the full thickness of the panel, not just the zero-depth
        source plane. A <code>BEVEL</code> modifier placed below all Booleans
        then chamfers every edge the solver creates — including newly cut seams
        — automatically and proportionally, without a single manual edge-select.
        Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
          className={lk}
        >
          Subdiv + Crease + Bevel tutorial
        </Link>{" "}
        for the alternative manual-crease workflow, where bevel weight controls
        are set per-edge in Edit Mode rather than via an automatic angle limit.
        Both approaches are valid; the Boolean stack is faster for complex
        perforated geometry, the manual crease approach gives finer topology
        control for subdivision-heavy props.
      </p>
      <p>
        The cutter objects themselves are ordinary Blender meshes. Organise them
        in a dedicated collection (here: <code>HSP_Cutters</code>), hide the
        collection from the render camera, and the panel always renders clean —
        cutters never appear in EEVEE or Cycles frames or GLB exports. This
        organisation mirrors the instancing approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural"
          className={lk}
        >
          GN Extrude Mesh panel-inset tutorial
        </Link>{" "}
        where sub-mesh panels are hidden per-instance flag rather than per
        collection. For the Geometry Nodes equivalent of Boolean operations
        (non-destructive, parametric), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          GN Mesh Boolean tutorial
        </Link>
        . The GN route is preferable when the cut geometry is itself procedural;
        the modifier route is preferable when cutters are hand-modelled and
        reused across many assets. Both ultimately produce the same GLB via the
        apply-on-duplicate export pattern described in Step 8 below.
      </p>
      <p>
        For WebXR delivery, the finished panel exports at a comfortable 2–4 k
        triangle count depending on bevel segments and port cylinder resolution.
        Run the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate LOD tutorial
        </Link>{" "}
        afterward to generate a mid and low LOD, then wire them into an LOD kit
        with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          AO + Pointiness shader
        </Link>{" "}
        to accentuate the chamfered cut edges at WebXR render distances where
        the bevel geometry is too fine to read geometrically.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-boolean-exact-hard-surface-trim",
  title:
    "Modifier — Boolean: Exact Solver Hard-Surface Trim Sheet (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Stack Object Boolean modifiers using the Exact solver to carve channels, ports, and recesses into a sci-fi panel — non-destructively, with a Bevel modifier auto-chamfering every cut edge.",
  Body: BooleanExactHardSurfaceTrimBody,
};

export const entry = buildInstructable(
  {
    time: "one sitting",
    difficulty: "intermediate",
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/modifiers/modifier-boolean-exact-hard-surface-trim/",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Boolean Exact solver available since 3.0; Harden Normals on Bevel requires 3.3+. All features confirmed stable in 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable adding and deleting objects in the 3D Viewport.",
      "Knows how to open the Properties panel and add a modifier.",
      "Understands object vs edit mode — this tutorial never enters Edit Mode.",
    ],
    steps: [
      {
        title: "Why the Exact solver, and when Fast is acceptable",
        body:
          "The Fast solver uses a BSP (binary-space-partition) algorithm derived from the Carve library. It is fast but assumes that no two surfaces of the two meshes are coplanar or intersect along a shared edge. In practice, trim-sheet cutters nearly always share the top plane of a panel — and that coplanarity produces artefacts: missing faces, duplicated geometry, or inverted normals that only appear after export.\n\nThe Exact solver represents mesh topology as a halfedge graph with rational arithmetic coordinates. It handles coplanar faces, T-intersections, and self-intersecting cutters without numerical failure. The trade-off is roughly 3× the compute time per Boolean. For meshes under 50 k faces that number is still sub-second, so use Exact unconditionally for asset work.\n\nHole Tolerant (mod.use_hole_tolerant = True) is a further Exact sub-mode that handles cutters which do not completely pierce the base mesh — a shallow recess, for example. Always enable it; it adds negligible cost.",
      },
      {
        title: "Modifier stack order: Solidify → Boolean(s) → Bevel",
        body:
          "Blender evaluates modifiers top to bottom. If Solidify sits above the Boolean stack, cutters operate on a mesh that already has full panel depth — they carve channels and ports all the way through. If the order is reversed, the Boolean operates on a zero-thick plane and Solidify then extrudes the cut edges outward, producing flared rather than vertical channel walls.\n\nThe Bevel must sit below all Booleans. Placed above them, it chamfers only the original panel edges; the Boolean-created seams remain sharp. Placed below, it catches every edge the solver creates — new seams, port rims, channel ends — all in one pass. The Angle limit (45° here) prevents the Bevel from also catching the low-angle polygon seams that Exact creates on cylinder port rims.\n\nThe stack:\n  [0] Solidify   — thickness 0.06 m, Offset +1.0 (grow toward +Z)\n  [1] Boolean A  — channel strip (Difference, Exact)\n  [2] Boolean B  — circular port (Difference, Exact)\n  [3] Boolean C  — rectangular inset (Difference, Exact, Hole Tolerant)\n  [4] Bevel      — Width 0.012, Segments 2, Angle 45°, Harden Normals on",
      },
      {
        title: "Building a cutter object: size and placement rules",
        body:
          "A cutter must extend beyond the face it cuts on both sides — if the cutter exactly matches the panel surface, the Boolean solver sees a zero-thickness intersection which can produce edge artefacts. Standard practice:\n\n  • Make the cutter 2–4 mm larger than the cut depth in the pierce axis (Z here).\n  • Offset the cutter centre outward by half that overshoot.\n  • For channels that touch the panel surface (top face) shift the cutter up by 0.01 m so its top face is clearly above the panel surface.\n\nFor the shallow rectangular inset (INSET_DEPTH = 0.035 m inside a 0.06 m panel), the cutter does not pierce to the bottom — enable Hole Tolerant on that Boolean modifier only. The channel and port cutters pierce completely and can run without Hole Tolerant, though it does no harm to leave it on for all three.",
      },
      {
        title: "Harden Normals on the Bevel modifier",
        body:
          "When Bevel creates the chamfer strip between the base panel face and the vertical cut wall, it interpolates vertex normals from neighbouring faces. Without intervention, the chamfer face inherits a smoothed normal that points neither fully upward nor fully inward — which produces a blurry highlight, not the crisp specular line you want on a hard-surface panel.\n\nHarden Normals (mod.harden_normals = True) writes Custom Split Normals on the bevel face: each split normal is taken from the original face the bevel strip is attached to, not interpolated. The chamfer then reflects the same specular environment as the flat face beside it, with a sharp transition at the bevel seam edge. This is the correct technique for stylised material highlights in EEVEE, and it survives GLB export because Custom Split Normals are stored in the mesh topology.\n\nNote: Harden Normals requires 'Auto Smooth' to be active (or equivalent per-face smooth in 4.1+). In Blender 5.1, the mesh-level 'Use Auto Smooth' toggle was removed; custom split normals are active by default when any modifier writes them.",
      },
      {
        title: "Cutter collection: organise and hide from render",
        body:
          "Move all cutter objects into a new collection (M key → New Collection → 'HSP_Cutters'). In the Outliner:\n\n  • Click the eye icon beside the collection to hide it from the viewport (so the cutters don't clutter the view during modelling).\n  • Click the camera icon to exclude the collection from renders — this prevents cutters appearing in EEVEE frames or Cycles passes.\n\nThis does NOT break the Boolean modifiers. Boolean object references resolve against bpy.data.objects, not against scene layer visibility. A hidden-from-render object can still be a Boolean target.\n\nFor batch export scripts (see the Python Batch GLB Exporter tutorial), add a filter:\n\n  if obj.get('holoflow:is_cutter'):\n      continue\n\nblueprint.py sets obj['holoflow:is_cutter'] = True on all cutter objects, so the exporter automatically skips them.",
      },
      {
        title: "Apply-on-duplicate export pattern for GLB",
        body:
          "Never apply modifiers on the working object. Instead:\n\n  1. Duplicate the panel: bpy.ops.object.duplicate(linked=False)\n  2. Iterate dup.modifiers and call bpy.ops.object.modifier_apply on each.\n  3. Call bpy.ops.object.transform_apply(location=True, rotation=True, scale=True).\n  4. Export the duplicate as GLB with Draco level 6, WebP textures, Y-up.\n  5. Delete the duplicate — the original non-destructive stack remains intact.\n\nThis pattern is identical across all modifier-based tutorials in this library. The duplicate is always transient; it exists only for the duration of the export and is deleted immediately afterward. If the script is interrupted before deletion, the duplicate appears in the scene named 'hard_surface_panel_export' — delete it manually and re-run.",
      },
      {
        title: "Partial-depth inset: Hole Tolerant and why it matters",
        body:
          "The rectangular inset cutter sits flush with the panel top face and extends only 35 mm into a 60 mm-thick panel. The cutter does not pierce through to the bottom face — it is an open-bottomed box. Without Hole Tolerant, the Exact solver may fail to generate the inset floor face because it cannot determine which side of the cutter is 'inside' the mesh. The result is a hole in the panel bottom, or a completely missing inset.\n\nHole Tolerant mode performs a flood-fill from the cutter's open edge to determine the interior/exterior boundary. It adds a small overhead (≈10 % per-Boolean on typical meshes) but is essential for any cutter that does not fully pierce the target.\n\nA visual confirmation: after applying the Boolean, enter the Solid viewport and inspect the inset in X-ray mode (Alt+Z). If Hole Tolerant is working correctly, the inset floor is a solid face and the panel bottom is intact.",
      },
      {
        title: "Apply + export GLB via blueprint.py",
        body:
          "Run `blueprint.py` from the Scripting workspace (or `blender --background --python blueprint.py`). The script:\n\n  1. Clears the scene.\n  2. Builds the base panel, solidifies it, adds three cutters, stacks three Boolean modifiers and a Bevel.\n  3. Assigns a dark-slate Principled BSDF material.\n  4. Adds a Sun + Area light and a camera.\n  5. Duplicates the panel, applies all modifiers, exports GLB to:\n       public/library/glbs/modifiers/modifier-boolean-exact-hard-surface-trim/hard_surface_panel.glb\n  6. Deletes the duplicate.\n\nSave the resulting .blend manually (Ctrl+S) as `hard_surface_panel.blend` in the same folder.\n\nFor the viewport turntable recording, open the .blend and run `record.py` — it adds a 90-frame camera orbit and renders to:\n  public/library/videos/modifiers/modifier-boolean-exact-hard-surface-trim/viewport.mp4",
      },
    ],
    finalResult:
      "A non-destructive sci-fi panel with three carved details — a horizontal channel strip, a circular port, and a rectangular shallow inset — all cut using the Boolean Exact solver with Hole Tolerant enabled. A Bevel modifier below the Boolean stack auto-chamfers every cut edge. The modifier stack remains live for revision; a duplicate with applied modifiers exports as a WebXR-ready GLB.",
    variations: [
      "Boolean Union for additive detail: change the modifier Operation from Difference to Union to attach raised rivets, pipe flanges, or panel-lamp housings. Union merges cutter geometry into the base mesh cleanly — bevel still chamfers the union seam. Stack one Union above and Difference below on the same base mesh to model both raised and recessed detail in a single non-destructive object.",
      "Boolean Intersect for silhouette cutting: Intersect retains only the volume shared by base and cutter. Use a low-poly silhouette cutter (an L-shape, a chamfered corner, an organic blob) to trim a regular base mesh to an irregular outline without manual polygon editing. Then stack Difference booleans on the intersected result for interior detail.",
      "Animated cutter for a retractable panel: keyframe a cutter's Z location from inside to outside the panel. The Boolean updates live — the panel appears to open or close. Combine with a Driver linked to a custom property for a slider-controlled mechanical opening that exports as a GLB animation track.",
    ],
    troubleshooting: [
      {
        symptom: "Boolean produces a hole where the cut floor should be",
        cause:
          "The cutter does not fully pierce the base mesh and Hole Tolerant is disabled. The solver cannot determine the interior of an open-bottomed cutter without the flood-fill pass.",
        fix:
          "Enable mod.use_hole_tolerant = True on the Boolean modifier for any cutter that does not completely exit the opposite face of the base mesh. In the Properties panel: Boolean modifier → Solver: Exact → Hole Tolerant toggle → on.",
      },
      {
        symptom: "Bevel chamfers only original panel edges, not cut seams",
        cause:
          "The Bevel modifier sits above the Boolean modifiers in the stack. It runs on the pre-Boolean mesh and sees only the original four panel edges.",
        fix:
          "Drag the Bevel modifier entry below all Boolean entries in the modifier list. In the Properties panel, use the handle (≡) icon to drag modifiers into the correct order: [Solidify] → [Boolean A] → [Boolean B] → [Boolean C] → [Bevel].",
      },
      {
        symptom: "Channel walls are flared outward after Solidify",
        cause:
          "The Solidify modifier sits below the Boolean modifiers. Booleans operate on the zero-thickness source plane; Solidify then extrudes the cut-plane edges sideways instead of growing the channel walls vertically.",
        fix:
          "Move Solidify to position [0] in the modifier stack, above all Boolean modifiers. Apply transforms on the base plane object (Ctrl+A → All Transforms) to reset scale before adding any modifiers.",
      },
      {
        symptom: "Cutter appears in GLB export or EEVEE render",
        cause:
          "The cutter collection is hidden from viewport but not excluded from render, or the export script does not skip objects tagged as cutters.",
        fix:
          "In the Outliner, enable the camera column (click the filter icon → Camera) and disable the camera icon beside the HSP_Cutters collection. For batch GLB scripts: check for obj.get('holoflow:is_cutter') and skip. For manual export: deselect cutters before invoking the GLB exporter, or use Export Selected Only.",
      },
      {
        symptom: "GLB opens in three.js / A-Frame with inverted face normals inside the channel",
        cause:
          "Boolean Exact can leave a small number of faces with flipped normals when cutter and base mesh share a perfectly coplanar face. The Fast solver is more prone to this but Exact is not immune.",
        fix:
          "After applying modifiers on the export duplicate, enter Edit Mode → Select All → Mesh → Normals → Recalculate Outside (Shift+N). This corrects any remaining flipped faces. If specific faces are still wrong: select them and use Flip (Alt+N → Flip). The corrected normals export correctly in GLB.",
      },
    ],
  },
  base,
);
