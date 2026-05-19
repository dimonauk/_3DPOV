export default function CitraAnd3dsEmulatorForks() {
  return (
    <>
      <p>
        Citra was the open-source Nintendo 3DS emulator developed by
        Tropic Haze from 2014 until 4 March 2024, when Nintendo&rsquo;s
        settlement with the same team over yuzu required its takedown.
        The original Citra repository at{" "}
        <code className="font-mono text-chrome-200">
          github.com/citra-emu/citra
        </code>{" "}
        was archived and made inaccessible; the project&rsquo;s
        website still resolves but redirects to a static notice page.
        The codebase, however, is GPL-2.0 and the fork ecosystem
        survived. As of 2026-05-19, the recommended 3DS emulator is
        Azahar &mdash; the consolidated merger of two earlier forks
        (PabloMK7&rsquo;s Citra fork and Lime3DS), itself based on
        Citra, source at{" "}
        <code className="font-mono text-chrome-200">
          github.com/azahar-emu/azahar
        </code>
        .<sup>1</sup>
      </p>
      <p>
        The fork landscape is worth walking through because it
        changed several times in two years and most published
        recommendations are now out of date. The four serious
        candidates immediately after the takedown were:{" "}
        <strong>Lime3DS</strong>, started by community contributors
        within days of the original&rsquo;s removal;{" "}
        <strong>PabloMK7&rsquo;s Citra fork</strong>, maintained by a
        long-time Citra contributor; <strong>Mandarine</strong>, a
        slightly later fork emphasising Linux performance; and{" "}
        <strong>Borked3DS</strong>, an experimental sandbox combining
        code from all three. Lime3DS and PabloMK7&rsquo;s fork
        recognised the duplication of effort and merged in 2025 to
        form Azahar. Mandarine quietly stopped. Borked3DS remains
        active but slow &mdash; the last release at time of writing
        is 11 March 2025 &mdash; and is recommended only for its
        sandbox-specific features (the Skylanders IR portal path on
        desktop is the noteworthy one). For most uses, Azahar is the
        right starting point.<sup>2</sup>
      </p>
      <p>
        Legally the situation is settled clean. The Citra source code
        contained no copyrighted Nintendo material; the takedown was
        about the Tropic Haze team&rsquo;s adjacent commercial
        activity around yuzu&rsquo;s Patreon-funded early-release
        program, not about the emulator source itself. The GPL-2.0
        licence permits forks; the forks are forks of a licensed
        codebase, and they carry no Nintendo material of their own.
        BIOS files (the 3DS&rsquo;s ARM11 + ARM9 firmware) and game
        ROMs remain copyrighted &mdash; the studio&rsquo;s working
        position is unchanged: BYO from your own legally-dumped
        console and game cartridges.
      </p>
      <p>
        For the website, Azahar sits in the native-only-with-a-bridge
        column of{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>
        . The 3DS&rsquo;s dual-screen plus stereo-3D rendering and
        the PICA200 GPU&rsquo;s vertex-shader pipeline both need a
        JIT for usable speed; WebAssembly doesn&rsquo;t reach that
        bar in 2026. The bench-bridge route in{" "}
        <code className="font-mono text-chrome-200">
          docs/EMULATION-NATIVE.md
        </code>{" "}
        is the recommended path for surfacing it from the studio
        site &mdash; Azahar runs on the user&rsquo;s machine, the
        site streams the framebuffer back over WebRTC. Bench
        deployment is the next pass; the codex entry is the
        pointer.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The Azahar website is{" "}
          <code className="font-mono">azahar-emu.org</code> and the
          Android version is available through Google Play under the
          legacy package name (
          <code className="font-mono">io.github.lime3ds.android</code>
          ). An &ldquo;Azahar Plus&rdquo; fork exists at{" "}
          <code className="font-mono">github.com/AzaharPlus/AzaharPlus</code>{" "}
          adding extra features &mdash; usable, but not the
          recommended default.
        </li>
        <li>
          The 2026 supply-chain incident worth noting: Azahar issued
          an unscheduled release with no user-facing changes after
          the TeamPCP attacks, hardening its build-time security
          policies. This is the kind of housekeeping that
          community-maintained projects do well and that the
          original Citra project, before takedown, also did.
        </li>
      </ol>
    </>
  );
}
