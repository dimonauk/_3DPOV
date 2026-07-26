import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python bpy — Resin MSLA Light Sculpture: Nested Shell, LED Cavity & TIR Drainage for Elegoo Saturn (Blender 5.1)",
  lede: "Build a two-part waveguide light sculpture headlessly from Python: smooth inner core for total-internal-reflection, faceted outer shell, Boolean LED cavity, and drainage holes constrained by the TIR critical angle — ready to slice for MSLA resin printing.",
  date: "2026-07-26",
  externalSources: [
    {
      label: "Blender 5.1 Manual — Boolean Modifier",
      url: "https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/booleans.html",
      licence: "CC-BY-SA 4.0",
      author: "Blender Foundation",
    },
    {
      label: "Blender Python API 5.1 — bpy.ops.wm.stl_export",
      url: "https://docs.blender.org/api/5.1/bpy.ops.wm.html#bpy.ops.wm.stl_export",
      licence: "CC-BY-SA 4.0",
      author: "Blender Foundation",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        A waveguide light sculpture is two objects pretending to be one: a
        smooth inner core that traps light by total internal reflection, and a
        faceted outer shell that gives the piece its character under ambient
        light. The LED sits in a recessed cavity at the base; the resin cures
        around it. This is not a render — it is a production file that goes
        straight into a slicer. Every dimension in the script is a millimetre
        constraint, and every Boolean is driven by a physical law.
      </p>
      <p>
        The studio&rsquo;s waveguide workflow is documented in depth at the{" "}
        <Link href="/codex/waveguide-object" className={lk}>
          Waveguide Object codex entry
        </Link>{" "}
        and the{" "}
        <Link href="/codex/waveguide-optics-deep-dive" className={lk}>
          Waveguide Optics Deep Dive
        </Link>
        . This tutorial is the Blender 5.1 implementation path for that
        geometry: pure bpy, no manual operations, runable in{" "}
        <code>--background</code> on a CI box the moment a dimension changes.
      </p>

      <h2>Total internal reflection in 60 seconds</h2>
      <p>
        Snell&rsquo;s Law at a resin–air interface gives the critical angle
        beyond which light cannot escape:
      </p>
      <pre>{`θ_c = arcsin(n_air / n_resin)
     = arcsin(1.0 / 1.49)      # photopolymer IOR ≈ 1.47–1.55
     ≈ 42.2°`}</pre>
      <p>
        Any ray inside the core that hits the surface at more than 42.2° from
        the surface normal bounces back. That is the waveguide mechanism. The
        core therefore needs to be smooth at the scale of the wavelength
        (sub=4 icosphere, ~0.5° face-normal deviation) rather than at the
        scale of the print layer (50 μm). The outer shell can be coarse and
        faceted — sub=2, 80 faces — because its job is aesthetics, not optics.
      </p>

      <h2>Geometry strategy</h2>
      <p>
        Both objects are icospheres sharing the same origin. The gap between
        them is <code>WALL_MM = 2 mm</code> of decorative resin.
      </p>
      <pre>{`OUTER_R = 50 mm   → outer shell, sub=2, flat-shaded
INNER_R = 48 mm   → waveguide core, sub=4, smooth
WALL_MM =  2 mm   → gap between them`}</pre>
      <p>
        The inner core is printed in clear photopolymer. The outer shell is
        printed in coloured resin. Post-cure separately; sand the core faces to
        optical clarity before assembly.
      </p>

      <h2>LED cavity</h2>
      <p>
        The LED sits in a cylindrical pocket at the south pole (−Z) of the
        outer shell. Standard 5 mm LED emitters fit in a 5 mm bore; we add
        0.2 mm clearance for post-cure resin shrinkage:
      </p>
      <pre>{`CAVITY_R     = (5 mm / 2) + 0.2 mm = 2.7 mm radius
CAVITY_DEPTH =  8 mm`}</pre>
      <p>
        The cavity is cut with a{" "}
        <strong>Boolean modifier using the Exact solver</strong>. The Exact
        solver (Blender 3.1+) uses a surface-mesh intersection algorithm that
        guarantees the output is manifold even when the cutter grazes a vertex
        of the target — critical for thin walls. The Fast solver is fine for
        CAD-like convex Boolean pairs but fails on near-tangent incidence at
        MSLA tolerances.
      </p>
      <pre>{`mod = shell.modifiers.new(name="_bool_cut", type='BOOLEAN')
mod.operation   = 'DIFFERENCE'
mod.operand_type = 'OBJECT'
mod.object      = led_cutter
mod.solver      = 'EXACT'       # ← not 'FAST'
with bpy.context.temp_override(active_object=shell, object=shell):
    bpy.ops.object.modifier_apply(modifier=mod.name)`}</pre>
      <p>
        <code>temp_override</code> is essential here. In a{" "}
        <code>--background</code> session the default context has no active
        object, so <code>modifier_apply</code> silently no-ops without it. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context override tutorial
        </Link>{" "}
        covers this pattern in full.
      </p>

      <h2>Drainage holes: constrained by TIR</h2>
      <p>
        MSLA printers cure resin layer by layer; each new layer peels off the
        FEP film at the bottom of the resin vat. If the shell is a sealed
        sphere the trapped liquid creates a hydraulic suction force that
        increases linearly with cross-section area. At 50 mm diameter that
        force is enough to delaminate layers. The fix is drainage holes —
        small cylinders Boolean&rsquo;d through the wall at the base.
      </p>
      <p>
        The placement constraint is TIR: holes must not intersect the
        waveguide cone. The cone half-angle is θ_c ≈ 42.2°. Measured from the
        base (−Z equator), the safe zone is below 90° − 42.2° = 47.8° polar
        latitude. The script places six holes at 55°, giving a 7° margin:
      </p>
      <pre>{`DRAIN_LAT = math.radians(55)    # 55° > 47.8° safety margin
DRAIN_COUNT = 6                 # 60° azimuthal spacing
DRAIN_R   = 1 mm                # 2 mm diameter hole

for i in range(DRAIN_COUNT):
    az = math.radians(i * 60)
    z  = -OUTER_R * math.sin(DRAIN_LAT)   # below equator
    r  = OUTER_R  * math.cos(DRAIN_LAT)   # ring radius at that lat
    x, y = r * math.cos(az), r * math.sin(az)
    drain = _make_cylinder(...)
    drain.location = (x, y, z)
    # Rotate cylinder axis to align with outward surface normal
    normal = Vector((x, y, z)).normalized()
    drain.rotation_quaternion = Vector((0,0,1)).rotation_difference(normal)
    _apply_bool(shell, drain)`}</pre>

      <h2>Overhang analysis</h2>
      <p>
        Before exporting, the script runs an overhang pass and writes severity
        values as a FLOAT named attribute on the shell mesh. In the Shader
        Editor, wire <code>Attribute → "overhang" → Color Ramp</code> to see
        which faces need support structures. On an icosphere the south-pole
        region and the drainage-hole rims are the usual suspects.
      </p>
      <pre>{`bm.faces.layers.float.new("overhang")
for face in bm.faces:
    severity = max(0.0, -face.normal.z - cos(radians(45)))
    face[overhang_layer] = severity`}</pre>
      <p>
        Compare the technique to the full workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D Print Mesh Analysis tutorial
        </Link>
        , which adds manifold validation and BVH self-intersection checks.
      </p>

      <h2>STL export for the slicer</h2>
      <p>
        Blender 4.2 unified the STL exporter under{" "}
        <code>bpy.ops.wm.stl_export()</code> (previously{" "}
        <code>bpy.ops.export_mesh.stl()</code> — removed in 4.2). The key
        argument is <code>global_scale=1000.0</code>: Blender stores
        coordinates in metres, slicers expect millimetres. Forgetting this
        produces a 1000× scaled STL that reads as a 50-metre sphere.
      </p>
      <pre>{`bpy.ops.wm.stl_export(
    filepath  = abs_path,
    use_selection = True,
    global_scale  = 1000.0,   # metres → millimetres
    forward_axis  = 'Y',
    up_axis       = 'Z',
    ascii_format  = False,    # binary STL is 5× smaller
)`}</pre>
      <p>
        The outer shell and inner core are exported as separate files —
        <code>hf_sculpture_outer.stl</code> and{" "}
        <code>hf_sculpture_inner.stl</code> — because they print in different
        resins and may need different support strategies.
      </p>

      <h2>Hollow-shell comparison</h2>
      <p>
        This nested approach differs from a single hollow shell (as built in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr"
          className={lk}
        >
          bmesh solidify tutorial
        </Link>
        ) in one critical way: the inner and outer surfaces have{" "}
        <em>different topologies</em>. The inner core is sub=4 (smooth), the
        outer shell is sub=2 (faceted). A single solidify cannot produce two
        different subdivision levels on the same mesh. By constructing two
        separate objects you also get independent material assignments per
        surface, which maps cleanly to two print jobs in the slicer.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Boolean leaves holes or spikes.</strong> The cutter
          object&rsquo;s normals must be outward-consistent. Run{" "}
          <code>bmesh.ops.recalc_face_normals</code> on the cutter before
          adding the modifier.
        </li>
        <li>
          <strong>STL reads as 50 metres in slicer.</strong> You forgot{" "}
          <code>global_scale=1000</code>. The old{" "}
          <code>export_mesh.stl</code> operator used <code>global_scale=1</code>{" "}
          and worked because its default unit was different. The 4.2+ unified
          operator defaults to <code>global_scale=1</code> (metres).
        </li>
        <li>
          <strong>Drainage holes not Boolean&rsquo;d.</strong> Check that the
          drain cylinder is actually intersecting the shell wall. At 2 mm
          diameter and 2 mm wall the cylinders must be at least 2.5 mm long
          to pierce both surfaces. The script uses{" "}
          <code>WALL_MM * 2.5</code>.
        </li>
        <li>
          <strong>Inner surface not smooth in slicer.</strong> Ensure{" "}
          <code>poly.use_smooth = True</code> on the core mesh AND that your
          slicer is set to import smooth normals. Chitubox and Lychee honour
          the STL normal vectors if the file is binary-format.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body);
