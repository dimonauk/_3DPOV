import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>CurveModifier</code> bends a mesh so that its local deform axis
        follows the tangent of a Bezier or NURBS curve. Paired with{" "}
        <code>ArrayModifier</code> in <code>FIT_CURVE</code> mode — which tiles
        a profile cross-section until the combined length equals the curve arc
        length — you get a non-destructive path-following shape from a single
        profile tile and a single curve object.
      </p>
      <p>
        This tutorial builds a VRM hair-ribbon accessory: a flat rectangular
        tile (0.022 × 0.038 × 0.003 m) repeated along a four-point Bezier path,
        then deformed to follow it. The same technique produces wires, belts,
        bandoliers, tails, and any long prop that must conform to a sculpted
        line. Three modifiers — <code>Weld → Array → Curve</code> — stay on the
        stack until GLB export, where <code>export_apply=True</code> collapses
        them into final triangulated geometry.
      </p>

      <h2>CurveModifier API</h2>
      <pre>{`crv = ob.modifiers.new("Curve", 'CURVE')

# Required: the curve object to follow
crv.object = path_ob  # must be a Curves or Bezier/NURBS data-block

# Deform axis — the local axis that aligns with the curve tangent
crv.deform_axis = 'POS_X'  # default; others: NEG_X, POS_Y, NEG_Y, POS_Z, NEG_Z

# No radius, no falloff in 5.1 — the full mesh deforms`}</pre>
      <p>
        <code>deform_axis</code> must match the direction the profile tile
        extends along. If the tile is 0.022 m long in local X, use{" "}
        <code>POS_X</code>. Choosing <code>POS_Y</code> when the tile is
        oriented along X causes the modifier to pull the geometry sideways
        instead of along the curve, producing a collapsed or sheared result.
      </p>

      <h2>ArrayModifier FIT_CURVE mode</h2>
      <pre>{`arr = ob.modifiers.new("Array", 'ARRAY')

arr.fit_type  = 'FIT_CURVE'   # count = curve_length / tile_size_along_axis
arr.curve     = path_ob       # same object as CurveModifier's target

arr.relative_offset_displace[0] = 1.0   # offset = 1× tile X size
arr.relative_offset_displace[1] = 0.0
arr.relative_offset_displace[2] = 0.0

# Alternatives:
# fit_type = 'FIXED_COUNT'  — explicit integer count
# fit_type = 'FIT_LENGTH'   — explicit float length in metres`}</pre>
      <p>
        <code>FIT_CURVE</code> reads the arc length of the target curve and
        divides by the tile bounding-box extent along the offset axis. It rounds
        up to the next integer, so the last tile may overshoot the curve end
        by up to one tile length — visible as a small tail sticking out. The
        standard fix is to enable <code>arr.end_cap</code> or to scale the
        curve slightly shorter than a multiple of <code>TILE_LEN</code>.
      </p>

      <h2>Stack order: Weld → Array → Curve</h2>
      <pre>{`# Weld must sit BELOW Array so it sees individual tile seams before the
# Array replicates them. Placing Weld above Array would weld verts across
# different tile instances that happen to land at the same world position
# after CurveModifier bends them — producing incorrect topology.
weld = ob.modifiers.new("Weld", 'WELD')
weld.merge_threshold = 0.0002  # 0.2 mm — above floating-point error
weld.mode            = 'ALL'   # 'CONNECTED' ignores cross-tile junctions`}</pre>
      <p>
        Evaluation order in Blender is bottom → top in the modifier panel (first
        added = first evaluated). The correct mental model is: the mesh enters
        Weld first, then Array tiles it, then Curve bends the full result.
        Dragging Weld above Array in the UI reverses steps two and three, making
        Weld run on already-deformed geometry where the tile ends are no longer
        coincident — the seams reappear.
      </p>
      <p>
        For comparison, the <code>ArrayModifier</code> radial crown workflow
        covered in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-array-modifier-object-offset-radial-helix-webxr"
        >
          ArrayModifier — Object-Offset Radial Crown & Helix Stack
        </Link>{" "}
        uses <code>FIXED_COUNT</code> with an Empty driving the pivot. That
        approach distributes tiles around a fixed centre; this tutorial&apos;s{" "}
        <code>FIT_CURVE</code> approach distributes tiles along a free-form
        path. The two modes are composable — you can have radial arrays of
        path-following ribbons for complex accessories.
      </p>

      <h2>The Bezier curve in code</h2>
      <pre>{`cu = bpy.data.curves.new("ribbon_path", 'CURVE')
cu.dimensions  = '3D'
cu.twist_mode  = 'MINIMUM'   # critical: avoids roll at inflections
cu.use_path    = True        # enables path-length eval for FIT_CURVE

sp = cu.splines.new('BEZIER')
sp.use_cyclic_u = False
sp.bezier_points.add(3)   # add 3 → 4 total (one pre-exists)

bp = sp.bezier_points[0]
bp.co                = Vector(( 0.00,  0.0,  0.00))
bp.handle_left       = Vector((-0.05,  0.0,  0.03))
bp.handle_right      = Vector(( 0.05,  0.0, -0.03))
bp.handle_left_type  = 'FREE'
bp.handle_right_type = 'FREE'
# ... repeat for remaining points`}</pre>
      <p>
        <code>twist_mode</code> controls how the curve&apos;s normal vector rolls
        along the path. <code>MINIMUM</code> minimises total roll — the ribbon
        stays flat through bends. <code>TANGENT</code> keeps the normal aligned
        with the global Z axis until the path leaves the XY plane, then may
        roll sharply at inflections. For accessories that should lie flat
        against a surface (hair ribbons, badges, patches), always use{" "}
        <code>MINIMUM</code>. For cables that should twist with the path
        topology, <code>Z_UP</code> is often more predictable.
      </p>
      <p>
        The Bezier curve used here differs from the camera motion-path approach
        in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr"
        >
          BezierSpline — Motion-Path Camera Rail
        </Link>
        . There, the camera follows the curve via a Follow Path constraint and
        the curve is never a deformation target. Here the curve object is
        referenced by two modifiers simultaneously — as a tile-count source
        (Array) and as a deformation skeleton (Curve). The data-block itself
        is read-only from both modifier contexts; you can safely adjust
        control points in Edit Mode while both modifiers are live.
      </p>

      <h2>Origin and scale: the two footguns</h2>
      <pre>{`# FOOTGUN 1 — Origin offset
# CurveModifier offsets verts relative to the curve object's origin.
# If the profile mesh origin is at (0.18, 0, 0) the ribbon will be
# shifted 0.18 m away from the curve in world space.
ob.location = (0.0, 0.0, 0.0)   # always zero before adding modifiers

# FOOTGUN 2 — Unapplied scale
# FIT_CURVE count = curve_arc_length / (TILE_LEN * ob.scale.x)
# scale.x = 2.0 → only half the expected tiles are generated.
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.object.transform_apply(scale=True, location=False, rotation=False)`}</pre>
      <p>
        Apply scale on both the ribbon object AND the curve object before
        adding the modifier stack. Forgetting to apply the curve&apos;s scale is
        the more common mistake: <code>FIT_CURVE</code> reads the curve&apos;s
        world-space arc length, so a uniformly scaled curve silently changes
        tile count without any error.
      </p>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr"
        >
          HookModifier — Vertex-Group Bind to Empty
        </Link>{" "}
        for a related origin-dependency footgun: the Hook&apos;s{" "}
        <code>matrix_inverse</code> must be captured at bind time in object
        space — origin displacement during sculpt invalidates it similarly.
      </p>

      <h2>Cyclic (closed loop) ribbons</h2>
      <pre>{`# For a closed belt or wristband:
sp.use_cyclic_u = True   # closes the spline

# FIT_CURVE tile count rounds to nearest integer for cyclic paths.
# If curve_length / TILE_LEN = 16.7, you get 17 tiles;
# the last tile is 0.3 × TILE_LEN shorter than expected.
# Fix: choose TILE_LEN so it divides cleanly into the circumference.

# Example: wristband circumference ≈ 0.180 m, TILE_LEN = 0.018 m → 10 tiles exactly.
TILE_LEN = 0.018`}</pre>

      <h2>Solidify for physical thickness</h2>
      <pre>{`# The profile tile already has physical thickness RIBBON_T = 0.003 m.
# For a thicker hem/border effect, add SolidifyModifier AFTER CurveModifier:
sol = ob.modifiers.new("Solidify", 'SOLIDIFY')
sol.solidify_mode       = 'SIMPLE'
sol.thickness           = 0.002    # additional 2 mm outer shell
sol.use_even_offset     = True
sol.use_rim             = True
sol.material_offset_rim = 1        # route rim to edge trim material slot`}</pre>
      <p>
        Adding <code>SolidifyModifier</code> after <code>CurveModifier</code>{" "}
        in the stack adds an outer shell and rim to the already-deformed ribbon.
        The rim faces route to a separate material slot via{" "}
        <code>material_offset_rim</code> — the gold-trim panel-line technique
        explained in full in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr"
        >
          SolidifyModifier — Simple vs Complex Mode, Rim Cap & Two-Material
          Panel Line
        </Link>
        . The stack then reads: Weld → Array → Curve → Solidify → (optional)
        WeightedNormal.
      </p>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath            = bpy.path.abspath("//hf_ribbon_accessory.glb"),
    export_format       = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_apply        = True,   # collapses all modifiers into final mesh
    export_materials    = 'EXPORT',
    export_yup          = True,   # Holoflow Studio: +Y up
    use_selection       = False,
)`}</pre>
      <p>
        <code>export_apply=True</code> is mandatory — <code>CurveModifier</code>{" "}
        produces geometry at export time from a Python API standpoint; without
        apply, the exported mesh is the undeformed profile tile repeated in a
        straight line. The resulting GLB contains a single mesh node with two
        glTF primitives (fabric faces + edge-trim cap faces), each with its own
        Draco-compressed index buffer.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.CurveModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.CurveModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY-SA 4.0 · Blender Foundation) — full property reference for{" "}
          <code>object</code>, <code>deform_axis</code>. Related sibling pages:
          bpy.types.ArrayModifier (fit_type, curve property),
          projects.blender.org modifier-curve.cc source.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/curve.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Curve Modifier — Blender Manual
          </a>{" "}
          (CC BY-SA 4.0 · Blender Documentation Team) — deform axis diagrams,
          origin alignment notes, known limitation with multi-spline curves.
          Related sibling pages: Array Modifier (Generate category), Path
          Animation properties, Twist Method reference.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0) — bundled glTF exporter; handles modifier application
          and multi-primitive mesh export. Related: KhronosGroup/glTF
          specification, KhronosGroup/glTF-Sample-Assets, three.js{" "}
          <code>GLTFLoader</code>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-curve-modifier-ribbon-array-fit-path-vrm-webxr",
  title:
    "Python bpy.types.CurveModifier — ArrayModifier FIT_CURVE, Deform Axis & Weld Stack: Path-Following Ribbon Accessory & GLB Export (Blender 5.1)",
  summary:
    "CurveModifier bends a mesh so its local deform axis follows a Bezier tangent. Paired with ArrayModifier (fit_type='FIT_CURVE') it tiles a profile cross-section to fill the curve arc length. This tutorial builds a VRM hair-ribbon accessory using the Weld→Array→Curve modifier stack. Covers deform_axis selection, twist_mode='MINIMUM' to prevent ribbon roll, the origin-offset and unapplied-scale footguns, cyclic closed-loop ribbons, and GLB export with export_apply=True.",
  tags: [
    "blender",
    "python",
    "scripting",
    "curve-modifier",
    "array-modifier",
    "fit-curve",
    "bezier",
    "ribbon",
    "accessory",
    "vrm",
    "modifier",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-18",
  body: <Body />,
  libraryPath:
    "blends/modifiers/python-bpy-curve-modifier-ribbon-array-fit-path-vrm-webxr",
});
