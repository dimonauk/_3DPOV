"""
blueprint.py — bpy.types.NodeTreeInterface: Programmatic GN Socket Authoring
Blender 5.1 | CC0 | Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY THIS EXISTS
───────────────
Blender 4.0 removed bpy.types.NodeTree.inputs / .outputs entirely.
Any script that calls ng.inputs.new() or ng.outputs.new() raises:

    AttributeError: 'GeometryNodeTree' object has no attribute 'inputs'

The replacement is ng.interface — a bpy.types.NodeTreeInterface instance.
Every socket (and, from 4.2, every panel) lives there.
This script demonstrates the full migration path with expert depth.

WHAT WE BUILD
─────────────
A "Radial Fan" Geometry Node group authored 100% from Python:
  • 6 typed, ranged, defaulted input sockets via interface.new_socket()
  • 1 socket panel grouping (4.2+/5.x) via interface.new_panel()
  • A working node graph: circle points → instance blades → realise → export
  • NodesModifier attached to a carrier mesh
  • GLB export with Draco L6 + WebP textures

OUTPUT ARTEFACTS
────────────────
  radial_fan.glb         — parametric fan with 9 blades, 0.4 m radius
  radial_fan.blend       — .blend with the authored GN group
"""

import bpy
import math

# ── Named constants ────────────────────────────────────────────────────────────
GROUP_NAME   = "Radial_Fan_GN"
EXPORT_GLB   = "//radial_fan.glb"
EXPORT_BLEND = "//radial_fan.blend"

DEFAULT_COUNT   = 9
DEFAULT_RADIUS  = 0.4   # metres, distance of blade centres from origin
DEFAULT_SCALE   = 0.18  # uniform blade size
DEFAULT_TWIST   = 20.0  # degrees per-blade tilt around radial axis
DEFAULT_HEIGHT  = 0.02  # blade extrusion thickness


# ── Scene reset ────────────────────────────────────────────────────────────────

def clean_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)


# ── Socket interface authoring (the 4.0+ / 5.1 way) ───────────────────────────

def build_interface(ng: bpy.types.GeometryNodeTree) -> dict:
    """
    Returns a name→socket dict for later identifier lookup.

    Key facts about NodeTreeInterface:
    • ng.interface.new_socket(name, in_out, socket_type) — sole constructor.
    • in_out must be 'INPUT' or 'OUTPUT' (string literal, not enum int).
    • socket_type strings: 'NodeSocketGeometry', 'NodeSocketFloat',
      'NodeSocketInt', 'NodeSocketVector', 'NodeSocketMaterial', etc.
    • Returned object: bpy.types.NodeTreeInterfaceSocket
      .default_value  — sets UI default and modifier default
      .min_value / .max_value — clamp the slider (FLOAT/INT only)
      .identifier     — stable key for mod[identifier] access (NOT the .name)
    """
    iface = ng.interface

    # ── Mandatory geometry pair ────────────────────────────────────────────────
    geo_out = iface.new_socket(
        name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry"
    )
    geo_in = iface.new_socket(
        name="Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry"
    )

    # ── Optional collapsible panel (Blender 4.2 / 5.x) ────────────────────────
    # Sockets created after new_panel() are added inside that panel.
    # On 4.0 / 4.1 new_panel() doesn't exist; the except branch skips it
    # and sockets appear flat — no functionality lost.
    panel = None
    try:
        panel = iface.new_panel(name="Fan Controls")
    except AttributeError:
        pass  # Blender < 4.2: panels unsupported, flat socket list is fine

    def _sock(name: str, stype: str, in_out: str = "INPUT",
              default=None, lo=None, hi=None) -> bpy.types.NodeTreeInterfaceSocket:
        kw: dict = {"name": name, "in_out": in_out, "socket_type": stype}
        # Attach to panel if one was created; omit kwarg if not
        if panel is not None:
            kw["parent"] = panel
        s = iface.new_socket(**kw)
        if default is not None:
            s.default_value = default
        if lo is not None and hasattr(s, "min_value"):
            s.min_value = lo
        if hi is not None and hasattr(s, "max_value"):
            s.max_value = hi
        return s

    count_s  = _sock("Blade Count",      "NodeSocketInt",      default=DEFAULT_COUNT,  lo=3,    hi=32)
    radius_s = _sock("Blade Radius",     "NodeSocketFloat",    default=DEFAULT_RADIUS, lo=0.05, hi=4.0)
    scale_s  = _sock("Blade Scale",      "NodeSocketFloat",    default=DEFAULT_SCALE,  lo=0.01, hi=1.0)
    twist_s  = _sock("Blade Twist (°)",  "NodeSocketFloat",    default=DEFAULT_TWIST,  lo=-90,  hi=90)
    height_s = _sock("Blade Thickness",  "NodeSocketFloat",    default=DEFAULT_HEIGHT, lo=0.001,hi=0.5)
    mat_s    = _sock("Material",         "NodeSocketMaterial")

    return {
        "geo_in":  geo_in,
        "geo_out": geo_out,
        "count":   count_s,
        "radius":  radius_s,
        "scale":   scale_s,
        "twist":   twist_s,
        "height":  height_s,
        "mat":     mat_s,
    }


# ── Node graph construction ────────────────────────────────────────────────────

def _add(ng: bpy.types.GeometryNodeTree, bl_idname: str,
         loc: tuple, **props) -> bpy.types.Node:
    n = ng.nodes.new(type=bl_idname)
    n.location = loc
    for k, v in props.items():
        setattr(n, k, v)
    return n


def build_nodes(ng: bpy.types.GeometryNodeTree) -> None:
    """
    Node graph:
      GroupInput → MeshCircle (point positions) ──────────────────┐
      GroupInput → Transform (scale blade prototype) → InstanceOn  → Realise → SetMat → GroupOutput
                   [UVSphere blade proto] ─────────────────────────┘

    Why UVSphere as blade prototype?
    Segments=6, Rings=3 gives a low-poly teardrop — readable as a fan blade
    without requiring a sub-mesh builder.  The scale socket shrinks it.
    """
    nodes = ng.nodes
    links = ng.links

    # Auto-created by Blender when sockets are added
    gin  = nodes.get("Group Input")  or _add(ng, "NodeGroupInput",  (-800, 0))
    gout = nodes.get("Group Output") or _add(ng, "NodeGroupOutput", ( 800, 0))

    # Circle of point positions (one per blade)
    circle = _add(ng, "GeometryNodeMeshCircle", (-500, 150))
    circle.fill_type = "NONE"               # just vertices, no fill face

    # Blade prototype: low-poly UV sphere
    sphere = _add(ng, "GeometryNodeMeshUVSphere", (-500, -150))
    sphere.inputs["Segments"].default_value = 6
    sphere.inputs["Rings"].default_value    = 3

    # Scale blade by Blade Scale socket input
    blade_xf = _add(ng, "GeometryNodeTransform", (-250, -150))

    # Instance blades on circle points
    inst = _add(ng, "GeometryNodeInstanceOnPoints", (50, 0))

    # Twist each blade: rotate_instances around local Z by index-fraction
    # We use a simple Index × (twist / count) driver via Math nodes
    idx   = _add(ng, "GeometryNodeInputIndex",         (-200, -320))
    count_math = _add(ng, "ShaderNodeMath", (-50, -320))
    count_math.operation = "DIVIDE"

    twist_rad = _add(ng, "ShaderNodeMath", (100, -320))
    twist_rad.operation  = "MULTIPLY"
    # convert degrees → radians
    deg2rad = _add(ng, "ShaderNodeMath", (250, -320))
    deg2rad.operation  = "RADIANS"

    rot_inst = _add(ng, "GeometryNodeRotateInstances", (300, 0))

    realise  = _add(ng, "GeometryNodeRealizeInstances", (500, 0))
    set_mat  = _add(ng, "GeometryNodeSetMaterial",      (650, 0))

    # ── Wiring ─────────────────────────────────────────────────────────────────
    def lk(src_node, src_name, dst_node, dst_name):
        links.new(src_node.outputs[src_name], dst_node.inputs[dst_name])

    # Circle vertex count ← Blade Count
    lk(gin,        "Blade Count",     circle,    "Vertices")
    # Circle radius ← Blade Radius
    lk(gin,        "Blade Radius",    circle,    "Radius")
    # Blade scale
    lk(sphere,     "Mesh",            blade_xf,  "Geometry")
    lk(gin,        "Blade Scale",     blade_xf,  "Scale")
    # Instance on points
    lk(circle,     "Mesh",            inst,      "Points")
    lk(blade_xf,   "Geometry",        inst,      "Instance")
    # Per-instance twist: twist_angle = index * (twist_deg / count)
    lk(idx,        "Index",           count_math,"Value")
    lk(gin,        "Blade Count",     count_math,"Value_001")
    lk(count_math, "Value",           twist_rad, "Value")
    lk(gin,        "Blade Twist (°)", twist_rad, "Value_001")
    lk(twist_rad,  "Value",           deg2rad,   "Value")
    lk(inst,       "Instances",       rot_inst,  "Instances")
    lk(deg2rad,    "Value",           rot_inst,  "Rotation")
    # Realise → set material → output
    lk(rot_inst,   "Instances",       realise,   "Geometry")
    lk(realise,    "Geometry",        set_mat,   "Geometry")
    lk(gin,        "Material",        set_mat,   "Material")
    lk(set_mat,    "Geometry",        gout,      "Geometry")


# ── Material ───────────────────────────────────────────────────────────────────

def make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(name="fan_blade_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.08, 0.55, 0.72, 1.0)
        bsdf.inputs["Roughness"].default_value  = 0.30
        bsdf.inputs["Metallic"].default_value   = 0.45
    return mat


# ── Modifier attachment ────────────────────────────────────────────────────────

def attach_modifier(ob: bpy.types.Object,
                    ng: bpy.types.GeometryNodeTree,
                    mat: bpy.types.Material,
                    sockets: dict) -> None:
    """
    Key insight: modifier input values are keyed by socket.identifier,
    NOT socket.name.  Identifiers are auto-assigned ('Socket_1', 'Socket_2'…)
    and stable for the lifetime of the interface item.

    Wrong:  mod["Blade Count"] = 9      # KeyError silently ignored
    Right:  mod[count_sock.identifier] = 9
    """
    mod: bpy.types.NodesModifier = ob.modifiers.new(name="Radial_Fan", type="NODES")
    mod.node_group = ng

    for key, sock in sockets.items():
        if not hasattr(sock, "identifier") or sock.in_out != "INPUT":
            continue
        ident = sock.identifier
        if key == "mat":
            mod[ident] = mat
        elif hasattr(sock, "default_value") and sock.default_value is not None:
            mod[ident] = sock.default_value


# ── Export ─────────────────────────────────────────────────────────────────────

def export(glb_path: str, blend_path: str) -> None:
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_apply=True,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
    )
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    clean_scene()

    ng = bpy.data.node_groups.new(name=GROUP_NAME, type="GeometryNodeTree")
    sockets = build_interface(ng)
    build_nodes(ng)

    # Carrier: a minimal base mesh; GN modifier generates all visible geometry
    bpy.ops.mesh.primitive_plane_add(size=0.001, location=(0, 0, 0))
    carrier = bpy.context.active_object
    carrier.name = "radial_fan"

    mat = make_material()
    attach_modifier(carrier, ng, mat, sockets)

    export(EXPORT_GLB, EXPORT_BLEND)
    print(f"[holoflow] radial_fan exported → {EXPORT_GLB}")

    # Print socket identifier mapping for developer reference
    print("\n[holoflow] Socket identifier map:")
    for item in ng.interface.items_tree:
        if hasattr(item, "identifier"):
            print(f"  {item.in_out:<7} '{item.name}' → identifier='{item.identifier}'")


if __name__ == "__main__":
    main()
