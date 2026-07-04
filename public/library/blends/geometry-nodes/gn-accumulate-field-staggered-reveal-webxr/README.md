# GN Accumulate Field — Staggered Hex-Pillar Reveal Grid

**Blender 5.1 · Geometry Nodes · CC0**

A Geometry Nodes setup that drives a directed wave of rising hexagonal pillars
across a Poisson-scattered point field.  Every pillar rises at a different time
because `Accumulate Field` ranks the scattered points by their world-space X
coordinate.  That rank, normalised to `[0, 1)` and multiplied by `STAGGER_DUR`,
gives each pillar a unique start-time offset.  Scene Time then drives each
pillar's `progress = clamp((now − offset) / RISE_TIME, 0, 1)`, which scales its
Z axis from 0 to 1.  The result is a left-to-right reveal wave suitable for
WebXR scene-entry animations.

---

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `DENSITY` | 5.0 pts/m² | Poisson scatter density — ~125 pillars on a 5×5 grid |
| `STAGGER_DUR` | 3.0 s | Seconds between first and last pillar starting |
| `RISE_TIME` | 0.40 s | Rise duration per individual pillar |
| `PILLAR_H` | 0.50 m | Full pillar height |
| `PILLAR_R` | 0.09 m | Hex pillar inscribed radius |

All three time parameters are exposed as GN group inputs and are keyframeable
from the modifier panel.

---

## Sort Index trick

Without `Sort Index`, `Accumulate Field` assigns `Leading` values in
Blender's internal point traversal order, which does not follow any
spatial direction.  Setting `Sort Index = floor(position.X × 100)` maps
world X to an integer rank: leftmost pillars get rank 0, rightmost get
rank N-1.  The reveal wave then moves reliably from −X to +X regardless
of scatter seed or density.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy GN setup — run with `blender --background --python blueprint.py` |
| `record.py` | EEVEE animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

---

## Outside sources

- **Blender Foundation** — Accumulate Field manual
  <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/field/accumulate_field.html>
  CC BY-SA 4.0 · sibling: <https://projects.blender.org>

- **Robert Guetzkow** — blender-python-examples (MIT)
  <https://github.com/robertguetzkow/blender-python-examples>
  Related: <https://github.com/robertguetzkow/blender-addon-clean-up-imported-materials>
