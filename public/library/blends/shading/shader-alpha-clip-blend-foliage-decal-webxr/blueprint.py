"""
Shader — Alpha Clip vs Alpha Blend: Foliage Planes, Decals & Transparent Shadow
blueprint.py  ·  Blender 5.1  ·  Holoflow Studio  ·  CC0

Technique overview
──────────────────
Two alpha modes cover nearly every real-time transparency use-case:

  CLIP  (alphaMode: MASK in glTF)
    Binary cutout.  No sorting required, no blending cost.  Shadow via
    EEVEE shadow_method='CLIP'.  mat.alpha_threshold → alphaCutoff in glTF.

  BLEND (alphaMode: BLEND in glTF)
    Full semi-transparency via painter's algorithm.  Sorting artefacts are
    common for overlapping geometry.  mat.shadow_method='NONE' disables
    the shadow entirely (typical for hologram planes).

  HASHED (EEVEE stochastic)
    Exports as BLEND to glTF — no equivalent alphaMode.  Never design for
    HASHED if WebXR delivery is the goal.

Cycles transparent shadows
    Route shadow rays through Transparent BSDF:
    Mix Shader(Fac=Light Path.Is Shadow Ray, A=PBSDF, B=Transparent BSDF)
    Not needed in EEVEE (shadow_method covers it) and not exported to glTF.

Double-sided: mat.use_backface_culling=False  →  material.doubleSided=true

Props built
    1. leaf_cluster — three crossed quads, procedural leaf alpha, CLIP
    2. holo_decal   — single quad, radial gradient glow + emission, BLEND
    3. floor        — matte catcher to display shadow contrast
"""

import bpy
import bmesh
import math

OUTPUT_GLB          = "//foliage_decal_alpha.glb"
CLIP_MAT_NAME       = "hs_leaf_clip"
BLEND_MAT_NAME      = "hs_holo_blend"
CLIP_THRESHOLD      = 0.42       # → alphaCutoff in glTF MASK
LEAF_COLOR          = (0.18, 0.55, 0.14, 1.0)
HOLO_BASE_COLOR     = (0.10, 0.40, 0.85, 1.0)
HOLO_EMISSION_COLOR = (0.25, 0.75, 1.00, 1.0)
HOLO_EMISSION_STR   = 1.8        # SDR-safe glow


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials,
                bpy.data.cameras, bpy.data.lights):
        for item in list(blk):
            blk.remove(item, do_unlink=True)


def make_plane(name: str, size: float = 1.0) -> bpy.types.Object:
    """Flat-shaded quad plane with UVMap."""
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bm   = bmesh.new()
    h    = size * 0.5
    v    = [bm.verts.new(p) for p in [(-h,-h,0),(h,-h,0),(h,h,0),(-h,h,0)]]
    bm.faces.new(v)
    uv = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop, coord in zip(face.loops, [(0,0),(1,0),(1,1),(0,1)]):
            loop[uv].uv = coord
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = False
    return obj


def build_leaf_clip_material() -> bpy.types.Material:
    """
    Procedural leaf-shape via Object-space Spherical gradient (body oval)
    multiplied by Noise-texture ramp (serrated edge serration).

    blend_method='CLIP'      → alphaMode: MASK
    alpha_threshold=0.42     → alphaCutoff: 0.42
    shadow_method='CLIP'     → EEVEE casts alpha-clipped shadow
    use_backface_culling=F   → doubleSided: true
    """
    mat = bpy.data.materials.new(CLIP_MAT_NAME)
    mat.use_nodes         = True
    mat.blend_method      = "CLIP"
    mat.alpha_threshold   = CLIP_THRESHOLD
    mat.shadow_method     = "CLIP"
    mat.use_backface_culling = False

    N, L = mat.node_tree.nodes, mat.node_tree.links
    N.clear()

    out = N.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    pb  = N.new("ShaderNodeBsdfPrincipled"); pb.location  = (500, 0)
    pb.inputs["Base Color"].default_value = LEAF_COLOR
    pb.inputs["Roughness"].default_value  = 0.75
    pb.inputs["Metallic"].default_value   = 0.0

    tc  = N.new("ShaderNodeTexCoord");  tc.location  = (-700, 0)
    mp  = N.new("ShaderNodeMapping");   mp.location  = (-500, 0)
    mp.inputs["Scale"].default_value = (1.2, 2.2, 1.0)  # elongate vertically

    # Oval body from spherical gradient
    grad = N.new("ShaderNodeTexGradient"); grad.location = (-300, 120)
    grad.gradient_type = "SPHERICAL"
    rb   = N.new("ShaderNodeValToRGB");   rb.location   = (-100, 120)
    rb.color_ramp.elements[0].position = 0.40
    rb.color_ramp.elements[1].position = 0.58

    # Serrated edge from noise
    noise = N.new("ShaderNodeTexNoise");   noise.location = (-300, -120)
    noise.inputs["Scale"].default_value    = 14.0
    noise.inputs["Detail"].default_value   = 6.0
    noise.inputs["Roughness"].default_value = 0.55
    rn   = N.new("ShaderNodeValToRGB");    rn.location    = (-100, -120)
    rn.color_ramp.elements[0].position = 0.35
    rn.color_ramp.elements[1].position = 0.55

    # Both ramps must pass — binary AND via multiply
    mul = N.new("ShaderNodeMath"); mul.location = (200, 0)
    mul.operation = "MULTIPLY"

    L.new(tc.outputs["Object"],     mp.inputs["Vector"])
    L.new(mp.outputs["Vector"],     grad.inputs["Vector"])
    L.new(mp.outputs["Vector"],     noise.inputs["Vector"])
    L.new(grad.outputs["Fac"],      rb.inputs["Fac"])
    L.new(noise.outputs["Fac"],     rn.inputs["Fac"])
    L.new(rb.outputs["Color"],      mul.inputs[0])
    L.new(rn.outputs["Color"],      mul.inputs[1])
    L.new(mul.outputs["Value"],     pb.inputs["Alpha"])
    L.new(pb.outputs["BSDF"],       out.inputs["Surface"])
    return mat


def build_holo_blend_material() -> bpy.types.Material:
    """
    Radial alpha fade: inverted SPHERICAL gradient through ColorRamp.
    Centre opaque (alpha=1), edges transparent (alpha=0).

    blend_method='BLEND'  → alphaMode: BLEND
    shadow_method='NONE'  → hologram casts no shadow
    Emission Strength 1.8 → visible glow within SDR range
    """
    mat = bpy.data.materials.new(BLEND_MAT_NAME)
    mat.use_nodes         = True
    mat.blend_method      = "BLEND"
    mat.shadow_method     = "NONE"
    mat.use_backface_culling = False

    N, L = mat.node_tree.nodes, mat.node_tree.links
    N.clear()

    out = N.new("ShaderNodeOutputMaterial"); out.location = (750, 0)
    pb  = N.new("ShaderNodeBsdfPrincipled"); pb.location  = (350, 0)
    pb.inputs["Base Color"].default_value       = HOLO_BASE_COLOR
    pb.inputs["Roughness"].default_value        = 0.05
    pb.inputs["Metallic"].default_value         = 0.0
    pb.inputs["Emission Color"].default_value   = HOLO_EMISSION_COLOR
    pb.inputs["Emission Strength"].default_value = HOLO_EMISSION_STR

    tc   = N.new("ShaderNodeTexCoord");   tc.location   = (-600, 0)
    mp   = N.new("ShaderNodeMapping");    mp.location   = (-400, 0)
    grad = N.new("ShaderNodeTexGradient"); grad.location = (-200, 0)
    grad.gradient_type = "SPHERICAL"

    # Invert: Spherical goes 0→1 from centre out; subtract from 1
    inv  = N.new("ShaderNodeMath");        inv.location  = (-20, 0)
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0

    ramp = N.new("ShaderNodeValToRGB");    ramp.location = (130, 0)
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[1].position = 0.85

    L.new(tc.outputs["UV"],      mp.inputs["Vector"])
    L.new(mp.outputs["Vector"],  grad.inputs["Vector"])
    L.new(grad.outputs["Fac"],   inv.inputs[1])
    L.new(inv.outputs["Value"],  ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], pb.inputs["Alpha"])
    L.new(pb.outputs["BSDF"],    out.inputs["Surface"])
    return mat


def build_leaf_cluster() -> None:
    leaf_mat = build_leaf_clip_material()
    for i in range(3):
        p = make_plane(f"leaf_{i}", size=0.9)
        p.rotation_euler = (math.radians(90), 0, math.radians(i * 60))
        p.location = (0.0, 0.0, 0.45)
        p.data.materials.append(leaf_mat)


def build_holo_decal() -> None:
    holo_mat = build_holo_blend_material()
    p = make_plane("holo_decal", size=0.7)
    p.location       = (1.5, 0.0, 0.35)
    p.rotation_euler = (math.radians(90), 0, 0)
    p.data.materials.append(holo_mat)


def build_floor() -> None:
    p   = make_plane("floor_shadow_catch", size=4.0)
    mat = bpy.data.materials.new("hs_floor")
    mat.use_nodes = True
    pb  = mat.node_tree.nodes.get("Principled BSDF")
    if pb:
        pb.inputs["Base Color"].default_value = (0.06, 0.06, 0.08, 1.0)
        pb.inputs["Roughness"].default_value  = 0.92
    p.data.materials.append(mat)


def add_camera_and_light() -> None:
    cam_d = bpy.data.cameras.new("hs_cam")
    cam_d.lens = 35
    cam   = bpy.data.objects.new("hs_cam", cam_d)
    bpy.context.scene.collection.objects.link(cam)
    cam.location       = (2.2, -2.6, 1.8)
    cam.rotation_euler = (math.radians(60), 0, math.radians(40))
    bpy.context.scene.camera = cam

    sun_d = bpy.data.lights.new("key_sun", "SUN")
    sun_d.energy = 5.0
    sun   = bpy.data.objects.new("key_sun", sun_d)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), 0, math.radians(-35))


def export_glb() -> None:
    """
    Alpha mode summary for this GLB:
      leaf_0/1/2   → MASK,  alphaCutoff: 0.42, doubleSided: true
      holo_decal   → BLEND,                     doubleSided: true
      floor        → OPAQUE
    """
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_materials="EXPORT",
        export_animations=False,
    )
    print(f"[blueprint] GLB → {OUTPUT_GLB}")


def main() -> None:
    reset_scene()
    build_leaf_cluster()
    build_holo_decal()
    build_floor()
    add_camera_and_light()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(scale=True, location=False, rotation=False)
    export_glb()


if __name__ == "__main__":
    main()
