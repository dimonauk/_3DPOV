export default function GaussianSplatting() {
  return (
    <>
      <p>
        Gaussian splatting is a real-time radiance-field rendering
        technique introduced in &ldquo;3D Gaussian Splatting for
        Real-Time Radiance Field Rendering&rdquo; by Kerbl, Kopanas,
        Leimk&uuml;hler and Drettakis at Inria, presented at SIGGRAPH
        2023. Rather than encoding a scene as a neural network queried
        per ray (as with NeRF), the scene is represented as several
        million 3D ellipsoids &mdash; each with a position, covariance,
        opacity, and spherical-harmonic colour &mdash; rasterised
        directly to screen. The result is a navigable photographic scene
        that renders at 30&ndash;100 frames per second on consumer
        hardware.<sup>1</sup>
      </p>
      <p>
        The conventional pipeline begins with a set of overlapping
        photographs, runs structure-from-motion (typically COLMAP) to
        recover camera poses and a sparse point cloud, and then
        optimises the gaussian parameters by differentiable rasterisation
        against the source images. The optimised scene is stored as a{" "}
        <code className="font-mono text-chrome-200">.ply</code> file
        with custom attributes for the per-splat covariance and
        harmonic coefficients. Typical file sizes run from 50 MB for a
        small interior to several hundred MB for a city block.
      </p>
      <p>
        The technique has since branched. 4D Gaussians (Wu et al., 2024)
        add a temporal axis for moving scenes. 2D Gaussian Splatting
        (Huang et al., 2024) flattens the primitive to a disk for better
        surface reconstruction. Apple&rsquo;s SHARP, released within
        macOS Tahoe in 2025, generates a plausible gaussian-splat scene
        from a single still photograph by inferring geometry that the
        photograph never directly observed.
      </p>
      <p>
        For the studio, gaussian splatting is the mechanism by which a
        360&deg; capture becomes a navigable space rather than a flat
        equirectangular. Each location on the HoloWalk trail is shot as
        a single bubble; SHARP runs locally on the studio GPU; the
        resulting{" "}
        <code className="font-mono text-chrome-200">.ply</code> is
        served to a WebGL splat viewer in the browser. The viewer
        renders the scene at full frame rate on a mid-range
        phone.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The Inria paper&rsquo;s technical contribution was not the
          gaussian primitive itself &mdash; gaussians-as-rendering-
          atoms predate the paper by decades &mdash; but the
          tile-based differentiable rasteriser that made optimisation
          tractable on a single GPU. The rest of the field had to catch
          up to the rendering speed before the format became practical.
        </li>
        <li>
          Single-image splats are constrained: anything behind the
          photographer is invented by the model rather than observed,
          and the scene falls apart if the viewer pulls back far enough
          to see the seam. The studio shoots the source frame at
          eye-height, locks the viewer&rsquo;s allowed range, and
          accepts the bubble for what it is.
        </li>
      </ol>
    </>
  );
}
