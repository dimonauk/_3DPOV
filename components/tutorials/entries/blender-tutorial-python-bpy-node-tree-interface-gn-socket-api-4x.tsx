import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.0 removed <code>node_group.inputs</code> and{" "}
        <code>node_group.outputs</code> entirely. Any Geometry Nodes Python
        script authored before 4.0 that calls <code>.inputs.new()</code> or{" "}
        <code>.outputs.new()</code> now raises an{" "}
        <code>AttributeError</code> with no fallback. The replacement is{" "}
        <code>node_group.interface</code> — a{" "}
        <code>bpy.types.NodeTreeInterface</code> instance — which gives you
        typed, ranged, defaulted sockets, plus collapsible panels (from 4.2) to
        group related controls in the modifier UI. Understanding the new API is
        foundational if you want to build GN node groups that work reliably
        across the 4.x and 5.x series, as explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-data-node-groups-gn-billboard-scatter"
          className={lk}
        >
          GN node groups from Python tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui"
          className={lk}
        >
          GN socket-groups parametric UI tutorial
        </Link>
        .
      </p>
      <p>
        There is a second trap that the API docs do not emphasise loudly enough:
        modifier input values are keyed by <code>socket.identifier</code>, not
        by <code>socket.name</code>. The identifier is an auto-assigned string
        such as <code>&apos;Socket_3&apos;</code>; writing{" "}
        <code>mod[&quot;Blade Count&quot;] = 9</code> is silently ignored
        rather than raising an error. This tutorial prints the identifier map on
        every run so you always have the correct keys for downstream automation.
        The modifier-attachment pattern shown here complements the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply"
          className={lk}
        >
          modifier stack pre-export apply guide
        </Link>
        . Outside references:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.NodeTreeInterface.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.NodeTreeInterface (CC-BY-SA 4.0)
        </a>
        ;{" "}
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/4.0/Python_API"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender 4.0 Python API release notes (CC-BY-SA 4.0)
        </a>
        ; Nikolai Janakiev&apos;s{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-scripting (MIT)
        </a>{" "}
        and sibling repos at{" "}
        <a
          href="https://github.com/njanakiev"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/njanakiev
        </a>
        ;{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF-Blender-IO (Apache-2.0)
        </a>
        , sibling{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Sample-Assets"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF-Sample-Assets (CC0)
        </a>
        . The completed radial fan is viewable in the{" "}
        <Link href="/atelier" className={lk}>
          Holoflow WebXR Atelier
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Reproduce the 3.x breakage, then clear the scene",
        body: `"""
WHY this step exists:
  Seeing the AttributeError in context makes the migration concrete.
  'GeometryNodeTree' object has no attribute 'inputs' is the exact message
  you will encounter on any pre-4.0 script.  Run this first so it registers,
  then clean up before building the working version.
"""
import bpy

# ── Show the broken 3.x pattern ──────────────────────────────────────────────
ng_old = bpy.data.node_groups.new("OldAPI_Demo", "GeometryNodeTree")
try:
    ng_old.inputs.new("NodeSocketFloat", "Width")   # raises AttributeError
except AttributeError as exc:
    print(f"[broken-3x] {exc}")

# Clean up the throwaway group
bpy.data.node_groups.remove(ng_old)

# ── Reset scene ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for ng in list(bpy.data.node_groups):
    bpy.data.node_groups.remove(ng)

print("[holoflow] scene cleared — ready for new interface API")`,
      },
      {
        title: "Create the node group and author sockets via interface.new_socket()",
        body: `"""
interface.new_socket() parameters:
  name       — display label in the UI and Group Input/Output node
  in_out     — 'INPUT' or 'OUTPUT' (string, not integer enum)
  socket_type — full bl_socket_idname string, e.g. 'NodeSocketFloat'

Common socket types in 5.1:
  NodeSocketGeometry   NodeSocketFloat    NodeSocketInt
  NodeSocketVector     NodeSocketBool     NodeSocketMaterial
  NodeSocketColor      NodeSocketString   NodeSocketRotation

The returned bpy.types.NodeTreeInterfaceSocket exposes:
  .default_value — initial value shown in modifier panel and Group Input
  .min_value / .max_value — clamps the UI slider (FLOAT and INT only)
  .identifier — stable string key for mod[identifier] access (read-only)
  .name — editable display label; does NOT key the modifier dict

Geometry pair: every GN modifier group needs exactly one INPUT and one
OUTPUT socket of type NodeSocketGeometry.  Add them first so Group Input
and Group Output nodes auto-connect to them in the correct order.
"""
import bpy

GROUP_NAME = "Radial_Fan_GN"
ng = bpy.data.node_groups.new(name=GROUP_NAME, type="GeometryNodeTree")
iface = ng.interface   # bpy.types.NodeTreeInterface

# Mandatory geometry sockets
geo_out = iface.new_socket(
    name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry"
)
geo_in = iface.new_socket(
    name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry"
)

# Fan parameter sockets
count_s = iface.new_socket(
    name="Blade Count", in_out="INPUT", socket_type="NodeSocketInt"
)
count_s.default_value = 9
count_s.min_value     = 3
count_s.max_value     = 32

radius_s = iface.new_socket(
    name="Blade Radius", in_out="INPUT", socket_type="NodeSocketFloat"
)
radius_s.default_value = 0.4
radius_s.min_value     = 0.05
radius_s.max_value     = 4.0

scale_s = iface.new_socket(
    name="Blade Scale", in_out="INPUT", socket_type="NodeSocketFloat"
)
scale_s.default_value = 0.18
scale_s.min_value     = 0.01
scale_s.max_value     = 1.0

twist_s = iface.new_socket(
    name="Blade Twist (°)", in_out="INPUT", socket_type="NodeSocketFloat"
)
twist_s.default_value = 20.0
twist_s.min_value     = -90.0
twist_s.max_value     =  90.0

mat_s = iface.new_socket(
    name="Material", in_out="INPUT", socket_type="NodeSocketMaterial"
)

print(f"[holoflow] node group '{GROUP_NAME}' created with {len(list(iface.items_tree))} interface items")`,
      },
      {
        title: "Group sockets into a collapsible panel (Blender 4.2 / 5.x)",
        body: `"""
interface.new_panel(name) adds a bpy.types.NodeTreeInterfacePanel.
Sockets created with parent=panel appear under a collapsible header in
the modifier tab — critical UX for node groups with many parameters.

The panel keyword was added in 4.2.  The try/except lets the same script
run on 4.0/4.1 (flat socket list, full functionality) and 4.2+/5.x (panelled).

Panel identifier vs item identifier:
  Each panel has its own .identifier separate from its member sockets.
  To address the panel in iface.items_tree, match by .item_type == 'PANEL'
  or keep the return value of new_panel() directly — the latter is safer.

Sockets that already exist (geo_in, geo_out) are NOT moved into the panel.
new_panel() only affects sockets created AFTER the call when parent= is given.
To retrofit existing sockets use iface.move_to_parent(sock, panel, index=0).
"""
# ng and iface are from the previous step

panel = None
try:
    panel = iface.new_panel(name="Fan Controls")
    print(f"[holoflow] panel created: '{panel.name}' (identifier={panel.identifier})")
except AttributeError:
    print("[holoflow] Blender < 4.2: new_panel() unavailable, continuing flat")

# Move the fan parameter sockets into the panel
# iface.move_to_parent() moves an existing item into a panel (4.2+ only)
if panel is not None:
    for sock in [count_s, radius_s, scale_s, twist_s, mat_s]:
        try:
            iface.move_to_parent(sock, panel)
        except (AttributeError, TypeError):
            pass   # API variant — some 4.2 builds use different signature

print("[holoflow] interface items:")
for item in iface.items_tree:
    indent = "  " if getattr(item, "parent", None) is not None else ""
    itype  = getattr(item, "item_type", "SOCKET")
    print(f"  {indent}[{itype}] '{item.name}' identifier={item.identifier}")`,
      },
      {
        title: "Build the node graph: circle → instance blades → realise → set material",
        body: `"""
Node graph layout:
  GroupInput ──┬──► MeshCircle.Vertices          ┐
               │    MeshCircle.Radius             │
               │                                  ▼
               ├──► UVSphere ──► Transform.Scale  ──► InstanceOnPoints ──►
               │                                                           │
               └──► Transform.Scale (Blade Scale)                         │
                                                                           ▼
                                              RotateInstances ──► RealizeInstances
                                                    ▲                      │
               GroupInput → Blade Twist (°)         │                      ▼
               + Index + Count → Math chain ────────┘               SetMaterial
                                                                           │
               GroupInput → Material                                       ▼
                                                                     GroupOutput

WHY RotateInstances after InstanceOnPoints?
  InstanceOnPoints.Rotation socket rotates ALL instances by the same angle.
  Per-instance twist (blade_index × twist_per_blade) requires a RotateInstances
  node that samples Index (domain=INSTANCE) inside the instance context.
"""
import math

nodes = ng.nodes
links = ng.links

# Retrieve auto-created I/O nodes
gin  = nodes.get("Group Input")  or nodes.new("NodeGroupInput")
gout = nodes.get("Group Output") or nodes.new("NodeGroupOutput")
gin.location  = (-900, 0)
gout.location = ( 900, 0)

# Point ring — one vertex per blade
circle = nodes.new("GeometryNodeMeshCircle")
circle.location   = (-600, 200)
circle.fill_type  = "NONE"

# Blade prototype — low-poly sphere, will be scaled
sphere = nodes.new("GeometryNodeMeshUVSphere")
sphere.location = (-600, -200)
sphere.inputs["Segments"].default_value = 6
sphere.inputs["Rings"].default_value    = 3

# Scale blade prototype by Blade Scale socket
blade_xf = nodes.new("GeometryNodeTransform")
blade_xf.location = (-350, -200)

# Instance blades on the ring
inst = nodes.new("GeometryNodeInstanceOnPoints")
inst.location = (-50, 0)

# Per-instance twist chain: angle = index × (twist_deg / count)
idx_n      = nodes.new("GeometryNodeInputIndex")
idx_n.location = (-300, -380)

div_n      = nodes.new("ShaderNodeMath")
div_n.operation = "DIVIDE"
div_n.location  = (-100, -380)

mul_n      = nodes.new("ShaderNodeMath")
mul_n.operation = "MULTIPLY"
mul_n.location  = (100, -380)

rad_n      = nodes.new("ShaderNodeMath")
rad_n.operation = "RADIANS"
rad_n.location  = (300, -380)

# Combine XYZ to route the Z rotation angle into RotateInstances.Rotation
comb = nodes.new("ShaderNodeCombineXYZ")
comb.location    = (460, -300)
comb.inputs[0].default_value = 0.0
comb.inputs[1].default_value = 0.0

rot_inst = nodes.new("GeometryNodeRotateInstances")
rot_inst.location = (200, 0)

realise  = nodes.new("GeometryNodeRealizeInstances")
realise.location = (450, 0)

set_mat  = nodes.new("GeometryNodeSetMaterial")
set_mat.location = (650, 0)

# ── Wiring ────────────────────────────────────────────────────────────────────
def lk(a_node, a_name, b_node, b_name):
    try:
        links.new(a_node.outputs[a_name], b_node.inputs[b_name])
    except KeyError as e:
        print(f"[wire-warn] {e}")

lk(gin,     "Blade Count",     circle,   "Vertices")
lk(gin,     "Blade Radius",    circle,   "Radius")
lk(sphere,  "Mesh",            blade_xf, "Geometry")
lk(gin,     "Blade Scale",     blade_xf, "Scale")
lk(circle,  "Mesh",            inst,     "Points")
lk(blade_xf,"Geometry",        inst,     "Instance")
# Twist chain
lk(idx_n,   "Index",           div_n,    "Value")
lk(gin,     "Blade Count",     div_n,    "Value_001")
lk(div_n,   "Value",           mul_n,    "Value")
lk(gin,     "Blade Twist (°)", mul_n,    "Value_001")
lk(mul_n,   "Value",           rad_n,    "Value")
lk(rad_n,   "Value",           comb,     "Z")
lk(inst,    "Instances",       rot_inst, "Instances")
lk(comb,    "Vector",          rot_inst, "Rotation")
lk(rot_inst,"Instances",       realise,  "Geometry")
lk(realise, "Geometry",        set_mat,  "Geometry")
lk(gin,     "Material",        set_mat,  "Material")
lk(set_mat, "Geometry",        gout,     "Geometry")

print(f"[holoflow] node graph wired — {len(links)} links")`,
      },
      {
        title: "Attach the NodesModifier — use socket.identifier, not socket.name",
        body: `"""
CRITICAL: mod[socket.identifier] is the correct key; mod[socket.name] is silently
dropped.  Identifiers are auto-assigned ('Socket_1', 'Socket_2' …) and do NOT
change for the lifetime of a socket.  Print the map on every run.

NodesModifier stores input values in a PropertyGroup whose keys match the
identifier strings from the interface.  The group's UI panel then renders
those values with the labels from .name — that is the only role .name plays
at the modifier level.
"""
import bpy

# Make a material for the fan blades
mat = bpy.data.materials.new("fan_blade")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.08, 0.55, 0.72, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.30
    bsdf.inputs["Metallic"].default_value   = 0.45

# Carrier object: GN modifier creates all visible geometry
bpy.ops.mesh.primitive_plane_add(size=0.001, location=(0, 0, 0))
carrier = bpy.context.active_object
carrier.name = "radial_fan"

mod = carrier.modifiers.new(name="Radial_Fan", type="NODES")
mod.node_group = ng

# Assign values via identifier — this is the only correct method
ident_map = {}
for item in ng.interface.items_tree:
    if hasattr(item, "identifier") and item.in_out == "INPUT":
        ident_map[item.name] = item.identifier

print("[holoflow] Socket identifier map:")
for name, ident in ident_map.items():
    print(f"  '{name}' → '{ident}'")

# Set modifier inputs
mod[ident_map["Blade Count"]]     = 9
mod[ident_map["Blade Radius"]]    = 0.4
mod[ident_map["Blade Scale"]]     = 0.18
mod[ident_map["Blade Twist (°)"]] = 20.0
mod[ident_map["Material"]]        = mat

bpy.context.view_layer.update()
print(f"[holoflow] modifier attached to '{carrier.name}'")`,
      },
      {
        title: "Export GLB with Draco L6 + WebP, save .blend",
        body: `"""
export_apply=True bakes the GN modifier output into a static mesh for GLB.
The node group itself is NOT embedded in the GLB — it is a Blender-internal
authoring aid only.  The GLB consumer (THREE.js / WebXR viewer / Apple AR)
receives a plain geometry, not a live parametric system.

To deliver a parametric object to the web you have two options:
  1. Export multiple GLB variants (one per parameter value combination) and
     switch between them in the WebXR scene — the approach used in
     /tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr
  2. Encode the GN logic as a shader (instancing + vertex displacement) in
     THREE.js, and use the GN group purely as a design-time previewer.

Save the .blend so the live GN group is preserved for future parameter edits.
"""
import bpy

EXPORT_GLB   = "//radial_fan.glb"
EXPORT_BLEND = "//radial_fan.blend"

bpy.ops.export_scene.gltf(
    filepath       = EXPORT_GLB,
    export_format  = "GLB",
    export_apply   = True,
    export_image_format = "WEBP",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_yup     = True,
)
bpy.ops.wm.save_as_mainfile(filepath=EXPORT_BLEND)

print(f"[holoflow] exported → {EXPORT_GLB}")
print(f"[holoflow] saved    → {EXPORT_BLEND}")`,
      },
    ],
  },
  {
    slug: "python-bpy-node-tree-interface-gn-socket-api-4x",
    title:
      "Python bpy.types.NodeTreeInterface — Programmatic GN Socket Authoring: Typed Inputs, Panels & Modifier Keys (Blender 5.1)",
    description:
      "Build a Geometry Node group from Python using the 4.0+/5.1 interface.new_socket() API, add a collapsible panel with new_panel(), and drive the modifier via socket.identifier rather than socket.name.",
    image: null,
    body: <Body />,
    tags: ["blender", "python", "geometry-nodes", "scripting", "webxr"],
  }
);
