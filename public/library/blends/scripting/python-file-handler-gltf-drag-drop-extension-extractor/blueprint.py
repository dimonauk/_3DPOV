"""
Holoflow Studio — blueprint
Topic   : Python bpy.types.FileHandler — GLB Drag-Drop Extension Extractor
Blender : 5.1
Licence : CC0 (Holoflow Studio original)

WHY THIS MATTERS
────────────────
Every .glb file is a JSON document wrapped in a binary envelope.  The glTF
spec reserves an 'extras' dict on every node for arbitrary producer data.
The studio's holoflow_webxr_exporter writes 'holoflow:facet', 'holoflow:tag',
and 'holoflow:lod' into each mesh's extras at export time.

When another artist drags that .glb back into Blender, Blender's built-in glTF
importer silently discards all extras — they never appear in the Properties
panel.  This FileHandler addon intercepts the drop, reads the binary JSON chunk
directly (struct.unpack, no third-party libs), stashes each extras key as a
bpy custom property, and THEN calls the standard importer.

BLENDER 5.x FileHandler API
────────────────────────────
bpy.types.FileHandler was introduced in Blender 4.1 and stabilised in 5.0.
It is the correct modern pattern for responding to OS drag-drop into the 3D
Viewport; the old approach (wm.call_fileselect + bl_options INVOKE_DEFAULT)
only works for explicit menu-triggered imports.

Required class members:
  bl_idname        — unique string, no dots, no spaces
  bl_label         — human name shown in header bar tooltip
  bl_import_operator — bl_idname of the Operator that does the work
  bl_file_extensions — semicolon-separated extensions, each with leading dot
  poll_drop(cls, context) — classmethod; return True only in valid contexts

The framework sets filepath on the bound operator automatically.
For multi-file drop, files is populated as a CollectionProperty of
OperatorFileListElement; iterate it with directory + f.name.
"""

import struct
import json
import bpy
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ──────────────────────────────────────────────────────────────────────────────

ADDON_LABEL = "Holoflow GLB Extension Extractor"
HF_PREFIX   = "hf:"          # studio prefix applied to custom properties
GLB_MAGIC   = 0x46546C67     # "glTF" little-endian
JSON_CHUNK  = 0x4E4F534A     # "JSON" little-endian


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS — raw GLB parsing (no third-party libs)
# ──────────────────────────────────────────────────────────────────────────────

def _read_glb_json(filepath: str) -> dict:
    """
    Parse the JSON chunk of a .glb file without importing any third-party lib.

    GLB binary layout (little-endian):
      [0..3]  magic   uint32  must equal 0x46546C67 ('glTF')
      [4..7]  version uint32  must be 2
      [8..11] length  uint32  total file length in bytes
      [12..]  chunks  repeated: (chunkLength uint32, chunkType uint32, data[])

    The FIRST chunk is always the JSON chunk (type 0x4E4F534A = 'JSON').
    Padding bytes at the end of a chunk are spaces (0x20) for JSON chunks.
    """
    with open(filepath, "rb") as fh:
        header = fh.read(12)
    if len(header) < 12:
        return {}
    magic, version, _ = struct.unpack_from("<III", header, 0)
    if magic != GLB_MAGIC or version != 2:
        # Treat as text .gltf — parse directly as JSON
        try:
            return json.loads(Path(filepath).read_text(encoding="utf-8"))
        except Exception:
            return {}
    with open(filepath, "rb") as fh:
        fh.seek(12)
        chunk_len, chunk_type = struct.unpack("<II", fh.read(8))
        if chunk_type != JSON_CHUNK:
            return {}
        raw = fh.read(chunk_len)
    try:
        return json.loads(raw.decode("utf-8").rstrip())
    except Exception:
        return {}


def _collect_extras(gltf_json: dict) -> dict[str, dict]:
    """
    Walk the parsed glTF JSON and collect all non-empty 'extras' dicts.

    Returns  {mesh_name: {key: value, ...}, ...}
    For the scene-level extras, key is "__scene__".
    Studio extras we care about: holoflow:facet, holoflow:tag, holoflow:lod.
    """
    result: dict[str, dict] = {}

    scene_extras = gltf_json.get("scene", {})
    scenes = gltf_json.get("scenes", [])
    if scenes:
        se = scenes[0].get("extras") if isinstance(scenes[0], dict) else None
        if se:
            result["__scene__"] = se

    for node in gltf_json.get("nodes", []):
        if not isinstance(node, dict):
            continue
        extras = node.get("extras")
        name   = node.get("name", "unnamed_node")
        if extras:
            result[name] = extras

    for mesh in gltf_json.get("meshes", []):
        if not isinstance(mesh, dict):
            continue
        extras = mesh.get("extras")
        name   = mesh.get("name", "unnamed_mesh")
        if extras and name not in result:
            result[name] = extras

    return result


def _apply_extras_to_objects(extras_map: dict[str, dict], imported_objects) -> int:
    """
    Match parsed extras to imported bpy Objects by name.

    WHY prefix with HF_PREFIX:
    Custom properties beginning with '_' are hidden in the UI by default.
    Raw keys like 'holoflow:facet' contain a colon which Blender accepts but
    which looks noisy in the Properties panel.  Prefixing 'hf:' is tidy and
    visually groups all studio-origin properties together.

    Returns the number of properties applied.
    """
    applied = 0
    for obj in imported_objects:
        # Try exact name match first, then mesh-data name
        candidates = [obj.name]
        if obj.data:
            candidates.append(obj.data.name)
        for candidate in candidates:
            if candidate in extras_map:
                for raw_key, value in extras_map[candidate].items():
                    prop_key = HF_PREFIX + raw_key.lstrip("holoflow:")
                    if isinstance(value, (str, int, float, bool)):
                        obj[prop_key] = value
                        applied += 1
                break
    return applied


# ──────────────────────────────────────────────────────────────────────────────
# OPERATOR — does the actual import + property injection
# ──────────────────────────────────────────────────────────────────────────────

class HF_OT_import_studio_glb(bpy.types.Operator):
    """Import a GLB and attach holoflow: extras as custom properties."""
    bl_idname  = "hf.import_studio_glb"
    bl_label   = "Import Studio GLB"
    bl_options = {"REGISTER", "UNDO"}

    # FileHandler injects filepath for single-file drops.
    # For multi-file drops the framework populates 'files' + 'directory'.
    filepath:  bpy.props.StringProperty(subtype="FILE_PATH")
    directory: bpy.props.StringProperty(subtype="DIR_PATH")
    files:     bpy.props.CollectionProperty(type=bpy.types.OperatorFileListElement)

    filter_glob: bpy.props.StringProperty(default="*.glb;*.gltf", options={"HIDDEN"})

    def execute(self, context):
        # Build the list of paths to process
        paths: list[str] = []
        if self.files and self.directory:
            for f in self.files:
                p = str(Path(self.directory) / f.name)
                if p.lower().endswith((".glb", ".gltf")):
                    paths.append(p)
        if not paths and self.filepath:
            paths = [self.filepath]
        if not paths:
            self.report({"WARNING"}, "No valid .glb / .gltf path supplied.")
            return {"CANCELLED"}

        total_applied = 0
        for path in paths:
            # ── 1. Parse extras BEFORE import (avoids selection ambiguity) ──
            gltf_json  = _read_glb_json(path)
            extras_map = _collect_extras(gltf_json)

            # ── 2. Standard import — track what's new via selection ──────────
            bpy.ops.object.select_all(action="DESELECT")
            bpy.ops.import_scene.gltf(
                filepath=path,
                import_pack_images=True,
                merge_vertices=False,
            )
            imported = list(context.selected_objects)

            # ── 3. Inject extras as custom properties ─────────────────────────
            n = _apply_extras_to_objects(extras_map, imported)
            total_applied += n

            if extras_map:
                self.report(
                    {"INFO"},
                    f"Imported '{Path(path).name}' — applied {n} holoflow: properties.",
                )
            else:
                self.report(
                    {"INFO"},
                    f"Imported '{Path(path).name}' — no holoflow: extras found.",
                )

        return {"FINISHED"}

    def invoke(self, context, event):
        # Called when triggered via File > Import menu (not drag-drop).
        # FileHandler drag-drop calls execute() directly, bypassing invoke().
        if not self.filepath and not self.files:
            context.window_manager.fileselect_add(self)
            return {"RUNNING_MODAL"}
        return self.execute(context)


# ──────────────────────────────────────────────────────────────────────────────
# FILE HANDLER — intercepts OS drag-drop into 3D Viewport
# ──────────────────────────────────────────────────────────────────────────────

class HF_FH_import_studio_glb(bpy.types.FileHandler):
    """
    Drag a .glb from the OS file manager into the Blender 3D Viewport to
    import it with holoflow: extras parsed automatically.

    poll_drop must return True only for valid drop zones.
    Returning True everywhere (e.g. in a Timeline editor) would cause
    accidental imports whenever a .glb is dragged past any window.
    """
    bl_idname          = "HF_FH_import_studio_glb"
    bl_label           = ADDON_LABEL
    bl_import_operator = "hf.import_studio_glb"
    bl_file_extensions = ".glb;.gltf"

    @classmethod
    def poll_drop(cls, context):
        # Only activate in the 3D Viewport.
        # context.area can be None during headless evaluation.
        return context.area is not None and context.area.type == "VIEW_3D"


# ──────────────────────────────────────────────────────────────────────────────
# MENU ENTRY — File > Import
# ──────────────────────────────────────────────────────────────────────────────

def _menu_import(self, context):
    self.layout.operator(
        HF_OT_import_studio_glb.bl_idname,
        text="Studio GLB / GLTF (.glb, .gltf)",
    )


# ──────────────────────────────────────────────────────────────────────────────
# REGISTER / UNREGISTER
# ──────────────────────────────────────────────────────────────────────────────

_CLASSES = [
    HF_OT_import_studio_glb,
    HF_FH_import_studio_glb,
]


def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.TOPBAR_MT_file_import.append(_menu_import)


def unregister():
    bpy.types.TOPBAR_MT_file_import.remove(_menu_import)
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)


# ──────────────────────────────────────────────────────────────────────────────
# STANDALONE SCRIPT USAGE (Text Editor > Run Script)
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # When pasted into the Text Editor and run directly, register then
    # immediately import a test file so the result is visible in the viewport.
    register()

    import os
    TEST_GLB = os.path.join(
        bpy.path.abspath("//"),
        "test_holoflow_extras.glb",
    )
    if os.path.exists(TEST_GLB):
        bpy.ops.hf.import_studio_glb(filepath=TEST_GLB)
    else:
        print(
            "[HF] blueprint.py: no test_holoflow_extras.glb found next to .blend. "
            "Drag a .glb onto the 3D Viewport to test the FileHandler."
        )
