export default function TroikaThreeText() {
  return (
    <>
      <p>
        Troika Three Text is a Three.js library for rendering crisp,
        anti-aliased text directly into a 3D scene. It belongs to the
        broader{" "}
        <a
          href="https://github.com/protectwise/troika"
          className="text-pink-200 underline underline-offset-4"
        >
          Troika
        </a>{" "}
        toolkit (originally Protect Wise; now community-maintained),
        and the text package itself is{" "}
        <code className="font-mono text-chrome-200">
          troika-three-text
        </code>
        . MIT licensed. The trick at the centre of it is using
        signed distance fields: each glyph is cached as a small 2D
        SDF, and the fragment shader samples that SDF at render time
        to recover a hard antialiased edge at any zoom level.<sup>1</sup>
      </p>
      <p>
        This is the technique that makes body-text in 3D actually
        feasible. The Three.js{" "}
        <code className="font-mono text-chrome-200">TextGeometry</code>{" "}
        path triangulates each glyph outline into actual mesh
        triangles &mdash; a serif typeface at body-text counts blows
        the triangle budget in a paragraph, and the result still
        aliases when the camera pulls back because the triangulation
        is fixed at authoring time. SDF text caches one small texture
        per glyph and renders each letter as a single textured quad;
        an entire page of prose costs roughly the same as a single
        sprite per character, and the antialiasing comes from the
        SDF&rsquo;s smooth-step rather than from MSAA on the
        triangulated outline.
      </p>
      <p>
        For the studio, Troika is the substrate underneath
        MeshProseLayer &mdash; the system that places extended-form
        writing inside scene composition without crashing the
        frametime budget. The same library renders the floating UI
        labels in the bureau, the wall-piece captions in the
        sculpture gallery, and the in-headset reading panel where
        long-form prose lives during a WebXR session. Glyph cache,
        SDF resolution, line-wrap algorithm, and the bevel /
        outline / stroke decorations are all configurable per
        instance.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/sdf-signed-distance-field"
          className="text-pink-200 underline underline-offset-4"
        >
          SDF
        </a>
        ,{" "}
        <a
          href="/codex/react-three-fiber"
          className="text-pink-200 underline underline-offset-4"
        >
          React Three Fiber
        </a>
        ,{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://protectwise.github.io/troika/troika-three-text/"
            className="text-pink-200 underline underline-offset-4"
          >
            troika-three-text documentation
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/protectwise/troika"
            className="text-pink-200 underline underline-offset-4"
          >
            protectwise/troika
          </a>{" "}
          &mdash; the parent toolkit repository.
        </li>
        <li>
          <a
            href="https://github.com/Chlumsky/msdfgen"
            className="text-pink-200 underline underline-offset-4"
          >
            msdfgen
          </a>{" "}
          &mdash; multi-channel SDF generator used by Troika under
          the hood for the sharper-corner variant.
        </li>
        <li>
          Chris Green (Valve),{" "}
          <a
            href="https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf"
            className="text-pink-200 underline underline-offset-4"
          >
            Improved Alpha-Tested Magnification for Vector Textures
            (SIGGRAPH 2007)
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The drei React Three Fiber companion library wraps Troika as
          its{" "}
          <code className="font-mono text-chrome-200">&lt;Text /&gt;</code>{" "}
          component &mdash; the most common entry point for studio
          code. Drei adds the JSX wiring; Troika does the SDF work.
        </li>
      </ol>
    </>
  );
}
