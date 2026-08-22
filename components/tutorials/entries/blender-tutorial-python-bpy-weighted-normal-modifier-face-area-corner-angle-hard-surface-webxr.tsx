import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>WeightedNormalModifier</code> rewrites the custom normal field on
        the evaluated mesh so that each vertex normal is a weighted blend of its
        adjacent face normals. The standard Blender normal average weights every
        adjacent face equally — which is fine for organic shapes but produces a
        visible shading gradient across every bevel strip on hard-surface props.
        WeightedNormal fixes that gradient at the source: it biases each vertex
        normal toward the largest or widest-angle face, so structural flat zones
        read as perfectly flat while chamfered edges stay crisp. The result
        exports verbatim into the GLB <code>NORMAL</code> buffer.
      </p>
      <p>
        This tutorial builds a chamfered console-lid prop entirely in Python,
        then demonstrates all three weighting modes side-by-side so their
        differences are visible without switching back and forth.
      </p>

      <h2>Why standard averaging fails on bevelled props</h2>
      <p>
        A bevel at width 0.045 m with two segments produces three edge-rings
        around each chamfered corner. The two loop-cut faces on the bevel strip
        are small — roughly 0.0006 m² each — yet in a standard average they
        contribute equally to the shared vertex normal as the vast main face
        (≈ 2.8 m²). The result: the vertex normal on the corner tilts slightly
        away from the main face&apos;s direction, and the viewer sees the
        corresponding highlight or shadow band across the bevel as though the
        surface is curved. WeightedNormal with{" "}
        <code>mode=&apos;FACE_AREA&apos;</code> weights by area ratio, so the
        2.8 m² main face contributes ~2300× more than each bevel strip — the
        vertex normal points almost exactly along the main face and the gradient
        disappears.
      </p>

      <h2>Three modes</h2>
      <pre>{`wn = ob.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')

# FACE_AREA — weight = face.calc_area() / total_adjacent_area
# Best default. Large structural faces dominate; tiny bevel strips suppressed.
wn.mode = 'FACE_AREA'

# CORNER_ANGLE — weight = angle subtended at this vertex inside the face
# Bevel strip faces sit at a narrow incident angle at every shared vert,
# so their contribution is further suppressed relative to FACE_AREA.
wn.mode = 'CORNER_ANGLE'

# FACE_WITH_ANGLE — product of area × angle
# Strongest suppression of bevel strips. Use when the chamfer is wide
# (≥0.1 m) and the gradient is still visible after FACE_AREA.
wn.mode = 'FACE_WITH_ANGLE'`}</pre>

      <h2>The weight slider — 1 to 100</h2>
      <p>
        <code>wn.weight</code> blends between the weighted result (100) and a
        standard area-averaged normal (1). Values below ≈60 make the visual
        difference imperceptible. For production always set 100 and rely on{" "}
        <code>wn.vertex_group</code> masking to dial down specific zones.
      </p>
      <pre>{`wn.weight = 100   # fully weighted — correct default for hard-surface`}</pre>

      <h2>face_influence and sharp edges</h2>
      <p>
        <code>wn.face_influence = True</code> tells the modifier to respect the{" "}
        <code>sharp_edge</code> boolean attribute as a hard shading boundary.
        Without it WeightedNormal bleeds normals across intentionally sharp
        crease edges, softening silhouettes that should read as crisp. Pair
        with <code>wn.use_keep_sharp = True</code> to carry any pre-existing
        sharp flags through the modifier stack unchanged.
      </p>
      <pre>{`wn.face_influence = True   # honour Mark Sharp / sharp_edge attribute
wn.use_keep_sharp  = True   # propagate existing sharp flags downstream`}</pre>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
        >
          sharp_edge / crease_edge / use_seam pipeline
        </Link>{" "}
        for how to author these attributes from Python before applying
        WeightedNormal.
      </p>

      <h2>Modifier stack order — Bevel before WeightedNormal</h2>
      <p>
        This is the most common setup error. WeightedNormal reads the evaluated
        geometry produced by all preceding modifiers. If it appears before
        Bevel, it recalculates normals on the pre-chamfer mesh — which has no
        bevel strips to fix — and the modifier is a no-op on the final result.
      </p>
      <pre>{`# CORRECT — Bevel generates the chamfer, WeightedNormal recalculates on it
bev = ob.modifiers.new("Bevel", 'BEVEL')
bev.width    = 0.045
bev.segments = 2

wn = ob.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')
wn.mode   = 'FACE_AREA'
wn.weight = 100

# WRONG — WeightedNormal runs on the bare box, sees six faces, does nothing
# useful, then Bevel adds strips whose normals are not touched.
wn_first = ob.modifiers.new("WN_wrong", 'WEIGHTED_NORMAL')
bev_after = ob.modifiers.new("Bevel_after", 'BEVEL')`}</pre>
      <p>
        The same rule applies to SubD: if you are using a Subdivision Surface
        for smoother silhouettes, WeightedNormal goes after SubD too — see{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
        >
          SubDiv crease + bevel-weight hard-surface
        </Link>
        .
      </p>

      <h2>Vertex-group masking</h2>
      <p>
        Assigning a vertex group to <code>wn.vertex_group</code> lets the
        weighting blend per-vertex between the full WeightedNormal result
        (group weight 1.0) and a standard average (group weight 0.0). This is
        the correct way to keep organic or curved zones soft while the flat
        panels and frames remain crisp.
      </p>
      <pre>{`vg = ob.vertex_groups.new(name="panel_raised")
# Identify raised panel verts by Z height
z_thresh = PANEL_H * 0.5 + RAISE_H * 0.5
raised_idxs = [v.index for v in ob.data.vertices if v.co.z > z_thresh]
vg.add(raised_idxs, 1.0, 'REPLACE')   # full WeightedNormal on raised face

# Wire into the modifier
wn.vertex_group = vg.name`}</pre>
      <p>
        Do <em>not</em> use <code>invert_vertex_group</code> to affect the
        complement region instead — set explicit weights on both zones for
        predictable blending.
      </p>

      <h2>Building the prop with bmesh.ops.inset_individual</h2>
      <p>
        The raised-panel detail uses <code>bmesh.ops.inset_individual</code> to
        shrink the top face inward by a border width, then{" "}
        <code>bmesh.ops.extrude_face_region</code> to push the inner quad
        upward. This keeps the construction entirely in the direct data API —
        no operator context required.
      </p>
      <pre>{`res = bmesh.ops.inset_individual(
    bm,
    faces=[top_face],
    thickness=INSET_OFFS,   # border ring width in metres
    depth=0.0,
    use_even_offset=True,   # normalise thickness across non-square faces
)
inner = res['faces'][0]     # the shrunken inner quad

ex = bmesh.ops.extrude_face_region(bm, geom=[inner], use_keep_orig=False)
raised_verts = [e for e in ex['geom'] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=raised_verts, vec=(0.0, 0.0, RAISE_H))`}</pre>
      <p>
        <code>use_even_offset=True</code> distributes the inset thickness
        uniformly on non-square quads — without it a wide rectangle insets at
        a different amount in the X and Y directions.
      </p>

      <h2>shade_smooth is a prerequisite</h2>
      <p>
        WeightedNormal operates on the custom normal layer that the smooth
        shading pipeline writes. A flat-shaded face clamps every loop normal
        to the face normal before WeightedNormal can intervene, making the
        modifier a silent no-op.
      </p>
      <pre>{`# Prerequisite — apply smooth shading before adding WeightedNormalModifier.
# Context override required for headless execution.
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.shade_smooth()`}</pre>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
        >
          SMOOTH_BY_ANGLE migration and the auto-smooth removal in 4.2
        </Link>{" "}
        for how to combine angle-based smooth shading with WeightedNormal in
        Blender 5.1 — in particular the correct stack order (SBA before WN).
      </p>

      <h2>GLB export — normals survive verbatim</h2>
      <p>
        The glTF exporter reads the evaluated mesh from the depsgraph
        (<code>export_apply=True</code>). The custom normal layer written by
        WeightedNormal appears in the exported <code>NORMAL</code> accessor
        without any post-processing. Three.js consumes it as authored.
      </p>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath            = EXPORT_GLB,
    use_selection       = True,
    export_format       = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_apply        = True,    # evaluate full modifier stack
    export_normals      = True,    # write NORMAL accessor — mandatory
)`}</pre>
      <p>
        Setting <code>export_normals=False</code> drops the attribute
        entirely and forces Three.js to recompute face normals at runtime —
        discarding the WeightedNormal work. Always leave it on. Related:
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr"
        >
          {" "}NormalEditModifier radial cel-shade
        </Link>{" "}
        covers the same export-normals requirement.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No visible change after adding modifier:</strong> mesh is
          still flat-shaded. Run <code>bpy.ops.object.shade_smooth()</code>{" "}
          first.
        </li>
        <li>
          <strong>Modifier appears to do nothing:</strong> WeightedNormal is
          above Bevel in the stack. Move it below.
        </li>
        <li>
          <strong>Sharp edges softened after WeightedNormal:</strong> set{" "}
          <code>wn.face_influence = True</code> and{" "}
          <code>wn.use_keep_sharp = True</code>.
        </li>
        <li>
          <strong>GLB normals recomputed by Three.js:</strong>{" "}
          <code>export_normals</code> was false or omitted. Re-export with it
          explicitly set to True.
        </li>
        <li>
          <strong>Vertex group has no effect:</strong> confirm group name
          matches <code>wn.vertex_group</code> exactly (case-sensitive).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.WeightedNormalModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.WeightedNormalModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property reference for{" "}
          <code>mode</code>, <code>weight</code>, <code>face_influence</code>,{" "}
          <code>use_keep_sharp</code>, <code>vertex_group</code>,{" "}
          <code>invert_vertex_group</code>. Related: projects.blender.org
          Blender source, developer.blender.org modifier design notes.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/normals/weighted_normal.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Weighted Normal Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — mode diagrams, face
          strength levels, interaction with Bevel and SubD, gotchas around flat
          shading. Related sibling pages: Normal Edit Modifier, Smooth by Angle
          — all in the Normals modifier category.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0) — the bundled glTF exporter; writes the{" "}
          <code>NORMAL</code> accessor from the evaluated custom normal layer.
          Related: KhronosGroup/glTF specification, KhronosGroup/glTF-Sample-Assets.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr",
  title:
    "Python bpy.types.WeightedNormalModifier — Face-Area, Corner-Angle & Face-With-Angle Modes: Hard-Surface Console Lid & GLB Export (Blender 5.1)",
  summary:
    "WeightedNormalModifier rewrites the custom normal field so each vertex normal is weighted toward the largest or widest-angle adjacent face, eliminating the shading gradient that standard normal averaging produces across chamfered bevel strips. This tutorial scripts a hard-surface console-lid prop with bmesh, applies a Bevel modifier followed by WeightedNormal in all three modes (FACE_AREA, CORNER_ANGLE, FACE_WITH_ANGLE) for side-by-side comparison, demonstrates vertex-group masking for per-zone blending, and exports the result to a Draco-compressed GLB where the weighted normals appear verbatim in the NORMAL accessor.",
  tags: [
    "blender",
    "python",
    "scripting",
    "weighted-normal-modifier",
    "normals",
    "hard-surface",
    "bevel",
    "chamfer",
    "modifier",
    "props",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr",
});
