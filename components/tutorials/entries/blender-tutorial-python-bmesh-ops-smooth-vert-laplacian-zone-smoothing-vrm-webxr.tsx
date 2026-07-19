import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender exposes two pure-bmesh vertex smoothing kernels that sit below
        both the modifier stack and Edit Mode operators.{" "}
        <code>bmesh.ops.smooth_vert</code> is a uniform Laplacian — each vertex
        slides toward the centroid average of its direct neighbours by a
        user-supplied factor.{" "}
        <code>bmesh.ops.smooth_laplacian_vert</code> is a cotangent-weighted
        Laplacian — each neighbour is weighted by the cotangents of the angles
        opposite the shared edge in adjacent triangles, which compensates for
        uneven triangle sizing and produces better shape preservation, especially
        with <code>preserve_volume=True</code>.
      </p>
      <p>
        The studio prop is a VRM-compatible shoulder pauldron divided into three
        zones: a hard faceted collar (no smoothing), a transition blend zone
        where <code>smooth_vert</code> relaxes deliberate wave-pattern bumps, and
        an organic dome cap where <code>smooth_laplacian_vert</code> polishes the
        surface without collapsing volume.  The same zone-selection idiom transfers
        directly to skin mesh preparation for VRM characters — smoothing
        joint-deformation blend zones whilst leaving hard-surface detail intact.
      </p>

      <h2>Signatures</h2>
      <pre>{`# smooth_vert — uniform Laplacian, in-place, returns None
bmesh.ops.smooth_vert(
    bm,
    verts           = list[BMVert],  # vertices to relax
    factor          = 0.5,           # 0 = no move, 1 = snap to centroid
    mirror_clip_x   = False,         # snap to X=0 if closer than clip_dist
    mirror_clip_y   = False,
    mirror_clip_z   = False,
    clip_dist       = 1e-5,          # distance threshold for mirror clipping
    use_axis_x      = True,          # permit displacement along X
    use_axis_y      = True,
    use_axis_z      = True,
)

# smooth_laplacian_vert — cotangent Laplacian, in-place, returns None
bmesh.ops.smooth_laplacian_vert(
    bm,
    verts           = list[BMVert],  # vertices to relax
    lambda_factor   = 0.5,           # cotangent weight (higher → stronger)
    lambda_border   = 0.2,           # weight for boundary-edge verts
    use_x           = True,
    use_y           = True,
    use_z           = True,
    preserve_volume = True,          # apply uniform-scale correction per pass
)`}</pre>
      <p>
        Neither operation returns a result dict — both mutate the BMesh
        in-place.  Call <code>bm.normal_update()</code> after each group of
        passes to keep face and vertex normals consistent for any downstream
        calculation that reads them (zone detection by normal direction,
        edge-angle-based sharp splits, etc.).
      </p>

      <h2>Uniform vs cotangent Laplacian</h2>
      <p>
        The difference is the weight assigned to each neighbour vertex when
        computing the smoothed position.
      </p>
      <pre>{`# Uniform Laplacian (smooth_vert)
# For vertex v with neighbours n_0 … n_k:
#   centroid = (n_0.co + n_1.co + … + n_k.co) / k
#   v.co = v.co + factor * (centroid - v.co)
#
# All neighbours count equally regardless of triangle shape or edge length.
# On an irregular mesh this can produce "lumpy" results: a vertex with many
# short edges is pulled more strongly than one with long edges because the
# centroid is biased by clustering.

# Cotangent Laplacian (smooth_laplacian_vert)
# For edge (v, n_i), let α_i and β_i be the angles at the two vertices
# OPPOSITE that edge in the two adjacent triangles:
#   w_i = (cot(α_i) + cot(β_i)) / 2
#   smooth_pos = Σ(w_i * n_i.co) / Σ(w_i)
#   v.co = v.co + lambda * (smooth_pos - v.co)
#
# Weights compensate for triangle shape: long thin edges near acute angles
# get lower weights.  On the same irregular mesh this produces far more
# uniform smoothing.  preserve_volume=True counteracts the inherent shrinkage
# by rescaling the smoothed region each pass to preserve local volume.`}</pre>
      <p>
        In practice: use <code>smooth_vert</code> for a quick relax of
        procedurally generated bumps or import noise where you don&apos;t care
        much about volume.  Use <code>smooth_laplacian_vert</code> with{" "}
        <code>preserve_volume=True</code> anywhere the original shape matters —
        character skin, organic props, terrain blend zones.
      </p>

      <h2>Zone detection by Z height</h2>
      <pre>{`# After deleting the southern hemisphere of a UV sphere, vertices
# fall into three altitude bands.  Collect each BEFORE perturbing:
collar_verts = [v for v in bm.verts if v.co.z <= ZONE_COLLAR_MAX]   # 0.16 m
blend_verts  = [v for v in bm.verts
                if ZONE_COLLAR_MAX < v.co.z <= ZONE_BLEND_MAX]       # 0.35 m
dome_verts   = [v for v in bm.verts if v.co.z > ZONE_BLEND_MAX]

# Collecting references BEFORE structural changes (perturbing, smoothing)
# keeps the lists valid: Python holds references to the same BMVert objects.
# The objects remain alive as long as bm is alive; their .co changes in-place.`}</pre>
      <p>
        The same pattern appears in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
          className={lk}
        >
          split_edges
        </Link>{" "}
        — collect edge references before any topological changes that would
        invalidate coordinate-based queries.  The UV sphere gives predictable Z
        positions from the cosine-latitude formula, making threshold arithmetic
        exact.
      </p>

      <h2>Applying smooth_vert in a loop</h2>
      <pre>{`# Perturb the blend zone first — make the smoothing effect visible
for v in blend_verts:
    theta = math.atan2(v.co.y, v.co.x)
    bump  = math.sin(theta * 7 + v.co.z * 22) * 0.022
    r = math.sqrt(v.co.x**2 + v.co.y**2)
    if r > 1e-5:
        v.co.x += bump * (v.co.x / r)
        v.co.y += bump * (v.co.y / r)
    v.co.z += math.sin(theta * 5 + v.co.z * 14) * 0.012

# Now relax in 5 passes
for _ in range(SV_ITERATIONS):
    bmesh.ops.smooth_vert(
        bm,
        verts=blend_verts,
        factor=SV_FACTOR,
        mirror_clip_x=False, mirror_clip_y=False, mirror_clip_z=False,
        clip_dist=1e-5,
        use_axis_x=True, use_axis_y=True, use_axis_z=True,
    )
bm.normal_update()

# Shrinkage test: measure centroid Z before / after
# With 5 passes at factor=0.5 on a 16×5 ring, Z centroid drops ~2–3 %.
# Acceptable for a blend zone; not acceptable for a skin mesh or terrain.
# That's when smooth_laplacian_vert with preserve_volume=True is the
# correct choice.`}</pre>
      <p>
        Each pass costs O(n) where n is the vertex count in{" "}
        <code>verts</code> — it does not traverse the full mesh.  Five passes
        at factor 0.5 reduces the original displacement by roughly
        (1 − 0.5)<sup>5</sup> ≈ 3 % of the original amplitude at the worst
        case, which is visually smooth for a transition zone.  Contrast the
        modifier path in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr"
          className={lk}
        >
          CorrectiveSmoothModifier
        </Link>
        , which runs every frame during deformation and is designed to restore
        rest-pose volume at posed joint angles — a different problem from the
        static-mesh relax shown here.
      </p>

      <h2>Applying smooth_laplacian_vert</h2>
      <pre>{`for _ in range(SLV_ITERATIONS):
    bmesh.ops.smooth_laplacian_vert(
        bm,
        verts=dome_verts,
        lambda_factor=SLV_LAMBDA,          # 0.5
        lambda_border=SLV_LAMBDA_BORDER,   # 0.2 — stiffer at boundary
        use_x=True,
        use_y=True,
        use_z=True,
        preserve_volume=True,
    )
bm.normal_update()

# lambda_border is applied specifically to vertices on boundary edges
# (edges with only one linked face).  Setting it lower than lambda_factor
# keeps the dome equator ring from drifting inward relative to the collar
# transition, preventing a visible "waist" artefact at the zone boundary.`}</pre>
      <p>
        <code>lambda_border</code> is easily overlooked.  If the smoothed zone
        contains any boundary edges — here the dome equator ring where the
        hemisphere was sliced — a high <code>lambda_border</code> causes those
        vertices to migrate further than interior ones, producing a visible
        pinch or flare at the zone boundary.  Set it to roughly 40 % of{" "}
        <code>lambda_factor</code> as a starting point, then reduce it toward 0
        if you see boundary drift.  This is analogous to the stiffness
        parameter in mesh-deformation cages described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr"
          className={lk}
        >
          MeshDeformModifier
        </Link>{" "}
        tutorial.
      </p>

      <h2>Hard normals on the collar after smoothing</h2>
      <pre>{`# After extrusion and smoothing, restore sharp normals on collar edges.
# split_edges creates duplicate vertices along the selected edges so
# adjacent faces no longer share vertices — this breaks the smooth-shade
# interpolation and produces the flat-face look characteristic of the
# hard collar zone.
collar_sharp = [
    e for e in bm.edges
    if any(v.co.z <= ZONE_COLLAR_MAX + 0.01 for v in e.verts)
    and e.calc_face_angle(0.0) > math.radians(30)
]
if collar_sharp:
    bmesh.ops.split_edges(bm, edges=collar_sharp)

# Per-face smooth flag for correct viewport shading
for f in bm.faces:
    f.smooth = (f.calc_center_median().z > ZONE_COLLAR_MAX)`}</pre>
      <p>
        The split_edges technique is covered in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
          className={lk}
        >
          split_edges tutorial
        </Link>
        .  Note the order here matters: split <em>after</em> smoothing, because
        splitting creates duplicate vertices that would be treated as additional
        neighbours by the Laplacian — smoothing into the split vertices would
        move them toward an average that includes their twin, pulling the split
        back closed.
      </p>

      <h2>mirror_clip for symmetric VRM meshes</h2>
      <pre>{`# When smoothing a half-mesh that will be mirrored (e.g. VRM character):
bmesh.ops.smooth_vert(
    bm,
    verts=blend_verts,
    factor=0.5,
    mirror_clip_x=True,   # snap verts within clip_dist of X=0 to X=0
    clip_dist=0.001,      # 1 mm clip distance
    use_axis_x=True, use_axis_y=True, use_axis_z=True,
)
# Verts at the seam plane are pinned to X=0 so the MirrorModifier
# merge threshold can weld them cleanly.  Without this, smooth_vert
# can drift the seam-line verts off the plane by sub-millimetre amounts
# that survive export but produce visible gaps in WebXR viewers.`}</pre>
      <p>
        This prevents seam-line vertices from drifting off the X=0 plane during
        smoothing — the same pitfall described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr"
          className={lk}
        >
          MirrorModifier
        </Link>{" "}
        tutorial where half-mesh seam verts must be precisely on the bisect
        plane for the merge to close cleanly.
      </p>

      <h2>Failure modes</h2>
      <pre>{`# 1. Isolated vertices — both ops assume each vert has at least one
#    linked face.  An isolated vert has no neighbours; the centroid
#    average is undefined and Blender skips it silently.
#    Fix: filter out isolated verts before passing to the op.
clean_verts = [v for v in target_verts if v.link_faces]

# 2. Non-manifold mesh — faces with more than two linked faces cause
#    incorrect cotangent calculation in smooth_laplacian_vert (the
#    "adjacent triangle" assumption breaks for non-manifold edges).
#    Fix: run bmesh.ops.dissolve_degenerate first, then check.

# 3. Over-smoothing — too many iterations or too high a factor/lambda
#    causes verts to converge toward a single point.  The volume-
#    preserving scale correction in smooth_laplacian_vert helps but
#    does not fully prevent shape collapse on very thin features.
#    Rule: stop when the mesh looks right; no formula guarantees it.

# 4. Zone drift — if blend_verts references are collected after a
#    translate/extrude, new geometry enters the zone set.  Always
#    collect zone references on the original topology.`}</pre>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.ops API Reference
          </a>{" "}
          — CC-BY-SA-4.0.{" "}
          Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.types reference
          </a>
          .
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0.{" "}
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>
          ,{" "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF 2.0 spec
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  id: "blender-tutorial-python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr",
  title:
    "Python bmesh.ops.smooth_vert + smooth_laplacian_vert — Uniform & Cotangent-Weighted Zone Smoothing: VRM Pauldron Blend (Blender 5.1)",
  description:
    "Apply zone-selective vertex smoothing entirely from Python: smooth_vert for iterative centroid relaxation and smooth_laplacian_vert with preserve_volume for shape-preserving cotangent-weighted passes — demonstrated on a three-zone VRM shoulder pauldron with hard collar, blend transition, and organic dome cap, exported as a WebXR GLB.",
  tags: [
    "blender",
    "blender-5.1",
    "bmesh",
    "python",
    "scripting",
    "smooth-vert",
    "smooth-laplacian-vert",
    "vertex-smoothing",
    "laplacian",
    "cotangent",
    "vrm",
    "hard-surface",
    "organic",
    "pauldron",
    "webxr",
    "glb",
    "export",
  ],
  body: Body,
  level: "intermediate",
});
