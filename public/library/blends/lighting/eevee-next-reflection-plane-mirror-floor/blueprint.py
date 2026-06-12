"""
EEVEE Next — Reflection Plane Probe: Real-Time Specular Mirror Floor
Blender 5.1  ·  CC0 1.0 Universal  ·  holoflow.co.uk

Technique: The Plane Light Probe (type='PLANAR') captures a live mirror view
by rendering from a camera reflected across the probe's plane normal, then
reprojects that image onto any surface inside its influence volume.  Unlike a
Sphere Probe (static baked cubemap) or Screen Space Reflections (2D screen-
space ray trace), the Plane Probe re-renders contributing geometry every frame.
Result: dynamic, geometrically-correct specular reflections on flat surfaces.
Cost: roughly one extra draw call per opaque mesh inside the influence region.

Outside sources credited in README.md and tutorial entry:
  Three.js PMREMGenerator (MIT) — github.com/mrdoob/three.js
  Blender Foundation EEVEE Next release notes 4.2 (CC-BY)
    — wiki.blender.org/wiki/Reference/Release_Notes/4.2/EEVEE
"""

import bpy
import mathutils

# ─── scene parameters ─────────────────────────────────────────────────────────
FLOOR_SIZE          = 5.0    # half-extent (metres); floor is FLOOR_SIZE × 2 square
FLOOR_ROUGHNESS     = 0.04   # near-mirror; raise toward 0.5 to watch probe fade out
FLOOR_IOR           = 1.52   # polished ceramic / glass
COLUMN_RADIUS       = 0.12   # metres
COLUMN_HEIGHT       = 2.4    # metres
SPHERE_RADIUS       = 0.35   # metres; coloured spheres above the floor
PROBE_CLIP_START    = 0.002  # metres; must be > 0 to avoid floor self-reflection
PROBE_FALLOFF       = 0.15   # blend fraction at influence edges (0 = hard, 1 = full blend)
SSR_MAX_ROUGHNESS   = 0.45   # roughness above this → probe disabled, floor goes matte
RENDER_SAMPLES      = 64
RENDER_W, RENDER_H  = 1920, 1080
CAMERA_HEIGHT       = 0.55   # low camera to make reflections prominent in frame
CAMERA_DISTANCE     = 5.5
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def configure_eevee_next(scene: bpy.types.Scene) -> None:
    """
    EEVEE Next render setup for planar reflections.

    In Blender 5.1, SSR and the Plane Probe are complementary:
      - SSR traces reflections in 2D screen space; fast but misses off-screen geo.
      - The Plane Probe re-renders reflected geometry in 3D; accurate but costs
        an additional geometry pass per frame.
    Enable both: SSR handles curved and off-plane surfaces; the Plane Probe owns
    the floor where geometric accuracy matters most.
    """
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    eevee = scene.eevee

    eevee.taa_render_samples = RENDER_SAMPLES
    eevee.taa_samples = 16          # viewport sample count

    # Screen Space Reflections — fallback for geometry outside the probe footprint
    eevee.use_ssr = True
    eevee.ssr_quality = 0.5         # trace quality (0–1); 0.5 is a good balance
    eevee.ssr_max_roughness = SSR_MAX_ROUGHNESS
    eevee.ssr_thickness = 0.08      # ray hit thickness (metres); thin floor = small value
    eevee.ssr_border_fade = 0.075   # fade width at screen edges

    # Ground Truth Ambient Occlusion adds contact shadow where columns meet floor
    eevee.use_gtao = True
    eevee.gtao_distance = 0.5
    eevee.gtao_factor = 1.0
    eevee.gtao_quality = 0.25

    scene.render.resolution_x = RENDER_W
    scene.render.resolution_y = RENDER_H
    scene.render.pixel_aspect_x = 1.0
    scene.render.pixel_aspect_y = 1.0


def material_floor() -> bpy.types.Material:
    """
    Near-mirror dielectric floor.  IOR 1.52 (polished ceramic).
    Roughness 0.04: at this value SSR fires for the fallback and the Plane Probe
    dominates.  Raise above SSR_MAX_ROUGHNESS (0.45) to see the reflection
    vanish completely — useful for a before/after demo.
    """
    mat = bpy.data.materials.new("mirror_floor")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial");  out.location  = (400, 0)
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (100, 0)

    bsdf.inputs["Base Color"].default_value  = (0.90, 0.90, 0.88, 1.0)
    bsdf.inputs["Roughness"].default_value   = FLOOR_ROUGHNESS
    bsdf.inputs["IOR"].default_value         = FLOOR_IOR
    bsdf.inputs["Metallic"].default_value    = 0.0
    # Specular Tint: slight cool-blue to read as polished stone rather than paint
    bsdf.inputs["Specular Tint"].default_value = (0.78, 0.84, 1.0, 1.0)

    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def material_brass() -> bpy.types.Material:
    """Warm satin brass for columns — high metallic, moderate roughness."""
    mat = bpy.data.materials.new("brass_column")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial");  out.location  = (400, 0)
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (100, 0)

    bsdf.inputs["Base Color"].default_value = (0.82, 0.60, 0.30, 1.0)
    bsdf.inputs["Metallic"].default_value   = 1.0
    bsdf.inputs["Roughness"].default_value  = 0.22

    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def material_sphere(r: float, g: float, b: float, name: str) -> bpy.types.Material:
    """Glossy coloured sphere material — low roughness so floor reflection is vivid."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial");  out.location  = (400, 0)
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (100, 0)

    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.08
    bsdf.inputs["Metallic"].default_value   = 0.0

    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def link_to(collection: bpy.types.Collection, obj: bpy.types.Object) -> None:
    """Move object from scene root collection into a named collection."""
    collection.objects.link(obj)
    try:
        bpy.context.scene.collection.objects.unlink(obj)
    except RuntimeError:
        pass


def build_scene(root: bpy.types.Collection) -> dict:
    """Construct floor, columns, and coloured reference spheres."""
    objs: dict = {}

    # Floor
    bpy.ops.mesh.primitive_plane_add(size=FLOOR_SIZE * 2, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "mirror_floor"
    floor.data.materials.append(material_floor())
    link_to(root, floor)
    objs["floor"] = floor

    # Four brass columns near corners
    brass = material_brass()
    col_positions = [
        ( FLOOR_SIZE * 0.55,  FLOOR_SIZE * 0.55),
        (-FLOOR_SIZE * 0.55,  FLOOR_SIZE * 0.55),
        ( FLOOR_SIZE * 0.55, -FLOOR_SIZE * 0.55),
        (-FLOOR_SIZE * 0.55, -FLOOR_SIZE * 0.55),
    ]
    for i, (cx, cy) in enumerate(col_positions):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=COLUMN_RADIUS,
            depth=COLUMN_HEIGHT,
            location=(cx, cy, COLUMN_HEIGHT * 0.5),
        )
        col = bpy.context.active_object
        col.name = f"column_{i:02d}"
        col.data.materials.append(brass)
        link_to(root, col)

    # Red sphere (left) and blue sphere (right) — both positioned to cast vivid reflections
    for name, (x, mat_name, r, g, b) in {
        "sphere_red":  (-1.2, "sphere_red",  0.85, 0.10, 0.10),
        "sphere_blue": ( 1.2, "sphere_blue", 0.10, 0.20, 0.90),
    }.items():
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=SPHERE_RADIUS,
            location=(x, 0.0, SPHERE_RADIUS + 0.01),
            segments=32,
            ring_count=16,
        )
        sp = bpy.context.active_object
        sp.name = name
        sp.data.materials.append(material_sphere(r, g, b, mat_name))
        link_to(root, sp)
        objs[name] = sp

    return objs


def add_reflection_plane_probe(root: bpy.types.Collection) -> bpy.types.Object:
    """
    Add Plane Light Probe at floor level.

    PLACEMENT RULE: The probe origin must sit ON the reflecting surface.
    We place it at Z = PROBE_CLIP_START (a hair above the floor mesh) so the
    reflected camera's near plane clears the floor geometry entirely.
    Without this, the probe captures the floor's own backface → dark stripe
    across the centre of the reflection.

    SCALE: The probe object scale controls the rectangular capture footprint.
    Scale it to cover the full floor area; geometry outside the footprint falls
    back to SSR.

    FALLOFF: Blends the probe contribution to zero at the footprint edge.
    Too small → visible seam where probe meets SSR fallback; too large → probes
    from adjacent rooms leak across walls.
    """
    bpy.ops.object.lightprobe_add(type="PLANAR", location=(0, 0, PROBE_CLIP_START))
    probe_obj = bpy.context.active_object
    probe_obj.name = "refl_plane_probe"

    probe = probe_obj.data          # bpy.types.LightProbe
    probe.clip_start = PROBE_CLIP_START
    probe.falloff    = PROBE_FALLOFF

    # Influence distance: how far above the probe plane the effect applies (metres).
    # Set to max column height + margin so all geometry above the floor is captured.
    probe.influence_distance = COLUMN_HEIGHT + 0.5

    # Scale the influence rectangle to match the floor footprint
    probe_obj.scale = (FLOOR_SIZE * 0.92, FLOOR_SIZE * 0.92, 1.0)

    link_to(root, probe_obj)
    return probe_obj


def add_lighting(root: bpy.types.Collection) -> None:
    """Sun key + large area fill — deliberate asymmetry makes shadow play visible in reflection."""
    bpy.ops.object.light_add(type="SUN", location=(6, -6, 9))
    sun = bpy.context.active_object
    sun.name = "sun_key"
    sun.data.energy = 5.0
    sun.data.angle  = 0.025          # small angle → sharp shadow edges
    sun.rotation_euler = mathutils.Euler((0.78, 0.0, 0.60), "XYZ")
    link_to(root, sun)

    bpy.ops.object.light_add(type="AREA", location=(-3, 4, 5))
    fill = bpy.context.active_object
    fill.name = "area_fill"
    fill.data.energy = 120.0
    fill.data.size   = 4.0
    fill.rotation_euler = mathutils.Euler((1.05, 0.0, -0.80), "XYZ")
    link_to(root, fill)


def add_camera(scene: bpy.types.Scene, root: bpy.types.Collection) -> bpy.types.Object:
    """Low-angle camera: keeps the floor prominent so reflections fill the frame."""
    bpy.ops.object.camera_add(
        location=(0, -CAMERA_DISTANCE, CAMERA_HEIGHT)
    )
    cam = bpy.context.active_object
    cam.name = "camera_main"
    cam.rotation_euler = mathutils.Euler((1.47, 0.0, 0.0), "XYZ")
    cam.data.lens = 28               # wide lens emphasises the floor area
    scene.camera = cam
    link_to(root, cam)
    return cam


# ─── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    scene = bpy.context.scene
    clear_scene()

    root = bpy.data.collections.new("refl_plane_scene")
    scene.collection.children.link(root)

    configure_eevee_next(scene)
    build_scene(root)
    add_reflection_plane_probe(root)
    add_lighting(root)
    add_camera(scene, root)

    # Holoflow WebXR exporter tag — apply transforms before GLB export
    scene["holoflow:facet"] = True

    print(
        "[blueprint] Scene built.\n"
        "  Switch to Rendered mode (Z → Rendered) to see the live reflection.\n"
        "  No bake step needed: the Plane Probe updates every viewport frame.\n"
        "  GLB export: File › Export › glTF 2.0  (Draco 6, WebP, +Y Up, Apply Transforms).\n"
        "  Note: the probe is stripped on export — include a PMREMGenerator env-map\n"
        "  in the Three.js scene for WebXR equivalence (see README.md)."
    )


main()
