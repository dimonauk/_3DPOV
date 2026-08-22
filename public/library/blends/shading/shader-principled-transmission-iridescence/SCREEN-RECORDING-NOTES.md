# Screen Recording Notes
## Holographic Gem — Principled BSDF v2 Transmission + Iridescence

**Target file:** `public/library/videos/shading/shader-principled-transmission-iridescence/screen.mp4`

---

### OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute all tracks) |
| Format | MP4 / H.264 |
| Bitrate | 8 Mbps CBR |

---

### Pre-Recording Checklist

1. Open Blender 5.1 with a fresh default scene.
2. Switch the workspace to **Scripting**.
3. Open `blueprint.py` in the Text Editor panel (File → Open Text Block).
4. Verify the output paths at the top of the script match your local directory.
5. Maximise the Blender window to 1920 × 1080 before starting OBS.

---

### Shot List

**Shot 1 — Script execution (0:00–0:20)**
- With `blueprint.py` loaded in the Text Editor, press **Run Script** (▶).
- Let the script complete; the gem appears in the viewport.
- Pause 2 seconds on the success message in the Info header.

**Shot 2 — Material Preview walkthrough (0:20–1:00)**
- Switch to the **3D Viewport** + **Material Preview** (Lookdev sphere icon, `Z` shortcut).
- Orbit slowly around the gem to show the iridescence changing with viewing angle.
- Point out the faceted icosphere surface and the rainbow bands.
- Switch to **Rendered** mode briefly (Cycles) to show the transmission caustics.

**Shot 3 — Shader Editor tour (1:00–1:45)**
- Split the Blender window: **Shader Editor** on the left, **3D Viewport** on the right.
- Select the `HolographicGem` material.
- Walk through the node tree left-to-right:
  - Tex Coord → Mapping
  - Voronoi Texture (explain F2 feature = crystal cell edges)
  - Wave Texture + Map Range (explain Thickness driving spectrum sweep)
  - Noise + Bump (explain WHY bump not displacement for gems)
  - Principled BSDF v2 — highlight the renamed sockets:
    *Transmission Weight*, *Iridescence Weight*, *Iridescence Thickness*, *Coat Weight*

**Shot 4 — Parameter tweak live (1:45–2:30)**
- In the Principled BSDF node, scrub **IOR** from 1.4 to 2.4 and back.
  Show how higher IOR = more Fresnel reflection, less visible transmission.
- Scrub **Iridescence Thickness** (Map Range To Min/Max) to shift the spectrum.
- Scrub **Wave Scale** to compress/expand the rainbow bands in real time.

**Shot 5 — GLB export (2:30–3:00)**
- File → Export → glTF 2.0 (or run the export block from the script).
- Open the exported `.glb` in a browser-based glTF viewer (e.g., gltf.report).
- Show that the file contains `KHR_materials_transmission` and
  `KHR_materials_iridescence` extensions in the JSON.

---

### Post-Processing

- Trim dead air at start/end.
- Add lower-third text overlays for node names (optional).
- No colour grade needed — the iridescence effect is the visual subject.
- Export final at 1920 × 1080 / 30 fps / H.264 / AAC (silent).
