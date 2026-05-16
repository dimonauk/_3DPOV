"""
pixelart_generator.py
=====================
Pixel art + animation generator. Pipeline:

    text prompt
        ↓ (Ollama / dolphin-mistral or qwen2.5-coder)
    structured JSON {title, width, height, palette, frames[]}
        ↓ (Python + PIL — pixel-perfect render, alpha for index 0)
    PNG per frame in D:\\HoloFlow\\bridge\\to-pixelorama\\<title>\\
        ↓ (Pixelorama CLI for spritesheet + GIF, or launches for editing)
    final deliverable (single PNG, spritesheet PNG, animated GIF, or .pxo)

Three callable surfaces:
    1. Module: from pixelart_generator import generate_sprite, generate_animation
    2. CLI:    python pixelart_generator.py "fire elemental walking" --frames 8
    3. MCP / FastAPI — see mcp_server.py and pixelart_bridge.py

Defaults to dolphin-mistral. Falls back to qwen2.5-coder:14b if dolphin
returns invalid JSON twice in a row (qwen is stricter at structured output).
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any

import requests
from PIL import Image

# Same-folder imports
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from pixelart_prompts import (
    PALETTES,
    SYSTEM_PROMPT_SINGLE,
    SYSTEM_PROMPT_ANIMATION,
    build_user_prompt,
)
import pixelorama_bridge as pb
from mqtt_bus import bus

# =============================================================================
# Configuration
# =============================================================================

OLLAMA_URL = os.environ.get("OLLAMA_API_BASE", "http://127.0.0.1:11434")
DEFAULT_MODEL = os.environ.get("HOLOFLOW_PIXELART_MODEL", "dolphin-mistral:latest")
FALLBACK_MODEL = os.environ.get("HOLOFLOW_PIXELART_FALLBACK", "qwen2.5-coder:14b")

# Where finished art goes
OUTPUT_DIR = pb.SPRITES_OUT  # D:\HoloFlow\bridge\to-pixelorama\

# Per-frame display scale when saving a "preview" (nearest-neighbour, no AA)
PREVIEW_SCALE = 16


# =============================================================================
# Data classes
# =============================================================================

@dataclass
class GenerationResult:
    title: str
    slug: str
    width: int
    height: int
    palette: list[str]
    frame_count: int
    frames: list[str]            # paths to per-frame PNGs (native resolution)
    previews: list[str]          # paths to upscaled previews
    spritesheet: str | None = None
    gif: str | None = None
    pxo: str | None = None
    json_path: str | None = None  # provenance JSON
    model_used: str = ""
    elapsed_s: float = 0.0
    prompt: str = ""


# =============================================================================
# Ollama client
# =============================================================================

def _ollama_generate(
    system: str,
    user: str,
    model: str,
    timeout_s: int = 240,
    temperature: float = 0.4,
) -> str:
    """Call Ollama's /api/generate with format=json so we get valid JSON back."""
    payload = {
        "model": model,
        "system": system,
        "prompt": user,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 4096,   # plenty for 16x16 frames
            "num_ctx": 8192,
        },
    }
    r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=timeout_s)
    r.raise_for_status()
    return r.json()["response"]


def _try_parse(blob: str) -> dict | None:
    """Best-effort JSON parsing. The model SHOULD return clean JSON because of
    format=json, but be defensive — strip code fences, find first { ... } block."""
    blob = blob.strip()

    # Try raw
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        pass

    # Strip code fences
    blob = re.sub(r"^```(?:json)?\s*", "", blob)
    blob = re.sub(r"\s*```\s*$", "", blob)
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        pass

    # Find the first balanced { ... } block
    depth = 0
    start = -1
    for i, c in enumerate(blob):
        if c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and start >= 0:
                candidate = blob[start:i+1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    continue
    return None


def _resolve_palette(p) -> list[tuple[int, int, int, int]]:
    """Convert palette strings (hex or 'transparent') to RGBA tuples."""
    out: list[tuple[int, int, int, int]] = []
    for entry in p:
        if isinstance(entry, str) and entry.lower() in ("transparent", "", "none"):
            out.append((0, 0, 0, 0))
            continue
        if not isinstance(entry, str):
            out.append((0, 0, 0, 0))
            continue
        s = entry.strip().lstrip("#")
        if len(s) == 3:
            s = "".join(c*2 for c in s)
        if len(s) == 6:
            try:
                r, g, b = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)
                out.append((r, g, b, 255))
                continue
            except ValueError:
                pass
        if len(s) == 8:
            try:
                r, g, b, a = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), int(s[6:8], 16)
                out.append((r, g, b, a))
                continue
            except ValueError:
                pass
        # Fall through — opaque magenta to make problems visible
        out.append((255, 0, 255, 255))
    return out


def _normalize_pixels(pixels, expected: int) -> str:
    """Coerce a pixels field to a clean width*height hex string.

    Accepts: a flat string, a list of row strings, a list of lists.
    Truncates / pads to expected length. Replaces invalid chars with '0'.
    """
    if isinstance(pixels, list):
        if pixels and isinstance(pixels[0], list):
            # 2D array of int or single-char str
            flat = "".join(
                hex(int(c))[2:].upper() if isinstance(c, (int, float)) else str(c).upper()
                for row in pixels for c in row
            )
        else:
            flat = "".join(str(row).upper() for row in pixels)
    else:
        flat = str(pixels).upper()

    # Drop whitespace / newlines
    flat = re.sub(r"\s+", "", flat)

    # Replace anything that isn't a valid hex digit with '0' (transparent)
    flat = re.sub(r"[^0-9A-F]", "0", flat)

    # Pad or truncate to exactly width*height
    if len(flat) < expected:
        flat = flat + ("0" * (expected - len(flat)))
    elif len(flat) > expected:
        flat = flat[:expected]
    return flat


def _slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = s.strip("_")
    return s[:64] or "untitled"


def _render_frame(
    pixels: str,
    width: int,
    height: int,
    palette: list[tuple[int, int, int, int]],
    out_path: Path,
) -> None:
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    px = img.load()
    pal_len = len(palette)
    for y in range(height):
        for x in range(width):
            idx_char = pixels[y * width + x]
            try:
                idx = int(idx_char, 16)
            except ValueError:
                idx = 0
            if 0 <= idx < pal_len:
                px[x, y] = palette[idx]
            else:
                px[x, y] = (0, 0, 0, 0)
    img.save(out_path, "PNG")


def _render_preview(native_png: Path, preview_png: Path, scale: int = PREVIEW_SCALE) -> None:
    """Upscale via nearest-neighbour for human viewing (keeps pixel sharpness)."""
    img = Image.open(native_png)
    big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    big.save(preview_png, "PNG")


# =============================================================================
# LLM call + parse with retry/fallback
# =============================================================================

def _generate_json(
    system: str,
    user: str,
    model_primary: str,
    model_fallback: str,
    max_attempts_per_model: int = 2,
) -> tuple[dict, str]:
    """Call Ollama, parse JSON. If it fails up to max_attempts_per_model
    times on the primary, swap to the fallback model."""
    last_error = ""
    for model in (model_primary, model_fallback):
        for attempt in range(max_attempts_per_model):
            try:
                raw = _ollama_generate(system=system, user=user, model=model)
            except Exception as e:
                last_error = f"ollama call failed ({model}): {e}"
                continue
            parsed = _try_parse(raw)
            if parsed is not None:
                return parsed, model
            last_error = f"unparseable JSON from {model} on attempt {attempt+1}"
    raise RuntimeError(f"Could not get valid JSON from any model. Last: {last_error}")


# =============================================================================
# Public API — generate_sprite + generate_animation
# =============================================================================

def generate_sprite(
    subject: str,
    width: int = 16,
    height: int = 16,
    palette_name: str | None = "holoflow-8",
    palette_colors: list[str] | None = None,
    extra_style: str = "",
    model: str | None = None,
    open_in_pixelorama: bool = False,
) -> GenerationResult:
    """Generate a single-frame pixel sprite."""
    return _generate_internal(
        subject=subject,
        width=width,
        height=height,
        palette_name=palette_name,
        palette_colors=palette_colors,
        extra_style=extra_style,
        model=model,
        frame_count=1,
        open_in_pixelorama=open_in_pixelorama,
        make_spritesheet=False,
        make_gif=False,
    )


def generate_animation(
    subject: str,
    frames: int = 8,
    width: int = 16,
    height: int = 16,
    palette_name: str | None = "holoflow-8",
    palette_colors: list[str] | None = None,
    extra_style: str = "",
    model: str | None = None,
    open_in_pixelorama: bool = False,
    make_spritesheet: bool = True,
    make_gif: bool = True,
    gif_fps: int = 8,
) -> GenerationResult:
    """Generate a multi-frame pixel animation. Returns paths to all artefacts."""
    return _generate_internal(
        subject=subject,
        width=width,
        height=height,
        palette_name=palette_name,
        palette_colors=palette_colors,
        extra_style=extra_style,
        model=model,
        frame_count=max(2, frames),
        open_in_pixelorama=open_in_pixelorama,
        make_spritesheet=make_spritesheet,
        make_gif=make_gif,
        gif_fps=gif_fps,
    )


def _generate_internal(
    subject: str,
    width: int,
    height: int,
    palette_name: str | None,
    palette_colors: list[str] | None,
    extra_style: str,
    model: str | None,
    frame_count: int,
    open_in_pixelorama: bool,
    make_spritesheet: bool,
    make_gif: bool,
    gif_fps: int = 8,
) -> GenerationResult:
    t0 = time.time()
    primary = model or DEFAULT_MODEL

    system = SYSTEM_PROMPT_ANIMATION if frame_count > 1 else SYSTEM_PROMPT_SINGLE
    user_prompt = build_user_prompt(
        subject=subject,
        width=width,
        height=height,
        palette_name=palette_name,
        palette_colors=palette_colors,
        frame_count=frame_count,
        extra_style=extra_style,
    )

    bus.publish("pixelart/started", {
        "subject": subject, "width": width, "height": height,
        "frames": frame_count, "model": primary, "ts": t0,
    })

    parsed, model_used = _generate_json(
        system=system,
        user=user_prompt,
        model_primary=primary,
        model_fallback=FALLBACK_MODEL,
    )

    # Validate schema with fallbacks
    title = str(parsed.get("title") or subject)
    slug = _slugify(title)
    w = int(parsed.get("width") or width)
    h = int(parsed.get("height") or height)
    raw_pal = parsed.get("palette") or palette_colors or PALETTES.get(palette_name or "", PALETTES["holoflow-8"])
    rgba_palette = _resolve_palette(raw_pal)
    pal_hex = list(raw_pal)  # keep for provenance

    raw_frames = parsed.get("frames") or []
    if not raw_frames and "pixels" in parsed:
        # Some LLMs return a single frame as a top-level "pixels"
        raw_frames = [{"name": "frame_001", "pixels": parsed["pixels"]}]

    # Stage output folder
    project_dir = OUTPUT_DIR / slug
    project_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = project_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    previews_dir = project_dir / "previews"
    previews_dir.mkdir(exist_ok=True)

    # Render each frame
    expected = w * h
    frame_paths: list[Path] = []
    preview_paths: list[Path] = []
    for i, frame in enumerate(raw_frames[:frame_count] or [{}]):
        if not isinstance(frame, dict):
            frame = {"pixels": str(frame)}
        pixels_norm = _normalize_pixels(frame.get("pixels", ""), expected)
        fpath = frames_dir / f"frame_{i+1:03d}.png"
        _render_frame(pixels_norm, w, h, rgba_palette, fpath)
        frame_paths.append(fpath)

        ppath = previews_dir / f"frame_{i+1:03d}_x{PREVIEW_SCALE}.png"
        _render_preview(fpath, ppath, PREVIEW_SCALE)
        preview_paths.append(ppath)

    # Pad with copies if LLM produced fewer than requested
    while len(frame_paths) < frame_count:
        last = frame_paths[-1]
        copy_path = frames_dir / f"frame_{len(frame_paths)+1:03d}.png"
        Image.open(last).save(copy_path)
        frame_paths.append(copy_path)
        preview_paths.append(_make_preview_copy(copy_path, previews_dir))

    # Build a spritesheet (single PNG, frames laid out horizontally)
    spritesheet_path = None
    if make_spritesheet and len(frame_paths) >= 1:
        sheet = Image.new("RGBA", (w * len(frame_paths), h), (0, 0, 0, 0))
        for i, fp in enumerate(frame_paths):
            sheet.paste(Image.open(fp), (i * w, 0))
        spritesheet_path = project_dir / f"{slug}_spritesheet.png"
        sheet.save(spritesheet_path)
        # Big preview
        big_sheet = sheet.resize(
            (sheet.width * PREVIEW_SCALE, sheet.height * PREVIEW_SCALE),
            Image.NEAREST,
        )
        big_sheet.save(project_dir / f"{slug}_spritesheet_x{PREVIEW_SCALE}.png")

    # Build animated GIF
    gif_path = None
    if make_gif and len(frame_paths) >= 2:
        gif_path = project_dir / f"{slug}.gif"
        imgs = [Image.open(fp).convert("RGBA") for fp in frame_paths]
        # Scale up for visibility (animated GIFs at 16x16 are too small)
        scaled = [img.resize((img.width * 8, img.height * 8), Image.NEAREST) for img in imgs]
        scaled[0].save(
            gif_path,
            save_all=True,
            append_images=scaled[1:],
            duration=int(1000 / max(1, gif_fps)),
            loop=0,
            disposal=2,
        )

    # Write provenance JSON
    json_path = project_dir / f"{slug}.provenance.json"
    provenance = {
        "title": title,
        "slug": slug,
        "subject": subject,
        "width": w,
        "height": h,
        "frame_count": len(frame_paths),
        "palette": pal_hex,
        "palette_name": palette_name,
        "extra_style": extra_style,
        "model_used": model_used,
        "elapsed_s": time.time() - t0,
        "frames": [str(p) for p in frame_paths],
        "previews": [str(p) for p in preview_paths],
        "spritesheet": str(spritesheet_path) if spritesheet_path else None,
        "gif": str(gif_path) if gif_path else None,
        "ts": time.time(),
    }
    json_path.write_text(json.dumps(provenance, indent=2, default=str), encoding="utf-8")

    # Optionally open Pixelorama on the spritesheet for hand-refinement
    pxo_path = None
    if open_in_pixelorama and pb.PIXELORAMA_EXE.exists():
        target = spritesheet_path if spritesheet_path else frame_paths[0]
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        subprocess.Popen(
            [str(pb.PIXELORAMA_EXE), str(target)],
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            close_fds=True,
        )

    result = GenerationResult(
        title=title,
        slug=slug,
        width=w,
        height=h,
        palette=pal_hex,
        frame_count=len(frame_paths),
        frames=[str(p) for p in frame_paths],
        previews=[str(p) for p in preview_paths],
        spritesheet=str(spritesheet_path) if spritesheet_path else None,
        gif=str(gif_path) if gif_path else None,
        pxo=pxo_path,
        json_path=str(json_path),
        model_used=model_used,
        elapsed_s=time.time() - t0,
        prompt=subject,
    )

    bus.publish("pixelart/generated", {
        "title": title, "slug": slug, "frames": len(frame_paths),
        "model": model_used, "elapsed_s": result.elapsed_s,
        "spritesheet": result.spritesheet, "gif": result.gif,
        "ts": time.time(),
    })

    return result


def _make_preview_copy(src: Path, previews_dir: Path) -> Path:
    """Helper for when we copy a frame to pad — also produce its preview."""
    name = src.stem.replace("frame_", f"frame_") + f"_x{PREVIEW_SCALE}.png"
    out = previews_dir / name
    _render_preview(src, out, PREVIEW_SCALE)
    return out


# =============================================================================
# CLI runner
# =============================================================================

def _cli():
    import argparse
    p = argparse.ArgumentParser(description="Pixel art generator (Ollama → Pixelorama)")
    p.add_argument("prompt", help="What to draw, e.g. 'fire elemental walking'")
    p.add_argument("--frames", type=int, default=1, help="Animation frame count (1 = single sprite)")
    p.add_argument("--width", type=int, default=16)
    p.add_argument("--height", type=int, default=16)
    p.add_argument("--palette", default="holoflow-8",
                   help=f"One of: {', '.join(PALETTES.keys())}")
    p.add_argument("--style", default="", help="Extra style hint")
    p.add_argument("--model", default=None, help=f"Override model (default: {DEFAULT_MODEL})")
    p.add_argument("--open", action="store_true", help="Open result in Pixelorama")
    p.add_argument("--no-gif", action="store_true", help="Skip GIF generation")
    p.add_argument("--no-sheet", action="store_true", help="Skip spritesheet")
    p.add_argument("--fps", type=int, default=8)
    args = p.parse_args()

    print(f"[pixelart] prompt: {args.prompt}")
    print(f"[pixelart] {args.width}x{args.height}, {args.frames} frame(s), palette={args.palette}, model={args.model or DEFAULT_MODEL}")
    print()

    if args.frames > 1:
        result = generate_animation(
            subject=args.prompt,
            frames=args.frames,
            width=args.width,
            height=args.height,
            palette_name=args.palette,
            extra_style=args.style,
            model=args.model,
            open_in_pixelorama=args.open,
            make_spritesheet=not args.no_sheet,
            make_gif=not args.no_gif,
            gif_fps=args.fps,
        )
    else:
        result = generate_sprite(
            subject=args.prompt,
            width=args.width,
            height=args.height,
            palette_name=args.palette,
            extra_style=args.style,
            model=args.model,
            open_in_pixelorama=args.open,
        )

    print(f"\n[pixelart] OK in {result.elapsed_s:.1f}s using {result.model_used}")
    print(f"  Title:        {result.title}")
    print(f"  Frames:       {result.frame_count}")
    print(f"  Native PNGs:  {result.frames[0] if result.frames else '(none)'}")
    if len(result.frames) > 1:
        print(f"                ... and {len(result.frames)-1} more")
    if result.previews:
        print(f"  Previews ({PREVIEW_SCALE}x):  {result.previews[0]}")
    if result.spritesheet:
        print(f"  Spritesheet:  {result.spritesheet}")
    if result.gif:
        print(f"  Animated GIF: {result.gif}")
    print(f"  Provenance:   {result.json_path}")
    if args.open:
        print(f"\n  Pixelorama launched.")


if __name__ == "__main__":
    _cli()
