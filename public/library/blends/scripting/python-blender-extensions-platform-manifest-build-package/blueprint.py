"""
Python — Blender 5.1 Extensions Platform
blender_manifest.toml · bl_ext Namespace · CLI Build & Validate
Blender 5.1 | CC0 | Holoflow Studio

TECHNIQUE
---------
Blender 4.2 retired the legacy `bl_info = {...}` dictionary in favour of a
typed TOML manifest at the extension root.  The Extensions Platform
(extensions.blender.org, Blender 5.1) uses that manifest for:
  - Version negotiation (`blender_version_min` / `blender_version_max`)
  - Dependency bundling (pip wheel paths declared in `[wheels]`)
  - Permission declaration (file, network, clipboard access flags)
  - SPDX-compliant licence enforcement

Installed extensions load under the `bl_ext.<repo_id>.<ext_id>` namespace —
not the flat namespace of legacy add-ons — so `import my_extension` never
works inside another extension.  Use relative imports within your own package.

The CLI workflow:
  blender --command extension validate ./holoflow_exporter_ext/
  blender --command extension build   --source-dir ./holoflow_exporter_ext/ \
                                      --output-dir ./dist/
  blender --command extension install --repo user_default ./dist/holoflow_exporter_ext-1.2.0.zip

WHY THIS MATTERS FOR THE STUDIO
--------------------------------
The studio's own exporter at tools/blender-addon/holoflow_webxr_exporter/
is currently a legacy add-on (manual zip install, bl_info dict).  This
blueprint converts it to a proper extension so it can be distributed via
a local team repository, auto-updated from a hosted manifest.json, and
validated in CI without opening Blender's UI.
"""

# ===========================================================================
# FILE: blender_manifest.toml
# (show as Python string constant for inline documentation)
# ===========================================================================
MANIFEST_TOML = """\
schema_version = "1.0.0"

# ── Identity ────────────────────────────────────────────────────────────────
id          = "holoflow_webxr_exporter"        # snake_case, unique on platform
version     = "1.2.0"                          # semantic versioning enforced
name        = "Holoflow WebXR Game Framework Exporter"
tagline     = "One-click GLB export with Draco, WebP, +Y-up for WebXR scenes"
maintainer  = "Holoflow Studio <hello@holoflow.co.uk>"
type        = "add-on"                         # or "theme"

# ── Compatibility ────────────────────────────────────────────────────────────
# min is mandatory; omit max to support all future versions.
blender_version_min = "4.2.0"
# blender_version_max = "5.99.0"

# ── Distribution ─────────────────────────────────────────────────────────────
website   = "https://holoflow.co.uk"
copyright = ["2025 Holoflow Studio"]
license   = ["SPDX:Apache-2.0"]           # must be an SPDX identifier
tags      = ["Import-Export", "Pipeline", "Mesh"]

# ── Permissions (declare every OS capability the extension touches) ──────────
[permissions]
# files   = "Allow reading/writing user-specified paths"     ← uncomment if needed
# network = "Allow HTTP requests to holoflow.co.uk CDN"
# clipboard = "Copy export path to clipboard on success"
# camera / microphone — not needed

# ── Optional: bundled pip wheels ─────────────────────────────────────────────
# If your extension depends on a third-party PyPI package, vendor the wheel
# file inside the extension folder and list it here.
# Download: pip download --python-version 311 --platform manylinux_2_17_x86_64 \
#                        --only-binary=:all: --dest ./wheels/ Pillow==10.4.0
# [wheels]
# "wheels/Pillow-10.4.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl"
"""

# ===========================================================================
# FILE: __init__.py  (extension entry point)
# ===========================================================================
INIT_PY = '''\
"""
Holoflow WebXR Game Framework Exporter — Blender 5.1 extension.
Converts the studio\'s legacy add-on to the Extensions Platform format.
"""

# --- relative imports (REQUIRED in extension mode) --------------------------
# Legacy:  import holoflow_webxr_exporter.operators  ← breaks under bl_ext
# Correct: from . import operators                   ← always safe
from . import operators, panels, preferences         # noqa: F401 (side effects)

# bpy must be imported after the relative imports to satisfy Blender\'s
# module loader — the extension namespace isn\'t live until this module runs.
import bpy

# Store registered classes here so unregister() can mirror the order.
_classes: list[type] = []


def register() -> None:
    """Called once when the extension is enabled."""
    _classes.extend([
        preferences.HOLOFLOW_Preferences,
        operators.HOLOFLOW_OT_export_webxr,
        panels.HOLOFLOW_PT_export_panel,
    ])
    for cls in _classes:
        bpy.utils.register_class(cls)

    # Register keymap (optional — move to preferences.py in real code)
    wm = bpy.context.window_manager
    kc = wm.keyconfigs.addon
    if kc:
        km = kc.keymaps.new(name="3D View", space_type="VIEW_3D")
        kmi = km.keymap_items.new(
            "holoflow.export_webxr",
            type="E",
            value="PRESS",
            ctrl=True,
            shift=True,
        )
        preferences.KEYMAP_ITEMS.append((km, kmi))


def unregister() -> None:
    """Called when the extension is disabled.  Must mirror register()."""
    for km, kmi in reversed(preferences.KEYMAP_ITEMS):
        km.keymap_items.remove(kmi)
    preferences.KEYMAP_ITEMS.clear()

    for cls in reversed(_classes):
        bpy.utils.unregister_class(cls)
    _classes.clear()
'''

# ===========================================================================
# FILE: operators.py  (keep bl_idname lowercase, dot-separated)
# ===========================================================================
OPERATORS_PY = '''\
import bpy
import subprocess
import sys

class HOLOFLOW_OT_export_webxr(bpy.types.Operator):
    """Export active collection as WebXR-ready GLB via the Holoflow pipeline."""
    bl_idname  = "holoflow.export_webxr"
    bl_label   = "Export WebXR GLB"
    bl_options = {"REGISTER", "UNDO"}

    filepath: bpy.props.StringProperty(subtype="FILE_PATH")

    def execute(self, context):
        prefs = context.preferences.addons[__package__].preferences
        bpy.ops.export_scene.gltf(
            filepath        = self.filepath,
            export_draco_mesh_compression_enable = True,
            export_draco_mesh_compression_level  = prefs.draco_level,
            export_image_format                  = "WEBP",
            export_yup                           = True,
            export_apply                         = True,
        )
        return {"FINISHED"}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {"RUNNING_MODAL"}
'''

# ===========================================================================
# FILE: preferences.py
# ===========================================================================
PREFERENCES_PY = '''\
import bpy

KEYMAP_ITEMS: list = []          # module-level so unregister() can reach them

class HOLOFLOW_Preferences(bpy.types.AddonPreferences):
    # bl_idname must match the Python package name, not the manifest id.
    # In extension mode __package__ resolves to "bl_ext.user_default.holoflow_webxr_exporter".
    bl_idname = __package__

    draco_level: bpy.props.IntProperty(
        name="Draco Compression Level",
        description="0 = off, 10 = maximum",
        min=0, max=10, default=6,
    )
    webp_textures: bpy.props.BoolProperty(
        name="WebP Textures", default=True,
    )
    export_root: bpy.props.StringProperty(
        name="Default Export Directory",
        subtype="DIR_PATH",
        default="//holoflow_out/",
    )

    def draw(self, context):
        layout = self.layout
        box = layout.box()
        box.label(text="Holoflow Export Defaults", icon="EXPORT")
        box.prop(self, "export_root")
        col = box.column(align=True)
        col.prop(self, "draco_level", slider=True)
        col.prop(self, "webp_textures")
'''

# ===========================================================================
# EXTENSION DIRECTORY LAYOUT
# ===========================================================================
LAYOUT = """
holoflow_exporter_ext/          ← the folder you point --source-dir at
├── blender_manifest.toml       ← replaces bl_info entirely
├── __init__.py                 ← register() / unregister() entry point
├── operators.py
├── panels.py
├── preferences.py
└── wheels/                     ← optional; pip-downloaded .whl files
    └── somelib-1.0-py3-none-any.whl
"""

# ===========================================================================
# CLI WORKFLOW  (run from the project root, not inside Blender)
# ===========================================================================
CLI_STEPS = """
# 1. Validate (no Blender UI needed — runs as a background process)
blender --command extension validate ./holoflow_exporter_ext/

# 2. Build distributable zip
blender --command extension build \\
    --source-dir ./holoflow_exporter_ext/ \\
    --output-dir ./dist/
# Produces: ./dist/holoflow_webxr_exporter-1.2.0.zip

# 3. Install to local user repository (for testing)
blender --command extension install-file \\
    --repo user_default \\
    ./dist/holoflow_webxr_exporter-1.2.0.zip

# 4. Test with clean Blender (skip user prefs to catch missing manifest fields)
blender --factory-startup --python-expr "import bpy; print(bpy.utils.extension_info('user_default', 'holoflow_webxr_exporter'))"

# 5. Cross-extension import at runtime (read-only — never import during load)
# from bl_ext.user_default import holoflow_webxr_exporter  ← dynamic lookup
"""

# ===========================================================================
# RUNTIME SELF-INSPECTION
# ===========================================================================
RUNTIME_INSPECT = """
import bpy

# Check that the extension is installed and get its version
info = bpy.utils.extension_info(
    repo_module="user_default",
    pkg_id="holoflow_webxr_exporter",
)
# Returns None if not installed; otherwise a dict with id, version, etc.
if info:
    print(f"Holoflow exporter v{info['version']} installed")

# Access preferences from another extension or script
prefs = bpy.context.preferences.addons[
    "bl_ext.user_default.holoflow_webxr_exporter"
].preferences
print(f"Draco level: {prefs.draco_level}")
"""

# ===========================================================================
# KEY DIFFERENCES FROM LEGACY ADD-ONS
# ===========================================================================
MIGRATION_NOTES = """
LEGACY                                   EXTENSIONS PLATFORM (5.1)
───────────────────────────────────────  ────────────────────────────────────────
bl_info = {                              blender_manifest.toml at root
  "name": "My Tool",
  "version": (1, 0, 0),
}

bl_idname = "my_module"                  bl_idname = __package__
                                         (resolves to bl_ext.user_default.my_ext)

import my_module.utils                   from . import utils
                                         (relative import, always works)

bpy.context.preferences.addons          bpy.context.preferences.addons
  ["my_module"].preferences               ["bl_ext.user_default.my_ext"].preferences

Install: Edit > Preferences             Install: Get Extensions > ↓ > Install
  > Add-ons > Install > zip               from Disk; OR blender --command install-file
"""
