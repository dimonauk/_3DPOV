"""
holoflow_macros/involute_gear.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reusable involute gear profile builder for Holoflow Studio scripts.

Usage:
    from holoflow_macros.involute_gear import build_gear_mesh, gear_radii
    me = build_gear_mesh(N=20)
    obj = bpy.data.objects.new("my_gear", me)
    bpy.context.collection.objects.link(obj)

Licence: CC0
"""

import bpy
import bmesh
import numpy as np


def gear_radii(N: int, m: float = 1.0, phi_deg: float = 20.0):
    """Return (r_p, r_b, r_a, r_f) for a standard full-depth spur gear."""
    phi = np.radians(phi_deg)
    r_p = m * N / 2
    r_b = r_p * np.cos(phi)
    r_a = r_p + m
    r_f = r_p - 1.25 * m
    return r_p, r_b, r_a, r_f


def involute_pt(r_b: float, t: float):
    """Cartesian point on the involute of base circle r_b at unwinding angle t."""
    return np.array([
        r_b * (np.cos(t) + t * np.sin(t)),
        r_b * (np.sin(t) - t * np.cos(t)),
    ])


def build_tooth_profile(N: int, m: float = 1.0, phi_deg: float = 20.0,
                         n_inv: int = 28, n_fillet: int = 8):
    """
    2-D tooth profile (both flanks + fillets) as numpy (k, 2) array.
    Tooth centreline along +Y.  Profile ordered clockwise around the tooth.
    """
    phi = np.radians(phi_deg)
    r_p, r_b, r_a, r_f = gear_radii(N, m, phi_deg)
    r_f_safe = max(r_f, r_b * 0.80)

    inv_phi = np.tan(phi) - phi
    alpha_p = np.pi / (2 * N)
    rot     = np.pi / 2 - (alpha_p + inv_phi)
    cos_r, sin_r = np.cos(rot), np.sin(rot)

    def rotate(pts):
        return np.column_stack([
            pts[:, 0] * cos_r - pts[:, 1] * sin_r,
            pts[:, 0] * sin_r + pts[:, 1] * cos_r,
        ])

    t_tip = float(np.sqrt(max((r_a / r_b)**2 - 1, 0)))
    ts = np.linspace(0.0, t_tip, n_inv)
    inv_r = rotate(np.array([involute_pt(r_b, t) for t in ts]))

    ang_right = np.arctan2(inv_r[-1, 0], inv_r[-1, 1])
    ang_left  = -ang_right
    tip_angs  = np.linspace(ang_right, ang_left, 6)
    tip_pts   = np.column_stack([r_a * np.sin(tip_angs), r_a * np.cos(tip_angs)])

    inv_l = np.column_stack([-inv_r[::-1, 0], inv_r[::-1, 1]])

    base_ang_r    = np.arctan2(inv_r[0, 0], inv_r[0, 1])
    gap_ang       = np.pi / N
    fillet_angs_r = np.linspace(gap_ang, base_ang_r, n_fillet)
    fillet_r = np.column_stack([r_f_safe * np.sin(fillet_angs_r),
                                 r_f_safe * np.cos(fillet_angs_r)])
    fillet_l = np.column_stack([-fillet_r[::-1, 0], fillet_r[::-1, 1]])

    return np.vstack([
        fillet_r[:-1],
        inv_r,
        tip_pts[1:-1],
        inv_l,
        fillet_l[1:],
    ])


def build_gear_mesh(N: int, m: float = 1.0, phi_deg: float = 20.0,
                    thickness: float = 2.5) -> bpy.types.Mesh:
    """
    Full 3-D spur gear mesh.  Returns an unlinked bpy.types.Mesh.
    Caller is responsible for linking to a collection.
    """
    profile       = build_tooth_profile(N, m, phi_deg)
    n_tooth       = len(profile)
    angular_pitch = 2.0 * np.pi / N

    all_verts = []
    for i in range(N):
        angle = i * angular_pitch
        ca, sa = np.cos(angle), np.sin(angle)
        for px, py in profile:
            all_verts.append((px * ca - py * sa, px * sa + py * ca, 0.0))

    front_count = len(all_verts)
    for rx, ry, _ in list(all_verts):
        all_verts.append((rx, ry, thickness))

    me = bpy.data.meshes.new(f"gear_{N}t")
    bm = bmesh.new()
    bv = [bm.verts.new(v) for v in all_verts]
    bm.verts.ensure_lookup_table()

    for ti in range(N):
        bf  = ti * n_tooth
        bb  = front_count + ti * n_tooth
        nf  = ((ti + 1) % N) * n_tooth
        nb  = front_count + ((ti + 1) % N) * n_tooth
        for pi in range(n_tooth):
            ni = (pi + 1) % n_tooth
            vf0 = bv[bf + pi]
            vb0 = bv[bb + pi]
            vf1 = bv[nf if ni == 0 else bf + ni]
            vb1 = bv[nb if ni == 0 else bb + ni]
            try:
                bm.faces.new([vf0, vf1, vb1, vb0])
            except ValueError:
                pass

    try:
        bm.faces.new([bv[i] for i in range(front_count)])
    except Exception:
        pass
    try:
        bm.faces.new([bv[front_count + i] for i in range(front_count - 1, -1, -1)])
    except Exception:
        pass

    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.update()
    return me
