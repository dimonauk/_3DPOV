# Screen Recording Notes — Cahn-Hilliard Phase Separation

**Target file:** `public/library/videos/scripting/python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr/screen.mp4`

## Software

OBS Studio (any recent version) or Windows Game Bar (`Win + G`).

## Setup

1. Open Blender 5.1. Load or re-run `blueprint.py` in the Scripting workspace.
2. Switch to the **3D Viewport** tab.
3. Set Viewport Shading to **Rendered** (EEVEE Next — press `Z` → Rendered).
4. In Render Properties, confirm EEVEE Next is active.

## OBS Configuration

| Setting            | Value                          |
|--------------------|--------------------------------|
| Source             | Window Capture → Blender       |
| Resolution         | 1920 × 1080                    |
| Frame rate         | 30 fps                         |
| Output format      | MP4 / H.264                    |
| Audio              | **Off** — no audio track needed|
| Hotkey (start/stop)| F9 (or custom)                 |

## Recording Flow

1. Start OBS recording.
2. Press **Space** in the 3D Viewport to play the 240-frame camera orbit.
3. Watch the amber bicontinuous network rotate against the deep-slate void.
4. At frame 240 the camera completes the full 360° circuit — stop recording.
5. Save OBS output as `screen.mp4` in the videos folder above.

## What to Capture

- **Full Blender window** including the Python console below so viewers can see
  the simulation log output (`φ ∈ [−0.98, +0.97]` etc.).
- Keep the Properties sidebar closed to maximise the 3D Viewport area.
- If the coral pattern looks too small, temporarily set `N = 256` and re-run
  `blueprint.py` for a finer-detail mesh (takes ~2 s more).

## Notes

- If EEVEE Bloom is too intense, reduce `EMIT_STR` to 3.0 in `blueprint.py`
  and re-run before recording.
- The pattern is periodic (toroidal topology) — the edges wrap seamlessly.
  Consider rotating the tile 90° to show a different cross-section as a second take.
