# Screen Recording Notes — Gabor Noise Satin Frosted Acrylic Panel

**Target file:** `public/library/videos/shading/shader-gabor-noise-satin-frosted-acrylic-webxr/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (tutorial has no narration) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Recording sequence

1. Open a fresh Blender 5.1 session.
2. Set render engine to **Eevee Next** (Properties → Render → Engine).
3. Open the **Scripting** workspace. Paste and run `blueprint.py`.
   - The frosted acrylic panel should appear in the 3D viewport.
4. Switch to the **Shading** workspace.
5. **Demonstrate Gabor node parameters** in the Shader Editor:
   - Select the first `Gabor Texture` node.
   - Scrub **Frequency** from 100 → 600 → 1000 — show how striae tighten.
   - Scrub **Anisotropy** from 0 → 1 — show the transition from haze to stripes.
   - Scrub **Orientation** from 0° → 45° → 90° — show stripe rotation.
6. Return Frequency to 600, Anisotropy to 0.88, Orientation to 22.5°.
7. Open **Material Preview** mode (Z → Material Preview).
   - Orbit around the panel showing the satin highlight from multiple angles.
8. Switch to **Rendered** mode (Z → Rendered) in Eevee Next.
   - Orbit again — highlight the specular hairlines and milky transmission.
9. Open the **Scripting** workspace. Paste and run `record.py`.
   - This renders `viewport.mp4` automatically.
10. Stop recording.

## Key moments to highlight on-screen

- **0:00 – 0:20** — blueprint.py runs; panel appears.
- **0:20 – 1:00** — Gabor node parameter scrubbing in Shader Editor.
- **1:00 – 1:40** — Material Preview orbit showing satin highlight.
- **1:40 – 2:20** — Rendered mode orbit showing transmission + striae.
- **2:20 – 2:40** — record.py triggered; render starts.

## Post-production

Trim the recording to ≤ 3 minutes.  No colour grading needed.
Export using HandBrake: H.264, CRF 22, AAC stereo muted, fast preset.
Place the final file at the target path above.
