# Screen Recording Notes — LJ Crystal Nucleation

**Target file:** `public/library/videos/scripting/python-lennard-jones-md-crystal-nucleation-berendsen/screen.mp4`

## OBS Studio settings

| Setting    | Value                              |
|------------|------------------------------------|
| Source     | Window Capture — Blender           |
| Resolution | 1920 × 1080                        |
| FPS        | 30                                 |
| Encoder    | NVENC H.264 (or x264 CRF 18)      |
| Audio      | Disabled                           |

## Steps

1. Run `blueprint.py` from Blender's Text Editor or via:
   `blender --background --python blueprint.py`
2. Open `hf_lj_crystal.blend` in Blender 5.1.
3. Set **Viewport Shading → Rendered** (EEVEE Next). Confirm **Bloom** is active
   in Render Properties → EEVEE → Bloom.
4. Set view to **Camera** view (`Numpad 0`). The orthographic top-down frame shows
   all 100 atoms glowing white-hot in their initial positions.
5. Start OBS recording.
6. Press **Space** to play the animation from frame 1 to 240.
7. Stop OBS recording when frame 240 is reached.

## What to capture

- **Frames 1–80:** White-to-warm glow, particles moving chaotically. No long-range
  order visible. Short trails visible as atoms dart across the frame.
- **Frames 80–140:** Cyan phase — atoms begin slowing, transient clusters form and
  dissolve. Pairs and triplets of atoms briefly adopt hexagonal arrangement then
  break apart. This is the liquid range.
- **Frames 160–240:** Violet glow — crystal domains lock in. Look for small
  triangular patches where atoms sit at regular inter-particle spacing ~1.12σ.
  Multiple domains with different orientations are separated by grain boundaries
  (the bright-line defect zones). Grain coarsening may be visible as adjacent
  domains of similar orientation merge.

## Troubleshooting

- **Particles not moving:** The animation is precomputed keyframe data, not a live
  simulation. Press Space to play; the keyframes should drive all 100 objects.
- **No glow visible:** Confirm Viewport Shading is **Rendered**, not Solid or
  Material Preview. EEVEE Bloom requires Rendered mode.
- **Black screen:** The world background is near-black by design (0.004, 0.002,
  0.014). If the atoms are also invisible, check that the material
  `LJ_Particle` is assigned to the atom objects and that Emission Strength ≥ 8.
- **Atoms at wrong positions frame 1:** The first keyframe is frame 1, not frame 0.
  Set the timeline start to 1 in Scene Properties → Frame Range.
