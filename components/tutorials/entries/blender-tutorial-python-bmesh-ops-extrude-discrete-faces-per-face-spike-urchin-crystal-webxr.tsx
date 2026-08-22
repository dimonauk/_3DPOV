import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.extrude_discrete_faces</code> extrudes every face in
        the selection as a fully independent solid — each face sprouts its own
        side-wall quads and a cap face with <em>no shared vertices</em> between
        adjacent extruded units. The result is structurally identical to
        selecting faces individually and running Extrude Individual Faces in
        the viewport, but it executes on the entire selection in a single C
        call. The tutorial artifact is a faceted crystal urchin: a
        low-poly icosphere whose 80 triangular faces each become a sharp
        pyramidal spike, ready for WebXR drop-in.
      </p>
      <p>
        The key distinction from{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr"
          className={lk}
        >
          extrude_face_region
        </Link>{" "}
        is topology: the region op dissolves shared boundary edges between
        adjacent selected faces before extruding, so a run of three selected
        quads produces one connected box shell. Discrete faces never dissolves
        — each face keeps its own boundary ring, producing 80 independent
        pyramids when given 80 source faces. The only time to reach for the
        region op is when you want a contiguous extruded surface (a panel
        push, a recessed bay); for spikes, studs, tentacles, or any geometry
        that must stay physically separate, discrete is the tool.
      </p>

      <h2>Signature</h2>
      <pre>{`result = bmesh.ops.extrude_discrete_faces(
    bm,
    faces              = list_of_BMFace,  # required
    use_select_history = False,           # preserve select order in result
)
cap_faces = result['faces']  # list[BMFace] — one new face per input face`}</pre>
      <p>
        The return value contains only the cap (top) faces. The side-wall quads
        are woven into the mesh but are not enumerated in{" "}
        <code>result</code> — iterate <code>bm.faces</code> after the call if
        you need them. Unlike{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset_faces
        </Link>
        , the original input faces are consumed by the extrusion: they become
        the base of each spike and no longer appear as top-level faces. The
        cap faces in the result are freshly created — do not keep stale
        references to the input list after the call.
      </p>

      <h2>Why extrude_discrete_faces vs extrude_face_region</h2>
      <pre>{`# Region op — shared boundary merged, one connected shell
result_r = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
# result_r['geom'] contains verts + edges + faces of the outer shell
# all selected faces produce ONE extrusion group

# Discrete op — each face isolated, N independent extrusions
result_d = bmesh.ops.extrude_discrete_faces(bm, faces=bm.faces[:])
# result_d['faces'] contains N cap faces, one per input face
# no merging of adjacent face boundaries`}</pre>
      <p>
        In practice: on a flat grid, the region op lifts the whole patch as a
        solid box (N cap faces all at the same height, sharing side walls at
        internal edges). The discrete op on the same grid lifts each quad as
        its own isolated box; the side walls of adjacent cells do not share
        edges or verts, and you can later scale or translate each cap group
        independently — for example to produce varying spike heights driven by
        a noise function.
      </p>

      <h2>Icosphere vs UV sphere as the base primitive</h2>
      <p>
        <code>bmesh.ops.create_icosphere</code> produces a geodesic triangular
        mesh with face areas that are as equal as possible at a given
        subdivision level. A UV sphere with equivalent vertex counts has polar
        cap faces that are significantly smaller than equatorial faces — at{" "}
        <code>subdivisions=2</code> the icosphere's variance in face area
        across all 80 faces is less than 2 %, while a comparable UV sphere
        exceeds 40 %. Because spike height is derived from{" "}
        <code>SPIKE_HEIGHT × face.normal</code> (a constant displacement),
        uniform face size translates directly to visually uniform spike
        lengths around the entire sphere. The icosphere is therefore the
        correct starting primitive for any isotropic spike/stud pattern.
      </p>
      <pre>{`# Icosphere primitives available in bmesh.ops
bmesh.ops.create_icosphere(
    bm,
    subdivisions = 2,    # 1=20 faces · 2=80 · 3=320 · 4=1280
    radius       = 1.0,
    calc_uvs     = False,
    matrix       = Matrix(),
)`}</pre>

      <h2>Translating caps along face normals</h2>
      <pre>{`for cap in result_d['faces']:
    normal = cap.normal.copy()  # copy before mutating verts
    verts  = list(cap.verts)
    bmesh.ops.translate(
        bm,
        verts = verts,
        vec   = normal * SPIKE_HEIGHT,
    )`}</pre>
      <p>
        The <code>.copy()</code> call on <code>cap.normal</code> is
        non-negotiable. <code>face.normal</code> is a live computed view into
        the BMFace; after the translate call, Blender marks the face as dirty
        and the normal reference reflects the <em>updated</em> geometry.
        Without a copy, the second iteration would translate along the already-
        shifted normal — producing shorter and shorter spikes toward the end of
        the loop. Copy once per face at loop entry and use the snapshot.
      </p>
      <p>
        Also worth noting: the icosphere is created with outward-pointing face
        normals (away from the sphere centre), so the spike translation without
        any sign adjustment produces spikes radiating outward — which is the
        desired behaviour. If the normals were inward (e.g. after a boolean
        that carved a cavity), prepend{" "}
        <code>bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])</code>{" "}
        with <code>inside=False</code> before the extrusion.
      </p>

      <h2>Tapering spikes to a pyramidal point</h2>
      <pre>{`centroid = Vector(sum((v.co for v in verts), Vector()) / len(verts))
pivot    = Matrix.Translation(centroid)
bmesh.ops.scale(
    bm,
    verts = verts,
    vec   = (SPIKE_TIP_SCALE,) * 3,
    space = pivot.inverted(),
)`}</pre>
      <p>
        <code>bmesh.ops.scale</code> takes a <code>space</code> matrix that
        defines the scale&apos;s origin. The standard pattern for scaling toward a
        local pivot is to invert a translation matrix rather than computing the
        full world-to-local transform:{" "}
        <code>pivot.inverted()</code> maps world coordinates so that the
        centroid becomes the origin, applies the scale, and the uninverted
        implicit post-multiply returns verts to world space. This is equivalent
        to the &ldquo;Individual Origins&rdquo; scale mode in the viewport.
      </p>
      <p>
        <strong>SPIKE_TIP_SCALE = 0.06</strong> leaves a triangle roughly 3 mm
        across at the tip — small enough to appear pointed in a WebXR scene
        but large enough to avoid degenerate zero-area geometry that the glTF
        exporter would silently discard. Setting it to exactly{" "}
        <code>0.0</code> collapses the cap verts to a single point, which
        requires a follow-up{" "}
        <code>bmesh.ops.remove_doubles</code> to merge the coincident verts;
        skipping that step leaves N overlapping verts at the tip with zero-area
        triangles, which produces visual artefacts in Eevee and Three.js.
      </p>

      <h2>Sharp edges and the faceted GLB export</h2>
      <pre>{`bm.normal_update()
for e in bm.edges:
    e.smooth = False
for f in bm.faces:
    f.smooth = False`}</pre>
      <p>
        In Blender 5.1, <code>e.smooth = False</code> inside a BMesh context
        writes the <code>sharp_edge</code> BOOLEAN attribute on the EDGE
        domain. The glTF exporter reads it and writes per-corner split normals
        into the GLB <code>NORMAL</code> accessor — every triangle in the
        exported file gets its own normal data, making each facet read as a
        flat discrete plane in the Three.js fragment shader. This is the same
        mechanism described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr"
          className={lk}
        >
          poke (crystal boss)
        </Link>{" "}
        tutorial: poke creates a diamond fan from a single face; discrete
        extrusion creates a spike pyramid; both use the sharp-edge tag to
        convert the geometric silhouette into a lighting silhouette.
      </p>
      <p>
        Call <code>bm.normal_update()</code> after the full construction loop
        and before the sharp-edge tag pass. The update recomputes all face
        normals based on final vertex positions — important here because the
        translate and scale calls leave the normals dirty, and the glTF
        exporter reads normals from the evaluated mesh post-modifier, not from
        the pre-update dirty state.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Stale face references after extrude.</strong>{" "}
          <code>bmesh.ops.extrude_discrete_faces</code> replaces the input
          faces with new geometry. Any handle to an input BMFace is invalid
          after the call. Always iterate <code>result[&apos;faces&apos;]</code>,
          not the original list.
        </li>
        <li>
          <strong>Spikes all pointing to the same direction.</strong> The
          icosphere is fine; if you use a UV sphere, the polar-cap faces have
          normals that are numerically unstable (near-degenerate triangles at
          the poles). Substitute with <code>create_icosphere</code> to
          eliminate the issue.
        </li>
        <li>
          <strong>Zero-area cap triangle disappears in export.</strong>{" "}
          Set <code>SPIKE_TIP_SCALE &gt;= 0.02</code> or add a{" "}
          <code>bmesh.ops.remove_doubles</code> pass if you want a true
          point tip.
        </li>
        <li>
          <strong>Side walls shading as smooth despite the edge tag.</strong>{" "}
          The <code>e.smooth = False</code> loop covers ALL edges in the bmesh.
          If you only tag edges in <code>result[&apos;faces&apos;]</code> boundary
          edges you will miss the base-ring edges (between spike root and
          icosphere surface). Tag everything, then selectively re-smooth
          afterwards if needed.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation. Formal signatures and return
          types for every bmesh operator. Related projects:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Blender source
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bmesh.types
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
            glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The official Blender glTF exporter
          — source of the sharp-edge → split-normal path described above.
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF specification
          </a>
          .
        </li>
      </ul>

      <h2>Blueprint</h2>
      <pre>{`# public/library/blends/scripting/
#   python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr/
#   blueprint.py

import bpy, bmesh, math
from mathutils import Matrix, Vector

SPHERE_RADIUS   = 1.0
ICO_SUBDIVS     = 2
SPIKE_HEIGHT    = 0.30
SPIKE_TIP_SCALE = 0.06
EXPORT_PATH     = "//hf_spike_urchin.glb"

bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIVS, radius=SPHERE_RADIUS)
bm.faces.ensure_lookup_table()

result = bmesh.ops.extrude_discrete_faces(bm, faces=list(bm.faces))
for cap in result['faces']:
    normal  = cap.normal.copy()
    verts   = list(cap.verts)
    bmesh.ops.translate(bm, verts=verts, vec=normal * SPIKE_HEIGHT)
    centroid = Vector(sum((v.co for v in verts), Vector()) / len(verts))
    pivot    = Matrix.Translation(centroid)
    bmesh.ops.scale(bm, verts=verts,
                    vec=(SPIKE_TIP_SCALE,)*3, space=pivot.inverted())

bm.normal_update()
for e in bm.edges: e.smooth = False
for f in bm.faces: f.smooth = False

me = bpy.data.meshes.new("hf_spike_urchin")
ob = bpy.data.objects.new("hf_spike_urchin", me)
bpy.context.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH, export_format='GLB',
    export_apply=True, export_normals=True, export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)`}</pre>
    </>
  );
}

export const entry: Entry = buildInstructable({
  id: "blender-tutorial-python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr",
  title:
    "Python bmesh.ops.extrude_discrete_faces — Per-Face Individual Extrusion: Spike Array & Crystal Urchin for WebXR",
  description:
    "Extrude every face of an icosphere as its own independent pyramid, taper each cap toward a point, tag all edges sharp, and export a faceted crystal urchin GLB for WebXR — covering the topology difference between extrude_discrete_faces and extrude_face_region in Blender 5.1.",
  tags: [
    "blender",
    "blender-5.1",
    "bmesh",
    "python",
    "scripting",
    "geometry",
    "hard-surface",
    "crystal",
    "webxr",
    "glb",
    "export",
  ],
  body: Body,
  level: "intermediate",
});
