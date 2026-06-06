# Screen Recording Notes — GN UV Unwrap + Pack Islands

## Software
OBS Studio (free, MIT/GPL) or Windows Game Bar (Win+G).

## Settings
- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: disabled (no narration for this recording)
- **Output**: `public/library/videos/geometry-nodes/gn-uv-unwrap-pack-islands-glb/screen.mp4`
- **Format**: MP4, H.264, CRF 22

## What to record (~8 minutes)

### Part 1 — Run blueprint.py (2 min)
1. Open Blender 5.1, switch to the **Scripting** workspace.
2. Load `blueprint.py` via the text block dropdown.
3. Press **Run Script**.  Show the terminal output confirming `.blend` and `.glb` saved.
4. Switch to **Layout** workspace.  The crystal geode should be visible.

### Part 2 — GN editor walkthrough (3 min)
1. Select the geode object.  Open the **Geometry Nodes** editor.
2. Pan to the node graph.  Walk through the key nodes:
   - **SubdivideMesh** — explain why subdivision comes first
   - **ShaderNodeTexNoise** → **SetPosition** — displacement chain
   - **GeometryNodeEdgeAngle** → **GREATER_THAN** — seam generation
   - **GeometryNodeUVUnwrap** — highlight the Seam input and Method dropdown
   - **GeometryNodePackUVIslands** — note Margin and Rotate inputs
   - **StoreNamedAttribute** — show domain=CORNER, data_type=FLOAT2, name="UVMap"
3. Open the **UV Editor** alongside the viewport.  Press **A** in UV Editor to select all.
   Show the packed islands in the 0–1 UV square.

### Part 3 — Seam angle slider (2 min)
1. In the **GN modifier** properties, drag the **Seam Angle Degrees** slider.
2. At 15° → many tiny islands, cluttered UV.
3. At 70° → few large islands, distortion visible in UV Editor.
4. Reset to 42° — balanced result.
5. Note: the UV editor updates live because PackUVIslands re-runs with each change.

### Part 4 — GLB inspection (1 min)
1. Show the exported `crystal_geode.glb` file in the OS file manager.
2. Optional: drag into https://gltf.report to confirm TEXCOORD_0 is present.

## Trim points
- Cut any console error scrolling that isn't relevant.
- Trim to ≤ 8 minutes total.
- No intro or outro title cards needed for the raw screen.mp4 library file.
