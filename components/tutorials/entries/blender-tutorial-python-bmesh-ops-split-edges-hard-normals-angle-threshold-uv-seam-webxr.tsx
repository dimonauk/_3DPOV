import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.split_edges</code> duplicates the vertices at the
        endpoints of each targeted edge so that the faces on either side no
        longer share those vertices. The edge is replaced by two coincident
        edges, each owned by exactly one face, making them{" "}
        <em>non-manifold</em> (one linked face each) — a state the UV
        unwrapper treats as natural island boundaries. This is the destructive
        counterpart to Blender 5.1&apos;s <em>Smooth by Angle</em> modifier:
        where that modifier fakes hard normals via custom split normals whilst
        keeping geometry single-piece, <code>split_edges</code> physically
        disconnects the mesh — UV seams at the split are therefore free, not
        an approximation.
      </p>

      <h2>Signature</h2>
      <pre>{`result = bmesh.ops.split_edges(
    bm,
    edges     = list[BMEdge],  # edges to split — required
    verts     = [],            # restrict split to these endpoint verts only
    use_verts = False,         # activate the verts restriction
)
# Returns {} — no result geometry.  Iterate bm.edges after the call.`}</pre>

      <h2>Topology mechanics</h2>
      <pre>{`Before split_edges:
  Face A loops: [..., V1, V2, ...]  ← V1 and V2 are shared with Face B
  Face B loops: [..., V2, V1, ...]
  Edge E        → link_faces count = 2

After split_edges(bm, edges=[E]):
  Face A loops: [..., V1,  V2,  ...]  (unchanged vertices)
  Face B loops: [..., V1', V2', ...]  (new duplicates at same world position)
  Edge E_a (V1 –V2)   → link_faces count = 1  ← non-manifold
  Edge E_b (V1'–V2')  → link_faces count = 1  ← non-manifold`}</pre>
      <p>
        The non-manifold check is the reliable post-call test. On a fully
        closed manifold input every split edge becomes a non-manifold pair —
        which are the natural UV seam candidates. On meshes that already have
        real boundary edges (planes, open shells) pre-collect those boundaries
        before the split so you can exclude them from the seam loop.
      </p>

      <h2>
        split_edges vs{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
          className={lk}
        >
          Smooth by Angle
        </Link>
      </h2>
      <p>
        Prefer the <em>Smooth by Angle</em> modifier when you only need the
        shading to look hard — it is non-destructive, composable, and adds no
        extra geometry. Use <code>split_edges</code> when you need:
      </p>
      <ul>
        <li>
          <strong>Automatic UV seam placement</strong> — non-manifold edges
          become island boundaries without manual{" "}
          <kbd>Ctrl+E → Mark Seam</kbd>.
        </li>
        <li>
          <strong>Physics accuracy</strong> — cloth and soft-body constraints
          operate on topology; the modifier fake is invisible to them.
        </li>
        <li>
          <strong>Engine-agnostic GLB normals</strong> — some importers
          re-derive normals from positions; split geometry is correct
          regardless of the importer&apos;s normal policy.
        </li>
        <li>
          <strong>Downstream bmesh operators that need boundaries</strong> — a
          split edge becomes a selectable boundary for{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr"
            className={lk}
          >
            bridge_loops
          </Link>
          , hole-fill, or additional extrusion.
        </li>
      </ul>

      <h2>Angle-threshold workflow</h2>
      <pre>{`import math, bmesh

bm.normal_update()   # mandatory — calc_face_angle reads face normals

THRESHOLD  = math.radians(25.0)
hard_edges = [
    e for e in bm.edges
    if (ang := e.calc_face_angle(None)) is not None and ang > THRESHOLD
]
# calc_face_angle(None) returns None for boundary / wire edges — safely skipped.
# On a fresh bmesh without normal_update(), all angles compute as 0.0 → empty list.

bmesh.ops.split_edges(bm, edges=hard_edges)

# Post-split: mark UV seams at every non-manifold edge produced by the split
bm.edges.ensure_lookup_table()
for e in bm.edges:
    if len(e.link_faces) == 1:
        e.seam = True      # set BEFORE bm.to_mesh — seams live in the bmesh`}</pre>

      <h2>T-junction splits — the use_verts parameter</h2>
      <p>
        When <code>use_verts=True</code> and the <code>verts</code> list
        contains a subset of endpoints, each edge is split <em>only</em> at
        the endpoint that appears in <code>verts</code>. The other endpoint
        stays shared. Use this for long strips where outer corners are hard but
        the strip cap must stay connected to the body — e.g., a panel strip
        that butts against an adjacent face without leaving a visible seam at
        the join.
      </p>
      <pre>{`# Split shaft-to-crown transition only at the top ring of verts
top_verts = [v for v in bm.verts if v.co.z > SHAFT_HEIGHT - 0.01]
bmesh.ops.split_edges(
    bm, edges=hard_edges,
    verts=top_verts, use_verts=True,
)`}</pre>

      <h2>Blueprint — hexagonal crystal column</h2>
      <p>
        A six-sided prism shaft with a pyramidal crown. All face-to-face
        transitions exceed 20° and are split, giving each face its own UV
        island. Two materials colour the shaft (deep teal) and crown (pale
        gold) separately. See{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset_faces
        </Link>{" "}
        for the panel-groove step that typically precedes this split in a
        hard-surface pipeline.
      </p>
      <pre>{`import bpy, bmesh, math
from mathutils import Vector

RADIUS = 1.0; SHAFT_HEIGHT = 1.4; CROWN_HEIGHT = 0.55
CROWN_INSET = 0.18; SPLIT_ANGLE_DEG = 20.0
EXPORT_PATH = "//hf_crystal_column.glb"

bm = bmesh.new()
vb, vt = [], []
for i in range(6):
    a  = math.radians(30 + 60 * i)           # flat-top hex orientation
    xy = Vector((math.cos(a), math.sin(a), 0.0)) * RADIUS
    vb.append(bm.verts.new(xy))
    vt.append(bm.verts.new(xy + Vector((0, 0, SHAFT_HEIGHT))))

bm.faces.new(vb[::-1])                        # bottom cap — wound CW from above
for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([vb[i], vb[j], vt[j], vt[i]])

vc = []                                       # crown shoulder ring
r_crown = RADIUS - CROWN_INSET
for i in range(6):
    a = math.radians(30 + 60 * i)
    vc.append(bm.verts.new(Vector((math.cos(a)*r_crown, math.sin(a)*r_crown, SHAFT_HEIGHT))))

for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([vt[i], vt[j], vc[j], vc[i]])     # shoulder quads

v_apex = bm.verts.new(Vector((0, 0, SHAFT_HEIGHT + CROWN_HEIGHT)))
for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([vc[i], vc[j], v_apex])            # crown triangles

bm.normal_update()
bm.edges.ensure_lookup_table()

SPLIT_RAD  = math.radians(SPLIT_ANGLE_DEG)
hard_edges = [e for e in bm.edges
              if (ang := e.calc_face_angle(None)) is not None and ang > SPLIT_RAD]

bmesh.ops.split_edges(bm, edges=hard_edges)          # THE KEY STEP

bm.edges.ensure_lookup_table()
for e in bm.edges:
    if len(e.link_faces) == 1: e.seam = True         # UV seams at splits

for f in bm.faces: f.smooth = False
for e in bm.edges: e.smooth = False                  # writes sharp_edge attr

me = bpy.data.meshes.new("hf_crystal_column")
ob = bpy.data.objects.new("hf_crystal_column", me)
bpy.context.scene.collection.objects.link(ob)
bm.to_mesh(me); bm.free()

ob.select_set(True)
bpy.context.view_layer.objects.active = ob
with bpy.context.temp_override(active_object=ob,
                                selected_objects=[ob],
                                selected_editable_objects=[ob]):
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

ms = bpy.data.materials.new("hf_shaft"); ms.diffuse_color = (0.06, 0.28, 0.35, 1)
mc = bpy.data.materials.new("hf_crown"); mc.diffuse_color = (0.80, 0.74, 0.42, 1)
me.materials.append(ms); me.materials.append(mc)
for poly in me.polygons:
    poly.material_index = 1 if me.vertices[poly.vertices[0]].co.z > SHAFT_HEIGHT * 0.95 else 0

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH, export_format='GLB',
    use_selection=False, export_apply=True,
    export_normals=True, export_yup=True, export_texcoords=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
)`}</pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>All edges split — mesh explodes into loose faces.</strong>{" "}
          Threshold too low. Flat-adjacent faces still have a small non-zero
          angle; set{" "}
          <code>SPLIT_ANGLE_DEG ≥ 20</code> for typical hard-surface work, or
          pre-select edges by tag rather than angle alone.
        </li>
        <li>
          <strong>UV unwrap produces one giant island.</strong> The seams were
          not written before <code>bm.to_mesh</code>. The seam data lives in
          the bmesh and must be set on <code>BMEdge.seam</code> before baking
          — there is no way to retroactively transfer it via{" "}
          <code>me.edges[n].use_seam</code> and re-run the unwrap without
          going back into Edit Mode.
        </li>
        <li>
          <strong>
            <code>split_edges</code> selects zero edges — nothing happens.
          </strong>{" "}
          Call <code>bm.normal_update()</code> before the angle-threshold
          loop. On a fresh bmesh all face normals are zero vectors;{" "}
          <code>calc_face_angle</code> returns <code>None</code> or{" "}
          <code>0.0</code> for every edge.
        </li>
        <li>
          <strong>GLB opens with smooth normals in Three.js.</strong>{" "}
          Setting <code>poly.use_smooth = False</code> alone is not
          sufficient. The glTF exporter reads the{" "}
          <code>sharp_edge</code> attribute written by{" "}
          <code>e.smooth = False</code>. Also ensure{" "}
          <code>export_normals=True</code> is passed to the exporter.
        </li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/edge_split.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Edge Split Modifier — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0 · Blender Documentation Team). The non-destructive
          modifier-stack equivalent. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            full Modifiers Reference
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bmesh.ops.html#bmesh.ops.split_edges"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            <code>bmesh.ops.split_edges</code> — Blender 5.1 Python API
          </a>{" "}
          (CC-BY-SA 4.0 · Blender Foundation). Canonical parameter reference.
          Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bmesh.ops.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            full bmesh.ops module
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0 · Khronos Group). Source for how Blender encodes
          per-loop normals in GLB output. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            KhronosGroup/glTF specification
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr",
  title:
    "Python bmesh.ops.split_edges — Sharp-Edge Split, Angle-Threshold Hard Normals & UV Seam Co-location for WebXR (Blender 5.1)",
  description:
    "split_edges disconnects mesh topology at hard edges so each face group owns its vertices exclusively — enabling automatic UV seam placement, physics-accurate cloth boundaries, and export-safe flat shading without the custom-normal workaround. Covers the angle-threshold pattern, T-junction use_verts splits, non-manifold post-call detection, and the GLB sharp_edge attribute encoding in Blender 5.1.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "split-edges",
    "hard-surface",
    "uv",
    "normals",
    "glb",
    "webxr",
    "flat-shading",
    "cel-shade",
    "low-poly",
    "topology",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr",
  Body,
  keyInsights: [
    "split_edges returns an empty dict {} — unlike extrude_face_region or inset_faces there is no result geometry to introspect; iterate bm.edges after the call using len(e.link_faces)==1 to find the split edges",
    "calc_face_angle(None) returns None for boundary and wire edges, not 0.0 — the walrus-operator pattern safely skips those without a separate boundary check",
    "bm.normal_update() is mandatory before the angle-threshold loop — on a fresh bmesh face normals are zero vectors; calc_face_angle reads them, so all angles compute as 0.0 and no edge is selected",
    "UV seam placement is the core payoff: after split_edges every split edge has link_faces count = 1; mark those as seams before bm.to_mesh and the UV unwrapper separates islands automatically",
    "use_verts=True enables T-junction splits: the edge is split only at the endpoint vertex in the verts list, so faces diverge at one end but remain connected at the other — essential for strips where the cap must stay attached",
    "e.smooth = False writes the sharp_edge mesh attribute; the glTF exporter reads sharp_edge to decide whether to write per-loop normals — setting poly.use_smooth = False alone is not sufficient for GLB hard edges",
    "on a fully-closed manifold mesh all hard edges produce non-manifold pairs after split; on a mesh with existing boundary edges pre-collect those boundaries to distinguish original holes from new splits in the seam loop",
  ],
});
