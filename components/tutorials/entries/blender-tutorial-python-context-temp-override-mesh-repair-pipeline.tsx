import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Since Blender 4.0, the old context-override dict pattern —{" "}
        <code>ctx = bpy.context.copy(); ctx[&quot;area&quot;] = ...; bpy.ops.foo(ctx, ...)</code>{" "}
        — raises a <code>TypeError</code> and does nothing. Blender replaced it
        with <code>bpy.context.temp_override()</code>, a Python context manager
        that temporarily patches the global <code>bpy.context</code> for the
        duration of its <code>with</code> block. The distinction matters any
        time a script calls edit-mode operators (<code>mesh.remove_doubles</code>,{" "}
        <code>mesh.normals_make_consistent</code>) from an execution context that
        is not a 3D Viewport — a Text Editor, a Python console, or a headless
        CLI invocation via <code>blender --background --python</code>. All of
        those contexts fail the <code>poll()</code> check that edit-mode operators
        perform, and they fail silently: the operator returns{" "}
        <code>&#123;&apos;CANCELLED&apos;&#125;</code> without printing an error
        unless you explicitly check the return value.
      </p>

      <p>
        The practical payload here is a three-pass mesh repair pipeline for the
        Holoflow Studio asset import workflow. Photogrammetry captures, kit-bash
        downloads, and OBJ/STL conversions routinely arrive with three defects
        that break WebXR rendering: flipped or inconsistent face normals
        (surfaces invisible behind backface culling), duplicate vertices at weld
        seams (seam-split artefacts under Draco compression at level 6), and
        stray triangles in quad-dominant areas (inflated index buffers and worse
        LOD collapse). The three-pass pipeline fixes all three in one edit-mode
        session, which matters because each <code>mode_set()</code> call triggers
        a full depsgraph evaluation — keeping mode switches to the absolute
        minimum (one in, one out) is the difference between a script that takes
        0.3 s per object and one that takes 3 s. For the same depsgraph-cost
        reason, always call <code>bpy.context.evaluated_depsgraph_get()</code>{" "}
        once before a batch loop, not once per object — compare the approach
        taken in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
          className={lk}
        >
          depsgraph object instances tutorial
        </Link>
        .
      </p>

      <h2>Finding a VIEW_3D area</h2>
      <p>
        The first challenge is locating a 3D Viewport. Blender&apos;s operator
        poll system requires the overridden context to contain a{" "}
        <code>area</code> of type <code>VIEW_3D</code> and a{" "}
        <code>region</code> of type <code>WINDOW</code>. The script may be
        running from an area that is neither — so we walk every window, every
        screen, every area:
      </p>
      <pre>
        <code>{`def _find_view3d_context():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type != 'VIEW_3D':
                continue
            for region in area.regions:
                if region.type == 'WINDOW':
                    return window, area, region
    raise RuntimeError("No VIEW_3D area found.")`}</code>
      </pre>
      <p>
        If running fully headless (no display), call{" "}
        <code>bpy.ops.wm.window_new()</code> and set the new screen&apos;s first
        area type to <code>&apos;VIEW_3D&apos;</code> programmatically before
        calling this helper. Alternatively, operators that support the{" "}
        <code>EXEC_DEFAULT</code> execution context can bypass the poll check
        entirely — useful for export operators (<code>export_scene.gltf</code>)
        which do not require VIEW_3D.
      </p>

      <h2>The temp_override pattern</h2>
      <pre>
        <code>{`window, area, region = _find_view3d_context()

bpy.context.view_layer.objects.active = obj
obj.select_set(True)

with bpy.context.temp_override(window=window, area=area, region=region):
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')

    # Pass 1 — Merge by Distance (the 4.0+ name for Remove Doubles)
    bpy.ops.mesh.remove_doubles(threshold=0.0001, use_unselected=False)

    # Pass 2 — Recalculate Normals outward (BVHTree winding-order voting)
    bpy.ops.mesh.normals_make_consistent(inside=False)

    # Pass 3 — Tris to Quads (only acts where quads genuinely exist)
    bpy.ops.mesh.tris_convert_to_quads(
        face_threshold=0.698,   # ~40° coplanarity limit
        shape_threshold=0.698,  # companion aspect-ratio gate
    )

    bpy.ops.object.mode_set(mode='OBJECT')`}</code>
      </pre>
      <p>
        The three operators share a single <code>with</code> block and a single
        edit-mode session because they all require the same context. Putting each
        in its own <code>with</code> block would work correctly but would add two
        extra depsgraph evaluations per object (one <code>mode_set(OBJECT)</code>{" "}
        + one <code>mode_set(EDIT)</code> pair). At 200 objects that is 400
        unnecessary evaluations.
      </p>

      <h2>Why each pass in this order</h2>
      <ul>
        <li>
          <strong>Merge by Distance first.</strong> Merging duplicate vertices
          before recalculating normals ensures the winding-order voting operates
          on a manifold mesh. A seam-split vertex pair presents two opposing
          face normals at the same position; merging them collapses the seam
          before the normals pass sees it, producing a correct outward result
          instead of a null-vote tie that Blender resolves unpredictably.
        </li>
        <li>
          <strong>Recalculate Normals second.</strong>{" "}
          <code>normals_make_consistent</code> uses a BVHTree winding-order
          vote: it picks the outward direction by majority vote over each
          connected shell, so it handles multi-shell meshes (outer hull + inner
          cavity) correctly without cross-shell contamination.
        </li>
        <li>
          <strong>Tris to Quads last.</strong> Merging first reduces the
          vertex count; running Tris-to-Quads on the smaller post-merge mesh
          is faster, and the merge sometimes reveals hidden diagonal edges that
          the tri-to-quad pass can now dissolve.
        </li>
      </ul>

      <h2>Integrating into the Holoflow export pipeline</h2>
      <p>
        The Holoflow exporter at{" "}
        <code>tools/blender-addon/holoflow_webxr_exporter</code> calls GLB
        export via <code>bpy.ops.export_scene.gltf()</code>. GLB export is
        context-independent — it does not need a VIEW_3D area — but it does
        need a <code>window</code> in the override or some Blender builds raise
        a no-window poll error. The minimum-viable override for export is:
      </p>
      <pre>
        <code>{`window = bpy.context.window_manager.windows[0]
with bpy.context.temp_override(window=window):
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )`}</code>
      </pre>
      <p>
        The <code>holoflow_macros/mesh_repair_pipeline.py</code> macro wraps
        the full repair + export loop as a registered operator
        (<code>HOLOFLOW_OT_mesh_repair_batch</code>) with an N-panel button
        in the Holoflow sidebar tab, making it accessible from the UI without
        re-opening the Text Editor. Compare this with the batch GLB pipeline
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter tutorial
        </Link>
        , which handles the export side but assumes meshes are already clean.
        The pattern for building a custom sidebar operator with property groups
        is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          custom panel &amp; property group tutorial
        </Link>
        .
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>TypeError: bpy.ops.* no longer accepts a context argument.</strong>{" "}
          You are using the old dict-override pattern. Replace with{" "}
          <code>with bpy.context.temp_override(...): bpy.ops.foo()</code>.
        </li>
        <li>
          <strong>Operator returned CANCELLED silently.</strong> The most common
          cause is a failed poll check — either the area type is wrong or no
          object is active. Print the operator return value:{" "}
          <code>result = bpy.ops.mesh.remove_doubles(...); print(result)</code>.
        </li>
        <li>
          <strong>Normals still inconsistent after the pass.</strong> The mesh
          is non-manifold (open boundary, T-junction, or zero-area faces). Run{" "}
          <code>mesh.select_non_manifold()</code> first to identify and delete
          the problem faces, then retry.
        </li>
        <li>
          <strong>Tris-to-Quads produced skewed or bent quads.</strong> Tighten{" "}
          <code>face_threshold</code> to <code>0.35</code> (~20°) to prevent
          merging tris that span surface creases.
        </li>
        <li>
          <strong>Script crashes in headless (--background) mode.</strong>{" "}
          There is no display, so no areas exist. Call{" "}
          <code>bpy.ops.wm.window_new()</code> and set{" "}
          <code>bpy.context.window.screen.areas[0].type = &apos;VIEW_3D&apos;</code>{" "}
          before calling <code>_find_view3d_context()</code>.
        </li>
      </ul>
      <p>
        For modal (interactive) operators that need persistent context across
        user input events, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modal-operator-vertex-colour-painter"
          className={lk}
        >
          modal operator vertex colour painter
        </Link>
        {" "}tutorial — <code>temp_override</code> governs single-shot calls
        while <code>modal()</code> handles multi-frame interaction.
      </p>

      <h2>Outside References</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/advanced/scripting/context_override.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Context Overrides
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — the official migration
          guide from dict overrides to <code>temp_override()</code>. Sibling
          pages: bpy.ops overview · bpy.context screen areas · Writing Add-ons.
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.Context.html#bpy.types.Context.temp_override"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Python API — bpy.types.Context.temp_override
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — full signature,
          accepted keyword arguments, and notes on thread safety. Sibling
          entries: <code>bpy.ops.mesh</code> · <code>bpy.ops.object</code> ·{" "}
          <code>IDPropertyGroup</code>.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-context-temp-override-mesh-repair-pipeline",
  title:
    "Python bpy.context.temp_override() — Headless Mesh Repair: Normals, Merge-Doubles & Tri-to-Quad Pipeline (Blender 5.1)",
  date: "2026-06-29",
  kind: "tutorial",
  excerpt:
    "bpy.context.temp_override() is the Blender 4.0+ replacement for the deprecated context-dict pattern. This tutorial walks a three-pass mesh repair pipeline — merge-by-distance, recalculate normals, tris-to-quads — called safely from any execution context including headless CLI and Text Editor scripts.",
  tags: [
    "blender",
    "python",
    "scripting",
    "mesh-repair",
    "temp-override",
    "pipeline",
    "webxr",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-context-temp-override-mesh-repair-pipeline",
    time: "one hour",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable running bpy Python scripts from the Scripting workspace",
      "Understands the depsgraph evaluation chain (see Depsgraph Object Instances tutorial)",
      "Familiar with Python context managers (with statements)",
    ],
  },
  base,
);
