# GN — Offset Point in Curve: Articulated Chain Links

**Blender 5.1 · CC0 · Holoflow Studio**

Parametric chain loop on any Bezier path. Each torus link is oriented by
querying its next-door neighbour on the resampled curve via
**Offset Point in Curve**, the Geometry Nodes primitive for exact
look-ahead indexing. Adjacent links are rotated 90° around the local
chain direction to produce the interlocking flat/rolo silhouette.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full GN tree + GLB export — run once in Scripting workspace |
| `record.py` | Viewport animation → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `chain_links.glb` | Draco-6 compressed chain (40 links, ~320 KB) |

## Quick start

1. Open Blender 5.1, switch to the **Scripting** workspace.
2. Open `blueprint.py`, click **Run Script**.
3. The `chain_path` object appears with a **ChainLinks** GN modifier.
4. Adjust `Link Count`, `Major Radius`, `Minor Radius` in the modifier panel.
5. File → Save As → `chain_links.blend`.
6. Confirm `chain_links.glb` was written to the same directory.

## Key nodes

| Node | Role |
|---|---|
| `Resample Curve` | Uniform arc-length points so all links are equally spaced |
| **`Offset Point in Curve`** | Returns the index of the next point on the spline |
| `Evaluate at Index` | Reads the Position field at that returned index |
| `Vector Math SUBTRACT` | Computes per-link chain direction |
| `Align Euler to Vector` | Orients each torus hole-axis along the chain |
| `Rotate Euler (AXIS_ANGLE)` | Tilts alternating links 90° for interlocking appearance |
| `Instance on Points` | Places one torus per curve point |
| `Realize Instances` | Collapses to mesh before material assignment |

## Adapting the chain path

Replace the Bezier circle with any curve object and re-assign it as the
modifier's Geometry input. Suitable paths include:

- **Figure-8 loop** — two `bezier_circle_add` curves, joined with `Join Curves`
- **Custom necklace shape** — drawn in the curve editor with Edit Mode
- **Animated path** — keyframe the curve's control points for a moving chain

## Studio cross-references

- [Curve to Points bead necklace tutorial](/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align)
- [Sample Curve railway sleeper tutorial](/tutorials/blender-tutorial-gn-sample-curve-track-sleepers)
- [Instance on Points tutorial](/tutorials/blender-tutorial-gn-instance-on-points)
- [VRM stretchy IK rigging (spring-bone visual guide)](/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm)

## Outside sources

- **Blender Manual — Offset Point in Curve**:
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/topology/offset_point_in_curve.html>
  (CC-BY-SA-4.0 · Blender Foundation)

- **njanakiev/blender-scripting** (MIT · Nikolai Janakiev):
  <https://github.com/njanakiev/blender-scripting>
  Companion repo: <https://github.com/njanakiev>
