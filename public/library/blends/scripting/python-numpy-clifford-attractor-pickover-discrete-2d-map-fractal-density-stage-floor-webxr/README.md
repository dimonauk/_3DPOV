# Clifford Attractor — Pickover Discrete 2-D Map, Fractal Density Stage Floor

**Blender 5.1 · Python + numpy · CC0**

## What this is

The Clifford (Pickover) attractor is a two-parameter family of nonlinear discrete maps:

```
x_{n+1} = sin(a·y_n) + c·cos(a·x_n)
y_{n+1} = sin(b·x_n) + d·cos(b·y_n)
```

Four real parameters `(a, b, c, d)` control a continuous zoo of fractal geometries.
Unlike area-preserving maps (Chirikov, Zaslavsky), this map is **dissipative** — the
orbit contracts onto a strange attractor with fractal dimension D_f < 2. The long-run
density of visited points reveals the attractor's fractal structure.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert Blender 5.1 script — builds mesh, shape keys, vertex colour |
| `record.py` | Viewport animation render (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Shape keys

| Key | a | b | c | d | Character |
|-----|---|---|---|---|-----------|
| Basis | -1.4 | 1.6 | 1.0 | 0.7 | 5-arm starfish |
| SK_Cave | -1.7 | 1.3 | -0.1 | -1.2 | Elongated cave strands |
| SK_Web | 1.5 | -1.8 | 1.6 | 0.9 | Fine-filament crystalline web |
| SK_Sparse | 1.3 | 1.7 | 0.5 | 1.0 | Sparse island rings |

## Usage

1. Open Blender 5.1, Scripting workspace
2. Paste `blueprint.py` → Run Script
3. Object `Clifford_Attractor` appears in scene (approx. 20–40 s compute)
4. (Optional) Run `record.py` to render `viewport.mp4`
5. Export via **File → Export → glTF 2.0** (Draco 6, WebP textures, apply transforms)

## Sources

- Clifford A. Pickover, *Computers and the Imagination* (1991), St. Martin's Press —
  equations are mathematical definitions, not copyrightable (PD)
- Paul Bourke, "Clifford Attractors" (2013) — paulbourke.net/fractals/clifford/
  (figures CC BY 4.0; algorithm description PD)
- Related: Julien C. Sprott, *Strange Attractors* (1993) M&T Books — catalogue
  of dissipative 2-D maps with similar structure
