# SCREEN-RECORDING-NOTES — python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop

Target file: `public/library/videos/scripting/python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop/screen.mp4`

## Software

OBS Studio 30+ or Windows Game Bar (Win+G → Capture → Record).

## Window setup

1. Open Blender 5.1.
2. Open a new general workspace. Switch the Text Editor panel to a **Python Console** or load `blueprint.py` in the **Text Editor**.
3. Resize to **1920 × 1080**. Maximise or pin it so OBS captures cleanly.

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 / NVENC (your preference) |
| Audio | **Off** (no audio required for this recording) |
| Output | `screen.mp4` |

## Shot sequence

### Shot A — script walkthrough (≈ 90 s)
1. Open `blueprint.py` in the Blender Text Editor.
2. Scroll slowly from top to bottom, pausing at each `bmesh.ops.*` call for 3–4 seconds so the function name and arguments are readable.
3. Key sections to linger on:
   - `extrude_face_region` + filter `isinstance(e, bmesh.types.BMVert)` + `translate`
   - `inset_individual` with the `depth=` parameter comment
   - `bevel` with `segments=BEVEL_SEGS` and `loop_slide=True`
   - `create_circle` × 2, vert-set gathering loop, `bridge_loops`

### Shot B — panel build live-run (≈ 60 s)
1. Click **Run Script** (▶) on `blueprint.py`.
2. Watch the 3D Viewport — the panel, recess, bevel, and conduit tubes appear.
3. After the script finishes orbit the viewport manually: middle-mouse drag from front-left to front-right to show the bevel strips and conduit protrusions.

### Shot C — console inspection (≈ 30 s)
1. Open the Python Console panel.
2. Type and evaluate:
   ```
   ob = bpy.data.objects['scifi_panel_prop']
   print(len(ob.data.polygons))   # total face count
   print(ob.dimensions)           # confirm 2 × 0.1 × 1.2 m
   ```
3. Show the output values in console.

### Shot D — GLB confirmed (≈ 20 s)
1. Open the Blender File Browser and navigate to the blend's output folder.
2. Show `scifi_panel_prop.glb` file present.

## Edit notes

- Trim dead time between shots.
- Concatenate A → B → C → D into one `screen.mp4`.
- No title cards, no music needed — raw capture is the deliverable.

## Viewport render

Run `record.py` in the Text Editor after `blueprint.py` to produce the `viewport.mp4` camera-orbit render automatically.
