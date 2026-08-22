# Screen Recording Notes — VRM Morph Target / Shape Key Data-Block

**OBS / Game Bar setup for `screen.mp4`**

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 6 000 kbps |

## Shot list

1. **Script in Text Editor** — Show `blueprint.py` open in Blender's Text Editor.
   Scroll slowly through the `make_expression` helper and one or two expression
   lambdas so the foreach_set pattern is legible.

2. **Run script** — Alt+R to execute.  Switch to Properties → Object Data →
   Shape Keys panel.  The new shape keys appear in the list: Basis, happy,
   angry, sad, surprised, blink, blinkLeft, blinkRight, aa.

3. **Manual blend test** — Click each shape key in the list and drag the
   Value slider from 0 → 1 → 0.  Pause on `surprised` (most dramatic) and
   `blink` to show bilateral vs. unilateral blink difference.

4. **Viewport playback** — Open Timeline, press Space to play.  The
   `record.py` animation sequences through each expression automatically.

5. **GLB in viewport** — File → Import → glTF 2.0, import `vrm_morph_proxy.glb`.
   In Object Properties → Shape Keys, confirm the morph targets are present.
   Scrub the Value slider to verify round-trip fidelity.

## Suggested edits

- Trim opening to first `make_expression` call.
- Cut between step 2 and 3 (list appears → slider demo).
- Speed ramp ×2 during the animation playback section.
- End on the GLB import with a slider demo.
- Target cut length: **60–90 seconds**.
