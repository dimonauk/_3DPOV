"""
Hopf Fibration  S³→S²  —  Villarceau Circles, Stereographic Projection
==========================================================================
Source (equations — public domain as mathematical facts):
  Hopf, H. (1931). "Über die Abbildungen der dreidimensionalen Sphäre auf
  die Kugelfläche."  Mathematische Annalen 104:637–665.
  DOI: 10.1007/BF01457962   (original discovery — >90 years old, PD)

Reference:
  Lyons, D.W. (2003). "An Elementary Introduction to the Hopf Fibration."
  Mathematics Magazine 76(2):87–98.   https://faculty.lvc.edu/lyons/pubs/hopf.pdf

HOPF MAP  h: S³→S²
──────────────────
In quaternion notation q = a+bi+cj+dk ∈ S³ (|q|=1):
    h(q) = q · i · q*    (conjugate by the unit imaginary i)
In coordinates:
    h(a,b,c,d) = (2(ac+bd),  2(bc−ad),  a²+b²−c²−d²)

WHY QUATERNION? Unit quaternions double-cover SO(3) via q↦q·_·q*.
The Hopf map extracts the S²-valued direction from that action, making
the fibre structure (q and q·e^{it} giving the same h-value) explicit.

FIBRE PARAMETERISATION
─────────────────────
For base point p=(px,py,pz) ∈ S²:
    η = arccos(√((1+pz)/2))      colatitude of the "slice" in S³; η∈[0,π/2]
    ψ = arctan2(py,px)/2         half-azimuth; resolves to S¹ on the fibre
    q(t) = (cosη·cost,  cosη·sint,  sinη·cos(ψ+t),  sinη·sin(ψ+t))
Verify: h(q(t)) = (sin(2η)cosψ, sin(2η)sinψ, cos(2η)) = p  for all t.
The t parameter drops out — every t traces the same image point p.

STEREOGRAPHIC PROJECTION  π: S³\{n}→ℝ³
────────────────────────────────────────
Project from north pole n=(0,0,0,1) onto tangent space at the antipode:
    π(a,b,c,d) = (a/(1−d),  b/(1−d),  c/(1−d))
Great circles in S³ (which each fibre is) map to circles in ℝ³ — the
famous Villarceau circles, interlocking on nested Clifford tori.
SINGULARITY: the fibre over the south pole of S² lies on d=1 in S³
(where π blows up). We exclude |pz|>1−Z_MARGIN from the base distribution.

TOPOLOGY AT A GLANCE
─────────────────────
- Any two distinct Hopf fibres are either disjoint or form a Hopf link
  (linking number exactly 1).  No two fibres can intersect.
- Pre-image of a latitude circle on S² is a Clifford torus S¹×S¹ in S³,
  which projects to a conventional torus in ℝ³.
- Shape key SK_2Lat shows two such tori (at pz=±0.5) — they are linked.
"""

import bpy, bmesh
import numpy as np

# ─── Parameters ────────────────────────────────────────────────────────────────
OBJ_NAME  = "hf_hopf_poi"
PHI       = (1 + np.sqrt(5)) / 2   # golden ratio φ ≈ 1.618
N_BASE    = 16      # fibres in Basis config
N_PTS     = 64      # sample points per fibre circle
TUBE_SEGS = 8       # octagonal cross-section
TUBE_R    = 0.045   # tube radius in metres
Z_MARGIN  = 0.10    # exclude base pts with |pz|>1−Z_MARGIN
COL_LO    = np.array([0.18, 0.35, 0.82])   # cobalt  — negative-Z fibres
COL_HI    = np.array([0.98, 0.62, 0.10])   # amber   — positive-Z fibres

# ─── Hopf geometry ─────────────────────────────────────────────────────────────

def fibonacci_s2(n):
    """n equidistributed points on S² via golden-angle Fibonacci spiral.
    WHY this formula? Golden-angle accumulation (2π/φ²≈137.5°) is maximally
    irrational, so no two consecutive points share a meridional band.
    The result is the most uniform fixed-n covering of S² among spiral methods."""
    k   = np.arange(n)
    pz  = np.clip(1 - 2*(k+0.5)/n, -1+Z_MARGIN, 1-Z_MARGIN)
    phi = 2*np.pi*k / PHI**2
    r   = np.sqrt(1 - pz**2)
    return np.column_stack([r*np.cos(phi), r*np.sin(phi), pz])


def hopf_r3(base_pt):
    """Stereographic projection of the Hopf fibre over base_pt ∈ S².
    Returns (N_PTS, 3) — a circle in ℝ³."""
    px, py, pz = base_pt
    eta   = np.arccos(np.sqrt(np.clip((1+pz)/2, 0, 1)))
    psi   = np.arctan2(py, px) / 2
    t     = np.linspace(0, 2*np.pi, N_PTS, endpoint=False)
    a     = np.cos(eta)*np.cos(t)
    b     = np.cos(eta)*np.sin(t)
    c     = np.sin(eta)*np.cos(psi+t)
    d     = np.sin(eta)*np.sin(psi+t)
    denom = 1 - d          # stereographic denominator; safe because |pz|<1−Z_MARGIN
    return np.column_stack([a/denom, b/denom, c/denom])


def bishop_tube(pts):
    """Bishop parallel-transport tube around a closed curve pts (N_PTS,3).
    Returns (verts (N_PTS*TUBE_SEGS,3), faces list, z_per_vert array).
    Bishop frames are preferred over Frenet: Hopf circles in ℝ³ can have
    inflection points (zero curvature) near the stereographic expansion region,
    causing the Frenet normal to flip.  Bishop transport is twist-free."""
    n   = len(pts)
    # Central-difference tangents on closed curve
    T   = np.roll(pts,-1,axis=0) - np.roll(pts,1,axis=0)
    T  /= np.linalg.norm(T, axis=1, keepdims=True).clip(1e-12)
    # Seed normal ⊥ T[0]
    ref = np.array([0.,0.,1.]) if abs(T[0,2])<0.9 else np.array([1.,0.,0.])
    N0  = ref - np.dot(ref,T[0])*T[0];  N0 /= np.linalg.norm(N0)
    Ns  = np.empty((n,3));  Ns[0] = N0
    for i in range(1,n):
        ax = np.cross(T[i-1],T[i]);  sa = np.linalg.norm(ax);  ca = np.clip(np.dot(T[i-1],T[i]),-1,1)
        if sa<1e-10: Ns[i]=Ns[i-1]
        else:
            ax /= sa
            Ns[i] = ca*Ns[i-1] + sa*np.cross(ax,Ns[i-1]) + (1-ca)*np.dot(ax,Ns[i-1])*ax
    Bs  = np.array([np.cross(T[i],Ns[i]) for i in range(n)])
    ang = 2*np.pi*np.arange(TUBE_SEGS)/TUBE_SEGS
    ca2, sa2 = np.cos(ang), np.sin(ang)
    rings = (pts[:,None,:] + TUBE_R*(ca2[None,:,None]*Ns[:,None,:] +
                                      sa2[None,:,None]*Bs[:,None,:]))
    verts = rings.reshape(-1,3)
    faces = []
    for i in range(n):
        i1 = (i+1)%n
        for s in range(TUBE_SEGS):
            s1=(s+1)%TUBE_SEGS
            faces.append((i*TUBE_SEGS+s, i*TUBE_SEGS+s1,
                          i1*TUBE_SEGS+s1, i1*TUBE_SEGS+s))
    z_vals = np.tile(pts[:,2], (TUBE_SEGS,1)).T.reshape(-1)
    return verts, faces, z_vals


def build_config(base_pts):
    """Concatenate bishop tubes for all fibres. base_pts: (N_BASE,3)."""
    all_v, all_f, all_z = [], [], []
    vo = 0
    for bp in base_pts:
        v, f, z = bishop_tube(hopf_r3(bp))
        all_v.append(v)
        all_f.extend([(a+vo,b+vo,c+vo,d+vo) for a,b,c,d in f])
        all_z.append(z)
        vo += len(v)
    return np.concatenate(all_v), all_f, np.concatenate(all_z)


# ─── Four configurations ───────────────────────────────────────────────────────

def cfg_basis():
    return build_config(fibonacci_s2(N_BASE))


def cfg_cap_north():
    """SK_CapN: all base points mirrored to northern hemisphere (pz>0).
    Fibres near the equator of S² project to large rings in ℝ³ — you can
    see the progressive expansion from small polar circles outward."""
    pts = fibonacci_s2(N_BASE)
    pts[:,2] = np.abs(pts[:,2]) + 0.05    # fold south ↦ north
    pts /= np.linalg.norm(pts, axis=1, keepdims=True)
    pts[:,2] = pts[:,2].clip(-1+Z_MARGIN, 1-Z_MARGIN)
    return build_config(pts)


def cfg_equatorial():
    """SK_Equat: all base points near the equator (pz≈0).
    All N_BASE fibres become circles lying on the same torus (the Clifford
    torus at η=π/4, which projects to the √2 : 1 aspect-ratio torus in ℝ³).
    Each fibre is a Villarceau circle of that torus."""
    k   = np.arange(N_BASE)
    phi = 2*np.pi*k/PHI**2
    pz  = 0.10*np.sin(phi + 0.7)    # gentle ripple around equator
    r   = np.sqrt(np.clip(1-pz**2, 0, 1))
    pts = np.column_stack([r*np.cos(phi), r*np.sin(phi), pz])
    pts[:,2] = pts[:,2].clip(-1+Z_MARGIN, 1-Z_MARGIN)
    return build_config(pts)


def cfg_two_lat():
    """SK_2Lat: 8+8 base points on two latitude circles (pz=+0.5, pz=−0.5).
    The pre-image of each latitude circle under h is a Clifford torus in S³.
    After stereographic projection, the two tori are conventionally linked —
    topologically a Hopf link at the level of tori, not just circles."""
    h = N_BASE//2
    phi1 = 2*np.pi*np.arange(h)/h
    phi2 = 2*np.pi*np.arange(h)/h + np.pi/h   # offset second ring
    r50 = np.sqrt(1-0.5**2)
    pts1 = np.column_stack([r50*np.cos(phi1), r50*np.sin(phi1), np.full(h, 0.5)])
    pts2 = np.column_stack([r50*np.cos(phi2), r50*np.sin(phi2), np.full(h,-0.5)])
    return build_config(np.vstack([pts1, pts2]))


# ─── Blender build ─────────────────────────────────────────────────────────────

def colour_attr(mesh, z_vals):
    attr = mesh.color_attributes.new("Hopf_Z", 'FLOAT_COLOR', 'POINT')
    for i, z in enumerate(z_vals):
        t   = np.clip((z+2.5)/5.0, 0, 1)
        col = (1-t)*COL_LO + t*COL_HI
        attr.data[i].color = (col[0], col[1], col[2], 1.0)


def main():
    v0, f0, z0 = cfg_basis()
    v1, _,  _  = cfg_cap_north()
    v2, _,  _  = cfg_equatorial()
    v3, _,  _  = cfg_two_lat()

    # Remove old object if present
    if OBJ_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[OBJ_NAME], do_unlink=True)

    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bm = bmesh.new()
    bvs = [bm.verts.new(tuple(v)) for v in v0]
    bm.verts.ensure_lookup_table()
    for f in f0:
        try: bm.faces.new([bvs[i] for i in f])
        except Exception: pass
    bm.to_mesh(mesh);  bm.free();  mesh.update()

    for p in mesh.polygons: p.use_smooth = True
    colour_attr(mesh, z0)

    # Shape keys
    obj.shape_key_add(name="Basis", from_mix=False)
    for vi,c in enumerate(v0): mesh.shape_keys.key_blocks["Basis"].data[vi].co=tuple(c)

    for name, vs in [("SK_CapN", v1), ("SK_Equat", v2), ("SK_2Lat", v3)]:
        sk = obj.shape_key_add(name=name, from_mix=False)
        for vi,c in enumerate(vs): sk.data[vi].co = tuple(c)

    mat = bpy.data.materials.get("HopfFibre") or bpy.data.materials.new("HopfFibre")
    mat.use_nodes = True
    obj.data.materials.append(mat)
    print(f"[Hopf] {len(v0)} verts · {len(f0)} quads · {N_BASE} fibres")


main()
