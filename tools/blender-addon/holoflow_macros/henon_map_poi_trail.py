"""
holoflow_macros/henon_map_poi_trail.py
Reusable Hénon map orbit-to-NURBS factory for Holoflow Studio.
Blender 5.1 | CC0
"""

import bpy, math


def build_henon_poi_trail(
    a: float = 1.4,
    b: float = 0.3,
    transient: int = 500,
    orbit_n: int = 5400,
    trail_n: int = 3,
    scale: float = 0.55,
    z_lift: float = 0.35,
    period: int = 1800,
    bevel_r: float = 0.006,
    colours: list[tuple] | None = None,
    name_prefix: str = "hf_henon",
) -> list[bpy.types.Object]:
    """
    Iterate the Hénon map a=1.4, b=0.3 for transient + orbit_n steps,
    split into trail_n NURBS bevel curves lifted into 3D by a sinusoidal Z swing.

    Returns list of bpy.types.Object (one per trail segment).
    """
    if colours is None:
        colours = [(0.2, 0.9, 1.0, 1.0), (1.0, 0.4, 0.8, 1.0), (1.0, 0.85, 0.1, 1.0)]

    x, y = 0.1, 0.1
    for _ in range(transient):
        x, y = 1.0 - a * x * x + y, b * x

    pts: list[tuple[float, float, float]] = []
    for i in range(orbit_n):
        z = z_lift * math.sin(2.0 * math.pi * i / period)
        pts.append((x * scale, y * scale, z))
        x, y = 1.0 - a * x * x + y, b * x

    chunk = orbit_n // trail_n
    objects: list[bpy.types.Object] = []

    for k in range(trail_n):
        seg = pts[k * chunk: (k + 1) * chunk]
        cu = bpy.data.curves.new(f"{name_prefix}_trail_{k}", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = bevel_r
        cu.bevel_resolution = 3
        sp = cu.splines.new("NURBS")
        sp.points.add(len(seg) - 1)
        for idx, (px, py, pz) in enumerate(seg):
            sp.points[idx].co = (px, py, pz, 1.0)
        sp.use_endpoint_u = True
        sp.order_u = 4

        obj = bpy.data.objects.new(f"{name_prefix}_trail_{k}", cu)
        bpy.context.scene.collection.objects.link(obj)

        mat = bpy.data.materials.new(f"mat_{name_prefix}_trail_{k}")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = colours[k % len(colours)]
        emit.inputs["Strength"].default_value = 5.0
        out_ = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(emit.outputs["Emission"], out_.inputs["Surface"])
        cu.materials.append(mat)
        objects.append(obj)

    return objects
