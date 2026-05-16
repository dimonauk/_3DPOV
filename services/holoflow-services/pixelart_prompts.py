"""
pixelart_prompts.py
===================
System prompts + palette library for the Ollama → Pixelorama pipeline.

Schema: row-array format. Each frame's `pixels` is a list of row strings, where
each row is `width` characters long. This is easier for small LLMs to maintain
because they can count rows independently of position-within-row.

The renderer (`_normalize_pixels` in pixelart_generator.py) accepts EITHER a
flat string OR a list-of-rows. Models naturally prefer the list-of-rows.
"""

from __future__ import annotations

# =============================================================================
# Holo-Flow signature palettes
# =============================================================================

PALETTES = {
    "holoflow-8": [
        "transparent",
        "#FF66CC", "#66CCFF", "#FFCC66", "#0E0E14",
        "#E4E4EC", "#7A4FAA", "#3DDC97",
    ],
    "holoflow-5": [
        "transparent",
        "#FF66CC", "#66CCFF", "#0E0E14", "#E4E4EC",
    ],
    "mono-magenta": [
        "transparent",
        "#1A0A14", "#4A1F35", "#8A2F66", "#C44890",
        "#FF66CC", "#FFB8E0", "#FFE0F0",
    ],
    "mono-cyan": [
        "transparent",
        "#0A1418", "#1F3540", "#2F6680", "#4890C4",
        "#66CCFF", "#B8E0FF", "#E0F0FF",
    ],
    "warm-fire": [
        "transparent",
        "#1A0000", "#3D0F0F", "#7A1F1F", "#CC3300",
        "#FF6600", "#FFAA00", "#FFE040", "#FFFFD0",
    ],
    "pico-8": [
        "transparent",
        "#1D2B53", "#7E2553", "#008751", "#AB5236",
        "#5F574F", "#C2C3C7", "#FFF1E8", "#FF004D",
        "#FFA300", "#FFEC27", "#00E436", "#29ADFF",
        "#83769C", "#FF77A8", "#FFCCAA",
    ],
    "endesga-16": [
        "transparent",
        "#E4A672", "#B86F50", "#743F39", "#3F2832",
        "#9E2835", "#E53B44", "#FB922B", "#FFE762",
        "#63C64D", "#327345", "#193D3F", "#4F6781",
        "#AFBFD2", "#FFFFFF", "#2CE8F4",
    ],
    "gameboy-4": [
        "transparent",
        "#0F380F", "#306230", "#8BAC0F", "#9BBC0F",
    ],
    "bw-1bit": [
        "transparent",
        "#FFFFFF", "#000000",
    ],
}


# =============================================================================
# System prompt — single sprite
# =============================================================================

SYSTEM_PROMPT_SINGLE = """You are a pixel art designer. Given a description, you produce a tiny pixel-art sprite as JSON only.

OUTPUT FORMAT — JSON OBJECT WITH EXACTLY THESE FIELDS:
  - title:   short string
  - width:   int (canvas width in cells)
  - height:  int (canvas height in cells)
  - palette: array of hex colour strings, index 0 = transparent
  - frames:  array containing ONE frame object

EACH FRAME OBJECT:
  - name:   string (e.g. "frame_001")
  - pixels: ARRAY OF ROW STRINGS. One element per row. Each row string is EXACTLY `width` characters long. Single hex digit per cell, 0-9 or A-F (uppercase). Index 0 = transparent.

CRITICAL RULES:
  - Respond with the JSON object only. No markdown fences, no commentary, no prose.
  - The pixels array must have EXACTLY `height` row strings.
  - Each row string must have EXACTLY `width` characters.
  - DRAW SOMETHING. Do not fill with zeros. The subject must be visible.
  - Centre the subject. Use the canvas. A 16x16 sprite should have ~60-80% non-zero cells.

EXAMPLE (8x8 smiley face, palette has yellow + black + white):
{
  "title": "smiley",
  "width": 8,
  "height": 8,
  "palette": ["transparent", "#FFE040", "#000000", "#FFFFFF"],
  "frames": [
    {
      "name": "frame_001",
      "pixels": [
        "00111100",
        "01111110",
        "11211211",
        "11111111",
        "11111111",
        "11211211",
        "01122110",
        "00111100"
      ]
    }
  ]
}

In the example above, 1=yellow body, 2=black eyes/mouth. Notice how the silhouette is circular and the features are clear. Your output must have similar visual structure for the requested subject."""


# =============================================================================
# System prompt — multi-frame animation
# =============================================================================

SYSTEM_PROMPT_ANIMATION = """You are a pixel art animator. Given a description and a frame count, you produce a multi-frame pixel animation as JSON only.

OUTPUT FORMAT — JSON OBJECT WITH EXACTLY THESE FIELDS:
  - title:   short string
  - width:   int (canvas width in cells)
  - height:  int (canvas height in cells)
  - palette: array of hex colour strings, index 0 = transparent
  - frames:  array of frame objects (one per animation frame, in order)

EACH FRAME OBJECT:
  - name:   string (e.g. "frame_001")
  - pixels: ARRAY OF ROW STRINGS. Each row string is EXACTLY `width` characters long. Single hex digit per cell, 0-9 or A-F. Index 0 = transparent.

CRITICAL RULES:
  - Respond with the JSON object only. No markdown fences, no prose.
  - Produce EXACTLY the requested number of frames. No more, no fewer.
  - All frames share the same palette.
  - Each pixels array has EXACTLY `height` row strings of EXACTLY `width` characters each.
  - DRAW SOMETHING in every frame. Do not fill with zeros.
  - Frames are sequential in time and form a loop.

ANIMATION PRINCIPLES:
  - Walk cycle: alternate leg positions, slight body bounce.
  - Idle: 1-2 cell movement (breathing, hair sway).
  - Flame/water: noise shifts each frame, palette stays.
  - Subject identity stays constant across frames. Same silhouette, varied pose.

EXAMPLE (4x4, 2-frame flicker — orange torch flame):
{
  "title": "torch",
  "width": 4,
  "height": 4,
  "palette": ["transparent", "#CC3300", "#FF6600", "#FFE040"],
  "frames": [
    {"name": "frame_001", "pixels": ["0330", "0220", "0110", "0110"]},
    {"name": "frame_002", "pixels": ["3030", "0220", "0110", "0110"]}
  ]
}

Your output must have a visible subject in every frame."""


# =============================================================================
# User prompt template
# =============================================================================

def build_user_prompt(
    subject: str,
    width: int,
    height: int,
    palette_name: str | None,
    palette_colors: list[str] | None,
    frame_count: int = 1,
    extra_style: str = "",
) -> str:
    """Build the user-facing prompt for the LLM."""

    if palette_colors:
        pal = palette_colors
    elif palette_name and palette_name in PALETTES:
        pal = PALETTES[palette_name]
    else:
        pal = PALETTES["holoflow-8"]

    palette_str = ", ".join(f'"{c}"' for c in pal)
    n = len(pal)

    if frame_count > 1:
        anim_line = f"Produce EXACTLY {frame_count} animation frames forming a loop."
    else:
        anim_line = "Produce EXACTLY 1 frame."

    style_line = f"\nStyle: {extra_style}" if extra_style else ""

    # Build a concrete reminder of the dimensions
    dim_reminder = (
        f"Each frame's pixels MUST be {height} row strings, each row "
        f"EXACTLY {width} hex characters long."
    )

    return f"""Subject: {subject}

Canvas: {width} wide x {height} tall.
Palette (index 0 = transparent, indices 1..{n-1} = colours):
[{palette_str}]

{anim_line}
{dim_reminder}{style_line}

Output the JSON object now. Draw the subject — do not output a grid of zeros."""
