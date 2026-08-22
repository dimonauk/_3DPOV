"""
GN Duplicate Elements — Edge Domain Fins: Geometric Spike Shell
Blender 5.1 | CC0 | Holoflow Studio

WHY Duplicate Elements instead of Extrude Mesh on the original?
  Duplicate Elements (Edge domain) copies each edge into a disconnected
  2-vertex segment and preserves every named attribute on those edges.
  Extrude Mesh on the original would fuse fin quads to the sphere body,
  collapsing fins and body into one mesh island and preventing independent
  material assignment. The Duplicate → Extrude → Join pattern keeps the
  body mesh pristine.

WHY store the fin direction before duplication?
  After duplication there are no adjacent faces on the copy — they are bare
  edge segments. The Normal node would return zero vectors on a faceless
  mesh. By running FieldOnDomain(Normal, Face→Edge) on the ORIGINAL mesh
  and storing the result as "fin_dir" before duplicating, we carry face
  normals through the copy intact.

Outside source:
  Blender Manual — Duplicate Elements Node (CC-BY-SA-4.0, Blender Docs Team)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/
          geometry/duplicates/duplicate_elements.html

  blender-scripting (MIT) Nikolai Janakiev
  https://github.com/njanakiev/blender-scripting
"""
import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
OBJ_NAME    = "spike_sphere"
GN_TREE     = "GN_EdgeFins"
GLB_PATH    = "//gn_edge_fins_spike_sphere.glb"

SPHERE_SEGS  = 14     # horizontal cuts — low keeps each edge visible
SPHERE_RINGS = 10     # vertical cuts
SPHERE_RAD   = 1.0

FIN_HEIGHT   = 0.30   # base extrusion length (BU)
NOISE_SCALE  = 2.5    # spatial frequency of per-fin height variation
NOISE_DETAIL = 2.0
NOISE_ROUGH  = 0.55
NOISE_MIN    = 0.25   # remapped noise floor (fraction of FIN_HEIGHT)
NOISE_MAX    = 1.25   # remapped noise ceiling

BODY_COLOR   = (0.06, 0.06, 0.10, 1.0)   # dark navy body
FIN_COLOR    = (0.92, 0.30, 0.08, 1.0)   # warm orange fins
ROUGHNESS    = 0.55


# ── Scene setup ───────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in list(bpy.data.meshes):
        bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.materials):
        bpy.data.materials.remove(blk)
    for blk in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(blk)


# ── Materials ─────────────────────────────────────────────────────────────────
def make_mat(name: str, color: tuple, roughness: float = ROUGHNESS):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


# ── Geometry Node tree ────────────────────────────────────────────────────────
def build_gn_tree(mat_fin) -> bpy.types.NodeTree:
    nt = bpy.data.node_groups.new(GN_TREE, 'GeometryNodeTree')
    iface = nt.interface

    # Sockets on the modifier panel
    iface.new_socket("Geometry",    in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket("Geometry",    in_out='OUTPUT', socket_type='NodeSocketGeometry')
    s_h = iface.new_socket("Fin Height",  in_out='INPUT', socket_type='NodeSocketFloat')
    s_h.default_value, s_h.min_value, s_h.max_value = FIN_HEIGHT, 0.0, 2.0
    s_n = iface.new_socket("Noise Scale", in_out='INPUT', socket_type='NodeSocketFloat')
    s_n.default_value, s_n.min_value, s_n.max_value = NOISE_SCALE, 0.1, 20.0

    nd = nt.nodes
    lk = nt.links

    def add(typ, x, y):
        n = nd.new(typ)
        n.location = (x, y)
        return n

    gi  = add('NodeGroupInput',  -900,  0)
    go  = add('NodeGroupOutput',  900,  0)

    # ── 1. Evaluate face Normal averaged onto edge domain ─────────────────────
    #   FieldOnDomain takes a field value (face-domain Normal) and re-evaluates
    #   it on the edge domain by averaging the adjacent face contributions.
    #   FLOAT_VECTOR data_type exposes socket index 2 as the Vector input.
    normal = add('GeometryNodeInputNormal',  -680, 280)
    fod    = add('GeometryNodeFieldOnDomain', -480, 280)
    fod.data_type = 'FLOAT_VECTOR'
    fod.domain    = 'EDGE'
    lk.new(normal.outputs['Normal'], fod.inputs[2])   # idx 2 = Vector slot

    # ── 2. Store that edge-domain normal as "fin_dir" BEFORE duplicating ─────
    #   StoreNamedAttribute preserves the attribute through DuplicateElements.
    #   Domain must match: EDGE here so each edge copy carries its own vector.
    store = add('GeometryNodeStoreNamedAttribute', -260, 100)
    store.data_type = 'FLOAT_VECTOR'
    store.domain    = 'EDGE'
    lk.new(gi.outputs['Geometry'],  store.inputs['Geometry'])
    store.inputs['Name'].default_value = "fin_dir"
    lk.new(fod.outputs[0],          store.inputs['Value'])

    # ── 3. Duplicate Elements — Edge domain ───────────────────────────────────
    #   Outputs a mesh containing ONLY the duplicated edges (no faces, no body).
    #   Amount = 1 → one copy per edge.  "fin_dir" attribute survives intact.
    dup = add('GeometryNodeDuplicateElements', -40, 100)
    dup.domain = 'EDGE'
    lk.new(store.outputs['Geometry'], dup.inputs['Geometry'])
    dup.inputs['Amount'].default_value = 1

    # ── 4. Read fin_dir from the duplicated edges ─────────────────────────────
    named = add('GeometryNodeInputNamedAttribute', 180, 280)
    named.data_type = 'FLOAT_VECTOR'
    named.inputs['Name'].default_value = "fin_dir"

    # ── 5. Noise-varied fin height ────────────────────────────────────────────
    #   Noise Fac (0..1) remapped to (NOISE_MIN..NOISE_MAX) so no fin is zero.
    #   MULTIPLY_ADD computes:  Fac × (max − min) + min
    noise = add('ShaderNodeTexNoise', 180, -100)
    noise.noise_dimensions = '3D'
    noise.inputs['Detail'].default_value    = NOISE_DETAIL
    noise.inputs['Roughness'].default_value = NOISE_ROUGH
    lk.new(gi.outputs['Noise Scale'], noise.inputs['Scale'])

    remap = add('ShaderNodeMath', 380, -100)
    remap.operation = 'MULTIPLY_ADD'
    remap.inputs[1].default_value = NOISE_MAX - NOISE_MIN
    remap.inputs[2].default_value = NOISE_MIN
    lk.new(noise.outputs['Fac'], remap.inputs[0])

    mul_h = add('ShaderNodeMath', 560, -100)
    mul_h.operation = 'MULTIPLY'
    lk.new(remap.outputs['Value'], mul_h.inputs[0])
    lk.new(gi.outputs['Fin Height'], mul_h.inputs[1])

    # ── 6. Scale fin_dir vector by the varied height → extrusion offset ───────
    #   VectorMath SCALE: inputs[0]=Vector, inputs[3]=Scale (float)
    scale_v = add('ShaderNodeVectorMath', 560, 200)
    scale_v.operation = 'SCALE'
    lk.new(named.outputs['Attribute'], scale_v.inputs[0])
    lk.new(mul_h.outputs['Value'],     scale_v.inputs[3])

    # ── 7. Extrude each duplicated edge into a fin quad ───────────────────────
    #   mode=EDGES: sweeps each selected edge into a quad face.
    #   Offset carries both direction and magnitude (no separate Offset Scale).
    extrude = add('GeometryNodeExtrudeMesh', 560, 60)
    extrude.mode = 'EDGES'
    lk.new(dup.outputs['Geometry'],   extrude.inputs['Mesh'])
    lk.new(scale_v.outputs['Value'],  extrude.inputs['Offset'])

    # ── 8. Assign fin material via index 1 (slot added in object setup) ───────
    set_mat = add('GeometryNodeSetMaterial', 720, 60)
    set_mat.inputs['Material'].default_value = mat_fin
    lk.new(extrude.outputs['Mesh'], set_mat.inputs['Geometry'])

    # ── 9. Join original body + fin geometry ──────────────────────────────────
    join = add('GeometryNodeJoinGeometry', 860, 0)
    lk.new(gi.outputs['Geometry'],     join.inputs[0])
    lk.new(set_mat.outputs['Geometry'], join.inputs[0])
    lk.new(join.outputs['Geometry'],   go.inputs['Geometry'])

    return nt


# ── Object assembly ───────────────────────────────────────────────────────────
def build_scene():
    reset_scene()

    mat_body = make_mat("Mat_SpikeBody", BODY_COLOR)
    mat_fin  = make_mat("Mat_SpikeFin",  FIN_COLOR, roughness=0.45)

    # Low-poly UV sphere — 14 segs × 10 rings gives 140 quads + 28 tri poles
    # = 280 edges → 280 fin quads after duplication
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SPHERE_SEGS,
        ring_count=SPHERE_RINGS,
        radius=SPHERE_RAD,
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    # Flat shading — holoflow:facet aesthetic
    bpy.ops.object.shade_flat()

    # Assign body material to slot 0
    obj.data.materials.append(mat_body)

    # Build and apply GN modifier
    nt  = build_gn_tree(mat_fin)
    mod = obj.modifiers.new(name="EdgeFinGenerator", type='NODES')
    mod.node_group = nt

    # Light + camera for record.py / viewport renders
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.data.angle  = math.radians(5)

    bpy.ops.object.camera_add(location=(0, -4.5, 0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = cam

    return obj


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb(obj) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        use_selection=True,
        export_apply=True,                          # bake GN modifier
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials='EXPORT',
        export_yup=True,                            # +Y up for WebXR
    )
    print(f"[holoflow] GLB written → {bpy.path.abspath(GLB_PATH)}")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    obj = build_scene()
    export_glb(obj)
    print("[holoflow] blueprint complete — spike sphere ready.")
