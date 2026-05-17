# Cards platform — parity gap analysis (May 2026)

What it takes to sit at the top of the field alongside Blinq Enterprise,
Popl, Uniqode Pro, V1CE, and Mobilo — minus the bits we deliberately
won't build (NFC hardware, full SOC 2 audit) and minus the bits we
already exceed (true WebXR, hand-locked AR, Gaussian splatting, VRM
companions, AR scene recording).

## Where we already lead the field

Things we ship that no major digital-business-card or QR platform
ships, period. This is the moat.

| Capability | Holo-Flow | Blinq | Popl | Uniqode | V1CE |
| --- | --- | --- | --- | --- | --- |
| WebXR immersive AR with hit-test | ✓ | — | — | — | — |
| Hand-locked AR (MediaPipe) | ✓ | — | — | — | — |
| AR scene recording (MediaRecorder webm export) | ✓ | — | — | — | — |
| Gaussian Splatting viewer | ✓ | — | — | — | — |
| VRM companion avatar | ✓ | — | — | — | — |
| GLB upload + USDZ auto-conversion | ✓ | — | — | — | — |
| Plane visualisation in immersive AR | ✓ | — | — | — | — |
| Per-card branded gradient QR (qr-code-styling) | ✓ | ✓ basic | ✓ basic | ✓ | ✓ basic |
| Hand-footprint live tracking signal | ✓ | — | — | — | — |
| 3D printable sculpture per card | ✓ unique | — | — | — | — |

This is the differentiation story. Nothing on this list is a parity
gap — it's the reason a buyer would pick us over them. **Do not
deprioritise.**

## Critical parity gaps (everyone has, we don't)

These are table stakes at every tier. Buyers screen us out without
them.

| Gap | What it is | Effort | Notes |
| --- | --- | --- | --- |
| **Card embed widget** | JS snippet that drops a live preview into any website | S | We already render the card — just need a `<iframe>` + paste-snippet UI |
| **Multi-card per user** | One owner, many cards (personal + work + speaker, etc.) | XS | Schema supports it — just expose in `/cards/mine` |
| **Email signature generator** | Generates HTML + plain-text email signature from card data | S | Pure template work, no infra |
| **Calendar booking embed** | Accept Cal.com / Calendly URL on the card, render inline | S | iframe embed with allow-list |
| **Vanity slug / custom URL** | `holoflow.co.uk/c/dimona-keynote` not just default slug | XS | Already supported — just expose in editor |
| **vCard QR + download** | Single button generates contact-card QR alongside main QR | S | Have vCard already; add to QR generator |
| **LinkedIn one-click connect** | Button that opens LinkedIn with prefilled connect request | XS | `https://www.linkedin.com/in/<handle>` + add-connection deep link |
| **WhatsApp / SMS share** | Send "this is my card" via native share intent | XS | Web Share API + fallback to `wa.me/?text=` |
| **Send card by email** | Email a card link + preview to a recipient | S | `mailto:` with HTML body or transactional via Resend |
| **Custom field-builder for lead form** | Add qualifying questions: "How did you hear about me?" etc. | M | Schema + form renderer + storage |

## Premium-tier parity (Blinq Business / Popl Growth tier)

These differentiate paid from free across the field.

| Gap | What it is | Effort | Notes |
| --- | --- | --- | --- |
| **AI Universal Scanner** | Phone-camera a paper business card → OCR → autofill new card fields | M | Vision API (Gemini, GPT-4o, Claude vision) — pick one, send image, parse name/title/email/phone |
| **AI Contact Enrichment** | Lead submits email → lookup LinkedIn/company/title → attach to lead record | M | Apollo.io / Clearbit / People Data Labs API — costs scale with leads |
| **Native CRM connectors** | OAuth to HubSpot, Salesforce, Pipedrive → push leads directly | M each | Each one is a separate OAuth flow + REST mapper |
| **Card templates library** | 8-12 pre-designed templates (lawyer, artist, dev, exec, performer, photographer, healer, musician, etc.) | M | Pure design + JSON seed data |
| **Custom card themes** | Per-card font, layout, accent shapes, not just colour | M | Extend `CardARConfig` with `theme.font`, `theme.layout` |
| **Google Wallet pass** | Matching the Apple Wallet pass we built | M | JWT-signed via Google Cloud service account |
| **Virtual backgrounds** | Zoom / Teams backgrounds rendered with card content | S | SVG → PNG export at 1920×1080 |
| **Field locking** | Admin locks logo/colour/role on team cards | S | Schema flag + UI hide |
| **Outlook / Google Workspace email signature sync** | Push generated signature into user's email signature settings | M | Microsoft Graph + Gmail API — both real OAuth dances |
| **Lead routing** | Round-robin or geographic assignment to team members | S | Just a list of assignees + a counter |

## Enterprise-tier parity (Blinq Enterprise / Popl Enterprise)

Buyers at this tier are buying compliance and lifecycle, not features.

| Gap | What it is | Effort | Notes |
| --- | --- | --- | --- |
| **SSO / SAML** | Enforced sign-in via Okta / Azure AD / Microsoft Entra / Google Workspace | L | Firebase Auth supports SAML via a paid GCP Identity Platform upgrade |
| **SCIM provisioning** | Auto-create / disable cards as users join / leave the org | L | Standard SCIM 2.0 endpoint, paid GCP feature |
| **SOC 2 Type II** | Annual third-party audit attesting our security posture | XL | Money + ops — Drata / Vanta + 6 months of evidence + audit fee |
| **GDPR DSAR endpoint** | Visitor right-to-delete / right-to-export | M | Build self-serve form + Firestore deletion / export |
| **Custom domain** | `cards.acme.com` instead of `holoflow.co.uk/c/...` | M | Vercel domain alias + per-tenant routing |
| **White-label** | Studio logo removed, replaced with tenant logo | S | Single config flag if custom-domain is set |
| **Audit log** | Who edited which card, when, from what IP | S | Firestore subcollection `cards/<slug>/audit/` |
| **Admin dashboard for teams** | Single pane: all cards, all leads, all analytics, brand control | M | New `/admin` section gated to admin role |
| **Card versioning** | Roll back to any previous version of a card | S | Firestore versioning subcollection |
| **Bulk CSV card import** | Admin uploads CSV, system creates N cards | S | We have the bulk-upload script — just add a UI form |
| **REST API (read + write)** | Bearer-token API for third-party automation | M | Mirror the existing endpoints under `/api/v1/` with token auth |
| **API rate limiting + quotas** | Per-account quota, key revocation | S | KV-based counter (Upstash) keyed by token |

## Event-mode (Popl's whole pitch)

Popl built its entire business around event lead capture. This is a
separate product mode from "general digital business card", and it's
a known revenue path — they have $4-6M case studies plastered on their
pricing page.

| Gap | What it is | Effort | Notes |
| --- | --- | --- | --- |
| **Event campaigns** | Group leads by event ("SXSW 2026", "Glastonbury vendor lounge") | S | Optional `event` field on lead + filter UI |
| **Qualifying questions** | "Are you a buyer / partner / fan?" — required fields on lead form | M | Custom-field-builder above + required-flag |
| **Badge scanner** | OCR a conference badge → auto-fill lead | M | Same vision-API path as AI Universal Scanner |
| **Offline lead capture** | Queue scans + form submissions when offline → sync when online | M | Service Worker + IndexedDB queue + retry |
| **Event ROI report** | Per-event cost vs leads captured vs pipeline value | S | Owner inputs cost + close value, dashboard does math |
| **Team check-ins** | Multiple team members capturing leads to same event | S | Tied to multi-card-per-user and team admin |

## QR-mode (Uniqode's whole pitch)

If we want to compete as a dynamic-QR platform too, the gaps are:

| Gap | What it is | Effort | Notes |
| --- | --- | --- | --- |
| **Non-card QR types** | Wi-Fi, location, menu, coupon, social-link aggregator, MP3, etc. | M | Each is a JSON content template + landing renderer |
| **QR folder organisation** | User has 100+ QRs, needs folders / tags | S | Folder field on QR doc |
| **Bulk QR via CSV** | Upload CSV → generate N QRs | S | Reuse existing batch script with UI |
| **Custom QR shapes / dots** | Beyond rounded — diamond, classy, etc. | S | qr-code-styling supports all of them |
| **Logo on QR centre** | Studio sigil or per-card logo inside the QR | S | qr-code-styling supports it |
| **QR PDF export with crop marks** | Print-ready vector with bleed + crops | S | Wrap SVG in a PDF page with marks |
| **QR analytics — devices** | iOS vs Android vs desktop split | XS | UA parse — we capture UA already |
| **QR analytics — time-of-day heatmap** | When during the day / week scans happen | S | Already have timestamps — just bucket |
| **QR location pinning** | Optional: ask geolocation on scan, plot on map | M | navigator.geolocation + opt-in consent + map view |

## What we should *not* build (deliberately)

- **NFC card hardware**. Physical product line, not software. The
  cards-as-objects market (V1CE, Mobilo, Linq, Tappy, Popl Tap) is
  saturated and margins go to manufacturers. We're the WebAR layer
  that runs on top of *any* QR, NFC card included — let the NFC
  vendors sell hardware and ship our URLs on it.

- **First-party AI Notetaker**. Otter, Fireflies, Granola, Read.ai,
  and Zoom itself ship this. Not worth competing. We can integrate
  *to* a notetaker via webhook on lead capture instead.

- **First-party CRM**. HubSpot et al own this. We sync, we don't
  replace.

- **Full SOC 2 Type II audit**. ~£50k/yr in audit + tooling + ops.
  Wait until we have enterprise buyers asking. Until then, ship "SOC
  2 in progress / Drata onboarded" as a near-term signal.

## Suggested build order — biggest gap-closure per unit of work

### Wave 1 (1-2 weeks of focused work, closes ~70% of "table stakes" gap)

1. **Card embed widget** + iframe with theme tokens
2. **Vanity slug exposure** in the editor
3. **vCard + LinkedIn + WhatsApp share buttons** on every card landing
4. **Email signature generator** (`/cards/mine/<slug>/signature` HTML preview + copy)
5. **Calendar embed** field (Cal.com / Calendly URL → iframe on landing)
6. **Multi-card per user** UI surface (already supported by schema)
7. **Custom field builder for lead form** (admin adds questions, lead form renders them)
8. **Card templates library** — 8-12 starter templates

### Wave 2 (2-3 weeks, premium tier parity)

9. **AI Universal Scanner** — photo of paper card → autofill (Claude/Gemini vision)
10. **AI Contact Enrichment** — lead email → LinkedIn/company lookup (Apollo.io or similar)
11. **Native HubSpot OAuth connector** (most-requested CRM)
12. **Native Salesforce OAuth connector** (second most-requested)
13. **Google Wallet pass** to match Apple Wallet
14. **Virtual backgrounds** (PNG export)
15. **Field locking** for team-managed cards
16. **Lead routing** (round-robin to team members)

### Wave 3 (3-4 weeks, enterprise tier parity)

17. **Custom domains** (Vercel domain aliasing + tenant routing)
18. **White-label config** (tenant logo, footer, brand)
19. **Admin dashboard for teams** (single pane for multi-card org)
20. **REST API** (`/api/v1/cards`, `/api/v1/leads`) with bearer-token auth
21. **Audit log** subcollection + UI view
22. **Card versioning** with rollback
23. **Bulk CSV card import** UI (script already exists)
24. **GDPR DSAR self-serve endpoint**

### Wave 4 (separate vertical: event mode)

25. **Event campaigns** field + filter
26. **Qualifying questions** in lead capture
27. **Conference badge scanner** (reuses Wave 2 AI Scanner)
28. **Offline lead queue** (Service Worker)
29. **Event ROI dashboard**

### Wave 5 (separate vertical: dynamic QR platform)

30. **Wi-Fi / location / menu / coupon QR types**
31. **QR folder organisation**
32. **QR PDF export with crop marks**
33. **Device / time-of-day analytics breakdowns**
34. **Geolocation pinning on scan**

## Honest assessment of "best in field" claim

Today we have one part of the field already won — **the AR
experience itself is more advanced than every named competitor**.
That's not opinion; none of them ship WebXR hit-test, none ship
hand-locked MediaPipe AR, none ship Gaussian splatting or VRM
companions, none ship AR scene recording.

What we don't have is the **business mechanics layer** of those
platforms — the bits that turn a card into a measurable B2B
revenue tool. Wave 1 + Wave 2 above closes ~85% of that gap in
a month of focused work. Wave 3 is "we can sell to a 200-person
sales org". Waves 4 + 5 are separate product lines layered on
the same infrastructure.

The fastest path to "we are the obvious choice for an AR-forward
brand" is finish Wave 1, run a public landing page that lists
both columns ("everything Blinq has + AR they can't ship"), and
take orders.
