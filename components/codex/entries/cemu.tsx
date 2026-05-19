export default function Cemu() {
  return (
    <>
      <p>
        Cemu is the open-source Wii U emulator, written in C++ for
        Windows, Linux and macOS, licensed MPL-2.0. The project was
        started in 2015 by an anonymous developer who released it as
        closed-source freeware until 25 August 2022, when the source
        was opened on GitHub under the current licence. The
        open-sourcing made Cemu the only credible Wii U emulator in
        the wild &mdash; Nintendo&rsquo;s own Wii U mode in the
        Switch ecosystem was never built, and Dolphin&rsquo;s Wii
        emulation does not extend to the Wii U&rsquo;s newer PowerPC
        cores and gamepad. Source at{" "}
        <code className="font-mono text-chrome-200">
          github.com/cemu-project/Cemu
        </code>
        .<sup>1</sup>
      </p>
      <p>
        The Wii U is worth covering despite its short commercial life
        (2012-2017) because of what was made for it: Breath of the
        Wild and its DLC, Splatoon 1, the Bayonetta 2 port, Mario
        Kart 8 in its original 60fps configuration, the New Super
        Mario Bros U pair, Pikmin 3, the Wonderful 101, Captain
        Toad Treasure Tracker, Xenoblade Chronicles X. Several of
        these never received Switch ports; several others received
        cut-down Switch ports that removed the gamepad-specific
        second-screen mechanics. Cemu is the only path to the
        original versions for the audience that owns the disc but
        no longer has working Wii U hardware. The Wii U eShop closed
        on 27 March 2023; physical discs remain available
        second-hand.
      </p>
      <p>
        The MPL-2.0 licence matters. MPL is file-level copyleft
        rather than the whole-program copyleft of GPL, which makes
        wrapping Cemu in adjacent tooling materially easier than
        wrapping (say) RPCS3. The studio&rsquo;s bench-bridge route
        described in{" "}
        <code className="font-mono text-chrome-200">
          docs/EMULATION-NATIVE.md
        </code>{" "}
        passes through process boundaries either way &mdash; the
        helper service shells out to the emulator binary &mdash; so
        the licence question is largely moot for the bridge
        pattern. It would matter if the studio wanted to embed Cemu
        as a library, which it does not plan to.
      </p>
      <p>
        Cemu is on the bench-bridge side of{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>
        . The Wii U&rsquo;s Espresso (PowerPC 750-derived) CPU and
        Latte GPU need JIT support to run at speed; WASM does not
        reach that performance bar today. The bridge-strategy doc
        sketches the route &mdash; helper on the user&rsquo;s
        machine, streamed framebuffer over WebRTC, controller input
        back via WebSocket. Cemu is on the second-pass list of
        emulators to bridge, after the Eden / Azahar / PPSSPP
        first pass.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Cemu&rsquo;s open-sourcing in August 2022 was the
          single biggest event for Wii U preservation. Before that
          date the project was a closed-source freeware binary with
          a Patreon; afterwards it became a community project with
          dozens of contributors. The initial code drop included
          most of the prior history reconstructed from the
          original developer&rsquo;s working tree.
        </li>
      </ol>
    </>
  );
}
