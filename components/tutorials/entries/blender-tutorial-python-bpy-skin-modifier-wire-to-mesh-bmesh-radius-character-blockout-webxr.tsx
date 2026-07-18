import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>SkinModifier</code> sits in Blender&rsquo;s Generate modifier
        category and converts a mesh of vertices and edges — with no faces at
        all — into a closed skin surface. The tube radius at each vertex is
        stored in a custom BMesh vertex layer (<code>bm.verts.layers.skin</code>
        ), not in vertex weights or UV coordinates, which means the entire shape
        specification travels inside the mesh data block and regenerates
        correctly any time the modifier is re-evaluated. Stacking{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
        >
          SubsurfModifier
        </Link>{" "}
        immediately above Skin at <code>levels=1</code> rounds junction
        artefacts at branches without inflating the blockout silhouette.
      </p>
      <p>
        This tutorial builds a stylised humanoid upper-body silhouette: a spine
        chain from pelvis through chest to head, plus a bilateral shoulder
        cross-bar with upper-arm stubs. Per-vertex X/Y radii taper the torso.
        The modifier stack is applied at export to yield a Draco-compressed GLB
        for WebXR review.
      </p>

      <h2>Wire mesh construction</h2>
      <p>
        The input mesh carries <em>only</em> vertices and edges. Passing an
        empty face list to <code>bm.faces.new()</code> or omitting face creation
        entirely is intentional: <code>SkinModifier</code> derives its surface
        from the edge topology, not from face winding. Any faces present are
        ignored by the modifier.
      </p>
      <pre>{`bm = bmesh.new()

# Spine chain — +Z is up in Blender's default coordinate system
v_pelvis = bm.verts.new(Vector((0.0, 0.0, 0.00)))
v_chest  = bm.verts.new(Vector((0.0, 0.0, 0.60)))
v_head   = bm.verts.new(Vector((0.0, 0.0, 1.10)))

# Shoulder cross-bar diverges from the CHEST vertex, not the neck.
# Attaching at the neck creates a tight junction ring at the skull base.
v_sL = bm.verts.new(Vector((-0.35, 0.0, 0.62)))
v_sR = bm.verts.new(Vector(( 0.35, 0.0, 0.62)))

# Edges only — no faces
bm.edges.new((v_pelvis, v_chest))
bm.edges.new((v_chest,  v_head))
bm.edges.new((v_chest,  v_sL))
bm.edges.new((v_chest,  v_sR))`}</pre>

      <h2>BMesh skin vertex layer</h2>
      <p>
        The skin layer must be created or retrieved{" "}
        <em>while the BMesh is still live</em> — before calling{" "}
        <code>bm.to_mesh()</code>. Committing first drops custom layers.{" "}
        <code>bm.verts.layers.skin.verify()</code> returns the existing layer or
        creates it if absent. This mirrors the same pattern used when working
        with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
        >
          bmesh custom data layers in limited-dissolve and poke operations
        </Link>
        .
      </p>
      <pre>{`sl = bm.verts.layers.skin.verify()

# Each vertex slot (BMVertSkin) exposes three attributes:
#   .radius    = (float, float)  local-X and local-Y tube radii in metres
#   .use_root  = bool            marks the vertex as a root joint
#   .use_loose = bool            disconnects vertex from the tree (rarely used)

v_pelvis[sl].radius   = (0.22, 0.22)   # symmetric circular pelvis tube
v_pelvis[sl].use_root = True    # closes the bottom of the trunk — watertight

v_chest [sl].radius   = (0.25, 0.18)   # wider X, flatter Y = ribcage taper
v_head  [sl].radius   = (0.14, 0.14)
v_sL    [sl].radius   = (0.09, 0.09)
v_sR    [sl].radius   = (0.09, 0.09)

bm.to_mesh(mesh)
bm.free()
mesh.update()`}</pre>
      <p>
        At least one vertex per connected component must be marked{" "}
        <code>use_root=True</code>. Without a root,{" "}
        <code>SkinModifier</code> generates open end-caps at both extremities of
        each chain. WebXR back-face culling then reveals the interior through
        the seam — an invisible-until-rendered failure that{" "}
        <code>export_apply=True</code> does not catch.
      </p>

      <h2>Radius in local space</h2>
      <p>
        Radii are measured in <em>local</em> space before the object&rsquo;s
        scale matrix is applied. If the object is scaled to 2× in the
        viewport, world-space tube diameters double but the stored radius
        values do not change. Always apply transforms before exporting:
      </p>
      <pre>{`# Apply scale so world-space diameter = local radius × 2
# (scale of 1.0 means no difference; anything else shifts the GLB proportions)
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(scale=True)`}</pre>

      <h2>SkinModifier parameters</h2>
      <pre>{`skin_mod = obj.modifiers.new("Skin", "SKIN")

# branch_smoothing — blends the junction quad ring where branches meet.
# 0.0 = sharp bifurcation; 1.0 = fully blended.
# Values above 0.5 over-inflate the shoulder cross-section on this topology.
skin_mod.branch_smoothing = 0.4

# use_smooth_shade — flat-shading on generated quads keeps the cel-shade
# faceted look. True passes smooth per-vertex normals for a rounded appearance.
skin_mod.use_smooth_shade = False

# use_x_mirror — mirrors skin-vertex data across X=0 in Edit Mode (interactive).
# Has no effect in a headless script. Define both sides explicitly here.
skin_mod.use_x_mirror = False`}</pre>

      <h2>Modifier stack: Skin + Subsurf</h2>
      <p>
        Modifiers evaluate top-to-bottom in the Properties panel (first added
        = first evaluated). Adding SubsurfModifier after Skin means Subsurf
        operates on the skin&rsquo;s quad cage output — the correct order.
        Compare the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
        >
          SMOOTH_BY_ANGLE migration pattern
        </Link>{" "}
        for stacking normal modifiers after a Generate stage.
      </p>
      <pre>{`sub_mod = obj.modifiers.new("Subsurf", "SUBSURF")
sub_mod.levels           = 1   # levels=1 rounds junction artifacts; 2+ is high-res
sub_mod.render_levels    = 1   # keep in sync with viewport so preview matches export
sub_mod.subdivision_type = "CATMULL_CLARK"
# SIMPLE (interpolating, no rounding) is appropriate only when you plan to
# displace the subdivided surface without changing its silhouette.`}</pre>

      <h2>Export</h2>
      <p>
        <code>export_apply=True</code> collapses Skin + Subsurf into static
        closed-shell geometry. The underlying wire (verts + edges, no faces) is
        not written to the GLB — only the evaluated surface survives.
      </p>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath("//hf_skin_blockout.glb"),
    export_format = "GLB",
    use_selection = False,
    export_apply  = True,
    export_yup    = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)`}</pre>

      <h2>Failure modes</h2>
      <pre>{`# 1. No skin layer on the exported mesh — call bm.verts.layers.skin.verify()
#    BEFORE bm.to_mesh(). If to_mesh() runs first the layer is dropped and
#    SkinModifier falls back to a default radius (very thin tubes, often invisible).

# 2. Open end-caps visible in WebXR — no root vertex set.
#    Fix: v_pelvis[sl].use_root = True (or any one vertex per connected component).

# 3. Balloon junction at shoulders — branch_smoothing too high.
#    Fix: reduce branch_smoothing to 0.0–0.4 on bifurcating topology.

# 4. World-space proportions wrong after export — unapplied scale on the object.
#    Fix: bpy.ops.object.transform_apply(scale=True) before export_scene.gltf().

# 5. use_x_mirror has no effect in script — it only mirrors interactively
#    in Edit Mode. Always define both sides explicitly in Python.`}</pre>

      <h2>See also</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
          >
            SubsurfModifier — crease-controlled sub-d & GLB export
          </Link>{" "}
          — stacks on top of Skin to round junction artefacts; crease edges on
          the skin output are not typically present but the export-apply pattern
          is identical.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          >
            bmesh.ops.limited_dissolve + poke — faceted ornament
          </Link>{" "}
          — covers custom BMesh layer mechanics; the skin layer follows the same
          verify/assign/commit lifecycle as any other BMesh custom data.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
          >
            SMOOTH_BY_ANGLE modifier — auto-smooth migration
          </Link>{" "}
          — stack after Skin when you want flat-shaded facets on the generated
          quads with automatic angle-based normal splitting instead of
          hard-coding <code>use_smooth_shade=False</code>.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/skin.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Skin Modifier — Blender 5.1 Manual
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Canonical parameter reference
          including the interactive Ctrl+A root-mark shortcut, X-Mirror
          behaviour, and the relationship to armature generation; related
          project:{" "}
          <a
            className={lk}
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/CGArtPython/blender_plus_python"
            target="_blank"
            rel="noopener noreferrer"
          >
            CGArtPython/blender_plus_python
          </a>{" "}
          (MIT · Victor Stepanov). Practical bpy scripting patterns covering
          bmesh layer operations, modifier stacks, and headless export
          pipelines; related repository:{" "}
          <a
            className={lk}
            href="https://github.com/CGArtPython/bpy_building_blocks"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy_building_blocks
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr",
  title:
    "Python bpy.types.SkinModifier — Wire-to-Mesh via BMesh Skin Vertex Layer: Per-Vertex Radii, Root Joint & Character Blockout GLB for WebXR (Blender 5.1)",
  summary:
    "SkinModifier converts a mesh of vertices and edges (no faces) into a closed skin surface; per-vertex tube radii are stored in the BMesh skin vertex layer (bm.verts.layers.skin.verify()) as (rx, ry) local-space floats; at least one vertex per connected component must be marked use_root=True or SkinModifier generates open end-caps that break WebXR back-face culling; radius values are in local space — apply object scale before export to avoid world-space diameter drift; branch_smoothing blends the junction quad ring at bifurcations (0.0=sharp, 1.0=fully blended — keep ≤0.5 to avoid shoulder balloon artefacts); use_smooth_shade=False preserves flat-shaded faceted quads for cel-shade pipelines; use_x_mirror=True mirrors data interactively in Edit Mode but has no effect in headless Python — define both sides explicitly; stack SubsurfModifier above Skin at levels=1 to round junction artefacts without losing blockout character; export_apply=True collapses the full stack to a closed-shell quad-dominant GLB; the underlying wire (verts+edges) does not appear in the export; outside sources: Skin Modifier Blender 5.1 Manual CC-BY-SA-4.0 Blender Foundation; CGArtPython/blender_plus_python MIT Victor Stepanov.",
  tags: [
    "blender",
    "python",
    "scripting",
    "skin-modifier",
    "bmesh",
    "wire-to-mesh",
    "character-blockout",
    "modifier",
    "subsurf",
    "generate",
    "webxr",
    "glb",
    "vrm",
  ],
  topic: "scripting",
  date: "2026-07-18",
  body: Body,
});
