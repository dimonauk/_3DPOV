"""
python-services/sieve_service.py — Sieve VLM verdict service.

The Sieve is the studio's vision-language gate: given a genome's baked
still + its parentage chain, it answers "does this piece meet
Holo-Flow Studio's aesthetic + safety bar?". The website's
`lib/drops/sieve-gate.ts` POSTs into `/v1/sieve` and expects:

    { pass: boolean, summary?: string, reason?: string }

Per Manifesto §07 the Sieve runs on the bench (Sovereign-PC GPU) and
is exposed to the public Vercel deployment via Tailscale Funnel + a
shared bearer token. Auth and posture mirror `loop_orchestrator.py`:
if `SIEVE_BEARER_TOKEN` is unset the service runs in dev-permissive
mode (so smoke tests don't need the openssl dance), but `/health`
flags `auth_configured: false` so callers can see the laxity.

v0.1: the VLM call itself is a stub that returns
`{ pass: True, summary: "stub-verdict-pending-vlm-wiring" }` for any
genomeId. This lets the website's sieve-gate fail-open path be
exercised end-to-end before the real VLM is wired. Swap-in points
for the real provider call are flagged with TODO(vlm) and the
provider config is already plumbed through env vars below — see
`run_vlm` and `SIEVE_SERVICE.md`.

Run:
    uvicorn sieve_service:app --host 0.0.0.0 --port 7848

Cross-link: `lib/drops/sieve-gate.ts` (the consumer).
"""

from __future__ import annotations

import json
import logging
import os
import secrets
import sys
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ---------- config ----------

VERSION = "0.1.0"
PORT = int(os.environ.get("SIEVE_SERVICE_PORT", "7848"))
TOKEN = os.environ.get("SIEVE_BEARER_TOKEN", "")
ALLOWED_ORIGINS = os.environ.get("SIEVE_ALLOWED_ORIGINS", "*").split(",")

VLM_PROVIDER = os.environ.get("SIEVE_VLM_PROVIDER", "aperture")
VLM_MODEL = os.environ.get("SIEVE_VLM_MODEL", "google/gemini-2.5-flash")
PROMPT_FILE = os.environ.get("SIEVE_PROMPT_FILE", "prompts/sieve.txt")

VERDICT_LOG_DIR = Path(
    os.environ.get("SIEVE_VERDICT_LOG_DIR", "tmp/sieve_verdicts")
).resolve()
VERDICT_LOG_ENABLED = (
    os.environ.get("SIEVE_VERDICT_LOG_ENABLED", "1").lower()
    not in ("0", "false", "no", "off", "")
)


# ---------- logging ----------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("sieve_service")


# ---------- API shapes ----------


class SieveRequest(BaseModel):
    genomeId: str = Field(..., min_length=1, max_length=256)
    bakedStillUrl: Optional[str] = Field(
        default=None,
        description=(
            "Direct URL to the baked still. If omitted, the service will "
            "(TODO) look up the URL by genomeId from the canonical store."
        ),
    )


class SieveResponse(BaseModel):
    pass_: bool = Field(..., alias="pass")
    summary: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        populate_by_name = True


@dataclass
class Verdict:
    genome_id: str
    pass_: bool
    summary: str
    reason: Optional[str] = None
    provider: str = VLM_PROVIDER
    model: str = VLM_MODEL
    baked_still_url: Optional[str] = None
    judged_at: float = field(default_factory=time.time)
    note: Optional[str] = None  # e.g. "stub", "provider-error-fallback"


# ---------- auth ----------


def require_bearer(request: Request) -> None:
    """Bearer auth. Dev-permissive when SIEVE_BEARER_TOKEN is unset
    (matches loop_orchestrator.py)."""
    if not TOKEN:
        return
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer")
    candidate = header[len("Bearer ") :].strip()
    if not secrets.compare_digest(candidate, TOKEN):
        raise HTTPException(status_code=401, detail="bad bearer")


# ---------- prompt loader ----------


def load_prompt() -> str:
    """Resolve SIEVE_PROMPT_FILE relative to this file's directory if
    not absolute. Returns the default inline prompt if the file is
    missing so the service is never wedged on a missing file."""
    path = Path(PROMPT_FILE)
    if not path.is_absolute():
        path = (Path(__file__).parent / path).resolve()
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        log.warning(
            "Sieve prompt file not found at %s; using inline fallback", path
        )
        return (
            "Given this genome's rendered still + its parentage chain, "
            "does this piece meet Holo-Flow Studio's aesthetic + safety "
            "bar? Reply with a JSON object: "
            '{ "pass": bool, "summary": string (one line) }'
        )


# ---------- VLM call (stub today, real provider tomorrow) ----------


def run_vlm(req: SieveRequest) -> Verdict:
    """Decide pass/fail for a genome.

    v0.1 stub: always returns pass=True with a sentinel summary so the
    website's sieve-gate fail-open path can be exercised end-to-end.

    To wire the real VLM:
      1. Fetch the baked still from `req.bakedStillUrl` (or look up the
         URL by genomeId from the canonical store — Firestore-equivalent.
         Leave the lookup as TODO until the store is decided).
      2. Build the multimodal request: load_prompt() + the still image
         + any parentage-chain summary the caller passes in v0.2.
      3. POST to the configured provider:
            - aperture: https://ai.tail99b2a4.ts.net/v1/chat/completions
              with X-Provider-Override + X-Model-Override headers per
              the Aperture gateway convention. Use APERTURE_API_KEY.
            - anthropic: Anthropic Messages API with ANTHROPIC_API_KEY.
            - local-llava: POST to local Ollama/llama.cpp server.
      4. Parse the JSON response (the prompt enforces a strict shape).
      5. Return Verdict(...) — fill `provider` + `model` from env.
      6. On any provider error, log + return a fail-CLOSED Verdict with
         note="provider-error-fallback" so the caller can see why.
    """
    log.info(
        "sieve.request genomeId=%s bakedStillUrl=%s provider=%s model=%s",
        req.genomeId,
        req.bakedStillUrl,
        VLM_PROVIDER,
        VLM_MODEL,
    )

    # TODO(vlm): swap this stub for the steps above.
    return Verdict(
        genome_id=req.genomeId,
        pass_=True,
        summary="stub-verdict-pending-vlm-wiring",
        baked_still_url=req.bakedStillUrl,
        note="stub",
    )


# ---------- verdict persistence ----------


def persist_verdict(verdict: Verdict) -> Optional[Path]:
    """Write the verdict to disk so re-judged drops are auditable.

    Layout: `<SIEVE_VERDICT_LOG_DIR>/<genomeId>/<unix-ms>.json`.
    Returns the written path, or None when logging is disabled or
    the write fails (failures must not break the response)."""
    if not VERDICT_LOG_ENABLED:
        return None
    try:
        # Trust pydantic-validated `genome_id` but defensively strip
        # path separators so a malicious caller can't escape the dir.
        safe_id = verdict.genome_id.replace("/", "_").replace("\\", "_")
        dir_ = VERDICT_LOG_DIR / safe_id
        dir_.mkdir(parents=True, exist_ok=True)
        stamp = int(verdict.judged_at * 1000)
        path = dir_ / f"{stamp}-{uuid.uuid4().hex[:8]}.json"
        payload = asdict(verdict)
        # Project the dataclass field `pass_` back onto `pass` so the
        # on-disk JSON matches the wire shape exactly.
        payload["pass"] = payload.pop("pass_")
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        log.info("sieve.verdict.persisted path=%s", path)
        return path
    except Exception as e:  # noqa: BLE001 — never break the response
        log.error("sieve.verdict.persist_failed err=%s", e)
        return None


# ---------- FastAPI ----------


app = FastAPI(title="Sieve VLM service", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "version": VERSION,
        "auth_configured": bool(TOKEN),
    }


@app.post("/v1/sieve", dependencies=[Depends(require_bearer)])
def sieve(req: SieveRequest) -> dict[str, Any]:
    verdict = run_vlm(req)
    persist_verdict(verdict)
    response: dict[str, Any] = {
        "pass": verdict.pass_,
        "summary": verdict.summary,
    }
    if verdict.reason is not None:
        response["reason"] = verdict.reason
    return response


if __name__ == "__main__":
    import uvicorn

    # Surface the configuration at boot so the operator can spot a
    # missing token before the first call lands.
    log.info(
        "sieve_service starting port=%s auth_configured=%s provider=%s "
        "model=%s prompt_file=%s verdict_log_enabled=%s verdict_log_dir=%s",
        PORT,
        bool(TOKEN),
        VLM_PROVIDER,
        VLM_MODEL,
        PROMPT_FILE,
        VERDICT_LOG_ENABLED,
        VERDICT_LOG_DIR,
    )
    if not TOKEN:
        log.warning(
            "SIEVE_BEARER_TOKEN unset — running in dev-permissive mode. "
            "Set the env var before exposing this service over Tailscale."
        )
    # Pre-warm the prompt so any "file missing" warning fires at boot,
    # not on the first request.
    load_prompt()
    uvicorn.run(app, host="0.0.0.0", port=PORT)
