# Screen-Recording Notes — Rikitake Two-Disk Dynamo

## Software
OBS Studio (≥ 30) or Windows Game Bar (`Win + G`).

## Settings
| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (full window, not display capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary track needed for the raw capture) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-numpy-rikitake-two-disk-dynamo-1958-geomagnetic-reversal-chaotic-flip-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4` |

## What to record
1. **Open Blender** — new General workspace.
2. **Switch to Scripting** workspace.
3. **Open `blueprint.py`** → click *Run Script*.
   - Show the progress in the Info bar / system console.
   - Let the tube appear in the 3D viewport.
4. **Tumble** the viewport (middle-mouse drag) to show the two-lobe
   reversal geometry from two or three angles — spend ~10 s here.
5. **Select the shape keys** panel (Properties → Object Data → Shape Keys).
   - Scrub the `SK_LowMu` value from 0 → 1 slowly.
   - Return to 0, then scrub `SK_HighA` to show the topology shift.
6. **Open `record.py`** → click *Run Script*.
   - Stop recording after the viewport render completes.

## Duration target
≈ 3–5 minutes of raw footage; trim in the VSE tutorial before export.

## Naming
Save the file exactly as `screen.mp4` in the path above so the
`.expected-artefacts.json` manifest resolves correctly.
