export default function EdenEmulator() {
  return (
    <>
      <p>
        Eden is an open-source Nintendo Switch emulator written in C++
        for Windows, Linux, macOS and Android, distributed under
        GPL-3.0. It is the most active community continuation of the
        codebase that began as yuzu in 2018, was settled out of
        existence on 4 March 2024 after Nintendo&rsquo;s lawsuit, and
        has since passed through several short-lived forks (Suyu,
        Sudachi, Citron) before consolidating around Eden. The primary
        source repository is self-hosted at{" "}
        <code className="font-mono text-chrome-200">
          git.eden-emu.dev/eden-emu/eden
        </code>
        ; a mirror lives on GitHub and a separate repo holds the
        binary releases.<sup>1</sup>
      </p>
      <p>
        The lineage is worth tracking because the forks aren&rsquo;t
        interchangeable. yuzu was the original Tropic Haze project,
        settled and taken offline. Suyu picked up the codebase
        immediately afterwards and stopped development on 13 February
        2025. Sudachi briefly held the lineage and was hit with its
        own DMCA. Citron continued from Sudachi but introduced DRM and
        telemetry that several of the developers disagreed with; the
        Eden fork was created in protest, restoring the no-telemetry
        position and keeping the GPL-3.0 licence intact. As of
        2026-05-19 Eden is the only one of the five with active
        commits and a public Android development track.<sup>2</sup>
      </p>
      <p>
        The studio&rsquo;s interest is preservation rather than play.
        Nintendo&rsquo;s post-PS2 catalogue has the patchiest
        commercial preservation story in the canon &mdash; the Wii U
        eShop closed in 2023, the 3DS eShop closed the same year, and
        the Switch&rsquo;s online library is a curated subset of an
        older curated subset. Eden is what makes the rest of that
        library reachable for the audience that owns the cartridges
        and is willing to dump them. The studio&rsquo;s working
        position throughout is BYO from your own legally-dumped
        hardware; the catalogue links out to Eden as a tool, never
        hosts ROMs or Switch firmware, and treats the question of
        access as the user&rsquo;s rather than the studio&rsquo;s.
      </p>
      <p>
        For the website specifically, Eden is on the &ldquo;native-only
        with a bench bridge&rdquo; side of the catalogue at{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>
        . It needs a JIT to run Switch code at usable speed, and a
        browser sandbox doesn&rsquo;t offer one. The studio&rsquo;s
        bridge-strategy doc (see{" "}
        <code className="font-mono text-chrome-200">
          docs/EMULATION-NATIVE.md
        </code>
        ) sketches a Tailscale-Funnel route from the
        user&rsquo;s machine to the website, reusing the pattern that
        already serves the SHARP gaussian-splat inference path. Eden
        is the first candidate for that bridge precisely because the
        gap it covers is the most useful.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Eden&rsquo;s GitHub presence is at{" "}
          <code className="font-mono">github.com/eden-emulator</code>{" "}
          (mirror + binary releases). The primary git is at{" "}
          <code className="font-mono">git.eden-emu.dev</code>, a
          Gitea instance the project moved to after Nintendo&rsquo;s
          February 2026 DMCA wave targeting Switch-emulator forks on
          GitHub. The licence text is unchanged GPL-3.0-or-later.
        </li>
        <li>
          The yuzu settlement number was $2.4M paid by the four-person
          Tropic Haze team; the same team had previously developed
          Citra (3DS) and was required to take that down too as part
          of the same settlement. Eden has no connection to Tropic
          Haze beyond the inherited codebase, and shares no
          contributors with Citron beyond the developers who left
          Citron to start Eden.
        </li>
      </ol>
    </>
  );
}
