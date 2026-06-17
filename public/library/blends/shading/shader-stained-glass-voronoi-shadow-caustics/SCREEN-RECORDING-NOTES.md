# Screen Recording Notes — Shader: Stained Glass Voronoi Shadow Caustics

**Output**: `public/library/videos/shading/shader-stained-glass-voronoi-shadow-caustics/screen.mp4`

---

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Capture source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration needed for this pass) |
| Encoder | Hardware H.264 (NVENC / Quick Sync) preferred |

---

## Blender viewport setup before recording

1. Run `blueprint.py` from the Text Editor.
2. Switch to the **Layout** workspace.
3. Set viewport shading to **Rendered** (EEVEE Next).
4. In the top-right Overlays dropdown, disable **Grid** and **Axes**.
5. Confirm the floor is visible below the glass panel and the Sun is at a ~40° angle.
6. In Viewport Settings, confirm **Caustics** checkbox under Shadows if shown.

---

## Recording sequence (≈ 60 seconds)

### Segment 1 — Show the glass pattern (20 s)
- Hold the default camera position.  The stained-glass panel should fill most of
  the frame with vivid coloured cells and crisp black lead lines.
- Slowly orbit the viewport (middle-mouse drag) 30° left and 30° right to show
  how the glass refracts the background.

### Segment 2 — Show the caustic projection on the floor (20 s)
- Orbit the viewport downward until the stone floor is visible below the panel.
- Confirm the coloured light patches are projected on the floor (Shadow Caustics).
- Slowly drag the Sun lamp in the Viewport Overlays (or use the sun angle gizmo)
  to show the caustic pattern shifting direction.

### Segment 3 — Show the Voronoi Scale parameter (20 s)
- Open Material Properties → Shader Editor → select the Voronoi Texture node.
- With the viewport still in Rendered mode, scrub the **Scale** value
  from 7.0 → 3.0 (fewer, larger panes) and back to 7.0 → 14.0 (dense small panes).
- The lead lines and cell colours update live.

---

## File naming
Save the recording as `screen.mp4` in:
`public/library/videos/shading/shader-stained-glass-voronoi-shadow-caustics/`
