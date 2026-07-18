import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>SolidifyModifier</code> extrudes a surface mesh into a fully
        closed 3-D shell by generating an inner face for each outer face and
        rim quads that seal the open boundary. This is the correct way to
        script panel-line props for VRM accessories and hard-surface WebXR
        assets: it keeps the modifier stack non-destructive until GLB export,
        where <code>export_apply=True</code> collapses it into final geometry.
      </p>
      <p>
        This tutorial builds a faceted pauldron (shoulder armour plate): a
        partial cylindrical arc constructed from{" "}
        <code>bmesh.verts.new</code> + <code>bm.faces.new</code>, then
        solidified in SIMPLE mode. Setting{" "}
        <code>material_offset_rim=1</code> routes the rim faces to a second
        material slot — the gold-trim panel-line effect — with no manual face
        assignment. A <code>WeightedNormalModifier</code> stacked immediately
        after cleans up corner-normal artefacts on the narrow rim quads.
      </p>

      <h2>SolidifyModifier API</h2>
      <pre>{`sol = ob.modifiers.new("Solidify", 'SOLIDIFY')

# Mode
sol.solidify_mode = 'SIMPLE'       # correct for flat/faceted meshes
sol.solidify_mode = 'NON_MANIFOLD' # UI: "Complex" — sculpted or SubD geometry

# Geometry
sol.thickness   = 0.0038  # metres — 3.8 mm shell
sol.offset      = -1.0    # -1 = inner shell inward, 0 = centred, +1 = outer

# Even thickness — prevents inner collapse on curved surfaces
sol.use_even_offset = True  # SIMPLE mode only

# Rim (boundary closure)
sol.use_rim      = True   # generate closing quads — required for WebXR
sol.use_rim_only = False  # True = suppress inner shell (outline silhouette only)

# Two-material panel line
sol.material_offset_rim = 1  # rim → slot 1 (contrast trim material)
sol.material_offset     = 0  # inner shell → slot 0 (match outer)`}</pre>
      <p>
        The <code>material_offset_rim</code> shift is additive: if the outer
        face is in slot 0, the rim is slot 0 + 1 = slot 1. If the base mesh
        uses multiple material slots you can chain offsets — each slot on the
        inner shell is offset by <code>material_offset</code> from the
        corresponding outer slot.
      </p>

      <h2>SIMPLE vs NON_MANIFOLD (Complex)</h2>
      <pre>{`# SIMPLE — per-vertex averaged-normal offset
sol.solidify_mode   = 'SIMPLE'
sol.use_even_offset = True    # even thickness on curves

# NON_MANIFOLD — manifold-boundary tracing
sol.solidify_mode              = 'NON_MANIFOLD'
sol.nonmanifold_offset_mode    = 'EVEN'   # FIXED | EVEN | CONSTRAINTS
sol.nonmanifold_boundary_mode  = 'FLAT'   # NONE  | ROUND | FLAT`}</pre>
      <p>
        SIMPLE with <code>use_even_offset</code> handles the vast majority of
        hard-surface cases. NON_MANIFOLD is worth switching to when the inner
        shell self-intersects on tight concave valleys — for example, a
        sculpted character torso or a SubD cage with deep creases. For
        flat-faced faceted props the difference is invisible; SIMPLE is faster.
      </p>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print"
        >
          Solidify: Shell & Architecture 3D Print
        </Link>{" "}
        for the non-Python (modifier UI) version of this workflow applied to
        architectural cross-sections and 3D-print wall thickness.
      </p>

      <h2>Even thickness — why it matters on curves</h2>
      <p>
        On a cylindrical surface of outer radius R, the inner shell lies at R
        − t. Without even-offset correction, the per-vertex normal at the
        concave end of an arc points inward. Adjacent normals diverge, so the
        SIMPLE offset overshoots at the concave tip and can push vertices past
        the centre of curvature, inverting the inner shell.{" "}
        <code>use_even_offset=True</code> projects each vertex displacement
        onto the local tangent plane before applying thickness, keeping the
        wall visually uniform across the entire arc.
      </p>
      <pre>{`# Flat panel — even_offset irrelevant; disable to save eval time
sol.use_even_offset = False

# Cylindrical pauldron at R=0.11 m, thickness=0.004 m
# inner radius = 0.106 m; offset ≈ 3.6% of R — marginal but visible
sol.use_even_offset = True

# Tight torus cross-section, thickness ≈ 30% of R — even_offset essential
sol.use_even_offset = True`}</pre>

      <h2>Rim cap and the WebXR requirement</h2>
      <p>
        WebXR renderers back-face cull by default. An open mesh (a surface
        without boundary quads) appears intact in Blender because the viewport
        draws both sides; in Three.js or Babylon it shows gaps at every
        boundary edge. <code>use_rim=True</code> seals those boundaries
        unconditionally — always enable it for any prop exported to GLB.
      </p>
      <pre>{`# use_rim_only suppresses the inner shell entirely.
# This is useful for flat silhouette outlines (toon ink) or print-test
# geometry where only the rim cross-section matters.
sol.use_rim_only = True   # outer face + rim only — no inner face generated`}</pre>
      <p>
        For toon outlines that use the rim as the ink edge, compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-wireframe-modifier-toon-ink-geometry-webxr"
        >
          WireframeModifier — Toon Ink Geometry
        </Link>
        . Solidify with <code>use_rim_only</code> preserves the original
        surface faces and adds rim closure, whereas Wireframe converts all
        edges to tube quads and discards the original faces. Pick Solidify for
        shell-and-rim props; Wireframe for a pure edge-mesh skeleton.
      </p>

      <h2>Material slot assignment</h2>
      <pre>{`# Slot layout on the mesh:
#   slot 0  →  mat_shell  (steel-blue metallic plate)
#   slot 1  →  mat_rim    (gold metallic trim)

me.materials.append(mat_shell)  # slot 0
me.materials.append(mat_rim)    # slot 1

sol.material_offset_rim = 1     # rim faces = outer slot + 1 = slot 1
sol.material_offset     = 0     # inner shell = outer slot + 0 = slot 0`}</pre>
      <p>
        In the exported GLB the two material slots become two separate glTF
        primitives within the same mesh node. Three.js assigns a separate
        draw call per primitive; Draco compression is applied per-primitive.
        Both materials export correctly with{" "}
        <code>export_apply=True</code> and{" "}
        <code>export_materials=&apos;EXPORT&apos;</code>.
      </p>
      <p>
        For bevel weight and edge chamfer interaction with this rim, see{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
        >
          BevelModifier — Edge-Weight Chamfer
        </Link>
        . The canonical hard-surface pipeline is Solidify → Bevel → Weighted
        Normal in that modifier order: Solidify adds the shell, Bevel chamfers
        the outer rim and inner step edges, Weighted Normal cleans all normals
        in one pass.
      </p>

      <h2>WeightedNormal after Solidify</h2>
      <pre>{`# Solidify leaves averaged normals at rim corners.
# On a narrow rim quad adjacent to a large outer face, the averaged normal
# pulls strongly toward the outer face and produces dark shadowing.
wn = ob.modifiers.new("WNorm", 'WEIGHTED_NORMAL')
wn.mode       = 'FACE_AREA'  # weight by face area — large faces dominate
wn.weight     = 100
wn.keep_sharp = True         # preserves sharp edges set on the boundary

# Stack order: Solidify MUST come before WeightedNormal.
# WN reads the geometry it receives — it must see the full shell+rim mesh.`}</pre>
      <p>
        The <code>keep_sharp</code> flag tells WeightedNormal to respect any
        sharp-edge marks on the boundary. Without it, the modifier re-smooths
        across the shell/rim boundary, removing the crisp corner that reads as
        machined metal. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr"
        >
          WeightedNormalModifier — Face-Area & Corner-Angle Modes
        </Link>{" "}
        for the full normal-stack explanation.
      </p>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath        = bpy.path.abspath("//hf_pauldron_shell.glb"),
    export_format   = 'GLB',
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format = 'WEBP',
    export_apply    = True,      # collapses Solidify + WN into final mesh
    export_materials = 'EXPORT',
    export_yup      = True,      # Holoflow Studio: +Y up
)`}</pre>
      <p>
        The two-material mesh (shell + rim) exports as two glTF primitives.
        Each receives independent Draco compression; the index buffers are
        separate. The rim primitive is typically small (
        <code>2 × (COLS_U + ROWS_V) × 2</code> triangles for a grid surface)
        so its Draco overhead is negligible.
      </p>
      <p>
        For batch GLB export of VRM accessories across multiple objects, see{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
        >
          BooleanModifier + WeldModifier — Compound-Body Prop Construction
        </Link>
        . Boolean removes interior faces before Solidify sees the mesh; Weld
        merges boundary duplicates after; this three-modifier stack produces
        clean shells from compound source geometry.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.SolidifyModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.SolidifyModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — full property reference for{" "}
          <code>solidify_mode</code>, <code>use_even_offset</code>,{" "}
          <code>nonmanifold_offset_mode</code>,{" "}
          <code>nonmanifold_boundary_mode</code>,{" "}
          <code>material_offset_rim</code>. Related: projects.blender.org
          Blender source modifier-solidify.cc, developer.blender.org Solidify
          Complex mode design thread.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/solidify.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Solidify Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — diagrams of Simple vs
          Complex modes, rim boundary visualisations, material offset chart,
          known limitations with non-planar faces. Related sibling pages:
          Bevel Modifier, Wireframe Modifier, Boolean Modifier — all Generate
          category modifiers.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0) — bundled glTF exporter; handles multi-primitive mesh
          export from multi-material Blender objects. Related:
          KhronosGroup/glTF specification (multi-primitive mesh node),
          KhronosGroup/glTF-Sample-Assets, three.js{" "}
          <code>GLTFLoader</code> primitive grouping.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr",
  title:
    "Python bpy.types.SolidifyModifier — Simple vs Complex Mode, Even Thickness, Rim Cap & Two-Material Panel Line: VRM Pauldron Shell & GLB Export (Blender 5.1)",
  summary:
    "SolidifyModifier in SIMPLE mode with use_even_offset=True extrudes a curved pauldron surface into a closed 3-D shell. use_rim=True seals the open boundary with quads (required for WebXR back-face culling). material_offset_rim=1 routes those rim quads to a second material slot for a contrasting gold-trim panel-line with no manual face selection. WeightedNormalModifier stacked after repairs rim corner normals. Covers SIMPLE vs NON_MANIFOLD (Complex) mode, nonmanifold_offset_mode, material_offset for inner shell, and GLB export with two-primitive mesh output.",
  tags: [
    "blender",
    "python",
    "scripting",
    "solidify-modifier",
    "hard-surface",
    "panel-line",
    "rim-cap",
    "vrm",
    "armour",
    "modifier",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-18",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr",
});
