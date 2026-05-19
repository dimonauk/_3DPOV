"""
python-services/loop_orchestrator.py — HoloFlow_Loop_Orchestrator.

The four-stage genome pipeline that drives every drop:

    Genesis  →  Bake  →  Audit  →  Fitness

Each stage is an HTTP endpoint. Jobs progress through stages on the
server's worker thread; clients poll `GET /jobs/{job_id}` for state.

Genesis  — Sample a new genome from a seed + kingdom bias profile.
           Writes the gene record + the parentage chain to disk.
Bake     — Hand the genome to Blender (via blender-mcp on the bench)
           which renders a still + writes a watertight STL.
Audit    — Run the Sieve VLM on the rendered still. Returns
           pass/fail + a one-line aesthetic summary.
Fitness  — Multi-axis scoring (printability + waveguide + elegance +
           novelty + wit) per Manifesto §07. Returns a numeric vector
           the operator uses to decide whether to publish.

This service runs on Sovereign-PC and is fronted by Tailscale Funnel.
The website's `drops/sieve-gate` + admin drops dashboard call into it.

Run:
    uvicorn loop_orchestrator:app --host 0.0.0.0 --port 7846

Auth:
    All endpoints require `Authorization: Bearer ${LOOP_ORCHESTRATOR_TOKEN}`.
    Generate the token with `openssl rand -hex 32` and set both here
    (env) and in the website's env as the matching bearer for outbound
    calls.

v0.1: minimal scaffold. Stages call stubs that return synthetic
records. As each downstream bench service comes online (Blender bake
worker, Sieve VLM endpoint, fitness scorer), swap its stub for the
real call. Job state stays in-memory; persisting to SQLite is a v0.2
add.
"""

from __future__ import annotations

import os
import queue
import secrets
import threading
import time
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ---------- config ----------

VERSION = "0.1.0"
PORT = int(os.environ.get("LOOP_ORCHESTRATOR_PORT", "7846"))
TOKEN = os.environ.get("LOOP_ORCHESTRATOR_TOKEN", "")
ALLOWED_ORIGINS = os.environ.get(
    "LOOP_ORCHESTRATOR_ALLOWED_ORIGINS", "*"
).split(",")


# ---------- job model ----------

@dataclass
class Job:
    id: str
    stage: str  # "genesis" | "bake" | "audit" | "fitness" | "complete" | "failed"
    seed: int
    kingdom: str
    created_at: float
    updated_at: float
    genome: Optional[dict[str, Any]] = None
    baked_still_url: Optional[str] = None
    baked_stl_url: Optional[str] = None
    audit_summary: Optional[str] = None
    audit_pass: Optional[bool] = None
    fitness_vector: Optional[dict[str, float]] = None
    error: Optional[str] = None
    history: list[dict[str, Any]] = field(default_factory=list)

    def touch(self, stage: str, **kwargs: Any) -> None:
        self.stage = stage
        self.updated_at = time.time()
        entry = {"stage": stage, "at": self.updated_at, **kwargs}
        self.history.append(entry)


JOBS: dict[str, Job] = {}
JOBS_LOCK = threading.Lock()
WORK_QUEUE: queue.Queue[str] = queue.Queue()


# ---------- API shapes ----------

class CreateJobBody(BaseModel):
    seed: int = Field(..., ge=0, le=(1 << 31) - 1)
    kingdom: str = Field(
        ...,
        pattern=r"^(choreographic|curvilinear|biomech|techno|assemblage|artistic|architectural|ritual)$",
        description="One of the eight studio kingdoms.",
    )


# ---------- auth ----------

def require_bearer(request: Request) -> None:
    if not TOKEN:
        # In dev (no token configured), permit but emit a header so the
        # caller sees the laxity.
        return
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer")
    candidate = header[len("Bearer ") :].strip()
    if not secrets.compare_digest(candidate, TOKEN):
        raise HTTPException(status_code=401, detail="bad bearer")


# ---------- stage workers (stubs today) ----------

def run_genesis(job: Job) -> None:
    """Sample a genome. Real impl calls into python-services/genome.py."""
    job.touch("genesis")
    time.sleep(0.2)
    job.genome = {
        "id": f"gen-{job.id}",
        "seed": job.seed,
        "kingdom": job.kingdom,
        # The 28-gene alphabet, stubbed.
        "form_genes": [0.5] * 12,
        "material_genes": [0.5] * 8,
        "optics_genes": [0.5] * 4,
        "waveguide_genes": [0.5] * 4,
        "canon_genes": [0.5] * 8,
        "parentageChain": [],
    }


def run_bake(job: Job) -> None:
    """Render still + STL. Real impl talks to blender-mcp on Swift."""
    job.touch("bake")
    time.sleep(0.4)
    # TODO: POST to blender-mcp http://swift.tail99b2a4.ts.net:7847/render
    job.baked_still_url = f"https://placeholder/still/{job.id}.png"
    job.baked_stl_url = f"https://placeholder/stl/{job.id}.stl"


def run_audit(job: Job) -> None:
    """Sieve VLM verdict on the rendered still."""
    job.touch("audit")
    time.sleep(0.3)
    # TODO: POST to Sieve service (same shape the site's sieve-gate
    # speaks). For now: deterministic stub.
    job.audit_summary = "clean, on-brand, no flagged elements"
    job.audit_pass = True


def run_fitness(job: Job) -> None:
    """Multi-axis fitness vector (Manifesto §07)."""
    job.touch("fitness")
    time.sleep(0.2)
    # TODO: call into python-services/fitness.py for the real scorer.
    job.fitness_vector = {
        "printability": 0.82,
        "waveguide": 0.74,
        "elegance": 0.68,
        "novelty": 0.55,
        "wit": 0.61,
    }


# ---------- worker loop ----------

def worker_loop() -> None:
    while True:
        job_id = WORK_QUEUE.get()
        with JOBS_LOCK:
            job = JOBS.get(job_id)
        if not job:
            continue
        try:
            run_genesis(job)
            run_bake(job)
            run_audit(job)
            if not job.audit_pass:
                job.touch("failed", reason="audit_rejected")
                continue
            run_fitness(job)
            job.touch("complete")
        except Exception as e:  # noqa: BLE001 — worker isolation
            job.error = str(e)
            job.touch("failed", reason="exception")


threading.Thread(target=worker_loop, daemon=True).start()


# ---------- FastAPI ----------

app = FastAPI(title="HoloFlow Loop Orchestrator", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    with JOBS_LOCK:
        in_flight = sum(
            1
            for j in JOBS.values()
            if j.stage not in ("complete", "failed")
        )
        total = len(JOBS)
    return {
        "ok": True,
        "version": VERSION,
        "auth_configured": bool(TOKEN),
        "in_flight": in_flight,
        "total_jobs": total,
    }


@app.post("/jobs", dependencies=[Depends(require_bearer)])
def create_job(body: CreateJobBody) -> dict[str, Any]:
    job_id = uuid.uuid4().hex
    now = time.time()
    job = Job(
        id=job_id,
        stage="queued",
        seed=body.seed,
        kingdom=body.kingdom,
        created_at=now,
        updated_at=now,
    )
    with JOBS_LOCK:
        JOBS[job_id] = job
    WORK_QUEUE.put(job_id)
    return {"id": job_id, "stage": "queued"}


@app.get("/jobs/{job_id}", dependencies=[Depends(require_bearer)])
def get_job(job_id: str) -> dict[str, Any]:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return asdict(job)


@app.get("/jobs", dependencies=[Depends(require_bearer)])
def list_jobs(limit: int = 50) -> dict[str, Any]:
    limit = max(1, min(500, limit))
    with JOBS_LOCK:
        items = sorted(
            JOBS.values(), key=lambda j: j.created_at, reverse=True
        )[:limit]
    return {"jobs": [asdict(j) for j in items]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
