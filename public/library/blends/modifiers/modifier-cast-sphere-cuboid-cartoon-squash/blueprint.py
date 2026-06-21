"""
Cast Modifier — Cartoon Squash-and-Stretch (Blender 5.1)
=========================================================
TECHNIQUE: The Cast modifier morphs mesh vertices toward a sphere, cylinder,
or cuboid centroid.  Its `factor` property blends from the original shape
(0.0) to the fully cast target (1.0) and is directly keyframeable — no rig,
no shape keys, no driver setup required.

STACK ORDER: Simple Subdiv → Cast(CUBOID) → Cast(SPHERE)
  ① Simple Subdiv adds geometry density so Cast has enough verts to form
     smooth rounded corners.  SIMPLE subdivision (not Catmull-Clark) preserves
     original vertex positions, so Cast factor=1.0 targets exactly the
     original blob radius — Catmull-Clark would shrink vertices toward the
     limit surface, making the cast target slightly too small.
  ② Cast(CUBOID) squashes: morphs XY cross-section into a square footprint.
     use_z=False leaves the vertical axis to object-scale animation, enabling
     explicit volume compensation at the squash frame.
  ③ Cast(SPHERE) stretches: evaluated after the cuboid, it pulls surviving
     verts back toward a sphere.  factor > 1.0 is valid (up to 10.0) and
     creates overshoot — at STRETCH_FACTOR=1.8 the blob crown extends
     approximately 1.4× normal height, the classic cartoon teardrop.

WHY NOT SHAPE KEYS OR BONES?
  Shape key squash requires a sculpted target mesh and manual in-between keys.
  A stretch bone chain needs IK, Stretch-To constraints, weight painting, and
  a controller rig.  Cast adds two modifiers and four float keyframes — the
  correct trade for a single-object secondary-animation prop.
"""

import bpy
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
BLOB_RADIUS     = 0.45          # metres — character blob radius
BLOB_SEGMENTS   = 32            # UV sphere horizontal segments
BLOB_RINGS      = 24            # UV sphere vertical rings
SUBDIV_LEVELS   = 2             # Simple subdivision depth
CAST_RADIUS     = BLOB_RADIUS * 2.8   # Cast influence sphere — must enclose all verts
SQUASH_FACTOR   = 1.0           # CuboidCast factor at peak squash
STRETCH_FACTOR  = 1.8           # SphereCast factor at peak stretch (>1 = overshoot)
FRAME_START     = 1
FRAME_SQUASH    = 12            # maximum squash — impact frame
FRAME_RECOVER   = 22            # midpoint recovery
FRAME_STRETCH   = 30            # maximum stretch — apex frame
FRAME_REST      = 42            # back to natural shape
BLOB_COLOUR     = (0.18, 0.72, 0.42, 1.0)
EMIT_STRENGTH   = 0.35


# ── Helpers ───────────────────────────────────────────────────────────────────

def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def build_ground() -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, 0))
    gnd = bpy.context.active_object
    gnd.name = "HS_Ground"
    mat = bpy.data.materials.new("HS_GroundMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.10, 0.10, 0.12, 1.0)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value  = 0.90
    gnd.data.materials.append(mat)
    return gnd


def build_blob() -> bpy.types.Object:
    """
    UV sphere blob — more segments/rings → smoother cuboid-cast corners.
    32×24 is the minimum comfortable resolution; below 16×12 the cuboid
    cast shows visible faceting on the corner transitions.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=BLOB_RADIUS,
        segments=BLOB_SEGMENTS,
        ring_count=BLOB_RINGS,
        location=(0, 0, BLOB_RADIUS),
    )
    blob = bpy.context.active_object
    blob.name = "HS_CartoonBlob"
    bpy.ops.object.shade_smooth()
    return blob


def add_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("HS_BlobMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    mix  = nt.nodes.new('ShaderNodeMixShader')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    emit = nt.nodes.new('ShaderNodeEmission')
    bsdf.inputs["Base Color"].default_value  = BLOB_COLOUR
    bsdf.inputs["Roughness"].default_value   = 0.35
    emit.inputs["Color"].default_value       = BLOB_COLOUR
    emit.inputs["Strength"].default_value    = EMIT_STRENGTH
    mix.inputs["Fac"].default_value          = 0.15
    nt.links.new(bsdf.outputs["BSDF"],     mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],    out.inputs["Surface"])
    for i, n in enumerate([bsdf, emit, mix, out]):
        n.location = (i * 240 - 360, 0)
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def build_modifier_stack(blob: bpy.types.Object):
    """
    Returns (cub, sph) modifier references for keyframing.
    Stack position [0]=Subdiv, [1]=CastCuboid, [2]=CastSphere — order is
    critical.  CastCuboid sees the subdivided mesh; CastSphere sees the
    post-cuboid vertices and nudges them toward the sphere centroid.
    """
    # ① Simple Subdiv — preserves base-mesh vert positions for exact Cast target
    sd = blob.modifiers.new("Subdiv", type='SUBSURF')
    sd.subdivision_type = 'SIMPLE'
    sd.levels           = SUBDIV_LEVELS
    sd.render_levels    = SUBDIV_LEVELS

    # ② CastCuboid — squash: XY axes only, Z controlled via scale keyframes
    cub = blob.modifiers.new("CastCuboid", type='CAST')
    cub.cast_type          = 'CUBOID'
    cub.use_x              = True
    cub.use_y              = True
    cub.use_z              = False    # Z left to object.scale.z keyframes
    cub.radius             = CAST_RADIUS
    cub.factor             = 0.0
    cub.use_radius_as_size = False    # keep size=1.0; factor drives the blend

    # ③ CastSphere — stretch: Z axis overshoot for teardrop elongation
    sph = blob.modifiers.new("CastSphere", type='CAST')
    sph.cast_type          = 'SPHERE'
    sph.use_x              = False
    sph.use_y              = False
    sph.use_z              = True
    sph.radius             = CAST_RADIUS
    sph.factor             = 0.0
    sph.use_radius_as_size = False

    return cub, sph


def keyframe_animation(blob: bpy.types.Object,
                        cub: bpy.types.Modifier,
                        sph: bpy.types.Modifier) -> None:
    """
    Disney squash-and-stretch timing:
      Impact (frame 12): sharp squash — 2-frame hold
      Recovery (frame 22): ease out, slightly overshoots natural shape
      Stretch apex (frame 30): teardrop peaks, 2-frame hold
      Settle (frame 42): eases to rest

    Volume compensation via object scale:
      squash: scale (1.30, 1.30, 0.40) ≈ original volume (4/3π r³)
      stretch: scale (0.85, 0.85, 1.50) ≈ original volume
    """
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_REST + 8

    def mkf(mod, frame, value):
        mod.factor = value
        mod.keyframe_insert(data_path='factor', frame=frame)

    def skf(frame, sx, sy, sz):
        blob.scale = (sx, sy, sz)
        blob.keyframe_insert(data_path='scale', frame=frame)

    # CuboidCast factor
    for f, v in [(FRAME_START, 0.0), (FRAME_SQUASH, SQUASH_FACTOR),
                 (FRAME_RECOVER, 0.0), (FRAME_STRETCH, 0.0), (FRAME_REST, 0.0)]:
        mkf(cub, f, v)

    # SphereCast factor
    for f, v in [(FRAME_START, 0.0), (FRAME_SQUASH, 0.0),
                 (FRAME_RECOVER, 0.0), (FRAME_STRETCH, STRETCH_FACTOR), (FRAME_REST, 0.0)]:
        mkf(sph, f, v)

    # Object scale for volume compensation
    skf(FRAME_START,   1.00, 1.00, 1.00)
    skf(FRAME_SQUASH,  1.30, 1.30, 0.40)
    skf(FRAME_RECOVER, 1.00, 1.00, 1.00)
    skf(FRAME_STRETCH, 0.85, 0.85, 1.50)
    skf(FRAME_REST,    1.00, 1.00, 1.00)

    # Smooth Bezier handles on all F-Curves
    if blob.animation_data and blob.animation_data.action:
        for fc in blob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation    = 'BEZIER'
                kp.handle_left_type = 'AUTO_CLAMPED'
                kp.handle_right_type = 'AUTO_CLAMPED'


def export_glb(blob: bpy.types.Object, frame: int, suffix: str, blend_dir: str) -> None:
    """Apply-on-duplicate export pattern: never apply on the working object."""
    bpy.context.scene.frame_set(frame)
    bpy.ops.object.select_all(action='DESELECT')
    blob.select_set(True)
    bpy.context.view_layer.objects.active = blob
    bpy.ops.object.duplicate(linked=False)
    dup = bpy.context.active_object
    for mod in list(dup.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    path = os.path.join(blend_dir, f"cartoon_blob_{suffix}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path, use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    bpy.ops.object.delete()
    print(f"[HS] Exported: {path}")


def main() -> None:
    purge_scene()
    build_ground()
    blob = build_blob()
    add_material(blob)
    cub, sph = build_modifier_stack(blob)
    keyframe_animation(blob, cub, sph)

    # Lights
    bpy.ops.object.light_add(type='AREA', location=(1.5, -1.0, 2.5))
    bpy.context.active_object.data.energy = 250
    bpy.context.active_object.data.size   = 1.5
    bpy.ops.object.light_add(type='AREA', location=(-2.0, 0.5, 1.2))
    bpy.context.active_object.data.energy = 80
    bpy.context.active_object.data.size   = 2.0

    # Camera
    bpy.ops.object.camera_add(location=(0, -2.0, 1.1))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(74), 0, 0)
    bpy.context.scene.camera = cam

    # EEVEE Next
    sc = bpy.context.scene
    sc.render.engine         = 'BLENDER_EEVEE_NEXT'
    sc.eevee.bloom_threshold = 0.8
    sc.eevee.bloom_intensity = 0.25
    sc.render.resolution_x   = 1920
    sc.render.resolution_y   = 1080

    blend_dir = os.path.dirname(bpy.path.abspath("//cartoon_blob.blend"))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, "cartoon_blob.blend"))
    print(f"[HS] Saved: {os.path.join(blend_dir, 'cartoon_blob.blend')}")

    export_glb(blob, FRAME_SQUASH,  "squash",  blend_dir)
    export_glb(blob, FRAME_STRETCH, "stretch", blend_dir)


if __name__ == "__main__":
    main()
