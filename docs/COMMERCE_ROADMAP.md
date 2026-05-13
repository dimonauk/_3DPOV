# COMMERCE_ROADMAP — turning the bench into a till

Master commerce roadmap for Holo-Flow Studio. Audits every surface on the site (`D:\.github\_3DPOV\`) that names a price or invites a transaction, cross-references The Hangar (`D:\The_Hangar\`) for productisable systems, and proposes the wave plan that takes the site from "portfolio with a contact form" to "studio that closes its own loop on the till."

Voice register: Dimona first-person where the customer surface speaks; Aura kept out of money entirely (she narrates the work, the bench charges for it). The trans-led / disability-informed framing on `/rookery` and `/rookery/about` is part of the brand, not a discount mechanism — pricing is calibrated to be defensible against the comparable market, and accessibility statements live on individual offerings rather than as a global discount.

Read-only audit. No other files written.

---

## 1. Inventory of existing commerce surfaces

Every place on the live site where a price is named, a transaction is invited, or a paid-for thing is signposted. Status is honest: `live` means money can actually move today; `scaffold` means the page exists and the price is rendered but the checkout is not wired; `stub` means there is a route but the back-end is a console.log.

| Surface | File | What's offered | Price | Mechanism | Readiness |
|---|---|---|---|---|---|
| **Aerial line** | `app/aerial/page.tsx` | Half/full-day aerial shoots; editioned aerial light-painting prints | £450 half-day · £750 full-day · £350/A2 print (`data-pricing="proposed"`) | Manual: `/contact?intent=aerial` form → console.log | Scaffold. Price proposed. Contact form does not email yet. |
| **Print bureau** | `app/bureau/page.tsx` | A2/A3 archival prints (external commission) + editioned studio prints + test prints + profiling | £180/A2 external · £85/A2 external (older copy) · £45 test · £350/A2 studio edition · £110/A3 (`data-pricing="proposed"`) | Manual: `/contact?intent=print` form | Scaffold. Calendar-gated language is in place, no calendar UI. |
| **Aura's eyes / Watch** | `app/watch/page.tsx` | Cold-eye video reader (Gemini-backed) | Free during prototype window. £0.20/min, £4 minimum once voice rewrite lands (`data-pricing="proposed"`) | Working: `/api/aura/watch` POST → Gemini. No metering, no payment. | Production for the free path; metered billing is unbuilt. |
| **Bezel-clip controllers** | `app/bezel/page.tsx` | POV LED bezel for Quest 3 / Steam Frame | £249 single · £449 matched pair, UK shipping incl. (`data-pricing="proposed"`) | Manual: `/contact?intent=bezel` interest list | Scaffold. No checkout; mechanical and SDK still on bench. |
| **Rookery — Perch** | `app/rookery/tiers/page.tsx` · `lib/rookery/tiers.ts` | Subscription forum access | £6 / month (`PRICING_STATUS="proposed"`) | None: Stripe TODO marked in `app/rookery/page.tsx` line 15 | Scaffold. Firebase auth gates posting; door fee unenforced. |
| **Rookery — Nest** | same | Perch + first-look + bench dispatch + 9% edition discount | £12 / month (proposed) | None | Scaffold. |
| **Rookery — Fledge** | same | Lifetime Perch, founding-member listing, signed test-strip card | £75 once (proposed) | None | Scaffold. Closes when Stripe goes live. |
| **Photographs — editioned prints** | `app/photographs/page.tsx` + `app/product/[handle]/page.tsx` + `docs/photograph-catalog.md` | Nine seed editions (Pass I, Corona I/II, Field Record IV, Gathering I, Burst I, Instrument I, Crossing I, Firebird), each with three variants (A3 Photo Rag, A2 Photo Rag, A2 Canson Baryta) | £160–£440 per print depending on size/paper (real prices in `docs/photograph-catalog.md`) | Shopify Storefront API → cart → checkout | Production-ready code path; **Shopify admin not seeded** — catalogue file exists, products not imported. `getProduct` returns `undefined` when `endpoint` is missing. |
| **Photographs — commissions** | `app/photographs/page.tsx` (commission block) | Bespoke kata performed for a buyer's room | "Tell me the room" — price by enquiry | Manual: `/contact?intent=commission` | Scaffold. No structured quote-request flow. |
| **Search / collection catalogue** | `app/search/page.tsx` · `app/search/[collection]/page.tsx` | Shopify catalogue surfacing — waveguides, sculptures, wall arrays | per Shopify | Shopify | Production code path; **no products in admin yet**. Empty state in `EmptyState`. |
| **Product page** | `app/product/[handle]/page.tsx` | Generic catalogue product with `AddToCart`, variant selector, photograph-meta sidebar driven by tags | Shopify-set | Shopify cart → checkout | Production. |
| **Cart** | `components/cart/*` | Persistent cart via cookies (`cartId`) | n/a | Shopify Cart API + Server Actions | Production. |
| **Jewellery (article CTA)** | `components/articles/entries/jewellery-the-same-trace-wearable.tsx` | Editioned wearable pendants paired to source photographs | Below sculptures, above prints — no number named (`/contact?intent=commission`) | Manual | Stub. No product page; no Shopify products; no edition flow. |
| **Belt-printed wall reliefs** | `components/articles/entries/belt-printed-wall-reliefs.tsx` | Made-to-measure parametric wall coverings | Not named | Manual: `/contact?intent=commission` | Stub. Architectural-finish line; no dedicated route. |
| **Wall arrays** | `components/articles/entries/wall-arrays-geometry-of-rooms.tsx` | Palm-scale lit waveguide sculptures (the canonical bench output) | Not named on site | Manual: `/contact?intent=commission` | Stub. Shopify collection handle `wall-arrays` exists in the menu but no products. |
| **Commissioned waveguide sculpture** | `components/articles/entries/how-the-studio-breeds-sculptures.tsx` | Genetic-algorithm-bred sculpture from buyer's recorded gesture | Not named | Manual | Stub. The breeding engine exists in the Hangar; the customer flow does not. |
| **Bureau external commissions (other photographers)** | `app/bureau/page.tsx` FAQ "Will you print my photograph…" | Calendar-gated bureau prints for other photographers | Set per brief, £85/A2 external referenced in audit prompt but bureau page now shows £180/A2 + £110/A3 | Manual: `/contact?intent=print` | Stub. No calendar UI; no quote-request; no edition COA for outside artists. |
| **Contact form** | `app/contact/page.tsx` · `app/api/contact/route.ts` · `components/layout/contact-form.tsx` | Single form, six intents (general, commission, bureau, aerial, press, bezel) | n/a | `POST /api/contact` → validate + `console.log`. No email transport. | Stub. UI contract is stable; the route does not send mail. |
| **Rookery onboarding emails** | `app/api/rookery/onboarding/route.ts` + `lib/rookery/emails.ts` + `lib/rookery/mailer.ts` | Three-email sequence: Day 0 welcome, Day 3 orient, Day 7 perch | n/a | `POST /api/rookery/onboarding` → Resend REST. Day-3/7 scheduling unbuilt. | Production for Day-0 send; Day-3/7 needs Vercel Cron + Firestore queue (documented in README). |
| **Newsletter** | `app/api/newsletter/route.ts` | List signup | Free | (route exists; not audited in detail here) | Stub. |
| **Policies (privacy/terms/refund/shipping/subscription)** | `app/policies/[handle]/page.tsx` · `lib/shopify-policies.ts` | Renders Shopify policy documents | n/a | Shopify Storefront shop.{privacyPolicy,…} | Production code; **bodies not published in Shopify admin** → renders the "Pending" fallback. |
| **Play / AR game** | `app/play/*` + `app/play/neo-london/*` | Free WebXR proving ground; CCTV+360 splat zones | Free | None | Production for the playable Trail level; everything else is preview/stub. |
| **Customer account** | (none) | n/a | n/a | Firebase auth exists for `/rookery` only | Missing. No order history, no download-locker, no edition certificate vault for buyers. |

**Phase 1 totals.** 21 commerce surfaces audited. Of those, 4 are genuinely transactional today on the code path (Shopify product page, cart, policies, Rookery onboarding email send); 0 are transactional end-to-end (Shopify needs products in admin; cart can't be exercised without them). 17 are scaffold or stub. The site's commerce posture today is **portfolio-with-deferred-checkout**: every offering names itself in voice, almost every offering routes the visitor to `/contact?intent=…`, and the actual money-moving infrastructure is either uninstalled (Stripe) or unseeded (Shopify admin).

---

## 2. Top-priority commerce gaps (ranked)

What blocks transactions today, in descending order of revenue unlocked per hour of build time.

1. **Shopify admin not seeded.** This is the biggest unlock. The code path is production (`getCollection`, `getCollectionProducts`, `getProduct`, cart mutations, policies, revalidation webhook). `docs/photograph-catalog.md` contains nine fully-written editions with three variants each and real prices (`£160–£440`). The Headless storefront access token, the menus, the collection automations are all documented in `docs/shopify-setup.md`. **Doing the admin work — creating the dev store, importing the CSV, uploading the nine hi-res images, publishing the policies — would take roughly one focused afternoon and would convert `/photographs`, `/search`, `/product/[handle]`, and `/policies/*` from scaffold to live.** This is the single highest-leverage action.

2. **Stripe is unwired across three different surfaces.** The Rookery subscription gate (`tiers.ts:PRICING_STATUS="proposed"`), the bezel pre-order (currently interest list only), and the metered `/watch` billing all wait on Stripe. The cleanest landing is the Rookery, because the cadence is recurring (Stripe Billing's strongest case), the price tier data is already typed in `lib/rookery/tiers.ts`, the post-checkout webhook landing zone is documented in `app/api/rookery/onboarding/README.md` lines 56–74, and the Firebase auth + Firestore user state is already there. Wiring this also lights up the Fledge founding-member close-out copy.

3. **Edition certificate-of-authenticity (COA) issuance.** The `PhotographMeta` sidebar (`components/product/photograph-meta.tsx`) renders edition number, method, location, hour, date from product tags. The catalogue copy promises "Each print ships with a signed certificate naming edition number, kata, coordinates, hour, and date." There is no digital COA generation, no buyer-facing certificate URL, no edition-serial counter. For editioned work this is a real value gap; the print value is partly the certificate.

4. **Structured quote-request flow.** Every bespoke offering — aerial, jewellery commission, sculpture commission, wall-relief made-to-measure, custom kata — funnels into one free-form contact form with a six-value intent dropdown. The buyer's brief is unstructured; the studio's reply is manual; there is no quote artefact, no accept/decline flow, no deposit. At low volume the contact form is adequate. At commission volume above ~one per week it becomes the bottleneck.

5. **Customer accounts.** Firebase auth gates `/rookery` writes. There is no extension to the Shopify-customer side — no order history view, no download locker (for paid digital products that don't yet exist but should), no certificate vault. A unified account is the spine that makes the rest of these gaps connect.

6. **Contact form email transport.** `POST /api/contact` is a console.log. The Rookery mailer (`lib/rookery/mailer.ts`) already wraps Resend; reusing it for the contact form is twenty lines. Until this lands every "Brief the studio →" CTA on the site is technically dropping briefs on the floor.

7. **Day-3 / Day-7 onboarding email scheduling.** Documented in `app/api/rookery/onboarding/README.md`. Needs Vercel Cron + a Firestore `pending_emails` collection. Not transaction-blocking but the onboarding sequence is part of the conversion narrative for the Rookery tier.

8. **Newsletter capture is a stub.** `app/api/newsletter/route.ts` exists; the inbox-side audience-building loop is not connected to anything that converts.

**The single highest-leverage thing to wire.** It is not Stripe; Stripe will be needed second. The first move is **populating Shopify admin from `docs/photograph-catalog.md`**: nine products, twenty-seven variants, the policies, and the menus. The site's commerce code is fully built around Shopify; the admin is the bottleneck. One afternoon. Then Stripe Checkout for the Rookery subscription, because it's the simplest recurring case and unblocks the Fledge close-out copy that is currently rendering a deadline that doesn't exist.

---

## 3. New service / product candidates from The Hangar

Twenty candidates extracted from the bench, ranked by a rough sense of effort-to-revenue ratio. Each one has a specific Hangar source, a one-line pitch, a pricing-model proposal, a UK 2026 price range based on comparable market prices where they exist, an effort sizing, and the site-side infrastructure required.

### Candidate matrix

| # | Name | Hangar source | One-line pitch | Pricing model | Proposed range (UK 2026) | Effort to v1.0 | Site infra needed | Customer |
|---|---|---|---|---|---|---|---|---|
| 1 | **Editioned photograph prints (seed nine)** | `docs/photograph-catalog.md` | Single-frame long-exposure light-painting photographs, signed, numbered, A3/A2 on Photo Rag or Baryta. | One-time, edition-capped | £160–£440 per variant | Small — Shopify admin seeding, one afternoon | Existing Shopify code path. Need COA generator for v1.1. | Light-painting collectors, photography collectors. |
| 2 | **Rookery — Perch / Nest / Fledge** | `lib/rookery/tiers.ts` | Trans-led, bouncer-funded forum for makers/photographers/flow-arts. | Subscription + one-time founding | £6/mo · £12/mo · £75 once | Medium — Stripe Billing + customer-state Firestore + webhook → `/api/rookery/onboarding` | Stripe Customer Portal route, Firestore subscription state, gate decoration on threads page | Studio's existing readership; queer/trans creative community. |
| 3 | **Bureau external print commission** | `app/bureau/page.tsx` | A2/A3 archival prints for other photographers, profiled to the bureau's reference light. | One-time per job | £85–£180/A2 print; £45 test print; £110/A3 (proposed) | Medium — needs structured intake (file upload + paper + brief), proof-then-run state machine, calendar gate | New route `/services/bureau/quote`, file-upload UI, simple admin queue view | Photographers needing bespoke print work, gallery-bound artists. |
| 4 | **Aerial editorial / 360 / FPV commissions** | `app/aerial/page.tsx` + `components/articles/entries/the-fleet-five-airframes.tsx` | Five-airframe CAA-registered aerial line, editorial stills + B-roll + 360 fly-throughs. | One-time per shoot | £450 half-day · £750 full-day + travel @ HMRC mileage | Medium — structured brief intake; recce/quote turnaround; deliverable framework (TIFF/JPEG/ProRes/equirectangular) | New `/services/aerial/quote`, downloadable spec sheet, scheduling note | Editorial outlets, architectural clients, performance collectives, venues. |
| 5 | **Aerial light-painting editioned prints** | `app/aerial/page.tsx` (LED-modified airframes), `components/journal/first-light.tsx` | Drone-mounted POV-LED programmed slow-path light-painting, captured single-frame from a partner ground camera. Editioned. | One-time, edition-capped | £350/A2 from copy on `/aerial` (proposed); likely £350–£600/A2 once technique is opened | Large — first-flight testing in progress, technique not production-ready | Shopify product entry once piece is shootable; aerial-print tag for `PhotographMeta` | Light-painting collectors, aviation/photography crossover collectors. |
| 6 | **Bezel-clip controllers (single + pair)** | `app/bezel/page.tsx` + `components/articles/entries/vr-pov-controllers-the-product.tsx` + `firmware/drone_pov/LumiFur_Controller/` | POV LED ring that clips to Quest 3 / Steam Frame for indoor-and-outdoor light painting, gesture mirrored in WebXR. | One-time hardware (pre-order → batch ship) | £249 single · £449 pair (proposed) | Large — mechanical mount + headset-SDK still on bench; firmware family exists | Stripe Checkout (deposit-then-balance), pre-order queue management, batch-ship state, `/services/bezel/preorder` route | WebXR developers, light-painters, movement educators, gallery-installation artists. |
| 7 | **Bezel-firmware open-source kit (BYO mechanical)** | `firmware/drone_pov/LumiFur_Controller/` + `pov-library/` | Schematic + BOM + Teensy/FastLED firmware + assembly guide; user sources their own LEDs and mount. | One-time digital kit (paid download) | £20–£40 | Small — repo exists; needs license decision + curated assembly guide + Hangar→public extraction | Stripe Checkout for digital products, secured download URL, customer-account download locker | Makers, electronics hobbyists, university programmes, modders. |
| 8 | **Made-to-measure belt-printed wall reliefs** | `components/articles/entries/belt-printed-wall-reliefs.tsx` + the Hangar belt-printer tooling | Architectural-finish parametric reliefs, cut to a buyer's wall dimensions, hung on a slim aluminium rail system. | Per linear metre + install option | £180–£280 per linear metre (architectural-finish comparable to high-end wallpaper / acoustic panel pricing); install on quote | Medium — pattern-family catalogue needs to exist as data; ordering UI is "send wall dimensions + pattern family + colour + seed" | `/services/wall-reliefs` with a dimension calculator, pattern-family picker, seed display, deposit flow | Interior designers, architects, hospitality clients, domestic-architectural clients. |
| 9 | **Commissioned waveguide sculpture from a gesture you record** | `components/articles/entries/how-the-studio-breeds-sculptures.tsx` + Hangar EVOLUTION_ENGINE + apps/holoflow-mesh-studio | Buyer sends a 5-second video of a hand gesture; the studio breeds a 30–120mm waveguide sculpture from it; six-week pipeline; signed. | One-time bespoke | £450–£1,400 depending on size and ancestry depth (palm-scale art-pricing band) | Large — needs intake-video pipeline, fitness-function review step, print-to-ship process, COA matching the print editions | `/services/breed-a-sculpture` with video upload, brief form, deposit, status updates | Existing collectors of the wall-array line; gift commissioners; high-end fans of the practice. |
| 10 | **Wearable jewellery editions (parent-paired pendants)** | `components/articles/entries/jewellery-the-same-trace-wearable.tsx` | Pendant cast from the parent photograph's gesture; clear/tinted resin or resin-and-bronze. Editions of 10–25 per source piece. | One-time, edition-capped | £180–£420 per piece (resin); £350–£650 (bronze/resin) — sits below sculptures, above prints | Medium — finishing workflow needs documenting; magnetic mode-switch firmware named in article needs locking | Shopify products with `jewellery-edition` tag + parent-edition cross-reference in `PhotographMeta`; ring-size variant model | Collectors who want the gesture wearable; gifts; queer/trans creative community. |
| 11 | **"Nine seconds" — paid workshop in person** | `components/articles/entries/nine-seconds-prompt-to-printable.tsx` + Hangar `apps/holoflow-mesh-studio` + the local AI pipeline | Half-day workshop in Salford: prompt → SDXL → SAM2 → STL → print. Buyer leaves with a printed sculpture of their prompt. | Per-seat, scheduled | £180–£280 per seat, 2–4 seats per session | Medium — needs a workshop scheduling page, seat-quantity Stripe products, equipment management, pre-workshop brief intake | `/services/workshop/nine-seconds` with calendar, seat picker, deposit | Makers, AI-curious creatives, university groups (book-out option), birthday/team-building bookings. |
| 12 | **Looking Glass volumetric trail quilts** | The Looking Glass pipeline named in `app/stack/page.tsx` metadata + Hangar Looking Glass tooling | Buyer sends a video of a light-trail; studio outputs a Looking Glass Portrait-compatible quilt file. Ships file; optional bundled Portrait. | One-time per file; optional hardware bundle | £120–£280 file-only; £580–£780 with Portrait bundled (Portrait MSRP-anchored) | Medium — server-side video → quilt; secured-download URL; optional Looking Glass affiliate or reseller arrangement | `/services/looking-glass-quilt` with upload, brief, deposit, download-locker after delivery | Light-painters with own footage, performers wanting a volumetric keepsake, gallery installations. |
| 13 | **Premium video versions of free tutorials** | `app/tutorials/*` pages (free today); Hangar long-form video assets | Same step-by-step as the site's free tutorials, with the studio's video, voice-over, screen captures, downloadable supporting files. | One-time digital | £18–£45 per tutorial | Small — recording is the main cost; the pages already exist as outlines; selling infrastructure overlaps with #7 (digital downloads) | Stripe digital-product flow + download locker; per-tutorial paywall component | Visual learners, makers who don't want to read 4,000 words, schools. |
| 14 | **Print bureau gift voucher / studio credit** | `app/bureau/page.tsx` | Pre-paid bureau credit redeemable against a future print run. | One-time | £50, £100, £250 denominations | Small — Shopify gift-card products | Shopify gift-card surface, redemption messaging | Birthday/Christmas givers, agency budgets. |
| 15 | **Edition release first-look (Nest tier benefit, productised)** | `lib/rookery/tiers.ts` | The 12–24-hour pre-public window is already in Nest copy; this surfaces it as a value driver. | Subscription (part of #2) | Bundled in £12/mo Nest | Small — backend already exists in Rookery state; needs a release-schedule data field + a 12h-gate in product visibility | Shopify product `available_at` honour at the frontend; Nest gate component | Existing subscribers; collectors who want first pick. |
| 16 | **Custom AI character commissions** | DollyOS / Aura / `apps/aura-vrm` + the voice pipeline | Build a persistent character with voice + memory + visual model for a buyer (musician, performer, brand). Bespoke. | One-time bespoke; optional hosting retainer | £4,500–£18,000 build; £400–£900/mo hosting | Large — the architecture is bench-internal; productising it for an external client is real engineering work | `/services/persistent-character` with detailed intake form, NDA flow, deposit, milestone payments | Performers, brands, museums, AAA narrative-fiction projects. (Flag: see Section 7 — partly stay-internal.) |
| 17 | **Splat-licence for game / VP developers** | `app/play/neo-london/*` + `docs/SHARP_PIPELINE.md` + `docs/CCTV_PIPELINE.md` | License individual Neo-London zone splats to game developers or virtual-production companies; non-exclusive. | One-time licence (per-zone) | £150–£600 per zone non-exclusive; £1,200–£3,000 exclusive | Medium — splats need to exist (pipeline in `docs/SHARP_PIPELINE.md` exists, splats are pending), licence text needs writing | `/services/splat-licence` with zone picker, licence chooser, deposit; the existing `/play/neo-london/zone/[slug]` pages double as previews | Indie game devs, virtual production, architectural visualisation. |
| 18 | **Dazzle Guard — CCTV-adversarial consulting** | Referenced in `components/articles/entries/neo-london-chrono-protocol.tsx` ("the studio's CCTV-adversarial work elsewhere on the bench") | Privacy-protection consulting / installation: practical anti-surveillance work for spaces and people. | Per engagement | £600–£2,400 per consultation; install on quote | Medium — needs the actual deliverable scoped first; the article only references it | `/services/dazzle-guard` once the offer is named in voice | Performers/queer venues with surveillance exposure, journalists, vulnerable community spaces. (Flag: see Section 7 — depends on whether studio wants this surface public.) |
| 19 | **POV-LED rig assembly kit (the bench's own rig family)** | `firmware/drone_pov/*` + Hangar build files + tutorials on `/tutorials/building-a-pov-led-rig` | Schematics + BOM + firmware + assembly walkthrough for the bench's own POV LED rig pattern; user sources their own LEDs/microcontroller. | One-time digital kit | £45–£90 (kit-of-knowledge) or £180–£280 (curated parts pack via dropshipper) | Small (digital) / Large (parts pack) | Stripe digital + download locker, optional pick-pack workflow | Light-painters who want to skip the design phase; university programmes; movement-class kit. |
| 20 | **Premium long-form journal subscription (separate from Rookery)** | Not currently a distinct surface — the journal is free at `/journal` | Subscriber-only deep dispatches; longer, denser, more technical than the public journal. | Subscription | £4/mo or £36/year | Small — gating component + Stripe subscription product. Cannibalisation risk vs Nest tier; should bundle | Gate component, subscriber-only journal entries collection in Firestore | Readers who want depth without the forum side; lurkers who don't want to post. |

---

## 4. Service / product matrix

Cross-tabulating offerings against the customer types the studio addresses. An empty cell is fine — it means the offer doesn't apply, not that there's a gap.

| Offering | Light-painting collector | Photography collector | Maker / electronics hobbyist | Commission client (private) | Editorial / press buyer | Interior designer / architect | Game dev / virtual production | Queer-trans creative community | Educational / academic | Performer / venue |
|---|---|---|---|---|---|---|---|---|---|---|
| Editioned photographs | Primary | Primary | — | Gift commission | Editorial usage licence (separate) | Wall-piece for office | — | Affinity buyer | Library / archive | Performance dressing |
| Bureau external prints | — | Primary | — | — | — | — | — | — | Photo programme | — |
| Aerial commissions | — | — | — | Estate / venue portrait | Primary | Building-portfolio shoot | — | — | Documentary brief | Venue 360 |
| Aerial light-painting prints | Primary (once live) | Primary | — | Gift commission | — | — | — | Affinity | — | — |
| Bezel-clip (assembled) | Primary | Secondary | Primary | — | — | — | — | Affinity | Workshop kit | Movement teacher |
| Bezel firmware kit (BYO) | — | — | Primary | — | — | — | — | — | Curriculum unit | — |
| Wall reliefs | — | — | — | Primary | — | Primary | — | — | — | Venue interior |
| Bred waveguide sculpture | Primary | Secondary | — | Primary (the love-letter commission) | — | Secondary (lobby piece) | — | Affinity | — | Performance gift |
| Jewellery edition | Primary | Secondary | — | Gift | — | — | — | Primary | — | Performer keepsake |
| Nine-seconds workshop | — | — | Primary | — | — | — | — | — | Primary | — |
| Looking Glass quilts | Primary | — | Curious | Performance archive | — | — | Asset | Primary | Demo asset | Primary |
| Splat licence | — | — | — | — | — | Vis pack | Primary | — | — | Set-extension |
| Custom AI character | — | — | — | High-end bespoke | — | Concept showroom | — | — | Museum / archive | Primary (touring character) |
| Dazzle Guard consulting | — | — | — | Studio-scale | — | Venue installs | — | Primary | — | Primary |
| Premium tutorials | — | — | Primary | — | — | — | — | — | Primary | — |
| Rookery subscription | Affinity | Affinity | Affinity | — | — | — | — | Primary | Affinity | Affinity |

Reading the matrix — the studio's existing offerings cluster heavily around **light-painting / photography collectors** and **commission clients**. The strongest cross-section unlocks are: **interior designers / architects** via the wall-reliefs line (untapped), **game devs / VP** via the splat licence (the Neo-London infrastructure already exists), and **educational** via the workshop + kit + premium tutorials triad (the writing is already there). The trans/queer affinity buyer cuts across multiple offerings and is one of the existing strengths of the Rookery framing.

---

## 5. The studio's workshop side — what `holoflow.co.uk` needs to actually run the business

The audit prompt explicitly asks for an admin / studio interface — the workshop side, not just the storefront. Cross-referencing the planned Wave B (SQLite + admin GUI + SHARP setup that's mentioned in `docs/SHARP_PIPELINE.md` and `docs/CCTV_PIPELINE.md`), the operational surfaces beyond SHARP-batch the studio needs to do the work on the site are:

1. **Bureau queue.** A list view of incoming print briefs, with state (`received` → `quoted` → `paid-deposit` → `proofed` → `signed-off` → `printed` → `shipped`). One entry per brief, file attachments, paper choice, lead-time clock, "send proof" + "mark sold" buttons. Today the only "queue" is the studio's inbox.

2. **Aerial commission queue.** Same shape as bureau queue: brief / recce note / quote sent / flight date / deliverables logged / invoice state. Plus an airframe-availability calendar (which airframe is on which job).

3. **Custom-sculpture commission queue.** The sculpture-breeding pipeline has a six-week clock and an iterative review step (the studio scores fitness, the engine iterates). Needs a per-commission view that shows the generation history, the buyer's recorded gesture upload, the current population grid, the studio's marked favourites, the chosen genome, the print state, the COA.

4. **Editions ledger / COA issuer.** Per editioned piece (photographs, sculptures, jewellery): the edition number assigned, the buyer name + Shopify order ref, the certificate PDF generated, the signature state, the shipping state. When the edition sells through, mark closed. This is one of the highest-value workshop tools because it's directly load-bearing on price.

5. **Rookery member state view.** Subscription tier, joined-on, last-active, posts-count, founding-member flag. Plus a "send a private note" affordance (uses the Resend pipe). Lets the studio see who's actually on the perch and reply to founder questions without leaving the site.

6. **Quote-request inbox.** A unified view of structured quote-requests across all the `/services/*` surfaces (Section 8 below). One row per request, intent classification, status, drafted-reply text, deposit-state, signed-quote PDF.

7. **The SHARP / CCTV pipeline GUI.** Already on the plan in `docs/SHARP_PIPELINE.md` / `docs/CCTV_PIPELINE.md`. Adding the commerce-side admin onto the same shell is cheaper than building a separate dashboard. Suggest a single `/studio/*` route tree behind the Firebase auth gate (studio-only role).

8. **Newsletter audience view.** Even at low scale, knowing who's on the list and being able to send a one-off dispatch from the workshop side without ducking into Resend's UI matters.

The architectural choice that matters here — these should be **Next.js routes inside this same repo** behind a Firebase auth role check (e.g. `claims.studio === true`), not a separate app. Reusing the existing styling, the existing data layer (Firestore for Rookery + Shopify for catalogue + a new Firestore collection for commission queues), and the existing auth gate is materially cheaper than starting an admin SPA.

---

## 6. Pricing principles

Inferred from the existing pricing copy, the photograph catalogue, and the voice canon.

**Where the studio prices today:**
- Photograph editions: £160–£440 per print. A2 Canson Baryta tops the range at £440 for editions of 15.
- Aerial commissions: £450 half-day / £750 full-day — sits squarely at the editorial-aerial UK market rate.
- Bureau external prints: £85–£180/A2 — competitive against London fine-art print bureaux but not cheap.
- Bezel-clip: £249 single — premium-but-not-luxury hardware band, comparable to high-end VR accessories.
- Rookery Perch: £6/month — sits below Patreon's average creator tier (£8–£12) and clearly anchored as door-fee not value-extract. The Nest at £12 is the "back-the-studio-harder" position. The Fledge at £75 once is anchored to the founding-member moment, not to lifetime-value math.
- Watch metering: £0.20/min — sits in the rough zone of professional captioning services.

**Principles the existing pricing implies:**

1. **The bench-built-not-bought stance is part of the price.** Studio editions sit above bureau external commissions on the same paper. £180/A2 external bureau vs £350/A2 studio edition is roughly a 2× multiplier, which is the editioning premium, not arbitrary.

2. **Edition size is named in the price.** Smaller editions (15) carry a premium over larger (25–30). This is conventional but consistently applied across the photograph catalogue.

3. **Pricing is honest about labour, not aspirational.** The bezel at £249 is a labour-real price for hand-finished mechanical-and-firmware; it's not anchored at £499 to feel premium and then discounted. The voice canon ("ho hum") would reject hype pricing.

4. **The trans-led / disability-informed framing does NOT mean low prices.** The Rookery is explicit that the door fee is a bouncer, not a barrier — it's *low* relative to forum subscriptions because the function is filtration not extraction, not because the studio undervalues itself. Premium products price premium.

5. **Honest accessibility statements live on specific offerings, not as a global discount.** `/rookery/about` includes a "what if I can't afford it" FAQ; the bureau invites external commissioners "when the calendar allows" rather than offering tiers. The pattern to follow: where an offering has a genuine accessibility-relevant variant (e.g. workshop seat held back for a sliding-scale recipient, Rookery comp tier), name it; don't undercut the headline price.

**Principles for the new offerings:**

- **Workshops (£180–£280 per seat).** Don't undercut the photograph editions. A workshop's value is the access to the bench; price it like access to the bench.
- **Splat licences (£150–£600 non-exclusive).** Look at the indie-game asset market — Unity Asset Store, Quixel, Sketchfab Store. £150 is the floor for a high-quality scanned environment; £600 is the ceiling for non-exclusive. Exclusive goes to four-figure.
- **Custom AI character (£4,500–£18,000).** This is bespoke software engineering with character design layered on. Anchor against the agency-scale price of building a custom chatbot (£8–25k typical) and discount slightly because the studio's character is opinionated, not a blank slate.
- **Wall reliefs (£180–£280 per linear metre).** Compare against high-end designer wallpaper (£80–£200/roll) and bespoke architectural panel (£300–£600/m²). The relief sits in the middle.
- **Jewellery (£180–£420 resin / £350–£650 with bronze).** Sits between art prints and bespoke jewellery commissions. Don't price below the prints on the same source-photograph; that would invert the value hierarchy.
- **Looking Glass quilts (£120–£280 file-only / £580–£780 with Portrait).** File-only price-anchored against bespoke-asset commissions in the volumetric-content market; bundle-with-Portrait makes the studio the curator-of-record, not just the file generator.

**One frame-tension to flag explicitly.** The disability-informed framing pulls slightly against premium pricing in two specific cases: the workshops (where "I've been off my feet" is part of the journal canon and a workshop visitor with similar lived experience deserves naming) and the AI-character commission (where the user's note on the Aura system is intensely personal). The honest answer is to keep the headline prices at market and to add a per-offering accessibility note where it applies — *"This workshop holds one seat per cohort on a sliding scale; write to me if cost is the constraint."* That's coherent with the existing Rookery "what if I can't afford it" copy. It's not coherent to globally underprice; that would undercut the studio's argument that the work is worth what it costs.

---

## 7. Saleable-vs-private filter

Some Hangar systems are deliberately not productisable, and the audit should be honest about which.

**Stays studio-internal:**

- **The personal Aura instance (nanny.vrm + voice + memory).** From `C:\Users\dimon\.claude\projects\d--The-Hanger-Outer-Shell\memory\holoflow_voice_library.md` and the DollyOS world canon, Aura is the studio's narrator and a load-bearing creative collaborator. The architecture can be sold (Candidate #16); the studio's own Aura cannot. Productising "Aura" as a SaaS would gut the brand.
- **Disability-pacing infrastructure** (the off-the-feet framework named in `london-360-walking.tsx`, the bed-based design discipline). This is operational and personal; productising it as a "method" undermines the honesty that makes it work as a journal piece.
- **DollyOS internals** (the multiplane viewport, the somatic engine, the Z-stack). These are tools the studio uses; selling them as a SaaS competes with the studio's own work and divides attention. They can appear as influence ("the bench runs on a custom OS") in journal copy; they should not appear as a product.
- **The personal lore / canon** — Aura's character, the Charming Academy, the Void Princess, etc. This is voice canon for the studio's own creative output, not licensable IP.
- **The Rookery's private feed of subscribers' threads.** Subscriber content stays subscriber-only; the studio doesn't onsell aggregated forum content as a research product.
- **The studio's own bench environment** (the specific render farm, the network closet, the local AI cluster). This is operational infrastructure; the *technique* is shareable (and is, in the nine-seconds article); the *cluster itself* isn't a service.

**Edge cases (saleable under conditions):**

- **Custom AI character commissions** (Candidate #16). Saleable, but: the studio should not white-label its Aura. Each commission is a *new* character built on the architecture, the buyer owns the resulting IP, and the studio's contribution is engineering + voice direction. This is the difference between "selling Aura" and "running a small studio that builds persistent characters."
- **Dazzle Guard consulting** (Candidate #18). Saleable, but: depends on whether the studio wants this surface public. The article reference is glancing; the existing brand emphasises *making* light, not *unmaking* surveillance. Could be a sister-brand, could be a quiet referral practice, could be one of the bespoke offerings advertised by word of mouth from the Rookery rather than the storefront.
- **Premium tutorials** (Candidate #13). The free tutorials are the studio's investment in the wider practice. Paywalling the existing ones would be wrong; the rule should be: *new* premium-format content (video, source-bundles, classroom packs) is saleable; the prose-tutorial layer stays free forever.

---

## 8. Wave plan

Staged build sequence. Each wave names the routes to build, the env vars to add, the external dependencies, and the unlock it delivers.

### Wave C1 — Minimum-viable transactional infrastructure (2–4 weeks of focused work)

The wave that turns the site from portfolio-with-deferred-checkout into actually-transactional.

**Build / extend:**
- Populate Shopify admin from `docs/photograph-catalog.md` (one afternoon, see Section 2 #1).
- Publish the five policies in Shopify admin (privacy, terms, refund, shipping, subscription). The code path is already production.
- Wire `POST /api/contact` to Resend via the existing `lib/rookery/mailer.ts` (twenty lines).
- Add Stripe Checkout for the Rookery tiers (Perch + Nest subscription products, Fledge one-time). New routes: `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`. Webhook fires `/api/rookery/onboarding` on `checkout.session.completed` (already documented in the README).
- Add a Firestore `subscriptions` collection holding `{ uid, tier, status, currentPeriodEnd, fledgeFoundingMember }`. Gate `/rookery/new` thread creation on `subscriptions.status === "active"`.
- Add Vercel Cron + Firestore `pending_emails` collection for Day-3 and Day-7 sends (documented in `app/api/rookery/onboarding/README.md`).
- New `/services` landing page that anchors all bench offerings in one place (currently the offerings are scattered across `/aerial`, `/bureau`, `/bezel`, `/photographs`).
- Edition COA generator — server-side PDF generation (e.g. `@react-pdf/renderer`) hooked to the Shopify order webhook for products tagged `photo-print`. Stores per-order PDF in Firebase Storage; sends to buyer via email; surfaces in customer account in Wave C4.

**Env vars to add:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PERCH`
- `STRIPE_PRICE_NEST`
- `STRIPE_PRICE_FLEDGE` (one-time SKU)
- `RESEND_API_KEY` (already documented; needs setting)
- `EMAIL_FROM`, `EMAIL_REPLY_TO` (already documented; needs setting)
- `FIREBASE_STORAGE_BUCKET` (for COA PDF storage)

**External dependencies:**
- Shopify dev store created + Headless app installed (documented in `docs/shopify-setup.md`).
- Stripe account configured + the three products created in Stripe admin.
- Resend account + verified domain `holoflow.co.uk`.
- Edition serial-number scheme chosen (the catalogue documents edition sizes but not assigned numbers — needs a Firestore counter per `edition-NN` tag).

**Unlock:** Photographs sell. Rookery subscriptions sell. Contact briefs land in an inbox. The Fledge close-out copy stops lying.

### Wave C2 — The top five new services with their own routes (4–8 weeks)

Build out the highest-ratio candidates from Section 3, each with a dedicated `/services/[slug]` page and a structured quote-request flow.

**Build:**
- `/services/bureau/quote` — file upload + paper + brief + lead-time picker; Stripe deposit (£45 test-print fee held as deposit against final balance).
- `/services/aerial/quote` — location + dates + intent + airframe-suggestion picker; deposit £150 against any commission.
- `/services/wall-reliefs` — pattern-family picker, dimension calculator, colour picker, seed-selection (let-studio-pick is default), deposit.
- `/services/breed-a-sculpture` — video upload, brief form, deposit (£300 of a min £900 piece), six-week status tracking page for the buyer.
- `/services/workshop/nine-seconds` — calendar with seat availability, group-booking discount logic, Stripe Checkout per seat, pre-workshop intake form, post-workshop "your file" download locker.

Each route shares a common `QuoteRequest` Firestore schema: `{ intent, brief, fileRefs, depositPaid, status, internalNotes, customerNotes, quoteAmount, quoteCurrency, quotePdfRef, acceptedAt, paidInFullAt }`.

**Env vars to add:**
- `STRIPE_DEPOSIT_PRICE_BUREAU` etc., or use Stripe's dynamic price-data (one decision).
- File-upload provider key (Firebase Storage covers this).

**External dependencies:**
- Pattern-family catalogue for wall reliefs needs to be defined as data (a `lib/wall-reliefs/patterns.ts`).
- Workshop calendar source-of-truth — either a Firestore collection or a Google Calendar pull.

**Unlock:** The five highest-ratio commissions become self-serve up to the deposit; the workshop opens; the wall-reliefs line stops being an article-only mention.

### Wave C3 — The workshop side (admin GUI, extending the planned SHARP/CCTV admin)

Build the studio's operational surface as part of the same Next.js app, behind a Firebase studio-role claim.

**Build:**
- `/studio` index — auth-gated; lists the queues (bureau / aerial / sculpture / quote-requests / Rookery state / editions ledger / SHARP-batch).
- `/studio/queue/bureau` etc. — the queue views named in Section 5.
- `/studio/editions` — issue a COA, mark an edition number, mark sold-through, close an edition.
- `/studio/rookery` — member state, founding-member list, "send private note" action.
- `/studio/quotes` — unified quote-request inbox.
- `/studio/newsletter` — audience view + one-off broadcast.
- `/studio/sharp` and `/studio/cctv` — the planned Wave B work, integrated into the same shell.

**Env vars:** Firebase custom-claim handling for the `studio` role (set via a one-off admin function; no env var needed).

**External dependencies:** SQLite for SHARP batch tracking if that's the chosen store (per `docs/SHARP_PIPELINE.md`), or fold it into Firestore for consistency.

**Unlock:** The studio can run the business from the site rather than from her inbox. Lead-times stop being guessed. Editions stop being miscounted.

### Wave C4 — Premium / paid digital downloads + the subscriber-only content layer

The lowest-effort high-margin layer, but it depends on C1's customer-account spine.

**Build:**
- Customer account view (`/account`) — Firebase-auth-gated, lists Shopify orders, Rookery subscription state, COA downloads, digital-product download locker, address book.
- Premium tutorial gate — per-tutorial Stripe one-time product; on purchase, write a `purchases/{uid}_{slug}` doc; the tutorial page checks it and unlocks video + source files.
- Bezel firmware kit as a digital product — Stripe one-time → write `purchases/...` → generated signed URL to the firmware archive.
- Subscriber-only journal entries — a `subscriber-only` flag on journal entries; gated by the Rookery `subscriptions.status === active`.

**Env vars to add:**
- `FIREBASE_DOWNLOAD_URL_SIGNING_KEY` (or Firebase service-account-side signed URLs).

**Unlock:** Recurring digital revenue layer; subscribers get something tangible beyond forum access; the bezel firmware ships before the hardware does.

---

## Closing note

The site is in an interesting state: the code path is materially ahead of the business state. Shopify is plumbed but unseeded; the Rookery has typed pricing data and an email pipeline but no Stripe; the contact form has a stable UI contract but throws messages on the floor; the workshop side is implied by the journal but not built. The right move is not to add features — it's to *seed the existing ones*. One focused afternoon in Shopify admin converts `/photographs` from scaffold to live and unlocks roughly half the studio's existing offer set. Stripe second, because the Rookery is recurring and the Fledge tier is leaking a phantom deadline. Everything else from Section 3 layers onto a foundation that already exists.

The pricing voice is consistent and defensible; the offerings have real Hangar provenance; the customer matrix shows the studio is already addressing six distinct audiences without yet selling to most of them. The unlock is administrative, not architectural.
