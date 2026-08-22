"""
GN Extrude Mesh — City Block: Per-Face Noise-Height Tower Extrusion
Blender 5.1 · CC0 · Holoflow Studio

GeometryNodeExtrudeMesh (mode='FACES', use_individual_faces=True) accepts a
per-face FLOAT field on its Offset Scale socket.  A White Noise Texture
evaluated in the FACE domain via Input Index gives each building lot an
independent height without any spatial correlation — the correct model for a
city block where parcel heights reflect economic variation, not geography.

Pipeline:
  Grid(10 m, 12×12 subdivisions) → 144 face lots
  WhiteNoiseH(W=face_index)           → MapRange → Offset Scale (0.5–6 m)
  WhiteNoiseP(W=face_index+SEED_PARK) → Compare(>0.25) → Selection (75% lots)
  ExtrudeMesh(FACES, Individual=True) → per-lot independent tower columns
  ext.Top  → SetMaterialIndex(2)      → hs_rooftop (new cap faces)
  ext.Side → SetMaterialIndex(1)      → hs_wall    (new side quads)
  remaining (park + ground) faces     → material index 0 = hs_ground
  → city_block.blend · city_block.glb (Draco 6, 3 materials)

The Individual flag is the key toggle.  Without it, adjacent selected faces
fuse their extrusions into one horizontal slab — like pushing a cookie cutter
upward.  With it, each face extrudes as its own isolated column along its own
face normal.  One boolean; entirely different topology.  Individual produces
4 new side-wall quads + 1 new top cap PER face.  Connected produces shared
side-wall strips with one top cap for the whole selected region.

Outside sources:
  Blender Manual — Extrude Mesh node (CC-BY-SA 4.0, Blender Foundation)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/extrude_mesh.html
  njanakiev/blender-scripting MIT · Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
    sibling: blender-jupyter MIT · njanakiev
  cityjson/cjio MIT · 3D Geoinformation, TU Delft
    https://github.com/cityjson/cjio
    sibling: cityjson/cityjson-spec CC-BY 4.0 · TU Delft
"""

import bpy

# ── Parameters ─────────────────────────────────────────────────────────────────
GRID_SIZE      = 10.0   # city block footprint, metres
GRID_RES       = 12     # face subdivisions per side → GRID_RES² = 144 lots
HEIGHT_MIN     = 0.5    # shortest tower (m) — minimum for visual presence
HEIGHT_MAX     = 6.0    # tallest tower (m) — 1:12 scale ratio for low-poly city
PARK_THRESHOLD = 0.25   # lots below this park-noise value are left unextruded
SEED_PARK      = 10000  # W offset for park noise — separates it from height range
                        # (height W range: 0..143; park W range: 10000..10143 — no overlap)

OBJ_NAME  = "hs_city_block"
NG_NAME   = "HS_CityBlock"
BLEND_OUT = "//city_block.blend"
GLB_OUT   = "//city_block.glb"


def _clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def _lk(ng, a, b):
    ng.links.new(a, b)


def _make_mats():
    """Three flat PBR materials: ground (green), wall (grey), rooftop (warm gold)."""
    specs = [
        ("hs_ground",  (0.05, 0.12, 0.05, 1.0)),
        ("hs_wall",    (0.50, 0.50, 0.55, 1.0)),
        ("hs_rooftop", (0.82, 0.72, 0.22, 1.0)),
    ]
    mats = []
    for name, col in specs:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = col
            bsdf.inputs["Roughness"].default_value  = 0.95
            bsdf.inputs["Metallic"].default_value   = 0.0
        mats.append(m)
    return mats


def build_gn_tree():
    """
    HS_CityBlock: per-face attribute-height tower extrusion.

    Domain note:
      ExtrudeMesh.Selection and .Offset_Scale are both evaluated in the FACE
      domain (because mode='FACES').  GeometryNodeInputIndex therefore returns
      the face index — one integer per face — giving White Noise one independent
      sample per building lot.  On a vertex-domain evaluation the same node
      would return vertex indices instead.  Domain is set by what the output
      ultimately feeds into, not by where in the tree the node lives.

    Seed separation:
      Height noise W: face_index         (range 0..143 for 12×12 grid)
      Park noise W:   face_index + 10000 (range 10000..10143)
      The two W ranges share no values → zero inter-attribute correlation.
      If SEED_PARK were 5 instead, face 5 would share W=10 for both height
      (index=10) and park (index=5 + seed=5 = 10), producing the same random
      value from both nodes — a spurious correlation making parks cluster near
      median-height towers.

    Top / Side outputs:
      Boolean fields that record which faces ExtrudeMesh *created*.  They
      remain valid as field inputs to nodes downstream in the same tree.
      SetMaterialIndex reads them as its Selection socket: only the matching
      newly-created faces receive the material index override.  Pre-existing
      faces (park lots and ground quads between towers) retain default index 0.
    """
    ng = bpy.data.node_groups.new(NG_NAME, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes

    in_n  = N.new('NodeGroupInput');  in_n.location  = (-1100,    0)
    out_n = N.new('NodeGroupOutput'); out_n.location  = (  850,    0)

    # ── Height field ─────────────────────────────────────────────────────────
    fi_h = N.new('GeometryNodeInputIndex'); fi_h.location = (-850, 280)

    wn_h = N.new('ShaderNodeTexWhiteNoise'); wn_h.location = (-650, 280)
    wn_h.noise_dimensions = '1D'   # 1D mode → only W socket active; hash(W) → Value [0,1)

    mr_h = N.new('ShaderNodeMapRange'); mr_h.location = (-420, 280)
    mr_h.clamp = True
    mr_h.inputs['From Min'].default_value = 0.0
    mr_h.inputs['From Max'].default_value = 1.0
    mr_h.inputs['To Min'].default_value   = HEIGHT_MIN
    mr_h.inputs['To Max'].default_value   = HEIGHT_MAX

    # ── Park selection field ──────────────────────────────────────────────────
    fi_p = N.new('GeometryNodeInputIndex'); fi_p.location = (-850, -220)

    add_p = N.new('ShaderNodeMath'); add_p.location = (-680, -220)
    add_p.operation = 'ADD'
    add_p.inputs[1].default_value = float(SEED_PARK)

    wn_p = N.new('ShaderNodeTexWhiteNoise'); wn_p.location = (-480, -220)
    wn_p.noise_dimensions = '1D'

    # park_val > PARK_THRESHOLD → True → "build a tower on this lot"
    cmp = N.new('FunctionNodeCompare'); cmp.location = (-280, -220)
    cmp.data_type = 'FLOAT'
    cmp.operation = 'GREATER_THAN'
    cmp.inputs['B'].default_value = PARK_THRESHOLD

    # ── Extrude Mesh ─────────────────────────────────────────────────────────
    ext = N.new('GeometryNodeExtrudeMesh'); ext.location = (-50, 0)
    ext.mode = 'FACES'
    # use_individual_faces=True: each face extrudes its own isolated column
    # along its own face normal.  False would merge adjacent selections into
    # one slab with shared walls — wrong for a city block with varied heights.
    ext.use_individual_faces = True

    # ── Material index assignment ─────────────────────────────────────────────
    # Apply rooftop first (Top = new cap faces), then wall (Side = new quads).
    # Both SetMaterialIndex nodes chain: roof writes to Top, wall writes to Side.
    # Top and Side are disjoint sets (a face cannot be both cap and side wall),
    # so order is conceptually irrelevant — but rooftop-first is easier to read.
    smi_roof = N.new('GeometryNodeSetMaterialIndex'); smi_roof.location = (200, 120)
    smi_roof.inputs['Material Index'].default_value = 2  # hs_rooftop

    smi_wall = N.new('GeometryNodeSetMaterialIndex'); smi_wall.location = (500,  0)
    smi_wall.inputs['Material Index'].default_value = 1  # hs_wall

    # ── Wiring ───────────────────────────────────────────────────────────────
    lk = lambda a, b: _lk(ng, a, b)

    lk(fi_h.outputs['Index'],         wn_h.inputs['W'])
    lk(wn_h.outputs['Value'],         mr_h.inputs['Value'])

    lk(fi_p.outputs['Index'],         add_p.inputs[0])
    lk(add_p.outputs['Value'],        wn_p.inputs['W'])
    lk(wn_p.outputs['Value'],         cmp.inputs['A'])

    lk(in_n.outputs['Geometry'],      ext.inputs['Mesh'])
    lk(cmp.outputs['Result'],         ext.inputs['Selection'])
    lk(mr_h.outputs['Result'],        ext.inputs['Offset Scale'])

    lk(ext.outputs['Mesh'],           smi_roof.inputs['Geometry'])
    lk(ext.outputs['Top'],            smi_roof.inputs['Selection'])

    lk(smi_roof.outputs['Geometry'],  smi_wall.inputs['Geometry'])
    lk(ext.outputs['Side'],           smi_wall.inputs['Selection'])

    lk(smi_wall.outputs['Geometry'],  out_n.inputs['Geometry'])
    return ng


def main():
    _clear()
    sc = bpy.context.scene
    col = bpy.data.collections.new("CityBlock")
    sc.collection.children.link(col)

    # Grid: GRID_RES subdivisions → GRID_RES² face lots on a GRID_SIZE² metre base.
    bpy.ops.mesh.primitive_grid_add(
        size=GRID_SIZE,
        x_subdivisions=GRID_RES,
        y_subdivisions=GRID_RES,
        location=(0, 0, 0),
    )
    ob = bpy.context.active_object
    ob.name = OBJ_NAME
    ob.data.name = OBJ_NAME
    sc.collection.objects.unlink(ob)
    col.objects.link(ob)

    mats = _make_mats()
    for m in mats:
        ob.data.materials.append(m)

    # Flat shading — faceted low-poly aesthetic matching the Holoflow studio palette.
    bpy.ops.object.shade_flat()

    ng  = build_gn_tree()
    mod = ob.modifiers.new("HS_CityBlock", 'NODES')
    mod.node_group = ng

    sc.world = bpy.data.worlds.new("World")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value    = (0.55, 0.70, 0.90, 1.0)
    bg.inputs['Strength'].default_value = 1.0

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))

    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[blueprint] saved → {BLEND_OUT} and {GLB_OUT}")


main()
