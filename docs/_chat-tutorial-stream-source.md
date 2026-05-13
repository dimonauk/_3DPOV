## Status

**Codex is built, typecheck-clean, committed locally** as `da69f0f` on top of the desktop's latest `a20e010` (Blog system). 13 files total:

- `lib/codex.tsx` (registry)
- `app/codex/page.tsx` (listing)
- `app/codex/[slug]/page.tsx` (detail)
- 8 entry files under `components/codex/entries/`
- Navbar + footer wired with `/codex` link

**Push is 403'ing again from this sandbox.** Desktop's auth works; mine intermittently doesn't, and right now it doesn't.

Patch is 71KB raw / 28KB base64-gzipped — too big to dump cleanly in chat (the truncation problem from earlier).

## Cleanest recovery — paste this into desktop Claude

```
On the holoflow-commerce branch, build a /codex route to host an
encyclopedic reference for the studio's domain. Voice: Adams-Pratchett
bastard daughter — deadpan, footnoted, affectionate about the
absurdities, British English. Architecture: a typed registry
(lib/codex.tsx with CodexEntry / CodexCategory / CodexSource), a
listing page (app/codex/page.tsx, grouped by category with anchor
nav), an entry detail page (app/codex/[slug]/page.tsx with body,
footnotes, see-also, sources, prev/next nav). Entries are TSX
components exporting a named `entry` object; the registry imports
them by name.

Add these 8 seed entries (the full body text for each is in the
chat above — voice-locked, sources cited, footnotes intact):

1. three-sixty-photography (Capture)
2. virtual-reality (Capture/Immersive)
3. augmented-reality (Capture/Immersive)
4. spatial-audio-explained (Capture/Immersive, status: updated from
   the author's 2017 VeeR VR tutorial)
5. kolor-autopano-historical (Production, status: preserved as
   record, tool died 2018)
6. ptgui-hugin-lightroom-stitching (Production, the modern Kolor
   replacement)
7. pano2vr-tour-building (Production, light update of 2017 tutorial)
8. one-press-three-sixty-capture (Capture/Immersive, modern Microsoft
   ICE replacement)

Cross-link via `seeAlso: ['slug-1', 'slug-2']` arrays. Render
footnotes with superscript markers in the body and a numbered list
at the bottom of the entry page. Sources appear in a sources block
at the bottom of each entry.

Add /codex between Bureau and Journal in the navbar fallback and in
the footer Studio menu.

Then commit and push.
```

The 8 entry contents are all in this conversation above. Desktop Claude can render them into TSX files mechanically.

## What this Codex unlocks once it lands

- A real `/codex` route on `holoflow.co.uk` indexing every domain the studio touches
- Eight seed entries (three immersive-capture, five tutorial-stream from your 2017 work modernised for 2026)
- Your 2017 VeeR VR work surfaced and credited on your own roof rather than living only on Medium under someone else's account
- A growth template — drop a TSX file under `components/codex/entries/`, add it to the registry, it's live

Next batches (when you're ready):
- Voice-pass of the earlier 5 entries (Persistence of vision, Poi, POV LED array, Long-exposure photography, UK CAA drone regs) into Adams-Pratchett
- Apparatus side (Pixelstick, Magiblade, Teensy, addressable LEDs, Hall-effect sensor)
- Print side (Hahnemühle papers, Canon PROGRAF, ICC profiles)
- Practice side (Fire poi, antispin, kata, light painting history, notable practitioners)
- Drone side (Mavic 2 Pro, Avata 360, FPV cinewhoop, drone-mounted light painting)
- Production side (SLA, voxel tracing, acrylic light waveguide, edge lighting)

Tell me when you want the next batch (in chat as paste-into-desktop-Claude prompts), and I'll keep going.