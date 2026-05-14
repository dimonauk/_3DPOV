export default function Photogrammetry() {
  return (
    <>
      <p>
        Photogrammetry is the practice of reconstructing three-
        dimensional geometry from a collection of two-dimensional
        photographs taken from different positions. The mathematics is
        old &mdash; Aim&eacute; Laussedat published the first systematic
        method for terrestrial photogrammetric survey in 1859, and the
        French and German armies were using aerial photogrammetry for
        cartography by the First World War. The contemporary form,
        structure-from-motion (SfM) photogrammetry, dates to academic
        work in the 1980s and to the public availability of consumer
        tooling from around 2010 onwards.<sup>1</sup>
      </p>
      <p>
        The reconstruction pipeline has three logical stages, regardless
        of which software wraps them. Feature detection identifies
        salient points in each image (SIFT, AKAZE, or learned
        descriptors). Feature matching pairs those points across
        overlapping images and solves for the camera positions and a
        sparse point cloud via bundle adjustment. Dense reconstruction
        then expands the sparse cloud into a dense one through multi-
        view stereo, after which a mesh is fitted (Poisson surface
        reconstruction is the workhorse) and a texture atlas is baked.
      </p>
      <p>
        Capture geometry is the part most often done wrong by people
        new to the practice. Nadir survey grids (camera pointing
        straight down, overlapping by 70&ndash;80% along-track and
        60&ndash;70% across-track) reconstruct ground orthomosaics
        well but produce poor vertical faces; oblique passes at
        30&ndash;45 degrees from the vertical are required if facades
        matter. For a building survey the standard recipe is one nadir
        grid plus two orthogonal oblique grids; for an object survey
        the camera circles the subject at three or four elevations.
      </p>
      <p>
        Working software falls into three brackets in 2026.
        RealityCapture (CapturingReality, now Epic Games) is the speed
        leader and the studio&rsquo;s default for large drone datasets.
        Agisoft Metashape is the long-survivor with the most predictable
        results on awkward data. Meshroom (AliceVision) is the free,
        open-source option that runs entirely locally and is good
        enough for object-scale work. COLMAP underpins much of the
        academic and gaussian-splatting pipeline as a pose-solver
        before either dense reconstruction or splat training.
      </p>
      <p>
        The studio uses photogrammetry for two purposes: producing
        printable meshes of outdoor sculptures and architecture for
        re-display in the HoloWalk pipeline, and producing the camera
        poses that feed the gaussian-splatting trainer for live bubble
        scenes.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Laussedat was a captain in the French Army Corps of Engineers
          and called the technique <em>m&eacute;trophotographie</em>,
          which is a much better name than the one that stuck. He is
          buried near Paris; his obituary in the Photogrammetric Record
          (1907) calls him &ldquo;the father of photogrammetry&rdquo;
          with the dry confidence of a discipline that knew exactly
          whom it was descended from.
        </li>
        <li>
          The thing nobody tells beginners: a hundred well-spaced
          photographs of a difficult subject will reconstruct better
          than a thousand badly-spaced ones, and the limiting factor is
          almost always the human walking the perimeter rather than
          the sensor on the airframe.
        </li>
      </ol>
    </>
  );
}
