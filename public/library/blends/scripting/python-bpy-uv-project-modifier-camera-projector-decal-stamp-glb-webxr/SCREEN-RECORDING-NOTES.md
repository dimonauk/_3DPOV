# Screen Recording Notes — UVProjectModifier Decal Stamp

**Target file:**
`public/library/videos/scripting/python-bpy-uv-project-modifier-camera-projector-decal-stamp-glb-webxr/screen.mp4`

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | MP4 / H.264, CRF ~18 |

## Capture sequence (3–6 minutes)

1. **Scripting workspace** — show `blueprint.py` open, click Run Script.
   Pause 2 s on the scene appearing in the 3D viewport.

2. **Material Preview (Z → Material)** — show the gold diamond on the dark
   steel shield. Orbit freely for 10 s.

3. **Properties → Modifier Stack** — select the shield, open modifier tab.
   Show the `UVProject` modifier, point out:
   - `UV Layer: projected`
   - `Projectors: 1 → projector (camera icon)`
   - `Aspect X: 1.0, Aspect Y: 1.0`
   - `Scale X: 0.65, Scale Y: 0.65`

4. **Select the projector camera** → Camera Properties panel.
   Show `Type: Orthographic`, `Orthographic Scale: 1.8`.
   Move the camera laterally on X — show the decal following the camera
   in the viewport (demonstrates live projection).
   Undo the move (Ctrl+Z).

5. **UV Editor** — split viewport, switch one panel to UV Editor.
   Tab into Edit Mode on the shield, A to select all.
   Switch the UV layer dropdown to `projected` — the projected UV islands
   appear as the diamond shape in UV space.

6. **Active UV layer** — switch to `LightmapUV` in the UV editor — shows
   empty / default UV. Explain the two-layer setup.

7. **Export duplicate** — briefly explain the apply-before-export pattern
   in the code (no need to run live, just walk the code comments).

8. **(Optional)** Run `record.py` and show the render progress window.

## Tips

- `N panel → Item` shows object dimensions on-screen.
- Toggle **Overlays → Wireframe** to reveal the faceted 10-gon geometry.
- **Numpad 1** (front view) is the clean hero shot for the decal.
- If the decal looks washed out in Material Preview, check View → Viewport
  Shading → Options → World Space Lighting is on.
