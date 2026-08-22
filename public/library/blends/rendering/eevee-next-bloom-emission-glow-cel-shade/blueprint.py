"""
EEVEE Next — Bloom via Compositor: Emission Threshold Glow for Cel-Shade Props
Blender 5.1  |  CC0  |  Holoflow Studio

Technique
---------
In Blender 4.2 the old EEVEE "Bloom" checkbox in Render Properties was removed.
EEVEE Next instead routes bloom through the Compositor's "Glare" node in BLUR mode
(not the old additive mode).  The Viewport Compositor (on by default in 5.x) means
bloom is visible live in the 3D viewport — no separate render needed for tweaking.

The workflow here:
  1. Cel-shade prop — flat Emission on outline edges / power-core faces.
  2. Compositor tree: Render Layers → Glare (BLOOM mode, threshold = BLOOM_THRESHOLD)
       → Composite + Viewer.
  3. bpy.context.scene.use_nodes = True to activate compositor.
  4. Viewport Compositor: scene.view_settings.use_curve_mapping stays False
       but bpy.context.space_data.shading.use_compositor = 'ALWAYS' fires bloom
       live without a full render.
  5. Animated driver: Emission strength keyed to a custom property so the glow
       pulses — demonstrates parametric bloom without a texture.

Why Compositor bloom beats the old toggle
  Old toggle: additive flare, no threshold, every bright pixel bloomed uniformly.
  Glare node:  threshold isolates high-luminance pixels (emission, specular hotspots);
               size controls spatial spread independently of intensity; the mix slider
               lets you blend the raw buffer back for tighter control.
  For cel-shade: set threshold above the cel-colour value (0.7) so only emission
               faces (1.0+ after strength multiplier) bloom.  Body flats stay clean.

Scene layout
  PROP_NAME  = "power_core_prop"
  Low-poly gem prop (Ico-sphere subdivided 1×, face-dissolved to facets).
  Three material slots:
    mat_body      — Cel toon ramp, no emission.
    mat_trim      — Emission strength = TRIM_EMIT_STRENGTH (1.5), colour TRIM_COLOUR.
    mat_core      — Emission strength = CORE_EMIT_STRENGTH (4.0), colour CORE_COLOUR.
  Armature + driver: custom property "pulse" (0→1) → core emission strength (4→8).

Export for WebXR
  GLB retains emission factor on the KHR_materials_emissive_strength extension.
  Three.js bloom is handled client-side (UnrealBloomPass), so export emission
  colour + factor; bake bloom into a lightmap only for low-end devices.
"""

import bpy
import math
import os
from mathutils import Vector, Color

# ─── Constants ─────────────────────────────────────────────────────────────────
PROP_NAME          = "power_core_prop"
BODY_COLOUR        = (0.08, 0.08, 0.14, 1.0)   # deep navy cel base
TRIM_COLOUR        = (0.10, 0.85, 1.00, 1.0)   # cyan trim
CORE_COLOUR        = (1.00, 0.55, 0.00, 1.0)   # amber core
TRIM_EMIT_STRENGTH = 1.5
CORE_EMIT_STRENGTH = 4.0
PULSE_MAX_STRENGTH = 8.0                        # driven upper bound

BLOOM_THRESHOLD    = 0.75   # Glare node: only pixels brighter than this bloom
BLOOM_SIZE         = 8      # Glare Streaks/Blur size (1-9)
BLOOM_MIX          = 0.80   # how strongly bloom overlays the original

FACET_SUBDIV       = 1      # 1× Loop-Cut subdiv → dissolve → faceted
OUTPUT_DIR         = "//public/library/blends/rendering/eevee-next-bloom-emission-glow-cel-shade"
GLB_PATH           = OUTPUT_DIR + "/power_core_prop.glb"

# ─── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "bloom_emission_glow"
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.frame_start = 1
scene.frame_end   = 60
scene.render.fps   = 30

# ─── EEVEE Next settings ────────────────────────────────────────────────────────
eevee = scene.eevee
eevee.use_raytracing            = True   # EEVEE Next reflection rays
eevee.ray_tracing_options.resolution_scale = "0.5"

# ─── Materials ──────────────────────────────────────────────────────────────────
def make_emission_mat(name: str, base_colour: tuple, emit_strength: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out   = tree.nodes.new("ShaderNodeOutputMaterial")
    mix   = tree.nodes.new("ShaderNodeMixShader")
    diff  = tree.nodes.new("ShaderNodeBsdfDiffuse")
    emit  = tree.nodes.new("ShaderNodeEmission")
    lpath = tree.nodes.new("ShaderNodeLightPath")

    diff.inputs["Color"].default_value  = base_colour
    diff.inputs["Roughness"].default_value = 1.0
    emit.inputs["Color"].default_value  = base_colour
    emit.inputs["Strength"].default_value = emit_strength

    # mix.Fac driven by Is Camera Ray so emission only fires for camera view
    tree.links.new(lpath.outputs["Is Camera Ray"], mix.inputs[0])
    tree.links.new(diff.outputs["BSDF"],           mix.inputs[1])
    tree.links.new(emit.outputs["Emission"],       mix.inputs[2])
    tree.links.new(mix.outputs["Shader"],          out.inputs["Surface"])
    return mat

def make_cel_mat(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    diff = tree.nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value    = colour
    diff.inputs["Roughness"].default_value = 1.0
    tree.links.new(diff.outputs["BSDF"], out.inputs["Surface"])
    return mat

mat_body = make_cel_mat("mat_body", BODY_COLOUR)
mat_trim = make_emission_mat("mat_trim", TRIM_COLOUR, TRIM_EMIT_STRENGTH)
mat_core = make_emission_mat("mat_core", CORE_COLOUR, CORE_EMIT_STRENGTH)

# ─── Prop geometry ──────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=FACET_SUBDIV, radius=1.0, location=(0, 0, 0))
prop = bpy.context.active_object
prop.name = PROP_NAME

# Flatten normals — auto-smooth off, flat shading → faceted look
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.faces_shade_flat()
bpy.ops.object.mode_set(mode="OBJECT")

prop.data.materials.append(mat_body)
prop.data.materials.append(mat_trim)
prop.data.materials.append(mat_core)

# Assign top cluster (faces with Z > 0.6) to trim, northernmost 4 to core
import bmesh
bm = bmesh.new()
bm.from_mesh(prop.data)
bm.faces.ensure_lookup_table()
for face in bm.faces:
    cz = face.calc_center_median().z
    if cz > 0.75:
        face.material_index = 2   # core
    elif cz > 0.45:
        face.material_index = 1   # trim
    # else body (0)
bm.to_mesh(prop.data)
bm.free()

# ─── Driver: custom property "pulse" → core emission strength ───────────────────
prop.data["pulse"] = 0.0
prop.data.id_properties_ui("pulse").update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0)

# Animate pulse property: 0 → 1 over 60 frames (sine ease)
for frame in range(1, 61):
    t = (frame - 1) / 59.0
    prop.data["pulse"] = 0.5 - 0.5 * math.cos(math.pi * t)
    prop.data.keyframe_insert(data_path='["pulse"]', frame=frame)

# Driver on mat_core emission strength
core_emit_node = mat_core.node_tree.nodes["Emission"]
driver_node = core_emit_node.inputs["Strength"].driver_add("default_value")
drv = driver_node.driver
drv.type = "SCRIPTED"
var = drv.variables.new()
var.name = "pulse"
var.type = "SINGLE_PROP"
tgt = var.targets[0]
tgt.id_type = "MESH"
tgt.id   = prop.data
tgt.data_path = '["pulse"]'
drv.expression = f"{CORE_EMIT_STRENGTH} + pulse * {PULSE_MAX_STRENGTH - CORE_EMIT_STRENGTH}"

# ─── World & Lighting ───────────────────────────────────────────────────────────
world = bpy.data.worlds.new("bloom_world")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)  # near-black
bg.inputs["Strength"].default_value = 0.1
scene.world = world

bpy.ops.object.light_add(type="POINT", location=(3, -2, 4))
key_light = bpy.context.active_object
key_light.data.energy = 80.0
key_light.data.color  = (1.0, 0.95, 0.9)
key_light.data.shadow_soft_size = 0.5

# Rim light — cool rim to contrast warm core
bpy.ops.object.light_add(type="SPOT", location=(-2, 3, 2))
rim = bpy.context.active_object
rim.data.energy     = 30.0
rim.data.color      = (0.4, 0.7, 1.0)
rim.data.spot_size  = math.radians(45)
rim.data.spot_blend = 0.15
rim.rotation_euler  = (math.radians(60), 0, math.radians(220))

# ─── Camera ─────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -3.5, 1.0))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(75), 0, 0)
scene.camera = cam

# ─── Compositor — Bloom via Glare node ──────────────────────────────────────────
scene.use_nodes = True
tree = scene.node_tree
for node in tree.nodes:
    tree.nodes.remove(node)

rl    = tree.nodes.new("CompositorNodeRLayers")
glare = tree.nodes.new("CompositorNodeGlare")
comp  = tree.nodes.new("CompositorNodeComposite")
view  = tree.nodes.new("CompositorNodeViewer")

rl.location    = (-300, 0)
glare.location = (0, 0)
comp.location  = (300, 0)
view.location  = (300, -150)

# Glare in BLOOM mode is the EEVEE Next bloom replacement.
# SIMPLE = old-style streaks. BLOOM = soft halo, threshold respected.
glare.glare_type  = "BLOOM"
glare.quality     = "HIGH"
glare.threshold   = BLOOM_THRESHOLD   # 0.75 — cel body (0.7 L) stays below
glare.size        = BLOOM_SIZE        # 8 = wide soft corona
glare.mix         = BLOOM_MIX         # 0.80 = strong overlay

tree.links.new(rl.outputs["Image"],    glare.inputs["Image"])
tree.links.new(glare.outputs["Image"], comp.inputs["Image"])
tree.links.new(glare.outputs["Image"], view.inputs["Image"])

# ─── Viewport Compositor activation (requires bpy.context.area) ─────────────────
# In a headed session switch the 3D viewport shading compositor on:
#   bpy.context.space_data.shading.use_compositor = 'ALWAYS'
# In batch/headless this is set per-SpaceView3D in the saved .blend.
# blueprint.py comment instructs operator: after running, press N → View → Compositor.

# ─── GLB Export ─────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
prop.select_set(True)
bpy.context.view_layer.objects.active = prop

os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath       = bpy.path.abspath(GLB_PATH),
    use_selection  = True,
    export_format  = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
    export_materials                     = "EXPORT",
    export_animations                    = True,
    export_nla_strips                    = True,
    export_apply                         = True,
    export_yup                           = True,
    # Emission strength via KHR_materials_emissive_strength extension
    export_gltf_extensions               = True,
)

print(f"[bloom] GLB written → {bpy.path.abspath(GLB_PATH)}")
print("[bloom] To preview bloom: Run ▸ Compositor workspace, or press F12.")
print("[bloom] Viewport bloom: N panel ▸ View ▸ Compositor ▸ Always.")
