import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender export pipeline eventually hits the same friction point:
        you want a single keypress — F12, ideally, because your hands are
        already on the keyboard — to trigger a full GLB export with all the
        Holoflow conventions applied. Operators require manual invocation.
        App-handlers fire on every frame change or require polling. The correct
        solution is a <code>bpy.types.RenderEngine</code> subclass: it
        registers in the Scene &gt; Render Engine dropdown alongside Cycles and
        EEVEE, is triggered by every canonical render entry point including the
        CLI <code>-f</code> flag, and integrates cleanly with Blender&apos;s
        output-path system.
      </p>

      <p>
        The render-result protocol is the first thing to understand — and the
        first place scripts break. <code>begin_result(x, y, w, h)</code> and{" "}
        <code>end_result(result)</code> are not optional niceties; they are
        load-bearing bookends. Blender&apos;s render pipeline transitions
        through an internal state machine: the moment <code>render()</code> is
        entered, the pipeline expects a result to be produced. Returning without
        calling <code>end_result()</code> leaves the machine in a half-finished
        state, and the Image Editor will stall waiting for a frame that never
        arrives. The result&apos;s <code>Combined</code> pass{" "}
        <code>rect</code> must be a flat RGBA list of exactly{" "}
        <code>width × height × 4</code> floats. This engine writes a single
        white pixel — <code>[1.0, 1.0, 1.0, 1.0]</code> — to a{" "}
        <code>1×1</code> result regardless of scene resolution. Writing a
        full-resolution float buffer purely to discard it wastes 8 MB per F12
        press; the&nbsp;1×1 contract costs effectively nothing.
      </p>

      <p>
        <strong>Method call order for a final render:</strong>{" "}
        <code>update(data, depsgraph)</code> fires first, then{" "}
        <code>render(depsgraph)</code>. The split exists for a reason:{" "}
        <code>render()</code> in background mode (<code>--background</code>{" "}
        flag) operates with a reduced context — <code>bpy.context.window</code>{" "}
        may be <code>None</code>. Path resolution, settings lookups, and{" "}
        anything touching <code>bpy.context</code> should happen in{" "}
        <code>update()</code>, where the context is still fully populated.
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          App Handler + Depsgraph tutorial
        </Link>
        , where context restrictions for headless operation are handled via the
        depsgraph itself.
      </p>

      <p>
        The <code>bl_use_preview = False</code> flag deserves explicit
        attention. Material Preview shading triggers{" "}
        <code>view_update</code> and <code>view_draw</code> on every viewport
        redraw — potentially hundreds of times per session. Without this flag
        set to <code>False</code>, Blender would ask the engine to produce
        material-preview sphere renders for every material in the scene, each
        one calling your <code>render()</code> method and therefore triggering a
        GLB export. Setting <code>bl_use_preview = False</code> exempts the
        engine from preview renders entirely. <code>view_update</code> and{" "}
        <code>view_draw</code> still fire but return immediately, leaving
        Blender&apos;s solid-shading overlay visible in the viewport — an
        acceptable trade-off for an export-only engine. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          glTF User Extension Export Hook tutorial
        </Link>{" "}
        covers the complementary pattern: hooking into the export pipeline at
        the per-node level rather than at the render-trigger level.
      </p>

      <p>
        <code>bpy.ops.export_scene.gltf()</code> is called inside{" "}
        <code>render()</code> with Holoflow conventions:{" "}
        <code>+Y up</code>, <code>export_apply=True</code>, Draco level 6,
        WebP textures. In interactive mode the glTF exporter polls for a{" "}
        <code>VIEW_3D</code> area; inside <code>render()</code> Blender
        supplies a valid execution context automatically because the render was
        initiated from the WindowManager. In background mode,{" "}
        <code>bpy.ops.render.render()</code> also provides a minimal valid
        context. If a context poll error arises, wrapping the call with{" "}
        <code>
          bpy.context.temp_override(window=bpy.context.window_manager.windows[0])
        </code>{" "}
        resolves it — the same pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter
        </Link>
        . Settings are stored on the <code>Scene</code> via a{" "}
        <code>PropertyGroup</code> rather than on the engine instance, because
        engine instances are not reused across renders — a new instance is
        created for each F12 press.
      </p>

      <p>
        The engine integrates with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-preferences-keymap-hotkey-exporter"
          className={lk}
        >
          Addon Preferences + Keymap tutorial
        </Link>{" "}
        naturally: set the render engine to{" "}
        <code>HOLOFLOW_SNAPSHOT</code> in addon preferences, then register F12
        as the export trigger. Studio automation using{" "}
        <code>blender --background scene.blend --python blueprint.py -f 1</code>{" "}
        picks the engine up from the <code>--python</code> registration step
        before <code>-f 1</code> triggers the render, requiring zero additional
        flags. Outside sources:{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.RenderEngine.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.RenderEngine API reference
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0) and{" "}
        <a
          href="https://github.com/robertguetzkow/blender-python-examples"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          robertguetzkow/blender-python-examples
        </a>{" "}
        (MIT, Robert Guetzkow) for general bpy API patterns.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-render-engine-webxr-snapshot",
  title:
    "Python: bpy.types.RenderEngine — Custom Snapshot Engine for WebXR GLB Export via F12 (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Subclass bpy.types.RenderEngine to intercept F12 and replace pixel rasterisation with a full Holoflow GLB export. The engine registers in Scene > Render Engine, satisfies Blender's mandatory begin_result/end_result contract with a 1×1 placeholder pixel, then exports the scene to a WebXR-ready .glb.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-bpy-render-engine-webxr-snapshot/",
    time: "one focused hour",
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
      "Comfortable reading bpy Python scripts",
      "Understands bpy.types.PropertyGroup and bpy.props",
      "Has registered a basic bpy.types.Panel or Operator before",
    ],
    steps: [
      {
        title: "Subclass RenderEngine and declare flags",
        body: `Inherit from bpy.types.RenderEngine and set the three critical flags:

  class HoloflowSnapshotEngine(bpy.types.RenderEngine):
      bl_idname               = "HOLOFLOW_SNAPSHOT"   # unique; shown in dropdown
      bl_label                = "Holoflow WebXR Snapshot"
      bl_use_preview          = False  # skip material-preview sphere renders
      bl_use_postprocess      = False  # no compositor pass
      bl_use_shading_nodes_custom = False  # accept standard PBR nodes

bl_use_preview = False is critical: without it Blender calls render() for every material preview thumbnail — hundreds of times per session. bl_use_postprocess = False prevents the compositor from processing the 1×1 placeholder pixel, saving a full compositing pass per render.`,
      },
      {
        title: "Cache paths in update() before render()",
        body: `Resolve all context-dependent data in update(), NOT in render():

  def update(self, data, depsgraph):
      scene = depsgraph.scene
      base  = bpy.path.abspath(scene.render.filepath)
      self._out_dir  = os.path.join(base, scene.holoflow_snapshot.output_subdir)
      self._out_name = f"{scene.name}_snapshot.glb"
      self._draco    = int(scene.holoflow_snapshot.draco_level)
      os.makedirs(self._out_dir, exist_ok=True)

In background mode (blender --background), bpy.context.window is None inside render(). update() still has a fully populated context, so path resolution belongs here. The engine instance is fresh per render — __init__ runs before update(), so instance variables are safe to use as a cache between the two calls.`,
      },
      {
        title: "Write the placeholder pixel and call end_result()",
        body: `Inside render(), produce the minimal valid RenderResult:

  def render(self, depsgraph):
      result = self.begin_result(0, 0, 1, 1)  # 1×1 tile
      result.layers[0].passes["Combined"].rect = [1.0, 1.0, 1.0, 1.0]
      self.end_result(result)

      if self.test_break():
          return      # user pressed Escape — exit before exporting

      self._run_export(depsgraph)

begin_result(x, y, width, height) allocates a render tile at position (x, y) in the output image with the given dimensions. The Combined pass rect is a flat list [R, G, B, A, ...] with length = width × height × 4. Using 1×1 here writes a single white pixel — the minimum to satisfy the contract without allocating a full-resolution buffer.`,
      },
      {
        title: "Run the GLB export from inside render()",
        body: `Call bpy.ops.export_scene.gltf() with Holoflow settings:

  bpy.ops.export_scene.gltf(
      filepath=out_path,
      use_selection=use_sel,
      export_format="GLB",
      export_yup=True,
      export_apply=True,
      export_image_format="WEBP",
      export_draco_mesh_compression_enable=True,
      export_draco_mesh_compression_level=6,
  )
  self.update_progress(1.0)
  self.update_stats("Holoflow Snapshot", f"→ {out_path}")

The glTF exporter works inside render() because the render was initiated from the WindowManager with a valid context. If the operator raises a context-poll error, wrap it with bpy.context.temp_override(window=bpy.context.window_manager.windows[0]).`,
      },
      {
        title: "Register and add a settings panel",
        body: `Register the engine alongside a PropertyGroup and a Render Properties panel:

  class HoloflowSnapshotSettings(bpy.types.PropertyGroup):
      export_selection_only: BoolProperty(default=True)
      draco_level: EnumProperty(items=[("0","Off",""),("6","High",""),("10","Max","")], default="6")
      output_subdir: StringProperty(default="webxr_export")

  class HOLOFLOW_PT_snapshot_settings(bpy.types.Panel):
      bl_context = "render"
      @classmethod
      def poll(cls, context):
          return context.engine == "HOLOFLOW_SNAPSHOT"

  bpy.types.Scene.holoflow_snapshot = PointerProperty(type=HoloflowSnapshotSettings)

The panel.poll() guard means settings only appear in the Properties panel when this engine is active — no cluttering other engines' UI. Store settings on Scene (not on the engine instance) so values persist in the .blend file.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Render Image stalls / Image Editor shows infinite spinner",
        cause:
          "end_result(result) was not called — the render pipeline state machine never transitions to 'done'.",
        fix: "Ensure begin_result() and end_result() are always called, even on early return paths. Use try/finally around the export call: `try: self._run_export(dg) finally: pass` to guarantee end_result() has already been called before any exception can propagate.",
      },
      {
        symptom: "Every material preview sphere triggers a GLB export",
        cause:
          "bl_use_preview was left at the default True — Blender calls render() for each material thumbnail.",
        fix: "Set bl_use_preview = False on the engine class. Preview renders are then skipped entirely.",
      },
      {
        symptom:
          "export_scene.gltf raises 'context is incorrect' in --background mode",
        cause:
          "bpy.context.window is None in background mode; the operator's default context poll fails.",
        fix: "Wrap with: with bpy.context.temp_override(window=bpy.context.window_manager.windows[0]): bpy.ops.export_scene.gltf(...)",
      },
      {
        symptom: "Engine appears in dropdown but panel settings are missing",
        cause:
          "HOLOFLOW_PT_snapshot_settings.poll() returns False because context.engine is not set yet.",
        fix: "Ensure bpy.context.scene.render.engine = 'HOLOFLOW_SNAPSHOT' is set before opening the Render Properties panel. The poll fires every redraw — confirm the engine is active in the header bar.",
      },
    ],
  },
  base,
);
