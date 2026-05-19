export default function MelonDs() {
  return (
    <>
      <p>
        melonDS is the open-source Nintendo DS (and DSi) emulator
        written in C++ by Arisotura since 2016, licensed GPL-3.0.
        Source at{" "}
        <code className="font-mono text-chrome-200">
          github.com/melonDS-emu/melonDS
        </code>
        , with the legacy primary at{" "}
        <code className="font-mono text-chrome-200">
          github.com/Arisotura/melonDS
        </code>{" "}
        kept as a mirror. The project is one of the most carefully
        engineered open-source emulators on the public internet and
        is the studio&rsquo;s recommended DS emulator over the older
        DeSmuME.<sup>1</sup>
      </p>
      <p>
        The DS is interesting from a visual-systems perspective
        because of its dual-screen architecture and its 3D
        pipeline&rsquo;s deliberate limitations. The top and bottom
        screens are independent 256&times;192 framebuffers backed by
        separate VRAM banks; the 3D engine can render to either or
        both but has a hard 2048-polygon-per-frame budget and a
        fixed-function texture-coordinate pipeline that is closer to
        the PS1&rsquo;s than to the PSP&rsquo;s. The result is a
        visual language &mdash; Phoenix Wright, Hotel Dusk, Trauma
        Center, Ghost Trick, the Pokemon Black/White pair, Picross
        3D, Etrian Odyssey &mdash; that no other generation matches.
      </p>
      <p>
        Of interest for the website: a WASM build of melonDS exists
        at{" "}
        <code className="font-mono text-chrome-200">
          github.com/44670/melonDS-wasm
        </code>{" "}
        and EmulatorJS includes a melonDS-derived core. The DS is
        therefore on the &ldquo;browser-WASM-available&rdquo; side
        of the catalogue at{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>{" "}
        &mdash; the existing /emulator surface can already host it
        through the EmulatorJS pattern, and the standalone is
        available for the studio&rsquo;s bench work. DSi
        functionality is partial in the WASM core but complete in
        the standalone; local-wireless multiplayer is being worked
        on in the standalone and is not in the WASM core.
      </p>
      <p>
        For the studio specifically: melonDS is in the catalogue
        because the DS is one of the most-asked-about systems for
        the /emulator surface and the existing core already covers
        most of the audience need. The native emulator is the
        reference for any reference-research work that needs the
        DSi-mode features the WASM core lacks.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          DeSmuME (active since 2006, GPL-2.0) remains in active
          maintenance and is the long-running alternative. melonDS
          is faster, more accurate on the 3D pipeline, and runs
          DSi software where DeSmuME does not. The choice between
          them comes down to the title; for the studio the default
          is melonDS.
        </li>
      </ol>
    </>
  );
}
