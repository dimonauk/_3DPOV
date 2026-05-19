import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulatorTutorialMesen() {
  return (
    <>
      <p>
        Mesen is the microscope. If RetroArch is the loom that holds
        many threads, Mesen is the single lens through which the
        studio looks at one thread &mdash; the NES, the SNES, the Game
        Boy line, the Game Gear, the PC Engine &mdash; and reads it
        bit by bit. Tonight: a clean install on the workshop machine,
        a first launch, a homebrew cartridge load, and a tour of the
        debugger because the debugger is the reason Mesen earns its
        place on this bench. Read alongside the broader piece on{" "}
        <Link href="/articles/emulation-as-a-creative-tool" className={ext}>
          Emulation as a Creative Tool
        </Link>{" "}
        and the stack overview at{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">What it is, in one sentence</h2>
      <p>
        <a
          href="https://www.mesen.ca/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mesen{arrow}
        </a>{" "}
        is a bit-exact emulator of the NES, SNES, Game Boy / Game Boy
        Color, Game Gear, Master System and PC Engine, with an
        integrated debugger that turns the emulator into a teaching
        instrument for tile-based art.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Install &mdash; tonight, the workshop machine</h2>
      <p>
        The workshop machine is the bench-side desktop, not the
        laptop. Mesen is not on winget at the time of writing; the
        install path is direct download. Browse to{" "}
        <a
          href="https://www.mesen.ca/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mesen.ca{arrow}
        </a>
        , grab the latest Mesen 2 build, unzip the archive into
        <code> D:\emulation\mesen\</code>. There is no installer; the
        binary runs from the unzipped folder. The studio prefers this
        for the workshop because the program is now self-contained
        and travels by folder &mdash; copy the folder to a different
        machine and everything goes with it, settings included.
      </p>
      <p>
        First-launch detail: on Windows, the .NET 6 desktop runtime
        is a hard prerequisite for Mesen 2. If the program will not
        open, the missing-component dialog points at the right
        Microsoft download page. Install that, restart, and the
        emulator opens.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">First-run walkthrough</h2>
      <p>
        Mesen opens to a clean window with a system-tabbed sidebar
        on the left and the framebuffer placeholder in the centre.
        First thing: <em>Settings &rarr; Preferences &rarr; General</em>;
        change the data path from the default <code>Documents\Mesen2</code>{" "}
        to a project folder. The studio puts saves, save-states,
        screenshots and recordings under <code>D:\emulation\mesen-data\</code>{" "}
        so the workshop machine&rsquo;s C drive stays clean.
      </p>
      <p>
        Drop a homebrew NES ROM the studio owns into the project
        folder &mdash; tonight it is a recent itch.io release that
        the developer&rsquo;s readme explicitly permits reference
        use of. <em>File &rarr; Open</em>, pick the file, the game
        boots. The bottom-left corner shows the running cycle count,
        the frame count, and the current scanline. None of this is
        cosmetic; the scanline counter is what makes Mesen the
        instrument it is.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Controller setup</h2>
      <p>
        <em>Settings &rarr; Input</em>. The Xbox-style pad maps to
        Player 1 automatically on plug-in; the 8BitDo Pro 2 in
        Switch mode needs a manual pass through the bind dialog.
        Pick the button, press the button, repeat. After the third
        controller-mapping attempt the studio writes the binds to
        the JSON config in the data folder and commits the file to
        the project repo; from then on the workshop&rsquo;s
        controller mapping is the same on any machine the studio
        runs Mesen on.
      </p>
      <p>
        The frame-step key the studio binds early: tick the
        <em> Pause / Resume</em> and <em>Run Single Frame</em>
        hotkeys to keys near each other on the keyboard
        (P and bracket-right, by default the studio&rsquo;s
        muscle memory). The save-state slot hotkeys are F1
        through F10 to load and Shift-F1 through Shift-F10 to
        save; ten bookmarks per session is the studio&rsquo;s
        upper bound and ten slots is the upper bound the
        emulator offers, which is a happy coincidence.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The capture workflow</h2>
      <p>
        F12 takes a screenshot of the current framebuffer at native
        resolution &mdash; 256 by 240 for the NES, 256 by 224 for
        the standard SNES mode, 160 by 144 for the Game Boy. No
        shader, no filter, no scaling. The PNG lands in the
        screenshots folder.
      </p>
      <p>
        For a sequence: pause, frame-step forward, screenshot, frame-
        step forward, screenshot. The studio runs a short PowerShell
        loop that watches the screenshots folder, renames each new
        file with the frame number, and copies it into the working
        project. Sixteen frames is roughly a quarter of an NTSC
        second; that is enough for an animation cycle study most of
        the time.
      </p>
      <p>
        For video output: <em>Tools &rarr; Movie Recording</em>
        writes a Mesen-format MMO file that can be replayed
        deterministically, then exported through the same menu as a
        sequence of PNGs or an AVI. The deterministic replay is the
        bit that matters &mdash; a recorded movie plays back
        identically every time, frame for frame, so the captured
        sequence is reproducible.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The debugger as a teaching tool</h2>
      <p>
        This is why Mesen earns its place. <em>Debug &rarr; PPU
        Viewer</em> opens a window with five panels:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li><em>Nametable Viewer</em> &mdash; the four 32-by-30 tile
          grids that compose the NES&rsquo;s scrolling background.
          What the eye reads as a continuous landscape is, here,
          obviously four screens of tile data sliced into a wraparound.
        </li>
        <li><em>CHR Viewer</em> &mdash; the entire character-pattern
          memory laid out as a tile grid the artist can stare at.
          Sprites, backgrounds, font glyphs, all the eight-by-eight
          cells the game has loaded into the PPU. Hovering over a
          tile shows its index; right-click exports the tile or the
          whole sheet as a PNG.
        </li>
        <li><em>Palette Viewer</em> &mdash; the four background
          palettes and four sprite palettes; sixteen entries each,
          one of them transparent. The artist can copy the exact
          colour values out as hex and paste them straight into
          Aseprite as the working palette for the piece in progress.
        </li>
        <li><em>Sprite Viewer</em> &mdash; the sixty-four sprite
          slots the PPU has active this frame. Position, attributes,
          which palette each one uses. The eight-per-scanline limit
          becomes visible; sprites at the back of the queue flicker
          because the PPU drops them when the line is full.
        </li>
        <li><em>OAM Viewer</em> &mdash; the sprite memory layout
          directly. Lower-level than the sprite viewer; the artist
          mostly only opens this for the rare debugging session.
        </li>
      </ul>
      <p>
        The studio uses the PPU viewer not to debug but to read.
        The cycle of <em>Mega Man 2</em>&rsquo;s walk animation is
        four tiles arranged across two frames; the CHR viewer shows
        the four tiles and the artist sees how the artist of 1988
        sequenced them. The palette viewer surfaces the exact four
        colours; the artist can match them in a new piece. The
        nametable viewer shows how the background tiles repeat with
        attribute-block colour variation; the artist learns the
        rhythm of an NES background.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Sprite-sheet ripping</h2>
      <p>
        Three routes the studio uses, in order of cleanness:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li>From the CHR viewer, right-click the sheet and export as
          PNG. The cleanest path; gives the whole pattern memory
          laid out by the artist of 1988.
        </li>
        <li>From the game window: disable the background layer via
          <em> Debug &rarr; Options &rarr; Show Sprites Only</em>.
          The sprites read against a flat backdrop colour the studio
          can mask out in Aseprite.
        </li>
        <li>From a movie recording: export the frames, drop them in
          a pixel-art editor, isolate the sprite by hand. The slow
          path; the studio reaches for it when the question is
          animation timing rather than tile content.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">BIOS situation</h2>
      <p>
        Most of Mesen&rsquo;s systems are BIOS-free: NES, SNES,
        Game Gear, Master System, PC Engine. The Game Boy line is
        BIOS-optional &mdash; Mesen will run without the original
        boot ROM, falling back to a stub that skips the boot
        animation. If the artist wants the Nintendo splash and the
        DMG&rsquo;s genuine boot palette resolution, the boot ROM
        has to be dumped from your own Game Boy hardware; the
        relevant procedure is documented at the homebrew sites for
        the system and the studio is not going to link you to a
        precompiled dump. Dump your own. The procedure is well
        within an evening&rsquo;s work with a flashcart.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The studio&rsquo;s everyday use</h2>
      <p>
        Two reaches the studio makes most weeks. First: the
        palette extraction. A piece is in progress for the LED rig;
        the studio knows what feeling it wants; the studio opens
        the relevant NES game, runs to a scene that matches, opens
        the palette viewer, copies the four background palettes
        out as hex, and pastes them into the working Aseprite file
        as the constraint. The piece is then made inside that
        palette. The constraint is doing the work, and the
        constraint came from the artist of 1988 whose decisions the
        studio is currently learning from.
      </p>
      <p>
        Second: animation-cycle study. A walk cycle, a jump arc,
        the swing of a tail. Frame-step through the cycle, capture
        every frame, lay them out in a contact-sheet PNG. Read the
        cycle as a sequence of poses; build the new piece&rsquo;s
        animation against the same pose count and the same timing.
        Mesen&rsquo;s frame counter is what makes this clean; the
        studio knows it captured frame 14 of the cycle rather than
        guessing.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Honest verdict</h2>
      <p>
        Good at: accuracy, the PPU debugger, palette extraction,
        sprite-sheet ripping, deterministic movie capture, low-fuss
        single-system focus. The accuracy bar Sour set on the
        original NES core carries through to the other systems; the
        speedrun community treats Mesen-2 as a reference.
      </p>
      <p>
        No good at: the systems it does not cover (anything PS1 or
        later, anything 3D, anything arcade), and the front-end UX
        relative to RetroArch. Mesen&rsquo;s menu is excellent
        compared to most accuracy-first emulators but it is one
        emulator&rsquo;s menu, not a normalised front-end for ten.
        If the studio is reading across systems, RetroArch is the
        right tool; for a single-system deep dive, Mesen is the
        right tool. The two coexist on the bench for a reason.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A small benediction</h2>
      <p>
        The PPU viewer is the gift the project gave the world. The
        artist who learns to read it has a microscope onto a thirty-
        five-year design tradition; the colours, the tile rhythms,
        the eight-per-scanline budget that shaped sprite stacking.
        Sit with it for an hour with a homebrew ROM you own, and
        the next pixel-art piece on the bench will read differently.
        For the other systems in the bench, the sister tutorials are
        listed below.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulator-tutorial-mesen",
  title: "Emulator Tutorial &mdash; Mesen",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Field-notes from one evening installing Mesen 2 on the workshop machine, loading a homebrew NES ROM the studio owns, and taking the PPU debugger apart as a teaching tool for tile-based art. The accuracy-first counterpart to RetroArch.",
  Body: EmulatorTutorialMesen,
  related: [
    {
      href: "/articles/emulation-as-a-creative-tool",
      label: "Emulation as a Creative Tool",
      note: "The method behind the bench.",
    },
    {
      href: "/articles/the-emulation-stack-for-creative-research",
      label: "The Emulation Stack for Creative Research",
      note: "The full stack overview.",
    },
    {
      href: "/articles/emulator-tutorial-retroarch",
      label: "Emulator Tutorial &mdash; RetroArch",
      note: "The multi-system front-end on the same bench.",
    },
    {
      href: "/articles/emulator-tutorial-dolphin",
      label: "Emulator Tutorial &mdash; Dolphin",
      note: "GameCube and Wii.",
    },
    {
      href: "/articles/emulator-tutorial-mame",
      label: "Emulator Tutorial &mdash; MAME",
      note: "Arcade preservation.",
    },
    {
      href: "/articles/emulator-tutorial-pcsx2",
      label: "Emulator Tutorial &mdash; PCSX2",
      note: "PlayStation 2.",
    },
    {
      href: "/articles/emulator-tutorial-dosbox-x",
      label: "Emulator Tutorial &mdash; DOSBox-X",
      note: "DOS-era PC art.",
    },
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "The four-palette discipline as a working tool.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Sprite morphing as a pre-shader precursor.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Sour's lineage on the free-code ladder.",
    },
    {
      href: "/articles/whos-who-uk-pixel-artists",
      label: "Who's Who &mdash; UK Pixel Artists",
      note: "The scene the captured frames feed back into.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.mesen.ca/",
      label: "Mesen &mdash; official site",
      note: "Downloads, changelogs, and the debugger documentation.",
    },
    {
      href: "https://www.mesen.ca/docs/",
      label: "Mesen docs",
      note: "The PPU viewer chapter is the one to read first.",
    },
    {
      href: "https://datomatic.no-intro.org/",
      label: "No-Intro",
      note: "Cartridge ROM verification database.",
    },
  ],
};
