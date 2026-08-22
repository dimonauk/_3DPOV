# GN Set Handle Positions — Parametric Bezier S-Curve Taper Ribbon
**Blender 5.1 · Holoflow Studio · CC0**

Demonstrates `Set Handle Positions` — the Geometry Nodes node that lets you
control bezier tangent handles programmatically rather than by hand-dragging
in the viewport. A two-point `Curve Line` is transformed into a smooth S-curve
by setting exactly two operative handles: the start point's right handle and
the end point's left handle. A bell-curve radius taper (`sin(t·π)`) driven by
`Spline Parameter` narrows the ribbon at both ends and widens it at the centre.
The result exports as a Draco-compressed GLB ready for WebXR delivery.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — runs in Blender 5.1 headless, produces `s_curve_ribbon.glb` |
| `record.py` | Viewport animation render (Handle_Spread 0→0.55, camera orbit, EEVEE, MP4) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the tutorial screen recording |
| `s_curve_ribbon.glb` | Generated GLB (run blueprint.py to produce) |

---

## Key Technique

```
Curve Line → Set Handle Type (FREE) → Set Handle Positions (P0 Right)
→ Set Handle Positions (P1 Left) → Set Curve Radius (sin taper)
→ Resample Curve → Curve to Mesh (line profile) → output
```

**Critical prerequisite:** `Set Handle Type` must be set to `FREE` on all control
points before `Set Handle Positions` is evaluated, otherwise Blender recomputes
AUTO/BEZIER handles and discards the positions you specified.

---

## Parameters

| Socket | Default | Range | Effect |
|---|---|---|---|
| `Handle_Spread` | 0.55 | 0–2 | Lateral offset of S-curve handles; 0 = straight line |
| `Profile_Radius` | 0.032 | 0.004–0.25 | Half-width of the flat ribbon cross-section |

---

## Credits

- Blender Manual — Set Handle Positions node:
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_handle_positions.html
  © Blender Foundation, CC-BY-SA-4.0

- njanakiev/blender-scripting (bpy patterns):
  https://github.com/njanakiev/blender-scripting
  © Nikolai Janakiev, MIT licence

All blueprint and record scripts authored by Holoflow Studio, released CC0.
