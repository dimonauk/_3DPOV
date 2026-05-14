export default function MarchingCubes() {
  return (
    <>
      <p>
        Marching cubes is the algorithm that turns a three-dimensional
        scalar field into a triangulated surface. William E. Lorensen
        and Harvey E. Cline published it at SIGGRAPH 1987 while at
        General Electric&rsquo;s research lab in Schenectady, originally
        for extracting bone and tissue boundaries from CT and MRI
        volumes. It has since become the default isosurface extractor
        across medical imaging, scientific visualisation, generative
        geometry, and procedural 3D modelling.<sup>1</sup>
      </p>
      <p>
        The mechanism is straightforward in description and elegant in
        implementation. A regular grid of sample values is overlaid on
        the volume. For each cube of eight neighbouring samples, the
        algorithm consults a precomputed lookup table of 256 cases
        (one per combination of inside/outside corners) and emits the
        triangles that approximate where the chosen threshold surface
        passes through the cube. Linear interpolation along each cube
        edge places the triangle vertices at the precise threshold
        crossing. Run across every cube in the grid, the algorithm
        produces a closed, watertight mesh.
      </p>
      <p>
        Variants address its limitations. Marching tetrahedra avoids the
        ambiguous topological cases at the cost of more triangles. Dual
        contouring (Ju et al., 2002) preserves sharp features that the
        original algorithm rounds. Manifold dual contouring guarantees
        a manifold output even with intersecting features. For most
        organic geometry &mdash; depth fields, implicit surfaces, voxel
        sculpts &mdash; the original 1987 algorithm remains the working
        default.
      </p>
      <p>
        For the studio, marching cubes is the bridge between any
        volumetric representation and a printable mesh. A depth map
        from a long exposure, a gyroid evaluated on a grid, an implicit
        scalar field defined by a sum of poi-path distances &mdash; each
        becomes an{" "}
        <code className="font-mono text-chrome-200">.stl</code> through
        a marching-cubes pass. The studio uses the implementation in
        scikit-image for desktop work and a CUDA reimplementation when
        the grid is large enough to warrant the GPU.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The original Lorensen &amp; Cline paper was filed as a US
          patent by General Electric in 1985 and granted in 1987. The
          patent expired in June 2005, which is the date often given as
          the algorithm&rsquo;s release into freely-usable territory,
          even though the technique had been openly described and
          widely used for the preceding eighteen years regardless.
        </li>
        <li>
          The grid resolution is the single most important parameter.
          Doubling the resolution along each axis multiplies the
          triangle count by roughly four and the memory cost by eight,
          which is the constraint that decides whether a piece runs on
          the desktop or has to be batched out to the workstation.
        </li>
      </ol>
    </>
  );
}
