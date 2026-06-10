"""
holoflow_macros.gn_realize_instances_crystal_grotto
────────────────────────────────────────────────────
Macro: build the Crystal Grotto scene programmatically, or append the
Capture→Realize→Store pipeline to any existing InstanceOnPoints GN tree.

Usage (two modes):

  # Mode A — build a fresh Crystal Grotto from scratch:
  from holoflow_macros.gn_realize_instances_crystal_grotto import build_crystal_grotto
  build_crystal_grotto()

  # Mode B — patch an existing object whose NODES modifier ends with
  # InstanceOnPoints but lacks Realize Instances:
  from holoflow_macros.gn_realize_instances_crystal_grotto import patch_realize
  patch_realize(obj, attribute_name='my_hue', seed=31)
"""

import bpy, math

__all__ = ['build_crystal_grotto', 'patch_realize']


def build_crystal_grotto(
    scatter_count: int = 110,
    sphere_radius: float = 0.88,
    shard_height: float = 0.28,
    scale_min: float = 0.45,
    scale_max: float = 2.0,
    emission_str: float = 1.6,
    hue_seed: int = 31,
    scale_seed: int = 7,
    scatter_seed: int = 0,
    output_glb: str = "//crystal_grotto.glb",
) -> bpy.types.Object:
    """
    Create the full Crystal Grotto scene and return the scatter sphere object.

    Calls into the blueprint module's helpers; if the blueprint is not importable
    (standalone mode), falls back to a minimal inline version.
    """
    try:
        import importlib.util, pathlib, sys
        bp_path = pathlib.Path(__file__).parent.parent.parent.parent / \
                  "public/library/blends/geometry-nodes/gn-realize-instances-crystal-grotto/blueprint.py"
        spec = importlib.util.spec_from_file_location("bp_crystal_grotto", bp_path)
        bp   = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(bp)
        bp.SCATTER_COUNT = scatter_count
        bp.SPHERE_RADIUS  = sphere_radius
        bp.SHARD_HEIGHT   = shard_height
        bp.SCALE_MIN      = scale_min
        bp.SCALE_MAX      = scale_max
        bp.EMISSION_STR   = emission_str
        bp.OUTPUT_GLB     = output_glb
        bp.main()
        return bpy.data.objects.get("scatter_sphere")
    except Exception as e:
        print(f"[holoflow_macros] blueprint import failed ({e}); running inline build")
        return _inline_build(scatter_count, sphere_radius, shard_height,
                             scale_min, scale_max, emission_str,
                             hue_seed, scale_seed, scatter_seed, output_glb)


def patch_realize(
    obj: bpy.types.Object,
    attribute_name: str = "instance_hue",
    seed: int = 31,
    data_type: str = "FLOAT",
) -> None:
    """
    Append CaptureAttribute(INSTANCE) → RealizeInstances → StoreNamedAttribute(POINT)
    to the tail of an existing NODES modifier node chain.

    Finds the last node connected to the GroupOutput geometry socket and inserts
    the three new nodes between it and GroupOutput.

    Args:
      obj:            Object with a NODES modifier whose tree ends with InstanceOnPoints.
      attribute_name: Name to assign in StoreNamedAttribute.
      seed:           Random seed for the per-instance FunctionNodeRandomValue.
      data_type:      'FLOAT' | 'INT' | 'FLOAT_VECTOR'.
    """
    mod = next((m for m in obj.modifiers if m.type == 'NODES'), None)
    if mod is None:
        raise ValueError(f"Object '{obj.name}' has no NODES modifier.")
    ng = mod.node_group
    if ng is None:
        raise ValueError(f"NODES modifier on '{obj.name}' has no node group.")

    ns = ng.nodes
    lk = ng.links.new

    # find GroupOutput and its Geometry input link
    gout = next((n for n in ns if n.type == 'GROUP_OUTPUT'), None)
    if gout is None:
        raise ValueError("No GroupOutput node found in the node group.")

    geom_socket = gout.inputs.get('Geometry') or gout.inputs[0]
    existing_link = next((l for l in ng.links if l.to_socket == geom_socket), None)
    if existing_link is None:
        raise ValueError("GroupOutput Geometry socket has no incoming link.")

    prev_node   = existing_link.from_node
    prev_socket = existing_link.from_socket
    ng.links.remove(existing_link)

    # per-instance random value
    rhue = ns.new('FunctionNodeRandomValue')
    rhue.data_type = data_type
    if data_type == 'FLOAT':
        rhue.inputs['Min'].default_value = 0.0
        rhue.inputs['Max'].default_value = 1.0
    rhue.inputs['Seed'].default_value = seed

    # capture at INSTANCE domain
    cap = ns.new('GeometryNodeCaptureAttribute')
    cap.domain    = 'INSTANCE'
    cap.data_type = data_type

    # realize instances
    real = ns.new('GeometryNodeRealizeInstances')

    # store named attribute
    store = ns.new('GeometryNodeStoreNamedAttribute')
    store.domain    = 'POINT'
    store.data_type = data_type
    store.inputs['Name'].default_value = attribute_name

    # wire
    lk(prev_socket,              cap.inputs['Geometry'])
    lk(rhue.outputs['Value'],    cap.inputs[1])
    lk(cap.outputs['Geometry'],  real.inputs['Geometry'])
    lk(real.outputs['Geometry'], store.inputs['Geometry'])
    lk(cap.outputs[1],           store.inputs[3])
    lk(store.outputs['Geometry'], geom_socket)

    # reposition appended nodes to the right of the previous tail node
    x_base = prev_node.location[0] + 280
    cap.location   = (x_base,        0)
    rhue.location  = (x_base,       -250)
    real.location  = (x_base + 260,  0)
    store.location = (x_base + 520,  0)
    gout.location  = (x_base + 780,  0)

    print(f"[patch_realize] appended Capture→Realize→Store('{attribute_name}') to '{obj.name}'")


# ── minimal inline build (fallback) ──────────────────────────────────────────

def _inline_build(scatter_count, sphere_radius, shard_height,
                  scale_min, scale_max, emission_str,
                  hue_seed, scale_seed, scatter_seed, output_glb):
    """Minimal Crystal Grotto without importing blueprint.py."""
    import bmesh
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # prototype shard
    mesh = bpy.data.meshes.new("shard_proto")
    shard = bpy.data.objects.new("shard_proto", mesh)
    bpy.context.collection.objects.link(shard)
    bm = bmesh.new()
    n, h, tip_z = 6, shard_height, shard_height * 0.72
    r = 0.042
    base = [bm.verts.new((r*math.cos(math.pi/n+i*math.tau/n), r*math.sin(math.pi/n+i*math.tau/n), 0)) for i in range(n)]
    top  = [bm.verts.new((r*.5*math.cos(math.pi/n+i*math.tau/n), r*.5*math.sin(math.pi/n+i*math.tau/n), tip_z)) for i in range(n)]
    apex = bm.verts.new((0,0,h))
    bm.verts.ensure_lookup_table()
    bm.faces.new(reversed(base))
    for i in range(n): bm.faces.new([base[i],base[(i+1)%n],top[(i+1)%n],top[i]])
    for i in range(n): bm.faces.new([top[i],top[(i+1)%n],apex])
    bm.to_mesh(mesh); bm.free(); mesh.shade_flat()
    shard.hide_render = shard.hide_viewport = True

    # sphere
    mesh2 = bpy.data.meshes.new("scatter_sphere")
    sphere = bpy.data.objects.new("scatter_sphere", mesh2)
    bpy.context.collection.objects.link(sphere)
    bm2 = bmesh.new()
    bmesh.ops.create_uvsphere(bm2, u_segments=24, v_segments=16, radius=sphere_radius)
    bm2.to_mesh(mesh2); bm2.free()

    patch_realize(sphere, attribute_name='crystal_hue', seed=hue_seed)
    return sphere
