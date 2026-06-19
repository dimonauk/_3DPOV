"""
Modifier — Screw: Lathe-Style Revolution Surface
Blender 5.1 | CC0

Technique: a sparse edge-chain profile in the XZ plane is swept 360° around
the Z axis by the Screw modifier, producing a solid of revolution — the same
operation as a lathe or pottery wheel. No NURBS curves are involved; the
profile is a plain bmesh edge loop, giving full bpy control over every vertex.

Scene: a classical Doric column — torus base, entasis shaft (the slight belly
at 1/3 height that corrects the concavity illusion), echinus capital, abacus
slab — exported as column_capital.glb. A parameter flag switches the same
profile to a helical spring to show non-zero screw_offset.

Modifier stack: Screw (axis=Z, steps=48, merge=True) → SubDiv (CC, levels=2)

Outside sources:
  Blender Manual — Screw Modifier (CC-BY-SA-4.0)
    https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/screw.html
    Author: Blender Documentation Team
  blender-scripting (MIT) — Nikolai Janakiev
    https://github.com/njanakiev/blender-scripting
    Related: https://github.com/blender/blender/tree/main/scripts/startup/bl_operators
"""

import bpy
import bmesh
import math

# ── Parameters ────────────────────────────────────────────────────────────────
COLUMN_HEIGHT   = 2.4    # total shaft height (metres)
BASE_RADIUS     = 0.22   # column base outer radius
SHAFT_RADIUS    = 0.14   # mid-shaft radius (entasis waist)
CAPITAL_RADIUS  = 0.24   # top abacus plate half-width
STEPS           = 48     # longitude faces around revolution (LOD control)
SCREW_PITCH     = 0.0    # metres per 360° turn; 0 = closed; >0 = helix
SUBDIV_LEVELS   = 2      # Catmull-Clark levels (level 2 = 4× face count)
EXPORT_PATH     = "//column_capital.glb"


def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials,
                  bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            block.remove(item)


def _column_profile() -> list[tuple[float, float]]:
    """
    (radius, height) pairs for the Doric column silhouette, bottom → top.

    Proportions follow Vitruvius De Architectura Book III: bottom diameter D,
    shaft height 5.5D (here D = 2 * BASE_RADIUS = 0.44 m, so height ≈ 2.4 m).
    Entasis: the shaft swell peaks at 1/3 height by ~7% of the shaft radius
    then tapers back. Without it, straight-sided columns look concave from a
    distance — the eye's expectation of perspective overcorrects.
    """
    H = COLUMN_HEIGHT
    R = SHAFT_RADIUS
    return [
        (BASE_RADIUS,              0.00),  # base torus outer rim floor
        (BASE_RADIUS,              0.06),  # base shoulder outer top
        (R + 0.04,                 0.10),  # cyma chamfer exit
        (R,                        0.18),  # shaft base (entasis starts here)
        (R + 0.010,                H * 0.33),  # entasis peak belly
        (R,                        H - 0.14),  # shaft top (back to R)
        (R + 0.025,                H - 0.10),  # echinus flare inward bottom
        (CAPITAL_RADIUS - 0.02,    H - 0.03),  # echinus flare outward top
        (CAPITAL_RADIUS,           H),          # abacus base
        (CAPITAL_RADIUS,           H + 0.06),   # abacus top slab
    ]


def build_column(name: str = "column_capital") -> bpy.types.Object:
    """
    Creates the profile edge loop and attaches Screw + SubDiv modifiers.

    Why an edge loop not a Bézier curve? The Screw modifier works on any mesh
    object and follows edge connectivity. A plain mesh lets you bake the profile
    into the .blend without any curve data block or Convert-to-Mesh step, which
    keeps the asset self-contained for the batch GLB exporter.
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bm    = bmesh.new()
    verts = [bm.verts.new((r, 0.0, z)) for r, z in _column_profile()]
    # Edge chain bottom → top. Order matters: the Screw modifier sweeps edges
    # in connectivity order, not spatial Z order.
    for i in range(len(verts) - 1):
        bm.edges.new([verts[i], verts[i + 1]])
    bm.to_mesh(mesh)
    bm.free()

    # ── Screw modifier ────────────────────────────────────────────────────────
    scr = obj.modifiers.new("Screw", "SCREW")
    scr.axis                 = 'Z'
    scr.steps                = STEPS
    scr.render_steps         = STEPS
    scr.screw_offset         = SCREW_PITCH   # 0 → closed 360° revolution
    scr.iterations           = 1             # one full turn of the axis
    scr.angle                = math.radians(360)
    scr.use_merge_vertices   = True     # welds seam (last loop → first loop)
    scr.merge_threshold      = 0.0001   # in metres; keep tight
    scr.use_smooth_shade     = True     # per-face smooth shading flag
    scr.use_normal_calculate = True     # recalculate normals after screw
    scr.use_normal_flip      = False    # CCW winding = outward face normals

    # ── SubDiv for smooth curvature ───────────────────────────────────────────
    # Screw with STEPS=48 produces adequate faceting for WebXR. For printed or
    # rendered output, SubDiv refines it without touching the Screw step count.
    sub = obj.modifiers.new("SubDiv", "SUBSURF")
    sub.subdivision_type = 'CATMULL_CLARK'
    sub.levels           = SUBDIV_LEVELS
    sub.render_levels    = SUBDIV_LEVELS + 1
    sub.use_creases      = True

    return obj


def make_mat() -> bpy.types.Material:
    """Cream Principled BSDF placeholder. Swap for the marble procedural."""
    mat  = bpy.data.materials.new("column_marble")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value         = (0.92, 0.90, 0.86, 1.0)
        bsdf.inputs["Roughness"].default_value          = 0.15
        bsdf.inputs["Specular IOR Level"].default_value = 0.8
    return mat


def setup_scene(obj: bpy.types.Object) -> bpy.types.Object:
    """Three-point light rig + 85 mm camera for architectural proportions."""
    scene = bpy.context.scene
    col_h = COLUMN_HEIGHT + 0.06

    cam_data = bpy.data.cameras.new("Camera")
    cam      = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera    = cam
    cam_data.lens   = 85
    cam.location    = (1.8, -2.2, col_h * 0.5)
    cam.rotation_euler = (math.radians(90), 0, math.radians(40))

    for name, energy, size, colour, loc in (
        ("Key",  800, 1.0, (1.00, 0.97, 0.90), ( 2.0, -1.5, 3.0)),
        ("Fill", 200, 2.0, (0.80, 0.88, 1.00), (-2.5, -0.5, 2.0)),
        ("Rim",  400, 0.5, (1.00, 0.95, 0.80), ( 0.0,  2.5, 2.5)),
    ):
        d = bpy.data.lights.new(name, type='AREA')
        d.energy, d.size, d.color = energy, size, colour
        o = bpy.data.objects.new(name, d)
        scene.collection.objects.link(o)
        o.location = loc

    return cam


def export_glb(obj: bpy.types.Object, path: str = EXPORT_PATH) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,       # realise Screw + SubDiv at export time
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print(f"Exported → {path}")


if __name__ == "__main__":
    reset_scene()
    obj = build_column()
    mat = make_mat()
    obj.data.materials.append(mat)
    setup_scene(obj)
    export_glb(obj)
    print("Blueprint complete.")
