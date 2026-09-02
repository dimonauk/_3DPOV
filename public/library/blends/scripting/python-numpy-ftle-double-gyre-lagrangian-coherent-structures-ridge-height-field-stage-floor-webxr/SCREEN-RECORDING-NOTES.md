# Screen-Recording Notes — FTLE Double-Gyre Floor

**Target file**: `screen.mp4`  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: off

---

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture — Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 (or NVENC if available) |
| Rate control | CRF 18 |
| Audio | Disabled |

---

## Recording flow

1. Open **ftle_double_gyre_floor.blend** in Blender 5.1.
2. Set viewport shading to **Material Preview** (EEVEE).  Bloom is visible in
   Rendered mode; use that if you want the amber ridges to glow.
3. Switch to **Solid + MatCap** to show mesh topology while you explain the
   FTLE concept, then switch to Material Preview for the colour pass.
4. Press **Tab** to enter Edit Mode; show the 120 × 60 = 7 200-vertex grid.
   Zoom to the channel between the two gyres to reveal the ridge filaments.
5. Back in Object Mode: open the **Shape Keys** panel in the Properties editor.
   Slowly drag the value of each shape key from 0 → 1 while explaining:
   - **Basis** → forward FTLE (repelling LCS ridge in mid-channel)
   - **SK_Bwd** → backward FTLE (attracting LCS, lobe boundaries)
   - **SK_HiEps** → stronger oscillation, wider chaotic zone
   - **SK_LongT** → longer integration, finer filament detail
6. Run `record.py` in the Text Editor to produce `viewport.mp4`; keep
   recording the screen during the render-progress bar.

---

## Narration beats (approx.)

| Time | Beat |
|------|------|
| 0:00 | Overview: "Two counter-rotating gyres separated by a transport barrier." |
| 0:20 | Show Basis FTLE — amber ridge in the channel |
| 0:40 | Switch to SK_Bwd — attracting LCS appears on lobe folds |
| 1:00 | SK_HiEps — channel widens; chaotic zone more visible |
| 1:20 | SK_LongT — finer filaments, LCS resolves into sharp ridges |
| 1:40 | Run record.py; watch render |

---

## Tips

- **Camera**: `Numpad 7` (top ortho view) is best for showing the 2-D ridge
  topology; switch to `Numpad 5` (perspective) for the 3-D height sense.
- **MatCap**: *Metal Sheen* gives a good sense of the height-field without
  needing lighting setup.
- Pause on the `SK_Bwd` / `SK_LongT` frames — these show the "fine structure"
  that audiences find most striking.
