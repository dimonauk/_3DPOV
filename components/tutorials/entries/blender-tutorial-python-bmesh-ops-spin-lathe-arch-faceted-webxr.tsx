import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.spin</code> is the low-level rotational-extrude
        primitive that underlies Blender&apos;s Screw modifier. Unlike the
        modifier it is purely destructive and entirely context-free: no modifier
        stack, no depsgraph update, no 3D Viewport required. The resulting
        geometry lives directly in the working <code>BMesh</code>, so you can
        immediately chain <code>bmesh.ops.bevel</code>,{" "}
        <code>bmesh.ops.bridge_loops</code>, or extrude before ever creating a
        Blender data-block. This blueprint uses it to build two faceted props in
        a single headless session: a hex-profile toroid ring (full 360°
        revolution) and a horseshoe arch gateway (240° partial sweep).
      </p>

      <h2>How spin works internally</h2>
      <p>
        Each <code>bmesh.ops.spin</code> call executes the following loop{" "}
        <em>steps</em> times:
      </p>
      <ol>
        <li>
          Duplicate the current geometry ring (verts + edges from the previous
          iteration, or the original profile on iteration 0).
        </li>
        <li>
          Rotate the duplicate by <code>angle / steps</code> radians around{" "}
          <code>axis</code> through <code>cent</code>.
        </li>
        <li>
          Bridge edge-pairs between the previous ring and the new ring with quad
          faces.
        </li>
        <li>
          Optionally translate the new ring by <code>dvec</code> — a non-zero
          vector turns the revolution into a helix.
        </li>
      </ol>
      <p>
        The final ring is either merged back to step-0 (<code>use_merge=True</code>
        ) for a sealed revolution, or left as open boundary loops (
        <code>use_merge=False</code>) for a partial arc.
      </p>

      <h2>The geom requirement: vertices alone produce no faces</h2>
      <p>
        The most common beginner error is passing <em>only</em>{" "}
        <code>BMVert</code> objects in <code>geom</code>. Spin copies and
        rotates them correctly, but without edges there is nothing to bridge —
        the result is a fan of isolated vertices with no quad faces.
      </p>
      <pre>{`# WRONG — no edges → no bridge quads
bmesh.ops.spin(bm, geom=verts_only, …)

# CORRECT — edges trigger quad bridging between rings
bmesh.ops.spin(bm, geom=verts + edges, …)`}</pre>
      <p>
        The edges must form the profile loop you want swept. For the toroid
        blueprint a closed hex loop (6 verts, 6 edges) is swept around the Z
        axis; for the arch a rectangular 4-edge loop is swept through 240°.
      </p>

      <h2>Full revolution: use_merge and merge_dist</h2>
      <p>
        When <code>angle ≈ ±2π</code> (full 360°), setting{" "}
        <code>use_merge=True</code> welds the final step&apos;s verts back to
        the original profile within <code>merge_dist</code>. Without this,
        Blender leaves a coincident but topologically separate seam between the
        last ring and the first — two overlapping edges at the same position
        that produce a sharp lighting artefact on smooth-shaded models.
      </p>
      <p>
        <code>merge_dist</code> must be smaller than the shortest edge in the
        profile. For the hex ring, the shortest edge ≈{" "}
        <code>2 × HEX_R × sin(π/6) ≈ 0.08 m</code>; setting{" "}
        <code>merge_dist = 1e-4</code> is safe by four orders of magnitude.
        This threshold is purely a weld tolerance, not a visual effect — set it
        conservatively rather than loosely.
      </p>

      <h2>Partial revolution: capping open boundary loops</h2>
      <p>
        For a sweep less than 360°, <code>use_merge=False</code> (the only
        valid option for partial arcs) leaves two open boundary loops: the
        original profile at 0° and its copy at <code>ARCH_DEG</code>. Both must
        be capped manually or the mesh will be non-manifold and export badly.
      </p>
      <p>
        The start cap uses the original profile verts directly:
      </p>
      <pre>{`bm2.faces.new([v_bl, v_tl, v_tr, v_br])  # wound for outward -Y normal`}</pre>
      <p>
        The end cap is located via <code>result[&apos;geom_last&apos;]</code> — the
        convenience handle that spin returns, containing only the geometry from
        the <em>final</em> step. Filtering for <code>BMVert</code> objects gives
        exactly the 4 end-cap verts without index arithmetic:
      </p>
      <pre>{`end_verts = [e for e in result['geom_last'] if isinstance(e, bmesh.types.BMVert)]
by_z = sorted(end_verts, key=lambda v: v.co.z)
lo   = sorted(by_z[:2], key=lambda v: v.co.x)  # [inner-lo, outer-lo]
hi   = sorted(by_z[2:], key=lambda v: v.co.x)  # [inner-hi, outer-hi]
bm2.faces.new([lo[1], hi[1], hi[0], lo[0]])`}</pre>
      <p>
        After both caps are added, call{" "}
        <code>bmesh.ops.recalc_face_normals</code> to normalise the winding
        consistently — manual <code>faces.new()</code> calls do not auto-correct
        winding with respect to the rest of the mesh.
      </p>

      <h2>cent, RING_RADIUS, and the toroid geometry</h2>
      <p>
        The <code>cent</code> parameter is the point through which the spin axis
        passes — <em>not</em> the centre of the profile. When the profile is
        offset from <code>cent</code> by a radial distance (
        <code>RING_RADIUS = 0.35 m</code> along X in the blueprint), the swept
        solid becomes a toroid: the profile traces a circular path around the
        axis rather than meeting it. The hole size is approximately{" "}
        <code>RING_RADIUS − HEX_R</code>. Setting <code>cent = profile_centre</code>{" "}
        would collapse the revolution to a cone or disk — a common mistake when
        adapting the pattern.
      </p>

      <h2>dvec: helix extension</h2>
      <p>
        A non-zero <code>dvec</code> translates each successive ring by that
        vector in addition to the rotation. <code>dvec=(0,0,0.05)</code> with a
        full 360° sweep produces a coil spring; varying the magnitude relative
        to <code>angle/steps</code> controls the helix pitch. The blueprint
        passes <code>dvec=Vector((0,0,0))</code> for pure revolution, but the
        parameter is explicitly named to make the intent clear to readers who may
        want to extend it.
      </p>

      <h2>Connecting to the Screw modifier</h2>
      <p>
        <code>bmesh.ops.spin</code> and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr"
          className={lk}
        >
          Screw modifier
        </Link>{" "}
        produce identical topology from the same profile, but differ in
        execution context:
      </p>
      <ul>
        <li>
          <strong>bmesh.ops.spin</strong> — destructive, context-free, immediate
          geometry in RAM. No modifier stack required; chain other bmesh ops in
          the same pass. Requires explicit cap management for partial arcs.
        </li>
        <li>
          <strong>Screw modifier</strong> — non-destructive, live, evaluated via
          depsgraph. Capping is automatic (<code>use_normal_calculate=True</code>
          ); easier to iterate interactively. Apply via{" "}
          <code>bpy.ops.object.modifier_apply</code> for an identical baked
          result.
        </li>
      </ul>
      <p>
        For headless pipeline scripts — where there is no depsgraph and no
        modifier stack — <code>bmesh.ops.spin</code> is always the correct
        choice. For interactive or parametric rigs the Screw modifier wins.
      </p>

      <h2>WebXR export: Draco + Y-up</h2>
      <p>
        Both props are exported with{" "}
        <code>export_yup=True</code> (glTF +Y-up convention),{" "}
        <code>export_draco_mesh_compression_level=6</code>, and{" "}
        <code>export_image_format=&apos;WEBP&apos;</code>. The flat-shaded
        faceted aesthetic requires that <code>export_apply=True</code> is set so
        the face normals computed by <code>f.smooth = False</code> are baked into
        the exported normals array. Without <code>export_apply</code>, the GLB
        inherits Blender&apos;s auto-smooth algorithm, which may re-smooth
        coincident faces and erase the flat facet look.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr"
          className={lk}
        >
          DisplaceModifier terrain tutorial
        </Link>
        , which uses the same headless export helper pattern but snapshots a
        modifier-evaluated mesh via{" "}
        <code>bpy.data.meshes.new_from_object(ev, depsgraph=dg)</code> rather
        than exporting a raw bmesh.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No faces in the output mesh</strong> — geom list contained
          only verts. Add the corresponding edges before calling spin.
        </li>
        <li>
          <strong>Seam lighting artefact at 360° join</strong> — use_merge is
          False or merge_dist is larger than the shortest profile edge. Set
          use_merge=True and shrink merge_dist.
        </li>
        <li>
          <strong>End cap missing or inside-out</strong> — result[&apos;geom_last&apos;]
          filtered incorrectly, or face winding is reversed. Re-check the sort
          by Z then X and call recalc_face_normals after capping.
        </li>
        <li>
          <strong>Flat shading lost in GLB</strong> — export_apply=False.
          Enable it so the baked normals reach the exporter.
        </li>
        <li>
          <strong>Partial arc larger than expected</strong> — angle is in
          radians; use math.radians(ARCH_DEG) not the raw degree value.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender bmesh.ops API Reference — 5.1</strong> — Blender
          Foundation,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>{" "}
          (CC-BY-SA-4.0). The authoritative reference for all bmesh operator
          signatures, including spin&apos;s geom, axis, cent, angle, steps,
          use_merge, merge_dist, dvec, and use_normal_flip parameters. Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <strong>KhronosGroup/glTF-Blender-IO</strong> — Khronos Group,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0). The official Blender GLB exporter, covering Draco
          compression, +Y-up convention, and normals export.
        </li>
      </ul>

      <h2>Further study in this library</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr"
            className={lk}
          >
            ScrewModifier — profile lathe & revolution vase
          </Link>{" "}
          — the modifier-stack equivalent of bmesh.ops.spin; non-destructive,
          auto-capped, evaluated via depsgraph — ideal for live iteration where
          destructive bmesh ops are unnecessary.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
            className={lk}
          >
            bmesh.ops — extrude, bevel, bridge: hard-surface prop construction
          </Link>{" "}
          — chaining bmesh operators in a single pass; same context-free pattern
          applied to extrusion and bevelling rather than revolution.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr"
            className={lk}
          >
            DisplaceModifier + bpy.data.textures — procedural height-field terrain
          </Link>{" "}
          — the headless snapshot GLB export pattern used throughout the scripting
          library; compare against the direct bmesh-to-GLB path used here.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-spin-lathe-arch-faceted-webxr",
  title:
    "Python bmesh.ops.spin — Surface of Revolution & Partial Arc: Hex-Faceted Toroid & Horseshoe Arch for WebXR (Blender 5.1)",
  description:
    "Build a seamless hex-faceted toroid ring (full 360°, use_merge=True) and a horseshoe arch gateway (240° partial sweep) using bmesh.ops.spin — with expert coverage of the geom edge requirement, use_merge seam welding, result['geom_last'] end-cap retrieval, dvec helix extension, and cent-offset toroid geometry.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "spin",
    "lathe",
    "surface-of-revolution",
    "toroid",
    "arch",
    "faceted",
    "webxr",
    "glb",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-spin-lathe-arch-faceted-webxr",
  Body,
  keyInsights: [
    "geom MUST include both BMVert and BMEdge objects — passing vertices alone produces isolated vertex fans with no bridge quads",
    "use_merge=True welds the final step back to the original profile within merge_dist, eliminating the coincident seam that causes a lighting artefact at the 360° join",
    "result['geom_last'] returns only the geometry from the FINAL spin step — the fastest way to locate end-cap verts for a partial arc without index arithmetic",
    "cent is the point through which the spin axis passes, not the profile centre — offsetting the profile by RING_RADIUS from cent produces a toroid",
    "dvec adds a per-step translation alongside the rotation; (0,0,dz) creates a helix, (0,0,0) is pure revolution",
    "export_apply=True is required to bake flat-shaded normals (f.smooth=False) into the GLB — without it the exporter re-smooths coincident faces and loses the faceted look",
  ],
});
