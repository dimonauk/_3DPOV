# Space Colonisation Algorithm — Branching Coral Skeleton

**Blender 5.1 · Python · numpy**  
**Slug**: `python-numpy-space-colonisation-algorithm-branching-coral-webxr`  
**Topic**: scripting  
**Licence**: CC0

---

## What this entry builds

A hemispherical attractor cloud simulates coral polyp distribution. The Space
Colonisation Algorithm (Runions, Lane & Prusinkiewicz 2007) grows a branching
skeleton upward through the cloud. Each branch chain is stored as a NURBS spline
with a circular bevel, producing smooth organic tubes. The result is exported as
a Draco-6 GLB for WebXR.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender script: SCA loop, curve build, GLB export |
| `record.py` | Orbit-camera animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest + cross-reference index |

---

## Quick start

1. Open **Blender 5.1** → **Scripting** workspace.
2. Load `blueprint.py` in the Text Editor.
3. Press **Run Script** (Alt+P).
4. The coral skeleton builds in ~5–20 s. GLB appears alongside the `.blend` file.
5. For the viewport animation: run `record.py` after blueprint has finished.

---

## Key parameters (top of `blueprint.py`)

| Constant | Default | Effect |
|---|---|---|
| `N_ATTRACTORS` | 500 | Crown density — more = bushier |
| `D` | 0.09 m | Segment step length |
| `D_INFLUENCE` | 5.5 × D | Attractor reach — larger = longer branches |
| `D_KILL` | 1.7 × D | Kill radius — smaller = tips reach further |
| `MAX_ITER` | 280 | Growth budget |
| `TRUNK_SEGS` | 7 | Root spine segments |

---

## Algorithm summary

```
repeat until no attractors remain:
  for each attractor A:
    find nearest branch node N (if within D_INFLUENCE)
    mark N as growing toward A

  for each growing node N:
    compute mean direction to all its attractors
    normalise → unit vector v
    spawn new node at N + v × D

  kill any attractor within D_KILL of any node
```

---

## Output artefact

`hf_coral_sca.glb` — Draco-6 compressed, +Y up, snake_case root name.  
Load in Three.js via `GLTFLoader`; emissive material needs `KHR_materials_emissive_strength`.

---

## Outside sources

- Runions, A., Lane, B., Prusinkiewicz, P. (2007). *Modeling Trees with a Space
  Colonization Algorithm.* Eurographics Workshop on Natural Phenomena.
  Mathematical algorithm is public domain.
- Prusinkiewicz, P. & Lindenmayer, A. (1990). *The Algorithmic Beauty of Plants.*
  Springer. Free authorized PDF at <http://algorithmicbotany.org/papers/#abop>.
  Mathematical content is public domain.
