# Screen Recording Notes — FPUT α-FPU Anharmonic Chain Stage Floor

**Target file:**
`public/library/videos/scripting/python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | H.264 (NVENC or x264) |
| Bitrate | 8 000 kbps |

## Blender viewport setup

1. Run `blueprint.py` — this builds `fput_floor.blend` and `fput_floor.glb`.
2. Open `fput_floor.blend` in Blender 5.1.
3. Press **Numpad 0** → Camera view.
4. Switch viewport shading to **Material Preview** (Z → 3).  
   The Cobalt–Amber FPUT_Disp vertex colour becomes visible.
5. In Viewport Overlays: disable Wireframe, enable **Statistics** to show vertex count.
6. Colour management: View Transform = **Filmic**, Exposure = +0.2, Contrast = **Medium High**.
7. In Properties → Object Data → Shape Keys: set the panel visible in the Properties N-panel.
8. Set timeline end to **300**, frame rate to **30 fps**.

## Shape-key walkthrough for the recording

| Frames | Action |
|--------|--------|
| 1–80 | Hold Basis (α=0.25). Camera orbits slowly overhead. Point out: amber antinodes sweeping across the floor, then reconcentrating — the FPUT recurrence. |
| 80–130 | Crossfade to SK_Linear (α=0). Floor settles into a perfect sinusoidal standing wave — amber peaks frozen at i=16, blue nodes at i=0 and i=32. No mode mixing. |
| 130–200 | Crossfade to SK_Half (α=0.125). Some energy slowly leaks to mode 2 but recurrence period doubles — subtle spreading visible near the end of the floor. |
| 200–270 | Crossfade to SK_Double (α=0.50). Rapid multi-mode chaos: the entire floor fills with disordered amber, no clear recurrence within the frame window. |
| 270–300 | Crossfade back to Basis. Recurrence stripes re-emerge; camera returns to start position. |

## Narration cues (voice-over optional)

- Frame 1: "1955, Los Alamos. Fermi, Pasta, Ulam, and Mary Tsingou run the first computer simulation in physics."
- Frame 40: "They expect the energy to spread evenly across all modes — thermalisation. Instead, it comes back."
- Frame 80: "With α=0, a linear chain: energy stays frozen in mode 1 forever."
- Frame 130: "Weaker coupling slows the recurrence but cannot eliminate it."
- Frame 200: "Strong coupling: energy spreads rapidly. The recurrence period shrinks below our sample window."
- Frame 270: "Back to α=0.25 — the original FPUT regime. Zabusky and Kruskal explained it in 1965: KdV solitons."

## Post-processing (DaVinci Resolve / Kdenlive)

- Trim to 00:00–00:10.
- Colour grade: Lift +0.01, Contrast ×1.06, Saturation ×1.10.
- Export H.264 MP4 1920×1080 30 fps, 8 Mbps.
- Save to `public/library/videos/scripting/.../screen.mp4`.

## Common issues

**Floor looks flat / no colour gradient**  
Material requires a ShaderNodeAttribute node with `attribute_type='GEOMETRY'`
and `attribute_name='FPUT_Disp'`. Check the node tree; blueprint.py sets this
automatically.

**Shape keys not changing Y positions**  
Blender shape keys store *absolute* vertex positions (not deltas); confirm the
`foreach_set('co', ...)` call in blueprint.py writes the full `(x, y, z)`
triplet per vertex, not just the Y component.

**Export produces a GLB with no morph targets**  
Pass `export_morph=True` explicitly in `export_scene.gltf`. Blender 5.1 sets
this to `False` by default when Draco compression is enabled.
