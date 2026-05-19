import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function ByoRomBrowserEmulators() {
  return (
    <>
      <p>
        The companion essay to the studio&rsquo;s own{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        route. That route is a browser tab into which you drop a
        ROM file you dumped from your own cartridge; the page never
        uploads it anywhere, the bytes stay on the machine reading
        them, and a libretro core compiled to WebAssembly runs the
        game in the same tab. The pattern is not the studio&rsquo;s
        invention &mdash; it is a small genre of in-browser emulators
        that have grown up over the last decade, each with a slightly
        different mandate. This article walks them as a taxonomy by
        tool, in the same shape as the sibling piece{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>
        . That one walks the bench. This one walks the browser.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        BYO &mdash; bring your own
      </h2>
      <p>
        Every project in this article is BYO-ROM, meaning the user
        supplies the game data. None of them ship ROMs; none of them
        link to ROM mirrors; none of them touch a copyrighted file
        the user has not already brought to the tab. The studio&rsquo;s
        position on this is set out in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          what the studio won&rsquo;t do
        </Link>{" "}
        and applied throughout this site: dump your own carts, run
        your own ROMs, and respect the licence the rights-holder
        chose. The bench-side dumping procedure is documented in{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          the emulation stack article
        </Link>{" "}
        and in{" "}
        <Link
          href="/articles/emulation-as-a-creative-tool"
          className={ext}
        >
          emulation as a creative tool
        </Link>
        . BYO in the browser is the same discipline made portable.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">EmulatorJS</h2>
      <p>
        <a
          href="https://emulatorjs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          emulatorjs.org{arrow}
        </a>{" "}
        &mdash; the canonical multi-system in-browser library, and
        the one the studio&rsquo;s own{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        route is built on. The source lives at{" "}
        <a
          href="https://github.com/EmulatorJS/EmulatorJS"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/EmulatorJS/EmulatorJS{arrow}
        </a>
        ; the project is GPL-licensed and wraps a long list of
        libretro cores compiled to WebAssembly &mdash; somewhere
        north of thirty systems at last count, covering the NES,
        SNES, Game Boy family, Mega Drive / Genesis, Master System,
        Atari 2600 / 5200 / 7800, Nintendo 64 (with caveats),
        PlayStation 1 via Beetle PSX, Sega Saturn, Neo Geo Pocket,
        Arcade via FBNeo and MAME, and a handful more. The
        architecture is: one front-end (HTML, CSS, JavaScript) that
        loads one of many backend cores on demand, each backend
        being a libretro core that has been built with Emscripten
        into a <code>.wasm</code> file the page fetches at
        runtime. The user drops a ROM, the page picks the core that
        matches the file&rsquo;s system, the core boots, the game
        plays. Save states, fast-forward, controller mapping, and
        shader stack all come for free because they live in the
        front-end. Under the hood: WebAssembly for the CPU work,
        WebGL for video output, Web Audio for sound, the
        File System API for the user&rsquo;s ROM. The studio
        reaches for EmulatorJS because the library is the closest
        thing the browser-emulator world has to a daily driver,
        in the same way RetroArch is on the desktop. The two share
        DNA &mdash; the cores are upstream of both. Embedding
        EmulatorJS is one HTML page, one configuration object,
        and a hosted folder of cores; the studio&rsquo;s{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        is exactly that pattern wrapped in the site&rsquo;s
        chrome-and-pink styling.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        RetroArch Web Player
      </h2>
      <p>
        <a
          href="https://web.libretro.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          web.libretro.com{arrow}
        </a>{" "}
        &mdash; the upstream&rsquo;s own in-browser build of
        RetroArch. The reference implementation, hosted on
        libretro&rsquo;s infrastructure, maintained by the same
        team that ships the desktop builds. What it supports: the
        same library of cores RetroArch carries on desktop, minus
        the few that are too heavy for a browser tab to run in
        real time (Dreamcast and PS2 cores, for instance, do not
        ship on the web build at time of writing). How it works:
        the desktop RetroArch front-end has been compiled to
        WebAssembly via Emscripten, and the cores are loaded as
        additional <code>.wasm</code> modules from the libretro
        buildbot. Honest verdict: the UI is the desktop UI in a
        browser tab, which means it is the same fractal settings
        menu the desktop version has, and the same steep first
        contact. Where EmulatorJS is a library you wrap in your
        own page, Web Player is the whole RetroArch experience
        deposited in a tab. The studio uses it as a sanity check
        &mdash; if a core behaves differently between EmulatorJS
        and the upstream Web Player, the upstream is the reference.
        Useful too for cores that EmulatorJS has not packaged but
        libretro maintains. The tutorial-series sibling{" "}
        <Link
          href="/articles/emulator-tutorial-retroarch"
          className={ext}
        >
          emulator-tutorial-retroarch
        </Link>{" "}
        covers the desktop build; the Web Player is the same
        muscle memory ported to a tab.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Eclipse</h2>
      <p>
        <a
          href="https://eclipseemu.me/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          eclipseemu.me{arrow}
        </a>{" "}
        &mdash; an in-browser emulator that has chosen to specialise
        rather than generalise. The systems covered are the Nintendo
        handheld line: Game Boy, Game Boy Color, Game Boy Advance,
        and Nintendo DS. The UI is the slickest in this article by
        a clear margin; the project treats the browser tab as a
        first-class app surface rather than as a settings menu
        ported across, and the result is something that looks like
        a hand-built piece of software rather than a libretro
        front-end. Under the hood the cores are still WebAssembly,
        but the project has done its own integration work rather
        than wrapping libretro wholesale. The studio reaches for
        Eclipse when the work is specifically handheld-era pixel
        study &mdash; the GBA palette behaves a particular way
        under Eclipse&rsquo;s scaler that reads cleanly for
        reference capture &mdash; and when a collaborator on a
        non-technical machine needs a low-friction tab to drop a
        ROM into. The DS dual-screen support is the headline
        feature of the project as a piece of UI design; touching
        the lower screen with a mouse is never going to feel like
        the original, but Eclipse&rsquo;s implementation is the
        most honest the studio has tested.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">vaporBoy</h2>
      <p>
        <a
          href="https://vaporboy.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          vaporboy.net{arrow}
        </a>{" "}
        &mdash; a single-system Game Boy / Game Boy Color emulator,
        built as a progressive web app, by Aaron Turner
        (torch2424). The honest argument for vaporBoy over a
        multi-system tab is the argument for focused tuning:
        when one emulator has to support thirty systems through a
        common API, the per-system polish is bounded by what the
        common API allows. When one emulator only emulates Game
        Boy, every UI affordance, every save-state thumbnail,
        every shader preset can be tuned to that one machine. The
        project leans into this. It ships custom vapor-wave themes
        which are exactly as ironic as the name suggests, gamepad
        support via the Gamepad API, save-state cloud sync via
        the user&rsquo;s own Dropbox or Google Drive
        (the user owns the state file, the project never sees it),
        and an installable PWA shell that survives offline once
        cached. Under the hood: WasmBoy is the core (see next
        section); vaporBoy is the application around it. The
        studio mentions it here because the single-system case is
        a deliberate design choice, not a limitation, and the
        result is a better Game Boy tab than a multi-system tab
        can be.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">WasmBoy</h2>
      <p>
        <a
          href="https://github.com/torch2424/wasmboy"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/torch2424/wasmboy{arrow}
        </a>{" "}
        &mdash; the Game Boy / Game Boy Color emulator <em>library</em>,
        written in AssemblyScript (the TypeScript-like language
        that compiles to WebAssembly), embeddable in any page that
        wants a Game Boy in a canvas. Same author as vaporBoy; the
        relationship is library-and-application, the same way
        EmulatorJS sits to its host pages. What it supports: Game
        Boy and Game Boy Color, with most commercial titles
        booting and a small handful of MBC edge cases documented
        in the readme. How it works under the hood: AssemblyScript
        is compiled to a single <code>.wasm</code> file, which the
        host page instantiates and feeds with frame-by-frame
        timing from <code>requestAnimationFrame</code>; the page
        passes the cartridge bytes in as a typed array, and reads
        the framebuffer out as a typed array each frame to draw
        onto a canvas. The studio includes WasmBoy in this article
        because it is the project the studio would reach for if
        the work demanded a Game Boy embedded directly into a
        bespoke page &mdash; an art piece, an installation web
        page, a tutorial that needs a working machine inline with
        the prose rather than off in an iframe. It is the
        cleanest library-shaped Game Boy emulator the studio
        knows of.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">JSNES</h2>
      <p>
        <a
          href="https://jsnes.fancrew.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          jsnes.fancrew.org{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/bfirsh/jsnes"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          github.com/bfirsh/jsnes{arrow}
        </a>{" "}
        &mdash; a pure-JavaScript NES emulator, originally
        translated by Ben Firsh from Jamie Sanders&rsquo;
        vNES (Java) work, and maintained as an open-source
        library since. No WebAssembly, no Emscripten, no native
        toolchain in the build &mdash; just JavaScript reading
        cartridge bytes and emulating the 6502, the PPU, and the
        APU directly. The studio recommends JSNES not because it
        is the most accurate (it is not; cycle-exact NES emulation
        is Mesen&rsquo;s territory and a WASM build is faster
        besides), but because the source is readable in a way
        that an Emscripten-compiled C++ core fundamentally is
        not. A reader who wants to understand how an emulator
        works should read JSNES first; the file structure mirrors
        the NES&rsquo; logical components (CPU, PPU, mapper,
        ROM), and the JavaScript stays close enough to plain
        prose that a careful reader can follow it across a long
        evening. The studio uses JSNES as study material more
        than as a runtime; for actual NES sessions in the
        browser, EmulatorJS&rsquo; Nestopia or FCEUmm core is
        the working choice.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">js-dos / DOSBox-X JS</h2>
      <p>
        <a
          href="https://js-dos.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          js-dos.com{arrow}
        </a>{" "}
        &mdash; the in-browser DOS-era PC emulator, an Emscripten
        port of DOSBox (and, in more recent builds, of DOSBox-X)
        compiled to WebAssembly. The library is what powers the
        Internet Archive&rsquo;s vast collection of in-browser
        MS-DOS software (see next section). What it supports: the
        late-80s and 90s DOS PC &mdash; CGA, EGA, VGA, the SB16
        and AdLib sound stack, the keyboard-and-mouse-and-joystick
        input loop &mdash; in a browser tab. How it works: the
        host page initialises the js-dos runtime, which exposes
        a virtual filesystem the page can populate with the
        user&rsquo;s files (a self-contained <code>.jsdos</code>{" "}
        bundle, or a zipped folder of DOS files dropped onto the
        page), then boots into a DOS prompt and runs the
        executable. The studio reaches for js-dos when the work
        is studying late-DOS pixel art and tile composition in
        the browser without standing up a full DOSBox-X install;
        the desktop counterpart is covered in the tutorial-series
        sibling{" "}
        <Link
          href="/articles/emulator-tutorial-dosbox-x"
          className={ext}
        >
          emulator-tutorial-dosbox-x
        </Link>
        . Honest verdict: the JS port is one or two video-mode
        edge cases behind the desktop, and CPU-heavy late-DOS
        titles can drop frames in the browser where the desktop
        runs them cleanly &mdash; but for the canonical archive
        use case (drop a game, play it, study the palette), it
        is the working tool.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Internet Archive &mdash; Console Living Room
      </h2>
      <p>
        <a
          href="https://archive.org/details/consolelivingroom"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          archive.org/details/consolelivingroom{arrow}
        </a>{" "}
        &mdash; not BYO-ROM strictly speaking, but the cultural
        anchor for the whole genre and worth knowing as a
        reference. The Console Living Room is the Internet
        Archive&rsquo;s curated collection of console software
        that the Archive considers legally permissible to host,
        playable directly in the browser through an EmulatorJS
        embed on each item page. The companion collection for
        DOS-era PC software is the{" "}
        <a
          href="https://archive.org/details/softwarelibrary_msdos_games"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          MS-DOS Games library{arrow}
        </a>
        , which runs on js-dos. The Archive&rsquo;s position is
        more permissive than the studio&rsquo;s &mdash; the
        Archive operates as a library under the relevant
        archival exemptions, and individual rights-holders can
        and do ask titles to be removed &mdash; but the cultural
        value of the project is that it is the largest
        in-browser playable archive of computer history that has
        ever existed, and it is the reason most browser
        emulators ship with the libretro core matrix they do.
        The studio links here as a research resource, not as a
        ROM source for the BYO route. The two stances are
        different and worth keeping separate.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The studio&rsquo;s own surface &mdash; /emulator
      </h2>
      <p>
        The studio is wiring its own browser-emulator route on
        holoflow.co.uk, at{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>
        . The build is EmulatorJS underneath, with the
        studio&rsquo;s chrome-and-pink layer on top. The
        contract with the reader is the one this article opens
        with: the page accepts a ROM you have brought to it,
        runs that ROM in your browser tab via the appropriate
        WebAssembly core, and never sends the bytes anywhere
        else &mdash; not to the studio&rsquo;s server, not to
        an analytics endpoint, not to a third party. The
        framebuffer renders to a canvas in the tab, the audio
        plays through Web Audio in the tab, the save state
        writes to the tab&rsquo;s own storage (with optional
        download to the user&rsquo;s disk). The studio&rsquo;s
        position is the same in the browser as it is on the
        bench: dump your own carts, run your own ROMs, do not
        share the dump with anyone the rights-holder has not
        cleared. The reward for doing it this way is a research
        surface the studio can put on the public site without
        the legal weight; the reward for the reader is a tab
        they can use to study the work they bought, on the
        machine they own, without installing anything. The
        whole article you are reading is the reading list for
        that route. Read it once, then drop a cartridge file on
        the route and watch the studio&rsquo;s preferred libretro
        core boot it in front of you.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The order in practice
      </h2>
      <p>
        A browser-emulator working session in the studio reads
        like this. EmulatorJS (via{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>
        ) for the daily case: drop a ROM, play, screenshot,
        close the tab. RetroArch Web Player when a core
        EmulatorJS does not ship is needed, or when an
        EmulatorJS bug needs a sanity check against the upstream.
        Eclipse for handheld-specific work where the GBA palette
        or the DS dual-screen matters. vaporBoy or a WasmBoy
        embed when the work calls for a Game Boy specifically,
        tuned. JSNES for reading the source. js-dos for late-DOS
        pixel-art research without a desktop DOSBox-X install
        spun up. The Console Living Room for cultural reference
        and for titles whose rights-holders have already cleared
        them to be hosted. The browser tab is not a replacement
        for the bench &mdash; the desktop stack covered in{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>{" "}
        is still where the heavy capture and analysis work
        happens &mdash; but it is the lightest possible surface
        for a reader, a collaborator, or the studio itself to
        sit with a single ROM for ten minutes without standing
        anything up.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        A note on the cores
      </h2>
      <p>
        Almost every project on this list is the same handful of
        libretro cores in a different wrapper. Nestopia and
        FCEUmm for NES, Snes9x and bsnes for SNES, Gambatte and
        SameBoy for Game Boy, mGBA for GBA, melonDS for DS,
        Genesis Plus GX for Mega Drive, PicoDrive for the Sega
        portables, Beetle PSX for PS1, Mupen64Plus-Next for N64,
        FBNeo and MAME for arcade. The cores are libretro
        upstream; the wrappers are EmulatorJS, RetroArch Web
        Player, Eclipse&rsquo;s in-house integration, and the
        rest. The studio cites this so that a reader can connect
        the bench-side and the browser-side coverage: the same
        Nestopia compiled native is what runs the desktop
        RetroArch NES session, and the same Nestopia compiled
        with Emscripten is what runs the browser tab. The work
        the libretro project does upstream is the work the
        whole genre stands on. That lineage is the one written
        up in{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          On the Shoulders of Open Source
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        A note on what the browser cannot do
      </h2>
      <p>
        The browser tab is a constrained machine. The
        Dreamcast, the PlayStation 2, the GameCube, the Wii, and
        anything later cannot reasonably run in real time inside
        a browser tab on commodity hardware in 2026; the cores
        exist as native builds (Flycast for Dreamcast, PCSX2 for
        PS2, Dolphin for GameCube and Wii, and so on), but the
        Emscripten ports of those cores either do not exist or
        do not run faster than a slideshow. The desktop tutorial
        siblings cover those systems specifically:{" "}
        <Link
          href="/articles/emulator-tutorial-dolphin"
          className={ext}
        >
          emulator-tutorial-dolphin
        </Link>{" "}
        for GameCube and Wii,{" "}
        <Link href="/articles/emulator-tutorial-pcsx2" className={ext}>
          emulator-tutorial-pcsx2
        </Link>{" "}
        for PS2,{" "}
        <Link href="/articles/emulator-tutorial-mame" className={ext}>
          emulator-tutorial-mame
        </Link>{" "}
        for arcade, and{" "}
        <Link href="/articles/emulator-tutorial-mesen" className={ext}>
          emulator-tutorial-mesen
        </Link>{" "}
        for the accuracy-first NES bench. The browser route is
        for the systems whose cycle budgets fit in a tab. That
        line is approximately fifth-generation-and-earlier today;
        it will move forward as WebAssembly gains threads, SIMD,
        and the rest of the parity work with native, but for now
        the article above describes where the line sits.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        A note on the ROM situation, again
      </h2>
      <p>
        The studio dumps its own cartridges &mdash; the procedure
        is in{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          the emulation stack article
        </Link>{" "}
        and the position is set out at length in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          what the studio won&rsquo;t do
        </Link>
        . This article does not point to ROM mirrors, BIOS
        repositories, or piracy portals; none of them appear in
        the prose, none of them are listed in the further-reading
        block, and the studio&rsquo;s{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        route enforces the same line in code by accepting only
        user-supplied files. The studio&rsquo;s in-browser
        emulator is a tab into which you bring your own work.
        That is the whole contract.
      </p>

      <p>
        Cross-reads &mdash;{" "}
        <Link
          href="/articles/emulation-as-a-creative-tool"
          className={ext}
        >
          Emulation as a Creative Tool
        </Link>{" "}
        for the method,{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>{" "}
        for the desktop bench, and the tutorial-series siblings
        for system-specific walkthroughs:{" "}
        <Link
          href="/articles/emulator-tutorial-retroarch"
          className={ext}
        >
          RetroArch
        </Link>
        ,{" "}
        <Link href="/articles/emulator-tutorial-mesen" className={ext}>
          Mesen
        </Link>
        ,{" "}
        <Link
          href="/articles/emulator-tutorial-dolphin"
          className={ext}
        >
          Dolphin
        </Link>
        ,{" "}
        <Link href="/articles/emulator-tutorial-mame" className={ext}>
          MAME
        </Link>
        ,{" "}
        <Link href="/articles/emulator-tutorial-pcsx2" className={ext}>
          PCSX2
        </Link>
        , and{" "}
        <Link
          href="/articles/emulator-tutorial-dosbox-x"
          className={ext}
        >
          DOSBox-X
        </Link>
        . The studio&rsquo;s own browser surface is the route at{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        &mdash; this article is the reading list for it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources &amp; further reading
      </h2>

      <p className="text-sm text-chrome-400">
        Grouped by domain, in the studio&rsquo;s usual footnote
        convention.
      </p>

      <ul className="mt-4 list-none space-y-2 pl-0">
        <li>
          <strong>emulatorjs.org</strong> &mdash;{" "}
          <a
            href="https://emulatorjs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            project site{arrow}
          </a>
          ,{" "}
          <a
            href="https://github.com/EmulatorJS/EmulatorJS"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GitHub{arrow}
          </a>
          .
        </li>
        <li>
          <strong>libretro.com</strong> &mdash;{" "}
          <a
            href="https://web.libretro.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            RetroArch Web Player{arrow}
          </a>
          ,{" "}
          <a
            href="https://www.libretro.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            project root{arrow}
          </a>
          ,{" "}
          <a
            href="https://docs.libretro.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            documentation{arrow}
          </a>
          .
        </li>
        <li>
          <strong>eclipseemu.me</strong> &mdash;{" "}
          <a
            href="https://eclipseemu.me/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            project site{arrow}
          </a>
          .
        </li>
        <li>
          <strong>vaporboy.net</strong> &mdash;{" "}
          <a
            href="https://vaporboy.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            project site{arrow}
          </a>
          .
        </li>
        <li>
          <strong>github.com</strong> &mdash;{" "}
          <a
            href="https://github.com/torch2424/wasmboy"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            WasmBoy{arrow}
          </a>
          ,{" "}
          <a
            href="https://github.com/bfirsh/jsnes"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            JSNES{arrow}
          </a>
          .
        </li>
        <li>
          <strong>jsnes.fancrew.org</strong> &mdash;{" "}
          <a
            href="https://jsnes.fancrew.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            hosted demo{arrow}
          </a>
          .
        </li>
        <li>
          <strong>js-dos.com</strong> &mdash;{" "}
          <a
            href="https://js-dos.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            project site{arrow}
          </a>
          .
        </li>
        <li>
          <strong>archive.org</strong> &mdash;{" "}
          <a
            href="https://archive.org/details/consolelivingroom"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Console Living Room{arrow}
          </a>
          ,{" "}
          <a
            href="https://archive.org/details/softwarelibrary_msdos_games"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            MS-DOS Games library{arrow}
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: "byo-rom-browser-emulators",
  title:
    "BYO-ROM Browser Emulators — the libraries and sites that run your dumps in a tab",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Companion essay to the studio's /emulator route. A by-tool walk through EmulatorJS, RetroArch Web Player, Eclipse, vaporBoy, WasmBoy, JSNES, js-dos, and the Internet Archive's Console Living Room — every project that runs a ROM you brought, in a browser tab, without uploading it anywhere.",
  Body: ByoRomBrowserEmulators,
  related: [
    {
      href: "/emulator",
      label: "/emulator — the studio's own browser route",
      note: "EmulatorJS underneath, the studio's chrome-and-pink layer on top.",
    },
    {
      href: "/articles/emulation-as-a-creative-tool",
      label: "Emulation as a Creative Tool",
      note: "The method behind the whole emulation strand.",
    },
    {
      href: "/articles/the-emulation-stack-for-creative-research",
      label: "The Emulation Stack for Creative Research",
      note: "The desktop bench — the sibling to this browser piece.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "Including the line on dumping your own carts.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The libretro lineage every project here belongs to.",
    },
    {
      href: "/articles/emulator-tutorial-retroarch",
      label: "Tutorial — RetroArch",
      note: "The desktop counterpart to the Web Player.",
    },
    {
      href: "/articles/emulator-tutorial-mesen",
      label: "Tutorial — Mesen",
      note: "Accuracy-first NES bench.",
    },
    {
      href: "/articles/emulator-tutorial-dolphin",
      label: "Tutorial — Dolphin",
      note: "GameCube and Wii — beyond the browser line.",
    },
    {
      href: "/articles/emulator-tutorial-mame",
      label: "Tutorial — MAME",
      note: "Arcade preservation, desktop.",
    },
    {
      href: "/articles/emulator-tutorial-pcsx2",
      label: "Tutorial — PCSX2",
      note: "PlayStation 2, desktop.",
    },
    {
      href: "/articles/emulator-tutorial-dosbox-x",
      label: "Tutorial — DOSBox-X",
      note: "The desktop counterpart to js-dos.",
    },
  ],
  furtherReading: [
    {
      href: "https://emulatorjs.org/",
      label: "EmulatorJS",
      note: "Canonical multi-system browser library. The studio's /emulator route uses it.",
    },
    {
      href: "https://github.com/EmulatorJS/EmulatorJS",
      label: "EmulatorJS — source",
      note: "GPL-licensed, on GitHub.",
    },
    {
      href: "https://web.libretro.com/",
      label: "RetroArch Web Player",
      note: "Upstream's own in-browser build.",
    },
    {
      href: "https://eclipseemu.me/",
      label: "Eclipse",
      note: "Nintendo handheld focus — DS, GBA, GBC, GB.",
    },
    {
      href: "https://vaporboy.net/",
      label: "vaporBoy",
      note: "Single-system Game Boy / GBC PWA.",
    },
    {
      href: "https://github.com/torch2424/wasmboy",
      label: "WasmBoy",
      note: "Game Boy emulator as an embeddable WASM library.",
    },
    {
      href: "https://jsnes.fancrew.org/",
      label: "JSNES — demo",
      note: "Pure-JavaScript NES emulator, hosted.",
    },
    {
      href: "https://github.com/bfirsh/jsnes",
      label: "JSNES — source",
      note: "The readable-source NES emulator.",
    },
    {
      href: "https://js-dos.com/",
      label: "js-dos",
      note: "DOSBox / DOSBox-X in WebAssembly.",
    },
    {
      href: "https://archive.org/details/consolelivingroom",
      label: "Console Living Room",
      note: "Internet Archive's curated in-browser console library.",
    },
    {
      href: "https://archive.org/details/softwarelibrary_msdos_games",
      label: "Internet Archive — MS-DOS Games",
      note: "The js-dos-powered companion to the Console Living Room.",
    },
  ],
};
