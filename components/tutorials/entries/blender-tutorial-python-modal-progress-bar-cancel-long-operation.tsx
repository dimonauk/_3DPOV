import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender is single-threaded from Python&rsquo;s perspective. A tight
        <code>for</code> loop over hundreds of mesh objects blocks the entire
        UI until it completes — the viewport freezes, the cursor stalls, and
        there is no way for the user to stop the operation short of killing
        the process. The correct architecture is a{" "}
        <strong>modal TIMER operator</strong>: the operator processes a fixed
        chunk of work on each timer tick, calls{" "}
        <code>wm.progress_update()</code>, then returns{" "}
        <code>&#123;&quot;PASS_THROUGH&quot;&#125;</code> — yielding back to
        the event loop so the header progress bar redraws and ESC can be caught
        on the very next tick. The same pattern drives Blender&rsquo;s own
        built-in bake queue and the auto-save system.
      </p>

      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modal-operator-vertex-colour-painter"
          className={lk}
        >
          Modal Operator — Vertex Colour Painter
        </Link>{" "}
        tutorial, which uses a modal loop driven by <code>MOUSEMOVE</code>{" "}
        events for interactive, user-directed input. The TIMER pattern here
        is orthogonal: the operator does not wait for user gestures; instead
        it self-drives through a work list and simply keeps the user informed.
        The lifecycle is identical — <code>invoke()</code> registers the modal
        handler, <code>modal()</code> dispatches events, <code>cancel()</code>{" "}
        cleans up — but the event type that keeps the operator alive is{" "}
        <code>TIMER</code> rather than continuous pointer input.
      </p>

      <p>
        The <code>WindowManager.progress_*</code> trio is the simplest
        feedback API in Blender. <code>wm.progress_begin(min, max)</code>{" "}
        opens a thin progress bar across the bottom of the application header;
        <code>wm.progress_update(value)</code> moves it to{" "}
        <code>(value&nbsp;−&nbsp;min)&nbsp;/&nbsp;(max&nbsp;−&nbsp;min)</code>;
        <code>wm.progress_end()</code> removes it. All three calls are
        lightweight Python-to-C bridges; they do not trigger a full redraw
        themselves. The bar redraws when the event loop returns — which is why
        the tick handler must return <code>PASS_THROUGH</code> rather than
        looping internally until all work is done.
      </p>

      <p>
        The threading trap deserves explicit attention. Python&rsquo;s GIL
        does not protect Blender&rsquo;s C internals. The depsgraph evaluation
        graph, modifier stack, and mesh data can be mutated mid-frame by
        Blender&rsquo;s own evaluation loop; concurrent Python +{" "}
        <code>bpy</code> access produces silent data corruption or hard
        crashes — not clean race conditions that Python&rsquo;s{" "}
        <code>threading</code> module could catch. The cooperative TIMER model
        avoids the problem entirely: there is one thread, and it yields back
        after every chunk. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-timers-deferred-live-reload-frame-stepper"
          className={lk}
        >
          bpy.app.timers tutorial
        </Link>{" "}
        covers the related pattern for deferred one-shot callbacks, which are
        appropriate for post-frame hooks but lack the cancel and progress
        machinery a long batch operation needs.
      </p>

      <p>
        The batch step itself — applying a Triangulate modifier — deliberately
        avoids <code>bpy.ops.object.modifier_apply</code>. That operator
        requires the target object to be active and selected, and it requires a
        <code>VIEW_3D</code> context. Inside a TIMER handler neither is
        guaranteed. The direct-API path — <code>evaluated_get(depsgraph)</code>{" "}
        → <code>new_from_object()</code> → swap <code>obj.data</code> → remove
        the modifier — works from any context and is what the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          Context Temp Override — Mesh Repair Pipeline
        </Link>{" "}
        uses for the same reason: operators that constrain their context should
        be replaced with data-API equivalents wherever possible.
      </p>

      <p>
        The cancel path is where most operators break. Every exit route —
        <code>_finish()</code>, <code>cancel()</code>, and any exception handler
        — must call <code>_cleanup()</code>, which removes the timer handle
        and calls <code>wm.progress_end()</code>. A missed cleanup leaves an
        orphaned TIMER firing indefinitely, or a stuck progress bar that never
        closes. The pattern here mirrors the defensive cleanup in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue"
          className={lk}
        >
          Export Queue UIList
        </Link>{" "}
        — explicit teardown in a single <code>_cleanup()</code> method called
        on all paths, not duplicated inline.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-modal-progress-bar-cancel-long-operation",
  title:
    "Python wm.progress_begin/end + Modal TIMER — Cancellable Batch Progress Bar (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Build a cooperative TIMER-driven modal operator that processes scene objects in chunks, shows a live header progress bar, and cancels cleanly on ESC — without blocking the UI or touching threading.Thread.",
  tags: ["blender", "python", "bpy", "modal", "operator", "progress", "batch", "timer", "5.1"],
};

export const entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: ["Blender Text Editor", "OBS Studio (for screen.mp4)"],
    },
    prerequisites: [
      "Comfortable with bpy.types.Operator and bpy.props",
      "Has written a one-shot operator before (bpy.ops.* call pattern)",
      "Understands Python classes and instance variables",
    ],
    steps: [
      {
        title: "Open the progress bar with progress_begin()",
        body: `Call wm.progress_begin(min, max) inside invoke() immediately before adding the modal handler:

  def invoke(self, context, event):
      self._targets = _collect_targets(context)
      self._total   = len(self._targets)
      self._index   = 0
      wm = context.window_manager
      wm.progress_begin(0, self._total)   # opens the header bar
      self._timer = wm.event_timer_add(TIMER_SECS, window=context.window)
      wm.modal_handler_add(self)
      return {'RUNNING_MODAL'}

The bar appears as soon as invoke() returns. min and max are arbitrary numbers — (0, total) is clearest. event_timer_add() schedules a TIMER event every TIMER_SECS seconds; without it the operator would wait forever for the next user event.`,
      },
      {
        title: "Process one chunk per TIMER tick",
        body: `In modal(), dispatch only TIMER events to the work function. Pass everything else through:

  def modal(self, context, event):
      if event.type == 'TIMER':
          return self._tick(context)
      if event.type in {'ESC', 'RIGHTMOUSE'} and event.value == 'PRESS':
          return self.cancel(context)
      return {'PASS_THROUGH'}

Inside _tick(), loop CHUNK_SIZE times, call wm.progress_update(self._index) after each item, then tag_redraw() a VIEW_3D area so the header repaints. Return {'RUNNING_MODAL'} to keep the operator alive for the next tick, or call _finish() when the work list is exhausted.`,
      },
      {
        title: "Apply the modifier via the depsgraph data API",
        body: `Avoid bpy.ops.object.modifier_apply inside a TIMER handler — it needs an active + selected object and a VIEW_3D context. Use the depsgraph path instead:

  mod = obj.modifiers.new(name=MOD_NAME, type='TRIANGULATE')
  depsgraph = context.evaluated_depsgraph_get()
  ob_eval   = obj.evaluated_get(depsgraph)
  new_mesh  = bpy.data.meshes.new_from_object(ob_eval, depsgraph=depsgraph)
  old_mesh  = obj.data
  obj.data  = new_mesh
  obj.modifiers.remove(mod)
  bpy.data.meshes.remove(old_mesh, do_unlink=True)

This pattern works from any context: no active object, no VIEW_3D area, no --foreground requirement. new_from_object() returns an evaluated mesh with all modifiers applied up to (and including) the target.`,
      },
      {
        title: "Clean up on every exit path",
        body: `Write a single _cleanup() method and call it from _finish(), cancel(), and any exception handler:

  def _cleanup(self, context):
      wm = context.window_manager
      if self._timer is not None:
          wm.event_timer_remove(self._timer)
          self._timer = None
      wm.progress_end()

Failing to call event_timer_remove() leaves an orphaned TIMER firing indefinitely after the operator exits — subsequent TIMER events hit dead code or raise a RuntimeError. Failing to call progress_end() leaves a frozen progress bar in the header. Both symptoms are difficult to debug mid-session because the next invocation appears to work but the UI is corrupted.`,
      },
      {
        title: "Tune CHUNK_SIZE and TIMER_SECS for your workload",
        body: `Two constants control the feel of the batch:

  CHUNK_SIZE = 3      # items per tick — higher = faster but choppier
  TIMER_SECS = 0.05   # seconds between ticks (~20 cooperative "fps")

A single TIMER tick processes CHUNK_SIZE items synchronously. If each item takes 100 ms (e.g. a Cycles bake), CHUNK_SIZE=1 gives a tick wall time of ~150 ms — still responsive. If each item takes 1 ms (mesh cleanup), CHUNK_SIZE=10 gives a 10 ms tick and a smooth progress bar. Profile the per-item cost once and set CHUNK_SIZE so total tick time stays under 150 ms.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Progress bar never appears / stays at 0 %",
        cause:
          "wm.progress_begin() was called but the event loop never got a TIMER event to trigger _tick() and call progress_update().",
        fix: "Confirm event_timer_add() was called before wm.modal_handler_add(). Check that TIMER_SECS > 0. If the operator returned CANCELLED from invoke() before the timer was added, the bar opens but no ticks fire — add the timer before any early-return path.",
      },
      {
        symptom: "Orphaned TIMER fires after the operator finishes",
        cause: "_cleanup() was not called on one of the exit paths — typically an unhandled exception inside _tick().",
        fix: "Wrap the _process_one() call in try/except and call _cleanup() in the except branch, or use try/finally in _tick() to ensure _finish() always runs. Confirm _timer is set to None after event_timer_remove() so a double-remove cannot happen.",
      },
      {
        symptom: "bpy.ops.object.modifier_apply raises 'context is incorrect'",
        cause: "The TIMER handler runs outside any VIEW_3D area context; the operator's poll() fails.",
        fix: "Replace with the depsgraph new_from_object() path shown in Step 3. If you must use an ops call, wrap it: with bpy.context.temp_override(window=bpy.context.window_manager.windows[0]): bpy.ops.object.modifier_apply(modifier=mod.name)",
      },
      {
        symptom: "ESC cancels but leaves meshes half-processed",
        cause: "Expected — cancel() stops at the current index. The processed objects keep their baked meshes; the rest are untouched.",
        fix: "This is correct behaviour. If you need atomic all-or-nothing semantics, collect all new meshes in a list during processing and only swap obj.data after the last tick completes. Use UNDO in bl_options so Ctrl-Z reverts the entire batch.",
      },
    ],
  },
  base,
);
