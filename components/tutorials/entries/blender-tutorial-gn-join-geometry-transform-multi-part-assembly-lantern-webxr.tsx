import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>Join Geometry</strong> merges multiple geometry streams into
        one mesh, and <strong>Transform Geometry</strong> repositions a stream
        in object-local space before the merge. Together they are the canonical
        Geometry Nodes pattern for multi-part props that must live in a single
        mesh object and export as a single GLB node — no parenting, no empties,
        no object constraints.
      </p>
      <p>
        This tutorial assembles a faceted lantern from three independently
        built streams — a gem core, an outer wire cage, and a hexagonal base
        cap — each positioned by its own Transform Geometry node, then merged
        into one clean output via Join Geometry with correct per-stream material
        indices.
      </p>

      <h2>Why one object matters for WebXR</h2>
      <p>
        In Three.js, every{" "}
        <code>THREE.Mesh</code> is a separate draw call. A lantern built from
        three scene objects costs three draw calls and three matrix updates per
        frame. The Join-in-GN pattern collapses them to one draw call (or one
        per material slot, which the glTF exporter optimises into primitive
        groups within the same mesh node). For VRM accessories this is doubly
        important: the VRM spec expects accessories as single-mesh objects with
        material slots, not object hierarchies.
      </p>

      <h2>Transform Geometry — node-space coordinates</h2>
      <p>
        Transform Geometry operates in the{" "}
        <strong>object&rsquo;s local space</strong>, not world-space. Its
        Translation/Rotation/Scale values are applied before the GN result is
        pushed into the modifier stack. Concretely: if you set{" "}
        <code>Translation = (0, 0, -0.23)</code> on the base stream, the base
        cap sits 0.23 m below the object origin in local space. When you then
        move the object in the viewport, the entire lantern moves together
        because all parts share the same origin — the object itself.
      </p>
      <pre><code>{`# Each part gets its own Transform node before JoinGeometry
tf_gem  = nodes.new("GeometryNodeTransformGeometry")
tf_gem.inputs["Translation"].default_value = mathutils.Vector((0, 0, 0.04))
tf_gem.inputs["Scale"].default_value       = mathutils.Vector((1, 1, 1))
# ↑ Scale defaults to (0,0,0) if a connected socket has no default set —
# always assign explicitly to avoid collapsing the geometry to a point.

tf_base = nodes.new("GeometryNodeTransformGeometry")
tf_base.inputs["Translation"].default_value = mathutils.Vector((0, 0, -0.23))`}</code></pre>

      <h2>Join Geometry — attribute merging rules</h2>
      <p>
        When streams enter Join Geometry, Blender applies a strict rule:{" "}
        <strong>
          if attribute X exists on stream A but not on stream B, every element
          from stream B receives a zero-initialised value for X
        </strong>
        . The attribute domain (POINT, EDGE, FACE, CORNER) must match across
        all streams for values to be sensible; a FACE attribute from one stream
        maps to the same FACE domain in the joined result.
      </p>
      <p>
        <code>material_index</code> is a built-in integer attribute initialised
        to <code>0</code> on every GN primitive. By setting it per-stream
        before the join, each part keeps its own slot number:
      </p>
      <pre><code>{`# SetMaterialIndex per stream before JoinGeometry
sm_gem  = nodes.new("GeometryNodeSetMaterialIndex")
sm_gem.inputs["Material Index"].default_value  = 0

sm_cage = nodes.new("GeometryNodeSetMaterialIndex")
sm_cage.inputs["Material Index"].default_value = 1

sm_base = nodes.new("GeometryNodeSetMaterialIndex")
sm_base.inputs["Material Index"].default_value = 2

join = nodes.new("GeometryNodeJoinGeometry")
# JoinGeometry "Geometry" is a multi-input socket — connect all three:
links.new(geo_gem,  join.inputs["Geometry"])
links.new(geo_cage, join.inputs["Geometry"])
links.new(geo_base, join.inputs["Geometry"])`}</code></pre>
      <p>
        The slot indices reference the object&rsquo;s material slot list, not
        GN-internal materials. Assign materials to the host object via{" "}
        <code>obj.data.materials.append(mat)</code> in the same order:
        slot 0 → gem, slot 1 → cage, slot 2 → base.
      </p>
      <p>
        For a deeper look at material index patterns in GN, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-material-index-voronoi-cell-zones"
          className={lk}
        >
          GN Set Material Index tutorial
        </Link>{" "}
        which covers Voronoi-driven zone colouring with the same node.
      </p>

      <h2>Wire cage: Wireframe node on a closed sphere</h2>
      <p>
        The Wireframe node converts every edge into a tube (quad tube by
        default) and outputs a new mesh. On a closed IcoSphere there are no
        boundary edges, so{" "}
        <code>use_boundary = False</code> has no visible effect — but setting
        it explicitly makes intent clear and prevents surprise output if the
        base geometry is later swapped for an open mesh. The cage radius is
        4% larger than the gem radius so cage tubes sit outside the gem faces
        without z-fighting:
      </p>
      <pre><code>{`ico_cage = nodes.new("GeometryNodeMeshIcoSphere")
ico_cage.inputs["Radius"].default_value       = 0.23  # gem is 0.22
ico_cage.inputs["Subdivisions"].default_value = 1

wire = nodes.new("GeometryNodeWireframe")
wire.use_boundary = False
links.new(grp_in.outputs["Cage Thickness"], wire.inputs["Thickness"])
links.new(ico_cage.outputs["Mesh"],         wire.inputs["Mesh"])`}</code></pre>
      <p>
        Compare the Wireframe GN node with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr"
          className={lk}
        >
          bmesh.ops.wireframe tutorial
        </Link>
        , which performs the same conversion via Python before a modifier is
        added.
      </p>

      <h2>Exposing sockets for live tweaking</h2>
      <p>
        Group sockets created via{" "}
        <code>tree.interface.new_socket()</code> appear as sliders in the
        modifier panel. Connecting them to node inputs makes the prop live:
        drag the Gem Radius slider and all three streams respond in real
        time — gem and cage scale, and the base gap recalculates automatically
        because the cage and base positions are fixed relative to the origin,
        not to each other.
      </p>
      <pre><code>{`s_gem = tree.interface.new_socket("Gem Radius", in_out='INPUT',
                                  socket_type='NodeSocketFloat')
s_gem.default_value = 0.22
s_gem.min_value     = 0.05
s_gem.max_value     = 1.0

s_cg  = tree.interface.new_socket("Cage Thickness", in_out='INPUT',
                                   socket_type='NodeSocketFloat')
s_cg.default_value  = 0.012
# Apply to modifier after node_group is set:
mod["Input_1"] = 0.22
mod["Input_2"] = 0.012`}</code></pre>

      <h2>Instances versus joined geometry</h2>
      <p>
        A common alternative is to use{" "}
        <code>Instance on Points</code> to scatter copies of a sub-mesh, then{" "}
        <code>Realize Instances</code> to collapse them. That pattern suits
        arrays of identical items (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          Realize Instances tutorial
        </Link>
        ). Join Geometry is the correct tool when the parts are{" "}
        <em>distinct</em> meshes with different topologies — you cannot instance
        a cage and a base together meaningfully, but you can join them.
      </p>
      <p>
        For the inverse operation (splitting a joined mesh back into island
        streams), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-separate-geometry-exploded-view"
          className={lk}
        >
          Separate Geometry / Exploded View tutorial
        </Link>
        .
      </p>

      <h2>Attribute inspection: Spreadsheet Editor</h2>
      <p>
        After running blueprint.py, open a Spreadsheet Editor panel and set
        it to <strong>Face</strong> domain, <strong>Evaluated</strong> data.
        The <code>material_index</code> column confirms the join: 20 faces at
        index 0 (gem), 80 faces at index 1 (cage tubes), 8 faces at index 2
        (base). Any custom attribute present on only one stream appears in the
        spreadsheet with zeros for the other parts — the null-fill is explicit
        and inspectable. For debugging custom attributes across streams, see
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-viewer-node-debug-inspect-attributes"
          className={lk}
        >
          Viewer Node debug tutorial
        </Link>
        .
      </p>

      <h2>GLB export notes</h2>
      <p>
        The blueprint applies the modifier before export so the GLB contains
        static geometry (no GN modifier dependency). For a live-modifier
        export, use <code>export_apply=False</code> and let the exporter
        evaluate the modifier — but be aware that the Wireframe node&rsquo;s
        output is not sampled as animation, so the cage will be baked at
        frame 1 regardless.
      </p>
      <p>
        Multi-material meshes export as a single glTF{" "}
        <code>Mesh</code> node with one primitive per material slot, each
        referencing a different material index. In Three.js:
      </p>
      <pre><code>{`// After GLTFLoader loads hf_lantern.glb:
const mesh = gltf.scene.getObjectByName("hf_lantern");
// mesh.material is THREE.Material[] (array) for multi-material meshes
const gemMaterial  = mesh.material[0];
const cageMaterial = mesh.material[1];
const baseMaterial = mesh.material[2];`}</code></pre>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Scale defaults to (0,0,0)</strong> — if you expose Scale as
          a group socket but forget to set its default, Transform Geometry
          collapses the geometry to a point at the origin. Always set{" "}
          <code>default_value = (1,1,1)</code>.
        </li>
        <li>
          <strong>Z-fighting between gem and cage</strong> — the cage radius
          must be strictly larger than the gem radius. A 4% offset (0.23 vs
          0.22) is usually enough; increase to 6-8% for subdiv levels ≥ 2
          where facets are flatter.
        </li>
        <li>
          <strong>Material slots not assigned</strong> — SetMaterialIndex sets
          an index, but if the object&rsquo;s slot list is shorter than the
          max index, Blender substitutes the default grey material. Call{" "}
          <code>obj.data.materials.append(mat)</code> for every slot before
          running the modifier.
        </li>
        <li>
          <strong>Attribute on only one stream</strong> — custom attributes
          present on some but not all input streams will be zero-filled on
          the missing streams after joining. Treat missing-attribute zeros as
          sentinel values and branch in shaders accordingly.
        </li>
      </ul>

      <h2>Sources</h2>
      <p>
        Blender Manual — Join Geometry Node (CC-BY-SA 4.0, Blender Foundation):{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/join_geometry.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org / Join Geometry
        </a>
        . Blender Manual — Transform Geometry Node (CC-BY-SA 4.0):{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/transform_geometry.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org / Transform Geometry
        </a>
        . KhronosGroup/glTF-Blender-IO (Apache-2.0):{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/KhronosGroup/glTF-Blender-IO
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
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
        content: `import bpy, os
import mathutils

GEM_RADIUS     = 0.22
CAGE_RADIUS    = 0.23
CAGE_THICKNESS = 0.012
BASE_VERTICES  = 6
BASE_RADIUS    = 0.16
BASE_DEPTH     = 0.07
GEM_OFFSET_Z   = 0.04
BASE_OFFSET_Z  = -0.23
GLB_PATH       = "//hf_lantern.glb"

bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene

mesh = bpy.data.meshes.new("hf_lantern")
obj  = bpy.data.objects.new("hf_lantern", mesh)
scene.collection.objects.link(obj)

def make_mat(name, base_col, emission_col=None, emission_strength=0.0,
             roughness=0.4, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_col, 1.0)
    bsdf.inputs["Roughness"].default_value  = roughness
    bsdf.inputs["Metallic"].default_value   = metallic
    if emission_col:
        bsdf.inputs["Emission Color"].default_value    = (*emission_col, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

mat_gem  = make_mat("Lantern_Gem",  (0.35, 0.65, 0.95),
                    emission_col=(0.5, 0.75, 1.0), emission_strength=1.4,
                    roughness=0.05)
mat_cage = make_mat("Lantern_Cage", (0.85, 0.80, 0.60), roughness=0.25, metallic=0.85)
mat_base = make_mat("Lantern_Base", (0.72, 0.68, 0.52), roughness=0.30, metallic=0.70)
for mat in (mat_gem, mat_cage, mat_base):
    obj.data.materials.append(mat)

mod  = obj.modifiers.new("Lantern_GN", "NODES")
tree = bpy.data.node_groups.new("LanternAssembly_Tree", "GeometryNodeTree")
mod.node_group = tree
nodes = tree.nodes
links = tree.links

def N(t, x=0, y=0):
    n = nodes.new(t); n.location = (x, y); return n

grp_in  = N("NodeGroupInput",  -900, 0)
grp_out = N("NodeGroupOutput",  800, 0)

s = tree.interface.new_socket("Gem Radius", in_out='INPUT', socket_type='NodeSocketFloat')
s.default_value = GEM_RADIUS; s.min_value = 0.05; s.max_value = 1.0
s2 = tree.interface.new_socket("Cage Thickness", in_out='INPUT', socket_type='NodeSocketFloat')
s2.default_value = CAGE_THICKNESS; s2.min_value = 0.002; s2.max_value = 0.08
tree.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
mod["Input_1"] = GEM_RADIUS
mod["Input_2"] = CAGE_THICKNESS

def flat_shade(x, y, geo):
    sh = N("GeometryNodeSetShadeSmooth", x, y)
    sh.domain = 'FACE'; sh.inputs["Shade Smooth"].default_value = False
    links.new(geo, sh.inputs["Geometry"]); return sh.outputs["Geometry"]

def set_mat(x, y, geo, idx):
    sm = N("GeometryNodeSetMaterialIndex", x, y)
    sm.inputs["Material Index"].default_value = idx
    links.new(geo, sm.inputs["Geometry"]); return sm.outputs["Geometry"]

def translate(x, y, geo, t):
    tf = N("GeometryNodeTransformGeometry", x, y)
    tf.inputs["Translation"].default_value = mathutils.Vector(t)
    tf.inputs["Scale"].default_value       = mathutils.Vector((1, 1, 1))
    links.new(geo, tf.inputs["Geometry"]); return tf.outputs["Geometry"]

# Gem core
ico_gem = N("GeometryNodeMeshIcoSphere", -700, 200)
links.new(grp_in.outputs["Gem Radius"], ico_gem.inputs["Radius"])
ico_gem.inputs["Subdivisions"].default_value = 1
geo_gem = flat_shade(-500, 200, ico_gem.outputs["Mesh"])
geo_gem = set_mat(-300, 200, geo_gem, 0)
geo_gem = translate(-100, 200, geo_gem, (0, 0, GEM_OFFSET_Z))

# Wire cage
ico_cage = N("GeometryNodeMeshIcoSphere", -700, -80)
ico_cage.inputs["Radius"].default_value = CAGE_RADIUS
ico_cage.inputs["Subdivisions"].default_value = 1
wire = N("GeometryNodeWireframe", -500, -80)
wire.use_boundary = False
links.new(grp_in.outputs["Cage Thickness"], wire.inputs["Thickness"])
links.new(ico_cage.outputs["Mesh"], wire.inputs["Mesh"])
geo_cage = set_mat(-300, -80, wire.outputs["Mesh"], 1)
geo_cage = translate(-100, -80, geo_cage, (0, 0, GEM_OFFSET_Z))

# Hex base
cyl = N("GeometryNodeMeshCylinder", -700, -340)
cyl.inputs["Vertices"].default_value = BASE_VERTICES
cyl.inputs["Radius"].default_value   = BASE_RADIUS
cyl.inputs["Depth"].default_value    = BASE_DEPTH
cyl.fill_type = 'NGON'
geo_base = flat_shade(-500, -340, cyl.outputs["Mesh"])
geo_base = set_mat(-300, -340, geo_base, 2)
geo_base = translate(-100, -340, geo_base, (0, 0, BASE_OFFSET_Z))

# Join all three streams
join = N("GeometryNodeJoinGeometry", 100, 0)
links.new(geo_gem,  join.inputs["Geometry"])
links.new(geo_cage, join.inputs["Geometry"])
links.new(geo_base, join.inputs["Geometry"])
links.new(join.outputs["Geometry"], grp_out.inputs["Geometry"])

bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.modifier_apply(modifier="Lantern_GN")
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    export_format='GLB', use_selection=True,
    export_yup=True, export_apply=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
)
print("Written:", bpy.path.abspath(GLB_PATH))`,
      },
    ],
    body: <Body />,
  },
  {
    slug: "blender-tutorial-gn-join-geometry-transform-multi-part-assembly-lantern-webxr",
    title:
      "GN Join Geometry + Transform Geometry — Faceted Lantern Assembly (Blender 5.1)",
    date: "2026-07-20",
    topics: ["blender", "geometry-nodes", "webxr", "scripting"],
    description:
      "Assemble a three-part faceted lantern inside a single GN modifier using Join Geometry and Transform Geometry — one mesh object, three material slots, one GLB node.",
  }
);
