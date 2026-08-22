# bpy.app.timers — Deferred Execution, Live Reloader & Frame Stepper

**Blender 5.1 | CC0 1.0 | Topic: scripting**

`bpy.app.timers` schedules Python callables to run on Blender's main thread
after a specified delay. The callable returns `None` to cancel, or a `float`
to reschedule. Because every call is on the main thread, the entire `bpy` API
is safe — unlike `threading.Thread`, which must never touch `bpy` directly.

## Three patterns

| Pattern | What it does | When to use |
|---|---|---|
| Deferred execution | Run setup on next idle tick | Avoid UI lockup from operators |
| Throttled live-reload | Poll external file mtime, push new values | Live-coding material/GN params |
| Frame stepper | Advance timeline 1 frame per tick | Per-frame processing / export |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | All three patterns on a Noise-displaced sphere |
| `record.py` | Renders `viewport.mp4` (amplitude ramp animation) |
| `live_params.json` | Written by blueprint on first run; edit to trigger live-reload |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen capture |
| `.expected-artefacts.json` | CI manifest |

## Quick start

1. Open `blueprint.py` in Blender's **Text Editor** (Scripting workspace).
2. Press **Run Script** (`Alt + P`). The sphere appears on the next idle tick.
3. Edit `live_params.json` — change `"amplitude"` to any value between 0 and 2.
   Save the file. The sphere updates within 0.5 s without reloading the script.
4. To run the frame stepper: uncomment the last line in the `__main__` block and
   re-run the script. PNG frames save to `output/`.

## Key API

```python
bpy.app.timers.register(func, first_interval=0.0, persistent=False)
bpy.app.timers.unregister(func)
bpy.app.timers.is_registered(func)
```

`persistent=True` survives file loads. Omit it for timers that should
stop when a new `.blend` opens.

## Failure modes

- **Timer not firing**: Blender must be in an idle state (not mid-render, not
  in modal operator). If `bpy.ops.render.render()` is blocking, the timer queue
  is suspended until it completes.
- **Return value forgotten**: Forgetting `return INTERVAL` (returning `None`
  by accident) unregisters the timer silently.
- **File-load wipes timers**: Without `persistent=True`, registering in
  `bpy.app.handlers.load_post` is the correct re-registration point.

## Outside sources

- Blender Python API — `bpy.app.timers` module reference
  <https://docs.blender.org/api/current/bpy.app.timers.html>
  Licence: CC-BY-SA 4.0 — Blender Foundation
  Related: blender/blender (GPL-2.0-or-later)

- Robert Guetzkow — blender-python-examples (MIT)
  <https://github.com/robertguetzkow/blender-python-examples>
  Licence: MIT — Robert Guetzkow
  Sibling: same repo contains operator, UI panel, and preference examples.

## Tutorial

`/tutorials/blender-tutorial-python-app-timers-deferred-live-reload-frame-stepper`
