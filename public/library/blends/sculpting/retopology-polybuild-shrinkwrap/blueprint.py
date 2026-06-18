"""
Retopology — Poly Build + Shrinkwrap: Manual Quad Retopology Workflow
=====================================================================
Blender 5.1 | CC0 | Holoflow Studio

Technique:
  The Poly Build tool lets you draw quads directly on top of a dense sculpt.
  Every vertex snaps to the sculpt surface via a live Shrinkwrap modifier —
  so the retopo mesh never drifts away from the reference. A Mirror modifier
  (below Shrinkwrap in the stack) keeps the X-symmetrical half in sync without
  manual work.

This script builds the scaffold:
  1. Dense UV sphere + Clouds displacement → sculpt reference
  2. Coarse UV sphere + Mirror + Shrinkwrap → retopo target
  3. Materials, camera, three-point lighting
  4. Saves to retopo_mesh.blend

Run from the Blender Scripting workspace.  Then switch to Edit Mode on the
retopo mesh, open the T-panel, and use Poly Build to replace the coarse
sphere quads with anatomy-driven edge loops.
"""

import bpy
import math

# ── Named constants ──────────────────────────────────────────────────────────
SCULPT_NAME       = "sculpt_ref"
RETOPO_NAME       = "retopo_mesh"
SCULPT_SEGMENTS   = 96          # dense reference: ~9 k faces
SCULPT_RINGS      = 48
RETOPO_SEGMENTS   = 12          # game-res retopo: ~96 faces
RETOPO_RINGS      = 8
NOISE_SCALE       = 1.4         # Clouds texture frequency
NOISE_STRENGTH    = 0.16        # displacement depth (m)
SCULPT_RADIUS     = 1.0         # metres
RETOPO_OFFSET     = 1.05        # start retopo sphere slightly outside sculpt
SHRINKWRAP_OFFSET = 0.001       # ε to prevent Z-fighting at the surface
OUTPUT_PATH       = "//retopo_mesh.blend"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_sculpt_reference() -> bpy.types.Object:
    """
    Simulate an organic sculpt: dense UV sphere displaced by a Clouds texture.

    WHY apply the Displace modifier here:
      Shrinkwrap reads *vertex positions* from the target object's evaluated
      mesh.  If we leave Displace as a live modifier, Blender evaluates it per
      frame — which works for the Shrinkwrap at frame 0 but is fragile when
      the Displace texture has an animation offset.  Applying bakes the final
      positions so Shrinkwrap always gets a stable surface.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SCULPT_SEGMENTS,
        ring_count=SCULPT_RINGS,
        radius=SCULPT_RADIUS,
    )
    sculpt = bpy.context.active_object
    sculpt.name = SCULPT_NAME

    tex             = bpy.data.textures.new("sculpt_noise", type="CLOUDS")
    tex.noise_scale = NOISE_SCALE
    tex.noise_depth = 2

    disp                  = sculpt.modifiers.new("Displace", "DISPLACE")
    disp.texture          = tex
    disp.strength         = NOISE_STRENGTH
    disp.texture_coords   = "OBJECT"   # object-space: no UV dependency

    with bpy.context.temp_override(object=sculpt):
        bpy.ops.object.modifier_apply(modifier="Displace")

    bpy.ops.object.shade_smooth()

    # Semi-transparent orange: simulates the tinted X-Ray reference look
    mat             = bpy.data.materials.new("sculpt_ref_mat")
    mat.use_nodes   = True
    mat.blend_method = "BLEND"
    bsdf            = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.85, 0.45, 0.1, 1.0)
    bsdf.inputs["Alpha"].default_value      = 0.25
    sculpt.data.materials.append(mat)

    # Draw on top so the retopo mesh is visible through the sculpt
    sculpt.show_in_front = True

    return sculpt


def make_retopo_mesh(sculpt_obj: bpy.types.Object) -> bpy.types.Object:
    """
    Retopology target: coarse UV sphere with Mirror then Shrinkwrap.

    Modifier stack order (index 0 = top = applied first):
      [0] Mirror     — creates the X-symmetric half before projection fires
      [1] Shrinkwrap — projects ALL vertices (both halves) onto the sculpt

    WHY Mirror above Shrinkwrap:
      Each vertex in the mirrored half already sits on the correct side of
      the sculpt before Shrinkwrap fires.  If Shrinkwrap came first, it would
      project the half-mesh, then Mirror would copy already-projected verts to
      the wrong side, potentially clipping through the sculpt on the far half.

    Shrinkwrap wrap_method = PROJECT:
      Fires a ray from each vertex along its surface normal.  Both positive and
      negative directions enabled so the retopo mesh can start either inside or
      outside the sculpt and still snap correctly.  NEAREST_SURFACEPOINT would
      also work but can produce incorrect snapping at concave areas (e.g. eye
      socket) where "nearest" is geometrically ambiguous.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=RETOPO_SEGMENTS,
        ring_count=RETOPO_RINGS,
        radius=SCULPT_RADIUS * RETOPO_OFFSET,
    )
    retopo      = bpy.context.active_object
    retopo.name = RETOPO_NAME

    # Mirror ── index 0 ── fires first
    mirror                       = retopo.modifiers.new("Mirror", "MIRROR")
    mirror.use_axis[0]           = True
    mirror.use_bisect_axis[0]    = True   # prevents verts crossing X = 0
    mirror.use_clip              = True   # welds centre-line verts
    mirror.merge_threshold       = 0.001

    # Shrinkwrap ── index 1 ── fires after Mirror
    sw                           = retopo.modifiers.new("Shrinkwrap", "SHRINKWRAP")
    sw.target                    = sculpt_obj
    sw.wrap_method               = "PROJECT"
    sw.use_project_z             = True
    sw.use_negative_direction    = True
    sw.use_positive_direction    = True
    sw.offset                    = SHRINKWRAP_OFFSET

    # Pale blue solid: visually distinct from the orange reference
    mat_r                         = bpy.data.materials.new("retopo_mat")
    mat_r.use_nodes               = True
    bsdf_r                        = mat_r.node_tree.nodes["Principled BSDF"]
    bsdf_r.inputs["Base Color"].default_value = (0.65, 0.85, 1.0, 1.0)
    bsdf_r.inputs["Roughness"].default_value  = 0.9
    retopo.data.materials.append(mat_r)

    return retopo


def setup_lighting() -> None:
    bpy.ops.object.light_add(type="AREA", location=(2.5, -2.0, 3.5))
    key                  = bpy.context.active_object
    key.name             = "Key"
    key.data.energy      = 250
    key.data.color       = (1.0, 0.95, 0.85)
    key.data.size        = 1.5
    key.rotation_euler   = (math.radians(55), 0.0, math.radians(35))

    bpy.ops.object.light_add(type="AREA", location=(-2.0, -1.5, 1.5))
    fill                 = bpy.context.active_object
    fill.name            = "Fill"
    fill.data.energy     = 80
    fill.data.color      = (0.8, 0.9, 1.0)
    fill.data.size       = 2.5
    fill.rotation_euler  = (math.radians(60), 0.0, math.radians(-45))

    bpy.ops.object.light_add(type="SPOT", location=(-1.0, 2.5, 2.0))
    rim                  = bpy.context.active_object
    rim.name             = "Rim"
    rim.data.energy      = 120
    rim.data.color       = (0.9, 0.95, 1.0)
    rim.rotation_euler   = (math.radians(-45), 0.0, math.radians(-160))


def setup_camera() -> None:
    bpy.ops.object.camera_add(location=(0.0, -4.5, 0.5))
    cam                        = bpy.context.active_object
    cam.name                   = "Camera"
    cam.rotation_euler         = (math.radians(88), 0.0, 0.0)
    bpy.context.scene.camera   = cam


def setup_render() -> None:
    scene                            = bpy.context.scene
    scene.render.engine              = "CYCLES"
    scene.cycles.samples             = 64
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.film_transparent    = True


def main() -> None:
    clear_scene()
    sculpt = make_sculpt_reference()
    retopo = make_retopo_mesh(sculpt)
    setup_lighting()
    setup_camera()
    setup_render()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_PATH))

    print(f"[HF] Retopology scaffold saved → {OUTPUT_PATH}")
    print(f"[HF]   sculpt_ref : {len(sculpt.data.vertices):>6} verts "
          f"({len(sculpt.data.polygons)} faces)")
    print(f"[HF]   retopo_mesh: {len(retopo.data.vertices):>6} verts "
          f"({len(retopo.data.polygons)} faces)")
    print()
    print("[HF] Next steps:")
    print("  1. Select retopo_mesh → Edit Mode (Tab)")
    print("  2. T-panel → Poly Build tool")
    print("  3. Enable Snap → Face (header snap icon)")
    print("  4. Draw edge loops following the sculpt surface contours")
    print("  5. Shrinkwrap snaps each vertex to sculpt_ref automatically")
    print("  6. When done: apply Mirror first, then Shrinkwrap")


main()
