# Python Multi-View Spherical Camera Rig for Gaussian Splatting

**Blender 5.1 · CC0 · Holoflow Studio**

Blender produces arbitrary-quality synthetic multi-view data from any scene in
minutes. This blueprint builds a spherical camera array around a target prop,
renders every view, and writes a `transforms.json` file that a Gaussian
Splatting trainer (nerfstudio Splatfacto, gsplat, or similar) reads directly
to reconstruct a 3D Gaussian Splat without a physical camera setup.

## What the blueprint does

1. **Builds** a demo faceted icosphere as the subject.
2. **Distributes** 64 cameras on a sphere of radius 3 m using the Fibonacci
   golden-angle spiral (even angular coverage; no polar crowding).
3. **Renders** each view to `output/images/XXXXXX.png` via EEVEE Next.
4. **Writes** `output/transforms.json` in nerfstudio format with per-frame
   camera-to-world matrices and pixel-space intrinsics.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full pipeline: rig build + render + transforms.json |
| `record.py` | Viewport animation showing the Fibonacci shell rotating |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions |
| `.expected-artefacts.json` | Expected outputs for CI verification |

## Running

Open Blender 5.1, switch to the Scripting workspace, load `blueprint.py`,
and click **Run Script**.  The script renders all 64 views (~2–5 min on
a mid-range GPU with EEVEE).  Output lands beside the `.blend` file in
`output/`.

To train a Gaussian Splat from the output:

```bash
pip install nerfstudio
ns-train splatfacto --data path/to/output/
```

## Key parameters

| Constant | Default | Meaning |
|----------|---------|---------|
| `N_VIEWS` | 64 | Camera count |
| `RADIUS` | 3.0 | Sphere radius (m) |
| `FOCAL_MM` | 24 | Focal length (mm) |
| `IMG_W / IMG_H` | 800 × 600 | Render resolution |
| `RENDER_SAMPLES` | 16 | EEVEE samples per view |

## Coordinate convention

Blender cameras look toward −Z in local space with +Y up (OpenGL convention).
The NeRF transforms.json uses the same camera convention but expects the
camera-to-world matrix expressed with the trainer's world axes.  The
`blender_to_nerf_c2w()` helper negates columns 1 and 2 of the rotation block
to perform this conversion — see inline comments for details.

## Licence

All code in this directory is CC0 (public domain).  Outside references:

- nerfstudio (MIT) — https://github.com/nerfstudio-project/nerfstudio
- BlenderNeRF (MIT) — https://github.com/maximeraafat/BlenderNeRF
