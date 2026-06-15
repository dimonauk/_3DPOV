import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SculptMultiresNormalBakeBody() {
  return (
    <>
      <p>
        The Multiresolution modifier is Blender&rsquo;s answer to ZBrush&rsquo;s
        subdivision levels: it stores sculpt-position deltas <em>per level</em>
        inside the modifier, leaving the original quad cage intact at
        level&nbsp;0. That base mesh ships in the GLB; a baked tangent-space
        normal map carries the high-frequency surface story without sending
        twenty-four thousand triangles through the exporter.
      </p>
      <p className="mt-3">
        This pipeline connects directly to the{" "}
        <Link href="/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh" className={lk}>
          Dyntopo + Voxel Remesh tutorial
        </Link>{" "}
        (the destructive alternative — choose Multires when you need a clean
        GLB), the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          texture baking tutorial
        </Link>{" "}
        (same Cycles bake operator, deeper pass and AO coverage), and the{" "}
        <Link href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised" className={lk}>
          low-poly UV unwrap tutorial
        </Link>{" "}
        (the Smart UV Project conventions used here). For displacement-driven
        surface detail without sculpting, see the{" "}
        <Link href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision" className={lk}>
          Cycles adaptive subdivision tutorial
        </Link>
        ; for edge-cavity shading that pairs well with a baked normal, see{" "}
        <Link href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight" className={lk}>
          AO + Pointiness edge highlight
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Multires vs Dyntopo — topology preservation
      </h2>
      <p>
        Dyntopo splits or collapses edges under the sculpt brush, producing a
        triangulated mesh with no predictable topology. Multires keeps the
        original quad cage at level&nbsp;0 and stores sculpt offsets at each
        higher level as independent delta arrays. The result: Shape Keys work on
        the base cage and propagate through the subdivision math; the GLB export
        targets level&nbsp;0; the baked normal carries the rest.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Level arithmetic for a 12×8 UV sphere (96 quads at level 0):
# Level 0:  96 quads   → export target (the GLB mesh)
# Level 1:  384 quads  → first rounding
# Level 2:  1536 quads → smooth silhouette in EEVEE viewport
# Level 3:  6144 quads → diffuse shading shows detail
# Level 4:  24576 quads → high-frequency micro-surface, bake source
#
# mr.levels        — viewport display level
# mr.sculpt_levels — active level in Sculpt Mode
# mr.render_levels — level at final render
#
# Subdivide via operator (Blender 5.x requires temp_override):
mr = obj.modifiers.new("Multires", type="MULTIRES")
for _ in range(4):
    with bpy.context.temp_override(object=obj):
        bpy.ops.object.multires_subdivide(modifier="Multires", mode="CATMULL_CLARK")`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Programmatic shape transfer with <code>multires_reshape</code>
      </h2>
      <p>
        Sculpt brush operators need a GPU display context and cannot run
        headlessly. The scriptable alternative: apply the Multires on a
        duplicate to materialise the level-4 geometry, add a Displace modifier
        with a Clouds texture, apply it, then transfer that displaced shape back
        into the original object&rsquo;s Multires data.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# multires_reshape copies vertex positions from selected (non-active) mesh
# onto the active object's Multires at sculpt_levels.
# CRITICAL: source must have the same vertex count as the Multires at that level.
# Guaranteed here — the high-poly was derived by applying Multires on a duplicate,
# then only a Displace modifier was added (Displace preserves topology).

bpy.ops.object.select_all(action="DESELECT")
high_obj.select_set(True)          # source shape
low_obj.select_set(True)
bpy.context.view_layer.objects.active = low_obj   # active = Multires target
with bpy.context.temp_override(
    object=low_obj,
    selected_objects=[high_obj, low_obj],
    selected_editable_objects=[high_obj, low_obj],
):
    bpy.ops.object.multires_reshape(modifier="Multires")
bpy.data.objects.remove(high_obj, do_unlink=True)  # discard temp`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Baking from Multires + GLB tangent export
      </h2>
      <p>
        Blender 5.1 has a dedicated Multires bake path. Set{" "}
        <code>scene.render.bake.use_multires_baking = True</code>, set{" "}
        <code>mr.sculpt_levels = 4</code> (source) and{" "}
        <code>mr.levels = 0</code> (destination), then call{" "}
        <code>bpy.ops.object.bake(type=&quot;NORMAL&quot;)</code>. No
        Selected-to-Active setup needed &mdash; the comparison happens within
        the same object&rsquo;s modifier. For GLB, always export with{" "}
        <code>export_tangents=True</code>: without tangent vectors, WebXR
        renderers silently fall back to geometric normals and the bake
        appears invisible.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Bake target: the active (unconnected) Image Texture node in the material
mat.node_tree.nodes.active = img_node
mr.sculpt_levels = 4   # bake SOURCE
mr.levels        = 0   # bake DESTINATION (the level-0 quad cage)

bk = scene.render.bake
bk.use_multires_baking    = True     # Multires-aware bake — no selected_to_active
bk.use_selected_to_active = False
bk.normal_space           = "TANGENT"
bpy.ops.object.bake(type="NORMAL")

# GLB export — export_tangents=True is the critical flag
bpy.ops.export_scene.gltf(
    filepath          = glb_path,
    export_apply      = True,         # materialises level 0 quad mesh
    export_tangents   = True,         # mandatory for tangent-space normal maps
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>Bake is solid blue — no detail.</strong> Confirm{" "}
          <code>mr.sculpt_levels = 4</code> and <code>mr.levels = 0</code>{" "}
          before calling <code>bpy.ops.object.bake()</code>. If either is wrong
          the delta is zero and the result is flat.
        </li>
        <li>
          <strong>GLB shows flat shading in browser viewer.</strong> Re-export
          with <code>export_tangents=True</code>. Confirm the Normal Map node is
          connected to the BSDF Normal input with{" "}
          <code>nmap_node.space = &quot;TANGENT&quot;</code>.
        </li>
        <li>
          <strong>
            <code>multires_reshape</code> fails: vertex count mismatch.
          </strong>{" "}
          The high-poly mesh topology has diverged from the Multires level. Only
          use Displace (not Remesh, Decimate, or Dyntopo) on the duplicate.
        </li>
        <li>
          <strong>
            <code>use_multires_baking</code> AttributeError.
          </strong>{" "}
          Fall back to Selected-to-Active bake: set{" "}
          <code>bk.use_selected_to_active = True</code>, cage extrusion 0.05,
          high-poly = duplicate with Multires applied + Displace applied.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/multiresolution.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Blender Manual &mdash; Multiresolution Modifier
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Level controls,
          Reshape operator, Shape Keys interaction, bake panel. Related:{" "}
          <a href="https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_reshape"
            className={lk} target="_blank" rel="noopener noreferrer">
            multires_reshape Python API
          </a>{" "}
          and{" "}
          <a href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tool_settings/dyntopo.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Dyntopo reference
          </a>
          .
        </li>
        <li>
          <a href="https://docs.blender.org/manual/en/latest/render/cycles/baking.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Blender Manual &mdash; Cycles Baking
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Normal bake
          settings, Multires bake flag, tangent-space vs object-space. Related:{" "}
          <a href="https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            glTF 2.0 exporter
          </a>{" "}
          (<code>export_tangents</code>, Draco compression).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/sculpting/sculpt-multires-normal-bake-lowpoly-glb",
    time: "forty-five minutes to one hour",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "Properties ▸ Modifier — Multiresolution panel",
        "Properties ▸ Render ▸ Bake — Multires bake flag",
        "Shader Editor — Image Texture node (bake target) + Normal Map node",
        "UV Editing workspace — Smart UV Project",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. The Info bar shows Cycles bake progress (16 samples, 20–60 s on CPU). When complete, talisman_low appears at Multires level 2.",
      },
      {
        title: "Inspect Multires levels",
        body: "Select talisman_low. Properties → Modifier → Multires. Scrub Viewport level 0→4. Face count steps: 96 → 384 → 1536 → 6144 → 24576. Set back to 2 for viewport comfort.",
      },
      {
        title: "Inspect the UV map at level 0",
        body: "UV Editing workspace. The Smart UV Project islands are the level-0 layout baked against. Multires does not re-project UVs at higher levels; they propagate through the subdivision math from level 0.",
      },
      {
        title: "Inspect the baked normal map",
        body: "Shader Editor → click the Image Texture node (talisman_normal). Dominant colour is (0.5, 0.5, 1.0) blue — surface normal equals mesh normal, no deviation. Bumped regions shift R and G away from 0.5.",
      },
      {
        title: "Compare level 0 vs level 4 in EEVEE",
        body: "Set Viewport to 0 → Material Preview. The baked normal gives a sculpted impression on 96 quad faces. Set Viewport to 4: now the geometry itself is high-resolution, and the normal map adds micro-surface on top.",
      },
      {
        title: "Add live sculpt detail",
        body: "Set Multires Sculpt level to 4. Switch to Sculpt Mode. Use the Draw brush to add new detail strokes — these modify level-4 sculpt data directly inside the modifier without altering level 0.",
      },
      {
        title: "Re-bake after sculpting",
        body: "Object Mode. Render Properties → Bake → confirm Bake From Multires is ticked, Viewport = 0. Click Bake (Normals). The talisman_normal image updates to include the new brush strokes.",
      },
      {
        title: "Run record.py",
        body: "Scripting workspace → open record.py → Run Script. Renders 150-frame animation to public/library/videos/sculpting/sculpt-multires-normal-bake-lowpoly-glb/viewport.mp4: frames 1–60 show the level ramp 0→4, frames 60–150 show a 360° rotation at full level.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Bake result is solid blue — no surface variation",
        cause:
          "mr.sculpt_levels not set to the highest level, or mr.levels not set to 0 before baking.",
        fix: "Modifier panel: Sculpt = 4, Viewport = 0. Then Render → Bake → Normals. The delta is computed between these two levels.",
      },
      {
        symptom: "GLB shows flat shading in browser viewer",
        cause:
          "Tangent vectors not exported; the viewer falls back to geometric normals.",
        fix: "Re-export with export_tangents=True. Confirm Normal Map node is connected to BSDF Normal input with space='TANGENT'.",
      },
      {
        symptom: "multires_reshape fails: vertex count mismatch",
        cause:
          "The high-poly mesh was remeshed or decimated after applying Multires, changing its vertex count.",
        fix: "Only use Displace on the duplicate. Never Remesh, Decimate, or Dyntopo — these change topology and break the reshape match.",
      },
    ],
    finalResult:
      "A low-poly UV sphere (96 quad faces at level 0) with a Multires modifier holding 24576-face sculpt data at level 4, a 1024×1024 baked tangent-space normal map, and a GLB export of the level-0 mesh + normal map at ~60 KB with Draco 6 + WebP textures. A 150-frame viewport animation demonstrates the level ramp 0→4 and a 360° rotation.",
  },
  {
    slug: "blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb",
    title:
      "Multires Modifier — Subdivision-Level Sculpting, Normal Bake, GLB Low-Poly Export (Blender 5.1)",
    date: "2026-06-15",
    kind: "tutorial",
    excerpt:
      "The Multiresolution modifier pipeline for Blender 5.1: build a low-poly base, subdivide to 24576 faces at level 4, transfer sculpted detail via multires_reshape, bake a tangent-space normal map using the Cycles Multires bake path, and export GLB at level 0 — the quad cage carrying the full sculpted impression at ~60 KB.",
    Body: SculptMultiresNormalBakeBody,
  },
);
