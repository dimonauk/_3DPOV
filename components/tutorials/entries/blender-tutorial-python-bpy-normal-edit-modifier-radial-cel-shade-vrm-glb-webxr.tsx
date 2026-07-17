import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender's <code>NormalEditModifier</code> overrides each vertex's
        normal direction without touching the mesh topology. In{" "}
        <code>RADIAL</code> mode it computes normals that point radially away
        from a target object's origin — mimicking the normal field of a smooth
        sphere. A flat-polygon faceted gem then shades as if it were a rounded
        solid, producing the gradient lighting associated with anime cel-shade
        styles, without any subdivision.
      </p>
      <p>
        The practical pipeline: build a low-poly gem via{" "}
        <code>bmesh.ops.limited_dissolve</code>, place an Empty at its
        geometric centre, add the modifier targeting that Empty, write a vertex
        group to fade from full sphere normals at the crown down to near-flat
        at the base, bake the computed normals via{" "}
        <code>evaluated_get + new_from_object</code>, and export a GLB with{" "}
        <code>export_normals=True</code>.
      </p>

      <h2>Why NormalEditModifier and not SMOOTH_BY_ANGLE</h2>
      <p>
        <code>SMOOTH_BY_ANGLE</code> averages adjacent face normals at shared
        vertices — it can only soften the shading at topology seams; it cannot
        produce normals that aim <em>towards</em> a geometric centre on faces
        that are genuinely flat. A flat face has a single face normal; SBA
        averages it with its neighbours at each vertex, giving a slight{" "}
        angle variation but never a convincing sphere gradient.{" "}
        <code>NormalEditModifier</code> replaces the direction entirely,
        decoupling visual smoothness from polygon count.
      </p>
      <pre>{`# SBA — can only average what topology provides
mod_sba = gem.modifiers.new("SBA", 'SMOOTH_BY_ANGLE')
mod_sba.angle = math.radians(30)
# Result: normals shift at shared verts; flat faces still read as flat

# NormalEditModifier — overrides direction regardless of topology
mod = gem.modifiers.new("NormalEdit", 'NORMAL_EDIT')
mod.mode   = 'RADIAL'
mod.target = empty    # Empty at gem centre
# Result: every vertex normal points radially from centre → smooth sphere shade`}</pre>

      <h2>shade_smooth is non-negotiable</h2>
      <p>
        The Blender pipeline clamps loop normals to their face normal on any
        face marked flat-shaded. Custom normals — including those produced by{" "}
        <code>NormalEditModifier</code> — are silently discarded for flat
        faces. Call <code>gem.data.shade_smooth()</code> (or add a{" "}
        <code>SMOOTH_BY_ANGLE</code> modifier above{" "}
        <code>NormalEditModifier</code> in the stack) before the modifier runs,
        otherwise the entire pass is a no-op.
      </p>
      <pre>{`# Must be called BEFORE adding NormalEditModifier
gem.data.shade_smooth()   # marks all polygon.use_smooth = True

# Alternatively, add SMOOTH_BY_ANGLE at angle=180° (always smooth, no split)
mod_sba = gem.modifiers.new("AlwaysSmooth", 'SMOOTH_BY_ANGLE')
mod_sba.angle = math.radians(180)  # never splits — pure smooth shading
# Then add NormalEditModifier below it in the stack`}</pre>

      <h2>mode='RADIAL' vs mode='DIRECTIONAL'</h2>
      <p>
        <strong>RADIAL</strong> (the cel-shade technique): each vertex normal
        is computed as{" "}
        <code>(vertex_world_pos − target_origin).normalized()</code>. Moving
        the Empty off-centre tilts the normals asymmetrically — useful for
        face rigs where you want highlights to track from a specific cheek
        position rather than the face's geometric centre.
      </p>
      <p>
        <strong>DIRECTIONAL</strong>: all vertex normals point in the same
        direction (towards the target). Useful for faking planar-projection
        normals on curved geometry — for example, a curved wall whose normals
        should all point straight outward to match a flat-lit scene.{" "}
        <code>use_direction_parallel=True</code> makes every normal identical
        (pure world-space direction); <code>False</code> (default) still varies
        per vertex based on the line-of-sight vector to the target.
      </p>
      <pre>{`# RADIAL — sphere normals from a centre point
mod.mode   = 'RADIAL'
mod.target = empty_at_gem_centre

# DIRECTIONAL — shared aim direction towards target
mod.mode               = 'DIRECTIONAL'
mod.target             = distant_empty   # far away = nearly parallel normals
mod.use_direction_parallel = True        # force all normals identical`}</pre>

      <h2>mix_factor and mix_mode</h2>
      <p>
        <code>mix_factor</code> blends between original normals (0.0) and
        computed normals (1.0) via vector Lerp + renormalise.{" "}
        <code>mix_mode='COPY'</code> (the default) replaces; other modes
        accumulate:
      </p>
      <ul>
        <li>
          <code>'ADD'</code> — adds the computed normal vector to the original
          and renormalises. Useful for subtle directional bias while retaining
          topology-derived detail.
        </li>
        <li>
          <code>'SUB'</code> — subtracts. Rarely useful; can produce inverted
          normals at mix_factor=1.0 if vectors cancel.
        </li>
        <li>
          <code>'MUL'</code> — element-wise multiply then renormalise. Niche.
        </li>
      </ul>
      <pre>{`mod.mix_factor = 0.90   # 90 % sphere, 10 % original
mod.mix_mode   = 'COPY' # standard replacement blend

# mix_limit: only apply where the angle between normals is below this value
mod.mix_limit  = math.pi    # math.pi = no restriction (default)
# Set to math.radians(90) to restrict to vertices whose face normal
# is already within 90° of the sphere direction — avoids inverting
# normals on any back-facing faces of a thin gem`}</pre>

      <h2>Vertex group weight gradient</h2>
      <p>
        A gem resting on a surface looks wrong if its base face has the same
        rounded sphere normals as its crown — the bottom edge would shade as if
        floating in midair. Assign a vertex group with low weight (0.2) at the
        base verts and full weight (1.0) at the crown verts. The modifier
        multiplies <code>mix_factor</code> by the per-vertex weight, fading
        from flat normals at the base to full sphere normals at the top.
      </p>
      <pre>{`grp = gem.vertex_groups.new(name="NE_Mix")
base_idxs = [v.index for v in mesh.vertices if v.co.z < -0.10]
top_idxs  = [v.index for v in mesh.vertices if v.co.z >= -0.10]
grp.add(base_idxs, 0.20, 'REPLACE')   # base: mostly flat
grp.add(top_idxs,  1.00, 'REPLACE')   # crown: full sphere

mod.vertex_group        = grp.name
mod.invert_vertex_group = False`}</pre>

      <h2>use_flat_normals</h2>
      <p>
        When <code>use_flat_normals=True</code>, the modifier starts from face
        normals (constant per polygon) rather than smooth vertex normals. The
        interpolation then moves from "pure flat face" towards "pure sphere" as
        mix_factor increases. This retains hard facet edges at the silhouette
        while still producing the sphere gradient across each face's interior.
        The subtlety is most visible on large flat faces where the smooth
        vertex-normal base would already show some gradient.
      </p>
      <pre>{`mod.use_flat_normals = True    # interpolate flat → sphere
# → hard silhouette edges retained; gradient visible per-face

mod.use_flat_normals = False   # interpolate smooth → sphere (default)
# → softer silhouette; gradient starts from averaged topology normals`}</pre>

      <h2>Baking via depsgraph (headless-safe)</h2>
      <p>
        <code>bpy.ops.object.modifier_apply()</code> requires an active
        VIEW_3D context and raises <code>RuntimeError</code> in headless
        scripts. The safe route: evaluate the depsgraph, call{" "}
        <code>new_from_object()</code>, and swap the data block.
      </p>
      <pre>{`depsgraph = bpy.context.evaluated_depsgraph_get()
obj_eval  = gem.evaluated_get(depsgraph)

# new_from_object collapses the full stack (including NormalEditModifier)
# into a new Mesh with normals pre-computed as static loop data.
baked = bpy.data.meshes.new_from_object(obj_eval, depsgraph=depsgraph)
old   = gem.data
gem.data = baked
gem.modifiers.clear()
bpy.data.meshes.remove(old)
baked.update()`}</pre>

      <h2>GLB export — the critical flag</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath       = bpy.path.abspath("//hf_normal_edit_gem.glb"),
    use_selection  = True,
    export_format  = 'GLB',
    export_apply   = False,     # modifiers already baked above
    export_normals = True,      # CRITICAL — writes sphere normals to NORMAL accessor
    export_yup     = True,      # +Y up for Three.js / WebXR
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
)`}</pre>
      <p>
        Without <code>export_normals=True</code>, the GLB omits the NORMAL
        accessor entirely; Three.js recomputes face normals from triangle
        geometry at load time and the sphere-normal effect disappears with no
        warning. This is the most common silent failure for this workflow.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No shading change after adding modifier</strong> —{" "}
          <code>shade_smooth()</code> was not called. Check{" "}
          <code>gem.data.polygons[0].use_smooth</code>; it must be{" "}
          <code>True</code>. Run <code>gem.data.shade_smooth()</code> then
          force a depsgraph update.
        </li>
        <li>
          <strong>GLB looks flat in Three.js despite correct export</strong> —
          confirm <code>export_normals=True</code>. Open the GLB in{" "}
          <a
            className={lk}
            href="https://gltf.report"
            target="_blank"
            rel="noopener noreferrer"
          >
            gltf.report
          </a>{" "}
          and verify that the mesh primitive has a <code>NORMAL</code>{" "}
          accessor.
        </li>
        <li>
          <strong>Normals invert on the bottom face</strong> — the bottom face
          normal already points away from the centre (it is a{" "}
          <em>lower</em> hemisphere face). RADIAL mode computes the correct
          direction; if inversion appears, check{" "}
          <code>bmesh.ops.recalc_face_normals</code> was called after{" "}
          limited_dissolve (dissolve can leave inconsistent winding).
        </li>
        <li>
          <strong>
            modifier_apply RuntimeError in headless script
          </strong>{" "}
          — use the <code>evaluated_get + new_from_object</code> path shown
          above instead of <code>bpy.ops.object.modifier_apply()</code>.
        </li>
        <li>
          <strong>target=None crashes Blender on modifier evaluation</strong>{" "}
          — NormalEditModifier with <code>target=None</code> and{" "}
          <code>mode='RADIAL'</code> uses the object's own origin as the
          sphere centre. This is valid; it produces the effect without a
          separate Empty. Explicitly assign the target only when you need the
          sphere centre offset from the object origin.
        </li>
      </ul>

      <h3>Studio cross-references</h3>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
          >
            SMOOTH_BY_ANGLE — auto-smooth migration & normal stacking
          </Link>{" "}
          — the SBA modifier that enables smooth shading, which is the
          prerequisite for NormalEditModifier to take effect. Also explains
          why <code>mesh.use_auto_smooth</code> was removed in Blender 4.2.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr"
          >
            Custom Split Normals — per-loop normal authoring & faceted GLB
          </Link>{" "}
          — the destructive alternative: writing normals directly into the
          mesh data block via <code>normals_split_custom_set</code>. Compare
          the non-destructive modifier approach with the baked approach.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
          >
            VertexGroup — scripted weight assignment & VRM deform envelope
          </Link>{" "}
          — how vertex groups are built via Python, covering{" "}
          <code>vertex_groups.new()</code>,{" "}
          <code>grp.add(indices, weight, 'REPLACE')</code>, and the{" "}
          <code>foreach_set</code> bulk path — all applicable to the{" "}
          NE_Mix group used here.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          >
            EEVEE Toon Cel Shader
          </Link>{" "}
          — the material side of the technique: Shader to RGB → posterise →
          step function that reads the sphere normals produced by this modifier
          to generate hard cel-shade bands.
        </li>
      </ul>

      <h3>External sources</h3>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.NormalEditModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.NormalEditModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property reference for{" "}
          <code>mode</code>, <code>target</code>, <code>mix_factor</code>,{" "}
          <code>mix_mode</code>, <code>mix_limit</code>,{" "}
          <code>use_flat_normals</code>, <code>vertex_group</code>, and{" "}
          <code>offset</code>. Related projects: Blender Python API Working
          Group (developer.blender.org), modifier source in{" "}
          <code>source/blender/modifiers/intern/MOD_normaledit.cc</code> at
          projects.blender.org/blender/blender.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/normals/normal_edit.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Normal Edit Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — user-facing reference
          including diagrams of RADIAL vs DIRECTIONAL mode, mix_factor
          interaction examples, and vertex-group usage. Related sibling pages:
          Weighted Normal Modifier, Smooth by Angle — all in the Normals
          modifier category of the Blender manual.
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
          (Apache-2.0) — the bundled Blender exporter. The{" "}
          <code>export_normals</code> flag controls whether computed loop
          normals are written to the NORMAL accessor; the behaviour is
          implemented in{" "}
          <code>io_scene_gltf2/blender/exp/mesh/</code>. Related:
          KhronosGroup/glTF specification, KhronosGroup/glTF-Sample-Assets.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr",
  title:
    "Python NormalEditModifier — Radial Fake Spherical Normals: Cel-Shade Faceted Gem & GLB Export (Blender 5.1)",
  summary:
    "NormalEditModifier in RADIAL mode replaces each vertex normal with a vector pointing away from a target Empty, mimicking a smooth sphere's normal field on flat-polygon geometry. This tutorial covers RADIAL vs DIRECTIONAL modes, mix_factor + vertex_group weight gradients, the shade_smooth prerequisite, use_flat_normals, headless baking via evaluated_get + new_from_object, and the critical export_normals=True GLB flag that prevents Three.js from silently discarding the effect.",
  tags: [
    "blender",
    "python",
    "scripting",
    "normal-edit-modifier",
    "normals",
    "cel-shade",
    "toon",
    "low-poly",
    "vrm",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr",
});
