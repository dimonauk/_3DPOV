import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulatorTutorialRetroArch() {
  return (
    <>
      <p>
        Of all the instruments on the studio&rsquo;s bench, RetroArch is
        the loom. It does not weave the cloth itself; it holds the
        threads of every other emulator in a frame so the artist can
        run them through one interface, one set of hotkeys, one
        controller mapping. The article below is a field-notes diary
        of one evening at the bench &mdash; installing it on a fresh
        Windows machine, getting a frame out of it, and writing down
        what the studio reaches for most weeks. Companion to{" "}
        <Link href="/articles/emulation-as-a-creative-tool" className={ext}>
          Emulation as a Creative Tool
        </Link>{" "}
        and the broader stack overview at{" "}
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
          href="https://www.retroarch.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          RetroArch{arrow}
        </a>{" "}
        is a multi-system front-end that wraps individual emulators
        (called <em>cores</em>) under the libretro API, so one
        install runs the NES, the SNES, the Game Boy line, the PS1,
        the PSP, and three dozen others with the same shader stack
        and the same controller config.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Install &mdash; evening, fresh laptop</h2>
      <p>
        A new ThinkPad lands on the bench; the only thing on it is
        Windows and Edge. PowerShell opens. The command is short:
      </p>
      <pre className="my-4 overflow-x-auto rounded border border-chrome-700/40 bg-chrome-900/40 p-4 text-sm text-chrome-200">
        <code>winget install Libretro.RetroArch</code>
      </pre>
      <p>
        Two minutes; the installer pulls the latest stable. The Steam
        version exists and works, but the winget build is the one the
        studio prefers because the install path stays where the
        studio puts it (<code>%LOCALAPPDATA%\Programs\RetroArch-Win64</code>{" "}
        by default) and not inside the Steam library where it
        mingles with games.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">First launch &mdash; the Online Updater</h2>
      <p>
        Launching RetroArch cold gives a black screen with a
        controller diagram and a single menu. The first stop is{" "}
        <em>Online Updater</em>. This is the workflow the studio
        wishes were the documented first-run path on the project
        site; it is buried, but it is the thing that turns a fresh
        install into a working bench.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li><em>Update Core Info Files</em> &mdash; do this first; the
          core info is what the menu uses to describe each emulator.
        </li>
        <li><em>Update Assets</em> &mdash; the menu&rsquo;s own UI
          assets (icons, fonts, the XMB Sony-derived menu look if you
          want it).
        </li>
        <li><em>Update Controller Profiles</em> &mdash; vital, since
          this is how the 8BitDo pad gets recognised on plug-in.
        </li>
        <li><em>Update Databases</em> &mdash; the No-Intro / Redump
          metadata that lets RetroArch identify a ROM it has not seen
          before.
        </li>
        <li><em>Update Slang Shaders</em> &mdash; the modern shader
          pack; CRT, NTSC, scanline, dot-mask. The studio runs the
          Vulkan video driver, so slang is the right format.
        </li>
      </ul>
      <p>
        Then back to the main menu, <em>Load Core</em>, <em>Download
        a Core</em>. The studio installs Nestopia UE for NES,
        Snes9x Current for SNES, Gambatte for Game Boy, Mesen-S as
        an alternative SNES core for the accuracy-first sessions,
        Beetle PSX HW for PS1, Mupen64Plus-Next for N64. The list
        is long; pick by system first and verdict second (the
        libretro docs grade cores on accuracy versus performance).
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Controller mapping</h2>
      <p>
        The 8BitDo Pro 2 in Switch mode lands as a known device on
        plug-in &mdash; the controller profile downloaded earlier is
        what makes that happen. If the pad goes in cold and nothing
        responds, the fix is{" "}
        <em>Settings &rarr; Input &rarr; Port 1 Controls &rarr; Set
        All Controls</em>; RetroArch will walk through every button
        in sequence and bind them. The studio also rebinds the
        <em>Hotkey Enable</em> key to one of the back paddles, which
        means that holding the paddle and pressing a face button
        triggers save state, frame step, screenshot, and so on
        without the keyboard. After the third controller-mapping
        attempt on a guest&rsquo;s machine the studio learned to
        write the binds down; the studio&rsquo;s defaults are now
        committed to a config in the project folder.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The save-state ritual</h2>
      <p>
        Save states are not a convenience here; they are how the
        artist marks the frame the study cares about. The studio&rsquo;s
        habit:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li>F1 &mdash; quick screenshot, drops a PNG of the framebuffer
          (no shader, no scaling) into the screenshots folder.
        </li>
        <li>F2 &mdash; save state to the current slot.
        </li>
        <li>F4 &mdash; load state from the current slot.
        </li>
        <li>F6 / F7 &mdash; cycle the slot, so the artist can keep ten
          named bookmarks of a session.
        </li>
        <li>K &mdash; frame advance. Pause first (P), then K advances
          one frame at a time.
        </li>
      </ul>
      <p>
        The save-state path itself defaults to{" "}
        <code>%APPDATA%\RetroArch\states\</code>, which is the gotcha
        the studio always forgets and finds again; the path
        is in <em>Settings &rarr; Directory &rarr; Savestate</em> and
        the studio reassigns it to the project folder so the states
        travel with the rest of the work.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Loading a ROM the studio owns</h2>
      <p>
        For tonight&rsquo;s session: a homebrew NES ROM the studio
        bought from the developer&rsquo;s own itch.io page. Drop the
        file in <code>D:\emulation\nes\</code>. From RetroArch:
        <em>Load Content</em>, navigate to the folder, pick the file,
        select Nestopia UE as the core. The game launches in a
        window; the studio runs full-screen via F11 once it is
        confirmed running. The studio dumps its own commercial
        cartridges using a Retrode 2 and verifies the dumps against
        the No-Intro database; the studio does not point readers to
        ROM-hosting sites and will not on request. The premise here
        is plain: you own the cart, you own the dump.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Capture workflow</h2>
      <p>
        F1 for a single frame; the file lands in the screenshots
        folder with a timestamp. For a sequence: pause, frame-step
        with K, screenshot with F1, repeat. Sixteen frames of an
        animation cycle is roughly half a second of game-time and
        fits on a single page in a sketchbook once printed.
      </p>
      <p>
        For sprite-sheet ripping the studio uses a different route
        &mdash; RetroArch&rsquo;s <em>Show Statistics</em> exposes
        the layer toggle on some cores (Mesen-S, for example).
        Disable the background layer; the sprites read against a
        flat colour, the screenshot goes straight into Aseprite or
        Pixelorama, and the artist splits the frame by hand. The
        flat-colour background is the easy mask for selection
        later.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The playlist pattern</h2>
      <p>
        RetroArch&rsquo;s <em>playlists</em> are a feature the studio
        ignored for two years and then could not work without.
        Scan a directory; RetroArch identifies every recognised ROM
        against the No-Intro database and builds a playlist file
        for that system. The XMB menu then groups everything by
        console with cover art (the thumbnail pack downloads
        separately under <em>Online Updater &rarr; Update
        Thumbnails</em>). It turns the bench into a library catalogue.
        For the studio this matters because most sessions start with
        &ldquo;the cycle in <em>that game</em>, on <em>that
        system</em>&rdquo; rather than with a file path; the playlist
        view collapses the hunt to a thumbnail-click.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Shaders, briefly</h2>
      <p>
        <em>Quick Menu &rarr; Shaders &rarr; Load Preset</em>, navigate
        to the slang shaders folder, pick a preset. For accuracy:
        <code>crt/crt-royale.slangp</code>. For something lighter
        that an installation LED matrix can actually display:
        <code>crt/crt-easymode.slangp</code>. The override priority
        is the gotcha &mdash; saving a shader as &ldquo;global&rdquo;
        applies it to every core, as &ldquo;core&rdquo; applies it
        to one emulator, as &ldquo;content&rdquo; applies it to one
        ROM. The studio almost always wants per-content; a CRT
        shader for a NES title is different from a CRT shader for a
        PS1 title.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">BIOS situation, honestly</h2>
      <p>
        Most of the cores RetroArch downloads run on cartridge
        systems where no BIOS is needed: NES, SNES, Mega Drive,
        Game Boy line, N64. The cores that <em>do</em> need firmware
        &mdash; PS1, PSP, Saturn, GBA (optional but worth having for
        the boot animation) &mdash; need it from your own console.
        The studio dumps the PS1 BIOS using Caetla on a chipped
        unit, the PSP firmware via the PSP&rsquo;s own filesystem
        access over USB, the GBA boot ROM via the standard
        hardware-dumping cable. The relevant procedures live at the
        homebrew project sites for each system. RetroArch will not
        download these for you, and the studio will not link to
        sites that do.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The studio&rsquo;s everyday use</h2>
      <p>
        Two things the studio reaches for almost weekly. First: a
        playlist session where the studio is reading across systems
        on a theme &mdash; how do four different consoles render a
        sunrise, say, given each one&rsquo;s palette and tile
        constraint. RetroArch is the only piece of software where
        that comparison sits at thumbnail level. Second: the
        Raspberry Pi build of RetroArch running on an installation
        rig, feeding a custom shader chain into an LED matrix at
        native resolution. The same emulator is the studio
        instrument in two completely different rooms, and the
        config travels.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Honest verdict</h2>
      <p>
        Good at: every-system-in-one-tool workflow, controller
        normalisation across the bench, shader experimentation,
        live-performance deployment on cheap hardware, the playlist
        catalogue. The thumbnail / no-intro recognition is best in
        class.
      </p>
      <p>
        No good at: gentle onboarding. The first hour with RetroArch
        is a learning cliff. The menu is fractal, the override
        priority for shaders and configs is per-core /
        per-content / global / per-folder with a documented but
        non-obvious cascade, and the configuration files are five
        layers deep before the artist gets the muscle memory. The
        single best investment is an hour with{" "}
        <a
          href="https://docs.libretro.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          docs.libretro.com{arrow}
        </a>{" "}
        and a notebook. For accuracy-first work that does not need
        the front-end, the studio reaches for the standalone
        emulator (Mesen, Dolphin, PCSX2) and skips RetroArch
        entirely; the front-end is for the days when the question
        spans systems.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A small benediction</h2>
      <p>
        The artist who learns this tool acquires a microscope with
        forty lenses. The artist who learns only the on-button has
        a paperweight with controllers. The difference is the hour
        spent reading the docs once, the notebook kept open, and
        the willingness to be a beginner at the menu before being
        competent at the bench. Carry on to the sibling tutorials
        for the specific cores the studio depends on; the
        sister-emulator articles are listed at the foot of this
        page.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulator-tutorial-retroarch",
  title: "Emulator Tutorial &mdash; RetroArch",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Field-notes from one evening installing RetroArch on a fresh laptop: winget, Online Updater, controller mapping, save-state ritual, the playlist catalogue, shader presets. The studio's daily-driver front-end, honest about the learning cliff.",
  Body: EmulatorTutorialRetroArch,
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
      href: "/articles/emulator-tutorial-mesen",
      label: "Emulator Tutorial &mdash; Mesen",
      note: "The accuracy-first counterpart for NES + SNES + GB.",
    },
    {
      href: "/articles/emulator-tutorial-dolphin",
      label: "Emulator Tutorial &mdash; Dolphin",
      note: "GameCube and Wii, with texture dumping and AR camera.",
    },
    {
      href: "/articles/emulator-tutorial-mame",
      label: "Emulator Tutorial &mdash; MAME",
      note: "Arcade preservation lineage.",
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
      note: "Palette as physics; the companion piece.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The free-code lineage RetroArch belongs to.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The line on piracy, written down with the rest of the refusals.",
    },
    {
      href: "/articles/whos-who-uk-pixel-artists",
      label: "Who's Who &mdash; UK Pixel Artists",
      note: "The scene the captured frames feed back into.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.retroarch.com/",
      label: "RetroArch &mdash; official site",
      note: "Download, changelogs, the project itself.",
    },
    {
      href: "https://docs.libretro.com/",
      label: "docs.libretro.com",
      note: "The first hour belongs here.",
    },
    {
      href: "https://datomatic.no-intro.org/",
      label: "No-Intro",
      note: "Cartridge ROM verification database.",
    },
    {
      href: "http://redump.org/",
      label: "Redump",
      note: "Disc-based ROM verification database.",
    },
  ],
};
