Useful answers — they change two things.

**Sole trader** → footer needs a legal line but not much. UK Consumer Contracts Regulations 2013 require a geographic trading address for distance sales to consumers, and the sole trader's real name must be discoverable (not just the brand). Not required in the footer itself, but needs to be somewhere on /contact or /about. No Company Number, no VAT number yet. I'll add a small line to the footer like:

> *Holo-Flow Studio is a sole trader business operated by Dimona [Surname], Manchester, UK. [studio@holoflow.co.uk]*

Send me your **surname** and a **trading address line** (street + city, or "Studio address available on request" if you don't want it public yet — acceptable for sole traders working from home). I'll wire it in.

**Canon Pro-1100 print bureau** is interesting and changes P5 structure. Two ways to monetise a printer:

1. **Per-print catalogue** — you sell named print editions (e.g. "Poi Trail 01 — A2 on Hahnemühle Photo Rag"). Customers pick paper + size, add to cart, you print + ship. Regular Shopify product, ships when printed.
2. **Bureau time** — customers send their own files, you print them. This is a service, not a shelved good. Sold as "A2 print slot" products with an uploader on checkout, or as booked time via a calendar.

These coexist fine, but their product taxonomy is different. Most painful path: stuff both through the same Shopify product type. Cleanest path: two tags or two collections — "studio editions" (your poi prints + sculptures + waveguides) and "bureau services" (print-for-hire).

My recommendation:
- Launch Holo-Flow with studio editions only.
- Bureau comes later, gets its own dedicated route `/bureau` (or `/print-services`) + Shopify product type `bureau-service`. The printer arrives, you test workflow with friends, then list publicly.

**Shopify Payments** — you still haven't activated this. Nothing else matters until you do; site can't take money. Activate it when you're back.

---

Given where we are:

- **P0** — pushed, live on next auto-deploy ✓
- **P1** (delete test product) — you do, 1 min in Shopify
- **P2** (policies via Termly) — you generate text, paste into Shopify admin → Settings → Policies. The `/policies/[handle]` route I just shipped will auto-render them.
- **P3** (Klaviyo) — needs you to sign up + install the Shopify app. I can prep the frontend embed once you have an API key.
- **P4** (/about) — skeleton shipped. Needs real copy + photos from you.
- **P5** (real products) — shifted: your printable editions first, bureau later.
- **P6** (analytics) — Vercel Analytics already on. Plausible needs their domain set up (£9/mo + a tracking script I'll add).

**Current blockers waiting on you:** surname + trading address line, Shopify Payments activation, Termly policy text, delete test product. All of these can happen while you're on the train — none need my sandbox.

Drop those when you have them and I'll plumb the next round.