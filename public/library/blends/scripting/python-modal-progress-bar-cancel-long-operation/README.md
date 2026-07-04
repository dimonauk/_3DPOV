# Python — Modal Progress Bar & Cancellable Batch Processor
**Blender 5.1 · bpy.types.WindowManager · Modal Operator · TIMER event**

## What this teaches

Blender is single-threaded from Python's perspective. A long-running
`for` loop over hundreds of objects blocks the entire UI. This blueprint
demonstrates the correct pattern: a **modal TIMER operator** that processes
work in fixed-size chunks, redraws the header progress bar after each chunk,
and allows the user to cancel cleanly with **ESC** or **RMB** at any tick
boundary.

## Key concepts

| Concept | Why it matters |
|---|---|
| `wm.progress_begin(min, max)` | Opens the Blender header progress widget |
| `wm.progress_update(value)` | Moves the bar; call once per chunk |
| `wm.progress_end()` | **Must** be called on every exit path |
| `wm.event_timer_add(secs, window)` | Fires `TIMER` events at the given interval |
| `wm.modal_handler_add(self)` | Routes events into `modal()` |
| Return `{'PASS_THROUGH'}` | Lets viewport orbit/pan work during the batch |
| Return `{'RUNNING_MODAL'}` | Keeps the operator alive between ticks |

## Why not `threading.Thread`?

Python's GIL does not protect Blender's C internals. Concurrent Python +
bpy access produces silent data corruption or hard crashes. Use cooperative
chunking instead: one thread, one slice per TIMER tick.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full operator + panel, ready to paste into the Text Editor |
| `record.py` | Creates the grid scene + renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |

## Running the blueprint

1. Open Blender 5.1 with a scene containing mesh objects.
2. Open a Text Editor area, paste `blueprint.py`, click **Run Script**.
3. Open the **N-panel** (N key) in any 3-D Viewport → **Holoflow** tab.
4. Click **Holoflow Batch with Progress Bar**.
5. Watch the header progress bar. Press ESC or RMB to cancel.

## Outside sources

- Blender Foundation — `bpy.types.WindowManager` API reference  
  CC-BY-SA 4.0 · <https://docs.blender.org/api/current/bpy.types.WindowManager.html>
- Robert Guetzkow — blender-python-examples  
  MIT Licence · <https://github.com/robertguetzkow/blender-python-examples>  
  Sibling org: <https://github.com/blender/blender> (GPL-v3, code not used)

## Tutorial link

<https://holoflow.co.uk/tutorials/blender-tutorial-python-modal-progress-bar-cancel-long-operation>
