"""
Python UV Layer Atlas Pack for Multi-Object WebXR GLB
Blender 5.1  |  bpy.types.MeshUVLoop + numpy  |  CC0 Holoflow Studio 2026

TECHNIQUE
---------
UV atlas packing lets multiple mesh objects share one texture, reducing a
WebXR scene's material state changes from N objects to 1.  This blueprint:
  1. Creates three props (body/pillar/cap) each with a Solidify modifier.
  2. Smart-projects each object's UVs independently via temp_override.
  3. Uses foreach_get / foreach_set on the FLOAT2 corner attribute to scale
     each object's UV islands into a distinct quadrant of the shared 0-1 tile.
  4. Builds a quadrant-coloured debug atlas texture with numpy pixel ops.
  5. Assigns a single shared material and exports a single-draw-call GLB.

UV DOMAIN NOTE
--------------
UVs live in the 'CORNER' domain (one entry per face-loop, not per vertex).
len(mesh.loops) is always the correct buffer size.  DO NOT use len(mesh.vertices).
In Blender 4.0+ the internal storage is a FLOAT2 attribute; the classic
`mesh.uv_layers` API is a compatibility view of the same data.
`foreach_get("vector", buf)` on the attribute path is ~20× faster than
iterating MeshUVLoop objects in Python.
"""

import bpy, math, json, pathlib
import numpy as np

# ── constants ─────────────────────────────────────────────────────────────────
EXPORT_PATH   = pathlib.Path("/tmp/holoflow_uv_atlas.glb")
ATLAS_SIZE    = 512       # power-of-two; 512 is enough for a prop-set debug atlas
ISLAND_MARGIN = 0.01      # smart_project island margin (normalised UV space)
SMART_ANGLE   = 66.0      # smart_project break angle (degrees)
SOLIDIFY_T    = 0.04      # default solidify thickness (metres)
DRACO         = 6         # Draco compression level for GLB

# ── helpers ───────────────────────────────────────────────────────────────────
def add_solidify(obj, thickness=SOLIDIFY_T, offset=-1.0):
    mod = obj.modifiers.new("Solidify", 'SOLIDIFY')
    mod.thickness    = thickness
    mod.offset       = offset
    mod.use_even_offset = True   # avoids wavy shells on curved surfaces


def get_uv_attr(mesh):
    """Return the first FLOAT2/CORNER UV attribute, or None."""
    for attr in mesh.attributes:
        if attr.data_type == 'FLOAT2' and attr.domain == 'CORNER':
            return attr
    return None


def read_uvs(mesh):
    """Return UV coordinates as (N, 2) float32 array."""
    attr = get_uv_attr(mesh)
    if attr is None:
        return np.empty((0, 2), dtype=np.float32)
    buf = np.empty(len(mesh.loops) * 2, dtype=np.float32)
    attr.data.foreach_get("vector", buf)
    return buf.reshape(-1, 2)


def write_uvs(mesh, uvs):
    """Write (N, 2) float32 array back to the mesh UV attribute."""
    attr = get_uv_attr(mesh)
    if attr is None:
        return
    attr.data.foreach_set("vector", uvs.ravel().tolist())


# ── 1. scene setup ────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = "uv_atlas_scene"
col = sc.collection

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
body = bpy.context.active_object
body.name = "prop_body"
body.scale = (0.5, 0.5, 0.9)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
add_solidify(body, 0.05)

bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.07, depth=0.45, location=(0, 0, 0))
pillar = bpy.context.active_object
pillar.name = "prop_pillar"
add_solidify(pillar, 0.02)

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.22, location=(0, 0, 1.1))
cap = bpy.context.active_object
cap.name = "prop_cap"
add_solidify(cap, 0.015)

PROPS = [body, pillar, cap]

# ── 2. smart UV project per object ────────────────────────────────────────────
# bpy.ops.uv.smart_project() polls edit_object — always provide it via
# temp_override().  The operator writes into the ACTIVE uv layer (slot 0
# if none exist; it creates one named "UVMap" automatically).
# scale_to_bounds=True fills each object's 0-1 UV space before we
# manually assign quadrants in step 3, giving pack_islands-quality
# starting layout without requiring a UV editor area to be open.

for obj in PROPS:
    with bpy.context.temp_override(
        active_object=obj,
        selected_objects=[obj],
        edit_object=obj,
    ):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(
            angle_limit    = math.radians(SMART_ANGLE),
            island_margin  = ISLAND_MARGIN,
            correct_aspect = True,    # respect face aspect ratios
            scale_to_bounds= True,    # fill 0-1 per-object before global step
        )
        bpy.ops.object.mode_set(mode='OBJECT')

# ── 3. foreach_get — read UVs and print coverage stats ───────────────────────
# Coverage = fraction of the 0-1 tile actually used by UV islands.
# Low coverage (< 0.4) means wasted texels; smart_project typically reaches
# 0.7-0.85 after scale_to_bounds.  These stats guide atlas budget decisions.

print("\n── UV stats after smart_project ──")
for obj in PROPS:
    uvs = read_uvs(obj.data)
    if len(uvs) == 0:
        continue
    u_range = uvs[:, 0].max() - uvs[:, 0].min()
    v_range = uvs[:, 1].max() - uvs[:, 1].min()
    print(f"  {obj.name}: {len(uvs)} loops  "
          f"U {uvs[:,0].min():.3f}–{uvs[:,0].max():.3f}  "
          f"coverage ≈ {u_range*v_range:.2f}")

# ── 4. manual atlas placement — scale + offset per quadrant ───────────────────
# pack_islands() in Blender gives optimal coverage but requires an open
# SpaceImageEditor context — unavailable in headless batch mode.  Manual
# quadrant assignment is deterministic, headless-safe, and maps cleanly onto
# UDIM tile conventions (tile 1001=BL, 1002=BR, 1011=TL, 1012=TR).
#
# Scale formula: new_uv = (old_uv - uv_min) / uv_range * 0.5 + tile_origin
# This normalises the per-object 0-1 layout into a 0.5×0.5 quadrant.

QUADRANT = {
    "prop_body":   (0.0, 0.0),   # bottom-left  (UDIM tile 1001)
    "prop_pillar": (0.5, 0.0),   # bottom-right (UDIM tile 1002)
    "prop_cap":    (0.0, 0.5),   # top-left     (UDIM tile 1011)
}

for obj in PROPS:
    mesh = obj.data
    uvs  = read_uvs(mesh)
    if len(uvs) == 0:
        continue
    u_min, v_min = uvs[:, 0].min(), uvs[:, 1].min()
    u_rng = max(uvs[:, 0].max() - u_min, 1e-6)
    v_rng = max(uvs[:, 1].max() - v_min, 1e-6)
    ox, oy = QUADRANT.get(obj.name, (0.0, 0.0))
    pad    = ISLAND_MARGIN * 0.5      # inset margin so islands don't touch edges
    scale  = 0.5 - pad * 2
    uvs[:, 0] = (uvs[:, 0] - u_min) / u_rng * scale + ox + pad
    uvs[:, 1] = (uvs[:, 1] - v_min) / v_rng * scale + oy + pad
    write_uvs(mesh, uvs)

print("\n── UV stats after quadrant placement ──")
for obj in PROPS:
    uvs = read_uvs(obj.data)
    if len(uvs) == 0:
        continue
    print(f"  {obj.name}: U {uvs[:,0].min():.3f}–{uvs[:,0].max():.3f}  "
          f"V {uvs[:,1].min():.3f}–{uvs[:,1].max():.3f}")

# ── 5. build shared atlas material ────────────────────────────────────────────
# Quadrant-coloured debug texture: each quadrant matches QUADRANT assignments
# so you can verify in viewport that body→red tile, pillar→green tile, cap→blue.
# In production replace with a baked diffuse/normal/AO texture.
#
# Blender pixel layout: row 0 = bottom of image (V=0), row ATLAS_SIZE-1 = top.

h = ATLAS_SIZE // 2
grid = np.zeros((ATLAS_SIZE, ATLAS_SIZE, 4), dtype=np.float32)
grid[:h, :h]  = [0.78, 0.22, 0.22, 1.0]   # BL → red   (prop_body)
grid[:h, h:]  = [0.22, 0.72, 0.22, 1.0]   # BR → green (prop_pillar)
grid[h:, :h]  = [0.22, 0.32, 0.85, 1.0]   # TL → blue  (prop_cap)
grid[h:, h:]  = [0.82, 0.82, 0.82, 1.0]   # TR → grey  (unused)

atlas_img = bpy.data.images.new("atlas_debug", ATLAS_SIZE, ATLAS_SIZE, alpha=False)
atlas_img.pixels.foreach_set(grid.ravel().tolist())

mat = bpy.data.materials.new("atlas_mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (500,   0)
pe   = nt.nodes.new("ShaderNodeBsdfPrincipled"); pe.location   = (200,   0)
tex  = nt.nodes.new("ShaderNodeTexImage");       tex.location  = (-100, 150)
uvn  = nt.nodes.new("ShaderNodeTexCoord");       uvn.location  = (-350, 150)

tex.image         = atlas_img
tex.interpolation = 'Closest'    # pixelated edges aid UV debug; use 'Linear' for baked atlas

nt.links.new(uvn.outputs["UV"],    tex.inputs["Vector"])
nt.links.new(tex.outputs["Color"], pe.inputs["Base Color"])
nt.links.new(pe.outputs["BSDF"],   out.inputs["Surface"])

for obj in PROPS:
    obj.data.materials.clear()
    obj.data.materials.append(mat)

# ── 6. GLB export ─────────────────────────────────────────────────────────────
# export_apply=True bakes the Solidify modifier before writing geometry.
# The resulting GLB has one material, one texture, three primitives (one per
# object) → minimal GPU state in WebXR / Three.js.

for obj in PROPS:
    obj.select_set(True)
bpy.context.view_layer.objects.active = PROPS[0]

EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath              = str(EXPORT_PATH),
    use_selection         = True,
    export_format         = 'GLB',
    export_yup            = True,
    export_apply          = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO,
    export_image_format   = 'WEBP',
    export_normals        = True,
)

size_kb = EXPORT_PATH.stat().st_size / 1024
manifest = {
    "slug":    "python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr",
    "objects": [o.name for o in PROPS],
    "atlas_px": ATLAS_SIZE,
    "glb_kb":  round(size_kb, 1),
    "export":  str(EXPORT_PATH),
}
json_path = EXPORT_PATH.with_suffix(".json")
json_path.write_text(json.dumps(manifest, indent=2))
print(f"\n── Export ──\n{json.dumps(manifest, indent=2)}")
