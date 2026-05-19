import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function EmulatorTutorialMAME() {
  return (
    <>
      <p>
        MAME is the library, the archive, and the ship&rsquo;s log of
        the arcade era at once. Where the cartridge consoles each
        had a coherent design language, the arcade boards of the
        late seventies through the early two thousands were a
        Cambrian explosion of one-off hardware &mdash; each cabinet
        a unique machine, each with its own art. The point of MAME
        is that the art only exists because somebody preserved the
        board. This article is a field-notes diary of one evening
        installing MAME, learning the romset model, getting it to
        run something legal, and writing down the studio&rsquo;s
        relationship with arcade preservation as a research lineage.
        Read alongside{" "}
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
          href="https://www.mamedev.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          MAME{arrow}
        </a>{" "}
        is the Multiple Arcade Machine Emulator, a single project
        that documents and emulates twenty-five years of arcade
        cabinets, electromechanical machines, pinball tables, and
        the obscure dedicated hardware that ran them.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Install &mdash; tonight, the workshop bench</h2>
      <p>
        MAME is on winget but the build tends to lag behind the
        upstream release by a few weeks. The studio recommends the
        direct download path.
      </p>
      <pre className="my-4 overflow-x-auto rounded border border-chrome-700/40 bg-chrome-900/40 p-4 text-sm text-chrome-200">
        <code>{`# Either of these:
winget install MAMEdev.MAME
# or grab the latest from mamedev.org/release.html and unzip into a folder`}</code>
      </pre>
      <p>
        The official binary is a self-contained folder &mdash; drop
        it into <code>D:\emulation\mame\</code>, run
        <code> mame.exe</code> from the folder, that is the install.
        No installer; the program is its own working directory and
        the ROMs, samples, artwork, snapshots and configs all live
        as sub-folders next to the executable.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The romset model</h2>
      <p>
        This is the part the project documentation cannot make
        gentle and the studio will try. An arcade cabinet contained
        multiple ROM chips on its board; each chip dumped becomes a
        separate file. MAME bundles the files for one machine into
        a ZIP, named with MAME&rsquo;s own short identifier for the
        cabinet (eg <code>pacman.zip</code>, <code>dkong.zip</code>,
        <code>galaga.zip</code>). The ZIP lives in <code>mame\roms\</code>.
      </p>
      <p>
        Some cabinets share chips with other cabinets &mdash; a
        common sound chip, a common font ROM &mdash; so MAME uses a
        <em>parent</em>-and-<em>clone</em> model. The parent ZIP
        holds the unique chips; the clone ZIP holds only the chips
        that differ from the parent. To run a clone, both ZIPs must
        be in <code>roms\</code> at once. The romset for a given
        MAME version is the set of ZIPs that satisfies every
        cabinet that version emulates; the romset changes between
        MAME versions as machines are added, redumped, or
        reclassified.
      </p>
      <p>
        Where this gets thorny: most arcade ROMs are still under
        copyright. A handful have been released by their rights
        holders into the wild over the years &mdash; Atari released
        a small number, Capcom released the original CPS-1 boot
        ROMs in some contexts, several Japanese publishers have
        explicitly permitted MAME&rsquo;s preservation use. The
        studio uses these legally-clean ROMs as the bench-side
        material; the project&rsquo;s own documentation, the
        photographs of boards, and the dat-files describing the
        chip layout are the rest of the value. The studio does not
        host arcade ROMs and does not point readers to the sites
        that do.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">First run &mdash; the documentation as art</h2>
      <p>
        Before the first ROM lands in <code>roms\</code>, the studio
        opens the documentation. MAME ships an <code>info</code>
        sub-folder with a per-machine dat-file describing every
        chip on every supported board, with notes from the team who
        dumped it. This is the project&rsquo;s actual lineage as a
        historical record. The dat for <code>pacman</code> lists
        the boards, the masks, the engineers who reverse-engineered
        the timing, the year each chip was decapped and read. The
        artist of 2026 is reading the work of an engineer of 2003
        who read the work of a coin-op cabinet of 1980.
      </p>
      <p>
        Launch the front-end: the official MAME binary is
        command-line first, but the modern build ships an internal
        UI that runs when MAME is launched without a machine name.
        Type <code>mame</code> in the working folder; the UI opens
        to a list of supported machines. Filter by &ldquo;has ROMs
        present&rdquo; to see only the machines you currently have
        the files for. The studio tonight has Atari&rsquo;s released
        ROMs for several games, plus the dedicated-machine ZIPs the
        studio dumped from a personally-owned cabinet at a
        retro-fair years ago.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Controller mapping and Tab-key configuration</h2>
      <p>
        With a machine running, the Tab key opens MAME&rsquo;s
        in-game menu &mdash; this is the single most important
        keybinding to know. From the Tab menu: <em>Input (this
        Machine)</em> rebinds the cabinet&rsquo;s own controls to
        keyboard or pad; <em>Input (general)</em> rebinds the
        emulator&rsquo;s system keys.
      </p>
      <p>
        After the third controller-mapping attempt the studio
        learned MAME&rsquo;s rule: every cabinet has its own
        control surface (steering wheel, trackball, light gun,
        rotary joystick, twin-stick, six-button fight stick), and
        no single pad configuration covers them all. The studio
        keeps three saved input profiles: <em>fight</em> for the
        Capcom-style six-button stick, <em>shoot</em> for the
        twin-stick shooters, and <em>standard</em> for the
        joystick-and-button cabinets. The input system saves to{" "}
        <code>cfg\</code> per machine; the saved configs travel
        with the install.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Save states and frame step</h2>
      <p>
        F7 saves state to a slot; Shift-F7 loads. The slot number
        is prompted on each press. Frame step is bound to N by
        default; the studio rebinds it through the Tab menu to a
        key near pause for muscle memory.
      </p>
      <p>
        Save state in MAME is not as universal as on cartridge
        consoles &mdash; some machines simply do not support state
        save (the team is honest about which; the dat-file
        notes it). For the supported machines the state is
        complete, including coin and credit count, which is
        sometimes funny and sometimes inconvenient.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Capture workflow</h2>
      <p>
        F12 takes a snapshot of the framebuffer; the file lands in
        <code> snap\[machine-name]\</code> as PNG. For an animation
        cycle: pause (P), frame-step with N, snapshot with F12,
        repeat. The studio runs a small PowerShell loop that
        renames each new file with the frame number and copies it
        to the working project folder.
      </p>
      <p>
        For video output, MAME records an AVI on demand:
        <em> File &rarr; Record AVI</em>. The MNG format is also
        supported for lossless animated output. For sprite-sheet
        ripping the studio prefers the still snapshot route &mdash;
        the in-game art is at the native resolution of the cabinet
        (320 by 224 for CPS-1, 256 by 224 for Neo Geo, 224 by 288
        for vertical shooters, the lot), and the framebuffer is
        the right size for direct paste into Aseprite.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The historical-preservation lineage</h2>
      <p>
        This is the part that earns MAME its own article rather
        than a paragraph in the stack overview. MAME began in 1996
        as Nicola Salmoria&rsquo;s personal project to emulate
        early arcade hardware; it grew into a multi-decade
        community effort that has redumped, re-documented and
        verified the chip layouts of more than ten thousand
        machines. The dat-files are a primary historical source on
        the arcade era; researchers cite MAME&rsquo;s dat-files in
        academic work on game preservation.
      </p>
      <p>
        The art the studio cares about &mdash; the pixel-art on
        these boards, the chip-level palette decisions, the
        coin-op rhythm that shaped early sprite design &mdash; only
        exists in a usable form because someone preserved the
        board. The original cabinets are dying. The capacitors leak;
        the ROMs themselves degrade slowly; the cabinets get
        scrapped or burned in warehouse fires. MAME is the
        difference between an art lineage being available and an
        art lineage being lost. This is the framing the studio
        carries into every session.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Artwork and bezels</h2>
      <p>
        MAME supports cabinet artwork &mdash; the bezels, the
        overlays, the marquee that sat above the screen. The
        artwork folder takes per-machine ZIPs containing PNG or
        layout XML. The community-curated artwork project (search
        for &ldquo;mame artwork&rdquo;; the official MAME forums
        link to it) is a sister archive to the romset; the studio
        runs with artwork enabled for the early-eighties cabinets
        whose bezel art is part of the period composition. The
        cabinet around the screen was painted by an artist too;
        the screen is one frame of the original cabinet&rsquo;s art.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The studio&rsquo;s everyday use</h2>
      <p>
        Two reaches per week, roughly. First: reading the dat-files
        for a board the studio is researching. The chip layout, the
        clock speeds, the palette ROM&rsquo;s structure; this is
        primary-source research and the studio treats it that way.
        The notes inform pieces the studio is making that quote
        the period (an LED-matrix piece in the colour ramp of a
        Bally-Midway cabinet, say). Second: capture sessions on
        the released-clean ROMs the studio has on the bench &mdash;
        snapshots, frame-step study, the same workflow as the
        cartridge-era emulators apply here too, with the additional
        constraint that every board has different native dimensions
        and the captures must be filed by board.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Honest verdict</h2>
      <p>
        Good at: the breadth (more than ten thousand machines),
        the documentation (per-machine dat-files are primary-source
        research material), the cabinet artwork support, the
        determinism of the supported save states, the
        historical-preservation lineage that no other project
        equals. The official project commitment to free-and-open
        source through the GPL is the right answer for the
        preservation question; the work is preserved not just as
        a binary but as readable source.
      </p>
      <p>
        No good at: gentle onboarding. The romset model is genuinely
        hard; the parent-and-clone relationships are documented but
        not intuitive. The romset version compatibility is a real
        ongoing thing the artist must keep track of. The ROM
        situation is the thorniest in emulation &mdash; the project
        cannot legally distribute the ROMs and so the studio uses
        the legally-clean subset (released ROMs, owner-dumped
        boards) and treats the rest as documentation rather than
        playable software. The cabinet-control configuration is
        per-machine and the work to configure forty machines is
        forty separate sessions.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">A small benediction</h2>
      <p>
        The artists who painted bezels for early-eighties cabinets
        are mostly anonymous, mostly retired, mostly no longer
        contactable. Their work survives in two forms: in the few
        original cabinets still maintained by the operator
        community, and in the MAME archive that preserves the
        ROM-level and the painted artwork together. The studio sits
        with the documentation more often than with the gameplay;
        the gameplay is one frame of the work, the cabinet is the
        whole work. For the per-system tutorials covering the
        cartridge-era cousins of this archive, the sibling
        tutorials are listed below.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "emulator-tutorial-mame",
  title: "Emulator Tutorial &mdash; MAME",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Field-notes from one evening installing MAME and learning the romset model, with the studio's framing of arcade preservation as a research lineage: this art only exists because somebody preserved the board.",
  Body: EmulatorTutorialMAME,
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
      note: "Cartridge-era cousin to the arcade boards.",
    },
    {
      href: "/articles/emulator-tutorial-dolphin",
      label: "Emulator Tutorial &mdash; Dolphin",
      note: "GameCube and Wii.",
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
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "MAME's lineage on the free-code ladder.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "Constraint as creative driver.",
    },
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "Cabinet palette physics as a working tool.",
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
      href: "https://www.mamedev.org/",
      label: "MAME &mdash; official site",
      note: "Downloads, dat-files, and the documentation lineage.",
    },
    {
      href: "https://docs.mamedev.org/",
      label: "MAME documentation",
      note: "The Tab-menu reference and per-machine notes.",
    },
    {
      href: "https://www.mamedev.org/release.html",
      label: "MAME release page",
      note: "Latest binary; the romset version is here too.",
    },
  ],
};
