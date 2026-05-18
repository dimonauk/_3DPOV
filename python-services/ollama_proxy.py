"""
python-services/ollama_proxy.py — bearer-token-guarded proxy for Ollama.

Ollama itself has no built-in auth. To expose it safely over Tailscale
Funnel (public-internet HTTPS), we wrap it with this FastAPI shim that
enforces a shared bearer token and forwards every request to
http://localhost:11434.

# Why this exists

The Holoflow site's `agent.dialogue-ollama` capability calls:
  POST https://ollama.tail99b2a4.ts.net/api/chat

That URL is the Tailscale Funnel for this proxy (NOT for Ollama
directly). The Funnel sidecar at D:\\Tools\\tailscale-ollama\\
forwards `host.docker.internal:8002` → port 443 on the tailnet.

# Run on Sovereign-PC

  cd D:\\.github\\_3DPOV\\python-services
  .\\start_ollama_proxy.ps1

The launcher reads OLLAMA_PROXY_AUTH_TOKEN from .env.bench (the
same shared file the SHARP-ONNX launcher uses).

# Env vars

  OLLAMA_PROXY_AUTH_TOKEN   Required. Same value as Vercel's
                            OLLAMA_AUTH_TOKEN env var.
  OLLAMA_UPSTREAM_URL       Default: http://localhost:11434
  OLLAMA_PROXY_PORT         Default: 8002
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("ollama_proxy")

AUTH_TOKEN = os.environ.get("OLLAMA_PROXY_AUTH_TOKEN", "").strip()
UPSTREAM_URL = os.environ.get("OLLAMA_UPSTREAM_URL", "http://localhost:11434").rstrip("/")
PORT = int(os.environ.get("OLLAMA_PROXY_PORT", "8002"))

if not AUTH_TOKEN:
    log.warning(
        "OLLAMA_PROXY_AUTH_TOKEN is empty — proxy will accept anonymous "
        "requests. Only safe for bench-local dev with Funnel off."
    )

# Endpoints that bypass the bearer-token check (liveness probes).
_BYPASS_PATHS = frozenset({"/health"})

app = FastAPI(title="Ollama proxy", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://holoflow.co.uk",
        "https://www.holoflow.co.uk",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_bearer(request: Request, call_next):
    if not AUTH_TOKEN:
        return await call_next(request)
    if request.url.path in _BYPASS_PATHS:
        return await call_next(request)
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        return JSONResponse(
            {"error": "missing Authorization: Bearer <token>"},
            status_code=401,
        )
    if header[7:].strip() != AUTH_TOKEN:
        return JSONResponse({"error": "invalid bearer token"}, status_code=401)
    return await call_next(request)


@app.get("/health")
async def health() -> dict[str, Any]:
    """Liveness probe. Also pokes Ollama to confirm upstream is alive."""
    async with httpx.AsyncClient(timeout=2.0) as client:
        try:
            r = await client.get(f"{UPSTREAM_URL}/api/tags")
            return {
                "ok": True,
                "upstream": UPSTREAM_URL,
                "upstream_status": r.status_code,
                "auth_required": bool(AUTH_TOKEN),
            }
        except Exception as e:
            return {
                "ok": False,
                "upstream": UPSTREAM_URL,
                "error": str(e),
                "auth_required": bool(AUTH_TOKEN),
            }


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def forward(path: str, request: Request) -> Any:
    """
    Forward every request to Ollama. Streams the response body unbuffered
    so Ollama's NDJSON stream reaches the caller token-by-token.
    """
    upstream = f"{UPSTREAM_URL}/{path}"
    headers = dict(request.headers)
    # Strip auth header before forwarding — Ollama doesn't want it.
    headers.pop("authorization", None)
    headers.pop("host", None)

    body = await request.body()

    async def proxy_stream():
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                request.method,
                upstream,
                content=body,
                headers=headers,
                params=request.query_params,
            ) as resp:
                async for chunk in resp.aiter_raw():
                    yield chunk

    # Probe upstream to lift status + headers.
    async with httpx.AsyncClient(timeout=None) as client:
        try:
            head = await client.request(
                "HEAD" if request.method == "GET" else request.method,
                upstream,
                headers=headers,
                params=request.query_params,
            )
            upstream_status = head.status_code
            upstream_headers = dict(head.headers)
        except Exception as e:
            log.error("HEAD probe failed: %s", e)
            raise HTTPException(
                status_code=502, detail=f"Ollama unreachable at {UPSTREAM_URL}: {e}"
            ) from e

    # Strip hop-by-hop headers before passing through.
    for h in ("connection", "content-length", "transfer-encoding"):
        upstream_headers.pop(h, None)

    return StreamingResponse(
        proxy_stream(),
        status_code=upstream_status,
        headers=upstream_headers,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "ollama_proxy:app",
        host="0.0.0.0",
        port=PORT,
        log_level="info",
    )
