# Screen Recording Notes — Cycles Lightmap Bake for WebXR

**Target file:** `public/library/videos/rendering/cycles-lightmap-bake-webxr-uv2/screen.mp4`

## Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | H.264, CRF 18 |

Open `lightmap_room.blend` before starting the recording.

## Shot list

### 1 — Scene overview (0:00 – 0:20)
- Maximise the 3D viewport
- Press `Z` → **Rendered** view (Cycles)
- Show the unlit-ish scene (no lightmap active yet on Base Color) as a baseline
- Press `Numpad 0` to switch to camera view

### 2 — UV Editor: two UV channels (0:20 – 0:50)
- Split the editor, open the **UV Editor** on the right
- Select the `floor` mesh, Tab into Edit Mode, select all (`A`)
- In the UV Editor header, toggle between `UVMap` (tiled, overlaps OK) and
  `UVLightmap` (flat, every face unique) — talk through why they differ
- Tab back to Object Mode

### 3 — Material nodes: bake target node (0:50 – 1:20)
- Open the **Shader Editor** for `floor`
- Point out the `BAKE_LM` Image Texture node wired through a UV Map node set
  to `UVLightmap` — this is the node the bake operator writes into
- Show the `lm_floor` image already packed (Image → Image menu shows "Packed")
- Switch the active node to `BAKE_LM` (click to select)

### 4 — Render Properties: bake settings (1:20 – 1:50)
- Open **Render Properties** (camera icon)
- Show **Bake** section:
  - Bake Type: **Combined**
  - Margin: 4 px, Margin Type: **Extend**
  - **Denoise** checkbox ticked (OIDN on bake result)
- Do NOT re-bake live — the blueprint already ran it; just show the settings

### 5 — Image Editor: inspect lightmap (1:50 – 2:20)
- Switch left panel to **Image Editor**
- Select image `lm_floor` from the dropdown
- Show the baked lightmap: warm pool from key_area, cool fill from fill_point,
  contact shadow under pillar base
- Switch to `lm_pillar`, `lm_accent` to compare per-object images
- Toggle **Display channels** to show the float data (HDR values > 1.0)

### 6 — GLB export confirmation (2:20 – 2:40)
- Open **File → Export → glTF 2.0**
- Show that both UV channels are included (Include → Mesh → UV Maps: ticked)
- Point out Draco compression enabled
- Cancel (do not re-export — the blueprint already did it)

### 7 — Three.js lightMap tip (2:40 – 3:00)
- Show a text editor with the Three.js snippet from the README
- Briefly explain `lightMap` + `uv1` attribute name in Three.js r148+

## Save

- Output container: MP4, H.264
- Save to: `public/library/videos/rendering/cycles-lightmap-bake-webxr-uv2/screen.mp4`
