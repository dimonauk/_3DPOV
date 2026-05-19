export default function Vita3k() {
  return (
    <>
      <p>
        Vita3K is the open-source PlayStation Vita emulator written in
        C++ for Windows, Linux, macOS and Android, licensed GPL-2.0.
        It is the first &mdash; and as of 2026-05-19 still the only
        &mdash; functional open-source Vita emulator with serious
        development activity. Source at{" "}
        <code className="font-mono text-chrome-200">
          github.com/Vita3K/Vita3K
        </code>
        . The project remains explicitly experimental: the official
        site notes that users should &ldquo;expect crashes, glitches,
        low compatibility and poor performance&rdquo;.<sup>1</sup>
      </p>
      <p>
        The Vita is worth tracking for two reasons. First,
        Sony&rsquo;s commercial preservation story for it is the
        worst of any modern handheld &mdash; the PSN store closed
        for new Vita purchases on 27 August 2021, the Maintenance
        Mode of the console&rsquo;s firmware has been the project
        baseline since 2019, and the SD-card-via-microSD-adapter
        workaround for the proprietary memory cards is the only path
        to running a personally-owned cartridge dump on real
        hardware. Second, the Vita catalogue contains a number of
        genuinely interesting late-2010s Japanese titles &mdash; the
        Persona 4 Golden pre-port, the Danganronpa pair, Gravity
        Rush, Soul Sacrifice, the Tearaway pair, Wipeout 2048 &mdash;
        that did not all receive ports elsewhere.
      </p>
      <p>
        Vita3K&rsquo;s pace is slower than (say) RPCS3&rsquo;s. The
        compatibility list shows fewer playable titles, and the
        emulator requires user-installed firmware modules from a
        legally-owned Vita to run most software. The project&rsquo;s
        position on this is the same as PCSX2&rsquo;s on PS2 BIOS
        files: the user dumps from their own hardware, the project
        does not ship the firmware.
      </p>
      <p>
        For the website Vita3K sits in the bench-bridge column of{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>
        . The Vita&rsquo;s quad-core ARM Cortex-A9 plus PowerVR SGX543MP4
        GPU need a host with both JIT capability and a competent
        graphics pipeline; WASM doesn&rsquo;t reach that bar today.
        The bridge route in{" "}
        <code className="font-mono text-chrome-200">
          docs/EMULATION-NATIVE.md
        </code>{" "}
        is the recommended path. Vita3K is on the second-pass list,
        after the first wave covers Eden / Azahar / PPSSPP.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The official site is{" "}
          <code className="font-mono">vita3k.org</code>; nightly
          builds are at the Vita3K organisation&rsquo;s builds
          repository on GitHub. Recent 2026 activity includes
          controller-refresh fixes, GUI work and a correction for
          macOS A-key mapping.
        </li>
      </ol>
    </>
  );
}
