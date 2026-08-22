# Screen Recording Notes — Simple Deform Twist/Bend (Blender 5.1)

## Setup

- **Window source**: Blender (full window, not a region)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: off (tutorial narration added in post)
- **Output**: `public/library/videos/modifiers/modifier-simple-deform-twist-bend-cartoon/screen.mp4`

## What to record

1. Open `twisted_column.blend`.
2. In the Properties panel → Modifier (wrench icon) → show both Taper and Twist modifiers.
3. Slowly drag the **Twist → Angle** slider from 0° to 360° — watch the column spiral.
4. Reset to 270°. Press **Space** to play the keyframed animation.
5. Switch to Edit Mode briefly to show the ring topology — then back to Object Mode.
6. Open **Shader Editor** to show the Math(MODULO) stripe node graph.
7. Export one GLB: File → Export → glTF 2.0, confirm settings.

## BEND bonus clip (optional second recording)

1. Add a new Plane, subdivide 20× along X (Loop Cut, 19 cuts).
2. Add Simple Deform → BEND, axis=Y, angle=180°.
3. Move the modifier origin Empty below the plane to shift the arch curve.
4. Show in viewport — this is the arch gateway demo.

## OBS scene

- Hotkey to start/stop: F9 (customise in OBS Settings → Hotkeys)
- Keep the Blender header visible (menu bar) so viewers can see the version
- Zoom Blender's UI to 120% (Preferences → Interface → Resolution Scale) for readability
