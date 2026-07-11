# Screen Recording Notes — bpy.app.handlers Persistent Event Hooks

**Target**: `public/library/videos/scripting/python-bpy-app-handlers-persistent-event-hooks-webxr/screen.mp4`

## OBS Settings

- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF
- **Output codec**: H264 · CRF 18

## Recording Flow (≈ 90 seconds)

1. Open Blender 5.1 · switch to **Scripting** workspace
2. Open `blueprint.py` in the Text Editor
3. **Alt + P** (Run Script) — System Console shows `[holoflow] handlers registered`
4. Switch to **Timeline** — press **Spacebar** to play animation
5. Open a terminal beside Blender and `tail -f vat_samples.json` — show it updating every 4 frames
6. Pause playback (Spacebar again)
7. Switch to **Properties → Object Data (light icon)** for `HF_Key`
8. Drag **Energy** slider from 800 W to 1200 W — show `light_rig.json` updating in the terminal immediately
9. Change `HF_Fill` colour → confirm `light_rig.json` updates with new hex colour
10. Press **Ctrl + S** to save the .blend — Console shows `[holoflow] GLB → …`
11. Open **File Browser** → navigate to `public/library/glbs/scripting/handlers-demo/` → confirm `handlers_demo.glb` exists with a current timestamp
12. **Close and reopen** the saved .blend — Console shows `[holoflow] load_post: handlers re-registered`
13. Move the timeline scrubber → confirm `vat_samples.json` still updates (handler survived file open)

## Cut Points

| Time | Action |
|------|--------|
| 00:00 | Script run + console output |
| 00:18 | Timeline playback → VAT JSON growing |
| 00:40 | Light energy drag → live JSON diff |
| 01:00 | Ctrl+S → GLB export + File Browser confirmation |
| 01:20 | Close/reopen + timeline scrub proving @persistent |

## Editing Notes

- Crop to 1680 × 945 to exclude second monitor if present
- Add lower-third text: "bpy.app.handlers · Blender 5.1 · holoflow.co.uk"
- Export at 30fps H264 for YouTube/Vimeo; 60fps not needed (no fast motion)
