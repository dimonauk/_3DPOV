# Screen Recording Notes — ScrewModifier Profile Lathe Vase

**Output file:** `public/library/videos/scripting/python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system audio) |
| Output format | MP4 / H.264 |
| CRF / Quality | 18–22 (high quality) |

## Session flow to record

1. Open Blender 5.1 to an **empty scene**.
2. Start OBS recording.
3. Open the Scripting workspace. Paste `blueprint.py` into the Text Editor.
4. **Camera view**: zoom to see the profile mesh in the XZ plane.
   Point of interest — show the isolated edge-chain profile before running the script.
5. Run the script (Alt + P or ▶ Run Script).
6. Watch the modifier stack appear on the right panel: show the ScrewModifier settings
   (`Axis: Z`, `Steps: 12`, `Angle: 360°`, `Merge Vertices: on`).
7. Tumble the viewport to show the faceted vase from multiple angles.
8. Open the modifier properties, scrub `Steps` from 4 → 12 → 24 live to illustrate
   how step count controls faceting.
9. Reset to 12 steps.
10. Open the GLB in the browser-based Three.js viewer if available.
11. Stop OBS recording.
12. Trim to ≤ 3 minutes. Export to `screen.mp4`.

## Shot list

| # | What to show | Why |
|---|-------------|-----|
| 1 | Empty scene → Scripting workspace | orientation |
| 2 | Profile edge-chain (9 verts) in XZ plane | explains the lathe input |
| 3 | Script run → modifier applied instantly | satisfying payoff |
| 4 | Modifier properties panel | shows ScrewModifier parameters |
| 5 | Viewport tumble — faceted silhouette | key visual |
| 6 | Steps slider scrub (4 → 12 → 24) | demonstrates parameter space |
| 7 | GLB in browser (optional) | pipeline closure |
