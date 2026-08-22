import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>mathutils.kdtree.KDTree</code> is a compiled C k-d tree built
        into Blender&rsquo;s Python environment — no install required. It solves
        the question &ldquo;which source vertices are nearest to this target
        vertex?&rdquo; in <em>O(log n)</em> time rather than the <em>O(n)</em>{" "}
        linear scan you&rsquo;d get from a manual distance loop. This tutorial
        uses that to transfer a custom per-vertex attribute (a fake AO bake,
        stored as a named{" "}
        <code>FLOAT</code> attribute on the <code>POINT</code> domain) from a
        high-resolution source icosphere onto a low-poly proxy via
        inverse-distance-squared weighting, then exports the result as a{" "}
        <code>FLOAT_COLOR</code>-bearing GLB for WebXR consumption.
      </p>

      <h2>KDTree vs BVHTree — choosing the right primitive</h2>
      <p>
        Both live in <code>mathutils</code>, but they answer different questions.{" "}
        <code>BVHTree.find_nearest(co)</code> projects a point onto the nearest
        triangle face and returns a face-normal and UV barycentric coordinate.
        That is the right tool for surface snapping or normal transfer. When your
        data lives on the <strong>POINT domain</strong> (per-vertex scalars or
        vectors), you want vertex indices, not face projections:{" "}
        <code>KDTree.find_n(co, k)</code> returns exactly that — the{" "}
        <em>k</em> nearest vertex indices sorted by Euclidean distance.
      </p>
      <p>
        The same reasoning rules out{" "}
        <strong>Data Transfer Modifier</strong> for this task: the modifier
        cannot address custom-named attributes added by Geometry Nodes or
        Python scripts, and it re-evaluates on every frame change. A scripted
        KDTree transfer runs once and produces a static bake that survives GLB
        round-trips.
      </p>

      <h2>Building the tree</h2>
      <pre><code>{`import mathutils, array
import bpy

me = bpy.data.objects["hires_source"].data
n  = len(me.vertices)

kd = mathutils.kdtree.KDTree(n)   # n is a capacity hint — safe to exceed

co_buf = array.array('f', [0.0] * (n * 3))
me.vertices.foreach_get("co", co_buf)         # bulk read, one C call

for i in range(n):
    kd.insert(
        mathutils.Vector((co_buf[i*3], co_buf[i*3+1], co_buf[i*3+2])),
        i,                                    # index tag, returned by find
    )
kd.balance()     # MANDATORY — raises RuntimeError if find() called first`}</code></pre>
      <p>
        The <code>foreach_get("co", flat_buffer)</code> pattern reads all
        vertex coordinates in one C-level memcopy. Iterating{" "}
        <code>me.vertices</code> in Python and accessing{" "}
        <code>.co</code> per-item is roughly 100&times; slower on large meshes —
        avoid it for anything beyond quick debugging. See the companion
        tutorial on{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
          className={lk}
        >
          mesh attribute domains
        </Link>{" "}
        for the full domain/type matrix.
      </p>

      <h2>Inverse-distance-squared weighting</h2>
      <pre><code>{`hits = kd.find_n(query_co, K_NEAREST)   # [(Vector, idx, dist), ...] nearest-first

if hits and hits[0][2] < 1e-8:
    val = ao_src[hits[0][1]]           # exact coincident — no division needed
else:
    total_w, total_v = 0.0, 0.0
    for _co, idx, dist in hits:
        w        = 1.0 / (dist * dist) # 1/d² weights near verts more strongly
        total_w += w
        total_v += w * ao_src[idx]
    val = total_v / total_w            # normalised weighted average`}</code></pre>
      <p>
        The coincidence guard is not optional. When a target vertex sits at the
        exact same world position as a source vertex, <code>dist</code> is
        effectively zero: <code>1 / (0²)</code> overflows to infinity or
        produces NaN, corrupting the entire colour buffer. The guard short-circuits
        to a direct lookup instead.
      </p>
      <p>
        Simple <code>1/d</code> weighting tends to amplify distant stray samples
        when source and target meshes differ in density. Squaring the denominator
        concentrates influence on the nearest contributor, producing a result that
        reads as locally coherent even across coarse-to-fine mismatches — analogous
        to what SciPy&rsquo;s{" "}
        <code>scipy.spatial.cKDTree</code> documentation (BSD-3-Clause) calls
        &ldquo;inverse distance weighting with power p=2&rdquo;. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-matrix-transform-compose-decompose-webxr"
          className={lk}
        >
          mathutils.Matrix tutorial
        </Link>{" "}
        for world-space coordinate conventions when source and target objects are
        not at the origin.
      </p>

      <h2>Writing back as FLOAT_COLOR for GLB</h2>
      <pre><code>{`color_buf = array.array('f', [0.0] * (n_target * 4))  # RGBA, interleaved

for i in range(n_target):
    # ... compute val from KDTree query above ...
    base = i * 4
    color_buf[base]     = val   # R
    color_buf[base + 1] = val   # G
    color_buf[base + 2] = val   # B
    color_buf[base + 3] = 1.0   # A

attr = (me.attributes.get("ao_baked") or
        me.attributes.new("ao_baked", type='FLOAT_COLOR', domain='POINT'))
attr.data.foreach_set("color", color_buf)

# Mark as the active render colour → becomes COLOR_0 in the exported GLB
for i, ca in enumerate(ob.data.color_attributes):
    if ca.name == "ao_baked":
        ob.data.color_attributes.render_color_index = i
        break`}</code></pre>
      <p>
        <code>FLOAT_COLOR</code> on the <code>POINT</code> domain stores four
        floats (RGBA) per vertex. The GLB exporter writes this as a{" "}
        <code>COLOR_0</code> accessor in the mesh primitive — Three.js reads it
        via <code>vertexColors: true</code> on the material, Babylon.js picks it
        up automatically. Both ignore the alpha component unless the material
        specifically routes it to opacity. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr"
          className={lk}
        >
          UV atlas tutorial
        </Link>{" "}
        for the interaction between colour attributes and UV-based texture bakes
        when both are present in the same GLB.
      </p>

      <h2>Production use cases</h2>
      <ul>
        <li>
          <strong>AO bake transfer</strong> — render Cycles AO at full
          subdivision, read the rendered image&rsquo;s pixel buffer, then call
          this pipeline to project the bake onto a real-time low-poly proxy.
          Sidesteps the UV-unwrap requirement of a normal texture bake.
        </li>
        <li>
          <strong>LOD colour continuity</strong> — when generating LOD meshes
          with Geometry Nodes&rsquo; Decimate node, re-run the transfer on each
          LOD level to carry vertex-painted details through the reduction.
        </li>
        <li>
          <strong>VRM deformation heat maps</strong> — transfer a
          proximity-to-joint float from a skeleton cage onto a character mesh;
          store the result as a colour attribute for visualisation. Companion
          reading:{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
            className={lk}
          >
            vertex group scripting & VRM deform envelope
          </Link>
          .
        </li>
      </ul>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>RuntimeError: KDTree must be balanced first</strong> — you
          called <code>find_n</code> before <code>balance()</code>. Always call{" "}
          <code>balance()</code> after all <code>insert()</code> calls.
        </li>
        <li>
          <strong>NaN in colour buffer</strong> — missing the coincidence guard.
          A <code>dist</code> of zero reaches <code>1/0²</code>. Check for{" "}
          <code>dist &lt; 1e-8</code> and take the direct value.
        </li>
        <li>
          <strong>GLB lacks COLOR_0 accessor</strong> — the attribute was not
          set as the active render colour. Set{" "}
          <code>color_attributes.render_color_index</code> explicitly; do not
          rely on creation order.
        </li>
        <li>
          <strong>Slow transfer loop</strong> — using{" "}
          <code>me.vertices[i].co</code> inside the loop instead of bulk{" "}
          <code>foreach_get</code>. On a 10k-vertex mesh the difference is
          several seconds versus milliseconds.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        Algorithm background: SciPy spatial module (BSD-3-Clause,{" "}
        <a
          href="https://docs.scipy.org/doc/scipy/reference/spatial.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          scipy.org/doc/scipy/reference/spatial.html
        </a>
        ), SciPy contributors. Related SciPy ecosystem projects: NumPy, pandas,
        scikit-learn — all BSD-3-Clause. Bulk buffer pattern: NumPy docs
        (BSD-3-Clause,{" "}
        <a
          href="https://numpy.org/doc/stable/reference/generated/numpy.ndarray.tobytes.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          numpy.org/doc/stable
        </a>
        ), NumPy contributors. Related NumPy projects: SciPy, matplotlib,
        pandas.
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
        content: `import array, math, mathutils, bpy

SOURCE_OBJ = "hires_source"; TARGET_OBJ = "lores_proxy"
ATTR_SRC = "ao_value"; ATTR_DST = "ao_baked"
K_NEAREST = 4; SOURCE_SUBDIVS = 4; TARGET_SUBDIVS = 2
BLEND_PATH = "//attr_transfer.blend"; GLB_PATH = "//attr_transfer.glb"

def _clear_scene():
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):  bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials): bpy.data.materials.remove(ma)

def _add_ico(name, subdivs, radius=1.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivs, radius=radius)
    ob = bpy.context.active_object; ob.name = name; ob.data.name = name+"_mesh"
    return ob

def _write_ao(ob):
    me = ob.data; n = len(me.vertices)
    co = array.array('f', [0.0]*(n*3)); me.vertices.foreach_get("co", co)
    y = [co[i*3+1] for i in range(n)]
    span = (max(y)-min(y)) or 1.0; y0 = min(y)
    buf = array.array('f', [(v-y0)/span for v in y])
    attr = me.attributes.get(ATTR_SRC) or me.attributes.new(ATTR_SRC,'FLOAT','POINT')
    attr.data.foreach_set("value", buf); me.update()

def _build_kd(ob):
    me = ob.data; n = len(me.vertices)
    kd = mathutils.kdtree.KDTree(n)
    co = array.array('f', [0.0]*(n*3)); me.vertices.foreach_get("co", co)
    for i in range(n):
        kd.insert(mathutils.Vector((co[i*3],co[i*3+1],co[i*3+2])), i)
    kd.balance()
    ao = array.array('f',[0.0]*n)
    me.attributes.get(ATTR_SRC).data.foreach_get("value", ao)
    return kd, list(ao)

def _transfer(tgt, kd, ao_src):
    me = tgt.data; n = len(me.vertices)
    co = array.array('f',[0.0]*(n*3)); me.vertices.foreach_get("co", co)
    cbuf = array.array('f',[0.0]*(n*4))
    for i in range(n):
        q = mathutils.Vector((co[i*3],co[i*3+1],co[i*3+2]))
        hits = kd.find_n(q, K_NEAREST)
        if hits and hits[0][2]<1e-8:
            val = ao_src[hits[0][1]]
        else:
            tw=tv=0.0
            for _,idx,d in hits: w=1/(d*d); tw+=w; tv+=w*ao_src[idx]
            val = tv/tw if tw else 0.0
        b=i*4; cbuf[b]=cbuf[b+1]=cbuf[b+2]=val; cbuf[b+3]=1.0
    attr = me.attributes.get(ATTR_DST) or me.attributes.new(ATTR_DST,'FLOAT_COLOR','POINT')
    attr.data.foreach_set("color", cbuf); me.update()
    for i,ca in enumerate(me.color_attributes):
        if ca.name==ATTR_DST:
            me.color_attributes.render_color_index=i; break

def _material(ob):
    mat=bpy.data.materials.new("AttrMat"); mat.use_nodes=True
    nt=mat.node_tree; nt.nodes.clear()
    out=nt.nodes.new("ShaderNodeOutputMaterial"); out.location=(300,0)
    bsdf=nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location=(0,0)
    vcol=nt.nodes.new("ShaderNodeVertexColor"); vcol.location=(-260,80)
    vcol.layer_name=ATTR_DST; bsdf.inputs["Roughness"].default_value=0.6
    nt.links.new(vcol.outputs["Color"],bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],out.inputs["Surface"])
    ob.data.materials.clear(); ob.data.materials.append(mat)

_clear_scene()
src=_add_ico(SOURCE_OBJ,SOURCE_SUBDIVS); _write_ao(src)
tgt=_add_ico(TARGET_OBJ,TARGET_SUBDIVS); tgt.location=(2.6,0,0)
bpy.context.view_layer.update()
kd,ao=_build_kd(src); _transfer(tgt,kd,ao); _material(tgt)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH, export_format='GLB',
    export_yup=True, export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_vertex_color='ACTIVE', use_selection=False,
)
print(f"source={len(src.data.vertices)} verts  target={len(tgt.data.vertices)} verts")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-mathutils-kdtree-nearest-attribute-transfer-webxr",
    title:
      "Python mathutils.kdtree — Nearest-Neighbour Attribute Transfer: Hi-Res Source Bake to Low-Poly Proxy for WebXR (Blender 5.1)",
    blurb:
      "mathutils.kdtree.KDTree is a compiled C k-d tree built into Blender's Python environment. Learn to build the tree from an evaluated source mesh, read a custom FLOAT per-vertex attribute, transfer it to a low-poly proxy with inverse-distance-squared weighting, and export as a FLOAT_COLOR GLB with a COLOR_0 vertex-colour accessor for Three.js and Babylon.js in WebXR.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "webxr",
      "mesh",
      "attributes",
      "kdtree",
      "spatial",
      "vertex-colour",
      "glb",
      "low-poly",
    ],
    difficulty: "intermediate",
  }
);
