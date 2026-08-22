import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.app.timers</code> schedules Python callables to fire on
        Blender&apos;s main thread after a specified delay. The callable returns{" "}
        <code>None</code> to unregister itself, or a <code>float</code> to
        reschedule after that many seconds. Every call lands on the main thread,
        so the full <code>bpy</code> API is safe — unlike{" "}
        <code>threading.Thread</code>, which must never touch <code>bpy</code>{" "}
        directly without a deferred hand-off. Three production patterns are
        covered: deferred execution (avoid operator-phase lockup), throttled
        live-reload (push parameter file changes into a modifier without
        reloading the script), and headless frame stepping (per-frame custom
        export or screenshot).
      </p>

      <h2>Why defer at all?</h2>
      <p>
        When a Blender operator runs, the undo stack is mid-push and certain
        depsgraph paths are read-locked. Calling a heavy setup function directly
        from <code>execute()</code> risks writing data during that window, which
        corrupts the undo history in subtle ways — the viewport refreshes but{" "}
        <kbd>Ctrl+Z</kbd> jumps two steps instead of one. Registering a timer
        with <code>first_interval=0.0</code> defers the work by exactly one
        main-loop tick, after the undo entry is closed, at zero perceptible lag.
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          temp_override pipeline tutorial
        </Link>{" "}
        for the related problem of edit-mode operators failing their{" "}
        <code>poll()</code> check outside a VIEW_3D context.
      </p>

      <h2>Pattern 1 — Deferred execution</h2>
      <pre>{`def _build_scene() -> None:
    ...           # heavy setup here
    return None   # return None = unregister after one call

# In the operator's execute() or at script top-level:
bpy.app.timers.register(_build_scene, first_interval=0.0)`}</pre>
      <p>
        <code>is_registered(func)</code> is an idempotency guard — call it
        before re-registering from an operator that the user might click twice.
        Note that <code>func</code> identity is checked by reference, so every
        anonymous <code>lambda</code> is unique; always name your callbacks.
      </p>

      <h2>Pattern 2 — Throttled live-reload</h2>
      <p>
        A persistent timer polls the mtime of an external JSON file. When the
        file changes, new amplitude and noise-scale values are pushed directly
        into the GN modifier via its socket identifier — without rebuilding the
        node tree. This gives a sub-second feedback loop while editing parameters
        in any external editor. The technique is a safe alternative to Blender&apos;s
        built-in Auto Refresh, which re-imports the whole script on every save
        and loses Python state.
      </p>
      <pre>{`_live_mtime: float = 0.0

def _live_reload_tick() -> float | None:
    global _live_mtime
    try:
        mtime = os.path.getmtime(PARAM_FILE)
    except OSError:
        return POLL_INTERVAL
    if mtime != _live_mtime:
        _live_mtime = mtime
        _apply_params_from_file()
    return POLL_INTERVAL   # reschedule

bpy.app.timers.register(
    _live_reload_tick,
    first_interval=POLL_INTERVAL,
    persistent=True,        # survives file loads
)`}</pre>
      <p>
        The <code>persistent=True</code> flag keeps the timer alive when a new{" "}
        <code>.blend</code> opens — important for a live-coding session where
        you reload the working file repeatedly. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-msgbus-reactive-property-subscriptions"
          className={lk}
        >
          msgbus reactive subscription tutorial
        </Link>
        , which watches internal <em>Blender properties</em> rather than
        external files; the two patterns are complementary — msgbus for in-scene
        property changes, timers for external data sources.
      </p>

      <h2>Pushing values into a GN modifier</h2>
      <p>
        Modifier socket values are keyed by the socket&apos;s <em>identifier</em>,
        not its display name. The identifier is generated at socket creation time
        and is stable across renames — find it by iterating{" "}
        <code>mod.node_group.interface.items_tree</code>:
      </p>
      <pre>{`for item in mod.node_group.interface.items_tree:
    if item.name == "Amplitude" and item.in_out == "INPUT":
        mod[item.identifier] = new_value
        break

obj.update_tag()  # mandatory — tells the depsgraph the modifier is dirty`}</pre>
      <p>
        Forgetting <code>update_tag()</code> is the number-one silent bug here:
        the Python value is written but the viewport does not redraw until the
        next interactive event. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
          className={lk}
        >
          depsgraph object instances tutorial
        </Link>{" "}
        explains how the depsgraph cache tracks dirty flags in more detail.
      </p>

      <h2>Pattern 3 — Headless frame stepper</h2>
      <p>
        <code>bpy.ops.render.render(animation=True)</code> blocks the main loop
        until all frames complete — no Python code runs in between. If you need
        per-frame processing (custom GLB export, attribute snapshot, screenshot),
        use a frame-stepping timer instead:
      </p>
      <pre>{`_frame: int = 1

def _step() -> float | None:
    if _frame > FRAME_END:
        return None
    bpy.context.scene.frame_set(_frame)
    bpy.ops.screen.screenshot_area(filepath=f"out/frame_{_frame:04d}.png")
    globals()["_frame"] += 1
    return FRAME_STEP_DELAY`}</pre>
      <p>
        <code>bpy.ops.screen.screenshot_area()</code> captures the active
        viewport without a full Cycles/EEVEE render pass — useful for quick
        previews at 30 fps equivalent. For production frames, replace it with a
        Python-driven file write or the approach from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          app handler frame-change tutorial
        </Link>
        , which hooks <code>bpy.app.handlers.frame_change_post</code> to run
        logic at render-time rather than viewport-time.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Timer fires once then vanishes.</strong> The callback returned{" "}
          <code>None</code> by accident (missing <code>return INTERVAL</code>
          at the end of a branch). Every code path in a recurring timer must
          return a float.
        </li>
        <li>
          <strong>Timer suspended during modal operators.</strong> While a modal
          operator is active (G-grab, loop-cut, sculpt stroke), the timer queue
          pauses. Timers resume when the modal exits — this is expected behaviour,
          not a bug.
        </li>
        <li>
          <strong>File-load wipes non-persistent timers.</strong> Re-register
          in a <code>bpy.app.handlers.load_post</code> handler, or use{" "}
          <code>persistent=True</code> for timers that must survive across file
          loads.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation — <em>bpy.app.timers module reference</em> — CC-BY-SA 4.0{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.app.timers.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org/api/current/bpy.app.timers.html
          </a>
          {" "}— Related project: blender/blender (GPL-2.0-or-later)
        </li>
        <li>
          Robert Guetzkow — <em>blender-python-examples</em> — MIT{" "}
          <a
            href="https://github.com/robertguetzkow/blender-python-examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/robertguetzkow/blender-python-examples
          </a>
          {" "}— Sibling resources: operator, panel, preferences, and property group
          examples in the same repository.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-app-timers-deferred-live-reload-frame-stepper",
  title:
    "Python bpy.app.timers — Deferred Execution, Throttled Live Reloader & Frame Stepper (Blender 5.1)",
  date: "2026-06-29",
  kind: "tutorial",
  excerpt:
    "bpy.app.timers schedules Python callables on Blender's main thread after a specified delay. Three production patterns: deferred scene setup to avoid operator-phase lockup, a throttled live-reload that pushes external JSON parameters into a GN modifier without reloading the script, and a headless frame stepper for per-frame custom export.",
  tags: [
    "blender",
    "python",
    "scripting",
    "timers",
    "live-reload",
    "frame-stepper",
    "geometry-nodes",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-app-timers-deferred-live-reload-frame-stepper",
    time: "one to two hours",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts from the Scripting workspace",
      "Understands bpy.app.handlers (see app-handler frame-change tutorial)",
      "Familiar with Python context managers and module-level mutable state",
    ],
  },
  base,
);
