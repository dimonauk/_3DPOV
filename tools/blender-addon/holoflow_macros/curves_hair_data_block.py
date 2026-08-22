"""
holoflow_macros/curves_hair_data_block.py
Holoflow Studio | CC0 | Blender 5.1

Factory for bpy.types.Curves hair data blocks built entirely from the direct
data API — no operator context required, safe for headless batch scripts.

Usage:
    from holoflow_macros.curves_hair_data_block import build_curves_hair

    hair_ob = build_curves_hair(
        surface_ob=bpy.data.objects['Head'],
        normals=fibonacci_upper_hemisphere(64),  # list of unit (nx,ny,nz)
        strand_length=0.22,
        seg_count=7,
        root_radius=0.005,
        tip_radius=0.0007,
        gravity=0.42,
        name='HF_HairStrands',
    )
"""

import bpy
import math
import numpy as np


def fibonacci_upper_hemisphere(
    n: int,
    cos_min: float = 0.12,
) -> list[tuple[float, float, float]]:
    """
    Deterministic even distribution of n unit normals on the upper hemisphere.
    cos_min restricts roots away from the equator.  No randomness — reproducible.
    """
    golden = (1.0 + math.sqrt(5.0)) / 2.0
    pts: list[tuple[float, float, float]] = []
    for i in range(n):
        cos_theta = 1.0 - (i + 0.5) / n * (1.0 - cos_min)
        sin_theta = math.sqrt(max(0.0, 1.0 - cos_theta * cos_theta))
        phi = 2.0 * math.pi * i / golden
        pts.append((sin_theta * math.cos(phi),
                    sin_theta * math.sin(phi),
                    cos_theta))
    return pts


def build_curves_hair(
    *,
    surface_ob: bpy.types.Object,
    normals: list[tuple[float, float, float]],
    surface_radius: float,
    strand_length: float = 0.22,
    seg_count: int = 7,
    root_radius: float = 0.005,
    tip_radius: float = 0.0007,
    gravity: float = 0.42,
    uv_map_name: str = "UVMap",
    name: str = "HF_HairStrands",
) -> bpy.types.Object:
    """
    Build a bpy.types.Curves object from a list of surface normal vectors.

    Each normal defines one guide strand root on the surface sphere.
    Strands grow outward along the normal, drooping by `gravity` toward -Z.

    Returns the new Object linked to the active Collection.
    """
    n_strands = len(normals)
    total_pts = n_strands * seg_count

    curves_data: bpy.types.Curves = bpy.data.curves.new(name, type='CURVES')
    curves_data.add_curves([seg_count] * n_strands)

    pos_flat = np.zeros(total_pts * 3, dtype=np.float32)
    rad_flat = np.zeros(total_pts,     dtype=np.float32)

    for si, (nx, ny, nz) in enumerate(normals):
        rx = nx * surface_radius
        ry = ny * surface_radius
        rz = nz * surface_radius
        for pi in range(seg_count):
            t  = pi / (seg_count - 1)
            g  = gravity * t * t
            dx = nx * (1.0 - g)
            dy = ny * (1.0 - g)
            dz = nz * (1.0 - g) - g
            mag = math.sqrt(dx * dx + dy * dy + dz * dz)
            if mag > 1e-8:
                dx /= mag; dy /= mag; dz /= mag
            arc = strand_length * t
            bi = (si * seg_count + pi) * 3
            pos_flat[bi]     = rx + dx * arc
            pos_flat[bi + 1] = ry + dy * arc
            pos_flat[bi + 2] = rz + dz * arc
            rad_flat[si * seg_count + pi] = (
                root_radius + (tip_radius - root_radius) * t)

    curves_data.attributes['position'].data.foreach_set('vector', pos_flat)
    rad_attr = curves_data.attributes.new('radius', 'FLOAT', 'POINT')
    rad_attr.data.foreach_set('value', rad_flat)

    # Surface UV per strand (equirectangular for sphere normals)
    uv_flat = np.zeros(n_strands * 2, dtype=np.float32)
    for si, (nx, ny, nz) in enumerate(normals):
        u = (math.atan2(ny, nx) / (2.0 * math.pi)) % 1.0
        v = math.acos(max(-1.0, min(1.0, nz))) / math.pi
        uv_flat[si * 2]     = u
        uv_flat[si * 2 + 1] = v
    suv = curves_data.attributes.new('surface_uv_coordinate', 'FLOAT2', 'CURVE')
    suv.data.foreach_set('vector', uv_flat)

    curves_data.surface = surface_ob
    curves_data.surface_uv_map = uv_map_name

    ob = bpy.data.objects.new(name, curves_data)
    bpy.context.collection.objects.link(ob)
    return ob


def export_curves_as_glb(
    hair_ob: bpy.types.Object,
    output_path: str,
    extra_obs: list[bpy.types.Object] | None = None,
) -> None:
    """
    Export a Curves object as a poly-line edge mesh GLB.
    Uses depsgraph evaluation — no operator context required.
    Cleans up temporary mesh after export.
    """
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    dg = bpy.context.evaluated_depsgraph_get()
    ev = hair_ob.evaluated_get(dg)
    strand_mesh = bpy.data.meshes.new_from_object(
        ev, preserve_all_data_layers=True, depsgraph=dg)
    strand_mesh.name = hair_ob.name + "_ExportMesh"
    export_ob = bpy.data.objects.new(strand_mesh.name, strand_mesh)
    bpy.context.collection.objects.link(export_ob)

    bpy.ops.object.select_all(action='DESELECT')
    export_ob.select_set(True)
    for ob in (extra_obs or []):
        ob.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )

    bpy.data.objects.remove(export_ob, do_unlink=True)
    bpy.data.meshes.remove(strand_mesh, do_unlink=True)
