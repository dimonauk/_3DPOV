# Screen Recording Notes — bpy.types.RenderEngine WebXR Snapshot
**For: screen.mp4 capture · 1920×1080 · 30 fps · audio off**

## OBS / Game Bar setup
- Window Source: Blender 5.1 (windowed full-screen or maximised)
- Resolution: 1920 × 1080
- FPS: 30
- Audio: off (no microphone or desktop audio)
- Output format: MP4 / H.264

## Scene to record

1. Open Blender 5.1 → File > New > General
2. Open `blueprint.py` in the Scripting workspace → Run Script
3. Switch to the **3D Viewport** workspace
4. Open **Properties** panel (N) → Scene Properties (camera icon)
5. Expand **Render** tab — confirm engine shows **"Holoflow WebXR Snapshot"**

## Capture sequence (≈ 60–90 seconds)

| Segment | What to show |
|---|---|
| 0–10 s | Properties panel > Render tab — engine dropdown open, "Holoflow WebXR Snapshot" highlighted; close dropdown |
| 10–25 s | "WebXR Snapshot Settings" sub-panel — toggle Selection Only, change Draco level, show Output Subdirectory field |
| 25–40 s | Select both mesh objects in the viewport (A); confirm selection outlines |
| 40–55 s | Press **F12** — the Render window opens briefly, shows white 1×1 placeholder; watch the header bar change to "Holoflow Snapshot → …/webxr_export/Scene_snapshot.glb" |
| 55–70 s | Switch to the **System Console** (Window > Toggle System Console) — show the `[holoflow:snapshot] exported →` print line with the resolved path |
| 70–85 s | Open a File Browser (Shift+F1) or OS explorer — navigate to the output folder and show the generated .glb file present |

## Trim points
- Start: first frame after Blender window is focused
- End: GLB file visible in file browser

## File destination
`public/library/videos/scripting/python-bpy-render-engine-webxr-snapshot/screen.mp4`
