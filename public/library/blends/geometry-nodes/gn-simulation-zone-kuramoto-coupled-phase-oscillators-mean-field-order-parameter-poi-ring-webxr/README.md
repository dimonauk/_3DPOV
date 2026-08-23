# Kuramoto Coupled Phase Oscillators — GN Simulation Zone

**Blender 5.1 · CC0 · Holoflow Studio**

64 phase oscillators arranged on a poi-head ring, each with a natural
frequency drawn from a Lorentzian distribution. A Geometry Nodes Simulation
Zone integrates the Kuramoto mean-field equations every frame. Above the
critical coupling K_c = 2γ the ring spontaneously locks — a second-order
phase transition rendered live in the viewport.

## What you get

| File | Description |
|------|-------------|
| `hf_kuramoto_poi.blend` | Scene with GN modifier, emissive material, camera |
| `blueprint.py` | Builds the scene from scratch — run once with Alt+P |
| `record.py` | Renders `viewport.mp4` with overhead-to-oblique camera |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for the tutorial video |

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Paste `blueprint.py`, press **Alt+P**.
3. Switch to Layout → press **Space** to play. Watch the cobalt-amber
   speckle pattern collapse into a tight cluster as r → 1.

## Parameters to explore

| Parameter | Default | Effect |
|-----------|---------|--------|
| `K` | 1.8 | Coupling strength. K_c = 2γ = 1.0. K < 1.0 → no sync; K = 1.0 → critical; K > 1.0 → partial/full sync |
| `GAMMA` | 0.5 | Lorentzian half-width. Wider spread → higher K_c |
| `N` | 64 | Oscillator count. Mean-field is exact in N → ∞ limit |
| `DT` | 0.025 | Euler step. Reduce to 0.01 if oscillators overshoot (jitter) |
| `Z_SCALE` | 0.35 | Height of order parameter lift. Increase for dramatic effect |

## The AttributeStatistic trick

The all-to-all coupling sum  `(K/N) Σⱼ sin(θⱼ − θᵢ)`  is O(N²) naively.
Kuramoto's mean-field reduction brings it to O(N): store `cos θ` and `sin θ`
on each point, then `AttributeStatistic.Mean` computes the global average in
one node. The order parameter r and mean phase Ψ follow immediately:

    r·cos Ψ = Mean(cos θ)
    r·sin Ψ = Mean(sin θ)
    r       = sqrt(Mean(cos θ)² + Mean(sin θ)²)
    Ψ       = atan2(Mean(sin θ), Mean(cos θ))

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-kuramoto-coupled-phase-oscillators-mean-field-order-parameter-poi-ring-webxr`
