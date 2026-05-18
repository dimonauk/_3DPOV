# `lib/printfiles` — POD intake engine

## Role

End-to-end pipeline for the public-facing 3D print bureau. A customer
emails an STL/GLB/3MF/OBJ to `printfiles@holoflow.co.uk`; the studio's
server accepts the file, validates it, creates an order record,
forwards to a third-party print farm, and replies graciously to the
customer with an order ID + ETA.

**The studio does not print these.** In-house printing is the
chamber-output bureau (see `docs/BUREAU-AR-LOOP-PLAN.md`). The
`printfiles` engine is drop-ship POD — customer file goes to a print
farm partner, partner prints + ships to customer directly.

## The three components the operator asked for

| Component | File | Role |
|---|---|---|
| Listener | `app/api/printfiles/intake/route.ts` | Receives the inbound email webhook (Resend Inbound first; CF Email Routing adapter pluggable). Extracts sender + subject + body + attachments. |
| Directory generator | `lib/printfiles/directory.ts` | Mints an order id, uploads each attachment to the private Vercel Blob, writes a `printfile_orders/{id}` Firestore doc. |
| Gracious reply | `lib/printfiles/reply.ts` | Sends the customer a thread-aware confirmation via Resend. Quotes their original subject, includes the order id, sets reply-to so further questions land in `printfiles@`. |

Plus the ingestion pipeline (`lib/printfiles/ingest.ts`) that sits
between the directory generator and the reply: validates MIME +
size + bounding box, attaches a print-farm record, optionally
generates a quote.

And the print-farm forwarder at `lib/printfarm/*` — pluggable. Default
provider is `manual` (the engine pings an operator email; operator
forwards to whichever farm they've chosen for that order). Later
implementations: `treatstock`, `slant3d`, `craftcloud` via REST.

## End-to-end flow

```
1. Customer emails .stl/.glb/.3mf → printfiles@holoflow.co.uk
2. Namecheap forwards / Resend Inbound parses → POST /api/printfiles/intake
3. Route handler:
   a. Verifies webhook signature
   b. Spam check (sender allow / disallow)
   c. Rate-limit by sender (10/day per email)
   d. Pass to ingest pipeline:
      → MIME sniff (magic-byte verify on each attachment)
      → Size cap (20 MB attachment, 50 MB total)
      → Geometry probe (triangle count + bounding box for STL/GLB)
      → Quote estimate (provider-dependent; manual provider skips)
4. Directory generator:
   → Generate order id (kebab-case, date-prefixed)
   → Upload each attachment to private Blob at printfiles/<id>/<filename>
   → Write Firestore doc with sender, subject, body, attachments,
     validation result, quote, status="received"
5. Print-farm forwarder:
   → Look up provider (manual / treatstock / slant3d / ...)
   → For `manual`: send operator a packed-up email with the order + links
   → For API providers: hit their REST endpoint with the order, store
     external order id
6. Gracious reply via Resend:
   → Subject: "Got your print files — order #<id>"
   → Body: confirmation, links to provenance page, ETA, support link
   → reply-to: printfiles@ so threads back
   → Idempotency-Key prevents double-reply on retry
```

## Storage

- **Vercel Blob (private partition)** at `printfiles/<orderId>/<filename>`.
  Customer files are operator-private; the public Blob would 200 to
  anyone with the URL. Set `PRIVATE_BLOB_READ_WRITE_TOKEN` in env (the
  fallback to the public Blob is intentional during dev, NOT for prod).
- **Firestore** at `printfile_orders/{orderId}`. Read+write locked
  to admin SDK only (see `firestore.rules`).

## Env vars

```
RESEND_API_KEY                # required — outbound (gracious reply + manual-farm forward)
RESEND_INBOUND_WEBHOOK_SECRET # required — verify the listener's POST body
PRINTFILES_INBOX_EMAIL        # default: printfiles@holoflow.co.uk
PRINTFILES_OPERATOR_EMAIL     # default: dimona@holoflow.co.uk — where manual-farm forwards go
PRINTFILES_MAX_ATTACHMENT_MB  # default: 20
PRINTFILES_MAX_TOTAL_MB       # default: 50
PRINTFARM_PROVIDER            # one of: "manual" | "treatstock" | "slant3d" — default "manual"
PRIVATE_BLOB_READ_WRITE_TOKEN # required for prod (already in env stack from bureau work)
```

When `PRINTFARM_PROVIDER` is set to an API provider, set its creds:
```
TREATSTOCK_API_KEY
SLANT3D_API_KEY
```

## What it does NOT do (yet)

- **Payment.** v1 takes the file + sends the reply with a "quote
  coming" promise. Payment flow lands when a specific print-farm
  provider's quote API is wired.
- **Geometry repair.** If the customer sends a non-manifold STL the
  farm will reject it. v2 wraps a netfabb/meshmixer-style auto-repair
  pass before forwarding.
- **Drive/Dropbox links.** v1 only handles direct attachments under
  the size cap. Files larger than the cap get a polite reply asking
  the sender to use a smaller file. Link-following intake is v2.

## Composes with

- `lib/rookery/mailer` — share the Resend client + email-from defaults
- `lib/auth/admin-emails` — `/admin/printfiles` dashboard gated to operators
- `lib/rate-limit/fixed-window` — per-sender rate limit at the listener
- `lib/log` — structured logs under namespace `printfiles.*`

## Future: Cloudflare Email Routing transport

Resend Inbound is the v1 transport. To add CF Email Routing:
1. Move DNS MX records to Cloudflare
2. CF Email Routing rule: `printfiles@holoflow.co.uk` → worker
3. Worker parses MIME → POSTs to `/api/printfiles/intake` in the same
   shape as Resend Inbound (or with a `?transport=cf` flag and we
   adapter in `parse-cf-forward.ts`)

The listener is transport-agnostic in shape — adding CF is just
another adapter, not a rewrite.
