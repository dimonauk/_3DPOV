"""
HookModifier vertex-group bind — faceted pentagon drop-earring
Blender 5.1 · CC0 · Holoflow Studio
Slug: python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr

Demonstrates:
  • Building a clean mesh with from_pydata / bmesh normal recalculation
  • Vertex-group creation and assignment by index
  • bpy.types.HookModifier: object binding, matrix_inverse headless pattern,
    center in object-local space, falloff_radius, use_falloff_uniform, force
  • Pendulum animation with SINE / EASE_IN_OUT interpolation
  • GLB export: export_apply=False keeps modifier live in the viewer
"""

import math
import bpy
import bmesh
from mathutils import Vector

# ── constants ────────────────────────────────────────────────────────────────
SLUG      = "hf_hook_earring"
OUT_BLEND = f"//{SLUG}.blend"
OUT_GLB   = f"//{SLUG}.glb"
FPS       = 24
DURATION  = 72   # 3-second loop

# earring geometry
R1, R2 = 0.18, 0.10   # upper-ring / mid-ring radii
Z0, Z1, Z2, Z3 = 0.0, -0.30, -0.65, -1.10

# pendulum amplitudes (metres)
SWING_UPPER = 0.08
SWING_LOWER = 0.22

MATERIAL_NAME = "Mat_Earring"


# ── scene reset ───────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = DURATION


# ── geometry ──────────────────────────────────────────────────────────────────
def _ring(r: float, z: float, n: int = 5) -> list[tuple]:
    return [
        (r * math.cos(2 * math.pi * i / n),
         r * math.sin(2 * math.pi * i / n),
         z)
        for i in range(n)
    ]


def build_earring_mesh() -> bpy.types.Object:
    """Pentagon drop with 12 verts: 0=cap, 1-5=upper, 6-10=mid, 11=spike."""
    verts = [(0, 0, Z0)] + _ring(R1, Z1) + _ring(R2, Z2) + [(0, 0, Z3)]

    # fan cap → upper ring → mid ring → spike
    faces = []
    for i in range(5):
        faces.append((0, 1 + i, 1 + (i + 1) % 5))           # top fan
    for i in range(5):
        a, b = 1 + i, 1 + (i + 1) % 5
        c, d = 6 + (i + 1) % 5, 6 + i
        faces.append((a, b, c, d))                            # side quads
    for i in range(5):
        faces.append((6 + i, 6 + (i + 1) % 5, 11))           # spike fan

    me = bpy.data.meshes.new(SLUG)
    me.from_pydata(verts, [], faces)

    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.update()

    ob = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ── vertex groups ─────────────────────────────────────────────────────────────
def assign_vertex_groups(ob: bpy.types.Object) -> None:
    upper = ob.vertex_groups.new(name="hk_upper")
    upper.add(list(range(1, 6)), 1.0, "REPLACE")

    lower = ob.vertex_groups.new(name="hk_lower")
    lower.add([11], 1.0, "REPLACE")


# ── hook modifier bind (headless-safe) ────────────────────────────────────────
def _make_empty(name: str, location: tuple) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "ARROWS"
    e.empty_display_size = 0.04
    e.location = location
    bpy.context.collection.objects.link(e)
    return e


def bind_hook(
    ob: bpy.types.Object,
    empty: bpy.types.Object,
    group_name: str,
    falloff_radius: float,
    force: float = 0.90,
) -> bpy.types.HookModifier:
    """
    Headless HookModifier bind:
      • mod.center    — pivot in object-local space
      • mod.matrix_inverse — world-to-empty transform at bind time
        (without this, frame-0 shows phantom deformation even when the
        empty is at rest position)
    """
    bpy.context.view_layer.update()   # flush matrix_world on new objects

    mod: bpy.types.HookModifier = ob.modifiers.new(f"HK_{group_name}", "HOOK")
    mod.object         = empty
    mod.vertex_group   = group_name
    mod.falloff_type   = "SPHERE"     # quadratic; SMOOTH for C2 Hermite
    mod.falloff_radius = falloff_radius
    mod.use_falloff_uniform = True    # compensates non-uniform ob scale
    mod.force          = force        # weighting scalar (NOT .strength)

    local_inv   = ob.matrix_world.inverted()
    mod.center  = local_inv @ Vector(empty.matrix_world.translation)
    mod.matrix_inverse = empty.matrix_world.inverted()   # ← critical
    return mod


# ── material ──────────────────────────────────────────────────────────────────
def build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MATERIAL_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value  = (0.88, 0.72, 0.30, 1.0)
    bsdf.inputs["Metallic"].default_value    = 1.0
    bsdf.inputs["Roughness"].default_value   = 0.15

    out.location  = (300, 0)
    bsdf.location = (0,   0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── pendulum animation ────────────────────────────────────────────────────────
def _keyed_x(ob: bpy.types.Object, frames: list, values: list) -> None:
    ob.animation_data_create()
    action = bpy.data.actions.new(f"{ob.name}_Action")
    ob.animation_data.action = action

    fc = action.fcurves.new("location", index=0)
    for f, v in zip(frames, values):
        kp = fc.keyframe_points.insert(f, v)
        kp.interpolation = "SINE"
        kp.easing        = "EASE_IN_OUT"

    cyc = fc.modifiers.new("CYCLES")
    cyc.mode_before = "REPEAT_OFFSET"
    cyc.mode_after  = "REPEAT_OFFSET"


def animate_pendulum(upper_empty: bpy.types.Object,
                     lower_empty: bpy.types.Object) -> None:
    half = DURATION // 2
    quarter = half // 2

    # upper pivot: tight X swing  ±SWING_UPPER
    _keyed_x(
        upper_empty,
        frames=[1, 1 + quarter, 1 + half],
        values=[-SWING_UPPER, SWING_UPPER, -SWING_UPPER],
    )
    # lower pivot: wide X swing  ±SWING_LOWER (phase-shifted by quarter)
    _keyed_x(
        lower_empty,
        frames=[1, 1 + quarter, 1 + half],
        values=[SWING_LOWER, -SWING_LOWER, SWING_LOWER],
    )


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb(path: str) -> None:
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=False,          # keep modifier live; depsgraph bakes per-frame
        export_animations=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        use_selection=False,
    )


# ── main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()

    ob = build_earring_mesh()
    assign_vertex_groups(ob)

    mat = build_material()
    ob.data.materials.append(mat)

    e_upper = _make_empty("hk_upper_pivot", (0.0, 0.0, Z1))
    e_lower = _make_empty("hk_lower_pivot", (0.0, 0.0, Z3))

    bind_hook(ob, e_upper, "hk_upper", falloff_radius=0.22)
    bind_hook(ob, e_lower, "hk_lower", falloff_radius=0.14)

    animate_pendulum(e_upper, e_lower)

    # camera + light
    cam_data = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cam_data)
    cam.location = (0.0, -1.8, -0.55)
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("Sun", sun_data)
    sun.location = (2, -2, 3)
    bpy.context.collection.objects.link(sun)

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    export_glb(OUT_GLB)
    print(f"[holoflow] saved {OUT_BLEND} and {OUT_GLB}")


if __name__ == "__main__":
    main()
