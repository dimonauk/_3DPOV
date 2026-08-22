# Screen Recording Notes — bpy.app.timers Tutorial

**Target file:** `public/library/videos/scripting/python-app-timers-deferred-live-reload-frame-stepper/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic, no desktop audio) |
| Output format | MP4 (H.264) |
| Output path | `…/videos/scripting/python-app-timers-deferred-live-reload-frame-stepper/screen.mp4` |

## Recording Segments

### Segment 1 — Scripting Workspace Overview (0:00–0:20)
- Open Blender 5.1. Switch to the **Scripting** workspace.
- Show the Text Editor with `blueprint.py` loaded.
- Briefly scroll through the three pattern sections so the viewer can see the
  structure: deferred exec → live-reload → frame stepper.

### Segment 2 — Deferred Execution (0:20–0:50)
- Press **Alt+P** (Run Script) while the Text Editor is focused.
- Switch to the 3D Viewport. The UV sphere should appear within one frame.
- Open the **System Console** (Window → Toggle System Console on Windows;
  on macOS/Linux, launch Blender from terminal) to show the `[timers]` log line.

### Segment 3 — Live-Reload in Action (0:50–1:40)
- Split the editor: open a **Text Editor** on the left showing `live_params.json`.
- On the right, keep the 3D Viewport with the sphere visible.
- Change `"amplitude"` from `0.4` to `1.2` in the JSON, then **save the file**
  (`Ctrl+S` in your text editor — NOT in Blender's Text Editor, which saves into
  the .blend, not to disk).
- Show the sphere updating within 0.5 s.
- Change to `0.1`, save, show it flatten.
- Zoom the System Console to show the `[timers] live-reload: amplitude=…` lines.

### Segment 4 — Frame Stepper (1:40–2:10)
- Uncomment the last line in the `__main__` block:
  `bpy.app.timers.register(timer_frame_stepper_start, first_interval=1.0)`
- Re-run the script. Show the Timeline advancing frame by frame.
- Open the `output/` folder in a file manager alongside Blender and show PNGs
  appearing one by one.

### Segment 5 — Cleanup (2:10–2:20)
- Run `timer_live_reload_stop()` in the Python Console to demonstrate
  `bpy.app.timers.unregister()`.
- Confirm in the Console that the poll stops (no more log lines).

## Common Pitfalls to Show

- What happens if you forget `return POLL_INTERVAL` — the timer fires once and
  vanishes silently. Show by adding a one-shot version that returns `None`.
- What happens if Blender is mid-modal (e.g., G key drag active) — the timer
  queue pauses. Demonstrate by grabbing an object and editing the JSON; the
  update fires after you release the grab.

## Edit Notes

- Cut dead time between saves and sphere updates.
- Add a chapter marker at each segment boundary.
- Optional lower-thirds: `"deferred exec"`, `"live-reload"`, `"frame stepper"`.
- Final cut target: 2–3 minutes total.
