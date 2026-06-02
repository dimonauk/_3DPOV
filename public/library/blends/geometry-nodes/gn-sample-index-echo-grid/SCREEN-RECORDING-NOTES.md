# Screen Recording Notes — GN Sample Index Echo Grid

**Target file:** `public/library/videos/geometry-nodes/gn-sample-index-echo-grid/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary for this pass) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps (CRF 18 in OBS Advanced) |

## What to show (in order)

1. **Open `echo_grid.blend`** — show the default viewport: a flat grid, then press
   **Numpad 5** (orthographic) then **Numpad 4** (front-left 3/4 view).
2. **Rotate to a 3/4 perspective** — show the interference wave pattern in full.
3. **Open the GN modifier panel** — show the two group sockets:
   - *Echo Scale* (default 0.70)
   - *Row Offset* (default 15)
4. **Scrub Echo Scale from 0 → 2** in real time — show how the wave deepens;
   note the constructive peaks at aligned phases.
5. **Change Row Offset to 1** — interference becomes cross-row; peaks scatter.
6. **Change Row Offset to 7 (half a row)** — peaks align diagonally.
7. **Return Row Offset to 15** — restore the demonstration state.
8. **Open the Geometry Node editor** — show the full graph; pan across it
   left-to-right so viewers can see each phase:
   - Position → Noise Texture → Map Range → Store Named Attribute
   - Index → Math(ADD, Row Offset) → Math(MODULO, 225) → Sample Index
   - Named Attribute (own src_z) + scaled echo → Set Position
9. **Select the EchoGrid object, open Properties → Spreadsheet** — filter by
   POINT domain and show the `src_z` float attribute with its values.
10. **Press Space to play** `record.py`-baked animation — the echo wave builds
    and fades over 5 s.

## Duration target

4–7 minutes. No narration required for the raw capture; commentary can be
added in post via a second audio track.

## Post-production hint

Cut between the full viewport and the GN editor at step 8 — use a
cross-dissolve of 8 frames (≈ 0.25 s at 30 fps) to keep the transition
smooth.
