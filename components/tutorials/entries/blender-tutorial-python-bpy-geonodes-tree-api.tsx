import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnTreeApiBody() {
  return (
    <>
      <p>
        Every Geometry Nodes graph you build by dragging nodes in the editor
        exists as a <code>bpy.types.GeometryNodeTree</code> data block.
        The canvas is just a window into that data — which means you can build
        the entire graph in Python without touching the editor.  This matters
        when you want to generate trees procedurally, ship reproducible pipeline
        blueprints, or run batch-creation scripts on a headless server.
      </p>
      <p>
        The Blender 4.0 release broke the old <code>tree.inputs.new()</code>{" "}
        pattern and replaced it with <code>tree.interface.new_socket()</code>.
        Each socket receives a stable identifier string that the host modifier
        uses as its dict key — essential for keyframing modifier inputs from
        Python.  This tutorial walks the full API path and produces a spike-ball:
        cone instances scattered over an icosphere, with density, length, and
        radius exposed as modifier-panel sliders.  For the same nodes used
        interactively, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-ground-cover-scatter"
          className={lk}
        >
          Distribute Points scatter tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          Realise Instances tutorial
        </Link>
        .  For broader bpy scripting foundations, the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          bmesh dodecahedron tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D print analysis tutorial
        </Link>{" "}
        cover mesh construction and automated pipeline QA respectively.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-geonodes-tree-api",
  title:
    "Python bpy — Build a Geometry Nodes Tree Programmatically: Spike-Ball Instancer (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Construct a complete Geometry Nodes graph in Python using bpy.data.node_groups, " +
    "nodes.new(), links.new(), and the Blender 4.0+ tree.interface socket API — " +
    "no visual node editor required.  Produces a spike-ball with three modifier-panel controls.",
  Body: GnTreeApiBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-bpy-geonodes-tree-api/",
    time: "one to two hours",
    difficulty: "advanced",
    overview:
      "A Geometry Nodes tree is a bpy.types.GeometryNodeTree data block.  The node " +
      "editor is only a viewer.  This tutorial builds the entire HS_SpikeBall graph " +
      "from scratch in Python: icosphere base mesh, three panel-exposed modifier inputs " +
      "(Density, Spike Length, Spike Radius), a Distribute Points → Instance on Points " +
      "→ Realise → Join Geometry pipeline, and GLB export with the GN modifier baked.  " +
      "A companion record.py keyframes the Density input to animate spike eruption.",
    goal:
      "Write a blueprint.py that creates an icosphere, builds and attaches a GN node-tree " +
      "via the Python API, exposes three modifier-panel parameters, and exports a " +
      "Draco-compressed GLB.  Understand the socket identifier system well enough to " +
      "keyframe any GN modifier input from a Python script.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable with Python basics — functions, f-strings",
      "Used Blender's Scripting workspace and run a bpy script at least once",
      "Understands what a Geometry Nodes modifier does — has used the node editor interactively",
      "Familiar with socket types: Geometry, Float, Vector",
    ],
    steps: [
      {
        title: "Why the node editor is just a view of data-block state",
        body: `A GeometryNodeTree data block has three mutable collections:
  tree.nodes     — NodeCollection: add, remove, iterate nodes
  tree.links     — NodeLinks: add, remove link objects
  tree.interface — (Blender 4.0+) defines modifier-panel sockets

When you drag a node in the editor, Blender calls tree.nodes.new(bl_idname).
When you connect a noodle, it calls tree.links.new(from_socket, to_socket).
Running the same calls from Python produces an identical data-block.

This equivalence means you can:
  — Build trees in files without a display (CI pipelines, headless servers).
  — Generate whole families of trees (one per LOD level, one per material).
  — Write tests that validate wiring without opening the editor.
  — Ship add-ons that install pre-built GN trees on objects at install time.`,
      },
      {
        title: "Creating the node group and its interface (Blender 4.0+ API)",
        body: `tree = bpy.data.node_groups.new(name="HS_SpikeBall", type="GeometryNodeTree")
iface = tree.interface   # NodeTreeInterface

iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

s_dens = iface.new_socket("Density", in_out="INPUT", socket_type="NodeSocketFloat")
s_dens.default_value = 6.0
s_dens.min_value     = 0.5
s_dens.max_value     = 80.0

BREAKING CHANGE from Blender 3.x:
  Old (≤ 3.6):  tree.inputs.new("NodeSocketFloat", "Density")
  New (≥ 4.0):  tree.interface.new_socket(…)  ← use this

The first INPUT socket must be NodeSocketGeometry.  The host modifier feeds
the object's evaluated mesh into it automatically.  If Geometry is not first,
the modifier panel shows an empty unconnected input (confusing).

The socket's .identifier ("Socket_1", "Socket_2", …) is the modifier dict key:
  mod[s_dens.identifier] = 12.0
Never hard-code index numbers — they shift if earlier sockets are added/removed.
Always look up by name via tree.interface.items_tree.`,
      },
      {
        title: "Adding nodes: bl_idname strings and property defaults",
        body: `n_dpt = tree.nodes.new("GeometryNodeDistributePointsOnFaces")
n_dpt.distribute_method = "RANDOM"
n_dpt.location = (-460, 60)

n_cone = tree.nodes.new("GeometryNodeMeshCone")
n_cone.inputs["Vertices"].default_value    = 6
n_cone.inputs["Radius Top"].default_value  = 0.0   # sharp tip
n_cone.location = (-460, -280)

Finding an unknown bl_idname:
  1. Enable Edit → Preferences → Interface → Python Tooltips, hover over
     the node in the editor.
  2. Run: [n.bl_idname for n in tree.nodes] in the Python console after
     adding nodes interactively.
  3. Search Blender source: nodes/geometry/nodes/node_geo_*.cc

Key bl_idnames used in this blueprint:
  NodeGroupInput / NodeGroupOutput
  GeometryNodeDistributePointsOnFaces
  GeometryNodeMeshCone
  GeometryNodeInstanceOnPoints
  GeometryNodeRealizeInstances
  GeometryNodeJoinGeometry`,
      },
      {
        title: "Wiring sockets and the Rotation type change in Blender 5.1",
        body: `lk = tree.links

lk.new(n_gi.outputs["Geometry"],     n_dpt.inputs["Mesh"])
lk.new(n_gi.outputs["Density"],      n_dpt.inputs["Density"])
lk.new(n_gi.outputs["Spike Radius"], n_cone.inputs["Radius Bottom"])
lk.new(n_gi.outputs["Spike Length"], n_cone.inputs["Depth"])
lk.new(n_dpt.outputs["Points"],      n_inst.inputs["Points"])
lk.new(n_dpt.outputs["Rotation"],    n_inst.inputs["Rotation"])  # 5.1 direct
lk.new(n_cone.outputs["Mesh"],       n_inst.inputs["Instance"])
lk.new(n_inst.outputs["Instances"],  n_real.inputs["Geometry"])
lk.new(n_real.outputs["Geometry"],   n_join.inputs["Geometry"])
lk.new(n_gi.outputs["Geometry"],     n_join.inputs["Geometry"])  # multi-input
lk.new(n_join.outputs["Geometry"],   n_go.inputs["Geometry"])

ROTATION SOCKET (Blender 4.1 / 5.1):
Distribute Points now emits a "Rotation" socket (Rotation type) aligned to
the face normal.  Connect it directly to Instance on Points "Rotation".

In Blender 3.x you needed an intermediary:
  n_aev = nd.new("FunctionNodeAlignEulerToVector")
  n_aev.axis = "Z"
  lk.new(n_dpt.outputs["Normal"], n_aev.inputs["Vector"])
  lk.new(n_aev.outputs["Rotation"], n_inst.inputs["Rotation"])

MULTI-INPUT:  GeometryNodeJoinGeometry accepts multiple links into its single
"Geometry" socket.  Call links.new() twice; both streams are merged.`,
      },
      {
        title: "Attaching the tree to a modifier and reading socket identifiers",
        body: `mod = ob.modifiers.new(name="SpikeBall_GN", type="NODES")
mod.node_group = tree

# Look up a socket's identifier by name (never hard-code "Socket_N"):
density_id = next(
    item.identifier
    for item in tree.interface.items_tree
    if item.in_out == "INPUT" and item.name == "Density"
)

# Read / write modifier input by identifier
mod[density_id] = 12.0

# Keyframe a modifier input
mod[density_id] = 2.0
mod.keyframe_insert(f'["{density_id}"]', frame=1)
mod[density_id] = 24.0
mod.keyframe_insert(f'["{density_id}"]', frame=90)

This writes F-Curve data identical to right-clicking the slider in the modifier
panel and choosing "Insert Keyframe" — the same mechanism record.py uses to
animate the Density ramp.`,
      },
      {
        title: "Exporting a GN-modified mesh as GLB",
        body: `bpy.ops.export_scene.gltf(
    filepath            = bpy.path.abspath("//spike_ball.glb"),
    use_selection       = True,
    export_apply        = True,   # bakes GN modifier output on the fly
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)

export_apply=True evaluates the modifier stack and bakes it into the exported
mesh without modifying the .blend file.  Re-exporting after tweaking sliders
gives a fresh GLB with no destructive steps — preferred for pipeline use.

Draco level 6: sub-5 % size regression versus level 10, with acceptable
WebXR decode overhead at 90 fps.  WEBP textures: smaller than PNG at
equivalent quality; supported by all current WebXR runtimes.

To export a specific evaluation frame (e.g. the highest-density state):
  bpy.context.scene.frame_set(90)
  bpy.ops.export_scene.gltf(…)`,
      },
      {
        title: "Debugging a programmatically built tree",
        body: `After running blueprint.py, open the Geometry Node Editor and select
the spike_ball object.  Blender draws the tree you built in Python.

Common issues:

1. No links visible:
   Print [(l.from_node.name, l.to_node.name) for l in tree.links].
   If empty, links.new() silently failed — check that both sockets
   belong to the same tree.

2. "Geometry" input appears in the modifier panel:
   The first INPUT socket must be NodeSocketGeometry AND connected from
   NodeGroupInput inside the tree.  An unconnected geometry socket shows
   as an empty user-settable field.

3. Spikes point inward:
   Icosphere normals are flipped.  In Edit Mode → Mesh → Normals →
   Recalculate Outside (Shift+N), or add bm.normal_update() before
   bm.to_mesh() in the bmesh creation block.

4. Density slider has no effect:
   The link from n_gi.outputs["Density"] to n_dpt.inputs["Density"]
   is missing.  Inspect tree.links as above.`,
      },
    ],
  },
  base
);
