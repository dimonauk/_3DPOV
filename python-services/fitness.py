"""
fitness.py — Multi-axis fitness evaluation for sculptural genomes.

5 scoring axes (each 0–5):
  printability  — geometric constraints for SLA resin printing
  optical       — waveguide / caustic potential from geometry
  complexity    — aesthetic information content
  coherence     — how well the genome's genes work together
  novelty       — deviation from population mean

Total score = weighted sum, normalised to [0, 5].

Human scores override automated scores when provided.
"""
import numpy as np
import trimesh
from typing import Optional


# Axis weights for total score
AXIS_WEIGHTS = {
    "printability": 0.25,
    "optical":      0.25,
    "complexity":   0.20,
    "coherence":    0.15,
    "novelty":      0.15,
}

# Minimum wall thickness for Elegoo Saturn SLA (19µm XY, ~50µm Z)
MIN_WALL_MM = 0.3
MIN_FEATURE_MM = 0.15


def score_printability(mesh: trimesh.Trimesh, genome) -> float:
    """
    Geometric constraints for SLA printing.
    - Wall thickness vs minimum
    - Overhangs (>45° from build plate)
    - Mesh integrity (watertight, no degenerate faces)
    - Scale fits printer bed (max ~218×123 mm Elegoo Saturn 4)
    """
    score = 5.0
    penalties = []

    # Watertight
    if not mesh.is_watertight:
        penalties.append(("not watertight", 1.0))

    # Scale check
    bounds = mesh.bounds
    dims = bounds[1] - bounds[0]
    max_dim = dims.max()
    if max_dim > 218:
        penalties.append(("exceeds bed X (218mm)", 1.5))
    elif max_dim > 120:
        penalties.append(("large but printable", 0.2))

    # Minimum feature — approximate via mean edge length
    edges = mesh.edges_unique_length
    if len(edges) > 0:
        mean_edge = edges.mean()
        if mean_edge < MIN_FEATURE_MM:
            penalties.append(("features too fine", 1.0))

    # Overhangs — faces pointing downward more than 45°
    face_normals = mesh.face_normals
    down = np.array([0, 0, -1.0])
    dot = face_normals @ down
    overhang_ratio = (dot > 0.707).mean()  # >45°
    if overhang_ratio > 0.4:
        penalties.append((f"high overhangs ({overhang_ratio:.0%})", 0.5))

    # Degenerate faces
    degenerate_ratio = (mesh.triangles_area < 1e-6).mean()
    if degenerate_ratio > 0.05:
        penalties.append(("degenerate faces", 0.5))

    for reason, penalty in penalties:
        score -= penalty

    return max(0.0, min(5.0, score))


def score_optical(genome) -> float:
    """
    Estimate optical potential from genome parameters.
    Rewards configurations that should produce strong caustics/waveguiding.
    """
    score = 0.0

    ior = genome.denorm("ior")           # 1.45–1.65
    trans = genome.genes["transmission"]
    emission = genome.genes["emission"]
    grating_pitch = genome.denorm("grating_pitch")  # µm
    channel_ratio = genome.genes["channel_ratio"]
    tube_r = genome.denorm("tube_radius")  # mm

    # IOR reward — higher IOR = better light bending
    ior_score = (ior - 1.45) / 0.20 * 2.0  # 0–2 pts
    score += ior_score

    # Transmission reward — translucent > opaque
    score += trans * 1.5

    # Emission: small bonus but not too dominant
    score += min(emission * 0.3, 0.5)

    # Grating pitch in visible light range (400–700nm practical SLA)
    # SLA prints at 19µm — smallest grating is ~38µm (2 pixels)
    # Geometric optics kicks in at >>λ — so we want 50–200µm for caustic effects
    if 50 <= grating_pitch <= 200:
        score += 1.0
    elif 200 < grating_pitch <= 400:
        score += 0.5

    # Waveguide: small tight tubes are better
    if tube_r < 1.5:
        score += 0.5

    return min(5.0, score)


def score_complexity(mesh: trimesh.Trimesh, genome) -> float:
    """
    Aesthetic information content.
    - Surface area to volume ratio (complexity)
    - Vertex distribution entropy
    - Pattern entropy from gene values
    """
    if mesh is None or len(mesh.vertices) < 4:
        return 0.0

    score = 0.0

    # Surface area / volume
    try:
        sa = mesh.area
        vol = abs(mesh.volume) if mesh.is_watertight else sa * 0.1
        sa_v_ratio = sa / (vol + 1e-6)
        # Normalise: flat plane → very high, sphere → ~4.8 (for unit sphere)
        # Target: 20–100 range for interesting sculptures
        normalised = np.clip(sa_v_ratio / 50.0, 0, 1)
        score += normalised * 2.0
    except Exception:
        score += 1.0

    # Vertex position entropy
    try:
        positions = mesh.vertices
        hist, _ = np.histogramdd(positions, bins=10)
        hist_norm = hist / (hist.sum() + 1e-10)
        entropy = -np.sum(hist_norm * np.log(hist_norm + 1e-10))
        max_entropy = np.log(10 ** 3)
        score += (entropy / max_entropy) * 2.0
    except Exception:
        score += 1.0

    # Gene diversity bonus (not all genes at 0.5)
    gene_vals = np.array(list(genome.genes.values()))
    diversity = np.std(gene_vals) * 3.0
    score += min(1.0, diversity)

    return min(5.0, score)


def score_coherence(genome) -> float:
    """
    Penalise contradictory gene combinations.
    E.g. max opacity + max waveguide network = incoherent
    """
    score = 5.0
    genes = genome.genes

    # Opaque + high emission = incoherent
    if genes["transmission"] < 0.2 and genes["emission"] > 0.7:
        score -= 1.0

    # Very fine wall + complex slime = unprintable combination
    if genome.type == "slime" and genes["wall_thickness"] < 0.2:
        score -= 0.8

    # WGM: needs reasonable symmetry
    if genome.type == "wgm" and genes["symmetry"] < 0.2:
        score -= 0.5

    # Ctenophore: high twist is integral to the form
    if genome.type == "ctenophore" and genes["twist"] < 0.2:
        score -= 0.3

    # Very high noise + very thin walls = surface chaos won't print
    if genes["noise_amplitude"] > 0.7 and genes["wall_thickness"] < 0.25:
        score -= 0.7

    # Positive coherence: genes that reinforce each other
    if genes["transmission"] > 0.6 and genes["ior"] > 0.6:
        score += 0.3  # good optical combo

    if genes["tube_smoothness"] > 0.5 and genome.type == "slime":
        score += 0.2  # smooth slime looks good

    return max(0.0, min(5.0, score))


def score_novelty(genome, population: list) -> float:
    """
    Genetic distance from population mean.
    Rewards diversity.
    """
    if not population or len(population) < 2:
        return 2.5  # neutral

    gene_names = list(genome.genes.keys())

    # Mean gene vector of population
    pop_matrix = np.array([
        [g.genes.get(n, 0.5) for n in gene_names]
        for g in population
        if g.id != genome.id
    ])

    if len(pop_matrix) == 0:
        return 2.5

    pop_mean = pop_matrix.mean(axis=0)
    my_genes = np.array([genome.genes.get(n, 0.5) for n in gene_names])

    # Euclidean distance normalised to gene count
    dist = np.linalg.norm(my_genes - pop_mean) / np.sqrt(len(gene_names))

    # Map to 0–5: typical range 0.0–0.4
    return min(5.0, dist * 12.5)


def evaluate(genome, mesh: Optional[trimesh.Trimesh] = None,
             population: Optional[list] = None,
             human_score: Optional[float] = None) -> dict:
    """
    Full evaluation of a genome.

    Returns:
    {
        "printability": float,
        "optical": float,
        "complexity": float,
        "coherence": float,
        "novelty": float,
        "total": float,
        "human": float or None,
    }
    """
    scores = {}

    # If no mesh, use gene-only heuristics
    if mesh is None:
        scores["printability"] = score_coherence(genome) * 0.6 + 2.0
        scores["complexity"] = np.std(list(genome.genes.values())) * 5.0
    else:
        scores["printability"] = score_printability(mesh, genome)
        scores["complexity"] = score_complexity(mesh, genome)

    scores["optical"] = score_optical(genome)
    scores["coherence"] = score_coherence(genome)
    scores["novelty"] = score_novelty(genome, population or [])

    if human_score is not None:
        scores["human"] = float(human_score)
        # Human score overrides novelty and weights heavily
        total = (
            human_score * 0.5 +
            scores["printability"] * 0.15 +
            scores["optical"] * 0.15 +
            scores["complexity"] * 0.10 +
            scores["coherence"] * 0.10
        )
    else:
        scores["human"] = None
        total = sum(
            scores[axis] * weight
            for axis, weight in AXIS_WEIGHTS.items()
        )

    scores["total"] = min(5.0, max(0.0, total))
    return scores


def batch_evaluate(genomes: list, meshes: dict = None,
                   human_scores: dict = None) -> dict:
    """
    Evaluate a full population.
    meshes: optional {genome_id: trimesh}
    human_scores: optional {genome_id: float}
    Returns {genome_id: scores_dict}
    """
    results = {}
    meshes = meshes or {}
    human_scores = human_scores or {}

    for g in genomes:
        mesh = meshes.get(g.id)
        human = human_scores.get(g.id)
        scores = evaluate(g, mesh=mesh, population=genomes, human_score=human)
        g.score = scores["total"]
        g.scores = scores
        results[g.id] = scores

    return results
