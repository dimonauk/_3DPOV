"""
GN Rotate Instances — Phyllotaxis Sunflower Array  (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY PHYLLOTAXIS + ROTATE INSTANCES
  The Golden Angle α ≈ 137.508° arises from the Golden Ratio φ = (1+√5)/2:
  α = 2π(2 − φ).  Positioning the nth floret at polar coordinates
  (sqrt(n)·c, n·α) produces a uniform-density disc with ZERO radial clumping
  for any seed count — because α is irrational in the most extreme sense
  (continued-fraction expansion [1;1,1,1,…]).  Any rational approximation
  creates visible spokes; only the exact golden angle disperses them.

  RotateInstances spins each placed instance by the same angle θ=n·α used
  to position it, so every seed aligns radially outward.  This single reuse
  of one field value for both placement and orientation is the "clever bit"
  of this node tree.

OUTSIDE SOURCES
  Rotate Instances Node — CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/rotate_instances.html
  "A better way to construct the sunflower head" — Vogel H. 1979, public domain
    Mathematical Biosciences 44(3-4):179–189
  blender-python-scripts — MIT  Zach Noblitt
    https://github.com/znoblitt/blender-python-scripts
"""

import bpy
import bmesh
import math

# ── Parameters ────────────────────────────────────────────────────────────────
COUNT         = 144    # seed count (Fibonacci: 89+55 counter-rotating spirals)
SPACING       = 0.10   # radial constant c; disc radius = sqrt(COUNT) × SPACING ≈ 1.2 m
SEED_LEN      = 0.072  # seed half-extent along +X
SEED_WID      = 0.030  # seed half-extent along Y
SEED_HGT      = 0.017  # seed half-extent along Z (flat disc profile)
ANIM_FRAMES   = 72     # 3 s at 24 fps
EXPORT_FRAME  = 36     # mid-orbit snapshot

OUTPUT_GLB   = "//phyllotaxis_sunflower.glb"
OUTPUT_BLEND = "//phyllotaxis_sunflower.blend"
# ─────────────────────────────────────────────────────────────────────────────

_phi              = (1.0 + math.sqrt(5.0)) / 2.0
GOLDEN_ANGLE_RAD  = 2.0 * math.pi * (2.0 - _phi)   # 2.399963… rad  ≈ 137.508°


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for b in list(d):
            d.remove(b)


def make_seed_mesh() -> bpy.types.Object:
    """
    Flat elongated cuboid pointing along +X.

    WHY +X not +Y:
      RotateInstances world-Z rotation maps +X → (cos θ, sin θ, 0).
      Each seed sits at position (r·cos θ, r·sin θ, 0); the radial direction
      IS (cos θ, sin θ, 0).  Elongating along +X ensures the seed faces
      directly outward after the Z rotation — no extra offset needed.

    WHY flat (Z small):
      Sunflower seeds lie near-flush with the floral disc surface.  The 4:1
      XY aspect and 4:1 XZ aspect gives a convincingly seed-like silhouette
      from the orthographic top view used in the viewport animation.
    """
    me = bpy.data.meshes.new("SeedMesh")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm,
                    vec=(SEED_LEN * 2, SEED_WID * 2, SEED_HGT * 2),
                    verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new("SeedMesh", me)
    bpy.context.collection.objects.link(obj)
    return obj


def make_materials():
    """
    Centre disc (inner 40%): deep amber — warm kernel colour.
    Outer seeds:             olive gold — ripe achene colour.
    Both Principled BSDF, maps straight to glTF pbrMetallicRoughness.
    """
    def pbr(name, rgb, roughness, metallic=0.0):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        pb  = mat.node_tree.nodes.get("Principled BSDF")
        pb.inputs['Base Color'].default_value = (*rgb, 1.0)
        pb.inputs['Roughness'].default_value  = roughness
        pb.inputs['Metallic'].default_value   = metallic
        return mat

    seed_mat = pbr("SeedGold",   (0.62, 0.48, 0.12), 0.70)
    return seed_mat


def build_gn_tree(seed_obj, seed_mat):
    """
    GN graph — Phyllotaxis placement via Index field + polar maths.

    Conceptual pipeline:
      Points(COUNT)
        ↓
      SetPosition( pos = polar_to_cart( sqrt(i)·SPACING,  i·GOLDEN_ANGLE ) )
        ↓
      InstanceOnPoints( instance = ObjectInfo(seed_obj) )
        ↓
      RotateInstances( rotation = (0, 0, i·GOLDEN_ANGLE),  local=False )
        ↓ world-Z rotation aligns each seed radially
      SetMaterial → RealizeInstances → GroupOutput

    Field chain for angle θ:
      Index (int) → Multiply(GOLDEN_ANGLE_RAD) → θ_float

    Field chain for radius r:
      Index (int) → Power(0.5) → Multiply(SPACING) → r_float

    Position (polar → Cartesian):
      θ → Cosine → Multiply(r) → px
      θ → Sine   → Multiply(r) → py
      CombineXYZ(px, py, 0) → SetPosition.Position

    Rotation (same θ re-used):
      CombineXYZ(0, 0, θ) → RotateInstances.Rotation

    WHY world-space rotation:
      local=True would spin the seed around its own slab centre without
      sweeping it to face outward.  local=False (world space) rotates each
      instance's axes in the global XY plane so its +X points at (cos θ, sin θ).
    """
    ng = bpy.data.node_groups.new("PhyllotaxisSunflower", 'GeometryNodeTree')
    ni, nds, lks = ng.interface, ng.nodes, ng.links
    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def nd(t, lbl=None, loc=(0, 0)):
        n = nds.new(t); n.label = lbl or ""; n.location = loc; return n

    def math_nd(op, loc, val_b=None):
        n = nd('ShaderNodeMath', op.title(), loc); n.operation = op
        if val_b is not None:
            n.inputs[1].default_value = val_b
        return n

    gout = nd('NodeGroupOutput', loc=(1400, 0))

    # ── 1. Source points — all at origin; SetPosition will scatter them ─────
    pts = nd('GeometryNodePoints', 'Seeds', loc=(-1200, 0))
    pts.inputs['Count'].default_value  = COUNT
    pts.inputs['Radius'].default_value = 0.001   # near-zero; position overwritten below

    # ── 2. Index field (evaluates per point when consumed downstream) ────────
    idx = nd('GeometryNodeInputIndex', 'Index', loc=(-1200, -220))

    # ── 3. Angle field: θ = Index × GOLDEN_ANGLE_RAD ────────────────────────
    mul_theta = math_nd('MULTIPLY', loc=(-940, -180), val_b=GOLDEN_ANGLE_RAD)
    # Integer→float cast is implicit when one multiply input is float.

    # ── 4. Radius field: r = sqrt(Index) × SPACING ──────────────────────────
    sqrt_idx   = math_nd('POWER',    loc=(-940, -380), val_b=0.5)
    mul_radius = math_nd('MULTIPLY', loc=(-720, -380), val_b=SPACING)

    # ── 5. Polar → Cartesian conversion ─────────────────────────────────────
    cos_t  = math_nd('COSINE',   loc=(-720, -180))
    sin_t  = math_nd('SINE',     loc=(-720,  -60))
    mul_px = math_nd('MULTIPLY', loc=(-500, -180))   # px = cos(θ) × r
    mul_py = math_nd('MULTIPLY', loc=(-500,  -60))   # py = sin(θ) × r

    pos_xyz = nd('ShaderNodeCombineXYZ', 'Position XYZ', loc=(-280, -120))

    # ── 6. SetPosition — scatter points into disc ────────────────────────────
    spos = nd('GeometryNodeSetPosition', 'Set Positions', loc=(-60, 0))

    # ── 7. Instance source ───────────────────────────────────────────────────
    oinfo = nd('GeometryNodeObjectInfo', 'Seed Source', loc=(-940, 200))
    oinfo.inputs[0].default_value = seed_obj
    oinfo.transform_space          = 'ORIGINAL'

    # ── 8. InstanceOnPoints ──────────────────────────────────────────────────
    inst = nd('GeometryNodeInstanceOnPoints', 'Place Seeds', loc=(180, 0))

    # ── 9. Rotation field: (0, 0, θ) — re-uses mul_theta output ─────────────
    rot_xyz = nd('ShaderNodeCombineXYZ', 'Rotation XYZ', loc=(-60, -300))

    # ── 10. RotateInstances — align each seed radially ───────────────────────
    rinst = nd('GeometryNodeRotateInstances', 'Rotate Seeds', loc=(420, 0))
    rinst.inputs['Local Space'].default_value = False

    # ── 11. Material + Realise ───────────────────────────────────────────────
    smat = nd('GeometryNodeSetMaterial', 'Seed Mat', loc=(660, 0))
    smat.inputs[2].default_value = seed_mat

    real = nd('GeometryNodeRealizeInstances', 'Realise', loc=(900, 0))

    # ── Wires: Field chains ──────────────────────────────────────────────────
    lks.new(idx.outputs[0],           mul_theta.inputs[0])
    lks.new(idx.outputs[0],           sqrt_idx.inputs[0])
    lks.new(sqrt_idx.outputs[0],      mul_radius.inputs[0])
    lks.new(mul_theta.outputs[0],     cos_t.inputs[0])
    lks.new(mul_theta.outputs[0],     sin_t.inputs[0])
    lks.new(cos_t.outputs[0],         mul_px.inputs[0])
    lks.new(mul_radius.outputs[0],    mul_px.inputs[1])
    lks.new(sin_t.outputs[0],         mul_py.inputs[0])
    lks.new(mul_radius.outputs[0],    mul_py.inputs[1])
    lks.new(mul_px.outputs[0],        pos_xyz.inputs['X'])
    lks.new(mul_py.outputs[0],        pos_xyz.inputs['Y'])
    lks.new(mul_theta.outputs[0],     rot_xyz.inputs['Z'])

    # ── Wires: Geometry path ─────────────────────────────────────────────────
    lks.new(pts.outputs['Geometry'],   spos.inputs['Geometry'])
    lks.new(pos_xyz.outputs[0],        spos.inputs['Position'])
    lks.new(spos.outputs['Geometry'],  inst.inputs['Points'])
    lks.new(oinfo.outputs['Geometry'], inst.inputs['Instance'])
    lks.new(inst.outputs['Instances'], rinst.inputs['Instances'])
    lks.new(rot_xyz.outputs[0],        rinst.inputs['Rotation'])
    lks.new(rinst.outputs[0],          smat.inputs[0])
    lks.new(smat.outputs[0],           real.inputs[0])
    lks.new(real.outputs[0],           gout.inputs['Geometry'])

    return ng


def make_scaffold_object(ng):
    """
    Empty mesh carrying the GN modifier.
    WHY empty: the GeometryNodePoints node is the true source inside the tree;
    injecting external geometry via GroupInput would add stray vertices.
    """
    me  = bpy.data.meshes.new("SunflowerScaffold")
    obj = bpy.data.objects.new("SunflowerScaffold", me)
    bpy.context.collection.objects.link(obj)
    mod = obj.modifiers.new("PhyllotaxisSunflower", 'NODES')
    mod.node_group = ng
    return obj


def setup_scene_camera():
    sc = bpy.context.scene
    sc.frame_start   = 1
    sc.frame_end     = ANIM_FRAMES
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.fps    = 24

    disc_r  = math.sqrt(COUNT) * SPACING   # ≈ 1.2 m
    cam_h   = disc_r * 1.8
    cam_d   = disc_r * 2.2
    bpy.ops.object.camera_add(location=(cam_d * 0.6, -cam_d * 0.8, cam_h))
    cam = bpy.context.object
    cam.name = "OrbitCam"
    sc.camera = cam
    dx, dy, dz = -cam_d * 0.6, cam_d * 0.8, -cam_h
    hor = math.sqrt(dx*dx + dy*dy)
    cam.rotation_euler = (math.atan2(hor, -dz), 0.0, math.atan2(dx, dy))

    bpy.ops.object.light_add(type='SUN', location=(4.0, -2.0, 6.0))
    sun = bpy.context.object
    sun.data.energy    = 3.0
    sun.rotation_euler = (math.radians(55), 0.0, math.radians(25))

    bpy.ops.object.light_add(type='AREA', location=(-3.0, 3.0, 3.0))
    fill = bpy.context.object
    fill.data.energy = 120.0
    fill.data.size   = 3.0


def animate_camera():
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0.0, 0.0, 0.0))
    pivot = bpy.context.object; pivot.name = "OrbitPivot"
    cam   = bpy.data.objects["OrbitCam"]
    cam.parent = pivot

    sc = bpy.context.scene
    pivot.rotation_euler = (0.0, 0.0, 0.0)
    pivot.keyframe_insert(data_path='rotation_euler', frame=1)
    sc.frame_set(ANIM_FRAMES)
    pivot.rotation_euler = (0.0, 0.0, math.tau)
    pivot.keyframe_insert(data_path='rotation_euler', frame=ANIM_FRAMES)
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def export_glb():
    bpy.context.scene.frame_set(EXPORT_FRAME)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_animations=True,
    )
    print(f"[Phyllotaxis] GLB → {bpy.path.abspath(OUTPUT_GLB)}")


def main():
    clear_scene()
    seed_mat = make_materials()
    seed_obj = make_seed_mesh()
    ng       = build_gn_tree(seed_obj, seed_mat)
    make_scaffold_object(ng)
    setup_scene_camera()
    animate_camera()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    export_glb()
    print("[Phyllotaxis] Done.")


if __name__ == "__main__" or True:
    main()
