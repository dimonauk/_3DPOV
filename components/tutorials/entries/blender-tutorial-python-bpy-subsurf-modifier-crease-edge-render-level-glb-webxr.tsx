import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Catmull-Clark subdivision rounds every edge equally. The craft of
        hard-surface SubD is telling Blender <em>which</em> edges must not round
        — and by how much. Edge creases are the answer: a float attribute
        between 0 (fully rounded) and 1 (completely sharp) stored per edge in
        the mesh. In Python, the entire crease array is written in one call
        via <code>foreach_set</code>, making scripted bulk attribution
        orders of magnitude faster than a loop over{" "}
        <code>mesh.edges[i].crease</code>.
      </p>

      <p>
        The second critical detail is the render/viewport level split.{" "}
        <code>mod.levels</code> controls what you see interactively;{" "}
        <code>mod.render_levels</code> controls what lands in the output.
        They are independent integers. For WebXR delivery via GLB the
        exporter evaluates at render_levels, so you get high-quality geometry
        in the file while keeping the viewport fast at a lower level.
      </p>

      <h2>API quick-reference</h2>
      <pre>{`mod = obj.modifiers.new("SubSurf", 'SUBSURF')

# Subdivision algorithm
mod.subdivision_type = 'CATMULL_CLARK'   # or 'SIMPLE' (no smoothing)

# Quality levels
mod.levels         = 1   # viewport — keep low for interactivity
mod.render_levels  = 2   # render / GLB export quality

# Crease behaviour
mod.use_creases = True   # honour the crease_edge attribute (default True)

# UV handling across subdivided boundaries
mod.uv_smooth = 'PRESERVE_BOUNDARIES'   # do not slide UV seam edges
# other options: 'NONE', 'PRESERVE_CORNERS',
#                'PRESERVE_CORNERS_AND_JUNCTIONS', 'SMOOTH_ALL'

# Open-boundary smoothing
mod.boundary_smooth = 'ALL'   # or 'PRESERVE_CORNERS'

# Viewport display
mod.show_only_control_edges = False  # True = show only cage, hide SubD lines
mod.use_custom_normals = True        # preserve hand-authored normals`}</pre>

      <h2>Writing crease weights via the attribute API</h2>
      <p>
        Blender 4.0 moved edge creases from the deprecated{" "}
        <code>mesh.edges[i].crease</code> accessor to a proper{" "}
        <code>FloatAttribute</code> on the <code>EDGE</code> domain named{" "}
        <code>"crease_edge"</code>. Both access the same underlying data in
        5.1, but the attribute path supports <code>foreach_set</code> — write
        all N values in one C-level call.
      </p>
      <pre>{`mesh = obj.data

# Create the attribute if it does not exist
if "crease_edge" not in mesh.attributes:
    mesh.attributes.new("crease_edge", 'FLOAT', 'EDGE')

# Build a flat array — one float per edge
import math
crease_array = [0.0] * len(mesh.edges)

# Mark boundary and sharp-angle edges
bm = bmesh.new()
bm.from_mesh(mesh)
bm.edges.ensure_lookup_table()
THRESHOLD = math.radians(30)
for i, edge in enumerate(bm.edges):
    if edge.is_boundary:
        crease_array[i] = 1.0
    elif len(edge.link_faces) == 2:
        angle = edge.link_faces[0].normal.angle(edge.link_faces[1].normal, 0.0)
        if angle > THRESHOLD:
            crease_array[i] = 1.0
bm.free()

# Write in one shot — much faster than a Python loop
mesh.attributes["crease_edge"].data.foreach_set("value", crease_array)
mesh.update()`}</pre>

      <h2>Sharp edge vs crease: the distinction</h2>
      <p>
        Blender has two independent mechanisms that look similar but behave
        differently under subdivision:
      </p>
      <pre>{`# "sharp_edge" (bool) — controls normal smoothing only.
# With auto smooth or custom normals, a sharp edge shows a hard facet
# boundary in shading, but the GEOMETRY is still rounded by SubD.
mesh.attributes["sharp_edge"].data.foreach_set("value", sharp_array)

# "crease_edge" (float 0–1) — controls GEOMETRY.
# A crease of 1.0 pins the edge; SubD cannot move the verts on either
# side of it.  Shading remains smooth unless you ALSO set sharp_edge.

# Full hard-surface pipeline: set BOTH on feature edges.
# crease_edge = 1.0  → geometry stays sharp
# sharp_edge  = True → shading reads the sharp crease too`}</pre>

      <h2>Viewport vs render level in practice</h2>
      <pre>{`# While modelling:
mod.levels = 1          # one pass of SubD — fast viewport, visible topology

# Before a render pass or GLB export:
# Blender automatically uses render_levels; you do not need to change levels.
# BUT if you are applying the modifier programmatically, set levels first:
mod.levels = mod.render_levels   # bake at render quality
bpy.ops.object.modifier_apply(modifier=mod.name)

# Why this matters for GLB:
# glTF 2.0 has no SubD primitive — the exporter reads the *evaluated* mesh.
# "Evaluated" in a viewport session = mod.levels.
# Applying first bakes the geometry so the exporter reads final geometry
# regardless of the current viewport level.`}</pre>

      <h2>UV smooth modes explained</h2>
      <pre>{`# NONE — UV coordinates are not affected by subdivision.
#         Boundary UVs stretch; interior UVs remain linear.
#         Fast; use for meshes with no UV continuity requirement.

# PRESERVE_BOUNDARIES — UV seam edges are not smoothed.
#         Interior UV shell is Catmull-Clark smooth but the boundary
#         does not drift.  Best for baked textures with defined islands.

# PRESERVE_CORNERS — corner vertices of UV islands are pinned;
#         edges between them can still drift slightly.

# SMOOTH_ALL — UVs are fully subdivided alongside geometry.
#         Produces smoothest UV interpolation but may push seam edges
#         off the UV atlas border.  Use only when UVs have generous padding.`}</pre>

      <h2>Applying the modifier before GLB export</h2>
      <pre>{`import bpy

def apply_subsurf_and_export(obj, output_path):
    """Apply at render quality, then export GLB."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    mod = obj.modifiers.get("SubSurf")
    if not mod:
        return

    # Temporarily raise viewport level so apply() bakes at render quality
    original_levels = mod.levels
    mod.levels = mod.render_levels

    with bpy.context.temp_override(
        active_object=obj,
        selected_objects=[obj]
    ):
        bpy.ops.object.modifier_apply(modifier=mod.name)

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(output_path),
        export_format                        = 'GLB',
        use_selection                        = False,
        export_materials                     = 'EXPORT',
        export_animations                    = False,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_normals                       = True,
        export_texcoords                     = True,
    )
    print(f"Exported → {bpy.path.abspath(output_path)}")`}</pre>

      <h2>Common failure modes</h2>
      <pre>{`# 1. "GLB looks like the control cage, not the smooth mesh"
#    Cause: modifier was not applied; exporter read viewport level (1)
#    Fix:   set mod.levels = mod.render_levels, then apply before export.

# 2. "All edges are rounded — creases are ignored"
#    Cause: mod.use_creases = False (easy to accidentally uncheck in UI)
#    Fix:   mod.use_creases = True

# 3. "UVs slide after subdivision"
#    Cause: mod.uv_smooth = 'SMOOTH_ALL'
#    Fix:   mod.uv_smooth = 'PRESERVE_BOUNDARIES'

# 4. "bpy.ops.object.modifier_apply fails with RuntimeError"
#    Cause: not in OBJECT mode, or active_object is wrong
#    Fix:   use bpy.context.temp_override(active_object=obj)

# 5. "Custom normals lost after applying SubSurf"
#    Cause: mod.use_custom_normals = False
#    Fix:   set True before applying; normals are baked into the mesh.`}</pre>

      <h2>Three.js WebXR consumption</h2>
      <pre>{`import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load('/library/hf_console_panel.glb', (gltf) => {
  // Geometry is baked smooth — no SubD required in Three.js.
  // The crease data is already factored into vertex positions.
  scene.add(gltf.scene);
});`}</pre>

      <h2>Cross-references</h2>

      <h3>Studio</h3>
      <ul>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr">
            Python Edge Sharp / Crease / Seam Attribute API
          </Link>{" "}
          — <code>foreach_set</code> patterns for <code>sharp_edge</code>,{" "}
          <code>crease_edge</code>, and <code>use_seam</code> in one pipeline.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply">
            Modifier Stack Pre-Export Apply
          </Link>{" "}
          — generalised pattern for applying any modifier stack headlessly before
          GLB export, including order resolution and dependency handling.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface">
            SubD Crease &amp; Bevel Weight Hard Surface (UI)
          </Link>{" "}
          — the visual / interactive counterpart to this scripted tutorial:
          support loops, bevel weights, and crease in the modifier properties panel.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop">
            bmesh Hard-Surface Prop Construction
          </Link>{" "}
          — the bmesh construction stage that precedes SubD in a typical
          hard-surface scripting pipeline.
        </li>
      </ul>

      <h3>External sources</h3>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/subdivision_surface.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Subdivision Surface Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — canonical reference for all
          modifier properties including uv_smooth modes and boundary_smooth.
          Related projects: Blender Institute, Blender Documentation Working Group.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/current/bpy.types.SubsurfModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.SubsurfModifier — Blender Python API
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property definitions for
          every modifier field accessible from Python. Also see{" "}
          <a
            className={lk}
            href="https://docs.blender.org/api/current/bpy.types.Mesh.html#bpy.types.Mesh.attributes"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mesh.attributes
          </a>{" "}
          for the crease_edge attribute schema. Related: Blender Python API
          Working Group, bf-extensions repository on git.blender.org.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr",
  title:
    "Python bpy.types.SubsurfModifier — Crease-Controlled SubD: Viewport/Render Level Split, Attribute Creases & GLB Pre-Export Apply (Blender 5.1)",
  summary:
    "Catmull-Clark subdivision rounds every edge — until you mark it. This tutorial scripts the full SubsurfModifier pipeline: writing crease_edge float attributes with foreach_set, separating viewport and render levels for interactive speed without sacrificing export quality, and applying the modifier before GLB delivery because glTF 2.0 carries no SubD primitive.",
  tags: [
    "blender",
    "python",
    "scripting",
    "subdivision-surface",
    "subsurf",
    "crease",
    "hard-surface",
    "modifier",
    "webxr",
    "glb",
    "foreach_set",
    "attribute",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr",
});
