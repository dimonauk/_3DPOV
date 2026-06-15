# Screen Recording Notes — Multires Modifier: Normal Bake & GLB Export

**Target file:** `public/library/videos/sculpting/sculpt-multires-normal-bake-lowpoly-glb/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration for this pass) |
| Encoder | H.264 / NVENC if available |
| Output | `screen.mp4` in the videos folder above |

## Recording sequence

### Part 1 — run blueprint.py (0:00–1:30)

1. Open Blender 5.1. File → New → General.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor.
4. Press **Run Script** (▶). Watch the Info bar — the bake will take 20–60 s on CPU.
5. When complete, the talisman_low object appears in the 3D Viewport.

### Part 2 — inspect Multires levels (1:30–3:00)

6. Switch to **Layout** workspace. Select `talisman_low`.
7. Open **Properties ▸ Modifier** (spanner icon).
8. Scrub the **Viewport** slider from 0 to 4. Record the face-count jump.
   - Level 0: raw 96-quad sphere (starkly faceted)
   - Level 4: 24 576 smooth subdivided faces
9. Set Viewport to **2** (good mid-detail for live work).

### Part 3 — inspect UV and material (3:00–4:30)

10. Switch to **UV Editing** workspace. The level-0 UV islands are visible.
11. Switch to **Shader Editor**. Show the node graph:
    `Principled BSDF ← Normal Map ← Image Texture (talisman_normal, 1024×1024 FLOAT)`
12. Click the Image Texture node — the baked tangent-space normal map appears in the
    UV/Image Editor pane.  Show the blue-dominant surface with RGB normal encoding.

### Part 4 — run record.py and watch animation (4:30–6:00)

13. Switch back to **Scripting** workspace.
14. Open `record.py` in the Text Editor.
15. Press **Run Script**. The Viewport animation renders to `viewport.mp4`.
16. (Optional) Press **Space** in the 3D Viewport to play back the keyframed animation
    showing the level ramp 0→4 and the 360° rotation.

### Part 5 — GLB in a browser viewer (6:00–7:00)

17. Navigate to `public/library/glbs/sculpting/sculpt-multires-normal-bake-lowpoly-glb/`.
18. Drop `sculpted_talisman.glb` into **gltf.report** or **modelviewer.dev**.
19. Show the normal-map shading on the low-poly level-0 geometry.
    The faceted silhouette carries the impression of fine surface detail — this is
    the bake doing its job.

## Trim points

- Cut the bake wait time to 2–3 s in editing.
- Keep the level-slider scrub segment: it is the clearest demonstration of
  what "Multires" means in practice.
