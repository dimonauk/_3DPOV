import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender tool you use — Bevel, Subdivision Surface, the GLTF
        exporter — is an <code>Operator</code> class registered against
        Blender&apos;s type system.  The sidebar panel that exposes its settings
        is a <code>Panel</code> class drawing from a{" "}
        <code>PropertyGroup</code>.  Understanding this three-class architecture
        is the gateway to building your own pipeline tools, batch processors, and
        custom exporters — the exact same pattern used inside{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          the Geometry Nodes tree API tutorial
        </Link>{" "}
        and underlying the studio&apos;s{" "}
        <code>tools/blender-addon/holoflow_webxr_exporter</code>.
      </p>
      <p>
        This tutorial builds <strong>Holoflow Quick Facet</strong> — a minimal
        but production-complete extension applying flat shading and a configurable
        bevel to any mesh in one click.  Along the way it covers Blender
        5.1&apos;s <strong>Extensions Platform</strong> (the{" "}
        <code>blender_manifest.toml</code> descriptor that supersedes{" "}
        <code>bl_info</code>), idempotent modifier management, and{" "}
        <code>REGISTER + UNDO</code> operator options.  For complementary
        low-level Python skills, see the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron" className={lk}>
          bmesh dodecahedron tutorial
        </Link>{" "}
        and the{" "}
        <Link href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis" className={lk}>
          3D print analysis tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-addon-custom-panel-property-group",
  title:
    "Python — Blender Add-on: Custom Panel, PropertyGroup & Operator (Blender 5.1 Extensions Platform)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Build a complete Blender 5.1 extension — PropertyGroup, Panel, Operator, " +
    "register/unregister — packaged with blender_manifest.toml for the Extensions Platform.  " +
    "Produces Holoflow Quick Facet: a one-click flat-shade + bevel tool.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-addon-custom-panel-property-group/",
    time: "one to two hours",
    difficulty: "intermediate",
    overview:
      "Blender extensions are Python modules that register classes against the bpy " +
      "type system.  Three classes form the core: a PropertyGroup (data), a Panel (UI), " +
      "and an Operator (action).  This tutorial builds all three, wires them together " +
      "with register() / unregister(), and packages the result as a Blender 5.1 extension " +
      "with blender_manifest.toml.  The demonstration tool — Holoflow Quick Facet — applies " +
      "flat shading and a bevel modifier to the active mesh with configurable per-scene settings.",
    goal:
      "Write and install a Blender 5.1 extension from scratch.  Understand the " +
      "PropertyGroup → PointerProperty → Panel → Operator registration chain, " +
      "idempotent modifier management, bl_options UNDO, and blender_manifest.toml " +
      "well enough to adapt the pattern for any custom pipeline tool.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable with Python — classes, decorators, module imports",
      "Has run a bpy script in Blender's Scripting workspace at least once",
      "Understands Blender's modifier stack",
    ],
    steps: [
      {
        title: "Why three classes, not one",
        body: `Blender's extension architecture separates concerns cleanly:

PropertyGroup  — stores data (bpy.props custom properties).
Panel          — reads and draws data in a UI region.
Operator       — reads data, mutates the scene, pushes an undo step.

This split means multiple panels can share one property group, multiple
operators can read the same props, and teardown is one clean unregister
per class.

Compare with scene["my_float"] (ID properties): no UI metadata, no type
checking, no min/max, and they persist in the .blend even after the
add-on is removed.  PropertyGroup avoids all of these problems.`,
      },
      {
        title: "Declaring a PropertyGroup and registering it",
        body: `from bpy.props import EnumProperty, FloatProperty, IntProperty, PointerProperty
from bpy.types import PropertyGroup

class QuickFacetProps(PropertyGroup):
    shade_mode: EnumProperty(
        name="Normal Mode",
        items=[
            ("FLAT",   "Flat",   "Hard facets — disable smooth shading"),
            ("SMOOTH", "Smooth", "Smooth shading across all edges"),
            ("AUTO",   "Auto",   "Smooth with 30° hard-edge threshold"),
        ],
        default="FLAT",
    )  # type: ignore   ← bpy descriptor ≠ Python type; silences mypy

    bevel_width: FloatProperty(
        name="Bevel Width",
        default=0.015, min=0.0, max=1.0,
        step=0.5,      # UI drag step = 0.005 (step / 100)
        precision=3,
        unit="LENGTH", # Rescales for scene unit system (metric / imperial)
    )  # type: ignore

def register():
    bpy.utils.register_class(QuickFacetProps)
    # PointerProperty attaches the group to Scene; each .blend carries its own values.
    bpy.types.Scene.hf_facet = PointerProperty(type=QuickFacetProps)

def unregister():
    del bpy.types.Scene.hf_facet   # Must delete BEFORE unregister_class()
    bpy.utils.unregister_class(QuickFacetProps)

TEARDOWN ORDER IS CRITICAL:
  If you call unregister_class(QuickFacetProps) BEFORE deleting the PointerProperty,
  Blender crashes — the live attribute still holds a reference to the deleted Python
  type.  Always del first, then unregister.`,
      },
      {
        title: "Writing the Operator: poll(), execute(), bl_options UNDO",
        body: `class HOLOFLOW_OT_quick_facet(Operator):
    bl_idname  = "holoflow.quick_facet"   # category.name — all lower_snake
    bl_label   = "Apply Quick Facet"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        # Called every redraw — must be fast.
        return (
            context.active_object is not None
            and context.active_object.type == "MESH"
            and context.mode == "OBJECT"
        )

    def execute(self, context):
        ob    = context.active_object
        props = context.scene.hf_facet

        # Shade mode (Blender 5.x: SMOOTH_BY_ANGLE modifier replaces use_auto_smooth)
        if props.shade_mode == "FLAT":
            bpy.ops.object.shade_flat()
        elif props.shade_mode == "SMOOTH":
            bpy.ops.object.shade_smooth()
        else:
            bpy.ops.object.shade_smooth()
            ang = ob.modifiers.get("HF_SmoothAngle") or \
                  ob.modifiers.new("HF_SmoothAngle", "SMOOTH_BY_ANGLE")
            ang.angle = 0.523599   # 30°

        # Idempotent bevel: get existing or add new — never duplicate
        bevel = ob.modifiers.get("HF_Bevel") or \
                ob.modifiers.new("HF_Bevel", "BEVEL")
        bevel.width            = props.bevel_width
        bevel.segments         = props.bevel_segments
        bevel.limit_method     = "ANGLE"
        bevel.angle_limit      = 0.523599
        bevel.miter_outer      = "MITER_ARC"
        bevel.use_clamp_overlap = True

        self.report({"INFO"}, f"Quick Facet applied to '{ob.name}'")
        return {"FINISHED"}

bl_options = {"REGISTER", "UNDO"}:
  REGISTER → operator appears in Adjust Last Operation panel (F9).
  UNDO     → pushes an entry onto Blender's undo stack (Ctrl+Z works).
  Without UNDO, the operation cannot be reversed — unacceptable.`,
      },
      {
        title: "Drawing the Panel in the N-sidebar",
        body: `class HOLOFLOW_PT_quick_facet(Panel):
    bl_label       = "Quick Facet"
    bl_idname      = "HOLOFLOW_PT_quick_facet"
    bl_space_type  = "VIEW_3D"   # Only appears in 3D Viewport
    bl_region_type = "UI"        # The N-panel (right collapsible sidebar)
    bl_category    = "Holoflow"  # Tab label in the N-panel strip

    def draw(self, context):
        layout = context.layout
        props  = context.scene.hf_facet

        col = layout.column(align=True)
        col.prop(props, "shade_mode")
        col.separator()
        col.prop(props, "bevel_width",    slider=True)
        col.prop(props, "bevel_segments", slider=True)

        layout.separator()
        layout.operator("holoflow.quick_facet", icon="MOD_BEVEL")

        if not HOLOFLOW_OT_quick_facet.poll(context):
            layout.label(text="Select a mesh in Object Mode", icon="INFO")

layout.column(align=True)  — removes gap between widgets.
col.prop(…, slider=True)   — float/int draws as a drag-handle slider.
layout.operator(bl_idname) — greyed automatically when poll() returns False.

Common bl_space_type / bl_region_type pairs:
  VIEW_3D    + UI        → N-panel (most tools)
  PROPERTIES + WINDOW    → Properties editor side panel
  NODE_EDITOR + UI       → Node editor N-panel`,
      },
      {
        title: "blender_manifest.toml and the Extensions Platform",
        body: `# blender_manifest.toml  (alongside __init__.py in the extension folder)

schema_version = "1.0.0"

id      = "holoflow_quick_facet"
version = "1.0.0"
name    = "Holoflow Quick Facet"
tagline = "One-click flat-shade + bevel for hard-surface faceted props"
maintainer = "Holoflow Studio <hello@holoflow.co.uk>"
type    = "add-on"

blender_version_min = "4.2.0"
license = ["SPDX:Apache-2.0"]
tags    = ["Mesh", "Modeling", "Pipeline"]

[permissions]
# Empty — no file system, network, or clipboard access needed.

WHAT CHANGED IN 4.2 / 5.1:
  Legacy add-ons (bl_info dict, zip install via Preferences → Add-ons) still work
  but are not indexed by the Extensions Platform and can't be distributed through
  extensions.blender.org.  New work should use blender_manifest.toml.

INSTALL FROM DISK:
  Preferences → Get Extensions → top-right ↓ icon → Install from Disk
  → select __init__.py (Blender reads the sibling toml automatically).

TEXT EDITOR SHORTCUT:
  Paste blueprint.py, press Alt+P.  __name__ == "__main__" triggers register()
  for the current session without installing anything.`,
      },
      {
        title: "Troubleshooting registration errors",
        body: `1. "already registered, call unregister_class() first"
   → You pressed Alt+P twice.  Restart Blender, or add a guard:
     try:
         bpy.utils.unregister_class(cls)
     except RuntimeError:
         pass
     bpy.utils.register_class(cls)

2. Panel appears but is empty
   → draw() raised an exception silently.  Open the System Console
     (Window → Toggle System Console on Windows; launch from terminal on
     Linux/macOS) to see the traceback.

3. Operator button always greyed out
   → poll() returns False.  Add print(context.active_object, context.mode)
     inside poll() to debug the exact condition failing.

4. Ctrl+Z does nothing after clicking Apply
   → "UNDO" missing from bl_options.
     Fix: bl_options = {"REGISTER", "UNDO"}

5. Properties reset on every Blender launch
   → Correct — PropertyGroup values live in the .blend file, not preferences.
     For cross-file preferences, use bpy.types.AddonPreferences instead.`,
      },
    ],
  },
  base
);
