import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>VertexWeightProximityModifier</code> belongs to Blender&rsquo;s{" "}
        <em>Modify</em> modifier category — it writes vertex-group weights
        derived from the distance between each vertex and the nearest point on a
        target object&rsquo;s surface. The important consequence is evaluation
        order:{" "}
        <strong>Modify resolves before Deform, which resolves before Physics</strong>
        . A Cloth modifier reading the same vertex group as its pin group
        therefore always sees fresh proximity weights, even when the target is
        animated. No cache invalidation, no bake dependency — the draping
        behaviour adapts every frame.
      </p>
      <p>
        This tutorial builds a VRM sash accessory against a body-proxy
        icosphere. Vertices flush with the sphere surface receive weight 1.0
        (pinned); vertices beyond <code>MAX_DIST</code> receive 0.0 (free to
        drape). The weights are also baked to a vertex-colour attribute for
        visual inspection in Vertex Paint mode. A static snapshot is exported as
        a Draco-compressed GLB for WebXR review.
      </p>

      <h2>Modifier setup</h2>
      <pre>{`# The vertex group must exist before the modifier references it
sash.vertex_groups.new(name="prox_pin")

mod = sash.modifiers.new("VWProx", "VERTEX_WEIGHT_PROXIMITY")
mod.vertex_group       = "prox_pin"
mod.target             = body_sphere

# proximity_mode: GEOMETRY samples distance to nearest surface point.
# OBJECT samples distance to the target's ORIGIN — correct for emitters,
# wrong for a body mesh (origin is rarely at the surface).
mod.proximity_mode     = "GEOMETRY"

# proximity_geometry: {'FACE'} tests against face planes.
# Add 'EDGE' or 'VERTEX' for open meshes that have boundary loops.
# On a closed icosphere FACE is the most accurate option.
mod.proximity_geometry = {"FACE"}

# min_dist → weight 1.0  (flush with body = pinned)
# max_dist → weight 0.0  (free-edge threshold)
# Both values are world-space distances AFTER applying object transforms.
mod.min_dist           = 0.0
mod.max_dist           = 0.22

# SMOOTH = C¹ Hermite S-curve between min_dist and max_dist.
# LINEAR = uniform ramp. SHARP = concave / fast onset. ROOT = convex / slow tail.
mod.falloff_type       = "SMOOTH"
mod.invert_falloff     = False   # True: near body = free, far body = pinned
mod.normalize          = True    # re-normalise so heaviest vertex = 1.0`}</pre>

      <h2>Cloth pin group</h2>
      <p>
        <code>ClothModifier.settings.vertex_group_mass</code> is the pin group.
        When <code>use_pin_cloth = True</code>, vertices with high weights are
        treated as static attachment points while low-weight vertices respond to
        gravity and forces. Setting <code>pin_stiffness = 1.0</code> makes the
        constraint rigid; lower values allow the pinned region to stretch
        slightly, useful for elastic waistbands.
      </p>
      <pre>{`cloth = sash.modifiers.new("Cloth", "CLOTH")
s = cloth.settings
s.quality               = 5       # substeps; raise to 10+ for fast-moving props
s.mass                  = 0.30    # kg/m² — light silk weight
s.tension_stiffness     = 15.0
s.bending_stiffness     = 0.5     # low = natural drape
s.use_pin_cloth         = True
s.vertex_group_mass     = "prox_pin"   # same group the proximity modifier writes
s.pin_stiffness         = 1.0`}</pre>

      <h2>Dynamic pinning</h2>
      <p>
        Because the proximity modifier re-evaluates every frame, scaling or
        translating the body proxy at keyframe N changes the weight distribution
        at that frame. Enlarge the sphere and more vertices fall within{" "}
        <code>max_dist</code> — the pinned region grows. Shrink it and the
        sash begins to fall away from the surface. This is the mechanism behind
        cloth detachment sequences in character cut-scenes: no weight-paint
        keyframing needed, only a simple sphere scale animation.
      </p>
      <pre>{`# Animate the body proxy: frame 1 = tight fit, frame 50 = detached
body.keyframe_insert("scale", frame=1)
body.scale = (1.4, 1.4, 1.4)
body.keyframe_insert("scale", frame=50)
# At frame 50, max_dist is still 0.22 m world-space —
# but the sphere is 40% larger, so fewer sash vertices are within that distance.
# The cloth pin group shrinks → drape region grows.`}</pre>

      <h2>Secondary masking</h2>
      <p>
        <code>mask_vertex_group</code> applies a secondary multiplier:{" "}
        <code>final_weight = proximity_weight × mask_weight</code>. Paint a
        collar region at weight 1.0 and leave shoulder geometry at 0.0 to
        restrict pinning without altering the proximity geometry. Combine with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
        >
          VRM deformation envelope weight painting
        </Link>{" "}
        for per-region physics control.
      </p>
      <pre>{`mod.mask_vertex_group = "collar_only"   # painted manually
# Only the collar region participates in proximity pinning;
# the shoulder geometry is always free regardless of proximity.`}</pre>

      <h2>Reading weights back via depsgraph</h2>
      <p>
        The modifier writes weights to <code>bpy.data</code> lazily — they are
        only computed on the <em>evaluated</em> mesh. To read them in Python,
        use the depsgraph, which mirrors the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr"
        >
          same pattern used for hook-modifier vertex inspection
        </Link>
        .
      </p>
      <pre>{`dg      = bpy.context.evaluated_depsgraph_get()
ob_eval = sash.evaluated_get(dg)
me_eval = ob_eval.data

vg_idx  = ob_eval.vertex_groups["prox_pin"].index
weights = [0.0] * len(me_eval.vertices)
for v in me_eval.vertices:
    for g in v.groups:
        if g.group == vg_idx:
            weights[v.index] = g.weight
            break

# weights[i] = proximity-derived float in [0.0, 1.0]
print(min(weights), max(weights))   # sanity check: expect 0.0 and 1.0`}</pre>

      <h2>Vertex-colour debugging</h2>
      <p>
        Baking weights to a colour attribute makes the gradient immediately
        visible in Viewport Shading &rsaquo; Vertex. This is far faster than
        inspecting numerical weight values per vertex. Green = low weight (free),
        red = high weight (pinned) — a convention borrowed from heat-map
        visualisations in animation tools.
      </p>
      <pre>{`# Requires bpy.context.view_layer.update() first so proximity weights are current
attr = sash.data.color_attributes.new(
    name="debug_prox", type="FLOAT_COLOR", domain="CORNER"
)
for loop in sash.data.loops:
    w = weights[loop.vertex_index]
    attr.data[loop.index].color = (w, 1.0 - w, 0.3, 1.0)`}</pre>

      <h2>Export</h2>
      <p>
        The proximity modifier and cloth modifiers are both collapsed by{" "}
        <code>export_apply=True</code> at GLB export time, consistent with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr"
        >
          the Shrinkwrap &amp; surface-conform export pattern
        </Link>
        . For a post-simulation snapshot, run{" "}
        <code>bpy.ops.ptcache.bake_all(bake=True)</code> in the Script Editor
        before exporting, then set <code>bpy.context.scene.frame_set(N)</code>{" "}
        to the desired frame.
      </p>
      <pre>{`# Export static snapshot (pre-sim or post-bake at current frame)
bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath("//hf_vwprox_sash.glb"),
    export_format = "GLB",
    use_selection = False,
    export_apply  = True,
    export_yup    = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)`}</pre>

      <h2>Failure modes</h2>
      <pre>{`# 1. All weights are 0.0 — proximity_mode = 'OBJECT', target origin is at 0,0,0
#    but body sphere has non-applied scale → world-space distance is wrong.
#    Fix: apply transforms on the body proxy (Ctrl+A → All Transforms).

# 2. Cloth ignores the pin group — use_pin_cloth = False (default).
#    Always set it explicitly: cloth.settings.use_pin_cloth = True

# 3. proximity_geometry = {'VERTEX'} on a low-poly sphere → blocky weight bands
#    between vertex rows. Switch to {'FACE'} for smooth gradient.

# 4. Weights look correct in viewport but cloth sim ignores them → modifier
#    order wrong. VWProx must appear ABOVE Cloth in the modifier stack.
#    Move it: sash.modifiers.move(src_index, dst_index) — use the order
#    [VWProx, Cloth] top-to-bottom.`}</pre>

      <h2>See also</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr"
          >
            Solidify modifier shell &amp; rim cap
          </Link>{" "}
          — another Modify-category modifier that writes geometry data before
          physics resolves; same stack-order principle applies.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/modify/vertex_weight_proximity.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vertex Weight Proximity — Blender 5.1 Manual
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Canonical parameter reference
          and UI description; related project:{" "}
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
            href="https://github.com/njanakiev/blender-python-examples"
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-python-examples
          </a>{" "}
          (MIT · Nikolai Janakiev). Practical bpy scripting patterns including
          depsgraph evaluated-mesh reads and vertex-group iteration; related
          repo:{" "}
          <a
            className={lk}
            href="https://github.com/njanakiev/blender-scripts"
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripts
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm",
  title:
    "Python bpy.types.VertexWeightProximityModifier — Distance-Driven Weight Mask: Cloth Pin Group & Dynamic Drape for VRM (Blender 5.1)",
  summary:
    "VertexWeightProximityModifier is a Modify-category modifier that writes vertex group weights from distance to a target object's surface, resolving before physics so cloth pin groups stay live as the target animates. proximity_mode GEOMETRY samples the nearest face point (accurate for body meshes); proximity_geometry {'FACE'} gives the smoothest gradient on closed surfaces; min_dist/max_dist are world-space clamps; falloff_type controls the mapping curve between them. Covers secondary masking via mask_vertex_group, reading evaluated weights from the depsgraph, baking to vertex-colour for visual debugging, dynamic cloth detachment via animated target scale, and GLB export with export_apply=True.",
  tags: [
    "blender",
    "python",
    "scripting",
    "vertex-weight",
    "proximity",
    "cloth",
    "physics",
    "pin-group",
    "vertex-group",
    "vrm",
    "modifier",
    "webxr",
    "glb",
    "depsgraph",
  ],
  topic: "scripting",
  date: "2026-07-18",
  body: Body,
});
