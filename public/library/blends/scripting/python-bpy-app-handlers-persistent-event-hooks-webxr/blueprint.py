"""
bpy.app.handlers — Persistent Event Hooks: Reactive WebXR Export Pipeline
Blender 5.1 · CC0

TECHNIQUE
─────────
bpy.app.handlers exposes typed lists of Python callables fired at Blender
lifecycle events: frame change, depsgraph evaluation, file save/load, render.
The @bpy.app.handlers.persistent decorator sets a C-level flag on the
function so Blender retains it across .blend file loads — without it every
file open silently empties all handler lists and the reactive pipeline stops.

Four studio pipelines wired here:
  1. frame_change_post     → shape-key VAT sampler (every N frames)
  2. depsgraph_update_post → light watcher → diff-write light_rig.json
  3. save_post             → auto-export GLB with Holoflow standard settings
  4. load_post             → bootstrap: re-registers the whole suite on open
"""
import bpy
import json
import pathlib
import time
from bpy.app.handlers import persistent

# ── constants ─────────────────────────────────────────────────────────────────
# bpy.data.filepath is '' when unsaved; fall back to /tmp for development runs
_BLEND_DIR  = pathlib.Path(bpy.data.filepath).parent if bpy.data.filepath else pathlib.Path("/tmp")
_LIB_ROOT   = _BLEND_DIR.parents[3] / "public" / "library"
_GLB_OUT    = _LIB_ROOT / "glbs" / "scripting" / "handlers-demo" / "handlers_demo.glb"
_LIGHT_JSON = _BLEND_DIR / "light_rig.json"
_VAT_JSON   = _BLEND_DIR / "vat_samples.json"

WATCH_MESH   = "HF_VAT_Source"
WATCH_LIGHTS = frozenset({"HF_Key", "HF_Fill", "HF_Rim"})
SAMPLE_EVERY = 4      # capture every 4th frame → 6 samples/sec at 24fps
MAX_VERTS    = 256    # cap to keep JSON size reasonable; decimate above this
EXPORT_CD    = 2.0    # seconds cooldown between auto-exports on save

# ── mutable state carrier ─────────────────────────────────────────────────────
# Module-level dict is the ONLY stable state carrier across handler re-registration.
# Function objects are recreated each time the script runs; module globals survive.
_S: dict = {
    "vat_frames":      [],    # [{frame, positions: [[x,y,z],...]}]
    "last_light_hash": None,  # hash to detect real light changes vs noise
    "last_export_t":   0.0,
}

# ── helpers ───────────────────────────────────────────────────────────────────

def _light_fingerprint() -> str | None:
    """Stable fingerprint of watched light energies + colours.

    depsgraph_update_post fires on EVERY graph flush — selection, cursor moves,
    even timeline scrubbing. The fingerprint avoids JSON writes on events that
    don't touch light data, keeping disk writes proportional to actual changes.
    """
    parts = []
    for name in sorted(WATCH_LIGHTS):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            ld = obj.data
            parts.append(
                f"{name}:{ld.type}:{ld.energy:.3f}:"
                f"{ld.color[0]:.4f},{ld.color[1]:.4f},{ld.color[2]:.4f}"
            )
    return "|".join(parts) or None


def _write_json(path: pathlib.Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))

# ── handler 1: VAT vertex sampler ────────────────────────────────────────────

@persistent
def on_frame_change(scene, depsgraph=None):
    """Sample mesh vertex positions every SAMPLE_EVERY frames for VAT.

    frame_change_post fires AFTER the depsgraph has evaluated the new frame,
    so evaluated_get() returns fully-deformed geometry (modifiers, shape keys,
    GN stacks, armatures all applied).

    The depsgraph parameter was added in 4.x; the default=None guard keeps
    compatibility with older builds. Always call to_mesh_clear() after
    to_mesh() — the GC cannot collect the temporary mesh while the depsgraph
    holds an internal reference, causing accumulating memory leaks on long
    playbacks.
    """
    if scene.frame_current % SAMPLE_EVERY != 0:
        return
    obj = bpy.data.objects.get(WATCH_MESH)
    if not obj or obj.type != "MESH":
        return

    if depsgraph is not None:
        obj_eval = obj.evaluated_get(depsgraph)
        mesh = obj_eval.to_mesh()
    else:
        obj_eval = obj
        mesh = obj.data

    positions = [
        [round(v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5)]
        for i, v in enumerate(mesh.vertices) if i < MAX_VERTS
    ]
    if depsgraph is not None:
        obj_eval.to_mesh_clear()   # required: release before GC can reclaim

    _S["vat_frames"].append({"frame": scene.frame_current, "positions": positions})
    _write_json(_VAT_JSON, {"watch_mesh": WATCH_MESH, "frames": _S["vat_frames"]})

# ── handler 2: light watcher ──────────────────────────────────────────────────

@persistent
def on_depsgraph_update(scene, depsgraph):
    """Diff-write light_rig.json whenever a watched light property changes.

    depsgraph.updates is an iterable of DepsgraphUpdate with .id (datablock),
    .is_updated_geometry, .is_updated_transform, .is_updated_shading. Filtering
    on is_updated_shading for light objects is possible but misses indirect
    energy changes (e.g. light-group node connections). A fingerprint hash on
    the actual property values handles all cases and is simpler to maintain.
    """
    fp = _light_fingerprint()
    if fp is None or fp == _S["last_light_hash"]:
        return
    _S["last_light_hash"] = fp

    rig = {}
    for name in sorted(WATCH_LIGHTS):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            ld = obj.data
            rig[name] = {
                "type":     ld.type,
                "energy":   round(ld.energy, 3),
                "color":    [round(c, 4) for c in ld.color],
                "location": [round(v, 4) for v in obj.location],
                "rotation": [round(v, 4) for v in obj.rotation_euler],
            }
    _write_json(_LIGHT_JSON, rig)

# ── handler 3: save-post GLB auto-export ──────────────────────────────────────

@persistent
def on_save_post(filepath, **_kw):
    """Auto-export active collection as GLB after each .blend save.

    In Blender 5.1, save_post receives filepath as a positional str.
    Earlier builds passed a dummy scene argument. **_kw absorbs any
    future keyword args added by the API.

    Cooldown guard prevents export storms during rapid Ctrl+S sessions;
    two saves within EXPORT_CD seconds share the first output.
    """
    now = time.monotonic()
    if now - _S["last_export_t"] < EXPORT_CD:
        return
    _S["last_export_t"] = now
    _GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath                             = str(_GLB_OUT),
        export_format                        = "GLB",
        use_active_collection                = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
        export_apply                         = True,   # apply modifiers before export
        export_yup                           = True,   # +Y-up for WebXR / glTF
    )
    print(f"[holoflow] GLB → {_GLB_OUT}")

# ── handler 4: load-post bootstrap ───────────────────────────────────────────

@persistent
def on_load_post(*_):
    """Re-register the full handler suite after a .blend file is opened.

    Despite @persistent, handler lists are EMPTIED on file load — @persistent
    marks the function so Blender keeps it only if it was already in the list
    before the load began. Using load_post as a bootstrap solves the chicken-
    and-egg problem: register it once on startup; it re-registers everything
    else (including itself, via register_handlers) on every subsequent open.

    Clear accumulated VAT state so the new file's animation starts fresh.
    """
    _S["vat_frames"].clear()
    _S["last_light_hash"] = None
    register_handlers()
    print("[holoflow] load_post: handlers re-registered")

# ── registration ──────────────────────────────────────────────────────────────

def _append_once(handler_list, fn) -> None:
    if fn not in handler_list:
        handler_list.append(fn)


def register_handlers() -> None:
    _append_once(bpy.app.handlers.frame_change_post,     on_frame_change)
    _append_once(bpy.app.handlers.depsgraph_update_post, on_depsgraph_update)
    _append_once(bpy.app.handlers.save_post,             on_save_post)
    _append_once(bpy.app.handlers.load_post,             on_load_post)


def unregister_handlers() -> None:
    for lst, fn in (
        (bpy.app.handlers.frame_change_post,     on_frame_change),
        (bpy.app.handlers.depsgraph_update_post, on_depsgraph_update),
        (bpy.app.handlers.save_post,             on_save_post),
        (bpy.app.handlers.load_post,             on_load_post),
    ):
        try:
            lst.remove(fn)
        except ValueError:
            pass

# ── demo scene ────────────────────────────────────────────────────────────────

def _setup_scene() -> None:
    """Minimal scene that exercises all four handler pipelines.

    HF_VAT_Source — sphere with a squish shape key keyframed 1→12→24.
      frame_change_post samples its vertices every SAMPLE_EVERY frames.
    HF_Key / HF_Fill / HF_Rim — three lights whose energy/colour
      depsgraph_update_post watches and serialises to light_rig.json.
    """
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1.0)
    sphere = bpy.context.active_object
    sphere.name = WATCH_MESH
    sphere.shape_key_add(name="Basis", from_mix=False)
    squish = sphere.shape_key_add(name="Squish", from_mix=False)
    for vi, v in enumerate(sphere.data.vertices):
        if vi >= MAX_VERTS:
            break
        squish.data[vi].co.x = v.co.x * 1.5
        squish.data[vi].co.y = v.co.y * 1.5
        squish.data[vi].co.z = v.co.z * 0.35

    kb = sphere.data.shape_keys.key_blocks["Squish"]
    for frame, val in ((1, 0.0), (12, 1.0), (24, 0.0)):
        kb.value = val
        kb.keyframe_insert("value", frame=frame)

    for name, kind, energy, color, loc in (
        ("HF_Key",  "AREA",  800.0, (1.00, 0.95, 0.88), ( 3,  2, 4)),
        ("HF_Fill", "AREA",  200.0, (0.85, 0.90, 1.00), (-3,  0, 2)),
        ("HF_Rim",  "SPOT",  400.0, (1.00, 0.98, 0.95), ( 0, -4, 3)),
    ):
        ld  = bpy.data.lights.new(name, kind)
        ld.energy = energy
        ld.color  = color
        obj = bpy.data.objects.new(name, ld)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = loc

    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = 24

# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _setup_scene()
    register_handlers()
    print("[holoflow] bpy.app.handlers demo ready")
    print(f"  frame_change_post    → {len(bpy.app.handlers.frame_change_post)} handlers")
    print(f"  depsgraph_update_post→ {len(bpy.app.handlers.depsgraph_update_post)} handlers")
    print("  play timeline → vat_samples.json  |  edit lights → light_rig.json")
    print("  Ctrl+S → handlers_demo.glb")


main()
