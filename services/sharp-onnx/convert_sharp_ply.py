#!/usr/bin/env python3
"""convert_sharp_ply.py - Rewrite a SHARP-ONNX PLY as a standard 3DGS PLY.

SHARP's `export_ply` writes a PLY whose `vertex` element carries only the
core gaussian-splat properties (x,y,z, f_dc_0..2, opacity, scale_0..2,
rot_0..3) and then appends SHARP-specific metadata elements after the
vertex block: `extrinsic`, `intrinsic`, `image_size`, `frame`, `disparity`,
`color_space`, `version`. Standard gaussian-splat viewers (Postshot,
SuperSplat, Spark, splat.js, etc.) expect the INRIA-3DGS layout:

    x, y, z, nx, ny, nz,
    f_dc_0, f_dc_1, f_dc_2,
    f_rest_0 .. f_rest_44,   (SH degree 1-3, three channels x 15 coeffs)
    opacity,
    scale_0, scale_1, scale_2,
    rot_0, rot_1, rot_2, rot_3

and a single `vertex` element with no trailing list-property blocks. They
choke on SHARP's trailing metadata.

This script reads the SHARP PLY, projects each vertex into the standard
layout (padding normals and f_rest_* with zeros - SHARP only emits the
DC term of the SH expansion, no view-dependent shading), and writes a
clean PLY. The result is ~4.4x larger on disk (56 -> 248 bytes/vertex)
but loads in every standard splat viewer.

Usage:
    python convert_sharp_ply.py input.ply [-o output.ply]
    python convert_sharp_ply.py --batch <dir>     # convert all *.ply in tree
"""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

import numpy as np


SHARP_VERTEX_FIELDS = [
    "x", "y", "z",
    "f_dc_0", "f_dc_1", "f_dc_2",
    "opacity",
    "scale_0", "scale_1", "scale_2",
    "rot_0", "rot_1", "rot_2", "rot_3",
]

STANDARD_3DGS_FIELDS = (
    ["x", "y", "z", "nx", "ny", "nz"]
    + ["f_dc_0", "f_dc_1", "f_dc_2"]
    + [f"f_rest_{i}" for i in range(45)]
    + ["opacity", "scale_0", "scale_1", "scale_2"]
    + ["rot_0", "rot_1", "rot_2", "rot_3"]
)


def parse_sharp_header(data: bytes) -> tuple[int, int, list[str]]:
    """Return (header_end_byte, vertex_count, vertex_property_names).

    Raises ValueError if header doesn't look like a SHARP PLY.
    """
    end_marker = b"\nend_header\n"
    idx = data.find(end_marker)
    if idx < 0:
        raise ValueError("no end_header found in PLY")
    header_end = idx + len(end_marker)
    header = data[:idx].decode("ascii", errors="replace")

    vertex_count = 0
    props: list[str] = []
    in_vertex = False
    for line in header.splitlines():
        line = line.strip()
        if line.startswith("element vertex "):
            vertex_count = int(line.split()[2])
            in_vertex = True
        elif line.startswith("element ") and in_vertex:
            in_vertex = False  # vertex props done; ignore subsequent elements
        elif in_vertex and line.startswith("property "):
            parts = line.split()
            if parts[1] != "float":
                raise ValueError(
                    f"unexpected property type in vertex block: {line!r}"
                )
            props.append(parts[2])

    if not props:
        raise ValueError("no vertex properties found in header")
    return header_end, vertex_count, props


def build_standard_header(vertex_count: int) -> bytes:
    lines = [
        "ply",
        "format binary_little_endian 1.0",
        f"element vertex {vertex_count}",
    ]
    for name in STANDARD_3DGS_FIELDS:
        lines.append(f"property float {name}")
    lines.append("end_header")
    return ("\n".join(lines) + "\n").encode("ascii")


def convert(in_path: Path, out_path: Path) -> tuple[int, int, int]:
    """Return (vertex_count, in_bytes, out_bytes)."""
    raw = in_path.read_bytes()
    header_end, n_verts, props = parse_sharp_header(raw)

    missing = [f for f in SHARP_VERTEX_FIELDS if f not in props]
    if missing:
        raise ValueError(
            f"input PLY missing expected SHARP fields: {missing}"
        )

    floats_per_vert = len(props)
    vertex_bytes = n_verts * floats_per_vert * 4
    body = raw[header_end : header_end + vertex_bytes]
    if len(body) != vertex_bytes:
        raise ValueError(
            f"expected {vertex_bytes} bytes of vertex data, got {len(body)}"
        )

    verts = np.frombuffer(body, dtype=np.float32).reshape(n_verts, floats_per_vert)

    # Build column index map - SHARP property order may vary slightly.
    col = {name: idx for idx, name in enumerate(props)}

    out = np.zeros((n_verts, len(STANDARD_3DGS_FIELDS)), dtype=np.float32)
    for i, name in enumerate(STANDARD_3DGS_FIELDS):
        if name in col:
            out[:, i] = verts[:, col[name]]
        # nx, ny, nz and f_rest_* stay zero - SHARP doesn't emit normals
        # or higher-order SH coefficients.

    header_bytes = build_standard_header(n_verts)
    out_path.write_bytes(header_bytes + out.tobytes())
    return n_verts, len(raw), out_path.stat().st_size


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert SHARP-ONNX PLY to standard 3DGS PLY.",
    )
    parser.add_argument("input", type=Path, nargs="?")
    parser.add_argument("-o", "--output", type=Path, default=None)
    parser.add_argument(
        "--batch",
        type=Path,
        help="Convert every *.ply under this tree in place "
        "(writes <name>_std.ply alongside each).",
    )
    parser.add_argument(
        "--suffix",
        default="_std",
        help="Suffix appended to converted filenames (default: _std).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-convert even if output file already exists.",
    )
    args = parser.parse_args()

    if args.batch:
        plys = [
            p for p in args.batch.rglob("*.ply")
            if not p.stem.endswith(args.suffix)
        ]
        print(f"Found {len(plys)} candidate PLYs under {args.batch}")
        ok = 0
        skip = 0
        fail = 0
        for src in plys:
            dst = src.with_name(src.stem + args.suffix + ".ply")
            if dst.exists() and not args.overwrite:
                skip += 1
                continue
            try:
                n, _, out_bytes = convert(src, dst)
                ok += 1
                print(f"  {src.name} -> {dst.name}  ({n:,} gaussians, {out_bytes/1024/1024:.0f} MB)")
            except Exception as err:
                fail += 1
                print(f"  FAIL {src.name}: {err}")
        print(f"\nDone - {ok} converted, {skip} already done, {fail} failed.")
        return 0 if fail == 0 else 2

    if not args.input:
        parser.error("input is required when not using --batch")
    out = args.output or args.input.with_name(args.input.stem + args.suffix + ".ply")
    n, in_bytes, out_bytes = convert(args.input, out)
    print(
        f"{args.input.name} -> {out.name}  "
        f"{n:,} gaussians  "
        f"{in_bytes/1024/1024:.0f} MB -> {out_bytes/1024/1024:.0f} MB"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
