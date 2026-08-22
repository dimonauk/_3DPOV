# Screen Recording Notes — Spherical Harmonics Orbital Shape Keys

## Target output
`public/library/videos/scripting/python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr/screen.mp4`

## Software
OBS Studio 30+ **or** Windows Game Bar (Win+G)

## Blender setup before recording
1. Open Blender 5.1 and load the blend file that `blueprint.py` saved.
2. Switch to the **Scripting** workspace.
3. In the top-right corner of the Scripting workspace text editor, open `blueprint.py`.
4. Switch viewport shading to **Material Preview** (Z menu → Material Preview) so the emission colour is visible immediately.
5. In the Properties panel (N key in viewport) or the Properties editor → Object Data (green triangle icon) → Shape Keys, confirm the list shows **Basis** plus all Y_l_m entries.

## Capture settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

## Recommended recording sequence (~90 seconds)
1. **Start recording.**
2. In the Scripting workspace, show `blueprint.py` at the top (parameters block visible). Press **▶ Run Script**.
3. Watch the console print `[hf] GLB → ...`. Switch to the **Layout** workspace — the orange-and-blue orbital sphere appears.
4. Open the **N panel** in the viewport → Object tab. Locate the Shape Keys section. (If it is not visible, go to Properties editor → Object Data Properties → Shape Keys.)
5. Slowly drag `Y_1_+0` from 0 → 1: the sphere stretches into the **p_z dumbbell**.
6. Reset to 0. Drag `Y_2_+0` from 0 → 1: the **d_z² double-dumbbell with equatorial torus** appears.
7. Reset. Drag `Y_2_+2` from 0 → 1: the **four-lobed d_x²-y²** orbital blooms.
8. Blend two keys: set `Y_1_+0 = 0.4` and `Y_2_+0 = 0.6` simultaneously to show hybrid orbital geometry.
9. Reset all. **Stop recording.**

## Post-processing
- Trim dead air before Run Script and after the final reset.
- Add a text overlay: `Blender 5.1 · Python numpy · Real Spherical Harmonics · CC0`.
- No colour correction required — EEVEE emission provides the ambient glow.
- Target final length: 60–90 seconds.
