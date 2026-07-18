import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Linear blend skinning shifts the weight of deformation to joint volumes.
        Physics simulations solve spring constraints every frame. Both are valid
        tools — but for a VRM tail, ear, or hair accessory that needs smooth,
        organic flex from a single driver point, <code>LaplacianDeformModifier</code>{" "}
        offers a lighter path: solve a sparse linear system once at bind time,
        then move one Empty to propagate a mathematically fair curve through
        the entire mesh. No weight painting across the body; no simulation
        cache to bake.
      </p>

      <h2>Differential coordinates — the core idea</h2>
      <p>
        A mesh vertex can be described in two ways: by its absolute world
        position, or by the{" "}
        <em>delta between it and the centroid of its one-ring neighbours</em> —
        its Laplacian vector. That second description encodes the local
        curvature and proportional spacing of the mesh without caring where
        in space the mesh happens to sit.
      </p>
      <p>
        When you <em>bind</em> the modifier, Blender factors the Laplacian
        matrix of the rest-pose mesh. After bind, moving an{" "}
        <em>anchor vertex</em> changes the target Laplacian, and the solver
        finds the position assignment that minimises the change to all other
        differential coordinates. The result: a displacement at the tip
        propagates as a smooth, volume-preserving arc toward the anchored root,
        with no abrupt creases at intermediary rings.
      </p>

      <h2>Vertex groups and what they mean</h2>
      <p>
        The modifier takes a single vertex group whose weights encode the role
        of each vertex:
      </p>
      <ul>
        <li>
          <strong>Weight 1.0</strong> — hard anchor. The solver treats these as
          fixed points. Move them and everything else follows; leave them alone
          and the mesh does not drift at the root.
        </li>
        <li>
          <strong>Weight 0.0</strong> — free handle. These vertices can be
          displaced by a Hook or driver. The Laplacian solve propagates that
          displacement through all intermediate vertices.
        </li>
      </ul>
      <p>
        Intermediate weights between 0 and 1 create soft pinning — the vertex
        can move but resists displacement in proportion to its weight. Useful
        for a mid-tail volume-lock when the tail is unusually long.
      </p>

      <h2>Stack order — the one rule that cannot be broken</h2>
      <p>
        A <code>HookModifier</code> moves the tip ring by translating it to the
        Empty&apos;s world position.{" "}
        <code>LaplacianDeformModifier</code> reads the current vertex positions
        as its &ldquo;displaced handles&rdquo; and solves accordingly.
        Therefore the Hook <em>must</em> sit at a lower index (evaluated first)
        than the Laplacian modifier:
      </p>
      <pre>{`Stack index 0 — HookModifier   (moves tip ring to Empty)
Stack index 1 — LaplacianDeform (solves full mesh from that moved tip)`}</pre>
      <p>
        Reversing the order produces no visible deformation: the Laplacian
        solver runs first, sees an unmodified tip, solves a trivial identity
        system, and the Hook then displaces only those tip verts as a rigid
        cluster with no propagation down the shaft.
      </p>
      <p>
        In the blueprint, after adding both modifiers the script calls{" "}
        <code>modifier_move_up</code> until the Hook sits at index 0. The direct
        data path (setting <code>obj.modifiers[0]</code>) does not exist in
        Blender&apos;s modifier API; the operator is the only path.
      </p>

      <h2>Bind — when to call it, when to rebind</h2>
      <p>
        <code>bpy.ops.object.laplaciandeform_bind(modifier=mod.name)</code>{" "}
        factors the sparse Laplacian matrix and caches it on the modifier. It
        runs in milliseconds for meshes under 10k vertices (the CHOLMOD sparse
        solver scales as O(n·bandwidth)). Rules for rebinding:
      </p>
      <ul>
        <li>
          Rebind after any topology change (added/deleted vertices or edges).
          The matrix dimension changes and the cached factor is invalid.
        </li>
        <li>
          Rebind after moving the object to a different rest pose. The
          differential coordinates are computed from the rest-pose positions;
          if the rest pose shifts, the cached matrix produces the wrong arc.
        </li>
        <li>
          Do <em>not</em> rebind just to change the Empty location. The
          modifier re-solves the system every frame using the cached matrix;
          only the right-hand side (the handle positions) changes, not the
          matrix itself.
        </li>
      </ul>
      <p>
        The headless bind pattern uses{" "}
        <code>bpy.context.temp_override(active_object=obj, object=obj)</code>,
        available since Blender 3.2. Without the override, the operator raises a
        poll error because no 3D Viewport is active.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre>{`# 1. Build a tapered cylinder (root radius 0.08 m → tip 0.015 m)
#    purely via bmesh — no operator context required.
tail = _build_tapering_cylinder(MESH_NAME, TAIL_LENGTH,
                                TAIL_ROOT_R, TAIL_TIP_R,
                                RING_SEGS, LENGTH_SEGS)

# 2. Assign vertex groups
#    ANCHOR_GROUP: root two rings weight=1.0; all others weight=0.0
#    HANDLE_GROUP: tip ring weight=1.0 — used by HookModifier
_assign_vertex_groups(tail)

# 3. Create the driver Empty at tip position
empty = bpy.data.objects.new(EMPTY_NAME, None)
empty.location = Vector((0.0, 0.0, TAIL_LENGTH))
bpy.context.scene.collection.objects.link(empty)

# 4. HookModifier (index 0) — links tip ring to Empty
_add_hook_modifier(tail, empty, HANDLE_GROUP)

# 5. LaplacianDeformModifier (index 1) — Laplacian solve
mod = _add_laplacian_deform(tail)    # vertex_group=ANCHOR_GROUP

# 6. Bind — must happen after stack is finalised
_bind_laplacian_deform(tail, mod.name)

# 7. Keyframe Empty location (frames 1, 25, 50)
_keyframe_arc(tail, empty)

# 8. Export GLB at frame 25 (peak deflection)
_export_glb(tail, GLB_PATH, frame=25)`}</pre>

      <h2>Exporting the deformed mesh</h2>
      <p>
        <code>export_apply=True</code> in the glTF exporter collapses both the
        HookModifier and the LaplacianDeformModifier at the chosen frame,
        writing a static triangle mesh into the GLB. The source{" "}
        <code>.blend</code> retains the live modifier stack unchanged. This is
        the correct WebXR staging pattern: the GLB viewer does not need to
        know anything about Laplacian solvers.
      </p>
      <p>
        For a GLB that carries the <em>animation</em>, a different approach is
        required: bake the Laplacian deformation to shape keys (one per frame)
        or to a bone-driven rig, then export with{" "}
        <code>export_animations=True</code>. The current blueprint exports a
        single frame because shape key baking at 50 frames and 8-segment rings
        inflates the GLB minimally, but for longer animations the bake-to-rig
        path is preferred.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Modifier shows &ldquo;No vertex group&rdquo; after bind</strong> —
          the group was renamed or removed. Reassign <code>mod.vertex_group</code>{" "}
          and rebind.
        </li>
        <li>
          <strong>Tip ring snaps to origin instead of following Empty</strong> —
          the HookModifier&apos;s{" "}
          <code>matrix_inverse</code> is identity (not set). This happens when the
          Hook is added before the object has its transforms applied. Apply scale
          and rotation to the mesh before adding the Hook, or set{" "}
          <code>hook.matrix_inverse = obj.matrix_world.inverted()</code> manually.
        </li>
        <li>
          <strong>Laplacian solve produces inverted normals</strong> — one or
          more root anchor vertices ended up at weight 0 (accidentally free).
          Check the vertex group in Weight Paint mode; root two rings must show
          solid blue (weight=1.0).
        </li>
        <li>
          <strong><code>laplaciandeform_bind</code> returns CANCELLED</strong> —
          the mesh has non-manifold edges (T-junctions, holes) or fewer than
          two vertex groups. Manifold topology is required for the Laplacian
          matrix to be full-rank.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr" className={lk}>
            HookModifier — vertex bind to Empty, headless matrix_inverse pattern
          </Link>{" "}
          — the upstream step this tutorial builds on.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr" className={lk}>
            CorrectiveSmoothModifier — Laplacian joint-volume recovery
          </Link>{" "}
          — another Laplacian-based modifier; contrast the two approaches.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr" className={lk}>
            SkinModifier — wire-to-mesh character blockout
          </Link>{" "}
          — build the base mesh that accessories like this tail attach to.
        </li>
        <li>
          <Link href="/docs/INSTALL-SCAN-BLENDER" className={lk}>
            Holoflow WebXR Exporter — install &amp; scan
          </Link>{" "}
          — +Y up, Draco L6, holoflow:facet flag conventions used in this blueprint.
        </li>
        <li>
          <Link href="/docs/BLENDER-EXTENSIONS" className={lk}>
            Blender Extensions platform notes
          </Link>{" "}
          — relevant when wrapping this modifier into a reusable extension.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender Manual — LaplacianDeform Modifier</strong> (CC-BY-SA-4.0,
          Blender Foundation){" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/laplacian_deform.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          . Related:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.LaplacianDeformModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.LaplacianDeformModifier API
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
          <strong>KhronosGroup/glTF-Blender-IO</strong> (Apache-2.0, Khronos Group){" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF-Blender-IO
          </a>
          . Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Sample-Assets
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-laplacian-deform-modifier-anchor-cage-secondary-motion-vrm-webxr",
  title:
    "Python bpy.types.LaplacianDeformModifier — Anchor-Driven Secondary Motion: Differential Coordinates, Hook-to-Empty Tip Drive & VRM Tail GLB for WebXR (Blender 5.1)",
  description:
    "Solve a sparse Laplacian system over a tapering tail mesh — anchor the root rings, drive the tip with an Empty via HookModifier, bind once, export a posed GLB for WebXR. No weight painting, no physics cache.",
  date: "2026-07-18",
  topic: "scripting",
  tags: ["blender", "python", "modifier", "laplacian", "deform", "vrm", "webxr", "glb"],
  libraryPath:
    "blends/scripting/python-bpy-laplacian-deform-modifier-anchor-cage-secondary-motion-vrm-webxr",
  Body,
  keyInsights: [
    "LaplacianDeform stores differential coordinates (vertex vs one-ring centroid) — displacement at any anchor propagates as a smooth arc, not a rigid shift",
    "Vertex group weight=1.0 = hard anchor (root); weight=0.0 = free handle (tip driven by Hook)",
    "HookModifier must be index 0 (evaluated before LaplacianDeform at index 1); reversed order produces no propagation",
    "Bind factors the sparse Laplacian matrix once; rebind only after topology or rest-pose changes — not for every handle move",
    "Headless bind requires bpy.context.temp_override(active_object=obj); no 3D Viewport context needed",
    "export_apply=True bakes both Hook and LaplacianDeform at the chosen frame into a static GLB without touching the .blend stack",
  ],
});
