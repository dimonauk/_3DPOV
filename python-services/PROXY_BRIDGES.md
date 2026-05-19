# Bench → Vercel proxy bridges

A reference for every Holoflow capability that talks to a service on
Sovereign-PC. The pattern is uniform (per `holoflow-bench-bridge`
skill): FastAPI shim → Tailscale Funnel → bearer-token auth.

## Live bridges

| Capability | Service | Port | Launcher | Tailscale sidecar |
|---|---|---|---|---|
| `viz.splat-generate` (sharp-onnx provider) | SHARP-ONNX | 7845 | `start_sharp_onnx.ps1` | `D:\Tools\tailscale-sharp-onnx\` |

## Planned bridges (stubs in place; not yet stood up)

| Capability | Service | Port | Launcher | Status |
|---|---|---|---|---|
| `agent.dialogue-ollama` | Ollama (via this proxy) | 8002 | `start_ollama_proxy.ps1` | Stub launcher ready; needs `.env.bench` + sidecar at `D:\Tools\tailscale-ollama\` |
| `viz.generate-comfyui` | ComfyUI | 8188 | None — ComfyUI runs directly | Needs sidecar at `D:\Tools\tailscale-comfyui\`; ComfyUI's built-in API-key auth handles bearer check |
| `viz.splat-generate-360` (hangar-360 provider) | splat360 | 8390 | `start_splat360.ps1` (TODO) | Bench engine still in development at `D:\The_Hangar\engines\splat360\` |

## Standing up a new bridge — the recipe

1. **Pick a port** that doesn't collide (7842 = libvips/Sharp, 7843 =
   sharp-video, 7844 = mesh, 7845 = sharp-onnx, 8002 = ollama-proxy,
   8188 = ComfyUI, 8390 = splat360).

2. **Write the FastAPI shim** (or use the upstream service's own
   auth if it has one). Pattern from `sharp_onnx_service.py`:
   - `AUTH_TOKEN = os.environ.get("MY_SERVICE_AUTH_TOKEN", "").strip()`
   - Middleware that rejects requests without `Authorization: Bearer <token>`
   - CORS open to `https://holoflow.co.uk`
   - Bypass path for `/health` so liveness probes don't need auth

3. **Launcher PowerShell** at `python-services/start_<service>.ps1`:
   - Source `.env.bench` (gitignored)
   - Call anaconda's python by full path
   - Bind to `0.0.0.0` (so Docker sidecar can reach via `host.docker.internal`)

4. **Tailscale sidecar dir** at `D:\Tools\tailscale-<service>\`:
   - Copy `D:\Tools\tailscale-sharp-onnx\` as a template
   - Edit `compose.yaml`: hostname → `<service>-bench`, upstream
     port number
   - Edit `config/serve-config.json`: change the proxy target's port
   - `docker compose up -d`

5. **Mint a Tailscale auth key** (https://login.tailscale.com/admin/settings/keys)
   and paste into `D:\Tools\tailscale-<service>\.env`.

6. **Verify** by curl-ing the public Funnel URL from a phone on
   mobile data:
   ```
   curl -H "Authorization: Bearer <TOKEN>" \
        https://<service>-bench.tail99b2a4.ts.net/health
   ```

7. **Vercel env vars** — add `MY_SERVICE_URL` + `MY_SERVICE_AUTH_TOKEN`
   in Vercel Project Settings → Environment Variables (Production +
   Preview).

8. **Wire the capability** — the corresponding `lib/capabilities/...`
   server impl reads the env vars and points at the bridge URL.

## Why bridges exist at all

Vercel functions can't reach a private tailnet directly (no first-
class Tailscale connector for Functions). Funnel exposes the bench
service publicly with a Let's Encrypt cert on `*.tail99b2a4.ts.net`.
The bearer token is the actual lock; Funnel is the transport.

## Cost / failure modes

- **Per-call cost:** $0. Bench does the work, Vercel just forwards.
- **Latency:** ~50ms London → DERP → Sovereign-PC + service compute.
- **Failure:** bench off → 503 from outbound fetch. Capability stub
  catches and returns `service-unavailable`. UI surfaces continue to
  render; nothing crashes.

## Related skills

- `holoflow-bench-bridge` — the canonical recipe (this doc is the
  Holoflow-side companion)
- `hangar-tailscale-https` — Tailscale-side mechanics
- `ollama-local` — Ollama-specific operator setup
