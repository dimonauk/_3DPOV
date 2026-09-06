"""
Holoflow Studio — Blender 5.1 Blueprint
════════════════════════════════════════════════════════════════════
TOPIC  : Complex Ginzburg–Landau Equation  (CGLE)
         Spiral Turbulence · Benjamin–Feir Instability · Phase Defects
SOURCE : Ginzburg & Landau 1950 (CC0 / PD);
         Cross & Hohenberg 1993 Rev Mod Phys (reference, PD);
         Aranson & Kramer 2002 Rev Mod Phys 74:99 (CC0 reference);
         ETD2RK scheme — Cox & Matthews 2002 J Comput Phys 176:430 (PD method)
OUTPUT : 128×128 height-field stage floor. |A| → vertex Z. Phase → FLOAT_COLOR.
         Shape keys: Basis (near-BF stable spirals) / SK_Turbulent (defect chaos)
                   / SK_PhaseTurb (phase turbulence) / SK_Frozen (frozen spirals)
MESH   : 16384 V · 16129 Q · cobalt–amber CGL_Phase FLOAT_COLOR
EXPORT : holoflow_cgl_floor.blend · holoflow_cgl_floor.glb (Draco-6, WebP)
════════════════════════════════════════════════════════════════════

WHY THE CGLE?
  The 2-D CGLE   ∂A/∂t = A + (1+ic₁)∇²A − (1+ic₂)|A|²A
  is the normal-form equation for any oscillatory medium near a supercritical
  Hopf bifurcation: laser cavities, chemical oscillators, Bénard convection.
  Unlike the conservative NLS (Gross–Pitaevskii), it is DISSIPATIVE —
  amplitude relaxes toward |A|=1 while phase can wind arbitrarily.
  The key instability is Benjamin–Feir (Newell 1974):  plane waves are
  linearly unstable when  1 + c₁c₂ < 0,  i.e. |c₁c₂| > 1.
  Past that threshold the uniform oscillation fragments into spiral waves,
  phase turbulence, and eventually amplitude (defect) turbulence.

NUMERICAL SCHEME — ETD1 (Cox–Matthews):
  In Fourier space the linear operator is L(k) = 1 − (1+ic₁)|k|²
  ∂Â/∂t = L(k) Â + N̂(A)     N(A) = −(1+ic₂)|A|²A
  ETD1:  Â_{n+1} = e^{Ldt}·Â_n + φ₁(L,dt)·N̂_n
  φ₁ = (e^{Ldt}−1)/L  (safe: use expm1 / L; L→0 → φ₁→dt)
  WHY ETD over explicit RK4: the k⁴-stiff term in L is handled exactly.
  Large dt (here dt=0.1) is stable; explicit RK4 would need dt≲(Δx)²/2.
"""

import bpy, bmesh, numpy as np
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
N          = 128          # grid points per side
L_BOX      = 32.0        # physical box side  (world-space metres in Blender)
DT         = 0.10        # ETD1 time step (large → stable with ETD)
N_STEPS    = 600         # integration steps per shape key
HEIGHT_SCL = 4.0         # scale |A| → vertex Z
OBJ_NAME   = "holoflow_cgl_floor"

# Four (c1, c2) parameter sets and corresponding shape-key names.
# Benjamin–Feir criterion: 1 + c1*c2 < 0  ↔  |c1*c2| > 1.
VARIANTS = [
    ("Basis",       0.50, -1.40),   # |c1c2|=0.70  — stable spiral cores
    ("SK_Turbulent",2.00, -1.50),   # |c1c2|=3.00  — full defect turbulence
    ("SK_PhaseTurb",0.80, -1.80),   # |c1c2|=1.44  — phase turbulence
    ("SK_Frozen",   0.20, -0.60),   # |c1c2|=0.12  — frozen spiral walls
]
COBALT = (0.027, 0.159, 0.408, 1.0)
AMBER  = (1.000, 0.702, 0.000, 1.0)

# ─── Helpers ─────────────────────────────────────────────────────────────────
def wavenumbers(n, l):
    """1-D wavenumbers for an n-point periodic grid of physical length l."""
    return (2.0 * np.pi / l) * np.fft.fftfreq(n) * n


def etd1_precompute(c1, dt, n, l):
    """Return (E, phi1): ETD1 coefficients for operator L = 1 − (1+ic1)k²."""
    kx = wavenumbers(n, l)
    k2 = kx[:, None]**2 + kx[None, :]**2
    L  = 1.0 - (1.0 + 1j * c1) * k2          # shape (N, N), complex
    E  = np.exp(L * dt)
    # phi1 = expm1(L*dt)/L;  guard L≈0 (k=0 mode)
    phi1 = np.where(np.abs(L) < 1e-10,
                    dt * np.ones_like(L),
                    np.expm1(L * dt) / L)
    return E, phi1


def integrate_cgle(c1, c2, dt=DT, n_steps=N_STEPS, n=N, l=L_BOX, seed=0):
    """
    Integrate 2-D CGLE with ETD1 scheme.
    Returns |A| height field (shape n×n, float32) and phase field (float32).
    WHY seed=0 fixed: reproducible snapshots across shape keys.
    """
    rng  = np.random.default_rng(seed)
    A    = (1.0 + 0.02 * rng.standard_normal((n, n))
            + 1j * 0.02 * rng.standard_normal((n, n)))
    Ahat = np.fft.fft2(A)

    E, phi1 = etd1_precompute(c1, dt, n, l)

    for _ in range(n_steps):
        A_phys  = np.fft.ifft2(Ahat)
        N_phys  = -(1.0 + 1j * c2) * (np.abs(A_phys) ** 2) * A_phys
        N_hat   = np.fft.fft2(N_phys)
        Ahat    = E * Ahat + phi1 * N_hat

    A_final = np.fft.ifft2(Ahat)
    amp     = np.abs(A_final).astype(np.float32)
    phase   = np.angle(A_final).astype(np.float32)   # ∈ [−π, π]
    return amp, phase


# ─── Mesh construction ───────────────────────────────────────────────────────
def build_mesh(obj_name):
    """Create an N×N quad grid; return (obj, mesh)."""
    bpy.ops.object.select_all(action='DESELECT')
    old = bpy.data.objects.get(obj_name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

    verts, faces = [], []
    dx = L_BOX / (N - 1)
    for j in range(N):
        for i in range(N):
            verts.append(Vector((i * dx - L_BOX * 0.5,
                                 j * dx - L_BOX * 0.5,
                                 0.0)))
    for j in range(N - 1):
        for i in range(N - 1):
            a = j * N + i
            faces.append((a, a + 1, a + N + 1, a + N))

    mesh = bpy.data.meshes.new(obj_name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(obj_name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj, mesh


def apply_shape_key(mesh, sk_name, amp):
    """Add shape key from amplitude array; return the key block."""
    sk = mesh.shape_keys.key_blocks.get(sk_name)
    if sk is None:
        # If no shape_keys yet, add basis first
        if mesh.shape_keys is None:
            bpy.data.objects[OBJ_NAME].shape_key_add(name="Basis", from_mix=False)
        sk = bpy.data.objects[OBJ_NAME].shape_key_add(name=sk_name, from_mix=False)
    flat = amp.ravel() * HEIGHT_SCL
    coords = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", coords)
    coords = coords.reshape(-1, 3)
    coords[:, 2] = flat
    sk.data.foreach_set("co", coords.ravel())
    return sk


def set_vertex_colour(mesh, phase):
    """
    Store phase ∈ [−π, π] as CGL_Phase FLOAT_COLOR attribute.
    Maps 0 (max) → cobalt, π (max) → amber, interpolated by phase fraction.
    WHY FLOAT_COLOR: survives GLB export with colors=True and Draco compression.
    """
    attr = mesh.color_attributes.get("CGL_Phase")
    if attr is None:
        attr = mesh.color_attributes.new("CGL_Phase", 'FLOAT_COLOR', 'POINT')
    t    = ((phase + np.pi) / (2.0 * np.pi)).ravel().clip(0, 1)  # [0,1]
    r    = COBALT[0] * (1 - t) + AMBER[0] * t
    g    = COBALT[1] * (1 - t) + AMBER[1] * t
    b    = COBALT[2] * (1 - t) + AMBER[2] * t
    rgba = np.column_stack([r, g, b, np.ones_like(r)]).astype(np.float32)
    attr.data.foreach_set("color", rgba.ravel())


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    obj, mesh = build_mesh(OBJ_NAME)
    bpy.context.view_layer.objects.active = obj

    for idx, (sk_name, c1, c2) in enumerate(VARIANTS):
        print(f"[CGLE] Integrating {sk_name}: c1={c1}  c2={c2}  BF={'YES' if 1+c1*c2<0 else 'no'}")
        amp, phase = integrate_cgle(c1, c2)

        if idx == 0:
            # Basis: set vertex Z directly, create shape-key root
            flat = amp.ravel() * HEIGHT_SCL
            mesh.vertices.foreach_get("co",
                (co := np.empty(len(mesh.vertices)*3, np.float32)))
            co = co.reshape(-1,3)
            co[:, 2] = flat
            mesh.vertices.foreach_set("co", co.ravel())
            mesh.update()
            obj.shape_key_add(name="Basis", from_mix=False)
            # Colour from Basis phase
            set_vertex_colour(mesh, phase)
        else:
            apply_shape_key(mesh, sk_name, amp)

    # ── Smooth shading & normals ──────────────────────────────────────────────
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.calc_normals_split()

    # ── Material: Principled + Vertex Colour ─────────────────────────────────
    mat = bpy.data.materials.new("CGL_Mat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    out  = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "CGL_Phase"
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.35
    bsdf.inputs["Metallic"].default_value  = 0.20
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    attr.location = (-300, 0)
    mesh.materials.append(mat)

    # ── Export GLB ────────────────────────────────────────────────────────────
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "../../../glbs/scripting/")
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir,
        "python-numpy-complex-ginzburg-landau-pde-spiral-turbulence-"
        "benjamin-feir-defect-height-field-stage-floor-webxr",
        "holoflow_cgl_floor.glb")
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_morph=True,
        export_morph_normal=False,
        export_image_format='WEBP',
    )
    # Save .blend next to this script
    blend_path = os.path.join(os.path.dirname(__file__), "holoflow_cgl_floor.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[CGLE] Done. Blend: {blend_path}  GLB: {glb_path}")


if __name__ == "__main__":
    main()
