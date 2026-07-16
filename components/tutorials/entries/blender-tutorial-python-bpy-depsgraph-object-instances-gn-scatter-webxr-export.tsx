import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Geometry Nodes scatter, Collection Instancing, and Particle
        Instances all produce geometry that is <em>never</em> added to{" "}
        <code>bpy.data.objects</code>. The Python object array is a
        pre-evaluation snapshot of the scene; after the dependency graph
        runs, hundreds of virtual copies exist only inside the evaluated
        graph. <code>depsgraph.object_instances</code> is the sole
        iterator that exposes every one of them alongside their base
        objects. This tutorial builds a GN point scatter entirely in
        Python, iterates the depsgraph to resolve each virtual copy into
        real geometry, world-transforms it with the correct instance
        matrix, merges everything into a single bmesh, and exports one
        static Draco-compressed GLB for WebXR collision volumes and
        environment decoration.
      </p>

      <h2>depsgraph.object_instances vs bpy.data.objects</h2>
      <p>
        The difference is evaluation time. <code>bpy.data.objects</code>{" "}
        reflects the scene as authored — the objects you see in the
        Outliner before Blender runs any modifier. After a GN{" "}
        <em>Instance on Points</em> node executes, the evaluated graph
        holds hundreds of virtual copies that have no entries anywhere in{" "}
        <code>bpy.data</code>. Iterating <code>bpy.data.objects</code>{" "}
        will return only the ground plane and the prototype icosphere —
        not a single scattered copy. You must request the evaluated graph
        first:
      </p>
      <pre><code>{`bpy.context.view_layer.update()            # force full evaluation
depsgraph = bpy.context.evaluated_depsgraph_get()

for inst in depsgraph.object_instances:
    print(inst.is_instance, inst.object.name, inst.matrix_world.translation)`}</code></pre>
      <p>
        The iterator yields <em>both</em> base objects (
        <code>inst.is_instance == False</code>) and virtual copies (
        <code>inst.is_instance == True</code>). Guard on{" "}
        <code>inst.is_instance</code> before processing.
      </p>
      <p>
        The same gap between authored and evaluated data surfaces in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context temp-override tutorial
        </Link>
        , which explains why operators that run inside a viewport context
        see a different scene state from a headless background script.
      </p>

      <h2>inst.matrix_world — not ob_eval.matrix_world</h2>
      <p>
        This is the single most common mistake when people first use this
        API. <code>evaluated_get(depsgraph)</code> returns the prototype
        object in its <em>rest position</em>.{" "}
        <code>ob_eval.matrix_world</code> is the world matrix of that
        prototype — typically near the origin where you placed it as a
        template. <code>inst.matrix_world</code> is the world matrix of{" "}
        <em>this particular instance</em>: the transform the GN{" "}
        <em>Instance on Points</em> node computed for this copy. Using
        the wrong one collapses every copy to the same position:
      </p>
      <pre><code>{`ob_eval = inst.object.evaluated_get(depsgraph)
me_snap = ob_eval.to_mesh()    # LOCAL-space geometry

bm_inst = bmesh.new()
bm_inst.from_mesh(me_snap)
ob_eval.to_mesh_clear()        # release snapshot immediately

# inst.matrix_world = this copy's world placement ✓
# ob_eval.matrix_world = prototype rest position  ✗
bmesh.ops.transform(
    bm_inst,
    matrix=inst.matrix_world,  # correct
    verts=bm_inst.verts,
)`}</code></pre>
      <p>
        The same transform-composition principle underpins the pose-chain
        work in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-node-tree-interface-gn-socket-api-4x"
          className={lk}
        >
          GN NodeTreeInterface tutorial
        </Link>
        , where socket inputs encode local transforms that the GN
        evaluator composes into world-space instance matrices.
      </p>

      <h2>to_mesh() and to_mesh_clear()</h2>
      <p>
        <code>mesh.copy()</code> creates a persistent entry in{" "}
        <code>bpy.data.meshes</code>. In a loop over 75 instances that
        is 75 orphan data-blocks that survive until the file is reloaded.{" "}
        <code>to_mesh()</code> returns a reference-counted temporary
        snapshot released by <code>to_mesh_clear()</code>. Always call
        them as a pair; never delay the clear:
      </p>
      <pre><code>{`ob_eval = inst.object.evaluated_get(depsgraph)
me_snap = ob_eval.to_mesh()     # ref-counted, LOCAL space
bm_inst = bmesh.new()
bm_inst.from_mesh(me_snap)
ob_eval.to_mesh_clear()         # free — call before the next iteration`}</code></pre>
      <p>
        <code>to_mesh()</code> returns the geometry <em>after</em> all
        modifiers on the prototype have been applied. If your prototype
        has a Subdivision Surface or a Bevel modifier, you will receive
        the subdivided / bevelled geometry automatically — and only in
        the instance copies, not as a persistent data-block.
      </p>

      <h2>Building the GN scatter tree in Python</h2>
      <p>
        The tree wires a <em>Distribute Points on Faces</em> node into an{" "}
        <em>Instance on Points</em> node. The prototype geometry arrives
        via <em>Object Info</em> referencing <code>HF_Prop_Ico</code>.
        Using <code>NodeTreeInterface</code> (the 4.x-and-later API
        covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-node-tree-interface-gn-socket-api-4x"
          className={lk}
        >
          socket authoring tutorial
        </Link>
        ) to declare the group sockets:
      </p>
      <pre><code>{`tree  = bpy.data.node_groups.new("HF_GN_Scatter", "GeometryNodeTree")
iface = tree.interface
iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

nodes = tree.nodes; links = tree.links

n_in   = nodes.new("NodeGroupInput")
n_out  = nodes.new("NodeGroupOutput")
n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
n_dist.distribute_method             = "RANDOM"
n_dist.inputs["Density"].default_value = 3.0   # pts / m²
n_dist.inputs["Seed"].default_value    = 42

n_info = nodes.new("GeometryNodeObjectInfo")
n_info.inputs["Object"].default_value = prop_ob
n_info.transform_space                = "ORIGINAL"  # prop's local axes

n_inst = nodes.new("GeometryNodeInstanceOnPoints")

links.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
links.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
links.new(n_info.outputs["Geometry"],  n_inst.inputs["Instance"])
links.new(n_inst.outputs["Instances"], n_out.inputs["Geometry"])`}</code></pre>
      <p>
        Setting <code>transform_space = "ORIGINAL"</code> on{" "}
        <code>GeometryNodeObjectInfo</code> means each instance inherits
        the prototype&rsquo;s local axes rather than the world axes. Set
        it to <code>"RELATIVE"</code> if the prototype has a deliberate
        world-space rotation you want every copy to inherit.
      </p>

      <h2>Resolving and merging all instances</h2>
      <p>
        The accumulator pattern: one bmesh collects every transformed
        copy. Routing through a temporary mesh between instances avoids
        index-offset corruption that occurs when you call{" "}
        <code>bm_acc.from_mesh()</code> on a non-empty bmesh directly
        against a mesh whose index space was authored separately:
      </p>
      <pre><code>{`bm_acc = bmesh.new()

for inst in depsgraph.object_instances:
    if not inst.is_instance:
        continue
    if inst.object.type != "MESH":
        continue

    ob_eval = inst.object.evaluated_get(depsgraph)
    me_snap = ob_eval.to_mesh()

    bm_inst = bmesh.new()
    bm_inst.from_mesh(me_snap)
    ob_eval.to_mesh_clear()                    # free snapshot

    bmesh.ops.transform(
        bm_inst, matrix=inst.matrix_world, verts=bm_inst.verts
    )

    me_tmp = bpy.data.meshes.new("_hf_tmp")   # route via temp mesh
    bm_inst.to_mesh(me_tmp)
    bm_inst.free()
    bm_acc.from_mesh(me_tmp)
    bpy.data.meshes.remove(me_tmp)             # prevent orphan accumulation

# Bake to a persistent mesh object
me = bpy.data.meshes.new("hf_scatter_merged")
bm_acc.to_mesh(me)
bm_acc.free()`}</code></pre>
      <p>
        The bmesh accumulation pattern mirrors the one used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          bmesh limited_dissolve &amp; poke tutorial
        </Link>
        , which builds faceted geometry by merging per-face bmesh
        operations. The same temporary-mesh routing applies there.
      </p>

      <h2>Exporting the merged static GLB</h2>
      <pre><code>{`# Deselect all before use_selection export — stale selections contaminate.
for o in bpy.data.objects: o.select_set(False)
merged_ob.select_set(True)
bpy.context.view_layer.objects.active = merged_ob

bpy.ops.export_scene.gltf(
    filepath                             = "//hf_scatter_resolved.glb",
    export_format                        = "GLB",
    export_yup                           = True,    # +Y up for WebXR
    export_apply                         = True,    # bake world transform
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
    use_selection                        = True,
)`}</code></pre>
      <p>
        The exported GLB contains one mesh object, no armature, no
        lights, no cameras. Three.js and Babylon.js load it as a static{" "}
        <code>Mesh</code> directly. For dynamic scatter (wind, physics)
        consider the Vertex Animation Texture pipeline covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cloth-modifier-sim-bake-vertex-animation-texture-webxr"
          className={lk}
        >
          cloth VAT tutorial
        </Link>{" "}
        — the same GLB serves as the rest-pose mesh, and the VAT encodes
        per-frame offsets in a data texture.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Zero instances returned</strong>&thinsp;—&thinsp;
          <code>view_layer.update()</code> was not called before{" "}
          <code>evaluated_depsgraph_get()</code>, so the GN modifier has
          not yet run. Always update before querying.
        </li>
        <li>
          <strong>All copies appear at the same position</strong>
          &thinsp;—&thinsp;you used <code>ob_eval.matrix_world</code>{" "}
          instead of <code>inst.matrix_world</code>. The prototype's
          rest matrix is the same for every iteration.
        </li>
        <li>
          <strong>Memory grows with each run</strong>&thinsp;—&thinsp;
          <code>to_mesh_clear()</code> is missing or called after the
          loop. Call it immediately after <code>bm_inst.from_mesh()</code>.
        </li>
        <li>
          <strong>Merged mesh has broken topology</strong>&thinsp;—&thinsp;
          <code>bm_acc.from_mesh()</code> was called directly on the
          evaluated snapshot without the temporary-mesh routing step.
          Always bounce through a <code>bpy.data.meshes.new()</code>{" "}
          intermediary.
        </li>
        <li>
          <strong>GN instances not in depsgraph</strong>&thinsp;—&thinsp;
          the GN tree outputs <em>Geometry</em> (mesh) rather than{" "}
          <em>Instances</em>. Ensure the final node before Group Output
          is <em>Instance on Points</em>, not <em>Realize Instances</em>.
          Realize Instances collapses virtual copies into real geometry
          on the host object; they no longer appear as separate entries
          in <code>object_instances</code>.
        </li>
        <li>
          <strong>Frame-dependent scatter changes between runs</strong>
          &thinsp;—&thinsp;call <code>bpy.context.scene.frame_set(f)</code>{" "}
          before <code>view_layer.update()</code> to pin the GN
          evaluation to a specific frame.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        Blender Python API &mdash; bpy.types.Depsgraph: Blender Foundation
        (CC-BY-SA-4.0,{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Depsgraph.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.Depsgraph
        </a>
        ), Blender Foundation contributors. Related Blender Foundation
        projects: blender-git, blender-addons, Blender Studio open
        movies (CC-BY).
      </p>
      <p>
        blender-python-examples by Nikolai Janakiev (MIT,{" "}
        <a
          href="https://github.com/njanakiev/blender-python-examples"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/njanakiev/blender-python-examples
        </a>
        ) — a collection of practical bpy scripting patterns covering
        scene traversal and depsgraph queries. Related projects in the
        same GitHub organisation: scalable-machine-learning,
        openstreetmap-samples — both MIT.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one session",
    difficulty: "advanced",
    cost: "free",
    supplies: {
      tools: [
        { name: "Blender 5.1", url: "https://www.blender.org/download/" },
      ],
    },
    code: [
      {
        filename: "blueprint.py",
        language: "python",
        content: `import bpy, bmesh

SCATTER_HOST    = "HF_Ground"
PROP_NAME       = "HF_Prop_Ico"
COLLECTION_NAME = "HF_DepsgraphDemo"
GN_TREE_NAME    = "HF_GN_Scatter"
MERGED_NAME     = "hf_scatter_merged"
OUTPUT_GLB      = "//hf_scatter_resolved.glb"
SCATTER_DENSITY = 3.0
SCATTER_SEED    = 42
GROUND_SIZE     = 5.0
PROP_RADIUS     = 0.12
DRACO_LEVEL     = 6

def _reset_scene():
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):  bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups): bpy.data.node_groups.remove(ng)

def _collection():
    col = bpy.data.collections.new(COLLECTION_NAME)
    bpy.context.scene.collection.children.link(col)
    return col

def _add_to(ob, col):
    col.objects.link(ob)
    sc = bpy.context.scene.collection
    if ob.name in sc.objects: sc.objects.unlink(ob)

def _create_ground(col):
    bpy.ops.mesh.primitive_plane_add(size=GROUND_SIZE, location=(0,0,0))
    ob = bpy.context.active_object; ob.name = SCATTER_HOST
    _add_to(ob, col); return ob

def _create_prop(col):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=PROP_RADIUS, location=(999,0,0))
    ob = bpy.context.active_object; ob.name = PROP_NAME
    ob.hide_render = ob.hide_viewport = True
    _add_to(ob, col); return ob

def _build_gn_tree(prop_ob):
    tree  = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
    iface = tree.interface
    iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nodes = tree.nodes; links = tree.links
    n_in  = nodes.new("NodeGroupInput")
    n_out = nodes.new("NodeGroupOutput")
    n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method             = "RANDOM"
    n_dist.inputs["Density"].default_value = SCATTER_DENSITY
    n_dist.inputs["Seed"].default_value    = SCATTER_SEED
    n_info = nodes.new("GeometryNodeObjectInfo")
    n_info.inputs["Object"].default_value = prop_ob
    n_info.transform_space                = "ORIGINAL"
    n_inst = nodes.new("GeometryNodeInstanceOnPoints")
    links.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    links.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
    links.new(n_info.outputs["Geometry"],  n_inst.inputs["Instance"])
    links.new(n_inst.outputs["Instances"], n_out.inputs["Geometry"])
    return tree

def _resolve_instances(depsgraph):
    bm_acc = bmesh.new(); count = 0
    for inst in depsgraph.object_instances:
        if not inst.is_instance or inst.object.type != "MESH":
            continue
        ob_eval = inst.object.evaluated_get(depsgraph)
        me_snap = ob_eval.to_mesh()
        bm_inst = bmesh.new(); bm_inst.from_mesh(me_snap)
        ob_eval.to_mesh_clear()
        bmesh.ops.transform(bm_inst, matrix=inst.matrix_world, verts=bm_inst.verts)
        me_tmp = bpy.data.meshes.new("_hf_tmp")
        bm_inst.to_mesh(me_tmp); bm_inst.free()
        bm_acc.from_mesh(me_tmp)
        bpy.data.meshes.remove(me_tmp); count += 1
    print(f"[resolve] merged {count} instances"); return bm_acc

def main():
    _reset_scene()
    col  = _collection()
    prop = _create_prop(col)
    host = _create_ground(col)
    tree = _build_gn_tree(prop)
    mod  = host.modifiers.new("HF_Scatter", "NODES"); mod.node_group = tree
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bm = _resolve_instances(depsgraph)
    me = bpy.data.meshes.new(MERGED_NAME); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(MERGED_NAME, me); col.objects.link(ob)
    bpy.ops.wm.save_as_mainfile(filepath="//hf_depsgraph_scatter.blend")
    for o in bpy.data.objects: o.select_set(False)
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB, export_format="GLB", export_yup=True,
        export_apply=True, export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_image_format="WEBP", use_selection=True,
    )

main()`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export",
    title:
      "Python bpy.types.Depsgraph.object_instances — GN Scatter Instance Resolution & Merged Static GLB for WebXR (Blender 5.1)",
    blurb:
      "Iterate the evaluated dependency graph to resolve Geometry Nodes scatter instances into real geometry, merge with correct world transforms, and export a single Draco-compressed static GLB.",
    body: Body,
    topic: "blender",
    tags: ["blender", "python", "depsgraph", "geometry-nodes", "webxr", "glb"],
    date: "2026-07-16",
  }
);

export const blenderTutorialPythonBpyDepsgraphObjectInstancesGnScatterWebxrExportEntry: Entry =
  entry;
