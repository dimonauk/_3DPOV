# Modifier — Cast: Cartoon Squash-and-Stretch (Blender 5.1)

Stack `Cast(CUBOID)` and `Cast(SPHERE)` modifiers on a UV sphere blob to drive
Disney-style squash-and-stretch via keyframed `factor` values — no rig, no shape
keys, no driver setup.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Builds scene, adds modifier stack, keyframes animation, exports GLBs |
| `record.py` | Renders animated viewport to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output file manifest |

## Quick start

```bash
# Build scene and export GLBs
blender --background --python blueprint.py

# Render viewport.mp4 (requires cartoon_blob.blend from above step)
blender cartoon_blob.blend --background --python record.py
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `SQUASH_FACTOR` | `1.0` | CastCuboid blend at peak squash (frame 12) |
| `STRETCH_FACTOR` | `1.8` | SphereCast overshoot at stretch apex (frame 30) — try `2.5` for extreme cartoon |
| `FRAME_SQUASH` | `12` | Timeline frame of maximum squash |
| `FRAME_STRETCH` | `30` | Timeline frame of maximum stretch |
| `SUBDIV_LEVELS` | `2` | Simple subdivision depth — increase for smoother cast corners |
| `CAST_RADIUS` | `BLOB_RADIUS × 2.8` | Influence sphere — must cover all blob verts |

## Technique

**Stack**: Simple Subdiv → Cast(CUBOID) → Cast(SPHERE)

**Why Simple subdivision first?**
Catmull-Clark subdivision moves original vertices toward the limit surface
(shrinks them slightly). If Cast runs on a Catmull-Clark-subdivided mesh,
`factor=1.0` targets a slightly-too-small sphere. Simple subdivision only
splits edges without repositioning, so the Cast target radius matches
`BLOB_RADIUS` exactly.

**Why `use_z=False` on CastCuboid?**
The Z axis is controlled separately via `object.scale.z` keyframes for
explicit volume compensation. At squash peak: `scale = (1.30, 1.30, 0.40)`.
At stretch peak: `scale = (0.85, 0.85, 1.50)`. Both approximate the original
volume `(4/3)π r³`.

**Cast factor > 1.0**
The Cast modifier accepts `factor` up to 10.0. At 1.8 the blob crown extends
approximately 1.4× normal height — a teardrop. At 2.5+ it becomes an
aggressive cartoon spike.

## Outputs

- `cartoon_blob.blend` — live modifier stack, animated
- `cartoon_blob_squash.glb` — snapshot at frame 12 (squash pose)
- `cartoon_blob_stretch.glb` — snapshot at frame 30 (stretch pose)
- `public/library/videos/modifiers/modifier-cast-sphere-cuboid-cartoon-squash/viewport.mp4`
- `public/library/videos/modifiers/modifier-cast-sphere-cuboid-cartoon-squash/screen.mp4`
