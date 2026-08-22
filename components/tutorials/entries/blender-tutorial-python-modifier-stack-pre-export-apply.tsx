import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every non-destructive operation Blender can perform on a mesh — bevel,
        Boolean difference, wall-thickness shell, subdivision — lives in the
        modifier stack.  The modifier stack is an ordered list on{" "}
        <code>bpy.types.Object</code>: Blender evaluates it from index&nbsp;0
        upward each frame, feeding each modifier&apos;s output into the next
        modifier&apos;s input.  Order is everything: a{" "}
        <strong>Bevel before Subdivision</strong> produces support loops that
        hold sharp edges; the same Bevel after Subdivision smooths an already
        rounded surface and creates a completely different silhouette.  Getting
        this right in code means understanding not just how to add modifiers,
        but why specific orderings exist and how to enforce them in a pipeline
        script.
      </p>
      <p className="mt-3">
        For WebXR and GLB export the stack must eventually be baked to a plain
        mesh — the Three.js runtime has no concept of a Blender modifier.  The
        GLTF exporter&apos;s <code>export_apply=True</code> flag does this
        automatically for a single export, but a production batch script needs
        fine-grained control: bump the subdivision render level before baking,
        skip Boolean cutters whose geometry is intentionally invisible, preserve
        modifier data in the <code>.blend</code> for later edits while exporting
        a clean derived mesh.  All of that lives in the Python API, not in the
        export operator flag.
      </p>
      <p className="mt-3">
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          Context Temp Override — Mesh Repair Pipeline
        </Link>{" "}
        tutorial explains why{" "}
        <code>bpy.context.temp_override()</code> is necessary for operators
        that poll for a <code>VIEW_3D</code> area.{" "}
        <code>modifier_apply()</code> is one such operator — this entry
        extends that pattern to the full modifier lifecycle.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        The <code>ob.modifiers</code> collection
      </h2>
      <p>
        <code>bpy.types.ObjectModifiers</code> is a typed sequence on every
        mesh Object.  It exposes three key methods:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Add a modifier — returns the new modifier typed to the requested type.
# Name is the display label in the Properties panel; type is a string enum.
bev = ob.modifiers.new("HF_Bevel", "BEVEL")   # → bpy.types.BevelModifier
sub = ob.modifiers.new("HF_SubSurf", "SUBSURF") # → bpy.types.SubsurfModifier

# Remove a modifier by reference (not by name).
ob.modifiers.remove(bev)

# Access by index (stack order) or by name.
first = ob.modifiers[0]
named = ob.modifiers.get("HF_SubSurf")   # returns None if absent, safe`}</pre>
      <p className="mt-2">
        The return type of <code>new()</code> is already narrowed to the
        modifier subtype, so IDE completion works immediately: typing{" "}
        <code>bev.</code> after a <code>BEVEL</code> new call will show{" "}
        <code>width</code>, <code>segments</code>, <code>limit_method</code>,
        etc.  There is no casting required.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Building the four-modifier stack
      </h2>
      <p>
        The blueprint builds a flat panel prop that demonstrates the canonical
        hard-surface stack:{" "}
        <strong>Bevel → Boolean → Solidify → Subdivision Surface</strong>.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# ── 0: BEVEL ─────────────────────────────────────────────────────────────
bev = ob.modifiers.new("HF_Bevel", "BEVEL")
bev.width         = 0.015      # metres — chamfer width at each sharp edge
bev.segments      = 2          # two loops → smooth highlight without SubSurf artefacts
bev.limit_method  = "ANGLE"    # only bevel edges sharper than bev.angle_limit
bev.angle_limit   = 30 * (3.14159 / 180)  # 30° in radians
bev.use_clamp_overlap = True   # prevent bevel crossing adjacent edges on tight geometry

# ── 1: BOOLEAN ───────────────────────────────────────────────────────────
bool_mod = ob.modifiers.new("HF_Boolean", "BOOLEAN")
bool_mod.operation = "DIFFERENCE"
bool_mod.object    = cutter_ob     # the wire-frame cylinder proxy
bool_mod.solver    = "EXACT"
# WHY EXACT not FAST: FAST leaves open edges on co-planar faces.
# For a static GLB evaluated once, the extra compute cost is negligible.

# ── 2: SOLIDIFY ──────────────────────────────────────────────────────────
sol = ob.modifiers.new("HF_Solidify", "SOLIDIFY")
sol.thickness            = 0.04     # 40 mm wall in world-space metres
sol.offset               = -1.0     # grow inward only (offset = -1 is full inward)
sol.use_even_offset      = True     # constant thickness around curved areas
sol.use_quality_normals  = True
sol.material_offset      = 1        # inner face gets material slot index 1

# ── 3: SUBSURF ───────────────────────────────────────────────────────────
sub = ob.modifiers.new("HF_SubSurf", "SUBSURF")
sub.subdivision_type  = "CATMULL_CLARK"
sub.levels            = 1           # viewport level — keep low for interaction
sub.render_levels     = 2           # render level — bumped before apply
sub.use_limit_surface = True        # project to true B-spline limit — viewport matches render
sub.use_creases       = True        # respect edge crease weights`}</pre>
      <p className="mt-2">
        The ordering rationale: Bevel before Subdivision provides the support
        loops SubSurf needs to hold sharp corners without requiring manually
        placed edge loops — this is the <em>subdiv-ready bevel</em> workflow
        used throughout the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
          className={lk}
        >
          BMesh Hard-Surface Prop
        </Link>{" "}
        tutorial.  Boolean before Solidify ensures the hole is cut in the base
        face, not in the already-thickened shell (which would double the cut
        depth).  Solidify before Subdivision gives SubSurf smooth wall edges
        to round.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Reordering with <code>modifier_move_to_index()</code>
      </h2>
      <p>
        In Blender 4.0+ the canonical reorder operator is{" "}
        <code>bpy.ops.object.modifier_move_to_index()</code>.  It requires
        only that the target object is active in OBJECT mode — no VIEW_3D
        area override is needed.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`bpy.context.view_layer.objects.active = ob
# Move Solidify to the front of the stack (wrong position — demo only)
bpy.ops.object.modifier_move_to_index(modifier="HF_Solidify", index=0)
# Restore to index 2
bpy.ops.object.modifier_move_to_index(modifier="HF_Solidify", index=2)

# Verify current order
for i, mod in enumerate(ob.modifiers):
    print(i, mod.type, mod.name)`}</pre>
      <p className="mt-2">
        Pipeline scripts that load modifier recipes from JSON need to call this
        after <code>new()</code> in insertion order — JSON dicts preserve order
        in Python 3.7+ but the insertion order may not match the desired
        evaluation order if entries were appended later.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Serialising a modifier recipe to dict / JSON
      </h2>
      <p>
        Modifier attributes are <em>not</em> uniform across types.  Attempting
        to read <code>.width</code> on a <code>SUBSURF</code> modifier raises{" "}
        <code>AttributeError</code>.  The safe pattern branches on{" "}
        <code>mod.type</code>:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`recipe = {}
for mod in ob.modifiers:
    if mod.type == "BEVEL":
        recipe[mod.name] = {"type": "BEVEL", "width": mod.width, "segments": mod.segments}
    elif mod.type == "BOOLEAN":
        recipe[mod.name] = {"type": "BOOLEAN", "operation": mod.operation,
                            "solver": mod.solver,
                            "object": mod.object.name if mod.object else None}
    elif mod.type == "SOLIDIFY":
        recipe[mod.name] = {"type": "SOLIDIFY", "thickness": mod.thickness}
    elif mod.type == "SUBSURF":
        recipe[mod.name] = {"type": "SUBSURF",
                            "levels": mod.levels, "render_levels": mod.render_levels}

import json
print(json.dumps(recipe, indent=2))`}</pre>
      <p className="mt-2">
        This recipe dict is sufficient to reproduce the stack in a fresh scene
        via a reverse pass — iterate the dict in order, call{" "}
        <code>new()</code> + property assignment for each entry.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter
        </Link>{" "}
        tutorial uses a similar per-object recipe pattern for export
        configuration.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Pre-export apply: consuming the stack from index 0
      </h2>
      <p>
        <code>bpy.ops.object.modifier_apply()</code> removes the modifier from
        the stack and bakes its effect into the mesh.  After apply, what was
        index&nbsp;1 becomes index&nbsp;0 — iterating by name over a shrinking
        list causes off-by-one errors.  The safe pattern consumes from the
        front:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`def pre_export_apply_all(ob, window, area, region):
    # Bump SubSurf to render quality before baking
    if sub := ob.modifiers.get("HF_SubSurf"):
        sub.levels = sub.render_levels

    count = len(ob.modifiers)
    for _ in range(count):
        if not ob.modifiers:
            break
        mod_name = ob.modifiers[0].name          # always index 0
        with bpy.context.temp_override(window=window, area=area, region=region):
            bpy.ops.object.modifier_apply(modifier=mod_name)

    print(f"Applied all. Mesh: {len(ob.data.vertices)} verts")`}</pre>
      <p className="mt-2">
        <code>modifier_apply()</code> polls for a{" "}
        <code>VIEW_3D</code> area with the object active and in OBJECT mode.
        Without <code>temp_override()</code>, calling it from a Text Editor
        or headless session returns{" "}
        <code>{'{"CANCELLED"}'}</code> silently — the modifier appears to
        have been applied but the mesh is unchanged.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          Context Temp Override
        </Link>{" "}
        tutorial for the <code>_find_view3d_ctx()</code> helper that locates
        a suitable area in any window layout.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Modifier types reference (Blender 5.1)
      </h2>
      <p>
        The <code>type</code> string passed to <code>modifiers.new()</code> is
        the modifier enum identifier — not the UI label.  Common types for
        hard-surface and WebXR work:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Generate modifier
"ARRAY"            "BEVEL"            "BOOLEAN"
"BUILD"            "DECIMATE"         "EDGE_SPLIT"
"MIRROR"           "REMESH"           "SCREW"
"SOLIDIFY"         "SUBSURF"          "TRIANGULATE"
"WELD"

# Deform modifier
"ARMATURE"         "CAST"             "CURVE"
"DISPLACE"         "HOOK"             "LAPLACIANDEFORM"
"LATTICE"          "MESH_DEFORM"      "SHRINKWRAP"
"SIMPLE_DEFORM"    "SMOOTH"           "SURFACE_DEFORM"
"WARP"             "WAVE"

# Geometry Nodes (special: sets mod.node_group after new())
"NODES"            # → bpy.types.NodesModifier
                   # mod.node_group = ng  (bpy.types.GeometryNodeTree)
                   # mod[socket_identifier] = value  (GN input sockets)`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Holoflow pipeline pattern: export without losing the stack
      </h2>
      <p>
        The studio&apos;s batch exporter (
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Python Batch GLB Exporter
        </Link>
        ) calls <code>export_apply=True</code> in the GLTF operator, which
        does an internal apply pass without modifying the source object.  This
        is sufficient for single-shot exports.  For multi-level-of-detail
        exports the blueprint pattern above — explicit apply on a duplicate —
        is safer: duplicate the object, apply the stack on the duplicate at the
        desired subdiv level, export, delete the duplicate, leaving the original
        with the full non-destructive stack intact.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Non-destructive export: duplicate → apply → export → delete
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.duplicate()
export_ob = bpy.context.active_object  # the copy
export_ob.name = ob.name + "_export"

# Apply the whole stack on the copy
pre_export_apply_all(export_ob, window, area, region)

# Export the copy
bpy.ops.export_scene.gltf(
    filepath=output_glb,
    export_format="GLB",
    use_selection=True,
    export_apply=True,   # belt-and-braces
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)

# Clean up
bpy.data.objects.remove(export_ob, do_unlink=True)`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc ml-5 space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.ObjectModifiers.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Python API — bpy.types.ObjectModifiers
          </a>{" "}
          (CC-BY 4.0, Blender Foundation &amp; contributors). Full attribute
          reference for every modifier type, <code>new()</code> /
          <code>remove()</code> signatures, and the complete modifier type enum
          list. Sibling project:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>{" "}
          — source for the modifier evaluation pipeline in{" "}
          <code>source/blender/modifiers/</code>.
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Modifiers Introduction
          </a>{" "}
          (CC-BY 4.0, Blender Foundation &amp; contributors). Explains the
          evaluation order, the difference between Apply and Convert, and why
          certain modifier combinations require specific stack positions.
          Related sibling pages for{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/bevel.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Bevel
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/solidify.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solidify
          </a>
          , and{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/subdivision_surface.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subdivision Surface
          </a>
          .
        </li>
      </ul>

      <p className="mt-6 text-sm text-zinc-400">
        See also:{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-boolean-exact-hard-surface-trim"
          className={lk}
        >
          Boolean Exact — Hard Surface Trim
        </Link>{" "}
        for the UI-based Boolean workflow, and{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print"
          className={lk}
        >
          Solidify Shell — Architecture 3D-Print
        </Link>{" "}
        for the Solidify workflow with offset and material slot techniques.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
          className={lk}
        >
          BMesh Ops — Extrude / Bevel / Bridge
        </Link>{" "}
        tutorial achieves the same hard-surface result via direct mesh
        topology rather than modifiers — a useful comparison for understanding
        when destructive topology beats a modifier stack.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one focused session (≈ 35 minutes)",
    difficulty: "intermediate",
    cost: "free — built-in Blender Python API",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable opening the Scripting workspace and running a Python script",
      "Basic familiarity with the Properties panel → Modifier tab",
      "Has read the Context Temp Override tutorial or knows why bpy.context.temp_override() is required",
    ],
    steps: [
      {
        title: "Clear the default scene and run blueprint.py",
        body: "Open Blender 5.1. File → New → General. Switch to the Scripting workspace (top tab row). In the Text Editor panel, press New to create an empty text block, paste the full blueprint.py contents, and press Alt+P (or the ▶ Run Script button). The Info bar should show no errors; the 3D Viewport should display a flat white panel with a cylinder wire-frame beside it.",
      },
      {
        title: "Inspect the modifier stack",
        body: "Click the flat panel in the 3D Viewport to select it. Switch to the Properties panel on the right (wrench icon → Modifier Properties). Confirm four modifiers in order: HF_Bevel, HF_Boolean, HF_Solidify, HF_SubSurf. Hover over each to read the settings applied by blueprint.py. Enable the 3D Viewport header → Viewport Overlays → Statistics to see the vertex count change as you increase the SubSurf levels slider.",
      },
      {
        title: "Observe the reorder demo in the System Console",
        body: "Open Window → Toggle System Console (Windows) or run Blender from a terminal. In the Text Editor, locate the reorder_stack_demo() call at the end of main(). The console prints the stack before and after moving HF_Solidify to index 0, then restores it. Observe: the viewport briefly flickers as the evaluation order changes — the result looks wrong (Solidify before Bevel rounds the wall edge), which is the intended demonstration of why order matters.",
      },
      {
        title: "Read the modifier recipe",
        body: "In the console, run: print(read_modifier_properties(bpy.data.objects['HF_ModStack_Demo'])). A dict with four keys prints: type, numeric settings, and the cutter object name for the Boolean. This is the serialisable recipe that a pipeline config file would store.",
      },
      {
        title: "Apply the modifier stack",
        body: "In the Text Editor, comment out the export_glb() call at the bottom of main() if you want to inspect the mesh before export. Re-run the script. The System Console prints four 'Applying modifier:' lines followed by the final vertex and face count. In the Properties panel, the modifier stack is now empty — the mesh is a plain Mesh data-block with the bevel, hole, wall thickness, and subdivision baked in.",
      },
      {
        title: "Export the GLB",
        body: "Restore the export_glb() call and re-run. The System Console prints the output path (//output/mod_stack_result.glb relative to the .blend file). Open the file browser and navigate to the output folder to confirm the GLB exists. Drag it into a browser tab with model-viewer or Three.js to confirm it renders correctly in WebXR context.",
      },
    ],
    troubleshooting: [
      {
        symptom: "modifier_apply() completes but the mesh is unchanged",
        cause: "The operator was called without a VIEW_3D area context. It returned CANCELLED silently.",
        fix: "Confirm _find_view3d_ctx() returned a non-None triple. If running headless (no display), call bpy.ops.object.modifier_apply() only during an interactive session, or use the export_apply=True flag in the GLTF exporter instead.",
      },
      {
        symptom: "Boolean cutter leaves open edges or missing faces",
        cause: "solver = 'FAST' was used on co-planar geometry. FAST cannot resolve faces that share a plane with the cutter.",
        fix: "Set bool_mod.solver = 'EXACT'. Also ensure the cutter object has no scale applied differently from the base — run bpy.ops.object.transform_apply(scale=True) on both before the modifier is evaluated.",
      },
      {
        symptom: "Solidify wall appears on the wrong side",
        cause: "sol.offset = 1.0 (full outward) instead of -1.0 (full inward).",
        fix: "Set sol.offset = -1.0 for inward-only growth. A value of 0.0 centres the wall on the original surface (grows equally in and out). Check the face normals — flipped normals on the base mesh invert the Solidify direction regardless of the offset setting.",
      },
      {
        symptom: "SubSurf has no effect after apply",
        cause: "sub.levels = 0 at apply time (viewport level was never bumped to render_levels).",
        fix: "Set sub.levels = sub.render_levels before calling pre_export_apply_all(). The blueprint does this automatically: if sub := ob.modifiers.get('HF_SubSurf'): sub.levels = SUBSURF_LEVELS_RENDER.",
      },
      {
        symptom: "modifier_move_to_index() raises RuntimeError: poll failed",
        cause: "ob is not the active object, or the object is not in OBJECT mode.",
        fix: "Set bpy.context.view_layer.objects.active = ob and ensure bpy.context.object.mode == 'OBJECT' before calling the operator. If you are inside an edit or pose mode session, call bpy.ops.object.mode_set(mode='OBJECT') first.",
      },
    ],
    finalResult: "output/mod_stack_result.glb — a hard-surface panel prop with bevelled edges, a Boolean hole, solidified wall thickness, and Catmull-Clark subdivision, all baked to a plain mesh at Draco level 6, ready for WebXR.",
  },
  {
    slug: "blender-tutorial-python-modifier-stack-pre-export-apply",
    title:
      "Python bpy.types.ObjectModifiers — Build, Configure, Reorder & Pre-Export Apply: Bevel → Boolean → Solidify → SubSurf (Blender 5.1)",
    date: "2026-07-05",
    kind: "tutorial",
    excerpt:
      "Use bpy.types.Object.modifiers to build a four-step hard-surface stack (Bevel, Boolean, Solidify, SubSurf) entirely from Python: add and configure each modifier, reorder with modifier_move_to_index(), serialise the stack to a recipe dict, and apply every modifier from index 0 via temp_override() for a clean pre-export GLB.",
    Body,
  },
);
