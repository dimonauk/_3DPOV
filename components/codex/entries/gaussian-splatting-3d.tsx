export default function GaussianSplatting3D() {
  return (
    <>
      <p>
        3D Gaussian Splatting is a scene-representation technique
        introduced at SIGGRAPH 2023 by Kerbl, Kopanas, Leimk&uuml;hler
        and Drettakis at Inria. Rather than storing a scene as a
        triangulated mesh, the scene is represented as several million
        oriented anisotropic gaussian ellipsoids, each carrying a
        position, a covariance (the orientation and size of the
        ellipsoid), an opacity, and a spherical-harmonic colour. A
        tile-based differentiable rasteriser projects the gaussians
        directly to screen at 30&ndash;100 frames per second on
        consumer hardware, with quality that rivals neural radiance
        fields and rendering speed that radiance fields never
        reached.<sup>1</sup>
      </p>
      <p>
        The pipeline conventionally starts with a set of overlapping
        photographs, runs structure-from-motion (typically COLMAP) to
        recover camera poses and a sparse seed point cloud, and then
        optimises the gaussian parameters by differentiable
        rasterisation against the source images. Once optimised, the
        scene is stored and shipped as a file that any compatible
        renderer can load. The technique has branched aggressively
        since 2023: 4D gaussians add a temporal axis for moving
        scenes; 2D gaussians flatten the primitive to a disk for
        better surface reconstruction; Mip-Splatting handles aliasing
        under aggressive viewpoint change; Apple SHARP infers a
        plausible splat scene from a single photograph.
      </p>
      <p>
        The studio&rsquo;s renderer of record is{" "}
        <a
          href="https://sparkjs.dev/"
          className="text-pink-200 underline underline-offset-4"
        >
          Spark
        </a>{" "}
        &mdash; the JavaScript / WebGL splat library from the
        Niantic-adjacent team, picked for its honest licensing posture
        and its WebXR support. The format zoo is where most of the
        practical complexity lives: the original Inria format is{" "}
        <code className="font-mono text-chrome-200">.ply</code> with
        custom attributes; the community converged on{" "}
        <code className="font-mono text-chrome-200">.splat</code>{" "}
        (KIRI Engine) and{" "}
        <code className="font-mono text-chrome-200">.ksplat</code>{" "}
        (mkkellogg) for size-optimised delivery;{" "}
        <code className="font-mono text-chrome-200">.spz</code>{" "}
        (Niantic) brings further compression;{" "}
        <code className="font-mono text-chrome-200">.sog</code>{" "}
        (PlayCanvas SuperSplat) is the editor-friendly variant. The
        studio&rsquo;s viz capability normalises across them so the
        surface code never sees the file extension directly.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/gaussian-splatting"
          className="text-pink-200 underline underline-offset-4"
        >
          Gaussian splatting (studio practice)
        </a>
        ,{" "}
        <a
          href="/codex/equirectangular-projection"
          className="text-pink-200 underline underline-offset-4"
        >
          equirectangular projection
        </a>
        ,{" "}
        <a
          href="/codex/onnx-runtime"
          className="text-pink-200 underline underline-offset-4"
        >
          ONNX Runtime
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Kerbl, Kopanas, Leimk&uuml;hler &amp; Drettakis,{" "}
          <a
            href="https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/"
            className="text-pink-200 underline underline-offset-4"
          >
            3D Gaussian Splatting for Real-Time Radiance Field
            Rendering
          </a>{" "}
          (SIGGRAPH 2023, Inria).
        </li>
        <li>
          <a
            href="https://sparkjs.dev/"
            className="text-pink-200 underline underline-offset-4"
          >
            Spark
          </a>{" "}
          &mdash; the studio&rsquo;s production WebGL splat renderer.
        </li>
        <li>
          <a
            href="https://playcanvas.com/supersplat"
            className="text-pink-200 underline underline-offset-4"
          >
            PlayCanvas SuperSplat
          </a>{" "}
          &mdash; the editor for trimming and curating captured splats.
        </li>
        <li>
          <a
            href="https://github.com/mkkellogg/GaussianSplats3D"
            className="text-pink-200 underline underline-offset-4"
          >
            GaussianSplats3D
          </a>{" "}
          &mdash; mkkellogg&rsquo;s Three.js splat renderer and the
          format reference for{" "}
          <code className="font-mono text-chrome-200">.ksplat</code>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The technical contribution of the Inria paper was not the
          gaussian primitive itself &mdash; gaussians-as-rendering-
          atoms predate the paper by decades &mdash; but the
          tile-based differentiable rasteriser that made optimisation
          tractable on a single GPU. The rest of the field had to
          catch up to the rendering speed before the format became
          practical for consumer-tier hardware.
        </li>
      </ol>
    </>
  );
}
