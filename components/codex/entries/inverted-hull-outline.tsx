export default function InvertedHullOutline() {
  return (
    <>
      <p>
        Inverted-hull outlining is the cheapest trick for drawing
        cartoon outlines around a 3D mesh. The renderer draws the
        figure twice. First a slightly enlarged copy of the mesh with
        its normals flipped, in the outline colour, with backface
        culling configured so only what would normally be the back of
        the geometry is visible. Then the original mesh, normally, on
        top. The thin sliver of the enlarged copy that pokes out
        around the original is the outline. The effect is identical
        in spirit to drawing a black border around a sticker.<sup>1</sup>
      </p>
      <p>
        Its appeal is cost and timing. There are no edge-detection
        passes, no screen-space sampling of the depth or normal
        buffer, no per-frame analysis at all &mdash; just one extra
        draw call per outlined object, with a vertex shader that
        offsets each position outward along its normal by some
        configurable distance. The outline survives skeletal animation
        for free because the inverted hull is animated by the same
        skin weights; it doesn&rsquo;t flicker frame-to-frame the way
        screen-space edge detection can; it scales linearly with the
        outlined object count rather than with the framebuffer
        resolution. This is why it&rsquo;s the default outline path in
        MToon, in Genshin Impact&rsquo;s anime pipeline, and in
        roughly every Unity URP toon shader on the market.
      </p>
      <p>
        It has two failure modes worth flagging. On a convex object
        with sharp corners (a cube), the outline thickens at the
        corners because adjacent face normals diverge sharply &mdash;
        the workaround is to author per-vertex outline-direction data
        baked from the smoothed normal, separate from the rendering
        normal. And the technique fights with translucency: an
        inverted-hull copy behind a transparent material disappears,
        because the transparent material composites the outline out
        from behind itself in the alpha pass. The studio uses the
        technique for Aura (opaque), the cel-shaded wall scenes
        (opaque), and falls back to a screen-space edge filter for
        the few translucent pieces that need outlines.
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
          href="/codex/ramp-shading"
          className="text-pink-200 underline underline-offset-4"
        >
          ramp shading
        </a>
        ,{" "}
        <a
          href="/articles/advanced-cell-shading-techniques"
          className="text-pink-200 underline underline-offset-4"
        >
          advanced cel-shading techniques
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://roystan.net/articles/outline-shader/"
            className="text-pink-200 underline underline-offset-4"
          >
            Roystan: Outline Shader
          </a>{" "}
          &mdash; a clear walk-through of both inverted-hull and
          post-process outlining.
        </li>
        <li>
          <a
            href="https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_materials_mtoon-1.0/README.md"
            className="text-pink-200 underline underline-offset-4"
          >
            MToon 1.0 specification &mdash; outline section
          </a>
          .
        </li>
        <li>
          <a
            href="https://www.gamedeveloper.com/programming/the-tech-art-of-cel-shading"
            className="text-pink-200 underline underline-offset-4"
          >
            Game Developer: The Tech Art of Cel Shading
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The technique pre-dates real-time graphics. The same trick
          shows up in cel-animation key painting as a back-paint
          allowance &mdash; the painted-on side of the cel is filled
          slightly outside the linework so the front-line ink reads
          cleanly when the cel is photographed.
        </li>
      </ol>
    </>
  );
}
