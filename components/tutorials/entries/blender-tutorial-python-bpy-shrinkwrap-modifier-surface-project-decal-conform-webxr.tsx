import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.ShrinkwrapModifier</code> projects a source mesh&apos;s
        vertices onto a target surface through four distinct algorithms. For
        WebXR scene dressing the canonical pattern is{" "}
        <code>wrap_method=&#39;PROJECT&#39;</code> along{" "}
        <code>-Z</code> combined with{" "}
        <code>wrap_mode=&#39;ABOVE_SURFACE&#39;</code>: each vertex shoots a
        downward ray, lands on the first hit, then lifts 0.002 m along the{" "}
        <em>local hit normal</em> — not world Z — so the decal sits at a
        consistent visual gap above any slope. Applied once to a subdivided
        flat quad, it turns a hand-authored ground marker into a terrain-hugging
        decal in a single modifier pass.
      </p>

      <h2>Four projection modes</h2>
      <p>
        Choose by what you know about the source–target relationship:
      </p>
      <pre><code>{`mod.wrap_method = 'NEAREST_SURFACEPOINT'
# BVH nearest-surface. No axis bias; works anywhere.
# Failure mode: concave targets where multiple surface points are equidistant
# cause random flipping between nearby faces on consecutive updates.

mod.wrap_method = 'PROJECT'
# Ray along a configurable axis; first hit wins.
# Best for: decals, floor stickers, wall panels, any "project downward" task.
# Requires: use_project_x/y/z + use_positive/negative_direction.

mod.wrap_method = 'NEAREST_VERTEX'
# Snaps to the nearest TARGET VERTEX — not the surface face.
# Result is faceted (vert-to-vert snap). Use for stylised low-poly conform.

mod.wrap_method = 'TARGET_PROJECT'
# Ray along the TARGET's surface normals.
# Best for: wrapping a flat label onto a VRM character body without pinching.
# The ray direction varies per vert based on what's underneath, not a global axis.`}</code></pre>

      <h2>Projection axis and direction flags</h2>
      <p>
        PROJECT mode requires an explicit axis. Both flags must be set together:
      </p>
      <pre><code>{`mod.use_project_z          = True   # select Z axis
mod.use_negative_direction = True   # invert to -Z (downward)
mod.use_positive_direction = False  # no upward ray

# To shoot upward (-Z target above source):
mod.use_project_z          = True
mod.use_positive_direction = True
mod.use_negative_direction = False

# Bidirectional — source can be above OR below target:
mod.use_positive_direction = True
mod.use_negative_direction = True
# Use bidirectional only when placement relative to target is uncertain.
# It costs two ray casts per vertex; stick to single-direction for performance.`}</code></pre>

      <h2>wrap_mode and ABOVE_SURFACE</h2>
      <pre><code>{`mod.wrap_mode = 'ON_SURFACE'
# Lands exactly on surface. offset=0 clips into target for thin decals.

mod.wrap_mode = 'ABOVE_SURFACE'
mod.offset    = 0.002   # metres
# OFFSET is measured along the LOCAL HIT NORMAL, not world Z.
# A 45° slope gets exactly 0.002 m clearance perpendicular to the face —
# not 0.0014 m (world-Z would give cos(45°) × 0.002).
# Required for WebXR decals to prevent Z-fighting in Three.js and Babylon.js.

mod.wrap_mode = 'OUTSIDE'
# Offset along world axis. Uniform only on horizontal surfaces; avoid for decals.`}</code></pre>

      <h2>Building the dome target</h2>
      <p>
        An icosphere is preferred over a UV sphere: the UV sphere&apos;s dense
        poles compress the BVH tree unevenly, causing slower ray queries near
        the apex. Icosphere triangles have uniform area at each subdivision
        level, so BVH depth is consistent across the surface.
      </p>
      <pre><code>{`import bpy, bmesh, math

DOME_SUBDIVISIONS = 4   # 1 280 triangles; fast BVH, enough surface detail
DOME_RADIUS       = 1.40

bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=DOME_SUBDIVISIONS,
    radius=DOME_RADIUS,
    location=(0.0, 0.0, 0.0),
)
dome = bpy.context.active_object
dome.name = "hf_dome_target"

# Clip to upper hemisphere
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(dome.data)
bm.verts.ensure_lookup_table()
below = [v for v in bm.verts if v.co.z < -0.001]
bmesh.ops.delete(bm, geom=below, context='VERTS')
bmesh.update_edit_mesh(dome.data)
bpy.ops.object.mode_set(mode='OBJECT')

# Noise displacement — bake before shrinkwrap so BVH builds on final geometry
tex = bpy.data.textures.new("dome_noise", 'CLOUDS')
tex.noise_scale = 0.45
tex.noise_depth = 4
disp = dome.modifiers.new("Noise", 'DISPLACE')
disp.texture        = tex
disp.strength       = 0.20
disp.texture_coords = 'LOCAL'   # avoid world-scale jitter when dome is moved

bpy.context.view_layer.objects.active = dome
with bpy.context.temp_override(selected_objects=[dome]):
    bpy.ops.object.modifier_apply(modifier="Noise")`}</code></pre>

      <h2>The decal quad — subdivision is the key</h2>
      <p>
        PROJECT mode snaps each vertex independently. A flat quad with four
        verts projects its corners but the interior stays flat. Eight
        subdivisions per side yields 81 verts, each mapping to its own hit
        point — the decal drapes smoothly over the dome curvature.
      </p>
      <pre><code>{`DECAL_HALF  = 0.32   # half-extent (m)
DECAL_CUTS  = 8      # subdivisions per side → (DECAL_CUTS+1)² = 81 verts
DECAL_LIFT_Z = 0.12  # above dome apex — ray must start clear of surface

bm = bmesh.new()
# create_grid size is the HALF-extent; grid spans -size…+size on each axis
bmesh.ops.create_grid(
    bm, x_segments=DECAL_CUTS, y_segments=DECAL_CUTS, size=DECAL_HALF
)

# Set UV BEFORE conform — ShrinkwrapModifier does not touch UV coordinates.
# Planar projection in object space maps cleanly to the decal texture.
uv_layer = bm.loops.layers.uv.new("UVMap")
for face in bm.faces:
    for loop in face.loops:
        co = loop.vert.co
        loop[uv_layer].uv = (
            (co.x + DECAL_HALF) / (2.0 * DECAL_HALF),
            (co.y + DECAL_HALF) / (2.0 * DECAL_HALF),
        )
bm.normal_update()
mesh = bpy.data.meshes.new("hf_decal_mesh")
bm.to_mesh(mesh); bm.free()

obj = bpy.data.objects.new("hf_decal", mesh)
bpy.context.collection.objects.link(obj)
# Start above dome apex — downward rays must clear the target completely
obj.location = (0.0, 0.0, DOME_RADIUS + DECAL_LIFT_Z)`}</code></pre>

      <h2>Applying the modifier</h2>
      <pre><code>{`OFFSET = 0.002   # ABOVE_SURFACE normal lift (m)

bpy.context.view_layer.objects.active = decal
mod = decal.modifiers.new("Shrinkwrap_Conform", 'SHRINKWRAP')
mod.wrap_method            = 'PROJECT'
mod.target                 = dome          # bpy.types.Object — not name string
mod.offset                 = OFFSET
mod.wrap_mode              = 'ABOVE_SURFACE'
mod.use_project_z          = True
mod.use_negative_direction = True
mod.use_positive_direction = False
mod.use_invert_cull        = False   # test both sides — dome is a thin shell

with bpy.context.temp_override(selected_objects=[decal]):
    bpy.ops.object.modifier_apply(modifier="Shrinkwrap_Conform")

# Normals after conform still point +Z (pre-conform flat-quad default).
# recalc_face_normals reorients them to follow the dome curvature outward.
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(decal.data)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.normal_update()
bmesh.update_edit_mesh(decal.data)
bpy.ops.object.mode_set(mode='OBJECT')`}</code></pre>

      <h2>Vertex group masking — partial conform</h2>
      <p>
        Set <code>mod.vertex_group</code> to restrict the shrinkwrap to a named
        group. Verts outside the group stay at their original positions; verts
        inside conform fully; weights blend between.
      </p>
      <pre><code>{`# Pin the decal corners so they don't wander off the dome edge:
vg = decal.vertex_groups.new(name="conform_mask")
mesh = decal.data
corner_indices = [
    i for i, v in enumerate(mesh.vertices)
    if abs(v.co.x) > DECAL_HALF * 0.8 and abs(v.co.y) > DECAL_HALF * 0.8
]
vg.add(corner_indices, 0.0, 'REPLACE')   # weight 0 = pinned (no conform)

# All other verts default to weight 1 once they are in the group at weight 1:
interior = [i for i in range(len(mesh.vertices)) if i not in corner_indices]
vg.add(interior, 1.0, 'REPLACE')         # weight 1 = full conform

mod.vertex_group  = "conform_mask"
mod.invert_vertex_group = False`}</code></pre>

      <h2>Troubleshooting</h2>
      <pre><code>{`# Problem: decal verts stay in original flat position after apply.
# Cause A: decal is BELOW the dome; -Z ray never hits surface.
#   Fix: raise obj.location.z above DOME_RADIUS + any displacement peak.
# Cause B: use_negative_direction=False (rays shoot upward).
#   Fix: set use_negative_direction=True.
# Cause C: target not assigned. mod.target must be a bpy.types.Object reference.
#   Fix: mod.target = bpy.data.objects["hf_dome_target"]

# Problem: inverted normals on decal (blue in Face Orientation overlay).
# Cause: recalc_face_normals not run after apply, OR dome normals point inward.
#   Fix: run recalc_face_normals on decal; ensure dome normals point outward too.

# Problem: Z-fighting flicker in Three.js.
# Cause: offset=0 or ON_SURFACE mode lands decal exactly on dome surface.
#   Fix: use ABOVE_SURFACE + offset=0.002 (or 0.003 for larger scenes).
#   Three.js fix: material.polygonOffset=true; polygonOffsetFactor=-1.`}</code></pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr" className={lk}>
            mathutils.bvhtree Raycast Surface Scatter
          </Link>{" "}
          — the manual Python BVHTree approach for custom scatter tools; compare
          and contrast with the modifier-based conform pipeline here.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-projection" className={lk}>
            GN Raycast Terrain Decal Projection
          </Link>{" "}
          — the Geometry Nodes version of terrain decal projection; this Python
          tutorial is the scripted equivalent for batch / headless workflows.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr" className={lk}>
            Sharp Edge, Crease &amp; Seam Attribute Pipeline
          </Link>{" "}
          — sharp edges on the dome target affect how ShrinkwrapModifier&apos;s
          NEAREST_SURFACEPOINT mode handles creased regions.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr" className={lk}>
            BooleanModifier + WeldModifier Compound Prop
          </Link>{" "}
          — partner tutorial covering the modifier-apply pipeline and
          export_apply=False pattern used identically here.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/shrinkwrap.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Shrinkwrap Modifier — Blender Manual
          </a>{" "}
          (CC-BY-SA-4.0). Canonical documentation for all four wrap methods,
          wrap modes, and the projection axis flags. Related:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.ShrinkwrapModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.ShrinkwrapModifier API
          </a>
          ,{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          KhronosGroup —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0). The bundled Blender GLB exporter;{" "}
          <code>export_apply=False</code> here because the modifier was applied
          manually before export. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF spec
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr",
    title:
      "Python bpy.types.ShrinkwrapModifier — PROJECT Mode Surface Conform: Decal Projection, ABOVE_SURFACE Offset & GLB Export for WebXR (Blender 5.1)",
    blurb:
      "ShrinkwrapModifier in PROJECT/-Z/ABOVE_SURFACE mode is the canonical terrain-decal recipe: each vert of a subdivided flat quad shoots downward, lands on the first hit, then lifts 0.002 m along the local normal. Learn the four wrap_method trade-offs, why ABOVE_SURFACE beats ON_SURFACE + world-offset for tilted faces, the subdivision density rule, normal repair after apply, and the vertex-group partial-conform mask technique.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "shrinkwrap",
      "modifier",
      "decal",
      "terrain",
      "surface-conform",
      "glb",
      "webxr",
    ],
    difficulty: "intermediate",
  }
);
