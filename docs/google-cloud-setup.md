# Google Cloud setup — two-project + WIF posture

The site talks to Google Cloud in two distinct contexts that benefit
from being isolated:

- **Operator data** — Firestore, Firebase Auth, Firebase Functions.
  Long-lived, shared across surfaces. Lives on the original
  `gen-lang-client-0149679024` project.
- **Visitor AI generation** — Imagen, Veo, Gemini multimodal edit,
  future image-to-mesh provider hits. Visitor-facing, rate-limited,
  potentially spiky. Should live on a separate project so spend +
  audit logs don't mix with operator data.

A second GCP project has been provisioned for this: **`vercel` /
`174493951836`**. This doc explains how to wire each side to its own
project and (separately) how to remove the long-lived service-account
JSON from Vercel env via Workload Identity Federation.

## Two-project AI-key billing (Option 1)

### What you change in GCP

1. In the new `vercel` project, enable the Generative Language API
   (Gemini, Imagen, Veo). https://console.cloud.google.com/apis/library
2. AI Studio → **switch the project to `vercel`** (the picker at top
   left). Mint a new API key. It's scoped to the new project, so
   spend goes there.
3. Set a budget alert on the new project (Billing → Budgets) with a
   reasonable monthly cap. Hard cap if you want to fail closed when
   the cap is hit.

### What you change on Vercel

Add a new env var:

```
GOOGLE_AI_API_KEY_GEN=AIza...      # the new key from above
```

Keep the existing `GOOGLE_AI_API_KEY` in place — Aura's chat at
`lib/aura/gemini.ts` and `lib/capabilities/agent/dialogue.ts` still
read it, and Aura is on the original project on purpose (free-tier
quota, conversational use).

`lib/env.ts → googleGenApiKey()` is the seam that picks `_GEN` first
and falls back to the original. All AI-generation routes
(`/api/ai/google/generate-image`, `/api/ai/google/edit-image`, future
Veo) read through that helper, so the switch is transparent.

### Verifying

After deploy, visit `/atelier/imagen` and generate a still. Check
the `vercel` project's API metrics
(https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics) — you should see one Imagen call. The
original project's metrics should NOT increment.

## Workload Identity Federation for Firebase Admin (Option 2)

The Firebase Admin SDK currently authenticates via
`FIREBASE_ADMIN_SERVICE_ACCOUNT` — a long-lived JSON service-account
key pasted into Vercel env. This works but the key never expires, so
if Vercel env ever leaks the attacker has lifetime access to
Firestore + Auth admin.

WIF replaces that key with short-lived (~1 hour) credentials minted
fresh per function invocation. Vercel issues an OIDC token; GCP's
Workload Identity Pool exchanges it for an impersonated service
account. No long-lived secret in env.

### What you change in GCP

1. **Workload Identity Pool**: IAM & Admin → Workload Identity
   Federation → Create pool. Name `vercel-deployments`, default
   settings.
2. **Provider in the pool**: Create OIDC provider. Issuer URL:
   `https://oidc.vercel.com/<your-vercel-team-slug>` (find the slug
   in Vercel team settings). Attribute mapping: at minimum
   `google.subject = assertion.sub` and add the conditions you want
   (e.g. `attribute.environment = "production"`).
3. **Service account**: create a service account with the same
   permissions Firebase Admin needs (Firestore + Auth admin roles).
   Name `firebase-admin@<project>.iam.gserviceaccount.com`.
4. **Bind**: grant the WIF pool's principal `roles/iam.workloadIdentityUser`
   on that service account. Restrict the binding to specific Vercel
   deployment claims (production branch, your project).

### What you change on Vercel

1. Install Vercel's Google Cloud integration from the Marketplace.
2. Configure the integration to use the WIF pool + service account
   from above.
3. The integration auto-sets `GOOGLE_APPLICATION_CREDENTIALS` on every
   function invocation (it writes a config file at `/tmp/...` per call
   and points the env at it).
4. Add this env var so Firebase Admin knows which project to talk to
   (ADC credentials don't always carry it):

```
FIREBASE_ADMIN_PROJECT_ID=gen-lang-client-0149679024
```

5. **Remove** `FIREBASE_ADMIN_SERVICE_ACCOUNT` from Vercel env. The
   admin module checks for it first; while it's set, the JSON-key
   path wins and WIF doesn't run.

### Resilience tip

Keep the JSON service-account key in 1Password or another secure
store, NOT in Vercel env. If WIF breaks (rare, but Vercel OIDC outage
or pool misconfiguration), paste the JSON back into Vercel env as an
incident-recovery override — the admin module checks the JSON path
first and takes over until you remove the env var again.

### Verifying

After deploy, hit any route that uses Firestore (e.g. an admin
upload). Check the audit log in the GCP project — the call should
show as performed by `firebase-admin@<project>.iam.gserviceaccount.com`
acting on behalf of a Vercel OIDC principal. If you see "Authorized
using key 'XXXX'", the JSON-key path is still active; remove
`FIREBASE_ADMIN_SERVICE_ACCOUNT` from env.

## Local development

Both paths work locally:

- JSON-key: paste the service account JSON into `.env.local`.
- WIF: run `gcloud auth application-default login` then set
  `GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json`
  in `.env.local`. The admin module's ADC path picks it up.

## Code seams

| Concern | Module | Notes |
| --- | --- | --- |
| Pick the AI-gen key | `lib/env.ts → googleGenApiKey()` | Used by Imagen + image-edit routes |
| Firebase Admin init | `lib/firebase/admin.ts → getFirebaseAdminApp()` | Two paths: JSON cert + ADC |
| Project ID for WIF | `lib/firebase/admin.ts → adcProjectId()` | Reads `FIREBASE_ADMIN_PROJECT_ID` + 3 gcloud-style fallbacks |
