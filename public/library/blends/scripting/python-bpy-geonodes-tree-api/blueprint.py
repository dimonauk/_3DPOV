# ============================================================
# Holoflow Studio — Python bpy: GN Tree API Spike-Ball
# Blender 5.1 · CC0 1.0 Universal
# ============================================================
# TECHNIQUE: Build a complete Geometry Nodes node-tree via the
# bpy Python API — bpy.data.node_groups, nodes.new(), links.new()
# and the Blender 4.0+ tree.interface socket system.
# No interactive node editor required; every node, link, and
# panel-exposed parameter is authored in code.
#
# Result: an icosphere ringed with procedural cone spikes.
# Three controls appear in the modifier panel:
#   Density       — spikes per m²
#   Spike Length  — cone height in metres
#   Spike Radius  — cone base radius in metres
# ============================================================

import math
import bpy
import bmesh

# ── Parameters (edit here, not in the body) ──────────────────
SPHERE_RADIUS   = 0.80          # base icosphere radius (m)
SPHERE_SUBDIVS  = 2             # icosphere subdivisions (80 faces)
SPIKE_DENSITY   = 6.0           # default spikes per m²
SPIKE_LENGTH    = 0.28          # default cone height (m)
SPIKE_RADIUS    = 0.028         # default cone base radius (m)
SPIKE_VERTS     = 6             # cone cross-section polygon segments
TREE_NAME       = "HS_SpikeBall"
OBJ_NAME        = "spike_ball"
OUTPUT_GLB      = "//spike_ball.glb"


# ── Utilities ─────────────────────────────────────────────────

def purge(name: str) -> None:
    """Remove an existing node group so the script is re-runnable."""
    ng = bpy.data.node_groups.get(name)
    if ng:
        bpy.data.node_groups.remove(ng)


def xy(node, x: float, y: float) -> None:
    node.location = (x, y)


# ── Node tree ─────────────────────────────────────────────────

def build_spike_tree() -> bpy.types.GeometryNodeTree:
    """
    Construct the GN tree entirely via Python.

    API path (Blender 4.0 / 5.x):
      tree.interface.new_socket() replaces the pre-4.0
      tree.inputs.new() / tree.outputs.new() calls.
      Each socket gets a stable .identifier ("Socket_1" etc.)
      that the host modifier uses as its dict key.
    """
    purge(TREE_NAME)
    tree: bpy.types.GeometryNodeTree = bpy.data.node_groups.new(
        name=TREE_NAME, type="GeometryNodeTree"
    )
    iface = tree.interface   # NodeTreeInterface — Blender 4.0+

    # ── Group interface (modifier panel) ──────────────────────
    # The geometry sockets must be first INPUT and first OUTPUT.
    # The modifier feeds the object's evaluated mesh into the
    # first geometry input automatically.
    iface.new_socket("Geometry",     in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",     in_out="OUTPUT", socket_type="NodeSocketGeometry")

    s_dens = iface.new_socket("Density",      in_out="INPUT", socket_type="NodeSocketFloat")
    s_dens.default_value = SPIKE_DENSITY
    s_dens.min_value     = 0.5
    s_dens.max_value     = 80.0

    s_len  = iface.new_socket("Spike Length", in_out="INPUT", socket_type="NodeSocketFloat")
    s_len.default_value  = SPIKE_LENGTH
    s_len.min_value      = 0.01
    s_len.max_value      = 2.0

    s_rad  = iface.new_socket("Spike Radius", in_out="INPUT", socket_type="NodeSocketFloat")
    s_rad.default_value  = SPIKE_RADIUS
    s_rad.min_value      = 0.001
    s_rad.max_value      = 0.50

    # ── Nodes ─────────────────────────────────────────────────
    nd = tree.nodes
    lk = tree.links

    # Group In / Out — implicit conduits from the modifier
    n_gi  = nd.new("NodeGroupInput");   xy(n_gi,  -760,   0)
    n_go  = nd.new("NodeGroupOutput");  xy(n_go,   640,   0)

    # Distribute Points on Faces — scatter sample points on mesh
    # RANDOM mode (uniform density) is simpler than POISSON for
    # realtime; POISSON needs a Distance Min > 0 to be useful.
    n_dpt = nd.new("GeometryNodeDistributePointsOnFaces")
    n_dpt.distribute_method = "RANDOM"
    xy(n_dpt, -460, 60)

    # Cone — spike prototype, tip radius = 0 → sharp point
    n_cone = nd.new("GeometryNodeMeshCone")
    n_cone.inputs["Vertices"].default_value       = SPIKE_VERTS
    n_cone.inputs["Side Segments"].default_value  = 1
    n_cone.inputs["Fill Segments"].default_value  = 1
    n_cone.inputs["Radius Top"].default_value     = 0.0
    xy(n_cone, -460, -280)

    # Instance on Points — place one cone per sample point
    n_inst = nd.new("GeometryNodeInstanceOnPoints"); xy(n_inst, -80, 0)

    # Realize Instances — convert lazy instances to real geometry
    # Required before Join Geometry so the join handles actual
    # mesh data, not instance references that GN can't merge yet.
    n_real = nd.new("GeometryNodeRealizeInstances"); xy(n_real, 180, 0)

    # Join Geometry — combine original sphere + realised spikes
    n_join = nd.new("GeometryNodeJoinGeometry");    xy(n_join, 420, 0)

    # ── Wiring ────────────────────────────────────────────────
    # Geometry socket (Group Input output[0] = "Geometry")
    lk.new(n_gi.outputs["Geometry"],     n_dpt.inputs["Mesh"])

    # Density panel control → distribute node
    lk.new(n_gi.outputs["Density"],      n_dpt.inputs["Density"])

    # Spike geometry parameters from panel
    lk.new(n_gi.outputs["Spike Radius"], n_cone.inputs["Radius Bottom"])
    lk.new(n_gi.outputs["Spike Length"], n_cone.inputs["Depth"])

    # In Blender 5.1 (4.1+) Distribute Points emits a native
    # Rotation socket — the correct orientation for the face normal.
    # Feeding it directly to Instance on Points avoids needing an
    # Align Euler to Vector node (which was the 3.x approach).
    lk.new(n_dpt.outputs["Points"],      n_inst.inputs["Points"])
    lk.new(n_dpt.outputs["Rotation"],    n_inst.inputs["Rotation"])
    lk.new(n_cone.outputs["Mesh"],       n_inst.inputs["Instance"])

    # Spike chain
    lk.new(n_inst.outputs["Instances"],  n_real.inputs["Geometry"])
    lk.new(n_real.outputs["Geometry"],   n_join.inputs["Geometry"])

    # Pass original sphere through too — join takes multi-input
    lk.new(n_gi.outputs["Geometry"],     n_join.inputs["Geometry"])

    # Final output
    lk.new(n_join.outputs["Geometry"],   n_go.inputs["Geometry"])

    return tree


# ── Material ──────────────────────────────────────────────────

def make_material(name: str, color: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.75
    bsdf.inputs["Roughness"].default_value  = 0.18
    return mat


# ── Scene object ──────────────────────────────────────────────

def build_scene() -> bpy.types.Object:
    # Remove any prior run artefacts
    for name in (OBJ_NAME, "spike_ball_mesh"):
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)

    me = bpy.data.meshes.new("spike_ball_mesh")
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=SPHERE_SUBDIVS, radius=SPHERE_RADIUS)
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    mat = make_material("SpikeBall_Mat", (0.08, 0.54, 0.82))
    me.materials.append(mat)

    tree = build_spike_tree()
    mod  = ob.modifiers.new(name="SpikeBall_GN", type="NODES")
    mod.node_group = tree

    return ob


# ── GLB export ────────────────────────────────────────────────

def export_glb(ob: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath            = bpy.path.abspath(OUTPUT_GLB),
        use_selection       = True,
        export_apply        = True,   # bakes GN modifier output
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )
    print(f"[HS] Exported → {OUTPUT_GLB}")


# ── Entry ─────────────────────────────────────────────────────

if __name__ == "__main__":
    bpy.ops.object.select_all(action="DESELECT")
    ob = build_scene()
    export_glb(ob)
    print("[HS] spike_ball complete — modifier panel: Density / Spike Length / Spike Radius")
