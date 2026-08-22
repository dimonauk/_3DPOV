"""
Blender 5.1 | bpy.types.AddonPreferences + KeyMap Registration
Holoflow WebXR Exporter — Persistent Preferences & Hotkey

bpy.types.AddonPreferences is the system for storing per-user settings that
survive blend file changes and live in the user's Blender config directory
(alongside keymaps, themes, etc.).  They appear under Edit > Preferences >
Add-ons > [your add-on] > Preferences, and are accessed at runtime via
  bpy.context.preferences.addons["module_name"].preferences

WHY AddonPreferences vs scene custom properties?
  Scene custom properties travel with the .blend file — that's great for
  per-project settings (like a specific export directory) but wrong for
  user-level config that should be the same in every project (like a
  preferred compression level, a default output root, or debug verbosity).
  AddonPreferences belong to the user, not the scene.

WHY register keymaps here?
  Hard-coded keymaps break other users' workflows. Registering keymaps from
  within the add-on allows the user to remap them via the keymap editor
  and lets the add-on's own unregister() clean them up correctly.

TECHNIQUE:
  1. Subclass bpy.types.AddonPreferences with bl_idname == module __name__
  2. Declare bpy.props.* directly on the class (not in __annotations__)
  3. draw(self, layout) to build the prefs UI
  4. In register(), call bpy.utils.register_class(prefs) then register keymap
  5. In unregister(), remove keymap items before unregistering classes

PARAMETERS:
"""

import bpy
import os

# ------------------------------------------------------------------
# Named constants — edit these to tune the defaults
# ------------------------------------------------------------------
MODULE_NAME     = __name__          # Blender matches bl_idname to this
DEFAULT_ROOT    = "//holoflow_out"  # "//" = relative to .blend file
DEFAULT_DRACO   = 6                 # Draco compression level 0-10
DEFAULT_VERBOSE = False

# Storage for registered keymap items so unregister() can find them
_keymap_items: list = []


# ------------------------------------------------------------------
# ADDON PREFERENCES
# ------------------------------------------------------------------

class HOLOFLOW_Preferences(bpy.types.AddonPreferences):
    """
    Registered once under bl_idname == the add-on's Python module name.

    Blender stores the values in the user config directory
    (e.g. ~/.config/blender/5.1/config/userpref.blend).
    They persist across all .blend files and Blender restarts.
    """
    bl_idname = MODULE_NAME

    # Each prop must be a class-level annotation so register_class() can
    # find it.  Do NOT assign default= by calling bpy.props inside __init__.
    export_root: bpy.props.StringProperty(
        name        = "Export Root",
        description = "Base directory for all GLB/SPLAT exports. "
                      "Use // for blend-relative paths.",
        subtype     = 'DIR_PATH',
        default     = DEFAULT_ROOT,
    )

    draco_level: bpy.props.IntProperty(
        name        = "Draco Compression",
        description = "Draco mesh compression level (0 = off, 10 = max). "
                      "Holoflow convention is level 6.",
        min=0, max=10,
        default     = DEFAULT_DRACO,
    )

    webp_textures: bpy.props.BoolProperty(
        name        = "WebP Textures",
        description = "Convert PNG/JPEG textures to WebP at export time.",
        default     = True,
    )

    verbose: bpy.props.BoolProperty(
        name        = "Verbose Logging",
        description = "Print per-object export diagnostics to the console.",
        default     = DEFAULT_VERBOSE,
    )

    export_hotkey: bpy.props.StringProperty(
        name        = "Export Hotkey",
        description = "Display-only: shows the registered shortcut. "
                      "Change via Edit > Preferences > Keymap.",
        default     = "Ctrl+Shift+E",
    )

    def draw(self, context):
        layout = self.layout

        # -- Output settings -------------------------------------------------
        box = layout.box()
        box.label(text="Output", icon='EXPORT')
        col = box.column(align=True)
        col.prop(self, "export_root")
        row = col.row(align=True)
        row.prop(self, "draco_level", slider=True)
        row.prop(self, "webp_textures")

        # -- Debug -----------------------------------------------------------
        layout.prop(self, "verbose")

        # -- Keymap display (read-only hint) ---------------------------------
        box2 = layout.box()
        box2.label(text="Hotkeys", icon='EVENT_K')
        row2 = box2.row()
        row2.label(text="Quick WebXR Export:")
        row2.label(text=self.export_hotkey, icon='KEYINGSET')
        box2.label(
            text="Remap via Edit > Preferences > Keymap > search 'Holoflow'",
            icon='INFO',
        )


# ------------------------------------------------------------------
# HELPER: read prefs at runtime
# ------------------------------------------------------------------

def get_prefs() -> "HOLOFLOW_Preferences":
    """
    Returns the active AddonPreferences instance.

    Called from any operator or panel:
        prefs = get_prefs()
        output_dir = bpy.path.abspath(prefs.export_root)
    """
    return bpy.context.preferences.addons[MODULE_NAME].preferences


# ------------------------------------------------------------------
# OPERATORS
# ------------------------------------------------------------------

class HOLOFLOW_OT_quick_webxr_export(bpy.types.Operator):
    """
    One-keystroke GLB export using settings from AddonPreferences.

    Reads output_root, draco_level, webp_textures from prefs so the
    keymap shortcut always uses the user's stored config.
    """
    bl_idname  = "holoflow.quick_webxr_export"
    bl_label   = "Holoflow: Quick WebXR Export"
    bl_options = {'REGISTER'}

    def execute(self, context):
        prefs    = get_prefs()
        abs_root = bpy.path.abspath(prefs.export_root)
        os.makedirs(abs_root, exist_ok=True)

        blend_stem  = os.path.splitext(
            os.path.basename(bpy.data.filepath or "untitled.blend")
        )[0]
        output_path = os.path.join(abs_root, f"{blend_stem}.glb")

        if prefs.verbose:
            print(f"[Holoflow] Exporting → {output_path}")
            print(f"  draco_level  = {prefs.draco_level}")
            print(f"  webp_textures= {prefs.webp_textures}")

        try:
            bpy.ops.export_scene.gltf(
                filepath            = output_path,
                export_format       = 'GLB',
                use_selection       = False,
                export_draco_mesh_compression_enable  = prefs.draco_level > 0,
                export_draco_mesh_compression_level   = prefs.draco_level,
                export_image_format = 'WEBP' if prefs.webp_textures else 'AUTO',
            )
            self.report({'INFO'}, f"Exported → {output_path}")
        except Exception as exc:
            self.report({'ERROR'}, f"Export failed: {exc}")
            return {'CANCELLED'}

        return {'FINISHED'}


class HOLOFLOW_OT_open_prefs(bpy.types.Operator):
    """Open the Holoflow preferences panel directly."""
    bl_idname  = "holoflow.open_prefs"
    bl_label   = "Holoflow: Open Preferences"
    bl_options = {'INTERNAL'}

    def execute(self, context):
        bpy.ops.screen.userpref_show()
        context.preferences.active_section = 'ADDONS'
        return {'FINISHED'}


# ------------------------------------------------------------------
# KEYMAP REGISTRATION
# ------------------------------------------------------------------

def _register_keymap() -> None:
    """
    Register Ctrl+Shift+E in 3D View > Object Mode for quick export.

    Rules:
    • Always append to the EXISTING keymap (never create a new one for a
      standard space like '3D View').
    • Store each registered KeyMapItem in _keymap_items for clean unregister.
    • The user can rebind via Edit > Preferences > Keymap > 'Holoflow'.
    """
    wm  = bpy.context.window_manager
    kc  = wm.keyconfigs.addon            # addon keyconfig — survives restarts
    if not kc:
        # Running in background / no window — skip silently
        return

    # 3D View, Object Mode
    km = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
    kmi = km.keymap_items.new(
        idname     = 'holoflow.quick_webxr_export',
        type       = 'E',
        value      = 'PRESS',
        ctrl       = True,
        shift      = True,
    )
    kmi.active = True
    _keymap_items.append((km, kmi))

    # Also register in the Window keymap so it fires outside 3D View
    km_win = kc.keymaps.new(name='Window', space_type='EMPTY')
    kmi_win = km_win.keymap_items.new(
        idname  = 'holoflow.quick_webxr_export',
        type    = 'E',
        value   = 'PRESS',
        ctrl    = True,
        shift   = True,
        alt     = True,
    )
    kmi_win.active = True
    _keymap_items.append((km_win, kmi_win))


def _unregister_keymap() -> None:
    """Remove every registered item; clear the list."""
    for km, kmi in _keymap_items:
        try:
            km.keymap_items.remove(kmi)
        except ReferenceError:
            pass
    _keymap_items.clear()


# ------------------------------------------------------------------
# DEMO SCENE
# ------------------------------------------------------------------

def build_demo_scene() -> None:
    """
    Simple 3-prop scene.  Each cube gets a custom property so the
    exporter knows it's a Holoflow asset.
    """
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    for i, pos in enumerate([(-2, 0, 0), (0, 0, 0), (2, 0, 0)]):
        bpy.ops.mesh.primitive_cube_add(size=0.9, location=pos)
        obj = bpy.context.active_object
        obj.name = f"HoloProp_{i:02d}"
        obj["holoflow:facet"] = 1

    # Camera
    bpy.ops.object.camera_add(location=(0, -6, 3))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.1, 0, 0)
    bpy.context.scene.camera = cam

    # Light
    bpy.ops.object.light_add(type='AREA', location=(2, -3, 5))
    bpy.context.active_object.data.energy = 300


# ------------------------------------------------------------------
# REGISTER / UNREGISTER
# ------------------------------------------------------------------

CLASSES = [
    HOLOFLOW_Preferences,
    HOLOFLOW_OT_quick_webxr_export,
    HOLOFLOW_OT_open_prefs,
]


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    _register_keymap()
    print(
        "[Holoflow] AddonPreferences registered.\n"
        "  Access via: bpy.context.preferences.addons"
        f"['{MODULE_NAME}'].preferences"
    )


def unregister():
    _unregister_keymap()
    for cls in reversed(CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass


if __name__ == "__main__":
    try:
        unregister()
    except Exception:
        pass
    register()
    build_demo_scene()
    print(
        "Blueprint loaded.\n"
        "  Ctrl+Shift+E → triggers Quick WebXR Export\n"
        "  Edit > Preferences > Add-ons > Holoflow → tweak settings\n"
        "  get_prefs().export_root shows the current output path"
    )
