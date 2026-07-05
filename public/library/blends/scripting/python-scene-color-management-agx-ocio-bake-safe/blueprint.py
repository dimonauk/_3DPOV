"""
blueprint.py — Python scene.view_settings
AgX Colour Management, Look Transforms & Bake-Safe Linear Pipeline
Blender 5.1 | Holoflow Studio | CC0

WHY: AgX is not just 'different colours' — it pre-multiplies scene-linear
values by a matrix before applying the display sigmoid, preserving hue at
high exposure where Filmic shifts skin orange and sky cyan.  This script
builds a reference colour chart, wires up AgX+Punchy, documents the
bake-safe image colorspace rules, and provides snapshot/restore helpers
for switching view transforms mid-session without losing artist decisions.
"""

import bpy
import math

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
# sRGB display values (what an artist mixes in the color picker).
# These are NOT linear-light — Blender converts on import based on colorspace.
PALETTE = [
    ("Skin",     (0.627, 0.404, 0.310)),
    ("Sky",      (0.216, 0.435, 0.635)),
    ("Foliage",  (0.294, 0.412, 0.271)),
    ("White",    (0.898, 0.878, 0.820)),
    ("Neutral",  (0.369, 0.353, 0.345)),
    ("Dark",     (0.114, 0.114, 0.118)),
    ("Crimson",  (0.694, 0.110, 0.110)),
    ("Amber",    (0.808, 0.694, 0.110)),
]

SPHERE_RADIUS = 0.28
COL_SPACING   = 0.74   # x step between columns
ROW_SPACING   = 0.74   # y step between rows
COLUMNS       = 4
ROWS          = 2

# AgX look names available in Blender 5.1 bundled OCIO config
AGX_LOOKS     = ("None", "Punchy", "Greyscale")

# Bake-safe colorspace rules (applied to output images before bake)
# Map: image purpose → colorspace name in Blender's OCIO config
BAKE_COLORSPACES = {
    "albedo":      "sRGB",          # diffuse colour for human-display textures
    "normal":      "Non-Color",     # packed XYZ vectors — must never be gamma-decoded
    "roughness":   "Non-Color",     # linear 0–1 scalar
    "displacement":"Non-Color",     # linear offset — gamma decode would double scale
    "emission":    "Linear",        # HDR; 'Linear' = scene-linear in Blender OCIO
    "ao":          "Non-Color",     # linear occlusion factor
}


# ─── HELPERS ──────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk_col in [bpy.data.meshes, bpy.data.materials,
                    bpy.data.lights, bpy.data.cameras, bpy.data.images]:
        for item in list(blk_col):
            blk_col.remove(item)


def make_mat(name: str, rgb_srgb: tuple[float, float, float]) -> bpy.types.Material:
    """
    Create a Principled BSDF material from an sRGB display-colour tuple.
    Blender stores colour picker values already in scene-linear once the
    image texture colorspace is correct; for Principled inputs that accept
    sRGB, Blender converts internally — set them as-given from the palette.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb_srgb, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.45
    bsdf.inputs["Specular IOR Level"].default_value = 0.5  # 5.1 renamed input
    return mat


def make_half_sphere(name: str, mat: bpy.types.Material,
                     location: tuple[float, float, float]) -> bpy.types.Object:
    """
    UV sphere (upper hemisphere only) positioned at `location`.
    Half-sphere gives a cleaner colour-chart read than a full orb.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=SPHERE_RADIUS,
        segments=24,
        ring_count=12,
        location=location,
    )
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name

    # Delete lower hemisphere faces
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for poly in ob.data.polygons:
        if poly.center.z < -0.01:
            poly.select = True
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="FACE")
    bpy.ops.object.mode_set(mode="OBJECT")

    ob.data.materials.append(mat)
    ob.data.shade_smooth()
    return ob


# ─── COLOUR CHART ─────────────────────────────────────────────────────────────
def build_colour_chart() -> None:
    """
    Eight half-spheres in a 4×2 grid, each assigned a named sRGB colour.
    The arrangement mirrors a reduced Macbeth-adjacent palette without
    reproducing the copyrighted X-Rite layout.
    """
    for i, (label, rgb) in enumerate(PALETTE):
        col = i % COLUMNS
        row = i // COLUMNS
        x = col * COL_SPACING - (COLUMNS - 1) * COL_SPACING * 0.5
        y = -row * ROW_SPACING
        mat = make_mat(f"mat_{label}", rgb)
        make_half_sphere(f"sphere_{label}", mat, (x, y, 0.0))

    # Flat ground plane for shadow contrast
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0.0, -0.37, -0.01))
    plane = bpy.context.active_object
    plane.name = "Ground"
    gnd_mat = bpy.data.materials.new("mat_Ground")
    gnd_mat.use_nodes = True
    gnd_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (
        0.8, 0.8, 0.8, 1.0)
    plane.data.materials.append(gnd_mat)


# ─── LIGHTING ─────────────────────────────────────────────────────────────────
def build_lighting_rig() -> None:
    """
    Three-point rig: key, fill, rim.  Area lights keep shadows soft.
    Exposure-neutral: key=800W, fill=200W, rim=400W at realistic distances.
    """
    rigs = [
        ("Key",  "AREA", (-3.0,  3.0, 4.0), 800.0),
        ("Fill", "AREA", ( 3.0,  2.5, 2.5), 200.0),
        ("Rim",  "AREA", ( 0.0, -4.0, 3.5), 400.0),
    ]
    for name, kind, loc, watts in rigs:
        bpy.ops.object.light_add(type=kind, location=loc)
        lt = bpy.context.active_object
        lt.name = f"Light_{name}"
        lt.data.energy = watts
        # Point key + rim toward chart centre
        bpy.ops.object.constraint_add(type="TRACK_TO")
        lt.constraints["Track To"].target = bpy.data.objects.get("sphere_Skin")


def add_camera() -> None:
    bpy.ops.object.camera_add(location=(0.0, -4.2, 1.8))
    cam = bpy.context.active_object
    cam.name = "Camera_Chart"
    cam.rotation_euler = (math.radians(72), 0, 0)
    bpy.context.scene.camera = cam


# ─── COLOUR MANAGEMENT ────────────────────────────────────────────────────────
def configure_color_management(
    view_transform: str = "AgX",
    look: str          = "Punchy",
    exposure: float    = 0.0,
    gamma: float       = 1.0,
) -> None:
    """
    Set the scene-level OCIO display pipeline.

    Gotcha 1: look must be 'None' before changing view_transform.
              Switching directly from Filmic+HighContrast → AgX raises a
              RuntimeError because 'High Contrast' does not exist under AgX.
    Gotcha 2: view_transform='Raw' forces look='None' silently in the UI
              but raises RuntimeError if you set look first in Python.
    Gotcha 3: display_device names are OCIO-config-specific — 'P3-D65'
              only available when the user has loaded an expanded OCIO config
              (e.g. ACES CG); the default Blender config offers 'sRGB' only.
    """
    vs = bpy.context.scene.view_settings

    # Always reset look first — avoids cross-transform name collision
    vs.look = "None"
    vs.view_transform = view_transform
    if view_transform not in ("Raw", "False Color"):
        vs.look = look
    vs.exposure = exposure
    vs.gamma    = gamma


def snapshot_view_settings() -> dict:
    """
    Return a dict capturing the current colour management state.
    Use before any batch operation that changes view_transform temporarily
    (e.g. switching to Raw for a render, then restoring AgX for preview).
    """
    vs = bpy.context.scene.view_settings
    return {
        "view_transform": vs.view_transform,
        "look":           vs.look,
        "exposure":       vs.exposure,
        "gamma":          vs.gamma,
    }


def restore_view_settings(snapshot: dict) -> None:
    vs = bpy.context.scene.view_settings
    vs.look            = "None"           # must clear before setting transform
    vs.view_transform  = snapshot["view_transform"]
    if snapshot["view_transform"] not in ("Raw", "False Color"):
        vs.look        = snapshot["look"]
    vs.exposure        = snapshot["exposure"]
    vs.gamma           = snapshot["gamma"]


# ─── BAKE-SAFE IMAGE CREATION ─────────────────────────────────────────────────
def create_bake_safe_images() -> dict[str, bpy.types.Image]:
    """
    For each bake pass, create a correctly-colorspaced output image.
    The colorspace MUST be set before bake starts — Blender reads it when
    writing pixel data, not when displaying the image.

    Rule: Non-Color for anything that stores geometric/physical scalars.
    sRGB only for albedo colour textures intended for direct display.
    Linear for high-dynamic-range emission or environment contributions.
    """
    images: dict[str, bpy.types.Image] = {}
    for purpose, cs_name in BAKE_COLORSPACES.items():
        is_float = purpose in ("displacement", "emission")
        img = bpy.data.images.new(
            name=f"bake_{purpose}_2048",
            width=2048,
            height=2048,
            alpha=False,
            float_buffer=is_float,   # 32-bit for HDR bakes
        )
        img.colorspace_settings.name = cs_name
        images[purpose] = img
    return images


# ─── DIAGNOSTICS ──────────────────────────────────────────────────────────────
def print_ocio_info() -> None:
    """
    Read the loaded OCIO config path (read-only in 5.1 — cannot be set
    from Python; user sets it via Preferences > Color Management).
    Useful for debugging why certain view_transform/look names fail.
    """
    prefs  = bpy.context.preferences
    config = prefs.system.ocio_config_path
    vs     = bpy.context.scene.view_settings
    print(f"[OCIO] config path : {config or '(bundled default)'}")
    print(f"[OCIO] display     : {bpy.context.scene.display_settings.display_device}")
    print(f"[OCIO] view_trans  : {vs.view_transform}")
    print(f"[OCIO] look        : {vs.look}")
    print(f"[OCIO] exposure    : {vs.exposure:+.2f} stops")
    print(f"[OCIO] gamma       : {vs.gamma:.3f}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    build_colour_chart()
    build_lighting_rig()
    add_camera()

    # AgX + Punchy: the studio default for colour-critical work
    configure_color_management(view_transform="AgX", look="Punchy")

    # Snapshot before any batch render job that needs Raw output
    snap = snapshot_view_settings()
    print_ocio_info()

    # Simulate a bake-pipeline toggle: Raw output for WebXR light maps
    configure_color_management(view_transform="Raw", look="None")
    bake_images = create_bake_safe_images()
    print(f"Created {len(bake_images)} bake-ready images:")
    for purpose, img in bake_images.items():
        print(f"  {purpose:14s}  cs={img.colorspace_settings.name}  "
              f"float={'yes' if img.is_float else 'no '}")

    # Restore artist view after the batch job
    restore_view_settings(snap)
    print("\nView settings restored to AgX+Punchy.")

    # Save
    bpy.ops.wm.save_as_mainfile(
        filepath="//colour_chart_agx.blend",
        compress=True,
    )
    print("Saved colour_chart_agx.blend")


if __name__ == "__main__":
    main()
