# Screen Recording Notes — KP-I Lump Soliton Height-Field

**Target file:**  
`public/library/videos/scripting/python-numpy-kp-lump-soliton-manakov-zakharov-bordag-1977-rational-exact-2d-height-field-webxr/screen.mp4`

## Software

OBS Studio (Windows / Linux / macOS) or Xbox Game Bar (Windows 11).

## OBS Setup

1. **New Scene** → name it `KP-Lump-Soliton`.
2. **Sources → Add → Window Capture** → select `Blender 5.1`.
3. **Settings → Video**: Base resolution `1920×1080`, Output `1920×1080`, FPS `30`.
4. **Settings → Output → Recording**:
   - Format: MP4
   - Encoder: x264 (or NVENC if GPU available)
   - CRF: 18 (near-lossless; increase to 22 to save space)
5. **Settings → Audio**: Mute all sources.

## Blender Preparation

1. Open `hf_kp_lump.blend` (saved by `blueprint.py`).
2. Switch to the **Scripting** workspace; the 128×128 height-field should be visible.
3. Press `Z` → **Rendered** (EEVEE Next) in the 3D viewport.
4. In the **Properties → Object Data → Shape Keys** panel, set `SK_t0` value to 1.0
   to show the centred lump in the initial frame.
5. Maximise the 3D Viewport.
6. Enable **Viewport Overlay → Statistics** (shows vertex count for context).

## Narrative Shot List (5 seconds, 150 frames at 30 fps)

| Frames  | Action |
|---------|--------|
| 1–30    | Overhead pan. Lump far left (Basis / t=−2): nearly flat amber ridge and cobalt tail. |
| 31–60   | Shape-key blend toward SK_t0. Lump approaches centre — positive peak rises. |
| 61–90   | Lump centred (SK_t0=1.0). Pause. Orbit camera 30° to side to reveal the dipole lobes. |
| 91–120  | Blend toward SK_t+2. Lump exits to the right. Camera returns overhead. |
| 121–150 | Wide overhead shot of the decaying field — algebraic 1/r² tails barely visible. |

## Key Moments to Highlight

- **Frame 60**: Stop scrubbing momentarily to inspect the peak at the lump centre and
  the two negative cobalt lobes at X = ±C (here ±1 m) on either side.
- **Side profile (frame 75)**: The floor looks like a gentle hump — no sign of a sharp
  exponential soliton edge.  The 1/r² decay makes the field non-zero everywhere.
- **After the lump has passed**: the floor almost returns to flat, confirming the
  radiation-free nature of the lump soliton.

## Workflow

1. Start OBS recording.
2. In Blender: manually scrub the shape-key sliders (or play the animation with Spacebar).
3. After the shot list is complete, stop OBS.
4. Trim any dead frames in OBS video editor or DaVinci Resolve.
5. Export as `screen.mp4` at 1920×1080 30fps, save to the target path above.
