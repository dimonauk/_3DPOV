"""
Cycles Light Groups — Non-Destructive Studio Relighting (Blender 5.1)
=====================================================================
Technique: Three named light groups — neon_left (cool blue), neon_right (warm pink),
ceiling (neutral white) — partition the scene's lights into independent Cycles colour
channels. The resulting EXR embeds one full-HDR layer per group; the Compositor mixes
them with per-group Gamma nodes so you can shift any light's intensity or hue
post-render without spending a single additional sample.

When to use Light Groups vs re-rendering
-----------------------------------------
Re-render when light *position* or *shadow shape* changes — those are geometry-dependent
and cannot be composed away. Use Light Groups when only *intensity*, *hue*, or *relative
balance* changes. A single 512-sample render is ≈40 s on modern CPU; delivering twelve
lighting variants via compositor mixing still costs 40 s total, not 480 s.

Sources
-------
- Blender Manual: Cycles Light Groups
  https://docs.blender.org/manual/en/latest/render/cycles/render_settings/light_groups.html
  CC-BY-SA 4.0, Blender Documentation Team
- Blender Python API: ViewLayerLightgroup
  https://docs.blender.org/api/current/bpy.types.ViewLayerLightgroup.html
  CC-BY-SA 4.0, Blender Foundation
"""

import bpy
import math

# ── Constants ────────────────────────────────────────────────────────────────
RENDER_W    = 1280
RENDER_H    = 720
SAMPLES     = 64         # adequate for demo; 512+ for production
OUTPUT_EXR  = "//output/relight_scene"   # Cycles appends frame number + .exr

GEM_SUBDIVISIONS = 2    # ico sphere level 2 → 320 flat-shaded triangular facets
GEM_RADIUS       = 0.48
GEM_HEIGHT_OFFSET = 0.55  # lift gem above pedestal top

PEDESTAL_RADIUS = 0.38
PEDESTAL_SIDES  = 8     # octagonal — matches gem's angular aesthetic
PEDESTAL_H      = 0.55

GEM_IOR = 1.77          # sapphire refractive index; glass = 1.5; diamond = 2.42
PEDESTAL_COLOUR = (0.04, 0.04, 0.06)  # near-black matte — maximises contrast

# Each light group: area light colour (linear sRGB), power (W), world location
LIGHT_GROUPS: dict = {
    "neon_left":  {"colour": (0.12, 0.38, 1.00), "power": 90.0, "loc": (-1.8, -0.5, 1.5)},
    "neon_right": {"colour": (1.00, 0.22, 0.58), "power": 90.0, "loc": ( 1.8, -0.5, 1.5)},
    "ceiling":    {"colour": (1.00, 0.96, 0.88), "power": 40.0, "loc": ( 0.0,  0.0,  2.8)},
}

CAM_LOC      = (0.0, -2.8, 0.9)
CAM_ROT_DEG  = (78.0, 0.0, 0.0)
CAM_FOCAL_MM = 85.0    # flattering for jewellery — minimal barrel distortion


# ── Scene geometry ───────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(blk):
            blk.remove(item)


def make_gem() -> bpy.types.Object:
    """
    Icosphere at subdivision 2 with flat shading — the classic Holoflow faceted gem.
    Flat shading forces each triangular face to carry its own normal, so each
    facet reads as a distinct mirror plane. Under a coloured area light the facets
    catch discrete colour patches and sparkle independently.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=GEM_SUBDIVISIONS,
        radius=GEM_RADIUS,
        location=(0, 0, PEDESTAL_H + GEM_HEIGHT_OFFSET),
    )
    obj = bpy.context.active_object
    obj.name = "gem"
    # Apply flat shading: each face normal is the geometric face normal
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.faces_shade_flat()
    bpy.ops.object.mode_set(mode="OBJECT")
    return obj


def make_pedestal() -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=PEDESTAL_SIDES,
        radius=PEDESTAL_RADIUS,
        depth=PEDESTAL_H,
        location=(0, 0, PEDESTAL_H * 0.5),
    )
    obj = bpy.context.active_object
    obj.name = "pedestal"
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.faces_shade_flat()
    bpy.ops.object.mode_set(mode="OBJECT")
    return obj


# ── Materials ────────────────────────────────────────────────────────────────

def make_gem_material() -> bpy.types.Material:
    """
    Full-transmission Principled BSDF — sapphire IOR (1.77).
    roughness=0 is required: any roughness scatters the refracted caustic and
    the gem reads as frosted glass rather than polished crystal.
    Coat Weight=1 adds the surface specular highlight layer on top of transmission.
    """
    mat = bpy.data.materials.new("GemGlass")
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    out  = mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value       = (0.85, 0.95, 1.00, 1.0)
    bsdf.inputs["Roughness"].default_value        = 0.0
    bsdf.inputs["IOR"].default_value              = GEM_IOR
    bsdf.inputs["Transmission Weight"].default_value = 1.0  # Blender 4.0+ renamed field
    bsdf.inputs["Coat Weight"].default_value      = 1.0
    bsdf.inputs["Coat Roughness"].default_value   = 0.0
    bsdf.location = (-300, 0)
    out.location  = (0, 0)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_pedestal_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("PedestalMatte")
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    out  = mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*PEDESTAL_COLOUR, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.85
    bsdf.location = (-300, 0)
    out.location  = (0, 0)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── Light groups ─────────────────────────────────────────────────────────────

def setup_light_groups(scene: bpy.types.Scene) -> None:
    """
    Light Groups live on the ViewLayer, not the Scene — each view layer manages
    its own partition independently. A multi-layer project can therefore give each
    layer a different lighting rig without duplicating light objects.

    Object.lightgroup (str) references a group by name. The assignment is on the
    Object data-block, not the Light data-block — a single light could theoretically
    be reassigned to different groups per instance, though that is rarely useful.

    CRITICAL: A mistyped group name silently excludes the light from all groups.
    The light still contributes to the Combined pass; the mistake only reveals itself
    when the per-group EXR layer is solid black.
    """
    view_layer = bpy.context.view_layer
    gem_obj    = scene.objects.get("gem")  # TrackTo target — added before this call

    for group_name, cfg in LIGHT_GROUPS.items():
        lg      = view_layer.lightgroups.add()
        lg.name = group_name

        ldata         = bpy.data.lights.new(f"Light_{group_name}", "AREA")
        ldata.energy  = cfg["power"]
        ldata.color   = cfg["colour"]
        ldata.shape   = "DISK"
        ldata.size    = 0.35       # disk diameter — larger = softer shadow

        lobj          = bpy.data.objects.new(f"Light_{group_name}", ldata)
        lobj.location = cfg["loc"]
        lobj.lightgroup = group_name  # the crucial group assignment

        if gem_obj:
            trk            = lobj.constraints.new("TRACK_TO")
            trk.target     = gem_obj
            trk.track_axis = "TRACK_NEGATIVE_Z"
            trk.up_axis    = "UP_Y"

        bpy.context.collection.objects.link(lobj)


# ── Compositor ───────────────────────────────────────────────────────────────

def setup_compositor(scene: bpy.types.Scene) -> None:
    """
    Three Gamma nodes — one per light group — act as per-channel exposure controls.
    Setting Gamma > 1 contracts highlights (darkens); Gamma < 1 expands them (brightens).
    The Mix (ADD) nodes sum the three channels: correct for linear HDR light passes.
    Using Screen or Overlay blend modes here would introduce non-linear cross-channel
    artefacts in the highlights.

    Light group output socket names on the RLayers node match the group name exactly
    (Blender 5.1 convention). The sockets are dynamically generated; they may not
    appear until the first render triggers a compositor update. The `if in outputs`
    guard below prevents a KeyError on the first run; simply re-run the compositor
    after F12 and all sockets will be present.
    """
    scene.use_nodes = True
    tree  = scene.node_tree
    tree.nodes.clear()
    links = tree.links

    rl          = tree.nodes.new("CompositorNodeRLayers")
    rl.location = (-700, 0)

    gains: dict = {}
    for i, (gname, _) in enumerate(LIGHT_GROUPS.items()):
        g          = tree.nodes.new("CompositorNodeGamma")
        g.name     = f"Gain_{gname}"
        g.label    = f"Gain: {gname}"
        g.inputs["Gamma"].default_value = 1.0
        g.location = (-350, 250 - i * 220)
        gains[gname] = g
        if gname in rl.outputs:
            links.new(rl.outputs[gname], g.inputs["Image"])

    names = list(LIGHT_GROUPS.keys())

    mix1              = tree.nodes.new("CompositorNodeMixRGB")
    mix1.blend_type   = "ADD"
    mix1.inputs[0].default_value = 1.0
    mix1.location     = (0, 150)
    links.new(gains[names[0]].outputs["Image"], mix1.inputs[1])
    links.new(gains[names[1]].outputs["Image"], mix1.inputs[2])

    mix2              = tree.nodes.new("CompositorNodeMixRGB")
    mix2.blend_type   = "ADD"
    mix2.inputs[0].default_value = 1.0
    mix2.location     = (200, 0)
    links.new(mix1.outputs["Image"], mix2.inputs[1])
    links.new(gains[names[2]].outputs["Image"], mix2.inputs[2])

    comp          = tree.nodes.new("CompositorNodeComposite")
    comp.location = (450, 0)
    links.new(mix2.outputs["Image"], comp.inputs["Image"])

    # File Output — writes the multilayer EXR with one layer per light group
    fo              = tree.nodes.new("CompositorNodeOutputFile")
    fo.base_path    = OUTPUT_EXR + "_layers"
    fo.format.file_format  = "OPEN_EXR_MULTILAYER"
    fo.format.color_depth  = "32"
    fo.location     = (450, -200)
    for gname in LIGHT_GROUPS:
        fo.file_slots.new(gname)
        if gname in rl.outputs:
            links.new(rl.outputs[gname], fo.file_slots[gname].path)


# ── Camera & render settings ─────────────────────────────────────────────────

def setup_camera(scene: bpy.types.Scene) -> None:
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens         = CAM_FOCAL_MM
    cam_data.dof.use_dof  = True
    cam_data.dof.focus_distance  = 2.8
    cam_data.dof.aperture_fstop  = 5.6

    cam_obj           = bpy.data.objects.new("Camera", cam_data)
    cam_obj.location  = CAM_LOC
    cam_obj.rotation_euler = [math.radians(d) for d in CAM_ROT_DEG]
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj


def configure_cycles(scene: bpy.types.Scene) -> None:
    """
    use_denoising must be False when using light groups.
    The OIDN/OptiX denoiser merges all light group contributions back into a
    single pass before the per-group decomposition step, making group isolation
    impossible. Denoise each group layer individually in the Compositor instead,
    using the Denoise node fed from the RLayers node's per-group output.
    """
    scene.render.engine           = "CYCLES"
    scene.cycles.samples          = SAMPLES
    scene.cycles.use_denoising    = False   # see docstring
    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_depth = "32"
    scene.render.filepath         = OUTPUT_EXR
    scene.render.resolution_x     = RENDER_W
    scene.render.resolution_y     = RENDER_H
    scene.render.resolution_percentage = 100


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    scene = bpy.context.scene
    scene.name = "CyclesLightGroups"

    gem = make_gem()
    gem.data.materials.append(make_gem_material())

    ped = make_pedestal()
    ped.data.materials.append(make_pedestal_material())

    configure_cycles(scene)
    setup_camera(scene)
    setup_light_groups(scene)

    # Compositor last — the RLayers node socket list refreshes once the
    # view layer's lightgroups collection is already populated.
    setup_compositor(scene)

    print("Light Groups scene ready — press F12 to render the multilayer EXR.")


main()
