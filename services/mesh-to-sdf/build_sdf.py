"""Mesh → 3D SDF binary for the Waveguide Forge.

Loads a GLB / OBJ / STL, voxelises with trimesh, distance-transforms inside
and outside, and writes a single .bin file the browser can upload as a
Float32 ``THREE.Data3DTexture``.

File layout (all little-endian):
    [4 bytes] magic 'SDF1'
    [4 bytes] uint32  resolution_x
    [4 bytes] uint32  resolution_y
    [4 bytes] uint32  resolution_z
    [12 bytes] float32 bounds_min[3]   (mm)
    [12 bytes] float32 bounds_max[3]   (mm)
    [rest]     float32 sdf[res_z][res_y][res_x] in C order, signed mm

Inside = negative, outside = positive. The shader converts to its preferred
sign convention.

Run with the unique3d-py311 conda env (already has trimesh + scipy):

    D:\\Users\\dimon\\anaconda3\\envs\\unique3d-py311\\Scripts\\python.exe ^
        D:\\The_Hangar\\tools\\mesh-to-sdf\\build_sdf.py ^
        --input D:\\The_Hangar\\sculptures\\biomech.glb ^
        --output D:\\The_Hangar\\sculptures\\biomech.sdf.bin ^
        --resolution 128 ^
        --pad-mm 5
"""
from __future__ import annotations

import argparse
import struct
import sys
from pathlib import Path

import numpy as np
import trimesh
from scipy.ndimage import distance_transform_edt


MAGIC = b"SDF1"


def build(mesh_path: Path, resolution: int, pad_mm: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    mesh = trimesh.load(mesh_path, force="mesh")
    if not isinstance(mesh, trimesh.Trimesh):
        raise SystemExit(f"input must be a single mesh, got {type(mesh).__name__}")

    bounds = mesh.bounds.copy()  # 2x3 [min; max]
    bounds[0] -= pad_mm
    bounds[1] += pad_mm
    extent = bounds[1] - bounds[0]
    print(f"[sdf] extent={extent} mm, resolution={resolution}", flush=True)

    # Voxelise at the chosen resolution along the longest axis to keep voxels
    # roughly cubic; the other two axes use proportional resolution.
    longest = float(extent.max())
    pitch = longest / resolution
    res_xyz = np.maximum(np.ceil(extent / pitch).astype(np.int32), 1)
    print(f"[sdf] pitch={pitch:.4f} mm, voxel grid={res_xyz}", flush=True)

    grid = mesh.voxelized(pitch=pitch)
    occ = grid.matrix.astype(np.uint8)  # binary

    # Pad to res_xyz so the bounds box aligns with our writeout (voxelized()
    # is tight; we want some empty space around so the shader doesn't sample
    # exactly on the surface).
    full = np.zeros(tuple(res_xyz), dtype=np.uint8)
    off = ((res_xyz - np.array(occ.shape)) // 2).astype(np.int32)
    full[
        off[0] : off[0] + occ.shape[0],
        off[1] : off[1] + occ.shape[1],
        off[2] : off[2] + occ.shape[2],
    ] = occ

    # Signed distance via two EDTs.
    inside  = distance_transform_edt(full)
    outside = distance_transform_edt(1 - full)
    sdf_voxels = (outside - inside).astype(np.float32)
    sdf_mm = sdf_voxels * pitch
    print(
        f"[sdf] range = [{float(sdf_mm.min()):+.2f}, {float(sdf_mm.max()):+.2f}] mm",
        flush=True,
    )
    return sdf_mm, bounds[0].astype(np.float32), bounds[1].astype(np.float32)


def save(path: Path, sdf: np.ndarray, bmin: np.ndarray, bmax: np.ndarray) -> None:
    rx, ry, rz = sdf.shape
    with open(path, "wb") as f:
        f.write(MAGIC)
        f.write(struct.pack("<III", rx, ry, rz))
        f.write(bmin.astype(np.float32).tobytes())
        f.write(bmax.astype(np.float32).tobytes())
        # Write in C order (z, y, x → row-major) to match the browser's
        # Float32Array → Data3DTexture convention.
        f.write(sdf.astype(np.float32).tobytes(order="C"))
    print(f"[sdf] wrote {path} ({path.stat().st_size / 1e6:.2f} MB)", flush=True)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, type=Path)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--resolution", type=int, default=128)
    ap.add_argument("--pad-mm", type=float, default=5.0)
    args = ap.parse_args(argv)

    sdf, bmin, bmax = build(args.input, args.resolution, args.pad_mm)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    save(args.output, sdf, bmin, bmax)
    return 0


if __name__ == "__main__":
    sys.exit(main())
