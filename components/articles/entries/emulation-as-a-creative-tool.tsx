import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulationAsACreativeTool() {
  return (
    <>
      <p>
        Old game hardware made beautiful pictures by being small.
        Sixteen colours on screen, a tile grid eight pixels wide, a
        sprite limit that bit if you stacked too many on a line, a
        cathode-ray tube that lit the phosphors in scanlines and then
        let them die. Every one of those limits is now a style an
        artist can borrow on purpose, and the easiest way to study a
        limit is to run the hardware that imposed it &mdash; or,
        practically, the emulator that imitates it. This article is a
        glossary-as-essay: the studio walks through the terms of the
        practice, and at each term says out loud what it uses the
        thing for. The frame is artistic study, not piracy. The point
        is to leave with a tile grid in your hand that you can use in
        a new piece.
      </p>

      <p>
        <strong>Emulation</strong> is the imitation of one machine&rsquo;s
        behaviour by another. A modern PC pretends to be a Nintendo
        Entertainment System, cycle by cycle, register by register, and
        the program written for the NES sees what it expects to see.
        Emulation is older than the games it most often resurrects;
        it began as a way for mainframes to host the workloads of
        older mainframes, and it lives now in everything from a
        virtual machine on a server farm to a phone running an
        Amiga ROM. The studio cares about the games-and-art
        end &mdash; the visual systems of 1983 through 2005, the
        ones that built constraint into hardware and forced art into
        the gap.
      </p>

      <p>
        <strong>HLE versus LLE.</strong> High-level emulation
        re-implements the original machine&rsquo;s behaviour at the
        function level &mdash; close enough to make the game run,
        fast enough to play on a phone, occasionally wrong in ways
        the artist will notice. Low-level emulation models the
        hardware itself, sometimes at the transistor level, and pays
        the cost in performance for accuracy that is bit-for-bit
        identical to the original. For artistic reference,{" "}
        <strong>accuracy wins</strong>: a CRT glow that arrived from
        the right combination of NTSC composite signal and phosphor
        decay is not something HLE will reproduce. The studio errs
        toward the accuracy-first cores when extracting reference
        material and toward the speed-first cores when only
        navigating.
      </p>

      <p>
        <strong>Honest scale.</strong>{" "}
        <a
          href="https://www.mesen.ca/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mesen and Mesen-X{arrow}
        </a>{" "}
        are the bit-exact reference for the NES, SNES, Game Boy,
        Game Gear and PC Engine; Sour&rsquo;s work is held by the
        speedrun community as the accuracy benchmark.{" "}
        <a
          href="https://mednafen.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Mednafen{arrow}
        </a>{" "}
        is the academic-grade multi-system emulator &mdash; a
        command-line program, careful about the spec, the one
        archivists reach for.{" "}
        <a
          href="https://www.retroarch.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          RetroArch{arrow}
        </a>{" "}
        is the popular front-end that bundles dozens of cores
        (each core is somebody else&rsquo;s emulator wrapped in a
        common API), and is the studio&rsquo;s daily driver. The
        tools live on a spectrum; the right one depends on the
        question being asked.
      </p>

      <p>
        <strong>Why an artist would care.</strong> The studio runs
        emulators for the same reason it keeps a library of art
        books: reference. A frame of <em>Super Mario Bros 3</em> at
        the exact moment Mario picks up a leaf is a tile composition
        the artist can lay over a tile grid and read. The colour at
        a given pixel is the colour the artist of 1988 picked from
        a four-entry palette, and the limits of that palette are a
        problem the studio is still pleased to inherit when working
        on pixel-art frames for an LED rig. Running the original
        cartridge on the original console will give the same image,
        and a better one in some ways &mdash; but it will not let
        you frame-step it, will not let you save the framebuffer as
        a PNG, will not let you isolate the sprite layer from the
        background layer. The emulator is a reference instrument the
        original hardware is not.
      </p>

      <p>
        <strong>Pixel-perfect capture.</strong> Every accuracy-first
        emulator can dump the current frame at its native resolution
        with no scaling, no shader, no filter &mdash; the image the
        PPU produced before any television got hold of it. RetroArch
        binds this to the quick-screenshot key by default; Mesen
        exposes it on the file menu and as a hotkey; Mednafen writes
        it to the screenshot folder. The captured PNG is the
        artist&rsquo;s reference frame. The studio lays these into
        Aseprite or Pixelorama and reads them tile-by-tile.
      </p>

      <p>
        <strong>Frame-stepping and save states.</strong> A save
        state is a snapshot of the entire machine &mdash; CPU
        registers, memory, video memory, audio state, the lot. The
        emulator can write one to disk and resume from it at any
        time. Combined with the frame-step hotkey (advance one
        frame, pause again), the artist gets a microscope. Animation
        cycles that the eye reads as a single blur become four
        discrete poses; the studio studies the four poses, and the
        next pixel-art piece is better. The artists who built these
        cycles knew exactly what they were doing; the emulator lets
        you look over their shoulder.
      </p>

      <p>
        <strong>The constraints worth studying.</strong> The point
        of all of this is not the games. It is the design language
        each machine&rsquo;s hardware imposed, and the style that
        language gave the artists who worked inside it.
      </p>

      <p>
        <strong>NES.</strong> Four background palettes and four
        sprite palettes, four colours per palette (one of them
        transparent for sprites, one of them shared across all
        backgrounds). Eight-by-eight tiles, organised into
        attribute blocks of sixteen-by-sixteen, so colour choice
        was constrained at a coarser grain than tile placement.
        Hardware sprite limit of eight per scanline, which is why
        flickering sprites are a period mannerism rather than a
        bug. Borrow this constraint and you get a pixel-art piece
        with the rhythm of a Famicom screen rather than a generic
        retro pastiche.
      </p>

      <p>
        <strong>SNES.</strong> Mode 7 was a single tiled background
        layer with an affine transform &mdash; rotation, scaling,
        shearing &mdash; applied per scanline. That is how{" "}
        <em>F-Zero</em> tilted the track and how <em>Super Mario
        Kart</em> rotated the floor. The transparency was real
        alpha blending on a dedicated layer. The 256-colour mode
        opened up painted backgrounds where the NES would have
        tiled them. The constraint language here is per-scanline
        thinking: a single horizontal line is the unit you can
        change behaviour at.
      </p>

      <p>
        <strong>Game Boy.</strong> One hundred and sixty by one
        hundred and forty-four pixels of canvas. Four shades of
        grey on the original DMG, displayed through a green-tinted
        reflective LCD that gave the system its house colour. The
        studio borrows the four-shade discipline whenever a piece
        needs to read at glance and at distance both &mdash; a
        smaller palette forces every value to do work. The DMG
        green tint is its own colour story, covered separately in{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>
        .
      </p>

      <p>
        <strong>Arcade boards.</strong> Every cabinet of the late
        seventies and eighties shipped a different combination of
        custom chips, bespoke palettes, and unusual screen
        resolutions. <em>Pac-Man</em> ran on its own board.{" "}
        <em>Galaga</em> ran on another. The CPS-1 board powered{" "}
        <em>Street Fighter II</em> and a dozen others. The art
        styles tracked the hardware; the hardware tracked the
        coin-op economics of the moment. This is why MAME exists
        as a single project: every cabinet is a unique machine,
        and an artist studying the look of an early arcade frame
        is studying the chip that drew it.
      </p>

      <p>
        <strong>PS1.</strong> Vertices were stored as integers, so
        a polygon at distance jittered as the camera moved &mdash;
        the floor of <em>Resident Evil</em> wobbled because the
        machine could not represent fractional vertex positions.
        Texture mapping was affine, not perspective-correct, so
        textures warped on polygons that turned away from the
        camera. Dithering was used as anti-aliasing on a 320-by-
        240 framebuffer. The aesthetic the studio sometimes calls
        &ldquo;PSX jank&rdquo; is exactly these three behaviours
        composed; it is a style with a hardware cause, not a
        nostalgia filter.
      </p>

      <p>
        <strong>N64.</strong> Bilinear filtering applied to
        everything, all the time &mdash; a software default the
        SGI-trained architects baked into the rasteriser. Texture
        cache of four kilobytes, so any texture larger than a
        thumb-nail had to be tiled or paletted or both. The house
        style was a softer, blurrier image than any other console
        of the moment, and the constraint that produced it is the
        most legible one on the list: <em>tiny textures, smooth
        filter</em>.
      </p>

      <p>
        <strong>Each constraint is a style.</strong> The studio&rsquo;s
        position on this is the position it holds on every other
        kind of constraint &mdash; covered at length in{" "}
        <Link href="/articles/from-picasso-forward" className={ext}>
          From Picasso Forward
        </Link>
        . A working artist looks for constraints to borrow because
        constraints make decisions for you, and decisions made by
        the medium are decisions the artist no longer has to make
        from a blank page. The constraints of the NES are a
        cubist&rsquo;s rectangle. The constraints of the PS1 are a
        woodblock&rsquo;s grain. The constraints of the Game Boy
        are a charcoal stick&rsquo;s value range. None of these
        are nostalgic gestures; they are working tools.
      </p>

      <p>
        <strong>The ethics, said plainly.</strong> The studio&rsquo;s
        position on ROMs is the same as its position on every
        other piece of intellectual property: respect the licence.
        Dump cartridges you own; the No-Intro and Redump databases
        publish checksums so you can verify the dump matches the
        canonical good copy. Support indie homebrew &mdash; there
        are excellent NES and Game Boy releases coming out
        currently, with licences that explicitly invite reference
        use. Use the public-domain titles where they exist (some
        early arcade ROMs have been released by their rights
        holders into the wild over the years; a search of the
        Internet Archive&rsquo;s software library will turn them
        up). Do not pirate. The studio does not, and the studio is
        not going to wink at it. The list of things the studio
        will not do is kept honestly in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          What the Studio Won&rsquo;t Do
        </Link>
        ; this is one of them.
      </p>

      <p>
        <strong>BIOS files.</strong> Some emulators need the
        original system&rsquo;s firmware to run anything &mdash;
        the PlayStation, the PS2, the Game Boy Advance, the Sega
        Saturn, several arcade boards. The firmware is copyrighted
        and licence-encumbered. The legal-clean path is to dump
        the BIOS from hardware you own; tools like Caetla for the
        PS1 and the GBA dumper trick for the original console are
        documented at the homebrew sites. Some emulators ship
        open-source BIOS reimplementations of varying
        completeness; PCSX-Reloaded shipped one for the PS1 and
        Mednafen has its own. Read the licence file each emulator
        bundles &mdash; it tells you what the project distributes
        and what you are expected to bring yourself.
      </p>

      <p>
        <strong>ROM hacking.</strong> A small but serious
        community modifies game data files for artistic and
        archaeological reasons: re-translating a game whose
        official translation cut the script, patching an
        accessibility option into a game that needed one,
        repainting a sprite sheet to study how the underlying
        animation cycle handles colour rotation. The community
        builds patches that apply over the original ROM without
        redistributing it, which is the legal-clean way to share
        the work. For the studio&rsquo;s purposes, the relevant
        thing is the sprite-sheet study &mdash; opening a ROM in
        a tile editor and reading the artist&rsquo;s composition
        choices, then closing the file and going to make a piece
        of one&rsquo;s own.
      </p>

      <p>
        <strong>Live performance.</strong> Emulators run in real
        time on cheap hardware, so the studio has on occasion
        used them inside an installation: a Raspberry Pi running
        RetroArch with a custom shader stack, plugged into an LED
        matrix that displays the framebuffer at native
        resolution. The piece is not the game; the piece is the
        composition of a custom build running on a custom display
        with a custom shader between the two. The emulator is the
        instrument the rest of the installation is built around.
        See the rig logic in{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          Why I Build My Own Rigs
        </Link>{" "}
        and{" "}
        <Link href="/articles/the-living-stage" className={ext}>
          The Living Stage
        </Link>{" "}
        for the parallel rationale on other hardware.
      </p>

      <p>
        <strong>Render-target capture.</strong> RetroArch and
        Mesen both expose the framebuffer as a render target the
        artist can dump per-frame &mdash; an entire animation
        cycle, frame by frame, into a folder of numbered PNGs.
        FFmpeg will then assemble the folder into an MP4 or an
        APNG; ExifTool will sit on top and rewrite the metadata
        if the studio wants the file to carry the source
        attribution. The pipeline is a few minutes of work and it
        yields a study reel the artist can scrub through at any
        speed. The same logic underlies the studio&rsquo;s
        per-frame capture for its own rigs, treated more fully in{" "}
        <Link href="/articles/lineage-marey-to-now" className={ext}>
          Lineage: Marey to Now
        </Link>
        .
      </p>

      <p>
        <strong>Sprite-sheet extraction.</strong> Most emulators
        let you disable the background layer or the sprite layer
        independently &mdash; a developer feature that the artist
        can borrow. With backgrounds off, the sprites read
        against a flat colour; the screenshot can be taken straight
        into a tile editor and split into individual frames. The
        composition of a single animation cycle is then a
        sprite-by-sprite study, and the studio&rsquo;s pixel-art
        practice is downstream of that study. (The legal-clean
        version of this is to study the work and then go and make
        a piece of one&rsquo;s own &mdash; not to reuse the
        extracted sprite in a shipped piece. The reference is for
        the artist&rsquo;s eye, not for the artist&rsquo;s output
        folder.)
      </p>

      <p>
        <strong>Shaders and CRT simulation.</strong> The image a
        cathode-ray television produced was not the image the
        console produced; the signal was composited through
        NTSC or PAL encoding, sent down a cable, decoded by the
        television&rsquo;s circuitry, and finally fired at a
        phosphor mask that bloomed and decayed in its own way.
        RetroArch ships a stack of community shaders &mdash; the
        crt-royale and crt-guest families are the academic ones
        &mdash; that approximate this chain with varying degrees
        of expense. Running a NES frame through crt-royale is
        the closest a flat-panel monitor will get to the picture
        a 1988 television produced. The studio uses these shaders
        not for nostalgia but as a colour-correction reference:
        the artist of 1988 was painting <em>for</em> the
        television, and the unfiltered framebuffer is not the
        image they intended.
      </p>

      <p>
        <strong>The handoff to pixel-art.</strong> Once the
        reference frame is captured and the palette is read,
        the work moves to a pixel-art tool. The studio uses{" "}
        <a
          href="https://www.aseprite.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Aseprite{arrow}
        </a>{" "}
        for the paid, polished workflow and{" "}
        <a
          href="https://www.orama-interactive.com/pixelorama"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Pixelorama{arrow}
        </a>{" "}
        for the open-source one; both will import a PNG
        palette extracted from an emulator capture and let the
        artist build inside the same colour space. From there
        the work travels to whichever output the studio is
        feeding &mdash; an LED matrix, a print, a screen piece,
        a sprite the rigs will rotate at thirty rotations per
        second. The reference is the same; the destination
        changes per project.
      </p>

      <p>
        <strong>The studio&rsquo;s house position.</strong>{" "}
        Emulators are reference instruments and live-performance
        instruments, not piracy enablers. Dump your own carts.
        Verify the dumps against the No-Intro and Redump
        databases. Support indie homebrew. Read the BIOS licence.
        Treat ROM hacks as the open-archive work they mostly are.
        Do not redistribute copyrighted ROMs from the studio
        site or any site adjacent to it, and do not ask the
        studio to do so on your behalf. The constraint of the
        old hardware is the gift the artist is here to study;
        the gift was made by people who deserve to be paid when
        the licence still expects it.
      </p>

      <p>
        For the toolset the studio actually uses in practice
        &mdash; which emulator for which question, the install
        gotchas, the BIOS situation, the shader stacks &mdash;
        carry on to{" "}
        <Link
          href="/articles/the-emulation-stack-for-creative-research"
          className={ext}
        >
          The Emulation Stack for Creative Research
        </Link>
        . The sibling pair on a different method &mdash; finding
        peers rather than reference &mdash; is{" "}
        <Link href="/articles/osint-for-finding-your-people" className={ext}>
          OSINT for Finding Your People
        </Link>{" "}
        and its{" "}
        <Link
          href="/articles/the-osint-stack-for-creative-research"
          className={ext}
        >
          stack companion
        </Link>{" "}
        (both written in the same glossary-as-essay and by-tool
        shapes, so the studio&rsquo;s research practice reads as
        one method with two surfaces).
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulation-as-a-creative-tool",
  title: "Emulation as a Creative Tool",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A glossary-as-essay on console and arcade emulation as the studio practises it: constraint study, not piracy. Each old machine is a style with a hardware cause, and the emulator is the microscope you read it through.",
  Body: EmulationAsACreativeTool,
  related: [
    {
      href: "/articles/the-emulation-stack-for-creative-research",
      label: "The Emulation Stack for Creative Research",
      note: "The tools the studio actually uses.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver, in long form.",
    },
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "The DMG green tint, neon, LED &mdash; colour as physics.",
    },
    {
      href: "/articles/lineage-marey-to-now",
      label: "Lineage: Marey to Now",
      note: "Frame-stepping as a much older discipline.",
    },
    {
      href: "/articles/the-mathematics-of-morphing",
      label: "The Mathematics of Morphing",
      note: "Sprite morphing as a pre-shader precursor.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "The studio's ethos on free code, which underwrites the emulation scene too.",
    },
    {
      href: "/articles/provenance-as-discipline",
      label: "Provenance as Discipline",
      note: "The discipline-of-evidence parallel, applied to images.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The line on piracy, written down with the rest of the refusals.",
    },
    {
      href: "/articles/osint-for-finding-your-people",
      label: "OSINT for Finding Your People",
      note: "The sibling method piece on peer discovery.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.mesen.ca/",
      label: "Mesen / Mesen-X",
      note: "The bit-exact NES + SNES + GB + GG + PCE reference.",
    },
    {
      href: "https://mednafen.github.io/",
      label: "Mednafen",
      note: "Academic-grade multi-system emulator. CLI-first.",
    },
    {
      href: "https://www.retroarch.com/",
      label: "RetroArch",
      note: "Multi-system front-end; the studio's daily driver.",
    },
    {
      href: "https://datomatic.no-intro.org/",
      label: "No-Intro",
      note: "Verified-good ROM checksum database for cartridge-based systems.",
    },
    {
      href: "http://redump.org/",
      label: "Redump",
      note: "The sibling database for disc-based systems.",
    },
  ],
};
