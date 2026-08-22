# Screen-Recording Notes — Ince–Strutt Stability Stage Floor

## Capture target
`public/library/videos/scripting/python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr/screen.mp4`

## Software
OBS Studio (free, open source) or Windows Game Bar (`Win + G`).

## Settings
| Setting | Value |
|---|---|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute desktop audio) |
| Output format | MP4 / H.264 |

## What to record (≈ 90 seconds)

1. **Open Blender** (empty scene). Show Text Editor with `blueprint.py`.
2. **Run blueprint.py** (`Alt + P`). Watch the Info header log Floquet
   statistics: stable %, max λ/π. The terrain mesh appears in the viewport.
3. **Orbit the viewport** (Middle Mouse Button) to show:
   - Top-down view: the colour-map reads like the classic Ince–Strutt diagram
     (cobalt triangular stability regions, amber tongues in between).
   - Angled view from the side: amber ridges rise sharply at the tongue
     boundaries; the n=0 tongue (q-axis itself) forms the tallest central ridge.
4. **Open shape-key panel** (Properties → Object Data → Shape Keys).
   Scrub `SK_Exaggerated` value from 0 → 1 → 0. The ridges amplify 2.5×
   making the tongue hierarchy very clear.
5. **Run record.py** (`Alt + P`) — no visual change but keyframes load.
   Briefly show the timeline so the three phases are visible.
6. End with the angled amber-ridge landscape in viewport.

## Talking points (voiceover or captions)
- "This is the Ince–Strutt diagram — every point is one (a, q) pair in
  the Mathieu equation. Amber is parametric resonance; cobalt is stable."
- "The tongues narrow as q → 0 and become wider and wider as q increases."
- "Paul ion traps operate at the tip of the first tongue (a≈0, q≈0.9) —
  particles are trapped in the stability island."

## Post-processing
Trim to 60–90 s. No colour grade needed. Export at 1080p H.264, CRF 23.
