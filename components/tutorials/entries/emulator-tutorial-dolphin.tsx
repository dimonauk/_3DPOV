import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulatorTutorialDolphin() {
  return (
    <>
      <p>
        Dolphin is the camera the GameCube never had. The console
        rendered worlds the player could only ever look at from the
        director&rsquo;s angle; the emulator opens that world up and
        lets the artist walk around it. The article below is one
        evening at the bench installing Dolphin, loading a disc the
        studio dumped from its own GameCube, turning on the texture-
        dump folder, and using the AR-camera hack to compose frames
        the original game never did. Read alongside{" "}
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
          href="https://dolphin-emu.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Dolphin{arrow}
        </a>{" "}
        is the GameCube and Wii emulator, one of the most polished
        open-source emulator codebases on the internet, with the
        rare combination of strong performance, strong accuracy,
        and a feature surface that treats art-research workflows
        (texture dumping, AR camera, frame replay) as first-class.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Install &mdash; tonight, the bench desktop</h2>
      <p>
        Winget has it; the install command is short.
      </p>
      <pre className="my-4 overflow-x-auto rounded border border-chrome-700/40 bg-chrome-900/40 p-4 text-sm text-chrome-200">
        <code>winget install DolphinEmulator.Dolphin</code>
      </pre>
      <p>
        Two minutes; the installer pulls the current stable. The
        Dolphin project also publishes a beta / development build
        that is updated weekly and is what the studio actually runs;
        for first-install go with stable, then move to development
        from the in-app updater once everything works. The
        difference is mostly performance fixes and the occasional
        new render-graph option.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">First-run walkthrough</h2>
      <p>
        Dolphin opens to a grid that wants to be a game library. The
        first stop is <em>Config &rarr; Paths &rarr; Add</em>; point
        it at the folder where the studio keeps its GameCube and
        Wii disc images (dumped from the studio&rsquo;s own consoles
        using the Wii&rsquo;s homebrew CleanRip method, verified
        against Redump). The library populates with cover art if the
        thumbnail downloader is enabled in <em>Config &rarr;
        Interface</em>.
      </p>
      <p>
        Graphics first: <em>Config &rarr; Graphics</em>. The studio
        runs Vulkan as the backend on Windows because the modern
        driver story is best on Vulkan; D3D11 is an excellent
        fallback. Internal resolution defaults to native (640 by 528
        for GameCube, similar for Wii); the studio leaves it native
        for reference capture and raises it only when an upscale
        comparison is the point of the session. Anti-aliasing off,
        anisotropic filtering off, ubershaders compiled on launch &mdash;
        the last one is the gotcha; without ubershaders the first
        run of every game stutters for a few minutes while shaders
        compile on demand.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Controller setup</h2>
      <p>
        <em>Controllers</em>. The GameCube pad needs the official
        Nintendo adapter to feel right; otherwise an Xbox-style pad
        mapped through <em>Standard Controller</em> works. The
        8BitDo Pro 2 maps cleanly. For Wii titles the emulated Wii
        Remote is configurable from the same menu; the studio runs
        it pointer-on-screen via mouse for reference work and
        bothers with motion only when the piece in progress needs
        the motion. After the third controller-mapping attempt the
        studio wrote the binds to a profile in the user folder; the
        profile travels with the install.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Loading a disc the studio owns</h2>
      <p>
        Double-click the title in the library; the game boots. The
        studio&rsquo;s discs are dumped via CleanRip on a Wii running
        the Homebrew Channel (the project documents this on its own
        wiki) and verified against Redump. The disc images are ISO
        or RVZ; Dolphin reads both. The studio prefers RVZ for the
        compression and the verified checksum baked into the
        container.
      </p>
      <p>
        BIOS situation: GameCube has an IPL boot ROM that produces
        the famous boot animation. Dolphin runs without it
        perfectly; the IPL is optional. If the artist wants the boot
        animation, the IPL has to be dumped from the studio&rsquo;s
        own GameCube using a homebrew dumper; the procedure is on
        the project wiki and the studio is not going to link to any
        precompiled file. Dump your own. The Wii&rsquo;s system
        menu and IOS modules can be installed by an artist who has
        run the LetterBomb-or-similar legitimate homebrew exploit
        on a Wii they own; the studio does this on a Wii kept on
        the workshop shelf for exactly that purpose.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Save states and frame step</h2>
      <p>
        F1 through F8 to save state to a numbered slot; F9 through
        F16 to load. Period (full stop) for frame advance. The
        studio rebinds frame advance to a single key near the
        space-step rebind for muscle memory; the rebind is in
        <em> Hotkeys</em> and the studio commits the config file
        to the project repo.
      </p>
      <p>
        Save-state semantics in Dolphin are different from
        cartridge-era emulators because the GameCube and Wii are
        3D consoles: a save state captures the GPU command buffer,
        the vertex stream, the texture cache state, all the things
        that make a 3D frame composable. The implication is that
        the artist can save state at frame 1 of an animation, frame-
        step thirty frames, and the in-engine animation cycle has
        played out completely; if the artist wants to <em>repeat</em>{" "}
        the cycle, the save state is the right tool.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Texture dumping &mdash; the headline feature</h2>
      <p>
        <em>Graphics &rarr; Advanced &rarr; Utility &rarr; Dump
        Textures</em>. Tick the box. Now, every texture the GPU
        loads while the game runs is written to{" "}
        <code>%USERPROFILE%\Documents\Dolphin Emulator\Dump\Textures\
        [game-id]\</code> as a PNG, named by the texture hash.
      </p>
      <p>
        The studio uses this as a sprite-sheet extraction tool for
        the entire generation. Run the game to the scene of
        interest; the textures used in that scene have been dumped.
        Open the folder; the textures are organised by hash, which
        means duplicate textures land as one file. A single
        character&rsquo;s face textures, a level&rsquo;s tileset, a
        UI font, the eye textures, the body textures &mdash; all
        there as flat PNGs. The texture-replacement workflow
        (where dumped textures are repainted at higher resolution
        and re-injected into the running game) is built on this
        same folder; the studio reaches for the dump-only side of
        it because the art-reference question does not require
        re-injection.
      </p>
      <p>
        Gotcha: the folder grows fast. A long session in a
        late-Wii title can produce twenty thousand PNGs. The studio
        sets the dump path on the SSD with the most room, prunes
        between sessions, and keeps the per-game folders separate
        for clarity.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The AR camera &mdash; free-roam screenshots</h2>
      <p>
        <em>Graphics &rarr; Advanced &rarr; Utility &rarr; Free Look</em>.
        Enable; rebind the hotkeys for translation and rotation
        (the defaults are number-row plus arrow keys, which clash
        with most game input; the studio uses Ctrl-W-A-S-D for
        translation and Ctrl-mouse for rotation). Pause the game.
        The free-look camera detaches from the game&rsquo;s own
        camera and the artist can fly through the world.
      </p>
      <p>
        This is a virtual photography studio inside an old game
        world. The level&rsquo;s geometry, the lighting, the
        characters frozen mid-animation &mdash; all the things the
        in-game camera never let you compose from your own angle.
        F9 takes a screenshot at the current internal resolution.
        Raise the internal resolution on a powerful machine and the
        screenshots come out at a usable size for print. The studio
        composed an entire reference series of Wind Waker
        cell-shaded skies from free-look frames; the original game
        never gave a player that angle but the geometry was always
        there.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Save-state animation frame study</h2>
      <p>
        The workflow the studio reaches for most weeks. Pause at a
        cinematic. Save state. Frame-step forward through the
        cinematic at one frame per period-key press. Screenshot at
        each interesting frame; the file lands as a numbered PNG.
        At the end of the cycle, load the save state and try
        again with a different camera angle (via free-look).
      </p>
      <p>
        The combined output: a contact sheet of an animation cycle
        composed from angles the director never picked. The animator
        of 2002 built the rig with care; the artist of 2026 reads
        the rig as evidence of how a cycle was constructed. The
        emulator is the microscope and the camera at once.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Capture pipeline</h2>
      <p>
        Three captures the studio uses:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li>F9 single-frame PNG screenshot.
        </li>
        <li><em>Movie &rarr; Start Recording Input</em> &mdash;
          deterministic input record; replay produces an identical
          run, which can then be re-exported through a frame dumper
          to a folder of PNGs.
        </li>
        <li><em>Graphics &rarr; Advanced &rarr; Dump Frames</em> &mdash;
          writes the framebuffer to an AVI in real time. The
          studio runs this for the cinematic capture sessions where
          the output is video rather than a still set.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The studio&rsquo;s everyday use</h2>
      <p>
        Two reaches per week, roughly. First: a texture-dump
        session on a specific game whose art the studio wants to
        read tile-by-tile. The PNG folder becomes the night&rsquo;s
        reading material; the studio sits with a coffee and reads
        the texture hashes like an art book. Second: the free-look
        camera in a Wii or GameCube world for a piece of work that
        needs an architectural reference the studio does not have
        in its own photo archive. The world has the geometry and
        the lighting baked; the AR camera is how the studio
        photographs it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Honest verdict</h2>
      <p>
        Good at: the texture dump (best in class), the free-look
        camera, the deterministic input recording, the broad
        compatibility with the two libraries (almost every GameCube
        and Wii title runs), the polished open-source codebase.
        Performance on a modern machine is comfortably above native
        speed; upscaling internal resolution is genuinely useful
        rather than a vanity.
      </p>
      <p>
        No good at: the things that depend on motion-plus accuracy
        in late Wii titles (some Wii Motion Plus titles still have
        edge-case bugs), the occasional shader compilation stutter
        on first run despite ubershaders, the GameCube IPL boot
        animation without a dump from your own machine. The
        compatibility list at the project wiki is honest about
        which titles still have issues; check it before sinking an
        evening into a problem title.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A small benediction</h2>
      <p>
        Walking through Hyrule with the camera detached is one of
        the genuinely rewarding things a studio practice can do with
        an emulator. The artists who built that world did not get
        to see it the way the free-look camera will let you see it,
        and the artists who are reading it now can compose frames
        they could not otherwise have. For the cartridge-era
        microscope companion, carry on to{" "}
        <Link href="/articles/emulator-tutorial-mesen" className={ext}>
          the Mesen tutorial
        </Link>
        ; for the arcade lineage carry on to{" "}
        <Link href="/articles/emulator-tutorial-mame" className={ext}>
          the MAME tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulator-tutorial-dolphin",
  title: "Emulator Tutorial &mdash; Dolphin",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Field-notes from one evening installing Dolphin on the bench desktop, loading a disc the studio dumped from its own GameCube, turning on the texture-dump folder, and using the free-look camera as a virtual photography studio inside an old game world.",
  Body: EmulatorTutorialDolphin,
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
      href: "/articles/emulator-tutorial-mesen",
      label: "Emulator Tutorial &mdash; Mesen",
      note: "The cartridge-era accuracy companion.",
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
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "3D animation as a successor to sprite morphing.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Dolphin's lineage on the free-code ladder.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The line on piracy, written down with the rest of the refusals.",
    },
  ],
  furtherReading: [
    {
      href: "https://dolphin-emu.org/",
      label: "Dolphin &mdash; official site",
      note: "Downloads and the monthly progress report.",
    },
    {
      href: "https://wiki.dolphin-emu.org/",
      label: "Dolphin wiki",
      note: "Per-title compatibility and configuration notes.",
    },
    {
      href: "http://redump.org/",
      label: "Redump",
      note: "Disc-based ROM verification database.",
    },
  ],
};
