# Screen Recording Notes — Hopf Fibration Poi Head

**Target file:** `public/library/videos/topology/python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr/screen.mp4`

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

1. Open `hf_hopf_poi.blend` (run `blueprint.py` first if starting fresh).
2. Press **Numpad 0** → Camera view.
3. Viewport shading → **Material Preview** (Z → 3) or **Rendered** (Z → 8).
4. In Viewport Overlays, enable **Wireframe** at ~8 % to show linking topology.
5. Colour management: View Transform = **Filmic**, Exposure = +0.4.
6. Set timeline end frame to **300**, play.

## Shape-key walkthrough for the recording

| Frames | Action |
|--------|--------|
| 1–60   | Scrub SK_Clifford from 0→1 — watch the 48 interlocked circles snap onto the Clifford torus ring |
| 60–150 | Hold on SK_Clifford; slowly orbit the camera; point out the flat-torus structure |
| 150–210 | Crossfade to SK_SouthHeavy — fibres contract toward the origin |
| 210–270 | Crossfade to SK_NorthHeavy — fibres radiate outward to the periphery |
| 270–300 | Return to Basis; pause on final frame to show the full Fibonacci distribution |

## Narration cues (voice-over optional)

- Frame 1: "Every point on the 2-sphere corresponds to a circle on the 3-sphere."
- Frame 60: "The equatorial fibres form the Clifford torus — the unique flat torus embedded in S³."
- Frame 150: "Fibres near the south pole project to tight rings at the centre."
- Frame 210: "Fibres near the north pole spread outward — the projection diverges toward infinity."
- Frame 300: "Any two circles you see are linked with Hopf linking number 1."

## Post-processing (DaVinci Resolve / Kdenlive)

- Trim handles to 00:00–00:10.
- Colour grade: Lift +0.02, Contrast ×1.08.
- Export as H.264 MP4 1920×1080 30 fps, target 8 Mbps.
- Save to `public/library/videos/topology/.../screen.mp4`.
