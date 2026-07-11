import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.app.handlers</code> exposes typed Python callable lists that
        Blender fires at lifecycle events — frame changes, depsgraph flushes,
        file saves, file opens, and renders. Registering a function into one
        of those lists makes it a hook: it runs inside the main event loop
        without polling. The critical subtlety is the{" "}
        <code>@bpy.app.handlers.persistent</code> decorator: without it, every{" "}
        <code>.blend</code> file open silently empties all handler lists and
        your reactive pipeline stops working. With it, Blender sets a C-level
        flag on the function so it survives the load.
      </p>
      <p>
        This tutorial wires four pipelines: a shape-key VAT sampler on{" "}
        <code>frame_change_post</code>, a diff-writing light watcher on{" "}
        <code>depsgraph_update_post</code>, a GLB auto-exporter on{" "}
        <code>save_post</code>, and a bootstrap re-registrar on{" "}
        <code>load_post</code>. Together they form a reactive WebXR asset
        pipeline — files update on the filesystem the moment you edit a
        property or move the timeline, with no manual export step. The VAT
        output feeds directly into the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cloth-modifier-sim-bake-vertex-animation-texture-webxr"
          className={lk}
        >
          cloth VAT tutorial
        </Link>{" "}
        pipeline; the headless GLB operator called in{" "}
        <code>save_post</code> follows the context injection pattern from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context override tutorial
        </Link>
        . Screen recordings of this reactive pipeline can be assembled into a
        tutorial video with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-sequence-editor-vse-script-tutorial-assembly"
          className={lk}
        >
          VSE assembly tutorial
        </Link>
        .
      </p>
      <p>
        Outside references:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.app.handlers.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Foundation — bpy.app.handlers API Reference (CC-BY-4.0)
        </a>
        , sibling: projects.blender.org/blender/blender,
        github.com/blender/blender-manual;{" "}
        <a
          href="https://docs.blender.org/api/5.1/info_tips_and_tricks.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Foundation — Python Tips &amp; Tricks: Persistent Handler on
          Frame Change (CC-BY-4.0)
        </a>
        , sibling: developer.blender.org/docs/.
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Register the handler suite and build the demo scene",
        body: `# Imports and constants up top — always tune these before running.
# BLEND_DIR resolves relative to the saved .blend; falls back to /tmp
# when unsaved so the script is still runnable from an empty startup file.

import bpy, json, pathlib, time
from bpy.app.handlers import persistent

WATCH_MESH   = "HF_VAT_Source"
WATCH_LIGHTS = frozenset({"HF_Key", "HF_Fill", "HF_Rim"})
SAMPLE_EVERY = 4      # capture every 4th frame → 6 samples/sec at 24 fps
MAX_VERTS    = 256
EXPORT_CD    = 2.0    # seconds between GLB auto-exports

_BLEND_DIR  = pathlib.Path(bpy.data.filepath).parent if bpy.data.filepath else pathlib.Path("/tmp")
_GLB_OUT    = _BLEND_DIR.parents[3] / "public/library/glbs/scripting/handlers-demo/handlers_demo.glb"
_LIGHT_JSON = _BLEND_DIR / "light_rig.json"
_VAT_JSON   = _BLEND_DIR / "vat_samples.json"

# Module-level dict: the ONLY stable carrier across handler re-registration.
# Function objects are recreated each script exec; module globals survive.
_S = {"vat_frames": [], "last_light_hash": None, "last_export_t": 0.0}

# ── registration guards ───────────────────────────────────────────────────────
def _append_once(lst, fn):
    if fn not in lst:
        lst.append(fn)

def register_handlers():
    _append_once(bpy.app.handlers.frame_change_post,     on_frame_change)
    _append_once(bpy.app.handlers.depsgraph_update_post, on_depsgraph_update)
    _append_once(bpy.app.handlers.save_post,             on_save_post)
    _append_once(bpy.app.handlers.load_post,             on_load_post)

# ── demo scene ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1.0)
sphere = bpy.context.active_object
sphere.name = WATCH_MESH
sphere.shape_key_add(name="Basis", from_mix=False)
squish = sphere.shape_key_add(name="Squish", from_mix=False)
for vi, v in enumerate(sphere.data.vertices):
    if vi >= MAX_VERTS: break
    squish.data[vi].co.x = v.co.x * 1.5
    squish.data[vi].co.y = v.co.y * 1.5
    squish.data[vi].co.z = v.co.z * 0.35   # squash along Z

kb = sphere.data.shape_keys.key_blocks["Squish"]
for frame, val in ((1, 0.0), (12, 1.0), (24, 0.0)):
    kb.value = val
    kb.keyframe_insert("value", frame=frame)

for name, kind, energy, color, loc in (
    ("HF_Key",  "AREA", 800.0, (1.0, 0.95, 0.88), ( 3,  2, 4)),
    ("HF_Fill", "AREA", 200.0, (0.85, 0.9, 1.0),  (-3,  0, 2)),
    ("HF_Rim",  "SPOT", 400.0, (1.0, 0.98, 0.95), ( 0, -4, 3)),
):
    ld = bpy.data.lights.new(name, kind)
    ld.energy, ld.color = energy, color
    obj = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = loc

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 24`,
      },
      {
        title: "frame_change_post — VAT vertex sampler",
        body: `# frame_change_post fires AFTER the depsgraph has evaluated the new frame,
# so evaluated_get() returns fully-deformed geometry — shape keys, GN stacks,
# armatures, cloth sims, everything applied.
#
# The depsgraph parameter was introduced in 4.x.  default=None keeps the
# handler runnable on older builds; in 5.1 it is always provided.
#
# CRITICAL: always call to_mesh_clear() after to_mesh().  The GC cannot
# collect the temporary evaluated mesh while the depsgraph holds an internal
# reference, causing accumulating memory leaks on long playbacks.

@persistent
def on_frame_change(scene, depsgraph=None):
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
    _VAT_JSON.parent.mkdir(parents=True, exist_ok=True)
    _VAT_JSON.write_text(json.dumps({"watch_mesh": WATCH_MESH, "frames": _S["vat_frames"]}, indent=2))

# Register now, then press Spacebar in the Timeline to capture VAT data.
# After playback: vat_samples.json holds one entry per SAMPLE_EVERY frames.`,
      },
      {
        title: "depsgraph_update_post — light watcher with hash guard",
        body: `# depsgraph_update_post fires after EVERY graph flush — selection events,
# cursor moves, even scrolling the Properties panel triggers it.
# Without a hash guard this handler would write light_rig.json dozens
# of times per second during normal editing, causing disk thrash.
#
# depsgraph.updates is an iterable of DepsgraphUpdate with:
#   .id               — the datablock (bpy.types.ID)
#   .is_updated_geometry
#   .is_updated_transform
#   .is_updated_shading   ← relevant for lights
# We could filter on is_updated_shading for LIGHT objects, but a fingerprint
# hash on the actual property values handles all edge cases (e.g. a
# LightGroup node driving energy indirectly, which does NOT set is_updated_shading).

def _light_fp():
    parts = []
    for n in sorted(WATCH_LIGHTS):
        o = bpy.data.objects.get(n)
        if o and o.type == "LIGHT":
            ld = o.data
            parts.append(f"{n}:{ld.type}:{ld.energy:.3f}:{ld.color[0]:.4f},{ld.color[1]:.4f},{ld.color[2]:.4f}")
    return "|".join(parts) or None

@persistent
def on_depsgraph_update(scene, depsgraph):
    fp = _light_fp()
    if fp is None or fp == _S["last_light_hash"]:
        return
    _S["last_light_hash"] = fp
    rig = {}
    for n in sorted(WATCH_LIGHTS):
        o = bpy.data.objects.get(n)
        if o and o.type == "LIGHT":
            ld = o.data
            rig[n] = {"type": ld.type, "energy": round(ld.energy, 3),
                      "color": [round(c, 4) for c in ld.color],
                      "location": [round(v, 4) for v in o.location]}
    _LIGHT_JSON.parent.mkdir(parents=True, exist_ok=True)
    _LIGHT_JSON.write_text(json.dumps(rig, indent=2))

# Test: drag HF_Key Energy slider → watch light_rig.json update once per change.`,
      },
      {
        title: "save_post + load_post — GLB auto-export and bootstrap",
        body: `# save_post: auto-export the active collection as GLB after each Ctrl+S.
# In Blender 5.1, save_post receives the filepath as a positional str.
# Earlier builds passed a dummy scene arg.  **_kw absorbs future keyword args.
# Cooldown guard prevents export storms on rapid saves.

@persistent
def on_save_post(filepath, **_kw):
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
        export_apply                         = True,
        export_yup                           = True,
    )
    print(f"[holoflow] GLB → {_GLB_OUT}")

# load_post: the bootstrap handler.
# Despite @persistent, handler lists ARE emptied on file load.
# @persistent keeps the function only if it was already registered BEFORE the
# load began.  load_post solves the chicken-and-egg problem: register it once
# on startup; it re-registers the full suite (including itself) on every open.
# Clear accumulated VAT state so the new file's animation starts fresh.

@persistent
def on_load_post(*_):
    _S["vat_frames"].clear()
    _S["last_light_hash"] = None
    register_handlers()
    print("[holoflow] load_post: handlers re-registered")

# Final registration call — all four handlers now active.
register_handlers()
print(f"[holoflow] frame_change_post    → {len(bpy.app.handlers.frame_change_post)} handlers")
print(f"[holoflow] depsgraph_update_post→ {len(bpy.app.handlers.depsgraph_update_post)} handlers")`,
      },
      {
        title: "Verify persistence and clean up",
        body: `# Verify: check the handler lists directly after a file reopen.
import bpy

# List all registered frame_change_post handlers by name
print("frame_change_post handlers:")
for h in bpy.app.handlers.frame_change_post:
    persistent_flag = getattr(h, "persistent", False)
    print(f"  {h.__name__}  persistent={persistent_flag}")

# Expected output after open:
#   on_frame_change  persistent=True
# Without @persistent you would see the list is empty here.

# ── clean unregister ──────────────────────────────────────────────────────────
# Always unregister before re-running the script to avoid duplicate handlers.
# Duplicate handlers fire twice per event — causes double JSON writes and
# double GLB exports.  _append_once() prevents this during register_handlers(),
# but an explicit unregister is the correct way to fully tear down.

def unregister_handlers():
    for lst, fn in (
        (bpy.app.handlers.frame_change_post,     on_frame_change),
        (bpy.app.handlers.depsgraph_update_post, on_depsgraph_update),
        (bpy.app.handlers.save_post,             on_save_post),
        (bpy.app.handlers.load_post,             on_load_post),
    ):
        try:
            lst.remove(fn)
        except ValueError:
            pass   # already absent; safe to ignore

# Call unregister_handlers() before re-running blueprint.py to reset state.
# unregister_handlers()`,
      },
    ],
    troubleshooting: [
      {
        symptom: "vat_samples.json is not updating during timeline playback",
        cause: "frame_change_post handler is not registered — handler lists are emptied on file open without @persistent or on_load_post bootstrap",
        fix: "Confirm frame_change_post contains on_frame_change: print(bpy.app.handlers.frame_change_post). If empty, re-run blueprint.py. Ensure on_load_post was registered before the file was opened so it can bootstrap the suite on the next open.",
      },
      {
        symptom: "light_rig.json updates on every mouse move, not just light changes",
        cause: "The module-level _S dict is being reset on each event, so _last_light_hash is always None and the hash guard never fires",
        fix: "Ensure _S is declared at module scope and the module is NOT reloaded on each event. Blender does not reload the module automatically; if you called importlib.reload() manually, stop — it creates a new _S dict and breaks the guard.",
      },
      {
        symptom: "GLB auto-export fails with RuntimeError: context is incorrect on Ctrl+S",
        cause: "export_scene.gltf requires a valid window context — absent in headless/background sessions where save_post still fires",
        fix: "Wrap the gltf export in bpy.context.temp_override(window=bpy.context.window_manager.windows[0]). See the context override tutorial for the full headless operator injection pattern.",
      },
      {
        symptom: "Memory grows continuously during long timeline playbacks",
        cause: "obj_eval.to_mesh() is called without a matching obj_eval.to_mesh_clear() — the evaluated mesh holds a C-level reference preventing GC reclamation",
        fix: "Call obj_eval.to_mesh_clear() immediately after the vertex sampling loop in on_frame_change. ~2 MB leaks per frame without it; a 240-frame timeline at 24fps leaks ~480 MB before Blender runs out of addressable space.",
      },
      {
        symptom: "Handlers fire twice per event after re-running the script",
        cause: "Script was run twice without calling unregister_handlers() first; handler lists allow duplicate entries; each script exec creates a new function object so _append_once() sees it as distinct",
        fix: "Call unregister_handlers() at the top of the script before re-registering, or run it manually in the Text Editor console between executions. The _append_once() guard only prevents duplicates within a single script run.",
      },
    ],
  },
  {
    slug: "python-bpy-app-handlers-persistent-event-hooks-webxr",
    kind: "tutorial" as const,
    title:
      "Python bpy.app.handlers — Persistent Frame-Change, Depsgraph & Save Hooks for Reactive WebXR Export (Blender 5.1)",
    excerpt:
      "Wire frame_change_post, depsgraph_update_post, save_post, and load_post handlers with the @persistent decorator to build a reactive WebXR asset pipeline that auto-samples VAT vertex data, diff-writes light_rig.json, and exports GLB on every save — surviving file opens.",
    date: "2026-07-11",
    Body,
    tags: [
      "blender",
      "python",
      "scripting",
      "bpy.app.handlers",
      "persistent",
      "frame-change",
      "depsgraph",
      "reactive",
      "vat",
      "vertex-animation-texture",
      "webxr",
      "glb",
      "automation",
    ],
  }
);
