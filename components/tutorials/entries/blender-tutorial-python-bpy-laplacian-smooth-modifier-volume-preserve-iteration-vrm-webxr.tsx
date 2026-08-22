import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>LaplacianSmoothModifier</strong> repositions each vertex toward
        the weighted centroid of its one-ring neighbours, iterated N times. It
        is a purely geometric operation — it moves vertices, not normals — and
        it is non-destructive: the modifier stack stays live, the base mesh is
        unchanged, and you can dial the iteration count up or down at any point
        without rebaking. This makes it the right first choice for cleaning up
        boolean residue, sculpt-level micro-surface noise, or the jagged equator
        that a parametric cut leaves on a VRM body panel.
      </p>
      <p>
        This tutorial builds a cylindrical VRM body panel whose equatorial zone
        has been given a deliberate wavy perturbation to simulate boolean
        aftermath. Three GLB snapshots baked at 0, 3, and 6 iterations
        demonstrate the progression from jagged to organic, while a vertex-group
        mask pins the seam rings so UV islands stay valid across all passes.
      </p>

      <h2>Cotangent weights vs uniform weights</h2>
      <p>
        The modifier&rsquo;s <code>use_normalized</code> switch controls how
        each neighbour is weighted in the centroid computation.
      </p>
      <pre>
        <code>{`# use_normalized = False  (uniform)
centroid = sum(neighbour.co for neighbour in one_ring) / len(one_ring)

# use_normalized = True  (cotangent — Laplace-Beltrami operator)
#
# Each directed edge (v_i → v_j) is weighted by:
#   w_ij = 0.5 × (cot(α_ij) + cot(β_ij))
# where α and β are the angles opposite that edge in its two adjacent faces.
#
# Implication: an edge sitting in near-equilateral triangles gets weight ≈1;
# an edge in a thin sliver gets weight → ∞ (collapsed when clamped).
# At equal weights the normalised and uniform results are identical.
centroid = sum(w_ij * v_j.co for v_j in one_ring) / sum(weights)`}</code>
      </pre>
      <p>
        Uniform weights have a systematic area bias: small quads shrink faster
        than large ones because each of the four neighbours is at full weight
        regardless of the face area around the shared edges. Cotangent weights
        account for face geometry, so a well-triangulated mesh will smooth
        isotropically — equal effect per unit area everywhere. For organic VRM
        surfaces use <code>use_normalized=True</code> always. Uniform weights
        are occasionally useful on regular grid meshes where the bias is
        precisely zero.
      </p>

      <h2>Volume collapse and the preserve flag</h2>
      <p>
        Every Laplacian pass moves vertices inward (toward their neighbours)
        because the centroid of a convex set lies strictly inside the convex
        hull. Iterate long enough without correction and the mesh shrinks to a
        point — the classic soap-bubble collapse. The{" "}
        <code>use_volume_preserve</code> flag measures the volume before and
        after each pass and applies a uniform scale correction to restore it:
      </p>
      <pre>
        <code>{`# Blender internal (simplified):
vol_before = bm.calc_volume()
laplacian_pass(bm, lambda_factor, normalized)
vol_after  = bm.calc_volume()
scale      = (vol_before / vol_after) ** (1 / 3)
for v in bm.verts:
    v.co = centre + scale * (v.co - centre)`}</code>
      </pre>
      <p>
        The rescaling is isotropic — it cannot preserve local volume at concave
        pockets while expanding convex protrusions. For that level of control
        use{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr"
          className={lk}
        >
          CorrectiveSmoothModifier
        </Link>{" "}
        which anchors to a bind-pose snapshot. For the current clean-up use
        case, global volume preservation is sufficient.
      </p>

      <h2>Setting up the modifier via Python</h2>
      <pre>
        <code>{`import bpy

mod = obj.modifiers.new(name="LapSmooth", type='LAPLACIANSMOOTH')

# Iteration count — each pass moves vertices fraction lambda toward centroid.
# 4–8 passes sufficient for boolean cleanup; >12 risks smoothing out design intent.
mod.iterations = 6

# Cotangent-weighted Laplacian — correct for irregular organic meshes.
mod.use_normalized = True

# Global volume correction after each pass — prevents soap-bubble shrink.
mod.use_volume_preserve = True

# Blend factor: 0.5 is the Taubin lambda.
# Lower lambda + more iterations = smoother result with fewer oscillations.
mod.lambda_factor = 0.5

# Per-axis flags — all True for uniform spatial smoothing.
# Setting use_z=False keeps height bands at fixed Y positions (useful for
# keeping horizontal seam rings exactly co-planar without a vertex group).
mod.use_x = True
mod.use_y = True
mod.use_z = True

# Vertex group mask — weight 0.0 = pinned, 1.0 = fully smoothed.
# Assign the group name as a string; the group must already exist on obj.
mod.vertex_group = "smooth_mask"`}</code>
      </pre>

      <h2>Building the seam-pin vertex group</h2>
      <p>
        UV seams must not drift during smoothing — if the seam ring moves, the
        UV islands it anchors tear open and the texture mapping breaks in the
        GLB viewer. Assign weight&nbsp;0.0 to any vertex that must stay fixed:
      </p>
      <pre>
        <code>{`# Create the group
vg = obj.vertex_groups.new(name="smooth_mask")

# Identify seam-ring indices (top and bottom cap rings in this example)
seam_verts = [v.index for v in mesh.vertices if abs(v.co.y) > height/2 - 0.02]
body_verts  = [v.index for v in mesh.vertices if v.index not in seam_verts]

vg.add(body_verts,  1.0, 'REPLACE')  # smooth freely
vg.add(seam_verts,  0.0, 'REPLACE')  # pin in place`}</code>
      </pre>
      <p>
        After assigning the group to <code>mod.vertex_group</code>, switch to
        Weight Paint mode to verify: body vertices should be red (1.0), seam
        ring vertices deep blue (0.0). Any vertex at an intermediate weight will
        be partially smoothed — useful for a gradual transition zone between
        rigid and free geometry.
      </p>

      <h2>Baking snapshots for comparison</h2>
      <p>
        The modifier is non-destructive, but GLB export requires a resolved
        mesh. The standard pattern is depsgraph evaluation on a temporary
        duplicate:
      </p>
      <pre>
        <code>{`def bake_at_iterations(obj, n_iter, export_path):
    dup = obj.copy()
    dup.data = obj.data.copy()
    bpy.context.collection.objects.link(dup)
    dup.modifiers['LapSmooth'].iterations = n_iter

    bpy.context.view_layer.update()
    dg      = bpy.context.evaluated_depsgraph_get()
    eval_ob = dup.evaluated_get(dg)
    baked   = bpy.data.meshes.new_from_object(eval_ob, depsgraph=dg)

    dup.data = baked
    dup.modifiers.clear()
    bpy.context.view_layer.objects.active = dup
    dup.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
        export_apply=True,
        use_selection=True,
    )
    dup.select_set(False)
    bpy.data.objects.remove(dup, do_unlink=True)
    bpy.data.meshes.remove(baked)`}</code>
      </pre>

      <h2>Failure modes</h2>
      <p>
        <strong>Mesh explodes or inverts</strong> — <code>lambda_factor</code>{" "}
        above 1.0 overshoots the centroid each pass; keep it at 0.5 or lower.
        Negative values produce an anti-smoothing (sharpening) pass, which can
        be useful but diverges quickly at high iterations.
      </p>
      <p>
        <strong>Seam ring drifts anyway</strong> — the vertex group weight was
        written before the modifier was added but the modifier&rsquo;s{" "}
        <code>vertex_group</code> string was not assigned. Confirm{" "}
        <code>mod.vertex_group == &quot;smooth_mask&quot;</code> after the
        assignment.
      </p>
      <p>
        <strong>Cotangent weights give no visible difference from uniform</strong>{" "}
        — the mesh is already close to equilateral triangles. On a well-
        subdivided sphere the two modes are nearly identical. The difference
        matters most on meshes with highly irregular face areas, such as the
        output of a boolean operation or a remesh that left needle triangles.
      </p>
      <p>
        <strong>Volume preserve causes a visible size jump</strong> — the first
        pass at high <code>lambda_factor</code> removes a large volume chunk
        before correction; the rescale makes it jump outward visibly. Fix by
        reducing lambda to 0.2 and increasing iterations proportionally.
      </p>

      <h2>Distinguishing related modifiers</h2>
      <p>
        Three Blender modifiers share the word &ldquo;smooth&rdquo; but do
        fundamentally different things:
      </p>
      <ul>
        <li>
          <strong>LaplacianSmoothModifier</strong> — moves geometry vertices
          toward their one-ring centroid. Affects silhouette and surface flow.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr"
            className={lk}
          >
            CorrectiveSmoothModifier
          </Link>{" "}
          — anchors to a bind-pose snapshot. Smooths only the delta from that
          pose, repairing deformation artefacts at joints without touching the
          rest pose.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
            className={lk}
          >
            SmoothByAngleModifier
          </Link>{" "}
          — does not move any vertex. Sets the custom split-normal threshold
          so edges below the angle limit appear smooth in shading without
          topology changes.
        </li>
      </ul>
      <p>
        The destructive equivalent inside bmesh is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr"
          className={lk}
        >
          bmesh.ops.smooth_vert + smooth_laplacian_vert
        </Link>{" "}
        tutorial. Use the bmesh path when you need to bake specific zones
        mid-pipeline and then continue operating on the modified mesh in the same
        bmesh context; use the modifier when you want to keep the operation
        non-destructive and re-parametrisable.
      </p>

      <h2>Cross-references</h2>
      <p>
        The vertex-group mask that pins seam rings is built using the same
        weight-assignment API shown in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr"
          className={lk}
        >
          VertexWeightEdit + VertexWeightMix — S-curve remap & group blend
        </Link>{" "}
        tutorial, where the weight pipeline is driven by proximity and curve
        remapping. For the full export-prep modifier stack that triangulates and
        splits sharp edges before GLB output, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
          className={lk}
        >
          bmesh.ops.split_edges — sharp-edge split & UV seam co-location
        </Link>{" "}
        tutorial; LaplacianSmooth runs before the split pass so the smoother
        face distribution feeds a cleaner seam placement. For the
        depsgraph-evaluation pattern used to snapshot GLBs from a live modifier
        stack, see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export"
          className={lk}
        >
          Python depsgraph — evaluated geometry, GN instances & batch GLB export
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/deform/laplacian_smooth.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Laplacian Smooth Modifier — Blender Manual 5.1
          </a>{" "}
          — CC-BY-SA-4.0. Related project:{" "}
          <a
            href="https://projects.blender.org/blender/blender-manual"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender-manual
          </a>
          .
        </li>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.LaplacianSmoothModifier.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bpy.types.LaplacianSmoothModifier — Python API 5.1
          </a>{" "}
          — CC-BY-SA-4.0. Related project:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender
          </a>
          .
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0. Related project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Sample-Assets
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-laplacian-smooth-modifier-volume-preserve-iteration-vrm-webxr",
    title:
      "Python bpy.types.LaplacianSmoothModifier — Cotangent Weights, Volume-Preserve Iteration & Seam-Pin Mask: VRM Panel Cleanup for WebXR (Blender 5.1)",
    date: "2026-07-20",
    topics: ["blender", "scripting", "vrm", "webxr"],
    description:
      "Apply LaplacianSmoothModifier to a boolean-residue VRM panel: cotangent (normalised) vs uniform weights, use_volume_preserve to prevent soap-bubble shrinkage, lambda_factor iteration trade-off, and a vertex-group seam pin — three GLB snapshots at 0/3/6 iterations for direct comparison.",
  },
  {
    files: [
      {
        label: "blueprint.py",
        language: "python",
        path: "public/library/blends/scripting/python-bpy-laplacian-smooth-modifier-volume-preserve-iteration-vrm-webxr/blueprint.py",
      },
      {
        label: "record.py",
        language: "python",
        path: "public/library/blends/scripting/python-bpy-laplacian-smooth-modifier-volume-preserve-iteration-vrm-webxr/record.py",
      },
    ],
    body: <Body />,
  }
);
