"""
Holoflow Studio — Blender 5.1
holoflow_macros/zone_smooth.py

Zone-selective vertex smoothing: apply bmesh.ops.smooth_vert (uniform
Laplacian) or bmesh.ops.smooth_laplacian_vert (cotangent Laplacian) to a
Z-height-bounded subset of a mesh's vertices without touching the rest.

Usage (in a blueprint or pipeline script):
    from holoflow_macros.zone_smooth import zone_smooth_vert, zone_smooth_laplacian

    bm = bmesh.new()
    bm.from_mesh(ob.data)
    # Relax bumpy mid-section
    zone_smooth_vert(bm, z_min=0.16, z_max=0.35, factor=0.5, iterations=5)
    # Volume-preserving polish on dome cap
    zone_smooth_laplacian(bm, z_min=0.35, z_max=float('inf'),
                          lambda_factor=0.5, lambda_border=0.2,
                          preserve_volume=True, iterations=3)
    bm.normal_update()
    bm.to_mesh(ob.data); bm.free()
"""

import bmesh


def zone_smooth_vert(
    bm: bmesh.types.BMesh,
    z_min: float,
    z_max: float,
    factor: float = 0.5,
    iterations: int = 3,
    mirror_clip_x: bool = False,
    clip_dist: float = 1e-5,
    use_axis_x: bool = True,
    use_axis_y: bool = True,
    use_axis_z: bool = True,
) -> list:
    """Uniform Laplacian relax on vertices in [z_min, z_max].

    Cheaper than smooth_laplacian_vert but shrinks mesh slightly with
    many iterations.  Good for blend zones and bump removal.

    Returns the list of vertices that were smoothed.
    """
    verts = [v for v in bm.verts if z_min < v.co.z <= z_max and v.link_faces]
    if not verts:
        return []
    for _ in range(iterations):
        bmesh.ops.smooth_vert(
            bm,
            verts=verts,
            factor=factor,
            mirror_clip_x=mirror_clip_x,
            mirror_clip_y=False,
            mirror_clip_z=False,
            clip_dist=clip_dist,
            use_axis_x=use_axis_x,
            use_axis_y=use_axis_y,
            use_axis_z=use_axis_z,
        )
    return verts


def zone_smooth_laplacian(
    bm: bmesh.types.BMesh,
    z_min: float,
    z_max: float,
    lambda_factor: float = 0.5,
    lambda_border: float = 0.2,
    preserve_volume: bool = True,
    iterations: int = 3,
    use_x: bool = True,
    use_y: bool = True,
    use_z: bool = True,
) -> list:
    """Cotangent-weighted Laplacian smooth on vertices in [z_min, z_max].

    Better shape preservation than zone_smooth_vert.  Use preserve_volume=True
    for organic meshes where overall scale matters (VRM skin, terrain).

    Returns the list of vertices that were smoothed.
    """
    verts = [v for v in bm.verts if z_min < v.co.z <= z_max and v.link_faces]
    if not verts:
        return []
    for _ in range(iterations):
        bmesh.ops.smooth_laplacian_vert(
            bm,
            verts=verts,
            lambda_factor=lambda_factor,
            lambda_border=lambda_border,
            use_x=use_x,
            use_y=use_y,
            use_z=use_z,
            preserve_volume=preserve_volume,
        )
    return verts
