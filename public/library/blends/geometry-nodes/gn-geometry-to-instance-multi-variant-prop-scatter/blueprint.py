"""
GN Geometry to Instance — Multi-Variant Prop Scatter
Blender 5.1 | CC0 | Holoflow Studio

TECHNIQUE (3 sentences)
  GeometryNodeGeometryToInstance is the deliberate inverse of Realise
  Instances: it wraps a flat geometry as a single instance reference so
  downstream nodes treat it as a reference, not a copy.  Joining several
  GeometryToInstance outputs with JoinGeometry produces a multi-slot
  instance library that InstanceOnPoints draws from per-point when Pick
  Instance is enabled, selecting a variant by an integer index field — no
  IndexSwitch branching, no per-branch geometry duplication.  For four
  pre-baked boulder meshes, each source is evaluated once regardless of
  how many scatter points select it.

WHY GEOMETRY TO INSTANCE OVER INDEX SWITCH
  IndexSwitch evaluates ALL N branches regardless of which index is active;
  every sub-tree runs per-element in the scatter domain even if zero points
  select that branch.  GeometryToInstance + JoinGeometry evaluates each
  source exactly once, wraps it as a reference, and the selection happens
  at InstanceOnPoints realisation time — O(sources), not O(sources × points).
  For a handful of pre-baked static meshes the runtime difference is small,
  but the mental model is cleaner and the pattern scales correctly when
  sources are themselves GN modifier stacks or expensive sub-trees.

OUTSIDE SOURCES
  Blender Manual — Geometry to Instance Node
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/geometry_to_instance.html
  CC-BY-SA 4.0, Blender Documentation Team

  Blender Manual — Instance on Points Node (Pick Instance socket)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/instance_on_points.html
  CC-BY-SA 4.0, Blender Documentation Team

PARAMETERS
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
VARIANT_COUNT     = 4          # boulder variants to generate and bundle
BASE_RADIUS       = 0.45       # metres, base icosphere radius
TERRAIN_SIZE      = 10.0       # metres, flat scatter ground plane
TERRAIN_SUBDIVS   = 2          # grid subdivisions (flat — interest is the scatter)
SCATTER_DENSITY   = 3.5        # pts / m²
SCATTER_SEED      = 7
SCALE_MIN         = 0.55
SCALE_MAX         = 1.40
OUT_DIR           = "//"
GLB_PATH          = OUT_DIR + "boulder_scatter.glb"

# ── Helpers ───────────────────────────────────────────────────────────────────

def purge():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)


def link_obj(obj):
    bpy.context.scene.collection.objects.link(obj)

# ── Boulder variants ──────────────────────────────────────────────────────────

def make_boulder(variant: int) -> bpy.types.Object:
    """
    Four variants from the same icosphere base:
      0 — base sphere (subdivisions=1, low-poly)
      1 — flattened Z (river-stone profile)
      2 — elongated Y (granite slab)
      3 — noise-warped (rough crag, subdivisions=2)
    """
    mesh = bpy.data.meshes.new(f"boulder_{variant}")
    bm   = bmesh.new()
    subdivs = 2 if variant == 3 else 1
    bmesh.ops.create_icosphere(bm, subdivisions=subdivs, radius=BASE_RADIUS)

    if variant == 1:
        bmesh.ops.scale(bm, vec=Vector((1.0, 1.0, 0.45)), verts=bm.verts)
    elif variant == 2:
        bmesh.ops.scale(bm, vec=Vector((0.65, 1.55, 0.75)), verts=bm.verts)
    elif variant == 3:
        # Deterministic noise warp — LCG hash on vertex index
        for i, v in enumerate(bm.verts):
            t = (i * 2654435761 % 4294967296) / 4294967296.0
            v.co += v.normal * (t - 0.5) * BASE_RADIUS * 0.35
        bm.normal_update()

    bm.to_mesh(mesh)
    bm.free()
    mesh.calc_normals()

    obj = bpy.data.objects.new(f"boulder_{variant}", mesh)
    link_obj(obj)
    # Source meshes are invisible — only their instances (via InstanceOnPoints) render
    obj.hide_viewport = True
    obj.hide_render   = True
    return obj

# ── Terrain ───────────────────────────────────────────────────────────────────

def make_terrain() -> bpy.types.Object:
    """Flat subdivided plane as the scatter surface."""
    mesh = bpy.data.meshes.new("terrain")
    bm   = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments = TERRAIN_SUBDIVS,
        y_segments = TERRAIN_SUBDIVS,
        size       = TERRAIN_SIZE * 0.5,
    )
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("terrain", mesh)
    link_obj(obj)
    return obj

# ── GN tree ───────────────────────────────────────────────────────────────────

def build_gn_tree(boulders: list) -> bpy.types.NodeTree:
    """
    Node graph layout (left → right):

      GroupInput.Geometry ──────────────────────────────────────→ JoinGeo[0]
            │
      DistributePointsOnFaces (RANDOM)
            │ Points          │ Rotation
            │                 │
      InstanceOnPoints ←──────┘
        Pick Instance = True
        Instance Index ← RandomValue(INT, 0, N-1)
        Scale          ← CombineXYZ ← RandomValue(FLOAT)
        Instance       ← JoinGeo[ GeomToInst × N ]

      InstanceOnPoints → RealizeInstances → JoinGeo[1] → GroupOutput

    Key insight:
      ObjectInfo × N → GeometryToInstance × N → JoinGeometry builds an
      N-slot prop library.  Each slot is one wrapped instance reference.
      InstanceOnPoints with Pick Instance=True draws exactly one slot per
      scatter point by the integer Instance Index field.
    """
    nt    = bpy.data.node_groups.new("GN_PropScatter", 'GeometryNodeTree')
    nodes = nt.nodes
    links = nt.links

    nt.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    nt.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def N(t, x, y):
        n = nodes.new(t); n.location = (x, y); return n

    gin  = N('NodeGroupInput',  -900,  0)
    gout = N('NodeGroupOutput',  900,  0)

    # Scatter ──────────────────────────────────────────────────────────────────
    dist = N('GeometryNodeDistributePointsOnFaces', -600, 0)
    dist.distribute_method = 'RANDOM'
    # RANDOM socket layout: [0]=Mesh, [1]=Selection, [2]=Density,
    # [3]=Density Factor, [4]=Seed
    dist.inputs[2].default_value = SCATTER_DENSITY
    dist.inputs[4].default_value = SCATTER_SEED
    links.new(gin.outputs['Geometry'], dist.inputs[0])

    # Prop library: ObjectInfo → GeometryToInstance × N → JoinGeometry ────────
    # Each GeometryToInstance wraps one boulder mesh as a reference, not a copy.
    # JoinGeometry merges them into one geometry with N instance slots.
    g2i_nodes = []
    for i, boulder_obj in enumerate(boulders):
        info = N('GeometryNodeObjectInfo', -650, 300 - i * 160)
        info.transform_space = 'RELATIVE'   # place at scatter-point, not world-origin
        info.inputs['Object'].default_value = boulder_obj

        g2i = N('GeometryNodeGeometryToInstance', -450, 300 - i * 160)
        # Output socket was 'Geometry' in Blender 4.0–4.2; renamed 'Instances' in 4.3+.
        # Using integer index [0] avoids version-specific string look-ups.
        links.new(info.outputs['Geometry'], g2i.inputs['Geometry'])
        g2i_nodes.append(g2i)

    prop_lib = N('GeometryNodeJoinGeometry', -250, 200)
    for g2i in g2i_nodes:
        links.new(g2i.outputs[0], prop_lib.inputs['Geometry'])

    # Per-point random variant index ───────────────────────────────────────────
    rand_idx = N('GeometryNodeRandomValue', -300, -120)
    rand_idx.data_type = 'INT'
    rand_idx.inputs['Min'].default_value = 0
    rand_idx.inputs['Max'].default_value = VARIANT_COUNT - 1
    # Use a different seed offset so scale and index don't correlate
    rand_idx.inputs['Seed'].default_value = SCATTER_SEED + 1

    # Uniform random scale (same float to all 3 axes via CombineXYZ) ──────────
    rand_scale = N('GeometryNodeRandomValue', -300, -260)
    rand_scale.data_type = 'FLOAT'
    rand_scale.inputs['Min'].default_value = SCALE_MIN
    rand_scale.inputs['Max'].default_value = SCALE_MAX
    combine = N('ShaderNodeCombineXYZ', -100, -260)
    links.new(rand_scale.outputs['Value'], combine.inputs['X'])
    links.new(rand_scale.outputs['Value'], combine.inputs['Y'])
    links.new(rand_scale.outputs['Value'], combine.inputs['Z'])

    # Instance on Points ───────────────────────────────────────────────────────
    inst = N('GeometryNodeInstanceOnPoints', 100, 0)
    # Pick Instance=True: draw one slot per point by Instance Index.
    # Pick Instance=False (default): ALL N slots stack at every point.
    inst.inputs['Pick Instance'].default_value = True
    links.new(dist.outputs['Points'],          inst.inputs['Points'])
    links.new(dist.outputs['Rotation'],        inst.inputs['Rotation'])
    links.new(prop_lib.outputs['Geometry'],    inst.inputs['Instance'])
    links.new(rand_idx.outputs['Value'],       inst.inputs['Instance Index'])
    links.new(combine.outputs['Vector'],       inst.inputs['Scale'])

    # Realise + join with terrain ──────────────────────────────────────────────
    realise = N('GeometryNodeRealizeInstances', 350, 0)
    join    = N('GeometryNodeJoinGeometry',     650, 0)
    links.new(inst.outputs['Instances'],   realise.inputs['Geometry'])
    links.new(gin.outputs['Geometry'],     join.inputs['Geometry'])
    links.new(realise.outputs['Geometry'], join.inputs['Geometry'])
    links.new(join.outputs['Geometry'],    gout.inputs['Geometry'])

    return nt

# ── Main ──────────────────────────────────────────────────────────────────────

purge()

boulders = [make_boulder(i) for i in range(VARIANT_COUNT)]
terrain  = make_terrain()

nt  = build_gn_tree(boulders)
mod = terrain.modifiers.new("PropScatter", 'NODES')
mod.node_group = nt

bpy.context.view_layer.update()

bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath(GLB_PATH),
    export_format = 'GLB',
    export_apply  = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    use_selection = False,
    export_extras = True,
)

print(f"[blueprint] exported → {GLB_PATH}")
print(f"[blueprint] {VARIANT_COUNT} boulder variants, density {SCATTER_DENSITY} pts/m²")
