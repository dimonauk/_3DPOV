"""
holoflow_macros.faceted_gem
============================
Reusable helper: generate a parametric brilliant-cut gem mesh + cel-refraction
material and optionally export to GLB.

Import from any Blender script or add-on panel:

    from holoflow_macros.faceted_gem import make_gem
    gem_obj = make_gem(n=8, colour=(0.12, 0.50, 1.0, 1.0), ior=1.77)

All geometry is built through the data API (no bpy.ops), so the function
is safe to call from any operator, background script, or modal context.
"""

import bpy
import bmesh
import math
from typing import Tuple

Colour = Tuple[float, float, float, float]


def _ring(radius: float, z: float, n: int, phase: float = 0.0):
    return [
        (radius * math.cos(2 * math.pi * i / n + phase),
         radius * math.sin(2 * math.pi * i / n + phase),
         z)
        for i in range(n)
    ]


def _gem_geometry(n, table_r, table_z, girdle_r, girdle_z,
                  pavilion_r, pavilion_z, culet_z):
    verts = (
        _ring(table_r,    table_z,    n) +  # 0..n-1
        _ring(girdle_r,   girdle_z,   n) +  # n..2n-1
        _ring(pavilion_r, pavilion_z, n) +  # 2n..3n-1
        [(0.0, 0.0, culet_z)]               # 3n (culet)
    )
    T = list(range(n))
    G = list(range(n,   2 * n))
    P = list(range(2*n, 3 * n))
    C = 3 * n
    faces = [list(reversed(T))]
    for i in range(n):
        faces.append([T[i], G[i], G[(i+1)%n], T[(i+1)%n]])
    for i in range(n):
        faces.append([G[i], P[i], P[(i+1)%n], G[(i+1)%n]])
    for i in range(n):
        faces.append([P[i], C, P[(i+1)%n]])
    return verts, faces


def _cel_material(name: str, colour: Colour, ior: float,
                  cel_stops=None) -> bpy.types.Material:
    """Build a Principled BSDF + Layer Weight Fresnel + CONSTANT ColorRamp material."""
    if cel_stops is None:
        cel_stops = [
            (0.00, (colour[0]*0.3, colour[1]*0.3, colour[2]*0.3, 1.0)),
            (0.55, colour),
            (0.82, (0.85, 0.95, 1.00, 1.0)),
        ]

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.surface_render_method = 'FORWARD'  # EEVEE Next; replaces blend_method
    mat.use_backface_culling   = False

    nt = mat.node_tree
    nt.nodes.clear()

    def node(kind, loc):
        n = nt.nodes.new(kind)
        n.location = loc
        return n

    out  = node('ShaderNodeOutputMaterial', (700, 0))
    mix  = node('ShaderNodeMixShader',      (480, 0))
    bsdf = node('ShaderNodeBsdfPrincipled', (220, 100))
    emit = node('ShaderNodeEmission',        (220, -160))
    lw   = node('ShaderNodeLayerWeight',    (-200, -80))
    ramp = node('ShaderNodeValToRGB',         (40, -80))

    bsdf.inputs['Base Color'].default_value          = colour
    bsdf.inputs['Roughness'].default_value           = 0.0
    bsdf.inputs['IOR'].default_value                 = ior
    bsdf.inputs['Transmission Weight'].default_value = 1.0

    emit.inputs['Color'].default_value    = (0.8, 0.95, 1.0, 1.0)
    emit.inputs['Strength'].default_value = 0.3
    lw.inputs['Blend'].default_value      = 0.45

    cr = ramp.color_ramp
    cr.interpolation = 'CONSTANT'
    cr.elements[0].position = cel_stops[0][0]
    cr.elements[0].color    = cel_stops[0][1]
    cr.elements[1].position = cel_stops[1][0]
    cr.elements[1].color    = cel_stops[1][1]
    cr.elements.new(cel_stops[2][0]).color = cel_stops[2][1]

    L = nt.links.new
    L(lw.outputs['Fresnel'],    ramp.inputs['Fac'])
    L(ramp.outputs['Color'],    mix.inputs['Fac'])
    L(bsdf.outputs['BSDF'],     mix.inputs[1])
    L(emit.outputs['Emission'], mix.inputs[2])
    L(mix.outputs['Shader'],    out.inputs['Surface'])

    return mat


def make_gem(
    n:           int   = 8,
    colour:      Colour = (0.12, 0.50, 1.00, 1.0),
    ior:         float = 1.77,
    table_r:     float = 0.38,
    table_z:     float = 0.55,
    girdle_r:    float = 1.00,
    girdle_z:    float = 0.00,
    pavilion_r:  float = 0.72,
    pavilion_z:  float = -0.48,
    culet_z:     float = -0.90,
    name:        str   = "gem",
    collection:  bpy.types.Collection = None,
) -> bpy.types.Object:
    """
    Create a faceted gem object in the given collection (or the active
    scene collection if None).  Returns the new bpy Object.
    """
    coll = collection or bpy.context.collection

    verts, faces = _gem_geometry(
        n, table_r, table_z, girdle_r, girdle_z,
        pavilion_r, pavilion_z, culet_z,
    )

    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts]
    for idx_list in faces:
        try:
            bm.faces.new([bm_verts[i] for i in idx_list])
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()

    mat = _cel_material(f"{name}_cel_refraction", colour, ior)
    obj.data.materials.append(mat)
    return obj
