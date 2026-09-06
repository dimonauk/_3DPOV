# Screen Recording Notes — CGLE Stage Floor

**Target file:** `public/library/videos/scripting/<slug>/screen.mp4`

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to record (≈ 4–6 min total)

1. **Open blueprint.py** in Blender's Text Editor.  
   Show the `VARIANTS` list at the top — highlight the four (c₁, c₂) pairs  
   and the `1+c1*c2` column in the README table.

2. **Run the script** (`Alt+R`).  
   Watch the Python console; each integration prints BF status.  
   Show the mesh appear in the 3D viewport.

3. **Shape key preview** — in Properties → Object Data → Shape Keys,  
   scrub each shape key value from 0 → 1 in the viewport.  
   Point out the labyrinthine spirals (Basis) vs. chaotic speckle (SK_Turbulent).

4. **Vertex colour overlay** — switch viewport shading to Solid → Colour → Attribute,  
   set attribute name to `CGL_Phase`.  
   The phase field shows cobalt→amber spiralling arms.

5. **Export GLB** — show the exported file path in the info bar.

6. **Brief Eevee render** — F12 a single frame to show the lit stage floor.

## Recommended narration beats

- "The CGLE is the master equation for every oscillating medium near a Hopf point."
- "Benjamin–Feir: if c₁c₂ < −1 the uniform oscillation is linearly unstable."
- "ETD1 treats the stiff k² linear part exactly — no CFL limit."
- "Shape key SK_Turbulent was integrated past the BF threshold — notice the defects."
