# Screen Recording Notes — Mesh Integrity Pipeline

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` (H.264, CRF 18) |

## Shot sequence

### Act 1 — Show the broken mesh (0:00 – 0:20)

1. Run `blueprint.py` with the **INTEGRITY PIPELINE** block commented out.
2. Open the Viewport Shading → **Material Preview** mode.
3. Orbit slowly to show:
   - The **seam crack** at the equator (thin dark line between crown and pavilion)
   - The **dark pavilion-base faces** (flipped normals, invisible from front camera)
4. Switch to **Overlays → Face Orientation** (blue = front, red = back).  
   The flipped faces appear red.

### Act 2 — Run the pipeline (0:20 – 0:40)

1. Un-comment the integrity pipeline block.
2. Open the **Text Editor** → paste / load `blueprint.py`.
3. Press **Run Script**.  Show the Info header bar flash green (no errors).
4. Orbit to show:
   - Seam dissolved — no crack
   - All faces blue in Face Orientation overlay
   - Table hole capped with the holes_fill quad

### Act 3 — Export & inspect (0:40 – 1:00)

1. Switch to **Solid** shading → enable **Cavity** overlay (subtle facet depth).
2. Open **File → Export → glTF 2.0** and confirm the path matches EXPORT_PATH.
3. After export, open the system file manager and show `hf_gem_pendant.glb`.
   (Optional: drag-drop into `gltf.report` or `modelviewer.dev` in a browser.)

## Cuts & titles (edit in VSE)

```
00:00  Title card: "bmesh Mesh Integrity Pipeline"
00:03  Act 1 — broken mesh orbit
00:20  Title card: "Step 1: find_doubles → weld_verts"
00:25  Act 2 — script run
00:40  Title card: "Repaired: outward normals · closed hole"
00:45  Act 3 — solid viewport + export
01:00  End card: holoflow.studio
```
