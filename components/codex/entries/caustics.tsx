export default function Caustics() {
  return (
    <>
      <p>
        A caustic is the bright pattern formed when light is focused by
        reflection or refraction off a curved surface. The word comes
        from the Greek <em>kaustikos</em>, &ldquo;burning&rdquo;
        &mdash; the phenomenon was named for the way a magnifying lens
        concentrates sunlight to the point of ignition. The bright
        crescent in the bottom of a tea cup, the rippling net of light
        on the floor of a swimming pool, and the rainbow rim of a wine
        glass in a sunbeam are all caustics.<sup>1</sup>
      </p>
      <p>
        Mathematically, a caustic is the envelope of a family of light
        rays after reflection or refraction. Where many rays converge,
        the envelope is bright; where rays cross transversely, the
        caustic has a fold; where folds meet, the caustic has a cusp.
        The classification of generic caustic singularities was given
        by Vladimir Arnold in the 1970s and is one of the cleaner
        applications of catastrophe theory: in three dimensions a
        generic caustic has only five stable singularity types
        (fold, cusp, swallowtail, hyperbolic umbilic, elliptic
        umbilic), regardless of the lens that produced it.
      </p>
      <p>
        Computational caustic design &mdash; the inverse problem of
        finding a surface that throws a chosen image &mdash; was solved
        in production form by Yue, Iwasaki, Chen, Dobashi and Nishita
        (&ldquo;Poisson-Based Continuous Surface Generation for
        Goal-Based Caustics,&rdquo; SIGGRAPH 2014) and refined by
        Schwartzburg, Testuz, Tagliasacchi and Pauly (&ldquo;High-
        Contrast Computational Caustic Design,&rdquo; SIGGRAPH 2014).
        The algorithm computes an optimal transport map between a
        uniform source illumination and the target image, then
        integrates a height field whose surface normals deflect light
        accordingly. The output is a millable lens or mirror surface
        that throws the chosen image when illuminated.
      </p>
      <p>
        For the studio, the caustic disc is a small optical object
        &mdash; palm-sized, polished &mdash; that throws an image of a
        captured kata when held against a torch beam. The geometry of
        the disc is computed from the long-exposure photograph by the
        caustic-inverse pipeline, milled in acrylic, and polished. The
        image is not on the disc; the image is the caustic the disc
        casts.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The English word &ldquo;caustic&rdquo; meaning &ldquo;sharply
          critical&rdquo; is the same word and the same etymology
          &mdash; both senses describe something that burns at a
          point. The optical sense is the older one in English; the
          rhetorical sense is sixteenth-century onward.
        </li>
        <li>
          The studio uses Pauly&rsquo;s 2014 algorithm rather than
          Nishita&rsquo;s &mdash; not for any deep reason, but because
          the open implementation that was easiest to wire into the
          existing pipeline happened to descend from the EPFL paper
          rather than the Tokyo one.
        </li>
      </ol>
    </>
  );
}
