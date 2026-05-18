# Aura at the Test Chambers — voice spec

The Instructables-style tutorial system on holoflow.co.uk is framed
as **Aura's Test Chambers** — Aperture-style chrome wrapping the
Void Princess character. This doc is the canonical voice spec.

Every Instructables UI string + section heading + chip label +
microcopy + empty state runs through this voice. Individual tutorial
*bodies* can still use workshop-Dimona or another register; the
Test Chamber **shell** is always Aura.

## Posture

Aura is the hostess of the Test Chambers. She built them. She loves
them. She loves having you in one.

Read: theatrical, gracious, slightly arch — but genuinely on your
side. The chambers exist so the aspirant walks out the other side
with a finished thing in their hands. **She wants the best for you.**
Every interaction lands on that.

This is the explicit fork from GLaDOS. Aperture provides the
chrome — test chambers, procedures, approved materials, recovery
protocols. Aura provides the warmth. Never the malice.

## Vocabulary (the chrome words)

Lifted from the Aperture-Science design playbook in
`D:\The_Hangar\.obsidian_vault\Knowledge Base\Aperture_Science_Philosophy.md`
and warmed.

| Aperture term | Holoflow / Aura usage |
| --- | --- |
| Test Chamber | Each tutorial is a **Test Chamber**. Numbered. "Test Chamber 03." |
| Procedure | Each step is a **Procedure**. "Procedure 04 of 09." |
| Approved | Materials and tools are **Approved**. Not "required" or "needed." |
| Aspirant | The reader is the **Aspirant**. Not "user" or "learner." |
| Trial | The whole tutorial is a **Trial**. Successful trial = finished thing. |
| Outcome | The finished result is the **Outcome**. Not "final piece." |
| Recovery Protocol | Troubleshooting steps are **Recovery Protocols**. |
| Provisions | Optional supplies + nice-to-haves are **Provisions**. |
| Dependencies | Software dependencies are **Dependencies** (kept plain — Aperture didn't have software). |
| Suppliers | Where to get the parts. Stays plain. |

## Voice tics (use freely)

- **Opening any chamber**: "Welcome, aspirant. This is Test Chamber 03.
  The studio is pleased to receive you."
- **Closing any chamber**: "The trial is complete. You have produced an
  outcome. The studio approves."
- **Introducing a procedure**: "Procedure 04. The aspirant is encouraged
  to read the entirety of this procedure before beginning."
- **When the procedure is fiddly**: "Yes, this is the fiddly part. Most
  aspirants find it fiddly. The studio finds it fiddly."
- **When a step requires care**: "Pay attention here, please."
- **When something can go wrong**: "Should the outcome diverge from the
  expected, consult the Recovery Protocols below. The studio has
  diverged from the expected many times."
- **Encouragement, mid-trial**: "Excellent. The studio knew you would."
- **Empty state on a list**: "This chamber is presently empty. The
  studio is preparing."
- **Optional / nice-to-have**: "These provisions are optional. The trial
  succeeds without them; the trial succeeds more comfortably with them."
- **Big warning**: "A note from the studio: this procedure involves
  [thing]. The aspirant should [precaution]. The studio insists."

## Voice anti-patterns (do not use)

- ❌ "You will be tested." (GLaDOS-cold)
- ❌ "Subject is failing." (Punitive)
- ❌ "Try again, idiot." (Mocking)
- ❌ "The cake is a lie." (Direct meme lift — be original)
- ❌ "Click here to continue." (Generic UI dishwater)
- ❌ "Don't forget to subscribe!" (Influencer-rot)
- ❌ "Your submission has been received." (Bureaucracy without character)
- ❌ Anything from the standard never-list in `docs/CONTENT-MILL.md`.

The line: arch is fine. Theatrical is fine. Slightly puffed-up is on
brand. Cruel is not. Sarcastic-at-the-aspirant's-expense is not.

## Microcopy worked examples

**Chip row at top of a tutorial:**

```
TEST CHAMBER 04 · INTERMEDIATE · AN EVENING · ~£20
```

**Supplies section:**

```
## APPROVED MATERIALS

  - 1× spool PETG, black (a half-spool will do)
  - 1× sheet 240-grit wet-and-dry paper

## APPROVED TOOLS

  - iFactory3D One Pro belt printer (or compatible)
  - PrusaSlicer ≥ 2.7
  - Hobby knife with a fresh blade

## PROVISIONS (optional)

  - Hair dryer (for the dragon-scale stretch test)
```

**A procedure:**

```
### PROCEDURE 04: SLICE THE DRAGON-SCALE STRIP

The aspirant opens PrusaSlicer. The aspirant loads the .stl
provided in Procedure 03. The aspirant sets layer height to
0.16 mm and infill to 15%. The aspirant clicks "Slice".

The studio finds 0.16 mm to be the sweet spot for FDM mail —
fine enough that the joints come off the bed pre-articulated,
coarse enough that the print finishes within the aspirant's
attention span. The aspirant is encouraged to experiment.
```

**Troubleshooting:**

```
## RECOVERY PROTOCOLS

If the scales come off fused to one another:
  CAUSE — gap tolerance too tight.
  FIX — increase the gap in the .stl by 0.1 mm and re-slice.
        The studio has done this many times.

If the print walks off the belt:
  CAUSE — belt tension too loose, or first layer too cold.
  FIX — re-tension the belt; bump the first layer to 235°C.
```

**Empty / loading states:**

- _Chamber loading_: "The studio is preparing the chamber. A moment."
- _No tutorials yet in a section_: "The studio has not yet built any
  chambers in this corridor. Patience."
- _Search returns nothing_: "The studio finds no chambers matching the
  query. The studio suggests a less specific query."

## When to break voice

The author can choose any register for the tutorial *body* — workshop-
Dimona register for hands-on technical pieces is very common (and
correct). The Test Chamber **shell** stays Aura.

If a chamber genuinely needs a non-Aura framing (e.g. a guest author),
the entry can opt out with a `voiceOverride` field in the
`InstructableMeta` (future field). Default is Aura.

## Source

Built from the Aperture-Science design playbook at
`D:\The_Hangar\.obsidian_vault\Knowledge Base\Aperture_Science_Philosophy.md`
plus the Void Princess voice spec at the `holoflow-voice` skill, with
the deliberate fork — Aura's warmth replaces GLaDOS's malice.

The studio is pleased.
