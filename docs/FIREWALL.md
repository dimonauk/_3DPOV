# Firewall — what's code, what's dashboard

This document is the canonical answer to "where do I configure the firewall stuff?"

Short version: code holds the **defaults**, the Vercel dashboard holds the
**rules that need state across regions** (rate limits, bot challenges, IP
allowlists). Step 6 of the Pro roadmap shipped the code side. The dashboard
side is a 10-minute one-time configuration that lives in your Vercel project
settings, not in the repo.

## What ships in code

| Layer | File | What it does |
|---|---|---|
| Edge middleware | `middleware.ts` | Hostname allowlist (refuses Host headers other than `holoflow.co.uk`, `*.vercel.app`, `localhost:*`). Cron auth check on `/api/cron/*`. Stamps `X-Request-Id` on every response. |
| Security headers | `vercel.json` | `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Plus `Cache-Control: private, no-store` on every `/api/*` response so nothing accidentally lands in shared caches. |
| Cron janitor | `app/api/cron/sweep-scan-temp/route.ts` | Daily 04:00 UTC sweep of `scan-temp/*` blobs older than 1 hour. Catches blobs leaked when the scan function crashed before its `finally{}` could `del()`. |
| In-app rate limits | `app/api/cards/scan/route.ts`, `lib/cards/leads-server.ts` | 10 scans/hour/uid; 5 leads/60s/IP. Keeps spend predictable even when bot protection is off. |

## What needs the dashboard

These are configured via the Vercel dashboard, not via the repo. They survive
across regions and instances, which is why they can't live in edge middleware
state.

### 1. Bot Protection (Free with Pro plan)

**Path:** Project → Settings → Firewall → Bot Protection → Enable

Toggle ON. That's it. Vercel auto-challenges suspicious traffic with a JS
challenge before the request reaches our functions. Saves Anthropic spend on
scrapers hitting `/api/cards/scan` and `/api/aura/agent`.

Recommended scope: **all routes**. The challenge is invisible to real users on
modern browsers; only bots get blocked.

### 2. Per-IP rate limits at the Firewall layer

**Path:** Project → Settings → Firewall → Rate Limiting → New rule

Suggested rules:

| Rule name | Path | Limit | Window | Action |
|---|---|---|---|---|
| Scan abuse | `/api/cards/scan*` | 30 req | 1 min | Challenge |
| Agent abuse | `/api/aura/agent` | 30 req | 1 min | Challenge |
| Card chat abuse | `/api/cards/*/chat` | 30 req | 1 min | Challenge |
| Lead capture abuse | `/api/cards/*/leads` | 10 req | 1 min | Block 5 min |
| Generic API abuse | `/api/*` | 100 req | 1 min | Challenge |

The in-app limits stay as a defence-in-depth backstop for paths where
Firewall isn't configured or fails open.

### 3. Hostname-based IP allowlisting (optional)

**Path:** Project → Settings → Firewall → IP Blocking

Only needed if you start seeing targeted abuse from specific ASNs or
countries. Easy to add later — there's no good reason to lock things down
preemptively while the site has light traffic.

### 4. Custom firewall rules (optional, defensive)

**Path:** Project → Settings → Firewall → Custom Rules

Worth adding eventually:

- **Block `OPTIONS` floods**: `request.method == "OPTIONS"` rate-limited to 60/min/IP. CORS preflight abuse is a common DDoS pattern.
- **Challenge missing User-Agent**: `request.headers["user-agent"] is empty` → Challenge. Real browsers always send one.
- **Block large request bodies on non-upload paths**: `request.size > 1MB && request.path !~ "(upload|scan)"` → Block. Catches buffer-overflow probes.

## Env vars Step 6 needs

| Variable | Required? | Value |
|---|---|---|
| `CRON_SECRET` | Yes (set in Vercel env vars) | A random string. Vercel auto-issues `Authorization: Bearer ${CRON_SECRET}` on cron-triggered requests. Generate via: `openssl rand -hex 32`. |
| `BLOB_READ_WRITE_TOKEN` | Already set | Used by the sweep route. |

## What's deliberately NOT done

- **Content-Security-Policy** — the site uses Three.js WebGL, MindAR camera capture, Web Speech, Vercel Blob cross-origin VRMs, Firebase Auth, the Anthropic AI Gateway, and a few embedded iframes (booking, wallet). A strict CSP would break things until each `connect-src` / `script-src` / `media-src` is audited and whitelisted. Worth a separate session in `report-only` mode first.
- **CORS allowlist** — every public API route is intentionally open to any origin so visitors can scan QR codes shared on third-party sites. The auth checks on sensitive endpoints (Firebase token, MIGRATE_TOKEN, CRON_SECRET) are the real gate.
- **Distributed rate limiting (Upstash Redis)** — overkill at current traffic. In-app limits + Firewall layer cover the realistic abuse cases. Revisit if traffic 100×s.

## Verification commands

```powershell
# Hostname allowlist — should 404
curl -sS -H "Host: someone-elses-domain.com" https://holoflow.co.uk/c/dimona -o NUL -w "%{http_code}"
# expected: 404

# Cron without secret — should 401
curl -sS https://holoflow.co.uk/api/cron/sweep-scan-temp -o NUL -w "%{http_code}"
# expected: 401

# Security headers
curl -sI https://holoflow.co.uk/ | findstr /R "Strict-Transport X-Frame Permissions"

# Request id propagation
curl -sI https://holoflow.co.uk/c/dimona | findstr /R "X-Request-Id"
```

## When to revisit

- After bot traffic spikes (Vercel Analytics will flag)
- Before any press push / public AMA
- Before launching a new card / new product surface that adds API routes
- Quarterly review — recheck Firewall rules still match traffic shape
