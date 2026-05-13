"""
caustic_optimizer.py
====================
Standalone Python (no Blender required) — run from command line.
Outputs a height-field array and STL file for caustic projection.

Optimises the surface height field h(x,y) of a resin disc so that
the refracted light distribution at distance D matches a target pattern.

Target patterns:
  - poi_antispin_3petal : 3-petal flower (R=1, r=1/3, 3:1 counter)
  - poi_antispin_5petal : 5-petal isolation
  - circle              : focused ring
  - spiral              : Archimedes spiral
  - custom_image        : load a PNG, use as target distribution

Usage:
    python caustic_optimizer.py --target poi_antispin_3petal \
        --focal 300 --radius 18 --output /output/caustic_disc.stl

Dependencies: numpy, scipy, matplotlib, trimesh
    pip install numpy scipy matplotlib trimesh
"""

import numpy as np
import argparse
import os

try:
    import matplotlib.pyplot as plt
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False


# ─── Physical constants ───────────────────────────────────────────────────────

IOR_RESIN = 1.53          # clear UV resin
IOR_AIR   = 1.0
THETA_C   = np.degrees(np.arcsin(IOR_AIR / IOR_RESIN))  # 41.1°


# ─── Target pattern generators ────────────────────────────────────────────────

def target_poi_antispin(grid_size, petals=3, R=1.0, line_width=0.03, n_samples=2000):
    """
    Target caustic: poi antispin n-petal flower.
    Returns 2D normalised energy density array.
    """
    r = R / petals
    t = np.linspace(0, 2 * np.pi, n_samples)
    
    # Exact poi antispin coordinates
    hx = R * np.cos(t)
    hy = R * np.sin(t)
    px = hx + r * np.cos(-petals * t)
    py = hy + r * np.sin(-petals * t)
    
    # Normalise to [-0.9, 0.9]
    scale = 0.9 / (R + r)
    px, py = px * scale, py * scale
    
    # Rasterise path to grid
    target = np.zeros((grid_size, grid_size))
    cx, cy = grid_size // 2, grid_size // 2
    
    for xi, yi in zip(px, py):
        gi = int(xi * cx + cx)
        gj = int(yi * cy + cy)
        if 0 <= gi < grid_size and 0 <= gj < grid_size:
            # Gaussian splat
            for di in range(-3, 4):
                for dj in range(-3, 4):
                    ni, nj = gi + di, gj + dj
                    if 0 <= ni < grid_size and 0 <= nj < grid_size:
                        dist2 = (di**2 + dj**2) / (grid_size * line_width)**2
                        target[ni, nj] += np.exp(-dist2)
    
    # Normalise
    target = target / target.sum() if target.sum() > 0 else target
    return target


def target_circle(grid_size, radius=0.7, line_width=0.02):
    """Focused ring caustic."""
    target = np.zeros((grid_size, grid_size))
    cx, cy = grid_size // 2, grid_size // 2
    
    for theta in np.linspace(0, 2*np.pi, grid_size * 4):
        xi = radius * np.cos(theta)
        yi = radius * np.sin(theta)
        gi = int(xi * cx + cx)
        gj = int(yi * cy + cy)
        if 0 <= gi < grid_size and 0 <= gj < grid_size:
            for di in range(-2, 3):
                for dj in range(-2, 3):
                    ni, nj = gi+di, gj+dj
                    if 0 <= ni < grid_size and 0 <= nj < grid_size:
                        dist2 = (di**2+dj**2) / (grid_size*line_width)**2
                        target[ni, nj] += np.exp(-dist2)
    
    target = target / target.sum()
    return target


def target_from_image(image_path, grid_size):
    """Load PNG as target distribution."""
    try:
        from PIL import Image
        img = Image.open(image_path).convert('L').resize((grid_size, grid_size))
        arr = np.array(img, dtype=float)
        arr = arr / arr.sum()
        return arr
    except ImportError:
        print("[Warning] PIL not installed — using poi_antispin target instead")
        return target_poi_antispin(grid_size)


# ─── Ray tracing ──────────────────────────────────────────────────────────────

def trace_rays(h_field, disc_radius_mm, focal_dist_mm, ior=IOR_RESIN, grid_size=None):
    """
    Trace refracted rays through height field h(x,y) at resin-air interface.
    
    For each surface point (x, y, h):
    - Incident ray: normal to disc (direction = [0, 0, -1])  
    - Surface normal: computed from h gradient
    - Refracted ray via Snell's law
    - Intersection with projection plane at z = -focal_dist_mm
    
    Returns:
        hit_x, hit_y : arrays of ray hit positions at projection plane
    """
    if grid_size is None:
        grid_size = h_field.shape[0]
    
    # Grid coordinates in mm
    lin = np.linspace(-disc_radius_mm, disc_radius_mm, grid_size)
    X, Y = np.meshgrid(lin, lin)
    mask = X**2 + Y**2 <= disc_radius_mm**2
    
    # Surface gradients (mm/mm)
    dh_dx = np.gradient(h_field, lin, axis=1)
    dh_dy = np.gradient(h_field, lin, axis=0)
    
    hit_x = []
    hit_y = []
    
    # Flatten for vectorised computation
    xs = X[mask]
    ys = Y[mask]
    hs = h_field[mask]
    dhx = dh_dx[mask]
    dhy = dh_dy[mask]
    
    # Surface normal (unnormalised): (-dh/dx, -dh/dy, 1)
    nx = -dhx
    ny = -dhy
    nz = np.ones_like(nx)
    n_len = np.sqrt(nx**2 + ny**2 + nz**2)
    nx, ny, nz = nx/n_len, ny/n_len, nz/n_len
    
    # Incident ray direction: (0, 0, 1) — light going upward through resin
    # At top surface, light exits from resin (n1=ior) to air (n2=1.0)
    # Snell's law vector form:
    # d_refracted = (n1/n2) * d_incident + (n1/n2 * cos_i - cos_t) * n
    
    n_ratio = ior / IOR_AIR  # > 1, so we're going denser to less dense
    
    # cos(incident angle) = dot(incident, normal)
    # incident = (0, 0, 1) pointing up, normal pointing up → cos_i = nz
    cos_i = nz  # dot((0,0,1), (nx,ny,nz))
    
    sin2_t = n_ratio**2 * (1 - cos_i**2)
    
    # TIR check — rays beyond critical angle don't exit
    valid = sin2_t <= 1.0
    cos_t = np.where(valid, np.sqrt(np.maximum(0, 1 - sin2_t)), 0)
    
    # Refracted direction
    rx = n_ratio * 0 - (n_ratio * cos_i - cos_t) * nx  # incident x=0
    ry = n_ratio * 0 - (n_ratio * cos_i - cos_t) * ny  # incident y=0
    rz = n_ratio * 1 - (n_ratio * cos_i - cos_t) * nz  # incident z=1
    
    # Propagate to projection plane at z = h + focal_dist_mm
    # t_param: z + rz * t = focal_dist_mm → t = (focal_dist - h) / rz
    with np.errstate(divide='ignore', invalid='ignore'):
        t_param = np.where(rz > 0.001, focal_dist_mm / rz, 0)
    
    proj_x = xs + rx * t_param
    proj_y = ys + ry * t_param
    
    # Keep valid rays (not TIR, reasonable projection)
    valid_proj = valid & (np.abs(proj_x) < focal_dist_mm) & (np.abs(proj_y) < focal_dist_mm)
    
    return proj_x[valid_proj], proj_y[valid_proj]


def compute_caustic_density(hit_x, hit_y, grid_size, proj_radius):
    """Convert ray hit positions to energy density grid."""
    density = np.zeros((grid_size, grid_size))
    cx = grid_size // 2
    
    for x, y in zip(hit_x, hit_y):
        gi = int(x / proj_radius * cx + cx)
        gj = int(y / proj_radius * cx + cx)
        if 0 <= gi < grid_size and 0 <= gj < grid_size:
            density[gi, gj] += 1
    
    # Smooth slightly
    from scipy.ndimage import gaussian_filter
    density = gaussian_filter(density, sigma=1.5)
    
    total = density.sum()
    return density / total if total > 0 else density


# ─── Optimiser ────────────────────────────────────────────────────────────────

def optimise_height_field(
    target,
    disc_radius_mm=18.0,
    focal_dist_mm=300.0,
    max_height_mm=0.5,
    n_iterations=200,
    learning_rate=0.01,
    grid_size=64,
    ior=IOR_RESIN,
    verbose=True
):
    """
    Gradient descent optimisation of surface height field.
    
    Minimises Wasserstein-like distance between:
    - current caustic distribution (ray trace of h)
    - target caustic distribution
    
    Returns optimised height field h(x,y) in mm.
    """
    from scipy.ndimage import gaussian_filter
    
    # Initialise flat
    h = np.zeros((grid_size, grid_size))
    disc_mask = _disc_mask(grid_size, disc_radius_mm, disc_radius_mm)
    
    # Resize target to grid_size
    from scipy.ndimage import zoom
    if target.shape[0] != grid_size:
        scale = grid_size / target.shape[0]
        target_resized = zoom(target, scale)
        target_resized = np.maximum(target_resized, 0)
        target_resized /= target_resized.sum()
    else:
        target_resized = target.copy()
    
    losses = []
    
    for iteration in range(n_iterations):
        # Trace current field
        hit_x, hit_y = trace_rays(h, disc_radius_mm, focal_dist_mm, ior, grid_size)
        current = compute_caustic_density(hit_x, hit_y, grid_size, focal_dist_mm * 0.8)
        
        # Loss: mean squared difference
        diff = current - target_resized
        loss = np.mean(diff**2)
        losses.append(loss)
        
        if verbose and iteration % 20 == 0:
            print(f"  Iter {iteration:3d}: loss={loss:.6f}")
        
        # Gradient: perturb h at each point, measure loss change
        # Simplified: use diff image to drive h update
        # (Proper gradient requires adjoint ray tracing — this is approximate)
        grad_h = np.zeros_like(h)
        
        # Back-project: regions where current > target need less height (flatten rays)
        # regions where current < target need more (concentrate rays)
        lin = np.linspace(-disc_radius_mm, disc_radius_mm, grid_size)
        X, Y = np.meshgrid(lin, lin)
        
        # Simple feedback: h += lr * (target - current) convolved with position
        feedback = target_resized - current
        feedback = gaussian_filter(feedback, sigma=2.0)
        
        # Map feedback on projection plane back to disc coordinates
        scale = disc_radius_mm / (focal_dist_mm * 0.8)
        grad_h = _backproject_feedback(feedback, X, Y, disc_mask, scale, grid_size)
        
        h = h + learning_rate * grad_h
        h = np.clip(h, 0, max_height_mm)
        h = h * disc_mask
        
        # Smooth to prevent high-frequency artifacts
        h = gaussian_filter(h, sigma=0.5)
    
    if verbose:
        print(f"\n[Optimise] Final loss: {losses[-1]:.6f} (started: {losses[0]:.6f})")
        print(f"[Optimise] Height range: {h.min():.3f}–{h.max():.3f}mm")
    
    return h, losses


def _disc_mask(grid_size, disc_radius_mm, max_radius):
    """Binary mask for circular disc."""
    lin = np.linspace(-max_radius, max_radius, grid_size)
    X, Y = np.meshgrid(lin, lin)
    return (X**2 + Y**2 <= disc_radius_mm**2).astype(float)


def _backproject_feedback(feedback, X, Y, mask, scale, grid_size):
    """Simple backprojection from projection plane to disc surface."""
    grad = np.zeros_like(X)
    
    # For each disc point, sample feedback at the projected location
    proj_x = X * scale * (grid_size // 2) + grid_size // 2
    proj_y = Y * scale * (grid_size // 2) + grid_size // 2
    
    proj_xi = np.clip(proj_x.astype(int), 0, grid_size - 1)
    proj_yi = np.clip(proj_y.astype(int), 0, grid_size - 1)
    
    grad = feedback[proj_xi, proj_yi] * mask
    return grad


# ─── STL export ───────────────────────────────────────────────────────────────

def height_field_to_stl(h_field, disc_radius_mm, disc_thickness_mm=3.0,
                         output_path="caustic_disc.stl"):
    """
    Convert optimised height field to printable STL disc.
    Top face: height field surface.
    Bottom face: flat (glass-bed optical face).
    Side walls: vertical.
    """
    try:
        import trimesh
        import numpy as np
    except ImportError:
        print("[Error] trimesh required: pip install trimesh")
        return
    
    grid_size = h_field.shape[0]
    lin = np.linspace(-disc_radius_mm, disc_radius_mm, grid_size)
    X, Y = np.meshgrid(lin, lin)
    
    verts = []
    faces = []
    
    # Top surface vertices (height field + disc_thickness)
    top_start = 0
    for i in range(grid_size):
        for j in range(grid_size):
            z = disc_thickness_mm + h_field[i, j]
            verts.append([X[i, j], Y[i, j], z])
    
    # Bottom surface vertices (flat at z=0)
    bot_start = grid_size * grid_size
    for i in range(grid_size):
        for j in range(grid_size):
            verts.append([X[i, j], Y[i, j], 0.0])
    
    # Top surface faces (quads → triangles)
    for i in range(grid_size - 1):
        for j in range(grid_size - 1):
            v00 = top_start + i * grid_size + j
            v10 = top_start + (i+1) * grid_size + j
            v11 = top_start + (i+1) * grid_size + (j+1)
            v01 = top_start + i * grid_size + (j+1)
            
            # Only add face if all 4 verts are within disc
            if all(X.flat[k % (grid_size*grid_size)]**2 + 
                   Y.flat[k % (grid_size*grid_size)]**2 <= disc_radius_mm**2
                   for k in [v00-top_start, v10-top_start, 
                              v11-top_start, v01-top_start]):
                faces.append([v00, v10, v11])
                faces.append([v00, v11, v01])
    
    # Bottom surface faces (reversed normals)
    for i in range(grid_size - 1):
        for j in range(grid_size - 1):
            v00 = bot_start + i * grid_size + j
            v10 = bot_start + (i+1) * grid_size + j
            v11 = bot_start + (i+1) * grid_size + (j+1)
            v01 = bot_start + i * grid_size + (j+1)
            
            if all(X.flat[k % (grid_size*grid_size)]**2 + 
                   Y.flat[k % (grid_size*grid_size)]**2 <= disc_radius_mm**2
                   for k in [v00-bot_start, v10-bot_start, 
                              v11-bot_start, v01-bot_start]):
                faces.append([v00, v11, v10])  # reversed
                faces.append([v00, v01, v11])  # reversed
    
    verts_arr = np.array(verts)
    faces_arr = np.array(faces)
    
    mesh = trimesh.Trimesh(vertices=verts_arr, faces=faces_arr)
    mesh.export(output_path)
    print(f"[STL] Saved: {output_path}")
    print(f"      {len(verts_arr)} vertices, {len(faces_arr)} faces")
    
    return mesh


# ─── CLI entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Caustic disc optimiser for resin printing")
    parser.add_argument("--target", default="poi_antispin_3petal",
                        choices=["poi_antispin_3petal", "poi_antispin_5petal",
                                 "circle", "custom_image"],
                        help="Target caustic pattern")
    parser.add_argument("--focal", type=float, default=300.0,
                        help="Projection distance in mm")
    parser.add_argument("--radius", type=float, default=18.0,
                        help="Disc radius in mm")
    parser.add_argument("--thickness", type=float, default=3.0,
                        help="Disc base thickness in mm")
    parser.add_argument("--max-height", type=float, default=0.5,
                        help="Maximum surface relief in mm")
    parser.add_argument("--iterations", type=int, default=200)
    parser.add_argument("--grid", type=int, default=64,
                        help="Optimisation grid resolution")
    parser.add_argument("--output", default="caustic_disc.stl")
    parser.add_argument("--image", default=None,
                        help="PNG path for custom_image target")
    parser.add_argument("--petals", type=int, default=3)
    parser.add_argument("--preview", action="store_true",
                        help="Show matplotlib preview before export")
    
    args = parser.parse_args()
    
    print(f"[Caustic] Target: {args.target}")
    print(f"[Caustic] Focal: {args.focal}mm, Disc: {args.radius}mm radius")
    print(f"[Caustic] Grid: {args.grid}x{args.grid}, Iterations: {args.iterations}")
    
    # Generate target
    if args.target == "poi_antispin_3petal":
        target = target_poi_antispin(args.grid, petals=3)
    elif args.target == "poi_antispin_5petal":
        target = target_poi_antispin(args.grid, petals=5)
    elif args.target == "circle":
        target = target_circle(args.grid)
    elif args.target == "custom_image":
        target = target_from_image(args.image, args.grid)
    
    # Optimise
    print(f"\n[Optimise] Running gradient descent...")
    h_opt, losses = optimise_height_field(
        target,
        disc_radius_mm=args.radius,
        focal_dist_mm=args.focal,
        max_height_mm=args.max_height,
        n_iterations=args.iterations,
        grid_size=args.grid,
    )
    
    # Preview
    if args.preview and HAS_MATPLOTLIB:
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        axes[0].imshow(target, cmap='hot')
        axes[0].set_title("Target Caustic")
        axes[1].imshow(h_opt, cmap='viridis')
        axes[1].set_title(f"Height Field (max={h_opt.max():.3f}mm)")
        axes[2].plot(losses)
        axes[2].set_title("Optimisation Loss")
        axes[2].set_xlabel("Iteration")
        plt.tight_layout()
        plt.savefig(args.output.replace('.stl', '_preview.png'))
        print(f"[Preview] Saved: {args.output.replace('.stl', '_preview.png')}")
    
    # Export STL
    height_field_to_stl(h_opt, args.radius, args.thickness, args.output)
    
    print("\n[Done] Print the disc with flat face on glass bed.")
    print("       Hold a light behind it — the poi flower appears.")
