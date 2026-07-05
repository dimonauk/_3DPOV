# holoflow_macros/mesh_attribute_writer.py
# Blender 5.1 | CC0
#
# Reusable helper: bulk-write mesh attributes via foreach_set.
# Import from any blueprint.py:
#   from holoflow_macros.mesh_attribute_writer import write_attr, read_attr

import array as _array


def write_attr(me, name: str, dtype: str, domain: str, values) -> None:
    """
    Create (or overwrite) a named attribute on a Blender mesh and
    bulk-write values via foreach_set.

    Parameters
    ----------
    me      : bpy.types.Mesh
    name    : attribute name as seen by Geometry Nodes Named Attribute node
    dtype   : Blender type string — 'FLOAT', 'INT', 'BOOLEAN',
              'FLOAT_VECTOR', 'FLOAT_COLOR', 'FLOAT2'
    domain  : 'POINT', 'EDGE', 'FACE', 'CORNER'
    values  : flat sequence — array.array, list, or numpy array.
              For multi-component types the buffer must be pre-flattened:
              FLOAT_COLOR → [r0,g0,b0,a0, r1,g1,b1,a1, ...]
              FLOAT_VECTOR → [x0,y0,z0, x1,y1,z1, ...]

    Raises
    ------
    ValueError  if an attribute with `name` already exists on the mesh
                (call me.attributes.remove(me.attributes[name]) first).
    """
    _PROP = {
        'FLOAT':        'value',
        'INT':          'value',
        'BOOLEAN':      'value',
        'FLOAT_VECTOR': 'vector',
        'FLOAT_COLOR':  'color',
        'FLOAT2':       'vector',
    }
    prop = _PROP.get(dtype)
    if prop is None:
        raise ValueError(f"Unknown attribute dtype: {dtype!r}")

    attr = me.attributes.new(name, dtype, domain)
    attr.data.foreach_set(prop, values)


def read_attr(me, name: str) -> _array.array:
    """
    Read all values of a named attribute into a flat array.array.
    The returned array uses 'f' (float) for FLOAT / FLOAT_VECTOR / FLOAT_COLOR
    and 'i' (int) for INT / BOOLEAN.

    Returns None if the attribute does not exist.
    """
    attr = me.attributes.get(name)
    if attr is None:
        return None

    _PROP = {
        'FLOAT':        ('value', 'f', 1),
        'INT':          ('value', 'i', 1),
        'BOOLEAN':      ('value', 'i', 1),
        'FLOAT_VECTOR': ('vector', 'f', 3),
        'FLOAT_COLOR':  ('color',  'f', 4),
        'FLOAT2':       ('vector', 'f', 2),
    }
    prop, typecode, stride = _PROP.get(attr.data_type, ('value', 'f', 1))
    n   = len(attr.data)
    buf = _array.array(typecode, [0] * (n * stride))
    attr.data.foreach_get(prop, buf)
    return buf


def aggregate_point_to_face(me, point_vals: _array.array) -> _array.array:
    """
    Average a POINT-domain float attribute to the FACE domain by reading
    loop topology via three C-level foreach_get calls.

    Parameters
    ----------
    me          : bpy.types.Mesh (not in edit mode)
    point_vals  : flat array.array('f') of length len(me.vertices)

    Returns
    -------
    array.array('f') of length len(me.polygons)
    """
    npoly = len(me.polygons)
    nloop = len(me.loops)

    lv = _array.array('i', [0] * nloop)
    ls = _array.array('i', [0] * npoly)
    lt = _array.array('i', [0] * npoly)
    me.loops.foreach_get("vertex_index", lv)
    me.polygons.foreach_get("loop_start",  ls)
    me.polygons.foreach_get("loop_total",  lt)

    face_vals = _array.array('f', [0.0] * npoly)
    for fi in range(npoly):
        s, t = ls[fi], lt[fi]
        face_vals[fi] = sum(point_vals[lv[s + k]] for k in range(t)) / t
    return face_vals
