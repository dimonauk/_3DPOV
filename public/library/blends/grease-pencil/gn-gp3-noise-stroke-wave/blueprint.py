"""
GN for Grease Pencil 3 — Noise-Wave Stroke Displacement Modifier
(Blender 5.1)

Technique summary
-----------------
Blender 5.1 makes Grease Pencil 3 (GP3) a first-class geometry type inside
the Geometry Nodes stack. Strokes are exposed as a curve-like domain: each
stroke is a spline, each point carries position, radius, and opacity — all
editable through the same nodes that drive mesh and curve GN trees. This
blueprint draws three concentric closed circles as GP3 strokes, then applies
a GN modifier that reads per-point world positions, feeds them through a 3-D
Noise Texture (offset by Scene Time), and writes the displaced positions back
via SetPosition. The result is a ring of wavering ink that undulates as the
timeline advances — no simulation required, pure procedural evaluation per
frame.

GP3 + GN domain model (critical for mental model)
--------------------------------------------------
Domain        GP3 meaning               GN nodes that read it
-----------   -----------------------   ---------------------------------
POINT         Individual stroke points  InputPosition, SetPosition, Radius
CURVE         Individual strokes        CurveLength, SplineParameter, Cyclic
LAYER         GP3 layers                InputGreasePencilLayerName/Index

Unlike mesh GN where POINT = vertex, GP3 POINT = a sample along a stroke
polyline. Radius at that point is the brush tip half-width; it is independent
of the stroke's material thickness setting. The GN modifier evaluates AFTER
the GP3 modifier stack (Smooth, Thickness, etc.), so any procedural changes
here sit on top of the modifier results — correct for a wave-on-top-of-ink
intent.

Blueprint structure
-------------------
A  Scene reset
B  GP3 material (navy ink, no fill)
C  GP3 object — three closed circle strokes (radii 0.5, 1.0, 1.5)
D  GN modifier tree: Position → Noise(pos + time) → SetPosition
E  Animate noise time-offset keyframes (60-frame cycle, then looping back)
F  Camera + EEVEE render settings (GP3 renders well in EEVEE)
G  Save .blend

Outside sources
---------------
Blender Manual: Grease Pencil Modifiers (CC-BY-SA-4.0, Blender Foundation)
https://docs.blender.org/manual/en/5.1/grease_pencil/modifiers/index.html
sibling: docs.blender.org/manual/en/5.1/grease_pencil/index.html
njanakiev/blender-scripting (MIT, Nicolas Janakiev)
https://github.com/njanakiev/blender-scripting
sibling: njanakiev/blender-jupyter MIT https://github.com/njanakiev/blender-jupyter
"""

import bpy
import math
import os

# ── A: Parameters ─────────────────────────────────────────────────────────────
SLUG           = "gn-gp3-noise-stroke-wave"
OUTPUT_DIR     = f"//../../blends/grease-pencil/{SLUG}/"
BLEND_SAVE     = f"{OUTPUT_DIR}{SLUG}.blend"

RADII          = (0.5, 1.0, 1.5)   # concentric ring radii (Blender metres)
N_PTS_PER_R    = (40, 64, 80)      # stroke point count — more points on larger rings
INK_COLOUR     = (0.04, 0.08, 0.22, 1.0)  # RGBA: deep navy ink

NOISE_SCALE    = 3.5   # spatial frequency — lower → broad slow wave
NOISE_DETAIL   = 4.0   # octave count for fine ripple texture
NOISE_STRENGTH = 0.12  # wave amplitude (Blender metres; 0.12 ≈ 12 cm)
NOISE_ROUGHNESS = 0.5  # self-similarity falloff between octaves

ANIM_FRAMES    = 60    # one full wave cycle; Scene Time ramps Seconds 0→2.5

# ── B: GP3 material ────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for block in list(bpy.data.objects):
        bpy.data.objects.remove(block, do_unlink=True)


def make_ink_material(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    gp = mat.grease_pencil
    gp.show_stroke = True
    gp.color       = colour    # RGBA linear stroke colour
    gp.show_fill   = False     # rings read better as open ink lines
    return mat


# ── C: GP3 object — concentric circle strokes ─────────────────────────────────
def make_circle_stroke(frame, radius: float, n_pts: int, mat_idx: int = 0) -> None:
    """Append one closed circle polyline to a GP3 drawing frame."""
    frame.drawing.add_strokes(1)
    s = frame.drawing.strokes[-1]
    s.material_index = mat_idx
    s.use_cyclic     = True  # close the stroke so it renders as a full ring
    # resize allocates the point buffer; points are initialised at origin
    s.resize(n_pts)
    for i in range(n_pts):
        angle = 2.0 * math.pi * i / n_pts
        pt = s.points[i]
        pt.position = (math.cos(angle) * radius,
                       math.sin(angle) * radius,
                       0.0)
        pt.radius  = 0.025   # brush half-width; GN can override this later
        pt.opacity = 1.0


def build_gp_object(mat: bpy.types.Material) -> bpy.types.Object:
    gpd = bpy.data.grease_pencils_v3.new("wave_rings")
    obj = bpy.data.objects.new("wave_rings", gpd)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)

    layer = gpd.layers.new("Ink", set_active=True)
    layer.use_onion_skinning = False  # wave motion makes onion skins noisy
    frame = layer.frames.new(frame_number=1)

    for radius, n_pts in zip(RADII, N_PTS_PER_R):
        make_circle_stroke(frame, radius, n_pts, mat_idx=0)

    return obj


# ── D: GN modifier tree ────────────────────────────────────────────────────────
def build_gn_tree(name: str = "GN_WaveStroke") -> bpy.types.GeometryNodeTree:
    """
    Build the procedural displacement tree:

      [Group Input] ──Geometry──► [Set Position] ──► [Group Output]
                   ╰──Scale──►╮                 ▲
                   ╰──Strength─►╮               │
                                │        [CombineXYZ] ←── Y = noise_centred * strength
                                │               ▲
                          [Noise Tex] ──Fac──► [Math SUB 0.5] ──► [Math MUL strength]
                               ▲
                         [VectorMath ADD] ─── position + (seconds, 0, 0)
                               ▲        ▲
                         [InputPos]  [CombineXYZ] ← X = Seconds (from SceneTime)

    WHY offset position by time before noise lookup:
    Sampling ShaderNodeTexNoise at (pos.x + t, pos.y, pos.z) evaluates a
    moving cross-section of the noise field. As t increases the cross-section
    slides along X — each stroke point sees a smoothly changing noise value.
    That sweep is perceived as a wave travelling sideways through the rings
    without any simulation state.
    """
    tree = bpy.data.node_groups.new(name, 'GeometryNodeTree')

    # Interface sockets (Blender 4.0+ node-group interface API)
    iface = tree.interface
    iface.new_socket("Geometry",        in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket("Noise Scale",     in_out='INPUT',  socket_type='NodeSocketFloat')
    iface.new_socket("Noise Strength",  in_out='INPUT',  socket_type='NodeSocketFloat')
    iface.new_socket("Geometry",        in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = tree.nodes
    links = tree.links

    n_in  = nodes["Group Input"]
    n_out = nodes["Group Output"]

    # Scene time — seconds is what we want for smooth continuous offset
    n_time = nodes.new("GeometryNodeInputSceneTime")

    # Pack seconds into X component of a vector to offset the noise lookup
    n_time_vec = nodes.new("ShaderNodeCombineXYZ")   # (seconds, 0, 0)

    # World position of each stroke point
    n_pos = nodes.new("GeometryNodeInputPosition")

    # Add time offset to position before noise sampling — wave travels in +X
    n_pos_shift = nodes.new("ShaderNodeVectorMath")
    n_pos_shift.operation = 'ADD'

    # 3-D noise evaluated per stroke point
    n_noise = nodes.new("ShaderNodeTexNoise")
    n_noise.noise_dimensions = '3D'
    n_noise.inputs["Detail"].default_value    = NOISE_DETAIL
    n_noise.inputs["Roughness"].default_value = NOISE_ROUGHNESS

    # Centre noise: Fac is [0,1]; subtract 0.5 to get [-0.5, 0.5]
    n_centre = nodes.new("ShaderNodeMath")
    n_centre.operation = 'SUBTRACT'
    n_centre.inputs[1].default_value = 0.5

    # Scale by strength — result is the Y-axis displacement in metres
    n_mul = nodes.new("ShaderNodeMath")
    n_mul.operation = 'MULTIPLY'

    # Pack into Y displacement only (strokes drawn in XY plane; Y = up on-canvas)
    n_disp = nodes.new("ShaderNodeCombineXYZ")

    # SetPosition — Blender 5.1 accepts Offset as a vector field on POINT domain
    n_setpos = nodes.new("GeometryNodeSetPosition")

    # ── wiring ──────────────────────────────────────────────────────────────
    # Time → CombineXYZ → shift vector
    links.new(n_time.outputs["Seconds"],        n_time_vec.inputs["X"])
    # Position + time_vec → shifted coord for noise
    links.new(n_pos.outputs["Position"],         n_pos_shift.inputs[0])
    links.new(n_time_vec.outputs["Vector"],      n_pos_shift.inputs[1])
    # Noise Scale from group input
    links.new(n_in.outputs["Noise Scale"],       n_noise.inputs["Scale"])
    # Shifted position feeds noise vector
    links.new(n_pos_shift.outputs["Vector"],     n_noise.inputs["Vector"])
    # Noise Fac → centre → multiply by strength
    links.new(n_noise.outputs["Fac"],            n_centre.inputs[0])
    links.new(n_centre.outputs["Value"],         n_mul.inputs[0])
    links.new(n_in.outputs["Noise Strength"],    n_mul.inputs[1])
    # Pack displacement into Y only (Z intentionally kept 0 for 2-D strokes)
    links.new(n_mul.outputs["Value"],            n_disp.inputs["Y"])
    # SetPosition: geometry from group input, offset from displacement vector
    links.new(n_in.outputs["Geometry"],          n_setpos.inputs["Geometry"])
    links.new(n_disp.outputs["Vector"],          n_setpos.inputs["Offset"])
    links.new(n_setpos.outputs["Geometry"],      n_out.inputs["Geometry"])

    return tree


def apply_gn_modifier(obj: bpy.types.Object,
                       tree: bpy.types.GeometryNodeTree) -> bpy.types.NodesModifier:
    mod = obj.modifiers.new("WaveDisplace", "NODES")
    mod.node_group = tree

    # Set socket default values via identifier key (Blender 4.0+ modifier API)
    def sid(label: str) -> str:
        """Return the socket identifier for the named group-input socket."""
        return next(
            s.identifier for s in tree.interface.items_tree
            if s.name == label and s.in_out == 'INPUT' and s.item_type == 'SOCKET'
        )

    mod[sid("Noise Scale")]    = NOISE_SCALE
    mod[sid("Noise Strength")] = NOISE_STRENGTH
    return mod


# ── E: Camera + render setup ──────────────────────────────────────────────────
def setup_render(scene: bpy.types.Scene) -> None:
    scene.frame_start = 1
    scene.frame_end   = ANIM_FRAMES
    scene.render.fps  = 24

    # Orthographic camera looking down at the XY plane of the GP3 strokes
    bpy.ops.object.camera_add(location=(0.0, 0.0, 4.0))
    cam = bpy.context.active_object
    cam.data.type            = 'ORTHO'
    cam.data.ortho_scale     = 4.0  # 4-metre wide canvas fits all three rings
    scene.camera             = cam

    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.resolution_percentage = 100
    # Transparent background so strokes sit cleanly on any composited surface
    scene.render.film_transparent = True

    # World: dark grey to show the navy ink clearly in viewport
    scene.world = bpy.data.worlds.new("wave_world")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value  = (0.06, 0.06, 0.08, 1.0)
    bg.inputs["Strength"].default_value = 1.0


# ── F: Run ────────────────────────────────────────────────────────────────────
def run() -> None:
    reset_scene()
    scene = bpy.context.scene

    mat = make_ink_material("mat_ink_navy", INK_COLOUR)
    obj = build_gp_object(mat)
    tree = build_gn_tree()
    apply_gn_modifier(obj, tree)

    setup_render(scene)

    os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_SAVE))
    print(f"[blueprint] saved → {BLEND_SAVE}")


if __name__ == "__main__":
    run()
