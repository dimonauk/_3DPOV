# Slotting Stripe credentials into the print bureau

You walk through this once, end to end, with Stripe **test keys**.
Once the loop closes (test order → done page → both emails arrive →
operator dashboard shows the row) you swap test keys for live and you
are open for business.

The skeleton work is on branch `claude/skeleton-build` (preview deploy
auto-fires per push). Production branch `holoflow-commerce` is
untouched — merging is the final step.

---

## What's already wired (no action needed)

| | Path |
|---|---|
| Quote endpoint | `app/api/bureau/quote/route.ts` |
| Order creation | `app/api/bureau/order/route.ts` |
| Stripe webhook receiver + email dispatch | `app/api/stripe/webhook/route.ts` |
| Operator "mark fulfilled" | `app/api/bureau/fulfilled/[orderId]/route.ts` |
| Picker + customer form | `app/bureau/[itemId]/` |
| Checkout (Elements placeholder) | `app/bureau/checkout/[orderId]/page.tsx` |
| Confirmation page | `app/bureau/order/[orderId]/done/page.tsx` |
| Operator dashboard | `app/admin/bureau/page.tsx` |
| Email templates | `lib/bureau/order-emails.ts` |
| Stripe REST wrapper | `lib/stripe/server.ts` |
| Order persistence + lifecycle | `lib/bureau/order.ts` |

All credential-gated. Every route returns a clean 503
`stripe_not_configured` (or skips the email) when env vars are
missing — nothing crashes.

---

## Step 1 — Stripe dashboard, test mode

1. Open **<https://dashboard.stripe.com>** in test mode (top-left
   toggle).
2. Developers → API keys → reveal **Secret key** (`sk_test_...`) and
   copy **Publishable key** (`pk_test_...`). Note both.

---

## Step 2 — Vercel env vars

Vercel CLI route (faster), one at a time, for **Production +
Preview**:

```bash
vercel env add STRIPE_SECRET_KEY production
# paste sk_test_... when prompted
vercel env add STRIPE_SECRET_KEY preview

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# paste pk_test_...
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview

vercel env add NEXT_PUBLIC_SITE_URL production
# https://holoflow.co.uk
vercel env add NEXT_PUBLIC_SITE_URL preview
# https://holo-flow-studio-git-claude-skeleton-build-...vercel.app
# (or just leave preview unset — the order route falls back to
#  the request origin)
```

Dashboard route is equivalent: <https://vercel.com/dimonauk-9379s-projects/holo-flow-studio/settings/environment-variables>
→ Add — values paste straight in.

(`STRIPE_WEBHOOK_SECRET` comes in Step 5.)

Confirm `RESEND_API_KEY` is already set — the rookery emails already
use it, so it should be. If not:

```bash
vercel env ls | grep RESEND
```

---

## Step 3 — Install the client-side Stripe packages

These aren't in `package.json` yet:

```bash
cd D:\.github\_3DPOV
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

Commit + push the lockfile change. Do this on `claude/skeleton-build`
so the preview deploy validates the install before you touch
production.

---

## Step 4 — Wire `<Elements>` in the checkout page

`app/bureau/checkout/[orderId]/page.tsx` is currently a scaffold —
shows the order summary and the Payment Intent id but no payment
form. Replace the placeholder `<section>` (lines 75-87) with the
Stripe Elements integration.

Minimal pattern (client component, mount with `appearance` matched to
the dark-theme palette):

```tsx
// app/bureau/checkout/[orderId]/CheckoutClient.tsx — new file
"use client";

import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutClient({
  clientSecret,
  orderId,
  returnUrl,
}: {
  clientSecret: string;
  orderId: string;
  returnUrl: string;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "night", variables: { colorPrimary: "#ff6fb5" } },
      }}
    >
      <PayForm returnUrl={returnUrl} />
    </Elements>
  );
}

function PayForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true);
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
        });
        if (error) setErr(error.message ?? "Payment failed");
        setBusy(false);
      }}
    >
      <PaymentElement />
      {err && <p style={{ color: "#ff8585", marginTop: 12 }}>{err}</p>}
      <button type="submit" disabled={!stripe || busy} style={{ marginTop: 16 }}>
        {busy ? "Processing…" : "Pay"}
      </button>
    </form>
  );
}
```

Then in `page.tsx`, after the existing `getOrder()` lookup, look up
the Payment Intent's `client_secret` (you'll need to retrieve the PI
via `lib/stripe/server.ts` — add a `getPaymentIntent(id)` helper),
then render `<CheckoutClient clientSecret={...} orderId={orderId}
returnUrl={...}/>` in place of the placeholder section.

The `return_url` should be
`${origin}/bureau/order/${orderId}/done`.

---

## Step 5 — Add the Stripe Webhook endpoint

1. Stripe dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL:
   - **For preview testing:** copy the preview deploy URL from the
     Vercel dashboard (e.g.
     `https://holo-flow-studio-git-claude-skeleton-build-...vercel.app/api/stripe/webhook`).
   - **For production:** `https://holoflow.co.uk/api/stripe/webhook`.
   - You can add both endpoints; each gets its own signing secret.
3. Events to send (use search):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Add endpoint → copy the **Signing secret** (`whsec_...`).
5. Slot it into Vercel env:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   vercel env add STRIPE_WEBHOOK_SECRET preview
   ```

(If you're using both prod + preview endpoints, slot the prod
endpoint's secret to `production` and the preview endpoint's secret to
`preview`.)

---

## Step 6 — Optional: confirm operator email + Resend "from" address

The operator notification goes to (in this order of precedence):
1. `BUREAU_OPERATOR_EMAIL` env var
2. First entry of `ADMIN_EMAILS` (comma-separated)
3. `dimona@holoflow.co.uk` (hard-coded fallback)

Customer-facing emails come from `RESEND_FROM_ADDRESS` if set, else
`Holoflow Bureau <bureau@holoflow.co.uk>`. Make sure the from-address
domain (`holoflow.co.uk`) is verified in your Resend dashboard.

Both env vars are optional — the defaults work.

---

## Step 7 — Trigger a redeploy so the env vars take effect

```bash
git commit --allow-empty -m "ci: pick up Stripe env vars"
git push
```

(Or click "Redeploy" on the latest deployment in the Vercel UI.)

Wait for the preview build to land green (~5 min).

---

## Step 8 — Test the loop end-to-end

1. Visit `https://holo-flow-studio-git-claude-skeleton-build-...vercel.app/bureau/test-item`.
2. Defaults pre-fill **A2 + Canson Baryta + Limited**. Hit **Get
   quote** — you should see the price summary on the right.
3. Hit **Order this print** — the customer form reveals.
4. Fill in email, name, and a UK shipping address.
5. Hit **Continue to payment** — you redirect to
   `/bureau/checkout/<orderId>`.
6. Use Stripe test card **`4242 4242 4242 4242`**, any future expiry,
   any CVC. Hit Pay.
7. You should redirect to `/bureau/order/<orderId>/done`. State will
   say "Processing" for a few seconds until the webhook fires, then
   flip to "Paid".
8. Check the email inbox for both:
   - The receipt to the test customer address you entered.
   - The operator notification to your admin email.
9. Visit `/admin/bureau` — the new order should show as **paid** with
   the green dot.

If any step fails, check the build / runtime logs in Vercel — the
deploy-debug skill catalogue covers most failure modes (env not
picked up = redeploy; webhook signature fail = wrong
`STRIPE_WEBHOOK_SECRET`; email not received = check Resend dashboard
for delivery; etc).

---

## Step 9 — Switch to live keys

Once Step 8 passes end-to-end with test keys:

1. Stripe dashboard → flip to **live mode**.
2. Repeat Steps 1, 2, 5 with `sk_live_...`, `pk_live_...`, and the
   live webhook endpoint at `https://holoflow.co.uk/api/stripe/webhook`.
3. **Production** environment values get the live keys; **Preview**
   keeps the test keys (so PR branches stay safe).

```bash
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
# paste sk_live_...

vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# paste pk_live_...

vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
# paste whsec_... from the prod webhook endpoint
```

---

## Step 10 — Merge skeleton-build → production

```bash
git checkout holoflow-commerce
git pull
git merge --no-ff claude/skeleton-build -m "feat(bureau): full Stripe wiring + operator dashboard"
git push origin holoflow-commerce
```

Vercel will fire a production deploy. Once it's READY, `holoflow.co.uk/bureau/[itemId]` accepts real orders.

(If the OOM fix from cb44e54 was good — and it has been — the build
should land within ~5 min with the durable
`typescript.ignoreBuildErrors` posture.)

---

## Quick smoke-test commands

```bash
# Verify env vars are set
vercel env ls | grep -E "STRIPE|RESEND"

# Tail production runtime logs while you test
vercel logs --prod --follow

# Or via MCP — list recent deploys
# (use list_deployments + get_deployment_build_logs in the agent)
```

---

## When things fail — by symptom

| Symptom | Likely cause | Fix |
|---|---|---|
| `503 stripe_not_configured` on /api/bureau/order | `STRIPE_SECRET_KEY` not in current env | redeploy after adding env var |
| Checkout page shows the order but no payment form | `pnpm add @stripe/stripe-js @stripe/react-stripe-js` not done, or Elements wiring still scaffold | do Step 3 + Step 4 |
| Webhook returns 401 invalid signature | `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's signing secret | replace env var with the value from the Stripe dashboard endpoint detail page |
| `/bureau/order/<id>/done` says "Processing" forever | webhook never fired, or webhook signature failed | check Stripe dashboard → Webhooks → endpoint → recent deliveries; check Vercel runtime logs for `api.stripe.webhook` |
| Customer email never arrives | `RESEND_API_KEY` unset OR from-address not verified | `vercel env ls \| grep RESEND` + Resend dashboard → Domains |
| Operator email never arrives | `BUREAU_OPERATOR_EMAIL` falls back to a domain you don't watch | set it explicitly: `vercel env add BUREAU_OPERATOR_EMAIL production` |
| /admin/bureau is empty after a successful test order | Firestore Admin SDK env not configured, or `FIREBASE_ADMIN_SERVICE_ACCOUNT` mis-pasted | check the page load in Vercel logs — there'll be a `loadOrders failed` warning with the underlying admin SDK message |

---

## What this leaves un-shipped (by design)

- **Apple/Google Wallet pass generation** — separate skeleton in
  `lib/wallet/*` (commit `32d7940`); slot in cert envs separately
  when ready. See `docs/SHIP-PLAN.md` §1.3.
- **Printfile farm forwarding** — `lib/printfarm/*` skeletons exist
  (`6f00616`); pick farm + slot in the farm API key. See
  `docs/SHIP-PLAN.md` §1.2.
- **`/admin/bureau/[id]` per-order detail page** — the list view
  works; a detail page (with fulfilment marker + shipping label
  upload) is the next operator-UX increment.
- **HoloWalk AR anchor wiring + "buy print from AR"** — Phase 2 of
  `docs/BUREAU-AR-LOOP-PLAN.md`.

Each of these is independently slot-able; the Stripe loop above is
the load-bearing piece that turns the bureau from a quote viewer
into an actual payment surface.
