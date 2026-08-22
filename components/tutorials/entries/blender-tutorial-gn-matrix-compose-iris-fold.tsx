import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnMatrixComposeIrisFoldBody() {
  return (
    <>
      <p>
        Blender 4.3 promoted the <strong>Matrix socket</strong> from experimental
        to stable, giving Geometry Nodes a proper 4×4 homogeneous transform as a
        first-class field value.  Before that you could rotate instances with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower"
          className={lk}
        >
          Rotate Instances
        </Link>
        , but that node applies a rotation <em>relative</em> to the instance&apos;s
        existing orientation in a single frame — you cannot compose two rotations
        in different frames without nested groups or pivot gymnastics.  With{" "}
        <code>Compose Matrix</code> and <code>Multiply Matrices</code> you express
        the combined transform as a single matrix product, and the linear-algebra
        frame-change algebra is handled by the multiplication order rather than by
        a topology of intermediate nodes.  This tutorial builds an <em>iris fold</em>
        : N flat rectangular panels that share a common hinge at the world origin
        and fold upward simultaneously as a single animated parameter increases
        from 0 to π/2.
      </p>

      <p>
        The per-panel transform is <code>M_i&nbsp;=&nbsp;M_azim&nbsp;×&nbsp;M_fold</code>.
        Matrix multiplication is not commutative, so the order encodes intent.
        Reading right-to-left (as in standard linear algebra): M_fold is applied
        first, in the panel&apos;s <em>local</em> frame (before any radial rotation);
        M_azim is applied second, rotating the already-folded panel to its correct
        azimuthal position around the Z axis.  Reversing the order — M_fold&nbsp;×
        &nbsp;M_azim — would apply the fold in world space, causing all panels to
        tip in the same world direction regardless of their φ position (a parallel
        slat blind instead of an iris).  Each matrix is built via <code>Compose
        Matrix</code>, which takes a{" "}
        <strong>Rotation socket</strong> (not an Euler vector) produced by{" "}
        <code>Axis Angle to Rotation</code>: M_fold uses axis (1, 0, 0) + the
        animated fold angle; M_azim uses axis (0, 0, 1) + the per-instance
        azimuthal angle <code>φ_i&nbsp;=&nbsp;2π&nbsp;×&nbsp;i&nbsp;/&nbsp;N</code>{" "}
        derived from the Index field.  Translation and Scale sockets of{" "}
        <code>Compose Matrix</code> default to (0,0,0) and (1,1,1) respectively
        — omitting them yields a pure rotation matrix at no extra cost.  The
        product M_i is fed directly into{" "}
        <code>Set Instance Transform</code>, which{" "}
        <em>replaces</em> (not composes with) the instance&apos;s existing matrix,
        so the initial InstanceOnPoints placement at the origin is cleanly
        overwritten.  This replaces the entire TRS in one node — compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          per-cell hex-panel tutorial
        </Link>
        {" "}which applies per-face extrusions using individual Set Position offsets
        instead of matrix composition.  The matrix approach is more concise
        whenever you need to combine a rotation in one frame with a rotation in
        another — the matrix product encodes both in a single 16-float structure.
      </p>

      <p>
        The panel mesh itself is built inside the GN tree with a{" "}
        <code>Grid</code> node offset by PANEL_L/2 along Y (via
        Transform Geometry), so the root edge sits at the local origin and the
        tip edge is at local Y = PANEL_L.  When M_fold rotates the instance by
        θ around the X axis through the origin, the root edge stays put (it is
        ON the rotation axis) and the tip lifts to (0,{" "}
        PANEL_L·cos(θ), PANEL_L·sin(θ)).  After M_azim swings the panel to
        angle φ_i, all N tips converge to the same Z height —{" "}
        at θ = π/2 every tip is at Z = PANEL_L regardless of φ, which is the
        mathematical definition of the iris closing.  A practical failure mode:
        if you feed the fold angle as degrees rather than radians (easy to do
        when the modifier slider shows the value after subtype conversion), the
        iris will snap open or closed far too fast; always verify with a small
        value first (0.1 rad ≈ 5.7°).  Another gotcha is the node socket{" "}
        <em>identifier</em> used for keyframing — the modifier stores socket
        values under programmer identifiers like <code>Input_2</code> rather than
        display names, which is why the blueprint&apos;s{" "}
        <code>keyframe_fold()</code> function iterates{" "}
        <code>interface.items_tree</code> to resolve the identifier by name rather
        than hard-coding an index.  The same technique is essential whenever you
        export a GLB with baked GN animation: see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          GN UV unwrap + GLB export tutorial
        </Link>{" "}
        for the full export pipeline.  For spatially articulated rigs where
        successive joints must accumulate transforms along a chain (elbow →
        wrist → finger), the same Multiply Matrices pattern applies — and that
        is precisely what an armature does internally; see the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          IK robot-arm tutorial
        </Link>{" "}
        for the bones-based equivalent where the matrix chain is implicit in the
        parent–child hierarchy.  When you need to DECOMPOSE an existing object
        transform back into TRS (for instance to extract the world-space tip
        position of each panel after folding, to place a secondary mesh there),
        reach for the <code>Decompose Matrix</code> node — feed it the M_i
        product and read the Translation output at evaluation time.  That
        technique appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-separate-geometry-exploded-view"
          className={lk}
        >
          exploded-view tutorial
        </Link>
        , where per-piece transforms are decomposed to compute explosion offsets.
        The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/matrix/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender manual matrix nodes reference
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) documents the full family: Compose,
        Decompose, Invert, Multiply, Transform Point, Transform Direction, and
        Transform Normal — each serving a distinct algebraic role.  The{" "}
        <a
          href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#transformations"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF 2.0 transform specification
        </a>{" "}
        (Apache-2.0, Khronos Group) is the downstream consumer of any matrix
        you export: it defines the TRS decomposition order as Scale → Rotation →
        Translation, column-major, and requires a decomposable (non-shear)
        matrix — so avoid feeding a non-uniform-scale composed matrix into
        Set Instance Transform if you intend to export the result as animated
        GLB, as the shear will be silently lost at export time.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-matrix-compose-iris-fold",
  title:
    "GN Compose Matrix — Procedural Iris Fold (N-Petal Fan) (Blender 5.1)",
  tags: [
    "blender",
    "geometry-nodes",
    "matrix",
    "compose-matrix",
    "multiply-matrices",
    "set-instance-transform",
    "iris-fold",
    "animation",
    "instances",
    "glb",
    "webxr",
    "python",
  ],
  category: "tutorial",
  publishedOn: "2026-06-11",
  summary:
    "Blender 5.1 matrix socket nodes — Compose Matrix, Multiply Matrices, and " +
    "Set Instance Transform — to build a procedural N-petal iris fold. Each panel " +
    "gets M_i = M_azim × M_fold where M_fold is a Rotation_X by the animated fold " +
    "angle and M_azim is a Rotation_Z by 2π·i/N. Matrix multiplication order " +
    "encodes fold-in-local-frame semantics; wrong order gives a parallel-slat blind " +
    "instead of a closing iris.",
  body: GnMatrixComposeIrisFoldBody,
  libraryPath: "blends/geometry-nodes/gn-matrix-compose-iris-fold",
});
