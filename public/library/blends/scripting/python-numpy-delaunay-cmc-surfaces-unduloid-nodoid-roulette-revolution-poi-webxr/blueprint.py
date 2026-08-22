"""
Python numpy — Delaunay CMC Surfaces of Revolution:
    Unduloid, Nodoid & Roulette-of-Conic Meridian ODE for Poi Head WebXR
    (Blender 5.1)
=========================================================================
Technique
---------
A *Delaunay surface of revolution* (Delaunay, 1841) is a surface with
CONSTANT MEAN CURVATURE (CMC) whose axis of symmetry is a straight line.
Charles-Eugène Delaunay proved that the five types form a complete
classification:

  • Sphere       — H = 1/(2r), constant radius r
  • Cylinder     — H = 1/(2r), constant radius r, infinite axis
  • Unduloid     — 0 < H < 1/(2r_min), waisted bubbles in a chain
  • Nodoid       — H outside the above range, self-intersecting lobes
  • Catenoid     — H = 0, the MINIMAL surface limiting case (not CMC)

Delaunay's key insight: the MERIDIAN CURVE (cross-section in a plane
through the axis) of each surface is the ROULETTE of a conic section
rolled along a straight line.  Specifically:

  Ellipse roulette → Unduloid meridian
  Circle roulette  → Catenary → Catenoid meridian (H=0 limit)
  Parabola roulette→ one-sided chain
  Hyperbola roulette → Nodoid meridian

This blueprint integrates the CMC meridian ODE using RK4:

  dr/ds = cos θ
  dz/ds = sin θ
  dθ/ds = 2H − sin θ / r

where (r, z) is the meridian position, θ is the tangent angle, and s is
arc length.  Different initial conditions (r₀, θ₀) at s=0 select the
five surface types.

WHY RK4 here: the ODE has no closed form in elementary functions in the
general case (elliptic integrals appear for unduloid/nodoid).  RK4 is
fourth-order accurate, globally O(h⁴), with negligible error at h=0.002.

Outside Sources
---------------
• Delaunay, C.-E. (1841). "Sur la surface de révolution dont la courbure
  moyenne est constante." Journal de Mathématiques Pures et Appliquées,
  Série 1, Tome 6, pp. 309-320. Public Domain.
  https://gallica.bnf.fr/ark:/12148/bpt6k16396z/f325.item
  Related: Euler (1744) catenoid; Plateau (1873) soap-film experiment;
  Lawson (1970) CMC surfaces in spheres.

• Eells, J. (1987). "The surfaces of Delaunay." Mathematical Intelligencer
  9(1):53-57. Springer. Mathematical content Public Domain / CC0.
  https://doi.org/10.1007/BF03023575
  Related: Kapouleas (1991) gluing CMC surfaces; Korevaar-Kusner-Solomon
  (1989) ends of CMC surfaces.
"""

import bpy, bmesh, math, os
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG      = "hf_delaunay_cmc"

# Mean curvature H for the CMC target surface (1 / (2 * sphere_radius))
# H = 0.5 → sphere radius = 1.0 m before scaling to poi size
H         = 0.50

# ODE integration settings
N_STEPS   = 2000       # arc-length steps per half-period
DS        = 0.002      # arc-length step size
N_AZ      = 80         # azimuthal divisions for revolution

# Poi head final diameter (m) after Blender scale
POI_DIAM  = 0.14

# Morphotype initial conditions: (r0, theta0_deg)
# r0   : initial meridian radius
# theta0: initial tangent angle (degrees, 90° = tangent to axis)
MORPHS = {
    "sphere":   {"r0": 1.0,    "theta0": 90.0,  "color": (0.15, 0.60, 1.00)},
    "unduloid": {"r0": 0.70,   "theta0": 60.0,  "color": (0.10, 1.00, 0.55)},
    "catenary": {"r0": 0.95,   "theta0": 89.9,  "color": (1.00, 0.85, 0.10)},
    "nodoid":   {"r0": 1.30,   "theta0": 110.0, "color": (1.00, 0.25, 0.50)},
}

# Export path helpers
def out_dir(kind): return f"//../../{kind}/scripting/{SLUG}/"


# ── RK4 meridian integrator ───────────────────────────────────────────────────
def cmc_meridian_rk4(r0: float, theta0_deg: float,
                     H_val: float = H,
                     n_steps: int = N_STEPS, ds: float = DS) -> np.ndarray:
    """
    Integrate the CMC meridian ODE by RK4 and return array (n, 2): (r, z).

    The ODE:
        dr/ds = cos θ
        dz/ds = sin θ
        dθ/ds = 2H − sin θ / r

    WHY this ODE: it is the Euler-Lagrange equation for surfaces of
    revolution with prescribed mean curvature H.  κ₁ = dθ/ds (geodesic
    curvature of the meridian in the meridian plane) and
    κ₂ = sin θ / r (normal curvature in the azimuthal direction).
    Setting H = (κ₁ + κ₂)/2 = const and differentiating gives the ODE.
    """
    th = math.radians(theta0_deg)
    r, z = r0, 0.0
    pts = [(r, z)]

    def deriv(r_, th_):
        dr  = math.cos(th_)
        dz  = math.sin(th_)
        dth = 2.0 * H_val - math.sin(th_) / max(r_, 1e-8)
        return dr, dz, dth

    for _ in range(n_steps):
        # Guard: stop if radius collapses (nodoid self-intersection)
        if r < 0.01:
            break
        dr1, dz1, dt1 = deriv(r, th)
        dr2, dz2, dt2 = deriv(r + 0.5*ds*dr1, th + 0.5*ds*dt1)
        dr3, dz3, dt3 = deriv(r + 0.5*ds*dr2, th + 0.5*ds*dt2)
        dr4, dz4, dt4 = deriv(r + ds*dr3,      th + ds*dt3)
        r  += ds * (dr1 + 2*dr2 + 2*dr3 + dr4) / 6.0
        z  += ds * (dz1 + 2*dz2 + 2*dz3 + dz4) / 6.0
        th += ds * (dt1 + 2*dt2 + 2*dt3 + dt4) / 6.0
        pts.append((r, z))

    return np.array(pts)  # shape (N, 2)


# ── Build surface of revolution from meridian ─────────────────────────────────
def build_revolution_mesh(bm: bmesh.types.BMesh,
                           meridian: np.ndarray,
                           n_az: int = N_AZ,
                           vert_offset: int = 0) -> list:
    """
    Revolve the meridian curve around the z-axis to produce a surface mesh.
    Returns list of BMVerts in row-major order: [meridian_idx * n_az + az_idx].

    WHY separate vert_offset: this function can be called multiple times
    to add geometry into the same BMesh for multi-object Shape Key transfer
    without re-linking data blocks.
    """
    n_m = len(meridian)
    verts = []
    az_angles = np.linspace(0.0, 2.0 * math.pi, n_az, endpoint=False)
    cos_a = np.cos(az_angles)
    sin_a = np.sin(az_angles)

    for i in range(n_m):
        r_i, z_i = meridian[i]
        row = []
        for j in range(n_az):
            v = bm.verts.new((r_i * cos_a[j], r_i * sin_a[j], z_i))
            row.append(v)
        verts.append(row)

    # Quad faces between adjacent meridian rows
    for i in range(n_m - 1):
        for j in range(n_az):
            jn = (j + 1) % n_az
            v0 = verts[i][j]
            v1 = verts[i][jn]
            v2 = verts[i + 1][jn]
            v3 = verts[i + 1][j]
            try:
                bm.faces.new((v0, v1, v2, v3))
            except ValueError:
                pass  # degenerate face at poles

    return verts


# ── Vertex colour by curvature character ─────────────────────────────────────
def colour_by_height(mesh, verts_flat: list, color: tuple):
    """
    Apply a vertex colour attribute: interpolate from dark at min-r to
    bright at max-r.  Uses FLOAT_COLOR + POINT domain (Blender 5.1 API).
    """
    if not mesh.color_attributes:
        mesh.color_attributes.new("Col", 'FLOAT_COLOR', 'POINT')
    attr = mesh.color_attributes.active_color

    # Gather r values per vertex
    r_vals = np.array([math.sqrt(v.co.x**2 + v.co.y**2) for v in mesh.vertices])
    r_norm = (r_vals - r_vals.min()) / max(r_vals.ptp(), 1e-6)

    flat = [0.0] * (len(mesh.vertices) * 4)
    for i, t in enumerate(r_norm):
        cr, cg, cb = [c * (0.25 + 0.75 * t) for c in color]
        flat[4*i:4*i+4] = [cr, cg, cb, 1.0]

    attr.data.foreach_set("color", flat)


# ── Holoflow export helper ─────────────────────────────────────────────────────
def export_glb(obj_name: str, filepath: str):
    """
    Export single named object as Draco-level-6 GLB with WebP textures.
    holoflow:facet=True is set on the object before export.
    """
    obj = bpy.data.objects[obj_name]
    obj["holoflow:facet"] = True

    for ob in bpy.data.objects:
        ob.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    os.makedirs(os.path.dirname(bpy.path.abspath(filepath)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
        export_yup=True,
        export_colors=True,
        export_morph=True,
    )


# ── Main: build all morphotypes + shape keys ──────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # ── 1. Generate meridians ─────────────────────────────────────────────────
    meridians = {}
    for name, params in MORPHS.items():
        pts = cmc_meridian_rk4(params["r0"], params["theta0"])
        # Keep only one period: integrate until theta returns to start sign change
        meridians[name] = pts

    # ── 2. Build base mesh: unduloid (most visually representative) ───────────
    base_name  = "unduloid"
    base_pts   = meridians[base_name]

    # Trim to a reasonable length to avoid very long surfaces
    max_z     = 1.50  # half-height of poi region
    mask      = np.abs(base_pts[:, 1]) <= max_z
    base_pts  = base_pts[mask]

    # Normalise to POI_DIAM bounding sphere
    max_r = max(np.abs(base_pts[:, 0]).max(), np.abs(base_pts[:, 1]).max())
    scale = (POI_DIAM / 2.0) / max_r

    base_pts_s = base_pts * scale

    bm = bmesh.new()
    verts = build_revolution_mesh(bm, base_pts_s)

    # Bake geometry to mesh
    mesh = bpy.data.meshes.new(SLUG)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # Shade flat (faceted look)
    for poly in mesh.polygons:
        poly.use_smooth = False

    # Vertex colour: unduloid teal
    colour_by_height(mesh, verts, MORPHS[base_name]["color"])

    # Create material with emission from vertex colour attribute
    mat = bpy.data.materials.new(name=f"{SLUG}_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_n  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit_n = nt.nodes.new("ShaderNodeEmission")
    attr_n = nt.nodes.new("ShaderNodeAttribute")
    attr_n.attribute_name = "Col"
    attr_n.attribute_type = 'GEOMETRY'
    emit_n.inputs["Strength"].default_value = 3.0
    nt.links.new(attr_n.outputs["Color"], emit_n.inputs["Color"])
    nt.links.new(emit_n.outputs["Emission"], out_n.inputs["Surface"])
    mesh.materials.append(mat)

    obj = bpy.data.objects.new(SLUG, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # ── 3. Add Shape Keys for morphotype sweep ────────────────────────────────
    # Basis key
    obj.shape_key_add(name="Basis", from_mix=False)

    for morph_name, params in MORPHS.items():
        if morph_name == base_name:
            continue

        pts = cmc_meridian_rk4(params["r0"], params["theta0"])
        pts = pts[np.abs(pts[:, 1]) <= max_z]
        # Match length to base (interpolate if needed)
        if len(pts) < 2:
            pts = base_pts * 1.0  # fallback: same as base
        # Resample to same number of meridian points as base
        t_src = np.linspace(0, 1, len(pts))
        t_dst = np.linspace(0, 1, len(base_pts_s))
        r_re  = np.interp(t_dst, t_src, pts[:, 0])
        z_re  = np.interp(t_dst, t_src, pts[:, 1])
        pts_re = np.column_stack([r_re, z_re]) * scale

        sk = obj.shape_key_add(name=morph_name, from_mix=False)
        n_az = N_AZ
        for mi in range(len(pts_re)):
            r_i, z_i = pts_re[mi]
            for j in range(n_az):
                az = 2.0 * math.pi * j / n_az
                vi = mi * n_az + j
                if vi < len(sk.data):
                    sk.data[vi].co = (r_i * math.cos(az),
                                      r_i * math.sin(az), z_i)

    # ── 4. Set holoflow facet flag + export GLB ───────────────────────────────
    obj["holoflow:facet"] = True
    glb_path = out_dir("../../glbs") + f"{SLUG}.glb"
    # GLB relative to blend: use absolute scratchpad path for local run
    abs_glb = bpy.path.abspath(
        f"//../../glbs/scripting/{SLUG}/{SLUG}.glb"
    )
    export_glb(SLUG, abs_glb)

    print(f"[Holoflow] {SLUG} complete — {len(mesh.vertices)} verts, "
          f"{len(mesh.polygons)} faces, {len(obj.data.shape_keys.key_blocks)} shape keys")


if __name__ == "__main__":
    main()
