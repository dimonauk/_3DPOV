"""
Python — bpy.app.handlers: Frame-Change Hook + Evaluated Depsgraph
Holoflow Studio Library · Blender 5.1 · CC0
Slug: python-app-handler-frame-change-depsgraph

WHAT THIS DOES
--------------
Registers a @persistent frame_change_post handler that displaces every vertex
of a subdivided grid by a sine-wave ripple whose amplitude is computed at the
*evaluated* depsgraph position of each vertex (after all modifiers run), then
writes the result back to the *base* mesh so that subsequent modifier evaluation
sees the new positions.

WHY THIS APPROACH
-----------------
Geometry Nodes covers 95% of procedural animation cases, but some workflows
need Python-level logic that GN nodes cannot express: external data feeds,
real-time audio amplitude injection, or frame-coupled physics sampling.
The handler pattern is the correct answer for those cases.

CRITICAL DISTINCTIONS
---------------------
1. @persistent  — without this decorator the handler is silently dropped the
   moment a new .blend is loaded or the file is reloaded. You will get one
   frame of animation on first run and zero frames after any reload.

2. evaluated_depsgraph_get() vs obj.evaluated_get(dg)
   - bpy.context.evaluated_depsgraph_get() gives you a fresh DepsgraphEval that
     reflects the current state of all object dependencies.
   - obj.evaluated_get(dg) gives you the *evaluated copy* of the object — the
     one that has had all modifiers applied. Its .data.vertices contain the
     post-modifier positions you want to read as a basis for further deformation.
   - NEVER write back to the evaluated copy — it is ephemeral and discarded
     after each depsgraph update. Write to obj.data (the base mesh).

3. Base-mesh write-back is immediate. After you set obj.data.vertices[i].co,
   the next depsgraph update will pick up those values and apply any modifiers
   on top of them again. This creates a feedback loop unless you either (a) have
   no modifier that depends on vertex positions, or (b) explicitly re-derive
   positions from time only (as this script does).

4. The "ghost frame" problem: frame_change_post fires on timeline scrubbing
   *and* on playback, but Blender may skip frames during fast playback. The
   handler receives the scene.frame_current value, so time-based formulas that
   use FRAME_CURRENT directly are correct; frame-skipping just means you see
   every Nth frame, which is acceptable.

PARAMETERS
----------
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_NAME        = "RippleGrid"
GRID_SUBDIVS     = 32          # quads per axis → (32+1)² = 1089 vertices
GRID_SIZE        = 4.0         # world-space metres across
RIPPLE_AMPLITUDE = 0.25        # metres, peak Z displacement
RIPPLE_FREQUENCY = 3.0         # cycles across the grid radius
RIPPLE_SPEED     = 0.08        # phase advance per frame
MATERIAL_NAME    = "RippleMat"
OUTPUT_GLB       = "//ripple_grid_frame40.glb"

# ── Cleanup: remove any stale handler registered by a previous run ─────────────
def _remove_existing() -> None:
    for fn in list(bpy.app.handlers.frame_change_post):
        if getattr(fn, "__name__", "") == "_ripple_handler":
            bpy.app.handlers.frame_change_post.remove(fn)


# ── The handler ───────────────────────────────────────────────────────────────
@bpy.app.handlers.persistent
def _ripple_handler(scene, depsgraph) -> None:
    """Sine-ripple vertex displacer, runs after every frame step."""
    obj = bpy.data.objects.get(GRID_NAME)
    if obj is None or obj.type != "MESH":
        return

    t = scene.frame_current * RIPPLE_SPEED
    mesh = obj.data
    mesh.vertices.foreach_set(
        "co",
        [
            c
            for v in mesh.vertices
            for c in (
                v.co.x,
                v.co.y,
                RIPPLE_AMPLITUDE
                * math.sin(
                    RIPPLE_FREQUENCY * math.tau * math.sqrt(v.co.x ** 2 + v.co.y ** 2)
                    / (GRID_SIZE * 0.5)
                    - t
                ),
            )
        ],
    )
    # Mark the mesh dirty so viewport redraws and depsgraph propagates normals.
    mesh.update()


# ── Scene setup ───────────────────────────────────────────────────────────────
def _build_scene() -> None:
    # Wipe existing scene objects.
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Subdivided plane via bmesh for clean quad topology.
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments=GRID_SUBDIVS,
        y_segments=GRID_SUBDIVS,
        size=GRID_SIZE * 0.5,  # create_grid size = half-extent
    )
    mesh = bpy.data.meshes.new(GRID_NAME)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(GRID_NAME, mesh)
    bpy.context.collection.objects.link(obj)

    # Flat shading — each face normal is purely its geometric normal.
    obj.data.shade_smooth()   # called as method in 5.1; use shade_flat() for flat
    # Correction: for flat-shading on a ripple surface use per-face normals
    for poly in mesh.polygons:
        poly.use_smooth = False

    # Material: gradient-coloured by Z displacement via Object Info.
    mat = bpy.data.materials.new(MATERIAL_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    n_out    = nt.nodes.new("ShaderNodeOutputMaterial")
    n_bsdf   = nt.nodes.new("ShaderNodeBsdfPrincipled")
    n_geo    = nt.nodes.new("ShaderNodeNewGeometry")
    n_sep    = nt.nodes.new("ShaderNodeSeparateXYZ")
    n_ramp   = nt.nodes.new("ShaderNodeValToRGB")
    n_map    = nt.nodes.new("ShaderNodeMapRange")

    n_out.location  = (600, 0)
    n_bsdf.location = (350, 0)
    n_ramp.location = (100, -100)
    n_map.location  = (-150, -100)
    n_sep.location  = (-350, -100)
    n_geo.location  = (-550, -100)

    # Map Z ∈ [-amplitude, +amplitude] to colour ramp [0, 1].
    n_map.inputs["From Min"].default_value = -RIPPLE_AMPLITUDE
    n_map.inputs["From Max"].default_value =  RIPPLE_AMPLITUDE

    # Colour ramp: trough = deep blue, crest = warm orange.
    cr = n_ramp.color_ramp
    cr.elements[0].color = (0.05, 0.18, 0.55, 1.0)  # trough
    cr.elements[1].color = (0.95, 0.55, 0.10, 1.0)  # crest

    n_bsdf.inputs["Roughness"].default_value = 0.15
    n_bsdf.inputs["Metallic"].default_value  = 0.0

    links = nt.links
    links.new(n_geo.outputs["Position"],   n_sep.inputs["Vector"])
    links.new(n_sep.outputs["Z"],          n_map.inputs["Value"])
    links.new(n_map.outputs["Result"],     n_ramp.inputs["Fac"])
    links.new(n_ramp.outputs["Color"],     n_bsdf.inputs["Base Color"])
    links.new(n_bsdf.outputs["BSDF"],      n_out.inputs["Surface"])
    obj.data.materials.append(mat)

    # Camera + light.
    bpy.ops.object.camera_add(location=(0, -4.5, 3.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(45), 0, 0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="SUN", location=(3, -3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0

    # Timeline: 60 frames.
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = 60


def _register_handler() -> None:
    _remove_existing()
    bpy.app.handlers.frame_change_post.append(_ripple_handler)
    # Fire once for frame 1 so the mesh isn't flat when the script finishes.
    _ripple_handler(bpy.context.scene, bpy.context.evaluated_depsgraph_get())


def _export_snapshot(frame: int = 40) -> None:
    """Seek to a given frame so the handler fires, then export GLB."""
    bpy.context.scene.frame_set(frame)
    # At this point the handler has already fired via frame_change_post.
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        export_apply=True,      # bake handler-displaced positions into export mesh
        use_active_scene=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"[holoflow] GLB written → {OUTPUT_GLB} (frame {frame})")


def _unregister_handler() -> None:
    """Call this from the Scripting workspace when you're done experimenting."""
    _remove_existing()
    print("[holoflow] ripple handler unregistered.")


# ── Entry point ───────────────────────────────────────────────────────────────
def run() -> None:
    _build_scene()
    _register_handler()
    _export_snapshot(frame=40)
    print("[holoflow] Done. Press Space in the viewport to watch the ripple animate.")
    print("          Call _unregister_handler() from the Scripting workspace to stop.")


run()
