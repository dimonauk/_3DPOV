"""ComfyUI bridge for HoloFlow Mesh Studio.

Mounts /comfyui/* on the FastAPI sidecar. Wraps ComfyUI's /prompt API.

Pipeline (Pixel Art mode):
    CheckpointLoaderSimple -> EmptyLatentImage -> CLIPTextEncode x2
    -> KSampler -> VAEDecode -> PixelArtDetectorToImage
    -> PixelArtPaletteConverter -> SaveImage
    -> result lives at D:\\The_Hangar\\engines\\comfyui\\output\\

Defaults to juggernautXL_v9Rdphoto2Lightning (4-8 step Lightning model)
plus PixelArt-Detector post-process for grid alignment + palette quantization.

Endpoints:
    GET  /comfyui/info                    Probe ComfyUI status + capabilities
    GET  /comfyui/checkpoints             List checkpoints from ComfyUI
    GET  /comfyui/palettes                List PixelArt-Detector palettes
    POST /comfyui/generate-pixel          Run the pixel-art pipeline
    GET  /comfyui/result/{slug}           Fetch saved generation
    GET  /comfyui/asset/{slug}/{kind}     Fetch frame|preview|provenance
"""

from __future__ import annotations

import asyncio
import json
import random
import re
import shutil
import time
import uuid
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# MQTT — graceful fall-back if mqtt_bus isn't importable
# ---------------------------------------------------------------------------

try:
    from mqtt_bus import emit_event  # type: ignore
except Exception:  # pragma: no cover
    def emit_event(*_a, **_kw): return None  # type: ignore

# ---------------------------------------------------------------------------
# Paths + constants
# ---------------------------------------------------------------------------

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_BASE = Path(r"D:\The_Hangar\engines\comfyui")
COMFYUI_OUTPUT_DIR = COMFYUI_BASE / "output"
PALETTE_DIR_1X = COMFYUI_BASE / "custom_nodes" / "ComfyUI-PixelArt-Detector" / "palettes" / "1x"

HOLOFLOW_BRIDGE = Path(r"D:\HoloFlow\bridge\to-pixelorama")
HOLOFLOW_BRIDGE.mkdir(parents=True, exist_ok=True)

CLIENT_ID = str(uuid.uuid4())

# Reasonable default — Lightning model, 4-8 steps, on disk at 6.62 GB
DEFAULT_MODEL = "juggernautXL_v9Rdphoto2Lightning.safetensors"
DEFAULT_PALETTE = "apollo-1x.png"
DEFAULT_STEPS = 8
DEFAULT_CFG = 2.0  # Lightning models like low CFG

# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=400, description="What to draw")
    palette: str = Field(DEFAULT_PALETTE, description="Palette PNG name e.g. 'apollo-32x.png'")
    width: int = Field(1024, ge=512, le=1536)
    height: int = Field(1024, ge=512, le=1536)
    model: str = Field(DEFAULT_MODEL)
    steps: int = Field(DEFAULT_STEPS, ge=1, le=50)
    cfg: float = Field(DEFAULT_CFG, ge=0.5, le=15.0)
    sampler: str = Field("dpmpp_sde")  # Good for Lightning
    scheduler: str = Field("karras")
    extra_prompt: str = Field("", description="Style addons")
    negative: str = Field("blurry, smooth, anti-aliased, photorealistic, 3d render, gradient, soft")
    seed: int = Field(-1, description="-1 = random")
    grid_downscale: bool = Field(True, description="Apply PixelArtDetectorToImage")
    palette_convert: bool = Field(True, description="Apply PixelArtPaletteConverter")

# ---------------------------------------------------------------------------
# API-format workflow builder
# ---------------------------------------------------------------------------

def _slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")
    return s[:48] or "sprite"

def _build_workflow(req: GenerateRequest, out_prefix: str) -> dict:
    """Construct the ComfyUI API-format workflow dict.

    Each node has a unique string id, class_type, and inputs that either
    reference upstream nodes via [node_id, output_index] or are literal values.
    """
    seed = req.seed if req.seed >= 0 else random.randint(0, 2**32 - 1)

    positive_text = (
        f"pixelart, pixel art, {req.subject}, "
        "8-bit graphics, low resolution, sharp pixels, "
        "limited palette, clean edges, no anti-aliasing, retro game sprite"
    )
    if req.extra_prompt.strip():
        positive_text += f", {req.extra_prompt.strip()}"

    wf: dict[str, dict] = {
        # ---- model + latent ----
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": req.model},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": req.width, "height": req.height, "batch_size": 1},
        },
        # ---- text encoders ----
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": positive_text, "clip": ["4", 1]},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": req.negative, "clip": ["4", 1]},
        },
        # ---- sampling ----
        "10": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": req.steps,
                "cfg": req.cfg,
                "sampler_name": req.sampler,
                "scheduler": req.scheduler,
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        # ---- decode ----
        "17": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["10", 0], "vae": ["4", 2]},
        },
    }

    # The image flowing to SaveImage — starts as VAEDecode's output, possibly rerouted
    image_ref: list = ["17", 0]

    if req.grid_downscale:
        wf["121"] = {
            "class_type": "PixelArtDetectorToImage",
            "inputs": {
                "images": image_ref,
                "reduce_palette": False,
                "reduce_palette_max_colors": 128,
            },
        }
        image_ref = ["121", 0]

    if req.palette_convert and req.palette and req.palette != "none":
        wf["125"] = {
            "class_type": "PixelArtLoadPalettes",
            "inputs": {
                "image": req.palette,
                "render_all_palettes_in_grid": False,
                "grid_settings": "default",
                "paletteList_grid_font_size": 40,
                "paletteList_grid_font_color": "#f40e12",
                "paletteList_grid_background": "#fff",
                "paletteList_grid_cols": 6,
                "paletteList_grid_add_border": True,
                "paletteList_grid_border_width": 3,
            },
        }
        wf["126"] = {
            "class_type": "PixelArtDetectorConverter",
            "inputs": {
                "images": image_ref,
                "palette": "GAMEBOY",
                "resize_w": 512,
                "resize_h": 512,
                "resize_type": "contain",
                "pixelize": "Image.quantize",
                "grid_pixelate_grid_scan_size": 2,
                "reduce_colors_before_palette_swap": False,
                "reduce_colors_method": "Image.quantize",
                "reduce_colors_max_colors": 128,
                "apply_pixeldetector_max_colors": True,
                "image_quantize_reduce_method": "MAXCOVERAGE",
                "opencv_settings": "",
                "opencv_kmeans_centers": "RANDOM_CENTERS",
                "opencv_kmeans_attempts": 10,
                "opencv_criteria_max_iterations": 10,
                "pycluster_kmeans_metrics": "EUCLIDEAN_SQUARE",
                "cleanup": "",
                "cleanup_colors": False,
                "cleanup_pixels_threshold": 0.02,
                "dither": "floyd-steinberg",
                "paletteList": ["125", 0],
            },
        }
        image_ref = ["126", 0]

    # ---- save (single SaveImage node, custom prefix so we can find it) ----
    wf["999"] = {
        "class_type": "SaveImage",
        "inputs": {
            "images": image_ref,
            "filename_prefix": out_prefix,
        },
    }

    return wf

# ---------------------------------------------------------------------------
# ComfyUI HTTP plumbing
# ---------------------------------------------------------------------------

async def _comfy_post_prompt(workflow: dict) -> str:
    async with httpx.AsyncClient(timeout=30.0) as cx:
        r = await cx.post(
            f"{COMFYUI_URL}/prompt",
            json={"prompt": workflow, "client_id": CLIENT_ID},
        )
        if r.status_code != 200:
            raise HTTPException(502, f"ComfyUI /prompt failed: {r.status_code} {r.text[:400]}")
        body = r.json()
        if "prompt_id" not in body:
            raise HTTPException(502, f"ComfyUI returned no prompt_id: {body}")
        return body["prompt_id"]

async def _comfy_wait_history(prompt_id: str, timeout_s: int = 300) -> dict:
    """Poll /history/<prompt_id> until outputs land, or timeout."""
    deadline = time.monotonic() + timeout_s
    async with httpx.AsyncClient(timeout=10.0) as cx:
        while time.monotonic() < deadline:
            try:
                r = await cx.get(f"{COMFYUI_URL}/history/{prompt_id}")
                if r.status_code == 200:
                    h = r.json()
                    if prompt_id in h:
                        entry = h[prompt_id]
                        if entry.get("status", {}).get("completed"):
                            return entry
                        # Status can also be "executing"; still poll
            except Exception:
                pass
            await asyncio.sleep(0.6)
    raise HTTPException(504, f"ComfyUI generation timed out after {timeout_s}s")

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

app = FastAPI(title="HoloFlow ComfyUI Bridge", version="0.1.0")


@app.get("/info")
async def info() -> dict:
    """Probe ComfyUI + list capabilities."""
    async with httpx.AsyncClient(timeout=5.0) as cx:
        try:
            stats = (await cx.get(f"{COMFYUI_URL}/system_stats")).json()
            reachable = True
        except Exception:
            stats = None
            reachable = False

        checkpoints = []
        loras = []
        if reachable:
            try:
                obj = (await cx.get(f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple")).json()
                checkpoints = obj["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
            except Exception:
                pass
            try:
                obj = (await cx.get(f"{COMFYUI_URL}/object_info/LoraLoader")).json()
                loras = obj["LoraLoader"]["input"]["required"]["lora_name"][0]
            except Exception:
                pass

    palettes = []
    if PALETTE_DIR_1X.exists():
        palettes = sorted([p.name for p in PALETTE_DIR_1X.glob("*.png")])

    return {
        "comfyui_url": COMFYUI_URL,
        "comfyui_reachable": reachable,
        "system_stats": stats,
        "default_model": DEFAULT_MODEL,
        "default_palette": DEFAULT_PALETTE,
        "default_steps": DEFAULT_STEPS,
        "checkpoints_count": len(checkpoints),
        "checkpoints": checkpoints[:30],  # first 30 for preview
        "loras_count": len(loras),
        "loras": loras[:30],
        "palettes_count": len(palettes),
        "palettes": palettes,
        "output_dir": str(COMFYUI_OUTPUT_DIR),
        "bridge_dir": str(HOLOFLOW_BRIDGE),
    }


@app.get("/checkpoints")
async def checkpoints() -> dict:
    async with httpx.AsyncClient(timeout=5.0) as cx:
        obj = (await cx.get(f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple")).json()
        names = obj["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
    return {"count": len(names), "checkpoints": names}


@app.get("/palettes")
def palettes_list() -> dict:
    if not PALETTE_DIR_1X.exists():
        return {"count": 0, "palettes": [], "path": str(PALETTE_DIR_1X)}
    names = sorted([p.name for p in PALETTE_DIR_1X.glob("*.png")])
    return {"count": len(names), "palettes": names, "path": str(PALETTE_DIR_1X)}


@app.post("/generate-pixel")
async def generate_pixel(req: GenerateRequest) -> dict:
    """Run SDXL + PixelArt-Detector pipeline → return result paths."""
    slug = f"comfy_{_slugify(req.subject)}_{int(time.time())}"
    prefix = f"holoflow_{slug}"

    emit_event(
        "holoflow/comfyui/started",
        {"subject": req.subject, "slug": slug, "model": req.model, "palette": req.palette},
    )

    workflow = _build_workflow(req, out_prefix=prefix)

    t0 = time.monotonic()
    prompt_id = await _comfy_post_prompt(workflow)
    history = await _comfy_wait_history(prompt_id, timeout_s=300)
    elapsed_s = time.monotonic() - t0

    # Extract output image path
    outputs = history.get("outputs", {})
    save_output = outputs.get("999") or next((v for v in outputs.values() if "images" in v), None)
    if not save_output or "images" not in save_output:
        raise HTTPException(500, f"ComfyUI completed but no image found in outputs: {outputs}")

    images = save_output["images"]
    if not images:
        raise HTTPException(500, "ComfyUI returned empty images list")

    img_info = images[0]  # {"filename": "...", "subfolder": "", "type": "output"}
    src_path = COMFYUI_OUTPUT_DIR
    if img_info.get("subfolder"):
        src_path = src_path / img_info["subfolder"]
    src_path = src_path / img_info["filename"]

    if not src_path.exists():
        raise HTTPException(500, f"ComfyUI image not found on disk: {src_path}")

    # Copy into HoloFlow bridge folder
    slug_dir = HOLOFLOW_BRIDGE / slug
    slug_dir.mkdir(parents=True, exist_ok=True)
    dest_path = slug_dir / "sprite.png"
    shutil.copy2(src_path, dest_path)

    # Write provenance
    provenance = {
        "slug": slug,
        "subject": req.subject,
        "palette": req.palette,
        "model": req.model,
        "width": req.width,
        "height": req.height,
        "steps": req.steps,
        "cfg": req.cfg,
        "sampler": req.sampler,
        "scheduler": req.scheduler,
        "negative": req.negative,
        "elapsed_s": elapsed_s,
        "prompt_id": prompt_id,
        "comfy_filename": img_info["filename"],
        "ts": time.time(),
    }
    (slug_dir / "provenance.json").write_text(json.dumps(provenance, indent=2))

    emit_event(
        "holoflow/comfyui/generated",
        {"slug": slug, "elapsed_s": elapsed_s, "model": req.model},
    )

    return {
        "slug": slug,
        "title": req.subject,
        "model": req.model,
        "palette": req.palette,
        "elapsed_s": round(elapsed_s, 2),
        "image_url": f"/comfyui/asset/{slug}/sprite",
        "provenance_url": f"/comfyui/asset/{slug}/provenance",
        "saved_to": str(dest_path),
    }


@app.get("/asset/{slug}/{kind}")
def asset(slug: str, kind: str):
    slug_dir = HOLOFLOW_BRIDGE / slug
    if not slug_dir.exists():
        raise HTTPException(404, f"Slug not found: {slug}")
    if kind == "sprite":
        p = slug_dir / "sprite.png"
        if p.exists():
            return FileResponse(p, media_type="image/png")
    elif kind == "provenance":
        p = slug_dir / "provenance.json"
        if p.exists():
            return FileResponse(p, media_type="application/json")
    raise HTTPException(404, f"Asset not found: {slug}/{kind}")


@app.get("/gallery")
def gallery(limit: int = 50) -> dict:
    """List previous ComfyUI generations (prefix 'comfy_')."""
    if not HOLOFLOW_BRIDGE.exists():
        return {"count": 0, "items": []}
    items = []
    for d in sorted(HOLOFLOW_BRIDGE.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not d.is_dir() or not d.name.startswith("comfy_"):
            continue
        prov_file = d / "provenance.json"
        if not prov_file.exists():
            continue
        try:
            prov = json.loads(prov_file.read_text())
            items.append({
                "slug": d.name,
                "title": prov.get("subject", d.name),
                "palette": prov.get("palette"),
                "model": prov.get("model"),
                "width": prov.get("width"),
                "height": prov.get("height"),
                "elapsed_s": prov.get("elapsed_s"),
                "ts": prov.get("ts"),
                "has_sprite": (d / "sprite.png").exists(),
            })
            if len(items) >= limit:
                break
        except Exception:
            continue
    return {"count": len(items), "items": items}
