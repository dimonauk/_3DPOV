"""
bpy.utils.previews — Custom Icon Thumbnails & Render Previews in Add-on UI
===========================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

WHY bpy.utils.previews?
  Blender's built-in icon set is an enum — you cannot extend it.
  PreviewCollection is the only official path to injecting custom PNG
  images into layout.prop(), layout.operator(), and template_list()
  via the icon_value= keyword (which accepts an integer handle).
  The same API exposes thumbnails from already-rendered images and
  from the asset system — all three share one mechanism.

Architecture rule: ONE module-level PreviewCollection per add-on.
  If you call bpy.utils.previews.new() inside register(), every
  Blender startup and add-on reload creates a NEW collection without
  freeing the previous one — a GPU handle leak that accumulates until
  Blender crashes or runs out of memory.  Module-level singleton +
  explicit remove() in unregister() is the correct pattern.
"""

import bpy
import os
import struct
import zlib
import pathlib

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
ADDON_DIR   = pathlib.Path(__file__).parent
ICONS_DIR   = ADDON_DIR / "icons"
ICON_SIZE   = 32          # px, square, power-of-two — Blender clips to 256
THUMB_SIZE  = (128, 128)  # workbench render dimensions for render-thumb slot

FORMAT_KEYS = ("GLB", "GLTF_SEPARATE")

# ─── MODULE-LEVEL SINGLETON ───────────────────────────────────────────────────
# Declared here, not inside register(), so the handle is stable across
# panel redraws and operator poll() re-evaluations.
_pcoll: "bpy.utils.previews.ImagePreviewCollection | None" = None


# ─── MINIMAL PNG WRITER (no Pillow required) ──────────────────────────────────
def _png_rgba_solid(path: pathlib.Path, w: int, h: int,
                    r: int, g: int, b: int, a: int = 255) -> None:
    """Write a solid-colour RGBA PNG using only the stdlib.

    Real add-ons ship hand-drawn artwork; this generates placeholder icons
    so the blueprint runs without bundled PNG assets.  The PNG format:
      IHDR chunk → IDAT chunk (zlib-compressed scanlines) → IEND chunk.
    Each scanline prefixes with filter byte 0 (None filter).
    """
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    row  = bytes([r, g, b, a] * w)
    raw  = b"".join(b"\x00" + row for _ in range(h))
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)   # bit_depth=8, RGBA
    png  = (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def _ensure_icon_pngs() -> None:
    """Generate placeholder PNGs if the icons/ folder is empty or absent.

    Colour coding follows the Holoflow export-format palette so the icons
    read instantly in the N-panel without a legend.
    """
    specs = {
        "GLB":           (0x10, 0xA8, 0x60),   # teal-green  — compact binary
        "GLTF_SEPARATE": (0xF5, 0xA6, 0x23),   # amber       — separate assets
        "render_thumb":  (0x33, 0x33, 0x3A),   # near-black  — empty thumb
    }
    for key, (r, g, b) in specs.items():
        p = ICONS_DIR / f"{key}.png"
        if not p.exists():
            _png_rgba_solid(p, ICON_SIZE, ICON_SIZE, r, g, b)


# ─── PREVIEW MANAGEMENT ───────────────────────────────────────────────────────
def register_previews() -> None:
    """Load icon PNGs into a new PreviewCollection.

    Call exactly once from register().  The guard against double-init
    ensures Alt+P re-runs don't leak GPU handles.
    """
    global _pcoll
    if _pcoll is not None:
        bpy.utils.previews.remove(_pcoll)

    _pcoll = bpy.utils.previews.new()
    _ensure_icon_pngs()

    for key in (*FORMAT_KEYS, "render_thumb"):
        p = ICONS_DIR / f"{key}.png"
        if p.exists():
            # previews.load(id_str, filepath, image_type)
            # image_type "IMAGE" — static single-frame PNG.
            # The icon is rasterised into the GPU icon cache at load time;
            # max_size defaults to 256×256 (capped by Blender's atlas size).
            _pcoll.load(key, str(p), "IMAGE")


def unregister_previews() -> None:
    """Release the PreviewCollection; frees GPU atlas entries."""
    global _pcoll
    if _pcoll is not None:
        bpy.utils.previews.remove(_pcoll)
        _pcoll = None


def icon_id(key: str) -> int:
    """Return the integer icon handle for key, or 0 (NONE) if absent.

    Returning 0 rather than raising prevents AttributeError crashes that
    otherwise occur during draw() before register_previews() has run —
    common when Blender reloads scripts mid-session.
    """
    if _pcoll is None:
        return 0
    entry = _pcoll.get(key)
    return entry.icon_id if entry else 0


# ─── DYNAMIC ENUM ITEMS ───────────────────────────────────────────────────────
def _format_items(self, context):  # noqa: ANN001
    """EnumProperty items callback supplying icon_value from the collection.

    Static tuples (id, name, description) attach a built-in icon string.
    When you need icon_value= (an integer), you MUST use the 5-tuple form:
        (identifier, name, description, icon_value_int, number)
    The 'number' field is the stored integer — kept equal to list index here
    for serialisation stability across Blender versions.

    WHY a callback instead of a static list?
    PreviewCollection is not yet loaded when the class is first evaluated at
    module import time.  A callback is re-evaluated lazily, so icon_id()
    always reads from a fully initialised collection.
    """
    return [
        ("GLB",           "GLB",        "Binary .glb — one file",      icon_id("GLB"),           0),
        ("GLTF_SEPARATE", "glTF + bin", "Separate .gltf + .bin pair",  icon_id("GLTF_SEPARATE"), 1),
    ]


# ─── RENDER THUMBNAIL OPERATOR ────────────────────────────────────────────────
class HLF_OT_CaptureRenderThumb(bpy.types.Operator):
    """Render a 128×128 Workbench thumbnail of the active object,
    save it over icons/render_thumb.png, then reload the preview slot.

    WHY Workbench instead of Cycles or EEVEE?
    Workbench renders in ~50ms regardless of light setup — no HDRI, no
    lamps required.  For a thumbnail that just needs to show shape and
    material colours, Workbench is the correct tool.  Cycles at 128px
    would introduce noise; EEVEE requires light probes to be baked.

    WHY save to PNG and reload rather than reading pixels in memory?
    `preview.reload()` re-reads the PNG from disk.  There is no public API
    to write raw pixels directly into a PreviewCollection slot in 5.1.
    The round-trip through disk is the documented approach.
    """
    bl_idname  = "hlf.capture_render_thumb"
    bl_label   = "Capture Render Thumbnail"
    bl_options = {"REGISTER"}

    def execute(self, context: bpy.types.Context) -> set[str]:
        scene = context.scene
        rx, ry, rp = (scene.render.resolution_x,
                      scene.render.resolution_y,
                      scene.render.resolution_percentage)
        orig_engine = scene.render.engine

        scene.render.resolution_x          = THUMB_SIZE[0]
        scene.render.resolution_y          = THUMB_SIZE[1]
        scene.render.resolution_percentage = 100
        scene.render.engine                = "BLENDER_WORKBENCH"

        try:
            bpy.ops.render.render(write_still=False)
        finally:
            # Restore before any possible early return.
            scene.render.resolution_x          = rx
            scene.render.resolution_y          = ry
            scene.render.resolution_percentage = rp
            scene.render.engine                = orig_engine

        img = bpy.data.images.get("Render Result")
        if img is None:
            self.report({"WARNING"}, "No render result found")
            return {"CANCELLED"}

        out = ICONS_DIR / "render_thumb.png"
        img.filepath_raw = str(out)
        img.file_format  = "PNG"
        img.save()

        # Reload slot so icon_id() reflects the new pixels.
        if _pcoll and "render_thumb" in _pcoll:
            _pcoll["render_thumb"].reload()

        return {"FINISHED"}


# ─── PROPERTY GROUP ───────────────────────────────────────────────────────────
class HLF_IconQueueItem(bpy.types.PropertyGroup):
    obj:    bpy.props.PointerProperty(name="Object", type=bpy.types.Object)  # type: ignore
    fmt:    bpy.props.EnumProperty(name="Format", items=_format_items, default=0)  # type: ignore
    on:     bpy.props.BoolProperty(name="Include", default=True)  # type: ignore


# ─── PANEL ────────────────────────────────────────────────────────────────────
class HLF_PT_IconDemo(bpy.types.Panel):
    bl_label       = "Icon Demo"
    bl_idname      = "HLF_PT_IconDemo"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = "Holoflow"

    def draw(self, context: bpy.types.Context) -> None:
        layout = self.layout
        scene  = context.scene

        # template_icon() renders a preview image at scaled size.
        # scale=5.0 ≈ 128px at 96 DPI.  Use only when displaying a true
        # preview (render result, asset thumbnail) — not for small buttons.
        tid = icon_id("render_thumb")
        if tid:
            layout.template_icon(icon_value=tid, scale=5.0)
        layout.operator("hlf.capture_render_thumb", icon="RENDER_STILL")
        layout.separator()

        queue = getattr(scene, "hlf_icon_queue", None)
        if queue is None:
            layout.label(text="Queue not registered", icon="ERROR")
            return

        for item in queue:
            row = layout.row(align=True)
            # icon_value= accepts an integer; icon= accepts a string enum name.
            # Mixing them on the same call is not allowed — use one or the other.
            row.prop(item, "fmt", text="", icon_value=icon_id(item.fmt))
            sub = row.row()
            sub.alert = item.obj is None   # red tint when slot is empty
            sub.prop(item, "obj", text="")
            row.prop(item, "on", text="",
                     icon="CHECKBOX_HLT" if item.on else "CHECKBOX_DEHLT",
                     emboss=False)


# ─── REGISTRATION ─────────────────────────────────────────────────────────────
CLASSES = [HLF_IconQueueItem, HLF_OT_CaptureRenderThumb, HLF_PT_IconDemo]


def register() -> None:
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.hlf_icon_queue = bpy.props.CollectionProperty(
        type=HLF_IconQueueItem
    )
    register_previews()
    # Seed queue with first two scene objects for immediate demo.
    q = bpy.context.scene.hlf_icon_queue
    if len(q) == 0:
        for obj in list(bpy.data.objects)[:2]:
            slot = q.add()
            slot.obj = obj


def unregister() -> None:
    unregister_previews()
    del bpy.types.Scene.hlf_icon_queue
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
