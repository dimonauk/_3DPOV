"""
blueprint.py — bpy.types.BuildModifier
Faceted Crystal Geode — Z-Sorted Face-Reveal Growth  ·  Blender 5.1  ·  CC0
Studio: holoflow_webxr_exporter

──────────────────────────────────────────────────────────────────────────────
bpy.types.BuildModifier (type='BUILD')

  Reveals faces over time by suppressing them in the evaluated mesh.  Unlike
  visibility keyframes, the Build modifier operates below the depsgraph: the
  modifier strips faces from the geometry before any downstream modifier sees
  them.  At frame F, the number of visible faces is:

      visible = clamp(
          round(total_faces * (F - frame_start) / frame_duration),
          0, total_faces
      )

  Key properties
  ──────────────
  frame_start    — timeline frame when the first face appears (default 1).
  frame_duration — how many frames the full build takes (default 100).
  use_random_order — if False, faces are revealed in mesh-index order;
                     if True, a seeded Fisher-Yates shuffle is applied.
  seed           — random seed for the shuffle (only if use_random_order).
  use_reverse    — if True, face REMOVAL is driven by the same schedule,
                   creating a demolish effect (last-in, first-out).

  CRITICAL: what Build modifier reveals = face INDEX order
  ─────────────────────────────────────────────────────────
  In sequential mode (use_random_order=False), face 0 appears at frame_start,
  face 1 at frame_start + step, …  The index order in the .blend determines
  the visual growth order.  Controlling that index order is the craft of this
  tutorial.  Python gives full control:

      bm.faces.sort(key=lambda f: f.calc_center_median().z)

  followed by bm.to_mesh() writes the sort order permanently.  Thereafter
  the Build modifier grows bottom-to-top without any random seed.

  Depsgraph snapshot — reading mid-build geometry headlessly
  ──────────────────────────────────────────────────────────
  The modifier does NOT produce visible geometry until the scene evaluates it.
  To capture an intermediate mesh (e.g. at frame 30):

      scene.frame_set(30)                          # advance timeline
      dg  = bpy.context.evaluated_depsgraph_get()
      ev  = ob.evaluated_get(dg)                   # evaluated object
      snp = bpy.data.meshes.new_from_object(ev, depsgraph=dg)

  bpy.data.meshes.new_from_object() with depsgraph= is the Blender 4.0+ API
  for headless evaluated-mesh extraction.  It is context-free (no 3D Viewport
  needed) and produces a plain Mesh ready for GLB export via a temporary
  wrapper object.

  _reveal_order attribute for WebXR
  ──────────────────────────────────
  Because Build modifier output varies per-frame, a single static GLB cannot
  carry timing information.  This blueprint writes a face-domain INT attribute
  '_reveal_order' to the base mesh so Three.js can reconstruct the reveal:

      mat_reveal_order = me.attributes.new('_reveal_order', 'INT', 'FACE')
      for idx, face in enumerate(sorted_faces):
          mat_reveal_order.data[face.index].value = idx

  In Three.js, read _reveal_order from the glTF extras / accessors, sort
  triangles by their face's reveal_order, then step through them over time.

Production prop: Faceted Crystal Geode
  icosphere(subdiv=1) → poke each face upward for spike crystal facets →
  Z-sort faces (bottom-to-top growth) → BuildModifier(duration=80) →
  5 depsgraph snapshots → individual stage GLBs → final-state GLB with
  _reveal_order attribute.
──────────────────────────────────────────────────────────────────────────────
"""

import bpy, bmesh, math, os
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
ICO_SUBDIV     = 1         # icosphere subdivisions → 80 triangular faces
POKE_HEIGHT    = 0.18      # spike height per face; drives crystal pointiness
SCALE_Z        = 1.55      # elongate base icosphere into a cluster column
BUILD_FRAMES   = 80        # frame_duration for the modifier
STAGE_COUNT    = 5         # number of snapshot GLBs exported (0..STAGE_COUNT-1)
DRACO_LEVEL    = 6
EXPORT_YUP     = True      # +Y up for WebXR

_here      = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
BLENDS_DIR = os.path.normpath(os.path.join(
    _here, "..", "..", "blends", "scripting",
    "python-bpy-build-modifier-face-reveal-crystal-growth-webxr",
))
GLBS_DIR   = os.path.normpath(os.path.join(
    _here, "..", "..", "glbs", "scripting",
    "python-bpy-build-modifier-face-reveal-crystal-growth-webxr",
))
os.makedirs(BLENDS_DIR, exist_ok=True)
os.makedirs(GLBS_DIR,   exist_ok=True)

# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end   = BUILD_FRAMES + 10   # headroom beyond last frame

# ── Build crystal geode mesh ───────────────────────────────────────────────────
mesh = bpy.data.meshes.new("hf_crystal_geode")
bm   = bmesh.new()

# Start with a subdivided icosphere — 80 triangular faces at subdiv=1
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIV, radius=0.9,
                            matrix=__import__("mathutils").Matrix.Identity(4),
                            calc_uvs=False)

# Scale along Z to form a columnar cluster shape before poking
for v in bm.verts:
    v.co.z *= SCALE_Z

bm.faces.ensure_lookup_table()

# Poke every face into an outward-pointing pyramid spike.
# bmesh.ops.poke splits each face into N triangles meeting at a central apex.
# We then move that apex outward along the face normal to create a spike.
poke_result = bmesh.ops.poke(bm, faces=list(bm.faces))

# Apex verts are those with valence == N (connected to each edge of the face).
# A simpler approach: all poke-created verts are in poke_result['verts'].
for apex in poke_result['verts']:
    # Average normal of surrounding faces (all fan triangles point same way)
    avg_normal = Vector((0, 0, 0))
    for link_face in apex.link_faces:
        avg_normal += link_face.normal
    if avg_normal.length > 0.001:
        avg_normal.normalize()
    apex.co += avg_normal * POKE_HEIGHT

bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

# ── Z-sort faces for bottom-to-top build order ────────────────────────────────
# bm.faces.sort() is the correct bmesh in-place sort (3.x+/5.1).
# Sorts by the lambda return value, ascending — lowest Z first.
bm.faces.sort(key=lambda f: f.calc_center_median().z)
bm.faces.ensure_lookup_table()
total_faces = len(bm.faces)

bm.to_mesh(mesh)
bm.free()
mesh.update()

# ── Write _reveal_order face attribute ────────────────────────────────────────
# After bm.faces.sort() + bm.to_mesh(), face i in mesh == index i in the sort.
# The Build modifier (sequential mode) reveals face 0 first, face N-1 last —
# same order as the sorted face indices.
rev_attr = mesh.attributes.new("_reveal_order", 'INT', 'FACE')
for i in range(total_faces):
    rev_attr.data[i].value = i   # face 0 = first revealed, face N-1 = last

# ── Materials ─────────────────────────────────────────────────────────────────
def _mat(name, r, g, b, roughness=0.28, metallic=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (r, g, b, 1)
    bsdf.inputs["Roughness"].default_value   = roughness
    bsdf.inputs["Metallic"].default_value    = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value  = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 0.45
    return mat

mat_crystal = _mat("hf_crystal", 0.48, 0.78, 1.00,
                   roughness=0.12, metallic=0.0,
                   emission=(0.35, 0.60, 1.00))
mat_base    = _mat("hf_crystal_base", 0.20, 0.22, 0.28,
                   roughness=0.55, metallic=0.05)

mesh.materials.append(mat_crystal)

# ── Object ────────────────────────────────────────────────────────────────────
ob = bpy.data.objects.new("hf_crystal_geode", mesh)
scene.collection.objects.link(ob)

# Flat shading for faceted look
for poly in mesh.polygons:
    poly.use_smooth = False

# ── BuildModifier ─────────────────────────────────────────────────────────────
mod               = ob.modifiers.new("CrystalGrowth", 'BUILD')
mod.frame_start   = 1
mod.frame_duration = BUILD_FRAMES
mod.use_random_order = False   # sequential = index-ordered = Z-sorted growth
mod.use_reverse   = False

# ── Lighting ──────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("Sun", 'SUN')
sun.energy = 3.0
sun_ob = bpy.data.objects.new("Sun", sun)
sun_ob.rotation_euler = (math.radians(55), 0, math.radians(30))
scene.collection.objects.link(sun_ob)

scene.render.engine  = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 0.65
scene.eevee.bloom_intensity = 0.28

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("Cam", cam_data)
cam_ob.location = (0, -3.6, 1.2)
cam_ob.rotation_euler = (math.radians(75), 0, 0)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

# ── Depsgraph snapshots — 5 growth stages ────────────────────────────────────
def export_snapshot(frame_num, stage_idx):
    """Evaluate modifier at frame_num and export a static GLB."""
    scene.frame_set(frame_num)
    dg  = bpy.context.evaluated_depsgraph_get()
    ev  = ob.evaluated_get(dg)
    snp = bpy.data.meshes.new_from_object(ev, depsgraph=dg)

    snp_ob = bpy.data.objects.new(f"hf_crystal_stage_{stage_idx}", snp)
    scene.collection.objects.link(snp_ob)
    # Flat shading on evaluated copy
    for poly in snp.polygons:
        poly.use_smooth = False

    out = os.path.join(GLBS_DIR, f"hf_crystal_stage_{stage_idx}.glb")
    bpy.ops.object.select_all(action='DESELECT')
    snp_ob.select_set(True)
    bpy.context.view_layer.objects.active = snp_ob
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_image_format='WEBP',
        export_yup=EXPORT_YUP,
        export_attributes=True,
    )
    scene.collection.objects.unlink(snp_ob)
    bpy.data.meshes.remove(snp)
    print(f"  Stage {stage_idx} → {out}")

# Distribute stages evenly across the build timeline.
# Frame 0 = nothing (modifier hides everything before frame_start=1).
# Frame BUILD_FRAMES = fully built.
for s in range(STAGE_COUNT):
    frac  = s / (STAGE_COUNT - 1)
    frame = max(1, round(1 + frac * BUILD_FRAMES))
    export_snapshot(frame, s)

# ── Save .blend (base mesh with live BuildModifier) ───────────────────────────
scene.frame_set(1)
blend_path = os.path.join(BLENDS_DIR, "hf_crystal_geode.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Blend saved: {blend_path}")

# ── Final-state GLB with _reveal_order attribute ──────────────────────────────
# Remove modifier for the final export so all faces are present.
ob.modifiers.remove(mod)
bpy.context.view_layer.update()

out_final = os.path.join(GLBS_DIR, "hf_crystal_geode.glb")
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath=out_final,
    export_format='GLB',
    use_selection=True,
    export_apply=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format='WEBP',
    export_yup=EXPORT_YUP,
    export_attributes=True,   # carries _reveal_order per-face accessor
)
print(f"Final GLB → {out_final}")
print("Done.  BuildModifier blueprint complete.")
