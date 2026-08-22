"""
WireframeModifier — Toon Ink Geometry Bake for WebXR  (Blender 5.1)
====================================================================
WHY NOT FREESTYLE: WebXR runtimes (Three.js, Babylon.js, PlayCanvas, Needle)
have no Freestyle equivalent. Ink lines must be real polygon geometry to
survive GLB export and render at runtime without extra passes.

Strategy: two separate mesh objects share the same world space.
  hf_fill  — icosphere with flat-shaded fill material (mat slot 0)
  hf_wire  — duplicate with WireframeModifier applied (mat slot 1)

Both travel in one GLB. In Three.js, assign polygonOffset to the wire mesh
to prevent Z-fighting where wire quads cross the fill surface plane.

Outside source: Blender Manual — Wireframe Modifier (CC-BY-SA, Blender Foundation)
https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/wireframe.html
"""

import bpy
import os

# ─── Parameters ───────────────────────────────────────────────────────────────
ICO_SUBDIVISIONS = 2        # 80 triangles — correct low-poly WebXR detail
ICO_RADIUS       = 0.6      # metres
WIRE_THICKNESS   = 0.0095   # tube half-width; ~1.6 % of radius ≈ legible ink line
MAT_OFFSET       = 1        # WireframeModifier shifts wire faces to slot (0 + 1)
FILL_COLOUR      = (0.16, 0.48, 0.78, 1.0)   # cobalt facet fill
WIRE_COLOUR      = (0.015, 0.015, 0.02, 1.0) # near-black ink

# ─── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# ─── Materials ────────────────────────────────────────────────────────────────
def _principled(name, base_colour, roughness=0.35, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = base_colour
    p.inputs["Roughness"].default_value  = roughness
    p.inputs["Metallic"].default_value   = metallic
    return mat

mat_fill = _principled("hf_fill", FILL_COLOUR)
mat_wire = _principled("hf_wire", WIRE_COLOUR, roughness=1.0)

# ─── Fill object ──────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=ICO_SUBDIVISIONS, radius=ICO_RADIUS, location=(0, 0, 0)
)
ico_fill = bpy.context.active_object
ico_fill.name = "hf_fill"

# Flat-shade every face so each polygon has its own constant normal.
# WHY: smooth shading would interpolate across vertices and destroy the faceted look.
for poly in ico_fill.data.polygons:
    poly.use_smooth = False

ico_fill.data.materials.append(mat_fill)   # slot 0 — all fill faces
ico_fill.data.materials.append(mat_wire)   # slot 1 — wire faces (owned by hf_wire)

# ─── Wire object ──────────────────────────────────────────────────────────────
# Duplicate before applying WireframeModifier.  The modifier REPLACES all faces
# with quads, so the original fill faces exist only on ico_fill.
ico_wire      = ico_fill.copy()
ico_wire.data = ico_fill.data.copy()
ico_wire.name = "hf_wire"
bpy.context.collection.objects.link(ico_wire)

wf = ico_wire.modifiers.new("Wireframe", 'WIREFRAME')

# thickness — absolute tube half-width in scene units (metres).
# WIRE_THICKNESS is intentionally small: at ICO_RADIUS=0.6 m a 9.5 mm wire
# reads as a crisp line without covering adjacent faces.
wf.thickness = WIRE_THICKNESS

# use_even_offset=True: distributes offset evenly across all edge lengths.
# WHY: on a subdivided icosphere, edge lengths vary slightly by latitude.
# Without even offset the wire appears thicker near poles — unacceptable for
# a uniform ink-line aesthetic.
wf.use_even_offset = True

# use_relative_offset=False: absolute offset regardless of local edge density.
# True would scale wire width by adjacent-edge length, giving variable-weight
# lines — useful for calligraphic styles but wrong for cel-animation uniform ink.
wf.use_relative_offset = False

# use_boundary=True: include open mesh boundary edges.
# WHY: without this, cuts or open edges (common on exported character parts)
# have no ink line along their rim — the object looks incomplete.
wf.use_boundary = True

# material_offset shifts the wire-quad material index by N above the source face.
# All icosphere faces are at slot 0 → wire quads land at slot 0 + 1 = 1 (mat_wire).
wf.material_offset = MAT_OFFSET

# Apply: bakes wire quads into the mesh data; modifier is consumed.
bpy.context.view_layer.objects.active = ico_wire
bpy.ops.object.modifier_apply(modifier="Wireframe")

# ─── Apply transforms ─────────────────────────────────────────────────────────
for obj in (ico_fill, ico_wire):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ─── Camera + light (preview only, not in export) ─────────────────────────────
bpy.ops.object.camera_add(location=(0, -2.2, 0.6))
cam = bpy.context.active_object
cam.data.lens = 50
bpy.context.scene.camera = cam
bpy.ops.object.constraint_add(type='TRACK_TO')
cam.constraints["Track To"].target = ico_fill
cam.constraints["Track To"].track_axis  = 'TRACK_NEGATIVE_Z'
cam.constraints["Track To"].up_axis     = 'UP_Y'

bpy.ops.object.light_add(type='SUN', location=(2, -2, 3))
sun = bpy.context.active_object
sun.data.energy = 3.0

# ─── GLB export ───────────────────────────────────────────────────────────────
# Exports both objects in one GLB.
# Z-fighting note: wire quads straddle the fill surface plane.
# In Three.js mitigate with: wireMesh.material.polygonOffset = true;
#   wireMesh.material.polygonOffsetFactor = -1;  (push wire slightly toward cam)
#   wireMesh.material.polygonOffsetUnits  = -1;
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = ico_fill

blend_dir = os.path.dirname(bpy.data.filepath)
out_path  = os.path.join(blend_dir or "/tmp", "hf_wireframe_toon.glb")

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
    export_apply=False,   # transforms already applied
    use_selection=True,
    export_yup=True,
)
print(f"[holoflow] → {out_path}")
