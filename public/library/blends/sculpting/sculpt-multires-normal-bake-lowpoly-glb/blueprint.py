"""
Multires Modifier — Subdivision-Level Sculpting, Normal Bake, GLB Low-Poly Export
Blender 5.1 · CC0 · Holoflow Studio

Why Multires over Dyntopo?
  Dyntopo triangulates on the fly and permanently destroys base mesh topology.
  The Multires modifier stores sculpt deltas PER SUBDIVISION LEVEL, leaving the
  original quad cage intact at level 0.  That level-0 mesh is the asset that
  ships in GLB; a baked tangent-space normal map carries the high-frequency
  surface story without sending a million triangles through the glTF exporter.

Pipeline:
  Low-poly UV sphere (level 0) → UV unwrap → Multires × 4 subdivisions →
  Displaced high-poly duplicate → multires_reshape (transfers shape into mod) →
  Cycles normal bake (use_multires_baking) → wire normal map into material →
  Export GLB at level 0 (level-0 quad mesh + baked normal + Draco 6).
"""

import bpy, bmesh, os, math

# ── constants ─────────────────────────────────────────────────────────────────
SLUG            = "sculpt-multires-normal-bake-lowpoly-glb"
MULTIRES_LEVELS = 4       # each level ~4× faces: 96 → 384 → 1536 → 6144 → 24576
BAKE_RES        = 1024    # normal map px (power of 2; 1024 is fast + adequate)
DISPLACE_AMP    = 0.045   # peak displacement height (~4.5 % of sphere radius)
NOISE_SCALE     = 0.22    # Clouds noise spatial frequency (world units)
BASE_COLOUR     = (0.62, 0.53, 0.40, 1.0)  # warm unglazed ceramic

def _output(sub: str) -> str:
    """Resolve absolute path relative to this script's directory."""
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, "..", "..", "..", "..", sub))


# ── 0. clean scene ────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = SLUG

# ── 1. render engine: Cycles (required for multires bake) ─────────────────────
scene.render.engine               = "CYCLES"
scene.cycles.device               = "CPU"
scene.cycles.samples              = 16      # minimal — normals need no AA
scene.cycles.use_adaptive_sampling = False

# ── 2. neutral world ─────────────────────────────────────────────────────────
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.05, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.5

# ── 3. camera ─────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -4.0, 0.4),
                           rotation=(math.radians(88), 0, 0))
cam = bpy.context.active_object
cam.name  = "Camera"
scene.camera = cam

# ── 4. three-point light for viewport record ──────────────────────────────────
for name, loc, energy in (
    ("Key",  ( 3, -2,  3), 4.0),
    ("Fill", (-3, -1,  1), 1.5),
    ("Back", ( 0,  3,  2), 2.0),
):
    bpy.ops.object.light_add(type="AREA", location=loc)
    lt = bpy.context.active_object
    lt.name = f"Light_{name}"
    lt.data.energy = energy
    lt.data.size   = 2.0

# ── 5. low-poly UV sphere (the level-0 base mesh) ────────────────────────────
# 12 × 8 = 96 quad faces — visibly faceted at level 0, smooth at level 4.
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
                                      radius=1.0, location=(0, 0, 0))
low = bpy.context.active_object
low.name = "talisman_low"
bpy.ops.object.shade_flat()   # highlight the low-poly silhouette at level 0

# ── 6. UV unwrap the level-0 base (Smart UV Project) ─────────────────────────
# Must UV-unwrap BEFORE adding Multires; level 0 UVs propagate upward
# through subdivision — they are NOT re-projected at higher levels.
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
bpy.ops.object.mode_set(mode="OBJECT")

# ── 7. material with bake-target image node ───────────────────────────────────
mat   = bpy.data.materials.new("talisman_mat")
mat.use_nodes = True
nt    = mat.node_tree
nd    = nt.nodes
lk    = nt.links
nd.clear()

bsdf      = nd.new("ShaderNodeBsdfPrincipled")
bsdf.location = (300, 0)
bsdf.inputs["Base Color"].default_value  = BASE_COLOUR
bsdf.inputs["Roughness"].default_value   = 0.58
bsdf.inputs["Metallic"].default_value    = 0.0
bsdf.inputs["Specular IOR Level"].default_value = 0.3

# Bake target — float32 data image; NOT colour-managed (is_data=True)
bake_img = bpy.data.images.new(
    "talisman_normal", width=BAKE_RES, height=BAKE_RES,
    float_buffer=True, is_data=True,
)
img_nd = nd.new("ShaderNodeTexImage")
img_nd.image    = bake_img
img_nd.location = (-300, -100)
# Keep unconnected during bake; Cycles writes to the active image node.

nmap_nd = nd.new("ShaderNodeNormalMap")
nmap_nd.space    = "TANGENT"
nmap_nd.location = (80, -100)
nmap_nd.inputs["Strength"].default_value = 1.4

out_nd = nd.new("ShaderNodeOutputMaterial")
out_nd.location = (550, 0)
lk.new(bsdf.outputs["BSDF"], out_nd.inputs["Surface"])
# Normal link is wired AFTER bake (step 11).

low.data.materials.append(mat)

# ── 8. add Multires modifier, subdivide MULTIRES_LEVELS times ─────────────────
# Subdivision is Catmull-Clark by default — smooth creasing behaviour.
# Why not Subdivision Surface modifier?  Multires stores per-level sculpt data
# as vertex position deltas, letting you sculpt at level 4 and view at level 0
# without collapsing the mesh.  Subdivision Surface is a display-only offset.
mr = low.modifiers.new("Multires", type="MULTIRES")
for _ in range(MULTIRES_LEVELS):
    with bpy.context.temp_override(object=low):
        bpy.ops.object.multires_subdivide(modifier="Multires", mode="CATMULL_CLARK")

mr.levels        = MULTIRES_LEVELS   # view + sculpt at highest
mr.sculpt_levels = MULTIRES_LEVELS
mr.render_levels = MULTIRES_LEVELS

# ── 9. build displaced high-poly to simulate sculpted surface ─────────────────
# Strategy: duplicate low → apply Multires on copy (materialises level-4 mesh) →
# add Displace + Clouds noise → apply Displace → reshape low's Multires from copy.
# This is the only fully scriptable path; sculpt brush operators require a GPU
# display context and cannot run headlessly.
bpy.ops.object.select_all(action="DESELECT")
low.select_set(True)
bpy.context.view_layer.objects.active = low
bpy.ops.object.duplicate()
high = bpy.context.active_object
high.name = "talisman_high_tmp"

with bpy.context.temp_override(object=high):
    bpy.ops.object.modifier_apply(modifier="Multires")
# high now has the flat level-4 subdivided mesh (~24576 triangles on sphere)

noise_tex            = bpy.data.textures.new("sculpt_noise", type="CLOUDS")
noise_tex.noise_type  = "SOFT_NOISE"
noise_tex.noise_scale = NOISE_SCALE
noise_tex.noise_depth = 2

disp               = high.modifiers.new("Displace", type="DISPLACE")
disp.texture       = noise_tex
disp.strength      = DISPLACE_AMP
disp.texture_coords = "OBJECT"   # world-space noise, not UV-space; avoids seams
with bpy.context.temp_override(object=high):
    bpy.ops.object.modifier_apply(modifier="Displace")

# ── 10. multires_reshape — transfer displaced shape into Multires data ─────────
# The selected non-active mesh (high) provides the target vertex positions;
# the active object (low, which has the Multires modifier) receives them at
# the level specified by mr.sculpt_levels.  Topology must match (it does:
# high was derived from low at the same level).
bpy.ops.object.select_all(action="DESELECT")
high.select_set(True)
low.select_set(True)
bpy.context.view_layer.objects.active = low
with bpy.context.temp_override(
    object=low, selected_objects=[high, low],
    selected_editable_objects=[high, low],
):
    bpy.ops.object.multires_reshape(modifier="Multires")

bpy.data.objects.remove(high, do_unlink=True)

# ── 11. bake tangent-space normal map (level MULTIRES_LEVELS → level 0) ───────
nd.active = img_nd    # Cycles writes to the active unconnected Image Texture node
mr.levels = 0         # set view-level to 0 = the bake DESTINATION resolution

bk = scene.render.bake
bk.use_selected_to_active = False
bk.use_cage               = False
# use_multires_baking tells Cycles to compare sculpt_levels vs levels within
# the Multires modifier itself — no second object required.
bk.use_multires_baking    = True
bk.normal_space           = "TANGENT"

bpy.ops.object.bake(type="NORMAL")

# ── 12. wire baked normal map into the material ────────────────────────────────
lk.new(img_nd.outputs["Color"],   nmap_nd.inputs["Color"])
lk.new(nmap_nd.outputs["Normal"], bsdf.inputs["Normal"])

# ── 13. restore mid-detail viewport level + shade smooth ──────────────────────
mr.levels = 2
bpy.ops.object.select_all(action="DESELECT")
low.select_set(True)
bpy.context.view_layer.objects.active = low
bpy.ops.object.shade_smooth()

# ── 14. pack baked image into .blend ─────────────────────────────────────────
bake_img.pack()

# ── 15. save .blend ───────────────────────────────────────────────────────────
blend_path = _output(f"blends/sculpting/{SLUG}/sculpted_talisman.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[holoflow] saved blend → {blend_path}")

# ── 16. export GLB (level 0 + baked normal map, Draco 6, WebP) ───────────────
mr.levels        = 0
mr.render_levels = 0
bpy.ops.object.select_all(action="DESELECT")
low.select_set(True)

glb_path = _output(f"glbs/sculpting/{SLUG}/sculpted_talisman.glb")
os.makedirs(os.path.dirname(glb_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath          = glb_path,
    export_format     = "GLB",
    use_selection     = True,
    export_apply      = True,   # applies Multires at level 0 → pure quad mesh
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_normals    = True,
    export_materials  = "EXPORT",
    export_texcoords  = True,
    export_tangents   = True,   # required for tangent-space normal maps in glTF
)
print(f"[holoflow] GLB → {glb_path}")
