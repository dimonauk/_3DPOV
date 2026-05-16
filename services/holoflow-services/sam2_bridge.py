"""SAM2 segmentation bridge for HoloFlow Mesh Studio.

Mounts /sam2/* on the FastAPI sidecar. Proxies to the lightpainting-forge-backend
SAM2 server at port 5285 (which loads sam2.1_hiera_large.pt on the 3080 Ti).

Endpoints exposed:
    GET  /sam2/info                          Probe backend health + config
    POST /sam2/segment                       Proxy segment (multipart in/PNG out)
    POST /sam2/segment-and-save              Convenience: upload, segment, save to bridge folder
    POST /sam2/mask-to-stl/{slug}            Extrude mask to a 3D relief STL (photo→sculpture)
    GET  /sam2/asset/{slug}/{kind}           Fetch saved original|mask|sculpture|provenance
    GET  /sam2/gallery                       List saved SAM2 sessions
"""

from __future__ import annotations

import io
import json
import re
import time
import uuid
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response

try:
    from mqtt_bus import emit_event  # type: ignore
except Exception:
    def emit_event(*_a, **_kw): return None  # type: ignore

SAM2_BACKEND_URL = "http://127.0.0.1:5285"
HOLOFLOW_BRIDGE = Path(r"D:\HoloFlow\bridge\to-pixelorama")
HOLOFLOW_BRIDGE.mkdir(parents=True, exist_ok=True)


def _slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")
    return s[:48] or "image"


async def _probe_backend() -> bool:
    """Pure TCP probe — backend's http.server hangs on GET without multipart body."""
    import socket
    try:
        url = SAM2_BACKEND_URL.replace("http://", "")
        host, port = url.split(":")
        port = int(port.rstrip("/"))
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.5)
        result = s.connect_ex((host, port))
        s.close()
        return result == 0
    except Exception:
        return False


def _try_simplify(mesh, target_faces: int):
    """Try multiple decimation backends; return (simplified_mesh, backend_name) or (None, reason)."""
    if target_faces <= 0 or target_faces >= len(mesh.faces):
        return None, "skip-already-smaller"

    # 1. trimesh built-in (uses fast-simplification if installed)
    try:
        simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
        if simplified is not None and len(simplified.faces) > 0:
            return simplified, "trimesh.simplify_quadric_decimation"
    except Exception as e:
        last_err = str(e)
    else:
        last_err = "trimesh returned None"

    # 2. fast-simplification directly
    try:
        import fast_simplification
        import numpy as np
        verts_in = mesh.vertices.astype("float32")
        faces_in = mesh.faces.astype("uint32")
        target_ratio = 1.0 - (target_faces / len(faces_in))
        verts_out, faces_out = fast_simplification.simplify(verts_in, faces_in, target_ratio=target_ratio)
        import trimesh
        return trimesh.Trimesh(vertices=verts_out, faces=faces_out, process=True), "fast_simplification.simplify"
    except Exception as e:
        last_err = f"{last_err} | fast-simplification: {e}"

    return None, f"all-backends-failed: {last_err}"


app = FastAPI(title="HoloFlow SAM2 Bridge", version="0.3.0")


@app.get("/info")
async def info() -> dict:
    reachable = await _probe_backend()
    return {
        "sam2_backend_url": SAM2_BACKEND_URL,
        "sam2_backend_reachable": reachable,
        "checkpoint": r"D:\The_Hangar\sam2\checkpoints\sam2.1_hiera_large.pt",
        "config": "configs/sam2.1/sam2.1_hiera_l.yaml",
        "bridge_dir": str(HOLOFLOW_BRIDGE),
        "device": "cuda" if reachable else "unknown",
        "notes": "First POST per photo uploads image (~1-2s embed). Subsequent POSTs use image_id (~50-100ms).",
    }


@app.post("/segment")
async def segment(
    image: UploadFile | None = File(None),
    image_id: str | None = Form(None),
    points: str | None = Form(None),
):
    if image is None and image_id is None:
        raise HTTPException(400, "Must supply either 'image' or 'image_id'")
    files: dict = {}
    data: dict = {}
    if image is not None:
        image_bytes = await image.read()
        files["image"] = (image.filename or "upload.png", image_bytes, image.content_type or "image/png")
    if image_id is not None:
        data["image_id"] = image_id
    if points is not None:
        data["points"] = points
    try:
        async with httpx.AsyncClient(timeout=120.0) as cx:
            r = await cx.post(f"{SAM2_BACKEND_URL}/segment", files=files, data=data)
    except httpx.ConnectError:
        raise HTTPException(503, "SAM2 backend not reachable")
    except httpx.TimeoutException:
        raise HTTPException(504, "SAM2 backend timed out")
    if r.status_code != 200:
        raise HTTPException(r.status_code, f"SAM2 backend error: {r.text[:400]}")
    headers = {}
    if "X-Image-Id" in r.headers:
        headers["X-Image-Id"] = r.headers["X-Image-Id"]
    return Response(content=r.content, media_type="image/png", headers=headers)


@app.post("/segment-and-save")
async def segment_and_save(
    image: UploadFile = File(...),
    points: str | None = Form(None),
    label: str = Form("session"),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(400, "Empty image upload")
    slug = f"sam2_{_slugify(label)}_{int(time.time())}"
    slug_dir = HOLOFLOW_BRIDGE / slug
    slug_dir.mkdir(parents=True, exist_ok=True)
    orig_path = slug_dir / "original.png"
    orig_path.write_bytes(image_bytes)
    files = {"image": (image.filename or "upload.png", image_bytes, image.content_type or "image/png")}
    data = {}
    if points:
        data["points"] = points
    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=120.0) as cx:
            r = await cx.post(f"{SAM2_BACKEND_URL}/segment", files=files, data=data)
    except httpx.ConnectError:
        raise HTTPException(503, "SAM2 backend not reachable")
    if r.status_code != 200:
        raise HTTPException(r.status_code, f"SAM2 backend error: {r.text[:400]}")
    elapsed_s = time.monotonic() - t0
    mask_path = slug_dir / "mask.png"
    mask_path.write_bytes(r.content)
    image_id = r.headers.get("X-Image-Id", "")
    provenance = {
        "slug": slug, "label": label, "points": points, "image_id": image_id,
        "elapsed_s": elapsed_s, "orig_filename": image.filename, "ts": time.time(),
    }
    (slug_dir / "provenance.json").write_text(json.dumps(provenance, indent=2))
    emit_event("holoflow/sam2/segmented", {"slug": slug, "elapsed_s": elapsed_s})
    return {
        "slug": slug, "label": label, "image_id": image_id,
        "elapsed_s": round(elapsed_s, 3),
        "original_url": f"/sam2/asset/{slug}/original",
        "mask_url": f"/sam2/asset/{slug}/mask",
        "provenance_url": f"/sam2/asset/{slug}/provenance",
        "saved_to": str(slug_dir),
    }


@app.post("/mask-to-stl/{slug}")
def mask_to_stl(
    slug: str,
    physical_width_mm: float = Query(80.0, ge=10.0, le=400.0),
    depth_mm: float = Query(5.0, ge=0.5, le=50.0),
    base_mm: float = Query(2.0, ge=0.5, le=20.0),
    max_dim: int = Query(256, ge=64, le=512),
    smooth: bool = Query(True),
    simplify_to_faces: int | None = Query(None, ge=500, le=500000, description="Optional quadric decimation target face count (e.g. 10000 reduces ~275k→10k with no visible loss)"),
) -> dict:
    """Mask → watertight 3D-printable relief STL via marching cubes."""
    slug_dir = HOLOFLOW_BRIDGE / slug
    mask_path = slug_dir / "mask.png"
    if not mask_path.exists():
        raise HTTPException(404, f"No mask for slug {slug}")

    import numpy as np
    from PIL import Image
    from skimage import measure
    import trimesh

    t0 = time.monotonic()

    mask_img = Image.open(mask_path)
    if mask_img.mode != "RGBA":
        mask_img = mask_img.convert("RGBA")
    mask_arr = np.array(mask_img)
    alpha = mask_arr[..., 3]
    binary = (alpha > 128).astype(np.uint8)
    if binary.sum() == 0:
        raise HTTPException(400, "Mask is empty")

    H_orig, W_orig = binary.shape
    factor = max(1, int(np.ceil(max(H_orig, W_orig) / max_dim)))
    if factor > 1:
        new_H, new_W = H_orig // factor, W_orig // factor
        cropped = binary[:new_H * factor, :new_W * factor]
        binary = cropped.reshape(new_H, factor, new_W, factor).max(axis=(1, 3))
    H, W = binary.shape

    pitch_mm = physical_width_mm / W
    depth_voxels = max(1, int(round(depth_mm / pitch_mm)))
    base_voxels = max(1, int(round(base_mm / pitch_mm)))
    pad = 1
    Z_total = base_voxels + depth_voxels
    grid = np.zeros((H + 2 * pad, W + 2 * pad, Z_total + 2 * pad), dtype=np.uint8)
    grid[pad:H + pad, pad:W + pad, pad:base_voxels + pad] = 1
    grid[pad:H + pad, pad:W + pad, base_voxels + pad:base_voxels + depth_voxels + pad] = binary[:, :, None]
    occupied = int(grid.sum())
    total = int(grid.size)

    verts, faces, normals, _ = measure.marching_cubes(grid, level=0.5)
    verts_mm = np.empty_like(verts)
    verts_mm[:, 0] = (verts[:, 1] - pad) * pitch_mm
    verts_mm[:, 1] = (verts[:, 0] - pad) * pitch_mm
    verts_mm[:, 2] = (verts[:, 2] - pad) * pitch_mm

    mesh = trimesh.Trimesh(vertices=verts_mm, faces=faces, process=True)
    raw_face_count = int(len(mesh.faces))

    if smooth and len(mesh.vertices) > 0:
        try:
            trimesh.smoothing.filter_humphrey(mesh, alpha=0.1, beta=0.5, iterations=2)
        except Exception:
            pass

    # Simplification — optional, with graceful fallback
    simplify_backend = None
    if simplify_to_faces is not None:
        simplified, backend_name = _try_simplify(mesh, simplify_to_faces)
        if simplified is not None:
            mesh = simplified
            simplify_backend = backend_name

    # Center on origin in XY, flat on bed
    bounds = mesh.bounds
    cx = (bounds[0, 0] + bounds[1, 0]) / 2
    cy = (bounds[0, 1] + bounds[1, 1]) / 2
    z_min = bounds[0, 2]
    mesh.apply_translation([-cx, -cy, -z_min])

    stl_path = slug_dir / "sculpture.stl"
    mesh.export(stl_path, file_type="stl")
    elapsed_s = time.monotonic() - t0

    prov_path = slug_dir / "provenance.json"
    try:
        prov = json.loads(prov_path.read_text()) if prov_path.exists() else {"slug": slug}
    except Exception:
        prov = {"slug": slug}
    prov["sculpture"] = {
        "physical_width_mm": physical_width_mm, "depth_mm": depth_mm, "base_mm": base_mm,
        "max_dim": max_dim, "smooth": smooth, "pitch_mm": pitch_mm,
        "grid_shape": list(grid.shape), "occupied_voxels": occupied, "total_voxels": total,
        "raw_face_count": raw_face_count,
        "vertex_count": int(len(mesh.vertices)),
        "face_count": int(len(mesh.faces)),
        "is_watertight": bool(mesh.is_watertight),
        "simplify_to_faces": simplify_to_faces,
        "simplify_backend": simplify_backend,
        "elapsed_s": elapsed_s, "ts": time.time(),
    }
    prov_path.write_text(json.dumps(prov, indent=2))
    emit_event("holoflow/sam2/voxelized", {
        "slug": slug, "faces": int(len(mesh.faces)),
        "watertight": bool(mesh.is_watertight), "elapsed_s": elapsed_s,
    })
    stl_size = stl_path.stat().st_size

    return {
        "slug": slug,
        "stl_url": f"/sam2/asset/{slug}/sculpture",
        "saved_to": str(stl_path),
        "stl_size_bytes": stl_size,
        "pitch_mm": round(pitch_mm, 4),
        "physical_dims_mm": {
            "x": round(W * pitch_mm, 2),
            "y": round(H * pitch_mm, 2),
            "z": round((base_voxels + depth_voxels) * pitch_mm, 2),
        },
        "grid_shape": list(grid.shape),
        "occupied_voxels": occupied,
        "total_voxels": total,
        "raw_face_count": raw_face_count,
        "vertex_count": int(len(mesh.vertices)),
        "face_count": int(len(mesh.faces)),
        "is_watertight": bool(mesh.is_watertight),
        "simplify_to_faces": simplify_to_faces,
        "simplify_backend": simplify_backend,
        "elapsed_s": round(elapsed_s, 3),
    }


@app.get("/asset/{slug}/{kind}")
def asset(slug: str, kind: str):
    slug_dir = HOLOFLOW_BRIDGE / slug
    if not slug_dir.exists():
        raise HTTPException(404, f"Slug not found: {slug}")
    if kind == "original":
        p = slug_dir / "original.png"
        if p.exists(): return FileResponse(p, media_type="image/png")
    elif kind == "mask":
        p = slug_dir / "mask.png"
        if p.exists(): return FileResponse(p, media_type="image/png")
    elif kind == "sculpture":
        p = slug_dir / "sculpture.stl"
        if p.exists(): return FileResponse(p, media_type="model/stl", filename=f"{slug}.stl")
    elif kind == "provenance":
        p = slug_dir / "provenance.json"
        if p.exists(): return FileResponse(p, media_type="application/json")
    raise HTTPException(404, f"Asset not found: {slug}/{kind}")


@app.get("/gallery")
def gallery(limit: int = Query(50, ge=1, le=200)) -> dict:
    if not HOLOFLOW_BRIDGE.exists():
        return {"count": 0, "items": []}
    items = []
    for d in sorted(HOLOFLOW_BRIDGE.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not d.is_dir() or not d.name.startswith("sam2_"):
            continue
        prov_file = d / "provenance.json"
        if not prov_file.exists():
            continue
        try:
            prov = json.loads(prov_file.read_text())
            sculpture = prov.get("sculpture", {})
            items.append({
                "slug": d.name,
                "label": prov.get("label", d.name),
                "points": prov.get("points"),
                "image_id": prov.get("image_id"),
                "elapsed_s": prov.get("elapsed_s"),
                "ts": prov.get("ts"),
                "has_original": (d / "original.png").exists(),
                "has_mask": (d / "mask.png").exists(),
                "has_sculpture": (d / "sculpture.stl").exists(),
                "sculpture_faces": sculpture.get("face_count"),
                "sculpture_watertight": sculpture.get("is_watertight"),
            })
            if len(items) >= limit:
                break
        except Exception:
            continue
    return {"count": len(items), "items": items}
