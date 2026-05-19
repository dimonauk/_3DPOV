import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheOssNativeEmulationEcosystem() {
  return (
    <>
      <p>
        The studio&rsquo;s in-browser{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        page is comfortable up to about the PlayStation 2 era. After
        that, the consoles get demanding in ways a browser
        can&rsquo;t answer: a JIT recompiler is needed; sustained
        memory bandwidth measured in gigabytes per second is needed;
        a graphics back-end with proper Vulkan or Direct3D 12 access
        is needed. None of these arrive through WebAssembly in 2026.
        The Switch, the 3DS, the PSP, the PlayStation 3, the Wii U,
        the PS Vita, the Xbox 360 &mdash; they all live one layer
        further out, in native desktop emulators, written mostly in
        C++ by communities that have outlasted the platforms they
        emulate and, in several recent cases, outlasted the
        platforms&rsquo; manufacturers&rsquo; willingness to let
        them exist.
      </p>

      <p>
        This article walks that further-out layer. Eden and the
        post-Citra 3DS forks are the headline, because those are
        the two systems most readers ask about and where the legal
        weather has been the most violent. The other eight projects
        are the supporting ecosystem &mdash; the cohort of
        emulators that, taken together, mean every commercial
        gaming console from 1977 through about 2017 is reachable on
        a 2026 desktop with patience, a legally-dumped cartridge or
        disc, and a download. The studio&rsquo;s stance is the
        same one set out at{" "}
        <Link href="/articles/byo-rom-browser-emulators" className={ext}>
          BYO &mdash; bring your own
        </Link>
        : every one of the projects below is a tool, every one
        runs against data the user supplies, and none of them are
        a path to playing things you have not bought.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why this matters
      </h2>
      <p>
        Commercial preservation is patchy. Nintendo&rsquo;s online
        library streams a curated subset of the NES, SNES, N64 and
        GBA catalogues to active Switch Online subscribers; the Wii
        Virtual Console is dead; the Wii U eShop closed on{" "}
        <em>27 March 2023</em>; the 3DS eShop closed the same day;
        the PSP store closed <em>2 July 2021</em>; the Vita store
        closed for new purchases <em>27 August 2021</em>. The PS3
        store remains partly accessible but functions on a brittle
        legacy backend. Xbox 360 Live still serves the catalogue
        but the marketplace UI was pared down in 2023. What this
        means in plain terms: a meaningful slice of every console
        generation between the late 1990s and the mid 2010s is no
        longer available through the rights-holder&rsquo;s own
        store, and a sizeable further slice is available only to
        users who own the original hardware. The second-hand
        market for physical cartridges and discs picks up some of
        the slack; the rest is picked up, for the audience willing
        to dump their own copies, by the emulators in this
        article. The Free Software Foundation&rsquo;s position
        paper on emulation, the Bleem v. Sony precedent, and the
        Connectix-v-Sony decision before it all establish the same
        thing in law: emulators themselves are legal, the
        question is what you run on them.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The 2024 takedown wave
      </h2>
      <p>
        On <em>26 February 2024</em>, Nintendo of America filed a
        complaint against Tropic Haze LLC in the U.S. District Court
        for the District of Rhode Island, alleging that the
        defendants&rsquo; yuzu Nintendo Switch emulator and Citra
        Nintendo 3DS emulator facilitated piracy of Nintendo titles.
        The settlement landed within the week: Tropic Haze agreed
        to pay <em>$2.4 million</em>, surrender the domain names,
        and take both projects offline. The yuzu repository at{" "}
        <code>github.com/yuzu-emu/yuzu</code> was archived and made
        inaccessible on <em>4 March 2024</em>; Citra at{" "}
        <code>github.com/citra-emu/citra</code> followed on{" "}
        <em>5 March</em>.
      </p>
      <p>
        On <em>1 October 2024</em>, the lead developer of the
        parallel Switch emulator project Ryujinx announced that
        Nintendo had contacted him and he was discontinuing the
        project. Ryujinx&rsquo;s repositories at{" "}
        <code>github.com/Ryujinx/Ryujinx</code> were taken down the
        same day. The Switch had, briefly, no major
        actively-developed open-source emulator.
      </p>
      <p>
        Forks emerged within hours of each takedown. The pattern
        repeated across all three projects: the GPL-2.0 (Citra) or
        GPL-3.0 (yuzu, Ryujinx) source had been mirrored widely
        before the original repos went down, the forks contained no
        Nintendo-copyrighted material, and the developers
        rebranded and re-hosted. In February 2026 Nintendo issued
        another DMCA wave specifically targeting Switch-emulator
        forks on GitHub; the Eden and Citron projects were
        named, and Eden&rsquo;s primary git moved to a
        self-hosted Gitea at <code>git.eden-emu.dev</code>.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Eden lineage
      </h2>
      <p>
        The yuzu lineage runs five forks deep at this point and
        most online recommendations are out of date.
        Chronologically:
      </p>
      <p>
        <strong>yuzu</strong> (2018&ndash;2024, Tropic Haze,
        GPL-3.0). Original project; settled and removed 2024.
      </p>
      <p>
        <strong>Suyu</strong> (immediate community fork,
        February&ndash;2025). Announced ceasing of development on{" "}
        <em>13 February 2025</em>.
      </p>
      <p>
        <strong>Sudachi</strong> (concurrent fork, hit with its
        own DMCA shortly after Suyu).
      </p>
      <p>
        <strong>Citron</strong> (continuation from Sudachi,
        2025&ndash;present). Introduced DRM and telemetry that
        several core developers objected to.
      </p>
      <p>
        <strong>Eden</strong> (fork from Citron, 2025&ndash;present,
        GPL-3.0). The fork was created in protest against
        Citron&rsquo;s DRM additions; restores the no-telemetry
        position and keeps the GPL intact. Primary source at{" "}
        <a
          href="https://git.eden-emu.dev/eden-emu/eden"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          git.eden-emu.dev/eden-emu/eden{arrow}
        </a>
        ; mirrored at <code>github.com/eden-emulator</code>.
        As of 2026-05-19, Eden is the most active continuation in
        the lineage and the one the studio links out to.
      </p>
      <p>
        The parallel lineage on the Ryujinx side has consolidated
        around <strong>Ryubing</strong> at{" "}
        <a
          href="https://github.com/Ryubing"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/Ryubing{arrow}
        </a>
        , an MIT-licensed C# project also active in 2026.
        Ryubing and Eden are not the same family &mdash; they
        descend from independent codebases &mdash; and they are
        not interchangeable in compatibility or in maintenance
        culture. For the studio&rsquo;s catalogue, Eden is the
        recommended default; Ryubing is listed alongside as a
        credible alternative for users who prefer the MIT
        licence or the C# implementation.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Citra&rsquo;s forks
      </h2>
      <p>
        Citra&rsquo;s post-takedown landscape is simpler than
        Eden&rsquo;s because it has already consolidated.
      </p>
      <p>
        <strong>Lime3DS</strong> (community fork, 2024&ndash;2025).
        Started within days of the original&rsquo;s removal.
        Merged into Azahar in 2025.
      </p>
      <p>
        <strong>PabloMK7&rsquo;s Citra fork</strong>
        (long-running developer fork, 2024&ndash;2025). Also
        merged into Azahar.
      </p>
      <p>
        <strong>Mandarine</strong> (community fork,
        2024&ndash;2025). Quietly stopped.
      </p>
      <p>
        <strong>Borked3DS</strong> (sandbox combining code from
        the above, 2024&ndash;present, GPL-2.0). Active but slow;
        last release at time of writing is{" "}
        <em>11 March 2025</em>. Of interest mostly for
        sandbox-specific features (notably the Skylanders IR
        portal path on desktop). Source at{" "}
        <a
          href="https://github.com/Borked3DS/Borked3DS"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/Borked3DS/Borked3DS{arrow}
        </a>
        .
      </p>
      <p>
        <strong>Azahar</strong> (merger of Lime3DS and
        PabloMK7&rsquo;s fork, 2025&ndash;present, GPL-2.0). The
        recommended 3DS emulator as of 2026. Source at{" "}
        <a
          href="https://github.com/azahar-emu/azahar"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/azahar-emu/azahar{arrow}
        </a>
        , site at <code>azahar-emu.org</code>. Desktop +
        Android; the Android version is on Google Play under the
        Lime3DS package name (legacy continuity). An AzaharPlus
        fork exists with extra features but is not the default
        recommendation.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The other eight
      </h2>
      <p>
        <strong>PPSSPP</strong> (PSP, GPL-2.0-or-later, by Henrik
        Rydg&aring;rd since 2012). HLE &mdash; no BIOS required.
        The texture-replacement pipeline is the noteworthy
        feature for art-research work: dump every texture the
        game asks for as PNG, paint a high-resolution
        replacement, drop it back in, see the substitution live
        on the original rasteriser&rsquo;s pixel grid. Source at{" "}
        <a
          href="https://github.com/hrydgard/ppsspp"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/hrydgard/ppsspp{arrow}
        </a>
        ; site at <code>ppsspp.org</code>. Has a Libretro core
        shipped inside RetroArch.
      </p>
      <p>
        <strong>RPCS3</strong> (PS3, GPL-2.0, since 2011). The PS3
        is the hardest mainstream console to emulate &mdash; the
        Cell processor with its eight SPE co-processors is
        architecturally unlike anything else &mdash; and RPCS3 is
        the only project that has solved it. Over 70% of the PS3
        library reported playable as of April 2026. Source at{" "}
        <a
          href="https://github.com/RPCS3/rpcs3"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/RPCS3/rpcs3{arrow}
        </a>
        . The project asked contributors in 2026 to stop
        submitting AI-generated pull requests on maintenance
        grounds &mdash; a useful policy artefact for any
        long-running open-source project to read.
      </p>
      <p>
        <strong>Dolphin (standalone)</strong> (GameCube + Wii,
        GPL-2.0-or-later). EmulatorJS already wraps a Dolphin
        core for the studio&rsquo;s /emulator page, but the
        standalone is materially more capable &mdash; the
        texture-dump feature alone justifies the install for any
        reference-research work, and the AR-camera
        free-fly-through capability turns the emulator into a
        virtual photography studio inside an old game world. Site
        at <code>dolphin-emu.org</code>; source at{" "}
        <a
          href="https://github.com/dolphin-emu/dolphin"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/dolphin-emu/dolphin{arrow}
        </a>
        .
      </p>
      <p>
        <strong>Cemu</strong> (Wii U, MPL-2.0, open-sourced 2022).
        The only credible Wii U emulator. Closed-source freeware
        from 2015 until <em>25 August 2022</em>; the
        open-sourcing made it a community project with dozens of
        contributors. Worth its installation cost for Breath of
        the Wild and the gamepad-second-screen titles
        (Splatoon 1, Captain Toad, the New Super Mario Bros U
        pair) that did not survive in the Switch ports. Source at{" "}
        <a
          href="https://github.com/cemu-project/Cemu"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/cemu-project/Cemu{arrow}
        </a>
        .
      </p>
      <p>
        <strong>DuckStation</strong> (PS1, CC-BY-NC-ND-4.0). The
        gold-standard PS1 emulator and one of the most accurate
        in active development. The licence is genuinely
        non-commercial-no-derivatives, which is the trap
        anyone planning to wrap the project should know about
        before they start. The studio&rsquo;s catalogue links
        out to DuckStation; the studio does not embed it. Source
        at{" "}
        <a
          href="https://github.com/stenzek/duckstation"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/stenzek/duckstation{arrow}
        </a>
        . The Beetle PSX libretro core inside RetroArch is the
        alternative for users whose project requires a more
        permissive licence.
      </p>
      <p>
        <strong>Ryubing</strong> (Switch, MIT). Covered above
        alongside Eden. The C# / .NET implementation; the
        parallel lineage to the yuzu-derived projects.
      </p>
      <p>
        <strong>Vita3K</strong> (Vita, GPL-2.0). Experimental and
        slow-paced &mdash; the only credible Vita emulator,
        worth knowing about even if it is years from playable
        for most of the catalogue. The Vita has the worst
        commercial preservation story of any modern handheld and
        Vita3K is the only realistic path to its library.
        Source at{" "}
        <a
          href="https://github.com/Vita3K/Vita3K"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/Vita3K/Vita3K{arrow}
        </a>
        .
      </p>
      <p>
        <strong>melonDS</strong> (DS + DSi, GPL-3.0, by
        Arisotura since 2016). One of the most carefully
        engineered open-source emulators on the internet. A WASM
        port exists and the EmulatorJS catalogue already covers
        the DS through a melonDS-derived core; the standalone is
        the reference for DSi-mode features the WASM core does
        not yet have. Source at{" "}
        <a
          href="https://github.com/melonDS-emu/melonDS"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/melonDS-emu/melonDS{arrow}
        </a>
        . DeSmuME (GPL-2.0, active since 2006) remains the
        long-running alternative.
      </p>
      <p>
        <strong>Xenia Canary</strong> (Xbox 360, BSD-3-Clause).
        The active fork of the Xenia research emulator; updated
        more frequently than the upstream xenia/xenia. BSD
        licensing makes redistribution easier than the
        GPL-family. Windows-first; cross-platform work is
        partial. Source at{" "}
        <a
          href="https://github.com/xenia-canary/xenia-canary"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/xenia-canary/xenia-canary{arrow}
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The studio&rsquo;s stance
      </h2>
      <p>
        The position is the same one set out across the rest of
        this site and is restated here so nobody can mistake it.
        The studio does not host ROMs. The studio does not host
        BIOS files. The studio does not link to sites that do.
        The studio&rsquo;s /emulator page reads ROMs and BIOSes
        from the user&rsquo;s local disk and never uploads them.
        The bridge-strategy planned for the native catalogue
        (sketched in{" "}
        <code>docs/EMULATION-NATIVE.md</code>) does the same
        thing in reverse: the user installs a small helper on
        their own machine, the helper reads the user&rsquo;s
        legally-dumped media from their own storage, the website
        only sees the framebuffer the helper streams back.
      </p>
      <p>
        The interest for the studio specifically is preservation
        and playable canon for research. The catalogue at{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        is the canon-playable-in-a-tab pass; the native catalogue
        in <code>lib/emulator/native-systems.ts</code> is the
        canon-playable-with-a-bridge pass for everything beyond
        the EmulatorJS ceiling. Both are study tools. Both are
        the kind of work that is harder than it should need to
        be precisely because the rights-holders&rsquo; own
        preservation efforts haven&rsquo;t covered the
        territory.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to look next
      </h2>
      <p>
        The codex carries a per-project entry for the ones the
        studio considers most important to know about: Eden,
        Citra-and-3DS-emulator-forks, RPCS3, PPSSPP, Cemu,
        melonDS, Vita3K. Each entry has the canonical repo, the
        licence verified against the project&rsquo;s own LICENSE
        file at catalogue time, and a paragraph of studio
        context. The structured catalogue is at{" "}
        <code>lib/emulator/native-systems.ts</code>. The
        bridge-strategy doc at{" "}
        <code>docs/EMULATION-NATIVE.md</code> spells out the
        three honest routes to surface a native emulator from a
        website and explains why the studio is starting with the
        Tailscale-bench-bridge route for Eden, Azahar and
        PPSSPP. The companion piece on the in-browser EmulatorJS
        layer is at{" "}
        <Link href="/articles/byo-rom-browser-emulators" className={ext}>
          BYO &mdash; bring your own
        </Link>
        ; the bench-side stack that goes beyond a tab is at{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>
        ; the why-this-practice piece is at{" "}
        <Link
          href="/articles/emulation-as-a-creative-tool"
          className={ext}
        >
          Emulation as a Creative Tool
        </Link>
        . The WebXR-RetroArch room (a sibling experiment in
        playing a ROM on a virtual CRT inside a 3D scene)
        lives at /atelier/webxr-retroarch when that surface
        lands.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "the-oss-native-emulation-ecosystem",
  title:
    "The OSS native-emulation ecosystem — Eden, Citra, and the eight other emulators that keep the canon playable",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "EmulatorJS covers the canon up to PS2 in a browser tab. Beyond that the path is native: Eden for Switch (the surviving yuzu lineage), Azahar for 3DS (the post-Citra merger), and eight others — PPSSPP, RPCS3, Cemu, Dolphin standalone, DuckStation, Ryubing, Vita3K, melonDS — that between them keep the post-PS2 catalogue playable on a 2026 desktop. The 2024 takedown wave, the fork landscape it produced, and the studio's bridge-strategy for surfacing native emulators from the website.",
  Body: TheOssNativeEmulationEcosystem,
  related: [
    {
      href: "/articles/byo-rom-browser-emulators",
      label: "BYO — bring your own",
      note: "The in-browser EmulatorJS layer the studio's /emulator page already covers.",
    },
    {
      href: "/articles/the-emulation-stack-for-creative-research",
      label: "The Emulation Stack for Creative Research",
      note: "The bench-side companion that walks the working stack.",
    },
    {
      href: "/articles/emulation-as-a-creative-tool",
      label: "Emulation as a Creative Tool",
      note: "The why-this-practice glossary-as-essay.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The free-code lineage every emulator here belongs to.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "Including the firm line on ROM and BIOS distribution.",
    },
    {
      href: "/codex/eden-emulator",
      label: "Codex — Eden",
      note: "Single-emulator entry.",
    },
    {
      href: "/codex/citra-and-3ds-emulator-forks",
      label: "Codex — Citra and the 3DS forks",
      note: "Post-takedown 3DS landscape including Azahar.",
    },
    {
      href: "/codex/rpcs3",
      label: "Codex — RPCS3",
      note: "The PS3 emulator.",
    },
    {
      href: "/codex/ppsspp",
      label: "Codex — PPSSPP",
      note: "The PSP emulator.",
    },
    {
      href: "/codex/cemu",
      label: "Codex — Cemu",
      note: "The Wii U emulator.",
    },
    {
      href: "/codex/melonds",
      label: "Codex — melonDS",
      note: "The DS / DSi emulator.",
    },
    {
      href: "/codex/vita3k",
      label: "Codex — Vita3K",
      note: "The Vita emulator.",
    },
  ],
  furtherReading: [
    {
      href: "https://git.eden-emu.dev/eden-emu/eden",
      label: "Eden (Switch)",
      note: "GPL-3.0; self-hosted primary repo post-DMCA.",
    },
    {
      href: "https://github.com/Ryubing",
      label: "Ryubing (Switch, Ryujinx fork)",
      note: "MIT; C# implementation.",
    },
    {
      href: "https://github.com/azahar-emu/azahar",
      label: "Azahar (3DS)",
      note: "GPL-2.0; the recommended Citra-lineage 3DS emulator.",
    },
    {
      href: "https://github.com/Borked3DS/Borked3DS",
      label: "Borked3DS (3DS)",
      note: "GPL-2.0; experimental sandbox.",
    },
    {
      href: "https://github.com/hrydgard/ppsspp",
      label: "PPSSPP (PSP)",
      note: "GPL-2.0-or-later; HLE, no BIOS required.",
    },
    {
      href: "https://github.com/RPCS3/rpcs3",
      label: "RPCS3 (PS3)",
      note: "GPL-2.0; >70% library playable.",
    },
    {
      href: "https://github.com/dolphin-emu/dolphin",
      label: "Dolphin (GameCube + Wii)",
      note: "GPL-2.0-or-later; the standalone is more capable than EmulatorJS's WASM core.",
    },
    {
      href: "https://github.com/cemu-project/Cemu",
      label: "Cemu (Wii U)",
      note: "MPL-2.0; open-sourced 25 August 2022.",
    },
    {
      href: "https://github.com/stenzek/duckstation",
      label: "DuckStation (PS1)",
      note: "CC-BY-NC-ND-4.0 — non-commercial, no-derivatives.",
    },
    {
      href: "https://github.com/Vita3K/Vita3K",
      label: "Vita3K (Vita)",
      note: "GPL-2.0; experimental.",
    },
    {
      href: "https://github.com/melonDS-emu/melonDS",
      label: "melonDS (DS + DSi)",
      note: "GPL-3.0; one of the cleanest open-source emulator codebases.",
    },
    {
      href: "https://github.com/mgba-emu/mgba",
      label: "mGBA (GB / GBC / GBA)",
      note: "MPL-2.0; the reference small-codebase emulator with a WASM port.",
    },
    {
      href: "https://github.com/flyinghead/flycast",
      label: "Flycast (Dreamcast)",
      note: "GPL-2.0; primary repo is flyinghead/flycast (libretro/flycast is deprecated).",
    },
    {
      href: "https://github.com/PCSX2/pcsx2",
      label: "PCSX2 standalone (PS2)",
      note: "GPL-3.0-or-later; more capable than EmulatorJS's WASM core.",
    },
    {
      href: "https://github.com/xenia-canary/xenia-canary",
      label: "Xenia Canary (Xbox 360)",
      note: "BSD-3-Clause; active fork of Xenia.",
    },
    {
      href: "https://www.fsf.org/",
      label: "Free Software Foundation",
      note: "The home of the GPL the majority of these projects ship under.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Sony_Computer_Entertainment_America,_Inc._v._Bleem,_LLC",
      label: "Bleem v. Sony (9th Circuit, 2000)",
      note: "The U.S. case law establishing the legality of console emulation.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Sony_Computer_Entertainment,_Inc._v._Connectix_Corp.",
      label: "Connectix v. Sony (9th Circuit, 2000)",
      note: "The companion case on clean-room reverse engineering of console BIOS.",
    },
    {
      href: "https://emulation.gametechwiki.com/",
      label: "Emulation General Wiki",
      note: "Community-maintained reference for which emulators sit where.",
    },
    {
      href: "https://docs.libretro.com/",
      label: "Libretro / RetroArch docs",
      note: "The cores wrapping many of these emulators for a common front-end.",
    },
  ],
};
