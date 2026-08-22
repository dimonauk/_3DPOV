"""
Blender 5.1 — Compositor: Mist Pass + Z-Depth Defocus
======================================================
Technique: Two complementary depth-based compositor effects:

  1. DEFOCUS (lens DOF) — wires the camera's Z pass into the Compositor's
     Defocus node to produce physically-motivated bokeh with the real depth
     buffer, independent of EEVEE's viewport-compositing DOF.

  2. ATMOSPHERIC MIST — uses the Mist pass (a remapped, normalised depth
     buffer) to lerp the render towards a fog colour, matching Cycles'
     volumetric fog look at a fraction of the render cost.

Using both simultaneously: first Defocus to blur distant geometry, then
Mix with the Mist colour on top so distant blurred geometry also hazes.
The Mist pass must be configured in World Properties to set the near/far
ramp distances — it is NOT the same as the Z pass.

Blender 5.1 passes API:
  bpy.context.view_layer.use_pass_z    = True   # raw Z depth (0..inf)
  bpy.context.view_layer.use_pass_mist = True   # normalised mist (0..1)

World mist settings live under bpy.context.scene.world.mist_settings.

Author: Holoflow Studio Blender Expert Mill
Licence: CC0
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Constants ─────────────────────────────────────────────────────────────────
SCENE_NAME      = "mist_depth_scene"
CAM_DIST        = 10.0       # camera distance from world origin
NEAR_OBJ_DIST   = 2.5        # object distances along -Y
MID_OBJ_DIST    = 5.0
FAR_OBJ_DIST    = 9.0
FOCUS_DIST      = MID_OBJ_DIST   # camera focuses on the mid object
F_STOP          = 2.8            # aperture; lower = shallower DOF
MIST_START      = 1.0            # world units before mist begins
MIST_DEPTH      = 8.0            # world units over which mist goes 0→1
MIST_FALLOFF    = "QUADRATIC"    # LINEAR / QUADRATIC / INVERSE_QUADRATIC
FOG_COLOUR      = (0.55, 0.62, 0.72, 1.0)   # cool atmospheric haze
RENDER_RES_X    = 1280
RENDER_RES_Y    = 720
OUTPUT_PATH     = "//renders/mist_depth_####"


# ── Clean slate ───────────────────────────────────────────────────────────────
def purge_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block_type in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                       bpy.data.cameras, bpy.data.worlds):
        for blk in list(block_type):
            block_type.remove(blk)


# ── Camera ────────────────────────────────────────────────────────────────────
def build_camera(scene):
    cam_data = bpy.data.cameras.new("cam")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.location = (0.0, -CAM_DIST, 2.0)
    cam_obj.rotation_euler = (math.radians(78), 0.0, 0.0)

    # Camera DOF settings (also read by the Compositor Defocus node)
    cam_data.dof.use_dof        = True
    cam_data.dof.focus_distance = FOCUS_DIST
    cam_data.dof.aperture_fstop = F_STOP
    return cam_obj


# ── Scene objects ─────────────────────────────────────────────────────────────
def add_object_at_depth(scene, depth, label, mat_colour):
    """Add a simple icosphere at a given Y depth with a flat diffuse material."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.5,
                                          location=(0.0, depth, 0.5))
    obj = bpy.context.active_object
    obj.name = label

    mat = bpy.data.materials.new(label + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = mat_colour
        bsdf.inputs["Roughness"].default_value  = 0.85
        bsdf.inputs["Metallic"].default_value   = 0.0
    obj.data.materials.append(mat)
    return obj


def build_ground_plane(scene):
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "ground"

    mat = bpy.data.materials.new("ground_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.25, 0.28, 0.22, 1.0)
        bsdf.inputs["Roughness"].default_value  = 0.95
    ground.data.materials.append(mat)


# ── Lighting ──────────────────────────────────────────────────────────────────
def build_light(scene):
    sun_data = bpy.data.lights.new("sun", type="SUN")
    sun_data.energy = 2.5
    sun_data.angle  = math.radians(5)
    sun_obj  = bpy.data.objects.new("Sun", sun_data)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(55), math.radians(-20), math.radians(30))


# ── World / Mist ──────────────────────────────────────────────────────────────
def build_world(scene):
    world = bpy.data.worlds.new("world")
    scene.world = world
    world.use_nodes = True

    # Background colour matches the far-end fog
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value   = FOG_COLOUR
        bg_node.inputs["Strength"].default_value = 1.0

    # Mist pass parameters — these define how the Mist pass is normalised:
    #   mist_start  → world-units at which the pass value becomes 0 (fully visible)
    #   mist_depth  → range over which it ramps to 1 (fully occluded)
    #   falloff     → curve shape (QUADRATIC produces natural atmospheric rolloff)
    mist = world.mist_settings
    mist.use_mist     = True
    mist.start        = MIST_START
    mist.depth        = MIST_DEPTH
    mist.falloff      = MIST_FALLOFF
    return world


# ── Render passes ─────────────────────────────────────────────────────────────
def enable_passes(scene):
    view_layer = scene.view_layers[0]
    # Z pass: raw depth in world units, needed by the Defocus node
    view_layer.use_pass_z    = True
    # Mist pass: normalised 0..1 depth, needed for the fog mix
    view_layer.use_pass_mist = True
    # Combined (beauty) is enabled by default; confirm it
    view_layer.use_pass_combined = True


# ── Compositor ────────────────────────────────────────────────────────────────
def build_compositor(scene, cam_obj):
    """
    Chain:  Render Layers
              ├─ Image ──→ Defocus (Z input from Z pass) ──→ Mix (fog) ──→ Composite
              ├─ Z     ──→ Defocus.Z
              └─ Mist  ──→ Mix.Fac
    The Defocus node reads the camera's F-Stop from the active camera when
    use_zbuffer=True, so dof.aperture_fstop drives both the camera render and
    the compositor node without duplication.
    """
    scene.use_nodes = True
    tree  = scene.node_tree
    nodes = tree.nodes
    links = tree.links

    # Clear default nodes
    nodes.clear()

    # ── Source ──
    rl = nodes.new("CompositorNodeRLayers")
    rl.location = (-600, 300)

    # ── Defocus node ──
    # use_zbuffer=True tells the node to read the raw Z pass (in world units),
    # matching depth against the camera's focal distance.
    # Setting use_zbuffer=False would require a pre-normalised depth map.
    defocus = nodes.new("CompositorNodeDefocus")
    defocus.location   = (-250, 300)
    defocus.use_zbuffer = True
    defocus.f_stop     = F_STOP     # must match camera for lens-accurate result
    defocus.blur_max   = 24         # pixel cap — prevents absurd blur at z≈0
    defocus.quality    = "HIGH"
    defocus.use_preview = False     # preview reduces quality; always False for final
    # Bokeh shape defaults to disc (fastest); LENS produces more cinematic scatter
    defocus.bokeh      = "LENS"
    defocus.angle      = 0.0        # blade rotation (for polygonal aperture)
    defocus.scene      = scene      # required so node knows the active camera's DOF

    # ── Fog mix: lerp beauty toward fog colour based on mist pass ──
    # AlphaOver would hard-clip; MixRGB with Fac=Mist smoothly blends to atmosphere.
    fog_colour_node = nodes.new("CompositorNodeRGB")
    fog_colour_node.location = (-250, -100)
    fog_colour_node.outputs[0].default_value = FOG_COLOUR

    fog_mix = nodes.new("CompositorNodeMixRGB")
    fog_mix.location      = (100, 300)
    fog_mix.blend_type    = "MIX"
    fog_mix.use_clamp     = False
    # Fac = 0 → image unchanged, Fac = 1 → full fog colour
    # We wire Mist pass into Fac so near objects stay clear, far objects fog.

    # ── Composite output ──
    comp = nodes.new("CompositorNodeComposite")
    comp.location = (400, 300)

    # Optional viewer for inspection in the compositor workspace
    viewer = nodes.new("CompositorNodeViewer")
    viewer.location = (400, 100)

    # ── Wire ──
    # Render Layers → Defocus (image + Z depth)
    links.new(rl.outputs["Image"],  defocus.inputs["Image"])
    links.new(rl.outputs["Depth"],  defocus.inputs["Z"])

    # Defocus output → Fog mix (Image slot 1 = "Image", Image slot 2 = overlay)
    links.new(defocus.outputs["Image"],         fog_mix.inputs["Image"])
    links.new(fog_colour_node.outputs["RGBA"],  fog_mix.inputs["Image_001"])

    # Mist pass → fog mix factor
    links.new(rl.outputs["Mist"], fog_mix.inputs["Fac"])

    # Fog mix → Composite + Viewer
    links.new(fog_mix.outputs["Image"], comp.inputs["Image"])
    links.new(fog_mix.outputs["Image"], viewer.inputs["Image"])


# ── Render settings ───────────────────────────────────────────────────────────
def configure_render(scene):
    scene.render.engine         = "CYCLES"
    scene.cycles.samples        = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x  = RENDER_RES_X
    scene.render.resolution_y  = RENDER_RES_Y
    scene.render.filepath      = OUTPUT_PATH
    scene.render.image_settings.file_format  = "PNG"
    scene.render.image_settings.color_depth  = "16"


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    scene = bpy.context.scene
    scene.name = SCENE_NAME

    purge_scene()

    cam = build_camera(scene)
    build_light(scene)
    build_world(scene)

    # Three objects at different depths to make the DOF and mist visible
    add_object_at_depth(scene, NEAR_OBJ_DIST,  "near_orb",  (0.85, 0.25, 0.20, 1.0))
    add_object_at_depth(scene, MID_OBJ_DIST,   "mid_orb",   (0.20, 0.65, 0.85, 1.0))
    add_object_at_depth(scene, FAR_OBJ_DIST,   "far_orb",   (0.85, 0.80, 0.20, 1.0))
    build_ground_plane(scene)

    enable_passes(scene)
    build_compositor(scene, cam)
    configure_render(scene)

    print("[mist_depth] Scene ready. Open Compositor workspace to inspect the tree.")
    print("[mist_depth] Render with F12 or run record.py to produce viewport.mp4.")


if __name__ == "__main__":
    main()
