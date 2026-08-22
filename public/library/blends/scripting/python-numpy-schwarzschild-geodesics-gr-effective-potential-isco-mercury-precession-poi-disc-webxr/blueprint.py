"""
Schwarzschild Geodesics — GR Effective Potential, ISCO & Precessing Rosette Poi Disc
Blender 5.1 | Holoflow Studio | CC0

Metric (G=c=M=1, equatorial plane θ=π/2, r_s=2):
  ds²=-(1-2/r)dt²+(1-2/r)⁻¹dr²+r²dφ²
  Conserved: E=(1-2/r)dt/dτ  L=r²dφ/dτ
  Effective potential: V_eff²=(1-2/r)(1+L²/r²)
  Force: d²r/dτ²=-1/r²+L²/r³-3L²/r⁴  (last term = GR correction)
  ISCO: r=6M, L_isco=√12≈3.464, E_isco=√(8/9)≈0.9428
  Mercury: Δφ≈6πM/[a(1-e²)]→43.0″/century ✓

Mesh: 36 geodesics (φ₀=k·2π/36), hex-tube, 3 shape keys.
"""

import math
import bpy
import bmesh
import numpy as np

# ─── Constants ────────────────────────────────────────────────────────────────
M           = 1.0                        # central mass (G=c=1 units)
R_S         = 2.0 * M                   # Schwarzschild radius
R_ISCO      = 6.0 * M                   # innermost stable circular orbit
L_ISCO      = math.sqrt(12.0) * M       # ≈ 3.464 — stability boundary

L_BASIS     = 3.70;  R0_BASIS     = 9.0   # basis orbit (moderate precession)
L_NEAR      = 3.54;  R0_NEAR      = 7.6   # near-ISCO (strong precession)
L_KEPLERIAN = 5.00;  R0_KEPLERIAN = 14.0  # quasi-Newtonian (tiny precession)

N_SPOKES    = 36     # geodesics per family
N_STEPS     = 3000   # RK4 integration steps per geodesic
DT          = 0.40   # proper-time step τ
SKIP        = 5      # subsample: keep every SKIP-th point

R_TUBE      = 0.08   # tube cross-section radius (Schwarzschild coord units)
N_SIDES     = 6      # hexagonal profile

SCALE       = 0.10   # Schwarzschild units → Blender metres (r_isco → 0.60 m)
OBJ_NAME    = "hf_schwarzschild_poi"
MAT_NAME    = "mat_schwarzschild_gr"

# ─── Physics ──────────────────────────────────────────────────────────────────
def radial_accel(r: float, L: float) -> float:
    """
    d²r/dτ² from the Schwarzschild radial force equation (M=1).
    Derivation: differentiate (dr/dτ)² = E²-V_eff² w.r.t. τ, divide by dr/dτ.
      = d/dr[-½·V_eff²] = −1/r² + L²/r³ − 3L²/r⁴
    The last term is the unique GR departure from Newtonian gravity.
    """
    r2 = r * r
    return -M / r2  +  L * L / (r2 * r)  -  3.0 * M * L * L / (r2 * r2)


def integrate_geodesic(r0: float, L: float, phi0: float):
    """
    RK4 integration of one equatorial Schwarzschild geodesic.
    State vector: s = [r, v_r, φ]  (v_r = dr/dτ)

    Starts at apoapsis (v_r=0), integrates until the orbit either
    plunges inside r_s+ε (capture) or escapes beyond r=250.

    Returns arrays (xs, ys, vTot) subsampled at rate SKIP.
    vTot[i] = local |velocity|² = v_r² + (r·dφ/dτ)² = v_r² + L²/r²
    used for vertex-colour speed mapping.
    """
    xs, ys, vtot = [], [], []
    s = np.array([r0, 0.0, phi0], dtype=float)

    def rhs(sv):
        rr, vv, pp = sv
        if rr <= R_S + 0.05:
            return np.zeros(3)
        return np.array([vv, radial_accel(rr, L), L / (rr * rr)])

    for step in range(N_STEPS):
        r, v_r, phi = s
        if r <= R_S + 0.05 or r > 250.0:
            break
        if step % SKIP == 0:
            xs.append(r * math.cos(phi))
            ys.append(r * math.sin(phi))
            vtot.append(v_r * v_r  +  L * L / (r * r))
        # Classical RK4
        k1 = rhs(s)
        k2 = rhs(s + 0.5 * DT * k1)
        k3 = rhs(s + 0.5 * DT * k2)
        k4 = rhs(s +       DT * k3)
        s += (DT / 6.0) * (k1 + 2.0*k2 + 2.0*k3 + k4)

    return np.array(xs), np.array(ys), np.array(vtot)

# ─── Tube geometry ────────────────────────────────────────────────────────────
def tube_mesh(xs, ys, r_tube=R_TUBE, n_sides=N_SIDES):
    """
    Sweep a hexagonal cross-section along a planar (z=0) curve.

    At each waypoint i, the local Frenet frame is:
      T = unit tangent in XY
      N = 90°-CCW rotation of T = in-plane normal  (-Ty, Tx, 0)
      B = binormal = (0, 0, 1)   [constant for a planar curve]

    Ring vertex j:  P_j = r_tube·(cos(2πj/n)·N  +  sin(2πj/n)·B)
    Quads stitch consecutive rings.  End caps are n-gon fans.
    """
    n = len(xs)
    if n < 2:
        return [], []
    verts, faces = [], []
    for i in range(n):
        # Tangent
        if i < n - 1:
            tx, ty = xs[i+1]-xs[i], ys[i+1]-ys[i]
        else:
            tx, ty = xs[i]-xs[i-1], ys[i]-ys[i-1]
        ln = max(math.hypot(tx, ty), 1e-10)
        tx, ty = tx/ln, ty/ln
        nx, ny = -ty, tx                           # in-plane normal

        for j in range(n_sides):
            θ  = 2.0 * math.pi * j / n_sides
            cθ, sθ = math.cos(θ), math.sin(θ)
            verts.append((
                SCALE * (xs[i]  +  r_tube * cθ * nx),
                SCALE * (ys[i]  +  r_tube * cθ * ny),
                SCALE * (        r_tube * sθ       ),
            ))
        if i > 0:
            b = (i - 1) * n_sides
            for j in range(n_sides):
                nj = (j + 1) % n_sides
                faces.append((b+j, b+nj, b+n_sides+nj, b+n_sides+j))

    faces.append(list(range(n_sides))[::-1])                        # start cap
    faces.append(list(range((n-1)*n_sides, n*n_sides)))             # end cap
    return verts, faces


def build_family(L, r0):
    """Integrate N_SPOKES geodesics and concatenate tube geometry."""
    all_v, all_f, all_spd, v_off = [], [], [], 0
    for k in range(N_SPOKES):
        xs, ys, spd = integrate_geodesic(r0, L, 2.0*math.pi*k/N_SPOKES)
        if len(xs) < 3:
            continue
        vv, ff = tube_mesh(xs, ys)
        all_v.extend(vv)
        all_f.extend([[i+v_off for i in f] for f in ff])
        for s in spd:
            all_spd.extend([s] * N_SIDES)          # one speed per ring × n_sides
        v_off += len(vv)
    return all_v, all_f, all_spd

# ─── Blender helpers ──────────────────────────────────────────────────────────
def hsv_to_rgb(h, s, v):
    """Inline HSV→RGB (avoids importing colorsys inside bpy)."""
    if s == 0.0:
        return v, v, v
    i = int(h * 6.0) % 6
    f = h * 6.0 - int(h * 6.0)
    p, q, t = v*(1-s), v*(1-s*f), v*(1-s*(1-f))
    return [(v,t,p),(q,v,p),(p,v,t),(p,q,v),(t,p,v),(v,p,q)][i]


def apply_vcol(obj, speeds):
    """Vertex colour layer 'GRSpeed': slow=blue → fast=red."""
    mesh = obj.data
    if not mesh.vertex_colors:
        mesh.vertex_colors.new(name="GRSpeed")
    col_layer = mesh.vertex_colors["GRSpeed"]
    mx = max(speeds) if speeds else 1.0
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vi = mesh.loops[li].vertex_index
            t  = speeds[vi] / mx if vi < len(speeds) else 0.0
            h  = (1.0 - t) * 0.67                   # blue→red
            r, g, b = hsv_to_rgb(h, 0.85, 0.92)
            col_layer.data[li].color = (r, g, b, 1.0)


def build_material():
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    N, L2 = mat.node_tree.nodes, mat.node_tree.links
    N.clear()
    out  = N.new("ShaderNodeOutputMaterial");  out.location  = (400,0)
    bsdf = N.new("ShaderNodeBsdfPrincipled");  bsdf.location = (80,0)
    vcol = N.new("ShaderNodeVertexColor");     vcol.location = (-200,0)
    vcol.layer_name = "GRSpeed"
    bsdf.inputs["Metallic"].default_value          = 0.0
    bsdf.inputs["Roughness"].default_value         = 0.35
    bsdf.inputs["Emission Strength"].default_value = 0.30
    L2.new(vcol.outputs["Color"],  bsdf.inputs["Base Color"])
    L2.new(vcol.outputs["Color"],  bsdf.inputs["Emission Color"])
    L2.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])
    return mat

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Clear
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Build basis family
    print(f"  Basis   L={L_BASIS}, r₀={R0_BASIS}  ({N_SPOKES} spokes × {N_STEPS} steps)")
    v_b, f_b, s_b = build_family(L_BASIS, R0_BASIS)
    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata(v_b, [], f_b)
    mesh.validate()
    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    apply_vcol(obj, s_b)
    mat = build_material()
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = False                      # faceted

    # Shape key – near-ISCO (tight precession)
    print(f"  SK_NearISCO  L={L_NEAR}, r₀={R0_NEAR}")
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_near = obj.shape_key_add(name="SK_NearISCO", from_mix=False)
    v_n, _, _ = build_family(L_NEAR, R0_NEAR)
    for i, co in enumerate(v_n[:len(sk_near.data)]):
        sk_near.data[i].co = co

    # Shape key – quasi-Keplerian (tiny GR correction)
    print(f"  SK_Keplerian L={L_KEPLERIAN}, r₀={R0_KEPLERIAN}")
    sk_kep = obj.shape_key_add(name="SK_Keplerian", from_mix=False)
    v_k, _, _ = build_family(L_KEPLERIAN, R0_KEPLERIAN)
    for i, co in enumerate(v_k[:len(sk_kep.data)]):
        sk_kep.data[i].co = co

    # Holoflow metadata
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

    # Black-hole horizon marker (decorative sphere at r_s)
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=R_S * SCALE, location=(0,0,0), segments=8, ring_count=6)
    bh = bpy.context.active_object
    bh.name = "horizon_marker"
    bh_mat = bpy.data.materials.new("mat_horizon")
    bh_mat.use_nodes = True
    bh_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0,0,0,1)
    bh.data.materials.append(bh_mat)

    # Camera — overhead, lens 50 mm
    bpy.ops.object.camera_add(location=(0, 0, 2.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (0, 0, 0)
    cam.data.lens = 50.0
    bpy.context.scene.camera = cam

    # Dark world
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value    = (0.01,0.01,0.04,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.5

    # Export GLB
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bh.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath="//hf_schwarzschild_poi.glb",
        export_format='GLB',
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_morph=True,
        export_colors=True,
        export_yup=True,
        export_image_format='WEBP',
    )
    print("✓ Exported hf_schwarzschild_poi.glb")

if __name__ == "__main__":
    main()
