# Rookery onboarding emails

This route sends one of three onboarding emails to a Rookery
subscriber. It's the seam between Stripe's checkout-success webhook
and the actual transactional mailer.

## What's here

- `route.ts` — the POST endpoint. Validates input, calls the mailer.
- `../../../lib/rookery/emails.ts` — typed data for the three emails
  (slug, subject, text, html, `delayDays`).
- `../../../lib/rookery/mailer.ts` — provider wrapper. Resend over REST
  by default; SMTP is stubbed.

## Env vars

| Name             | Required             | Default                                            | Notes                                       |
| ---------------- | -------------------- | -------------------------------------------------- | ------------------------------------------- |
| `EMAIL_PROVIDER` | optional             | `resend`                                           | Set to `smtp` to take the (unimplemented) SMTP path. |
| `RESEND_API_KEY` | required for Resend  | —                                                  | Resend project API key.                     |
| `EMAIL_FROM`     | optional             | `Holo-Flow Studio <noreply@holoflow.co.uk>`        | Sender address.                             |
| `EMAIL_REPLY_TO` | optional             | `Dimona <contact@holoflow.co.uk>`                  | Reply-to address.                           |
| `SMTP_HOST`      | required for SMTP    | —                                                  | Currently unused — SMTP path throws.        |
| `SMTP_PORT`      | required for SMTP    | —                                                  | Currently unused.                           |
| `SMTP_USER`      | required for SMTP    | —                                                  | Currently unused.                           |
| `SMTP_PASS`      | required for SMTP    | —                                                  | Currently unused.                           |

The route returns a 500 with a clear error if neither `EMAIL_PROVIDER`
nor `RESEND_API_KEY` is set in the environment.

## Test it locally

```bash
# from D:/.github/_3DPOV/
RESEND_API_KEY=re_live_xxx pnpm dev

# in another shell:
curl -X POST http://localhost:3000/api/rookery/onboarding \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","slug":"welcome"}'
```

Expected response on success:

```json
{ "ok": true, "id": "<resend-message-id>" }
```

Failure modes you'll see during testing:

- 400 — bad JSON, missing/invalid email, unknown slug.
- 500 — provider not configured, or Resend rejected the send (the
  error from Resend is forwarded in the response body).

## Stripe wire-up (sketch — TODO)

When Stripe is added, the checkout-success webhook handler should:

1. Verify the Stripe signature.
2. Pull the customer's email from the session/customer object.
3. Persist subscription state to Firestore (or wherever subs live).
4. Hit this route with the welcome email:
   ```ts
   await fetch("/api/rookery/onboarding", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ email, slug: "welcome" }),
   });
   ```
5. Enqueue the Day 3 and Day 7 sends with their `delayDays` from
   `lib/rookery/emails.ts` (see below — needs a job runner).

For now `app/rookery/page.tsx` carries a `TODO` near the auth hook
marking where the trigger will eventually live.

## The Day 3 / Day 7 schedule — TODO

The current route fires immediately. The Day 3 and Day 7 sends need a
job runner; firing them from a serverless function isn't viable
(connections die, no durable delay primitive). The honest options:

- **Vercel Cron** — a daily cron sweeps a `pending_emails` collection
  (Firestore) for rows whose `sendAfter` timestamp has passed, sends
  them via this route, and marks them sent. Cheapest and matches the
  rest of the stack.
- **BullMQ + Redis** — proper queue with delayed jobs. Overkill for
  the current volume but the right answer if anything else in the
  studio needs a job runner.
- **A transactional provider's built-in scheduling** — Resend's
  scheduling, Postmark's, etc. Cheapest in code, but it ties the
  schedule to the provider rather than to our own data.

The current preference is Vercel Cron + a Firestore queue collection.
That work isn't done. When Stripe lands, the welcome email goes out
immediately and the other two should be enqueued at the same moment.

## Files

- `route.ts` — this route.
- `lib/rookery/emails.ts` — the three email bodies as typed data.
- `lib/rookery/mailer.ts` — Resend/SMTP wrapper.
- `app/rookery/page.tsx` — has the trigger TODO near the auth hook.
