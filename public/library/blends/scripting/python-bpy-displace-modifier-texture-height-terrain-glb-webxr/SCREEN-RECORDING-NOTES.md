# Screen Recording Notes — DisplaceModifier Height-Field Terrain

**Output target:** `public/library/videos/scripting/python-bpy-displace-modifier-texture-height-terrain-glb-webxr/screen.mp4`

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (or Windows Game Bar Win+G) | Scene → Window Capture → "Blender" |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | x264 / H.264, CRF 23 |

---

## What to capture

1. **Open Blender 5.1** with a fresh default file.
2. Open the **Scripting** workspace tab at the top.
3. Click **New** to create a text block; paste `blueprint.py`.
4. Click **Run Script** (▶). Watch the progress in the Info header.
5. Switch to the **Layout** workspace. The subdivided terrain plane is visible.
6. In the Outliner, expand the object's modifier stack:
   - `SubSurf` (level 5)
   - `Smooth by Angle` (25°)
   - `Displace` (Clouds texture, strength 0.6)
7. In the Properties panel → **Texture** tab, show the Clouds node tree.
8. Switch to **Solid** shading, rotate the viewport to show the height field.
9. Switch to **Material Preview** shading — warm grey terrain visible.
10. Open the **Scripting** workspace again; paste `record.py` into a new text block.
11. Click **Run Script** — turntable render begins (90 frames, ~30 s).
12. Stop recording after the console prints `[HF] Viewport recording done`.

---

## Timestamp markers for tutorial edit

| Time | Moment |
|------|--------|
| 0:00 | Fresh Blender; Scripting workspace opens |
| 0:12 | blueprint.py pasted; Run Script clicked |
| 0:22 | Modifier stack visible in Properties |
| 0:35 | Texture tab — Clouds node shown |
| 0:45 | Viewport rotate to show terrain height |
| 1:00 | record.py run; turntable begins |
| 1:30 | End |

---

## Post-processing

Trim to 90 s max.  No colour-grade needed.  Add a lower-third text overlay:
`bpy.data.textures · DisplaceModifier · Blender 5.1 · holoflow.studio`
