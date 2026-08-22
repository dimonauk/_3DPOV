# Screen Recording Notes — Mesh Edge Attribute Pipeline

## Target file
`public/library/videos/scripting/python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr/screen.mp4`

## Software
OBS Studio (recommended) or Windows Game Bar (Win+G → Record)

## Window source
Blender 5.1 — main window, 3D Viewport maximised (Ctrl+Space)

## Settings
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: Off
- Format: MP4 / H.264

## Steps to record

1. Open `faceted_dome.blend` in Blender 5.1 (run `blueprint.py` first if needed).
2. In the **3D Viewport**, switch to **Material Preview** shading (Z → Material).
   The hard shading breaks at sharp edges are immediately visible.
3. Press **Tab** to enter **Edit Mode**. Switch to **Edge Select** mode (2).
4. Enable **Overlay → Edge Angle** — sharp edges are highlighted in a
   contrasting colour based on their dihedral angle.
5. With all edges selected (A), open the **Item panel** (N → Item) and show the
   `Mean Crease` field on the equatorial loop.
6. Press **Tab** back to **Object Mode**. Open a second area (right-click header
   → Vertical Split) and switch it to **Scripting** workspace.
7. Paste and run `blueprint.py`. Show the console output line:
   `sharp=N seam=M crease_nonzero=K` to demonstrate the attribute-write results.
8. Return to the **3D Viewport** and rotate the dome (Middle Mouse drag) to show
   faceted shading from multiple angles — 30–45 seconds of slow rotation.
9. Switch to **Rendered** mode briefly (Z → Rendered) with EEVEE Next to show the
   final lit result.

## Duration target
60–90 seconds total
