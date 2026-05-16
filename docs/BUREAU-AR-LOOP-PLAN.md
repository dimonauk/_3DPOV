# Print bureau + HoloWalk — the loop

> Status: planning, 2026-05-16. The two halves of the studio's commerce loop. Every artwork becomes both a print and an AR anchor; the print's QR opens the AR; the AR has a "buy the print" affordance. Nobody else stitches the two halves; the loop is the moat.

## The loop

```
Long-exposure capture (with EXIF GPS)
   ↓
Lightpaint chamber edit + kata-tag (inverse mode adds the script)
   ↓
Frame extracted with provenance bundle
   ↓
┌──────────────────────┬──────────────────────┐
│                      │                      │
↓                      ↓                      ↓
PRINT BUREAU       HOLOWALK ANCHOR        DIGITAL DOWNLOAD
(A2 fine-art)      (AR at GPS coord)      (signed file)
│                      │                      │
QR → AR             "buy print" CTA            ↓
                                          existing market
```

Every print is a portal to a place. Every place is a portal to a print. That asymmetric bridge is the loop.

## Print bureau

### Surface

A small commerce route — `/bureau/[itemId]` — that any chamber output can send a buyer to with one click. Backend wraps Stripe; fulfilment runs through the studio's PRO-1100 manually at first.

### Routes + UI

| Surface | Purpose |
|---|---|
| `POST /api/bureau/quote` | `{ imageId, sizeChoice, paperChoice, edition }` → `{ priceGbp, leadDays, paperNotes }` |
| `POST /api/bureau/order` | `{ quoteId, customer, shipTo, paymentMethodId }` → Stripe Payment Intent + fulfilment queue + email + slack |
| `GET /bureau/[itemId]` | Picker UI; pre-filled when a chamber sends a buyer over |
| `GET /print/[printId]` | Public provenance page — capture date, GPS, camera, kata script, HoloWalk link |
| `POST /api/bureau/fulfilled/[orderId]` | Operator marks order printed + posted; tracking emails customer |
| `GET /admin/bureau` | Operator dashboard, orders by status |

### The provenance card

Every print ships with a 6×4" card. Two sides:

- **Front:** title, edition number, date, signature, QR code.
- **Back:** the kata script (inverse-mode output for the frame), capture metadata, the URL `/print/[printId]`, the GPS coordinate, the HoloWalk link.

The QR resolves to the provenance URL. From there: one tap to the HoloWalk AR. The print is a key.

### "Send to bureau" affordance

From any chamber with a frame (lightpaint, imagen, image-edit, image-to-mesh, print-check):

- Right-click thumbnail → "Send to bureau"
- Print-check verdict auto-runs; if `maxPrintableSize` ≥ A3 at 240 PPI, bureau opens pre-filled
- If verdict fails, surface warning + "upscale + retry" (chains into a SUPIR / Real-ESRGAN call later)

### Pricing dimensions

- **Size:** A4 / A3 / A2 (A2 is the studio target)
- **Paper:** Canson Baryta Photographique / Hahnemühle Photo Rag / Ilford Smooth Pearl — three opening options
- **Edition:** Open / Limited (numbered) / Unique. Each captured frame has at most one Unique.
- **Frame:** optional add-on; partner with a UK framer when ready

### Editions strategy

Every captured frame gets one Unique slot + a Limited edition of 25 (default; configurable). Once the Unique sells, gone forever. Once the Limited sells out, only access left is the AR. **The AR is the funnel; the print is the conversion.** That asymmetry is the right shape.

### Backend

- **Storage:** `orders/{orderId}/source.tiff` in Firebase Storage (full-res, not the chamber's proxy)
- **Stripe:** Payment Intent flow; Connect later if you onboard other artists
- **Email:** Resend (already in env) for customer + operator
- **Fulfilment queue:** Firestore `orders/` with status enum
- **Tax/VAT:** Stripe Tax handles digital; physical starts UK-only

## HoloWalk side (for light paintings + chamber outputs generally)

The existing `app/holo-walk/[id]/` and `app/holo-walk/[id]/qr/` WIP is untouched by this plan; lightpaint anchoring layers on top.

### Anchoring

Every chamber output with GPS metadata can be anchored. The chamber adds an "Anchor on HoloWalk" affordance that:

1. Reads GPS from the source capture's EXIF
2. Asks "anchor at this exact spot? or pick a different one?"
3. POSTs `/api/holo-walk/anchor` with `{ chamberOutputId, gpsCoord, presentationMode, scaleMeters, provenanceId }`
4. Returns an anchor ID; the chamber output gets a "live at /holo-walk/[anchorId]" badge

### Presentation modes

| Mode | For | Notes |
|---|---|---|
| Floating panel | Static images, animations | Flat plane at eye level; works on any phone |
| In-place sphere | 360 captures | Translucent sphere the visitor walks through |
| Reconstructed 3D trail | Light paintings with 2D→3D inference or multi-cam reconstruction | Actual trail floats at scale; visitor walks around the original poi-motion volume |
| Spatial collage | Multiple chamber outputs at one GPS | A gallery anchored to a spot |

### AR runtime

Stack:

- **Three.js + WebXR** for supported devices (Quest, Vision Pro, Pixel 9 + ARCore). Native depth + tracking.
- **Three.js + camera overlay + DeviceMotion API** for the broad iOS/Android non-WebXR case.
- **[ARCore Geospatial API](https://developers.google.com/ar/develop/geospatial)** for VPS-grade location locking where supported (most central Manchester + London streets). Sub-metre accuracy.
- **MapLibre GL** for the map page (open; no Mapbox vendor lock-in).

### "Buy the print" from inside AR

Two affordances in the AR view:

- **Tap the painting** → "this is for sale as an A2 print, £X — order"
- **Tap and hold** → provenance overlay (date, kata script, camera, edition status)

Stripe Mobile Checkout fires; visitor buys on-the-spot. The QR loop closes itself.

### Animations win the AR

A static print is one frame. The AR shows the whole animation, scrubbable by walking past it. The print becomes "this is a still from the thing you can see here move." Powerful sales reason.

## The bridge — single provenance ID

What ties the halves is one ID per artwork. Everything refers back to it:

- Chamber output saves with provenance ID
- Print's QR encodes the provenance ID
- HoloWalk anchor stores the provenance ID
- `/print/[printId]` shows: capture metadata, kata script, HoloWalk link, edition status

One row in Firestore `provenance/{id}` — all else reads it.

### The Firestore shape

```ts
type Provenance = {
  id: string;
  title: string;
  artistId: string; // operator's uid
  captureDate: string;
  gpsCoord: { lat: number; lng: number; accuracyM: number };
  camera: { make: string; model: string };
  kataScript?: string[]; // from inverse mode
  sourceChamber: string;
  sourceMediaPath: string; // gs:// path
  editions: {
    unique?: { state: 'available' | 'sold'; soldTo?: string };
    limited: { sizeTotal: number; soldCount: number; remaining: number };
    open: { state: 'available' | 'closed' };
  };
  holoWalkAnchorId?: string;
  createdAt: string;
};
```

## Tech choices

| Concern | Choice | Why |
|---|---|---|
| Payments | Stripe Payment Intents + Mobile Checkout | Standard, handles your jurisdictions |
| Fulfilment | Self, from PRO-1100 | You own the printer; margins stay yours |
| Email | Resend (env present) | Single vendor transactional + marketing |
| Orders | Firestore | Already in the stack |
| Print images | Firebase Storage | Same |
| AR | three.js + WebXR + camera fallback | Consistent with chamber WebGPU/TSL stack |
| GPS anchoring | ARCore Geospatial + raw-GPS fallback | Free + accurate where supported |
| Map | MapLibre GL (open) | No Mapbox vendor lock-in |
| QR | `qrcode` npm | Tiny, server-side render |
| Provenance | Firestore `provenance/{id}` | Single source of truth |

## Risks + mitigations

- **GPS accuracy** — raw is ±5m; AR feels "off." → VPS where available; "snap to nearest landmark" button using visible landmarks for alignment.
- **Battery + data on AR** — visitors with low battery bail. → Low-bandwidth mode = video of painting + spatial audio; full reconstruction only with WiFi or charging.
- **Light-painting visibility outdoors** — dark images vs daylight. → AR view artificially brightens; "best viewed after sunset" tag on anchors; nighttime as canonical visit.
- **Weather** — outdoor + rain = no visitors. → Indoor anchor option (gallery / cafe partnership); pieces "move" indoors for the season.
- **Fulfilment scale** — A2 manual capped ~20-30/week. → Limited editions create the cap explicitly; "next edition opens Q3" framing turns scarcity into desirability.
- **Tax / VAT** — physical across borders. → UK-only at start; international after fulfilment is dialled.
- **Permission UX** — camera + location + motion on first visit = three dialogs. → Walkthrough "what we need" page before triggering anything; one-time onboarding.

## Phased plan

### Bureau MVP (~2 weeks)

1. `/api/bureau/quote` + static price table — 2 days
2. `/api/bureau/order` + Stripe + email — 2 days
3. `/bureau/[itemId]` picker UI — 2 days
4. `/print/[printId]` provenance page — 2 days
5. "Send to bureau" affordance in lightpaint + print-check chambers — 1 day
6. Provenance card layout + QR generator — 2 days
7. `/admin/bureau` operator dashboard — 2 days

### HoloWalk MVP (~3 weeks; builds on existing WIP)

1. `/api/holo-walk/anchor` + Firestore — 1 day
2. `/holo-walk` map page (MapLibre) — 2 days
3. "Anchor on HoloWalk" affordance in lightpaint chamber — 1 day
4. AR runtime: three.js + WebXR + camera-overlay fallback — 5 days
5. Floating-panel mode (static + animation) — 3 days
6. ARCore Geospatial integration — 3 days
7. "Buy the print" affordance inside AR — 2 days
8. Permission onboarding flow — 1 day

### The bridge (~3 days, once both halves exist)

1. Print QR → provenance URL → HoloWalk anchor — 1 day
2. AR "buy print" CTA → bureau picker pre-filled — 1 day
3. Provenance page shows both: physical edition status + AR anchor status — 1 day

**Total: ~5-6 weeks for the full loop** from "frame in chamber" to "buyer walks Manchester, finds AR, buys print on-the-spot."

## Strategic framing

Three things bundled into one product:

- **Physical artwork** (the print) — high-margin, low-volume
- **Digital experience** (the AR) — high-volume, viral, free
- **Provenance** (the kata script + GPS + edition card) — Holoflow-specific value-add

Competitors offer the first OR the second. Nobody offers the loop. The loop is the moat.

The AR is the funnel — free, shareable, drives footfall. The print is the conversion — premium, scarce, the thing you take home. The provenance is what makes it not-a-poster — documentation of a specific moment in a specific place, performed in a way the script records.

Manchester + London are the right opening cities. Five anchors per city, growing. Each anchor has a public release date — turns visiting into an event. The map page is the homepage of the whole stack.

## Decisions made

- **2026-05-16:** Single Firestore `provenance/{id}` document is the bridge; everything else reads it.
- **2026-05-16:** Self-fulfilment from the PRO-1100, not print-on-demand. Margins stay with operator.
- **2026-05-16:** Edition strategy is Unique + Limited 25 + Open per frame. AR is free.
- **2026-05-16:** AR stack is three.js + WebXR with camera-overlay fallback; ARCore Geospatial for VPS-grade accuracy.
- **2026-05-16:** Map page (`/holo-walk`) becomes the homepage of the commerce loop, not the chambers index.
- **2026-05-16:** Manchester + London are opening cities. Five anchors each at launch.
