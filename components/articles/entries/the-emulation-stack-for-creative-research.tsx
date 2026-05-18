import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheEmulationStackForCreativeResearch() {
  return (
    <>
      <p>
        The companion to{" "}
        <Link href="/articles/emulation-as-a-creative-tool" className={ext}>
          Emulation as a Creative Tool
        </Link>
        . That article walked the vocabulary; this one walks the
        bench. Each section is one piece of software, named first,
        with what it does, where to download it, what the studio
        uses it for, and the honest verdict including the gotchas
        the studio has hit. The order is roughly daily-driver
        first, accuracy-purist second, then by system, then the
        non-emulator tools that earn their place in the stack.
        Throughout: the studio dumps its own cartridges and
        verifies against No-Intro / Redump. The ethics chapter
        lives in the sibling article and is not re-litigated here.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">RetroArch</h2>
      <p>
        <a
          href="https://www.retroarch.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          retroarch.com{arrow}
        </a>{" "}
        &mdash; a multi-system front-end that wraps individual
        emulators (called &ldquo;cores&rdquo;) in a common API,
        common controller mapping, common shader stack, common
        save-state path. One install, dozens of consoles. Windows
        install via <code>winget install Libretro.RetroArch</code>{" "}
        is the cleanest path; the in-app online updater pulls
        cores after first launch. The studio uses it as the
        daily driver because the workflow is the same regardless
        of system: load core, load content, play, dump frame.
        Honest verdict: the learning curve is steep on first
        contact. The settings menu is fractal &mdash; configuration
        is per-core, per-content, per-folder, and the override
        priority is documented in the wiki but not in the UI.
        Spend an hour on the {" "}
        <a
          href="https://docs.libretro.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          docs.libretro.com{arrow}
        </a>{" "}
        guide before doing anything serious. Gotcha: the default
        save-state path is buried deep in <code>%APPDATA%</code> on
        Windows; the studio reassigns it to a project folder so
        the states travel with the work.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Mesen / Mesen-X</h2>
      <p>
        <a
          href="https://www.mesen.ca/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mesen.ca{arrow}
        </a>{" "}
        &mdash; bit-exact emulation of the NES, SNES, Game Boy,
        Game Boy Color, Game Gear, Master System and PC Engine.
        Originally Sour&rsquo;s NES-only project; the rewrite
        (sometimes labelled Mesen 2 or Mesen-X depending on the
        fork) added the other systems and kept the accuracy bar.
        Direct download from the site; no installer, drop the
        folder somewhere and run the executable. The studio uses
        Mesen when accuracy matters &mdash; sprite-by-sprite frame
        study, reference capture for a pixel-art piece, anything
        where the answer to &ldquo;is the image the artist
        intended?&rdquo; needs to be yes. The built-in debugger
        is the second reason: the PPU viewer shows every tile in
        CHR RAM, every palette, every sprite-attribute byte, with
        the screen highlighted to show what is on display this
        frame. It is a tile-art microscope. Gotcha: Game Boy
        Color colour-correction is off by default; turn it on
        (Settings &rarr; Video &rarr; GBC palette) or the captures
        will read with the wrong saturation curve.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Mednafen</h2>
      <p>
        <a
          href="https://mednafen.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mednafen.github.io{arrow}
        </a>{" "}
        &mdash; the academic-grade multi-system emulator, CLI-first,
        configuration by editing a text file. Supports the NES,
        SNES, Game Boy, GBA, PC Engine, Saturn, PS1, Neo Geo
        Pocket, WonderSwan, Lynx and a handful more. Distributed
        as a Windows binary from the site; drop into a folder
        and call it from a terminal. The studio uses it for
        batch capture: a shell script that loads a ROM, advances
        to a save state, dumps the next two hundred frames as
        PNG, and exits. The cores are nearly as accurate as
        Mesen and considerably more accurate than most of what
        ships in RetroArch by default; in fact, RetroArch&rsquo;s
        most accurate PS1 core (Beetle PSX) is a fork of
        Mednafen. Honest verdict: no GUI, no hand-holding, no
        controller-mapping wizard. If a terminal is not your
        tool, this is not your emulator. Gotcha: the configuration
        file lives in <code>%APPDATA%\.mednafen\</code> on Windows;
        if a setting will not stick, edit the file directly rather
        than fighting the CLI flags.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Dolphin</h2>
      <p>
        <a
          href="https://dolphin-emu.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dolphin-emu.org{arrow}
        </a>{" "}
        &mdash; the GameCube and Wii emulator. Mature, well-maintained,
        with one of the best open-source emulator codebases on the
        internet (the project publishes a monthly progress report
        that is itself a piece of writing). Windows install via{" "}
        <code>winget install DolphinEmulator.Dolphin</code>. The
        studio reaches for Dolphin for two specific reasons: <em>
        texture dumping</em>, which writes every texture the GPU
        ever touches into a folder as the game runs, and which is
        a sprite-sheet extraction tool for the entire generation
        of GameCube and Wii art; and the <em>AR camera</em>, which
        lets the studio fly through a 3D scene from any angle and
        capture frames the original game never composed. The
        camera turns the emulator into a virtual photography
        studio inside an old game world. Gotcha: texture dump
        produces enormous folders &mdash; tens of thousands of
        files for a long session. Set the dump path on an SSD with
        room, and prune as you go.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">PCSX2</h2>
      <p>
        <a
          href="https://pcsx2.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pcsx2.net{arrow}
        </a>{" "}
        &mdash; the PlayStation 2 emulator. Long history (started
        in 2002); the current QT-based build is excellent. Windows
        install via the official installer from the site (winget
        ships a slightly old build at time of writing).
        BIOS-required, and the BIOS is licence-encumbered; the
        studio dumps it from its own PS2 using the FreeMcBoot path
        documented in the PCSX2 wiki. The studio uses PCSX2 to
        study the visual languages of the late PS2 era &mdash; the
        cel-shading of <em>Killer7</em>, the texture filtering
        approach in <em>Shadow of the Colossus</em>, the
        deferred-shading tricks that early-2000s console graphics
        programmers used to fake what the hardware could not yet
        do. Frame dump goes through the GS dumper to a binary
        format the emulator can replay; for stills the screenshot
        hotkey is sufficient. Gotcha: shader-cache regenerates on
        every driver update and can stutter the first run of a
        session badly; pre-compile the shader cache via the
        in-app option if a clean run is needed.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">MAME</h2>
      <p>
        <a
          href="https://www.mamedev.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mamedev.org{arrow}
        </a>{" "}
        &mdash; the Multiple Arcade Machine Emulator. The single
        most important piece of historical-preservation software
        the games industry has produced, and one of the great
        open-source projects of the century. Twenty-five years of
        cabinets, daughterboards, dedicated machines, mechanical
        electromechanical hardware, pinball tables &mdash; all
        documented and emulated, with extensive notes on what is
        accurate, what is approximated, and what is still missing.
        Windows install via direct download from the site;
        front-end install (the studio uses the official QT-based
        build) optional but recommended. ROM situation is the
        thorniest in emulation: most arcade ROMs are still under
        copyright, a handful have been formally released by their
        rights holders, and MAME&rsquo;s legal-clean way to use
        the project is to read the documentation and look at the
        photographs &mdash; which, for the studio&rsquo;s
        reference-research purposes, is most of the value. The
        project is also a research lineage in its own right; it
        is mentioned in{" "}
        <Link href="/articles/lineage-marey-to-now" className={ext}>
          Lineage: Marey to Now
        </Link>{" "}
        as the form of frame-by-frame archaeology that began with
        Marey&rsquo;s photographic gun and ended up modelling
        Z80s. Gotcha: configuration is per-machine, and the file
        naming convention follows MAME&rsquo;s own scheme rather
        than any common-sense one. The wiki is mandatory reading.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">PPSSPP</h2>
      <p>
        <a
          href="https://www.ppsspp.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ppsspp.org{arrow}
        </a>{" "}
        &mdash; the PlayStation Portable emulator, by Henrik
        Rydg&aring;rd. Windows install via{" "}
        <code>winget install PPSSPPTeam.PPSSPP</code>. The PSP is
        worth the studio&rsquo;s time for its <em>texture
        replacement</em> pipeline: PPSSPP can dump every texture
        the game asks for and replace each one with a hand-painted
        high-resolution version, then re-render the game with the
        replacements live. The community has produced extensive
        replacement packs (mostly for games whose rights-holders
        tolerate it); the technique is a working method for
        studying how a tiny texture composes into an upscaled
        frame. Gotcha: the texture-replacement folder structure
        is specific; read the wiki page on it before dumping or
        the replacements will not match back up.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">DOSBox / DOSBox-X</h2>
      <p>
        <a
          href="https://www.dosbox.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dosbox.com{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://dosbox-x.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dosbox-x.com{arrow}
        </a>{" "}
        &mdash; emulation of the DOS-era PC. Original DOSBox is
        the long-standing project; DOSBox-X is a fork with
        broader hardware support, more video modes, and a more
        active development pace. The studio prefers DOSBox-X for
        period-PC art research: EGA&rsquo;s sixteen-out-of-sixty-four
        palette, VGA&rsquo;s 256-colour Mode 13h with the famous
        320-by-200 framebuffer that made <em>Pinball Fantasies</em>{" "}
        and <em>Prince of Persia</em> look the way they did, the
        Sierra and LucasArts adventure palettes. Windows install
        via winget for vanilla DOSBox; direct download for
        DOSBox-X. Both ship configuration as a plain text file
        per profile. Gotcha: getting the period-correct sound
        chip is non-obvious &mdash; the studio runs an SB16
        configuration as default, but Adlib-only and OPL3 are
        worth keeping around for the games that composed for
        them specifically.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">ScummVM</h2>
      <p>
        <a
          href="https://www.scummvm.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          scummvm.org{arrow}
        </a>{" "}
        &mdash; a re-implementation of the engines behind the
        classic point-and-click adventure games: SCUMM (the
        LucasArts engine, hence the name), AGI and SCI (the
        Sierra engines), Mohawk (Myst, Riven), and dozens more.
        Windows install via{" "}
        <code>winget install ScummVM.ScummVM</code>. Not an
        emulator in the strict sense &mdash; it re-implements the
        interpreter rather than the hardware &mdash; but the
        practical effect is the same: a folder of original
        game data files plays on a modern machine. The studio
        loves ScummVM as a pixel-art reference goldmine; the
        VGA-era LucasArts and Sierra games are a master class in
        tile-based-but-painterly composition, hand-drawn animation
        cycles, and palette management under the 256-colour
        ceiling. ScummVM&rsquo;s house policy on game data is
        the cleanest in emulation: it asks you to buy the
        original game, points to GOG and similar legal-clean
        distributors, and refuses to host or link to the data
        files itself. Gotcha: filter settings (the smoothing
        applied to scaled output) overwrite the original pixels;
        for capture, set the filter to <em>None</em> and let the
        framebuffer come out at native size.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">86Box</h2>
      <p>
        <a
          href="https://86box.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          86box.net{arrow}
        </a>{" "}
        &mdash; period-accurate IBM PC and clone emulation. Where
        DOSBox-X emulates a generic period PC, 86Box emulates
        specific machines &mdash; this particular IBM PS/2 model,
        this particular Compaq portable, this particular Tandy
        1000 &mdash; with the actual ROMs, the actual video
        cards, the actual sound cards. The studio mostly does
        not need this; for reference research, DOSBox-X is the
        right tool. Honest verdict: 86Box is probably overkill
        unless the project is specifically about the texture
        of a single machine&rsquo;s output (which the studio has
        on occasion been; this is why the project knows the
        program exists). Windows install via direct download.
        ROM dependencies are heavy &mdash; BIOSes for each
        machine model, video card firmwares, the lot. Setup is
        a weekend.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Aseprite</h2>
      <p>
        <a
          href="https://www.aseprite.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          aseprite.org{arrow}
        </a>{" "}
        &mdash; not an emulator; the natural next stop. Aseprite
        is the pixel-art tool the studio uses when a reference
        frame has been captured and the work moves to making
        something new. Paid (one-off licence, source available
        under a custom non-commercial licence). Windows install
        via the Steam build, the itch.io build, or the source
        compile from GitHub; the studio runs the Steam build for
        convenience and the source build on the workshop machine
        for stability. The reason it earns its place in this
        article: every emulator screenshot the studio captures
        gets opened in Aseprite first, the palette is extracted,
        and the artist then works inside the same colour space
        as the original frame. Sister tool: Pixelorama (open
        source, free,{" "}
        <a
          href="https://www.orama-interactive.com/pixelorama"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          orama-interactive.com{arrow}
        </a>
        ) &mdash; the studio also keeps Pixelorama on the bench
        for collaborators who would rather not buy Aseprite.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">YY-CHR &amp; Tiled</h2>
      <p>
        Two tile editors, used for two different reasons.{" "}
        <a
          href="https://www.romhacking.net/utilities/119/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          YY-CHR{arrow}
        </a>{" "}
        is the venerable ROM-hacking tile editor; it opens an
        NES, SNES, Game Boy or Game Gear ROM directly and shows
        the CHR data as a tile grid the artist can read. It is
        the tool the studio uses to study the tile-and-palette
        composition of a sprite sheet inside the cartridge file
        itself. Windows-only; direct download from romhacking.net.{" "}
        <a
          href="https://www.mapeditor.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Tiled{arrow}
        </a>{" "}
        is the modern tile-map editor: open source, cross-platform,
        the de-facto tool for indie game tile-map authoring. The
        studio uses Tiled in the reverse direction &mdash; to lay
        out a new tile composition that borrows the constraint
        of the system it studied. Windows install via{" "}
        <code>winget install MapEditor.Tiled</code>. Gotcha (YY-CHR
        specifically): write protection is off by default;
        before opening a ROM you care about, copy the file first
        and operate on the copy.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">ExifTool &amp; FFmpeg</h2>
      <p>
        The two utility tools that finish the pipeline.{" "}
        <a
          href="https://exiftool.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ExifTool{arrow}
        </a>{" "}
        &mdash; Phil Harvey&rsquo;s perl program for reading and
        writing image metadata. The studio uses it to batch-tag
        captured frames with the source emulator, the source
        title, the capture date, the reference-only licence flag.
        Windows install via the standalone executable from the
        site, dropped into <code>C:\Windows</code> for path
        availability.{" "}
        <a
          href="https://ffmpeg.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          FFmpeg{arrow}
        </a>{" "}
        &mdash; the universal video toolkit. The studio uses it
        to assemble per-frame captures into MP4 or APNG
        animation reels, to slow them down for animation-cycle
        study, to letterbox or pillar-box the original aspect
        ratio when the destination surface is something
        non-standard. Windows install via{" "}
        <code>winget install Gyan.FFmpeg</code> (gyan.dev is
        the canonical Windows build).
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The order in practice</h2>
      <p>
        A working session reads like this. RetroArch or Mesen to
        load a ROM the studio owns and has verified against
        No-Intro. Save state at the moment of interest. Frame-step
        forward through the cycle, capturing the framebuffer at
        each frame. ExifTool tags the folder. FFmpeg assembles
        the reel; the artist scrubs it at a quarter speed. The
        palette is read &mdash; sometimes manually, sometimes
        through Aseprite&rsquo;s palette extractor. The new piece
        is built in Aseprite or Pixelorama against that palette.
        If the destination is an LED rig, the export goes through
        the studio&rsquo;s rig pipeline, treated separately in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>
        . If the destination is print, the export goes to{" "}
        <Link
          href="/articles/the-right-paper-for-a-light-painting"
          className={ext}
        >
          the right paper for the work
        </Link>
        . The stack above is the bench between the source
        cartridge and the finished piece.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A note on shaders</h2>
      <p>
        RetroArch&rsquo;s shader directory contains years of
        community work approximating CRT physics, NTSC encoding,
        scanline timing, dot-mask geometry. The studio leans on
        the <em>crt-royale</em> and <em>crt-guest</em> families
        for accuracy-first reference. For artistic flavour rather
        than physical fidelity, the <em>crt-easymode</em> and{" "}
        <em>crt-mattias</em> presets are lighter, cheaper, and
        often what a destination LED matrix can actually display
        once downsampled. Shaders live under{" "}
        <code>RetroArch\shaders\shaders_slang\</code> on the
        Vulkan/D3D builds and{" "}
        <code>shaders\shaders_glsl\</code> on the GL build;
        which one is active depends on which video driver
        RetroArch is using. Gotcha: shader changes save per-core
        or per-content depending on the override menu the artist
        used; the override-priority cheat-sheet on the docs site
        is the only reliable reference.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A note on controllers</h2>
      <p>
        Most of the studio&rsquo;s emulator work is keyboard-and-mouse
        because the work is reference, not play. When the
        installation runs an emulator live, an 8BitDo Pro 2 in
        Switch mode is the studio&rsquo;s standard pad; the
        Bluetooth pairing is the most reliable across both
        RetroArch and standalone emulators. Gotcha: Windows will
        sometimes claim an 8BitDo pad as multiple HID devices
        if both Bluetooth and the USB dongle are connected; pick
        one and disable the other in Device Manager.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A note on the ROM situation</h2>
      <p>
        The studio dumps its own cartridges using a Retrode 2 or
        an INL Retro Programmer-Dumper depending on the cart.
        Disc-based systems get ripped through the appropriate
        drive, verified against Redump, then archived offline.
        BIOSes are dumped from the original hardware too &mdash;
        the relevant procedures are documented at the project
        wikis for PCSX2, Dolphin, and the PSP scene. The studio
        does not host ROMs, BIOSes, or game data of any kind on
        its own site and does not point readers to sites that
        do. The position is the one set out in{" "}
        <Link href="/articles/emulation-as-a-creative-tool" className={ext}>
          the sibling article
        </Link>{" "}
        and in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          what the studio won&rsquo;t do
        </Link>
        : dump your own carts, support indie homebrew, respect
        the licence the rights-holder chose. The reward for
        doing it this way is a study collection the artist
        actually owns.
      </p>

      <p>
        Back to the method &mdash;{" "}
        <Link href="/articles/emulation-as-a-creative-tool" className={ext}>
          Emulation as a Creative Tool
        </Link>{" "}
        &mdash; for the why this stack exists; the parallel pair
        on a different practice is{" "}
        <Link href="/articles/osint-for-finding-your-people" className={ext}>
          OSINT for Finding Your People
        </Link>{" "}
        and{" "}
        <Link
          href="/articles/the-osint-stack-for-creative-research"
          className={ext}
        >
          The OSINT Stack for Creative Research
        </Link>{" "}
        (the latter forthcoming alongside this one). The studio
        practises both as one habit with two surfaces: <em>read
        the public record</em> applied once to people, once to
        machines.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "the-emulation-stack-for-creative-research",
  title: "The Emulation Stack for Creative Research",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "The tools the studio actually uses: RetroArch and Mesen on the bench, Mednafen for batch capture, Dolphin and PCSX2 for the later eras, MAME for the arcade lineage, plus the pixel-art and metadata utilities that finish the pipeline. Companion to the glossary-as-essay sibling.",
  Body: TheEmulationStackForCreativeResearch,
  related: [
    {
      href: "/articles/emulation-as-a-creative-tool",
      label: "Emulation as a Creative Tool",
      note: "The method behind this stack.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The free-code lineage every emulator on this list belongs to.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "The palette companion piece.",
    },
    {
      href: "/articles/lineage-marey-to-now",
      label: "Lineage: Marey to Now",
      note: "Frame-by-frame archaeology in the long view.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Sprite morphing as a pre-shader precursor.",
    },
    {
      href: "/articles/provenance-as-discipline",
      label: "Provenance as Discipline",
      note: "The discipline-of-evidence parallel, applied to images.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "Including the line on piracy.",
    },
    {
      href: "/articles/osint-for-finding-your-people",
      label: "OSINT for Finding Your People",
      note: "The sibling method piece.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.retroarch.com/",
      label: "RetroArch",
      note: "Multi-system front-end.",
    },
    {
      href: "https://www.mesen.ca/",
      label: "Mesen / Mesen-X",
      note: "Bit-exact NES / SNES / GB / GG / PCE.",
    },
    {
      href: "https://mednafen.github.io/",
      label: "Mednafen",
      note: "Academic-grade multi-system, CLI-first.",
    },
    {
      href: "https://dolphin-emu.org/",
      label: "Dolphin",
      note: "GameCube + Wii.",
    },
    {
      href: "https://pcsx2.net/",
      label: "PCSX2",
      note: "PlayStation 2.",
    },
    {
      href: "https://www.mamedev.org/",
      label: "MAME",
      note: "Arcade preservation.",
    },
    {
      href: "https://www.ppsspp.org/",
      label: "PPSSPP",
      note: "PlayStation Portable.",
    },
    {
      href: "https://dosbox-x.com/",
      label: "DOSBox-X",
      note: "Period DOS PC.",
    },
    {
      href: "https://www.scummvm.org/",
      label: "ScummVM",
      note: "Point-and-click adventure engines.",
    },
    {
      href: "https://www.aseprite.org/",
      label: "Aseprite",
      note: "Pixel art tool — the studio's daily driver.",
    },
    {
      href: "https://www.orama-interactive.com/pixelorama",
      label: "Pixelorama",
      note: "Open-source pixel-art tool.",
    },
    {
      href: "https://exiftool.org/",
      label: "ExifTool",
      note: "Image metadata read/write.",
    },
    {
      href: "https://ffmpeg.org/",
      label: "FFmpeg",
      note: "Universal video toolkit.",
    },
  ],
};
