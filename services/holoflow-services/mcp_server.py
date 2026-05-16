"""
mcp_server.py
=============
FastMCP server that exposes HoloFlow + Pixelorama capabilities as MCP tools.

Any MCP client (Claude Desktop, Claude Code, Cursor, CrewAI, custom agents)
can call these as native tools. The same operations are available via HTTP
from the FastAPI sidecar (main.py) — this is the agent-facing surface.

Tools exposed:

    Mesh / printing
      lithophane(image_path, max_depth_mm, base_thickness_mm, width_mm, invert)
      voxelize_mesh(mesh_path, pitch_mm)
      simplify_mesh(mesh_path, target_faces)
      repair_mesh(mesh_path)
      inspect_mesh(mesh_path) -> dict

    Pixelorama CLI
      pixelorama_version() -> str
      pixelorama_inspect(pxo_path) -> {size, framecount}
      pixelorama_export(pxo_path, output_format, scale, spritesheet, frames, ...)
      pixelorama_launch(file_path)

    Image / segmentation
      segment_background(image_path, threshold)
      extract_light_trails(image_path, threshold, min_length)

    Audio
      detect_beats(audio_file) -> {bpm, beats}

    Inventory
      list_captures(limit) -> [files]
      list_pixelorama_extensions() -> [extensions]
      list_pixelorama_exports(limit) -> [exports]

Run as stdio (for Claude Desktop / Code):
    python mcp_server.py

Or as HTTP-streamable (for browser/HTTP MCP clients):
    fastmcp run mcp_server.py --transport streamable-http --port 8770
"""

from __future__ import annotations

import io
import subprocess
import tempfile
from dataclasses import asdict
from pathlib import Path
from typing import Optional

try:
    from fastmcp import FastMCP
    FASTMCP_AVAILABLE = True
except ImportError:
    FASTMCP_AVAILABLE = False
    # Fallback to the lower-level mcp SDK
    try:
        from mcp.server.fastmcp import FastMCP  # mcp 1.27+ ships a FastMCP shim
        FASTMCP_AVAILABLE = True
    except ImportError:
        FastMCP = None  # type: ignore

if FastMCP is None:
    raise SystemExit(
        "Neither fastmcp nor mcp.server.fastmcp is available. "
        "Run: pip install fastmcp"
    )

# Reuse the sidecar's helper functions and paths
import sys
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

import pixelorama_bridge as pb
from mqtt_bus import (
    emit_lithophane_generated,
    emit_mesh_voxelized,
    emit_mesh_simplified,
    emit_mesh_repaired,
    emit_pixelorama_exported,
    emit_pixelorama_launched,
)

# Probe optional Python deps with the same pattern as main.py
def _check(name, importer):
    try:
        importer()
        return True
    except Exception:
        return False

HAS_TRIMESH    = _check("trimesh",    lambda: __import__("trimesh"))
HAS_OPEN3D     = _check("open3d",     lambda: __import__("open3d"))
HAS_LITHOPHANE = _check("lithophane", lambda: __import__("lithophane"))
HAS_SKIMAGE    = _check("skimage",    lambda: __import__("skimage"))
HAS_CV2        = _check("cv2",        lambda: __import__("cv2"))
HAS_AUBIO      = _check("aubio",      lambda: __import__("aubio"))


mcp = FastMCP(
    "holoflow-mesh-studio",
    instructions=(
        "HoloFlow Mesh Studio tools for Dimona's light-painting → sculpture pipeline. "
        "Drive Pixelorama (with Voxelorama + 18 extensions) for batch image/spritesheet/GIF "
        "exports. Convert photos to lithophanes, voxelize meshes, simplify and repair STLs "
        "for SLA dropship printing. All paths must be absolute Windows paths."
    ),
)


# ============================================================================
# Mesh / printing tools
# ============================================================================

@mcp.tool()
def lithophane(
    image_path: str,
    max_depth_mm: float = 3.0,
    base_thickness_mm: float = 0.8,
    width_mm: float = 150.0,
    invert: bool = False,
) -> dict:
    """Convert any 2D image to a relief STL where brightness controls thickness.

    Output STL is saved to the bridge scratch folder and the path returned.
    Perfect for CR-30 belt printer wall art.
    """
    if not HAS_LITHOPHANE:
        return {"error": "lithophane not installed"}
    import lithophane as lp
    import numpy as np
    from PIL import Image

    in_path = Path(image_path)
    if not in_path.exists():
        return {"error": f"image not found: {image_path}"}

    img = Image.open(in_path).convert("L")
    arr = np.array(img)
    if invert:
        arr = 255 - arr

    out_path = pb.BRIDGE_SCRATCH / f"{in_path.stem}_lithophane.stl"
    try:
        lp.lithophane(
            input_image=arr,
            output_path=str(out_path),
            width_mm=width_mm,
            max_depth_mm=max_depth_mm,
            base_thickness_mm=base_thickness_mm,
        )
    except Exception as e:
        return {"error": f"lithophane failed: {e}"}

    emit_lithophane_generated(str(in_path), str(out_path), max_depth_mm)
    return {
        "input": str(in_path),
        "output": str(out_path),
        "max_depth_mm": max_depth_mm,
        "base_thickness_mm": base_thickness_mm,
        "width_mm": width_mm,
    }


@mcp.tool()
def voxelize_mesh(mesh_path: str, pitch_mm: float = 10.0, fill: bool = True) -> dict:
    """Voxelize an STL/GLB/OBJ to a 3D occupancy grid at the given pitch.

    Returns shape, occupied voxel count, fill ratio, and path to the .npy grid.
    """
    if not HAS_TRIMESH:
        return {"error": "trimesh not installed"}
    import trimesh
    import numpy as np

    p = Path(mesh_path)
    if not p.exists():
        return {"error": f"mesh not found: {mesh_path}"}

    mesh = trimesh.load(p, force="mesh")
    voxelized = mesh.voxelized(pitch=pitch_mm / 1000.0)
    if fill:
        voxelized.fill()

    grid = voxelized.matrix.astype(np.uint8)
    npy_path = pb.BRIDGE_SCRATCH / f"{p.stem}_voxels_{int(pitch_mm)}mm.npy"
    np.save(npy_path, grid)

    occupied = int(grid.sum())
    emit_mesh_voxelized(str(p), list(grid.shape), occupied)
    return {
        "input": str(p),
        "output": str(npy_path),
        "shape": list(grid.shape),
        "occupied_voxels": occupied,
        "total_voxels": int(grid.size),
        "fill_ratio": occupied / max(1, grid.size),
        "pitch_mm": pitch_mm,
    }


@mcp.tool()
def simplify_mesh(mesh_path: str, target_faces: int = 20000) -> dict:
    """Reduce a mesh's poly count via niimath QEM (or trimesh quadric as fallback).

    Critical before SLA upload — most farms reject >1M-poly meshes.
    """
    import shutil as _sh
    p = Path(mesh_path)
    if not p.exists():
        return {"error": f"mesh not found: {mesh_path}"}

    out_path = pb.BRIDGE_SCRATCH / f"{p.stem}_simplified_{target_faces}f.stl"

    if _sh.which("niimath"):
        try:
            subprocess.run(
                ["niimath", str(p), "-mesh-simplify", str(target_faces), str(out_path)],
                check=True, capture_output=True, timeout=120,
            )
            if out_path.exists():
                emit_mesh_simplified(str(p), target_faces, str(out_path))
                return {"input": str(p), "output": str(out_path),
                        "target_faces": target_faces, "method": "niimath QEM"}
        except subprocess.CalledProcessError:
            pass

    if not HAS_TRIMESH:
        return {"error": "neither niimath nor trimesh available"}
    import trimesh
    mesh = trimesh.load(p, force="mesh")
    simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
    simplified.export(out_path)
    emit_mesh_simplified(str(p), target_faces, str(out_path))
    return {"input": str(p), "output": str(out_path),
            "target_faces": target_faces, "method": "trimesh quadric"}


@mcp.tool()
def repair_mesh(mesh_path: str) -> dict:
    """Make a mesh watertight + manifold. Uses open3d primary, trimesh fallback."""
    if not (HAS_OPEN3D or HAS_TRIMESH):
        return {"error": "neither open3d nor trimesh installed"}

    p = Path(mesh_path)
    if not p.exists():
        return {"error": f"mesh not found: {mesh_path}"}

    out_path = pb.BRIDGE_SCRATCH / f"{p.stem}_repaired.stl"

    if HAS_OPEN3D:
        import open3d as o3d
        mesh = o3d.io.read_triangle_mesh(str(p))
        mesh.compute_vertex_normals()
        mesh.remove_duplicated_vertices()
        mesh.remove_duplicated_triangles()
        mesh.remove_degenerate_triangles()
        mesh.remove_non_manifold_edges()
        try:
            mesh = o3d.t.geometry.TriangleMesh.from_legacy(mesh).fill_holes().to_legacy()
        except Exception:
            pass
        o3d.io.write_triangle_mesh(str(out_path), mesh)
        method = "open3d"
    else:
        import trimesh
        mesh = trimesh.load(p, force="mesh")
        trimesh.repair.fix_normals(mesh)
        trimesh.repair.fill_holes(mesh)
        trimesh.repair.fix_inversion(mesh)
        mesh.export(out_path)
        method = "trimesh"

    # Verify
    is_watertight = False
    if HAS_TRIMESH:
        import trimesh as _tm
        try:
            check = _tm.load(out_path, force="mesh")
            is_watertight = bool(check.is_watertight)
        except Exception:
            pass

    emit_mesh_repaired(str(p), is_watertight, str(out_path))
    return {"input": str(p), "output": str(out_path),
            "method": method, "is_watertight": is_watertight}


@mcp.tool()
def inspect_mesh(mesh_path: str) -> dict:
    """Read mesh metadata: vertex/face count, watertight, volume, bbox, surface area."""
    if not HAS_TRIMESH:
        return {"error": "trimesh not installed"}
    import trimesh
    p = Path(mesh_path)
    if not p.exists():
        return {"error": f"mesh not found: {mesh_path}"}
    mesh = trimesh.load(p, force="mesh")
    return {
        "input": str(p),
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "is_watertight": bool(mesh.is_watertight),
        "is_winding_consistent": bool(mesh.is_winding_consistent),
        "is_volume": bool(mesh.is_volume),
        "volume_mm3": float(mesh.volume) if mesh.is_volume else None,
        "surface_area_mm2": float(mesh.area),
        "bbox_min_mm": [float(x) for x in mesh.bounds[0]],
        "bbox_max_mm": [float(x) for x in mesh.bounds[1]],
        "euler_number": int(mesh.euler_number),
    }


# ============================================================================
# Pixelorama CLI tools
# ============================================================================

@mcp.tool()
def pixelorama_version() -> dict:
    """Return Pixelorama's version string via CLI invocation."""
    r = pb._run_pixelorama_cli(["--version"], timeout_s=15)
    return asdict(r)


@mcp.tool()
def pixelorama_inspect(pxo_path: str) -> dict:
    """Inspect a .pxo project's dimensions and frame count without opening the GUI."""
    p = Path(pxo_path)
    if not p.exists():
        return {"error": f"file not found: {pxo_path}"}
    r = pb._run_pixelorama_cli(["--size", "--framecount"], files=[str(p)], timeout_s=30)
    size = None
    framecount = None
    for line in r.stdout.splitlines():
        s = line.strip()
        if s.startswith("(") and s.endswith(")") and "," in s:
            try:
                w, h = s[1:-1].split(",")
                size = [int(w.strip()), int(h.strip())]
            except ValueError:
                pass
        elif s.isdigit():
            framecount = int(s)
    return {"input": str(p), "size": size, "framecount": framecount, "exit_code": r.exit_code}


@mcp.tool()
def pixelorama_export(
    pxo_path: str,
    output_format: str = "png",
    scale: int = 1,
    spritesheet: bool = False,
    direction: int = 0,
    frames: str = "",
    split_layers: bool = False,
    write_json: bool = False,
) -> dict:
    """Headless export from a .pxo via Pixelorama CLI.

    Args:
        pxo_path: absolute path to the .pxo file
        output_format: png|gif|webp|apng|jpg
        scale: integer multiplier (1-64)
        spritesheet: arrange frames as a spritesheet
        direction: 0=horizontal, 1=vertical, 2=grid (for spritesheet)
        frames: range like "1-12" (1-indexed inclusive). Empty = all frames.
        split_layers: one output file per layer
        write_json: also emit a JSON sidecar with project metadata
    """
    p = Path(pxo_path)
    if not p.exists():
        return {"error": f"file not found: {pxo_path}"}

    out_basename = f"export_{p.stem}.{output_format}"
    out_path = pb.BRIDGE_SCRATCH / out_basename

    args = ["--export", "--output", str(out_path)]
    if scale != 1:
        args += ["--scale", str(scale)]
    if spritesheet:
        args += ["--spritesheet", "--direction", str(direction)]
    if split_layers:
        args.append("--split-layers")
    if frames:
        args += ["--frames", frames]
    if write_json:
        args.append("--json")

    r = pb._run_pixelorama_cli(args, files=[str(p)], timeout_s=120)

    candidates = sorted(pb.BRIDGE_SCRATCH.glob(f"export_{p.stem}.*"))
    if r.exit_code not in (0, 3221225477):  # 0 or Windows headless-shutdown access violation
        return {"error": f"exit {r.exit_code}", "stderr": r.stderr[:500], "stdout": r.stdout[:500]}

    if not candidates:
        return {"error": "no output file produced", "stdout": r.stdout[:500]}

    emit_pixelorama_exported(str(p), str(candidates[0]), output_format, scale)
    return {
        "input": str(p),
        "outputs": [str(c) for c in candidates],
        "exit_code": r.exit_code,
        "elapsed_s": r.elapsed_s,
        "scale": scale,
        "format": output_format,
    }


@mcp.tool()
def pixelorama_launch(file_path: Optional[str] = None) -> dict:
    """Launch Pixelorama as a detached GUI process.

    If file_path is supplied, Pixelorama opens that file on startup.
    Use for interactive editing (Voxelorama depth painting, manual tweaks).
    """
    if not pb.PIXELORAMA_EXE.exists():
        return {"error": f"Pixelorama not found at {pb.PIXELORAMA_EXE}"}

    cmd = [str(pb.PIXELORAMA_EXE)]
    if file_path:
        if not Path(file_path).exists():
            return {"error": f"file not found: {file_path}"}
        cmd.append(file_path)

    DETACHED_PROCESS = 0x00000008
    CREATE_NEW_PROCESS_GROUP = 0x00000200
    proc = subprocess.Popen(
        cmd,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        close_fds=True,
    )
    emit_pixelorama_launched(proc.pid, file_path)
    return {"pid": proc.pid, "exe": str(pb.PIXELORAMA_EXE), "file": file_path}


# ============================================================================
# Image / segmentation
# ============================================================================

@mcp.tool()
def segment_background(image_path: str, threshold: int = 30) -> dict:
    """Quick threshold-based foreground mask. Output PNG path returned."""
    if not HAS_SKIMAGE:
        return {"error": "scikit-image not installed"}
    from PIL import Image
    import numpy as np

    p = Path(image_path)
    if not p.exists():
        return {"error": f"image not found: {image_path}"}

    img = Image.open(p).convert("L")
    mask = (np.array(img) > threshold).astype(np.uint8) * 255
    out_path = pb.BRIDGE_SCRATCH / f"{p.stem}_mask.png"
    Image.fromarray(mask).save(out_path)
    return {"input": str(p), "output": str(out_path), "threshold": threshold}


@mcp.tool()
def extract_light_trails(image_path: str, threshold: int = 200, min_length: int = 20) -> dict:
    """Detect bright light paths in a long-exposure photo via OpenCV contour detection."""
    if not HAS_CV2:
        return {"error": "opencv-python not installed"}
    import cv2
    import numpy as np

    p = Path(image_path)
    if not p.exists():
        return {"error": f"image not found: {image_path}"}

    img = cv2.imread(str(p), cv2.IMREAD_COLOR)
    if img is None:
        return {"error": f"could not decode image: {image_path}"}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (7, 7), 0)
    _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS)

    trails = []
    for c in contours:
        length = cv2.arcLength(c, False)
        if length < min_length:
            continue
        trails.append({"length": float(length), "area": float(cv2.contourArea(c))})
    trails.sort(key=lambda t: t["length"], reverse=True)
    return {"input": str(p), "count": len(trails), "trails_top10": trails[:10]}


# ============================================================================
# Audio
# ============================================================================

@mcp.tool()
def detect_beats(audio_path: str) -> dict:
    """Detect BPM and beat timestamps from an audio file."""
    if not HAS_AUBIO:
        return {"error": "aubio not installed"}
    import aubio
    p = Path(audio_path)
    if not p.exists():
        return {"error": f"file not found: {audio_path}"}

    samplerate, win_s, hop_s = 44100, 1024, 512
    src = aubio.source(str(p), samplerate, hop_s)
    tempo = aubio.tempo("default", win_s, hop_s, src.samplerate)
    beats = []
    total_frames = 0
    while True:
        samples, read = src()
        if tempo(samples):
            beats.append(tempo.get_last_s())
        total_frames += read
        if read < hop_s:
            break

    return {
        "input": str(p),
        "bpm": float(tempo.get_bpm()),
        "duration_s": total_frames / samplerate,
        "beat_count": len(beats),
        "beats_preview": beats[:20],
    }


# ============================================================================
# Inventory
# ============================================================================

@mcp.tool()
def list_pixelorama_extensions() -> list:
    """List installed Pixelorama extensions with category + description."""
    if not pb.PIXELORAMA_EXTENS.exists():
        return [{"error": f"extensions dir not found: {pb.PIXELORAMA_EXTENS}"}]
    out = []
    for p in sorted(pb.PIXELORAMA_EXTENS.iterdir()):
        if p.is_dir():
            continue
        name_base = p.stem
        category, desc = pb.EXTENSION_LORE.get(name_base, ("unknown", "No description registered"))
        out.append({"id": name_base, "category": category, "what": desc,
                    "size_kb": round(p.stat().st_size / 1024, 1)})
    return out


@mcp.tool()
def list_pixelorama_exports(limit: int = 50) -> list:
    """List recent files in the from-voxelorama bridge folder."""
    if not pb.EXPORTS_IN.exists():
        return []
    accepted = {".obj", ".gltf", ".glb", ".png", ".pxo", ".stl", ".ply", ".fbx"}
    files = [
        {"name": p.name, "path": str(p), "size_bytes": p.stat().st_size,
         "mtime": p.stat().st_mtime, "ext": p.suffix.lower().lstrip(".")}
        for p in pb.EXPORTS_IN.rglob("*")
        if p.is_file() and p.suffix.lower() in accepted
    ]
    files.sort(key=lambda f: f["mtime"], reverse=True)
    return files[:limit]


# ============================================================================
# Pixel art generation (Ollama + dolphin → Pixelorama CLI)
# ============================================================================

from mcp_pixelart_tools import register_pixelart_tools
_pa_count = register_pixelart_tools(mcp)
print(f"[mcp_server] registered {_pa_count} pixel art tools")


# ============================================================================
# Entry point
# ============================================================================

if __name__ == "__main__":
    # Default to stdio for Claude Desktop / Code integration
    mcp.run()
