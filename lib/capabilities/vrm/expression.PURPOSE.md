# `expression.ts` — purpose twin (capability `vrm.expressions.blend`)

## Role

The blend layer for VRM facial expressions. Reads the active
viseme from `audio.visemes` and Aura's mood from `aura.mood`, and
writes a merged expression-weight map to `vrm.expressions`. The
brick that gives Aura a *moving mouth* while she speaks and a
*reactive face* while she feels.

Owns only the **mouth slots** (`aa`, `ee`, `ih`, `oh`, `ou`) and
the **face emotion slots** (`happy`, `surprised`, `angry`,
`relaxed`, `sad`). Preserves other keys it doesn't recognise
(notably `blink`, which `motion.idle` owns) by merging rather
than replacing.

## Public surface

- `startBlend(id)` — kick off the rAF loop. Idempotent.
- `stopBlend(id)` — cancel + zero only the mouth + face slots,
  leaving blink and friends alone.
- `isBlendRunning(id)` — predicate.
- `setFaceWeight(id, key, weight)` — explicit override for
  cutscene-style face poses.

## Internal

- `loops: Map<VRMHandleId, LoopHandle>` — module-scope state for
  active blend loops.
- `MOUTH_KEYS` / `FACE_KEYS` — typed arrays of the slot names this
  capability owns. Used both for slot iteration and to know what
  to zero on stop.
- `mouthForViseme(name)` — viseme-name → partial mouth weights.
  Maps AA / E / I / O / U vowels directly; F lands as a partial
  `ih`; M and REST collapse to all-zero (mouth closed).
- `faceForMood(mood)` — `AuraMood` → partial face weights. Coarse:
  delighted/playful → happy, alert → surprised, agitated → angry,
  focused/tender → relaxed.
- `buildWeights(current, visemeName, mood)` — merges current
  expression weights with the new mouth + face slots. Slots the
  capability owns are set explicitly to 0 when not active; other
  keys pass through unchanged.

## Depends on

- `lib/state/vrm` — writes `expressions`. Reads `expressions` to
  preserve other keys on merge.
- `lib/state/audio` — reads `visemes` for the active mouth shape.
- `lib/state/aura` — reads `mood` for the face emotion.
- Browser globals: `requestAnimationFrame`, `cancelAnimationFrame`.

## Does not

- **Does not generate visemes.** That's `audio.visemes`. This
  brick only consumes them.
- **Does not own `blink`.** Blink belongs to `motion.idle`, which
  toggles it during natural idle. The merge here preserves
  whatever `blink` value is in the slice.
- **Does not own the dialogue intent → mood mapping.** That's
  `agent.dialogue`'s job; the mood lands in `aura.mood` and this
  capability mirrors it onto the face.
- **Does not animate transitions between expressions.** Each frame
  is a fresh weight value. The VRM expression manager
  internally smooths via its own interpolation; this capability
  trusts that.
- **Does not handle multiple speakers.** One blend loop per VRM
  handle; called with different ids for the cast members.

## Plug surface

- **State plugs (write):** `vrm.expressions`.
- **State plugs (read):** `audio.visemes`, `aura.mood`,
  `vrm.expressions` (for merge).
- **Type plugs:** input `VRMHandleId`; no return.
- **Dependency plugs:** `vrm.load`, `audio.visemes`. Both
  declared in the registry as `dependsOn`.

## Bordering files

- `lib/state/vrm.ts` — slice it writes to.
- `lib/state/audio.ts` — viseme source.
- `lib/state/aura.ts` — mood source.
- `lib/capabilities/audio/visemes.ts` — generates what this
  reads.
- `lib/capabilities/motion/idle.ts` — owns the `blink` slot;
  this capability preserves rather than overwrites.
- `components/three/VRMAvatar.tsx` — applies the merged weights
  via the VRM expression manager every frame.

## How Aura's character flows through this file

The character is in the mapping tables, not the loop:

- `playful` mood → `happy: 0.4`. Not a grin — a *brat smirk*.
- `delighted` mood → `happy: 0.6`. Wider, but still in character.
- `alert` mood → `surprised: 0.4`. Eyebrows lift; mouth ready.
- `agitated` mood → `angry: 0.3`. The brat-edge.
- `tender` mood → `relaxed: 0.5`. The hostess actually listening.

The mapping is data — re-tune without changing callers.
