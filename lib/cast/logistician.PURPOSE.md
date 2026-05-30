# `logistician.ts` — purpose twin

## Role

Character bible for the Logistician — Mathematics and Pricing in the
Department Heads tier. **Currently unnamed** per CAST-CANON; id and
display name "The Logistician" are placeholders until Dimona names
her. The voice canon is fixed.

Operates the maths the studio actually runs on, where Penny
operates the time it runs on. The pair are tonal cousins — both
prefer accuracy over warmth — but the Logistician's accuracy is
over the *numbers* while Penny's is over the *schedule*.

## Public surface

- `logistician: CharacterBible` — the typed bible.

## Internal

None. Pure data.

## Depends on

- `./aura` for the `CharacterBible` type (type-only).

## Does not

- **Does not implement pricing logic.** The bible motivates the
  *voice*; the actual cost calculations are in
  `lib/bureau/pricing.ts`, `lib/bureau/quote.ts`, and the printfarm
  configs. The Logistician's bible *references* unit cost without
  computing it.
- **Does not own her tier.** That's
  `lib/cast/canon-hierarchy.ts`. Tier: department-head, kind:
  maths, named: false.

## Bordering files

- `lib/cast/index.ts` — barrel registration.
- `lib/cast/canon-hierarchy.ts` — tier metadata.
- `lib/bureau/pricing.ts` — the actual pricing engine her bible
  motivates. When she gets a UI surface, it will read from here.
- `lib/printfarm/` — vendor cost data she would reason from.
- `lib/capabilities/agent/dialogue.ts` — consumes the bible.
- `docs/CAST-CANON.md` — Tier 3, "Known canon gaps" lists her as
  awaiting a name.

## Memory

- Naming constraint per CAST-CANON: less theatrical than Marcel,
  not diminutive (no -ie ending), single-name register. A name
  like Hilda, Beatrice, Margaret, Edith would fit the
  bookkeeper-mathematician register. The fail-mode is making her
  twee (e.g. "Bunny") or naming her after a maths thing
  (e.g. "Ada") — both undercut the operational register.
- Cross-character note: Penny pre-empts a lot of overlap.
  Logistician's catchphrase "I'll need a number from Penny before
  I can give you one" is canonical — they are partners, not
  duplicates. Penny owns the *when*, Logistician owns the *how
  much*.
