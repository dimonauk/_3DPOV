import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.poke</code> inserts a single centre vertex into every
        selected <code>BMFace</code> and radiates triangle edges outward to
        each rim vertex, converting the face into a fan. Set{" "}
        <code>offset &gt; 0</code> and that centre vertex rides up along the
        face normal, raising a diamond boss above the surface. Every quad in a
        flat grid becomes a 4-triangle X-crown; every hexagon becomes a
        6-triangle pinwheel. Pair it with a sharp-edge pass on all new spoke
        edges and the result is a hard-faceted crystal surface whose flat
        normals bake straight into the GLB NORMAL accessor — no{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr"
          className={lk}
        >
          WeightedNormal modifier
        </Link>{" "}
        or custom-normals pass required. The prop for this session is a
        disc-trimmed grid shield with a gilt raised boss on every cell and a
        back plate — a pattern used on armour trim, medallions, and decorative
        panels across the studio&apos;s WebXR prop library.
      </p>
      <p>
        poke is the complement of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr"
          className={lk}
        >
          convex_hull crystal gem
        </Link>{" "}
        workflow: hull works outside-in (wrapping a point cloud in the tightest
        polyhedron), poke works inside-out (exploding each face of an existing
        mesh into a triangle fan). Together they give the studio two orthogonal
        paths to the same cel-shade faceted aesthetic.
      </p>

      <h2>Signature</h2>
      <pre>{`result = bmesh.ops.poke(
    bm,
    faces               = list_of_BMFace,  # required
    offset              = 0.0,             # displacement along face normal
    use_relative_offset = False,           # True multiplies offset by face area
    center_mode         = 'MEAN_WEIGHTED', # MEAN_WEIGHTED | MEAN | BOUNDS
)
centre_verts = result['verts']  # list[BMVert] — one new vert per input face`}</pre>
      <p>
        Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset_faces
        </Link>{" "}
        return whose <code>result[&apos;faces&apos;]</code> can be empty on a
        zero-thickness collapse, poke <em>always</em> returns one{" "}
        <code>BMVert</code> per input face — even on a degenerate zero-area
        face (the centre vert lands at the same position as the existing verts,
        no exception). The count is a reliable invariant:{" "}
        <code>len(result[&apos;verts&apos;]) == len(disc_faces)</code>.
      </p>

      <h2>The three centre_mode options</h2>
      <ul>
        <li>
          <code>MEAN_WEIGHTED</code> — area-weighted centroid. The centre vert
          is biased toward the larger sub-regions of the face. Most stable for
          non-square quads and n-gons — use by default.
        </li>
        <li>
          <code>MEAN</code> — equal-weight mean of all face vertex positions.
          Identical to MEAN_WEIGHTED for regular (equal-area) polygons;
          produces a slightly different centre on skewed quads.
        </li>
        <li>
          <code>BOUNDS</code> — midpoint of the face bounding box. Guarantees
          a symmetric boss on axis-aligned quads; can place the centre
          off-surface on angled or non-planar faces.
        </li>
      </ul>

      <h2>offset acts on the face normal, not world Z</h2>
      <p>
        This is the most common source of confusion when combining poke with
        curved or tilted geometry. On a flat horizontal grid the two are
        equivalent, but on a sphere, a vaulted arch, or a tilted panel each
        face points in a different direction — poke raises the boss{" "}
        <em>perpendicular to that face</em>, not globally upward. On a
        low-poly sphere this produces bosses radiating outward from the centre,
        which is exactly the crystal-facet look; on a flat grid the bosses
        rise in unison. Set <code>use_relative_offset=True</code> only when
        your disc contains mixed face sizes (the outer ring cells near the
        trim boundary are smaller); multiplying offset by face area would then
        produce taller bosses on the big central cells and shorter ones at the
        edge, which is usually undesirable — keep it False for a uniform
        diamond lattice.
      </p>

      <h2>Sharp-edge tagging and the facet look</h2>
      <pre>{`# Poke creates new spoke edges (centre → rim).
# They default to smooth after the call — tag them explicitly.
for e in bm.edges:
    e.smooth = False   # Blender 5.1: maps to the "sharp_edge" mesh attribute
for f in bm.faces:
    f.smooth = False   # flat-shading per face`}</pre>
      <p>
        In Blender 5.1 <code>e.smooth = False</code> in a BMesh context writes
        the <code>sharp_edge</code> boolean mesh attribute (introduced in 4.1).
        The glTF exporter reads it and writes split per-corner normals into the
        GLB NORMAL accessor, making every facet triangle appear as a discrete
        flat plane in the Three.js fragment shader. There is no need for the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr"
          className={lk}
        >
          triangulate
        </Link>{" "}
        op after poke — the triangle fan is already all-tri — but if you later
        run <code>join_triangles</code> to merge coplanar pairs remember to
        pass <code>cmp_sharp=True</code> or the sharp marks will be dissolved.
      </p>

      <h2>Building the disc grid</h2>
      <pre>{`bmesh.ops.create_grid(bm, x_segments=7, y_segments=7, size=1.0)
bm.faces.ensure_lookup_table()

outer = [f for f in bm.faces
         if f.calc_center_median().length > DISC_RADIUS * GRID_SIZE]
bmesh.ops.delete(bm, geom=outer, context='FACES')

# FACES context deletes faces and their interior edges/verts but leaves
# boundary verts whose only remaining link is the deleted face.
# Clean them separately — mixing VERTS and FACES in one call errors.
bmesh.ops.delete(bm,
    geom=[v for v in bm.verts if not v.link_faces],
    context='VERTS')`}</pre>
      <p>
        The <code>FACES</code>/<code>VERTS</code> two-pass pattern is the same
        used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr"
          className={lk}
        >
          bridge_loops port socket
        </Link>{" "}
        tutorial for cleaning bore geometry. After face deletion the boundary
        of the disc is a set of edges each with exactly one remaining
        <code> link_face</code> — the rim — which is what the back-plate
        extrusion relies on.
      </p>

      <h2>Combining with inset_faces</h2>
      <p>
        For the armoured boss look — a groove ring around each raised diamond —
        stack inset before poke:
      </p>
      <pre>{`# Step 1: individual groove ring per face
ret_ins = bmesh.ops.inset_faces(
    bm,
    faces          = disc_faces,
    use_individual = True,   # each face gets its own groove
    thickness      = 0.03,
    depth          = 0.0,
    use_even_offset= True,
)
# Step 2: raise only the inner (inset) face
bmesh.ops.poke(bm, faces=ret_ins['faces'], offset=BOSS_HEIGHT)`}</pre>
      <p>
        inset creates a smaller inner face surrounded by a quad groove ring;
        poke then raises only the inner face. Neither op touches geometry it
        was not given, so the groove quads remain flat while the boss rises —
        a clean separation of concerns at the BMesh level.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre>{`# 1. 7×7 grid → trim to disc at DISC_RADIUS=0.88
# 2. poke(offset=0.07, center_mode='MEAN_WEIGHTED') → boss_verts
# 3. all edges sharp / all faces flat
# 4. material_index = 1 (gilt) if any vert ∈ boss_verts else 0 (steel)
# 5. rim_edges = [e for e if len(e.link_faces)==1]
#    extrude_edge_only → translate −Z by 0.10
#    fill back boundary → recalc_face_normals
# 6. export_scene.gltf(draco=6, yup=True, apply=True)`}</pre>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Boss tip sits flat on the surface</strong> —{" "}
          <code>offset=0</code> (the default). Poke ran but displaced nothing.
          Set <code>BOSS_HEIGHT &gt; 0</code>.
        </li>
        <li>
          <strong>Inverted normals on back plate</strong> —{" "}
          <code>extrude_edge_only</code> + <code>fill</code> can flip back-face
          winding. Follow with{" "}
          <code>bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])</code>.
        </li>
        <li>
          <strong>
            <code>result[&apos;verts&apos;]</code> shorter than expected
          </strong>{" "}
          — a degenerate zero-area face is in the input. Pre-filter:{" "}
          <code>
            [f for f in bm.faces if f.calc_area() &gt; 1e-6]
          </code>.
        </li>
        <li>
          <strong>Poke on triangles — 3 not 4 children</strong> — correct
          behaviour. A triangle fan on an input triangle produces 3 child
          triangles. The <code>boss_verts</code> set is still valid for
          material assignment.
        </li>
        <li>
          <strong>Dangling verts after disc trim</strong> — always run the
          two-pass delete (FACES then VERTS) or the rim extrusion picks up
          stray edges that break the single-link-face invariant.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation · related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender source
          </a>
          {" · "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.types
          </a>
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO — official Blender glTF exporter
          </a>{" "}
          · Apache-2.0 · Khronos Group · related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF spec repo
          </a>
          {" · "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF 2.0 spec
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr",
  title:
    "Python bmesh.ops.poke — Face-Poke & Raised Boss Lattice: Faceted Crystal Shield for WebXR (Blender 5.1)",
  description:
    "poke inserts a centre vertex into every selected BMFace and creates a triangle fan; offset displaces that vertex along the face normal to raise a diamond boss. Covers centre_mode (MEAN_WEIGHTED/MEAN/BOUNDS), the use_relative_offset scaling caveat, sharp-edge tagging for hard-facet GLB normals, the disc-trim two-pass delete pattern, stacking with inset_faces for grooved armour bosses, and the extrude_edge_only + fill back-plate technique.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "poke",
    "faceted",
    "crystal",
    "hard-surface",
    "glb",
    "webxr",
    "cel-shade",
    "low-poly",
    "triangle-fan",
    "boss",
    "shield",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-poke-face-faceted-crystal-boss-webxr",
  Body,
  keyInsights: [
    "result['verts'] always contains exactly one new BMVert per input face — the count is a reliable invariant unlike inset_faces which can return empty on zero-thickness collapse",
    "offset displaces the centre vertex along the FACE NORMAL not world Z — on curved geometry bosses radiate outward from the surface, producing the crystal-sphere look",
    "use_relative_offset=True multiplies offset by face area — keep False for a uniform diamond lattice; use True only when normalising bosses across intentionally mixed-size faces",
    "center_mode='MEAN_WEIGHTED' (area-weighted centroid) is the most stable choice for non-square quads and n-gons; BOUNDS gives symmetric placement on axis-aligned quads",
    "poke creates new spoke edges that default to smooth after the call — explicitly set e.smooth=False on all edges to write the sharp_edge attribute and get split normals in GLB",
    "two-pass delete invariant: FACES context leaves boundary verts with no link_faces; follow immediately with VERTS context delete or the rim extrusion picks up stray edges",
    "stacking with inset_faces: run inset_individual first to create a groove ring, then poke only the inner faces — neither op touches geometry it was not given",
  ],
});
