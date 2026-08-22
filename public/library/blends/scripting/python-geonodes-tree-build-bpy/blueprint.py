"""
blueprint.py — Python: Programmatic Geometry Nodes Tree Construction via bpy
Blender 5.1 | Holoflow Studio | CC0

TECHNIQUE
---------
Geometry Nodes trees can be assembled entirely through the bpy data API without
touching the UI editor.  In Blender 5.0+ the node-group interface is managed via
`node_group.interface` (a `NodeTreeInterface` object) rather than the deprecated
`inputs`/`outputs` lists.  Every socket is created with `interface.new_socket()`,
every node with `nodes.new()`, and every connection with `links.new()`.

WHY SCRIPTED TREES?
-------------------
- Asset library automation: stamp out parametric prop variants with one script.
- CI/CD: regenerate canonical node setups without manual editor state.
- Teaching: the script is a precise, auditable spec of every connection.

OUTPUT:  geonodes_script_demo.blend  +  geonodes_script_demo.glb
"""

import bpy
import math
import os

# ─── Parameters ──────────────────────────────────────────────────────────────
OBJECT_NAME       = "gn_scripted_sphere"
NODE_GROUP_NAME   = "HF_ScriptedDisplace"
SPHERE_SEGMENTS   = 32
SPHERE_RINGS      = 16
SPHERE_RADIUS     = 1.0
NOISE_SCALE       = 2.5      # Noise Texture > Scale
NOISE_STRENGTH    = 0.28     # displacement amplitude in metres
MATERIAL_NAME     = "HF_FacetCelBase"
EMIT_COLOUR       = (0.05, 0.55, 1.0, 1.0)   # cobalt-blue emission
RENDER_SAMPLES    = 32
OUTPUT_DIR        = os.path.join(os.path.dirname(__file__))
BLEND_PATH        = os.path.join(OUTPUT_DIR, "geonodes_script_demo.blend")
GLB_PATH          = os.path.join(OUTPUT_DIR, "geonodes_script_demo.glb")


# ─── Helpers ─────────────────────────────────────────────────────────────────

def purge_scene():
    """Remove all objects, meshes, materials, and node groups from a fresh slate."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)
    for block in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(block)


def make_emission_material():
    """Minimal Emission + Principled blend for stylised cel look."""
    mat = bpy.data.materials.new(MATERIAL_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = EMIT_COLOUR
    emit.inputs["Strength"].default_value = 1.2
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    out.location = (300, 0)
    emit.location = (0, 0)
    return mat


# ─── Core: build the node group entirely via bpy ──────────────────────────────

def build_node_group() -> bpy.types.GeometryNodeTree:
    """
    Assembles a Geometry Nodes group from scratch.

    Graph:
        Group Input [Geometry, Scale] ──► Set Position ──► Group Output [Geometry]
                                 ▲
                           Noise Texture
                                 ▲
                           Position (input)

    Key Blender 5.x facts
    ---------------------
    • Node group interface sockets live on `ng.interface`, NOT `ng.inputs/outputs`.
    • `interface.new_socket(name, in_out, socket_type)` — in_out is 'INPUT' or 'OUTPUT'.
    • Socket type strings: 'NodeSocketGeometry', 'NodeSocketFloat', 'NodeSocketVector', …
    • Node type strings: 'GeometryNodeSetPosition', 'ShaderNodeTexNoise', etc.
      — Geometry node types keep 'GeometryNode' prefix.
      — Shader-derived nodes ('ShaderNodeTexNoise') are reused in GN context.
    • `nodes.new(bl_idname)` returns the node; set `.location` as (x, y) tuple.
    • Link: `links.new(from_socket, to_socket)` — order matters.
    """
    ng: bpy.types.GeometryNodeTree = bpy.data.node_groups.new(
        NODE_GROUP_NAME, 'GeometryNodeTree'
    )
    nodes = ng.nodes
    links = ng.links

    # ── Interface (Blender 5.x API) ──────────────────────────────────────────
    # Group Input sockets
    sock_geo_in = ng.interface.new_socket(
        "Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry'
    )
    sock_scale  = ng.interface.new_socket(
        "Scale",    in_out='INPUT',  socket_type='NodeSocketFloat'
    )
    sock_scale.default_value = NOISE_STRENGTH
    sock_scale.min_value     = 0.0
    sock_scale.max_value     = 2.0

    # Group Output socket
    ng.interface.new_socket(
        "Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry'
    )

    # ── Nodes ────────────────────────────────────────────────────────────────
    n_input  = nodes.new('NodeGroupInput');  n_input.location  = (-600, 0)
    n_output = nodes.new('NodeGroupOutput'); n_output.location = ( 400, 0)

    # Position node — feeds world-space XYZ into noise
    n_pos = nodes.new('GeometryNodeInputPosition'); n_pos.location = (-400, -160)

    # Noise Texture — 4D noise in GN context maps W to time/variation
    n_noise = nodes.new('ShaderNodeTexNoise')
    n_noise.noise_dimensions = '3D'
    n_noise.inputs["Scale"].default_value   = NOISE_SCALE
    n_noise.inputs["Detail"].default_value  = 6.0
    n_noise.inputs["Roughness"].default_value = 0.65
    n_noise.inputs["Distortion"].default_value = 0.1
    n_noise.location = (-200, -160)

    # Vector Math — multiply noise Fac (0-1) by Scale socket value → offset vector
    # We use the noise Color output (which is a vector of three independent noises)
    # and scale it by the Scale float to get the displacement vector.
    n_vmul = nodes.new('ShaderNodeVectorMath')
    n_vmul.operation = 'MULTIPLY'
    n_vmul.location  = (0, -80)

    # Convert Float Scale → Vector for VectorMath second input
    n_scale_vec = nodes.new('ShaderNodeCombineXYZ')
    n_scale_vec.location = (-200, 80)

    # Set Position — applies the displacement to geometry
    n_setpos = nodes.new('GeometryNodeSetPosition')
    n_setpos.location = (200, 0)

    # ── Links ────────────────────────────────────────────────────────────────
    # Position → Noise input Vector
    links.new(n_pos.outputs["Position"],     n_noise.inputs["Vector"])

    # Noise Color (vec3) → VectorMath A
    links.new(n_noise.outputs["Color"],      n_vmul.inputs[0])

    # Scale float → CombineXYZ (x=y=z=Scale) → VectorMath B
    links.new(n_input.outputs["Scale"],      n_scale_vec.inputs["X"])
    links.new(n_input.outputs["Scale"],      n_scale_vec.inputs["Y"])
    links.new(n_input.outputs["Scale"],      n_scale_vec.inputs["Z"])
    links.new(n_scale_vec.outputs["Vector"], n_vmul.inputs[1])

    # VectorMath result → SetPosition Offset
    links.new(n_vmul.outputs["Vector"],      n_setpos.inputs["Offset"])

    # Group Input Geometry → SetPosition Geometry
    links.new(n_input.outputs["Geometry"],   n_setpos.inputs["Geometry"])

    # SetPosition Geometry → Group Output
    links.new(n_setpos.outputs["Geometry"],  n_output.inputs["Geometry"])

    print(f"[holoflow] Node group '{NODE_GROUP_NAME}' built — "
          f"{len(nodes)} nodes, {len(links)} links.")
    return ng


# ─── Scene assembly ───────────────────────────────────────────────────────────

def build_scene():
    purge_scene()

    # UV Sphere as the base mesh
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SPHERE_SEGMENTS, ring_count=SPHERE_RINGS,
        radius=SPHERE_RADIUS, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = OBJECT_NAME

    # Material
    mat = make_emission_material()
    obj.data.materials.append(mat)

    # Build the node group and add it as a modifier
    ng = build_node_group()

    mod = obj.modifiers.new("GN_ScriptedDisplace", 'NODES')
    mod.node_group = ng

    # Shader smooth (for emission readability)
    bpy.ops.object.shade_smooth()

    # Camera + HDRI-style world
    bpy.ops.object.camera_add(location=(0, -4, 0.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam

    # World background — plain black keeps focus on emission
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.01, 0.01, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0

    # Render settings (EEVEE Next)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = RENDER_SAMPLES
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.frame_end = 60

    # Keyframe Scale parameter from 0 → 0.28 (noise grows in)
    mod_ref = obj.modifiers["GN_ScriptedDisplace"]
    scene.frame_set(1)
    mod_ref["Socket_2"] = 0.0          # Socket_2 is the "Scale" group input
    mod_ref.keyframe_insert(data_path='["Socket_2"]', frame=1)
    scene.frame_set(60)
    mod_ref["Socket_2"] = NOISE_STRENGTH
    mod_ref.keyframe_insert(data_path='["Socket_2"]', frame=60)

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


# ─── Export ───────────────────────────────────────────────────────────────────

def export_assets():
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[holoflow] Saved: {BLEND_PATH}")

    # Apply GN modifier for GLB snapshot (frame 60 = max displacement)
    bpy.context.scene.frame_set(60)
    bpy.ops.object.select_all(action='DESELECT')
    obj = bpy.data.objects[OBJECT_NAME]
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="GN_ScriptedDisplace")

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print(f"[holoflow] Exported: {GLB_PATH}")


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    build_scene()
    export_assets()
    print("[holoflow] blueprint complete.")
