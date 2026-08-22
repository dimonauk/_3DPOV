import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>RemeshModifier</code> reconstructs a clean, uniform mesh from a
        signed-distance field (SDF) evaluated over the source geometry. It
        solves four problems that appear regularly in studio work: non-manifold
        T-junctions left by fast Boolean solvers; over-dense sculpt topology
        where ten thousand faces do the work of four hundred; irregular
        triangulation from photogrammetry or point-cloud bakes; and procedural
        noise-displaced meshes whose polygon density is spatially uneven.
        Blender 5.1 exposes four distinct modes — <code>BLOCKS</code>,{" "}
        <code>SMOOTH</code>, <code>SHARP</code>, and <code>VOXEL</code> — each
        built on a different algorithm with different trade-offs.
      </p>
      <p>
        This tutorial scripted a faceted organic blob: a subdivided icosphere
        displaced by Perlin noise, cleaned with VOXEL mode (OpenVDB SDF), then
        duplicated and run through SHARP mode (dual-contouring) for the export
        copy. The SHARP copy receives a flat toon material and is exported as a
        Draco-compressed GLB for WebXR. The VOXEL object stays live on the
        stack as a reference so you can compare mesh density at any{" "}
        <code>voxel_size</code> without re-running the script.
      </p>

      <h2>Mode comparison</h2>
      <pre>{`# BLOCKS — axis-aligned cubic cells. Voxel-art aesthetic.
#   No UV safety. Useful for: intentional voxel look, not for smooth export.
rem.mode = 'BLOCKS'
rem.octree_depth = 4   # 2^4 = 16 cells per axis

# SMOOTH — marching-cubes surface reconstruction.
#   Smooth normals; no feature-edge tracking; all angles are rounded.
rem.mode = 'SMOOTH'
rem.octree_depth = 5

# SHARP — dual-contouring. Tracks feature edges and preserves sharp angles.
#   Flat-shading produces intentional facets. Best for studio hard-surface.
rem.mode = 'SHARP'
rem.octree_depth = 5
rem.scale        = 0.90   # fit margin inside grid cell (0.5–0.99)
rem.use_smooth_shade = False   # flat = visible facets

# VOXEL — OpenVDB SDF. Most accurate at any target density.
#   Supports adaptivity (simplify flat regions). Requires watertight input.
rem.mode        = 'VOXEL'
rem.voxel_size  = 0.048   # metres; keep >= 0.025 to avoid OOM
rem.adaptivity  = 0.14    # 0–1; non-zero collapses flat triangles`}</pre>
      <p>
        The choice between SHARP and VOXEL comes down to input quality and
        target density. VOXEL is the right call when the source is watertight
        and you want an exact face-count target (set{" "}
        <code>voxel_size = object_diameter / target_edge_count</code>). SHARP
        is the right call when the source has open boundaries — sculpt
        fragments, partial imports — or when you want the dual-contour feature
        lines to guide where flat facets fall.
      </p>

      <h2>Full modifier setup from Python</h2>
      <pre>{`import bpy
import bmesh
from mathutils import Vector
from mathutils import noise as mn   # Perlin — headless-safe in 5.1

ICO_SUBDIVISIONS = 4       # 4 levels → 2 560 faces
NOISE_STRENGTH   = 0.09    # metres
NOISE_SCALE      = 4.1

VOXEL_SIZE       = 0.048
VOXEL_ADAPTIVITY = 0.14

SHARP_DEPTH      = 5
SHARP_SCALE      = 0.90

# ── 1. Create noisy icosphere source ─────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=ICO_SUBDIVISIONS,
                                      radius=0.40)
ob = bpy.context.active_object

bm = bmesh.new()
bm.from_mesh(ob.data)
for v in bm.verts:
    t   = Vector((v.co.x * NOISE_SCALE,
                  v.co.y * NOISE_SCALE,
                  v.co.z * NOISE_SCALE))
    v.co += v.normal * mn.noise(t) * NOISE_STRENGTH
bm.to_mesh(ob.data)
ob.data.update()
bm.free()

# Apply scale — VOXEL size is computed in world space. Unapplied scale
# multiplies cell count silently and can cause OOM on sub-centimetre sizes.
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# ── 2. VOXEL modifier on source (stays live for comparison) ──────────────────
rem_v = ob.modifiers.new("Remesh_VOXEL", 'REMESH')
rem_v.mode             = 'VOXEL'
rem_v.voxel_size       = VOXEL_SIZE
rem_v.adaptivity       = VOXEL_ADAPTIVITY
rem_v.use_smooth_shade = True

# ── 3. SHARP copy for export ──────────────────────────────────────────────────
sharp_ob      = ob.copy()
sharp_ob.data = ob.data.copy()
sharp_ob.name = "hf_remesh_blob"
bpy.context.collection.objects.link(sharp_ob)

for mod in list(sharp_ob.modifiers):
    sharp_ob.modifiers.remove(mod)   # remove inherited VOXEL mod

rem_s = sharp_ob.modifiers.new("Remesh_SHARP", 'REMESH')
rem_s.mode                    = 'SHARP'
rem_s.octree_depth            = SHARP_DEPTH
rem_s.scale                   = SHARP_SCALE
rem_s.use_smooth_shade        = False   # flat faces → readable facets
rem_s.use_remove_disconnected = True
rem_s.threshold               = 1.0`}</pre>

      <h2>Stack interaction: RemeshModifier with other modifiers</h2>
      <p>
        RemeshModifier is a generative modifier — it discards input topology
        and builds a new mesh. Any modifier below it in the stack contributes to
        the source shape that the SDF samples; any modifier above it operates on
        the remeshed output. This means:
      </p>
      <pre>{`# Pattern A: displace → remesh → solidify
#   Displace gives the organic shape; Remesh cleans it; Solidify shells it.
ob.modifiers.new("Displace", 'DISPLACE')   # evaluated first
ob.modifiers.new("Remesh",   'REMESH')     # sees displaced mesh
ob.modifiers.new("Solidify", 'SOLIDIFY')   # sees clean remeshed mesh

# Pattern B: boolean → remesh
#   Fast Boolean leaves T-junction seams; Remesh re-triangulates cleanly.
#   Use Exact Boolean (solver='EXACT') if VOXEL SDF produces artefacts.
ob.modifiers.new("Boolean", 'BOOLEAN')
ob.modifiers.new("Remesh",  'REMESH')`}</pre>
      <p>
        Never place a SubsurfModifier above RemeshModifier expecting to smooth
        the result — SubD relies on the control cage, which RemeshModifier does
        not preserve. Use <code>rem.use_smooth_shade = True</code> (VOXEL) or
        a{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
        >
          SMOOTH_BY_ANGLE modifier
        </Link>{" "}
        instead.
      </p>

      <h2>Export pipeline</h2>
      <pre>{`# export_apply=True collapses modifiers at export time — no bpy.ops.object
# .modifier_apply() call needed, no active-context dependency.
bpy.ops.export_scene.gltf(
    filepath         = bpy.path.abspath("//hf_remesh_blob.glb"),
    export_format    = 'GLB',
    use_selection    = True,
    export_apply     = True,
    export_yup       = True,               # +Y up for WebXR convention
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
)`}</pre>

      <h2>Failure modes</h2>
      <pre>{`# 1. voxel_size too small → OOM crash
#    At 0.005 m on a 1 m object: 200^3 = 8 M voxels. Keep >= 0.025.
rem.voxel_size = 0.005   # DANGEROUS on any mesh > 5 cm

# 2. Non-manifold input to VOXEL → undefined SDF, artefacts at holes
import bmesh as _bm
bm = _bm.new(); bm.from_mesh(ob.data)
_bm.ops.holes_fill(bm, edges=bm.edges)   # pre-fill holes before VOXEL
bm.to_mesh(ob.data); bm.free()

# 3. adaptivity on SHARP mode → silently ignored
rem.mode = 'SHARP'; rem.adaptivity = 0.5   # adaptivity has no effect here

# 4. UVs after remesh → all UV layers destroyed
#    Use Smart UV Project on the output, or triplanar material (no UVs needed)

# 5. use_remove_disconnected drops interior cavities
rem.use_remove_disconnected = True
rem.threshold = 1.0   # drops everything < 100 % of main volume
rem.threshold = 0.0   # keep all islands — safer for lattice / cage shapes`}</pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
          >
            Boolean + Weld Modifier
          </Link>{" "}
          — RemeshModifier is the correct post-process for fast-Boolean junction seams.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
          >
            SubsurfModifier with Crease
          </Link>{" "}
          — SubD and Remesh solve opposite problems: SubD adds detail to clean
          topology; Remesh normalises messy topology before adding detail.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          >
            bmesh limited_dissolve + poke
          </Link>{" "}
          — bmesh-native faceting approach; complement to SHARP mode when the
          source topology is already clean and only needs edge reduction.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-metaball-blob-chain-remesh-webxr"
          >
            Metaball + Remesh pipeline
          </Link>{" "}
          — metaballs produce implicit surfaces identical to a SMOOTH/VOXEL
          remesh input; this entry pairs the two systems into a sculpting
          shortcut.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.RemeshModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.RemeshModifier — Blender Python API 5.1
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Canonical parameter reference;
          sibling:{" "}
          <a
            className={lk}
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/remesh.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Remesh Modifier — Blender Manual
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Documentation Team). Covers all four modes,
          the dual-contouring algorithm behind SHARP, and sculpting integration;
          related:{" "}
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tool_settings/remesh.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sculpt Remesh
          </a>
          .
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0 · Khronos Group). The importer/exporter that processes{" "}
          <code>export_apply=True</code> and Draco compression at export time;
          related:{" "}
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF"
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr",
  title:
    "Python bpy.types.RemeshModifier — VOXEL OpenVDB SDF & SHARP Dual-Contouring: Topology-Clean Faceted Blob & GLB Export (Blender 5.1)",
  summary:
    "RemeshModifier reconstructs a uniform manifold mesh from a signed-distance field sampled over irregular source geometry. VOXEL mode uses an OpenVDB volumetric SDF and supports adaptivity to simplify flat regions; SHARP mode runs dual-contouring which tracks feature edges and preserves dihedral angles, making it the correct choice for flat-shaded faceted studio props. Covers all four mode parameters, stack interaction with Boolean and Solidify, OOM prevention via voxel_size floor, non-manifold pre-processing with bmesh.ops.holes_fill, UV loss mitigation, and GLB export with export_apply=True to collapse modifiers without a bpy.ops context.",
  tags: [
    "blender",
    "python",
    "scripting",
    "remesh-modifier",
    "voxel",
    "sharp",
    "dual-contouring",
    "topology",
    "organic",
    "faceted",
    "modifier",
    "webxr",
    "glb",
    "blender-5-1",
    "openvdb",
  ],
  date: "2026-07-18",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr",
});
