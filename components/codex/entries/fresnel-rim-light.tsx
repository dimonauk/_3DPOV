export default function FresnelRimLight() {
  return (
    <>
      <p>
        A Fresnel rim light brightens the silhouette of a 3D object
        based on the angle between the view vector and the surface
        normal. At grazing angles &mdash; where the surface is almost
        edge-on to the camera &mdash; the contribution is at its
        maximum; where the surface faces the camera head-on, it&rsquo;s
        zero or near-zero. The result is a soft glow that follows the
        silhouette of the geometry from any viewing angle without
        any per-frame analysis of the framebuffer.<sup>1</sup>
      </p>
      <p>
        The basic equation is a one-line approximation of the
        Fresnel-Schlick term:
      </p>
      <p>
        <code className="font-mono text-chrome-200">
          rim = pow(1.0 - dot(viewDir, normal), rimPower)
        </code>
      </p>
      <p>
        The dot product is small at grazing angles, so{" "}
        <code className="font-mono text-chrome-200">1.0 - dot</code>{" "}
        approaches 1; raising that to a power between 2 and 8 tightens
        the rim into a thin band or loosens it into a soft halo.
        Multiplied by a rim colour and added to the shaded base, it
        reads as light catching the edge of the figure.
      </p>
      <p>
        Three classes of practical use. As an NPR rim light (the MToon
        pattern), it&rsquo;s how an anime figure gets the backlight
        glow even when the scene&rsquo;s actual lighting wouldn&rsquo;t
        justify it &mdash; a baked-in artistic decision rather than a
        physically-motivated reflection. As a glass approximation, the
        same equation is the dominant term in the Fresnel reflection
        used by every PBR transparent material; clearcoat over a
        painted plastic is mostly a tuned rim curve. And as a
        holographic effect, scrolling time into the rim power animates
        the band, which is how a great many sci-fi UIs get their
        rim-edge shimmer cheaply. The studio uses all three patterns
        in the TSL material library &mdash; cel-shaded for figures,
        glass and frosted-glass for window panes, holographic for the
        floating UI elements in the bureau.
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
            href="https://en.wikipedia.org/wiki/Fresnel_equations"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Fresnel equations
          </a>
          .
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Schlick%27s_approximation"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Schlick&rsquo;s approximation
          </a>
          .
        </li>
        <li>
          <a
            href="https://learnopengl.com/PBR/Theory"
            className="text-pink-200 underline underline-offset-4"
          >
            LearnOpenGL: PBR theory (Fresnel-Schlick section)
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Augustin-Jean Fresnel&rsquo;s 1820s equations describe how
          much light reflects and refracts at the interface between
          two media, as a function of incidence angle. The full
          equations include a complex polarisation calculation; the
          Schlick approximation collapses it to a single power-law
          that&rsquo;s good enough for real-time graphics and within
          a percent of the true value for most insulators.
        </li>
      </ol>
    </>
  );
}
