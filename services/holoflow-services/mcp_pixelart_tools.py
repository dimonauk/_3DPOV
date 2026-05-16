"""
mcp_pixelart_tools.py
=====================
Pixel art generation tools for the HoloFlow MCP server.

Imported by mcp_server.py via:
    from mcp_pixelart_tools import register_pixelart_tools
    register_pixelart_tools(mcp)

This keeps the tools modular — easy to swap LLM backends or add new
generation modes without touching the main server file.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))


def register_pixelart_tools(mcp) -> int:
    """Register pixel art @mcp.tool() decorators on the supplied FastMCP instance.

    Returns the number of tools registered.
    """
    # Lazy imports so importing this module doesn't pay startup cost if unused
    from pixelart_generator import generate_sprite, generate_animation, GenerationResult
    from pixelart_prompts import PALETTES
    import pixelorama_bridge as pb

    def _result_to_dict(r: GenerationResult) -> dict:
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
            "frames": r.frames,
            "previews": r.previews,
            "spritesheet": r.spritesheet,
            "gif": r.gif,
            "provenance": r.json_path,
        }

    # ------------------------------------------------------------------ tool 1

    @mcp.tool()
    def generate_pixel_sprite(
        subject: str,
        width: int = 16,
        height: int = 16,
        palette: str = "holoflow-8",
        style: str = "",
        model: Optional[str] = None,
        open_in_pixelorama: bool = False,
    ) -> dict:
        """Generate a single-frame pixel art sprite from a text description.

        Uses Ollama (default dolphin-mistral, falls back to qwen2.5-coder:14b on
        invalid JSON). Renders to PNG via PIL with the chosen palette. Outputs
        land in D:\\HoloFlow\\bridge\\to-pixelorama\\<slug>\\.

        Args:
            subject: what to draw, e.g. "cute cyan robot face"
            width: canvas width in cells (4-64, default 16)
            height: canvas height in cells (4-64, default 16)
            palette: one of holoflow-8 / holoflow-5 / mono-magenta / mono-cyan /
                     warm-fire / pico-8 / endesga-16 / gameboy-4 / bw-1bit
            style: optional extra style hint, e.g. "chibi", "menacing", "stained glass"
            model: override default model (otherwise uses HOLOFLOW_PIXELART_MODEL env)
            open_in_pixelorama: launch Pixelorama on the result for hand-refinement

        Returns paths to: native PNG, 16x preview PNG, provenance JSON.
        """
        if palette and palette not in PALETTES:
            return {
                "error": f"unknown palette: {palette}",
                "available_palettes": list(PALETTES.keys()),
            }
        try:
            result = generate_sprite(
                subject=subject,
                width=width,
                height=height,
                palette_name=palette,
                extra_style=style,
                model=model,
                open_in_pixelorama=open_in_pixelorama,
            )
            return _result_to_dict(result)
        except Exception as e:
            return {"error": str(e)}

    # ------------------------------------------------------------------ tool 2

    @mcp.tool()
    def generate_pixel_animation(
        subject: str,
        frames: int = 8,
        width: int = 16,
        height: int = 16,
        palette: str = "holoflow-8",
        style: str = "",
        model: Optional[str] = None,
        gif_fps: int = 8,
        open_in_pixelorama: bool = False,
    ) -> dict:
        """Generate a multi-frame pixel art animation (looping).

        Creates N distinct frames sharing one palette. Renders each to a PNG,
        builds a horizontal spritesheet, and bakes an animated GIF (8x upscaled
        for visibility, looping at `gif_fps`).

        Args:
            subject: what to animate, e.g. "flickering torch flame"
            frames: number of animation frames (2-64, default 8)
            width: cells wide (4-64)
            height: cells tall (4-64)
            palette: one of the bundled palette names
            style: optional style hint
            model: override default LLM
            gif_fps: GIF playback speed (1-30, default 8)
            open_in_pixelorama: launch Pixelorama on the spritesheet

        Best subjects for animation: walk cycles, flames, water, idle breathing,
        magic glow, eyes blinking, hair sway. Worst: complex scenes, faces close-up.
        """
        if palette and palette not in PALETTES:
            return {
                "error": f"unknown palette: {palette}",
                "available_palettes": list(PALETTES.keys()),
            }
        try:
            result = generate_animation(
                subject=subject,
                frames=max(2, frames),
                width=width,
                height=height,
                palette_name=palette,
                extra_style=style,
                model=model,
                gif_fps=gif_fps,
                open_in_pixelorama=open_in_pixelorama,
                make_spritesheet=True,
                make_gif=True,
            )
            return _result_to_dict(result)
        except Exception as e:
            return {"error": str(e)}

    # ------------------------------------------------------------------ tool 3

    @mcp.tool()
    def list_pixelart_palettes() -> dict:
        """List all available pixel art palettes with their colours.

        Use this to pick a palette before calling generate_pixel_sprite or
        generate_pixel_animation. holoflow-8 is Dimona's brand palette;
        warm-fire is best for flames; pico-8 for retro game style.
        """
        return {
            "count": len(PALETTES),
            "palettes": {name: colors for name, colors in PALETTES.items()},
        }

    # ------------------------------------------------------------------ tool 4

    @mcp.tool()
    def list_pixelart_gallery(limit: int = 30) -> list:
        """List recent pixel art generations from the bridge folder.

        Returns title, dimensions, frame count, model used, and asset paths for
        each. Newest first.
        """
        out_dir = pb.SPRITES_OUT
        if not out_dir.exists():
            return []
        import json as _j
        items: list = []
        for d in sorted(out_dir.iterdir(),
                        key=lambda x: x.stat().st_mtime if x.is_dir() else 0,
                        reverse=True):
            if not d.is_dir():
                continue
            prov = d / f"{d.name}.provenance.json"
            if prov.exists():
                try:
                    data = _j.loads(prov.read_text(encoding="utf-8"))
                    items.append({
                        "slug": d.name,
                        "title": data.get("title", d.name),
                        "subject": data.get("subject", ""),
                        "width": data.get("width"),
                        "height": data.get("height"),
                        "frame_count": data.get("frame_count", 1),
                        "model_used": data.get("model_used"),
                        "has_gif": data.get("gif") is not None,
                        "has_spritesheet": data.get("spritesheet") is not None,
                        "spritesheet_path": data.get("spritesheet"),
                        "gif_path": data.get("gif"),
                    })
                except Exception:
                    items.append({"slug": d.name, "error": "could not read provenance"})
            if len(items) >= limit:
                break
        return items

    # ------------------------------------------------------------------ tool 5

    @mcp.tool()
    def open_pixelart_in_pixelorama(slug: str, target: str = "spritesheet") -> dict:
        """Launch Pixelorama on a previous pixel art generation for refinement.

        Args:
            slug: the generation's slug (from list_pixelart_gallery)
            target: 'spritesheet' | 'first_frame' | 'gif'
        """
        import subprocess as _sp
        project_dir = pb.SPRITES_OUT / slug
        if not project_dir.exists():
            return {"error": f"unknown slug: {slug}"}

        target_path = None
        if target == "spritesheet":
            target_path = project_dir / f"{slug}_spritesheet.png"
        elif target == "first_frame":
            frames = sorted((project_dir / "frames").glob("frame_*.png"))
            if frames:
                target_path = frames[0]
        elif target == "gif":
            target_path = project_dir / f"{slug}.gif"

        if not target_path or not target_path.exists():
            return {"error": f"target file not found: {target}"}

        if not pb.PIXELORAMA_EXE.exists():
            return {"error": f"Pixelorama exe not found at {pb.PIXELORAMA_EXE}"}

        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        proc = _sp.Popen(
            [str(pb.PIXELORAMA_EXE), str(target_path)],
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            close_fds=True,
        )
        return {"pid": proc.pid, "opened": str(target_path)}

    return 5  # number of tools registered
