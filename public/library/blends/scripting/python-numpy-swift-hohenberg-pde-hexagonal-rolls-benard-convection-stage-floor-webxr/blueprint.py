"""
Swift–Hohenberg PDE — pseudo-spectral (FFT) Bénard convection patterns.

Technique (2-3 sentences):
The Swift–Hohenberg equation ∂u/∂t = [ε − (∇²+k₀²)²]u − u³ is the normal-form
PDE for Turing-class symmetry breaking: the linear operator selects a preferred
wavenumber k₀, the cubic saturates the instability, and ε tunes the distance from
the bifurcation. Integrating it pseudo-spectrally — linear operator exact in Fourier
space, nonlinear u³ handled in real space — avoids the ≫1 stiffness of the
bi-Laplacian and converges to rolls, hexagons, or labyrinths depending on ε and
initial conditions.

Parameters (top-level constants):
"""

import bpy, bmesh, numpy as np

# ── grid ───────────────────────────────────────────────────────────────────
N        = 80          # points per axis (N×N = 6400 vertices, 6241 quads)
L        = 2 * np.pi  # physical domain side length (period)
K0       = 1.0         # preferred wavenumber — unstable ring |k|=k0
DT       = 0.50        # time step (large — unconditional stability via ETD)

# ── shape-key configs ───────────────────────────────────────────────────────
CONFIGS = {
    "Basis"       : dict(eps=0.30, n_steps=500,  ic="noise", seed=7),
    "SK_Hex"      : dict(eps=0.30, n_steps=300,  ic="hex",   seed=0),
    "SK_Labyrinth": dict(eps=0.60, n_steps=800,  ic="noise", seed=42),
    "SK_Onset"    : dict(eps=0.05, n_steps=200,  ic="noise", seed=99),
}

# ── vertex-colour palette ────────────────────────────────────────────────────
COBALT = np.array([0.03, 0.15, 0.58, 1.0])
AMBER  = np.array([1.00, 0.65, 0.00, 1.0])

MESH_NAME   = "swift_hohenberg_floor"
OBJ_NAME    = "swift_hohenberg_floor"
MAT_NAME    = "SH_Emission"
ATTR_NAME   = "SH_Pattern"
EXPORT_NAME = "swift_hohenberg_floor"
MAX_EXTENT  = 2.0   # metres — stage-floor half-side after centring


# ──────────────────────────────────────────────────────────────────────────────
def sh_integrate(eps: float, n_steps: int, ic: str, seed: int) -> np.ndarray:
    """
    WHY pseudo-spectral?  The bi-Laplacian (∇²+k₀²)² is diagonal in Fourier
    space:  L̂(k) = ε − (k₀² − |k|²)².  The exact exponential integrator
    e^{L̂ Δt} avoids the stiffness that cripples explicit schemes (Δt ≲ Δx⁴).
    Nonlinear u³ is computed in real space and treated with a first-order ETD
    correction — sufficient for pattern selection studies.
    """
    rng = np.random.default_rng(seed)

    # wavenumber grid — full 2-D FFT frequencies
    freq  = np.fft.fftfreq(N, d=L / (2 * np.pi * N))
    kx, ky = np.meshgrid(freq, freq, indexing="ij")
    k2 = kx**2 + ky**2                         # |k|² grid
    # linear operator in Fourier space
    Lhat = eps - (K0**2 - k2)**2               # shape (N, N)
    # exponential factor for exact linear step
    eL   = np.exp(Lhat * DT)

    # initial condition
    if ic == "hex":
        # superposition of three waves at 120° — seeds hexagonal pattern
        # WHY: single-wave IC gives rolls; three-wave IC → hexagonal bifurcation
        x = np.linspace(0, L, N, endpoint=False)
        X, Y = np.meshgrid(x, x, indexing="ij")
        theta = 2 * np.pi / 3
        u = (np.cos(K0 * X)
             + np.cos(K0 * (X * np.cos(theta) + Y * np.sin(theta)))
             + np.cos(K0 * (X * np.cos(2*theta) + Y * np.sin(2*theta)))) * 0.3
    else:
        u = rng.standard_normal((N, N)) * 0.05

    for _ in range(n_steps):
        uhat = np.fft.fft2(u)
        # exact linear step
        uhat *= eL
        # nonlinear correction in real space (ETD-1)
        u = np.fft.ifft2(uhat).real
        nl = -(u ** 3)
        u += nl * DT          # Euler for the cubic saturator

    return u.astype(np.float32)


def height_to_coords(u: np.ndarray) -> np.ndarray:
    """
    WHY separate height mapping?  We want z to scale nicely relative to the
    floor extent.  The pattern amplitude is O(√ε) analytically; we normalise
    so the tallest hill is 10 % of MAX_EXTENT — visible but not theatrical.
    """
    x = np.linspace(-MAX_EXTENT, MAX_EXTENT, N)
    y = np.linspace(-MAX_EXTENT, MAX_EXTENT, N)
    X, Y = np.meshgrid(x, y, indexing="ij")
    z = u / (np.abs(u).max() + 1e-9) * (MAX_EXTENT * 0.10)
    return np.stack([X, Y, z], axis=-1).reshape(-1, 3)


def build_quad_faces(n: int) -> list[tuple]:
    """Row-major quad connectivity — (N−1)×(N−1) quads, no wrap-around."""
    faces = []
    for i in range(n - 1):
        for j in range(n - 1):
            v00 = i * n + j
            v10 = (i + 1) * n + j
            v11 = (i + 1) * n + (j + 1)
            v01 = i * n + (j + 1)
            faces.append((v00, v10, v11, v01))
    return faces


def make_vertex_colours(u: np.ndarray) -> np.ndarray:
    """
    WHY FLOAT_COLOR attribute on POINT domain?
    The FLOAT_COLOR domain stores per-vertex RGBA; Holoflow exports this via
    export_colors=True in GLB.  We clamp then lerp cobalt→amber on u-value.
    """
    t = (u.ravel() - u.min()) / (u.max() - u.min() + 1e-9)
    return (COBALT[None, :] * (1 - t[:, None]) + AMBER[None, :] * t[:, None]).astype(np.float32)


# ──────────────────────────────────────────────────────────────────────────────
def run():
    # ── clear scene ────────────────────────────────────────────────────────
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)

    # ── integrate Basis ─────────────────────────────────────────────────────
    cfg     = CONFIGS["Basis"]
    u_basis = sh_integrate(**cfg)
    coords  = height_to_coords(u_basis)
    faces   = build_quad_faces(N)

    # ── build mesh ──────────────────────────────────────────────────────────
    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(coords.tolist(), [], faces)
    me.validate()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── vertex-colour attribute ─────────────────────────────────────────────
    attr = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    cols = make_vertex_colours(u_basis)
    attr.data.foreach_set("color", cols.ravel())

    # ── shape keys ──────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    for sk_name, sk_cfg in list(CONFIGS.items())[1:]:
        u_sk  = sh_integrate(**sk_cfg)
        co_sk = height_to_coords(u_sk)
        sk    = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.data.foreach_set("co", co_sk.ravel())

    # ── emission material ────────────────────────────────────────────────────
    mat  = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    attr_node = tree.nodes.new("ShaderNodeAttribute")
    attr_node.attribute_name = ATTR_NAME
    attr_node.attribute_type  = "GEOMETRY"
    bsdf.inputs["Metallic"].default_value   = 0.45
    bsdf.inputs["Roughness"].default_value  = 0.30
    bsdf.inputs["Emission Strength"].default_value = 1.8
    tree.links.new(attr_node.outputs["Color"], bsdf.inputs["Base Color"])
    tree.links.new(attr_node.outputs["Color"], bsdf.inputs["Emission Color"])
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    me.materials.append(mat)

    # ── holoflow metadata ────────────────────────────────────────────────────
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "stage-floor"
    obj["holoflow:topic"]    = "swift-hohenberg-pde"
    obj["holoflow:export_name"] = EXPORT_NAME

    # ── +Y-up, transforms applied ────────────────────────────────────────────
    import math
    obj.rotation_euler = (-math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # ── GLB export ───────────────────────────────────────────────────────────
    import os
    out_dir = os.path.join(
        os.path.dirname(bpy.data.filepath) or "/tmp",
        "out"
    )
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, f"{EXPORT_NAME}.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_morph=True,
        export_yup=True,
        export_image_format="WEBP",
    )
    print(f"[blueprint] GLB written → {glb_path}")


run()
