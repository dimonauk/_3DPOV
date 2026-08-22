# Screen Recording Notes — Shader Node Group Batch Material

Target file: `public/library/videos/scripting/python-shader-node-group-batch-material/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output format | MP4 / H.264 |

## Shot sequence (approx. 90 seconds)

1. **Open Blender** — new General file (the default cube scene).
2. **Scripting workspace** — paste or open `blueprint.py`.
3. **Run Script** — watch the 3×3 grid of cel-shaded primitives appear
   in the viewport (3D View visible in split alongside the Script editor).
4. **Select any primitive** — open Shader Editor in a new split.
   Show the `HS_FacetCelShader` group node inside the material.
5. **Double-click the group node** to enter it — pan to show the
   Diffuse BSDF → ShaderToRGB → Math (posterise) → MixRGB → Emission chain.
6. **Exit the group** (Tab or click Group header).
7. **Demonstrate live propagation**: while recording, change the
   `Rim Emission` node's Strength inside the group from 2.5 to 8.0.
   Observe ALL 9 primitives update their rim highlight simultaneously.
8. **Select a different primitive** — open its Shader Editor —
   show the SAME group node (not a copy) is referenced.
9. **Run record.py** from the Scripting workspace.
10. **Render → Render Animation** (Ctrl+F12) — let the render run for a
    few seconds so the camera orbit + Toon Steps jump are visible.

## Tips

- Use **Z → Rendered** mode in the 3D View to show EEVEE shading live
  before the render — the rim highlight is visible in real time.
- Arrange windows: left = 3D View (Rendered mode), right = Shader Editor.
- The Toon Steps animation (frame 90–180) shows the most dramatic moment:
  9 materials simultaneously flipping band count from 3 → 6.
- Keep the recording short: the 90-second demo above is the core.
  The render animation provides `viewport.mp4`; `screen.mp4` shows the
  Python workflow and the live node-edit propagation.
