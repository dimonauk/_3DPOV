# Screen Recording Notes — Texture Paint Stylised Low-Poly Gem Totem

Target file: `public/library/videos/shading/texture-paint-stylised-low-poly-character/screen.mp4`

---

## OBS / Windows Game Bar Setup

- **Window source**: Blender 5.1 (not display capture — window keeps quality if you alt-tab)
- **Resolution**: 1920 × 1080 (match Blender's window size exactly)
- **Frame rate**: 30 fps
- **Audio**: OFF — this is a silent screen recording; narration is added in post if needed
- **Format**: MP4 / H.264, CRF 18–22

---

## Workspace Layout Before Recording

1. Open Blender 5.1 → run `blueprint.py` via Text Editor → Run Script.
2. Switch to **Texture Paint** workspace (top header tab) — this shows the 3D viewport in Texture Paint mode on the left, and the UV Editor / Image Editor on the right.
3. In the 3D Viewport: set the active material to `gem_totem_unified`. Make sure the Image Editor on the right shows `gem_totem_base`.
4. Set 3D viewport shading to **Material Preview** (EEVEE).
5. Arrange windows: 3D view left (60%), Image Editor right (40%).

---

## Recording Sequence (~3-4 minutes)

### Act 1 — Show the UV Atlas (30 s)
- Hover over the Image Editor showing the UV atlas.
- Slow zoom into the gem crown UV islands (bright cyan patch) so the correspondence is clear.
- Switch the Image Editor to show `gem_totem_rough` — point out the bright (rough) stone islands vs dark (smooth) gem island.
- Switch back to `gem_totem_base`.

### Act 2 — Live Texture Paint Stroke (60 s)
Demonstrate ONE manual paint stroke to show the workflow that `blueprint.py` automates:
1. In the 3D Viewport, make sure Texture Paint mode is active (header dropdown).
2. Select the `gem_totem_base` image as the active canvas: in the Image Editor toolbar, confirm the image dropdown shows `gem_totem_base`.
3. In the Tool Settings (top of 3D viewport), set:
   - **Brush**: Draw
   - **Colour**: a slightly lighter warm ochre `(0.75, 0.55, 0.28)` — shows contrast against the base skin paint
   - **Radius**: 30 px
   - **Strength**: 0.9
4. Paint a short stroke across one of the ochre skin facets on the front of the totem.
5. Cut to the Image Editor — show the stroke now visible in the UV atlas.
**This is the key moment**: the 3D stroke appeared as a UV-space brushmark in the atlas. Pause for 3 seconds.

### Act 3 — UNDO the stroke (5 s)
- `Ctrl + Z` — show the stroke disappear from both the 3D view and the atlas.
- This demonstrates the live link: atlas IS the surface.

### Act 4 — Emission Zone Glow (30 s)
- In the 3D Viewport: switch shading to **Rendered** (EEVEE).
- Rotate to show the cyan gem crown facets — they glow with cyan emission.
- Switch Image Editor to `gem_totem_emit` — show the bright pixels at the gem crown UV islands.

### Act 5 — GLB Export (20 s)
- `File → Export → glTF 2.0 (.glb/.gltf)`
- Point out the settings: Images = Automatic (WebP), Compression = Draco Level 6.
- Click Export. Show the tiny GLB file size in the file browser (≈ 40 KB with Draco).

---

## Post-Processing Notes

- Trim to remove false starts.
- Add chapter markers at each Act transition.
- If encoding for web: `ffmpeg -i screen.mp4 -vf scale=1920:1080 -c:v libx264 -crf 20 -preset slow -an screen_web.mp4`
