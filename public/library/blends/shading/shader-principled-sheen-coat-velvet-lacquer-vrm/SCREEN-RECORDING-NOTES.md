# Screen Recording Notes — Sheen & Coat Velvet / Lacquer

**OBS / Game Bar setup**
- Source: Window Capture → Blender 5.1
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: OFF (no mic/desktop audio needed)
- Output: `public/library/videos/shading/shader-principled-sheen-coat-velvet-lacquer-vrm/screen.mp4`
- Encoder: H.264, CRF 18

---

## Shot list

### Shot 1 — Sheen on velvet (≈ 40 s)
1. Open the `.blend` (saved after running `blueprint.py`).
2. Viewport: Material Preview mode, Rendered shading ball icon.
3. Select `cloth_panel`. Properties → Material → `VelvetJacket_Navy`.
4. Open Shader Editor; pan to the Principled BSDF node.
5. **Live adjust**: drag `Sheen Weight` slider 0 → 1.  
   Show the bright edge bloom appear at grazing angles.
6. **Then drag**: `Sheen Roughness` 0.21 → 0.95.  
   Narrate: "Watch the sharp velvet edge broaden into a peach-fuzz wash."
7. Reset both to the blueprint values.

### Shot 2 — Coat on lacquer (≈ 40 s)
1. Select `lacquer_band`. Properties → Material → `LacquerBelt_Black`.
2. In Shader Editor show the Principled BSDF with Coat sockets.
3. **Live adjust**: drag `Coat Weight` 0 → 0.87.  
   The band surface transitions from matte leather to wet-look patent.
4. Scrub `Coat Roughness` between 0.04 and 0.4.  
   Narrate: "The base darkens as coat attenuates it — two-layer physics."
5. Reset to blueprint values.

### Shot 3 — glTF extension verify (≈ 30 s)
1. File → Export → glTF 2.0. Check:  
   - Materials: Export  
   - Draco: ON, Level 6  
   - Images: WebP  
2. Open exported GLB in Khronos glTF Sample Viewer (browser tab).
3. Show the KHR extensions panel in the viewer confirming  
   `KHR_materials_sheen` and `KHR_materials_clearcoat` are present.

---

**Tip**: orbit the viewport during shot 1 so the grazing-angle sheen bloom
sweeps across the cloth drape — this makes the retroreflective effect obvious.
