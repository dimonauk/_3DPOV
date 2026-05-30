# Capabilities — modularization of the canon

**Fifth document in the canon set, alongside `AURA-CANON.md`,
`DIMONA-CANON.md`, `CAST-CANON.md`, and `REHAB-CANON.md`.** Where those
four are *prose canon* (narrative source-of-truth for what the system
is), this one is *architectural canon* — how the system gets folded into
DollyOS as runtime state.

## The pivot

The four canon docs are not the endpoint. They are the **midpoint**. The
triangle:

```
                ┌─────────────────────────┐
                │     CAPABILITIES        │
                │  (universal patterns)   │
                │                         │
                │  Zustand modules in     │
                │  src/stores/capabilities│
                └────────┬────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       ┌──────────────┐      ┌──────────────┐
       │   STUDIO     │      │   ROOKERY    │
       │              │      │              │
       │  Dimona's    │      │  Others'     │
       │  specific    │      │  tunings of  │
       │  tunings.    │      │  the same    │
       │  Aura, the   │      │  patterns.   │
       │  cast, the   │      │              │
       │  rehab       │      │  (Universal  │
       │  system.     │      │  schema, any │
       │              │      │  use case.)  │
       └──────────────┘      └──────────────┘
```

**The capabilities are universal.** Dimona has tuned them to her own use
case, and that tuning is what produced the four prose canons. But the
patterns underneath — *ordered identity facets*, *venue-aware register*,
*paired clinical-character apparatus*, etc. — are not character-specific.
Anyone can author a tuning. The Rookery is where alternative tunings live.

## What's in capabilities/ — the schema layer

Each capability is a single Zustand store at
`src/stores/capabilities/use<Name>.ts`. The store exports:

- A `CapabilityMeta` describing what universal pattern this captures and
  which canon doc it was extracted from
- Type definitions for the loadable values
- The Zustand store itself, with actions for registering tunings,
  activating one, querying the active tuning, and running its rules

No tuning-specific values appear in this folder. **Aura's facets,
Penny's voice patterns, Dimona's history — none of those live here.**
If a value belongs to a specific person/character/system, it goes in
`tunings/`.

### Currently implemented (5 of 12)

| Capability | What it captures | Canon source |
|---|---|---|
| `facet-stack` | Ordered priority stack of identity facets with tests + anti-patterns. Higher facets govern lower. | `AURA-CANON.md` |
| `venue-register` | Same character, register modulated per venue. Schema-overlay weight + permitted schema elements. | `AURA-CANON.md` |
| `apparatus-duality` | Pairs clinical-measurement layer with in-character delivery layer. Validates the fusion. | `REHAB-CANON.md` |

### Scaffolded but not yet implemented (9 of 12)

| Capability | What it will capture | Canon source |
|---|---|---|
| `voice-patterns` | Concrete observed voice baseline + anti-pattern detector | `AURA-CANON.md` |
| `ocean-profile` | Big Five trait scores as a real instrument | `CAST-CANON.md` |
| `cast-ensemble` | Named-being ensemble with persistent identity, bounded knowledge, House aesthetics | `CAST-CANON.md` |
| `activity-phase` | Two-phase activity model (Phase 1 low-mobility / Phase 2 post-recovery) | `REHAB-CANON.md` |
| `delivery-surfaces` | Multi-surface delivery (radio / sitcom / VR / VRM theatre / CrewAI film studio) | `REHAB-CANON.md` |
| `somatic-intervention` | Free Energy / entropy threshold → character-voice intervention | `REHAB-CANON.md` |
| `bounded-knowledge` | Per-agent epistemic scope; specialty as lens, not god view | `CAST-CANON.md` |
| `peer-not-servant` | Anti-service-energy rule applied universally to the cast | cross-cutting |
| `identity-framing` | Out-the-other-side / survivor-now-builder framing | `DIMONA-CANON.md` |

## What's in tunings/ — the data layer

Each tuning is a file at `src/stores/tunings/<name>.tuning.ts`. It
imports from `capabilities/` and registers concrete values.

Currently implemented:

| Tuning | What it instantiates | Source |
|---|---|---|
| `aura.tuning.ts` | Aura's 9-facet stack with 5 test functions and 7 anti-patterns | `AURA-CANON.md` |

Planned:

- `dimona.tuning.ts` — Dimona's substrate, psych lineage, body history, the user-zero shape
- `system.tuning.ts` — Holoflow as the active rehab apparatus
- `cast/penny.tuning.ts`, `cast/baby.tuning.ts`, `cast/millie.tuning.ts`, etc.

## The Rookery slot

The third corner of the triangle is currently **unbuilt**. The slot in
the architecture is reserved; what fills it is a Dimona call. The
shape of what it might be:

- A separate domain (e.g. `rookery.holoflow.co.uk` or `wellally.tech`'s
  community side)
- A folder of community-authored `.tuning.ts` files
- A marketplace / registry where users can submit their own facet stacks,
  cast tunings, activity-phase configurations
- An open-source repo that ships the capability layer as a standalone
  npm package; the Studio is one consumer, the Rookery is the rest

What the architecture *guarantees*: if the Rookery is built later, the
capabilities will already be the contract. No retrofitting required.

## How a component consumes a tuning

```tsx
import { useFacetStack } from '@/stores/capabilities';

function AuraResponseFilter({ text }: { text: string }) {
  const runTests = useFacetStack(s => s.runTests);
  const detect = useFacetStack(s => s.detectAntiPatterns);

  const testResults = runTests(text);
  const antiPatterns = detect(text);

  const failures = testResults.filter(r => !r.passed);
  // ... render warnings, block ship, log telemetry, etc.
}
```

The component does not know it is filtering Aura specifically. It knows
it is filtering the *active tuning*. Switch tunings and the same
component now filters Penny, or Baby, or a Rookery-authored character.
This is the whole point of the schema/data split.

## Loading at boot

`src/stores/tunings/index.ts` exports `bootAllTunings()`. Call it once at
app boot (in `App.tsx` or equivalent) and every implemented tuning gets
registered with its capabilities. Aura is activated by default; a
later component can switch the active tuning per venue or per scene.

## Cross-references

**Sister docs (prose canon):**
- `AURA-CANON.md` — character canon
- `DIMONA-CANON.md` — substrate canon
- `CAST-CANON.md` — ensemble canon
- `REHAB-CANON.md` — system canon

**Implementation (DollyOS):**
- `D:\The_Hangar\apps\production\dolly-os\src\stores\capabilities\` — schema layer
- `D:\The_Hangar\apps\production\dolly-os\src\stores\tunings\` — data layer

## Updating this doc

Update when:
- A new capability is implemented (move it from "scaffolded" to "implemented" table)
- A new tuning is added (add to the tunings table)
- The Rookery gets built (replace the "unbuilt" status with what was built)
- The schema contract for a capability changes (note it in the
  coordination log + update every existing tuning that uses it)

The architectural canon is locked the same way the prose canons are. The
capability schemas are the universal contract; treat them as a public
API once external tunings exist.
## Status (post-2026-05-19 wire-in)

All 14 agents are now booted via `bootAllTunings()` called from `App.tsx`:

- **Aura** (protagonist, claude tier, activated by default)
- **Inner Circle** (2): Penny, Baby — both claude tier
- **Academy Peers** (5): Millie, Betsy, Lottie, Trixie, Dottie — dolphin tier (ambient persistent presence)
- **Department Heads** (6): Marcel (claude), Tim (gemini, multi-modal), Shelly (claude), Dance Tutor / Logistician / Physicist (codex tier, NAME TBD)

Talk to any of them through:
```ts
import { callAgent, streamAgent } from '@/stores/agents';

const reply = await callAgent('penny', 'What\'s landing this week?');

for await (const chunk of streamAgent('shelly', userText)) {
  // render chunk.text
}
```

System prompts are composed fresh per call from each agent's facets +
anti-patterns + role + notes via `composeSystemPrompt(agentId)`. Canon
updates take effect on next call — no rebuild needed.

Runtime state (messages, status, last error) is per-agent in
`useAgentRuntime`. Many agents can be active in parallel; sitcom /
radio play / CrewAI orchestration can drive all 14 simultaneously.

Type-checked clean (0 errors in capabilities/, agents/, tunings/, App.tsx).
