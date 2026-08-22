import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GpuViewportDrawOverlayBody() {
  return (
    <>
      <p>
        Blender 5.1 removed the <code>bgl</code> OpenGL wrapper that 3.x
        add-ons used for custom viewport drawing. Its replacement — the{" "}
        <a
          href="https://docs.blender.org/api/current/gpu.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>gpu</code> module
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) — is a proper GPU abstraction that
        works across Metal, Vulkan, and OpenGL backends. The draw-handler
        pattern is the same: <code>SpaceView3D.draw_handler_add(callback, (), &apos;WINDOW&apos;, &apos;POST_VIEW&apos;)</code>.
        What changes is everything below that line.
      </p>
      <p>
        This tutorial walks a practical use case: coloured arrows over every
        face of the active mesh, encoding the world-space normal direction as a
        blue (−Z) → red (+Z) gradient. That kind of debug overlay is essential
        for rigging diagnosis, hard-surface normal cleanup, cloth simulation
        review, and custom add-on development. The same pattern wired to
        a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Named Attribute
        </Link>{" "}
        can visualise any per-face scalar — curvature, temperature, wetness —
        without touching a material or a render pass. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          frame-change handler tutorial
        </Link>{" "}
        for the <code>@persistent</code> pattern (handlers that survive file
        reload), and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modal-operator-vertex-colour-painter"
          className={lk}
        >
          modal operator tutorial
        </Link>{" "}
        for mouse-interactive viewport tools that pair well with draw overlays.
      </p>
      <p>
        The key new API surface is{" "}
        <a
          href="https://docs.blender.org/api/current/gpu_extras.batch.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>gpu_extras.batch.batch_for_shader</code>
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation). It builds a{" "}
        <code>gpu.types.GPUBatch</code> from a shader and a dict of attribute
        arrays — position + per-vertex colour in our case. The built-in shader{" "}
        <code>&apos;SMOOTH_COLOR&apos;</code> accepts <code>pos</code> (vec3) and{" "}
        <code>color</code> (vec4 linear RGBA) and interpolates colour across
        each primitive without any custom GLSL. That covers 90 % of tool-overlay
        needs; the remaining 10 % (UV-space drawing, custom uniforms, stencil
        tests) require <code>gpu.types.GPUShader</code> with your own GLSL
        source strings, which is a natural extension of this same scaffold. See
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          bpy GN Tree API tutorial
        </Link>{" "}
        for reading the evaluated depsgraph mesh — the same{" "}
        <code>obj.evaluated_get(dg)</code> call we use here to get post-modifier
        face normals — and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          custom panel &amp; property group tutorial
        </Link>{" "}
        for wrapping this overlay inside a proper add-on with a toggle button.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-gpu-viewport-draw-overlay",
  title:
    "Python — gpu Module: Custom Viewport Overlay — Coloured Face-Normal Arrows in the 3D View (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Draw coloured face-normal debug arrows in the 3D Viewport using gpu.shader, gpu.types.GPUBatch, and SpaceView3D.draw_handler_add — Blender 5.1's replacement for the deprecated bgl module.",
  Body: GpuViewportDrawOverlayBody,
};

export const entry = buildInstructable(
  {
    time: "one sitting",
    difficulty: "advanced",
    blenderVersion: "5.1",
    libraryPath: "public/library/blends/scripting/python-gpu-viewport-draw-overlay/",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "gpu.shader.from_builtin('SMOOTH_COLOR') and gpu_extras.batch require 4.0+. bgl was removed in 5.0.",
      },
    ],
    prerequisites: [
      "Comfortable in the Blender Scripting workspace — can open and run a text block.",
      "Understands bpy.context.active_object and basic mesh data access.",
      "Familiar with Python functions and module-level state.",
    ],
    steps: [
      {
        title: "Why POST_VIEW and not POST_PIXEL",
        body:
          "'POST_VIEW' fires after Blender has drawn all geometry, while the depth buffer is still live. Drawing in this region means our arrows respect occlusion — a face whose normal points inward is partially clipped by the mesh's own geometry. 'POST_PIXEL' draws in screen coordinates after the depth buffer is resolved; nothing is clipped, and coordinates must be in pixels, not world metres.\n\nFor a tool that visualises 3D data — normals, curvature, constraint targets — POST_VIEW is almost always correct. POST_PIXEL is for HUD-style annotation: a progress bar, a text label, an icon.",
      },
      {
        title: "Correct normal transform: inverse-transpose",
        body:
          "To transform a direction vector correctly under a matrix M, multiply by (M⁻¹)ᵀ — the inverse-transpose of M's 3×3 sub-matrix.\n\n  mat   = obj.matrix_world\n  inv_t = mat.inverted().transposed().to_3x3()\n  w_normal = (inv_t @ local_normal).normalized()\n\nFor a uniform-scale object (all axes scaled equally), inv_t == mat.to_3x3() — so the shortcut works. For non-uniform scale — a squashed mesh, a bone with differential axis stretch — the full calculation is required or the normals will shear toward the stretched axis. Always use inv_t; the extra cost is negligible.",
      },
      {
        title: "Build the GPUBatch with batch_for_shader",
        body:
          "  from gpu_extras.batch import batch_for_shader\n  shader = gpu.shader.from_builtin('SMOOTH_COLOR')\n\n  verts  = []   # [root0, tip0, root1, tip1, ...] — interleaved\n  colors = []   # [col0, col0, col1, col1, ...]  — same colour per pair\n\n  for poly in mesh.polygons:\n      w_centre = mat @ poly.center\n      w_normal = (inv_t @ mathutils.Vector(poly.normal)).normalized()\n      tip = w_centre + w_normal * NORMAL_LENGTH\n      t   = (w_normal.z + 1.0) * 0.5   # 0=blue(−Z), 1=red(+Z)\n      col = (lerp(COL_DOWN[0], COL_UP[0], t), ...)  # R,G,B,A\n      verts  += [tuple(w_centre), tuple(tip)]\n      colors += [col, col]\n\n  batch = batch_for_shader(shader, 'LINES', {'pos': verts, 'color': colors})\n\n'LINES' interprets consecutive pairs of vertices as individual segments — no index buffer. Interleaving root and tip before building the list keeps both arrays in lock-step without zip at draw time.",
      },
      {
        title: "GPU state: depth-test read-only, line width, restore",
        body:
          "  gpu.state.depth_test_set('LESS_EQUAL')  # read depth for occlusion\n  gpu.state.depth_mask_set(False)          # do NOT write — preserve scene depth\n  gpu.state.line_width_set(LINE_WIDTH)     # wider than default 1 px\n\n  shader.bind()\n  batch.draw(shader)\n\n  gpu.state.line_width_set(1.0)            # restore Blender default\n  gpu.state.depth_mask_set(True)\n\nWHY restore? Blender reuses GPU state across draw callbacks in the same frame. If we leave depth_mask False, Blender's own wireframe and gizmo passes may fail to write depth correctly, producing z-fighting on subsequent objects in the viewport.",
      },
      {
        title: "Register and unregister cleanly",
        body:
          "  _handle = bpy.types.SpaceView3D.draw_handler_add(\n      callback, (), 'WINDOW', 'POST_VIEW'\n  )\n\nThe returned handle is an opaque object. Store it at module level. To clean up:\n\n  bpy.types.SpaceView3D.draw_handler_remove(_handle, 'WINDOW')\n  _handle = None\n\nA guard before registering prevents duplicate callbacks if the script is run twice:\n\n  if _handle is not None:\n      bpy.types.SpaceView3D.draw_handler_remove(_handle, 'WINDOW')\n\nDuplicate handlers are silent — they just burn CPU drawing the overlay twice — so the guard is worth adding even in quick prototype scripts. If this overlay is packaged as an add-on, call unregister_overlay() from the add-on's unregister() function to prevent dangling callbacks that crash Blender on restart.",
      },
      {
        title: "Force immediate redraw",
        body:
          "draw_handler_add binds the callback but does not trigger a redraw. The overlay appears the next time the viewport is repainted — usually the next mouse movement. For a smooth scripted demo or a screencast, force an immediate redraw:\n\n  for area in bpy.context.screen.areas:\n      if area.type == 'VIEW_3D':\n          area.tag_redraw()\n\ntag_redraw() queues a redraw on the next event loop tick — it does not draw synchronously. This is correct; calling draw functions directly outside Blender's compositor is unsafe.",
      },
    ],
    finalResult:
      "A draw_handler registered on SpaceView3D that draws a coloured line segment per face normal of the active mesh — blue arrows for faces pointing toward −Z, red for +Z, gradient for all angles between. The overlay updates live as the object is edited, rotated, or swapped. Calling unregister_overlay() removes it cleanly without a Blender restart.",
    variations: [
      "Visualise custom Named Attributes: instead of poly.normal, read a float attribute baked by a Geometry Nodes tree. Use mesh.attributes['my_scalar'].data[i].value (per-face domain) and map the float to a diverging colour ramp. This turns any GN computation into a live viewport colour field — temperature, curvature, wear — without a material or render pass.",
      "Per-vertex domain: iterate mesh.vertices instead of mesh.polygons, sample mesh.vertex_normals[i].vector, and draw from vertex position toward vertex + normal * length. Vertex normals reflect custom split normals and smooth shading, while face normals are always flat — choose the domain that matches the diagnostic question.",
      "Wrap inside an add-on with a toggle operator: define a bpy.types.Operator with bl_idname='view3d.toggle_normal_overlay', add a BoolProperty on the Scene or WindowManager to track state, call register_overlay() on invoke if the property is False, unregister_overlay() if True. Register the operator in the add-on's register() and bind it to N-panel UI via a Panel class.",
    ],
    troubleshooting: [
      {
        symptom: "Arrows appear but do not update when the mesh is edited",
        cause:
          "The draw callback builds the GPUBatch from obj.to_mesh() on the base mesh. In Edit Mode, Blender caches the evaluated mesh separately from the in-progress edit-mode BMesh; the base mesh is not updated until you leave Edit Mode or call bmesh.update_edit_mesh().",
        fix:
          "In Edit Mode, build the batch from bmesh.from_edit_mesh(obj.data) and iterate bm.faces instead of mesh.polygons. Import bmesh, call bm = bmesh.from_edit_mesh(obj.data), and read bm.faces[i].normal and bm.faces[i].calc_center_median(). This reflects in-flight edit operations in real time.",
      },
      {
        symptom: "Blender crashes on file close or add-on disable",
        cause:
          "The draw_handler_add handle was not removed before the Python module was unloaded. Blender tried to call the now-invalid Python function pointer during the next viewport redraw.",
        fix:
          "Always call draw_handler_remove in the add-on's unregister() function, in a file-load pre-handler, and in any cleanup path. Store the handle in a variable that survives hot-reloads (module-level or on bpy.app as a fallback); a local variable is garbage-collected and the handle is lost.",
      },
      {
        symptom: "Arrows are invisible or drawn behind all geometry",
        cause:
          "depth_test_set was left as 'NONE', or the callback is registered with 'PRE_VIEW' instead of 'POST_VIEW'. PRE_VIEW fires before geometry is drawn, so everything painted there is overwritten.",
        fix:
          "Confirm the region string is 'POST_VIEW'. Set gpu.state.depth_test_set('LESS_EQUAL') before drawing — this is the standard depth comparison that respects existing geometry. If arrows are still hidden, temporarily set depth_test_set('NONE') to confirm they are actually being drawn; if they appear, the depth value of the arrow vertices is behind the mesh surface (numeric precision issue with thin meshes).",
      },
      {
        symptom: "AttributeError: module 'gpu' has no attribute 'state'",
        cause:
          "Running the script in Blender 3.x where gpu.state did not exist (it was added in 4.0 alongside the removal of bgl).",
        fix:
          "Upgrade to Blender 4.0 or later. In 3.x, use bgl.glLineWidth() and bgl.glEnable(bgl.GL_DEPTH_TEST) instead — but note bgl is fully removed in 5.0 and this path has no future on 5.x.",
      },
    ],
  },
  base,
);
