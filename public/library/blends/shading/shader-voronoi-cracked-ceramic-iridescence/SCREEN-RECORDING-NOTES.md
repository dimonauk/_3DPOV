# Screen-Recording Notes — Voronoi Cracked-Glaze Ceramic & Soap-Film Iridescence

**Target file:** `public/library/videos/shading/shader-voronoi-cracked-ceramic-iridescence/screen.mp4`

---

## Software

- **OBS Studio** ≥ 30 (or Windows Game Bar `Win + G`)
- **Blender 5.1** open with `blueprint.py` already run and both bowl objects visible

---

## OBS Settings

| Setting | Value |
|---|---|
| Video resolution | 1920 × 1080 |
| FPS | 30 |
| Output format | MP4 (H.264) |
| Audio | **Off** (no microphone) |
| Window capture source | Blender (entire window, not a display capture) |

---

## Recording Sequence

**Part 1 — Shader Editor walkthrough (Ceramic glaze, ~90 s)**

1. Open the Shader Editor. Select the `celadon_bowl` object.  
   Material: `M_CrackedGlaze_Ceramic`.
2. Slowly pan across the node tree from left to right:
   - `Texture Coordinate → Object` socket
   - `Voronoi Texture` node — show Feature dropdown set to `DISTANCE_TO_EDGE`
   - `ColorRamp` node — pause on the ramp gradient; drag the right stop left and right
     to show crack width changing live in Material Preview
   - `Map Range` nodes for roughness and coat weight
   - `Principled BSDF` node — show Coat Weight and Subsurface Radius inputs
3. Switch viewport to **Rendered** mode (Cycles). Let it converge to ~32 samples.
4. Rotate the bowl slowly with `R Y` to demonstrate:
   - Crack network catching specular light at oblique angles
   - Intact glaze showing mirror-clear clearcoat
   - Warm clay colour inside the cracks

**Part 2 — Soap-film iridescence variant (~60 s)**

1. Select the `celadon_bowl_soap` object. Material: `M_SoapFilm_Iridescence`.
2. Pan across the node tree:
   - `Voronoi Texture` in `F1` mode — Distance output
   - `Multiply` node — show the amplitude constant `0.45`
   - `Hue/Saturation/Value` node — pause here, demonstrate changing Hue value live
   - `Fresnel` node and the `Mix RGB` that gates iridescence to grazing angles
   - `Principled BSDF` — show Transmission Weight and Alpha inputs
3. In Rendered mode, rotate the soap bowl. The rainbow sweep across cell faces should
   be clearly visible.

**Part 3 — Node inspector close-ups (~30 s)**

1. Zoom into the Voronoi node on the ceramic material.
2. Switch Feature dropdown through: `F1`, `F2`, `SMOOTH_F1`, `DISTANCE_TO_EDGE`,
   `N_SPHERE_RADIUS` — show the live viewport reaction to each in Material Preview.
   This 10-second sequence is the most instructive thing to capture.

---

## Common Issues

- **Material Preview not updating live:** ensure `EEVEE` is the active preview engine
  (top-right of 3D Viewport → rendered sphere icon → switch to EEVEE for preview,
  Cycles for final).
- **Soap bowl appears fully black:** the Transmission Weight requires
  `Material Settings → Backface Culling` to be OFF.
- **OBS capture shows Blender UI at wrong scale:** set Display Scale to 100% in
  Blender Preferences → Interface before recording.

---

## After Recording

Trim dead time at the start/end in DaVinci Resolve or Kdenlive.  
Export at original resolution; do not upscale.  
Save to: `public/library/videos/shading/shader-voronoi-cracked-ceramic-iridescence/screen.mp4`
