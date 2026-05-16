"""splat360.jobs.queue — single-GPU worker.

A 3DGS training job pegs the GPU for minutes-to-hours. Running two
concurrently is a fast path to CUDA OOM. This queue enforces exactly
one active variant at a time on the configured GPU.

Architecture: one background `asyncio.Task` polls an `asyncio.Queue`
of jobs. When a job arrives, it runs each requested variant in
sequence through the orchestrator; results land in the job store.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path

from ..pipeline.compare import compare
from ..pipeline.orchestrator import JobSpec, Variant, run_variant
from .store import JobStore


log = logging.getLogger("splat360.queue")


@dataclass(frozen=True)
class QueuedJob:
    job_id: str
    spec: JobSpec
    variants: tuple[Variant, ...]


class GpuQueue:
    """One-slot GPU queue. Submissions are FIFO; variants within a job
    are also FIFO."""

    def __init__(self, store: JobStore, results_root: Path) -> None:
        self._store = store
        self._results_root = results_root
        self._q: asyncio.Queue[QueuedJob] = asyncio.Queue()
        self._task: asyncio.Task[None] | None = None

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop(), name="splat360-gpu-worker")

    async def submit(self, qj: QueuedJob) -> None:
        await self._q.put(qj)

    async def _loop(self) -> None:
        while True:
            qj = await self._q.get()
            try:
                await asyncio.to_thread(self._run_job_blocking, qj)
            except Exception as exc:  # noqa: BLE001 — log and continue
                log.exception("Unhandled error in job %s: %s", qj.job_id, exc)
                self._store.set_phase(qj.job_id, "failed", error=str(exc))
            finally:
                self._q.task_done()

    def _run_job_blocking(self, qj: QueuedJob) -> None:
        store = self._store
        store.set_phase(qj.job_id, "ingesting", progress=0.0)
        store.log(qj.job_id, None, "ingesting", f"running {len(qj.variants)} variants")

        results = []
        for i, variant in enumerate(qj.variants):
            variant_id = f"{variant.sfm}__{variant.trainer}__{variant.strategy}"
            store.upsert_variant(
                qj.job_id, variant_id, variant.sfm, variant.trainer, variant.strategy,
                phase="sfm",
            )
            store.log(qj.job_id, variant_id, "sfm", "variant starting")
            try:
                result = run_variant(qj.spec, variant)
                results.append(result)
                store.set_variant_result(
                    qj.job_id, variant_id,
                    result=result.as_dict(),
                    error=result.error,
                )
                store.log(
                    qj.job_id, variant_id,
                    "failed" if result.error else "done",
                    result.error or f"gaussians={result.gaussian_count}",
                )
            except Exception as exc:  # noqa: BLE001
                store.set_variant_result(qj.job_id, variant_id, result=None, error=str(exc))
                store.log(qj.job_id, variant_id, "failed", str(exc))

            store.set_phase(
                qj.job_id, "train",
                progress=(i + 1) / max(1, len(qj.variants)),
            )

        # Comparison summary across variants.
        if len(results) > 1:
            out_dir = self._results_root / qj.job_id
            cmp = compare(qj.job_id, results, out_dir)
            store.set_result(qj.job_id, cmp.as_dict())
        elif results:
            store.set_result(qj.job_id, {"variant": results[0].as_dict()})

        store.set_phase(qj.job_id, "done", progress=1.0)
        store.log(qj.job_id, None, "done", "job complete")
