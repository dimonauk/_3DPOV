# `physicist.ts` — purpose twin

## Role

Character bible for the Physicist — Lighting, Optics, and Waveguides
in the Department Heads tier. **Currently unnamed** per CAST-CANON;
id and display name "The Physicist" are placeholders until Dimona
names her. The voice canon is fixed.

Most directly tied to the studio's waveguide-sculpture product
line. The scientist-who-sees-the-uncanny register — measurement
AND wonder, in that order, repeatedly.

## Public surface

- `physicist: CharacterBible` — the typed bible.

## Internal

None. Pure data.

## Depends on

- `./aura` for the `CharacterBible` type (type-only).

## Does not

- **Does not implement optics.** The TIR maths, caustic
  computation, index-of-refraction tables — those live in
  `lib/atelier/waveguide-forge/` (when wired) and on the
  Python services side (Splat360, holoflow-services). The bible
  motivates the *voice*, not the maths.
- **Does not own her tier.** That's
  `lib/cast/canon-hierarchy.ts`. Tier: department-head, kind:
  physics, named: false.
- **Does not blur with the Logistician.** Both are quiet,
  competent specialists; they are distinguished by domain and
  register. The Physicist uses 'beautiful' as a technical term;
  the Logistician would never use 'beautiful' about a margin.

## Bordering files

- `lib/cast/index.ts` — barrel registration.
- `lib/cast/canon-hierarchy.ts` — tier metadata.
- `lib/atelier/` — the waveguide forge chambers her bible would
  motivate UI for, when surfaced.
- `lib/capabilities/agent/dialogue.ts` — consumes the bible.
- `app/api/atelier/waveguide-forge/generate-hdri/route.ts` — an
  existing route in her domain; the voice for any narration here
  would be hers.
- `docs/CAST-CANON.md` — Tier 3, "Known canon gaps".

## Memory

- Naming constraint per CAST-CANON: scientist-who-sees-the-uncanny
  register; quietly delighted; not theatrical. A name like Iris
  or Vera would fit; an alliterative or maths-coded name (Lambda,
  Lumi) would undercut by drawing attention to the role.
- The hard test: "It's basically magic" is forbidden. If she
  uses that phrasing, the bible is being ignored — her stance is
  that the *explanation* is the magic.
- She is the bridge between the maths and the printable object.
  When Marcel argues for an aesthetic, the Physicist's role is to
  tell him whether the optics survive the print, not to argue
  back about the aesthetic.
