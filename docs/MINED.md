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
