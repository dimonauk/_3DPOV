"""
holoflow_macros/phyllotaxis_lattice.py
Reusable phyllotaxis golden-angle lattice generator.
Holoflow Studio | Blender 5.1 | CC0

Public API:
  floret_positions_disk(n, scale)  → list[(x, y)]
  floret_positions_torus(n, R, r)  → list[(pos, normal, tangent)]
  build_floret_mesh(name, positions, floret_r, floret_h, seg)  → bpy.types.Object
"""
import bpy, bmesh, math
from mathutils import Vector

PHI          = (1 + math.sqrt(5)) / 2
GOLDEN_ANGLE = 2 * math.pi / (PHI * PHI)   # ≈ 2.39996 rad


def floret_positions_disk(n_florets: int, scale: float = 0.086) -> list:
    """
    Return list of (x, y, tangent_x, tangent_y) for a Vogel sunflower disk.
    r = scale·√n, θ = (n-1)·golden_angle.
    """
    pts = []
    for n in range(1, n_florets + 1):
        r   = scale * math.sqrt(n)
        th  = (n - 1) * GOLDEN_ANGLE
        cx, cy = math.cos(th), math.sin(th)
        pts.append((r * cx, r * cy, cx, cy))
    return pts


def floret_positions_torus(n_florets: int,
                           r_major: float = 1.1,
                           r_minor: float = 0.38) -> list:
    """
    Return list of (pos, normal, tangent) Vectors for a torus golden lattice.
    v = n·α (azimuthal), u = n·α/φ (poloidal) — Weyl equidistribution.
    """
    pts = []
    for n in range(n_florets):
        v  = n * GOLDEN_ANGLE
        u  = n * GOLDEN_ANGLE / PHI
        sv, cv = math.sin(v), math.cos(v)
        su, cu = math.sin(u), math.cos(u)
        r_hat  = Vector((cv, sv, 0.0))
        pos    = r_major * r_hat + r_minor * (cu * r_hat + Vector((0, 0, su)))
        normal = (cu * r_hat + Vector((0, 0, su))).normalized()
        tang   = Vector((-sv, cv, 0.0))
        pts.append((pos, normal, tang))
    return pts


def _floret_bm(bm, pos, normal, tangent, radius, height, seg):
    n = normal.normalized()
    t = (tangent - tangent.dot(n) * n).normalized()
    b = n.cross(t)
    bot, top = [], []
    for i in range(seg):
        a   = 2 * math.pi * i / seg
        off = radius * (math.cos(a) * t + math.sin(a) * b)
        bot.append(bm.verts.new(pos + off))
        top.append(bm.verts.new(pos + off + height * n))
    bm.faces.new(bot[::-1])
    bm.faces.new(top)
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new([bot[i], bot[j], top[j], top[i]])


def build_disk_mesh(name: str, n_florets: int = 500,
                    scale: float = 0.086,
                    floret_r: float = 0.034,
                    floret_h: float = 0.013,
                    seg: int = 8) -> bpy.types.Object:
    """Build a phyllotaxis sunflower disk as a single BMesh object."""
    bm   = bmesh.new()
    z_up = Vector((0, 0, 1))
    for x, y, tx, ty in floret_positions_disk(n_florets, scale):
        _floret_bm(bm, Vector((x, y, 0.0)), z_up,
                   Vector((tx, ty, 0.0)), floret_r, floret_h, seg)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons: p.use_smooth = False
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_torus_mesh(name: str, n_florets: int = 300,
                     r_major: float = 1.1, r_minor: float = 0.38,
                     floret_r: float = 0.052,
                     floret_h: float = 0.018,
                     seg: int = 8) -> bpy.types.Object:
    """Build a phyllotaxis torus lattice as a single BMesh object."""
    bm = bmesh.new()
    for pos, normal, tang in floret_positions_torus(n_florets, r_major, r_minor):
        _floret_bm(bm, pos, normal, tang, floret_r, floret_h, seg)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons: p.use_smooth = False
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj
