# Screen Recording Notes — GN Mesh to Volume: Organic SDF Blob Fusion

**Target file**: `public/library/videos/geometry-nodes/gn-mesh-to-volume-sdf-blob-fusion/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to Record

1. **Run blueprint.py** — Open the Scripting workspace, paste `blueprint.py`, run it. Let the GN tree build. Hit F12 to see the rendered blob. (~2 min)

2. **Explore the Geometry Nodes editor** — Switch to the Geometry Node editor. Pan the tree slowly left to right: Ico Sphere → Distribute Points on Faces → UV Sphere → Instance on Points → Realise Instances → Mesh to Volume → Volume to Mesh → Set Shade Smooth → Set Material. Hold D and drag over each node to name it on screen. (~90 sec)

3. **Tune Threshold live** — Select the `blob_fusion` carrier object. In Properties → Modifier → BlobFusion modifier, drag the **Threshold** slider from 0.0 to 0.15 slowly. Pause at 0.0 (isolated spheres), 0.09 (fused blob), 0.14 (over-inflated). (~60 sec)

4. **Tune Voxel Size** — Drag **Voxel Size** from 0.10 (blocky voxels) down to 0.03 (smooth, slower). Pause for the viewport to update at each step. (~60 sec)

5. **Inspect Mesh to Volume node** — Click the node, show the N-panel socket values. Point at Interior Band Width and Exterior Band Width. (~30 sec)

6. **GLB export confirmation** — File → Export → glTF 2.0, show the export dialogue with Draco enabled, hit Export. (~30 sec)

## Editing Notes

- Trim head/tail dead air.
- Add a lower-third text overlay: "GN Mesh to Volume → SDF Blob Fusion | Blender 5.1".
- No background music needed for a technical tutorial.
- Target runtime: 5–8 minutes at 1× speed; speed up the blueprint.py execution to 4× via OBS replay buffer.

## Storage

Place finished file at:
```
public/library/videos/geometry-nodes/gn-mesh-to-volume-sdf-blob-fusion/screen.mp4
```
Do not commit the `.mp4` binary to git. Upload to the studio media bucket and reference via CDN URL in the tutorial component.
