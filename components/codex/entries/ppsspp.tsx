export default function Ppsspp() {
  return (
    <>
      <p>
        PPSSPP is the open-source PlayStation Portable emulator written
        in C++ by Henrik Rydgård since 2012, licensed GPL-2.0-or-later.
        It runs on Windows, Linux, macOS, Android, and iOS, plus a
        handful of niche targets (UWP, Switch homebrew, Symbian-era
        Nokia builds in the early years). PPSSPP is an HLE (high-level
        emulation) project &mdash; it re-implements the PSP&rsquo;s
        firmware function-by-function rather than modelling the
        hardware at the cycle level, which is why it does not require
        a BIOS dump. Source at{" "}
        <code className="font-mono text-chrome-200">
          github.com/hrydgard/ppsspp
        </code>
        .<sup>1</sup>
      </p>
      <p>
        The PSP itself is worth the studio&rsquo;s attention for two
        reasons: it was the first widely-deployed handheld with a 3D
        rasteriser of meaningful complexity (the Allegrex MIPS core
        plus a custom GE graphics engine), and its catalogue is full
        of late-2000s Japanese visual experiments that did not get
        ports elsewhere &mdash; the Patapon trilogy, LocoRoco,
        Lumines, the Persona 1 and 2 remakes, the Wipeout Pure
        synthwave palette. The hardware constraint at 480&times;272
        with around 2MB of texture RAM produced a visual language
        the studio considers worth study.
      </p>
      <p>
        The reason PPSSPP earns a separate entry from the bench
        emulators in the EmulatorJS catalogue is the texture
        replacement pipeline. PPSSPP can be run with
        &ldquo;dump textures&rdquo; enabled, which writes every
        texture the game asks for to disk as PNG with a content-hash
        filename; the same emulator will then re-read the dumped
        folder, look up replacements by hash, and substitute
        higher-resolution hand-painted versions live during gameplay.
        For art-research this is a working tool &mdash; the studio
        can extract the original 64&times;64 character portrait,
        repaint it at 1024&times;1024, drop the replacement back
        in, and study how the upscale composes against the
        original rasteriser&rsquo;s pixel grid. The community has
        produced extensive replacement packs (mostly for games
        whose rights-holders tolerate it); the technique itself is
        what matters here.<sup>2</sup>
      </p>
      <p>
        For the website, PPSSPP sits in the bench-bridge column of{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>
        . A WASM build would be feasible in principle &mdash;
        PPSSPP&rsquo;s HLE architecture is friendlier to compilation
        targets than a Switch or PS3 emulator&rsquo;s &mdash; but
        none currently exists in maintained form. The
        bench-bridge route in{" "}
        <code className="font-mono text-chrome-200">
          docs/EMULATION-NATIVE.md
        </code>{" "}
        is the recommended path; PPSSPP is one of the three the
        studio plans to surface first (Eden + Azahar + PPSSPP for
        Switch + 3DS + PSP).
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          A Libretro core wrapping PPSSPP exists and is shipped
          inside RetroArch as{" "}
          <code className="font-mono">ppsspp_libretro</code>. The
          standalone has more aggressive features (texture
          replacement is the obvious one); the core is more
          convenient if PPSSPP is one of many emulators sharing a
          common front-end.
        </li>
        <li>
          The texture-replacement folder structure is documented at{" "}
          <code className="font-mono">
            github.com/hrydgard/ppsspp/wiki/Texture-replacement
          </code>
          . The studio&rsquo;s working note: read the wiki page
          first before either dumping or substituting; the hash
          format and the folder layout are specific, and a
          mis-named replacement will silently fail to load.
        </li>
      </ol>
    </>
  );
}
