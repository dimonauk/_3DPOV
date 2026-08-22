import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <code>MeshDeformModifier</code> builds a volumetric
        trilinear-coordinate basis — a voxel grid — that expresses every target
        vertex in terms of weighted cage vertices. Once bound, any transformation
        of the cage (shape keys, pose bones, direct edits) propagates
        automatically to the clothing mesh with no additional rigging. The cage
        can be any closed mesh topology, making it far more flexible than the
        grid-only Lattice modifier.
      </p>

      <h2>Volumetric binding: the maths</h2>
      <p>
        At bind time Blender voxelises the cage interior at{" "}
        <code>precision³</code> resolution. Each target vertex is located in
        this voxel grid and its position is expressed as a trilinear combination
        of the eight surrounding cage vertices — the same interpolation scheme
        used in GPU texture sampling. The result is stored per-vertex in the
        modifier. Afterwards, translating one cage vertex moves all bound target
        vertices proportionally to their stored weights.
      </p>
      <p>
        The <code>precision</code> property (2–10) controls the voxel grid
        resolution per axis. Precision 3 gives 27 voxels (fast, blocky
        influence); precision 6 gives 216 voxels (accurate, slower bind). For
        character clothing, 5–6 balances fidelity with bind time. Change
        precision after binding and it has no effect — rebind.
      </p>

      <h2>Why MeshDeform over Lattice for clothing</h2>
      <p>
        The Lattice modifier uses a regular grid as the cage, which works well
        for rectangular objects but poorly for organic forms. Fitting a tight
        grid around a torso produces large dead zones where grid verts have no
        nearby clothing verts, yielding mushy, imprecise influence. A hand-
        modelled cage follows body contours directly: the waist ring sits at the
        waist, the shoulder ring at the shoulder, so each region&apos;s voxels
        contain exactly the clothing geometry they should influence.
      </p>
      <p>
        Multiple garment layers can each carry their own MeshDeform modifier
        pointing at the same cage. Deform the cage once and every layer follows.
        This is the pattern used in real-time costume systems where a character
        might have an undershirt, a tunic, and a tabard all driven by a single
        low-poly body cage.
      </p>

      <h2>Binding requires a UI context override</h2>
      <p>
        The bind operation is performed via{" "}
        <code>bpy.ops.object.meshdeform_bind(modifier=&quot;…&quot;)</code>.
        This is a UI operator — it reads the active object and modifier from the
        context and will silently do nothing in a headless script unless the
        context is explicitly overridden.
      </p>
      <p>
        The correct pattern is:
      </p>
      <pre>{`with bpy.context.temp_override(
    object=cloth_obj,
    active_object=cloth_obj,
):
    bpy.ops.object.meshdeform_bind(modifier=MOD_NAME)`}</pre>
      <p>
        After this runs, <code>mod.is_bound</code> is <code>True</code>. Note
        that the operator <em>toggles</em>: calling it a second time when{" "}
        <code>is_bound</code> is already <code>True</code> unbinds, clearing all
        stored weight data. Use this to rebind after reshaping the cage.
      </p>

      <h2>The cage enclosure rule</h2>
      <p>
        Any target vertex that lies <em>outside</em> the cage at bind time
        receives zero influence and will never move regardless of cage
        deformation. The cage must be a watertight closed mesh that fully
        encloses every vertex of the clothing geometry.
      </p>
      <p>
        In the blueprint, the clothing is constructed at{" "}
        <code>CLOTH_SCALE = 1.04</code> of the cage radii so it is always
        slightly larger than the cage — meaning the cage voxels reach outward
        and enclose all cloth verts. An alternative approach for real garments:
        build the cage as a slightly inflated offset surface of the body, then
        lay the clothing inside it.
      </p>
      <p>
        After binding, a useful sanity check is to scrub to frame 1, set the
        cage to a large deformation, and verify that <em>all</em> visible cloth
        verts respond. If any cluster stays stationary, those verts were outside
        the cage at bind time — fix the cage mesh and rebind.
      </p>

      <h2>Shape key + cage animation pipeline</h2>
      <p>
        The blueprint adds a <strong>WaistPinch</strong> shape key to the cage
        that scales the waist ring to 65% of its original radius over frames
        1–30, then returns to rest by frame 60. The cloth follows the cage
        smoothly with no additional setup — MeshDeform propagates the shape key
        deformation automatically.
      </p>
      <p>
        This is the key workflow advantage for VRM: attach armature bones to
        the cage instead of directly to the cloth, or drive the cage with shape
        keys for morph-target style deformation. Either way, the cloth requires
        no skinning of its own.
      </p>

      <h2>Modifier stack ordering</h2>
      <p>
        MeshDeform should typically be the <em>last</em> modifier on the
        clothing stack, or at least after any topology-preserving modifiers. If
        a Subsurf runs <em>after</em> MeshDeform, the extra vertices introduced
        by Subsurf have no bind weights and will not deform. If Subsurf runs
        <em>before</em> MeshDeform, all the subdivided vertices are present at
        bind time and are correctly included. The golden rule: bind with the
        final topology the modifier will see.
      </p>

      <h2>Pre-export bake pattern for GLB / WebXR</h2>
      <p>
        MeshDeformModifier has no glTF equivalent — the cage object cannot be
        embedded in the runtime. Before exporting to GLB:
      </p>
      <ol>
        <li>Set the scene to the frame you want to bake.</li>
        <li>
          Duplicate the clothing object so the live modifier is preserved in
          the .blend.
        </li>
        <li>
          Obtain the evaluated (modifier-applied) mesh via{" "}
          <code>bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))</code>
          .
        </li>
        <li>Clear all modifiers on the duplicate and assign the baked mesh.</li>
        <li>Export the duplicate; delete it afterwards.</li>
      </ol>
      <p>
        The blueprint&apos;s <code>_export_glb()</code> function implements
        this pattern, baking at frame 30 (peak waist pinch) for a dramatic
        static export.
      </p>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-laplacian-deform-modifier-anchor-cage-secondary-motion-vrm-webxr"
            className={lk}
          >
            LaplacianDeformModifier — differential-coordinate cage & VRM tail
          </Link>{" "}
          — an alternative cage-style deformer using differential coordinates
          rather than volumetric weights; better for preserving local surface
          detail at the cost of a more constrained anchor setup.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr"
            className={lk}
          >
            ShrinkwrapModifier — PROJECT mode surface conform
          </Link>{" "}
          — complementary technique: once a garment is cage-bound, use
          Shrinkwrap on a secondary detail mesh (embroidery, buttons) to
          re-conform it to the deformed cloth surface.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr"
            className={lk}
          >
            CorrectiveSmoothModifier — joint-volume recovery
          </Link>{" "}
          — stack after MeshDeform to smooth out any cage-induced volume loss
          at pinch points, especially around tight waist or elbow cage rings.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-shape-key-data-block-morph-target-vrm-webxr"
            className={lk}
          >
            bpy.types.Key + ShapeKey — foreach_set morph target construction
          </Link>{" "}
          — understand the shape key API used to author the cage WaistPinch
          morph target in this blueprint.
        </li>
        <li>
          <Link href="/docs/INSTALL-SCAN-BLENDER" className={lk}>
            Holoflow WebXR Exporter — install & scan docs
          </Link>{" "}
          — the studio&apos;s export add-on that wraps the GLB bake pipeline
          used in <code>_export_glb()</code>.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender 5.1 Manual — Mesh Deform Modifier</strong> (CC-BY-SA
          4.0, Blender Foundation){" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/mesh_deform.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.MeshDeformModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.MeshDeformModifier API
          </a>
          . Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>
          ,{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <strong>
            Bounded Biharmonic Weights for Real-Time Deformation
          </strong>{" "}
          (Academic / public domain, Jacobson, Baran, Popović, Sorkine —
          SIGGRAPH 2011){" "}
          <a
            href="https://igl.ethz.ch/projects/bbw/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            igl.ethz.ch/projects/bbw
          </a>
          . The theoretical grounding for cage-based deformation using
          biharmonic weights; Blender&apos;s trilinear voxel approach is a
          faster approximation of the same principle. Related:{" "}
          <a
            href="https://github.com/libigl/libigl"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            libigl
          </a>{" "}
          — the open-source geometry processing library that implements the
          exact BBW solver referenced in the paper.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr",
  title:
    "Python bpy.types.MeshDeformModifier — Volumetric Cage Bind, Operator Context Override & VRM Clothing Deformation for WebXR (Blender 5.1)",
  description:
    "Build a low-poly torso cage, bind VRM clothing to it via the trilinear voxel basis, animate a waist-pinch shape key, and bake the deformed cloth to a Draco-compressed GLB — all from headless Python in Blender 5.1.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "modifier",
    "mesh-deform",
    "cage",
    "vrm",
    "clothing",
    "deformation",
    "shape-keys",
    "webxr",
    "glb",
  ],
  libraryPath:
    "blends/scripting/python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr",
  Body,
  keyInsights: [
    "MeshDeformModifier accepts any closed mesh as the cage — not just a grid — giving artists full control over influence field shape",
    "Binding builds a trilinear voxel basis: each target vertex is weighted to the eight surrounding cage vertices at precision³ resolution",
    "bpy.ops.object.meshdeform_bind() requires a temp_override context in headless scripts — without it the operator silently does nothing",
    "The operator toggles: calling it again when is_bound=True clears all bind data — use this to rebind after cage edits",
    "Any target vertex outside the cage at bind time gets zero influence and will never deform — the cage must fully enclose the clothing",
    "Before GLB export: bake via new_from_object(evaluated_get(depsgraph)) at the desired frame — the cage is not exported with the GLB",
  ],
});
