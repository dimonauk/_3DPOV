export default function RampShading() {
  return (
    <>
      <p>
        Ramp shading replaces the continuous lighting curve of a
        physically-based material with a one-dimensional lookup texture.
        Instead of computing diffuse intensity per pixel as the dot
        product of the surface normal and the light direction, the
        renderer takes that dot product, uses it as a texture
        coordinate, and reads back whatever colour the artist has
        painted at that position in a thin horizontal strip. The
        shape of the lighting is decided by what the strip looks
        like.<sup>1</sup>
      </p>
      <p>
        The technique is the load-bearing primitive for cel-shaded
        rendering. A strip with two flat blocks of colour and a hard
        step between them gives the classic two-tone anime
        shadow-and-light. A strip with three or four bands gives a
        more painterly figure. A strip with a smooth gradient
        approaches the original Lambertian look but with the warm-to-
        cool drift handed-painted into the ramp itself; this is the
        Gooch lineage, used in technical illustration and a great
        deal of game cinematography. Because the strip is a regular
        texture, the artist authors it in Photoshop or Procreate and
        re-imports without recompiling shaders.
      </p>
      <p>
        For the studio, ramp shading is the technique behind the
        cel-shaded preset in the TSL material library and the
        environment-shading path the wall-piece scenes run when
        building a moodboard or a tutorial illustration rather than
        a photoreal render. It also composes cleanly with the MToon
        avatar pipeline, where the same idea is called a &ldquo;shade
        ramp&rdquo; and is the parameter that decides whether Aura
        reads as soft anime or hard cel.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/articles/advanced-cell-shading-techniques"
          className="text-pink-200 underline underline-offset-4"
        >
          advanced cel-shading techniques
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
            href="https://en.wikipedia.org/wiki/Cel_shading"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Cel shading
          </a>
          .
        </li>
        <li>
          Gooch, Gooch, Shirley &amp; Cohen,{" "}
          <a
            href="https://www.cs.northwestern.edu/~ago820/SIG98/abstract.html"
            className="text-pink-200 underline underline-offset-4"
          >
            A Non-Photorealistic Lighting Model for Automatic Technical
            Illustration (SIGGRAPH 1998)
          </a>
          .
        </li>
        <li>
          <a
            href="https://catlikecoding.com/unity/tutorials/rendering/part-15/"
            className="text-pink-200 underline underline-offset-4"
          >
            Catlike Coding: Rendering 15 &mdash; Deferred Lights /
            ramp textures
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The original Disney-style ramp used a 2D texture &mdash; one
          axis dot-product, the other axis a per-region tint &mdash;
          to vary the ramp across the figure. The studio default is
          the simpler 1D variant, which composes with TSL&rsquo;s
          standard material chain without modifying the per-pixel
          loop.
        </li>
      </ol>
    </>
  );
}
