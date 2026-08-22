# Screen Recording Notes — SubsurfModifier Crease Tutorial

## Software
- OBS Studio (≥30.0) or Windows Game Bar (Win+G)

## Window source
Blender 5.1 — 3D Viewport maximised, theme: Blender Dark

## Resolution & frame rate
1920 × 1080 · 30 fps · audio disabled

## Output
`public/library/videos/scripting/python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr/screen.mp4`

## Shot list

| Timestamp | Action |
|-----------|--------|
| 0:00–0:10 | Open Blender, open Scripting workspace, paste blueprint.py |
| 0:10–0:25 | Run script — panel appears in 3D Viewport. Switch to Object Mode. |
| 0:25–0:45 | Properties panel → Modifier tab: show SubsurfModifier settings. Hover over Levels (viewport=1, render=2). |
| 0:45–1:10 | Switch to Edit Mode. Select all edges. Show Mesh → Edge Data panel. Zoom to show crease glow on boundary edges. |
| 1:10–1:30 | Back to Object Mode. Toggle Show Only Control Edges on/off to compare cage vs subdivided mesh. |
| 1:30–2:00 | Scripting workspace: show mark_crease_edges() function. Run `mesh.attributes["crease_edge"].data.foreach_set(...)` live. |
| 2:00–2:20 | Properties → Modifier: bump Viewport Level to 2. Watch smoothing increase while creased borders stay sharp. |
| 2:20–2:45 | Apply modifier. Verify mesh in Edit Mode: subdivided geometry baked in. |
| 2:45–3:00 | Run export call. Open file browser to confirm .glb exists. End recording. |

## OBS scene setup
1. Add Source → Window Capture → Blender
2. Set canvas to 1920×1080
3. Output → Recording → MKV (convert to MP4 after with: `ffmpeg -i screen.mkv -c copy screen.mp4`)
4. Hotkey: Ctrl+Alt+R to start/stop
