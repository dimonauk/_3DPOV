# Screen Recording Notes — AgX Colour Management
## Blender 5.1 | Holoflow Studio

### OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output format | MP4 (H.264) |
| Output path | `public/library/videos/color-management/color-management-agx-ocio-pipeline/screen.mp4` |

---

### Shot List

**Segment 1 — Render Properties → Color Management panel** (30 s)
1. Open `color_stress_test.blend` (built by `blueprint.py`).
2. Press **N** to open the sidebar, pin the Properties editor to Render Properties.
3. Scroll to the **Color Management** section and expand it.
4. Slowly hover over each field — **Display Device**, **View Transform**, **Look**,
   **Exposure**, **Gamma** — pausing 2 s per field so viewers can read the tooltip.

**Segment 2 — Live view transform comparison** (45 s)
1. Set View Transform to **AgX**, Look to **AgX - Medium High Contrast**.
2. Press **Z** → Rendered in the 3D Viewport.
3. Wait for Cycles to converge (≈ 30 samples visible).
4. Change View Transform to **Filmic** — pause 5 s to let students compare.
5. Change to **Standard** — pause 5 s.  The overbright key reflection on the chrome
   sphere should be visibly clipped vs. AgX's smooth rolloff.
6. Return to **AgX → Medium High Contrast** — final comparison frame.

**Segment 3 — Exposure slider** (20 s)
1. With AgX active, drag **Exposure** from 0.0 → +1.5 and back to 0.0.
2. Point out that dragging Exposure in AgX pushes the chrome highlight *through*
   the shoulder without clipping; the same drag under Standard clips at +0.5.

**Segment 4 — GLB texture colour spaces** (25 s)
1. Open **Shader Editor** and select the red plastic sphere.
2. In the Principled BSDF, add an **Image Texture** node.
3. Show the **Color Space** dropdown on the Image Texture node:
   - Base Color slot: set to **sRGB** (the default for colour textures).
   - Roughness slot: must be **Non-Color** (linear data — not tonemapped).
4. Briefly explain: "The GLB exporter reads this colour space flag and writes
   the correct `colorFactor` in the glTF JSON."

---

### Trimming Notes

Cut the recording into four clips matching the shot list.
Assemble in DaVinci Resolve or Blender's VSE.
No music needed — tutorial voiceover is recorded separately.
