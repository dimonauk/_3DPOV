/**
 * lib/emulator/native-systems.ts — Registry of native (non-browser) emulators.
 *
 * The sibling registry at `lib/emulator/systems.ts` enumerates the
 * EmulatorJS WASM cores the studio's /emulator surface can run in a
 * tab. That ceiling is roughly PS2-era; anything more demanding
 * (Switch, 3DS, PSP, PS3, Wii U, Vita) needs a native emulator with a
 * JIT. This file is the parallel catalogue for those — projects the
 * studio links out to, follows, and is staging to surface through a
 * bench-bridge route (see `docs/EMULATION-NATIVE.md`).
 *
 * The catalogue is study-and-link only. No code is bundled, no ROMs
 * or BIOSes are hosted. Forks in this space change quickly; see the
 * `activityHint` and `notes` fields, and re-verify before relying on
 * any one entry for production wiring.
 */

export type NativeEmulator = {
  /** URL slug — kebab-case, used in the docs and codex cross-refs. */
  id: string;
  /** Display name. */
  name: string;
  /** Canonical source repository (verified at catalogue time). */
  repo: string;
  /** SPDX licence identifier or short licence name. */
  licence: string;
  /** Systems the project emulates. */
  systems: string[];
  /** Primary implementation language. */
  language: string;
  /** Whether the project relies on a JIT (most do — the browser ceiling). */
  jit: boolean;
  /**
   * Realistic path to surface this emulator on a website.
   *  - "browser-wasm": a working WASM port exists today (e.g. mGBA, melonDS).
   *  - "bench-bridge": the project runs natively on the user's machine and
   *     streams over the studio's Tailscale-bench-bridge pattern.
   *  - "native-only": the project really cannot be web-served — desktop install
   *     is the only honest route.
   */
  webRuntimeFeasibility: "browser-wasm" | "bench-bridge" | "native-only";
  /** Free-text activity signal (commits, releases, fork status). */
  activityHint: string;
  /** One-line studio note — verdict, gotcha, or context. */
  notes: string;
};

export const NATIVE_EMULATORS: NativeEmulator[] = [
  {
    id: "eden",
    name: "Eden",
    repo: "https://git.eden-emu.dev/eden-emu/eden",
    licence: "GPL-3.0",
    systems: ["Nintendo Switch"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint:
      "active 2026; primary repo self-hosted at git.eden-emu.dev after the Nintendo DMCA wave",
    notes:
      "The most active community continuation in the yuzu lineage after the 2024 takedown. Forked from Citron; primary developers came via Sudachi. Android driver work is the visible recent focus.",
  },
  {
    id: "azahar",
    name: "Azahar",
    repo: "https://github.com/azahar-emu/azahar",
    licence: "GPL-2.0",
    systems: ["Nintendo 3DS"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint:
      "active 2026; merger of PabloMK7's Citra fork and Lime3DS, both of which stopped to consolidate here",
    notes:
      "The recommended Citra-lineage 3DS emulator as of 2026. Desktop + Android. Issued an unscheduled release after the TeamPCP supply-chain attacks to harden security policy.",
  },
  {
    id: "borked3ds",
    name: "Borked3DS",
    repo: "https://github.com/Borked3DS/Borked3DS",
    licence: "GPL-2.0",
    systems: ["Nintendo 3DS"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "slower 2026; last release 11 March 2025",
    notes:
      "Experimental Citra-derived sandbox combining PabloMK7, Lime3DS and Mandarine code. Bleeding-edge deps and a Skylanders IR portal path desktop-only. Use Azahar unless a Borked3DS-specific feature is needed.",
  },
  {
    id: "ryubing",
    name: "Ryubing (Ryujinx community fork)",
    repo: "https://github.com/Ryubing",
    licence: "MIT (Ryujinx lineage)",
    systems: ["Nintendo Switch"],
    language: "C#",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint:
      "active 2026; community continuation after the original Ryujinx project was shut down on 1 October 2024",
    notes:
      "C# / .NET implementation — the parallel Switch lineage to Eden. MIT-licensed where Eden is GPL-3.0; the licence difference matters if a downstream wants to wrap the runtime.",
  },
  {
    id: "rpcs3",
    name: "RPCS3",
    repo: "https://github.com/RPCS3/rpcs3",
    licence: "GPL-2.0",
    systems: ["PlayStation 3"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint:
      "active 2026; over 70% of the PS3 library reported playable as of April 2026",
    notes:
      "The PS3 emulator. Targets x86-64 and ARM64 with OpenGL and Vulkan back-ends. RPCS3 maintainers asked contributors in 2026 to stop submitting AI-generated pull requests.",
  },
  {
    id: "ppsspp",
    name: "PPSSPP",
    repo: "https://github.com/hrydgard/ppsspp",
    licence: "GPL-2.0-or-later",
    systems: ["PlayStation Portable"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "active 2026; maintained by Henrik Rydgård since 2012",
    notes:
      "HLE emulator — no BIOS required. Has a Libretro core and a texture-replacement pipeline well-suited to art-research workflows. Android / iOS builds in addition to desktop.",
  },
  {
    id: "cemu",
    name: "Cemu",
    repo: "https://github.com/cemu-project/Cemu",
    licence: "MPL-2.0",
    systems: ["Wii U"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "active 2026; open-sourced August 2022 (was closed-source from 2015)",
    notes:
      "MPL-2.0 licence is friendlier than GPL for adjacent tooling. Windows, Linux, macOS. The reference Wii U emulator since the official Wii U mode of Dolphin remained out of scope.",
  },
  {
    id: "dolphin",
    name: "Dolphin (standalone)",
    repo: "https://github.com/dolphin-emu/dolphin",
    licence: "GPL-2.0-or-later",
    systems: ["GameCube", "Wii"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "active 2026; monthly progress reports continue",
    notes:
      "EmulatorJS already wraps a Dolphin core in WASM, but the standalone is materially more capable — texture-dump, AR-camera, save-state granularity. The 'bench-bridge or local install' path is recommended for serious work.",
  },
  {
    id: "duckstation",
    name: "DuckStation",
    repo: "https://github.com/stenzek/duckstation",
    licence: "CC-BY-NC-ND-4.0 (verified 2026-05-19)",
    systems: ["PlayStation"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "active 2026",
    notes:
      "The gold-standard PS1 emulator. The licence is genuinely non-commercial-no-derivatives — older sources online list it as MIT, which is no longer correct. Cannot be redistributed bundled with anything commercial.",
  },
  {
    id: "vita3k",
    name: "Vita3K",
    repo: "https://github.com/Vita3K/Vita3K",
    licence: "GPL-2.0",
    systems: ["PlayStation Vita"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "active 2026; main repo last updated May 2026",
    notes:
      "Experimental — expect partial compatibility. The first functional open-source Vita emulator and still the only one of substance. Windows, Linux, macOS, Android.",
  },
  {
    id: "melonds",
    name: "melonDS",
    repo: "https://github.com/melonDS-emu/melonDS",
    licence: "GPL-3.0",
    systems: ["Nintendo DS", "DSi"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "browser-wasm",
    activityHint: "active 2026; Arisotura still the lead, started 2016",
    notes:
      "A community-maintained WASM build exists at github.com/44670/melonDS-wasm. DSi support and local wireless work are the focus of recent releases. EmulatorJS has a `melonds` core wrapping this lineage.",
  },
  {
    id: "mgba",
    name: "mGBA",
    repo: "https://github.com/mgba-emu/mgba",
    licence: "MPL-2.0",
    systems: ["Game Boy", "Game Boy Color", "Game Boy Advance"],
    language: "C",
    jit: false,
    webRuntimeFeasibility: "browser-wasm",
    activityHint: "active 2026; endrift (Vicki Pfau) the lead",
    notes:
      "The cleanest small-codebase reference emulator. A WASM port is in use by gbajs3 and similar browser front-ends. EmulatorJS uses an mGBA core for GBA.",
  },
  {
    id: "flycast",
    name: "Flycast",
    repo: "https://github.com/flyinghead/flycast",
    licence: "GPL-2.0",
    systems: ["Dreamcast", "Naomi", "Naomi 2", "Atomiswave"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "browser-wasm",
    activityHint:
      "active 2026; primary repo is flyinghead/flycast (libretro/flycast is deprecated)",
    notes:
      "A WASM build exists at github.com/nasomers/flycast-wasm and runs as a libretro core inside EmulatorJS. Reicast-derived.",
  },
  {
    id: "pcsx2",
    name: "PCSX2 (standalone)",
    repo: "https://github.com/PCSX2/pcsx2",
    licence: "GPL-3.0-or-later",
    systems: ["PlayStation 2"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "bench-bridge",
    activityHint: "active 2026; QT-based UI since 2022",
    notes:
      "EmulatorJS has a PCSX2 WASM core but it's slow and lossy. The standalone is the right path for any serious PS2 reference work; bench-bridge if a web surface is wanted.",
  },
  {
    id: "xenia-canary",
    name: "Xenia Canary",
    repo: "https://github.com/xenia-canary/xenia-canary",
    licence: "BSD-3-Clause",
    systems: ["Xbox 360"],
    language: "C++",
    jit: true,
    webRuntimeFeasibility: "native-only",
    activityHint: "active 2026; updated more frequently than the upstream xenia/xenia",
    notes:
      "The active fork of Xenia. BSD-licensed, which makes redistribution easier than the GPL-family. Windows-first; cross-platform work is partial.",
  },
];

/** Lookup helper. */
export function getNativeEmulator(id: string): NativeEmulator | undefined {
  return NATIVE_EMULATORS.find((e) => e.id === id);
}

/** Group by web-runtime feasibility for the docs view. */
export function nativeEmulatorsByFeasibility(): Record<
  NativeEmulator["webRuntimeFeasibility"],
  NativeEmulator[]
> {
  return NATIVE_EMULATORS.reduce(
    (acc, e) => {
      (acc[e.webRuntimeFeasibility] ||= []).push(e);
      return acc;
    },
    {} as Record<NativeEmulator["webRuntimeFeasibility"], NativeEmulator[]>,
  );
}

export const FEASIBILITY_LABELS: Record<
  NativeEmulator["webRuntimeFeasibility"],
  string
> = {
  "browser-wasm": "Browser WASM port available",
  "bench-bridge": "Bench bridge (Tailscale Funnel + bearer token)",
  "native-only": "Native install only",
};
