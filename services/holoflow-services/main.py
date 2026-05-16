"""
holoflow-services / main.py — FastAPI sidecar exposing the installed
Python toolchain as HTTP endpoints for the React app to call.
"""

from __future__ import annotations
import io
import os
import sys
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response

# =============================================================================
# Capability detection — gracefully degrade if something isn't installed.
# =============================================================================

CAPS: dict[str, bool] = {}


def _probe(name: str, importer):
    try:
        importer()
        CAPS[name] = True
    except Exception:
        CAPS[name] = False


_probe("trimesh",       lambda: __import__("trimesh"))
_probe("open3d",        lambda: __import__("open3d"))
_probe("cv2",           lambda: __import__("cv2"))
_probe("skimage",       lambda: __import__("skimage"))
_probe("numpy",         lambda: __import__("numpy"))
_probe("PIL",           lambda: __import__("PIL"))
_probe("aubio",         lambda: __import__("aubio"))
_probe("rawpy",         lambda: __import__("rawpy"))
_probe("mediapipe",     lambda: __import__("mediapipe"))
_probe("lithophane",    lambda: __import__("lithophane"))
_probe("pyvista",       lambda: __import__("pyvista"))
_probe("huggingface_hub", lambda: __import__("huggingface_hub"))

CAPS["niimath"] = shutil.which("niimath") is not None

# =============================================================================
# Paths
# =============================================================================

HANGAR = Path(r"D:\The_Hangar")

PATHS = {
    "drone_pov_firmware": HANGAR / "firmware" / "drone_pov",
    "tools":              HANGAR / "tools",
    "comfyui_nodes":      HANGAR / "engines" / "comfyui" / "custom_nodes",
    "comfyui_models":     HANGAR / "engines" / "comfyui" / "models",
    "drone_show":         HANGAR / "drone_show",
    "captures":           Path(r"D:\HoloFlow\projects"),
    "palettes":           HANGAR / "assets" / "palettes" / "lospec",
    "instantmesh":        HANGAR / "tools" / "InstantMesh",
    "unique3d":           HANGAR / "tools" / "Unique3D",
    "trellis_model":      HANGAR / "engines" / "comfyui" / "models" / "checkpoints" / "TRELLIS-2",
}

# =============================================================================
# App + CORS
# =============================================================================

app = FastAPI(
    title="HoloFlow Services",
    description="Local Python toolchain exposed to the HoloFlow Mesh Studio app.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5138", "http://127.0.0.1:5138"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# /status
# =============================================================================

@app.get("/status")
def status():
    return {
        "service": "holoflow-services",
        "version": "0.2.0",
        "capabilities": CAPS,
        "paths": {k: str(v) for k, v in PATHS.items()},
        "paths_exist": {k: v.exists() for k, v in PATHS.items()},
    }


# =============================================================================
# /tools — registered tool list with metadata
# =============================================================================

@app.get("/tools")
def list_tools():
    return [
        {"id": "lithophane",          "category": "image-to-stl", "name": "Lithophane Generator",
         "what": "Image → relief STL. Brightness controls thickness. Perfect for CR-30 belt printer wall art.",
         "endpoint": "POST /lithophane", "ready": CAPS.get("lithophane", False), "outputs": ["stl"]},

        {"id": "voxelize",            "category": "mesh", "name": "Mesh → Voxel Grid",
         "what": "Voxelize an STL/GLB to a regular voxel grid at given pitch. Input to sculpture pipeline.",
         "endpoint": "POST /mesh/voxelize", "ready": CAPS.get("trimesh", False), "outputs": ["voxel-npy"]},

        {"id": "voxels-to-mesh",      "category": "mesh", "name": "Voxel Grid → Manifold Mesh",
         "what": "Upload a .npy voxel grid → marching cubes via trimesh → watertight STL.",
         "endpoint": "POST /mesh/from-voxels", "ready": CAPS.get("trimesh", False), "outputs": ["stl"]},

        {"id": "mesh-repair",         "category": "mesh", "name": "Mesh Repair (Watertight)",
         "what": "Repair non-manifold STL → watertight STL. Required before SLA print.",
         "endpoint": "POST /mesh/repair", "ready": CAPS.get("open3d", False) or CAPS.get("trimesh", False),
         "outputs": ["stl"]},

        {"id": "mesh-simplify",       "category": "mesh", "name": "Mesh Simplification (QEM)",
         "what": "Reduce poly count via niimath QEM. Critical for SLA upload size limits.",
         "endpoint": "POST /mesh/simplify", "ready": CAPS.get("niimath", False) or CAPS.get("trimesh", False),
         "outputs": ["stl"]},

        {"id": "mesh-inspect",        "category": "mesh", "name": "Mesh Inspect",
         "what": "Compute manifoldness, watertight status, surface area, volume, bbox.",
         "endpoint": "POST /mesh/inspect", "ready": CAPS.get("trimesh", False), "outputs": ["json"]},

        {"id": "image-segment-bg",    "category": "image", "name": "Background Removal (skimage)",
         "what": "Quick threshold-based background removal. Fast but basic.",
         "endpoint": "POST /image/segment-bg", "ready": CAPS.get("skimage", False), "outputs": ["png-mask"]},

        {"id": "image-extract-trails", "category": "image", "name": "Light Trail Extraction (OpenCV)",
         "what": "Detect bright light paths in long-exposure photos → polylines.",
         "endpoint": "POST /image/extract-trails", "ready": CAPS.get("cv2", False), "outputs": ["json-polylines"]},

        {"id": "raw-decode",          "category": "image", "name": "RAW Decode (rawpy)",
         "what": "Decode camera RAW files (.cr2, .nef, .arw, .dng). Feeds astro-stacker pipeline.",
         "endpoint": "POST /image/raw-decode", "ready": CAPS.get("rawpy", False), "outputs": ["png"]},

        {"id": "image-to-3d-instantmesh", "category": "ai-3d", "name": "Image → 3D Mesh (InstantMesh)",
         "what": "Local InstantMesh inference. Photo → GLB via the InstantMesh repo at tools/InstantMesh.",
         "endpoint": "POST /3d/instantmesh", "ready": PATHS["instantmesh"].exists(), "outputs": ["glb"]},

        {"id": "image-to-3d-trellis", "category": "ai-3d", "name": "Image → 3D Mesh (TRELLIS.2)",
         "what": "Microsoft TRELLIS.2 inference. Sharper detail than InstantMesh, slower.",
         "endpoint": "POST /3d/trellis2", "ready": PATHS["trellis_model"].exists(), "outputs": ["glb"]},

        {"id": "audio-beats",         "category": "audio", "name": "Beat Detection (aubio)",
         "what": "BPM + beat timestamps for music-synced light shows.",
         "endpoint": "POST /audio/beats", "ready": CAPS.get("aubio", False), "outputs": ["json"]},
    ]


# =============================================================================
# /lithophane
# =============================================================================

@app.post("/lithophane")
async def lithophane_endpoint(
    file: UploadFile = File(...),
    width_mm: float = Query(150),
    max_depth_mm: float = Query(3.0),
    base_thickness_mm: float = Query(0.8),
    invert: bool = Query(False),
):
    if not CAPS.get("lithophane"):
        raise HTTPException(503, "lithophane not installed")
    import lithophane as lp
    import numpy as np
    from PIL import Image

    img = Image.open(io.BytesIO(await file.read())).convert("L")
    arr = np.array(img)
    if invert:
        arr = 255 - arr

    out_path = Path(tempfile.mkstemp(suffix=".stl")[1])
    try:
        lp.lithophane(
            input_image=arr,
            output_path=str(out_path),
            width_mm=width_mm,
            max_depth_mm=max_depth_mm,
            base_thickness_mm=base_thickness_mm,
        )
    except AttributeError:
        raise HTTPException(500, "lithophane API mismatch — check version")

    return FileResponse(out_path, media_type="model/stl",
                        filename=f"{Path(file.filename or 'lithophane').stem}.stl")


# =============================================================================
# /mesh/voxelize
# =============================================================================

@app.post("/mesh/voxelize")
async def voxelize_endpoint(
    file: UploadFile = File(...),
    pitch_mm: float = Query(10.0),
    fill: bool = Query(True),
):
    if not CAPS.get("trimesh"):
        raise HTTPException(503, "trimesh not installed")
    import trimesh
    import numpy as np

    suffix = Path(file.filename or "mesh.stl").suffix or ".stl"
    mesh_path = Path(tempfile.mkstemp(suffix=suffix)[1])
    mesh_path.write_bytes(await file.read())

    mesh = trimesh.load(mesh_path, force="mesh")
    voxelized = mesh.voxelized(pitch=pitch_mm / 1000.0)
    if fill:
        voxelized.fill()

    grid = voxelized.matrix.astype(np.uint8)
    npy_path = Path(tempfile.mkstemp(suffix=".npy")[1])
    np.save(npy_path, grid)

    return {
        "shape": list(grid.shape),
        "pitch_mm": pitch_mm,
        "occupied_voxels": int(grid.sum()),
        "total_voxels": int(grid.size),
        "fill_ratio": float(grid.sum() / max(1, grid.size)),
        "bbox_mm": [
            [float(x * 1000) for x in voxelized.bounds[0]],
            [float(x * 1000) for x in voxelized.bounds[1]],
        ],
        "download": f"/file/{npy_path.name}",
    }


# =============================================================================
# /mesh/from-voxels — voxel grid → manifold STL via marching cubes
# =============================================================================

@app.post("/mesh/from-voxels")
async def voxels_to_mesh_endpoint(
    file: UploadFile = File(...),
    pitch_mm: float = Query(10.0),
):
    """Upload a .npy 3D boolean / uint8 voxel grid, get back a watertight STL."""
    if not CAPS.get("trimesh"):
        raise HTTPException(503, "trimesh not installed")
    import trimesh
    import numpy as np
    from skimage import measure

    npy_path = Path(tempfile.mkstemp(suffix=".npy")[1])
    npy_path.write_bytes(await file.read())
    grid = np.load(npy_path)

    # Marching cubes — pitch in metres, but trimesh STL writes in metres too,
    # we scale to mm for printing convenience.
    verts, faces, normals, _ = measure.marching_cubes(grid.astype(np.float32), level=0.5)
    # Scale to mm at the requested pitch
    verts = verts * pitch_mm
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals)
    out_path = Path(tempfile.mkstemp(suffix=".stl")[1])
    mesh.export(out_path)
    return FileResponse(out_path, media_type="model/stl",
                        filename=f"{Path(file.filename or 'voxels').stem}.stl")


# =============================================================================
# /mesh/repair
# =============================================================================

@app.post("/mesh/repair")
async def repair_endpoint(file: UploadFile = File(...)):
    if not (CAPS.get("open3d") or CAPS.get("trimesh")):
        raise HTTPException(503, "Neither open3d nor trimesh installed")

    suffix = Path(file.filename or "mesh.stl").suffix or ".stl"
    in_path = Path(tempfile.mkstemp(suffix=suffix)[1])
    out_path = in_path.with_suffix(".repaired.stl")
    in_path.write_bytes(await file.read())

    if CAPS.get("open3d"):
        import open3d as o3d
        mesh = o3d.io.read_triangle_mesh(str(in_path))
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
    else:
        import trimesh
        mesh = trimesh.load(in_path, force="mesh")
        trimesh.repair.fix_normals(mesh)
        trimesh.repair.fill_holes(mesh)
        trimesh.repair.fix_inversion(mesh)
        mesh.export(out_path)

    return FileResponse(out_path, media_type="model/stl",
                        filename=f"{Path(file.filename or 'mesh').stem}_repaired.stl")


# =============================================================================
# /mesh/simplify — niimath QEM if available, trimesh quadric otherwise
# =============================================================================

@app.post("/mesh/simplify")
async def simplify_endpoint(
    file: UploadFile = File(...),
    target_faces: int = Query(20000, description="Target triangle count"),
):
    suffix = Path(file.filename or "mesh.stl").suffix or ".stl"
    in_path = Path(tempfile.mkstemp(suffix=suffix)[1])
    out_path = in_path.with_suffix(".simplified.stl")
    in_path.write_bytes(await file.read())

    # Prefer niimath (much faster on huge meshes)
    if CAPS.get("niimath"):
        try:
            subprocess.run(
                ["niimath", str(in_path), "-mesh-simplify", str(target_faces), str(out_path)],
                check=True, capture_output=True, timeout=120,
            )
            if out_path.exists():
                return FileResponse(out_path, media_type="model/stl",
                                    filename=f"{Path(file.filename or 'mesh').stem}_simplified.stl")
        except subprocess.CalledProcessError as e:
            # Fall through to trimesh
            pass

    if not CAPS.get("trimesh"):
        raise HTTPException(503, "Neither niimath nor trimesh installed")

    import trimesh
    mesh = trimesh.load(in_path, force="mesh")
    simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
    simplified.export(out_path)
    return FileResponse(out_path, media_type="model/stl",
                        filename=f"{Path(file.filename or 'mesh').stem}_simplified.stl")


# =============================================================================
# /mesh/inspect
# =============================================================================

@app.post("/mesh/inspect")
async def inspect_endpoint(file: UploadFile = File(...)):
    if not CAPS.get("trimesh"):
        raise HTTPException(503, "trimesh not installed")
    import trimesh

    suffix = Path(file.filename or "mesh.stl").suffix or ".stl"
    in_path = Path(tempfile.mkstemp(suffix=suffix)[1])
    in_path.write_bytes(await file.read())
    mesh = trimesh.load(in_path, force="mesh")
    return {
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "is_watertight": bool(mesh.is_watertight),
        "is_winding_consistent": bool(mesh.is_winding_consistent),
        "is_volume": bool(mesh.is_volume),
        "volume_mm3": float(mesh.volume) if mesh.is_volume else None,
        "surface_area_mm2": float(mesh.area),
        "bbox_min_mm": [float(x) for x in mesh.bounds[0]],
        "bbox_max_mm": [float(x) for x in mesh.bounds[1]],
        "centroid_mm": [float(x) for x in mesh.centroid],
        "euler_number": int(mesh.euler_number),
    }


# =============================================================================
# /image/segment-bg
# =============================================================================

@app.post("/image/segment-bg")
async def segment_bg_endpoint(
    file: UploadFile = File(...),
    threshold: int = Query(30),
):
    if not CAPS.get("skimage"):
        raise HTTPException(503, "scikit-image not installed")
    from PIL import Image
    import numpy as np

    img = Image.open(io.BytesIO(await file.read())).convert("L")
    mask = (np.array(img) > threshold).astype(np.uint8) * 255
    out = Image.fromarray(mask)
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


# =============================================================================
# /image/extract-trails
# =============================================================================

@app.post("/image/extract-trails")
async def extract_trails_endpoint(
    file: UploadFile = File(...),
    threshold: int = Query(200),
    min_length: int = Query(20),
    blur_radius: int = Query(3),
):
    if not CAPS.get("cv2"):
        raise HTTPException(503, "opencv-python not installed")
    import cv2
    import numpy as np

    arr = np.frombuffer(await file.read(), dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Could not decode image")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if blur_radius > 0:
        gray = cv2.GaussianBlur(gray, (blur_radius * 2 + 1, blur_radius * 2 + 1), 0)
    _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS)

    trails = []
    for c in contours:
        length = cv2.arcLength(c, False)
        if length < min_length:
            continue
        pts = c.squeeze(1).tolist() if c.ndim == 3 else c.tolist()
        trails.append({"points": pts, "area": float(cv2.contourArea(c)), "length": float(length)})
    trails.sort(key=lambda t: t["length"], reverse=True)
    return {"count": len(trails), "trails": trails[:200]}


# =============================================================================
# /image/raw-decode
# =============================================================================

@app.post("/image/raw-decode")
async def raw_decode_endpoint(file: UploadFile = File(...)):
    if not CAPS.get("rawpy"):
        raise HTTPException(503, "rawpy not installed")
    import rawpy
    from PIL import Image

    raw_path = Path(tempfile.mkstemp(suffix=Path(file.filename or "img.cr2").suffix)[1])
    raw_path.write_bytes(await file.read())
    with rawpy.imread(str(raw_path)) as raw:
        rgb = raw.postprocess(use_camera_wb=True, output_bps=8)
    out_img = Image.fromarray(rgb)
    buf = io.BytesIO()
    out_img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


# =============================================================================
# /audio/beats
# =============================================================================

@app.post("/audio/beats")
async def beats_endpoint(file: UploadFile = File(...)):
    if not CAPS.get("aubio"):
        raise HTTPException(503, "aubio not installed")
    import aubio

    audio_path = Path(tempfile.mkstemp(suffix=Path(file.filename or "audio.wav").suffix)[1])
    audio_path.write_bytes(await file.read())

    samplerate = 44100
    win_s = 1024
    hop_s = 512
    src = aubio.source(str(audio_path), samplerate, hop_s)
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
        "bpm": float(tempo.get_bpm()),
        "duration_s": total_frames / samplerate,
        "beats": beats,
        "beat_count": len(beats),
    }


# =============================================================================
# /3d/instantmesh — image → GLB via local InstantMesh repo
# =============================================================================

@app.post("/3d/instantmesh")
async def instantmesh_endpoint(
    file: UploadFile = File(...),
    no_remove_bg: bool = Query(False),
):
    """Run InstantMesh on a single image. Heavy (~30s on 3080 Ti)."""
    repo = PATHS["instantmesh"]
    if not repo.exists():
        raise HTTPException(503, f"InstantMesh repo missing at {repo}")

    # Save input image to InstantMesh's expected input folder
    in_path = Path(tempfile.mkstemp(suffix=".png")[1])
    in_path.write_bytes(await file.read())
    out_dir = Path(tempfile.mkdtemp(prefix="instantmesh_"))

    # Locate run script — try common entry points
    candidates = [repo / "run.py", repo / "infer.py", repo / "app.py"]
    script = next((c for c in candidates if c.exists()), None)
    if not script:
        raise HTTPException(503, f"No run.py / infer.py found in {repo}. Check the repo's README for the entry point.")

    try:
        subprocess.run(
            [sys.executable, str(script), "--input", str(in_path), "--output_dir", str(out_dir)],
            cwd=str(repo), check=True, capture_output=True, timeout=300,
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(500, f"InstantMesh failed: {e.stderr.decode(errors='ignore')[:500]}")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "InstantMesh timed out (5min cap). Check GPU availability.")

    # Find the GLB output
    glb_files = list(out_dir.rglob("*.glb"))
    if not glb_files:
        raise HTTPException(500, f"InstantMesh produced no GLB in {out_dir}")
    return FileResponse(glb_files[0], media_type="model/gltf-binary", filename=glb_files[0].name)


# =============================================================================
# /3d/trellis2 — stub, will work once model is downloaded
# =============================================================================

@app.post("/3d/trellis2")
async def trellis2_endpoint(file: UploadFile = File(...)):
    if not PATHS["trellis_model"].exists():
        raise HTTPException(
            503,
            f"TRELLIS.2 model not present at {PATHS['trellis_model']}. "
            "Run: huggingface-cli download microsoft/TRELLIS.2-4B "
            f"--local-dir {PATHS['trellis_model']}",
        )
    # Once model exists, wire up the actual inference via TRELLIS's API
    # or by spawning the ComfyUI-TRELLIS2 workflow via ComfyUI's API.
    raise HTTPException(501, "TRELLIS.2 inference endpoint not wired yet — model present, need wrapper.")


# =============================================================================
# /capture/list
# =============================================================================

@app.get("/capture/list")
def list_captures(limit: int = 50):
    base = PATHS["captures"]
    if not base.exists():
        return {"path": str(base), "exists": False, "captures": []}

    exts = {".jpg", ".jpeg", ".png", ".tiff", ".tif", ".raw", ".cr2", ".nef", ".arw", ".dng"}
    captures = []
    for p in sorted(base.rglob("*"), key=lambda f: f.stat().st_mtime if f.is_file() else 0, reverse=True):
        if not p.is_file() or p.suffix.lower() not in exts:
            continue
        st = p.stat()
        captures.append({
            "path": str(p),
            "name": p.name,
            "size_bytes": st.st_size,
            "mtime": st.st_mtime,
        })
        if len(captures) >= limit:
            break

    return {"path": str(base), "exists": True, "count": len(captures), "captures": captures}


# =============================================================================
# /firmware/pov
# =============================================================================

@app.get("/firmware/pov")
def list_pov_firmware():
    base = PATHS["drone_pov_firmware"]
    if not base.exists():
        return {"path": str(base), "exists": False, "firmwares": []}
    firmwares = []
    for sub in base.iterdir():
        if sub.is_dir():
            firmwares.append({
                "name": sub.name,
                "path": str(sub),
                "has_readme": any((sub / f).exists() for f in ("README.md", "README.txt", "README")),
                "has_arduino": any(sub.glob("*.ino")),
                "has_platformio": (sub / "platformio.ini").exists(),
            })
    return {"path": str(base), "firmwares": firmwares}


# =============================================================================
# /file/{name}
# =============================================================================

@app.get("/file/{name}")
def get_temp_file(name: str):
    p = Path(tempfile.gettempdir()) / name
    if not p.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(p)


# ============================================================================
# Pixelorama bridge - mounted as sub-app at /pixelorama
# Endpoints: /pixelorama/info, /extensions, /launch, /send-sprite, /exports
# ============================================================================
from pixelorama_bridge import app as pixelorama_app
app.mount("/pixelorama", pixelorama_app)


# ============================================================================
# Pixel art generator — mounted as sub-app at /pixelart
# Endpoints: /pixelart/info, /palettes, /models, /generate-sprite,
#            /generate-animation, /gallery, /asset/{slug}/{kind}
# ============================================================================
from pixelart_bridge import app as pixelart_app
app.mount("/pixelart", pixelart_app)

from comfyui_bridge import app as comfyui_app
app.mount("/comfyui", comfyui_app)

from sam2_bridge import app as sam2_app
app.mount("/sam2", sam2_app)
