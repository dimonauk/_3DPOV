"""
Animation Drivers — Custom Properties Controlling Shader Sockets
================================================================
Blender 5.1 | Holoflow Studio | CC0

Demonstrates Blender's driver system: a single Custom Property on an Object
controls both the Emission Strength and the Mix Shader factor of its material,
making the crystal shard visually pulse between a dormant dark state and a
full-glow energy state. The authoring workflow is live and parametric; the
export section explains the glTF delivery boundary.

Core technique:
  Object custom property ["energy_level"] ─driver─► Emission.Strength (× 4)
  Object custom property ["energy_level"] ─driver─► MixShader.Fac
  Driver type: SCRIPTED with a simple expression
  Variable type: SINGLE_PROP targeting obj["energy_level"]

WHY SCRIPTED over AVERAGE:
  AVERAGE reads the mean of all variable values — fine for blending two
  sources, useless for a formula. SCRIPTED evaluates a Python expression
  string, allowing "energy * 4.0" to map the 0–1 property to 0–4 W emission.
  Every driver involving a non-trivial mapping should be SCRIPTED.

WHY Custom Property instead of a built-in transform channel:
  Built-in channels (location X, rotation Y) already have known glTF targets
  and get exported as standard animation channels. Custom properties are
  arbitrary metadata that glTF does not understand — they require the
  experimental KHR_animation_pointer extension to travel into the GLB.
  For production WebXR interactive objects, convert custom property control
  to a shape key weight (exports as morph weight) or drive a transform
  that JavaScript reads on the Object3D. The driver remains in the .blend
  as the authoring tool; the export is a static snapshot at the desired state.

WHY tgt.id_type = 'OBJECT' is mandatory:
  Without it the variable target's id_type defaults to the context type of
  the driven socket — a Material. Blender will fail to resolve the custom
  property path on the wrong ID block and the driver will return 0 silently.
  Always set id_type explicitly when the driver source is different from the
  driven datablock.

WHY bpy.context.view_layer.update() before export:
  Setting obj["energy_level"] = 1.0 writes the value but does not propagate
  it through the driver graph immediately. view_layer.update() forces a full
  depsgraph evaluation so the node socket default_value reflects the new
  state before bpy.ops.export_scene.gltf reads it.

glTF delivery paths:
  (a) Static snapshot — set energy_level, update depsgraph, export. The GLB
      captures the material at the chosen energy state. Three.js sees a static
      emissive mesh. Simplest and most compatible.
  (b) Animated via KHR_animation_pointer — enable the extension in the glTF
      export UI (Blender 5.x, gltf-blender-io 4.2+). Keyframe socket
      default_value directly (not via driver) and set export_animations=True.
  (c) Three.js intercept — export static, animate with
      mesh.material.emissiveIntensity from JS. Full real-time control.

Run headless:
    blender --background --python blueprint.py
"""

from pathlib import Path
import bpy
import bmesh

# ─── parameters ───────────────────────────────────────────────────────────────
OBJ_NAME       = "crystal_shard"
MAT_NAME       = "CrystalEnergyMat"
BASE_COLOUR    = (0.04, 0.06, 0.12, 1.0)   # near-black midnight blue (dormant)
EMIT_COLOUR    = (0.20, 0.95, 0.80, 1.0)   # bright cyan (energy)
EMIT_SCALE     = 4.0    # energy_level 1.0 → 4 W emission
ENERGY_PROP    = "energy_level"             # custom property name
FRAME_DARK     = 1
FRAME_GLOW     = 30
FRAME_DARK2    = 60
OUT_DIR        = Path(__file__).parent
GLB_OUT        = OUT_DIR / "crystal_shard.glb"


# ─── scene ────────────────────────────────────────────────────────────────────

def setup_scene() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.frame_start   = FRAME_DARK
    scene.frame_end     = FRAME_DARK2

    bpy.ops.object.light_add(type="SUN", location=(5, -5, 10))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = 0.008   # hard shadows for faceted crystal

    return scene


# ─── mesh ─────────────────────────────────────────────────────────────────────

def build_crystal_shard(scene: bpy.types.Scene) -> bpy.types.Object:
    """
    Icosphere subdivisions=0 gives 20 equilateral triangular faces — a near-
    ideal crystal polyhedron. Scaling Z × 2.2 creates the tall-shard silhouette.
    Flat normals (poly.use_smooth = False) emphasise every facet boundary, which
    the emission glow will highlight at each silhouette edge.
    """
    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=0, radius=0.55)
    bm.to_mesh(mesh)
    bm.free()

    # Stretch into shard shape
    for v in mesh.vertices:
        v.co.z *= 2.2
    mesh.update()

    for poly in mesh.polygons:
        poly.use_smooth = False

    return obj


# ─── material ─────────────────────────────────────────────────────────────────

def build_energy_material(obj: bpy.types.Object) -> bpy.types.Material:
    """
    Node graph:
      Principled BSDF (dark, metallic base) ──┐
                                               ├─ Mix Shader ─► Material Output
      Emission (bright cyan)  ─────────────────┘
           │
           Fac = energy_level  (driver)
      Emission.Strength = energy_level × EMIT_SCALE  (driver)

    WHY two BSDFs rather than mix Emission into Principled.Emission socket:
      Principled BSDF's built-in Emission sub-socket does not have a driver-
      accessible default_value path under node.inputs in the same manner as a
      standalone Emission shader. A standalone Emission node gives a clean
      data_path for the driver and is easier to inspect in the Shader Editor.
    """
    mat = bpy.data.materials.new(name=MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    n_out   = nodes.new("ShaderNodeOutputMaterial");  n_out.location   = (500, 0)
    n_mix   = nodes.new("ShaderNodeMixShader");       n_mix.location   = (300, 0)
    n_pbr   = nodes.new("ShaderNodeBsdfPrincipled");  n_pbr.location   = (0, -120)
    n_emit  = nodes.new("ShaderNodeEmission");        n_emit.location  = (0, 80)

    n_pbr.inputs["Base Color"].default_value   = BASE_COLOUR
    n_pbr.inputs["Metallic"].default_value     = 0.6
    n_pbr.inputs["Roughness"].default_value    = 0.15
    n_emit.inputs["Color"].default_value       = EMIT_COLOUR
    n_emit.inputs["Strength"].default_value    = 0.0    # driver will override

    links.new(n_pbr.outputs["BSDF"],     n_mix.inputs[1])   # Shader 1
    links.new(n_emit.outputs["Emission"],n_mix.inputs[2])   # Shader 2
    links.new(n_mix.outputs["Shader"],   n_out.inputs["Surface"])
    # n_mix.inputs[0] = Fac: driver wired below

    obj.data.materials.append(mat)
    return mat


# ─── custom property ──────────────────────────────────────────────────────────

def add_custom_property(obj: bpy.types.Object) -> None:
    """
    id_properties_ui() returns an IDPropertyUIManager for the named property.
    .update() writes min/max/default into the property's RNA metadata so
    Blender's UI renders a slider rather than a plain text field.
    """
    obj[ENERGY_PROP] = 0.0
    ui = obj.id_properties_ui(ENERGY_PROP)
    ui.update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, default=0.0)


# ─── drivers ──────────────────────────────────────────────────────────────────

def _make_energy_driver(fcurve: bpy.types.FCurve, obj: bpy.types.Object,
                        expression: str) -> None:
    """Shared driver factory: read energy_level from obj, apply expression."""
    drv = fcurve.driver
    drv.type       = 'SCRIPTED'
    drv.expression = expression

    var = drv.variables.new()
    var.name = "energy"
    var.type = 'SINGLE_PROP'

    tgt = var.targets[0]
    tgt.id_type   = 'OBJECT'         # MUST be set explicitly
    tgt.id        = obj
    tgt.data_path = f'["{ENERGY_PROP}"]'


def wire_drivers(mat: bpy.types.Material, obj: bpy.types.Object) -> None:
    nodes = mat.node_tree.nodes

    # Emission Strength: 0 → EMIT_SCALE watts
    n_emit = next(n for n in nodes if n.type == 'EMISSION')
    fc_strength = n_emit.inputs["Strength"].driver_add("default_value")
    _make_energy_driver(fc_strength, obj, f"energy * {EMIT_SCALE}")

    # Mix Shader Fac: 0 = pure Principled, 1 = pure Emission
    n_mix = next(n for n in nodes if n.type == 'MIX_SHADER')
    fc_fac = n_mix.inputs["Fac"].driver_add("default_value")
    _make_energy_driver(fc_fac, obj, "energy")


# ─── animation ────────────────────────────────────────────────────────────────

def animate_energy(obj: bpy.types.Object) -> None:
    """Keyframe the custom property: dark → glow → dark."""
    for frame, value in [(FRAME_DARK, 0.0), (FRAME_GLOW, 1.0), (FRAME_DARK2, 0.0)]:
        obj[ENERGY_PROP] = value
        obj.keyframe_insert(data_path=f'["{ENERGY_PROP}"]', frame=frame)

    # Smooth ease in/out for the pulse
    action = obj.animation_data.action
    for fc in action.fcurves:
        if fc.data_path == f'["{ENERGY_PROP}"]':
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing        = 'EASE_IN_OUT'


# ─── export ───────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    """
    Export a static snapshot at full glow (energy_level = 1.0).
    Custom property animation does NOT export to standard glTF channels;
    the depsgraph snapshot at this frame is what the exporter reads.
    For animated delivery see KHR_animation_pointer (Blender 5.x export UI).
    """
    bpy.context.scene.frame_set(FRAME_GLOW)   # peak energy frame
    obj[ENERGY_PROP] = 1.0
    bpy.context.view_layer.update()            # propagate through driver graph

    for o in bpy.context.scene.objects:
        o.select_set(o == obj)
    bpy.context.view_layer.objects.active = obj

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"[blueprint] GLB → {GLB_OUT}")


# ─── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    scene = setup_scene()
    obj   = build_crystal_shard(scene)
    mat   = build_energy_material(obj)
    add_custom_property(obj)
    wire_drivers(mat, obj)
    animate_energy(obj)
    export_glb(obj)
    print("[blueprint] done — crystal_shard.glb at full glow state")


if __name__ == "__main__":
    main()
