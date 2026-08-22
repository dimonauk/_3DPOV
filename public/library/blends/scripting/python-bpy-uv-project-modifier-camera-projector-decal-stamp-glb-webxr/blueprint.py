"""
blueprint.py — UVProjectModifier: Camera-Projected Decal Stamp
Blender 5.1 | Holoflow Studio | CC0

TECHNIQUE
---------
UVProjectModifier writes UV coordinates onto a named UV layer by projecting
each vertex through one or more camera/light frustums. The modifier never
touches pixel data — it only writes (u, v) pairs. The material then samples
those coordinates via a UV Map node pointed at the same layer name.

WHY NOT MANUAL UNWRAP?
Unwrapping a curved hard-surface prop and then fitting a logo into one island
without distortion takes 15–20 minutes and re-breaks whenever the topology
changes. Camera projection: set up an ortho camera above the surface, dial
scale_x/y to fit the logo footprint, done. Topology changes are irrelevant.

EXPORT RULE
-----------
The glTF 2.0 spec carries UV as a static float array per mesh. While Blender's
own exporter evaluates the depsgraph (so UVProjectModifier IS evaluated), many
downstream tools (Unity glTF importers, three.js loaders) expect baked UV data.
Safe pattern: duplicate → apply modifier → export duplicate → delete duplicate.
"""

import bpy
import bmesh
import math

# ── constants ─────────────────────────────────────────────────────────────────
SLUG        = "hf_uvproject_shield"
UV_LAYER    = "projected"      # UVProjectModifier writes here; UV Map node reads it
CAM_DIST    = 3.0              # projector camera Z-offset from shield centre
SHIELD_R    = 0.8              # outer rim radius (metres)
SHIELD_D    = 0.08             # thickness / back-face depth
BOSS_R      = 0.18             # central boss cylinder radius
BOSS_H      = 0.12             # boss tip height above front face
IMG_RES     = 128              # decal image resolution (pixels square)
ORTHO_SCALE = 1.8              # projector camera ortho width (metres)
MOD_SCALE   = 0.65             # fraction of ortho frustum the decal fills
GLB_PATH    = "//hf_uvproject_shield.glb"

# ── 1. clean scene ────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)

# ── 2. build faceted shield geometry with bmesh ───────────────────────────────
# 10-sided polygon gives a clearly faceted silhouette while keeping vert count low.
N = 10
angles = [i * 2 * math.pi / N for i in range(N)]
bm = bmesh.new()

rim = [bm.verts.new((SHIELD_R * math.cos(a), SHIELD_R * math.sin(a), 0.0)) for a in angles]
back = bm.verts.new((0.0, 0.0, -SHIELD_D))
for i in range(N):
    bm.faces.new([rim[i], rim[(i + 1) % N], back])

# Slightly inset front rim gives chamfered edge feel without Bevel modifier
front_rim = [bm.verts.new((0.88 * SHIELD_R * math.cos(a),
                             0.88 * SHIELD_R * math.sin(a),
                             0.025)) for a in angles]
for i in range(N):
    bm.faces.new([rim[(i + 1) % N], rim[i], front_rim[i], front_rim[(i + 1) % N]])

boss_ring = [bm.verts.new((BOSS_R * math.cos(a), BOSS_R * math.sin(a), 0.05)) for a in angles]
for i in range(N):
    bm.faces.new([front_rim[i], front_rim[(i + 1) % N],
                  boss_ring[(i + 1) % N], boss_ring[i]])

boss_tip = bm.verts.new((0.0, 0.0, BOSS_H))
for i in range(N):
    bm.faces.new([boss_ring[i], boss_ring[(i + 1) % N], boss_tip])

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
mesh = bpy.data.meshes.new(SLUG)
bm.to_mesh(mesh)
bm.free()

for e in mesh.edges:
    e.use_edge_sharp = True   # flat-shade every face independently

shield = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(shield)

# ── 3. UV layers ──────────────────────────────────────────────────────────────
# UVProjectModifier creates the target layer if absent, but naming it here
# makes the dependency explicit and guarantees slot order.
mesh.uv_layers.new(name=UV_LAYER)       # slot 0 — projection target
mesh.uv_layers.new(name="LightmapUV")  # slot 1 — reserved for lightmap baking

# ── 4. draw clan insignia into a Blender Image ───────────────────────────────
# pixel data is a flat RGBA list, row-major, bottom-to-top (OpenGL convention).
img = bpy.data.images.new("clan_insignia", width=IMG_RES, height=IMG_RES, alpha=True)
img.alpha_mode = 'STRAIGHT'
px = [0.0] * (IMG_RES * IMG_RES * 4)
cx = cy = IMG_RES // 2
for row in range(IMG_RES):
    for col in range(IMG_RES):
        nx = (col - cx) / cx     # normalised -1..1
        ny = (row - cy) / cy
        diamond = abs(nx) + abs(ny)
        dot = math.sqrt(nx * nx + ny * ny)
        idx = (row * IMG_RES + col) * 4
        if diamond < 0.62:
            if dot < 0.09:
                px[idx:idx+4] = [1.0, 0.9, 0.2, 1.0]   # bright gold centre
            elif diamond > 0.50:
                px[idx:idx+4] = [0.12, 0.12, 0.12, 1.0] # dark border ring
            else:
                px[idx:idx+4] = [0.85, 0.65, 0.08, 1.0] # gold fill
        else:
            px[idx:idx+4] = [0.0, 0.0, 0.0, 0.0]         # transparent
img.pixels.foreach_set(px)
img.pack()   # embed in .blend so the GLB exporter can include it

# ── 5. material — base steel + projected decal overlay ───────────────────────
mat = bpy.data.materials.new("shield_mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (700, 0)
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (400, 0)
bsdf.inputs["Base Color"].default_value  = (0.14, 0.14, 0.17, 1.0)  # dark iron
bsdf.inputs["Metallic"].default_value    = 0.85
bsdf.inputs["Roughness"].default_value   = 0.30

uv_n = nt.nodes.new("ShaderNodeUVMap");   uv_n.location  = (-500, 80)
uv_n.uv_map = UV_LAYER                   # reads the layer UVProjectModifier writes to

tex  = nt.nodes.new("ShaderNodeTexImage"); tex.location   = (-220, 80)
tex.image = img

mix  = nt.nodes.new("ShaderNodeMixRGB");  mix.location   = (80, 80)
mix.blend_type = 'MIX'
mix.inputs["Color1"].default_value = (0.14, 0.14, 0.17, 1.0)  # base iron colour

nt.links.new(uv_n.outputs["UV"],        tex.inputs["Vector"])
nt.links.new(tex.outputs["Alpha"],      mix.inputs["Fac"])
nt.links.new(mix.inputs["Color2"],      tex.outputs["Color"])   # type: ignore
nt.links.new(mix.outputs["Color"],      bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],     out.inputs["Surface"])

shield.data.materials.append(mat)

# ── 6. orthographic projector camera ─────────────────────────────────────────
# Orthographic type avoids perspective distortion — every part of the badge
# receives the same scale regardless of distance from the lens centre.
cam_d = bpy.data.cameras.new("projector")
cam_d.type = 'ORTHO'
cam_d.ortho_scale = ORTHO_SCALE   # frustum width in metres
cam_obj = bpy.data.objects.new("projector", cam_d)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.0, 0.0, CAM_DIST)
# Default camera looks down -Z; shield faces +Z → no rotation needed.

# ── 7. UVProjectModifier ──────────────────────────────────────────────────────
mod = shield.modifiers.new("UVProject", 'UV_PROJECT')
mod.uv_layer        = UV_LAYER     # writes projected (u,v) into this layer
mod.projector_count = 1
mod.projectors[0].object = cam_obj

# Aspect ratio must match the image's pixel dimensions to prevent stretch.
# Square image (IMG_RES × IMG_RES) → both = 1.0.  A 2:1 image needs (2, 1).
mod.aspect_x = 1.0
mod.aspect_y = 1.0

# scale_x/y control what fraction of the ortho frustum the projection fills.
# The actual decal footprint = ortho_scale × scale: 1.8 × 0.65 = 1.17 m width.
# That slightly over-fills the 1.6 m diameter shield, so the badge is centred
# inside the rim with a small bleed — adjust for a tighter or looser stamp.
mod.scale_x = MOD_SCALE
mod.scale_y = MOD_SCALE

# ── 8. apply modifier on export duplicate ────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
shield.select_set(True)
bpy.context.view_layer.objects.active = shield
bpy.ops.object.duplicate(linked=False)
export_obj = bpy.context.active_object
export_obj.name = SLUG + "_export"

with bpy.context.temp_override(object=export_obj, active_object=export_obj):
    bpy.ops.object.modifier_apply(modifier="UVProject")

# ── 9. GLB export ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
export_obj.select_set(True)
bpy.context.view_layer.objects.active = export_obj
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    export_format='GLB',
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_texcoords=True,   # required — includes UV layer data in the GLB
    export_normals=True,
)

bpy.data.objects.remove(export_obj, do_unlink=True)
print(f"[HF] exported → {GLB_PATH}")
