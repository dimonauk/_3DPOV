"""
bpy.app.handlers.load_post + bpy.app.driver_namespace
Production .blend Package: Open-File Setup Hooks, Custom Driver Functions,
and Render-Pipeline Guards
Blender 5.1 · Holoflow Studio · CC0 1.0 Universal

TECHNIQUE
─────────
bpy.app.handlers is a module-level collection of lists, each tied to a
Blender lifecycle event. Append a Python callable to the relevant list and
Blender calls it at the right moment — no add-on registration required.

Three handler lists are used here:

  load_post    Fires every time a .blend completes loading (open, revert,
               File > New). Signature: fn(filepath, *args). Use it to
               auto-configure render settings and validate the scene.

  render_pre   Fires before every render frame (F12, bpy.ops.render.render,
               or the CLI -f flag). Signature: fn(scene, *args). Use it as
               a pre-flight guard: warn about under-sampled settings or a
               missing output path.

  save_post    Fires after each successful save. Signature: fn(filepath,
               *args). Use it to stamp a "last saved" timestamp or version
               counter on a custom scene property.

CRITICAL: @bpy.app.handlers.persistent
Without this decorator, any handler appended to a list is silently removed
the moment a new .blend is loaded. The decorator tells Blender to keep the
function in the list across loads. This is the single most common mistake
with Blender handlers — everything appears to work in the session where you
registered the handler, then breaks when you re-open the file.

bpy.app.driver_namespace
A plain Python dict (bpy.app.driver_namespace). Register any callable in it
and that function becomes callable by name inside any FCurve driver expression.

  bpy.app.driver_namespace["hs_breathe"] = hs_breathe

Driver expression in the Graph Editor:
  hs_breathe(frame, 0.04, 30.0)

The built-in `frame` variable in a driver expression equals the evaluated
frame number. That alone enables a rich set of time-based functions.
The function runs once per depsgraph evaluation for that channel, so keep
it cheap — no scene queries, no bpy.data lookups, pure math only.

Registering in driver_namespace is NOT @persistent. The namespace resets on
load. The correct fix: register inside a load_post handler so the functions
are always available immediately after any .blend opens.

WHY NOT USE AN ADD-ON?
Add-ons require blender_manifest.toml (5.x) or bl_info (4.x) and a manual
install step. Handlers appended from a Text block run as soon as you press
Alt+P and persist (with @persistent) across re-opens — perfect for a
self-contained .blend package that an artist opens directly.

Run: Text Editor → Run Script (Alt+P)
Outputs: holoflow_package_demo.blend (saved to same folder)
"""

import math
import os
import bpy

# ── Constants ─────────────────────────────────────────────────────────────────
SLUG           = "python-load-post-driver-namespace-blend-package-setup"
PACKAGE_VER    = "1.0.0"
EEVEE_MIN_SAMP = 64        # render_pre warns below this
OUTPUT_RELPATH = "//output/"
CRYSTAL_NAME   = "hs_crystal"
ANIM_FRAMES    = 120       # 5 s @ 24 fps


# ── Driver namespace functions ────────────────────────────────────────────────
# Pure-math callables: no bpy queries, no side effects.
# Registered into bpy.app.driver_namespace inside _register_driver_namespace()
# so they survive across .blend loads.

def hs_breathe(frame: float, amp: float = 0.05, freq: float = 30.0) -> float:
    """Sine-wave scalar: returns 1.0 + amp * sin(2π * frame / freq).
    Use on a Z-scale channel for an organic 'breathing' idle animation.
    """
    return 1.0 + amp * math.sin(2.0 * math.pi * frame / freq)


def hs_blink(frame: float, interval: float = 90.0, hold: float = 4.0) -> float:
    """Square-wave blink: returns 1.0 (eyelid open) or 0.0 (closed).
    Useful on a shape-key value channel for VRM eye blinks without keyframes.
    """
    phase = math.fmod(frame, interval)
    return 0.0 if phase < hold else 1.0


def hs_orbit(frame: float, radius: float = 1.0, freq: float = 240.0) -> float:
    """Returns X position along a circular orbit of given radius.
    Pair with a Y-orbit driver on 90° phase offset to get full rotation.
    """
    return radius * math.cos(2.0 * math.pi * frame / freq)


def _register_driver_namespace() -> None:
    ns = bpy.app.driver_namespace
    ns["hs_breathe"] = hs_breathe
    ns["hs_blink"]   = hs_blink
    ns["hs_orbit"]   = hs_orbit


# ── load_post handler ─────────────────────────────────────────────────────────

@bpy.app.handlers.persistent
def holoflow_load_post(filepath: str, *args) -> None:
    """Runs after every .blend open. Configures render defaults and registers
    driver_namespace so functions are available immediately on load."""
    _register_driver_namespace()

    scene = bpy.context.scene
    if scene is None:
        return

    # Auto-configure EEVEE for WebXR preview renders.
    if hasattr(scene, "eevee"):
        ee = scene.eevee
        if ee.taa_render_samples < EEVEE_MIN_SAMP:
            ee.taa_render_samples = EEVEE_MIN_SAMP

    # Stamp version on the scene custom property (survives save/load).
    scene["hs_package_version"] = PACKAGE_VER
    scene["hs_loaded_from"]     = filepath or "(new file)"


# ── render_pre handler ────────────────────────────────────────────────────────

@bpy.app.handlers.persistent
def holoflow_render_pre(scene, *args) -> None:
    """Pre-flight guard: checks sample count and output path before each render.
    Raises RuntimeError to abort the render if the scene is not export-ready.
    """
    if scene is None:
        return

    if (scene.render.engine == "BLENDER_EEVEE_NEXT"
            and hasattr(scene, "eevee")):
        samp = scene.eevee.taa_render_samples
        if samp < EEVEE_MIN_SAMP:
            raise RuntimeError(
                f"[Holoflow] EEVEE samples = {samp} < {EEVEE_MIN_SAMP}. "
                "Increase to avoid noise before exporting to WebXR."
            )

    out = scene.render.filepath
    if not out:
        raise RuntimeError(
            "[Holoflow] scene.render.filepath is empty. "
            f"Set it to {OUTPUT_RELPATH} or an absolute path before rendering."
        )


# ── save_post handler ─────────────────────────────────────────────────────────

@bpy.app.handlers.persistent
def holoflow_save_post(filepath: str, *args) -> None:
    """Increments the scene's save counter and records the output path."""
    scene = bpy.context.scene
    if scene is None:
        return
    count = scene.get("hs_save_count", 0) + 1
    scene["hs_save_count"]  = count
    scene["hs_last_saved"]  = filepath or "(unknown)"


# ── Handler registration ───────────────────────────────────────────────────────

def _already_registered(handler_list, fn) -> bool:
    """Guard against duplicate registration — comparing by function identity."""
    return any(h is fn for h in handler_list)


def register_handlers() -> None:
    hl = bpy.app.handlers
    if not _already_registered(hl.load_post, holoflow_load_post):
        hl.load_post.append(holoflow_load_post)
    if not _already_registered(hl.render_pre, holoflow_render_pre):
        hl.render_pre.append(holoflow_render_pre)
    if not _already_registered(hl.save_post, holoflow_save_post):
        hl.save_post.append(holoflow_save_post)
    _register_driver_namespace()


def unregister_handlers() -> None:
    hl = bpy.app.handlers
    for fn in (holoflow_load_post, holoflow_render_pre, holoflow_save_post):
        try:
            hl.load_post.remove(fn)
        except ValueError:
            pass
        try:
            hl.render_pre.remove(fn)
        except ValueError:
            pass
        try:
            hl.save_post.remove(fn)
        except ValueError:
            pass
    for key in ("hs_breathe", "hs_blink", "hs_orbit"):
        bpy.app.driver_namespace.pop(key, None)


# ── Scene build ───────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for pool in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                 bpy.data.lights):
        for blk in list(pool):
            if blk.users == 0:
                pool.remove(blk)


def build_crystal() -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=6, radius=0.3, depth=0.9, location=(0, 0, 0.45))
    obj = bpy.context.active_object
    obj.name = CRYSTAL_NAME

    # Driver on Z scale — uses hs_breathe from driver_namespace
    obj.driver_add("scale", 2)          # index 2 = Z
    drv = obj.animation_data.drivers[-1].driver
    drv.type = "SCRIPTED"
    drv.expression = "hs_breathe(frame, 0.04, 30.0)"
    # No variables needed — 'frame' is a built-in driver variable

    # Simple emission material
    mat = bpy.data.materials.new("crystal_emission")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (0.4, 0.7, 1.0, 1.0)
    emit.inputs["Strength"].default_value = 2.0
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)
    return obj


def add_camera_and_light() -> None:
    bpy.ops.object.camera_add(location=(3.0, -4.0, 2.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.05, 0.0, 0.63)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="SUN", location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 3.0


def configure_render(scene: bpy.types.Scene) -> None:
    scene.frame_start  = 1
    scene.frame_end    = ANIM_FRAMES
    scene.render.fps   = 24
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 64
    scene.render.filepath  = OUTPUT_RELPATH
    scene.render.image_settings.file_format  = "PNG"
    scene.render.image_settings.color_mode   = "RGBA"


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    register_handlers()
    clear_scene()
    scene = bpy.context.scene
    configure_render(scene)
    build_crystal()
    add_camera_and_light()

    # Trigger load_post manually so the scene picks up version stamps now.
    holoflow_load_post(bpy.data.filepath)

    save_path = os.path.join(os.path.dirname(__file__),
                             "holoflow_package_demo.blend")
    bpy.ops.wm.save_as_mainfile(filepath=save_path, compress=True)
    print(f"[Holoflow] Saved: {save_path}")
    print(f"  hs_package_version : {scene.get('hs_package_version')}")
    print(f"  load_post handlers : "
          f"{[h.__name__ for h in bpy.app.handlers.load_post]}")
    print(f"  driver_namespace   : "
          f"{list(k for k in bpy.app.driver_namespace if k.startswith('hs_'))}")


if __name__ == "__main__":
    main()
