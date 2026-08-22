# Blueprint: Python Mesh Attribute API — foreach_set / foreach_get
# Blender 5.1 | Holoflow Studio | CC0
#
# TECHNIQUE OVERVIEW
# ------------------
# bpy.types.Mesh.attributes is the Blender 3.x+ attribute system, stable
# in Blender 5.1: typed data attached to any geometric domain (POINT, EDGE,
# FACE, CORNER). Python's foreach_set / foreach_get bypass per-element bpy
# prop iteration and write directly to the underlying C arrays.
#
# For 1000+ elements, foreach_set is 50–500× faster than a Python for-loop
# over me.vertices or me.polygons. The named attributes produced here are
# immediately readable by Geometry Nodes via the Named Attribute node and
# by the holoflow WebXR runtime as vertex streams once declared as GLTF extras.
#
# This blueprint:
#   1. Builds a triangulated icosphere via BMesh (no operator context)
#   2. Reads all vertex Y coords in one C-level call → normalises to altitude
#   3. Writes FLOAT 'altitude' per VERTEX via foreach_set
#   4. Writes BOOLEAN 'is_peak' per VERTEX
#   5. Aggregates vertex altitude to FACE domain via loop topology reads
#   6. Writes INT 'biome_id' and FLOAT_COLOR 'face_colour' per FACE
#   7. Validates writes via foreach_get
#   8. Exports GLB with active colour attribute as COLOR_0

import bpy, bmesh, array

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG           = "attribute_planet"
SUBDIVISIONS   = 4       # → 642 vertices, 1280 triangular faces
PEAK_THRESHOLD = 0.72    # normalised altitude; top ~28 % becomes ice cap
EXPORT_PATH    = "//attribute_planet.glb"

# Linear RGBA per biome (0=ice, 1=rock, 2=grassland, 3=desert)
BIOME_PALETTE = {
    0: (0.35, 0.80, 1.00, 1.0),
    1: (0.50, 0.45, 0.38, 1.0),
    2: (0.18, 0.60, 0.12, 1.0),
    3: (0.92, 0.58, 0.08, 1.0),
}

# ── SCENE RESET ──────────────────────────────────────────────────────────────

def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)

# ── BUILD MESH ───────────────────────────────────────────────────────────────

def build_icosphere() -> tuple:
    """
    BMesh avoids bpy.ops context requirements — the mesh is owned
    immediately by Python, no active-area checks required.
    triangulate() ensures loop_total == 3 for every face, making the
    POINT→FACE aggregation pass constant-time per face.
    """
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=SUBDIVISIONS, radius=1.0)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.verts.ensure_lookup_table()

    me = bpy.data.meshes.new(SLUG)
    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj, me

# ── VERTEX-DOMAIN ATTRIBUTES ─────────────────────────────────────────────────

def write_altitude(me) -> array.array:
    """
    foreach_get("co") returns all vertex coordinates flat: [x0,y0,z0, x1,...].
    Buffer must be pre-allocated to exactly vertex_count × 3 floats.
    foreach_set / foreach_get accept any object with the buffer protocol:
    array.array, bytes, numpy arrays, or plain Python lists (lists are
    slowest — no direct C buffer, requires element-by-element boxing).
    """
    n = len(me.vertices)
    co = array.array('f', [0.0] * (n * 3))
    me.vertices.foreach_get("co", co)       # one C call for all verts

    ys  = array.array('f', (co[i * 3 + 1] for i in range(n)))
    lo, hi = min(ys), max(ys)
    alt = array.array('f', ((y - lo) / (hi - lo) for y in ys))

    attr = me.attributes.new("altitude", 'FLOAT', 'POINT')
    attr.data.foreach_set("value", alt)
    return alt

def write_is_peak(me, alt: array.array):
    """
    BOOLEAN attributes use integer storage internally (int8).
    Passing array.array('i') is safe and slightly faster than Python bools.
    """
    flags = array.array('i', (1 if a >= PEAK_THRESHOLD else 0 for a in alt))
    attr = me.attributes.new("is_peak", 'BOOLEAN', 'POINT')
    attr.data.foreach_set("value", flags)

# ── FACE-DOMAIN ATTRIBUTES ────────────────────────────────────────────────────

def write_face_attributes(me, alt: array.array):
    """
    POINT→FACE aggregation: three C-level reads, then one Python loop
    with no bpy property lookups inside the body.

    Key topology facts:
      me.loops  — one entry per face corner (vertex); len = sum of all loop_totals
      me.loops["vertex_index"] — which vertex that corner references
      me.polygons["loop_start"] — index into me.loops where this face begins
      me.polygons["loop_total"] — number of corners in this face

    For a triangulated mesh loop_total == 3 for every face, so the inner
    sum is always over exactly three indices — essentially constant-time.
    """
    npoly = len(me.polygons)
    nloop = len(me.loops)

    lv = array.array('i', [0] * nloop)    # loop corner → vertex index
    ls = array.array('i', [0] * npoly)    # polygon → loop_start
    lt = array.array('i', [0] * npoly)    # polygon → loop_total
    me.loops.foreach_get("vertex_index", lv)
    me.polygons.foreach_get("loop_start", ls)
    me.polygons.foreach_get("loop_total", lt)

    face_alt = array.array('f', [0.0] * npoly)
    for fi in range(npoly):
        s, t = ls[fi], lt[fi]
        face_alt[fi] = sum(alt[lv[s + k]] for k in range(t)) / t

    # Classify into four biome zones by altitude threshold
    biome = array.array('i', [
        0 if a < 0.20 else
        1 if a < 0.50 else
        2 if a < 0.75 else
        3
        for a in face_alt
    ])
    attr_b = me.attributes.new("biome_id", 'INT', 'FACE')
    attr_b.data.foreach_set("value", biome)

    # FLOAT_COLOR requires a FLAT buffer: [r0,g0,b0,a0, r1,g1,b1,a1, ...]
    # A list of tuples is NOT flat — extend() inside a loop is correct.
    colours = array.array('f', [])
    for b in biome:
        colours.extend(BIOME_PALETTE[b])
    attr_c = me.attributes.new("face_colour", 'FLOAT_COLOR', 'FACE')
    attr_c.data.foreach_set("color", colours)

    return biome

# ── VERIFY WITH foreach_get ──────────────────────────────────────────────────

def verify(me, biome: array.array):
    """
    foreach_get into a pre-allocated buffer of the correct size validates
    each write without re-entering edit mode or computing a depsgraph.
    Buffer length for scalar types = len(domain); for multi-component
    types = len(domain) × component_count.
    """
    n = len(me.vertices)
    p = len(me.polygons)

    alt_rb = array.array('f', [0.0] * n)
    me.attributes["altitude"].data.foreach_get("value", alt_rb)
    assert abs(min(alt_rb)) < 1e-5, "altitude min should be ~0"
    assert abs(max(alt_rb) - 1.0) < 1e-5, "altitude max should be ~1"

    bio_rb = array.array('i', [0] * p)
    me.attributes["biome_id"].data.foreach_get("value", bio_rb)
    assert all(0 <= b <= 3 for b in bio_rb), "biome out of expected range"

    peaks = sum(1 for v in me.attributes["is_peak"].data if v.value)
    print(f"[holoflow] verts={n} faces={p} peaks={peaks}")

# ── ACTIVE COLOUR FOR VIEWPORT + EXPORT ──────────────────────────────────────

def set_active_colour(me):
    """
    me.color_attributes is a filtered view of me.attributes containing only
    FLOAT_COLOR / BYTE_COLOR entries. Setting active_color_index marks that
    attribute as COLOR_0 in the GLTF export and as the active layer in
    Vertex Paint mode. The index is shared with the full me.attributes list.
    """
    for i, attr in enumerate(me.attributes):
        if attr.name == "face_colour":
            me.color_attributes.active_color_index = i
            break

# ── EXPORT ───────────────────────────────────────────────────────────────────

def export_glb(obj):
    """
    export_attributes=True (Blender 5.1) serialises supported custom attribute
    types as GLTF accessor channels. INT and BOOLEAN attributes are included
    as EXT_mesh_features feature IDs; FLOAT_COLOR exports as COLOR_0 when
    set as the active colour attribute via export_colors=True.
    """
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_attributes=True,
        export_image_format='WEBP',
    )

# ── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    purge_scene()
    obj, me = build_icosphere()
    alt    = write_altitude(me)
    write_is_peak(me, alt)
    biome  = write_face_attributes(me, alt)
    verify(me, biome)
    set_active_colour(me)
    export_glb(obj)
    print("[holoflow] attribute_planet complete.")

main()
