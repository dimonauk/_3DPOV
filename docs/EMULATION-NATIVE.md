# Native Emulators (the layer beyond EmulatorJS)

The studio's `/emulator` surface runs EmulatorJS — RetroArch cores compiled to WebAssembly. That ceiling is, in practice, the PS2 era. For the systems beyond — Switch, 3DS, PSP, PS3, Wii U, Vita, Xbox 360 — the working emulator is a native desktop app with a JIT. This doc catalogues the projects the studio is tracking in that layer, with the honest legal and bridging story.

Direction from Dimona, 2026-05-19: *"look at eden and fold it in, then do the same for other opensource emulation code, look for citra"*.

The catalogue itself lives in TypeScript at `lib/emulator/native-systems.ts` — that file is what runtime code reads. This doc is the prose around it: why each project is there, the legal landscape, and the bridge strategy for getting any of them into a browser tab.

## Why this exists

EmulatorJS is great inside its envelope. NES through PS1 runs at native speed in a tab on a 2018 laptop; PS2 and N64 run with caveats. The hardware that came after — the Switch's 256-core Tegra GPU, the 3DS's stereo-3D dual screens, the PSP's bespoke MIPS allegro core, the PS3's heterogeneous SPE/PPE Cell — won't fit through WASM with anything like usable performance in 2026. They want a JIT compiling guest code directly into x86-64 or AArch64 host instructions, which the browser sandbox does not allow.

Three reasons the studio cares anyway:

1. **Preservation.** The commercial path through these consoles is patchy. Nintendo offers a Switch Online subscription that streams a curated NES/SNES/N64/GBA library; the Wii U Virtual Console is dead, the 3DS eShop shut down 27 March 2023, the PSP store closed 2 July 2021. Anything not in the curated streaming bundle reverts to either a used cartridge / disc on the second-hand market, or an emulator running a dump the buyer makes themselves.

2. **Research.** The studio's interest in old-game visual systems doesn't stop at PS2. The 3DS's stereo-3D rendering is the closest the consumer market has come to wide-deployment autostereoscopic display; the PSP's UMD-era aliased rasteriser invented a whole visual idiom; Cemu unlocks the Wii U's texture-streamed open-world look. None of these are reachable through EmulatorJS at present.

3. **Playable canon for the catalogue.** The /emulator surface is small-canon-playable-in-a-tab. Extending that to the post-PS2 systems is the obvious next pass — through a bench-bridge route, since browser WASM is not the answer.

## The legal landscape

Emulators themselves are legal in the UK and the US. The precedent in the US is *Sony Computer Entertainment, Inc. v. Connectix Corp.* (9th Circuit, 2000) and *Sony Computer Entertainment America, Inc. v. Bleem, LLC* (9th Circuit, 2000) — both held that clean-room reverse-engineering and emulation of a console for the purpose of running its software constitutes fair use. UK case law has not addressed it directly; UK practice follows the same logic via the Computer Programs Directive and CDPA s.50B's reverse-engineering exception.

What is not legal:

- **Distributing BIOS files.** The console BIOS is copyrighted firmware. Dumping it from your own console for your own use is the studio's working position; hosting it for others to download is not.
- **Distributing ROMs / disc images.** Same rule.
- **Bypassing rights-management to obtain content you didn't buy.** The DMCA's anti-circumvention provisions and the equivalent UK/EU rules apply.

What the studio does, mirroring the existing /emulator surface: BYO from your own legally-dumped hardware. The /emulator file-picker reads ROMs from local disk; nothing is hosted. The bridge-strategy section below extends the same rule — the bridge bench gets your dumps from your storage; the studio's machine never sees them.

## The 2024 takedown wave

Three of the most prominent post-PS2 emulators went down in 2024:

- **yuzu** (Nintendo Switch) — sued by Nintendo on 26 February 2024 for facilitating copyright infringement. yuzu's developers settled the same week for $2.4M and immediately took the project, its source repos, and the related Citra repos offline.
- **Citra** (Nintendo 3DS) — taken down as part of the same yuzu settlement on 5 March 2024. The Tropic Haze team owned both projects.
- **Ryujinx** (Nintendo Switch, the parallel project to yuzu) — its lead developer announced on 1 October 2024 that he had been contacted by Nintendo and was discontinuing the project.

In February 2026 Nintendo issued another DMCA wave aimed at the surviving Switch-emulator forks on GitHub. The Eden and Citron projects were among those named. Eden's primary repository is now self-hosted at `git.eden-emu.dev` for resilience; the GitHub presence is a mirror plus a binary-releases repo.

Forks of these projects are legal where the fork doesn't carry Nintendo-copyrighted code. The yuzu / Citra / Ryujinx codebases were all clean-room reverse-engineering work and contain no copyrighted Nintendo content. The DMCA actions against the forks have generally been about adjacent profit-motive arguments (Patreon revenue, paid releases of cutting-edge builds) rather than the source code itself.

## The catalogue

The full structured catalogue is in `lib/emulator/native-systems.ts`. The summary table below is for quick scanning.

| Project | System(s) | Licence | Web feasibility | Status |
| --- | --- | --- | --- | --- |
| [Eden](https://git.eden-emu.dev/eden-emu/eden) | Switch | GPL-3.0 | bench-bridge | active 2026, self-hosted post-DMCA |
| [Ryubing](https://github.com/Ryubing) (Ryujinx fork) | Switch | MIT | bench-bridge | active 2026 |
| [Azahar](https://github.com/azahar-emu/azahar) | 3DS | GPL-2.0 | bench-bridge | active 2026, merger of Lime3DS + PabloMK7/Citra |
| [Borked3DS](https://github.com/Borked3DS/Borked3DS) | 3DS | GPL-2.0 | bench-bridge | slower 2026, experimental sandbox |
| [PPSSPP](https://github.com/hrydgard/ppsspp) | PSP | GPL-2.0+ | bench-bridge | active 2026 |
| [RPCS3](https://github.com/RPCS3/rpcs3) | PS3 | GPL-2.0 | bench-bridge | active 2026, >70% library playable |
| [Cemu](https://github.com/cemu-project/Cemu) | Wii U | MPL-2.0 | bench-bridge | active 2026, OSS since 2022 |
| [Dolphin](https://github.com/dolphin-emu/dolphin) standalone | GameCube + Wii | GPL-2.0+ | bench-bridge | active 2026 (EmulatorJS has a weaker WASM core) |
| [DuckStation](https://github.com/stenzek/duckstation) | PS1 | CC-BY-NC-ND-4.0 | bench-bridge | active 2026 |
| [Vita3K](https://github.com/Vita3K/Vita3K) | Vita | GPL-2.0 | bench-bridge | active 2026, experimental |
| [melonDS](https://github.com/melonDS-emu/melonDS) | DS + DSi | GPL-3.0 | browser-wasm | active 2026 |
| [mGBA](https://github.com/mgba-emu/mgba) | GB / GBC / GBA | MPL-2.0 | browser-wasm | active 2026 |
| [Flycast](https://github.com/flyinghead/flycast) | Dreamcast + Naomi | GPL-2.0 | browser-wasm | active 2026 |
| [PCSX2](https://github.com/PCSX2/pcsx2) standalone | PS2 | GPL-3.0+ | bench-bridge | active 2026 |
| [Xenia Canary](https://github.com/xenia-canary/xenia-canary) | Xbox 360 | BSD-3-Clause | native-only | active 2026 |

DuckStation's licence in particular is worth highlighting. It was MIT in earlier years; it is now CC-BY-NC-ND-4.0 (verified 2026-05-19 against the repo's LICENSE file). That licence forbids derivative works and commercial use — the studio cannot wrap or fork it, only link to it.

## Bridge strategy — three options

There are three honest routes to surface a native emulator on the studio website. The bench-bridge route is the recommended one for the studio specifically.

### Option A — browser WASM port

Where a working WASM port exists (mGBA, melonDS, Flycast, parts of Dolphin), the natural path is to wrap it through the existing EmulatorJS pattern or a sibling wrapper. The studio's `lib/emulator/systems.ts` already does this for the EmulatorJS-cored systems.

The ceiling: WASM ports for the post-PS2 systems either don't exist or are early experiments. JIT generation is the blocker — WebAssembly added the JS string builtins and tail calls but still doesn't have a path to runtime code generation. Newer specs (the Wasm GC and exception-handling proposals) help but don't unblock JIT.

When this option works, it's the cleanest. When it doesn't, the next option is the bench bridge.

### Option B — bench bridge (recommended)

The studio already runs the `holoflow-bench-bridge` pattern for the SHARP gaussian-splat inference path: a FastAPI service on Sovereign-PC, exposed over Tailscale Funnel with a shared bearer token, callable from the Vercel-deployed site. The same shape works for emulators.

The mechanics:

1. The user installs a small helper on their own machine — a lightweight FastAPI / Express service that wraps the native emulator's CLI or library API, plus a WebRTC server for the video stream and a WebSocket for input.
2. The user authenticates the helper against the studio site (bearer token, scoped to their account).
3. The user uploads a ROM through the helper — to the helper's local storage on their own machine. The studio's servers never see it.
4. The website's `/emulator/native/[system]` route streams the helper's output over WebRTC and pushes input over WebSocket.

The latency budget for the studio's Tailscale paths sits around 50-100ms in practice — playable for most genres, marginal for fighting / rhythm games. The trade-off is the helper install — most users won't bother. The audience that will is the same audience that buys editioned prints and reads the codex: technical, motivated, willing to install something.

A TODO for the next pass — sketch `/api/emulator/native/stream/[system]` route handler. Probable shape: GET initiates a WebRTC offer, POST takes the answer + ICE candidates, separate WebSocket route at `/api/emulator/native/input/[system]` for controller events. Per-system bridge config table needs adding to `lib/emulator/native-systems.ts` (port, executable path, ROM-mount convention).

### Option C — native-app companion

A small Tauri or Electron wrapper the studio ships, which registers a custom URL protocol (`holoflow-emu://`). The website hands off the ROM + system selection to the protocol; the wrapper picks it up and launches the appropriate native emulator on the user's machine.

The trade-off is bigger install footprint plus the maintenance burden of shipping a desktop app. Latency is essentially zero (everything runs locally), but the website is reduced to a launcher — the actual gameplay happens in a separate window. For the studio's use case (canon-playable-from-the-catalogue-page), Option B is the better fit.

## Recommended next step

Start with Option B (bench-bridge) targeting Eden, Azahar, and PPSSPP — Switch, 3DS, PSP. Those three cover the highest-value gap between the EmulatorJS surface and the modern handheld lineage. The pattern reuses `holoflow-bench-bridge`'s infrastructure (Tailscale Funnel + bearer token + the working sidecar template at `D:\Tools\tailscale-sharp`).

Sequence:

1. Add `bridge` config field to each `NativeEmulator` entry (executable path, CLI flag pattern, default port).
2. Build the FastAPI helper. Reuse the sharp-onnx-bench skeleton — same auth flow, same logging.
3. Add the route handler at `app/api/emulator/native/stream/[system]/route.ts`.
4. Add the `/emulator/native/[system]` surface — a sibling to the existing `/emulator/[system]` page, identical UX, different transport.
5. Document the helper install in `docs/EMULATION-NATIVE.md` (this file) and link from the surface.

The first pass can be Eden-only as a working spike before generalising.

## Cross-references

- Catalogue: [`lib/emulator/native-systems.ts`](../lib/emulator/native-systems.ts)
- Browser-WASM sibling: [`lib/emulator/systems.ts`](../lib/emulator/systems.ts)
- Existing surface: `/emulator` ([`app/emulator/page.tsx`](../app/emulator/page.tsx))
- Magazine article: [`/articles/the-oss-native-emulation-ecosystem`](../components/articles/entries/the-oss-native-emulation-ecosystem.tsx)
- Codex entries: `/codex/eden-emulator`, `/codex/citra-and-3ds-emulator-forks`, `/codex/rpcs3`, `/codex/ppsspp`, `/codex/cemu`, `/codex/melonds`, `/codex/vita3k`
- Adjacent doc: [`docs/OPEN-SOURCE-STACK.md`](OPEN-SOURCE-STACK.md) — the canonical OSS-deps catalogue, with a sub-section for these
- Skill: `holoflow-bench-bridge` — the working Tailscale-Funnel pattern this builds on
- Parallel surface (in-flight): `/atelier/webxr-retroarch` — RetroArch on a virtual CRT inside a WebXR room (different agent's work)
