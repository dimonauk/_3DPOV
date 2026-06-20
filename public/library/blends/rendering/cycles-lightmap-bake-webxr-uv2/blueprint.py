"""
Cycles Lightmap Baking for WebXR — UV2 Channel, Combined Bake, OIDN, GLB Export
Blender 5.1 | bpy API | Licence: CC0

WHY LIGHTMAPS
  WebXR frames run at 72–90 Hz on standalone XR hardware.  Per-frame ray tracing
  is impossible at that budget.  Lightmaps freeze scene GI into textures at bake
  time; the XR renderer samples them as a standard texture lookup — O(1) per
  fragment regardless of scene complexity.

UV ARCHITECTURE
  UV0 "UVMap"      — tiling material UV (TEXCOORD_0).  Islands may overlap.
  UV1 "UVLightmap" — lightmap UV (TEXCOORD_1).  Islands MUST NOT overlap: every
                     face needs a unique pixel address in the bake image, otherwise
                     two faces write to the same pixels and produce a visual seam.

BAKE STRATEGY — PER-OBJECT IMAGES (this blueprint)
  Simplest and most flexible.  Each mesh gets its own 512×512 float image.
  Three.js assigns mesh.material.lightMap per mesh independently.

ALTERNATIVE — SHARED ATLAS
  Select all MESHES → Edit Mode → uv.lightmap_pack(PACK_IN_ONE=True).
  All faces distributed into a single 0–1 UV space with no overlap.
  Bake all objects sequentially into the SAME image.  Result: one image, one
  draw call for all lightmap lookups.  Lower per-object texel density.
"""
import bpy, pathlib

HERE    = pathlib.Path(__file__).parent
OUT_GLB = str(HERE / "lightmap_room.glb")
LM_W    = 512
LM_H    = 512
SAMPLES = 128          # raise to 256+ for production quality
BK_MARG = 4            # pixel bleed margin — prevents seam darkening at island edges
UV0     = "UVMap"      # TEXCOORD_0
UV1     = "UVLightmap" # TEXCOORD_1

# ── renderer ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = "LightmapRoom"
sc.render.engine             = "CYCLES"
sc.cycles.samples            = SAMPLES
sc.cycles.use_denoising      = True
sc.cycles.denoiser           = "OPENIMAGEDENOISE"
# Blender 3.1+ exposes a denoiser specifically for baked images via the Bake
# settings panel.  This applies OIDN to each baked result automatically.
sc.render.bake.use_denoising          = True
sc.render.bake.margin                 = BK_MARG
sc.render.bake.margin_type            = "EXTEND"   # flood-fill colour into margin
sc.render.bake.use_selected_to_active = False       # single-object bake mode

# ── materials ───────────────────────────────────────────────────────────────
def _mat(name, col):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    t = m.node_tree; t.nodes.clear()
    b = t.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value  = 0.85
    b.inputs["Metallic"].default_value   = 0.0
    o = t.nodes.new("ShaderNodeOutputMaterial")
    t.links.new(b.outputs["BSDF"], o.inputs["Surface"])
    b.location = (-200, 0); o.location = (100, 0)
    return m

mats = {
    "floor" : _mat("mat_floor",  (0.72, 0.70, 0.65, 1)),
    "wall"  : _mat("mat_wall",   (0.85, 0.82, 0.78, 1)),
    "pillar": _mat("mat_pillar", (0.55, 0.53, 0.50, 1)),
    "accent": _mat("mat_accent", (0.18, 0.35, 0.65, 1)),
}

# ── geometry ─────────────────────────────────────────────────────────────────
def _box(name, loc, dims, mat_key):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    ob = bpy.context.active_object; ob.name = name
    ob.scale = (dims[0] / 2, dims[1] / 2, dims[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    ob.data.materials.clear()
    ob.data.materials.append(mats[mat_key])
    return ob

MESHES = [
    _box("floor",   ( 0.0,  0.0, 0.00), (4.0, 4.0, 0.10), "floor"),
    _box("wall_n",  ( 0.0,  2.0, 1.00), (4.0, 0.1, 2.00), "wall"),
    _box("wall_w",  (-2.0,  0.0, 1.00), (0.1, 4.0, 2.00), "wall"),
    _box("pillar",  ( 1.2,  1.2, 0.75), (0.3, 0.3, 1.50), "pillar"),
    _box("accent",  (-0.8, -0.5, 0.40), (0.5, 0.5, 0.80), "accent"),
]

# ── lights ───────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(-1, -1, 2.8))
key = bpy.context.active_object
key.name = "key_area"; key.data.energy = 60; key.data.size = 1.2
key.data.color = (1.0, 0.96, 0.88)

bpy.ops.object.light_add(type="POINT", location=(1.5, 1.5, 1.5))
fill = bpy.context.active_object
fill.name = "fill_point"; fill.data.energy = 20
fill.data.color = (0.85, 0.90, 1.0)

# ── camera ───────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(4.2, -3.8, 2.8))
cam = bpy.context.active_object; cam.name = "cam"
cam.rotation_euler = (1.09, 0, 0.87)
sc.camera = cam

# ── UV unwrap ────────────────────────────────────────────────────────────────
def _smart_uv(ob, layer, margin):
    if layer not in ob.data.uv_layers:
        ob.data.uv_layers.new(name=layer)
    ob.data.uv_layers.active = ob.data.uv_layers[layer]
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(island_margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")

for ob in MESHES:
    _smart_uv(ob, UV0, 0.02)   # UV0 — material, islands may tile
    _smart_uv(ob, UV1, 0.05)   # UV1 — lightmap, bigger margin = less bleed risk

# ── bake: per-object lightmap images ─────────────────────────────────────────
def _bake_ob(ob):
    """
    Create a float image for this object, wire an Image Texture node into its
    material targeting UV1, mark that node selected+active, then bake COMBINED.
    COMBINED captures: direct light + indirect (GI bounces) + shadow + AO.
    The bake operator writes to whichever Image Texture node is active — this
    single-node activation pattern is the canonical bpy baking idiom.
    """
    img_name = f"lm_{ob.name}"
    if img_name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[img_name])
    img = bpy.data.images.new(img_name, LM_W, LM_H, float_buffer=True)
    img.colorspace_settings.name = "Linear Rec.709"

    mat  = ob.data.materials[0]
    tree = mat.node_tree

    bk = tree.nodes.new("ShaderNodeTexImage"); bk.label = "BAKE_LM"
    bk.image = img; bk.location = (-500, -200)

    # UV node pointing at UV1 so Cycles samples the correct coordinate channel
    uv = tree.nodes.new("ShaderNodeUVMap"); uv.label = "BAKE_LM_UV"
    uv.uv_map = UV1; uv.location = (-750, -200)
    tree.links.new(uv.outputs["UV"], bk.inputs["Vector"])

    # Only this node selected+active — any other selected Image Texture causes
    # "More than one Image Texture node selected" error
    for n in tree.nodes: n.select = False
    bk.select = True; tree.nodes.active = bk

    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type="COMBINED")

    img.pack()
    return img

baked = {ob.name: _bake_ob(ob) for ob in MESHES}

# ── wire lightmap into material output ───────────────────────────────────────
def _wire_lm(ob, img):
    """
    After baking, connect the lightmap texture (read via UV1) into the material
    so the GLB preview and WebXR render reflect the baked GI.
    MixRGB(Multiply) blends albedo × lightmap — this is how game engines combine
    baked and dynamic colour.  In Three.js use:
      mesh.material.lightMap = baked_texture;
      mesh.material.lightMapIntensity = 1.0;
    and leave Base Color as the pure albedo (do not multiply in the shader).
    """
    mat  = ob.data.materials[0]
    t    = mat.node_tree
    bsdf = next(n for n in t.nodes if n.type == "BSDF_PRINCIPLED")

    lm_uv  = t.nodes.new("ShaderNodeUVMap"); lm_uv.uv_map = UV1
    lm_uv.location = (-800, 220)
    lm_tex = t.nodes.new("ShaderNodeTexImage"); lm_tex.image = img
    lm_tex.location = (-550, 220)

    mix = t.nodes.new("ShaderNodeMixRGB")
    mix.blend_type = "MULTIPLY"; mix.inputs["Fac"].default_value = 1.0
    mix.inputs["Color1"].default_value = bsdf.inputs["Base Color"].default_value[:]
    mix.location = (-250, 220)

    t.links.new(lm_uv.outputs["UV"],     lm_tex.inputs["Vector"])
    t.links.new(lm_tex.outputs["Color"], mix.inputs["Color2"])
    t.links.new(mix.outputs["Color"],    bsdf.inputs["Base Color"])

for ob in MESHES:
    _wire_lm(ob, baked[ob.name])

# ── save + export ─────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "lightmap_room.blend"))

# export_apply=True collapses modifier stack — no GN here but keeps the habit.
# Both UV0 and UV1 export automatically; glTF-Blender-IO writes them as
# TEXCOORD_0 and TEXCOORD_1 in the order they appear in ob.data.uv_layers.
bpy.ops.export_scene.gltf(
    filepath                             = OUT_GLB,
    export_format                        = "GLB",
    export_apply                         = True,
    export_materials                     = "EXPORT",
    export_image_format                  = "WEBP",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_yup                           = True,
)
print("Done — lightmap_room.blend + lightmap_room.glb written.")
