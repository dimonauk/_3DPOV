"""splat360.pipeline.train — 3DGS training backend registry.

Five trainers wired. The orchestrator picks one (or runs many in
a comparison) based on availability and the job payload.

| Backend                | Licence      | Strength |
|------------------------|--------------|----------|
| nerfstudio (splatfacto)| Apache-2.0   | Wraps gsplat; most options; mature CLI |
| brush                  | MIT          | Rust standalone; no Python ML env needed; works on AMD/Apple |
| opensplat              | AGPL-3.0     | C++; no CUDA-Python; ODM/OpenSfM/COLMAP native input |
| gaussian-splatting     | Inria GS     | Original reference impl; quality gold standard |
| postshot               | proprietary  | Commercial-friendly; top-tier perceptual quality |

Notes on licences:
  - `gaussian-splatting` (Inria) is research-use-only. Outputs are
    fine to use; the **trainer** itself is restricted commercially.
    Compare path only — never the production trainer for commerce.
  - `postshot` is proprietary (Jawset). Its outputs are commercial-
    friendly when you have a Postshot licence; the CLI is separate.
  - `opensplat` is AGPL-3.0. Outputs are commercial-friendly; the
    binary itself carries copyleft when redistributed. Service-only
    use (we run it; visitors get outputs) is fine.
"""

from __future__ import annotations

from typing import Iterable

from .base import (
    ColmapModel,
    TrainBackend,
    TrainInput,
    TrainResult,
)
from . import brush, gaussian_splatting_inria, nerfstudio, opensplat, postshot


_REGISTRY: dict[str, TrainBackend] = {
    "nerfstudio": nerfstudio.Nerfstudio(),
    "brush": brush.Brush(),
    "opensplat": opensplat.OpenSplat(),
    "gaussian-splatting": gaussian_splatting_inria.GaussianSplattingInria(),
    "postshot": postshot.Postshot(),
}


def get(name: str) -> TrainBackend:
    if name not in _REGISTRY:
        raise KeyError(f"Unknown trainer: {name}. Known: {sorted(_REGISTRY)}")
    return _REGISTRY[name]


def all_backends() -> dict[str, TrainBackend]:
    return dict(_REGISTRY)


def available() -> list[str]:
    return sorted(name for name, b in _REGISTRY.items() if b.is_available())


def supporting(model: ColmapModel) -> list[str]:
    return [name for name, b in _REGISTRY.items() if b.supports(model)]


def pick(
    model: ColmapModel,
    preferred: Iterable[str] | None = None,
) -> TrainBackend:
    candidates = list(preferred) if preferred is not None else list(_REGISTRY.keys())
    for name in candidates:
        if name not in _REGISTRY:
            continue
        b = _REGISTRY[name]
        if b.supports(model) and b.is_available():
            return b
    raise RuntimeError(
        f"No available trainer supports {model}. "
        f"Available: {available()}; supporting: {supporting(model)}"
    )


__all__ = [
    "ColmapModel",
    "TrainBackend",
    "TrainInput",
    "TrainResult",
    "get",
    "all_backends",
    "available",
    "supporting",
    "pick",
]
