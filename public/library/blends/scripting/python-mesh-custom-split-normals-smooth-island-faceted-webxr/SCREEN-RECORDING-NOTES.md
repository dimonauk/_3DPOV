# Screen Recording Notes — Custom Split Normals

## Session goal
Capture a Blender 5.1 screen recording showing:
1. The script running in the Text Editor
2. The resulting icosphere with visible smooth-shaded islands vs hard boundaries
3. The GLB export dialogue completing

**Output file:** `public/library/videos/scripting/python-mesh-custom-split-normals-smooth-island-faceted-webxr/screen.mp4`

---

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

---

## Recording flow

1. Open Blender 5.1.  Close the splash screen.
2. Set workspace to **Scripting** layout.
3. Open `blueprint.py` in the Text Editor (or paste contents).
4. **Start recording.**
5. Press **Alt + P** (Run Script) in the Text Editor.
6. Wait for the script to finish — watch the Info bar for the `[holoflow] exported` message.
7. Switch to **Layout** workspace to show the gem in Material Preview.
   - Orbit around it slowly to show smooth islands and hard edges.
   - Point out where island boundaries produce crisp normal breaks.
8. Open Blender's **Overlay** menu → enable **Face Orientation** to show the per-loop colouring.
9. **Stop recording.**

---

## Framing tips

- Use **Material Preview** shading (Z key → Material Preview) rather than Solid,
  so the metallic gold material catches the HDRI light and shows normal variation clearly.
- Enable **HDRI Lighting** in viewport shading for reflective contrast.
- Orbit speed: one full rotation in ~8 seconds — slow enough to see the shading bands.

---

## Post-processing (optional)

Trim dead time at start/end in the VSE or in DaVinci Resolve.
Target length: 30–90 seconds.
No narration track required for this recording.
