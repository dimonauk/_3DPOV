"""
blueprint.py  ─  python-bmesh-extrude-scale-fractal-spikes
Blender 5.1 | CC0

Builds a fractal spike-ball via iterative bmesh.ops.extrude_discrete_faces.
Starting from an ICO sphere (level 2, 80 triangles), each pass takes the
tip caps left by the previous pass, extrudes them independently, translates
the new cap along its face normal, and scales the cap toward its own centre.

The spike length is derived from sqrt(face area) so sub-spikes shrink
proportionally without an explicit iteration-multiplier — self-similarity
emerges from the geometry rather than from a separate scale schedule.

Exports: fractal_spike_ball.blend + fractal_spike_ball.glb (Draco L6, WebP)
"""

import os
import math
import bpy
import bmesh

# ── parameters ────────────────────────────────────────────────────────────────
ICO_SUBDIVISIONS = 2       # level 2 → 80 triangles; level 3 → 320
ITERATIONS       = 4       # spike generations; 3 = sparse, 5 = very dense
EXTRUDE_FACTOR   = 0.90    # spike height = sqrt(face_area) × this constant
SCALE_FACTOR     = 0.58    # cap contracts toward its centre each iteration

COL_BASE  = (0.04, 0.04, 0.10, 1.0)   # deep-indigo metallic base
COL_TIP   = (0.55, 0.90, 1.00, 1.0)   # cold-cyan emission on tip caps
EMIT_STR  = 5.0

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(SCRIPT_DIR, "fractal_spike_ball.blend")
GLB_PATH   = os.path.join(SCRIPT_DIR, "fractal_spike_ball.glb")


# ── helpers ───────────────────────────────────────────────────────────────────
def _clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials,
                  bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            block.remove(item)


def _make_base_mat() -> "bpy.types.Material":
    mat = bpy.data.materials.new("SpikeBase")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = COL_BASE
        bsdf.inputs["Metallic"].default_value   = 0.85
        bsdf.inputs["Roughness"].default_value  = 0.10
    return mat


def _make_tip_mat() -> "bpy.types.Material":
    # pure emission: no BSDF path, maximises brightness regardless of lighting
    mat = bpy.data.materials.new("SpikeTip")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = COL_TIP
    emit.inputs["Strength"].default_value = EMIT_STR
    nt.links.new(emit.outputs[0], out.inputs[0])
    out.location, emit.location = (300, 0), (0, 0)
    return mat


def _setup_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location       = (0.0, -4.5, 0.0)
    cam_obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    scene.camera = cam_obj

    light_data        = bpy.data.lights.new("Key", type='AREA')
    light_data.energy = 800.0
    light_data.size   = 2.0
    light_obj         = bpy.data.objects.new("Key", light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location       = (3.0, -3.0, 4.0)
    light_obj.rotation_euler = (math.radians(55), 0.0, math.radians(45))


# ── core algorithm ────────────────────────────────────────────────────────────
def _grow_spikes(
    bm: "bmesh.types.BMesh",
    iterations: int,
) -> list:
    """
    Iteratively extrude tip caps to produce fractal spikes.
    Returns the final-iteration cap faces for material slot 1 tagging.
    """
    current_caps = list(bm.faces)

    for _iter in range(iterations):
        next_caps = []

        for face in current_caps:
            orig_normal  = face.normal.copy()

            # spike length from area: smaller caps → shorter sub-spikes,
            # maintaining self-similarity without a separate scale schedule.
            extrude_dist = math.sqrt(face.calc_area()) * EXTRUDE_FACTOR

            # discrete extrude: each face is lifted independently, leaving
            # open gaps between adjacent spike bases at the sphere surface.
            # extrude_face_region would instead bridge adjacent face edges
            # into a connected dome — wrong topology for spikes.
            result    = bmesh.ops.extrude_discrete_faces(bm, faces=[face])
            new_faces = result['faces']

            # the cap normal aligns with orig_normal (parallel lift);
            # side quad normals are perpendicular (dot ≈ 0).
            cap = max(new_faces, key=lambda f: f.normal.dot(orig_normal))

            # translate cap verts only — side quad base ring stays fixed,
            # which is correct: cap.verts ARE the tips of the side quads.
            bmesh.ops.translate(
                bm,
                vec=orig_normal * extrude_dist,
                verts=list(cap.verts),
            )

            # scale toward cap centre to produce the tapered tip.
            # bmesh.ops.scale accepts a 3×3 rotation/scale space, not a 4×4
            # pivot translation, so manual iteration is unambiguous.
            ctr = cap.calc_center_median()
            for v in cap.verts:
                v.co = ctr + (v.co - ctr) * SCALE_FACTOR

            next_caps.append(cap)

        bm.normal_update()
        current_caps = next_caps

    return current_caps


# ── main ──────────────────────────────────────────────────────────────────────
def run() -> None:
    _clear_scene()

    mesh = bpy.data.meshes.new("FractalSpikeBall")
    obj  = bpy.data.objects.new("fractal_spike_ball", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIVISIONS, radius=1.0)
    bm.normal_update()

    tip_caps = _grow_spikes(bm, ITERATIONS)

    # tag tip faces with material slot 1 before writing back to Blender mesh
    tip_set = set(tip_caps)
    for face in bm.faces:
        face.material_index = 1 if face in tip_set else 0

    bm.to_mesh(mesh)
    bm.free()

    # flat shading via data API; bpy.ops.object.shade_flat() requires context
    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()

    mesh.materials.append(_make_base_mat())  # slot 0: deep-indigo PBR
    mesh.materials.append(_make_tip_mat())   # slot 1: cyan emission tips

    # 2.5-second spin: 60 frames at 24 fps
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.radians(360))
    obj.keyframe_insert("rotation_euler", frame=61)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    _setup_scene()

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[holoflow] .blend → {BLEND_PATH}")

    # export via apply-on-duplicate to keep the source mesh live in .blend
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate(linked=False)
    dup = bpy.context.active_object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    bpy.data.objects.remove(dup, do_unlink=True)
    print(f"[holoflow] .glb  → {GLB_PATH}")
    print(f"[holoflow] mesh faces: {len(mesh.polygons)} "
          f"(ICO L{ICO_SUBDIVISIONS}, {ITERATIONS} iterations)")


run()
