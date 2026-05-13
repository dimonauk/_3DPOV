# Chrono-Protocol — Build Plan

The runner is in the Hangar. The site has the bridge article. This document names the shape of the road between the two — what shipped in the v0.1 scaffolding pass, what still has to land, and the honest timing.

I am writing this in my own voice because the audience is me-in-six-months and the next pair of hands. The Aura register sits on the visitor pages; this is the bench notebook.

---

## Architectural overview — three surfaces, one game

The site holds three surfaces that all point at the same game and have to stay distinct, because each does a different job and each one breaks if the other one tries to do its job for it.

1. **`/play` — the proving ground ladder.** Eight solo levels, four braided weaves, each isolating one philosophical thread or one weave of threads. The ladder teaches a body that can deploy all eight threads at once. It is not the game; it is the curriculum the game asks the body to have already passed. The other agent owns this surface — I do not touch `lib/play.ts` or `components/play/scenes/*` during the Chrono-Protocol pass.
2. **`/chrono-protocol` — the game proper.** This skeleton's whole job. The route the ladder graduates the player into: wireframe London, three zones, the five-mode wheel, three constructs as chorus, a tunnel rushing at twelve units a second. Everything new in this build lives here.
3. **`/play/neo-london` — the splat library.** The volumetric pass under the runner's wireframe. SHARP-generated splats land here as the bench captures the source frames. The splat-pipeline agent owns this surface. The Chrono-Protocol zones cross-reference the splat library by slug; when a splat lands for a zone the runner uses it as the tunnel skybox instead of the plain dark background.

The visitor's progression is:

> ladder → game → splat-tourist

Pass enough solo levels to unlock zones in the game; play the zones; eventually return to the splat library to walk the city the runner ran through. Three surfaces, one geography, one body.

The scaffolding pass does not collapse the surfaces into each other. The `/play` route remains the curriculum; `/chrono-protocol` remains the game; `/play/neo-london` remains the volumetric library. Each has its own URL, its own data layer, its own components. The links between them are explicit text links in the prose — not silent share-of-state.

---

## The 5-mode wheel as gameplay

The five modes come from `lib/chrono-protocol.ts` and the structural pattern is the MTG colour pie. AMBER → AZURE → AMETHYST → CRIMSON → VERIDIAN → AMBER. Two allies per mode (adjacent on the wheel), two enemies (the chord across).

The wheel becomes gameplay through three mechanics, defined in `lib/chrono-protocol/scoring.ts`:

- **Mode-correct match.** Used mode is the enemy's weakness exactly. 2x base score; the hit lands full damage; the dialogue triggers a positive line from the construct who holds that slot. This is the "perfect" relation, the moment the body recognised the angle the enemy was on and matched it.
- **Sympathetic match.** Used mode is adjacent on the wheel to the enemy's weakness — an ally. 1.25x base score; partial damage. The angle reads close enough; the body found the neighbour. The construct holding the used mode and the construct holding the weakness slot both react.
- **Off-angle.** Used mode is non-adjacent — an enemy of the weakness. 0.5x base score; damage out is halved AND damage taken increases. The body is fighting the wrong rule. This is where the player loses runs that they should have won.

Combos compound: every five consecutive clears bumps the next-clear multiplier by +0.1, capped at +1.0 (so combo 25 puts the multiplier at 2x on top of whatever wheel-relation multiplier already applied; a combo-25 mode-correct match scores 4x base). The combo resets on damage taken, not on mode switching — switching mid-combo is encouraged because the enemies change.

The design intent is: switching modes mid-run is the loop. The player must read what is in front of them, match the angle, switch, match the next angle, switch. The wheel is the input device. Poi muscle memory translates directly — switching modes is the same body gesture as switching figures in a 3-beat weave.

---

## The three zones as build milestones

The zones are not arbitrary difficulty curves; each one ladders the input requirements.

### v0.1 — site-side scaffolding (this pass)

For all three zones:

- Route exists at `/chrono-protocol/zone/[slug]`.
- Briefing page renders zone name, billing, description, difficulty, tunnel speed, mode roster, enemy roster, boss (or no-boss notice), narrating constructs, splat backdrop status, begin-run / back-to-hub links.
- Zone data in `lib/chrono-protocol/zones.ts` is canonical and matches the prototype's `constants.ts`.
- The run page mounts the GameCanvas pointing at the zone; the canvas mounts the tunnel-stub geometry tinted to the zone's first active mode.

### v0.5 — first zone fully playable (Leake St Arches)

Only the Safehouse. Reasons: tutorial difficulty, no boss, three enemy types, slow tunnel. The smallest target that proves the full game loop.

- Tunnel motion: camera dolly forward at the zone's effective speed.
- Rib recycling: 40 instanced ribs cycling in front of the camera.
- Poi physics: dual-thumb input wires to two pendulum-simulated heads with trails.
- Enemy spawn: three types from the zone's roster, on a tempo derived from `TUNNEL_SPEED`.
- Combat: mode-switching scores against enemy weakness per scoring.ts.
- Win condition: clear three phases worth of enemies, run scored, victory state hands off to the HUB.

### v1.0 — three zones, boss fights, splat backdrops

All three zones playable. Each zone has its boss (Royal Mile gets Piccadilly Spire; Soho gets Carnaby Monolith). Splat backdrops loaded when the SHARP pipeline has captured the source frames. Score persistence via Firebase. Leaderboard live.

### v1.5 — braided modes + canal fast-travel

Braided modes are the equivalent of `/play`'s braided levels — the player carries multiple modes simultaneously and switches the active one mid-clear (the wheel becomes a chord rather than a selector). Canal fast-travel between zones in the HUB (Regent's Canal, the Limehouse Cut, the River Lea). The pacing reference upstream is Walkabout Mini Golf — a body in a real walked space rather than a body teleported between menus.

---

## The dialogue system's growth path

v0.1 ships with ~30 static lines in `lib/chrono-protocol/dialogue.ts`, covering the trigger surface: zone-entered, phase-start, mode-changed, health-below, speed-above, combo-above, boss-defeated, player-died. The `pickDialogue()` function applies priority + a recency penalty (the most-recent speaker takes -25 on their next eligible line) to avoid two-in-a-row from the same construct.

Three growth waves:

- **Wave 6 (LLM dialogue source).** Swap the static bank for Gemini-prompted generation against the same trigger system. The prototype's `SYSTEM_INSTRUCTION` in `constants.ts` is the system prompt; the trigger gives the JSON body. The static bank stays as a fallback when the LLM call fails or the API key is missing.
- **Wave 7 (per-construct voice tuning).** Audio synthesis on the lines, per-construct. Aura uses Kokoro TTS with the Trans-led Architect register; Yow gets a synth with deliberately rigid prosody (autistic-coded as a fact about cadence, not a label); Purp gets a fast-clip register with London-cyberpunk slang intact. The voices land in a Wave-7 audio pass once the Web Audio plumbing matures.
- **Wave 8 (memory).** Aura remembers what the player did last run. Yow remembers the pattern the player kept breaking. Purp remembers which boss made them lose it. Persistent dialogue context via Firestore.

---

## Integration with /play — the unlock cascade

The ladder feeds the game. The contract is concrete:

- **Solo Levels 1-3 cleared (Module, Trail, Loop):** Leake St Arches unlocks in the HUB. The player has proven brush choice, angular-sync gesture, and the Loop's six-position diagram. The Safehouse asks for those threads and nothing else.
- **Solo Levels 1-5 cleared (+ Witness, Sovereignty):** Royal Mile unlocks. The player has proven cold-eye watching and the local-first architecture. Trafalgar to Regent Street demands the witness register (the runner has to read what is incoming) and sovereignty (the run survives network drops).
- **Solo Levels 1-7 cleared (+ Curriculum, Perch):** Soho Grid unlocks. The player has proven the curriculum-from-ladders rung and the publish-to-Rookery path. Soho is the publish target — the score lands on the Rookery feed if the Perch level has been cleared.
- **Solo Levels 1-8 cleared (+ Bezel):** All zones unlock; the Bezel WebXR pathway opens; runs can be played in the headset with the controller.
- **Braided passes:** the 2-Braid pass unlocks Creative mode; the 3-Beat Weave pass unlocks the leaderboard; the 5-Beat pass unlocks the canal fast-travel; the Full Weave pass unlocks the braided modes (the chord-wheel selector).

These gates are not wired in v0.1 — the HUB uses a stub `defaultSaveSlot()` that unlocks Leake St only. The eventual wiring reads `passedLevelCount(progress)` from `lib/play/state.ts` and the `levelStates` map, applies the contract above, and writes the result back into the chrono-protocol save slot. The wire-up is Wave 4.

---

## Integration with /play/neo-london — the splat backdrop

When a Chrono-Protocol zone's slug matches a SHARP-rendered splat in `data/neo-london/zones.json`, the game's tunnel renders against the splat skybox instead of a plain dark background. The data layer carries this through `zone.hasSplat` and `zone.splatSlug`; the GameCanvas reads those fields on mount.

v0.1 — no overlap. The splat library's first capture wave covered different slugs (Bankside, Liverpool Street). All three Chrono-Protocol zones read `hasSplat: false`.

Wave 5 — Leake St becomes the first overlap once the splat-pipeline agent's Leake St capture lands. The skybox loader reads from the same `gaussian-splat` source the splat library renders against; the tunnel-stub geometry overlays the splat as a wireframe pass on top of the volumetric pass. Same geography, two passes.

---

## Integration with the Rookery — scores publish

When the player clears a zone, the score event publishes to the Rookery community feed if (a) the player is signed in, (b) the player has cleared the Perch solo level, (c) the player has the `community-publish` permission on their account.

The Rookery uses a Perch-level mechanic at the game level — only paying subscribers can publish runs. Free-tier accounts can play, can see the leaderboard, can record their own best score; they cannot publish to the feed. Stripe handles the subscription tier through the same path as the rest of the site's Perch wiring.

Leaderboards at `/api/chrono-protocol/leaderboard` are visible to all signed-in subscribers; anonymous visitors see the top-10 with `displayName: anonymous`. Public until the bench decides otherwise.

---

## External dependencies — honest list

- **Stripe.** For the Perch publish path. Already wired for the rest of the site; the Chrono-Protocol score publish reads the same subscription tier.
- **`@react-three/xr`.** Not yet installed. Required for the Bezel-level WebXR pathway. Wave 4 installs it.
- **Firebase Firestore.** For save-slot persistence + leaderboards. Already wired for `/api/play/progress`; the Chrono-Protocol routes follow the same `FIREBASE_ADMIN_SERVICE_ACCOUNT` env pattern.
- **Gemini API.** For the LLM dialogue source. Already used by the prototype; the site call lands in Wave 6. Static bank covers the trigger surface until then.
- **Audio assets.** Per-construct voice synths (Wave 7). Music for each zone (TBD; the prototype's audio is stubbed). Sound effects for mode switching, enemy clears, boss phases.
- **No new package installs in v0.1.** Everything in this pass is already on the dependency list.

---

## Honest scope — what the v0.1 skeleton is and isn't

The v0.1 scaffolding is a week-one build. It is real work — every route exists, every data file is typed, the wheel + HUD + dialogue overlay + zone cards are real implementations, the canvas mounts, the typecheck passes. The visitor can click through the whole game's information architecture, switch modes on the wheel, watch dialogue lines cycle, click around the briefings, see the layout. That is a real thing.

It is not a playable game. Combat is not implemented. Enemy spawn is not implemented. The tunnel does not move. The poi controls do not capture input. The runner does not run. None of this is hidden — every page where stubbing is the truth says so.

The wave ladder beyond v0.1, with honest months:

| Wave | What | Month from v0.1 |
|------|------|-----------------|
| 1 | Site-side scaffolding (this pass) | 0 |
| 2 | Tunnel motion + rib recycling | 1 |
| 3 | Poi physics + dual-thumb input | 1.5 |
| 4 | Combat + enemy spawn + scoring | 2-3 |
| 5 | Splat backdrops + first SHARP zone overlap | 3-4 |
| 6 | LLM dialogue + audio synth | 4-5 |
| 7 | Three zones + bosses + leaderboard live | 5-6 |
| 8 | Braided modes + canal fast-travel + Rookery publish | 6-9 |

Three zones, boss fights, splat backdrops, leaderboard live, on the order of six months for one person working part-time on it. The Cubism precedent is the right reference — that game ran for years between alpha and finished, and the design discipline that built it is exactly the discipline this needs. Ship one thing real before adding the second. One zone fully playable before opening the next. One construct's voice synthesis correct before adding the next.

---

## Cross-references

- [`/articles/neo-london-chrono-protocol`](../components/articles/entries/neo-london-chrono-protocol.tsx) — the bridge article. The Aura-register exposition of what the game is.
- [`/articles/the-practice-in-eight-threads`](../components/articles/entries/the-practice-in-eight-threads.tsx) — the trunk practice article, naming the threads and the wheel as the city's playable form.
- [`lib/chrono-protocol.ts`](../lib/chrono-protocol.ts) — the canonical 5-mode wheel data (do not duplicate; extend via `lib/chrono-protocol/*` sub-files).
- [`/play`](../app/play/page.tsx) — the proving ground ladder; the surface the game graduates from.
- [`/play/neo-london`](../app/play/neo-london) — the splat library; the volumetric pass under the runner's wireframe.
- Prototype canon: `D:\The_Hangar\apps\prototypes\neo-london-chrono-protocol\` — the runner's actual code on disk.
- Voice canon: `C:\Users\dimon\.claude\projects\d--The-Hanger-Outer-Shell\memory\holoflow_voice_library.md` — register guidance for Aura on visitor copy and Dimona on bench notes (like this doc).
