# Screen Recording Notes — WaveModifier Ripple

**Target file:** `public/library/videos/scripting/python-bpy-wave-modifier-animated-ripple-falloff-webxr/screen.mp4`

## OBS setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264, CRF 20 |

## What to capture

1. **Script execution** (25 s) — open `blueprint.py` in the Scripting workspace,
   run it, watch the ripple plane appear flat then scrub to show the wave

2. **Wave modifier properties** (30 s) — switch to Properties → Modifier tab;
   call out `height`, `width`, `narrowness`, `speed`, `time_offset` fields one
   by one with a brief hover on each

3. **Narrowness demonstration** (20 s) — with the timeline paused at frame 20,
   change `narrowness` from 1.8 to 0.5 (broad rolling swell) then to 4.0
   (knife-edge crest); show the mesh update live in the viewport

4. **Vertex group inversion** (25 s) — open the Vertex Group panel in Object
   Data Properties; select the `anchor` group; switch to Weight Paint mode;
   show the red (weight=1.0) border strip that anchors the edges; point out the
   tooltip explaining the inversion in the modifier panel

5. **use_cyclic toggle** (15 s) — enable `use_cyclic` in the modifier and
   scrub; show wave re-entering from the far edge; disable again

6. **GLB in file browser** (10 s) — show `hf_wave_ripple.glb` in the file
   browser sidebar or system file manager

## Editing guidance

- Add lower-third labels: "Wave height & wavelength", "Narrowness = crest sharpness", "VG inversion: weight 1 = no displacement"
- Trim dead time during script run (fade cut after the plane appears)
- Final cut target: 90–120 seconds
