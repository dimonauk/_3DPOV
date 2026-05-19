export default function TslThreeShadingLanguage() {
  return (
    <>
      <p>
        TSL &mdash; <em>Three.js Shading Language</em> &mdash; is the
        node-based, WebGPU-first shader language that ships inside
        Three.js as the{" "}
        <code className="font-mono text-chrome-200">three/tsl</code>{" "}
        module. Rather than writing GLSL or WGSL by hand, the author
        composes a graph of typed nodes &mdash; constants, varyings,
        uniforms, sampled textures, mathematical operations &mdash; and
        Three.js compiles that graph down to whichever backend the
        scene is rendering on. WebGPU gets WGSL; WebGL2 gets GLSL ES
        300; the application code is unchanged either way.<sup>1</sup>
      </p>
      <p>
        TSL exists because raw{" "}
        <code className="font-mono text-chrome-200">ShaderMaterial</code>{" "}
        graphs in Three.js had been quietly accumulating problems for
        years. Hand-written GLSL didn&rsquo;t survive the move to
        WebGPU. Three.js&rsquo;s own internal material chain
        (MeshPhysicalMaterial, MeshStandardMaterial, and so on) was
        re-implemented twice over to keep parity between backends, and
        community shaders bit-rotted every time the engine&rsquo;s
        internal uniforms drifted. TSL collapses that cost: the same
        node graph survives the backend change, the same graph composes
        with the engine&rsquo;s lighting model, and the same graph
        can be extended by reading and writing through the standard
        material&rsquo;s node hooks (
        <code className="font-mono text-chrome-200">colorNode</code>,{" "}
        <code className="font-mono text-chrome-200">emissiveNode</code>,{" "}
        <code className="font-mono text-chrome-200">positionNode</code>
        ) rather than by forking the whole shader.<sup>2</sup>
      </p>
      <p>
        For the studio, TSL is the substrate underneath the entire
        material library at{" "}
        <code className="font-mono text-chrome-200">
          lib/tsl-materials/
        </code>{" "}
        and the post-processing pack at{" "}
        <code className="font-mono text-chrome-200">lib/tsl-post/</code>
        . Every preset (chrome, foil, holographic, waveguide-glow,
        iridescent-soap, glow-rim) is a TSL graph; every post pass
        (bloom, paper-grain, Bayer dither, tone-map) is a TSL fragment.
        The standing direction is WebGPU + TSL first, with WebGL2 as
        the honest fallback &mdash; which TSL delivers without a
        second authoring pass.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/webgpu"
          className="text-pink-200 underline underline-offset-4"
        >
          WebGPU
        </a>
        ,{" "}
        <a
          href="/codex/mtoon"
          className="text-pink-200 underline underline-offset-4"
        >
          MToon
        </a>
        ,{" "}
        <a
          href="/codex/ramp-shading"
          className="text-pink-200 underline underline-offset-4"
        >
          ramp shading
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language"
            className="text-pink-200 underline underline-offset-4"
          >
            Three.js Shading Language wiki
          </a>{" "}
          &mdash; the canonical node reference.
        </li>
        <li>
          <a
            href="https://threejs.org/examples/?q=webgpu"
            className="text-pink-200 underline underline-offset-4"
          >
            Three.js WebGPU examples
          </a>{" "}
          &mdash; runnable TSL material + post samples.
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/tree/dev/src/nodes"
            className="text-pink-200 underline underline-offset-4"
          >
            Source &mdash; three/src/nodes
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          TSL graduated from an external{" "}
          <code className="font-mono">three.js-nodes</code>{" "}
          experiment maintained largely by Renato Sousa
          (sunag) into a core Three.js module around r150, and became
          the official authoring surface for{" "}
          <code className="font-mono">WebGPURenderer</code> from r160
          onwards.
        </li>
        <li>
          The node model is not unique to Three.js &mdash; Unity&rsquo;s
          Shader Graph, Unreal&rsquo;s Material Editor, and Blender&rsquo;s
          Shader Editor all share the lineage. TSL&rsquo;s contribution
          is making the same pattern programmatic in JavaScript /
          TypeScript, so a node graph can be built up by composition
          inside an application module rather than wired up in a GUI.
        </li>
      </ol>
    </>
  );
}
