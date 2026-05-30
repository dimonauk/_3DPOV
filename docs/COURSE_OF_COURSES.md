# A Course on Writing Courses

The studio writes courses for a living. This is the course on how
to do that. It's the recursive application of the formula:
[COURSE_FORMULA.md](./COURSE_FORMULA.md),
[LEARNING_PSYCHOLOGY.md](./LEARNING_PSYCHOLOGY.md),
[LEARNING_TOYS.md](./LEARNING_TOYS.md),
[COURSES_MEDIA_PLAN.md](./COURSES_MEDIA_PLAN.md),
[COMPETITION_AND_PRICING.md](./COMPETITION_AND_PRICING.md) — read in
the order below, with the exercises at the bottom of each lesson.

The course is for me, for any future collaborator the studio
brings in to help with courseware, and for the AI agents that
write tutorials against this spec. It's also itself a worked
example: a course that has applied its own rules to itself.
Check the rules against the structure as you read; that's part
of the lesson.

---

## The fifteen-second pitch

> Learn to build courses that readers actually finish — by
> applying the eighteen psychological levers of the light
> pattern, anchored by concrete deliverables, hydrated by
> interactive toys, priced honestly, and shipped with
> provenance. In eight lessons, you can write the studio's
> next ladder.

**Outcome.** You ship a complete five-rung ladder for the
studio.
**Audience.** Anyone writing course content for Holoflow,
including agents.
**Deliverable.** One ladder, with rungs, with media spec, with
toys catalogued, with price decided.
**Time budget.** A weekend if you're efficient; a fortnight if
you're learning.

---

## The five-move opening

Every Holoflow course opens with these five moves in order:

1. **Identity.** Who you'll be when you finish.
2. **Specificity gloss.** What specifically you'll have made.
3. **Context.** Why this work matters.
4. **Hook.** A concrete promise.
5. **Tone-set.** The register you'll keep.

The fifteen-second pitch above did all five in five sentences.
The exercise at the end of Lesson 1 is to do the same for a
ladder you choose.

---

## The lessons

### Lesson 1 — Why the studio writes courses

**Read.** [COURSE_FORMULA.md §1-5](./COURSE_FORMULA.md). The
fifteen-second pitch, the five-move opening, first-win-in-30,
outcome-first, visible artefact.

**The aha.** A successful course can be summarised in one
sentence: outcome, audience, deliverable, time-budget. Most
courses can't.

**Exercise.** Take the ladder you've been assigned. Write the
fifteen-second pitch. Write the five-move opening. Send it for
review before you write anything else. This is the spec
contract. If the pitch is weak, the course is weak; fix it
here, not after the rungs are written.

**Reflection prompt (no scrolling).** What is the difference
between "Learn microcontrollers" and "Build a POV LED rig that
photographs sharp"?

**Cliffhanger.** The pitch tells you what you're building. The
formula tells you HOW to build it so readers don't bounce. The
formula has eighteen levers — but only five-to-eight should
land in any one rung. Which five? That's Lesson 2.

---

### Lesson 2 — The eighteen levers and the light pattern

**Read.** [LEARNING_PSYCHOLOGY.md](./LEARNING_PSYCHOLOGY.md)
end to end. All eighteen levers. The dark-pattern anti-rules.

**The aha.** Every successful learning experience touches
between five and eight psychological levers. Most failing
courses touch one — usually the wrong one (streak guilt or
fake urgency). The studio's position is that the levers, used
in the LIGHT pattern, are the studio's most important craft.

**Exercise.** For each rung in your ladder, list the five-to-eight
levers it will touch, by name. Refer back to the
representative rung structure in
[LEARNING_PSYCHOLOGY.md §How the levers stack into a single rung](./LEARNING_PSYCHOLOGY.md#how-the-levers-stack-into-a-single-rung).
Be specific: not "we use the Zeigarnik effect" but "the rung
closes with the named question 'why does the WS2812 strip
sometimes work fine and sometimes produce nonsense?', answered
in the next rung."

**Reflection prompt.** What's the dark-pattern variant of the
Zeigarnik effect, and why does the studio refuse it?

**Cliffhanger.** The levers tell you HOW the rung will work
psychologically. But the rung needs concrete material: a thing
to make, a wiring diagram, a photograph, a code block. That's
the media spec. Lesson 3.

---

### Lesson 3 — The media hydration spec

**Read.** [COURSES_MEDIA_PLAN.md](./COURSES_MEDIA_PLAN.md). Pay
particular attention to §0 (cross-cutting media), the per-ladder
sections that mirror yours, and §9 (the print-farm SKU pipeline).

**The aha.** Every 3D model in every rung is also a purchasable
print-farm SKU. The course is the marketing; the model is the
product. The reader who finishes the course can buy the thing
they just learned to make. That's not an upsell; that's the
funnel completing itself.

**Exercise.** For each rung in your ladder, produce a media
manifest table (see existing tables in COURSES_MEDIA_PLAN.md
for the shape). List every photograph, diagram, animation,
video clip, and 3D model. Mark which already exist, which need
capturing, and which 3D models are also SKUs. Estimate the
total shoot-list as a half-day-of-work unit.

**Reflection prompt.** Why does the studio not write tutorials
that are pure prose, even when prose alone could communicate
the idea?

**Cliffhanger.** The media is half the rung. The other half is
the interactive toy — the thing the reader plays with in the
browser to feel the concept. Lesson 4.

---

### Lesson 4 — Toys, animations, and outside sources

**Read.** [LEARNING_TOYS.md](./LEARNING_TOYS.md). Identify which
existing toys at `/atelier/*` or `/visualiser/*` your ladder
should embed, and which new toys the ladder requires.

**The aha.** The studio's atelier and visualiser pages are
not decoration; they are the pedagogy. The rig simulator is
where the POV-rig discipline becomes physical knowledge before
the reader has touched a soldering iron. Every ladder needs at
least three toys at strategic moments.

**Exercise.** Build the toy queue for your ladder. Use the
table format in [LEARNING_TOYS.md §The build queue for new toys](./LEARNING_TOYS.md#the-build-queue-for-new-toys).
Rank by reader-value × cross-ladder reach. Estimate build
effort in days. For each toy, identify what other rungs in
other ladders it would also serve. Multi-purpose toys win.

For animations: list every CSS / SVG / Lottie / R3F animation
the rung needs. For outside sources: pick the canonical link
per concept. Refer to the outside-source canon table in
LEARNING_TOYS.md §The outside-source canon.

**Reflection prompt.** What's the difference between an
animated GIF and an interactive toy, and why does the studio
build toys?

**Cliffhanger.** You now have the pitch, the levers, the
media, and the toys. Next: writing the actual rungs in voice.
Lesson 5.

---

### Lesson 5 — Voice and structure

**Read.** The
[holoflow-voice skill](C:\Users\dimon\.claude\skills\holoflow-voice).
The Nine Seconds writeup at
`D:\The_Hangar\writeups\2026-05-12-nine-seconds-to-printable.md`.
The existing
[building-a-pov-led-rig.tsx](../components/tutorials/entries/building-a-pov-led-rig.tsx)
tutorial entry as the canonical workshop-register example.

**The aha.** The voice is not decoration; the voice IS the
trust. Every rung's credibility is anchored by the consistency
of register across the whole site. Workshop voice for technical
build pieces; Princess voice for narrative; never both in one
piece.

**Exercise.** Write the first rung of your ladder in workshop
voice. Five-move opening at the top, BOM if it's a build,
walkthrough body, what-next closing, signed off with the
characteristic deadpan pivot ("Now I'm going to print one.").
Run it through the holoflow-voice gut-check at the bottom of
the skill. If a never-list word appears anywhere, rewrite.

**Reflection prompt.** What's the difference between "Princess
voice" and "GLaDOS voice", and what does the studio do when a
draft strays toward the latter?

**Cliffhanger.** The voice is correct; the structure is
correct; the media is specified. Now: how do you make sure the
reader who finishes Rung 1 wants to start Rung 2? The pacing
question. Lesson 6.

---

### Lesson 6 — Pacing, cliffhangers, and the dopamine drops

**Read.** [LEARNING_PSYCHOLOGY.md §The dopamine drops, mapped](./LEARNING_PSYCHOLOGY.md#the-dopamine-drops-mapped)
and the rung-structure section.

**The aha.** The successful course is the one where the reader,
having closed the laptop on Rung 1, opens it on Rung 2 not from
guilt or notification, but from genuine want. Every rung is
engineered for two-to-four explicit dopamine drops, in a
deliberate cadence, with named cliffhangers that the next rung
answers.

**Exercise.** Map the dopamine drops for your ladder's first
three rungs. For each, name: where the drop lands, what the
reader's experience is at that moment, and what the cliffhanger
into the next rung is. Then check: does each cliffhanger get
answered in the next rung? Are there any drops in a row without
a flat stretch between them? Fix the pacing before writing
more.

**Reflection prompt.** Without scrolling: what's the difference
between a cliffhanger followed by a paywall (dark) and a
cliffhanger followed by the next free rung (light)?

**Cliffhanger.** Rungs are written, pacing is mapped, toys are
catalogued, media is specified. The ladder is ready to ship.
But: at what price? Lesson 7.

---

### Lesson 7 — Pricing the ladder

**Read.** [COMPETITION_AND_PRICING.md](./COMPETITION_AND_PRICING.md)
sections 1 (pricing structure), the per-ladder section that
matches yours, and section 6 (honest summary).

**The aha.** Pricing is positioning. The studio prices at the
upper end of practitioner-led specialist courses, below the
gold-standard single-tool offerings. Below that floor and the
practice is sold for nothing; above the ceiling and the
audience is shut out. The compromise sits at £49-£79 standalone,
£149/year for the Studio Pass, £499/quarter for Bench Access.

**Exercise.** For your ladder, write a one-page pricing
rationale: the direct competitors (use the per-ladder section
in COMPETITION_AND_PRICING.md as a template), the studio's
edge over each, and the recommended price. Justify any
deviation from the £49 / £79 / £29 standard tiers.

**Reflection prompt.** Why does the studio not compete with
Udemy at £15?

**Cliffhanger.** The ladder is written, hydrated, toy-equipped,
and priced. Last step: shipping it. Lesson 8.

---

### Lesson 8 — The ship checklist

**Read.** [COURSE_FORMULA.md §The honest summary for people who skimmed](./COURSE_FORMULA.md#the-honest-summary-for-people-who-skimmed),
and [LEARNING_PSYCHOLOGY.md §How to test whether a rung is doing it right](./LEARNING_PSYCHOLOGY.md#how-to-test-whether-a-rung-is-doing-it-right).

**The aha.** Shipping a course is a checklist, not a vibe. The
studio holds itself to a single ship checklist for every rung;
when any box is unticked, the rung is incomplete.

**Exercise.** Run the ship checklist against every rung in your
ladder:

- [ ] Fifteen-second pitch is the rung's intro.
- [ ] Five-move opening lands in the first six lines.
- [ ] First-win-in-30-minutes promise is honest.
- [ ] Five-to-eight levers are engaged.
- [ ] No dark-pattern technique anywhere.
- [ ] Two-to-four dopamine drops, paced with flat stretches.
- [ ] Specific cliffhanger; answered in the next rung.
- [ ] One implementation-intention prompt at the end.
- [ ] One reflection prompt requiring retrieval.
- [ ] Identity statement at end of ladder is honestly earned.
- [ ] Workshop voice held; no register slippage; no never-list
      words.
- [ ] Every claim anchored by a concrete number.
- [ ] Media manifest is complete or honestly marked "needs
      shooting."
- [ ] Toys catalogued; existing ones embedded inline.
- [ ] Outside-source canon links land at the right concept.
- [ ] Price is decided and justified.
- [ ] 3D models flagged as bureau SKUs where applicable.
- [ ] Provenance sidecar shape decided for any objects
      shipped.

If any box is unticked, the rung is incomplete. Ship when all
ticked.

**Reflection prompt.** Why is the ship checklist the same for
every rung in every ladder?

**Cliffhanger.** There isn't one. You've finished the course.

---

## Capstone

You now have:
- A ladder with five-to-seven rungs.
- Each rung with a fifteen-second pitch and five-move opening.
- Each rung with five-to-eight named levers, no dark patterns.
- A media manifest covering photographs, diagrams, animations,
  videos, and 3D models.
- A toy catalogue including which existing toys to embed and
  which new ones to build.
- The full set of outside-source canon links.
- The rungs themselves, written in workshop voice, passing the
  gut-check.
- A pricing rationale with named competitors and the studio's
  edge.
- The ship checklist run for every rung.

**Identity statement.** You are the kind of writer who builds
courses readers finish.

That is the receipt. Take it.

---

## Postscript — what this course did to itself

Notice:
- The course has a fifteen-second pitch.
- The course has a five-move opening (above the lessons).
- The course has eight lessons, each with a worked example,
  an aha, an exercise, a reflection prompt, and a cliffhanger.
- The course has visible artefacts at each step (the rung
  drafts you produce).
- The course closes with an identity statement.
- The course doesn't paywall any of its content.

That's the formula applied to itself. The recursion was the
point. If a course about writing courses doesn't follow its
own rules, it has nothing to teach.

Now I'm going to write the photography ladder.
