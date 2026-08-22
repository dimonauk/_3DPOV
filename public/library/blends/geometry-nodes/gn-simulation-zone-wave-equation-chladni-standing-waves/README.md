# GN Simulation Zone — 2D Wave Equation: Chladni Standing Waves

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

Ernst Chladni pressed a violin bow against the edge of a metal plate
dusted with fine sand in 1787 and watched the sand jump to fixed lines —
the **nodal lines** — where the plate did not vibrate. Each resonance
frequency produced a different symmetric pattern. This tutorial reproduces
those patterns computationally using a Geometry Nodes Simulation Zone that
integrates the 2-D scalar wave equation one Leapfrog step per frame.

## Physics

The wave equation `∂²u/∂t² = c²∇²u` on a square plate with fixed edges
(u = 0 at all boundaries). Discretised as a Leapfrog / Störmer-Verlet scheme:

```
u[t+1] = 2·u[t] − u[t−1] + C_SQ · ∇²ₕu[t]
```

`∇²ₕu = 4·(BlurAttribute_mean − u)` recovers the 5-point finite-difference
Laplacian on a unit-spacing quad grid. CFL stability requires `C_SQ ≤ 0.5`;
this blueprint uses `C_SQ = 0.24` for safety.

## Chladni mode (2, 3)

The seeded normal mode

```
u₀(col, row) = A · sin(2π·col / (N−1)) · sin(3π·row / (N−1))
```

is an eigenfunction of `∇²ₕ` on the fixed-end plate. Setting `u_prev = u_curr`
gives zero initial velocity. The plate oscillates with period ≈ 44 frames;
nodal lines (u = 0) form a cross of 2 vertical + 2 horizontal lines —
the classic cruciform Chladni figure. To excite other modes, change `MODE_M`
and `MODE_N` in the parameters block.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy build: mesh, attributes, GN tree, material |
| `record.py` | Render `viewport.mp4` (120 frames, EEVEE Next, H.264) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `hf_chladni_wave.blend` | Saved Blender scene (run blueprint.py to generate) |

## Cross-references

- [Blur Attribute as Discrete Laplacian](/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion)
- [Leapfrog State Management: Spring-Mass Cloth](/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr)
- [BZ Oregonator: Oscillatory vs Stationary](/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves)
- [Coupled Pendulums & Normal Modes](/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance)

## Outside sources

- Blender Manual — Simulation Zone (CC-BY-SA 4.0 · Blender Foundation)
  <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html>
- Blender Manual — Blur Attribute (CC-BY-SA 4.0 · Blender Foundation)
  <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/blur_attribute.html>
- KhronosGroup/glTF-Blender-IO (Apache-2.0 · Khronos Group)
  <https://github.com/KhronosGroup/glTF-Blender-IO>

## Variation ideas

- **Mode (3,3):** symmetric four-quadrant pattern with diagonal nodal lines.
- **Mixed excitation:** add a second `sin·sin` term with a different mode
  to produce a superposition — not a standing wave, but chaotic nodal migration.
- **Damping:** subtract a fraction `d·(u_curr − u_prev)` from `u_next` each
  step; the amplitude decays exponentially towards the sand-plate limit.
- **GLB export:** bake to 120 per-frame `.glb` files via
  `bpy.ops.export_scene.gltf(export_apply=True)` — Three.js morph targets
  play the wave animation in WebXR without re-simulating.
