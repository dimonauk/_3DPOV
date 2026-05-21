"""
blueprint.py — Texture Baking: Normal Map + AO from High-Poly to Low-Poly
Blender 5.1 | Holoflow Studio | CC0

Technique: selected-to-active Cycles bake. A 32×16 UV sphere with sinusoidal
vertex displacement acts as the high-poly source (further subdivided by a live
Subsurf modifier). A clean 8×8 sphere with Smart UV Project is the low-poly
target. Normal and AO maps are baked to PNG, packed into the blend, and wired
into a Principled + Normal Map material before GLB export.

Run headlessly:
    blender --background --python blueprint.py

Outputs:
    baked_normal_ao.blend   — source scene with packed images
    baked_normal_ao.glb     — Draco-compressed GLB with WebP normal + AO
    normal_baked.png        — tangent-space normal map (Non-Color space)
    ao_baked.png            — ambient occlusion map (Non-Color space)
"""

import bpy
import bmesh
import math
import pathlib

# ── Constants ─────────────────────────────────────────────────────────────────
OUT_DIR   = pathlib.Path(__file__).parent
BLEND_OUT = OUT_DIR / "baked_normal_ao.blend"
GLB_OUT   = OUT_DIR / "baked_normal_ao.glb"

TEX_NORMAL   = "normal_baked"
TEX_AO       = "ao_baked"

# Raise TEX_SIZE to 2048 / 4096 for production. 512 finishes in < 90 s on CPU.
TEX_SIZE     = 512

# Ray-cast distance from the low-poly surface toward the high-poly.
# Must exceed the peak displacement amplitude (AMPLITUDE = 0.12) with margin.
EXTRUSION    = 0.18

# Very low sample count — noise is tolerable for baked maps; 8 is sufficient.
BAKE_SAMPLES = 8

# Sinusoidal displacement on high-poly: z_offset = AMPLITUDE * sin(FREQ*x) * cos(FREQ*y)
AMPLITUDE    = 0.12
FREQ         = math.pi * 4

LOW_SEGS   = 8    # longitude + latitude → 8×8 quads = 128 triangles
HIGH_SEGS  = 32   # pre-subdivision segment count

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Cycles is mandatory for texture baking — EEVEE Next does not support baking.
scene.render.engine        = "CYCLES"
scene.cycles.samples       = BAKE_SAMPLES
scene.cycles.use_denoising = False   # denoising is irrelevant for bake passes

# ── High-poly source ──────────────────────────────────────────────────────────
bm_h = bmesh.new()
bmesh.ops.create_uvsphere(
    bm_h, u_segments=HIGH_SEGS, v_segments=HIGH_SEGS // 2, radius=1.0
)
bm_h.normal_update()

# Displace each vertex along its own surface normal so the offset reads as
# surface texture rather than a gross shape deformation. After update_normals()
# bm_h.verts[i].normal is the smooth vertex normal — good enough for this bias.
for v in bm_h.verts:
    offset = AMPLITUDE * math.sin(FREQ * v.co.x) * math.cos(FREQ * v.co.y)
    v.co  += v.normal * offset

bm_h.normal_update()
mesh_h = bpy.data.meshes.new("hp_source")
bm_h.to_mesh(mesh_h)
bm_h.free()
obj_h = bpy.data.objects.new("hp_source", mesh_h)
scene.collection.objects.link(obj_h)

# Live Subsurf modifier — the bake operator reads the EVALUATED (post-modifier)
# mesh from the depsgraph, so the modifier does NOT need to be applied.
sub              = obj_h.modifiers.new("Subsurf", "SUBSURF")
sub.levels       = 2           # 32×16 × 4^2 = ~8 000 faces
sub.render_levels = 2

# ── Low-poly target ───────────────────────────────────────────────────────────
bm_l = bmesh.new()
bmesh.ops.create_uvsphere(
    bm_l, u_segments=LOW_SEGS, v_segments=LOW_SEGS, radius=1.0
)
mesh_l = bpy.data.meshes.new("lp_target")
bm_l.to_mesh(mesh_l)
bm_l.free()
obj_l = bpy.data.objects.new("lp_target", mesh_l)
scene.collection.objects.link(obj_l)

# ── UV-unwrap the low-poly (mandatory — baking writes into UV space) ───────────
bpy.context.view_layer.objects.active = obj_l
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
# Smart UV Project: angle_limit 66° matches the default; island_margin avoids
# texel bleed at atlas borders. A manual cylindrical unwrap with a single pole
# seam would give fewer charts, but Smart UV Project works headlessly.
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
bpy.ops.object.mode_set(mode="OBJECT")

# ── Bake-target images ────────────────────────────────────────────────────────
img_n = bpy.data.images.new(TEX_NORMAL, width=TEX_SIZE, height=TEX_SIZE)
img_a = bpy.data.images.new(TEX_AO,     width=TEX_SIZE, height=TEX_SIZE)

# Non-Color prevents Blender from applying sRGB gamma (≈ 2.2 power) to the
# packed RGB → XYZ tangent vectors. Gamma-decoding a normal map corrupts every
# vector — the most invisible and most consequential colour-space mistake.
img_n.colorspace_settings.name = "Non-Color"
img_a.colorspace_settings.name = "Non-Color"

# ── Low-poly material ─────────────────────────────────────────────────────────
mat = bpy.data.materials.new("baked_result")
mat.use_nodes = True
obj_l.data.materials.append(mat)
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

out    = nodes.new("ShaderNodeOutputMaterial")
pbsdf  = nodes.new("ShaderNodeBsdfPrincipled")
links.new(pbsdf.outputs["BSDF"], out.inputs["Surface"])

# Normal map chain: Image Texture → Normal Map → Principled.Normal.
# The Normal Map node decodes the [0,1]³ RGB back to signed [-1,1]³ XYZ
# tangent-space vectors. Skipping it and wiring raw RGB to Principled.Normal
# is the single most common beginner error — produces a blue-tinted plastic look
# rather than any normal influence.
tex_n = nodes.new("ShaderNodeTexImage")
nrm   = nodes.new("ShaderNodeNormalMap")
tex_n.image = img_n
tex_n.name  = "BakeTargetNormal"
links.new(tex_n.outputs["Color"], nrm.inputs["Color"])
links.new(nrm.outputs["Normal"], pbsdf.inputs["Normal"])

# AO target: left disconnected during baking; wired after both passes complete.
tex_a = nodes.new("ShaderNodeTexImage")
tex_a.image = img_a
tex_a.name  = "BakeTargetAO"

# ── Bake settings ─────────────────────────────────────────────────────────────
bk = scene.render.bake
bk.use_selected_to_active = True   # selected = high-poly, active = low-poly
bk.cage_extrusion          = EXTRUSION
bk.use_cage                = False  # cage_extrusion alone is sufficient
bk.use_clear               = True   # initialise with neutral normal (128,128,255)


def _bake(bake_type: str, target_node: "bpy.types.Node") -> None:
    """Select target_node in the material, set obj_h+obj_l selection, bake."""
    for nd in nodes:
        nd.select = False
    target_node.select = True
    nodes.active       = target_node   # bake writes to this node's image

    bpy.ops.object.select_all(action="DESELECT")
    obj_h.select_set(True)             # high-poly: ray source
    obj_l.select_set(True)             # low-poly: bake receiver
    bpy.context.view_layer.objects.active = obj_l

    bpy.ops.object.bake(type=bake_type)
    print(f"[bake] {bake_type} ✓ → {target_node.image.name}")


_bake("NORMAL", tex_n)
_bake("AO",     tex_a)

# ── Save and pack textures ────────────────────────────────────────────────────
for img, name in ((img_n, TEX_NORMAL), (img_a, TEX_AO)):
    out_path = str(OUT_DIR / f"{name}.png")
    img.filepath_raw = out_path
    img.file_format  = "PNG"
    img.save()
    img.pack()   # embed into .blend for portability
    print(f"[saved] {out_path}")

# ── Wire AO into the material post-bake ──────────────────────────────────────
# Multiply AO against a warm grey albedo: darkens crevices without tinting.
mix = nodes.new("ShaderNodeMixRGB")
mix.blend_type = "MULTIPLY"
mix.inputs["Fac"].default_value    = 0.65
mix.inputs["Color1"].default_value = (0.78, 0.76, 0.72, 1.0)
links.new(tex_a.outputs["Color"],  mix.inputs["Color2"])
links.new(mix.outputs["Color"],    pbsdf.inputs["Base Color"])

# ── Export low-poly as GLB ────────────────────────────────────────────────────
obj_h.hide_render = True
bpy.ops.object.select_all(action="DESELECT")
obj_l.select_set(True)
bpy.context.view_layer.objects.active = obj_l

bpy.ops.export_scene.gltf(
    filepath     = str(GLB_OUT),
    export_format = "GLB",
    use_selection = True,
    export_normals         = True,
    export_materials       = "EXPORT",
    export_image_format    = "WEBP",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[done] blend → {BLEND_OUT}")
print(f"[done] glb   → {GLB_OUT}")
