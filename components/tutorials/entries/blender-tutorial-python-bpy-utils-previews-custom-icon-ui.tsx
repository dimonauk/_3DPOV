import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s built-in icon set is an enum — you cannot add a new
        named constant to it. <code>bpy.utils.previews</code> is the only
        official mechanism for injecting custom PNG images into{" "}
        <code>layout.prop()</code>, <code>layout.operator()</code>, and{" "}
        <code>template_list()</code> via the <code>icon_value=</code> keyword,
        which accepts an integer handle from a{" "}
        <code>PreviewCollection</code>. This tutorial extends the Holoflow
        export queue introduced in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue"
          className={lk}
        >
          CollectionProperty + UIList tutorial
        </Link>{" "}
        with per-format coloured icons and a live render thumbnail at the top
        of the N-panel.
      </p>
      <p>
        The central rule is the module-level singleton. If you call{" "}
        <code>bpy.utils.previews.new()</code> inside <code>register()</code>,
        every <kbd>Alt+P</kbd> reload creates a new collection without freeing
        the previous one — a GPU handle leak. A module-level variable
        initialised to <code>None</code>, filled in <code>register()</code>,
        and cleared in <code>unregister()</code> is the correct pattern. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar"
          className={lk}
        >
          N-panel sidebar tutorial
        </Link>{" "}
        covers the base Panel + Operator architecture this tutorial builds on.
      </p>
      <p>
        The render thumbnail pipeline cannot avoid a round-trip through disk:
        Blender 5.1 has no public API to write raw pixels directly into a{" "}
        <code>PreviewCollection</code> slot. The operator renders a 128&times;128
        Workbench pass (instantaneous — no lights needed), saves the result to{" "}
        <code>icons/render_thumb.png</code>, then calls{" "}
        <code>slot.reload()</code> to flush the GPU cache. Compare the
        polling-in-draw approach here with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-msgbus-reactive-property-subscriptions"
          className={lk}
        >
          msgbus reactive subscription tutorial
        </Link>
        , which registers callbacks instead of re-reading state in every draw
        call.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-utils-previews-custom-icon-ui",
  title:
    "Python — bpy.utils.previews: Custom PNG Icon Thumbnails & Render Previews in Add-on UI (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Load custom RGBA PNG files into a PreviewCollection, use icon_value= in N-panel " +
    "props and UIList rows, build a dynamic EnumProperty with per-item icons, and capture " +
    "a live Workbench render thumbnail — the complete bpy.utils.previews workflow.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-bpy-utils-previews-custom-icon-ui/",
    time: "one to two hours",
    difficulty: "intermediate",
    overview:
      "bpy.utils.previews.ImagePreviewCollection is a GPU-backed image atlas that " +
      "maps string keys to integer icon handles. Any layout call that accepts icon= " +
      "also accepts icon_value=, which takes an integer — the bridge between your PNG " +
      "files and Blender's draw layer. This tutorial builds a three-object export queue " +
      "panel with format icons (teal = GLB, amber = glTF+bin) and a live render thumbnail " +
      "slot that refreshes on demand via a Workbench mini-render.",
    goal:
      "Understand the PreviewCollection lifecycle well enough to add custom icons to any " +
      "add-on panel: format selectors, status indicators, per-asset thumbnails, and " +
      "operator buttons — without GPU handle leaks or crash-on-redraw AttributeErrors.",
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
      "Completed the Custom Panel + Operator N-panel tutorial",
      "Comfortable with Python module globals and class registration order",
      "Basic familiarity with bpy.props.CollectionProperty and UIList",
    ],
    steps: [
      {
        title: "Why PreviewCollection, not built-in icon strings",
        body: `Blender's icon= argument accepts a string from the built-in enum — names like
"EXPORT", "RENDER_STILL", "OBJECT_DATA". You cannot add to that enum; it is
compiled into the binary.

icon_value= accepts an integer. bpy.utils.previews.ImagePreviewCollection
is a dictionary whose values expose .icon_id — the integer Blender's draw
layer uses to index its GPU icon atlas. Your PNG becomes part of that atlas
after bpy.utils.previews.new() → pcoll.load().

Two other sources also provide icon_value integers:
  — bpy.data.Object.preview.icon_id  (asset-system thumbnail, exists only if
    the object has been marked as an asset via bpy.ops.asset.mark())
  — bpy.data.images["Render Result"].preview.icon_id  (Blender's internal
    preview slot, updated after each render)
Both are read-only. PreviewCollection is the only source you can write to.`,
      },
      {
        title: "Module-level singleton — the only safe pattern",
        body: `_pcoll: "bpy.utils.previews.ImagePreviewCollection | None" = None

def register_previews() -> None:
    global _pcoll
    if _pcoll is not None:
        # Guard: Alt+P reload without unregister would leak the old handle.
        bpy.utils.previews.remove(_pcoll)
    _pcoll = bpy.utils.previews.new()
    for key in ("GLB", "GLTF_SEPARATE", "render_thumb"):
        p = ICONS_DIR / f"{key}.png"
        if p.exists():
            _pcoll.load(key, str(p), "IMAGE")

def unregister_previews() -> None:
    global _pcoll
    if _pcoll is not None:
        bpy.utils.previews.remove(_pcoll)
        _pcoll = None

WHY module-level and not inside register()?
  Each call to bpy.utils.previews.new() allocates a new GPU atlas entry.
  If register() is called N times (Alt+P, plugin reload, factory reset),
  N-1 entries are leaked because there is no reference to the old collection
  to pass to remove(). The module global gives you that reference.

WHY the double-remove guard?
  Blender calls register() once at startup and once per Alt+P. Without the
  guard, a quick Alt+P test run leaks one atlas entry each time.`,
      },
      {
        title: "Loading PNGs: previews.load() and the RGBA requirement",
        body: `pcoll.load(id_str, filepath, image_type)

  id_str     — arbitrary string key; used to retrieve icon_id later.
  filepath   — absolute path to a PNG file.
  image_type — "IMAGE" for static PNG, "MOVIE" for frame sequences.

PNG must be RGBA (four channels). An RGB PNG without alpha renders as solid
black in Blender's icon atlas — the compositor expects the alpha channel even
if it is opaque white. Convert with:
  ffmpeg -i icon.png -pix_fmt rgba icon_rgba.png
or in Blender's Image Editor: Image → Canvas Size → Alpha Channel → Add.

icon_id is only valid after load() completes. Trying to read it before
register_previews() has run returns 0 (NONE), which draws no icon. Wrapping
the lookup in a helper that returns 0 on failure prevents draw() from crashing:
  def icon_id(key: str) -> int:
      if _pcoll is None: return 0
      entry = _pcoll.get(key)
      return entry.icon_id if entry else 0`,
      },
      {
        title: "Dynamic EnumProperty items with icon_value=",
        body: `Static EnumProperty tuples are (identifier, name, description).
To supply icon_value= you must use the 5-tuple form:
  (identifier, name, description, icon_value_int, number)

The "number" field is the integer stored in the .blend file — keep it
stable across Blender versions. Using list index (0, 1, 2…) is conventional.

The items callback must be a function, not a static list, because icon_id()
is only valid after register_previews() — which runs after the class is
defined. A static list evaluated at module import time would read icon_ids
of 0 before the collection is loaded.

def _format_items(self, context):
    return [
        ("GLB",           "GLB",        "Binary .glb",         icon_id("GLB"),           0),
        ("GLTF_SEPARATE", "glTF + bin", "Separate .gltf pair", icon_id("GLTF_SEPARATE"), 1),
    ]

class HLF_IconQueueItem(bpy.types.PropertyGroup):
    fmt: bpy.props.EnumProperty(
        name="Format",
        items=_format_items,
        default=0,           # integer default, not string, for 5-tuple enums
    )

Using the icon in a row:
  row.prop(item, "fmt", text="", icon_value=icon_id(item.fmt))
  # item.fmt returns the identifier string ("GLB" or "GLTF_SEPARATE"),
  # which icon_id() maps back to the integer handle.`,
      },
      {
        title: "Render thumbnail: Workbench render → PNG → slot.reload()",
        body: `There is no public API in Blender 5.1 to write raw pixels into a
PreviewCollection slot. The documented path is:
  1. Render an image to bpy.data.images["Render Result"].
  2. Save it to disk as PNG.
  3. Reload the slot: pcoll["render_thumb"].reload()

Use Workbench (BLENDER_WORKBENCH) for thumbnails:
  scene.render.engine = "BLENDER_WORKBENCH"
  scene.render.resolution_x = 128
  scene.render.resolution_y = 128
  bpy.ops.render.render(write_still=False)

WHY Workbench and not Cycles or EEVEE?
  Workbench renders in ~50ms regardless of light setup — no HDRI, no
  lamp objects, no probe bakes. Cycles would add noise at 128px; EEVEE Next
  requires light probes to be baked before reflection data is available.
  For a thumbnail that shows shape and base colour, Workbench is correct.

Always restore render settings in a try/finally block so a render failure
cannot leave the scene in a modified state:
  try:
      bpy.ops.render.render(write_still=False)
  finally:
      scene.render.engine = orig_engine
      scene.render.resolution_x = orig_rx
      ...

Display with template_icon():
  layout.template_icon(icon_value=icon_id("render_thumb"), scale=5.0)
  # scale=5.0 ≈ 128px at 96 DPI. Adjust per viewport zoom level.`,
      },
      {
        title: "icon_value= in layout calls and GPU cleanup",
        body: `layout.prop(data, propname, icon_value=42)
  — icon= and icon_value= conflict; use one or the other per call.

layout.template_icon(icon_value=42, scale=5.0)
  — Full-width thumbnail; scale=5.0 ≈ 128px at 96 DPI.
  — Use for render previews and asset images, not small buttons.

Alert tint — red row on empty slot:
  sub = row.row()
  sub.alert = item.obj is None   # tints all children of the sub-row
  sub.prop(item, "obj", text="")

GPU cleanup — call in unregister() BEFORE del and unregister_class():
  def unregister() -> None:
      unregister_previews()           # frees GPU atlas entries first
      del bpy.types.Scene.hlf_queue
      for cls in reversed(CLASSES):
          bpy.utils.unregister_class(cls)
After remove(), stale icon_value= integers draw as NONE (empty), not a crash —
the module-level None guard in icon_id() prevents AttributeError during the
draw() calls that fire between remove() and unregister_class().`,
      },
      {
        title: "Troubleshooting",
        body: `1. Icons appear as solid black
   → PNG is RGB-only.  Convert: ffmpeg -i icon.png -pix_fmt rgba out.png
     or Blender Image Editor → Canvas Size → Add Alpha.

2. icon_id() returns 0 for a loaded key
   → Key string is case-sensitive.  Print list(_pcoll.keys()) to verify.

3. AttributeError on panel redraw during unregister
   → draw() fired before unregister_class() completed.
     Guard with: if _pcoll is None: return 0.

4. EnumProperty default fails with "not found" after .blend reload
   → Use integer default (default=0), not a string, with 5-tuple enum items.

5. reload() has no visible effect
   → Confirm img.save() actually wrote to disk (check file timestamp).
     Also ensure the path passed to load() and the PNG path are the same file.`,
      },
    ],
  },
  base
);
