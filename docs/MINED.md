# Mined from The Hangar

A log of code, patterns, and assets pulled in from `D:\The_Hangar\` and
adjacent places into this repo. Kept so future-us (and future
maintainers) can see provenance, and so the eventual fold of
`_3DPOV` into `The_Hangar/apps/holoflow-studio` is a clean diff
rather than archaeology.

Convention: each entry has **what** (the lifted thing), **where from**
(absolute Hangar path or GitHub URL), **where to** (path in this
repo), **when** (date), and **why** (what it enables here).

---

## 2026-05-12

### The Rookery v0 — social spine

- **What:** Public-read, signed-in-write threaded community at
  `/rookery`. Threads (title + body, max 200 / 5000 chars), flat
  replies per thread (5000 chars). No edits, no deletes — what you
  put in the air, you put in the air.
- **Where from:** Schema invented; auth gating pattern adapted from
  the existing `subscribers` collection in `firestore.rules`.
  Architectural lessons taken from the Hangar's
  `apps/charming-academy` and `apps/discord-bot` patterns (read,
  not copied).
- **Where to:**
  - `lib/rookery/types.ts` — `Thread`, `Reply`, length constants.
  - `lib/rookery/client.ts` — Firestore CRUD: `listRecentThreads`,
    `getThreadById`, `listReplies`, `createThread`, `createReply`,
    `formatRelative`.
  - `app/rookery/page.tsx` — listing with auth-aware CTA.
  - `app/rookery/new/page.tsx` — composer with sign-in gate.
  - `app/rookery/[id]/page.tsx` — thread + flat replies + reply form.
  - `firestore.rules` — `threads/{id}` + `threads/{id}/replies/{id}`
    rules with auth-checked author UID and field whitelists.
  - `middleware.ts` — `/rookery` added to pass-through prefixes so
    the veil doesn't 302 it (the route itself gates by auth).
  - `components/layout/navbar/index.tsx` + `components/layout/
    footer.tsx` — nav entries.
- **Why:** The social spine of the longer-arc vision. Holds tier-
  gated channels later; today is the free public feed v0.

**External configuration required** (Firebase Console):

1. Firestore Database → must exist (eur3 region recommended).
2. Publish `firestore.rules` (paste the updated file in the Rules
   tab → Publish).
3. Optional but recommended: build a Firestore index on `threads`
   ordered by `createdAt desc` — Firestore will prompt to create it
   the first time `listRecentThreads()` runs in production.

### Holofoil Hypercube — site signature glyph

- **What:** `components/holofoil-hypercube.tsx` — rotating 4D
  tesseract, three-colour chromatic-smear wireframe (cyan / magenta /
  arcane-gold on deep midnight).
- **Where from:** Aesthetic family lifted from
  `components/holofoil-dice.tsx` (original WebGL raymarcher by
  Jaenam, CC BY-NC-SA 4.0). 4D math written from scratch; palette
  pulled from the DollyOS canon
  (`C:\Users\dimon\.claude\skills\dollyos-world\SKILL.md`).
- **Where to:** `components/holofoil-hypercube.tsx` (new).
- **Why:** The site's bullet-point glyph. Replaces the dice as the
  primary signature in future hero treatments; dice stays as the
  fallback for now so the swap can be staged page by page.

### Google OAuth — `signInWithPopup` pattern

- **What:** `GoogleAuthProvider` instance + `signInWithPopup` flow.
- **Where from:** `D:\The_Hangar\packages\firebase-client\src\index.ts`
  (Hangar's tiny firebase-client lifts the pattern straight from the
  Firebase SDK; reproduced here in the studio's tolerant-init style).
- **Where to:** `lib/firebase/client.ts` — new exports
  `getGoogleProvider()` and `signInWithGoogle()`.
- **Why:** Auth Phase 2. Adds a "Continue with Google" button next to
  the existing magic-link form on `/signin`. Foundation for the
  Rookery (identity), subscription tiers (Firebase custom claims),
  and any signed-in surface to come.

**External configuration required** (one-time, in Firebase Console
for project `gen-lang-client-0149679024`):

1. Authentication → Sign-in method → **Google** → Enable.
2. Set the public-facing project name and support email.
3. Authentication → Settings → Authorized domains → add
   `holoflow.co.uk` (and any Vercel preview domains used regularly).

No new npm dependency was needed — `firebase@^12.12.1` already
ships `GoogleAuthProvider` and `signInWithPopup`. The mine was
pattern, not code-as-import.

---

## Mining queue (planned, not yet executed)

| Brick | Hangar source | Destination | Status |
|---|---|---|---|
| Portfolio layout patterns | `D:\The_Hangar\packages\portfolio` + `D:\The_Hangar\apps\portfolio` | new `/portal` or `/work` surface | queued |
| The Rookery v0 (Firestore feed) | `D:\The_Hangar\apps\charming-academy` patterns | new `app/rookery/` | queued |
| WebXR foundation | `D:\The_Hangar\packages\webxr-vr` + `D:\The_Hangar\xrblocks_playground` | new `lib/xr/` + `app/portal/` | queued |
| Multi-user VR | `D:\The_Hangar\packages\multi-user-vr` | `app/rookery/vr/` | queued |
| 360 viewer | `D:\The_Hangar\apps\360-studio` | `components/media/sphere-viewer.tsx` | queued |
| 3D mesh viewer (richer) | `D:\The_Hangar\apps\sculpture-gallery` | upgrade `components/product/glb-viewer.tsx` | queued |
| AI gen (ComfyUI client) | `D:\The_Hangar\packages\ai-services` + `D:\The_Hangar\engines\comfyui` | `lib/ai/` for /tutorials live demos | queued |
| Aura companion | `D:\The_Hangar\apps\aura-vrm` or `D:\The_Hangar\apps\local-chat-vrm` | embedded VRM in a corner of the site | queued |
| Hand tracking | `D:\The_Hangar\packages\hand-tracking` | for VR Rookery + tutorial demos | queued |
| AR overlay | `D:\The_Hangar\packages\ar-overlay` | for mobile AR object preview | queued |
| Tier scaffolding | `invertase/stripe-firebase-extensions` (GitHub) | new `lib/billing/` + `/account/` | queued |

Add to this list with each new mine. Strike through when shipped, and
record the commit hash next to the row in this table.
