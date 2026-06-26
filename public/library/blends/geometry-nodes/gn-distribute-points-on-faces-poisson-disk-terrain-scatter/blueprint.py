"""
Blender 5.1 — GN Distribute Points on Faces: Poisson-Disk Terrain Scatter
blueprint.py

Technique:
  Distribute Points on Faces (POISSON_DISK) places points on a terrain mesh
  with a guaranteed minimum separation — the Bridson 2007 blue-noise algorithm.
  Compared to RANDOM mode, Poisson Disk eliminates visual clumping while using
  ~30 % fewer points to achieve the same perceived coverage.

  A slope-selection mask (Normal.z > SLOPE_MIN) strips cliff faces so boulders
  only land on walkable ground.  Two faceted rock variants are index-switched
  per point, rotated by a random Z angle aligned to the surface normal, given
  a random uniform scale, then realised and joined with the terrain for a
  single-mesh GLB ready for WebXR.

Key Blender 5.1 API notes:
  nt.interface.new_socket()  — 4.0+ replacement for deprecated nt.inputs.new()
  FunctionNodeRandomValue["ID"] — must link to GeometryNodeInputIndex for
    per-point variation; without it every point draws the same scalar
  DistributePointsOnFaces (POISSON_DISK) exposes "Distance Min" + "Density Max"
    sockets (RANDOM mode exposes "Density" instead — incompatible names)
  DistributePointsOnFaces "Rotation" output is a ROTATION type pre-aligned to
    the face normal; feed directly into InstanceOnPoints "Rotation"
  RotateInstances(Local Space=True) twists each instance around its own Z
    (the surface normal), so rocks spin without tilting off the slope
"""

import bpy
import bmesh
import math
import random
import mathutils

# ── Parameters ─────────────────────────────────────────────────────────────
TERRAIN_SIZE   = 8.0     # plane extents, metres (square)
SUBDIV_CUTS    = 40      # edge-loop cuts per axis on the terrain grid
NOISE_STRENGTH = 0.9     # max hill height (metres)
NOISE_SCALE    = 3.0     # spatial frequency of hill noise
ROCK_RADIUS    = 0.12    # base bounding radius of each rock (metres)
POISSON_MIN_D  = 0.45    # minimum separation between scatter points (metres)
DENSITY_MAX    = 8.0     # peak scatter density (points per m²)
SLOPE_MIN      = 0.25    # Normal.z below this → no rocks (cliff filter)
SCATTER_SEED   = 42
SCALE_MIN      = 0.5     # minimum rock scale multiplier
SCALE_MAX      = 2.2     # maximum rock scale multiplier
GLB_OUT        = "//terrain_scatter.glb"


# ── Scene helpers ────────────────────────────────────────────────────────────
def purge():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for d in (bpy.data.meshes, bpy.data.node_groups):
        for b in list(d):
            d.remove(b)


def link_obj(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def activate(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


# ── Terrain ──────────────────────────────────────────────────────────────────
def make_terrain():
    """
    40×40 subdivided grid displaced by fractal Brownian motion.
    mathutils.noise.fractal(p, H, lacunarity, octaves) implements fBm without
    needing the Musgrave Texture node, so displacement is fully scriptable.
    bm.normal_update() is called before writing to mesh so normals are correct
    before GN reads them — if skipped the slope mask can be inverted on hills.
    """
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments=SUBDIV_CUTS,
        y_segments=SUBDIV_CUTS,
        size=TERRAIN_SIZE / 2,
    )
    fbm = mathutils.noise.fractal
    for v in bm.verts:
        h = fbm(
            mathutils.Vector((v.co.x * NOISE_SCALE, v.co.y * NOISE_SCALE, 0.0)),
            H=1.0, lacunarity=2.0, octaves=4,
        )
        v.co.z = h * NOISE_STRENGTH
    bm.normal_update()
    mesh = bpy.data.meshes.new("terrain_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = link_obj(bpy.data.objects.new("terrain", mesh))
    activate(obj)
    bpy.ops.object.shade_smooth()
    return obj


# ── Rock variants ─────────────────────────────────────────────────────────────
def make_rock(name: str, subdiv: int, jitter: float):
    """
    Ico-sphere with per-vertex normal-direction displacement.
    subdiv=1 → 20 flat-shaded triangles (angular boulder)
    subdiv=2 → 80 triangles (rounder pebble)
    Two variants add silhouette diversity without a third object in memory.
    The rock is placed at (200, 0, 0) and hidden from rendering — GN reads the
    geometry via Object Info without the object appearing in the scene camera.
    """
    rng = random.Random(hash(name))
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=ROCK_RADIUS)
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * rng.uniform(-jitter, jitter)
    bm.normal_update()
    mesh = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = link_obj(bpy.data.objects.new(name, mesh))
    for poly in mesh.polygons:
        poly.use_smooth = False   # preserve faceted silhouette
    obj.location = (200.0, 0.0, 0.0)
    obj.hide_render = True
    return obj


# ── Geometry Nodes tree ────────────────────────────────────────────────────────
def build_gn_tree(rock_a, rock_b):
    """
    Node graph summary (left → right):
      [Group Input] ──────────────────────────────────────────────── terrain ──┐
        ↓ (min_d / density / seed)                                              │
      [DistributePoints] ─── Points ──► [InstanceOnPoints]                     │
        Selection ◄── Normal.z > SLOPE_MIN                                     │
        Rotation ────────────────────► Rotation (normal-aligned)               │
                                          │                                     │
        [Index → Modulo2 → IndexSwitch] ─ Instance                            │
                                          │                                     │
        [rand_z → AxisAngle] ────────► [RotateInstances] (Local Z)             │
        [rand_s → CombineXYZ] ───────► [ScaleInstances]                        │
                                          │                                     │
                                       [RealizeInstances]                       │
                                          │                                     │
                                       [JoinGeometry] ◄─────────────────────────┘
                                          │
                                       [Group Output]
    """
    nt = bpy.data.node_groups.new("HS_TerrainScatter", "GeometryNodeTree")
    iface = nt.interface
    iface.new_socket("Geometry",     in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Min Distance", in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Density Max",  in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Seed",         in_out="INPUT",  socket_type="NodeSocketInt")
    iface.new_socket("Geometry",     in_out="OUTPUT", socket_type="NodeSocketGeometry")

    def N(t, x, y, **props):
        n = nt.nodes.new(t)
        n.location = (x, y)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def L(a, ao, b, bi):
        nt.links.new(a.outputs[ao], b.inputs[bi])

    # ── Group I/O ──────────────────────────────────────────────────────────
    gi = N("NodeGroupInput",  -1000, 0)
    go = N("NodeGroupOutput",  1300, 0)
    gi.outputs["Min Distance"].default_value = POISSON_MIN_D
    gi.outputs["Density Max"].default_value  = DENSITY_MAX
    gi.outputs["Seed"].default_value         = SCATTER_SEED

    # ── Slope mask: Normal.z > SLOPE_MIN → face-domain Boolean ────────────
    nm   = N("GeometryNodeInputNormal",   -800, 300)
    sxyz = N("ShaderNodeSeparateXYZ",     -640, 300)
    cmp  = N("FunctionNodeCompare", -460, 300,
             data_type="FLOAT", operation="GREATER_THAN")
    cmp.inputs["B"].default_value = SLOPE_MIN
    L(nm,   "Normal", sxyz, "Vector")
    L(sxyz, "Z",      cmp,  "A")

    # ── Distribute Points (Poisson Disk) ────────────────────────────────────
    dist = N("GeometryNodeDistributePointsOnFaces", -240, 0,
             distribution_type="POISSON_DISK")
    L(gi,   "Geometry",     dist, "Mesh")
    L(cmp,  "Result",       dist, "Selection")
    L(gi,   "Min Distance", dist, "Distance Min")
    L(gi,   "Density Max",  dist, "Density Max")
    L(gi,   "Seed",         dist, "Seed")

    # Per-point index — connects to "ID" socket of all RandomValue nodes
    # so that each scattered point draws an independent random number
    idx = N("GeometryNodeInputIndex", -240, -280)

    # ── Rock variant picker: (Index % 2) → IndexSwitch ────────────────────
    mod2 = N("ShaderNodeMath", 0, 300, operation="MODULO")
    mod2.inputs[1].default_value = 2.0
    iswitch = N("GeometryNodeIndexSwitch", 220, 300)
    iswitch.data_type = "GEOMETRY"
    L(idx,  "Index",    mod2,    0)
    L(mod2, "Value",    iswitch, "Index")

    obj_a = N("GeometryNodeObjectInfo", 0, 460, transform_space="ORIGINAL")
    obj_b = N("GeometryNodeObjectInfo", 0, 380, transform_space="ORIGINAL")
    obj_a.inputs["Object"].default_value = rock_a
    obj_b.inputs["Object"].default_value = rock_b
    L(obj_a, "Geometry", iswitch, 0)
    L(obj_b, "Geometry", iswitch, 1)

    # ── Instance on Points ─────────────────────────────────────────────────
    inst = N("GeometryNodeInstanceOnPoints", 460, 0)
    L(dist,    "Points",   inst, "Points")
    L(iswitch, 0,          inst, "Instance")
    L(dist,    "Rotation", inst, "Rotation")   # face-normal alignment

    # ── Random Z rotation (seed offset +1 avoids correlation with scatter) ─
    seed_z = N("ShaderNodeMath", 200, -80, operation="ADD")
    seed_z.inputs[1].default_value = 1.0
    L(gi, "Seed", seed_z, 0)

    rand_z = N("FunctionNodeRandomValue", 200, 0, data_type="FLOAT")
    rand_z.inputs["Min"].default_value = 0.0
    rand_z.inputs["Max"].default_value = math.tau
    L(seed_z, "Value", rand_z, "Seed")
    L(idx,    "Index", rand_z, "ID")

    axang = N("FunctionNodeAxisAngleToRotation", 380, 0)
    axang.inputs["Axis"].default_value = (0.0, 0.0, 1.0)
    L(rand_z, "Value", axang, "Angle")

    rot_i = N("GeometryNodeRotateInstances", 660, 0)
    rot_i.inputs["Local Space"].default_value = True
    L(inst,  "Instances", rot_i, "Instances")
    L(axang, "Rotation",  rot_i, "Rotation")

    # ── Random uniform scale (seed offset +2) ──────────────────────────────
    seed_s = N("ShaderNodeMath", 200, -220, operation="ADD")
    seed_s.inputs[1].default_value = 2.0
    L(gi, "Seed", seed_s, 0)

    rand_s = N("FunctionNodeRandomValue", 200, -160, data_type="FLOAT")
    rand_s.inputs["Min"].default_value = SCALE_MIN
    rand_s.inputs["Max"].default_value = SCALE_MAX
    L(seed_s, "Value", rand_s, "Seed")
    L(idx,    "Index", rand_s, "ID")

    # CombineXYZ with same socket wired 3× → uniform (not axis-independent) scale
    cxyz = N("ShaderNodeCombineXYZ", 400, -160)
    L(rand_s, "Value", cxyz, "X")
    L(rand_s, "Value", cxyz, "Y")
    L(rand_s, "Value", cxyz, "Z")

    sc_i = N("GeometryNodeScaleInstances", 860, 0)
    L(rot_i, "Instances", sc_i, "Instances")
    L(cxyz,  "Vector",    sc_i, "Scale")

    # ── Realise + join with terrain mesh ────────────────────────────────────
    real = N("GeometryNodeRealizeInstances", 1040, 0)
    L(sc_i, "Instances", real, "Geometry")

    join = N("GeometryNodeJoinGeometry", 1180, 0)
    L(gi,   "Geometry", join, "Geometry")
    L(real, "Geometry", join, "Geometry")
    L(join, "Geometry", go,   "Geometry")

    return nt


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    purge()
    terrain = make_terrain()
    rock_a  = make_rock("rock_a", subdiv=1, jitter=0.04)
    rock_b  = make_rock("rock_b", subdiv=2, jitter=0.02)

    gn_tree = build_gn_tree(rock_a, rock_b)
    mod = terrain.modifiers.new("HS_Scatter", "NODES")
    mod.node_group = gn_tree

    activate(terrain)
    bpy.ops.object.modifier_apply(modifier="HS_Scatter")

    # Source rocks served GN only — remove before export to keep GLB clean
    for rock in (rock_a, rock_b):
        bpy.data.objects.remove(rock, do_unlink=True)

    bpy.ops.object.select_all(action="DESELECT")
    terrain.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        use_selection=True,
    )
    print(f"✓ Exported: {GLB_OUT}")


main()
