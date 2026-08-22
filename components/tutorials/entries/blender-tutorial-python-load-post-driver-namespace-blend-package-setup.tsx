import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonLoadPostDriverNamespaceBlendPackageSetupBody() {
  return (
    <>
      <p>
        A production <code>.blend</code> file can be made self-configuring:
        register Python handlers against Blender&apos;s lifecycle event lists
        and the file behaves correctly the moment an artist opens it — render
        settings snap to studio defaults, driver functions appear in the Graph
        Editor&apos;s namespace, and a pre-flight guard fires before every
        render to catch misconfigured scenes. No add-on installation, no manual
        setup steps. The mechanism is{" "}
        <code>bpy.app.handlers</code>, a module-level collection of plain Python
        lists, each tied to a Blender lifecycle event. This tutorial covers the
        three handlers most useful for package-level setup:{" "}
        <code>load_post</code> (file opened), <code>render_pre</code> (about to
        render), and <code>save_post</code> (file saved); and pairs them with{" "}
        <code>bpy.app.driver_namespace</code>, a dict that exposes Python
        callables inside FCurve driver expressions.
      </p>

      <p>
        The single most important concept is the{" "}
        <code>@bpy.app.handlers.persistent</code> decorator. Without it every
        handler is silently removed the moment any <code>.blend</code> is
        loaded — including re-opening the current file. The symptom is
        "works on first run, breaks after save-and-reopen," which is
        bewildering unless you know about this mechanism. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          frame_change_post handler tutorial
        </Link>
        , which covers the interactive-playback handler alongside the same
        <code>@persistent</code> requirement.
      </p>

      <p>
        <code>bpy.app.driver_namespace</code> is the bridge between Python
        scripting and the animation system. Any callable stored in that dict
        can be invoked by name inside any FCurve driver expression:{" "}
        <code>hs_breathe(frame, 0.04, 30.0)</code> in the driver field calls
        the registered Python function with the current frame as the first
        argument. The critical constraint is that{" "}
        <strong>these functions must be pure maths only</strong> — no{" "}
        <code>bpy</code> lookups, no I/O — because the depsgraph calls them
        once per evaluation, which may happen many times per second during
        interactive playback. The safest way to guarantee they survive a file
        open is to re-register them inside a persistent{" "}
        <code>load_post</code> handler, so they are always present regardless
        of which file an artist opens. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation drivers and parametric shader tutorial
        </Link>{" "}
        for the shader-side of FCurve-driven control.
      </p>

      <p>
        The <code>render_pre</code> handler is the correct location for a
        production pre-flight check: it fires before every frame of every
        render triggered by F12, <code>bpy.ops.render.render()</code>, or the
        CLI <code>-f</code> flag. Raising a <code>RuntimeError</code> from
        inside the handler aborts the render with a clear message, preventing
        wasted time on a 4-hour render job that would have produced noise
        (too few EEVEE samples) or written to the wrong path. This pattern
        does not require the add-on infrastructure explained in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar"
          className={lk}
        >
          custom panel and operator tutorial
        </Link>
        ; it is lighter-weight because the guard lives entirely in the{" "}
        <code>.blend</code> file itself.
      </p>

      <p>
        Outside references:{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.app.handlers.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.app.handlers — Blender Python API Reference (CC0, © Blender
          Foundation)
        </a>
        ; sibling projects:{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org/blender/blender
        </a>{" "}
        and the{" "}
        <a
          href="https://projects.blender.org/blender/blender-manual"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual
        </a>
        .{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.app.html#bpy.app.driver_namespace"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.app.driver_namespace — Application Data (CC0, © Blender
          Foundation)
        </a>
        .
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-load-post-driver-namespace-blend-package-setup",
  title:
    "Python: bpy.app.handlers.load_post + bpy.app.driver_namespace — Self-Configuring .blend Package (Blender 5.1)",
  date: "2026-07-07",
  kind: "tutorial" as const,
  excerpt:
    "Build a production .blend that configures itself on open: a @persistent load_post handler auto-sets EEVEE samples and re-populates bpy.app.driver_namespace with hs_breathe, hs_blink, and hs_orbit; a render_pre guard raises RuntimeError on misconfigured scenes; a save_post handler increments a version counter. Expert coverage of @persistent, the driver_namespace pure-math constraint, duplicate-registration guards, and why driver functions must live inside load_post to survive file opens.",
  tags: [
    "blender",
    "scripting",
    "python",
    "handlers",
    "driver",
    "animation",
    "bpy",
    "pipeline",
  ],
  Body: PythonLoadPostDriverNamespaceBlendPackageSetupBody,
};

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title:
          "Three handler lists: load_post, render_pre, save_post",
        body: `bpy.app.handlers is a module of plain Python lists. Append a callable and Blender calls it at the matching lifecycle event.

  load_post   — fires after every .blend completes loading (open, revert, File > New)
                signature: fn(filepath: str, *args)
  render_pre  — fires before every render frame (F12, bpy.ops.render.render, CLI -f)
                signature: fn(scene: bpy.types.Scene, *args)
  save_post   — fires after each successful save
                signature: fn(filepath: str, *args)

CRITICAL: @bpy.app.handlers.persistent
Without this decorator, Blender silently removes the handler the moment any .blend
is loaded — including saving the current file and reopening it. The decorator marks
the function in an internal registry that survives file operations.

  import bpy

  @bpy.app.handlers.persistent
  def holoflow_load_post(filepath: str, *args) -> None:
      ...   # runs after every file open

  bpy.app.handlers.load_post.append(holoflow_load_post)

Duplicate-registration guard — run this before every append. Handlers are a list;
the same function appended twice fires twice per event.

  def _already_registered(handler_list, fn) -> bool:
      return any(h is fn for h in handler_list)   # identity, not name

  if not _already_registered(bpy.app.handlers.load_post, holoflow_load_post):
      bpy.app.handlers.load_post.append(holoflow_load_post)

WHY identity rather than __name__: each time the Scripting workspace re-executes
a script the function is a new object in memory. Identity comparison fails to find
the old registration when the function was recreated — so use __name__ for cleanup
of stale registrations (where you don't hold the original reference), and identity
for guard-before-append (where you do).`,
      },
      {
        title:
          "bpy.app.driver_namespace — custom pure-math driver functions",
        body: `bpy.app.driver_namespace is a plain Python dict. Register any callable and it
becomes available by name inside every FCurve driver expression.

  def hs_breathe(frame: float, amp: float = 0.05, freq: float = 30.0) -> float:
      import math
      return 1.0 + amp * math.sin(2.0 * math.pi * frame / freq)

  bpy.app.driver_namespace["hs_breathe"] = hs_breathe

Driver expression in the Graph Editor:
  hs_breathe(frame, 0.04, 30.0)

The built-in 'frame' variable in a driver expression equals the evaluated frame.
No Variable entries are required when using only frame.

HARD CONSTRAINT: driver functions must be pure maths — no bpy.data lookups,
no scene queries, no I/O. The depsgraph evaluates drivers once per dependency
update, which happens many times per second during interactive playback. A single
bpy.data.objects["MyObj"].location call adds 50–200 µs per evaluation: at 60 fps
with 5 driven channels that is 10+ ms stolen from the 16 ms frame budget.

driver_namespace does NOT persist across file loads. After bpy.ops.wm.open_mainfile()
the dict is reset. The correct fix: register functions inside a persistent load_post
handler so they are always re-populated immediately after any .blend opens.

  @bpy.app.handlers.persistent
  def holoflow_load_post(filepath, *args):
      ns = bpy.app.driver_namespace
      ns["hs_breathe"] = hs_breathe
      ns["hs_blink"]   = hs_blink
      ns["hs_orbit"]   = hs_orbit

  bpy.app.handlers.load_post.append(holoflow_load_post)

With this pattern the namespace is populated before any driver is evaluated after
a file open — the crystal's Z-scale breathe animation works from the first frame.`,
      },
      {
        title:
          "render_pre as a production pre-flight guard",
        body: `render_pre is the correct location for render validation. Raising RuntimeError
from inside the handler aborts the render with the message in the Info header.

  @bpy.app.handlers.persistent
  def holoflow_render_pre(scene, *args) -> None:
      if scene is None:
          return

      if (scene.render.engine == "BLENDER_EEVEE_NEXT"
              and hasattr(scene, "eevee")):
          samp = scene.eevee.taa_render_samples
          if samp < 64:
              raise RuntimeError(
                  f"[Holoflow] EEVEE samples = {samp} < 64. "
                  "Increase before exporting to WebXR."
              )

      if not scene.render.filepath:
          raise RuntimeError(
              "[Holoflow] scene.render.filepath is empty. "
              "Set output path before rendering."
          )

Raising RuntimeError inside render_pre is the documented mechanism for aborting
a render: Blender catches it, displays it in the Info header, and stops the render
loop. An unhandled exception would crash the render in an unpredictable state.

render_pre fires for every frame in an animation render, not just the first.
The check should be idempotent and cheap (< 1 ms): property reads, comparisons,
no file I/O. If the guard needs to run only once, use a module-level flag:

  _render_guard_fired = False

  @bpy.app.handlers.persistent
  def holoflow_render_pre(scene, *args):
      global _render_guard_fired
      if _render_guard_fired:
          return
      _render_guard_fired = True
      ...   # expensive validation here`,
      },
      {
        title:
          "save_post — version counter via scene custom properties",
        body: `scene.get("key") and scene["key"] = value are the correct way to read and
write custom properties on a Blender data block from Python. Custom properties
are stored in the .blend file and survive save/load cycles.

  @bpy.app.handlers.persistent
  def holoflow_save_post(filepath: str, *args) -> None:
      scene = bpy.context.scene
      if scene is None:
          return
      count = scene.get("hs_save_count", 0) + 1
      scene["hs_save_count"]  = count
      scene["hs_last_saved"]  = filepath or "(unknown)"

Read them back in the Python Console:
  >>> bpy.context.scene["hs_save_count"]
  3
  >>> bpy.context.scene["hs_last_saved"]
  '/path/to/holoflow_package_demo.blend'

Custom properties can also be exposed in the UI via ID property UI descriptors
(bpy.ops.wm.properties_add), but for metadata stamping the plain dict interface
is simpler and always available without add-on registration.

WHY not use a TextBlock or a JSON sidecar for version metadata:
Custom scene properties travel with the .blend — no separate file to lose or
forget to commit. They are readable by any Python script, by add-ons via
scene.get(), and via the N-panel Custom Properties section without code.`,
      },
      {
        title:
          "Wiring the scene: driver on Z scale using hs_breathe",
        body: `After registering handlers and driver_namespace functions, building the demo
scene is straightforward:

  # Add a hexagonal crystal
  bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.3, depth=0.9)
  crystal = bpy.context.active_object

  # Add a driver on Z scale (index 2)
  crystal.driver_add("scale", 2)
  drv = crystal.animation_data.drivers[-1].driver
  drv.type       = "SCRIPTED"
  drv.expression = "hs_breathe(frame, 0.04, 30.0)"
  # No Variable entries needed — 'frame' is built-in to driver expressions

driver_add("scale", 2) targets the Z component. Index 0 = X, 1 = Y, 2 = Z.
Calling driver_add() on a property that already has a driver replaces it.

At this point the Z scale oscillates between 0.96 and 1.04 sinusoidally over
30 frames. The hs_breathe function is called by the depsgraph for every frame
step, including during viewport playback (Space) and during render
(bpy.ops.render.render).

Verify driver_namespace is populated from the Python Console:
  >>> "hs_breathe" in bpy.app.driver_namespace
  True
  >>> bpy.app.driver_namespace["hs_breathe"](1, 0.04, 30.0)
  1.008...`,
      },
      {
        title:
          "Saving and verifying the self-configuring package",
        body: `Save the .blend to embed the handlers:

  import os
  save_path = os.path.join(os.path.dirname(__file__),
                           "holoflow_package_demo.blend")
  bpy.ops.wm.save_as_mainfile(filepath=save_path, compress=True)

The handlers are stored in the .blend only if the Text block containing this
script is saved inside the file AND the script was run during the session.
They are NOT stored as binary data in the .blend — they are re-registered
from the Text block each time the file opens.

Full verification sequence after reopening holoflow_package_demo.blend:
  1. Python Console:
     >>> bpy.app.handlers.load_post
     [<function holoflow_load_post at 0x...>]   ← persistent decorator worked
     >>> bpy.app.driver_namespace.get("hs_breathe")
     <function hs_breathe at 0x...>              ← registered by load_post
     >>> bpy.context.scene.get("hs_package_version")
     '1.0.0'                                     ← stamped by load_post
  2. Press F12 with eevee.taa_render_samples < 64 → Info header shows
     "[Holoflow] EEVEE samples = N < 64." and the render stops.
  3. Press Ctrl+S → Python Console:
     >>> bpy.context.scene["hs_save_count"]
     1                                            ← incremented by save_post

To unregister everything cleanly (for add-on teardown or test isolation):
  for fn in (holoflow_load_post, holoflow_render_pre, holoflow_save_post):
      for lst in (bpy.app.handlers.load_post,
                  bpy.app.handlers.render_pre,
                  bpy.app.handlers.save_post):
          try: lst.remove(fn)
          except ValueError: pass
  for key in ("hs_breathe", "hs_blink", "hs_orbit"):
      bpy.app.driver_namespace.pop(key, None)`,
      },
    ],
    finalResult:
      "A self-configuring holoflow_package_demo.blend: @persistent load_post re-populates bpy.app.driver_namespace with hs_breathe / hs_blink / hs_orbit and stamps hs_package_version on the scene; render_pre aborts renders with EEVEE samples below 64 or an empty output path; save_post increments hs_save_count. A hexagonal crystal's Z scale is driven live by hs_breathe(frame, 0.04, 30.0).",
    variations: [
      "depsgraph_update_post as a broader change listener: use bpy.app.handlers.depsgraph_update_post to react to any scene-graph change — object transforms, material edits, constraint updates. Guard with a frame-check to avoid firing on every property edit in the Properties panel.",
      "Namespace hot-reload for iterative development: during scripting, bpy.app.driver_namespace can be updated in-place without reopening the file. Call bpy.app.driver_namespace['hs_breathe'] = new_fn in the console and all drivers pick up the new function immediately — no re-run of blueprint.py needed.",
      "Combining with bpy.app.timers for deferred setup: load_post fires synchronously before the viewport is fully initialised. If your setup requires viewport context (e.g. reading active area), defer it via bpy.app.timers.register(setup_fn, first_interval=0.1) inside load_post. See the app-timers deferred live-reload tutorial for the full pattern.",
      "Packaging as a Blender Extension: move the handler registration into an Extension's register() / unregister() functions (blender_manifest.toml, type='add-on'). The driver_namespace population still belongs in a @persistent load_post handler inside register(), so it fires for every file open, not just on extension enable.",
    ],
    troubleshooting: [
      {
        symptom:
          "hs_breathe not found in driver_namespace after file reopen",
        cause:
          "The @bpy.app.handlers.persistent decorator was omitted or load_post handler was not appended before saving. driver_namespace is reset on every file load; without a persistent load_post re-registering the functions, the namespace is empty after the file opens.",
        fix: "Verify: >>> 'holoflow_load_post' in [h.__name__ for h in bpy.app.handlers.load_post]. If absent, check that the Text block containing blueprint.py is saved inside the .blend (Text > Make Internal) and that the script was run at least once before saving the .blend.",
      },
      {
        symptom: "render_pre raises RuntimeError but render does not stop",
        cause:
          "render_pre was registered on bpy.app.handlers.render_complete or a different handler list. Or: the RuntimeError is raised but Blender's render operator catches and suppresses it in a non-interactive (headless) context.",
        fix: "Confirm the handler is in render_pre: >>> bpy.app.handlers.render_pre. In headless CLI renders, RuntimeError in render_pre aborts the frame but does not terminate Blender — the -x flag (exit on error) or a try/except in the calling script is needed for full abort behaviour.",
      },
      {
        symptom: "Handler fires twice per event (double increment of hs_save_count)",
        cause:
          "The registration script was run multiple times without the duplicate guard, or the @persistent handler survived a previous session and was re-appended on the next session.",
        fix: "Use the identity guard before every append: if not any(h is holoflow_save_post for h in bpy.app.handlers.save_post): bpy.app.handlers.save_post.append(holoflow_save_post). Print the list to audit: >>> [h.__name__ for h in bpy.app.handlers.save_post].",
      },
    ],
  },
  base
);
