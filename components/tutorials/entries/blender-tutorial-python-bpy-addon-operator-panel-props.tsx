import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AddonOperatorPanelPropsBody() {
  return (
    <>
      <p>
        Every tool you use in Blender&rsquo;s N-panel is built from three
        cooperating types: a <code>PropertyGroup</code> that owns the settings,
        an <code>Operator</code> that reads them and changes scene state, and a{" "}
        <code>Panel</code> that presents both in the interface.  Learning how
        those three classes register, talk to each other through a shared{" "}
        <code>PointerProperty</code> on <code>bpy.types.Scene</code>, and hook
        into Blender&rsquo;s undo stack is what turns an interactive script into
        a distributable tool.  Blender 5.1 adds the Extensions Platform, which
        replaces the <code>bl_info</code> dict with{" "}
        <code>blender_manifest.toml</code> — covered in Step 7.
      </p>

      <p className="mt-3">
        The concrete vehicle is <strong>Holoflow Grid Stamp</strong>: a
        mini-addon that arrays the active object into an X&thinsp;&times;&thinsp;Y
        grid at a configurable spacing, in XY / XZ / YZ orientation.  It is
        compact enough to read in one sitting but uses every common property type
        (Int, Float, Enum, Bool), a <code>poll()</code> guard, the{" "}
        <code>REGISTER&nbsp;+&nbsp;UNDO</code> bl_options pair for the redo-panel,
        and a <code>draw()</code> override that mirrors the N-panel without
        duplicating code.  For the bpy scripting foundations used here, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          bmesh dodecahedron tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          Geometry Nodes tree API tutorial
        </Link>
        .  For the GLB export step that validates addon-created scenes for
        WebXR, the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D print mesh analysis tutorial
        </Link>{" "}
        covers automated scene QA from Python.  The pattern for registering
        custom bone shapes — another use of <code>bpy.utils.register_class</code>{" "}
        — is in the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-bone-collections-custom-shapes"
          className={lk}
        >
          bone collections and custom shapes tutorial
        </Link>
        .
      </p>

      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-4">{`# Core anatomy at a glance

class HOLOFLOW_PG_GridStamp(PropertyGroup):        # settings storage
    grid_x:   IntProperty(default=3, min=1, max=32)
    spacing:  FloatProperty(default=1.5, unit='LENGTH')
    plane:    EnumProperty(items=[("XY","XY",""), …])

class HOLOFLOW_OT_GridStamp(Operator):             # business logic
    bl_idname  = "holoflow.grid_stamp"
    bl_options = {"REGISTER", "UNDO"}              # F9 + Ctrl-Z
    def poll(cls, ctx): return ctx.active_object …
    def execute(self, ctx): …; return {"FINISHED"}
    def draw(self, ctx): _draw_props(self.layout, ctx)  # redo-panel

class HOLOFLOW_PT_GridStamp(Panel):                # N-panel UI
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = "Holoflow"
    def draw(self, ctx):
        _draw_props(self.layout, ctx)
        self.layout.operator("holoflow.grid_stamp")

def register():
    for cls in [PG, OT, PT]: bpy.utils.register_class(cls)
    bpy.types.Scene.holoflow_grid_stamp = PointerProperty(type=PG)`}</pre>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-addon-operator-panel-props",
  title:
    "Python — Writing a Blender 5.1 Extension: Operator, Panel & Custom Properties",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Build a complete Blender 5.1 Extension from scratch: PropertyGroup for " +
    "typed undo-aware settings, Operator with poll + execute + REGISTER/UNDO, " +
    "Panel in the N-panel, PointerProperty attachment, and blender_manifest.toml " +
    "for the Extensions Platform.  Illustrated by the Holoflow Grid Stamp mini-addon.",
  Body: AddonOperatorPanelPropsBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-bpy-addon-operator-panel-props/",
    time: "one to two hours",
    difficulty: "advanced",
    overview:
      "A Blender Extension is three cooperating types: PropertyGroup (settings), " +
      "Operator (logic + undo), and Panel (UI).  This tutorial builds each class " +
      "from first principles, wires them together via PointerProperty on bpy.types.Scene, " +
      "and packages the result as a proper Blender 5.1 Extension with " +
      "blender_manifest.toml.  The concrete output is Holoflow Grid Stamp.",
    goal:
      "Write blueprint.py that defines all three class types, registers them in " +
      "the correct order, and creates a working N-panel tool — accessible from the " +
      "Holoflow tab, callable via the operator search, and undoable with Ctrl-Z.  " +
      "Package it as a Blender 5.1 Extension with blender_manifest.toml.",
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
      "Python basics — classes, methods, decorators",
      "Has run a bpy script in Blender's Scripting workspace at least once",
      "Knows what a modifier panel is and has used the N-panel",
    ],
    steps: [
      {
        title: "Why three classes, not one",
        body: `PropertyGroup, Operator, and Panel are separate by design:

PropertyGroup  — stores data on a Blender type (Scene, Object, Mesh, etc.)
               — values survive undo/redo because Blender owns the memory
               — serialised automatically into .blend files
               — accessible from any code that has a context object

Operator       — executes ONE action; wraps execute() in a single undo step
               — bl_options = {"REGISTER", "UNDO"} enables:
                   REGISTER: last-operator redo-panel (F9 / bottom-left)
                   UNDO:      Ctrl-Z pushes exactly the state before execute()
               — poll() is called every redraw; returning False greys the button

Panel          — draws UI on every viewport refresh — NO state, NO side effects
               — only calls layout.prop(), layout.operator(), layout.label() etc.
               — draw() must be fast; it is called dozens of times per second

Keeping them separate means you can call the operator from a menu, a keybind,
another operator, or a Python script — not just the panel button.`,
      },
      {
        title: "Naming conventions — why HOLOFLOW_PG_GridStamp not just GridStamp",
        body: `Blender enforces identifier naming to prevent conflicts between addons:

  PREFIX_TT_Name
  PREFIX  = your addon/studio prefix (HOLOFLOW, BIG_TEXTURES, MY_TOOL…)
  TT      = type tag:
              PG  PropertyGroup
              OT  Operator
              PT  Panel
              MT  Menu
              HT  Header
              UL  UIList
  Name    = PascalCase description

Operator bl_idname uses dot-notation (no underscores in the prefix slot):
  "holoflow.grid_stamp"     correct
  "holoflow_grid_stamp"     wrong — Blender ignores the operator

Class names and bl_idname are checked on registration.  A wrong format raises:
  ValueError: expected a class with 'bl_idname' attribute, got …
or silently fails to appear in the operator search.`,
      },
      {
        title: "PropertyGroup: types, min/max, units, and update callbacks",
        body: `from bpy.props import IntProperty, FloatProperty, EnumProperty, BoolProperty

class HOLOFLOW_PG_GridStamp(PropertyGroup):
    grid_x: IntProperty(
        name="Columns",
        description="Copies along the primary axis",  # tooltip in N-panel
        default=3,
        min=1, max=32,     # hard clamp — user cannot exceed these
    )
    spacing: FloatProperty(
        name="Spacing",
        default=1.5,
        min=0.0, soft_max=20.0,  # soft_max: slider stops here, user can type beyond
        step=10,           # slider step = 10 × 0.01 = 0.1 Blender units
        precision=3,
        unit="LENGTH",     # Blender converts display to scene units (m/cm/ft)
    )
    plane: EnumProperty(
        name="Plane",
        items=[
            ("XY", "XY — ground",    "Grid on the ground plane"),
            ("XZ", "XZ — front wall","Grid on a front-facing wall"),
            ("YZ", "YZ — side wall", "Grid on a side-facing wall"),
        ],
        default="XY",
    )

IMPORTANT: annotate with ':' not '='.  Python type annotations on a class body
that inherits PropertyGroup are intercepted by Blender's metaclass.  Using '='
instead of ':' breaks the registration silently in Blender 4.2+.`,
      },
      {
        title: "PointerProperty: attaching the group to a Blender type",
        body: `from bpy.props import PointerProperty

def register():
    bpy.utils.register_class(HOLOFLOW_PG_GridStamp)   # must register PG FIRST
    bpy.utils.register_class(HOLOFLOW_OT_GridStamp)
    bpy.utils.register_class(HOLOFLOW_PT_GridStamp)

    # Attach the PropertyGroup namespace to every Scene in the file
    bpy.types.Scene.holoflow_grid_stamp = PointerProperty(
        type=HOLOFLOW_PG_GridStamp
    )

def unregister():
    del bpy.types.Scene.holoflow_grid_stamp   # remove before unregistering PG
    for cls in reversed([PG, OT, PT]):
        bpy.utils.unregister_class(cls)

Access in any context:
    props = context.scene.holoflow_grid_stamp
    print(props.grid_x, props.spacing)

Alternatives:
    bpy.types.Object.my_props  — per-object settings
    bpy.types.Mesh.my_props    — per-mesh data settings (survives object rename)
    bpy.types.WindowManager.my_props — session-only, NOT saved to .blend`,
      },
      {
        title: "Operator: poll, execute, and the REGISTER + UNDO pair",
        body: `class HOLOFLOW_OT_GridStamp(Operator):
    bl_idname  = "holoflow.grid_stamp"
    bl_label   = "Grid Stamp"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        ob = context.active_object
        return (
            context.mode == "OBJECT"     # fails in Edit Mode — button greyed
            and ob is not None
            and ob.select_get()          # something must be selected
        )

    def execute(self, context):
        props = context.scene.holoflow_grid_stamp
        src   = context.active_object

        for row in range(props.grid_y):
            for col in range(props.grid_x):
                if col == 0 and row == 0:
                    continue
                bpy.ops.object.duplicate(linked=True)
                dup = context.active_object
                dx, dy, dz = self._offset(col, row, props.spacing, props.plane)
                dup.location = (
                    src.location.x + dx,
                    src.location.y + dy,
                    src.location.z + dz,
                )
                dup.scale = (props.scale,) * 3

        self.report({"INFO"}, f"Stamped {props.grid_x}×{props.grid_y}")
        return {"FINISHED"}   # other returns: {"CANCELLED"}, {"PASS_THROUGH"}

WHY linked=True: copies use the same mesh data-block.  Memory is shared.
Edit one and all update.  Use linked=False for independent geometry.`,
      },
      {
        title: "Panel: two-column layout and the draw() mirror trick",
        body: `class HOLOFLOW_PT_GridStamp(Panel):
    bl_label       = "Grid Stamp"
    bl_idname      = "HOLOFLOW_PT_grid_stamp"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = "Holoflow"   # N-panel tab name
    bl_order       = 10           # position within the tab

    def draw(self, context):
        _draw_props(self.layout, context)
        self.layout.separator()
        self.layout.operator("holoflow.grid_stamp", text="Stamp Grid", icon="MOD_ARRAY")

# Shared helper — both Panel.draw and Operator.draw call this
def _draw_props(layout, context):
    props = context.scene.holoflow_grid_stamp
    layout.use_property_split    = True    # two-column: label left, control right
    layout.use_property_decorate = False   # hides the keyframe dot
    col = layout.column()
    col.prop(props, "grid_x")
    col.prop(props, "grid_y")
    col.prop(props, "spacing")
    col.prop(props, "scale")
    col.prop(props, "plane")
    col.prop(props, "apply_transforms")

The Operator.draw() override:
    def draw(self, context):
        _draw_props(self.layout, context)

This makes the F9 redo-panel show the same controls as the N-panel.
Blender calls Operator.draw() to build the redo-panel UI.  Without it,
the redo-panel is empty (or shows raw property names).`,
      },
      {
        title: "Blender 5.1 Extensions Platform: blender_manifest.toml",
        body: `Blender 4.2 replaced bl_info with blender_manifest.toml.  Both still work
in 5.1 but the Extensions Platform is the required format for extensions.blender.org.

Directory layout:
    holoflow_grid_stamp/
    ├── __init__.py           ← renamed blueprint.py
    └── blender_manifest.toml

blender_manifest.toml contents:
    schema_version       = "1.0.0"
    id                   = "holoflow_grid_stamp"
    name                 = "Holoflow Grid Stamp"
    tagline              = "Array the active object into a configurable grid"
    version              = "1.0.0"
    type                 = "add-on"
    blender_version_min  = "4.2.0"
    blender_version_max  = "5.9.9"
    maintainer           = "Holoflow Studio <hello@holoflow.co.uk>"
    license              = ["SPDX:Apache-2.0"]
    tags                 = ["Object"]

Install:
    Edit → Preferences → Extensions → Install from Disk → select folder
    (NOT the zip — select the folder directly in 5.1)

Testing without installing:
    # In Blender's Text Editor — paste __init__.py, run it
    # register() / unregister() available directly in the scripting workspace

bl_info still works (backward-compat shim) but is not indexed by the
Extensions Platform.  New addons should use blender_manifest.toml only.`,
      },
      {
        title: "GLB export: what 'apply_transforms' actually does",
        body: `The apply_transforms toggle in Grid Stamp calls:
    bpy.ops.object.transform_apply(scale=True, rotation=True)

For GLB/glTF export this is important:

WHY: The glTF spec stores a node's local transform as TRS (Translation,
Rotation, Scale).  A Blender object with scale (2, 2, 2) exports as a node
with scale [2, 2, 2] — which Three.js applies at runtime.  This is fine if
the consumer honours the transform.  WebXR environments generally do.

WHEN TO APPLY: Before using the Array Modifier baked output, before exporting
VRM, and whenever the importer does not honour TRS (e.g. some game engines).

In blueprint.py, apply_transforms fires per-duplicate:
    if props.apply_transforms:
        bpy.ops.object.transform_apply(scale=True, rotation=True)
After apply, dup.scale == (1,1,1) — the geometry is baked.

For the GLB export itself (not part of Grid Stamp, but natural next step):
    bpy.ops.export_scene.gltf(
        filepath     = bpy.path.abspath("//grid_stamp.glb"),
        use_selection= True,
        export_apply = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Operator not found in the search menu after running the script.",
        cause:
          "register() was not called after defining the classes.  In single-file " +
          "mode, register() must be called explicitly (or via the if __name__ == '__main__' block).",
        fix:
          "Add register() at the end of the script, or uncomment the demo() call " +
          "which calls register() before bpy.ops.holoflow.grid_stamp().",
      },
      {
        symptom: "ValueError: expected a class with 'bl_idname' attribute.",
        cause:
          "Passing the wrong object to bpy.utils.register_class(), or a syntax error " +
          "in the class body prevented it from being created properly.",
        fix:
          "Ensure you are passing the class itself (HOLOFLOW_OT_GridStamp), not an " +
          "instance.  Check the Python console for the traceback line number.",
      },
      {
        symptom: "N-panel Holoflow tab does not appear.",
        cause:
          "bl_category on the Panel class does not match what Blender expects.  " +
          "The tab only appears in the 3D Viewport when bl_space_type='VIEW_3D' and " +
          "bl_region_type='UI'.",
        fix:
          "Confirm HOLOFLOW_PT_GridStamp.bl_space_type = 'VIEW_3D' and " +
          "bl_region_type = 'UI'.  Press N in the 3D Viewport to open the sidebar — " +
          "the tab label must match bl_category exactly (case-sensitive).",
      },
      {
        symptom: "Stamp Grid button is greyed out.",
        cause: "Operator.poll() returned False.  This happens in Edit Mode or when no object is selected.",
        fix:
          "Return to Object Mode (Tab), select one object, and try again.  Add a " +
          "print(context.mode, context.active_object) in poll() to diagnose.",
      },
      {
        symptom: "F9 redo-panel is empty — shows no controls.",
        cause: "Operator.draw() is not defined.  Without it Blender renders a default empty panel.",
        fix:
          "Add a draw() method that calls _draw_props(self.layout, context).  " +
          "Verify REGISTER is in bl_options — without it the redo-panel never appears.",
      },
      {
        symptom: "Ctrl-Z does not undo the grid creation.",
        cause: "UNDO is not in bl_options.",
        fix: "Set bl_options = {'REGISTER', 'UNDO'}.  Both flags must be present.",
      },
    ],
  },
  base
);
