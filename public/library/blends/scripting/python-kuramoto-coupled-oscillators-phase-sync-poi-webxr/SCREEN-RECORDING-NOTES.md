# Screen Recording Notes — Kuramoto Phase Synchronisation

**Output:** `public/library/videos/scripting/python-kuramoto-coupled-oscillators-phase-sync-poi-webxr/screen.mp4`

## Setup

| Setting | Value |
|---------|-------|
| Software | OBS Studio or Windows Game Bar (Win+G) |
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Format | MP4 / H.264 |

## What to record

1. **Text Editor** — open `blueprint.py`, scroll to show the `deriv()` and `rk4_step()` functions, pause 3 s.
2. **Run Script** — press Run Script. Timeline fills with keyframes (~60 s on a mid-range CPU).
3. **Viewport playback** — press Space in the viewport. Watch 240 frames:
   - Frames 1–80: 64 coloured dots orbit independently in a chaotic ring.
   - Frames 81–160: dots begin to clump; the central white sphere starts to grow.
   - Frames 161–240: a single bright cluster rotates in unison; centre sphere is large and white.
4. **Order parameter close-up** — zoom into the centre during frames 130–200 to show the order sphere inflating.
5. **Timeline scrub** — drag the playhead back and forth across frame 80 (transition onset) to show the phase change.
6. **Properties panel** — open Material Properties for one oscillator, scrub to frame 100 to show the Emission Colour changing live.

## Trim / edit

- Keep total under 5 minutes.
- Compress with HandBrake (CRF 22, preset Slow) before uploading.
