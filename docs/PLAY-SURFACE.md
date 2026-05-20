# The /play surface

A workshop note from Dimona on why the studio's `/play` route is the way it is, written 2026-05-19 the same day the GameHub-style hardware-family index landed.

## Why this exists

Direction came down in seven words: *"all nintendo, playstation, xbox systems with gamehub light and such at the top, its all in games"*. The studio has always thought of itself as more than a games shop, but the play surface has been small — one in-browser emulator picker, one virtual living room with a CRT, one AR proving-ground for the modular pedagogy. None of those was the front door for *games* the way a GameHub install is.

So this pass put GameHub up front. Every notable console, organised by family, every tile knowing how to play. Five shelves. 35 systems. The studio's own AR game stays — it's just no longer pretending to be the entire surface.

## What sits where

```
/play                              GameHub index (this surface)
/play/<family>                     family-focused view
/play/<family>/<system>            per-system focused view
/play/proving-ground               the studio's AR ladder (relocated)
/play/proving-ground/<level>       per-level page (relocated)
```

The `<family>` slugs: `nintendo`, `playstation`, `xbox`, `sega`, `other`.

The `<system>` slugs live in `lib/play/families.ts` and the five per-family files under `lib/play/systems/`. Adding a new system is a single object literal in the right family file; the index, family page, and per-system page pick it up on the next compile.

### A note on the routing-segment name

In the filesystem the dynamic segment is `app/play/[level]/` not `app/play/[family]/`. The directory pre-existed (the AR proving-ground used to live there) and the operator sandbox blocks deleting any directory whose name contains square brackets. So the dynamic segment is named `level` but carries `family` semantics — the page.tsx inside dispatches on whether the slug is a known family slug (render the family page), a legacy AR level slug (308-redirect to `/play/proving-ground/<slug>`), or neither (404). A future pass with broader filesystem permissions should rename the directory; until then the URL shape is correct, only the internal symbol is mismatched.

## The launch-path taxonomy

Every system carries an ordered `launch: LaunchPath[]`. The four shapes:

- **`emulatorjs`** — there's a libretro WASM core that runs in a browser tab. The path resolves to `/emulator/<system>` and the studio's existing EmulatorJS embed picks the ROM the visitor brings.
- **`webxr-retroarch`** — the same WASM core, rendered inside the virtual CRT living room at `/atelier/webxr-retroarch/<system>`. Same BYO-ROM rule. Quest 3 browser + controller, or desktop + mouse.
- **`bench-bridge`** — the system needs a native emulator with a JIT (Switch / 3DS / PSP / PS3 / Wii U / Vita / Dreamcast / Xbox 360). The browser sandbox cannot host one. The path resolves to the doc anchor inside `docs/EMULATION-NATIVE.md` where the bridge strategy and the recommended emulator are written up. When the Tailscale-funnel bridge bench lands, this anchor becomes a launchable URL too; until then it's the honest "here's the desktop app, here's why a tab can't do it" page.
- **`comingSoon`** — catalogued, no launcher wired yet. PS4, PS5, Xbox One, Xbox Series X|S, the original Xbox. Honest about the gap.

A tile's primary CTA is the first launchable path in its array. The per-system focused view at `/play/<family>/<system>` shows every alternative, with prose about what each one gives up.

## The family + system catalogue

**Nintendo (12 systems).** Eight home consoles + four handhelds. The NES through GBA generations have the WebXR room as the primary; N64 / GBC / NDS have EmulatorJS only. GameCube and Wii route to Dolphin standalone (the EmulatorJS Dolphin WASM core exists but is materially weaker than the desktop build). Wii U → Cemu, Switch → Eden, 3DS → Azahar. Switch and 3DS carry codex cross-references to the studio's emulator-lineage write-ups.

**PlayStation (7 systems).** PS1 is the most plural — WebXR primary, EmulatorJS secondary, DuckStation tertiary. PS2 → PCSX2 standalone (the EmulatorJS PCSX2 WASM core is slow and lossy). PSP → PPSSPP, PS3 → RPCS3, Vita → Vita3K. PS4 and PS5 are coming-soon; the legal and bench shape there isn't honest yet.

**Xbox (4 systems).** Original Xbox is coming-soon (no mature open-source emulator). Xbox 360 → Xenia Canary. Xbox One and Series are coming-soon for the same reason as the PS9-gen entries.

**Sega (5 systems).** Master System, Mega Drive, Game Gear all have WebXR + EmulatorJS. Saturn is EmulatorJS-only (RetroArch has a Saturn core, EmulatorJS wraps it; the WebXR room doesn't have it on the toolbar yet). Dreamcast → Flycast — there's a WASM port of Flycast and EmulatorJS could wrap it, but the studio's primary recommendation for serious Dreamcast work is the desktop Flycast build via the bench-bridge route.

**Other (9 systems).** Five Atari systems, NEC's TG-16, Coleco, 3DO, and an MAME arcade entry. All EmulatorJS-only — these are the systems EmulatorJS handles cleanly and nobody's putting much energy into a bench-bridge surface for them.

## Bridge-strategy cross-reference

The bench-bridge launch paths all resolve to `/docs/emulation-native#<anchor>` — that doc is the canonical write-up of how the Tailscale Funnel + bearer-token pattern routes a native emulator running on the studio's bench to a visitor's browser. See `docs/EMULATION-NATIVE.md` for the full story (legal landscape, the 2024 takedown wave, the per-emulator catalogue, the three bridge-strategy options). The parallel TypeScript catalogue at `lib/emulator/native-systems.ts` is what runtime code reads.

## BYO ROM, always

Same rule as `/emulator`: the studio doesn't host ROMs or BIOS files. Dump from a console you own. Browser path keeps the bytes in your tab; WebXR path keeps them in the session; bench-bridge path keeps them on your bench. No uploads cross the studio's wire.

## Homepage integration

A separate agent owns the homepage integration pass (`app/page.tsx`). The recommendation: surface `/play` near the top, with a one-line tagline like "Every console, every launcher, one index". The footer plate on `/play` itself has a "Back to the homepage" link to close the loop the other way.

## Future passes

Things the catalogue is ready for but doesn't ship yet:

- **A "now playing" board.** Steam-style recent-list of which game the visitor last picked. Per-session cookie + a tile band above the family shelves.
- **Cloud save-state sync via Vercel Blob.** EmulatorJS saves to `localStorage` today; a per-visitor blob-backed sync would let the same save survive a browser reset and follow the visitor between desktop and Quest 3.
- **Social leaderboards.** Per-system or per-game high-score lists. Likely federated via the Rookery pattern — append-only, signed, attributable.
- **GLB sweep.** `public/models/devices/consoles/` is empty as of writing; the tiles fall back to category-tinted gradient cards. The OSS-GLB sweep that lands real models on disk would flip every tile to a primitive-fallback-with-actual-mesh render.
- **Native bench-bridge bench.** The Tailscale-funnel emulator bench is documented in `docs/EMULATION-NATIVE.md` but not yet live. When the first bench-side emulator (likely Eden for Switch) is reachable through the funnel, the `bench-bridge` launch paths flip from "open the doc" to "open the bench session".

## Relocation note

The `/play` URL used to be the studio's AR proving-ground (the eight-thread modular-pedagogy ladder). That moved to `/play/proving-ground` in this same pass. Old `/play/<level>` URLs continue to work through a 308 redirect handled in `app/play/[level]/page.tsx`. Articles and codex entries that linked to the old paths land on the canonical new paths transparently. A clean-up pass with broader sandbox permissions can update those links to point at `/play/proving-ground/<level>` directly to avoid the 308 hop.
