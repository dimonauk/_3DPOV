import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SculptDyntopoVoxelRemeshBody() {
  return (
    <>
      <p>
        Dynamic Topology — universally shortened to <strong>Dyntopo</strong>{" "}
        inside the Blender community — solves the single biggest bottleneck in
        organic sculpting: you cannot predict where on a sphere a nose, brow
        ridge, or ear canal will sit before you start.  Traditional subdivision
        locks geometry into a grid that is simultaneously too coarse in the
        areas that need detail and wasteful everywhere else.  Dyntopo abandons
        the grid.  Instead, the mesh is triangulated on entry and re-triangulated
        in real time as each brush stroke lands, splitting triangles that are too
        large for the current detail setting and collapsing triangles that have
        been smoothed past the minimum edge length.  The result is a mesh that
        concentrates every polygon exactly where the brush was — nowhere else.
      </p>

      <p>
        The exit path is <strong>Voxel Remesh</strong>.  Dyntopo&apos;s
        triangle soup is correct for sculpting but unusable for rigging, UV
        mapping, or GLB export to WebXR — loops don&apos;t follow anatomical
        flow, triangles cluster unpredictably, and every quad-dependent modifier
        (Subdivision Surface, Mirror, Shrinkwrap) behaves badly on tris.  Voxel
        Remesh converts the surface into a signed-distance field at a voxel
        resolution you choose, then runs Marching Cubes followed by Quadriflow
        to produce quad-dominant topology that follows the surface curvature.
        The output is not clean retopology — a skilled artist retopo pass is
        still necessary for a final character — but it is clean enough for
        normal-map baking, armature skinning, and a presentable WebXR GLB.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Mode flow diagram
      </h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`Object Mode
  └─ UV Sphere (applied scale) → Tab
       Sculpt Mode (Dyntopo ON)
         ├─ Constant Detail: 12 px     ← coarse passes
         ├─ Draw / Clay Strips / Crease / Inflate
         │    └─ Smooth (Shift held)
         ├─ Constant Detail: 6–8 px    ← fine passes
         └─ Mask by Curvature before broad smooth
  Tab → Object Mode
       Properties → Remesh → Voxel Size 0.025 m → Voxel Remesh
         └─ Quadriflow output (~12 000 quads for 0.5 m head)
              ├─ Shade Smooth
              ├─ Multires modifier → bake → Normal map
              └─ Export → glb (Draco 6, +Y up)`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Step-by-step</h2>

      <h3 className="font-medium mt-4 mb-1">1. Base mesh + apply scale</h3>
      <p>
        <code>Shift+A → Mesh → UV Sphere</code> (32 segments, 24 rings,
        radius 0.5 m).  Immediately hit <code>Ctrl+A → Scale</code>.  This is
        not optional: Dyntopo uses world-space distance for its{" "}
        <em>Constant Detail</em> calculation.  A sphere with scale 10 will
        behave as if it is 10 m across — the brush will leave giant coarse
        patches because the detail target is 12 screen pixels of a 10-metre
        surface, not a 0.5-metre one.  Apply scale before the first stroke
        or discard the sculpt and start again.
      </p>

      <h3 className="font-medium mt-4 mb-1">2. Sculpt Mode + Dyntopo</h3>
      <p>
        <code>Ctrl+Tab</code> → <strong>Sculpt Mode</strong>.  Tick{" "}
        <strong>Dyntopo</strong> in the header and accept the triangulation
        popup.  Open the N-panel → <strong>Tool</strong> tab to expose
        Dyntopo settings.  Set:
      </p>
      <ul className="list-disc list-inside space-y-1 mb-2">
        <li>
          <strong>Detailing → SUBDIVIDE_COLLAPSE</strong>: the default.  Adds
          triangles under large brush strokes and removes them under smooth
          strokes.  Pure SUBDIVIDE mode can balloon memory to several GB on a
          long session because it never removes topology.
        </li>
        <li>
          <strong>Detail Type → CONSTANT_DETAIL</strong>: maintains the same
          pixel density across the whole mesh regardless of brush size.  This
          is the correct setting for character heads where you want consistent
          micro-detail everywhere.  The alternative — RELATIVE — scales density
          to the bounding box, meaning fine detail on a large object gets
          very coarse.
        </li>
        <li>
          <strong>Constant Detail → 12 px</strong>: good starting resolution.
          Reduce to 6–8 px for final detail passes.  At 12 px, a sculpt
          session on a 0.5 m sphere produces roughly 80 000 triangles; at
          6 px the same sphere produces ~300 000.
        </li>
        <li>
          <strong>Symmetry → X Mirror</strong>: enable before the first stroke
          or symmetry will not be applied to existing geometry correctly.
        </li>
      </ul>

      <h3 className="font-medium mt-4 mb-1">3. Broad form — primary brushes</h3>
      <p>
        Work coarse to fine.  The single most common mistake is getting lost
        in surface detail while the large volumes are still wrong.
      </p>
      <ul className="list-disc list-inside space-y-1 mb-2">
        <li>
          <strong>Draw (D)</strong> — pulls volume outward.{" "}
          <code>Ctrl+Draw</code> pushes inward.  Use for eye sockets, nostril
          base, brow ridge, chin.
        </li>
        <li>
          <strong>Clay Strips (search panel → &quot;Clay Strips&quot;)</strong> —
          builds flat planes, excellent for the jawline and forehead
          where you want flat-planar primary forms before rounding.
        </li>
        <li>
          <strong>Inflate (I)</strong> — pushes geometry along its own normals.
          Good for lips, ear lobes, and any soft-tissue balloon.
        </li>
        <li>
          <strong>Smooth (Shift held during any brush)</strong> — the most-used
          operation in organic sculpting.  Use it after every cluster of Draw
          strokes to blend transitions.
        </li>
      </ul>
      <p>
        Keep rotating the view with <code>MMB</code> drag.  Never sculpt for
        more than a minute from a single angle — surface that looks correct in
        silhouette is often wildly asymmetric in 3/4 view.
      </p>

      <h3 className="font-medium mt-4 mb-1">4. Detail pass + Mask by Curvature</h3>
      <p>
        Once the primary volumes are settled, drop Constant Detail to 8 px and
        switch to the Crease brush (finds and pinches a sharp line — use for
        eyelid seams, nostril rims, and lip corners).  Before a broad smooth
        pass, call{" "}
        <strong>Mask → Mask by Curvature</strong> from the sculpt header.
        This auto-masks the sharpest angles on the mesh so a heavy smooth
        stroke does not erase the crease work you just completed.  Invert the
        mask (<code>Ctrl+I</code>) if you want to smooth only the sharp areas.
      </p>

      <h3 className="font-medium mt-4 mb-1">5. Voxel Remesh</h3>
      <p>
        <code>Tab</code> back to Object Mode.  In Properties →{" "}
        <strong>Object Data Properties → Remesh</strong>:
      </p>
      <ul className="list-disc list-inside space-y-1 mb-2">
        <li>
          <strong>Voxel Size: 0.025 m</strong> — gives ~12 000 quads on a
          0.5 m head.  The ratio that matters is voxel size to mesh size
          (~1:20 works well).  Too large a voxel and features blur away;
          too small and you get 200 000 quads which are slow to UV-unwrap.
        </li>
        <li>
          <strong>Adaptivity: 0.0</strong> — uniform voxel density.  Values
          above 0 allow larger quads in flat areas and smaller quads near
          curvature, which can help UVs but sometimes produces T-poles that
          break subdivision.
        </li>
        <li>
          <strong>Smooth Normals: ON</strong> — the Marching Cubes step
          produces slightly faceted normals; this flag post-smooths them.
        </li>
      </ul>
      <p>
        Click <strong>Voxel Remesh</strong>.  The triangle count drops from
        hundreds of thousands to tens of thousands; the vertex ordering is
        completely new.  Apply Shade Smooth.
      </p>

      <h3 className="font-medium mt-4 mb-1">6. Post-remesh workflow</h3>
      <p>
        The remeshed mesh is ready for the baking pipeline (Multires modifier
        → sculpt fine detail → bake to normal map on the low-poly — see the
        texture baking tutorial).  For a direct WebXR export, skip baking,
        UV-unwrap with Smart UV Project, and export as GLB with Draco 6 and
        +Y-up enabled.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Dyntopo checkbox greyed out:</strong> a Multires modifier is
          active on the object.  Dyntopo and Multires are mutually exclusive.
          Remove or apply the Multires modifier before enabling Dyntopo.
        </li>
        <li>
          <strong>Memory balloon during long session:</strong> if you left
          Detailing on SUBDIVIDE (not SUBDIVIDE_COLLAPSE), topology was added
          but never removed.  Switch to SUBDIVIDE_COLLAPSE and use the Smooth
          brush on over-dense areas to trigger triangle collapse.
        </li>
        <li>
          <strong>Voxel Remesh produces a sphere / erases all detail:</strong>{" "}
          unapplied modifiers.  Apply all modifiers before running Voxel
          Remesh — the operator only sees the base mesh, not modifier results.
        </li>
        <li>
          <strong>Thin features disappear after Voxel Remesh:</strong> the
          voxel size is larger than the thinnest feature.  A 0.025 m voxel
          cannot represent a 0.01 m ear fold.  Reduce Voxel Size (0.010–0.015)
          or accept the loss and add the detail back after remeshing.
        </li>
        <li>
          <strong>GLB too large for WebXR:</strong> the remeshed quad count is
          too high.  A head mesh should be under 30 000 triangles for real-time
          XR.  Increase Voxel Size to 0.04 m (7 000–10 000 quads) or apply a
          Decimate modifier (Planar, angle limit 5°) after remeshing.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Cross-references</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-texture-baking-normal-ao"
            className={lk}
          >
            Texture Baking — Normal Map + AO from High-Poly
          </Link>{" "}
          — the natural next step: add a Multires modifier on top of the
          Voxel-Remeshed mesh, sculpt fine pores and wrinkles, then bake the
          detail to a normal map on the original low-poly.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-armature-weight-paint"
            className={lk}
          >
            Armature + Weight Paint — Rigging a Character Mesh
          </Link>{" "}
          — rig and weight-paint the quad-clean remeshed head for facial
          animation; Dyntopo output cannot be rigged directly.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
            className={lk}
          >
            GN UV Unwrap + Pack Islands — GLB Export
          </Link>{" "}
          — UV-unwrap the remeshed mesh before GLB export so textures land
          correctly in Three.js and WebXR model-viewer.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
            className={lk}
          >
            EEVEE Toon / Cel Shader — Stepped Diffuse + Rim Light
          </Link>{" "}
          — apply a cel shader to the sculpted head for a stylised
          low-poly WebXR presentation that matches the studio&apos;s visual
          language.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
            className={lk}
          >
            Python — 3D Print Prep: Manifold Validation + STL Export
          </Link>{" "}
          — run manifold and overhang checks on the Voxel-Remeshed mesh
          before sending it to a resin printer; Voxel Remesh output is
          usually watertight but always verify.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tool_settings/dyntopo.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Dynamic Topology
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — authoritative reference for
          Detailing, Detail Type, and Constant Detail parameters.  The
          companion page{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/meshes/tools/voxel_remesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voxel Remesh
          </a>{" "}
          documents the Adaptivity and Smooth Normals flags.  Related
          upstream projects: the Blender sculpt-dev branch (Pablo Dobarro,
          Joe Eagar) where Quadriflow integration and the Dyntopo
          SUBDIVIDE_COLLAPSE mode were first prototyped.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0, Khronos Group) — the bundled Blender glTF exporter
          that handles Draco compression and KHR extension packing for the
          GLB export step.  Sibling spec:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/specification/2.0"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF 2.0 specification
          </a>{" "}
          — understand mesh.primitives.mode = TRIANGLES (4) vs.
          TRIANGLE_STRIP if you inspect the exported GLB binary; Voxel
          Remesh output exports as indexed triangle list, not strips.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-sculpt-dyntopo-voxel-remesh",
  title:
    "Sculpt Mode — Dynamic Topology + Voxel Remesh: Organic Form (Blender 5.1)",
  created: "2026-06-11",
  tags: [
    "blender",
    "sculpting",
    "dyntopo",
    "voxel-remesh",
    "organic",
    "character",
    "gltf",
    "webxr",
    "eevee-next",
  ],
  libraryPath:
    "public/library/blends/sculpting/sculpt-dyntopo-voxel-remesh/",
  Body: SculptDyntopoVoxelRemeshBody,
});
