"""
Holoflow Studio — Blender 5.1 Blueprint
Python bpy: Geometry Node Tree from Python
  – bpy.data.node_groups, socket linking, Index Switch node,
    multi-variant poi head (sphere / drum / spike), WebXR GLB export

Run in the Blender Scripting workspace. Requires Blender 4.1+ (Index Switch node).
Tested on Blender 5.1.

WHY build GN trees from Python?
  – Reproducible: the same script on any machine produces identical topology.
  – Parameterised: change a constant, re-run — no clicking through node menus.
  – Composable: wrap in a function, import in other scripts, drive from an asset pipeline.
  – Diff-able: .blend node trees are binary; Python is text, reviewable in git.

INTERFACE API CHANGE (Blender 4.0)
  Old (≤3.6):  ng.inputs.new('NodeSocketGeometry', 'Geometry')
  New (≥4.0):  ng.interface.new_socket(name='Geometry',
                                        in_out='OUTPUT',
                                        socket_type='NodeSocketGeometry')
  The old API is removed in 4.0 and will error.

INDEX SWITCH NODE (Blender 4.1+)
  GeometryNodeIndexSwitch selects one of N sockets by integer index.
  You must set .data_type BEFORE adding items or linking — changing it
  after creation resets all sockets and severs links.
  socket layout:  inputs[0] = 'Index'
                  inputs[1] = item 0   (socket named '0')
                  inputs[2] = item 1   (socket named '1')
                  … each index_switch_items.new() appends one more
                  outputs[0] = 'Output'

MODIFIER PROPERTY ACCESS (Blender 4.0)
  After ng.interface.new_socket() the socket gets an auto-generated
  identifier like 'Socket_2'. Iterate ng.interface.items_tree to find
  it by name. Set it on the modifier object via mod[identifier] = value.
"""

import bpy
import math

# ── constants ────────────────────────────────────────────────────────────────
GROUP_NAME   = 'HF_PoiHead_v1'   # node group (reused if already exists)
OBJECT_NAME  = 'HF_PoiHead'
EXPORT_PATH  = '//hf_poi_head.glb'

# poi-head geometry sizes (metres — poi props ~0.045 m radius is standard)
SPHERE_SEGS_U   = 16
SPHERE_SEGS_V   = 8
SPHERE_RADIUS   = 0.045

DRUM_VERTICES   = 16
DRUM_RADIUS     = 0.042
DRUM_DEPTH      = 0.060

SPIKE_VERTICES  = 12
SPIKE_RADIUS_TOP    = 0.002   # near-tip radius
SPIKE_RADIUS_BOTTOM = 0.040
SPIKE_DEPTH     = 0.080

INITIAL_VARIANT = 0   # 0=sphere, 1=drum, 2=spike


# ── helpers ──────────────────────────────────────────────────────────────────
def _clear_existing_group():
    """Remove stale node group so re-running the script starts clean."""
    if GROUP_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GROUP_NAME])


def _place(node, x, y):
    """Set node position in the node editor canvas."""
    node.location = (x, y)
    return node


# ── build the Geometry Node group ────────────────────────────────────────────
def build_gn_group() -> bpy.types.GeometryNodeTree:
    """
    Construct the HF_PoiHead node group entirely in Python.

    Graph structure:

      [GroupInput: Variant int]
              │
              ▼
      [IndexSwitch GEOMETRY]──item0──[UVSphere  ]
                             ──item1──[Cylinder  ]
                             ──item2──[Cone/Spike]
              │
              ▼
      [GroupOutput: Geometry]
    """
    _clear_existing_group()
    ng = bpy.data.node_groups.new(name=GROUP_NAME, type='GeometryNodeTree')

    # ── interface ────────────────────────────────────────────────────────────
    # Must use ng.interface.new_socket() in Blender 4.0+.
    # socket_type strings live in bpy.types.NodeSocket subclass names.
    itf = ng.interface
    itf.new_socket(name='Variant',  in_out='INPUT',  socket_type='NodeSocketInt')
    itf.new_socket(name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    # ── Group Input / Output ──────────────────────────────────────────────────
    gi = _place(ng.nodes.new('NodeGroupInput'),  -600, 0)
    go = _place(ng.nodes.new('NodeGroupOutput'),  500, 0)

    # ── primitive mesh nodes ──────────────────────────────────────────────────
    sphere = _place(ng.nodes.new('GeometryNodeMeshUVSphere'), -200, 220)
    sphere.inputs['Segments'].default_value = SPHERE_SEGS_U
    sphere.inputs['Rings'].default_value    = SPHERE_SEGS_V
    sphere.inputs['Radius'].default_value   = SPHERE_RADIUS

    drum = _place(ng.nodes.new('GeometryNodeMeshCylinder'), -200, 0)
    drum.inputs['Vertices'].default_value = DRUM_VERTICES
    drum.inputs['Radius'].default_value   = DRUM_RADIUS
    drum.inputs['Depth'].default_value    = DRUM_DEPTH

    spike = _place(ng.nodes.new('GeometryNodeMeshCone'), -200, -220)
    spike.inputs['Vertices'].default_value       = SPIKE_VERTICES
    spike.inputs['Radius Top'].default_value     = SPIKE_RADIUS_TOP
    spike.inputs['Radius Bottom'].default_value  = SPIKE_RADIUS_BOTTOM
    spike.inputs['Depth'].default_value          = SPIKE_DEPTH

    # ── Index Switch ─────────────────────────────────────────────────────────
    # data_type MUST be set before adding items — changing it after severs links.
    sw = _place(ng.nodes.new('GeometryNodeIndexSwitch'), 150, 0)
    sw.data_type = 'GEOMETRY'   # socket type for all item sockets

    # Default node ships with 2 items (sockets '0' and '1').
    # Add one more for our third shape.
    sw.index_switch_items.new()   # now: items '0', '1', '2'

    # ── socket links ─────────────────────────────────────────────────────────
    # ng.links.new(from_socket, to_socket)
    # Index Switch inputs:  [0]=Index [1]=item0 [2]=item1 [3]=item2
    # Index Switch outputs: [0]=Output
    lk = ng.links.new

    # Variant integer → Switch index
    lk(gi.outputs[0],          sw.inputs[0])

    # Each mesh → one Switch item
    lk(sphere.outputs['Mesh'], sw.inputs[1])   # item 0 — sphere
    lk(drum.outputs['Mesh'],   sw.inputs[2])   # item 1 — drum
    lk(spike.outputs['Mesh'],  sw.inputs[3])   # item 2 — spike

    # Switch output → group geometry out
    lk(sw.outputs[0],          go.inputs[0])

    return ng


# ── apply modifier to a mesh object ──────────────────────────────────────────
def apply_modifier(ng: bpy.types.GeometryNodeTree) -> bpy.types.Object:
    """
    Create (or reuse) a mesh object and attach the GN modifier.

    Modifier property access in Blender 4.0+:
      The socket identifier (e.g. 'Socket_2') is auto-assigned by Blender.
      Look it up via ng.interface.items_tree — iterating by .name is stable.
    """
    if OBJECT_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[OBJECT_NAME], do_unlink=True)

    me = bpy.data.meshes.new(OBJECT_NAME + '_base')
    ob = bpy.data.objects.new(OBJECT_NAME, me)
    bpy.context.collection.objects.link(ob)

    # Attach GN modifier
    mod = ob.modifiers.new(name='PoiHeadGN', type='NODES')
    mod.node_group = ng

    # Set initial variant via socket identifier (Blender 4.0+ pattern)
    variant_id = _find_socket_id(ng, 'Variant')
    if variant_id:
        mod[variant_id] = INITIAL_VARIANT

    return ob


def _find_socket_id(ng: bpy.types.GeometryNodeTree, name: str) -> str | None:
    """
    Return the auto-generated identifier for a named interface socket.
    Identifiers look like 'Socket_2' and are stable within a session but
    change if you remove and re-add the socket, so always look them up.
    """
    for item in ng.interface.items_tree:
        if getattr(item, 'name', None) == name and item.item_type == 'SOCKET':
            return item.identifier
    return None


# ── emission material ─────────────────────────────────────────────────────────
def make_emission_material(name: str, colour: tuple[float, float, float],
                           strength: float = 3.0) -> bpy.types.Material:
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (300, 0)
    emit  = nt.nodes.new('ShaderNodeEmission');       emit.location = (0, 0)
    emit.inputs['Color'].default_value    = (*colour, 1.0)
    emit.inputs['Strength'].default_value = strength
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb(ob: bpy.types.Object, path: str) -> None:
    """
    Apply the current Variant modifier state before export.
    Draco compression L6, WebP textures, +Y-up (studio convention).
    """
    # Select only the poi head
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    bpy.ops.export_scene.gltf(
        filepath        = bpy.path.abspath(path),
        use_selection   = True,
        export_apply    = True,          # apply modifiers → bakes current variant
        export_yup      = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )


# ── main ─────────────────────────────────────────────────────────────────────
def main():
    ng = build_gn_group()
    ob = apply_modifier(ng)

    # Emission material — gold for WebXR visibility
    mat = make_emission_material('HF_PoiHead_Gold', (0.95, 0.73, 0.08), strength=3.0)
    if ob.data.materials:
        ob.data.materials[0] = mat
    else:
        ob.data.materials.append(mat)

    # Place object at origin, +Y up (studio convention)
    ob.location = (0, 0, 0)

    # Camera rig for inspection
    _build_camera_rig(ob)

    # Export variant 0 (sphere) as GLB
    ng_ref = bpy.data.node_groups[GROUP_NAME]
    variant_id = _find_socket_id(ng_ref, 'Variant')
    if variant_id:
        ob.modifiers['PoiHeadGN'][variant_id] = 0
    export_glb(ob, EXPORT_PATH)

    print(f"[HF] poi head object '{ob.name}' created, GLB exported to {EXPORT_PATH}")
    print(f"[HF] To switch variants, set mod['{variant_id}'] to 0/1/2 and re-export.")


def _build_camera_rig(target_ob: bpy.types.Object) -> None:
    """Orbit camera + Track-To constraint for 45° inspection angle."""
    # Camera
    cam_data = bpy.data.cameras.new('HF_Cam')
    cam_ob   = bpy.data.objects.new('HF_Cam', cam_data)
    bpy.context.collection.objects.link(cam_ob)
    r = 0.25
    angle = math.radians(45)
    cam_ob.location = (r * math.cos(angle), -r * math.sin(angle), r * 0.7)
    c = cam_ob.constraints.new('TRACK_TO')
    c.target = target_ob
    c.track_axis   = 'TRACK_NEGATIVE_Z'
    c.up_axis      = 'UP_Y'
    bpy.context.scene.camera = cam_ob

    # Sun light
    sun_data = bpy.data.lights.new('HF_Sun', type='SUN')
    sun_data.energy = 5.0
    sun_ob = bpy.data.objects.new('HF_Sun', sun_data)
    bpy.context.collection.objects.link(sun_ob)
    sun_ob.rotation_euler = (math.radians(45), 0, math.radians(45))


if __name__ == '__main__':
    main()
