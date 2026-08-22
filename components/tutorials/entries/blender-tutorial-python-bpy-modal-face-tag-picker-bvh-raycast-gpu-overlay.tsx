import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every interactive tool in Blender that holds the viewport &mdash; the
        knife tool, the sculpt brush, the annotation pencil &mdash; is a{" "}
        <strong>modal operator</strong>. Unlike a one-shot operator that fires
        and returns, a modal operator&rsquo;s <code>invoke()</code> hands
        control to the window manager and returns{" "}
        <code>&#123;&quot;RUNNING_MODAL&quot;&#125;</code>; from that moment its{" "}
        <code>modal()</code> method receives every mouse move, key press, and
        scroll event until the tool decides to finish. This tutorial builds one
        from scratch: a face-tagging brush that stamps a{" "}
        <code>holoflow_facet</code> integer attribute onto whatever face the
        cursor touches and draws a real-time amber overlay to confirm.
      </p>
      <p>
        The two supporting pillars are a{" "}
        <strong>BVH tree</strong> (
        <code>mathutils.bvhtree.BVHTree</code>) for fast ray-triangle
        intersection, and{" "}
        <strong>view3d_utils</strong> (
        <code>bpy_extras.view3d_utils</code>) for converting the 2-D mouse
        position to a 3-D world-space ray. Together they let the operator
        answer &ldquo;which face is under the cursor?&rdquo; in{" "}
        <em>O(log n)</em> time on any frame. The GPU draw handler
        (<code>SpaceView3D.draw_handler_add</code> <code>POST_PIXEL</code>)
        draws screen-space quads at each tagged face&rsquo;s projected centre
        so the artist sees live feedback without entering Edit Mode.
      </p>
      <p>
        The result directly powers the studio&rsquo;s WebXR export workflow.
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modal-operator-vertex-colour-painter"
          className={lk}
        >
          vertex-colour modal operator
        </Link>{" "}
        (the same lifecycle, different write target) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay"
          className={lk}
        >
          GPU viewport draw overlay
        </Link>{" "}
        tutorial (the draw handler pattern without the modal loop).
      </p>

      <h2>Why a BVH tree, not bpy.ops.mesh.select_all + ray_cast</h2>
      <p>
        <code>bpy.ops.view3d.select</code> and{" "}
        <code>bpy_extras.object_utils.world_to_camera_view</code> work in
        context and are blocked inside modal operators. The correct low-level
        path is: unproject the mouse with <code>view3d_utils</code> to get a
        world-space ray, transform the ray into object-local space, then test
        it against a <code>BVHTree</code> built from the mesh. The BVH is the
        same acceleration structure used by Blender&rsquo;s physics solver
        and the shrinkwrap modifier — it stores one axis-aligned bounding box
        per triangle, allowing a query to prune most triangles in O(log n)
        without iterating every face.
      </p>
      <pre>{`# Build once at invoke() — cheap cache for the session
bm = bmesh.new()
bm.from_mesh(ob.data)
bvh = BVHTree.FromBMesh(bm, epsilon=1e-5)

# On every MOUSEMOVE: unproject → local ray → BVH query
w_orig = view3d_utils.region_2d_to_origin_3d(region, rv3d, mouse_co)
w_dir  = view3d_utils.region_2d_to_vector_3d(region, rv3d, mouse_co)
l_orig = ob.matrix_world.inverted() @ w_orig
l_dir  = (ob.matrix_world.inverted().to_3x3() @ w_dir).normalized()
_, _, face_idx, _ = bvh.ray_cast(l_orig, l_dir)`}</pre>
      <p>
        The BVH is built from the base mesh (before modifiers) and cached.
        Rebuilding on every <code>MOUSEMOVE</code> event would be 10&ndash;100&times;
        slower on dense meshes. Apply any topology-changing modifiers before
        invoking the picker if the BVH and the bmesh need to agree on face
        indices.
      </p>

      <h2>Per-face integer attributes via bmesh layers</h2>
      <p>
        Integer attributes on faces — <code>bm.faces.layers.int</code> — are
        the right storage for mesh metadata. They survive undo, persist into
        the .blend file, and export as custom attributes in GLB (readable in
        Three.js via <code>mesh.geometry.attributes</code>). The
        <code>holoflow_facet</code> attribute is the signal read by{" "}
        <code>holoflow_webxr_exporter</code> at export time.
      </p>
      <pre>{`layer = bm.faces.layers.int.get("holoflow_facet") \
    or bm.faces.layers.int.new("holoflow_facet")
face[layer] = 1          # tag
face[layer] = 0          # clear
bm.to_mesh(ob.data)      # flush shadow bmesh → real mesh
ob.data.update()`}</pre>
      <p>
        The <code>bm.to_mesh()</code> call on every stroke event is the
        bottleneck on high-poly meshes. The blueprint guards it with an
        idempotency check: if the face already holds the target value, the
        flush is skipped.
      </p>

      <h2>Custom keymap without a bl_info add-on</h2>
      <p>
        A script running from the Scripting workspace can still register a
        keymap using <code>wm.keyconfigs.addon</code>. The key difference
        from a real add-on: the keymap must be unregistered manually (call
        <code>unregister()</code>) before editing the script, otherwise the
        old binding persists alongside the new one.
      </p>
      <pre>{`wm = bpy.context.window_manager
km  = wm.keyconfigs.addon.keymaps.new(name='3D View', space_type='VIEW_3D')
kmi = km.keymap_items.new('holoflow.face_tag_picker', type='F', value='PRESS')
_addon_keymaps.append((km, kmi))`}</pre>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          add-on custom panel
        </Link>{" "}
        tutorial (full <code>bl_info</code> manifest) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modal-progress-bar-cancel-long-operation"
          className={lk}
        >
          progress-bar modal
        </Link>{" "}
        tutorial for a simpler lifecycle pattern with no GPU overlay.
      </p>
    </>
  );
}

const data = {
  title:
    "Python — Modal Operator + BVH Raycast: Interactive Face-Tag Picker with GPU Overlay & Custom Keymap (Blender 5.1)",
  lede:
    "Register a modal operator that casts a BVHTree ray from the mouse position through view3d_utils, writes a holoflow_facet integer attribute to every hit face via bmesh.faces.layers.int, draws a real-time amber overlay with a SpaceView3D draw_handler POST_PIXEL, and binds the whole tool to the F key via wm.keyconfigs.addon — the complete pattern for any interactive viewport brush.",
  date: "2026-07-26",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-bpy-modal-face-tag-picker-bvh-raycast-gpu-overlay",
  difficulty: "expert" as const,
  time: "one session",
  prerequisites: [
    "Comfortable with Blender Python scripting (bpy.ops, bpy.data, bmesh basics)",
    "Understand Blender's operator return values: FINISHED, CANCELLED, RUNNING_MODAL, PASS_THROUGH",
    "Know how to open the Scripting workspace and run a script",
  ],
  steps: [
    {
      title: "Register the operator",
      body: "Open blueprint.py in the Scripting workspace and click ▶ Run Script. The header bar does not change yet — registration is silent. Confirm success by opening the F3 search menu and typing 'Face Tag'; 'Holoflow Face Tag Picker' should appear.",
    },
    {
      title: "Add a test mesh",
      body: "In the 3D Viewport, add a UV Sphere (Shift+A → Mesh → UV Sphere, 16 segments, 8 rings). Make sure it is selected and the mode is Object Mode.",
    },
    {
      title: "Enter picker mode",
      body: "Press F. The viewport header changes to 'Face Tag Picker: LMB paint · Ctrl+LMB erase · RMB/Esc exit'. The operator is now in RUNNING_MODAL state — all mouse events are captured.",
    },
    {
      title: "Paint faces",
      body: "LMB-click anywhere on the sphere surface. An amber square appears over the hit face. LMB-drag to paint a continuous stroke across the hemisphere. Each face is written once (idempotent: re-hitting the same face is a no-op).",
    },
    {
      title: "Erase faces",
      body: "Hold Ctrl and LMB-drag over tagged faces. The amber overlays disappear as holoflow_facet is reset to 0. The draw handler re-projects face centres on every redraw, so the overlay is always in sync.",
    },
    {
      title: "Exit and inspect",
      body: "Press RMB or Esc to exit. In the N-panel → Object Data Properties → Attributes, confirm that 'holoflow_facet' appears as a Face Integer domain attribute. Tab into Edit Mode and enable Face Select — select any face; its Value is visible in the Item panel.",
    },
    {
      title: "Adapt to multi-tag values",
      body: "Change TAG_VALUE to 2, re-register the script, and paint a second region. Each region now has a distinct integer. The exporter can route different values to different materials or LOD states. The same technique supports unlimited semantic layers (shadow-catcher, emissive, collision) without changing the mesh topology.",
    },
  ],
  troubleshooting: [
    {
      symptom: "F key does nothing after running the script",
      cause:
        "The keymap was already registered from a previous run without calling unregister(). Duplicate keymaps silently coexist and the first one wins.",
      fix: "Call unregister() in the console (bpy.ops.holoflow.face_tag_picker.unregister() or execute the unregister() function from the script), then re-run blueprint.py. Alternatively use F3 → 'Face Tag Picker' to invoke it by name.",
    },
    {
      symptom: "Amber overlay visible but face attribute not written",
      cause:
        "The bm.to_mesh() flush is guarded by the idempotency check. If face_idx from the BVH does not match the face in the shadow bmesh, the write is a no-op.",
      fix: "The BVH is built from ob.data before modifiers. If a Subdivision or Solidify modifier is active, apply it first so the BVH face count matches the bmesh. Check that context.mode == 'OBJECT' — the poll() guard rejects Edit Mode.",
    },
    {
      symptom: "TypeError: 'NoneType' has no attribute 'region_3d' on MOUSEMOVE",
      cause:
        "context.space_data is None when the mouse is outside the 3D Viewport — e.g. on the N-panel strip or the toolbar.",
      fix: "Guard the raycast with: if not context.space_data or not context.space_data.region_3d: return {'RUNNING_MODAL'}. The blueprint already includes this guard in _raycast via the region/rv3d variables.",
    },
    {
      symptom: "Overlay quads persist after the operator exits",
      cause:
        "draw_handler_remove was not called. This happens if the operator was force-interrupted by a crash or a direct call to bpy.ops.ed.undo() inside modal.",
      fix: "Re-run the script to re-register the class, which clears all lingering handlers. In production add-ons, guard against this by storing the handle in bpy.app.driver_namespace and removing it in the next register() call.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Python API — bpy_extras.view3d_utils — CC BY-SA 4.0 — Blender Foundation — region_2d_to_origin_3d and vector_3d reference",
      href: "https://docs.blender.org/api/current/bpy_extras.view3d_utils.html",
    },
    {
      label:
        "Blender Python API — mathutils.bvhtree — CC BY-SA 4.0 — Blender Foundation — BVHTree.FromBMesh and ray_cast parameter reference",
      href: "https://docs.blender.org/api/current/mathutils.bvhtree.html",
    },
    {
      label:
        "Blender Python API — gpu module — CC BY-SA 4.0 — Blender Foundation — gpu.shader.from_builtin and gpu.state reference",
      href: "https://docs.blender.org/api/current/gpu.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python Modal Operator — Vertex Colour Painter: the same modal lifecycle writing vertex colours instead of face attributes",
      href: "/tutorials/blender-tutorial-python-modal-operator-vertex-colour-painter",
    },
    {
      label:
        "Python GPU Viewport Draw Overlay: draw handler basics without the modal loop",
      href: "/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay",
    },
    {
      label:
        "Python Add-on — Custom Panel & PropertyGroup: full bl_info add-on structure with panel and operator registration",
      href: "/tutorials/blender-tutorial-python-addon-custom-panel-property-group",
    },
    {
      label:
        "Python Modal Operator — Progress Bar & Cancel: a simpler modal pattern for long background operations",
      href: "/tutorials/blender-tutorial-python-modal-progress-bar-cancel-long-operation",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-modal-face-tag-picker-bvh-raycast-gpu-overlay",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: ["blender", "scripting", "webxr", "vrm", "tools"],
    body: Body,
  },
  data,
);
