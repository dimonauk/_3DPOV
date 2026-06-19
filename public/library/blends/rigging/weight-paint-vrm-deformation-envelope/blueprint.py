"""
Weight Painting — Automatic Weights + Gradient + Mirror + Smooth
Deformation Envelope for VRM Character Mesh
Blender 5.1 | CC0 | Holoflow Studio
tutorial: /tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope

WHY the clean-up ordering matters:
  Smooth FIRST  → spreads influence values across adjacency before limits are
                   applied — avoids blurring a zero into a non-zero that then
                   gets immediately truncated.
  Normalize     → ensures each vertex's weights sum to exactly 1.0; required
                   for linear blend skinning (LBS) to conserve volume.
  Limit Total 4 → GLB JOINTS_0/WEIGHTS_0 are vec4 — GPU hardware and the
                   glTF 2.0 spec both impose a 4-influence maximum. Exceeding
                   it silently truncates the smallest influences at export.
  Mirror        → copy .L vertex groups to mirrored .R counterparts; must
                   come AFTER smoothing so the smoothed values propagate.

WHY heat diffusion (ARMATURE_AUTO) over Envelope mode:
  Envelope wraps each bone in a capsule and assigns weight by distance to the
  capsule surface — fast but topology-blind: geometry hidden inside the
  capsule receives full weight even if it should belong to another bone.
  Heat diffusion walks the mesh dual-graph and computes a per-vertex scalar
  field for each bone akin to solving the steady-state heat equation with each
  bone as a constant-temperature source. Geodesic routing through the mesh
  produces far more plausible initial weights on complex topology.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── parameters ──────────────────────────────────────────────────────────────
MESH_NAME     = "vrm_torso"
ARM_NAME      = "vrm_rig"
GLB_PATH      = "//weight_paint_vrm.glb"
SMOOTH_FACTOR = 0.5
SMOOTH_REPEAT = 5
LIMIT_BONES   = 4   # glTF JOINTS_0 is a vec4 — hard maximum


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()


def build_torso() -> bpy.types.Object:
    """
    Symmetrical torso proxy: an 8-segment extruded cylinder tapering from
    hip to chest, plus two arm stubs at shoulder height.  Both stubs use
    identical X-mirrored positions so that bpy.ops.object.vertex_group_mirror
    can match left-side vertices to right-side counterparts by proximity.
    """
    bm = bmesh.new()
    segs = 8

    def ring(radius: float, z: float) -> list:
        verts = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            verts.append(bm.verts.new(Vector((math.cos(a) * radius,
                                              math.sin(a) * radius, z))))
        return verts

    trunk_rings = [
        ring(0.18, 0.00),   # hip
        ring(0.20, 0.40),   # waist
        ring(0.22, 0.80),   # chest
        ring(0.20, 1.10),   # clavicle
    ]
    for ri in range(len(trunk_rings) - 1):
        for i in range(segs):
            ni = (i + 1) % segs
            bm.faces.new([trunk_rings[ri][i], trunk_rings[ri][ni],
                          trunk_rings[ri + 1][ni], trunk_rings[ri + 1][i]])
    bm.faces.new(trunk_rings[0])
    bm.faces.new(list(reversed(trunk_rings[-1])))

    arm_segs = 6

    def arm_stub(x_sign: float) -> None:
        """Build one arm stub; x_sign=+1 → left, -1 → right."""
        prev = None
        for step in range(5):
            r = 0.07 - step * 0.008
            cx = x_sign * (0.22 + step * 0.16)
            cz = 1.08 - step * 0.02
            cur = []
            for i in range(arm_segs):
                a = 2 * math.pi * i / arm_segs
                cur.append(bm.verts.new(Vector((cx + math.cos(a) * r,
                                                math.sin(a) * r, cz))))
            if prev:
                for i in range(arm_segs):
                    ni = (i + 1) % arm_segs
                    bm.faces.new([prev[i], prev[ni], cur[ni], cur[i]])
            else:
                bm.faces.new(cur)
            prev = cur
        bm.faces.new(list(reversed(prev)))  # end cap

    arm_stub(+1.0)   # left arm
    arm_stub(-1.0)   # right arm

    bm.normal_update()
    me = bpy.data.meshes.new(MESH_NAME)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.collection.objects.link(obj)
    return obj


def build_armature() -> bpy.types.Object:
    """
    Spine chain + bilateral shoulder/arm chains.
    Bone names use the .L / .R suffix convention required by Mirror X:
    the Mirror operator strips the suffix, finds the mirrored bone by
    spatial position (or name-flip), then writes weights to the .R group.
    All rolls are zeroed — local X lateral — so the Mirror operator's
    positional search finds correct counterparts without manual roll fixup.
    """
    adata = bpy.data.armatures.new(ARM_NAME)
    aobj  = bpy.data.objects.new(ARM_NAME, adata)
    bpy.context.collection.objects.link(aobj)
    bpy.context.view_layer.objects.active = aobj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = adata.edit_bones

    def b(name, head, tail, parent=None, connect=True):
        bone = eb.new(name)
        bone.head  = Vector(head)
        bone.tail  = Vector(tail)
        bone.roll  = 0.0
        if parent:
            bone.parent = eb[parent]
            bone.use_connect = connect
        return bone

    b("spine.root",  (0, 0, 0.00), (0, 0, 0.40))
    b("spine.001",   (0, 0, 0.40), (0, 0, 0.80),  "spine.root")
    b("spine.002",   (0, 0, 0.80), (0, 0, 1.10),  "spine.001")
    # left arm (mirrored to right by clean_weights → mirror step)
    b("shoulder.L",  (0, 0, 1.10), ( 0.22, 0, 1.08), "spine.002", connect=False)
    b("upper_arm.L", (0.22, 0, 1.08), (0.38, 0, 1.06), "shoulder.L")
    b("lower_arm.L", (0.38, 0, 1.06), (0.54, 0, 1.04), "upper_arm.L")
    b("hand.L",      (0.54, 0, 1.04), (0.66, 0, 1.02), "lower_arm.L")
    # right arm
    b("shoulder.R",  (0, 0, 1.10), (-0.22, 0, 1.08), "spine.002", connect=False)
    b("upper_arm.R", (-0.22, 0, 1.08), (-0.38, 0, 1.06), "shoulder.R")
    b("lower_arm.R", (-0.38, 0, 1.06), (-0.54, 0, 1.04), "upper_arm.R")
    b("hand.R",      (-0.54, 0, 1.04), (-0.66, 0, 1.02), "lower_arm.R")

    bpy.ops.object.mode_set(mode='OBJECT')
    return aobj


def parent_auto_weights(mesh: bpy.types.Object, arm: bpy.types.Object) -> None:
    """
    ARMATURE_AUTO triggers heat-diffusion weighting.
    Context requirements: armature must be ACTIVE, mesh must be SELECTED
    but not active.  The operator adds an Armature modifier to the mesh and
    populates one vertex group per bone automatically.
    """
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')


def clean_weights(mesh: bpy.types.Object) -> None:
    """Smooth → Normalise → Limit 4 → Mirror (see module docstring for ordering)."""
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)

    # Laplacian smooth across vertex adjacency
    bpy.ops.object.vertex_group_smooth(
        group_select_mode='ALL',
        factor=SMOOTH_FACTOR,
        repeat=SMOOTH_REPEAT,
        expand=0.0,
    )
    # enforce sum-to-1 per vertex
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    # truncate to 4 influences (glTF JOINTS_0 is vec4)
    bpy.ops.object.vertex_group_limit_total(
        group_select_mode='ALL',
        limit=LIMIT_BONES,
    )
    # reflect .L weights across X-symmetry plane to .R bones
    bpy.ops.object.vertex_group_mirror(
        mirror_weights=True,
        flip_group_names=True,
        all_groups=True,
        use_topology=False,
    )


def export_glb(arm: bpy.types.Object, mesh: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    mesh.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        use_selection=True,
        export_format='GLB',
        export_skins=True,
        export_morph=False,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print(f"✓ GLB written → {GLB_PATH}")


def run() -> None:
    clear_scene()
    mesh = build_torso()
    arm  = build_armature()
    parent_auto_weights(mesh, arm)
    clean_weights(mesh)
    export_glb(arm, mesh)
    print("✓ blueprint complete — open Weight Paint mode to inspect vertex groups")


run()
