"""
KP-I Lump Soliton — Kadomtsev–Petviashvili Rational Exact Solution
(Manakov, Zakharov, Bordag, Its, Matveev 1977 · Physics Letters A 63:205-206 · PD)

Technique
─────────
The KP-I equation:
    ( u_t  +  6u·u_x  +  u_xxx )_x  −  u_yy  =  0

is the 2+1-dimensional extension of the KdV equation governing weakly two-
dimensional water waves in the long-wave, small-amplitude limit.  Unlike KdV
(1+1D), KP-I admits exact rational solutions that are localised in BOTH x and
y — "lump solitons".  They decay algebraically as 1/r² rather than
exponentially, which is why they travel without radiating energy.

The tau-function substitution u = 2∂²_x ln τ with the quadratic ansatz
    τ(x, y, t)  =  X²  +  y²  +  C²,   X = x − v·t
satisfies the Hirota bilinear form of KP-I if and only if:
    v  =  3/C²          (velocity–width relationship)

The resulting field:
    u = 4(C² + y² − X²) / (C² + y² + X²)²
has a positive peak of 4/C² at the lump centre and two negative lobes along
x at X = ±√(C²+y²).  The lump is a genuine 2D soliton: it scatters with
phase shifts from other lumps, preserving shape and amplitude exactly.

Why not finite differences?  The tau-function gives machine-precision field
values everywhere, including at the steep central crest, at no extra cost.

Outside source: Manakov SV, Zakharov VE, Bordag LA, Its AR, Matveev VB
    "Two-dimensional solitons of the Kadomtsev–Petviashvili equation and
     their interaction" Physics Letters A 63(3):205-206, 1977.  PD.
    https://www.sciencedirect.com/science/article/pii/0375960177906566

Outside source: Kadomtsev BP, Petviashvili VI
    "On the stability of solitary waves in weakly dispersing media"
     Sov. Phys. Doklady 15:539-541, 1970.  PD.
"""

import bpy
import bmesh
import numpy as np

# ── parameters ──────────────────────────────────────────────────────────────
GRID_N        = 128          # vertices per side (128×128 = 16384 V, 16129 Q)
DOMAIN_X      = (-8.0, 8.0)  # physical x range (Blender units)
DOMAIN_Y      = (-5.0, 5.0)  # physical y range (Blender units)
HEIGHT_SCALE  = 0.45         # metres per u-unit; lump peak = 4·HEIGHT_SCALE = 1.8 m
C_PARAM       = 1.0          # width parameter C (peak amplitude = 4/C²)
# velocity v = 3/C² = 3 units/time with C=1
LUMP_X0       = 0.0          # lump x-position at t=0
LUMP_Y0       = 0.0          # lump y-position (fixed; lump travels purely in x)
COBALT        = (0.030, 0.200, 0.780, 1.0)
AMBER         = (0.980, 0.620, 0.050, 1.0)
EMIT_STRENGTH = 3.5
OUTPUT_GLB    = "//hf_kp_lump.glb"

MESH_NAME     = "hf_kp_lump_stage"
ATTR_NAME     = "KP_Lump_Height"  # FLOAT_COLOR per-point

# shape-key time snapshots (lump centre is at x = v·t = 3·t)
TIMES   = [-2.0, -1.0, 0.0, 1.0, 2.0]
SK_NAMES = ["Basis", "SK_t-1", "SK_t0", "SK_t+1", "SK_t+2"]
# Basis = lump at x=-6, well left; SK_t0 = lump at x=0 (centred)


# ── exact 1-lump solution ────────────────────────────────────────────────────
def lump_u(X_grid, Y_grid, t, c=C_PARAM, x0=LUMP_X0, y0=LUMP_Y0):
    """
    KP-I lump u = 4(C²+y²−X²) / (C²+y²+X²)²
    X = x − x₀ − v·t  (v = 3/C²)
    Y = y − y₀

    WHY 4 not 2: from u=2∂²_x ln τ with τ quadratic in x (∂²_x τ = 2),
    the numerator factor doubles once for the chain-rule coefficient.
    """
    v   = 3.0 / c**2          # KP-I dispersion-derived velocity
    Xi  = X_grid - x0 - v * t  # co-moving x coordinate
    Yi  = Y_grid - y0
    denom_sq = (c**2 + Yi**2 + Xi**2)**2
    return 4.0 * (c**2 + Yi**2 - Xi**2) / denom_sq


# ── mesh builder ─────────────────────────────────────────────────────────────
def build_stage_floor():
    """Create GRID_N×GRID_N grid with Basis shape key at TIMES[0]."""
    Nx, Ny = GRID_N, GRID_N
    xs = np.linspace(*DOMAIN_X, Nx)
    ys = np.linspace(*DOMAIN_Y, Ny)
    XX, YY = np.meshgrid(xs, ys, indexing='ij')   # shape (Nx, Ny)

    # ─ build mesh ─
    me   = bpy.data.meshes.new(MESH_NAME)
    obj  = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ─ vertices ─
    u0   = lump_u(XX, YY, TIMES[0])
    vco  = []
    for ix in range(Nx):
        for iy in range(Ny):
            vco.append((float(xs[ix]),
                        float(ys[iy]),
                        float(u0[ix, iy] * HEIGHT_SCALE)))

    # ─ faces (CCW quads) ─
    faces = []
    for ix in range(Nx - 1):
        for iy in range(Ny - 1):
            a = ix * Ny + iy
            b = (ix + 1) * Ny + iy
            c_ = (ix + 1) * Ny + (iy + 1)
            d = ix * Ny + (iy + 1)
            faces.append((a, b, c_, d))

    me.from_pydata(vco, [], faces)
    me.update()
    return obj, me, XX, YY


# ── shape keys ───────────────────────────────────────────────────────────────
def add_shape_keys(obj, me, XX, YY):
    """Add a shape key for each time snapshot; TIMES[0] becomes Basis."""
    Nx, Ny = GRID_N, GRID_N
    obj.shape_key_add(name=SK_NAMES[0], from_mix=False)  # Basis (already set)

    for sk_name, t in zip(SK_NAMES[1:], TIMES[1:]):
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        u_t = lump_u(XX, YY, t)
        for ix in range(Nx):
            for iy in range(Ny):
                vi   = ix * Ny + iy
                new_z = float(u_t[ix, iy] * HEIGHT_SCALE)
                sk.data[vi].co.z = new_z
    # keep Basis visible
    obj.data.shape_keys.key_blocks[0].value = 1.0


# ── FLOAT_COLOR attribute (height-mapped cobalt→amber) ───────────────────────
def apply_height_colour(me, XX, YY):
    """
    Per-point FLOAT_COLOR attribute 'KP_Lump_Height' baked at t=0 (lump centre).
    Cobalt for negative values (lobes), amber for positive (peak).
    """
    attr = me.attributes.new(name=ATTR_NAME,
                             type='FLOAT_COLOR',
                             domain='POINT')
    u0 = lump_u(XX, YY, 0.0)              # t=0 reference for colour bake
    flat = u0.ravel()                      # row-major matches vertex order ix*Ny+iy
    u_max = float(np.max(np.abs(flat))) or 1.0
    Nx, Ny = GRID_N, GRID_N
    for ix in range(Nx):
        for iy in range(Ny):
            vi = ix * Ny + iy
            t_val = (flat[vi] / u_max) * 0.5 + 0.5    # 0.0=min, 1.0=max
            # negative → cobalt; zero → 50%; positive → amber
            r = COBALT[0] + (AMBER[0] - COBALT[0]) * t_val
            g = COBALT[1] + (AMBER[1] - COBALT[1]) * t_val
            b_ = COBALT[2] + (AMBER[2] - COBALT[2]) * t_val
            attr.data[vi].color = (r, g, b_, 1.0)


# ── material (attribute-driven emission) ─────────────────────────────────────
def make_material(obj):
    mat = bpy.data.materials.new("KP_Lump_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out   = nodes.new("ShaderNodeOutputMaterial")
    mix   = nodes.new("ShaderNodeMixShader")
    emit  = nodes.new("ShaderNodeEmission")
    prin  = nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nodes.new("ShaderNodeAttribute")
    fac_n = nodes.new("ShaderNodeValue")

    attr.attribute_name = ATTR_NAME
    attr.attribute_type  = 'GEOMETRY'
    emit.inputs["Strength"].default_value = EMIT_STRENGTH
    prin.inputs["Metallic"].default_value = 0.8
    prin.inputs["Roughness"].default_value = 0.12
    fac_n.outputs[0].default_value = 0.40

    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(attr.outputs["Color"], prin.inputs["Base Color"])
    links.new(emit.outputs["Emission"], mix.inputs[1])
    links.new(prin.outputs["BSDF"], mix.inputs[2])
    links.new(fac_n.outputs[0], mix.inputs["Fac"])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])

    obj.data.materials.append(mat)


# ── holoflow metadata ─────────────────────────────────────────────────────────
def set_holoflow_meta(obj):
    obj["holoflow:category"]    = "stage-floor"
    obj["holoflow:facet"]       = True
    obj["holoflow:export_name"] = "kp_lump_stage"


# ── export ────────────────────────────────────────────────────────────────────
def export_glb():
    bpy.ops.export_scene.gltf(
        filepath            = bpy.path.abspath(OUTPUT_GLB),
        export_format       = 'GLB',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_morph        = True,
        export_colors       = True,
        export_yup          = True,
        use_selection       = False,
    )
    print(f"[KP-Lump] exported → {OUTPUT_GLB}")


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    # purge old objects with same name
    for ob in list(bpy.data.objects):
        if ob.name.startswith(MESH_NAME):
            bpy.data.objects.remove(ob, do_unlink=True)

    obj, me, XX, YY = build_stage_floor()
    add_shape_keys(obj, me, XX, YY)
    apply_height_colour(me, XX, YY)
    make_material(obj)
    set_holoflow_meta(obj)

    # rotate to +Y-up for WebXR export
    import mathutils
    obj.matrix_world = mathutils.Matrix.Rotation(3.14159265 / 2, 4, 'X')
    bpy.ops.object.transform_apply(rotation=True)

    # save blend, then export GLB
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//hf_kp_lump.blend"))
    export_glb()

    v_count = len(me.vertices)
    f_count = len(me.polygons)
    print(f"[KP-Lump] mesh: {v_count}V {f_count}Q  peak u={4.0/C_PARAM**2:.2f}  "
          f"velocity v={3.0/C_PARAM**2:.2f}  width C={C_PARAM}")
    print("[KP-Lump] shape keys:", [sk.name for sk in me.shape_keys.key_blocks])


if __name__ == "__main__":
    main()
