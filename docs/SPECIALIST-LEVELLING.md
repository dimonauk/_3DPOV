# Specialist Levelling — Bringing the Cast up to Aura's Anatomy

The per-specialist rubric for the four non-Aura crew members (Coco,
Marcel, the Scribe, Penny). For each of the nine layers in
[`SPECIALIST-ANATOMY.md`](SPECIALIST-ANATOMY.md), the question is: does
the specialist have this, and if not, what is the smallest thing that
would land it?

Calibration target: [`AURA-WORKED-EXAMPLE.md`](AURA-WORKED-EXAMPLE.md).

Voice: catalogue mode throughout. No princess flourish in the rubric
itself.

Legend:

- ✅ — done; matches the calibration target.
- ⚠️ — partial; passes the minimum but does not match the target.
- ❌ — missing; ship-blocking for the surfaces that require it.

---

## Ship-ready threshold

To expose a specialist on `/agents/<slug>` in production they must pass
layers 1–8. Layer 9 (skills) is optional for ship but mandatory for
any specialist whose surface includes writing, narrative, or canon-
critical work.

| Specialist | Ship-ready today? |
|---|---|
| Aura | ✅ Yes — passes all nine layers. |
| Coco | ❌ No — layers 6, 7, 9 fail. |
| Marcel | ❌ No — layers 6, 7, 9 fail. |
| The Scribe | ❌ No — layers 6, 7, 9 fail. Most critical because the Scribe's role is canon-keeping; an empty research log is the void at the centre of her job. |
| Penny | ❌ No — layers 6, 7, 9 fail. Also layer 8 (tools) is misaligned with her operational role. |

---

## Coco — The Stylist

Source: `data/agents/coco.json`, `lib/agents/specialists/coco.ts`.

| Layer | Status | Note |
|---|---|---|
| 1. Identity | ✅ | Slug `coco`, kingdom `artistic`, VRM `/avatars/coco.vrm`, active true. |
| 2. Backstory | ✅ | Operational backstory + multi-paragraph `longBio`. Stylist, vibe-check, mean-but-pretty, affection-under-the-eye-roll. |
| 3. Voice canon | ✅ | `voiceRegister: "stylist-vibe-check"`, `doNotSay` (15 items), `speaksAbout` (7 items), `doesNotSpeakAbout` (5 items). Good cover. |
| 4. System prompt | ✅ | Six sections present (WHO YOU ARE, NOT, VOICE, BOUNDARIES, TALK ABOUT, NEVER-LIST, MODE). Body-shame redirect and cultural-aesthetic guardrail are load-bearing and present. |
| 5. Preferred model | ✅ | `claude-sonnet-4-6` via Aperture. Matches the register. |
| 6. Memory | ⚠️ | Namespace `agentSlug: "coco"` exists in the store but no seeded facts. The IndexedDB and Firestore stores will work; they are empty. |
| 7. Research log | ❌ | Empty. No indexer pass for the topics she leans into (palette theory, the wardrobe queue, the cast's outfit catalogue). |
| 8. Tools | ⚠️ | Carries `web.search`, `memory.recall`, `memory.remember`. Reasonable for her surface, but she has no tool that reads the `wardrobe.json` catalogue she speaks about, so the speaking is performative. |
| 9. Skills | ❌ | None mapped. Suggested: a new `holoflow-style-canon` skill (the wardrobe.json catalogue, the cast's outfit rotations, the Salon's grooming protocols, the difference-between-expensive-looking-and-actually-expensive vocabulary). |

**Smallest things to ship:**

1. Seed the research log with the wardrobe catalogue facts (one fact
   per current outfit; `topic: "wardrobe.<slug>"`, source `operator`).
2. Add a `wardrobe.read` tool that reads the canonical wardrobe
   catalogue from `lib/cast/` or equivalent. Wire it into Coco's
   allow-list.
3. Author the `holoflow-style-canon` skill at
   `~/.claude/skills/holoflow-style-canon/SKILL.md`. Triggers on
   keywords like "outfit", "vibe", "palette", "fit", "wardrobe".

---

## Marcel — The Architect

Source: `data/agents/marcel.json`, `lib/agents/specialists/marcel.ts`.

| Layer | Status | Note |
|---|---|---|
| 1. Identity | ✅ | Slug `marcel`, kingdom `architectural`, VRM `/avatars/marcel.vrm`, active true. |
| 2. Backstory | ✅ | Multi-paragraph `longBio` + operational `backstory`. The Insubordinate Lavender dispute is canon-anchored. |
| 3. Voice canon | ✅ | `voiceRegister: "architect-declarative"`, `doNotSay` (16 items), `speaksAbout` (9 items), `doesNotSpeakAbout` (5 items). |
| 4. System prompt | ✅ | All six sections. Boundary clause is sharp (will not compromise chromatically; can be talked round on emphasis, not coherence). |
| 5. Preferred model | ✅ | The crew-side specialist record routes him to `claude-opus-4-7` for architectural reasoning depth; the cast bible JSON lists `claude-sonnet-4-6`. **Drift to fix:** align the two so `data/agents/marcel.json`'s `preferredModel` matches the specialist record's `preferredModel`. The crew-side override wins at runtime, but the cast-bible JSON is the row the chat route reads. |
| 6. Memory | ⚠️ | Namespace exists, empty. |
| 7. Research log | ❌ | Empty. Marcel's surface needs the 28-letter genome alphabet, the five coordination levels (which he names in the prompt), the printability oracle dependency map, the Salon's grooming protocols (Marilyn Permanent Wave, Starch-Finish resin). |
| 8. Tools | ⚠️ | Carries `memory.recall`, `memory.remember`, `drop.read`, `print.check`. Tool list is correct in shape — he has the printability surface — but he has not actually invoked `print.check` in production yet. The crew-runner tool-call surface needs verifying. |
| 9. Skills | ❌ | None mapped. Suggested: extract a `holoflow-coordination-levels` skill from his system prompt (the five levels, when each applies, when each fails) and a separate `holoflow-printability` skill that wraps the Oracle's dependency map. |

**Smallest things to ship:**

1. Resolve the `preferredModel` drift between `data/agents/marcel.json`
   (`claude-sonnet-4-6`) and `lib/agents/specialists/marcel.ts`
   (`claude-opus-4-7`). Pick one; canonise in the JSON; the cast
   bible is the source of truth.
2. Seed the research log with: the five coordination levels, the 28-
   letter genome alphabet, the eight kingdoms, the printability-
   oracle dependency chain, the Salon's grooming protocols.
3. Verify Marcel actually invokes `print.check` against a real image
   end-to-end in the crew runner. If the runner's tool-call surface
   is broken, that is the highest-leverage fix in the whole cast.
4. Author the `holoflow-coordination-levels` skill.

---

## The Scribe — The Cataloguer

Source: `data/agents/scribe.json`, `lib/agents/specialists/scribe.ts`.

| Layer | Status | Note |
|---|---|---|
| 1. Identity | ✅ | Slug `scribe`, displayName "The Scribe", kingdom `ritual`, VRM `/avatars/scribe.vrm`, active true. |
| 2. Backstory | ✅ | `longBio` and operational backstory. Verbatim discipline; the line between draft and canon. |
| 3. Voice canon | ✅ | `voiceRegister: "archivist-verbatim"`, `doNotSay` (15 items, including the killer "I think" and "probably"), `speaksAbout` (6 items), `doesNotSpeakAbout` (5 items). |
| 4. System prompt | ✅ | Six sections plus a dedicated `CITATION DISCIPLINE` section in the crew-side prompt. The "if it's not in writing, you don't have it" rule is load-bearing and explicit. |
| 5. Preferred model | ✅ | `claude-sonnet-4-6` via Aperture. |
| 6. Memory | ⚠️ | Namespace exists, empty. For the Scribe specifically this is more severe than for the others — her role IS the memory. An empty memory means she has nothing to read back. |
| 7. Research log | ❌ | Empty, and this is the most ship-blocking gap in the whole cast. The Scribe's promise is verbatim canon with dates. Without a seeded research log her every reply is "I don't have that in writing" — which is voice-correct but useless. She is the specialist whose anatomy most depends on this layer. |
| 8. Tools | ⚠️ | Carries `web.search`, `web.fetch`, `memory.recall`, `memory.remember`, `drop.read`. Reasonable, but missing a `codex.read` and `articles.list` surface that would let her cite the studio's own published positions by URL and date. The web tools are a workaround; a dedicated catalogue tool is the proper fix. |
| 9. Skills | ❌ | None mapped. Suggested: a `holoflow-canon-index` skill that documents what is canon (locked vs draft), what is published, and the chronology of the studio's positions. |

**Smallest things to ship:**

1. **(Highest priority across the whole cast.)** Indexer pass over
   `components/articles/entries/`, `components/journal/entries/`,
   `components/tutorials/entries/`, `components/codex/entries/`, plus
   the synthesis directory (`C:/dimonauk/_3DPOV/synthesis/`). Each
   document becomes one or more facts with date, source path, exact
   phrasing where possible. Target: 200+ facts in the Scribe's
   research log.
2. Add `codex.read({ slug })` and `articles.list({ category? })` tools
   to the registry; wire them into the Scribe's allow-list.
3. Author the `holoflow-canon-index` skill that mirrors the
   `10-canon-locked.md` synthesis (one piece of canon per fact,
   dated).

---

## Penny — The Chief-of-Staff

Source: `data/agents/penny.json` (no `specialists/penny.ts` exists
yet).

| Layer | Status | Note |
|---|---|---|
| 1. Identity | ✅ | Slug `penny`, kingdom `techno`, VRM `/avatars/penny.vrm`, active true. |
| 2. Backstory | ✅ | Multi-paragraph `longBio`. Chief-of-staff to Aura, operational core of the Academy. Northern, dry, short clauses. |
| 3. Voice canon | ✅ | `voiceRegister: "chief-of-staff-northern"`, `doNotSay` (16 items), `speaksAbout` (7 items), `doesNotSpeakAbout` (5 items). |
| 4. System prompt | ✅ | Six sections. The "do not improvise numbers" boundary is sharp and load-bearing. |
| 5. Preferred model | ✅ | `claude-sonnet-4-6`. |
| 6. Memory | ⚠️ | Namespace exists; empty. Penny's role is operational continuity; the empty memory is a functional gap. |
| 7. Research log | ❌ | Empty. She speaks about timetables, rotas, dependency chains, inventory, the wardrobe queue, the Marcel-Penny operational pact. None of these have facts. |
| 8. Tools | ❌ | **No `lib/agents/specialists/penny.ts` exists yet.** She is in the cast registry via `data/agents/penny.json`, but she has no crew-side `Specialist` record, no tool allow-list, no orchestration role declared. The chat surface works (the cast JSON is sufficient for the per-agent chat route) but the crew runner cannot dispatch to her. |
| 9. Skills | ❌ | None mapped. Suggested: a `holoflow-ops-rota` skill that documents the studio's actual operational rhythms (drop cadence, queue depth, Marcel-Penny pact, inventory cycle). |

**Smallest things to ship:**

1. Author `lib/agents/specialists/penny.ts` mirroring the shape of
   `marcel.ts` / `coco.ts` / `scribe.ts`. Set `allowDelegation: false`.
   Tool allow-list: `memory.recall`, `memory.remember`, plus (when
   built) `rota.read`, `inventory.list`, `dependency.trace`.
2. Build the operational tools she actually needs (`rota.read`,
   `inventory.list`, `dependency.trace`) and register them. Until
   these exist, her surface is performative.
3. Seed the research log with the operational facts: drop cadence,
   tier-included credits structure, first-refusal radius by tier,
   Marcel-Penny pact terms, the printability gate's queue depth.
4. Author the `holoflow-ops-rota` skill.

---

## The actionable next-step list

In priority order, smallest first where the leverage is highest:

1. **(Ship-unblocking, highest leverage.)** **Seed the Scribe's
   research log.** Indexer pass over `components/articles/entries/`,
   `components/journal/entries/`, `components/tutorials/entries/`,
   `components/codex/entries/`, plus
   `C:/dimonauk/_3DPOV/synthesis/`. Target: 200+ facts with date,
   source path, exact phrasing where possible.

2. **Verify the crew runner's tool-call surface works end-to-end.**
   Pick Marcel + `print.check` as the test case. If it works, every
   specialist's tool list becomes real. If it doesn't, no specialist's
   tools are real, and the whole cast's layer 8 is performative.

3. **Author `lib/agents/specialists/penny.ts`** so Penny becomes
   crew-dispatchable. Currently she only has the chat surface; the
   crew runner cannot delegate to her. This blocks Aura from
   delegating operational questions correctly.

4. **Resolve Marcel's `preferredModel` drift.** The cast bible JSON
   and the crew specialist record disagree (`claude-sonnet-4-6` vs
   `claude-opus-4-7`). Pick one. Canon goes in the JSON.

5. **Build the catalogue tools** that close the speaks-about-but-
   cannot-act-on gap: `codex.read` (Scribe), `articles.list`
   (Scribe), `wardrobe.read` (Coco), `rota.read` (Penny),
   `inventory.list` (Penny). Each is a thin server-only handler that
   reads existing studio data; each unlocks a specialist's existing
   voice surface.

6. **Author the four missing skills:**
   - `holoflow-canon-index` (Scribe)
   - `holoflow-coordination-levels` (Marcel) +
     `holoflow-printability` (Marcel)
   - `holoflow-style-canon` (Coco)
   - `holoflow-ops-rota` (Penny)

7. **Seed the other three research logs** (Coco, Marcel, Penny) with
   their domain-specific facts. Lower priority than the Scribe's
   because their voice surface is less canon-dependent; still
   required for ship.

When all seven items land, the cast passes layers 1–8 across the board
and layer 9 has at least one skill per specialist. The cast can be
exposed on `/agents/<slug>` as a coherent surface.

---

## See also

- [`SPECIALIST-ANATOMY.md`](SPECIALIST-ANATOMY.md) — the nine-layer
  blueprint.
- [`AURA-WORKED-EXAMPLE.md`](AURA-WORKED-EXAMPLE.md) — the calibration
  target.
- `data/agents/coco.json`, `marcel.json`, `scribe.json`, `penny.json`
  — the four non-Aura cast bibles.
- `lib/agents/specialists/coco.ts`, `marcel.ts`, `scribe.ts` — the
  three crew-side specialist records that exist today. (Penny's is
  missing; see priority 3 above.)
- `lib/agents/cast.ts` — the cast registry; uses all five JSON files.
- `lib/agents/tools/registry.ts` — the tool registry to extend in
  priority 5.
