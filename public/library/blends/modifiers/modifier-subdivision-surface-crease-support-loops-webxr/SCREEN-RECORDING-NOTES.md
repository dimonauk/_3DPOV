# Screen Recording Notes — Subdivision Surface Comparison Panels

**Scene**: Two sci-fi console panels side by side. Left = crease weights (Panel_A). Right = Bevel+Subsurf (Panel_B).

## OBS / Windows Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled |
| Encoding | H.264 / MP4 |
| Output path | `public/library/videos/modifiers/modifier-subdivision-surface-crease-support-loops-webxr/screen.mp4` |

## Shot script (90 s total)

**0 – 15 s — File open**
Open `subsurf_console_panel.blend`. Show the 3D viewport with both panels. Toggle
Overlays → Wireframe (`Alt+W`) to show the base mesh before subdivision, then press
`Ctrl+1` / `Ctrl+2` to flick between viewport levels 1 and 2 to demonstrate how
subsurf multiplies faces.

**15 – 45 s — Modifier stacks**
Select `Panel_A_Crease` → Properties → Modifier Properties. Show the single Subsurf
modifier. Switch to Edit Mode (`Tab`), select one seam edge (`Alt+click`), open the
Item panel (`N`), and point to the Crease field (0.9). Note: this is stored as a mesh
attribute, not a UI-only property.

Select `Panel_B_BevelSubsurf` → Modifier Properties. Show the stack: Bevel on top,
Subsurf below. Emphasise the ORDER — if Subsurf were on top, the bevel would run on
already-subdivided geometry, producing multiple tiny bevels per loop.

**45 – 75 s — Lighting comparison**
Select the Sun lamp → Object Data Properties → reduce Angle to 2° (near-point source).
Orbit the camera to a glancing angle on both panels. On Panel_A, the shading kink at
the crease boundary becomes visible as a faint bright/dark seam. On Panel_B the
transition is smooth. Use the HDRI sphere in the background for additional context if
available.

**75 – 90 s — Export consideration**
Open the Blender console (Scripting workspace) and briefly show the `export_glb()`
function from blueprint.py — specifically the APPLY_LEVEL parameter and how it
temporarily lowers the viewport level before calling `export_scene.gltf`.

## Key shortcuts to demonstrate

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` / `Ctrl+2` | Set Subsurf viewport level to 1 / 2 |
| `Alt+W` | Toggle Wireframe overlay |
| `Shift+E` | Set edge crease in Edit Mode |
| `N` | Toggle Item / N panel |
| `Tab` | Toggle Edit / Object Mode |
