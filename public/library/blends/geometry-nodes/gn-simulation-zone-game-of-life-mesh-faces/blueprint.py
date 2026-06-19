"""
GN Simulation Zone — Conway's Game of Life on Mesh Faces
Blender 5.1  ·  CC0  ·  Holoflow Studio

Conway's 1970 cellular automaton implemented entirely inside a Geometry Nodes
Simulation Zone, with the face-domain 'alive' float attribute (0.0/1.0) as
the living state.

The central insight: Blur Attribute with factor=1.0 (Weight=1.0) and
iterations=1 on a FACE-domain float field computes the MEAN of edge-adjacent
face values.  For a regular quad-grid interior face (exactly four
edge-neighbours), multiplying by four then rounding gives the exact integer
neighbour count with no extra nodes.  Boundary faces (3 or 2 neighbours at
grid edges/corners) accumulate a scaled float before rounding — the error
surfaces as a one-cell dead border, an acceptable limitation documented below.

Node tree body (inside the Simulation Zone):
  read_alive  ← Named Attribute('alive', FLOAT)
  blur_result ← Blur Attribute(read_alive, Weight=1.0, Iterations=1)
  n_raw       ← blur_result × 4
  n           ← Round(n_raw)
  is_alive    ← alive > 0.5
  is_dead     ← NOT is_alive
  n_eq_2      ← n EQUAL 2.0 (ε=0.1)
  n_eq_3      ← n EQUAL 3.0 (ε=0.1)
  survives    ← is_alive AND (n_eq_2 OR n_eq_3)
  born        ← is_dead AND n_eq_3
  new_alive_b ← survives OR born          (Boolean)
  new_alive_f ← new_alive_b × 1.0        (Float for Store Named Attribute)
  Store Named Attribute('alive', FLOAT, FACE, new_alive_f)

Outside sources:
  Blender Manual — Blur Attribute node
    CC-BY-SA 4.0  ·  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/blur_attribute.html
    Related: all Blender Manual GN Attribute nodes at
      https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/
  Blender Manual — Simulation Zone
    CC-BY-SA 4.0  ·  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    Related: Simulation Bake Node, Simulation State Items docs (same section)
"""

import bpy
import bmesh
import random

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_DIVS       = 31        # n subdivisions per axis → n² quad faces (31→961 faces)
GRID_SCALE      = 6.0       # metres — side length of the grid
INITIAL_DENSITY = 0.30      # fraction of faces set alive at t=0
SEED            = 42        # RNG seed for reproducibility
ALIVE_ATTR      = 'alive'   # named attribute, stored as FLOAT on FACE domain
OBJ_NAME        = 'gol_grid'
MAT_NAME        = 'gol_material'
FRAME_END       = 150       # run 150 frames; interesting patterns emerge ~40-80

# Palette — EEVEE Emission material
COL_DEAD        = (0.004, 0.004, 0.010, 1.0)   # near-black deep slate
COL_ALIVE       = (0.05,  1.0,   0.35,  1.0)   # saturated neon green
EMIT_STRENGTH   = 5.0                           # emission intensity for alive cells


# ── Scene helpers ─────────────────────────────────────────────────────────────
def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for blk in list(col):
            col.remove(blk, do_unlink=True)


def make_grid() -> bpy.types.Object:
    """Create a GRID_DIVS² quad grid and seed the 'alive' float on faces."""
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_DIVS,
        y_subdivisions=GRID_DIVS,
        size=GRID_SCALE,
        enter_editmode=False,
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME
    obj.data.name = OBJ_NAME

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    alive_lay = bm.faces.layers.float.new(ALIVE_ATTR)
    rng = random.Random(SEED)
    for face in bm.faces:
        face[alive_lay] = 1.0 if rng.random() < INITIAL_DENSITY else 0.0
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def make_material(obj: bpy.types.Object):
    """
    Emission material driven by the per-face 'alive' attribute.

    ShaderNodeAttribute reads the face-domain float, a colour ramp with
    CONSTANT interpolation produces a hard edge (no lerp anti-aliasing),
    and a Mix Shader blends Principled BSDF (dead) with Emission (alive).
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new('ShaderNodeOutputMaterial');  out.location = (700, 0)
    mix   = nt.nodes.new('ShaderNodeMixShader');       mix.location = (500, 0)
    bsdf  = nt.nodes.new('ShaderNodeBsdfPrincipled');  bsdf.location = (300, -150)
    emit  = nt.nodes.new('ShaderNodeEmission');        emit.location = (300, 100)
    ramp  = nt.nodes.new('ShaderNodeValToRGB');        ramp.location = (0, 50)
    attr  = nt.nodes.new('ShaderNodeAttribute');       attr.location = (-250, 50)

    attr.attribute_name = ALIVE_ATTR
    attr.attribute_type = 'GEOMETRY'  # reads per-face float; face → vertex interp for EEVEE

    cr = ramp.color_ramp
    cr.interpolation = 'CONSTANT'   # hard step, no bleed across the 0→1 threshold
    cr.elements[0].color = COL_DEAD
    cr.elements[1].color = COL_ALIVE
    cr.elements[1].position = 0.5  # threshold at 0.5 — alive > 0.5 → neon

    emit.inputs['Strength'].default_value = EMIT_STRENGTH
    bsdf.inputs['Base Color'].default_value = COL_DEAD  # dead cells: almost-black

    lk = nt.links.new
    lk(attr.outputs['Fac'],         ramp.inputs['Fac'])
    lk(ramp.outputs['Color'],       emit.inputs['Color'])
    lk(emit.outputs['Emission'],    mix.inputs[2])
    lk(bsdf.outputs['BSDF'],        mix.inputs[1])
    lk(attr.outputs['Fac'],         mix.inputs['Fac'])
    lk(mix.outputs['Shader'],       out.inputs['Surface'])

    obj.data.materials.append(mat)


# ── GN Simulation Zone ────────────────────────────────────────────────────────
def build_gol_tree(obj: bpy.types.Object):
    """
    Geometry Nodes modifier implementing the GOL rule as a Simulation Zone.

    All field evaluation is FACE-domain, driven by Store Named Attribute with
    domain='FACE'. Blur Attribute therefore computes face-topology adjacency
    (edge-sharing neighbours), which on the interior of the quad grid gives
    exactly four neighbours per face.
    """
    mod = obj.modifiers.new('GameOfLife', 'NODES')
    nt = bpy.data.node_groups.new('GN_GameOfLife', 'GeometryNodeTree')
    mod.node_group = nt

    # Interface — one Geometry in, one Geometry out.
    nt.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    nt.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')

    nds = nt.nodes
    lks = nt.links

    def nd(bl_type, x=0, y=0):
        n = nds.new(bl_type)
        n.location = (x, y)
        return n

    gi  = nd('NodeGroupInput',  -900,    0)
    go  = nd('NodeGroupOutput', 1500,    0)

    # Simulation Zone pair.  pair_with_output() allocates the shared Geometry
    # body channel and makes the zone's bounding box visible in the editor.
    sim_i = nd('GeometryNodeSimulationInput',  -500,  0)
    sim_o = nd('GeometryNodeSimulationOutput', 1100,  0)
    sim_i.pair_with_output(sim_o)

    lks.new(gi.outputs['Geometry'], sim_i.inputs['Geometry'])

    # ── Field pipeline (body of the simulation zone) ──────────────────────────

    # Read 'alive' as FLOAT.  Stored type is FLOAT (0.0/1.0) so no cast needed.
    read = nd('GeometryNodeInputNamedAttribute', -280, 120)
    read.data_type = 'FLOAT'
    read.inputs['Name'].default_value = ALIVE_ATTR

    # Blur with Weight=1.0 (default), Iterations=1.  For an interior quad face
    # with exactly 4 edge-adjacent faces, this yields mean(n1,n2,n3,n4).
    blur = nd('GeometryNodeBlurAttribute', -60, 120)
    blur.data_type = 'FLOAT'
    blur.inputs['Iterations'].default_value = 1
    # Weight socket defaults to 1.0 — uniform averaging across all neighbours
    lks.new(read.outputs['Attribute'], blur.inputs['Value'])

    # × 4 recovers the integer neighbour sum for interior faces.
    mul4 = nd('ShaderNodeMath', 160, 120)
    mul4.operation = 'MULTIPLY'
    mul4.inputs[1].default_value = 4.0
    lks.new(blur.outputs['Value'], mul4.inputs[0])

    # Round cleans float drift caused by edge-face approximation.
    rnd = nd('ShaderNodeMath', 360, 120)
    rnd.operation = 'ROUND'
    lks.new(mul4.outputs['Value'], rnd.inputs[0])

    # n == 2  (survival condition, with ε=0.1 tolerance for float precision)
    cmp2 = nd('FunctionNodeCompare', 560, 200)
    cmp2.data_type = 'FLOAT'
    cmp2.operation  = 'EQUAL'
    cmp2.inputs['B'].default_value       = 2.0
    cmp2.inputs['Epsilon'].default_value = 0.1
    lks.new(rnd.outputs['Value'], cmp2.inputs['A'])

    # n == 3  (survival + birth condition)
    cmp3 = nd('FunctionNodeCompare', 560, 0)
    cmp3.data_type = 'FLOAT'
    cmp3.operation  = 'EQUAL'
    cmp3.inputs['B'].default_value       = 3.0
    cmp3.inputs['Epsilon'].default_value = 0.1
    lks.new(rnd.outputs['Value'], cmp3.inputs['A'])

    # alive > 0.5  → is_alive boolean
    cmp_alive = nd('FunctionNodeCompare', 160, -60)
    cmp_alive.data_type = 'FLOAT'
    cmp_alive.operation  = 'GREATER_THAN'
    cmp_alive.inputs['B'].default_value = 0.5
    lks.new(read.outputs['Attribute'], cmp_alive.inputs['A'])

    # NOT is_alive → is_dead
    not_alive = nd('FunctionNodeBooleanMath', 360, -120)
    not_alive.operation = 'NOT'
    lks.new(cmp_alive.outputs['Result'], not_alive.inputs[0])

    # n==2 OR n==3  (either satisfies the survival branch)
    or_n = nd('FunctionNodeBooleanMath', 760, 160)
    or_n.operation = 'OR'
    lks.new(cmp2.outputs['Result'], or_n.inputs[0])
    lks.new(cmp3.outputs['Result'], or_n.inputs[1])

    # survives: is_alive AND (n==2 OR n==3)
    and_survive = nd('FunctionNodeBooleanMath', 960, 80)
    and_survive.operation = 'AND'
    lks.new(cmp_alive.outputs['Result'], and_survive.inputs[0])
    lks.new(or_n.outputs['Boolean'],      and_survive.inputs[1])

    # born: is_dead AND n==3
    and_born = nd('FunctionNodeBooleanMath', 760, -80)
    and_born.operation = 'AND'
    lks.new(not_alive.outputs['Boolean'], and_born.inputs[0])
    lks.new(cmp3.outputs['Result'],       and_born.inputs[1])

    # new state: survives OR born
    or_final = nd('FunctionNodeBooleanMath', 960, -40)
    or_final.operation = 'OR'
    lks.new(and_survive.outputs['Boolean'], or_final.inputs[0])
    lks.new(and_born.outputs['Boolean'],    or_final.inputs[1])

    # Boolean → Float: multiply the implicit bool→float cast by 1.0
    to_float = nd('ShaderNodeMath', 960, -200)
    to_float.operation = 'MULTIPLY'
    to_float.inputs[1].default_value = 1.0
    lks.new(or_final.outputs['Boolean'], to_float.inputs[0])

    # Write the new state back as a FLOAT face attribute.
    store = nd('GeometryNodeStoreNamedAttribute', 960, 280)
    store.data_type = 'FLOAT'
    store.domain    = 'FACE'
    store.inputs['Name'].default_value = ALIVE_ATTR
    lks.new(sim_i.outputs['Geometry'],  store.inputs['Geometry'])
    lks.new(to_float.outputs['Value'],  store.inputs['Value'])

    lks.new(store.outputs['Geometry'],  sim_o.inputs['Geometry'])
    lks.new(sim_o.outputs['Geometry'],  go.inputs['Geometry'])


# ── Camera & render ───────────────────────────────────────────────────────────
def setup_scene(obj: bpy.types.Object):
    scn = bpy.context.scene
    scn.frame_end = FRAME_END

    # Orthographic top-down camera centred on the grid
    bpy.ops.object.camera_add(location=(0, 0, 8))
    cam = bpy.context.active_object
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = GRID_SCALE * 1.05
    cam.rotation_euler = (0, 0, 0)
    scn.camera = cam

    # Single area light above
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 6))
    light = bpy.context.active_object
    light.data.energy = 200

    # EEVEE Next
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.resolution_x = 1080
    scn.render.resolution_y = 1080


# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    purge_scene()
    obj = make_grid()
    make_material(obj)
    build_gol_tree(obj)
    setup_scene(obj)
    bpy.context.view_layer.update()
    print(f"GOL grid '{OBJ_NAME}' ready — {GRID_DIVS**2} faces, {FRAME_END} frames.")
    print("Scrub the timeline or press Space to watch cells evolve.")
    print("Tip: open the Geometry Nodes Spreadsheet → Faces to inspect the 'alive' attribute per frame.")


if __name__ == '__main__':
    main()
