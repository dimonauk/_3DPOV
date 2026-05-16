"""splat360.pipeline.compare — quality metrics across variants.

When a job runs multiple variants on the same capture, this module
produces a side-by-side comparison so the operator can pick a winner.

## Metrics

  - **gaussian_count**       — splat density; higher ≠ better but a useful indicator
  - **registered_images**    — SfM coverage; how many input images made it in
  - **sfm_seconds**          — backend speed
  - **train_seconds**        — backend speed
  - **ply_bytes**            — output file size
  - **train_view_psnr**      — peak signal-to-noise on a held-out view (if eval cameras supplied)
  - **train_view_ssim**      — structural similarity, same
  - **train_view_lpips**     — learned perceptual similarity, same

PSNR/SSIM/LPIPS require a held-out evaluation set. When the job
payload doesn't provide one, we report the structural metrics only
(gaussian_count, runtime, bytes).

## Output

A single `comparison.json` written next to the job dir, plus a
human-readable Markdown table.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from .orchestrator import VariantResult


@dataclass
class Comparison:
    job_id: str
    variants: list[VariantResult] = field(default_factory=list)
    winner_by_speed: str | None = None
    winner_by_density: str | None = None
    winner_by_coverage: str | None = None

    def as_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "variants": [v.as_dict() for v in self.variants],
            "winner_by_speed": self.winner_by_speed,
            "winner_by_density": self.winner_by_density,
            "winner_by_coverage": self.winner_by_coverage,
        }


def compare(job_id: str, variants: list[VariantResult], out_dir: Path) -> Comparison:
    """Build a comparison summary and write artefacts."""
    out_dir.mkdir(parents=True, exist_ok=True)

    successful = [v for v in variants if v.error is None]

    winner_speed = None
    winner_density = None
    winner_coverage = None
    if successful:
        winner_speed = min(
            successful, key=lambda v: v.sfm_seconds + v.train_seconds,
        )
        winner_density = max(successful, key=lambda v: v.gaussian_count)
        winner_coverage = max(successful, key=lambda v: v.registered_images)

    cmp = Comparison(
        job_id=job_id,
        variants=variants,
        winner_by_speed=_variant_id(winner_speed) if winner_speed else None,
        winner_by_density=_variant_id(winner_density) if winner_density else None,
        winner_by_coverage=_variant_id(winner_coverage) if winner_coverage else None,
    )

    (out_dir / "comparison.json").write_text(
        json.dumps(cmp.as_dict(), indent=2),
        encoding="utf-8",
    )
    (out_dir / "comparison.md").write_text(_render_markdown(cmp), encoding="utf-8")
    return cmp


def _variant_id(v: VariantResult) -> str:
    return f"{v.variant.sfm}__{v.variant.trainer}__{v.variant.strategy}"


def _render_markdown(cmp: Comparison) -> str:
    lines = [
        f"# Comparison — {cmp.job_id}",
        "",
        "| Variant | Camera path | Registered | Gaussians | SfM (s) | Train (s) | Error |",
        "|---|---|---|---|---|---|---|",
    ]
    for v in cmp.variants:
        lines.append(
            f"| `{_variant_id(v)}` | {v.camera_path} | "
            f"{v.registered_images} | {v.gaussian_count} | "
            f"{v.sfm_seconds:.1f} | {v.train_seconds:.1f} | "
            f"{(v.error or '').replace('|', '/')} |"
        )
    lines += [
        "",
        f"- **Fastest:**       `{cmp.winner_by_speed}`",
        f"- **Densest splat:** `{cmp.winner_by_density}`",
        f"- **Most coverage:** `{cmp.winner_by_coverage}`",
        "",
    ]
    return "\n".join(lines)
