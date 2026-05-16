"""
pixelorama_bridge.py
====================
FastAPI sub-application that handles the round-trip between
HoloFlow Mesh Studio and Pixelorama (with Voxelorama, Skeletor,
and 17 other extensions).

Mounted at /pixelorama on the main holoflow-services sidecar.

Endpoints:
    GET  /pixelorama/info             - Pixelorama install path, version, extensions list
    GET  /pixelorama/extensions       - Detailed extension inventory
    POST /pixelorama/launch           - Launch Pixelorama (optionally with a PNG preloaded)
    POST /pixelorama/send-sprite      - Send a sprite from Light Forge to Pixelorama session folder
    GET  /pixelorama/exports          - Scan for recent .obj/.gltf/.png exports from Voxelorama
    GET  /pixelorama/exports/{name}   - Download a specific export
"""

from __future__ import annotations

import io
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse


PIXELORAMA_EXE     = Path(r"C:\Users\dimon\AppData\Roaming\Orama Interactive\Pixelorama\Pixelorama.exe")
PIXELORAMA_DATA    = PIXELORAMA_EXE.parent / "pixelorama_data"
PIXELORAMA_CONFIG  = Path(r"C:\Users\dimon\AppData\Roaming\Pixelorama")
PIXELORAMA_EXTENS  = PIXELORAMA_CONFIG / "extensions"
PIXELORAMA_LOGS    = PIXELORAMA_CONFIG / "logs"

BRIDGE_SCRATCH     = Path(r"D:\HoloFlow\bridge")
SPRITES_OUT        = BRIDGE_SCRATCH / "to-pixelorama"
EXPORTS_IN         = BRIDGE_SCRATCH / "from-voxelorama"

for d in (BRIDGE_SCRATCH, SPRITES_OUT, EXPORTS_IN):
    d.mkdir(parents=True, exist_ok=True)


app = FastAPI(
    title="Pixelorama Bridge",
    description="Round-trip integration between HoloFlow Mesh Studio and Pixelorama+extensions.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5138", "http://127.0.0.1:5138"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/info")
def info():
    """Return Pixelorama install state, version, and extension count."""
    exists = PIXELORAMA_EXE.exists()
    config_exists = PIXELORAMA_CONFIG.exists()

    godot_version = None
    if PIXELORAMA_LOGS.exists():
        logs = sorted(
            (p for p in PIXELORAMA_LOGS.glob("godot*.log")),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if logs:
            try:
                first_lines = logs[0].read_text(errors="ignore").splitlines()[:5]
                for line in first_lines:
                    if "Godot Engine" in line:
                        godot_version = line.strip()
                        break
            except Exception:
                pass

    extension_count = 0
    if PIXELORAMA_EXTENS.exists():
        extension_count = sum(
            1 for p in PIXELORAMA_EXTENS.iterdir()
            if p.suffix.lower() == ".pck"
        )

    sprites_pending = sum(1 for _ in SPRITES_OUT.glob("*.png")) if SPRITES_OUT.exists() else 0
    exports_available = sum(
        1 for p in EXPORTS_IN.iterdir()
        if p.suffix.lower() in (".obj", ".gltf", ".glb", ".png", ".pxo")
    ) if EXPORTS_IN.exists() else 0

    return {
        "installed": exists,
        "exe":       str(PIXELORAMA_EXE),
        "data":      str(PIXELORAMA_DATA),
        "config":    str(PIXELORAMA_CONFIG),
        "extensions_dir": str(PIXELORAMA_EXTENS),
        "logs_dir":  str(PIXELORAMA_LOGS),
        "extension_count": extension_count,
        "godot_version_line": godot_version,
        "bridge": {
            "sprites_out_dir":  str(SPRITES_OUT),
            "exports_in_dir":   str(EXPORTS_IN),
            "sprites_pending":  sprites_pending,
            "exports_available": exports_available,
        },
    }


EXTENSION_LORE = {
    "Voxelorama":             ("voxel",     "Convert pixel art to voxel art with per-pixel depth tool. Exports .obj. *Killer for HoloFlow.*"),
    "Skeletor":               ("animation", "Sprite armature rigging - bone-deform 2D sprites. Use for poi figure animations."),
    "LospecPaletteImporter":  ("palette",   "Pull palettes directly from Lospec.com. Pairs with D:\\The_Hangar\\assets\\palettes\\lospec\\"),
    "LayerSpritesheet":       ("export",    "Export multi-layer animations as spritesheets. Useful for POV firmware frame uploads."),
    "LineArt":                ("draw",      "Line art / pixel-perfect line tools."),
    "ColorChecker":           ("palette",   "Accessibility / contrast checker."),
    "CameraZoomer":           ("ui",        "Better zoom controls."),
    "CopyLayerFx":            ("layer",     "Copy layer effects across cels."),
    "DiscordRPC":             ("misc",      "Discord Rich Presence."),
    "ExtensionCreator":       ("meta",      "Tool for creating more Pixelorama extensions."),
    "KeyDisplay":             ("tutorial",  "Show keystrokes on screen."),
    "LayerSearch":            ("layer",     "Search and filter layers by name."),
    "LocalCheckerSize":       ("ui",        "Customize the transparency checker pattern per project."),
    "OpenDyslexicFont":       ("a11y",      "Dyslexia-friendly font."),
    "QuickZoom":              ("ui",        "Zoom shortcuts."),
    "ReferenceUpdater":       ("reference", "Refresh reference images when source files change."),
    "ScreenCPShortcut":       ("ui",        "Keyboard shortcut for the screen color picker."),
    "TimeTracking":           ("meta",      "Track time spent per sprite project."),
}


@app.get("/extensions")
def list_extensions():
    """List all installed Pixelorama extensions."""
    if not PIXELORAMA_EXTENS.exists():
        raise HTTPException(404, f"Extensions directory not found: {PIXELORAMA_EXTENS}")

    items = []
    for p in sorted(PIXELORAMA_EXTENS.iterdir()):
        if p.is_dir():
            continue
        name_base = p.stem
        category, desc = EXTENSION_LORE.get(name_base, ("unknown", "No description registered yet."))
        items.append({
            "name":     p.name,
            "id":       name_base,
            "path":     str(p),
            "size_kb":  round(p.stat().st_size / 1024, 1),
            "mtime":    p.stat().st_mtime,
            "category": category,
            "what":     desc,
        })
    return {"count": len(items), "extensions": items}


@app.post("/launch")
def launch(file_path: Optional[str] = Form(None)):
    """Spawn Pixelorama as a detached process."""
    if not PIXELORAMA_EXE.exists():
        raise HTTPException(503, f"Pixelorama.exe not found at {PIXELORAMA_EXE}")

    cmd = [str(PIXELORAMA_EXE)]
    if file_path:
        p = Path(file_path)
        if not p.exists():
            raise HTTPException(400, f"File does not exist: {file_path}")
        cmd.append(str(p))

    DETACHED_PROCESS = 0x00000008
    CREATE_NEW_PROCESS_GROUP = 0x00000200
    proc = subprocess.Popen(
        cmd,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        close_fds=True,
    )

    return {
        "launched": True,
        "pid":      proc.pid,
        "exe":      str(PIXELORAMA_EXE),
        "file":     file_path,
        "cmd":      cmd,
    }


@app.post("/send-sprite")
async def send_sprite(
    file: UploadFile = File(...),
    name: str = Query("sprite"),
    launch_now: bool = Query(True),
):
    """Save uploaded PNG to bridge sprites-out, optionally launch Pixelorama."""
    safe_name = "".join(c if c.isalnum() or c in "-_." else "_" for c in name)
    if not safe_name:
        safe_name = "sprite"

    out_path = SPRITES_OUT / f"{safe_name}.png"
    content = await file.read()
    out_path.write_bytes(content)

    launched = None
    if launch_now and PIXELORAMA_EXE.exists():
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        proc = subprocess.Popen(
            [str(PIXELORAMA_EXE), str(out_path)],
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            close_fds=True,
        )
        launched = {"pid": proc.pid}

    return {
        "saved":    str(out_path),
        "size":     out_path.stat().st_size,
        "launched": launched,
        "next":     "In Pixelorama: refine, then Image > Generate 3D Object > Export .obj to D:\\HoloFlow\\bridge\\from-voxelorama\\",
    }


@app.get("/exports")
def list_exports(limit: int = 50):
    """List recent exports in the bridge folder, newest first."""
    if not EXPORTS_IN.exists():
        return {"path": str(EXPORTS_IN), "exists": False, "exports": []}

    accepted_exts = {".obj", ".gltf", ".glb", ".png", ".pxo", ".stl", ".ply", ".fbx"}
    files = []
    for p in EXPORTS_IN.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in accepted_exts:
            continue
        st = p.stat()
        files.append({
            "name":      p.name,
            "path":      str(p),
            "size_bytes": st.st_size,
            "size_human": _human_bytes(st.st_size),
            "mtime":     st.st_mtime,
            "ext":       p.suffix.lower().lstrip("."),
            "kind":      _classify_kind(p),
        })

    files.sort(key=lambda f: f["mtime"], reverse=True)
    return {
        "path":   str(EXPORTS_IN),
        "exists": True,
        "count":  len(files),
        "exports": files[:limit],
    }


@app.get("/exports/{name}")
def get_export(name: str):
    """Download a specific export by name."""
    safe_name = Path(name).name
    target = EXPORTS_IN / safe_name
    if not target.exists() or not target.is_file():
        raise HTTPException(404, f"Export not found: {safe_name}")

    media_map = {
        ".obj":  "model/obj",
        ".gltf": "model/gltf+json",
        ".glb":  "model/gltf-binary",
        ".png":  "image/png",
        ".stl":  "model/stl",
        ".ply":  "model/ply",
        ".fbx":  "application/octet-stream",
        ".pxo":  "application/x-pixelorama",
    }
    media_type = media_map.get(target.suffix.lower(), "application/octet-stream")
    return FileResponse(target, media_type=media_type, filename=safe_name)


def _human_bytes(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n/1024:.1f} KB"
    if n < 1024 * 1024 * 1024:
        return f"{n/1024/1024:.2f} MB"
    return f"{n/1024/1024/1024:.2f} GB"


def _classify_kind(p: Path) -> str:
    ext = p.suffix.lower()
    if ext in (".obj", ".gltf", ".glb", ".stl", ".ply", ".fbx"):
        return "mesh"
    if ext == ".png":
        return "image"
    if ext == ".pxo":
        return "pixelorama-project"
    return "other"

# =============================================================================
# CLI section — drive Pixelorama headlessly for batch export, inspect, version
# =============================================================================
#
# Pixelorama is Godot 4.6.2 with its own CLI parser. Invocation pattern:
#   Pixelorama.exe [GODOT SYSTEM OPTS] -- [PIXELORAMA USER OPTS] [FILES]
#
# System opts (before --):  --headless, --quit, --quit-after N, --verbose
# User opts (after --):     --export, --spritesheet, --output, --scale,
#                           --frames N-N, --direction 0|1|2, --json,
#                           --split-layers, --size, --framecount, --version
# Special: rel-dir=PATH for relative path resolution on Windows.
# CRITICAL: --output alone does NOTHING — must combine with --export.
# CAVEAT:   Voxelorama's "Generate 3D Object" is NOT exposed via CLI;
#           it's UI-only. CLI is for image/spritesheet/GIF/JSON export.
# =============================================================================

import subprocess as _sp
from dataclasses import dataclass, asdict


@dataclass
class CliResult:
    cmd: list[str]
    exit_code: int
    stdout: str
    stderr: str
    elapsed_s: float
    output_file: str | None = None
    output_size: int | None = None


def _run_pixelorama_cli(
    user_args: list[str],
    files: list[str] | None = None,
    timeout_s: int = 60,
    headless: bool = True,
) -> CliResult:
    """
    Run Pixelorama with the given user args after `--`. Returns CliResult.
    Always uses --quit so the process exits when done.
    """
    import time as _t
    if not PIXELORAMA_EXE.exists():
        raise HTTPException(503, f"Pixelorama.exe not found at {PIXELORAMA_EXE}")

    cmd: list[str] = [str(PIXELORAMA_EXE)]
    if headless:
        cmd.append("--headless")
    cmd.append("--quit")
    cmd.append("--")
    cmd.extend(user_args)
    if files:
        cmd.extend(files)

    started = _t.time()
    try:
        proc = _sp.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            cwd=str(BRIDGE_SCRATCH),  # so rel-dir falls back here
        )
        elapsed = _t.time() - started
        return CliResult(
            cmd=cmd,
            exit_code=proc.returncode,
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
            elapsed_s=elapsed,
        )
    except _sp.TimeoutExpired as e:
        return CliResult(
            cmd=cmd,
            exit_code=-1,
            stdout=(e.stdout or b"").decode("utf-8", errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or ""),
            stderr=f"TIMEOUT after {timeout_s}s",
            elapsed_s=_t.time() - started,
        )


@app.get("/cli/version")
def cli_version():
    """Run Pixelorama --version to confirm CLI works end-to-end."""
    r = _run_pixelorama_cli(["--version"], timeout_s=15)
    return asdict(r)


@app.post("/cli/inspect")
async def cli_inspect(file: UploadFile = File(...)):
    """
    Inspect a .pxo project: dimensions + frame count.
    Equivalent to: Pixelorama.exe --headless --quit -- --size --framecount FILE
    """
    suffix = Path(file.filename or "project.pxo").suffix or ".pxo"
    in_path = Path(tempfile.mkstemp(suffix=suffix, dir=BRIDGE_SCRATCH)[1])
    in_path.write_bytes(await file.read())

    r = _run_pixelorama_cli(
        ["--size", "--framecount"],
        files=[str(in_path)],
        timeout_s=30,
    )

    # Parse stdout — Pixelorama prints size on one line, framecount on next
    size = None
    framecount = None
    for line in r.stdout.splitlines():
        stripped = line.strip()
        # Vector2i prints like "(W, H)"
        if stripped.startswith("(") and stripped.endswith(")") and "," in stripped:
            try:
                w, h = stripped[1:-1].split(",")
                size = [int(w.strip()), int(h.strip())]
            except ValueError:
                pass
        elif stripped.isdigit():
            framecount = int(stripped)

    try:
        in_path.unlink(missing_ok=True)
    except Exception:
        pass

    result = asdict(r)
    result["parsed"] = {"size": size, "framecount": framecount}
    return result


@app.post("/cli/export")
async def cli_export(
    file: UploadFile = File(...),
    output_format: str = Query("png", description="png|gif|webp|apng|jpg|tif"),
    scale: int = Query(1, ge=1, le=64, description="Integer scale multiplier"),
    spritesheet: bool = Query(False, description="Export as spritesheet"),
    split_layers: bool = Query(False, description="One file per layer"),
    frames: str = Query("", description="Frame range like '1-10', empty = all"),
    direction: int = Query(0, ge=0, le=2, description="Spritesheet direction: 0=horiz, 1=vert, 2=grid"),
    write_json: bool = Query(False, description="Also write JSON sidecar"),
):
    """
    Headless export from a .pxo file. Returns the exported file as a download.

    Examples:
        - 4x PNG:           output_format=png, scale=4
        - Animated GIF:     output_format=gif, frames=1-12
        - Spritesheet:      spritesheet=true, direction=2 (grid)
        - Per-layer split:  split_layers=true
    """
    valid_formats = {"png", "gif", "webp", "apng", "jpg", "jpeg", "tif", "tiff"}
    if output_format.lower() not in valid_formats:
        raise HTTPException(400, f"output_format must be one of {valid_formats}")

    # Stage input
    in_path = Path(tempfile.mkstemp(suffix=".pxo", dir=BRIDGE_SCRATCH)[1])
    in_path.write_bytes(await file.read())

    # Output path — Pixelorama writes to wherever --output points
    out_basename = f"export_{in_path.stem}.{output_format}"
    out_path = BRIDGE_SCRATCH / out_basename

    # Build args
    user_args: list[str] = ["--export", "--output", str(out_path)]
    if scale != 1:
        user_args += ["--scale", str(scale)]
    if spritesheet:
        user_args += ["--spritesheet", "--direction", str(direction)]
    if split_layers:
        user_args.append("--split-layers")
    if frames:
        user_args += ["--frames", frames]
    if write_json:
        user_args.append("--json")

    r = _run_pixelorama_cli(user_args, files=[str(in_path)], timeout_s=120)

    try:
        in_path.unlink(missing_ok=True)
    except Exception:
        pass

    if r.exit_code != 0:
        raise HTTPException(
            500,
            f"Pixelorama exit {r.exit_code}. stderr: {r.stderr[:500]} | stdout: {r.stdout[:500]}",
        )

    # Find the actual output — Pixelorama may have added frame suffixes
    candidates = sorted(BRIDGE_SCRATCH.glob(f"export_{Path(in_path.stem).stem}.*"))
    if not candidates:
        candidates = sorted(BRIDGE_SCRATCH.glob(f"*{out_basename}"))
    if not candidates:
        raise HTTPException(
            500,
            f"No output file produced. Expected near {out_path}. stdout: {r.stdout[:500]}",
        )

    # If split-layers or spritesheet produced multiple, zip them
    if len(candidates) > 1:
        import zipfile
        zip_path = BRIDGE_SCRATCH / f"export_{in_path.stem}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for c in candidates:
                zf.write(c, c.name)
        return FileResponse(zip_path, media_type="application/zip", filename=zip_path.name)

    return FileResponse(candidates[0], filename=candidates[0].name)


@app.get("/cli/help")
def cli_help():
    """Fetch the live --help output from Pixelorama (USER OPTIONS section)."""
    r = _run_pixelorama_cli(["-h"], timeout_s=15)
    return asdict(r)


@app.post("/cli/import-lospec")
async def cli_import_lospec(url: str = Form(..., description="A lospec.com palette URL")):
    """
    Import a Lospec palette directly via the lospec-palette:// URI scheme.
    Pixelorama handles this natively — see Main.gd line 414.
    The palette ends up in Pixelorama's user palette folder.

    Example URL: https://lospec.com/palette-list/sweetie-16
    """
    # Pixelorama expects format: lospec-palette://load?url=<URL>
    uri = f"lospec-palette://load?url={url}"
    r = _run_pixelorama_cli([uri], timeout_s=30, headless=True)
    return asdict(r)
