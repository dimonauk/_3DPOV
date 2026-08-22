# Screen Recording Notes — OceanModifier Seascape

**Target file:** `public/library/videos/scripting/python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr/screen.mp4`

## OBS setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264, CRF 20 |

## What to capture

1. **Script execution** (30 s) — open `blueprint.py` in the Scripting workspace,
   run it, show the ocean plane appearing in the 3D Viewport
2. **Timeline scrub** (20 s) — drag the playhead from frame 1 to 120; show the
   wave surface animating from the time driver
3. **Modifier properties** (30 s) — switch to Properties → Modifier tab; point
   out `spectrum`, `wind_velocity`, `choppiness`, `use_foam` fields
4. **Foam attribute** (20 s) — switch to Shader Editor; show the Named Attribute
   node reading `"foam"` and feeding into the mix colour
5. **JONSWAP vs PHILLIPS** (20 s) — change `spectrum` to `PHILLIPS` in the
   modifier, scrub briefly, change back to `JONSWAP`
6. **GLB export** (15 s) — show the exported `hf_ocean_seascape.glb` file in
   the Blender file browser

## Editing guidance

- Trim dead time during script execution (fade cut after the ocean appears)
- Add lower-third text labels: "JONSWAP spectrum", "Beaufort 5 wind", "Foam attribute"
- Final cut target: 90–120 seconds
