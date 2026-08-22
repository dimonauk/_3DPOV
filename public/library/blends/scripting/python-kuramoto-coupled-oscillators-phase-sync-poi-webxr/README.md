# Kuramoto Coupled Oscillator Phase Synchronisation

**Blender 5.1 · Python · CC0-1.0**

Simulates N = 64 coupled phase oscillators with heterogeneous natural frequencies
drawn from a Lorentzian distribution. As the coupling constant K surpasses the
critical threshold K_c = 2γ ≈ 2.0, the system transitions from a stationary
incoherent state to a macroscopic rotating wave — the Kuramoto phase transition.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full simulation: Lorentzian frequencies, RK4 integrator, Blender keyframe bake |
| `record.py` | Renders `viewport.mp4` via EEVEE Next with Bloom |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions |

## Physics

```
dθᵢ/dt = ωᵢ + (K/N)·Σⱼ sin(θⱼ − θᵢ)

r·eⁱψ = (1/N)·Σⱼ exp(iθⱼ)    (order parameter, r ∈ [0,1])

K_c = 2γ  (Lorentzian distribution, Ott–Antonsen exact result)
```

- `r ≈ 0`: oscillators desynchronised, phases fill the circle uniformly
- `r → 1`: phases bunched, macroscopic coherence

## Outputs (after running)

- `hf_kuramoto.blend` — 64 animated oscillator spheres + order sphere
- `hf_kuramoto.glb` — baked GLB for WebXR playback
- `public/library/videos/scripting/.../viewport.mp4` — rendered animation

## Running

1. Open Blender 5.1, create a new file.
2. Open `blueprint.py` in the Text Editor.
3. Press **Run Script** (~60 s on a mid-range CPU).
4. Save as `hf_kuramoto.blend`.
5. Run `record.py` to render `viewport.mp4`.
