# Screen Recording Notes — Data Transfer Modifier: Custom Split Normals

**Output target:** `public/library/videos/modifiers/modifier-data-transfer-smooth-normals/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source  | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic, no desktop audio) |
| Output format | MP4 / H.264 |

---

## What to record

### 1. Open the .blend (0:00 – 0:10)
Open `data_transfer_gem.blend`.  
Switch to **Material Preview** shading (Z → Material Preview or press the sphere icon).  
Orbit around the gem so the faceted silhouette is visible.

### 2. Show the flat-shaded gem without modifier (0:10 – 0:40)
- In the **Properties → Modifier Properties** tab, toggle the **eye icon** on the  
  **Data Transfer** modifier to OFF.
- In **Object Data Properties → Normals**, uncheck **Custom Split Normals**  
  (or via Mesh menu: Mesh → Normals → Clear Custom Split Normals Data).
- Press **Z** → **Solid** shade mode so flat facets are clearly visible.
- Orbit the gem slowly — the faceted pavilion triangles should catch harsh lighting.

### 3. Re-enable the modifier (0:40 – 1:00)
- Re-enable the **Data Transfer** eye icon (viewport display).
- Switch back to **Material Preview**.
- The gem interior should now shade smoothly while the silhouette edges remain crisp.
- Orbit again at the same speed as step 2 — the before/after contrast should be obvious.

### 4. Modifier panel walkthrough (1:00 – 1:30)
- In the Modifier panel, expand the **Data Transfer** entry.
- Point out:
  - **Object:** sphere_highpoly
  - **Face Corner Data → Custom Normals:** ticked
  - **Mapping:** Interpolated Normals (POLYINTERP_LNORPROJ)
  - **Mix Mode:** Replace, Factor 1.0
- Briefly toggle the modifier off and on again so viewers can see the live diff.

### 5. Viewport wire overlay (1:30 – 1:50)
- Overlays → **Wireframe** at 0.5 opacity.  
- Show that the polygon count is unchanged — the gem has 16 triangles before and after  
  the modifier; only the normals changed.
- Toggle wireframe off.

### 6. GLB export (1:50 – 2:10)
- File → Export → glTF 2.0 (.glb/.gltf).
- Show settings: **Apply Modifiers** ticked, **Draco Compression** ticked, level 6.
- Click **Export**.
- The exported GLB contains per-corner normals from the sphere — no texture required.

---

## Post-production trim points

| Mark | Action |
|------|--------|
| 0:00 | fade in |
| 0:08 | cut to viewport |
| 0:38 | title card: "Before: flat shading" (2 s overlay) |
| 0:58 | title card: "After: transferred sphere normals" (2 s overlay) |
| 2:10 | fade out |

---

## Common issues

**Gem still looks flat after modifier is on:**  
Check that the gem polygons are set to **Smooth Shading**.  
Object → Shade Smooth (right-click in viewport, or Object menu).  
Custom split normals are ignored for flat-shaded faces.

**Modifier eye icon missing:**  
The modifier may not be named "DataTransfer" if blueprint.py was re-run.  
Check Properties → Modifier Properties for the correct entry.
