# Screen Recording Notes — Nishita Sky Texture + Sun Position Rig

## Software
OBS Studio 30+ / Xbox Game Bar / QuickTime (Mac)

## Capture settings
| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (silent screen capture) |
| Output format | MP4 / H.264 |
| Output file | `public/library/videos/shading/shader-sky-nishita-sun-position-hdri-rig/screen.mp4` |

## What to capture

### Beat 1 — World shader node setup (0:00–0:45)
1. Open Blender 5.1 with the default scene
2. Open the **Shader Editor** → switch header drop-down from **Object** to **World**
3. Delete default nodes. Add **Sky Texture** node (Shift+A → Texture → Sky Texture)
4. Set Sky Type to **Nishita** in the node properties (N-panel or node header)
5. Connect: Sky Texture Color → Background Color → World Output Surface
6. Show the N-panel parameters: Air / Dust / Ozone / Altitude / Sun Elevation
7. Pan the shader editor so all three nodes are clearly readable

### Beat 2 — Sky parameters live preview (0:45–1:30)
1. Switch to **Material Preview** mode (Z → Material Preview, or header sphere icon)
2. Enable **Scene World** in the viewport overlay (N-panel → View → World)
3. Drag the **Sun Elevation** slider — show pre-dawn purple → orange → midday blue
4. Drag **Air Density** 0→3 — show how higher values deepen the sky blue
5. Drag **Dust Density** 0→2 — show how haze whitens the horizon
6. Reset to the tutorial values (Air=1.0, Dust=0.5, Ozone=1.0, Elevation=5°)

### Beat 3 — SUN lamp matching (1:30–2:15)
1. Add a **SUN** type light (Shift+A → Light → Sun)
2. Show light Properties → set Energy to 5.0, Angle to 0.526°
3. In Properties → Object → Transform, set Rotation X to **85°** (= 90° − 5° elevation)
4. Show shadow appearing on the cube, direction matching sky sun disc
5. Rotate sun lamp Z to 45° to match SUN_ROTATION

### Beat 4 — Animation: sun rises (2:15–3:00)
1. Open the **Timeline** at the bottom
2. Go to frame 1. Set sky node Sun Elevation to **−5°**. Hover → **I** → keyframe
3. Go to frame 180. Set Sun Elevation to **70°**. Hover → **I** → keyframe
4. Press **Spacebar** to play — watch the sky shift from twilight through golden hour
5. Pause at frame 30 (golden hour) — show the warm orange horizon

### Beat 5 — AgX colour management (3:00–3:30)
1. Open **Render Properties** → **Colour Management**
2. Show View Transform = **AgX** (default). Point out the sky looks natural
3. Switch to **Standard** briefly — show the washed-out / clipped sun disc
4. Switch back to AgX

### Beat 6 — Scripted blueprint run (3:30–4:00)
1. Open **Scripting** workspace
2. Load `blueprint.py` (Text → Open → navigate to the library folder)
3. Press **Run Script** — watch terminal print `✓ Nishita sky rig complete`
4. Switch back to Layout — show the three-prop scene under the sky

## Post-processing
Trim to 4:00. No colour grading — the sky colours themselves are the story.
Add chapter markers at each beat timestamp if the editing tool supports it.
