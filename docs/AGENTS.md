# docs/ — signpost

Living-document plans, decision records, operator walkthroughs. Read
these when you need context that isn't in code or skills.

## Index

| File | What it is | When to read |
|---|---|---|
| `SHIP-PLAN.md` | Phased run-through of remaining work (Phase 0-4). Tick items as they land. | First. This is the current sprint backlog. |
| `BUREAU-AR-LOOP-PLAN.md` | The print bureau × HoloWalk AR commerce loop — strategy, types, routes. | Before touching `/bureau` or `/holo-walk`. |
| `STRIPE-SLOT-IN.md` | Operator walkthrough for activating Stripe in production. | When you have `STRIPE_SECRET_KEY` to set. |
| `CHANGELOG.md` | Append-only running log of notable changes. | When you ship something user-facing — add a line. |
| `FIREWALL.md` | CSP + WAF posture. Header strategy, BotID config. | Before changing `middleware.ts` or `vercel.json` headers. |
| `COMMERCE_ROADMAP.md` | Higher-level commerce vision (bureau + holowalk + cards + member tiers). | Pairs with SHIP-PLAN for the long arc. |
| `CAPABILITY_REGISTRY_PLAN.md` | How the capability registry is supposed to evolve. | Before adding a new capability kind (not just a new verb). |
| `EXTERNAL_DEPS_QUEUE.md` | Outstanding-wiring env vars + what each unlocks. | When triaging "what's the highest-leverage env var to set next?" |
| `LOCAL_SERVICES.md` | Bench-side service map (ports, launchers, dependencies). | Pairs with `python-services/PROXY_BRIDGES.md`. |
| `MIGRATION_PRINCIPLES.md` | How to port a prototype from `D:\The_Hangar\apps\prototypes\` into Holoflow. | Before any port from the Hangar. |
| `HANGAR_MAP.md` | Index of what's in `D:\The_Hangar\` — what's portable, what's bench-side. | Pairs with SHIP-PLAN Phase 2. |
| `STRIPE_GATING.md` | Member-tier gating strategy (Perch / Nest / Fledge). | When wiring tier-gated content. |
| `ARCHITECTURE.md` if it exists | Rule 1: 300-line cap. Other architecture rules. | First touch of any large file. |

## When to add a doc

The doc is the right shape when:
- A decision was made that future-you (or future-Claude) would
  re-litigate without it ("why did we pick X over Y?")
- A multi-step operator process needs a script-free walkthrough
- A bench / external dependency has setup steps that don't fit in
  `.env.example` comments

When NOT to make it a doc:
- If it's an agent rule, put it in a skill at `~/.claude/skills/<name>/`
- If it's per-capability detail, put it in the capability's
  `.PURPOSE.md`
- If it's a snapshot of state, put it in a TODO comment + the
  CHANGELOG, not a doc that goes stale

## Voice

Catalogue voice — dry, specific, factual. No marketing copy. See the
`holoflow-voice` skill.

## Living vs frozen

Most docs here are **living** — edit them as the situation changes,
don't append a date and start a new section. Exceptions: `CHANGELOG.md`
(append-only by convention).

When a doc gets long enough that nobody reads it, split it. When the
phase it described ships, archive (move to `docs/_archive/`) rather
than delete.
