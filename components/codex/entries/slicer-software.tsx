export default function SlicerSoftware() {
  return (
    <>
      <p>
        Slicer software is the production layer that converts a
        three-dimensional mesh into the layer-by-layer toolpath
        instructions a 3D printer can execute. The slicer reads a mesh
        file (typically STL, 3MF, or OBJ), parses the user&rsquo;s
        machine and material parameters, and emits a stream of G-code
        commands that drive the printer&rsquo;s motors, heaters, and
        extruder. Without a slicer there is no print; the mesh and the
        machine are otherwise mutually unintelligible.<sup>1</sup>
      </p>
      <p>
        Three slicers carry the working community in 2026. PrusaSlicer
        (Prusa Research, Prague, open-source under AGPL) is the
        long-survivor and the standard reference; SuperSlicer is a
        fork that adds experimental features ahead of upstream.
        Cura (Ultimaker, open-source) has the largest user base by
        installation count and is the default for printers shipped by
        Creality and similar manufacturers. Bambu Studio (Bambu Lab,
        forked from PrusaSlicer) is closed-default and pre-configured
        for the manufacturer&rsquo;s fleet, with the simplest
        out-of-the-box experience on the X1 / P1 / A1 machines.
      </p>
      <p>
        The slicer is where most print failures are designed in,
        usually invisibly. Layer height, line width, infill geometry
        and density, support structure type, top and bottom layer
        counts, retraction distance, fan speed, hot-end temperature,
        bed temperature, print speed, acceleration limits, and seam
        position are each independently tunable and each independently
        capable of ruining a print. A good print is the product of a
        well-tuned profile applied to a forgiving model on a calibrated
        machine; a bad print is usually a profile mismatch the slicer
        cannot diagnose ahead of time.
      </p>
      <p>
        Specialist features that matter for the studio&rsquo;s work:
        adaptive layer height (taller layers where the model is
        vertical, thinner where it curves) cuts print time on detailed
        organic geometry by 20&ndash;40%; variable line width
        (Arachne in PrusaSlicer / Cura) eliminates the thin-wall gaps
        that ruin gyroid sections at small cell sizes; tree supports
        (treelike branching scaffolds instead of vertical pillars) use
        less material and remove more cleanly from caustic surfaces;
        and pressure advance / linear advance calibration is the
        single tuning step that does the most for surface quality on
        a CoreXY machine.
      </p>
      <p>
        The studio runs PrusaSlicer for the conventional Cartesian
        machines and a forked BlackBelt Cura for the belt printer,
        with calibrated profiles maintained per machine and per
        material against a working test-print library.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The earliest open-source slicer of consequence was Skeinforge
          &mdash; Enrique Perez, around 2008 &mdash; which arrived with
          one of the most legendary documentation pages in the history
          of free software, opaque enough to have inspired Slic3r and
          Cura largely as readability projects. Slic3r in turn forked
          into PrusaSlicer in 2016, which is the lineage most current
          slicers descend from.
        </li>
        <li>
          A slicer profile is a working document, not a setting. The
          studio keeps profiles in version control alongside the model
          files, and treats &ldquo;the profile that printed this&rdquo;
          as a deliverable for editioned work in the same way that
          &ldquo;the negative&rdquo; once was for editioned photographs.
        </li>
      </ol>
    </>
  );
}
