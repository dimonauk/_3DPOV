"""
Fraunhofer Diffraction: 2D FFT Aperture → Point-Spread Function Height Field
Blender 5.1 | Python + numpy | CC0 | Holoflow Studio

In the Fraunhofer (far-field) limit the amplitude of a diffracted wave at the
focal plane of a lens equals the 2D Fourier transform of the aperture pupil
function — a direct consequence of the Huygens–Fresnel integral when the
observation distance exceeds the Rayleigh range d_R = D²/4λ.  Three aperture
shapes (circular, hexagonal, annular) produce qualitatively different PSFs:
the circular aperture gives the Airy disk with first dark ring at 1.22λ/D;
the hexagonal aperture places six diffraction spikes identical to those visible
in Hubble and JWST starfield images; the annular aperture (central obstruction)
sharpens the core to ~0.64λ/D at the cost of elevated first sidelobe.
Each PSF is computed by zero-padded 2D FFT, log-compressed for dynamic range,
and mapped onto a 96 × 96 bmesh height field with three morph-target shape keys
and a blue-white vertex-colour emission material.
"""

import math, bpy, numpy as np

# ─── Parameters ────────────────────────────────────────────────────────────────
FFT_N        = 512    # Aperture grid size; pad to 2N for PSF (Nyquist safety)
MESH_N       = 96     # Vertex count per axis in the output mesh (96² = 9 216 verts)
ZOOM_FRAC    = 0.12   # Half-width of PSF crop as fraction of FFT_N (≈ ±22 Airy rings)
R_APERTURE   = 0.45   # Circular/annular aperture outer radius (normalised to ±1)
OBST_RATIO   = 0.35   # Annular inner/outer radius ratio (35 % — typical Cassegrain)
HEIGHT_SCALE = 0.15   # Peak Z displacement in Blender metres
MESH_SIZE    = 1.00   # Output mesh half-extent on each axis (metres)
OUTPUT_GLB   = "hf_fraunhofer_psf.glb"

# ─── Aperture functions ────────────────────────────────────────────────────────

def _coord_grid(n):
    """Normalised coordinate arrays xx ∈ [-1, 1), yy ∈ [-1, 1)."""
    c = np.linspace(-1.0, 1.0, n, endpoint=False)
    return np.meshgrid(c, c)


def circular_pupil(n, r=R_APERTURE):
    """
    Hard-edged circular aperture (the classic case).
    r_max < 0.5 leaves a guard band: the discontinuous aperture edge generates
    Gibbs ringing in the FFT; padding (below) and the guard band both reduce it.
    """
    xx, yy = _coord_grid(n)
    return (np.hypot(xx, yy) <= r).astype(np.float64)


def hexagonal_pupil(n, r=0.43):
    """
    Regular hexagon — flat-top orientation (two horizontal edges).
    Equivalent to the L∞ norm on the hexagonal lattice:
        mask = max(|x|, |x/2 + √3/2 · y|, |x/2 − √3/2 · y|) ≤ r
    Each of the three terms tests a pair of parallel hexagon edges; their
    intersection gives the 6-vertex polytope.  Hexagonal mirrors (JWST, Keck)
    produce exactly 6 diffraction spikes perpendicular to each edge pair.
    """
    xx, yy = _coord_grid(n)
    s3h = math.sqrt(3) / 2.0          # sin(60°) = √3/2
    p0  = np.abs(xx)
    p1  = np.abs(0.5 * xx + s3h * yy)
    p2  = np.abs(0.5 * xx - s3h * yy)
    return (np.maximum(p0, np.maximum(p1, p2)) <= r).astype(np.float64)


def annular_pupil(n, r_outer=R_APERTURE, eps=OBST_RATIO):
    """
    Annular (ring) aperture: outer circle minus central obstruction.
    Physical example: Cassegrain telescope — secondary mirror blocks the centre.
    Rayleigh criterion narrows from 1.22λ/D (full disc) to ~0.64λ/D (annulus)
    for ε → 1, at the expense of more power in the first bright ring (Airy ring).
    eps = r_inner / r_outer is the obstruction ratio.
    """
    xx, yy = _coord_grid(n)
    R = np.hypot(xx, yy)
    return ((R <= r_outer) & (R >= r_outer * eps)).astype(np.float64)


# ─── PSF computation ───────────────────────────────────────────────────────────

def compute_log_psf(aperture):
    """
    Return a log-scaled, normalised PSF intensity array cropped to MESH_N × MESH_N.

    Pipeline:
    1. Zero-pad aperture from N→2N per side.  Without padding the FFT assumes
       periodic boundaries — the pupil appears tiled, adding ghost orders.
       2× padding separates these tiles by one Rayleigh range.
    2. 2D FFT + fftshift centres the DC (zero-spatial-frequency) component.
    3. Intensity I = |F|² is the irradiance in the focal plane.
    4. Log-compress: PSFs span 50–70 dB dynamic range; linear scale makes all
       sidelobes invisible next to the central peak.
    5. Crop central ± ZOOM_FRAC × N bins (shows ± ~22 Airy ring radii).
    6. Downsample to MESH_N × MESH_N for the bmesh grid.
    """
    n = aperture.shape[0]          # = FFT_N

    # Step 1 — zero-pad to 2N × 2N
    padded = np.zeros((2 * n, 2 * n), dtype=np.float64)
    padded[n // 2 : n // 2 + n, n // 2 : n // 2 + n] = aperture

    # Step 2 — FFT and intensity
    F_shift   = np.fft.fftshift(np.fft.fft2(padded))
    intensity = np.abs(F_shift) ** 2
    intensity /= intensity.max()   # normalise peak to 1.0

    # Step 3 — log scale; ε = 1e-7 ≈ -70 dB floor
    log_I  = 10.0 * np.log10(intensity + 1e-7)
    log_I -= log_I.min()
    log_I /= log_I.max()           # remap to [0, 1]

    # Step 4 — crop central region
    cx, cy = n, n                  # centre of 2N × 2N array
    half   = int(ZOOM_FRAC * n)   # half-width in FFT bins; must be ≥ MESH_N/2
    half   = max(half, MESH_N // 2 + 1)
    crop   = log_I[cx - half : cx + half, cy - half : cy + half]

    # Step 5 — subsample to MESH_N
    step = max(1, crop.shape[0] // MESH_N)
    ds   = crop[::step, ::step]
    return ds[:MESH_N, :MESH_N].copy()


# ─── Mesh construction ────────────────────────────────────────────────────────

def build_base_mesh(psf_circ):
    """
    Construct a MESH_N × MESH_N planar quad mesh displaced by the circular-aperture
    PSF.  Row-major vertex ordering: vertex index = row * MESH_N + col.
    """
    H, W = psf_circ.shape         # both equal MESH_N

    # Vertex positions — Z proportional to PSF intensity
    verts = []
    for row in range(H):
        for col in range(W):
            x = (col / (W - 1) - 0.5) * MESH_SIZE
            y = (row / (H - 1) - 0.5) * MESH_SIZE
            z = float(psf_circ[row, col]) * HEIGHT_SCALE
            verts.append((x, y, z))

    # Quad faces — (a, b, c, d) counter-clockwise from below
    faces = []
    for row in range(H - 1):
        for col in range(W - 1):
            a = row * W + col
            b = row * W + col + 1
            c = (row + 1) * W + col + 1
            d = (row + 1) * W + col
            faces.append((a, b, c, d))

    mesh = bpy.data.meshes.new("hf_fraunhofer_psf")
    mesh.from_pydata(verts, [], faces)
    for poly in mesh.polygons:
        poly.use_smooth = False    # faceted — matches Holoflow aesthetic
    mesh.update()

    obj = bpy.data.objects.new("HF_Fraunhofer_PSF", mesh)
    bpy.context.collection.objects.link(obj)
    # +Y-up convention: mesh lies in XY plane, Z up — correct for glTF export
    return obj


def add_shape_key(obj, psf, name):
    """
    Add a shape key whose Z coordinate is driven by psf intensity.
    X/Y remain identical to the Basis key — topology unchanged.
    """
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)

    sk  = obj.shape_key_add(name=name, from_mix=False)
    N   = MESH_N
    cos = []
    for row in range(N):
        for col in range(N):
            x = (col / (N - 1) - 0.5) * MESH_SIZE
            y = (row / (N - 1) - 0.5) * MESH_SIZE
            z = float(psf[row, col]) * HEIGHT_SCALE
            cos.extend([x, y, z])
    sk.data.foreach_set("co", cos)   # 30× faster than per-vertex loop


# ─── Vertex colour ────────────────────────────────────────────────────────────

def apply_vertex_colour(obj, psf):
    """
    Viridis-inspired blue → teal → white ramp keyed to circular-aperture intensity.
    FLOAT_COLOR / POINT domain for linear-colour Emission shader.
    """
    mesh = obj.data
    attr = mesh.color_attributes.new(
        name="PSFIntensity", type="FLOAT_COLOR", domain="POINT"
    )

    colours = []
    flat_psf = psf.flatten()
    for t in flat_psf:
        # Deep blue (0,0,0.6) → sky blue (0,0.6,1) → white (1,1,1)
        if t < 0.5:
            s = t / 0.5
            r, g, b = 0.0 + s * 0.0, 0.0 + s * 0.65, 0.55 + s * 0.45
        else:
            s = (t - 0.5) / 0.5
            r, g, b = 0.0 + s * 1.0, 0.65 + s * 0.35, 1.0
        colours.extend([r, g, b, 1.0])   # RGBA float linear
    attr.data.foreach_set("color", colours)
    mesh.update()


# ─── Emission material ────────────────────────────────────────────────────────

def add_emission_material(obj):
    """
    Attribute-driven Emission shader — reads PSFIntensity vertex colour.
    Shadow mode NONE so the sidelobe rings are not self-shadowed.
    """
    mat = bpy.data.materials.new("PSF_Emission")
    mat.use_nodes = True
    mat.use_backface_culling  = False
    mat.shadow_method         = "NONE"

    nt   = mat.node_tree
    nodes, links = nt.nodes, nt.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    attr = nodes.new("ShaderNodeAttribute")

    attr.attribute_name = "PSFIntensity"
    emit.inputs["Strength"].default_value = 2.5

    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])

    for node in nodes:
        node.location.x -= 300

    obj.data.materials.append(mat)


# ─── GLB export ───────────────────────────────────────────────────────────────

def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath             = OUTPUT_GLB,
        use_selection        = True,
        export_apply         = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format  = "WEBP",
        export_morph         = True,
        export_colors        = True,
        export_yup           = True,
    )
    print(f"[blueprint] Exported → {OUTPUT_GLB}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    # Clear default scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("[blueprint] Computing aperture PSFs …")
    circ   = circular_pupil(FFT_N)
    hexa   = hexagonal_pupil(FFT_N)
    annul  = annular_pupil(FFT_N)

    psf_circ  = compute_log_psf(circ)
    psf_hexa  = compute_log_psf(hexa)
    psf_annul = compute_log_psf(annul)

    print("[blueprint] Building mesh …")
    obj = build_base_mesh(psf_circ)

    print("[blueprint] Adding shape keys …")
    # Basis key created inside add_shape_key on first call
    add_shape_key(obj, psf_circ,  "Circular_Airy")   # = Basis contents
    add_shape_key(obj, psf_hexa,  "Hexagonal_Spikes")
    add_shape_key(obj, psf_annul, "Annular_Sharpened")

    apply_vertex_colour(obj, psf_circ)
    add_emission_material(obj)

    print("[blueprint] Exporting GLB …")
    export_glb(obj)
    print("[blueprint] Done — holoflow:facet=True stage floor ready.")


if __name__ == "__main__":
    main()
