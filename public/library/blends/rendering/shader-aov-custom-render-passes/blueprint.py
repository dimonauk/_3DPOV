"""
Shader AOV — Custom Render Passes (Blender 5.1)
=================================================
Three AOV passes — GlowMask (Value), RimMask (Color), FlatNormal
(Color) — registered via view_layer.aovs, wired into a faceted
sapphire gem, rendered to multilayer EXR, and recombined in the
Compositor to gate Glare and per-region colour grading.

AOV vs built-in pass: AOV is a SHADER-WRITE into a named EXR slot.
The renderer stores the value; the beauty buffer is unaffected. A
built-in pass (Diffuse, Specular, Shadow) is a POST-render filter on
a geometry buffer — the shader cannot write into it.

CRITICAL: node.name on ShaderNodeOutputAOV IS the AOV target name.
It must match vl.aovs[n].name exactly (case-sensitive). Mismatch
silently renders black with no error.

CC0 — Blender 5.1 — no external dependencies
"""

import bpy
import math
from mathutils import Vector

# ─── CONSTANTS ──────────────────────────────────────────────────────
RESOLUTION_X   = 1920
RESOLUTION_Y   = 1080
RENDER_SAMPLES = 64
OUTPUT_PATH    = "//output/aov_passes_####"

SUBDIV         = 2           # IcoSphere subdivisions → 80-face gem
CAM_DIST       = 5.0
CAM_ELEV       = 0.4         # radians above equator

BASE_COLOR     = (0.03, 0.06, 0.18)
GLOW_COLOR     = (0.15, 0.55, 1.00)
RIM_COLOR      = (0.75, 0.92, 1.00)
FRESNEL_IOR    = 1.45
RIM_POWER      = 5.0         # sharpens Fresnel band


# ─── SCENE ──────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.lights, bpy.data.cameras):
        for item in list(col):
            try:
                col.remove(item)
            except Exception:
                pass


def set_render() -> bpy.types.Scene:
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.render.resolution_x = RESOLUTION_X
    s.render.resolution_y = RESOLUTION_Y
    s.render.filepath = OUTPUT_PATH
    # OPEN_EXR_MULTILAYER writes every pass; OPEN_EXR only writes Combined.
    s.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'
    s.render.image_settings.exr_codec   = 'ZIP'
    s.render.image_settings.color_depth = '32'
    s.cycles.samples        = RENDER_SAMPLES
    s.cycles.use_denoising  = True
    return s


def add_camera(scene):
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "aov_cam"
    cam.location = Vector((
        CAM_DIST * math.cos(CAM_ELEV),
        -CAM_DIST * math.cos(CAM_ELEV),
        CAM_DIST * math.sin(CAM_ELEV),
    ))
    cam.rotation_euler = (math.pi / 2 - CAM_ELEV, 0.0, math.pi / 4)
    scene.camera = cam


def add_world(scene):
    w = bpy.data.worlds.new("aov_world")
    scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value    = (0.01, 0.01, 0.02, 1.0)
    bg.inputs["Strength"].default_value = 0.3


# ─── GEOMETRY ───────────────────────────────────────────────────────

def add_gem() -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=SUBDIV, radius=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "amulet_gem"
    for poly in obj.data.polygons:
        poly.use_smooth = False       # flat shading → per-face normals
    return obj


# ─── AOV REGISTRATION ───────────────────────────────────────────────

def register_aovs(scene):
    """
    Register AOV slots on the ViewLayer.

    aov.name and aov.type must be set BEFORE building the material.
    EXR slot key: "ViewLayer.AOV.<name>"
    Compositor socket: appears on RenderLayers after first render.
    """
    vl = scene.view_layers["ViewLayer"]
    while vl.aovs:
        vl.aovs.remove(vl.aovs[0])
    for name, kind in (
        ("GlowMask",   "VALUE"),   # scalar → Glare gate
        ("RimMask",    "COLOR"),   # vec  → hue grade
        ("FlatNormal", "COLOR"),   # vec  → normal debug
    ):
        a = vl.aovs.add()
        a.name = name
        a.type = kind


# ─── MATERIAL ───────────────────────────────────────────────────────

def _nd(tree, bl_id, x=0.0, y=0.0):
    n = tree.nodes.new(bl_id)
    n.location = (x, y)
    return n

def _lk(tree, out, inp):
    tree.links.new(out, inp)


def build_material(obj):
    mat = bpy.data.materials.new("amulet_aov_mat")
    mat.use_nodes = True
    obj.data.materials.append(mat)
    t = mat.node_tree
    t.nodes.clear()

    out  = _nd(t, 'ShaderNodeOutputMaterial', 700, 300)
    bsdf = _nd(t, 'ShaderNodeBsdfPrincipled',   0, 300)
    bsdf.inputs["Base Color"].default_value          = (*BASE_COLOR, 1.0)
    bsdf.inputs["Roughness"].default_value           = 0.02
    bsdf.inputs["IOR"].default_value                 = 1.68
    bsdf.inputs["Transmission Weight"].default_value = 0.85
    bsdf.inputs["Emission Color"].default_value      = (*GLOW_COLOR, 1.0)
    bsdf.inputs["Emission Strength"].default_value   = 0.4

    fres = _nd(t, 'ShaderNodeFresnel', -400, 100)
    fres.inputs["IOR"].default_value = FRESNEL_IOR

    pwr = _nd(t, 'ShaderNodeMath', -200, 100)
    pwr.operation = 'POWER'
    pwr.inputs[1].default_value = RIM_POWER
    _lk(t, fres.outputs["Fac"], pwr.inputs[0])

    rim = _nd(t, 'ShaderNodeEmission', 0, 100)
    rim.inputs["Color"].default_value = (*GLOW_COLOR, 1.0)
    _lk(t, pwr.outputs["Value"], rim.inputs["Strength"])

    mix = _nd(t, 'ShaderNodeMixShader', 400, 300)
    _lk(t, pwr.outputs["Value"],         mix.inputs["Fac"])
    _lk(t, bsdf.outputs["BSDF"],         mix.inputs[1])
    _lk(t, rim.outputs["Emission"],      mix.inputs[2])
    _lk(t, mix.outputs["Shader"],        out.inputs["Surface"])

    # ── AOV: GlowMask (Value) — raw Fresnel scalar ─────────────────
    ag = _nd(t, 'ShaderNodeOutputAOV', 400, -100)
    ag.name = "GlowMask"
    _lk(t, pwr.outputs["Value"], ag.inputs["Value"])

    # ── AOV: RimMask (Color) — Fresnel × RIM_COLOR ─────────────────
    rgb = _nd(t, 'ShaderNodeRGB',  -400, -200)
    rgb.outputs[0].default_value = (*RIM_COLOR, 1.0)
    rmix = _nd(t, 'ShaderNodeMix', -200, -200)
    rmix.data_type  = 'RGBA'
    rmix.blend_type = 'MULTIPLY'
    rmix.inputs["Factor"].default_value = 1.0
    _lk(t, pwr.outputs["Value"],     rmix.inputs["A"])
    _lk(t, rgb.outputs["Color"],     rmix.inputs["B"])
    ar = _nd(t, 'ShaderNodeOutputAOV', 400, -250)
    ar.name = "RimMask"
    _lk(t, rmix.outputs["Result"], ar.inputs["Color"])

    # ── AOV: FlatNormal (Color) — world normal → [0,1] ─────────────
    # Remap [-1,1] to [0,1]: (N + 1) / 2. Negative components clip
    # to black in compositors that assume [0,1] colour channels.
    geo  = _nd(t, 'ShaderNodeNewGeometry', -400, -400)
    nadd = _nd(t, 'ShaderNodeVectorMath',  -200, -400)
    nadd.operation = 'ADD'
    nadd.inputs[1].default_value = (1.0, 1.0, 1.0)
    _lk(t, geo.outputs["Normal"], nadd.inputs[0])
    ndiv = _nd(t, 'ShaderNodeVectorMath',  0, -400)
    ndiv.operation = 'DIVIDE'
    ndiv.inputs[1].default_value = (2.0, 2.0, 2.0)
    _lk(t, nadd.outputs["Vector"], ndiv.inputs[0])
    an = _nd(t, 'ShaderNodeOutputAOV', 400, -400)
    an.name = "FlatNormal"
    _lk(t, ndiv.outputs["Vector"], an.inputs["Color"])


# ─── COMPOSITOR ─────────────────────────────────────────────────────

def build_compositor(scene):
    """
    Combined + GlowMask→Glare(GHOSTS)      mixed Add(0.7)
               + RimMask→RGBCurves(blue+)  mixed Add(0.25)
    FlatNormal → Viewer node for debug inspection.

    Gating Glare on GlowMask (not Combined) blooms only rim edges;
    the background and gem interior remain unaffected.
    """
    scene.use_nodes = True
    ct = scene.node_tree
    ct.nodes.clear()

    rl = ct.nodes.new('CompositorNodeRLayers')
    rl.location = (-600, 0)
    rl.scene = scene

    glare = ct.nodes.new('CompositorNodeGlare')
    glare.location = (-200, -250)
    glare.glare_type = 'GHOSTS'
    glare.quality    = 'HIGH'
    glare.threshold  = 0.25
    glare.mix        = 0.7
    ct.links.new(rl.outputs["GlowMask"], glare.inputs["Image"])

    curves = ct.nodes.new('CompositorNodeCurveRGB')
    curves.location = (-200, -550)
    curves.mapping.curves[2].points[1].location = (1.0, 1.15)
    ct.links.new(rl.outputs["RimMask"], curves.inputs["Image"])

    mg = ct.nodes.new('CompositorNodeMixRGB')
    mg.location = (100, 0)
    mg.blend_type = 'ADD'
    mg.inputs["Fac"].default_value = 0.7
    ct.links.new(rl.outputs["Combined"], mg.inputs[1])
    ct.links.new(glare.outputs["Image"],  mg.inputs[2])

    mr = ct.nodes.new('CompositorNodeMixRGB')
    mr.location = (350, 0)
    mr.blend_type = 'ADD'
    mr.inputs["Fac"].default_value = 0.25
    ct.links.new(mg.outputs["Image"],      mr.inputs[1])
    ct.links.new(curves.outputs["Image"],  mr.inputs[2])

    viewer = ct.nodes.new('CompositorNodeViewer')
    viewer.location = (-200, -850)
    ct.links.new(rl.outputs["FlatNormal"], viewer.inputs["Image"])

    comp = ct.nodes.new('CompositorNodeComposite')
    comp.location = (600, 0)
    ct.links.new(mr.outputs["Image"], comp.inputs["Image"])


# ─── ENTRY POINT ────────────────────────────────────────────────────

def main():
    clear_scene()
    scene = set_render()
    add_camera(scene)
    add_world(scene)
    gem = add_gem()
    register_aovs(scene)
    build_material(gem)
    build_compositor(scene)
    bpy.ops.wm.save_as_mainfile(filepath="//aov_amulet.blend")
    print("Ready. F12 to render. EXR layers:")
    print("  ViewLayer.Combined")
    print("  ViewLayer.AOV.GlowMask")
    print("  ViewLayer.AOV.RimMask")
    print("  ViewLayer.AOV.FlatNormal")


if __name__ == "__main__":
    main()
