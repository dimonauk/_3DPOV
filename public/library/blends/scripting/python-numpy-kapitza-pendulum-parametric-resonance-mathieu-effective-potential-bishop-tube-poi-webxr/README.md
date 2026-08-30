# Kapitza Pendulum — Parametric Resonance & Effective Potential

**Blender 5.1 | Python + numpy | Poi Head | CC0**

A pendulum whose pivot oscillates rapidly in the vertical direction, producing
a cobalt–amber Bishop-tube poi head whose coiling reveals whether the
Kapitza stability criterion `(aΩ)² > 2gL` is met.

---

## Physics

The pendulum length is `L = 1.0 m`.  The pivot moves as `y_p(t) = a·cos(Ωt)`.
The Euler–Lagrange equation gives:

```
θ̈ = −(g − a·Ω²·cos(Ωt)) / L · sin θ
```

`θ = 0` is the natural hanging position; `θ = π` is the inverted (upward) position.

In the Kapitza regime (`Ω >> ω₀ = √(g/L) ≈ 3.13 rad/s`), fast oscillations
average out to an effective potential:

```
U_eff(θ) = −m·g·L·cos θ  +  m·(aΩ)² / (4L) · sin²θ
```

The inverted position is a *stable minimum* of `U_eff` when:

```
(aΩ)² > 2gL    →    aΩ > √(2gL) ≈ 4.43 m/s    [g = 9.81, L = 1.0]
```

## Shape Keys

| Key | θ₀ | aΩ | Description |
|---|---|---|---|
| Basis | π − 0.05 | 5.00 | Kapitza-stable, tight coil near top |
| SK_Border | π − 0.05 | 4.45 | At threshold — large slow wobble |
| SK_Wide | π − 0.30 | 5.00 | Wider initial deviation, wider loops |
| SK_Fall | π − 0.05 | 2.00 | Below threshold — pendulum falls down |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Run in Blender 5.1 Script Editor to build the GLB |
| `record.py` | Viewport-animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar screen-capture instructions |
| `.expected-artefacts.json` | Artefact list for CI / inventory checks |

## Running

1. Open Blender 5.1.  New General scene.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` and press **Run Script** (Alt+P).
4. The mesh `Kapitza_Poi` appears in the viewport with cobalt–amber vertex colour.
5. Open **Properties → Object Data → Shape Keys** to morph between stability regimes.
6. Run `record.py` to render `viewport.mp4`.

## Mathieu connection

Linearising about `θ = π` (inverted), writing `θ = π + φ` for small `φ`:

```
φ̈ = +(g − a·Ω²·cos(Ωt)) / L · φ
```

Substituting `τ = Ωt/2`, `δ = −4(ω₀/Ω)²`, `q = 2a·ω₀²/Ω²`:

```
d²φ/dτ² + (δ − 2q cos 2τ) φ = 0      ← Mathieu equation
```

Stability corresponds to a STABLE region in the Strutt / Ince–Strutt diagram.

## Attribution

- **Arthur Stephenson** (1908) "On a new type of dynamical stability" — first prediction.  Public domain.
- **Pyotr Kapitza** (1951) "Dynamic stability of a pendulum when its point of suspension vibrates" — experimental demonstration.  Equations public domain.
- **Landau & Lifshitz**, *Mechanics* §30 (1960) — effective potential derivation.  Public domain treatment.
