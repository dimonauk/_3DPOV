# Screen Recording Notes
## animation-layered-action-layers-strips-blending

**Target file:** `public/library/videos/animation/animation-layered-action-layers-strips-blending/screen.mp4`

---

### Software
OBS Studio (or Windows Game Bar `Win + G` on Windows 11).

### Scene to capture
After running `blueprint.py` in the Scripting workspace, switch to the **Animation** workspace. The output should show:
- The Action Editor header reading **char_idle_layered** with three visible layer tabs.
- The Dope Sheet in **Action mode** with channels for `root` rotation and `ribcage` scale.

### Window / capture settings
| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | MP4 / H.264, CRF 23 |

### Shot list (aim for ≤ 90 seconds total)

1. **Scripting workspace** — show `blueprint.py`, hit Run Script (▷), watch the console confirm export.
2. **Action Editor** — switch to Animation workspace. Expand the layer list in the Action Editor header (small layer icon). Show three layers: `base_idle_sway`, `additive_breath`, `additive_blink`. Each with a different blend mode label.
3. **Dope Sheet channels** — click `base_idle_sway` layer. Show the `root | rotation_euler` channel with smooth sine keyframes.
4. **Timeline playback** — press Space. Show the character sway gently. Note the chest subtly pulsing at a faster rate. Blink visible at frame 60.
5. **Layer influence slider** — drag `additive_breath` influence from 0.8 to 0 and back. The breathing disappears and reappears without touching the base sway.
6. **GLB in file browser** — show `output/vrm_layered_idle.glb` was created.

### Post-processing
Trim to ≤ 90 seconds. No commentary track needed — on-screen action tells the story.
