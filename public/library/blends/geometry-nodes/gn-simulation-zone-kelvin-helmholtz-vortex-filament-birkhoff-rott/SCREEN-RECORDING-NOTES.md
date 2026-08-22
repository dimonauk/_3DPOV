# Screen Recording Notes — KH Vortex Filament (OBS / Game Bar)

## Target file
`public/library/videos/geometry-nodes/gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott/screen.mp4`

## OBS settings
- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: disabled (no microphone needed for silent capture)
- **Output**: MP4, H.264, CRF 18 (or equivalent quality preset)

## Recording flow

1. Run `blueprint.py` — confirm `hf_kh_vortex.blend` saves successfully.
2. Switch to **3D Viewport** (top-down orthographic, numpad 7).
3. Start OBS recording.
4. **Frame 1**: pause on the initial wavy line.  Show the N=24 glowing points.
5. **Play** (Space) — let it run to frame 50.  Pause.  Show the early roll-up forming.
6. Open **Geometry Node Editor**.  Walk through:
   - Simulation Zone outer boundary
   - Two `Store Named Attribute` nodes resetting vx, vy = 0
   - Repeat Zone — show the Iterations=24 input
   - Inside: SampleIndex reading xj, yj; dx/dy/r² maths; Switch mask; dvx/dvy
   - Euler integrate: StoreNamedAttribute px/py
   - Set Position + CombineXYZ for scaling
7. Back to 3D Viewport — play to frame 200.  Show the tight spiral.
8. Stop OBS recording.

## Duration target
8–12 minutes.  Tight edits welcome; the node-tree walkthrough is the key pedagogical section.

## Tips
- Enable **N-panel → View → Local Camera** so viewport matches render framing.
- Set viewport shading to **Rendered** (EEVEE Next) for bloom glow during recording.
- The spiral is fully formed by frame ≈130; frame 200 shows the vortex core tightening.
