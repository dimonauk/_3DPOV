import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulatorTutorialDOSBoxX() {
  return (
    <>
      <p>
        The DOS-era PC is the era the games industry preferred to
        forget for a decade and then remembered for good reasons. A
        sixteen-colour EGA palette, a 320-by-200 VGA framebuffer, an
        AdLib synthesiser, a Sound Blaster, a beige-box clone made
        in a factory the artist never visited &mdash; this is the
        canvas Sierra and LucasArts and the demoscene painted on.
        The article below is one evening installing DOSBox-X on
        the workshop machine, getting an MS-DOS prompt in 2026, and
        learning the period sound and video knobs honestly. Read
        alongside{" "}
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
          href="https://dosbox-x.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          DOSBox-X{arrow}
        </a>{" "}
        is a fork of the long-running DOSBox project, with broader
        hardware support, more video modes, more sound options, and
        a more active development pace; it emulates the DOS-era PC
        from the original IBM PC through the late-nineties Pentium
        machines.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Install &mdash; tonight, the workshop machine</h2>
      <p>
        DOSBox-X ships a Windows installer; the studio downloads it
        directly from{" "}
        <a
          href="https://dosbox-x.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dosbox-x.com{arrow}
        </a>
        . There is a winget package for vanilla DOSBox
        (<code>DOSBox.DOSBox</code>) but not for DOSBox-X at the
        time of writing; direct download is the path. Run the
        installer; the app lands in <code>C:\Program Files\DOSBox-X\</code>{" "}
        by default and the per-user config sits in
        <code> %APPDATA%\DOSBox-X\</code>.
      </p>
      <p>
        First launch opens a small window with an MS-DOS prompt at
        <code> Z:\&gt;</code>. The Z: drive is the emulator&rsquo;s
        own virtual filesystem containing helper utilities; the
        artist will spend most of the bench time on a mounted C:
        drive that lives in a folder on the host machine.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">First-run walkthrough &mdash; the mount command</h2>
      <p>
        The studio creates <code>D:\emulation\dosgames\</code> on
        the host, and inside it a folder per title (per studio
        convention, all of which the studio either bought through
        GOG or owns the original boxed media for). At the DOSBox-X
        prompt:
      </p>
      <pre className="my-4 overflow-x-auto rounded border border-chrome-700/40 bg-chrome-900/40 p-4 text-sm text-chrome-200">
        <code>{`MOUNT C D:\\emulation\\dosgames
C:
DIR`}</code>
      </pre>
      <p>
        The host folder is now the emulator&rsquo;s C: drive. The
        studio commits this mount command to the autoexec section
        of <code>dosbox-x.conf</code> so every launch starts on the
        right drive without retyping. The config file is editable
        directly &mdash; <em>DOS &rarr; Configuration GUI</em>
        opens a dialog version, but the studio prefers the text
        file because it commits cleanly to the project repo.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Period-correct video</h2>
      <p>
        The DOSBox-X config supports per-profile video chip selection,
        which is the right tool because the period was
        chip-defined. The relevant choices, in the order an artist
        comes to need them:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li><strong>CGA</strong> &mdash; the original IBM PC&rsquo;s
          four-colour 320-by-200 mode with the cyan-magenta-yellow-
          black palette and the brown-or-not-brown palette switch.
          The constraint is severe; the games (think early Sierra)
          worked around it with dithering patterns the studio is
          still pleased to study.
        </li>
        <li><strong>EGA</strong> &mdash; sixteen colours from a
          sixty-four-colour master palette, 320-by-200 or
          640-by-350. The mid-eighties standard; King&rsquo;s Quest
          IV, Space Quest III, the early shareware era.
        </li>
        <li><strong>VGA</strong> &mdash; the famous 256-colour
          Mode 13h (320-by-200 from a 262,144-colour palette), plus
          the higher-resolution sixteen-colour modes that nobody
          remembers because Mode 13h was where the art happened.
          This is Prince of Persia, the LucasArts adventures from
          Indiana Jones and the Fate of Atlantis onward, Pinball
          Fantasies, the entire demoscene of the early nineties.
          The studio spends most of its DOSBox-X time in VGA mode.
        </li>
        <li><strong>SVGA</strong> &mdash; the late-nineties
          successor; resolutions up to 1024-by-768 with hundreds of
          thousands of colours. Less constraint, less interesting
          as a study target most of the time, but necessary for
          the late-DOS titles.
        </li>
      </ul>
      <p>
        Set the machine type in the config: <code>machine=vga</code>
        for the Mode-13h era, <code>machine=ega</code> for the
        sixteen-colour era, <code>machine=cga</code> for the
        four-colour era. The output filter setting underneath
        matters too &mdash; <code>output=opengl</code> with a
        <code> scaler=normal2x</code> gives a clean integer-scaled
        framebuffer; the bilinear options blur the pixels and are
        wrong for reference capture.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Sound &mdash; AdLib, Sound Blaster, MT-32</h2>
      <p>
        Period sound is a deep rabbit hole and the studio uses two
        configurations most evenings:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li><strong>Sound Blaster 16</strong> at the default IRQ
          and DMA &mdash; <code>sbtype=sb16</code> in the config.
          This covers the late-DOS titles that expected the Sound
          Blaster line. The OPL3 FM synthesis chip on the SB16 is
          the chip the artists of the era composed for; the
          emulation of OPL3 in DOSBox-X is excellent.
        </li>
        <li><strong>AdLib only</strong> &mdash; <code>sbtype=adlib</code>{" "}
          for the early titles that expected a pure AdLib card and
          composed for the OPL2 chip. The audio is leaner and
          tinnier than OPL3 and the artist of 1988 wrote music
          inside that lean palette.
        </li>
      </ul>
      <p>
        Roland MT-32 emulation is a separate question; DOSBox-X
        supports it through the MUNT library which the artist has
        to compile or link in separately. The MT-32 is what
        Sierra&rsquo;s late-eighties adventures composed for at the
        high end; it is worth the extra evening to get it working
        when studying that period.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Controller and keyboard</h2>
      <p>
        The DOS era is keyboard-and-mouse first; controller support
        was a per-game decision. DOSBox-X maps the host keyboard
        to the emulated PC keyboard directly. The mouse is captured
        when the emulator window has focus; Ctrl-F10 releases it
        (the studio rebinds this to a more findable key in the
        keymapper). For the rare game that wanted a joystick,
        <em> Mapper Editor</em> binds the host pad axes to the
        emulated joystick.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Save states</h2>
      <p>
        DOSBox-X supports save state through the F5 (save) and F9
        (load) defaults. The implementation is solid for most DOS
        software; some games that probe hardware aggressively can
        misbehave after state load. The studio uses save states
        for animation-cycle study (frame-step is bound to Ctrl-F4
        in the default keymap, configurable to a single key in the
        mapper) and uses in-game saves for ordinary bookmark
        purposes.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">BIOS situation</h2>
      <p>
        DOSBox-X bundles an open-source BIOS reimplementation, so
        there is no system-BIOS dump required to run DOS software.
        The relevant non-bundled software is MS-DOS itself plus
        any game data. The studio runs FreeDOS where possible
        (it is open-source and the kernel runs almost everything),
        and runs a legitimately-owned MS-DOS install on a virtual
        floppy where FreeDOS will not (Microsoft has not formally
        released MS-DOS into the public domain, so the studio uses
        a copy from boxed media). Sister project ScummVM handles
        the LucasArts and Sierra engines separately if the question
        is point-and-click adventure rather than the DOS environment
        itself; covered in the broader stack article.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Capture workflow</h2>
      <p>
        Ctrl-F5 saves a screenshot of the current framebuffer; the
        file lands in <code>%LOCALAPPDATA%\DOSBox-X\capture\</code>{" "}
        as a PNG. Ctrl-F7 starts a video capture (AVI); Ctrl-F7
        again stops it. For sprite-sheet ripping the studio
        prefers Ctrl-Alt-F5 which dumps the framebuffer as a raw
        binary plus a palette file, which is the closest the
        emulator gets to giving the artist the unfiltered output.
        Alt-Pause pauses; the frame-step path through the mapper
        gives the per-frame microscope on animation cycles.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The demoscene archive worth studying</h2>
      <p>
        This is the part where DOSBox-X earns its own article. The
        DOS-era demoscene &mdash; Future Crew&rsquo;s Second
        Reality, Iguana&rsquo;s Stars, the Crystal Dream of
        Triton, the entire Assembly &rsquo;93 through &rsquo;97
        catalogue &mdash; runs on DOSBox-X. Most of these
        productions have been re-released by their authors under
        permissive licences or into the public domain; the Pouet
        archive (<a
          href="https://www.pouet.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pouet.net{arrow}
        </a>) is the cataloguing site, and Scene.org is the
        canonical mirror. The studio downloads productions from
        these archives, runs them in DOSBox-X with the
        period-correct video and sound configuration, and reads
        them as primary-source material on what could be done with
        a 386 and a Sound Blaster.
      </p>
      <p>
        The artists who made those productions are still around;
        many publish current work under the same handles they used
        in 1993. The lineage from those VGA-palette demos to the
        current shader-art scene is direct and the studio carries
        it forward in pieces of its own.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The studio&rsquo;s everyday use</h2>
      <p>
        Two reaches per week. First: VGA Mode 13h palette study.
        Open a Sierra adventure or a LucasArts adventure, screenshot
        a frame, extract the 256-colour palette using Aseprite&rsquo;s
        palette extractor, work inside that palette on the new
        piece. The constraint of the era was a flat 256-colour
        ceiling; the artists of 1992 had to do every colour
        decision inside that ceiling and the work reads completely
        different from the cartridge-console palettes of the same
        era. Second: a demoscene production on the bench while the
        studio drinks coffee. The studio runs Second Reality once
        every few months as a reminder of what is possible with
        forty kilobytes of code and a Sound Blaster.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Honest verdict</h2>
      <p>
        Good at: period-correct video and sound configuration, the
        wide span of DOS-era hardware emulation, the active
        development pace (DOSBox-X gets meaningful updates monthly),
        the demoscene catalogue support, the bundled open-source
        BIOS that means no firmware-dumping is required to start.
        FreeDOS support means the artist can run a legally clean
        DOS prompt with no questions asked.
      </p>
      <p>
        No good at: gentle onboarding for an artist who has never
        seen an MS-DOS prompt. The mount command, the autoexec
        section of the config, the IRQ-and-DMA dance to configure
        sound, the per-machine memory model (himem, expanded
        memory, the conventional-memory ceiling) &mdash; these are
        period-correct details and they are real. An hour with the
        DOSBox-X manual at <a
          href="https://dosbox-x.com/wiki"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dosbox-x.com/wiki{arrow}
        </a>{" "}
        is mandatory. The studio is honest: the curve is real,
        the reward is real.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A small benediction</h2>
      <p>
        The DOS era was the first era a working artist could paint
        a frame at a colour depth the eye could really read, and
        the constraint of the 256-colour ceiling forced palette
        discipline at a level no modern tool will enforce by
        default. Run a Sierra adventure for an evening, read the
        palette, and the next piece on the bench will reach for
        that discipline whether the constraint is technically
        present or not. The artist of 1992 made the case; the
        artist of 2026 inherits the practice. For the other eras
        of this same study, the sibling tutorials are listed
        below.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulator-tutorial-dosbox-x",
  title: "Emulator Tutorial &mdash; DOSBox-X",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Field-notes from one evening installing DOSBox-X on the workshop machine, getting an MS-DOS prompt in 2026, configuring the period sound and video chips, and reading the VGA-palette demoscene archive as primary-source material.",
  Body: EmulatorTutorialDOSBoxX,
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
      note: "Cartridge-era cousin.",
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
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "The VGA palette as a working tool.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "DOSBox-X's lineage on the free-code ladder.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Demoscene morphing as a pre-shader precursor.",
    },
    {
      href: "/articles/whos-who-uk-pixel-artists",
      label: "Who's Who &mdash; UK Pixel Artists",
      note: "The scene the captured frames feed back into.",
    },
  ],
  furtherReading: [
    {
      href: "https://dosbox-x.com/",
      label: "DOSBox-X &mdash; official site",
      note: "Downloads and the manual.",
    },
    {
      href: "https://dosbox-x.com/wiki",
      label: "DOSBox-X wiki",
      note: "The first-hour mandatory reading.",
    },
    {
      href: "https://www.dosbox.com/",
      label: "DOSBox &mdash; the parent project",
      note: "The original; still useful for the simpler case.",
    },
    {
      href: "https://www.pouet.net/",
      label: "Pouet.net",
      note: "The demoscene catalogue.",
    },
    {
      href: "https://www.scene.org/",
      label: "Scene.org",
      note: "Canonical mirror for demoscene productions.",
    },
    {
      href: "https://www.freedos.org/",
      label: "FreeDOS",
      note: "Open-source DOS kernel; the legally clean prompt.",
    },
  ],
};
