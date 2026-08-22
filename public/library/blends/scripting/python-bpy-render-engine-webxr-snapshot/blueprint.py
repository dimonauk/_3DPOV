"""
blueprint.py — Python: bpy.types.RenderEngine — Custom Snapshot Engine
Blender 5.1 · Holoflow Studio · CC0

Technique: subclass bpy.types.RenderEngine to intercept Blender's render
pipeline (F12 / Render > Image / bpy.ops.render.render()) and replace pixel
output with a Holoflow WebXR GLB export.  The engine writes a 1×1 placeholder
pixel to satisfy Blender's render-result contract, then runs the full GLB
export pipeline and reports the output path in the header.

Why a RenderEngine over an operator or app-handler?
  Operators require manual invocation (menu or hotkey) and do not integrate
  with Blender's output-path system.  App-handlers fire on every frame change
  (expensive) or require polling (fragile).  A RenderEngine registers under
  Scene > Render Engine, is triggered by F12, Render > Image, the CLI `-f`
  flag, and bpy.ops.render.render() — every canonical render entry point —
  with zero extra wiring.  Studio automation scripts using `blender --background
  file.blend -f 1` automatically pick it up without modification.

Critical protocol (MANDATORY):
  begin_result() and end_result() MUST be called inside render() even if no
  real pixels are produced.  Skipping end_result() leaves the render pipeline
  in an unfinished state and freezes the UI.  We write a 1×1 white RGBA pixel
  — the smallest valid rect — to satisfy this contract cheaply.
"""

import os
import bpy
from bpy.props import BoolProperty, EnumProperty, StringProperty, PointerProperty

# ── Constants ─────────────────────────────────────────────────────────────────
ENGINE_ID      = "HOLOFLOW_SNAPSHOT"     # must be globally unique; shown in dropdown
DRACO_DEFAULT  = "6"
EXPORT_YUP     = True
IMAGE_FORMAT   = "WEBP"

# A single white RGBA pixel — minimum valid Combined pass rect (width=1, height=1).
# rect is a flat list [R, G, B, A, R, G, B, A, ...] length = w*h*4.
PLACEHOLDER_PIXEL = [1.0, 1.0, 1.0, 1.0]


# ── Per-Scene Settings ────────────────────────────────────────────────────────
# Stored on the Scene so values persist in the .blend file.
# RenderEngine instances are NOT reused across renders — scene-level storage
# is the correct place for user-tunable settings.
class HoloflowSnapshotSettings(bpy.types.PropertyGroup):
    export_selection_only: BoolProperty(
        name="Selection Only",
        description="Export only selected objects; falls back to all on empty selection",
        default=True,
    )
    draco_level: EnumProperty(
        name="Draco Compression",
        items=[
            ("0",  "0 – Off",    "No Draco; largest file, instant decode"),
            ("4",  "4 – Medium", "Balanced"),
            ("6",  "6 – High",   "Holoflow default"),
            ("10", "10 – Max",   "Smallest file, slowest decode"),
        ],
        default=DRACO_DEFAULT,
    )
    output_subdir: StringProperty(
        name="Output Subdirectory",
        description="Appended to Render Output path; auto-created if absent",
        default="webxr_export",
    )


# ── Render Engine ─────────────────────────────────────────────────────────────
class HoloflowSnapshotEngine(bpy.types.RenderEngine):
    """F12-triggered GLB export engine.

    Call order for a standard final render:
      update(data, depsgraph)   — pre-render; cache resolved settings & paths
      render(depsgraph)         — main body; write placeholder pixel + export GLB

    For Material Preview (viewport shading) Blender also calls:
      view_update(context, depsgraph) — notification that scene changed
      view_draw(context, depsgraph)   — draw the viewport frame

    Both viewport methods return immediately — this engine provides no
    viewport shading, so Blender falls back to solid shading in Material Preview.
    """

    bl_idname                 = ENGINE_ID
    bl_label                  = "Holoflow WebXR Snapshot"
    bl_use_preview            = False  # skip material-preview sphere renders (~hundreds per session)
    bl_use_postprocess        = False  # no compositor / colour-management pass on our placeholder
    bl_use_shading_nodes_custom = False  # accept standard PBR shading nodes as-is

    def __init__(self):
        # Cache populated in update(), consumed in render().
        # Never store mutable Blender data-block references here — they may
        # become invalid between update() and render() if undo fires.
        self._out_dir    = ""
        self._out_name   = ""
        self._draco      = 6
        self._use_sel    = True

    # ── Pre-render ────────────────────────────────────────────────────────────
    def update(self, data, depsgraph):
        """Resolve all path and settings dependencies before render() starts.

        render() receives depsgraph but NOT context.  In background mode
        (-b flag), bpy.context.window is None inside render(), so any
        context-dependent lookups must happen here, in update(), where context
        is still safe.
        """
        scene    = depsgraph.scene
        settings = scene.holoflow_snapshot

        base_dir = bpy.path.abspath(scene.render.filepath)
        if not base_dir:
            base_dir = os.path.join(bpy.path.abspath("//"), "output")
        self._out_dir  = os.path.join(base_dir, settings.output_subdir)
        self._out_name = f"{scene.name}_snapshot.glb"
        self._draco    = int(settings.draco_level)
        self._use_sel  = settings.export_selection_only

        os.makedirs(self._out_dir, exist_ok=True)

    # ── Main render ───────────────────────────────────────────────────────────
    def render(self, depsgraph):
        """Produce a placeholder image result then export the scene to GLB.

        begin_result(x, y, width, height) allocates a RenderResult.
        The Combined pass rect must be written before end_result() or the
        Image Editor will display a torn/empty tile.

        We use a 1×1 result regardless of scene resolution because:
          (a) we do not rasterise anything — the "render" is a GLB file;
          (b) writing a full-resolution float buffer (e.g. 1920×1080×4 = 8 MB)
              purely to discard it wastes memory and stalls the GL flush.
        """
        result = self.begin_result(0, 0, 1, 1)
        result.layers[0].passes["Combined"].rect = PLACEHOLDER_PIXEL
        self.end_result(result)

        if self.test_break():
            # User pressed Escape — return without exporting.
            self.update_stats("Holoflow Snapshot", "Cancelled")
            return

        self.update_progress(0.1)
        self._run_export(depsgraph)

    # ── Viewport (Material Preview) ───────────────────────────────────────────
    def view_update(self, context, depsgraph):
        """Scene-changed notification for viewport shading.  No-op here."""
        pass

    def view_draw(self, context, depsgraph):
        """Draw viewport frame.  Returning without drawing keeps solid shading."""
        pass

    # ── Export ────────────────────────────────────────────────────────────────
    def _run_export(self, depsgraph) -> None:
        """Call the built-in glTF exporter with Holoflow conventions.

        export_scene.gltf is context-sensitive in interactive mode — it polls
        for a VIEW_3D area when invoked via a UI operator.  When called from
        inside render(), Blender provides a valid execution context automatically
        because the render was initiated from the WindowManager.  In background
        mode bpy.ops.render.render() also supplies a minimal valid context.

        If this call ever raises 'context is incorrect', wrap it with:
          with bpy.context.temp_override(window=bpy.context.window_manager.windows[0]):
        """
        scene    = depsgraph.scene
        out_path = os.path.join(self._out_dir, self._out_name)

        # Fall back to all-objects if selection_only requested but no mesh selected.
        use_sel = self._use_sel
        if use_sel:
            has_mesh_sel = any(
                obj.select_get()
                for obj in scene.view_layers[0].objects
                if obj.type == "MESH"
            )
            if not has_mesh_sel:
                use_sel = False
                print("[holoflow:snapshot] no mesh selected — exporting all objects")

        bpy.ops.export_scene.gltf(
            filepath=out_path,
            use_selection=use_sel,
            export_format="GLB",
            export_yup=EXPORT_YUP,
            export_apply=EXPORT_APPLY,
            export_image_format=IMAGE_FORMAT,
            export_draco_mesh_compression_enable=(self._draco > 0),
            export_draco_mesh_compression_level=self._draco,
        )

        self.update_progress(1.0)
        self.update_stats("Holoflow Snapshot", f"→ {out_path}")
        print(f"[holoflow:snapshot] exported → {out_path}")


# ── UI Panel ──────────────────────────────────────────────────────────────────
class HOLOFLOW_PT_snapshot_settings(bpy.types.Panel):
    """Settings panel inside Render Properties when HOLOFLOW_SNAPSHOT is active."""
    bl_label        = "WebXR Snapshot Settings"
    bl_space_type   = "PROPERTIES"
    bl_region_type  = "WINDOW"
    bl_context      = "render"
    bl_options      = {"DEFAULT_CLOSED"}

    @classmethod
    def poll(cls, context):
        return context.engine == ENGINE_ID

    def draw(self, context):
        layout = self.layout
        s = context.scene.holoflow_snapshot
        layout.prop(s, "export_selection_only")
        layout.prop(s, "draco_level")
        layout.prop(s, "output_subdir")


# ── Registration ──────────────────────────────────────────────────────────────
CLASSES = (HoloflowSnapshotSettings, HoloflowSnapshotEngine, HOLOFLOW_PT_snapshot_settings)
EXPORT_APPLY = True  # module-level constant used by _run_export


def register():
    for cls in CLASSES:
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass
        bpy.utils.register_class(cls)
    if not hasattr(bpy.types.Scene, "holoflow_snapshot"):
        bpy.types.Scene.holoflow_snapshot = PointerProperty(type=HoloflowSnapshotSettings)


def unregister():
    for cls in reversed(CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass
    if hasattr(bpy.types.Scene, "holoflow_snapshot"):
        del bpy.types.Scene.holoflow_snapshot


# ── Demo scene ────────────────────────────────────────────────────────────────
def build_demo_scene() -> None:
    """Set up a clean scene, activate the engine, and print instructions."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    register()

    scene = bpy.context.scene
    scene.render.engine   = ENGINE_ID
    scene.render.filepath = "//output/"

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    bpy.context.active_object.name = "hs_panel_a"

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.6, depth=1.2,
                                         location=(2.5, 0, 0))
    bpy.context.active_object.name = "hs_pillar_b"

    for obj in bpy.context.scene.objects:
        obj.select_set(True)

    scene.holoflow_snapshot.export_selection_only = True
    scene.holoflow_snapshot.draco_level = "6"

    print(f"[holoflow:snapshot] engine = {scene.render.engine}")
    print("[holoflow:snapshot] F12 or bpy.ops.render.render() → exports GLB")
    print(f"[holoflow:snapshot] output → {scene.render.filepath}webxr_export/")


if __name__ == "__main__":
    build_demo_scene()
