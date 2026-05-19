export default function VrmVirtualRealityModel() {
  return (
    <>
      <p>
        VRM &mdash; <em>Virtual Reality Model</em> &mdash; is a file
        format for humanoid 3D avatars. Technically it&rsquo;s an
        extension on top of glTF 2.0: a binary{" "}
        <code className="font-mono text-chrome-200">.vrm</code> file
        is a valid glb that an extra JSON block on top describing
        the rig, the material set, the expressions, the spring-bone
        physics, and the licence terms under which the avatar may be
        used. Any glTF loader can read the mesh; a VRM-aware loader
        also reads the rest of the contract.<sup>1</sup>
      </p>
      <p>
        The standardisation that matters is the rigging convention.
        Every VRM file uses the same humanoid bone names, the same
        rest-pose orientation (T-pose, facing +Z), and the same scale
        convention (one Three.js unit equals one metre). The
        practical consequence is that animation written for one VRM
        plays back on any other VRM without retargeting. A dance
        capture authored against the reference rig drives Aura, drives
        a different character, drives a third community-uploaded
        avatar &mdash; same{" "}
        <code className="font-mono text-chrome-200">.vmd</code> or{" "}
        <code className="font-mono text-chrome-200">.bvh</code>{" "}
        file, no per-avatar rebinding step.
      </p>
      <p>
        The format split is worth knowing. VRM 0.x (2018&ndash;2021)
        used a custom JSON extension and a slightly idiosyncratic
        coordinate convention. VRM 1.0 (2022) restructured the spec
        as a clean set of glTF extensions (
        <code className="font-mono text-chrome-200">
          VRMC_vrm
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          VRMC_materials_mtoon
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          VRMC_springBone
        </code>
        ), tightened the licence-metadata schema, and aligned the
        coordinate system with the glTF default (+Y up, -Z forward).
        Most authoring tools (VRoid Studio, Blender&rsquo;s VRM
        add-on) export 1.0 by default; most older files in the wild
        are still 0.x. @pixiv/three-vrm loads both.
      </p>
      <p>
        For the studio, VRM is the substrate underneath every Aura
        scene. The avatar file at{" "}
        <code className="font-mono text-chrome-200">
          public/models/aura.vrm
        </code>{" "}
        ships the MToon material set, the spring-bone hair physics,
        and the morph-target expression set; Three.js loads it via
        @pixiv/three-vrm, and the same file plays back inside a
        WebXR session on a Quest 3 and inside a flat browser preview
        on a desktop.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/mtoon"
          className="text-pink-200 underline underline-offset-4"
        >
          MToon
        </a>
        ,{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        ,{" "}
        <a
          href="/codex/react-three-fiber"
          className="text-pink-200 underline underline-offset-4"
        >
          React Three Fiber
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://vrm.dev/en/"
            className="text-pink-200 underline underline-offset-4"
          >
            vrm.dev
          </a>{" "}
          &mdash; consortium developer hub.
        </li>
        <li>
          <a
            href="https://github.com/vrm-c/vrm-specification"
            className="text-pink-200 underline underline-offset-4"
          >
            VRM specification repository
          </a>
          .
        </li>
        <li>
          <a
            href="https://vroid.com/en/studio"
            className="text-pink-200 underline underline-offset-4"
          >
            VRoid Studio
          </a>{" "}
          &mdash; Pixiv&rsquo;s free VRM avatar editor.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The VRM Consortium was incorporated in Japan in 2019, with
          Pixiv, Dwango, and several other VTuber-adjacent companies
          as founding members. The format reflects that lineage: the
          standard expression set (joy, anger, sorrow, fun, blink,
          blink-left, blink-right, A, I, U, E, O) is biased toward
          live-streaming faces, not toward film-grade performance
          capture.
        </li>
      </ol>
    </>
  );
}
