"""
Workbench Renderer — Technical Blueprint: Cavity Shading, Edge Outline &
Colour-by-Object for Exploded Assembly Diagrams (Blender 5.1)

Technique: The Workbench engine (scene.render.engine = 'WORKBENCH') bypasses
all material shaders. Colours come from Object Color (obj.color). Two shading
layers add depth without any lighting rig: SCREEN cavity (fast SSAO-like
gradient that darkens recesses and brightens ridges) and edge outline
(Sobel depth-buffer edge detector — topology-independent). This combination
reads instantly as a technical illustration without a single material node.

The scene builds a 5-part sci-fi sensor pod, assigns distinct object colours,
drives a 60-frame explode animation by keyframing each part's position, then
configures Workbench render settings for a print-quality blueprint render.

Output artefacts:
  workbench_sensor_pod.blend   (saved by record.py after run)
  workbench_sensor_pod.glb     (flat emission colours, merged, same output dir)
"""

import bpy
import math
import mathutils

# ── CONSTANTS ────────────────────────────────────────────────────────────────
EXPLODE_FRAMES   = 60
EXPLODE_EASE     = True    # bezier ease-in-out on keyframes
OUTLINE_COLOUR   = (0.95, 0.95, 0.95, 1.0)
BACKGROUND_COLOUR = (0.06, 0.07, 0.10, 1.0)  # near-black blueprint ground

# Object colours — all sRGB, alpha=1
COLOURS = {
    "base_plate":   (0.18, 0.75, 0.32, 1.0),  # lime-green
    "housing":      (0.20, 0.40, 0.82, 1.0),  # slate-blue
    "emitter_ring": (0.08, 0.88, 0.88, 1.0),  # cyan
    "lens":         (0.92, 0.68, 0.08, 1.0),  # amber
    "support_arm":  (0.88, 0.18, 0.68, 1.0),  # magenta
}

# Per-part explode translation (world-space offset when explode_t = 1)
EXPLODE_OFFSETS = {
    "base_plate":   mathutils.Vector(( 0.0,  0.0, -1.4)),
    "housing":      mathutils.Vector(( 0.0,  0.0,  0.4)),
    "emitter_ring": mathutils.Vector(( 1.4,  0.0,  0.0)),
    "lens":         mathutils.Vector(( 0.0,  0.0,  1.6)),
    "support_arm":  mathutils.Vector((-1.6,  0.0,  0.0)),
}

# GLB export path (relative to blend location, double-slash = relative)
GLB_PATH = "//../../../../glbs/rendering/workbench-cavity-outline-assembly-diagram/workbench_sensor_pod.glb"


# ── HELPERS ──────────────────────────────────────────────────────────────────

def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)


def apply_transforms(obj):
    """Apply scale/rotation so GLB export and modifiers see clean data."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def tag_holoflow(obj):
    """Studio export convention: mark object for Holoflow facet pipeline."""
    obj["holoflow:facet"] = True


def set_object_colour(obj, rgba):
    """Assign Object Color used by Workbench colour_type='OBJECT'."""
    obj.color = rgba


def ease_bezier(frame_start, frame_end, obj, data_path):
    """Apply BEZIER interpolation to the most recent two keyframes on data_path."""
    if not hasattr(obj, "animation_data") or obj.animation_data is None:
        return
    action = obj.animation_data.action
    if action is None:
        return
    for fc in action.fcurves:
        if fc.data_path == data_path:
            for kf in fc.keyframe_points:
                if kf.co[0] in (frame_start, frame_end):
                    kf.interpolation = "BEZIER"
                    kf.easing = "AUTO"


# ── PART BUILDERS ────────────────────────────────────────────────────────────

def make_base_plate():
    """Flat hexagonal base (box primitive scaled to hex silhouette)."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=6, radius=1.0, depth=0.12,
        location=(0.0, 0.0, 0.0)
    )
    obj = bpy.context.active_object
    obj.name = "base_plate"
    obj.scale = (1.0, 1.0, 1.0)
    apply_transforms(obj)
    return obj


def make_housing():
    """Main cylindrical body."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=0.72, depth=0.96,
        location=(0.0, 0.0, 0.54)
    )
    obj = bpy.context.active_object
    obj.name = "housing"
    apply_transforms(obj)
    return obj


def make_emitter_ring():
    """Torus ring around the housing equator."""
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.82, minor_radius=0.10,
        major_segments=32, minor_segments=8,
        location=(0.0, 0.0, 0.54)
    )
    obj = bpy.context.active_object
    obj.name = "emitter_ring"
    apply_transforms(obj)
    return obj


def make_lens():
    """Dome lens on top — UV sphere, bottom half clipped by Z."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16, ring_count=8, radius=0.44,
        location=(0.0, 0.0, 1.08)
    )
    obj = bpy.context.active_object
    obj.name = "lens"
    apply_transforms(obj)
    return obj


def make_support_arm():
    """Thin lateral arm on the -X side."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8, radius=0.055, depth=1.0,
        location=(-0.86, 0.0, 0.54)
    )
    obj = bpy.context.active_object
    obj.name = "support_arm"
    # Rotate to horizontal
    obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    apply_transforms(obj)
    return obj


# ── ANIMATION ─────────────────────────────────────────────────────────────────

def keyframe_explode(parts, assembled_locs):
    """
    Frame 1  = assembled positions (identity).
    Frame 60 = each part offset by EXPLODE_OFFSETS[name].
    Bezier ease produces a clean mechanical separation read.
    """
    scene = bpy.context.scene
    for name, obj in parts.items():
        base = assembled_locs[name]
        # Frame 1 — assembled
        scene.frame_set(1)
        obj.location = base
        obj.keyframe_insert(data_path="location", frame=1)
        # Frame 60 — exploded
        scene.frame_set(EXPLODE_FRAMES)
        obj.location = base + EXPLODE_OFFSETS[name]
        obj.keyframe_insert(data_path="location", frame=EXPLODE_FRAMES)
        # Ease interpolation
        if EXPLODE_EASE:
            ease_bezier(1, EXPLODE_FRAMES, obj, "location")
    # Return to frame 1 for viewport inspection
    scene.frame_set(1)


# ── WORKBENCH RENDER SETUP ────────────────────────────────────────────────────

def configure_workbench(scene):
    """
    Switch engine to WORKBENCH and configure the display.shading block.

    Important: scene.display.shading is a View3DShading struct — shared
    between 3D viewport and the Workbench render pass. When engine='WORKBENCH'
    a full F12 render uses these values. The viewport honours them immediately
    in Solid or Rendered shading mode.

    color_type='OBJECT'  → per-object obj.color drives the flat colour.
    light='FLAT'         → no studio sphere, no matcap, pure colour map.
    show_cavity=True     → enable screen-space AO gradient.
    cavity_type='SCREEN' → fast SSAO; 'WORLD' is curvature-map, more
                           expensive and better for close-up detail shots.
    show_object_outline  → Sobel depth-buffer edge detect, colour set via
                           object_outline_color (RGBA float tuple).
    show_shadows=False   → for a flat blueprint look; set True for
                           'soft-technical' style with shadow depth cues.
    """
    scene.render.engine            = "WORKBENCH"
    scene.render.resolution_x      = 1280
    scene.render.resolution_y      = 720
    scene.render.film_transparent   = False
    scene.render.image_settings.file_format = "FFMPEG"

    sh = scene.display.shading
    sh.type              = "SOLID"
    sh.color_type        = "OBJECT"   # use obj.color, not material
    sh.light             = "FLAT"     # no studio sphere
    sh.show_cavity       = True
    sh.cavity_type       = "SCREEN"   # SCREEN | WORLD | BOTH
    sh.curvature_ridge_factor  = 1.0
    sh.curvature_valley_factor = 0.8
    sh.show_object_outline     = True
    sh.object_outline_color    = OUTLINE_COLOUR[:3]  # RGB only
    sh.show_shadows            = False
    sh.shadow_intensity        = 0.5

    # Background — set world colour (Workbench uses world colour for backdrop)
    if not scene.world:
        scene.world = bpy.data.worlds.new("WorkbenchWorld")
    scene.world.use_nodes = False
    scene.world.color = BACKGROUND_COLOUR[:3]


# ── CAMERA ────────────────────────────────────────────────────────────────────

def add_camera(scene):
    """
    Isometric-ish 3/4 view centred on the pod.
    Orthographic camera reads as a technical blueprint; perspective as a
    product shot. We use perspective here so the explode depth reads well.
    """
    bpy.ops.object.camera_add(
        location=(4.0, -4.0, 3.5),
        rotation=(math.radians(55), 0.0, math.radians(45))
    )
    cam = bpy.context.active_object
    cam.name = "WorkbenchCam"
    cam.data.lens = 50
    scene.camera = cam
    return cam


# ── EMISSION GLB EXPORT ───────────────────────────────────────────────────────

def export_flat_emission_glb(parts):
    """
    Workbench colours don't export to GLB — the engine bypasses materials.
    We create a flat Emission material per part matching obj.color, then
    export each object (plus duplicate) as a merged GLB.
    Emission intensity 1.0 keeps values in 0-1 so KHR_emissive_strength
    extension is not needed, keeping the GLB maximally compatible.
    """
    bpy.ops.object.select_all(action="DESELECT")
    for name, obj in parts.items():
        rgba = COLOURS[name]
        mat = bpy.data.materials.new(name=f"emit_{name}")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        emission = nodes.new("ShaderNodeEmission")
        output   = nodes.new("ShaderNodeOutputMaterial")
        emission.inputs["Color"].default_value  = rgba
        emission.inputs["Strength"].default_value = 1.0
        links.new(emission.outputs["Emission"], output.inputs["Surface"])

        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=True,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_materials="EXPORT",
        export_animations=False,       # assembled T-pose only
    )
    bpy.ops.object.select_all(action="DESELECT")


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = EXPLODE_FRAMES

    reset_scene()

    # Build parts
    parts = {
        "base_plate":   make_base_plate(),
        "housing":      make_housing(),
        "emitter_ring": make_emitter_ring(),
        "lens":         make_lens(),
        "support_arm":  make_support_arm(),
    }

    # Assign colours and studio tags
    for name, obj in parts.items():
        set_object_colour(obj, COLOURS[name])
        tag_holoflow(obj)

    # Record assembled positions before animation
    assembled_locs = {name: obj.location.copy() for name, obj in parts.items()}

    # Animate explode
    keyframe_explode(parts, assembled_locs)

    # Camera
    add_camera(scene)

    # Workbench render config
    configure_workbench(scene)

    # Flat emission GLB (assembled rest pose)
    export_flat_emission_glb(parts)

    print("blueprint.py complete — run record.py to render viewport.mp4")


main()
