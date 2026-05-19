export default function ReactThreeFiber() {
  return (
    <>
      <p>
        React Three Fiber, written{" "}
        <code className="font-mono text-chrome-200">@react-three/fiber</code>{" "}
        and usually shortened to R3F, is Poimandres&rsquo; React
        reconciler for Three.js. A scene is described as JSX: a{" "}
        <code className="font-mono text-chrome-200">&lt;mesh&gt;</code>{" "}
        element holds geometry and material children; props map to
        Three.js object properties; the React reconciler diffs the
        tree on each render and applies the changes to the underlying
        Three.js scene graph. The visible effect is that a 3D scene
        becomes composable in the same way a DOM tree is: components,
        props, state, effects, the lot.<sup>1</sup>
      </p>
      <p>
        The model has two seams worth understanding. State that
        belongs in React (component visibility, configuration flags,
        UI bindings) drives the JSX tree and goes through the
        reconciler. State that updates every frame (animation
        progress, the camera following a target, particle position)
        belongs inside the{" "}
        <code className="font-mono text-chrome-200">useFrame</code>{" "}
        hook, which runs once per render-loop tick and mutates Three.js
        objects directly &mdash; outside React&rsquo;s diff. The
        boundary is the whole performance story: anything that wants
        to update at 90 Hz must skip the reconciler and go through
        useFrame.
      </p>
      <p>
        The studio reaches for R3F over imperative Three.js for two
        reasons. The declarative scene-as-JSX model composes with the
        rest of the codebase &mdash; the same React patterns work in
        the bureau&rsquo;s 2D shell and in the 3D scene without
        switching idioms &mdash; and the surrounding ecosystem is
        worth its weight. Drei (
        <code className="font-mono text-chrome-200">@react-three/drei</code>
        ) ships a deep library of useful primitives: OrbitControls,
        environment lighting, helpful camera-rig components, the{" "}
        <code className="font-mono text-chrome-200">Text</code>{" "}
        wrapper around Troika, the GLTF loader hook. The XR companion (
        <code className="font-mono text-chrome-200">@react-three/xr</code>
        ) wraps the WebXR session lifecycle in the same JSX idiom.
        Postprocessing, Rapier physics, and the rest of the
        Poimandres stack drop in without ceremony.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/troika-three-text"
          className="text-pink-200 underline underline-offset-4"
        >
          Troika Three Text
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
          href="/codex/tsl-three-shading-language"
          className="text-pink-200 underline underline-offset-4"
        >
          TSL
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://r3f.docs.pmnd.rs/"
            className="text-pink-200 underline underline-offset-4"
          >
            React Three Fiber documentation
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/pmndrs/react-three-fiber"
            className="text-pink-200 underline underline-offset-4"
          >
            pmndrs/react-three-fiber
          </a>{" "}
          &mdash; source repository.
        </li>
        <li>
          <a
            href="https://github.com/pmndrs/drei"
            className="text-pink-200 underline underline-offset-4"
          >
            pmndrs/drei
          </a>{" "}
          &mdash; the helper library that does most of the heavy
          lifting in studio code.
        </li>
        <li>
          <a
            href="https://github.com/pmndrs/xr"
            className="text-pink-200 underline underline-offset-4"
          >
            pmndrs/xr
          </a>{" "}
          &mdash; WebXR bindings for R3F.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The Poimandres collective (pmndrs) is the open-source
          umbrella that maintains R3F, drei, Jotai, Zustand,
          react-spring, and a long list of adjacent libraries. R3F is
          MIT-licensed; the rest of the stack follows.
        </li>
      </ol>
    </>
  );
}
