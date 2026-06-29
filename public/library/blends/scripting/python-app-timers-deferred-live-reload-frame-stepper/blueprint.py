"""
bpy.app.timers — Deferred Execution, Throttled Live Reloader & Headless Frame Stepper
======================================================================================
Blender 5.1 | CC0 1.0 Universal

bpy.app.timers schedules Python callables to fire on Blender's main thread after
a specified delay. The callable returns None to cancel itself or a float to
reschedule. Because every call lands on the main thread, the full bpy API is safe
to use — unlike threading.Thread, which must never touch bpy directly.

Three production patterns are demonstrated here using a single Noise-displaced sphere
as the scene subject.

Pattern 1 — Deferred execution: run expensive scene setup on the next idle tick
  so the operator or script that kicked it returns immediately without freezing the UI.

Pattern 2 — Throttled live-reload: poll an external JSON param file every POLL_INTERVAL
  seconds; when its mtime changes, push the new amplitude value into the GN modifier
  without rebuilding the whole node tree. Enables a live-coding loop from any editor.

Pattern 3 — Headless frame stepper: advance the timeline frame-by-frame from a timer,
  saving a render per frame, then stop. Useful when you need per-frame processing
  (export, screenshot, custom file write) that bpy.ops.render.render() batch-mode
  cannot provide.
"""

import bpy
import os
import json
import math

# ── Named constants ─────────────────────────────────────────────────────────────
SCENE_NAME        = "timers_demo"
OBJ_NAME          = "noise_sphere"
MOD_NAME          = "GN_Displace"
PARAM_FILE        = os.path.join(os.path.dirname(__file__), "live_params.json")
POLL_INTERVAL     = 0.5   # seconds between mtime checks
FRAME_STEP_DELAY  = 1/30  # 30 fps simulated playback
FRAME_START       = 1
FRAME_END         = 60
OUTPUT_DIR        = os.path.join(os.path.dirname(__file__), "output")

# Mutable state shared between timer callbacks — module-level avoids closure
# re-binding issues when Blender reloads the script.
_live_mtime: float = 0.0
_frame_current: int = FRAME_START


# ── Scene setup (called by the deferred-execution timer) ────────────────────────
def _build_scene() -> None:
    """Create the GN-displaced sphere. Called once on the next idle tick."""
    scene = bpy.data.scenes.get(SCENE_NAME) or bpy.data.scenes.new(SCENE_NAME)
    bpy.context.window.scene = scene

    # Remove stale object from previous runs
    old = bpy.data.objects.get(OBJ_NAME)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.0)
    sphere = bpy.context.active_object
    sphere.name = OBJ_NAME

    _attach_gn_displace(sphere)


def _attach_gn_displace(obj: bpy.types.Object) -> None:
    """Build a minimal GN tree: Set Position with noise displacement."""
    mod = obj.modifiers.new(MOD_NAME, "NODES")
    tree = bpy.data.node_groups.new(f"{MOD_NAME}_tree", "GeometryNodeTree")
    mod.node_group = tree

    # Interface sockets — amplitude exposed as a modifier input
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    amp_sock = tree.interface.new_socket(
        "Amplitude", in_out="INPUT", socket_type="NodeSocketFloat"
    )
    amp_sock.default_value = 0.4
    amp_sock.min_value = 0.0
    amp_sock.max_value = 2.0

    nodes = tree.nodes
    links = tree.links

    inp   = nodes.new("NodeGroupInput")
    out   = nodes.new("NodeGroupOutput")
    pos   = nodes.new("GeometryNodeInputPosition")
    noise = nodes.new("ShaderNodeTexNoise")
    scale = nodes.new("ShaderNodeMath")
    set_p = nodes.new("GeometryNodeSetPosition")

    noise.inputs["Scale"].default_value   = 3.0
    noise.inputs["Detail"].default_value  = 8.0
    noise.inputs["Roughness"].default_value = 0.6
    scale.operation = "MULTIPLY"

    links.new(inp.outputs["Geometry"],  set_p.inputs["Geometry"])
    links.new(pos.outputs["Position"],  noise.inputs["Vector"])
    links.new(noise.outputs["Fac"],     scale.inputs[0])
    links.new(inp.outputs["Amplitude"], scale.inputs[1])
    links.new(scale.outputs["Value"],   set_p.inputs["Offset"])
    links.new(set_p.outputs["Geometry"], out.inputs["Geometry"])

    _auto_layout(nodes)


def _auto_layout(nodes: bpy.types.Nodes) -> None:
    """Space nodes left-to-right to avoid overlap — cosmetic only."""
    x = -600
    for node in nodes:
        node.location.x = x
        x += 220


# ── Pattern 1: Deferred execution ───────────────────────────────────────────────
def timer_deferred_setup() -> None:
    """
    Register scene build on the next idle tick.

    Why not call _build_scene() directly?  When an operator runs, Blender's
    undo stack is mid-push and certain depsgraph paths are locked.  Deferring
    by even 0.0 s guarantees the operator's own undo step is closed before
    any new data is written — preventing corrupted undo history.
    """
    if bpy.app.timers.is_registered(_build_scene):
        return
    bpy.app.timers.register(_build_scene, first_interval=0.0)
    print("[timers] deferred scene build scheduled")


# ── Pattern 2: Throttled live-reload ────────────────────────────────────────────
def _live_reload_tick() -> float | None:
    """
    Scheduled timer callback.  Checks mtime of PARAM_FILE each call.
    Returns POLL_INTERVAL to reschedule, or None to stop.
    """
    global _live_mtime

    if not os.path.exists(PARAM_FILE):
        # Write default params so the user has a file to edit
        _write_default_params()

    try:
        mtime = os.path.getmtime(PARAM_FILE)
    except OSError:
        return POLL_INTERVAL

    if mtime == _live_mtime:
        return POLL_INTERVAL  # nothing changed

    _live_mtime = mtime
    _apply_params_from_file()
    return POLL_INTERVAL


def _write_default_params() -> None:
    with open(PARAM_FILE, "w") as f:
        json.dump({"amplitude": 0.4, "noise_scale": 3.0}, f, indent=2)


def _apply_params_from_file() -> None:
    try:
        with open(PARAM_FILE) as f:
            params = json.load(f)
    except (json.JSONDecodeError, OSError):
        return

    obj = bpy.data.objects.get(OBJ_NAME)
    if not obj:
        return
    mod = obj.modifiers.get(MOD_NAME)
    if not mod or not mod.node_group:
        return

    # Walk the interface to find the Amplitude socket identifier
    for item in mod.node_group.interface.items_tree:
        if item.name == "Amplitude" and item.in_out == "INPUT":
            mod[item.identifier] = float(params.get("amplitude", 0.4))
        if item.name == "Noise Scale":
            mod[item.identifier] = float(params.get("noise_scale", 3.0))

    # Force depsgraph update — required for the viewport to reflect changes
    # without waiting for the next interactive event.
    obj.update_tag()
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()
    print(f"[timers] live-reload: amplitude={params.get('amplitude')}")


def timer_live_reload_start() -> None:
    """Begin polling PARAM_FILE. Idempotent."""
    if bpy.app.timers.is_registered(_live_reload_tick):
        print("[timers] live-reload already running")
        return
    # persistent=True survives file loads; useful if the .blend is re-opened
    # during a long live-coding session.
    bpy.app.timers.register(_live_reload_tick, first_interval=POLL_INTERVAL, persistent=True)
    print(f"[timers] live-reload started — edit {PARAM_FILE}")


def timer_live_reload_stop() -> None:
    if bpy.app.timers.is_registered(_live_reload_tick):
        bpy.app.timers.unregister(_live_reload_tick)
        print("[timers] live-reload stopped")


# ── Pattern 3: Headless frame stepper ───────────────────────────────────────────
def _frame_step() -> float | None:
    """
    Advance one frame, save a screenshot, repeat until FRAME_END.
    Returns FRAME_STEP_DELAY to reschedule, or None when done.
    """
    global _frame_current
    scene = bpy.context.scene

    if _frame_current > FRAME_END:
        print(f"[timers] frame stepper done — {FRAME_END - FRAME_START + 1} frames")
        _frame_current = FRAME_START  # reset for re-use
        return None

    scene.frame_set(_frame_current)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, f"frame_{_frame_current:04d}.png")

    # opengl screenshot captures exactly what the viewport shows — faster than
    # bpy.ops.render.render() because it skips lighting recalculation.
    bpy.ops.screen.screenshot_area(filepath=out_path)
    print(f"[timers] frame {_frame_current}/{FRAME_END} → {out_path}")

    _frame_current += 1
    return FRAME_STEP_DELAY


def timer_frame_stepper_start() -> None:
    """Begin frame-by-frame advance. Idempotent."""
    global _frame_current
    if bpy.app.timers.is_registered(_frame_step):
        print("[timers] frame stepper already running")
        return
    _frame_current = FRAME_START
    bpy.context.scene.frame_set(FRAME_START)
    bpy.app.timers.register(_frame_step, first_interval=0.0)
    print(f"[timers] frame stepper started ({FRAME_START}–{FRAME_END})")


# ── Entry point ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Step 1 — build the scene on the next idle tick (deferred exec)
    timer_deferred_setup()

    # Step 2 — start the live-reload loop (edit live_params.json to see changes)
    timer_live_reload_start()

    # Step 3 — uncomment to run the frame stepper after the scene builds:
    # bpy.app.timers.register(timer_frame_stepper_start, first_interval=1.0)

    print("[timers] blueprint loaded — three timer patterns active")
