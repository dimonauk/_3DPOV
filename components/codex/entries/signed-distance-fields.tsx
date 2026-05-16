export default function SignedDistanceFields() {
  return (
    <>
      <p>
        A signed distance field, or SDF, stores at every point in space
        the distance to the nearest surface, with a sign that records
        which side of the surface the point is on. Inside is negative,
        outside is positive, zero is on the surface itself. A whole
        three-dimensional object is encoded as a single scalar function
        rather than as a triangle mesh. The geometry isn&rsquo;t
        approximated by polygons; it&rsquo;s described by the equation
        of the space around it.<sup>1</sup>
      </p>
      <p>
        Two properties make SDFs unusually useful. The first is that
        boolean operations &mdash; union, intersection, subtraction,
        and the smooth variants of all three &mdash; reduce to
        minimum, maximum, and negation of the underlying distance
        functions. Building a complex shape becomes algebra on scalar
        fields rather than mesh surgery. The second is that ray
        marching is cheap and stable: knowing the distance to the
        nearest surface tells the ray exactly how far it can advance
        before risking a hit, so a renderer can find the surface
        without ever solving a polynomial intersection.
      </p>
      <p>
        The studio uses SDFs as the intermediate representation
        between a captured shape and a printable mesh. A scan, an
        implicit equation, or a marching-cube target gets voxelised
        and distance-transformed into an{" "}
        <code className="font-mono text-chrome-200">.sdf.bin</code>{" "}
        file &mdash; raw{" "}
        <code className="font-mono text-chrome-200">Float32</code>{" "}
        with a small header describing the grid resolution and the
        world-space bounds, ready to upload as a{" "}
        <code className="font-mono text-chrome-200">THREE.Data3DTexture</code>
        . The bench tool that builds these files is at{" "}
        <code className="font-mono text-chrome-200">
          The_Hangar/tools/mesh-to-sdf/build_sdf.py
        </code>
        ; it loads a mesh through trimesh, voxelises at a chosen
        resolution, runs the SciPy Euclidean distance transform on the
        binary occupancy grid in both directions to recover the inside
        and outside distances, signs the result, and writes a single
        binary that a WebGPU or WebGL fragment shader can sample
        directly.<sup>2</sup>
      </p>
      <p>
        The grid resolution is the only knob that really matters.
        Doubling it cubes the memory cost and quadruples the surface
        fidelity. 128 along the longest axis is the studio default for
        wearable-scale objects; 256 is reserved for the wall-relief
        scale where the camera gets close enough to see voxel-quant
        artefacts otherwise.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The standard reference is &iacute;&ntilde;igo qu&iacute;lez&rsquo;s
          public collection of analytical SDFs at iquilezles.org/articles/distfunctions
          &mdash; a primitive vocabulary that the shader community has
          treated as a foundational text since the mid-2000s.
        </li>
        <li>
          A truly accurate SDF requires the signed Euclidean distance
          transform across the full grid, which is{" "}
          <em>O(n)</em> per voxel through Felzenszwalb &amp;
          Huttenlocher&rsquo;s separable algorithm. SciPy&rsquo;s{" "}
          <code className="font-mono">distance_transform_edt</code>{" "}
          implements this. The naive expansion-from-the-surface variant
          gives the correct sign but only an upper bound on distance,
          which is good enough for ray marching but visible as a
          stepped surface near object boundaries.
        </li>
      </ol>
    </>
  );
}
