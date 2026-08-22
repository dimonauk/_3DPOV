# Screen Recording Notes — Alembic Mesh Sequence Cache → VAT

## Software
OBS Studio (any version) or Windows Game Bar (Win + G).

## Setup

**Window source:** Blender 5.1  
**Resolution:** 1920 × 1080  
**Frame rate:** 30 fps  
**Audio:** Off (no microphone needed for this technique recording)

## Shot list

| Time | What to show |
|------|-------------|
| 0:00 – 0:15 | Scripting workspace open. Paste and run `blueprint.py`. Show the terminal output confirming .abc path, vertex count, EXR path, GLB path. |
| 0:15 – 0:40 | Timeline / Dope Sheet: scrub frames 1 → 32. The WaveGrid\_vat object deforms visibly — this is the MSC modifier reading the .abc. |
| 0:40 – 0:55 | Object Properties → Modifier stack: show the **Mesh Sequence Cache** modifier, highlight the .abc filepath binding and the `Frame Offset` field. |
| 0:55 – 1:10 | UV Editor (or Image Editor): open `vat_position.exr`. Show the rainbow columns (each row = one frame of offsets). |
| 1:10 – 1:25 | File browser: show `alembic_vat_rest.glb` and `alembic_vat_meta.json` in the output folder. |
| 1:25 – 1:40 | Scripting workspace: briefly highlight the `sample_vat()` function and the `write_vat_exr()` call. |

## Notes

- Run `blueprint.py` first in the **Scripting** workspace (not the Text Editor inside the 3D Viewport) to avoid context errors.
- If the MSC modifier shows a red filepath warning, the `/tmp/holoflow_wave.abc` file was deleted. Re-run `blueprint.py` — it regenerates the .abc before importing.
- The wave animation plays in the 3D Viewport at 30 fps only if **Viewport Shading → EEVEE** or **Workbench** is active. Cycles will be too slow for real-time preview.
