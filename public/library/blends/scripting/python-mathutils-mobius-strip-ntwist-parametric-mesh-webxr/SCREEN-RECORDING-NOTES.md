# Screen-Recording Notes — Möbius Strip N-Twist

## Setup

- **Software**: OBS Studio (Windows/Linux) or Xbox Game Bar (Win+G)
- **Window source**: Blender 5.1 (not full-screen capture — window source keeps HiDPI clean)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no narration track for this viewport demo)

## OBS scene configuration

1. Add a Window Capture source → select Blender 5.1.
2. Right-click source → Transform → Stretch to Screen (then add black bars if 4K monitor).
3. Settings → Output → Recording → CRF 18, preset "veryfast", container MP4.
4. Output file: `public/library/videos/scripting/python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr/screen.mp4`

## Shot list

| Time   | Action |
|--------|--------|
| 0:00   | Blender open, Layout workspace. Hit Numpad 5 (orthographic), then Numpad 4 rotate to show strip from the side. |
| 0:08   | Switch to Material Preview (Z → Material Preview). Gold/navy two-tone visible. |
| 0:18   | Orbit the viewport (middle-mouse drag) slowly around the strip — watch the colour flip at the seam. |
| 0:30   | Switch to Scripting workspace. Show blueprint.py open. Highlight the seam reversal block (lines 75–82). |
| 0:45   | Press ▶ Run Script. Watch console output: boundary loops confirmation. |
| 1:00   | Switch back to Layout. Press Z → Solid to show mesh without material. |
| 1:10   | In the Overlay menu, enable Normals (face). Show alternating normals at the seam demonstrating non-orientability. |
| 1:25   | Change N_TWISTS to 3 in script (line 44), re-run. Show the triple-twist result. |
| 1:45   | End — switch back to Material Preview, orbit for final beauty pass. |

## Tips

- **Seam inspection**: zoom into the area where θ ≈ 0 (the x-axis intersection, right side). The colour transition from gold to navy is sharpest here.
- **Normals overlay**: set normal length to 0.05 m (Viewport Overlays → Normals → 0.05). Too long and they obscure the mesh.
- **Thin strip mode**: set `THICKNESS = 0` and re-run to see the non-orientable surface without the solid shell — the alternating normals are most obvious in this mode.
