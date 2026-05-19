export default function SdfSignedDistanceField() {
  return (
    <>
      <p>
        A signed distance field is a function that, given any point in
        space, returns the distance from that point to the nearest
        surface of a shape &mdash; with a sign indicating which side
        of the surface the point sits on. Inside is negative, outside
        is positive, zero is exactly on the boundary. The same idea
        scales from a 2D outline (every pixel stores its distance to
        the glyph edge) to a 3D solid (every voxel stores its distance
        to the mesh surface).<sup>1</sup>
      </p>
      <p>
        Three properties make SDFs unreasonably useful. Distance
        functions compose under minimum and maximum: a union is{" "}
        <code className="font-mono text-chrome-200">min(a, b)</code>;
        an intersection is{" "}
        <code className="font-mono text-chrome-200">max(a, b)</code>;
        a subtraction is{" "}
        <code className="font-mono text-chrome-200">max(a, -b)</code>
        ; smooth-blend variants are one-line polynomials. Surfaces can
        be ray-marched without ever solving an intersection equation
        &mdash; the distance value tells the ray exactly how far it
        can step. And SDFs scale rendering quality with viewing
        distance: the same compact representation looks crisp from a
        millimetre or a metre away, because the field is evaluated
        per-pixel rather than per-vertex.
      </p>
      <p>
        For the studio, the SDF is the load-bearing primitive behind
        body-text 3D rendering. A traditional text mesh blows the
        triangle budget the moment a paragraph appears in a scene;
        Troika&rsquo;s SDF text caches each glyph as a small 2D
        distance field, samples it in a fragment shader, and the
        result is crisp typography at any zoom level for a fragment-
        constant cost. The same pattern drives the studio&rsquo;s
        sculpture pipeline &mdash; meshes are voxelised into 3D SDFs
        for boolean editing in clear-resin waveguide design, then
        marching-cubed back out to a printable mesh once the
        composition is locked.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/signed-distance-fields"
          className="text-pink-200 underline underline-offset-4"
        >
          signed distance fields (the studio voxel pipeline)
        </a>
        ,{" "}
        <a
          href="/codex/troika-three-text"
          className="text-pink-200 underline underline-offset-4"
        >
          Troika Three Text
        </a>
        ,{" "}
        <a
          href="/codex/marching-cubes"
          className="text-pink-200 underline underline-offset-4"
        >
          marching cubes
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          &Iacute;&ntilde;igo Qu&iacute;lez,{" "}
          <a
            href="https://iquilezles.org/articles/distfunctions/"
            className="text-pink-200 underline underline-offset-4"
          >
            Distance functions
          </a>
          .
        </li>
        <li>
          Chris Green (Valve),{" "}
          <a
            href="https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf"
            className="text-pink-200 underline underline-offset-4"
          >
            Improved Alpha-Tested Magnification for Vector Textures
            (SIGGRAPH 2007)
          </a>{" "}
          &mdash; the paper that introduced SDF text to game graphics.
        </li>
        <li>
          Felzenszwalb &amp; Huttenlocher,{" "}
          <a
            href="https://cs.brown.edu/people/pfelzens/dt/"
            className="text-pink-200 underline underline-offset-4"
          >
            Distance Transforms of Sampled Functions
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The signed half of the name is doing real work. An unsigned
          distance field can rasterise an outline but cannot answer
          the &ldquo;am I inside?&rdquo; question that boolean
          operations and ray marching both depend on.
        </li>
      </ol>
    </>
  );
}
