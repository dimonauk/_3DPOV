"""
pixelart_bridge.py
==================
FastAPI sub-app exposing the pixel art generator at /pixelart/*

Mount in main.py with:

    from pixelart_bridge import app as pixelart_app
    app.mount("/pixelart", pixelart_app)

Endpoints:
    GET  /pixelart/info                — backend status
    GET  /pixelart/palettes            — list available palettes
    GET  /pixelart/models              — Ollama model inventory
    POST /pixelart/generate-sprite     — single-frame sprite
    POST /pixelart/generate-animation  — multi-frame animation
    GET  /pixelart/gallery             — list recent generations
    GET  /pixelart/asset/{slug}/{kind} — fetch a specific output file
    POST /pixelart/open-in-pixelorama  — launch Pixelorama on a previous result
"""

from __future__ import annotations

import sys
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

import pixelorama_bridge as pb
from pixelart_prompts import PALETTES
from pixelart_generator import (
    generate_sprite, generate_animation,
    GenerationResult,
    DEFAULT_MODEL, FALLBACK_MODEL, OLLAMA_URL,
)
import requests as _requests

app = FastAPI(
    title="HoloFlow Pixel Art Generator",
    description="Text-to-pixel-art via Ollama + Pixelorama CLI",
    version="1.0",
)


# =============================================================================
# Request bodies
# =============================================================================

class SpriteRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=400,
                         description="What to draw, e.g. 'cute cyan robot face'")
    width: int = Field(16, ge=4, le=64)
    height: int = Field(16, ge=4, le=64)
    palette_name: Optional[str] = Field("holoflow-8")
    palette_colors: Optional[list[str]] = None
    extra_style: str = ""
    model: Optional[str] = None
    open_in_pixelorama: bool = False


class AnimationRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=400)
    frames: int = Field(8, ge=2, le=64)
    width: int = Field(16, ge=4, le=64)
    height: int = Field(16, ge=4, le=64)
    palette_name: Optional[str] = Field("holoflow-8")
    palette_colors: Optional[list[str]] = None
    extra_style: str = ""
    model: Optional[str] = None
    open_in_pixelorama: bool = False
    make_spritesheet: bool = True
    make_gif: bool = True
    gif_fps: int = Field(8, ge=1, le=30)


class OpenInPixeloramaRequest(BaseModel):
    slug: str
    target: str = Field("spritesheet", pattern="^(spritesheet|first_frame|gif)$")


# =============================================================================
# Result serialization
# =============================================================================

def _result_to_dict(r: GenerationResult) -> dict:
    """Convert GenerationResult to a JSON-safe dict with relative asset URLs."""
    return {
        "title": r.title,
        "slug": r.slug,
        "width": r.width,
        "height": r.height,
        "frame_count": r.frame_count,
        "palette": r.palette,
        "model_used": r.model_used,
        "elapsed_s": round(r.elapsed_s, 2),
        "prompt": r.prompt,
        "assets": {
            "frames": [f"/pixelart/asset/{r.slug}/frame/{i}" for i in range(r.frame_count)],
            "previews": [f"/pixelart/asset/{r.slug}/preview/{i}" for i in range(len(r.previews))],
            "spritesheet": f"/pixelart/asset/{r.slug}/spritesheet" if r.spritesheet else None,
            "spritesheet_preview": f"/pixelart/asset/{r.slug}/spritesheet_preview" if r.spritesheet else None,
            "gif": f"/pixelart/asset/{r.slug}/gif" if r.gif else None,
            "provenance": f"/pixelart/asset/{r.slug}/provenance" if r.json_path else None,
        },
        "files": {  # absolute paths for native Windows clients
            "frames": r.frames,
            "previews": r.previews,
            "spritesheet": r.spritesheet,
            "gif": r.gif,
            "provenance": r.json_path,
        }
    }


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/info")
def info():
    """Backend status — Ollama reachable, default model, palette count."""
    ollama_ok = False
    available_models: list[str] = []
    try:
        r = _requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        r.raise_for_status()
        available_models = [m["name"] for m in r.json().get("models", [])]
        ollama_ok = True
    except Exception:
        pass

    out_dir = pb.SPRITES_OUT
    generations: list[str] = []
    if out_dir.exists():
        generations = sorted(
            (d.name for d in out_dir.iterdir() if d.is_dir()),
            reverse=True,
        )

    return {
        "ollama_url": OLLAMA_URL,
        "ollama_reachable": ollama_ok,
        "default_model": DEFAULT_MODEL,
        "fallback_model": FALLBACK_MODEL,
        "models_available": available_models,
        "palettes_count": len(PALETTES),
        "palettes_names": list(PALETTES.keys()),
        "output_dir": str(out_dir),
        "previous_generations_count": len(generations),
        "previous_generations": generations[:20],
    }


@app.get("/palettes")
def list_palettes():
    """Return all bundled palettes with their colours."""
    return {
        "count": len(PALETTES),
        "palettes": [
            {"name": k, "size": len(v), "colors": v}
            for k, v in PALETTES.items()
        ]
    }


@app.get("/models")
def list_models():
    """Probe Ollama for available models."""
    try:
        r = _requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(503, f"Ollama unreachable: {e}")


@app.post("/generate-sprite")
def generate_sprite_endpoint(req: SpriteRequest):
    """Generate a single-frame pixel sprite."""
    try:
        result = generate_sprite(
            subject=req.subject,
            width=req.width,
            height=req.height,
            palette_name=req.palette_name,
            palette_colors=req.palette_colors,
            extra_style=req.extra_style,
            model=req.model,
            open_in_pixelorama=req.open_in_pixelorama,
        )
        return _result_to_dict(result)
    except Exception as e:
        raise HTTPException(500, f"Generation failed: {e}")


@app.post("/generate-animation")
def generate_animation_endpoint(req: AnimationRequest):
    """Generate a multi-frame pixel animation. Returns paths to PNGs, spritesheet, GIF."""
    try:
        result = generate_animation(
            subject=req.subject,
            frames=req.frames,
            width=req.width,
            height=req.height,
            palette_name=req.palette_name,
            palette_colors=req.palette_colors,
            extra_style=req.extra_style,
            model=req.model,
            open_in_pixelorama=req.open_in_pixelorama,
            make_spritesheet=req.make_spritesheet,
            make_gif=req.make_gif,
            gif_fps=req.gif_fps,
        )
        return _result_to_dict(result)
    except Exception as e:
        raise HTTPException(500, f"Generation failed: {e}")


@app.get("/gallery")
def gallery(limit: int = Query(50, ge=1, le=200)):
    """List recent generations with their provenance summary."""
    out_dir = pb.SPRITES_OUT
    if not out_dir.exists():
        return {"count": 0, "items": []}

    items: list[dict] = []
    for d in sorted(out_dir.iterdir(), key=lambda x: x.stat().st_mtime if x.is_dir() else 0, reverse=True):
        if not d.is_dir():
            continue
        prov = d / f"{d.name}.provenance.json"
        if prov.exists():
            try:
                import json as _j
                data = _j.loads(prov.read_text(encoding="utf-8"))
                items.append({
                    "slug": d.name,
                    "title": data.get("title", d.name),
                    "subject": data.get("subject", ""),
                    "width": data.get("width"),
                    "height": data.get("height"),
                    "frame_count": data.get("frame_count", 1),
                    "model_used": data.get("model_used"),
                    "ts": data.get("ts"),
                    "mtime": d.stat().st_mtime,
                    "has_gif": data.get("gif") is not None,
                    "has_spritesheet": data.get("spritesheet") is not None,
                })
            except Exception:
                items.append({"slug": d.name, "error": "could not read provenance"})
        else:
            items.append({"slug": d.name, "title": d.name})

        if len(items) >= limit:
            break

    return {"count": len(items), "items": items}


@app.get("/asset/{slug}/{kind}")
def get_asset(slug: str, kind: str, index: int = 0):
    """Fetch a specific output file (PNG, GIF, JSON).

    kind: frame | preview | spritesheet | spritesheet_preview | gif | provenance
    index: for frame/preview kinds, which frame number
    """
    project_dir = pb.SPRITES_OUT / slug
    if not project_dir.exists():
        raise HTTPException(404, f"unknown slug: {slug}")

    if kind == "frame":
        candidates = sorted((project_dir / "frames").glob("frame_*.png"))
        if not candidates or index >= len(candidates):
            raise HTTPException(404, "frame not found")
        return FileResponse(candidates[index], media_type="image/png")

    elif kind == "preview":
        candidates = sorted((project_dir / "previews").glob("frame_*.png"))
        if not candidates or index >= len(candidates):
            raise HTTPException(404, "preview not found")
        return FileResponse(candidates[index], media_type="image/png")

    elif kind == "spritesheet":
        p = project_dir / f"{slug}_spritesheet.png"
        if not p.exists():
            raise HTTPException(404, "spritesheet not found")
        return FileResponse(p, media_type="image/png")

    elif kind == "spritesheet_preview":
        p = project_dir / f"{slug}_spritesheet_x16.png"
        if not p.exists():
            raise HTTPException(404, "spritesheet preview not found")
        return FileResponse(p, media_type="image/png")

    elif kind == "gif":
        p = project_dir / f"{slug}.gif"
        if not p.exists():
            raise HTTPException(404, "gif not found")
        return FileResponse(p, media_type="image/gif")

    elif kind == "provenance":
        p = project_dir / f"{slug}.provenance.json"
        if not p.exists():
            raise HTTPException(404, "provenance not found")
        return FileResponse(p, media_type="application/json")

    raise HTTPException(400, f"unknown kind: {kind}")


@app.post("/open-in-pixelorama")
def open_in_pixelorama(req: OpenInPixeloramaRequest):
    """Launch Pixelorama on a previous result for refinement."""
    project_dir = pb.SPRITES_OUT / req.slug
    if not project_dir.exists():
        raise HTTPException(404, f"unknown slug: {req.slug}")

    target_path: Optional[Path] = None
    if req.target == "spritesheet":
        target_path = project_dir / f"{req.slug}_spritesheet.png"
    elif req.target == "first_frame":
        frames = sorted((project_dir / "frames").glob("frame_*.png"))
        if frames:
            target_path = frames[0]
    elif req.target == "gif":
        target_path = project_dir / f"{req.slug}.gif"

    if not target_path or not target_path.exists():
        raise HTTPException(404, f"target file not found: {req.target}")

    if not pb.PIXELORAMA_EXE.exists():
        raise HTTPException(500, f"Pixelorama exe not at {pb.PIXELORAMA_EXE}")

    DETACHED_PROCESS = 0x00000008
    CREATE_NEW_PROCESS_GROUP = 0x00000200
    proc = subprocess.Popen(
        [str(pb.PIXELORAMA_EXE), str(target_path)],
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        close_fds=True,
    )
    return {"pid": proc.pid, "opened": str(target_path)}
