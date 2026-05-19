export default function Rpcs3() {
  return (
    <>
      <p>
        RPCS3 is the open-source PlayStation 3 emulator and debugger,
        written in C++ for Windows, Linux, macOS and FreeBSD, licensed
        GPL-2.0-only. The project began in 2011 and is one of the
        longest-running active emulators on the public internet; as of
        April 2026 the project reports over 70% of the PS3 library
        playable end-to-end, with most of the remainder &ldquo;ingame&rdquo;
        or &ldquo;menu&rdquo; status. Source at{" "}
        <code className="font-mono text-chrome-200">
          github.com/RPCS3/rpcs3
        </code>
        , builds at{" "}
        <code className="font-mono text-chrome-200">rpcs3.net/download</code>
        .<sup>1</sup>
      </p>
      <p>
        The PS3 is the hardest mainstream console to emulate. Its Cell
        processor pairs a PowerPC PPE with eight (six usable) SPE
        co-processors that don&rsquo;t share the PPE&rsquo;s memory
        model; the GPU is an Nvidia RSX based on the GeForce 7800
        with a custom command processor. Game code routinely uses the
        SPEs for graphics-adjacent work that other consoles delegate
        to the GPU, which makes the emulator&rsquo;s job of mapping
        guest code onto host hardware genuinely novel. RPCS3 solves
        it with a recompiler that targets x86-64 and (since 2024)
        ARM64, plus OpenGL and Vulkan back-ends for the RSX side. The
        emulator runs Demon&rsquo;s Souls, the Uncharted trilogy and
        the Yakuza/Ryu ga Gotoku catalogue in a state most reviewers
        consider preferable to the original hardware.<sup>2</sup>
      </p>
      <p>
        For the studio the project is interesting both as preservation
        infrastructure (Sony&rsquo;s PS3 store closed for new
        purchases on most regions in 2021; the digital library
        remains accessible but the access path is brittle) and as a
        documented engineering achievement. The development log on
        rpcs3.net is one of the best long-form software diaries on
        the public internet &mdash; what a non-trivial open-source
        team looks like across fifteen years of work. The 2026
        announcement asking contributors to stop submitting
        AI-generated pull requests is a useful artefact in its own
        right; the project&rsquo;s reasoning is that an AI patch
        without a human author taking responsibility for the
        reasoning is a maintenance liability the maintainers
        won&rsquo;t accept.<sup>3</sup>
      </p>
      <p>
        For the website specifically, RPCS3 sits in the
        bench-bridge column of{" "}
        <code className="font-mono text-chrome-200">
          lib/emulator/native-systems.ts
        </code>
        . PS3 emulation needs a high-spec host machine
        (RPCS3&rsquo;s recommended baseline is a recent x86-64 CPU
        with 16GB+ of RAM and a dedicated GPU); the realistic surface
        for it on a website is a user-installed helper exposing the
        emulator to the studio site over Tailscale Funnel. The
        bridge-strategy doc at{" "}
        <code className="font-mono text-chrome-200">
          docs/EMULATION-NATIVE.md
        </code>{" "}
        sketches the route.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Game compatibility data is maintained at{" "}
          <code className="font-mono">rpcs3.net/compatibility</code>{" "}
          and tracked in a public wiki on the GitHub repo. The
          status categories are Playable, Ingame, Intro, Loadable
          and Nothing &mdash; the project is admirably precise about
          where each title sits.
        </li>
        <li>
          PS3 firmware is required for most titles and is licensed
          by Sony. RPCS3&rsquo;s install guide directs users to
          download the firmware from Sony&rsquo;s official servers
          (which still serve it) &mdash; the studio&rsquo;s position
          is that this is the legally clean route for any user who
          wishes to run a personally-owned PS3 disc through the
          emulator.
        </li>
        <li>
          The August 2025 AI-PR thread is at{" "}
          <code className="font-mono">github.com/RPCS3/rpcs3</code>{" "}
          in issues; the equivalent policy from a maintainer
          perspective also appears in the project&rsquo;s
          contributor guide.
        </li>
      </ol>
    </>
  );
}
