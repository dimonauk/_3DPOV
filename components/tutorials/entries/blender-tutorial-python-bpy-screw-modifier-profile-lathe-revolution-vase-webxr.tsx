import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender's <code>ScrewModifier</code> takes a 2D profile mesh —
        vertices connected by edges, lying in a plane that contains the
        revolution axis — and spins it around that axis to produce a surface
        of revolution. Potters call this a lathe; mathematicians call it a
        surface of revolution; Blender calls it a Screw modifier because the
        same mechanism produces helical screws when <code>screw_offset</code>{" "}
        is non-zero. The result of this tutorial is a faceted 12-gon decorative
        vase in <code>hf_lathe_vase.glb</code>, ready for Draco-compressed
        WebXR delivery.
      </p>
      <p>
        Unlike the <em>Spin</em> tool in Edit Mode (which bakes the revolution
        into the mesh immediately), <code>ScrewModifier</code> is
        non-destructive: you can edit the profile silhouette, change the step
        count, or adjust the angle after creation and the surface updates in
        real time. It evaluates through the standard modifier stack, so
        headless baking via the depsgraph is straightforward.
      </p>

      <h2>The rule the modifier enforces: edges, not bare vertices</h2>
      <p>
        A common first failure with <code>ScrewModifier</code> is supplying a
        mesh of isolated vertices with no edges. The modifier revolves{" "}
        <em>edges</em> into quad strips — a single edge sweeps into one quad
        face per angular step. Vertices without edges produce only a ring of
        points with no geometry between them.
      </p>
      <pre>{`# Correct: vertices connected by sequential edges
verts_3d = [(r, 0.0, h) for (r, h) in PROFILE]
edges    = [(i, i + 1) for i in range(len(PROFILE) - 1)]

profile_me = bpy.data.meshes.new("vase_profile")
profile_me.from_pydata(verts_3d, edges, [])   # third arg = faces → []
profile_me.update()

# Wrong: from_pydata(verts, [], []) → isolated points, no revolution surface`}</pre>
      <p>
        Similarly, do not add faces to the profile. A triangulated face would
        be revolved into a solid of revolution (a filled disc, not a shell),
        obscuring the vase interior. Keep the profile as a pure edge chain.
      </p>

      <h2>Key parameters</h2>
      <pre>{`screw = profile_ob.modifiers.new("Screw", 'SCREW')

screw.axis         = 'Z'          # revolution axis: 'X', 'Y', or 'Z'
screw.angle        = math.tau     # 2π = full 360°; math.pi = half-revolution
screw.steps        = 12           # angular subdivisions in the viewport
screw.render_steps = 12           # keep equal to steps (avoids render surprise)
screw.screw_offset = 0.0          # 0 = symmetric revolution; >0 = helix pitch
screw.iterations   = 1            # repeat count; 2 doubles the height with a seam`}</pre>
      <h3>steps — the primary faceting control</h3>
      <p>
        <code>steps</code> is the number of angular subdivisions. It controls
        the cross-sectional polygon of the resulting surface:
      </p>
      <ul>
        <li>
          <code>steps=4</code> → square cross-section (four-sided prism)
        </li>
        <li>
          <code>steps=6</code> → hexagonal cross-section
        </li>
        <li>
          <code>steps=12</code> → dodecagonal — the studio's default for
          low-poly faceted props
        </li>
        <li>
          <code>steps=64</code> → approaches a smooth cylinder
        </li>
      </ul>
      <p>
        At 12 steps the vase reads as explicitly polygonal — each face plane
        catches light independently, which is the hallmark of the studio's
        faceted aesthetic. Keep <code>render_steps</code> equal to{" "}
        <code>steps</code> or you will get a different mesh at render time.
      </p>

      <h2>Closing the seam — use_merge_vertices</h2>
      <p>
        At <code>angle=2π</code> the final ring of vertices lands exactly on
        top of the first ring. Without merging, the modifier leaves both sets
        of vertices in place, creating a zero-width seam. The GLTF exporter
        sees that seam as an edge and may render a hard crease at 0° / 360°.
      </p>
      <pre>{`screw.use_merge_vertices = True   # collapses seam vertices at angle=2π
# WHY: at angle < 2π (partial revolution), seam verts cannot overlap —
# merge_vertices on a partial revolution produces a gap at the open end.
# Only enable for full 360° revolutions.`}</pre>

      <h2>Axis vertex and normal calculation</h2>
      <p>
        Vertex 0 in the profile sits at radius 0 — it is on the revolution
        axis. After the spin, this single vertex is shared by all{" "}
        <code>steps</code> triangles of the base fan. The winding-order
        normals for a pole fan can be inconsistent (they depend on the order
        in which the triangles reference the shared vertex). Setting{" "}
        <code>use_normal_calculate=True</code> triggers a post-revolution
        normal recalculation that uses weighted face-area averaging, producing
        a stable outward normal at the pole.
      </p>
      <pre>{`screw.use_normal_calculate = True   # recalculate normals after revolution
screw.use_normal_flip      = False  # flip if inside-out (check with viewport)`}</pre>

      <h2>screw_offset — from vase to helix</h2>
      <p>
        Setting <code>screw_offset</code> to a non-zero value shifts each ring
        upward (along the axis) by that many metres per full revolution. A
        vase profile with <code>screw_offset=0.05</code> and{" "}
        <code>iterations=20</code> becomes a coil spring. The same technique
        models screw threads, DNA ribbons, and spiral staircases.
      </p>
      <pre>{`# Spring example
screw.screw_offset = 0.05   # 5 cm rise per revolution
screw.iterations   = 12     # 12 coils total`}</pre>

      <h2>Headless baking via depsgraph</h2>
      <p>
        <code>bpy.ops.object.modifier_apply()</code> requires an active
        VIEW_3D context that is absent in background scripts. The safe path
        evaluates the modifier stack through the dependency graph and
        snapshots the result into a new mesh data block — no operators needed.
      </p>
      <pre>{`depsgraph = bpy.context.evaluated_depsgraph_get()
eval_ob   = profile_ob.evaluated_get(depsgraph)   # modifier stack applied
baked_me  = bpy.data.meshes.new_from_object(eval_ob)  # permanent copy

vase_ob = bpy.data.objects.new("hf_lathe_vase", baked_me)
bpy.context.collection.objects.link(vase_ob)

bpy.data.objects.remove(profile_ob, do_unlink=True)  # clean up profile helper`}</pre>

      <h2>Faceted shading and sharp edges for GLB</h2>
      <p>
        After baking, every polygon must be explicitly marked as flat-shaded
        and every edge must be marked sharp. The GLTF exporter reads the{" "}
        <code>sharp_edge</code> mesh attribute (Blender 5.1's edge-domain
        boolean attribute) to decide when to split vertex normals in the
        exported file — without it, adjacent faces average their normals and
        the faceted planes blur together in Three.js.
      </p>
      <pre>{`# Flat shading
for poly in baked_me.polygons:
    poly.use_smooth = False

# Sharp edges — Blender 5.1 attribute API
sharp_attr = baked_me.attributes.get("sharp_edge")
if sharp_attr is None:
    sharp_attr = baked_me.attributes.new("sharp_edge", 'BOOLEAN', 'EDGE')
for datum in sharp_attr.data:
    datum.value = True
baked_me.update()`}</pre>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath                             = glb_path,
    export_format                        = 'GLB',
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_normals                       = True,
    export_colors                        = False,
)`}</pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No geometry appears after running the script</strong> —
          check that the profile mesh has edges (<code>from_pydata(v, edges, [])</code>
          not <code>from_pydata(v, [], [])</code>). Open the Outliner →
          Geometry node for the profile object and confirm{" "}
          <em>edges &gt; 0</em>.
        </li>
        <li>
          <strong>Seam crease at 0° / 360°</strong> — enable{" "}
          <code>use_merge_vertices</code>. Also ensure{" "}
          <code>angle == math.tau</code> exactly (floating-point rounding can
          leave a tiny gap that merge cannot close — use the constant).
        </li>
        <li>
          <strong>Normals pointing inward</strong> — toggle{" "}
          <code>use_normal_flip = True</code>. Check in Viewport Overlays →
          Face Orientation (blue = outward, red = inward).
        </li>
        <li>
          <strong>Smooth faces in the GLB despite flat-shading code</strong>{" "}
          — ensure <code>baked_me.update()</code> is called after setting the
          sharp_edge attribute. The update flushes attribute state to the
          internal mesh tables the exporter reads.
        </li>
        <li>
          <strong>Axis vertex (pole) has a dark artefact</strong> — the pole
          vertex is shared by all base-fan triangles; at low step counts the
          averaging can produce a mild artefact. Move vertex 0 slightly off
          the axis (<code>r=0.001</code>) or cut the bottom with a{" "}
          <code>SolidifyModifier</code> to cap it.
        </li>
      </ul>

      <h2>What to try next</h2>
      <ul>
        <li>
          Animate <code>screw.angle</code> from 0 → 2π over 120 frames for a
          reveal effect — the vase grows as it spins.
        </li>
        <li>
          Add a{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
          >
            SubsurfModifier after the Screw modifier
          </Link>{" "}
          with crease-guarded edges to produce a smooth variant from the same
          12-step profile.
        </li>
        <li>
          Stack a second ScrewModifier with{" "}
          <code>screw_offset=0.05</code> on a simple circle profile to build
          a coil spring for a physics rig.
        </li>
        <li>
          Use the same profile approach with an{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-array-modifier-object-offset-radial-helix-webxr"
          >
            ArrayModifier in radial mode
          </Link>{" "}
          to crown the vase with a repeating relief pattern.
        </li>
        <li>
          Replace the hardcoded PROFILE list with parametric data from a{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
          >
            from_pydata mathematical surface
          </Link>{" "}
          to generate lathe objects from arbitrary equations.
        </li>
      </ul>

      <h3>External sources</h3>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.ScrewModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.ScrewModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property reference for{" "}
          <code>axis</code>, <code>angle</code>, <code>steps</code>,{" "}
          <code>screw_offset</code>, <code>use_merge_vertices</code>, and{" "}
          <code>use_normal_calculate</code>. Related projects: Blender Python
          API Working Group (developer.blender.org), bf-extensions repository
          on projects.blender.org.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/screw.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Screw Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — user-facing reference
          including axis diagrams, iteration examples, and the distinction
          between the Screw modifier and the Spin operator. Related sibling
          pages in the same manual section: Mirror Modifier, Solidify Modifier,
          Build Modifier — all generate-type modifiers.
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
          (Apache-2.0) — the bundled GLTF exporter; handles{" "}
          <code>export_apply</code>, Draco compression, and reads the{" "}
          <code>sharp_edge</code> attribute for normal-split decisions at export
          time. Related: KhronosGroup/glTF specification,
          KhronosGroup/glTF-Sample-Assets.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr",
  title:
    "Python bpy.types.ScrewModifier — Profile-to-Lathe Revolution: Faceted Vase & GLB Export (Blender 5.1)",
  summary:
    "ScrewModifier revolves a 2D edge-chain profile around an axis to produce a surface of revolution — the lathe technique applied non-destructively. This tutorial covers why the profile must contain edges (not bare vertices), how steps controls the facet count, use_merge_vertices for seamless 360° closure, screw_offset for helix conversion, headless depsgraph baking, and Blender 5.1 sharp_edge attribute marking for correct faceted GLB normals.",
  tags: [
    "blender",
    "python",
    "scripting",
    "screw-modifier",
    "lathe",
    "revolution-surface",
    "modifier",
    "faceted",
    "low-poly",
    "vase",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr",
});
