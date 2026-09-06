# Screen Recording Notes — Lorenz-Stenflo 4D Attractor

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` |

## What to capture

1. **Open Blender 5.1** — new General file.
2. **Open the Scripting workspace** — paste `blueprint.py` into the text editor.
3. **Run the script** (`Alt+P` or the ▶ button).  
   Integration runs four passes (~20 s total); terminal prints each stage.
4. **Switch to Layout workspace** — select `LS_Stenflo_Poi`.
5. **Rotate the viewport slowly** (middle-mouse drag) so the double-scroll  
   topology and cobalt–amber gradient across the w-dimension are visible.
6. **Open the Shape Key panel** (Properties → Object Data → Shape Keys):
   - Scrub `SK_WeakS` 0 → 1 → 0: the butterfly contracts toward the  
     Lorenz limit as the acoustic coupling fades.
   - Scrub `SK_StrongS` 0 → 1 → 0: the wings deform asymmetrically as  
     the acoustic channel injects progressively more energy into the roll.
   - Scrub `SK_HighR` 0 → 1 → 0: the orbit expands radially, matching  
     stronger thermal driving.
7. **Switch to Material Preview** (Z → Material Preview or `Alt+Z`):  
   confirm cobalt (w negative / low) → amber (w positive / high) across wings.
8. **Open Spreadsheet editor** — select `LS_Stenflo_W` attribute:  
   verify that FLOAT_COLOR values span the full 0–1 normalised range.
9. **Run `record.py`** — OpenGL render fires 240 frames (~20 s at 24 fps).
10. **End recording.**

## Viewport shading hints

- Use **Material Preview** with HDRI lighting disabled to isolate the  
  cobalt–amber emission gradient against a dark background.
- Enable **Cavity (Screen Space)** in the viewport overlay (Overlay → Cavity)  
  to make the tube cross-section folds visible.
- Suggested camera: distance ≈ 35 m, elevation ≈ 20°, orbit slowly around Z.  
  The double-scroll structure is best read from a slight oblique angle.
- If the tube appears too thin on screen, bump `TUBE_R` to `0.06` in  
  `blueprint.py` and re-run.

## Trim guidance

- **Keep**: the moment the attractor first draws on screen, the shape-key  
  transition from SK_WeakS (tighter, more Lorenz-like) to SK_StrongS  
  (acoustically distorted, wider spread), and the w-colour sweep.
- **Cut**: any grey "Blender startup splash" frames at the start.

## Filename convention

| File | Destination |
|---|---|
| `screen.mp4` | `public/library/videos/scripting/<slug>/screen.mp4` |
| `viewport.mp4` | written by `record.py` automatically |
