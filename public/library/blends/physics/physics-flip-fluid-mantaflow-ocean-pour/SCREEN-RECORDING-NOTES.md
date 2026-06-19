# Screen Recording Notes — FLIP Fluid Mantaflow Pour

**Target file:** `public/library/videos/physics/physics-flip-fluid-mantaflow-ocean-pour/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps (enough for fine splatter detail) |

## Shot List

### 1 — Blueprint build (≈ 30 s)
- Open Blender → Scripting workspace.
- Load `blueprint.py`, click **Run Script**.
- Cut to a spin of the resulting scene: domain wireframe cube, glass vessel, source sphere.

### 2 — Physics Properties tour (≈ 60 s)
- Select `Fluid_Domain` → **Physics Properties** (water-drop icon) → **Fluid**.
- Show **Domain Type** = Liquid, **Resolution** = 64, **Use Mesh** ticked.
- Expand **Cache** sub-panel: show **Directory** field, switch **Cache Type** from REPLAY → ALL.
- Select `Glass_Vessel` → Physics Properties → show **Effector** type = Collision.
- Select `Fluid_Source` → Physics Properties → show **Flow Type** = Liquid, **Behavior** = Inflow,
  **Initial Velocity Z** = −3.0.

### 3 — Bake All (≈ 20 s, or timelapse)
- With `Fluid_Domain` selected, click **Bake All** in the Cache sub-panel.
- Show the progress bar filling. Timelapse is fine — add a title card: "Resolution 64 / 80 frames".
- When complete, the bar disappears and **Free Bake** button appears.

### 4 — Timeline scrub (≈ 30 s)
- Scrub the timeline from frame 1 to frame 80.
- Pause at **frame 35–45**: the pour stream is mid-arc into the vessel, splashing.
- Rotate around the vessel to show the fluid mesh surface.
- Switch shading mode: Solid → Material Preview (Z key menu) to show water colour.

### 5 — Material Preview (≈ 20 s)
- Zoom to the vessel with Material Preview active.
- Show the water's blue-tint transmission and the glass vessel transparency.
- Pan to show both glass walls and the fluid interior.

### 6 — GLB Export snapshot (≈ 30 s)
- Set timeline to frame 40.
- **File → Export → glTF 2.0**. Show the dialog:
  - Format: GLB
  - Apply Modifiers: ticked
  - Draco Mesh Compression: ticked, Level 6
  - Image Format: WebP
- Click Export GLB.

### 7 — Viewport render (≈ 10 s)
- Run `record.py` (Scripting workspace) or press **Ctrl+F12** (viewport render animation).
- Show the progress bar; describe that the output lands in `public/library/videos/`.

## Tips

- Keep the Physics Properties panel visible throughout shots 2–3 to show controls clearly.
- Use a split view: 3D Viewport (left) + Timeline (bottom-right) for scrub shots.
- If the bake is too slow for a continuous take, record before and after, cut together.
- Wireframe overlay can be turned off (Viewport Overlays → untick Wireframe) for cleaner close-ups.
