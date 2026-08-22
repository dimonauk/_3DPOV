import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonModalOperatorBody() {
  return (
    <>
      <p>
        Every operator in Blender&rsquo;s Python API executes, returns, and
        disappears. That is fine for discrete commands — add a mesh, apply a
        modifier — but completely wrong for interactive tools that need to{" "}
        <em>hold control of the viewport</em> between user events. The modal
        operator pattern solves this. A modal operator&rsquo;s{" "}
        <code>invoke()</code> method starts the tool and returns{" "}
        <code>&#123;&quot;RUNNING_MODAL&quot;&#125;</code>; from that moment
        the operator&rsquo;s own <code>modal()</code> method receives every
        mouse move, key press, and scroll event until it decides to finish or
        cancel. Nothing else interrupts it &mdash; it <em>owns</em> the input
        stream.
      </p>

      <p>
        This tutorial builds a vertex-colour painter: hold the left mouse
        button, drag across a UV sphere; each face swept over turns vermillion.
        The technique is the same pattern that drives Blender&rsquo;s built-in
        sculpt brushes, knife tool, and measurement tool. Understanding it
        unlocks the ability to write any interactive tool the studio needs that
        Blender does not already ship.
      </p>

      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          Python Add-on tutorial
        </Link>
        , which registers a panel and a simple one-shot operator. That pattern
        is correct for buttons and property setters. The modal pattern here is
        the correct choice when the tool needs continuous user input —
        anything where you&rsquo;d expect a cursor change and live visual
        feedback.
      </p>

      <h2 className="font-bold mt-6 mb-2">The modal lifecycle</h2>

      <p>
        Three methods define the operator&rsquo;s lifetime.{" "}
        <code>poll()</code> is checked before every invocation; if it returns{" "}
        <code>False</code> the button greys out and the operator cannot run.
        Here it checks that the cursor is in a 3-D Viewport and the active
        object is a mesh.
      </p>

      <p>
        <code>invoke()</code> runs exactly once, on the button click. It
        registers the HUD draw handler, calls{" "}
        <code>context.window_manager.modal_handler_add(self)</code> — this is
        the line that starts the modal loop — and returns{" "}
        <code>&#123;&quot;RUNNING_MODAL&quot;&#125;</code>. Returning{" "}
        <code>&#123;&quot;FINISHED&quot;&#125;</code> from{" "}
        <code>invoke()</code> instead would skip the modal loop entirely: a
        common mistake when adapting examples.
      </p>

      <p>
        <code>modal()</code> fires on every event. It returns one of four
        values:{" "}
        <code>&#123;&quot;RUNNING_MODAL&quot;&#125;</code> to keep the loop
        alive,{" "}
        <code>&#123;&quot;FINISHED&quot;&#125;</code> to end with an undo step,{" "}
        <code>&#123;&quot;CANCELLED&quot;&#125;</code> to end without one, or{" "}
        <code>&#123;&quot;PASS_THROUGH&quot;&#125;</code> to let Blender handle
        the event. The last is used here for middle-mouse orbit and scroll-wheel
        zoom so the user can navigate while the tool is active.
      </p>

      <h2 className="font-bold mt-6 mb-2">Screen-space ray casting</h2>

      <p>
        The mouse gives pixel coordinates inside the viewport region. Getting
        from there to a hit on the mesh surface takes two steps.
      </p>

      <p>
        First,{" "}
        <code>bpy_extras.view3d_utils.region_2d_to_origin_3d</code> and{" "}
        <code>region_2d_to_vector_3d</code> unproject the 2-D pixel into a
        world-space ray origin and direction. For a perspective camera the
        origin is the camera position and the direction fans outward. For an
        orthographic camera both are different — the utilities handle this
        automatically from <code>context.region_data</code>.
      </p>

      <p>
        Second,{" "}
        <code>
          context.scene.ray_cast(view_layer, origin, direction)
        </code>{" "}
        walks Blender&rsquo;s BVH acceleration structure for all visible
        objects and returns the first hit: a boolean, world-space hit position,
        surface normal, polygon index, and the object hit. Filtering on the
        returned object prevents stray scene geometry from being accidentally
        painted. The polygon index feeds directly into{" "}
        <code>mesh.polygons[face_idx]</code>.
      </p>

      <h2 className="font-bold mt-6 mb-2">Colour attributes in Blender 5.1</h2>

      <p>
        Blender 3.3 deprecated <code>mesh.vertex_colors</code> and introduced{" "}
        <code>mesh.color_attributes</code>. The new API lets you choose both
        the storage <em>type</em> (BYTE_COLOR for 8-bit per-channel albedo;
        FLOAT_COLOR for HDR data like emission or light bakes) and the{" "}
        <em>domain</em> (POINT for per-vertex; CORNER for per-loop).
      </p>

      <p>
        This blueprint uses <strong>BYTE_COLOR / CORNER</strong>. The CORNER
        domain stores one entry per mesh loop — the same granularity as UVs —
        so each polygon can carry a unique colour at a shared vertex. That
        behaviour is required for the studio&rsquo;s faceted shading style,
        the same mesh topology that powers the{" "}
        <Link href="/tutorials/blender-tutorial-vertex-colour-attributes" className={lk}>
          Vertex Colour Attributes tutorial
        </Link>{" "}
        and the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-flat-normals" className={lk}>
          faceted gem workflow
        </Link>
        . With POINT domain a painted stripe would bleed smoothly across every
        face sharing that vertex; CORNER keeps boundaries hard.
      </p>

      <p>
        Writing the colour is one line per loop once you have the polygon:
      </p>

      <pre className="bg-zinc-900 rounded p-3 text-sm overflow-x-auto my-3">
        <code>
          {`for li in range(poly.loop_start, poly.loop_start + poly.loop_total):\n    col_attr.data[li].color = (1.0, 0.25, 0.05, 1.0)`}
        </code>
      </pre>

      <p>
        <code>poly.loop_start</code> is the index of the first loop for this
        face in the flat loops array; <code>poly.loop_total</code> is the face
        vertex count. Iterating that range paints every corner of the face
        independently.
      </p>

      <h2 className="font-bold mt-6 mb-2">GPU module HUD overlay</h2>

      <p>
        The brush circle that follows the cursor is drawn by a draw handler — a
        Python callback that runs every time Blender redraws the viewport.
        Registering it:
      </p>

      <pre className="bg-zinc-900 rounded p-3 text-sm overflow-x-auto my-3">
        <code>
          {`self._handle = bpy.types.SpaceView3D.draw_handler_add(\n    _draw_brush_hud, (self, context), "WINDOW", "POST_PIXEL"\n)`}
        </code>
      </pre>

      <p>
        <code>&quot;POST_PIXEL&quot;</code> fires after the 3-D scene is
        composited but before the UI chrome — exactly the right layer for a
        screen-space overlay. Inside the callback,{" "}
        <code>gpu.shader.from_builtin(&quot;UNIFORM_COLOR&quot;)</code> returns
        a flat-colour shader;{" "}
        <code>batch_for_shader</code> uploads a LINE_STRIP of 33 points (a
        closed circle) and <code>batch.draw()</code> rasterises it.{" "}
        <code>blf.draw()</code> handles the status text.
      </p>

      <p>
        The critical discipline:{" "}
        <strong>every exit path must call draw_handler_remove.</strong> A
        handler attached to SpaceView3D survives the operator&rsquo;s death —
        it keeps firing on every redraw until the space is closed or Blender
        restarts. The <code>_finish()</code> helper is called from both
        FINISHED and CANCELLED branches of <code>modal()</code> to ensure the
        token is always removed.
      </p>

      <h2 className="font-bold mt-6 mb-2">
        Operator options: GRAB_CURSOR, BLOCKING, UNDO
      </h2>

      <p>
        <code>GRAB_CURSOR</code> locks the OS pointer inside the viewport
        during a paint stroke so the cursor cannot drift off the window
        mid-drag. <code>BLOCKING</code> prevents scroll-wheel events from
        reaching Blender&rsquo;s input system while the left mouse button is
        held — without it a fast swipe can accidentally trigger zoom
        mid-stroke. <code>UNDO</code> wraps the operator&rsquo;s entire
        lifetime into a single undo push; every loop colour written during a
        session becomes one Ctrl+Z step. Compare with the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api" className={lk}>
          Geometry Nodes tree API tutorial
        </Link>
        , where changes made through <code>bpy.ops</code> each create their own
        undo step.
      </p>

      <h2 className="font-bold mt-6 mb-2">Extending for the studio</h2>

      <p>
        Add a <code>FloatVectorProperty(subtype=&apos;COLOR&apos;)</code> to a
        persistent{" "}
        <code>bpy.types.Scene</code> property group and surface it in the
        N-panel. The operator reads it at paint time — the same wiring shown in
        the{" "}
        <Link href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group" className={lk}>
          custom panel tutorial
        </Link>
        . For a soft-radius brush, swap the single face-hit test for a{" "}
        <code>mathutils.bvhtree.BVHTree.FromObject()</code> query that finds all
        faces within a distance threshold, then scale the colour by a Gaussian
        falloff from the cursor&rsquo;s projected world position. The per-loop
        write loop is identical; only the set of polygons changes.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-modal-operator-vertex-colour-painter",
  title:
    "Python Modal Operator — Interactive 3-D Vertex-Colour Painter (Blender 5.1)",
  date: "2026-06-18",
  kind: "tutorial",
  excerpt:
    "Build a custom paint tool that holds the viewport event loop, ray-casts from screen pixels to mesh faces via bpy_extras.view3d_utils + scene.ray_cast(), writes BYTE_COLOR / CORNER-domain colour attributes (Blender 5.1 API), and draws a live brush-radius HUD via gpu.shader + SpaceView3D draw handler. The same architecture as Blender's built-in sculpt brushes.",
  Body: PythonModalOperatorBody,
  furtherReading: [
    {
      label: "Blender Python API — bpy.types.Operator.modal",
      href: "https://docs.blender.org/api/current/bpy.types.Operator.html#bpy.types.Operator.modal",
    },
    {
      label: "njanakiev/blender-scripting (MIT) — Nicolas Janakiev",
      href: "https://github.com/njanakiev/blender-scripting",
    },
  ],
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one to two hours",
    difficulty: "expert",
    libraryPath:
      "blends/scripting/python-modal-operator-vertex-colour-painter",
    prerequisites: [
      "Comfortable reading Python classes and method overrides.",
      "Blender 5.1 installed with the Scripting workspace open.",
      "Familiarity with the Properties panel and the N-panel (View3D side panel).",
      "Basic bpy.data and bpy.ops usage — see the Python Add-on tutorial and the bpy bmesh tutorials.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "mesh.color_attributes (replaces vertex_colors) requires Blender 3.3+. bpy_extras.view3d_utils and scene.ray_cast() are stable since 2.8x. gpu.shader.from_builtin() requires Blender 3.4+.",
      },
    ],
    steps: [
      {
        title: "Run blueprint.py — build the scene and register the operator",
        body: `Open Blender, switch to the Scripting workspace, open blueprint.py, and press Run Script (Alt+P).

The script calls build_scene(), which:
  • bpy.ops.wm.read_factory_settings(use_empty=True) — fresh scene
  • Adds a 32-segment / 16-ring UV sphere named "paint_canvas"
  • Creates a BYTE_COLOR / CORNER-domain colour attribute named "Col"
  • Fills every loop with BASE_COLOUR (neutral grey)
  • Sets viewport shading to Solid → Colour Type → Vertex

It then calls register(), which calls bpy.utils.register_class() for both the operator and the panel class.  You will see two status lines in the console:
  [blueprint] paint_canvas sphere ready.
  [blueprint] N-panel → Holoflow → 'HF Vertex Colour Paint' to start.`,
      },
      {
        title: "Understand the poll() and invoke() chain",
        body: `HOLOFLOW_OT_vertex_colour_paint.poll() is evaluated every time Blender considers enabling the operator's button.  It checks:
  context.area.type == "VIEW_3D"
  context.active_object is not None
  context.active_object.type == "MESH"

If any check fails the button is greyed out.  This prevents the operator from being invoked from a Properties panel or Image Editor, where there is no region_data for the ray unproject.

invoke() runs on the button click:
  1. Checks area type again (poll() is not infallible across context switches).
  2. Records mouse position into _mouse_x / _mouse_y for the HUD callback.
  3. Registers the draw handler: SpaceView3D.draw_handler_add(callback, args, "WINDOW", "POST_PIXEL").
  4. modal_handler_add(self) — Blender now routes events to this operator's modal() instead of the default keymap.
  5. Returns {"RUNNING_MODAL"}.`,
      },
      {
        title: "Walk the modal() event loop",
        body: `modal() is called for every event type: MOUSEMOVE, LEFTMOUSE, MIDDLEMOUSE, WHEELUPMOUSE, keyboard keys, timer events, even focus changes.

This operator handles:
  RET / NUMPAD_ENTER / SPACE → _finish(), return {"FINISHED"}.
  RIGHTMOUSE / ESC → _finish(), return {"CANCELLED"}.  No undo push.
  LEFTMOUSE PRESS → set _painting = True, call _paint() immediately.
  LEFTMOUSE RELEASE → set _painting = False.
  MOUSEMOVE (while _painting) → call _paint() again.
  MIDDLEMOUSE / WHEELUPMOUSE / WHEELDOWNMOUSE → return {"PASS_THROUGH"}.

PASS_THROUGH on navigation events is critical.  Without it, BLOCKING intercepts them — the user cannot orbit or zoom while the operator is alive.  Our operator's _painting flag prevents accidental paint on navigation: MMB drag sets _painting = False because LEFTMOUSE RELEASE was never sent.`,
      },
      {
        title: "Implement _paint() — ray cast from 2-D to 3-D",
        body: `_paint() converts the 2-D mouse pixel to a world-space ray and fires it at the scene BVH:

  region  = context.region          # the rectangle the 3-D view draws into
  rv3d    = context.region_data     # camera matrices for this view

  origin    = view3d_utils.region_2d_to_origin_3d(region, rv3d, (mx, my))
  direction = view3d_utils.region_2d_to_vector_3d(region, rv3d, (mx, my))

  hit, loc, norm, face_idx, hit_obj, mat = context.scene.ray_cast(
      context.view_layer, origin, direction
  )

For a perspective camera, region_2d_to_origin_3d returns the camera position — every ray originates there.  For orthographic it returns a point on the near plane aligned with the pixel; the direction is constant (parallel projection).

If hit is False, or hit_obj is not the active object, we return early.  The face_idx is an integer index into mesh.polygons.`,
      },
      {
        title: "Write BYTE_COLOR data to the CORNER domain attribute",
        body: `With face_idx in hand, write BRUSH_COLOUR to every loop of that polygon:

  col_attr = mesh.color_attributes.get(COL_ATTR_NAME)
  if col_attr is None:
      col_attr = mesh.color_attributes.new(
          name=COL_ATTR_NAME, type="BYTE_COLOR", domain="CORNER"
      )

  poly = mesh.polygons[face_idx]
  for li in range(poly.loop_start, poly.loop_start + poly.loop_total):
      col_attr.data[li].color = BRUSH_COLOUR

  mesh.update()

CORNER domain: colour_attributes.data has one entry per loop, not per vertex.  mesh.polygons[i].loop_start is the flat array index of this polygon's first loop; loop_total is the number of loops (= number of vertices for this face).

BYTE_COLOR stores values as 4 floats in [0, 1] at write time, but internally clamps to 8-bit precision.  This is fine for albedo; for HDR emission use FLOAT_COLOR instead.

mesh.update() notifies Blender's draw engine to pull the changed attribute data to the GPU.  Without it the painted face will not redraw until the next unrelated event forces a refresh.`,
      },
      {
        title: "Register and clean up the GPU draw handler",
        body: `The brush-circle HUD runs every viewport redraw:

  def _draw_brush_hud(op, context):
      n   = 32
      pts = [(mx + R*cos(i*τ/n), my + R*sin(i*τ/n)) for i in range(n+1)]
      shader = gpu.shader.from_builtin("UNIFORM_COLOR")
      batch  = batch_for_shader(shader, "LINE_STRIP", {"pos": pts})
      gpu.state.blend_set("ALPHA")
      shader.bind()
      shader.uniform_float("color", (1.0, 1.0, 1.0, 0.85))
      batch.draw(shader)
      gpu.state.blend_set("NONE")
      # blf status text …

The handler token (self._handle) must be removed in _finish():

  bpy.types.SpaceView3D.draw_handler_remove(self._handle, "WINDOW")

Never skip this.  A leaked handler fires on every redraw indefinitely.  The _finish() helper is called from both FINISHED and CANCELLED branches — including from any early return you might add later.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Brush paints the wrong object",
        cause:
          "scene.ray_cast() returns any visible object. The active-object filter is missing or the condition is inverted.",
        fix: "Confirm: if not hit or hit_obj is not obj: return. Check that 'obj = context.active_object' is assigned before the ray cast.",
      },
      {
        symptom: "HUD circle is absent after operator launches",
        cause:
          "draw_handler_add silently fails when area.type != 'VIEW_3D' at invocation time.",
        fix: "Add print(self._handle) after draw_handler_add. A None result means the add failed. Confirm the N-panel button is inside a 3-D Viewport, not a Properties editor.",
      },
      {
        symptom: "Colour attribute not visible in the viewport",
        cause:
          "Viewport shading Colour Type is not set to Vertex, or the active_color attribute is wrong.",
        fix: "Viewport header → Solid shading overlay (sphere icon) → Colour: Vertex. In Python: obj.data.color_attributes.active_color = col_attr after creating it.",
      },
      {
        symptom: "'already registered' error on second Run Script",
        cause:
          "The previous session's class registration was never cleaned up.",
        fix: "blueprint.py includes an unregister guard before register(). If it fails, restart Blender — factory settings reset wipes all session registrations.",
      },
      {
        symptom: "BLOCKING option prevents viewport navigation",
        cause:
          "PASS_THROUGH return is missing for MIDDLEMOUSE / wheel events.",
        fix: "Add: if event.type in {'MIDDLEMOUSE', 'WHEELUPMOUSE', 'WHEELDOWNMOUSE'}: return {'PASS_THROUGH'}",
      },
    ],
  },
  base,
);
