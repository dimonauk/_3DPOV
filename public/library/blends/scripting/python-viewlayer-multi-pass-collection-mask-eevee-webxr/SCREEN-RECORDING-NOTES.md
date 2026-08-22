# Screen Recording Notes
## python-viewlayer-multi-pass-collection-mask-eevee-webxr

**Output file:** `public/library/videos/scripting/python-viewlayer-multi-pass-collection-mask-eevee-webxr/screen.mp4`

---

### OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Blender application window |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | H.264 (hardware preferred) |
| Audio | Off (no mic needed) |
| Output format | MP4 |

---

### What to Capture

1. **Open a fresh Blender 5.1 scene.** Keep the default cube; it will be deleted by the script.
2. **Switch to the Scripting workspace.** Open `blueprint.py` in the Text Editor.
3. **Run the script** (`Alt+P` or the ▶ button). Watch the terminal output — look for:
   ```
   [HLF] ViewLayer manifest written → …
   [HLF] Scene ready.
   ```
4. **Show the ViewLayer panel.** In the Properties panel → Scene Properties → View Layer, cycle through each layer (All, Env, Props, Character) to show the different collection visibility states. Pause ~2 seconds on each.
5. **Open the Compositor.** Switch to the Compositing workspace. Show the three RenderLayers nodes wired through AlphaOver to the Composite output. Pan slowly left to right.
6. **Open the Outliner** in Collection mode. Expand the HLF_Env, HLF_Props, HLF_Char collections to show the geometry inside each.
7. **Switch back to the 3D viewport** and press `Numpad 0` (camera view). Show the scene with the key light.
8. **Optional: trigger a quick render** (`F12`) on the "Env" view layer — show the render result with only the ground plane.

---

### Editing Notes

- Total target length: **60–90 seconds**
- Cut between: script run → ViewLayer panel → Compositor → Outliner → Camera view
- No narration needed — captions added in post
- Export with H.264, CRF 18, MP4 container
