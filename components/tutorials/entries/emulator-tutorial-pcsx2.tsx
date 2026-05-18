import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulatorTutorialPCSX2() {
  return (
    <>
      <p>
        The PlayStation 2 is the era the studio comes back to most
        often when the question is &ldquo;how did a working artist
        fake what the hardware could not yet do.&rdquo; The PS2 was
        powerful for its moment and pedestrian against the cards
        that followed; the art that came off it is the work of
        artists in a constraint they were the first to wrestle. The
        article below is one evening at the bench installing PCSX2,
        dumping the BIOS from the studio&rsquo;s own console,
        loading a disc the studio dumped from its own copy, and
        writing down the renderer-choice trade-off honestly. Read
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
          href="https://pcsx2.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          PCSX2{arrow}
        </a>{" "}
        is the PlayStation 2 emulator: long-running open-source
        project, now on a polished QT-based front-end, with a
        renderer stack that ranges from accuracy-first software to
        speed-and-upscale-first hardware.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Install &mdash; tonight, the workshop machine</h2>
      <p>
        Winget ships PCSX2 but tends to lag a release or two; the
        studio prefers the official installer from{" "}
        <a
          href="https://pcsx2.net/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pcsx2.net{arrow}
        </a>
        . Download the Windows installer, run it, accept the
        defaults; the app installs into <code>%LOCALAPPDATA%\PCSX2\</code>{" "}
        and the user folder lands under
        <code> Documents\PCSX2\</code>. The first launch runs through
        a setup wizard.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">BIOS &mdash; dump your own</h2>
      <p>
        This is the gate. PCSX2 will not run without a PS2 BIOS,
        and the BIOS is licence-encumbered. The studio dumps the
        BIOS from its own PS2 using the FreeMcBoot path: a memory
        card with the FreeMcBoot exploit (installed via a software
        and hardware procedure the artist can do once on a console
        they own), then a homebrew BIOS-dumper application that
        writes the BIOS image to a USB stick plugged into the
        PS2&rsquo;s front USB port. The dumped file is a
        five-megabyte binary; copy it to{" "}
        <code>Documents\PCSX2\bios\</code> on the workshop machine,
        and PCSX2 will list it on next launch.
      </p>
      <p>
        The PCSX2 wiki and the FreeMcBoot project documentation
        describe both steps in detail. The studio will not link to
        any precompiled BIOS file from any source. Dump your own;
        the procedure takes an afternoon, the gear is cheap, and
        the file is yours. You own the cart, you own the dump; you
        own the console, you own the BIOS.
      </p>
      <p>
        After the BIOS lands in the folder, the first-launch wizard
        will pick it up and the configuration window goes from red
        to green. The emulator is now functional.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Loading a disc the studio owns</h2>
      <p>
        The studio rips its own PS2 discs using ImgBurn (the legacy
        but still-functional Windows disc imager) and verifies the
        resulting ISO against Redump where the title is catalogued.
        The ISO lives in <code>D:\emulation\ps2\</code>. From
        PCSX2: <em>System &rarr; Boot ISO &rarr; Fast Boot</em>;
        pick the ISO, the game launches. The Fast Boot path skips
        the PS2 boot screen and goes straight into the title; for
        a reference session the studio prefers Fast Boot because
        the boot animation, while pleasant, is not the point of the
        bench tonight.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Graphics renderer choice &mdash; the honest write-up</h2>
      <p>
        <em>Settings &rarr; Graphics</em>. The renderer dropdown is
        the single most important choice and the most discussed in
        the PCSX2 community. Three options worth knowing:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li><strong>Direct3D 11 / 12</strong> &mdash; the default on
          Windows. Good performance, broad compatibility, the
          renderer the project officially supports against the
          widest range of titles. The studio runs D3D11 by default
          and reaches for D3D12 only when D3D11 has a per-title
          regression.
        </li>
        <li><strong>Vulkan</strong> &mdash; comparable performance,
          sometimes better on modern AMD drivers, sometimes worse
          on older Nvidia. The studio uses Vulkan on the bench
          machine when D3D shaders take too long to compile; the
          per-driver story changes with every release and the
          honest answer is &ldquo;try both, keep the one that runs
          your titles smoother.&rdquo;
        </li>
        <li><strong>Software</strong> &mdash; the pure CPU renderer,
          slowest but most accurate. The studio reaches for this
          when the question is &ldquo;what did the original PS2
          actually produce&rdquo; rather than &ldquo;how does the
          game look upscaled.&rdquo; The bilinear filtering, the
          dithering pattern, the GS-blending edge cases &mdash; all
          present in software, often absent or wrong on the hardware
          renderers.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Texture upscale and filter knobs &mdash; diminishing returns, honestly</h2>
      <p>
        The hardware renderers offer internal-resolution upscaling
        from native (the PS2&rsquo;s 640 by 448 interlaced
        framebuffer) up to eight times. The temptation is to crank
        it. The honest write-up:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-chrome-200">
        <li><strong>Native</strong> is the right reference setting.
          The artist of 2003 painted for this framebuffer; the
          captured frame should match what the artist designed.
        </li>
        <li><strong>2x</strong> is mostly free on modern hardware
          and cleans up the worst of the interlaced jitter without
          changing the design intent meaningfully.
        </li>
        <li><strong>4x</strong> starts to produce per-title
          rendering bugs &mdash; texture seams visible at high
          internal res that were invisible at native, particles
          rendered at the wrong size, post-process effects
          (depth-of-field, glow) at the wrong scale. The studio
          knows several titles that look <em>worse</em> at 4x than
          at native because the artist of 2003 baked in compensation
          for the framebuffer&rsquo;s blur.
        </li>
        <li><strong>8x</strong> is mostly a benchmark setting. The
          studio reaches for it once a year to remind itself why
          it does not reach for it the rest of the year.
        </li>
      </ul>
      <p>
        Texture filtering is the second knob. Bilinear on /
        bilinear off / forced trilinear. Honestly: the PS2&rsquo;s
        own filter behaviour was inconsistent per title and per
        scene, and the most accurate setting is <em>Automatic
        (PS2)</em>, which mimics whatever the game asks for. Forced
        trilinear and forced bilinear are upscale-era artifacts
        and should be off for reference work.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Save states and frame step</h2>
      <p>
        F1 saves state to slot 0, Shift-F1 loads. The slot cycles
        through F2-F8 for additional bookmarks. Frame step is bound
        to the period key by default; pause first (F4 toggles pause
        on the QT build, configurable in <em>Hotkeys</em>) and then
        period steps one frame. The save-state path defaults to{" "}
        <code>Documents\PCSX2\sstates\</code>; the studio reassigns
        it through <em>Settings &rarr; Folders</em> so the states
        travel with the project.
      </p>
      <p>
        PS2 save states are heavy &mdash; a single state can be
        twenty to forty megabytes because the emulator has to
        capture the entire EE and GS state plus the VRAM and
        scratchpads. Cleanup is part of the workflow; the studio
        prunes save-state slots between sessions to keep the
        project folder readable.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Controller setup</h2>
      <p>
        <em>Settings &rarr; Controllers</em>. The DualShock 2 has
        two analogue sticks, a digital D-pad, four face buttons,
        two pairs of shoulder buttons with analogue depth, and
        select-start. PCSX2 handles all of this through its own
        XInput / DirectInput mapping. An Xbox-style pad covers the
        digital and analogue sticks; the analogue-depth shoulder
        buttons (Twisted Metal Black needed them, Tony Hawk needed
        them) map to controller triggers with axis-to-button
        thresholds. The studio uses the 8BitDo Pro 2 in Switch
        mode on the workshop bench and an official DualShock 4 on
        the lounge bench; both work cleanly. After the third
        controller-mapping attempt the studio writes the binds to
        a profile and commits the profile to the project repo.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Capture workflow</h2>
      <p>
        F8 takes a screenshot at the current render resolution; the
        PNG lands in <code>Documents\PCSX2\snaps\</code>. For an
        animation cycle: pause, frame-step, screenshot, repeat.
        The GS dumper records a frame as a binary blob the
        emulator can replay (useful for the project&rsquo;s own
        bug-reporting workflow; less useful for art capture). For
        video output the studio runs an external screen recorder
        (OBS Studio) rather than the in-app capture, because the
        OBS pipeline integrates with the studio&rsquo;s other video
        capture and the in-app capture writes to its own format the
        studio then has to transcode.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Sprite-sheet ripping on a 3D console</h2>
      <p>
        The PS2 era is 3D, so the cartridge-era sprite-sheet model
        does not apply directly. The substitute the studio reaches
        for is <em>texture dumping</em>; PCSX2 supports per-frame
        texture dump through <em>Graphics &rarr; Advanced &rarr;
        Dump GS Data</em>, which writes the textures the GS used
        to render the frame. The dumps are PNGs the studio can
        open in Aseprite. The 2D HUD overlays in late-PS2 titles
        are particularly worth dumping: the artist of 2004 was
        still painting UI tiles at sprite-era resolution and the
        constraint is legible.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The studio&rsquo;s everyday use</h2>
      <p>
        Two reaches per week. First: the cel-shading and
        deferred-rendering tricks of late-PS2 titles. The studio
        wants to know how Killer7 made its look on hardware that
        was not designed for that look; the answer is in the
        shader passes and the texture binds the artist of 2005
        sequenced. PCSX2 in software-renderer mode is the
        microscope for this. Second: the texture dump on a long
        running session through one title, looking specifically at
        the 2D overlay tilesets and the inventory icons. The HUD
        artists of the era worked in a constraint as tight as the
        SNES artists did, just on a different hardware.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Honest verdict</h2>
      <p>
        Good at: the breadth of the PS2 library it now runs
        cleanly, the renderer-choice flexibility, the texture-dump
        path, the QT-based modern UI which is the best front-end
        the project has ever shipped. The compatibility list is
        comfortably above ninety-five percent of the catalogue
        playable end-to-end; per-title regressions are documented
        on the project wiki.
      </p>
      <p>
        No good at: starting cold without a BIOS, the upscale
        diminishing returns at 4x and above, the per-title shader
        compilation stutter on first run (pre-compile the shader
        cache from <em>Tools &rarr; Game Properties</em> if a clean
        run matters), and the save-state file size which is the
        worst on the bench. The renderer-choice complexity is real;
        a guest who has not done this before needs an hour to get
        comfortable with the trade-offs. None of these are project
        failures &mdash; the PS2 was a complex machine and the
        emulator is honest about that complexity.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A small benediction</h2>
      <p>
        The artists who worked on the PS2 generation were the
        first cohort painting for a 3D framebuffer that could not
        yet hold what they wanted to put in it; the workarounds
        they invented are the design language of the era. Sit with
        PCSX2 in software-renderer mode on a title whose look you
        cannot quite place, and the workaround the artist of 2004
        used will become visible. The other eras are covered in
        the sibling tutorials listed below.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulator-tutorial-pcsx2",
  title: "Emulator Tutorial &mdash; PCSX2",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Field-notes from one evening installing PCSX2 and dumping the BIOS from the studio's own PS2, with an honest write-up of the renderer choice and the diminishing returns of texture upscaling above 2x.",
  Body: EmulatorTutorialPCSX2,
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
      note: "GameCube and Wii &mdash; the contemporary console.",
    },
    {
      href: "/articles/emulator-tutorial-mame",
      label: "Emulator Tutorial &mdash; MAME",
      note: "Arcade preservation.",
    },
    {
      href: "/articles/emulator-tutorial-dosbox-x",
      label: "Emulator Tutorial &mdash; DOSBox-X",
      note: "DOS-era PC art.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Sprite morphing as a pre-shader precursor.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "PCSX2's lineage on the free-code ladder.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The line on piracy, written down with the rest of the refusals.",
    },
  ],
  furtherReading: [
    {
      href: "https://pcsx2.net/",
      label: "PCSX2 &mdash; official site",
      note: "Downloads, the wiki, the compatibility list.",
    },
    {
      href: "https://wiki.pcsx2.net/",
      label: "PCSX2 wiki",
      note: "Per-title configuration and the BIOS-dump procedure.",
    },
    {
      href: "http://redump.org/",
      label: "Redump",
      note: "Disc-based ROM verification database.",
    },
  ],
};
