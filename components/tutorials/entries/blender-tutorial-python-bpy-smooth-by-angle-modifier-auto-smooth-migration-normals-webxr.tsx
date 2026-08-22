import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.2 removed <code>mesh.use_auto_smooth</code> and{" "}
        <code>mesh.auto_smooth_angle</code> without raising an error — any
        script that still writes those properties in Blender 5.1 compiles
        silently and does absolutely nothing. The geometry lands fully flat or
        fully smooth depending on its per-face mark state, with no warning in
        the console. The replacement is the <strong>SMOOTH_BY_ANGLE</strong>{" "}
        modifier: a proper stack entry that the depsgraph evaluates at render
        and GLB export time.
      </p>
      <p>
        The shift from per-mesh property to per-object modifier is a genuine
        improvement. Linked mesh instances can now carry different smooth angles
        by overriding the modifier without duplicating geometry. Stack position
        gives you explicit control over which topology the modifier sees. And
        the <code>keep_sharp_edges</code> flag lets you combine angle-based
        smoothing with manual edge marks — two independent levers instead of one.
      </p>

      <h2>API quick-reference</h2>
      <pre>{`import math

# Add the modifier
mod = obj.modifiers.new("Smooth by Angle", 'SMOOTH_BY_ANGLE')

# Angle in RADIANS — the UI shows degrees but Python always uses radians
mod.angle = math.radians(30)   # 30° threshold (default)

# Also honour sharp_edge bool attribute marks on edges
mod.keep_sharp_edges = True

# ── What was REMOVED in 4.2 — do NOT write in Blender 5.1 ──────────────
# mesh.use_auto_smooth = True       # silently ignored
# mesh.auto_smooth_angle = radians(30)  # silently ignored`}</pre>

      <h2>The silent failure you must know</h2>
      <p>
        The old properties do not raise <code>AttributeError</code>. They are
        surfaced as custom ID properties in legacy <code>.blend</code> files,
        so writes pass without complaint. The symptom is a mesh that looks
        wrong in the final render or GLB with no error pointing at the cause.
        Check any script older than Blender 4.1 that calls{" "}
        <code>mesh.use_auto_smooth</code> and replace it with the modifier.
      </p>
      <pre>{`# Detect the legacy pattern and migrate it in one pass
import math

def migrate_auto_smooth(scene):
    migrated = []
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        has_old = obj.data.get("use_auto_smooth", False)
        has_new = any(m.type == 'SMOOTH_BY_ANGLE' for m in obj.modifiers)
        if has_old and not has_new:
            old_angle = obj.data.get("auto_smooth_angle", math.radians(30))
            mod = obj.modifiers.new("Smooth by Angle", 'SMOOTH_BY_ANGLE')
            mod.angle = old_angle
            mod.keep_sharp_edges = True
            # Remove stale custom properties
            if "use_auto_smooth"   in obj.data: del obj.data["use_auto_smooth"]
            if "auto_smooth_angle" in obj.data: del obj.data["auto_smooth_angle"]
            migrated.append(obj.name)
    return migrated`}</pre>

      <h2>Stack position law</h2>
      <p>
        Position matters. SMOOTH_BY_ANGLE must sit <em>after</em> geometry-
        producing modifiers and <em>before</em> Subdivision Surface — the exact
        reasoning is different for each boundary:
      </p>
      <pre>{`# Correct order (bottom = first applied → top = last applied)
# ─────────────────────────────────────────────────────────────
# 1. Mirror / Array / Boolean / Bevel   ← produce final topology
# 2. SMOOTH_BY_ANGLE                    ← smooths the final topology
# 3. Subdivision Surface                ← inherits the normals from SBA
# 4. Shrinkwrap / Displace              ← moves geometry; normals recomputed

# Wrong — SBA below SubD:
# SubD recomputes interpolated normals and discards SBA output.

# Wrong — SBA above Boolean:
# SBA smooths the cage before voids are punched.  Surviving feature edges
# inside void regions round under Catmull-Clark and look incorrect.`}</pre>

      <h2>keep_sharp_edges and the sharp_edge attribute</h2>
      <p>
        Blender stores manual edge sharpness as a <code>BOOLEAN</code>{" "}
        attribute named <code>"sharp_edge"</code> on the <code>EDGE</code>{" "}
        domain. When <code>mod.keep_sharp_edges = True</code>, SMOOTH_BY_ANGLE
        unions the angle heuristic with that attribute: an edge is hard if
        <em>either</em> its dihedral angle exceeds the threshold <em>or</em>{" "}
        it is manually marked sharp. This lets you override the heuristic on
        any specific edge without changing the global angle.
      </p>
      <pre>{`mesh = obj.data

# Create the attribute if absent (safe to call repeatedly)
if "sharp_edge" not in mesh.attributes:
    mesh.attributes.new("sharp_edge", 'BOOLEAN', 'EDGE')

# Write a ring of sharp edges at mid-height — these will stay hard even
# if their dihedral angle falls below the 30° threshold
sharp_array = [False] * len(mesh.edges)
mid_z, tol = 0.4, 0.02
for i, edge in enumerate(mesh.edges):
    v0z = mesh.vertices[edge.vertices[0]].co.z
    v1z = mesh.vertices[edge.vertices[1]].co.z
    if abs(v0z - mid_z) < tol and abs(v1z - mid_z) < tol:
        sharp_array[i] = True

mesh.attributes["sharp_edge"].data.foreach_set("value", sharp_array)
mesh.update()

# See also: sharp_edge vs crease_edge — sharp_edge controls SHADING only;
# crease_edge (float 0–1) controls GEOMETRY under Subdivision Surface.
# Both can coexist — full hard-surface pipeline sets both on feature edges.`}</pre>

      <h2>GLB export — normals land correctly</h2>
      <p>
        The SMOOTH_BY_ANGLE modifier writes custom per-loop normals into the
        depsgraph evaluated mesh. Exporting with{" "}
        <code>export_apply=True</code> and <code>export_normals=True</code>{" "}
        serialises those computed normals into the GLB{" "}
        <code>NORMAL</code> accessor. Three.js reads them verbatim — no
        recomputation on the client side.
      </p>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath      = "//hf_smooth_demo.glb",
    use_selection = True,
    export_format = 'GLB',
    # Evaluate modifier stack, including SMOOTH_BY_ANGLE:
    export_apply  = True,
    # Write computed normals into the NORMAL accessor:
    export_normals = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
)`}</pre>

      <h3>Studio cross-references</h3>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
          >
            Edge sharp / crease / seam — Mesh Attribute API
          </Link>{" "}
          — the full attribute pipeline for <code>sharp_edge</code>,{" "}
          <code>crease_edge</code>, and <code>use_seam</code> that feeds
          directly into SMOOTH_BY_ANGLE's <code>keep_sharp_edges</code> path.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-mesh-custom-split-normals-smooth-island-faceted-webxr"
          >
            Custom Split Normals — per-loop normal authoring
          </Link>{" "}
          — when you need finer control than angle-based smoothing: write
          exact per-loop normals via{" "}
          <code>mesh.normals_split_custom_set_from_vertices()</code>. SMOOTH_BY_ANGLE
          and custom normals can coexist on the same mesh.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
          >
            SubsurfModifier — crease-controlled SubD for WebXR
          </Link>{" "}
          — the SubD tutorial that sits directly above SMOOTH_BY_ANGLE in the
          correct modifier stack order; covers <code>crease_edge</code> bulk
          writing with <code>foreach_set</code> and the viewport/render level
          split.
        </li>
      </ul>

      <h3>External sources</h3>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.SmoothByAngleModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.SmoothByAngleModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property reference for{" "}
          <code>angle</code> and <code>keep_sharp_edges</code>. Related: the
          Blender Python API Working Group and the bf-extensions repository on
          projects.blender.org.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/normals/smooth_by_angle.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Smooth by Angle Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — user-facing
          documentation including the angle slider UI and per-panel
          descriptions of every option. Related sibling pages: Normal Edit
          modifier, Weighted Normal modifier.
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
          (Apache-2.0) — the bundled Blender exporter; handles{" "}
          <code>export_apply</code> depsgraph evaluation and normal accessor
          serialisation. Related: KhronosGroup/glTF specification,
          KhronosGroup/glTF-Sample-Assets.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr",
  title:
    "Python SMOOTH_BY_ANGLE Modifier — Auto-Smooth Migration, Normal Stacking & Faceted GLB for WebXR (Blender 5.1)",
  summary:
    "Blender 4.2 silently removed mesh.use_auto_smooth — scripts that still write it in 5.1 produce wrong shading with no error. This tutorial covers the SMOOTH_BY_ANGLE modifier replacement: setting the angle in radians, combining it with the sharp_edge attribute via keep_sharp_edges, enforcing correct stack position relative to Boolean and SubD, a migration helper for legacy .blend files, and GLB export with normals preserved in the NORMAL accessor.",
  tags: [
    "blender",
    "python",
    "scripting",
    "smooth-by-angle",
    "auto-smooth",
    "normals",
    "modifier",
    "migration",
    "hard-surface",
    "faceted",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr",
});
