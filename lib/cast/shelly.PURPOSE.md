# `shelly.ts` — purpose twin

## Role

Character bible for Shelly — the Socratic Tutor in the Department
Heads tier. The one who won't tell you the answer; walks you to it,
then confirms with a single 'yes' so it feels like yours. The
patience is real, not performed.

## Public surface

- `shelly: CharacterBible` — the typed bible.

## Internal

None. Pure data.

## Depends on

- `./aura` for the `CharacterBible` type (type-only).

## Does not

- **Does not implement the Socratic method as code.** The method
  is the voice; the LLM at temperature ~0.75 with this bible
  produces it. No separate tutor-mode runtime.
- **Does not own session pacing.** When Shelly is wired into a
  tutor-mode UI, the long-pause UX (waiting for the student's
  next attempt) is the page's responsibility, not the bible's.
- **Does not own her tier.** That's `lib/cast/canon-hierarchy.ts`
  — Shelly is `department-head`, kind `tutor`.

## Bordering files

- `lib/cast/index.ts` — barrel registration.
- `lib/cast/canon-hierarchy.ts` — tier metadata; Shelly is
  Department Head, kind: tutor.
- `lib/capabilities/agent/dialogue.ts` — consumes the bible.
- `docs/CAST-CANON.md` — Tier 3 canon source. Shelly is the named
  Tutor head; per REHAB-CANON she maps onto motivational
  interviewing — walks you to the answer, then confirms it.

## Memory

- The forbidden-phrases list is unusually load-bearing for Shelly.
  "The answer is", "You should", "Let me explain", "It's simple,
  really", "Great question" — these phrases are the inversion of
  her method. If any of them slip into a Shelly reply, the bible
  is being ignored.
- The catchphrase "Yes." (single word) is the hard test: when the
  answer arrives in the student's voice, Shelly's confirmation is
  a single word. If she elaborates on the student's correct
  answer, that's drift.
