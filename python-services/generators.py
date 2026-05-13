"""
generators.py — Mesh generation for all 5 sculpture types.
Each generator takes a Genome and returns a trimesh.Trimesh.

Types:
  gyroid     — triply periodic minimal surface (TPMS)
  turing     — Gray-Scott reaction-diffusion surface
  wgm        — whispering gallery mode resonator
  ctenophore — chirped diffraction grating ribs
  slime      — Physarum / Murray's Law vascular network
"""
import numpy as np
import trimesh
from trimesh import creation

try:
    from skimage import measure as skm
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False

from core.genome import Genome


# ─── Marching Cubes Helper ─────────────────────────────────────────────────

def _marching_cubes(field: np.ndarray, iso: float,
                    spacing: tuple = (1.0, 1.0, 1.0)) -> trimesh.Trimesh:
    if HAS_SKIMAGE:
        verts, faces, normals, _ = skm.marching_cubes(field, level=iso, spacing=spacing)
    else:
        raise RuntimeError("scikit-image required for marching cubes")
    return trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals)


def _scale_mesh(mesh: trimesh.Trimesh, genome: Genome) -> trimesh.Trimesh:
    """Uniform scale to genome's physical dimensions."""
    lo, hi = 30.0, 120.0
    target_mm = lo + genome.genes["scale"] * (hi - lo)
    current = mesh.bounds[1] - mesh.bounds[0]
    max_dim = current.max()
    if max_dim > 0:
        mesh.apply_scale(target_mm / max_dim)
    # Aspect ratio: stretch Z
    ar = 0.3 + genome.genes["aspect_ratio"] * 2.7
    mesh.apply_scale([1.0, 1.0, ar])
    return mesh


# ─── 1. GYROID ─────────────────────────────────────────────────────────────

def generate_gyroid(genome: Genome, res: int = 64) -> trimesh.Trimesh:
    """
    Triply periodic minimal surface: sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = t
    Hollowed by subtracting an inner shell.
    """
    density = 0.5 + genome.genes["cell_density"] * 1.5   # period density
    t_offset = (genome.genes["wall_thickness"] - 0.5) * 0.8  # shell thickness
    noise_amp = genome.genes["noise_amplitude"] * 0.3
    noise_freq = 1.0 + genome.genes["noise_frequency"] * 4.0

    L = 2 * np.pi * density
    x = np.linspace(-L, L, res)
    X, Y, Z = np.meshgrid(x, x, x)

    # Base gyroid field
    field = (np.sin(X) * np.cos(Y) +
             np.sin(Y) * np.cos(Z) +
             np.sin(Z) * np.cos(X))

    # Add noise
    if noise_amp > 0.01:
        noise = np.sin(X * noise_freq) * np.sin(Y * noise_freq) * noise_amp
        field += noise

    # Shell: keep region where |field| < t_offset
    shell_field = np.abs(field) - t_offset

    mesh = _marching_cubes(shell_field, iso=0.0,
                            spacing=(2 * L / res,) * 3)

    # Twist along Z
    twist_deg = genome.genes["twist"] * 720.0
    if abs(twist_deg) > 1.0:
        verts = mesh.vertices
        z_range = verts[:, 2].max() - verts[:, 2].min()
        if z_range > 0:
            t = (verts[:, 2] - verts[:, 2].min()) / z_range
            angle = np.radians(twist_deg * t)
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            x_new = verts[:, 0] * cos_a - verts[:, 1] * sin_a
            y_new = verts[:, 0] * sin_a + verts[:, 1] * cos_a
            mesh.vertices = np.column_stack([x_new, y_new, verts[:, 2]])

    return _scale_mesh(mesh, genome)


# ─── 2. TURING (Gray-Scott) ────────────────────────────────────────────────

def _gray_scott(res: int, steps: int, f: float, k: float,
                Du: float = 0.16, Dv: float = 0.08) -> np.ndarray:
    """2D Gray-Scott reaction-diffusion on a torus."""
    U = np.ones((res, res))
    V = np.zeros((res, res))

    # Seed
    r = res // 10
    c = res // 2
    U[c-r:c+r, c-r:c+r] = 0.5
    V[c-r:c+r, c-r:c+r] = 0.25
    U += 0.05 * np.random.rand(res, res)
    V += 0.05 * np.random.rand(res, res)

    def laplacian(A):
        return (np.roll(A, 1, 0) + np.roll(A, -1, 0) +
                np.roll(A, 1, 1) + np.roll(A, -1, 1) - 4 * A)

    dt = 1.0
    for _ in range(steps):
        uvv = U * V * V
        U += dt * (Du * laplacian(U) - uvv + f * (1 - U))
        V += dt * (Dv * laplacian(V) + uvv - (f + k) * V)
        U = np.clip(U, 0, 1)
        V = np.clip(V, 0, 1)

    return V


def generate_turing(genome: Genome, res: int = 80) -> trimesh.Trimesh:
    """
    Gray-Scott pattern → height field → mesh with revolution symmetry.
    """
    f = 0.02 + genome.genes["noise_frequency"] / 20.0 * 0.04  # feed rate
    k = 0.05 + genome.genes["noise_amplitude"] / 5.0 * 0.015  # kill rate
    steps = 1000 + int(genome.genes["cell_density"] * 2000)
    symmetry = max(1, int(genome.genes["symmetry"] * 7) + 1)

    np.random.seed(42)
    pattern = _gray_scott(res, steps, f, k)

    # Tile pattern with rotational symmetry around Z axis
    # Convert to 3D height field on a cylinder
    theta = np.linspace(0, 2 * np.pi, res * symmetry)
    z_vals = np.linspace(0, 1, res)
    radius_base = 0.3 + genome.genes["wall_thickness"] * 0.4

    verts = []
    faces = []

    rows = res * symmetry
    cols = res

    for i, th in enumerate(theta):
        for j, z in enumerate(z_vals):
            ti = i % res
            h = pattern[ti, j] * genome.genes["noise_amplitude"] * 0.15
            r = radius_base + h
            verts.append([r * np.cos(th), r * np.sin(th), z])

    verts = np.array(verts)

    for i in range(rows - 1):
        for j in range(cols - 1):
            a = i * cols + j
            b = (i + 1) * cols + j
            c = (i + 1) * cols + (j + 1)
            d = i * cols + (j + 1)
            faces.append([a, b, c])
            faces.append([a, c, d])

    mesh = trimesh.Trimesh(vertices=verts, faces=np.array(faces))
    mesh.fix_normals()
    return _scale_mesh(mesh, genome)


# ─── 3. WGM (Whispering Gallery Mode) ─────────────────────────────────────

def generate_wgm(genome: Genome) -> trimesh.Trimesh:
    """
    Toroidal resonator with lobed cross-section.
    WGM resonances ≈ 2π·r·n_eff / λ → we encode this as rib count.
    """
    symmetry = max(3, int(3 + genome.genes["symmetry"] * 5))  # 3–8 fold
    major_r = 0.5 + genome.genes["scale"] * 0.3
    minor_r = 0.05 + genome.genes["wall_thickness"] * 0.15
    lobe_depth = genome.genes["cell_density"] * 0.3
    lobe_freq = symmetry
    twist = genome.genes["twist"] * 4 * np.pi

    # Parametric torus with lobed minor cross-section
    u = np.linspace(0, 2 * np.pi, 120)
    v = np.linspace(0, 2 * np.pi, 60)
    U, V = np.meshgrid(u, v)

    r_lobe = minor_r * (1 + lobe_depth * np.cos(lobe_freq * V))
    twist_phase = twist * U / (2 * np.pi)

    X = (major_r + r_lobe * np.cos(V + twist_phase)) * np.cos(U)
    Y = (major_r + r_lobe * np.cos(V + twist_phase)) * np.sin(U)
    Z = r_lobe * np.sin(V + twist_phase)

    # Build mesh from grid
    rows, cols = X.shape
    verts = np.column_stack([X.ravel(), Y.ravel(), Z.ravel()])
    faces = []

    for i in range(rows):
        for j in range(cols):
            a = i * cols + j
            b = i * cols + (j + 1) % cols
            c = ((i + 1) % rows) * cols + (j + 1) % cols
            d = ((i + 1) % rows) * cols + j
            faces.append([a, b, c])
            faces.append([a, c, d])

    mesh = trimesh.Trimesh(vertices=verts, faces=np.array(faces))
    mesh.fix_normals()
    return _scale_mesh(mesh, genome)


# ─── 4. CTENOPHORE ─────────────────────────────────────────────────────────

def generate_ctenophore(genome: Genome) -> trimesh.Trimesh:
    """
    Ctenophore (comb jelly) — vertical ribs with chirped diffraction gratings.
    Helical twist + tapered form + ribbed surface.
    """
    rib_count = max(4, int(4 + genome.genes["verticals"] * 8))
    twist_deg = genome.genes["twist"] * 360
    taper = 0.1 + genome.genes["taper"] * 0.9
    height = 1.0
    base_radius = 0.25 + genome.genes["scale"] * 0.15
    rib_height = 0.01 + genome.genes["wall_thickness"] * 0.05
    grating_lines = max(10, int(10 + genome.genes["grating_pitch"] / 500 * 40))

    verts = []
    faces = []
    idx = 0

    z_steps = 80
    z_vals = np.linspace(0, height, z_steps)

    for rib_i in range(rib_count):
        base_angle = 2 * np.pi * rib_i / rib_count

        prev_strip = None

        for j, z in enumerate(z_vals):
            # Taper + twist
            t = z / height
            r = base_radius * (1 - t * (1 - taper))
            angle = base_angle + np.radians(twist_deg * t)

            # Rib cross section: arc of grating_lines points
            arc_span = 0.4 * np.pi / rib_count
            arc = np.linspace(angle - arc_span, angle + arc_span, grating_lines)

            # Chirped height: varies sinusoidally along arc = diffraction grating
            chirp_freq = genome.genes["grating_depth"] / 50 * 8
            grating = rib_height * (1 + np.sin(np.linspace(0, chirp_freq * np.pi, grating_lines)))

            strip = []
            for k, a in enumerate(arc):
                r_k = r + grating[k]
                strip.append([r_k * np.cos(a), r_k * np.sin(a), z])
            strip = np.array(strip)
            verts.append(strip)

        # Now build faces between adjacent z-slices
        all_strips = verts[-z_steps:]
        for j in range(z_steps - 1):
            s0 = all_strips[j]
            s1 = all_strips[j + 1]
            for k in range(grating_lines - 1):
                a = idx + j * grating_lines + k
                b = idx + j * grating_lines + k + 1
                c = idx + (j + 1) * grating_lines + k + 1
                d = idx + (j + 1) * grating_lines + k
                faces.append([a, b, c])
                faces.append([a, c, d])

        idx += z_steps * grating_lines

    flat_verts = np.vstack(verts)
    mesh = trimesh.Trimesh(vertices=flat_verts, faces=np.array(faces))
    mesh.fix_normals()
    return _scale_mesh(mesh, genome)


# ─── 5. SLIME (Physarum) ──────────────────────────────────────────────────

def _physarum_network(n_nodes: int, iterations: int = 500,
                      decay: float = 0.95, deposit: float = 0.1) -> tuple:
    """
    Simplified Physarum polycephalum network.
    Particles flow toward food sources, depositing trail.
    Returns (node_positions, edge_list, edge_weights)
    """
    np.random.seed(42)

    # Random nodes in unit sphere
    positions = np.random.randn(n_nodes, 3)
    positions /= np.linalg.norm(positions, axis=1, keepdims=True) + 1e-8
    positions *= np.random.rand(n_nodes, 1) ** 0.5

    # Initial random graph
    pheromone = np.random.rand(n_nodes, n_nodes) * 0.1
    pheromone = (pheromone + pheromone.T) / 2  # symmetric

    # Physarum dynamics
    for _ in range(iterations):
        # Flow proportional to pheromone
        flow = pheromone ** 2 / (pheromone.sum(axis=1, keepdims=True) + 1e-8)
        pheromone = pheromone * decay + flow * deposit
        pheromone = np.clip(pheromone, 0, 1)

    # Extract significant edges
    threshold = pheromone.mean() + pheromone.std() * 0.5
    edges = []
    weights = []
    for i in range(n_nodes):
        for j in range(i + 1, n_nodes):
            if pheromone[i, j] > threshold:
                edges.append((i, j))
                weights.append(pheromone[i, j])

    return positions, edges, np.array(weights) if weights else np.array([])


def _tube_between(p0: np.ndarray, p1: np.ndarray,
                  radius: float, segments: int = 8) -> trimesh.Trimesh:
    """Create a tube mesh between two points."""
    direction = p1 - p0
    length = np.linalg.norm(direction)
    if length < 1e-6:
        return None

    cyl = creation.cylinder(radius=radius, height=length, sections=segments)

    # Align cylinder with direction
    z_axis = np.array([0, 0, 1.0])
    d_norm = direction / length

    cross = np.cross(z_axis, d_norm)
    cross_norm = np.linalg.norm(cross)

    if cross_norm > 1e-6:
        angle = np.arcsin(np.clip(cross_norm, -1, 1))
        if np.dot(z_axis, d_norm) < 0:
            angle = np.pi - angle
        axis = cross / cross_norm
        rot = trimesh.transformations.rotation_matrix(angle, axis)
        cyl.apply_transform(rot)

    mid = (p0 + p1) / 2
    cyl.apply_translation(mid)
    return cyl


def generate_slime(genome: Genome) -> trimesh.Trimesh:
    """
    Physarum network → tube mesh.
    Murray's Law governs branch radii: r_parent^e = Σ r_child^e
    """
    n_nodes = max(5, int(5 + genome.genes["network_density"] / 1.0 * 15))
    tube_r = 0.01 + genome.genes["tube_radius"] * 0.08
    murray_exp = 0.25 + genome.genes["murray_exponent"] * 0.20  # ~0.33

    positions, edges, weights = _physarum_network(n_nodes)

    if len(edges) == 0:
        # Fallback: simple sphere
        return _scale_mesh(creation.icosphere(subdivisions=2), genome)

    # Murray's law: scale tube radius by weight^(1/murray_exp)
    meshes = []
    for i, (a, b) in enumerate(edges):
        w = weights[i] if i < len(weights) else 0.5
        r = tube_r * (w ** (1.0 / (3 * murray_exp)))
        tube = _tube_between(positions[a], positions[b],
                              radius=max(0.005, r))
        if tube is not None:
            meshes.append(tube)

    # Add nodes as spheres
    for pos in positions:
        sphere = creation.icosphere(subdivisions=1, radius=tube_r * 1.5)
        sphere.apply_translation(pos)
        meshes.append(sphere)

    if not meshes:
        return _scale_mesh(creation.icosphere(subdivisions=2), genome)

    # Merge all tubes
    combined = trimesh.util.concatenate(meshes)

    # Optional: smooth with Taubin smoothing
    smooth = genome.genes["tube_smoothness"]
    if smooth > 0.1 and hasattr(trimesh.smoothing, 'filter_taubin'):
        trimesh.smoothing.filter_taubin(combined, iterations=int(smooth * 10))

    return _scale_mesh(combined, genome)


# ─── Dispatch ─────────────────────────────────────────────────────────────

GENERATORS = {
    "gyroid":     generate_gyroid,
    "turing":     generate_turing,
    "wgm":        generate_wgm,
    "ctenophore": generate_ctenophore,
    "slime":      generate_slime,
}


def generate(genome: Genome) -> trimesh.Trimesh:
    """Main dispatch — returns trimesh for any genome type."""
    fn = GENERATORS.get(genome.type)
    if fn is None:
        raise ValueError(f"Unknown sculpture type: {genome.type}")

    mesh = fn(genome)

    # Ensure watertight for printing
    if not mesh.is_watertight:
        trimesh.repair.fill_holes(mesh)
        trimesh.repair.fix_winding(mesh)

    return mesh
