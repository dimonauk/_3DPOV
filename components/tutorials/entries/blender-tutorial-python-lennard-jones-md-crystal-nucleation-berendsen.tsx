import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Lennard-Jones potential is the archetypal model for noble-gas
        atoms: a steep repulsive core (r⁻¹²) combined with a shallow attractive
        well (−r⁻⁶). At high temperature, thermal energy overwhelms the well
        and particles scatter freely. Cool the system and small hexagonally
        ordered patches appear spontaneously — crystal nucleation driven by
        no external template, only the geometry of the potential minimum at
        r₀ = 2^(1/6)σ ≈ 1.122σ.
      </p>
      <p>
        This tutorial implements a full 2D LJ molecular dynamics simulation in
        Blender 5.1 Python using <strong>numpy</strong> (bundled) for vectorised
        O(N²) force computation, a <strong>Velocity Verlet</strong> integrator,
        and a <strong>Berendsen thermostat</strong> for controlled cooling from
        T*=2.0 (hot liquid) to T*=0.35 (polycrystalline solid) over 240 frames.
        100 atom positions are precomputed and baked as Blender object location
        keyframes — no per-frame handler, no Simulation Zone. The hexagonal
        lattice the atoms settle into is the same geometry behind the studio&apos;s{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-flat-normals" className={lk}>
          faceted-gem aesthetic
        </Link>
        , here arising spontaneously from physics.
      </p>

      <h2>Potential and force</h2>
      <pre>{`V(r) = 4ε [(σ/r)¹² − (σ/r)⁶]    (ε=σ=m=1 reduced units)
F_ij = (48/r²)[(σ/r)¹² − 0.5(σ/r)⁶] · r_ij

r₀ = 2^(1/6)σ ≈ 1.122σ  →  V(r₀) = −ε
Cutoff: r_cut = 2.5σ
2D melting at ρ*≈0.826: T*_melt ≈ 0.45–0.55`}</pre>

      <h2>Why numpy and not a Geometry Nodes Simulation Zone?</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          SPH fluid tutorial
        </Link>{" "}
        uses <strong>IndexOfNearest</strong> for a 1-nearest-neighbour
        approximation. That works for SPH pressure repulsion because the
        nearest neighbour is always the most dangerous. LJ is different: the{" "}
        <em>attractive</em> well acts from r₀ to r_cut = 2.5σ, and crystal
        nucleation requires a particle to feel attraction from roughly 6
        neighbours simultaneously to lock into the hexagonal lattice. With
        only 1 neighbour you get chain clustering — not crystals. The same
        reasoning applies to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting"
          className={lk}
        >
          N-body gravity tutorial
        </Link>
        : when pairwise interactions drive the interesting physics, Python
        precomputation with numpy is cleaner than approximating inside GN.
      </p>

      <h2>Vectorised minimum-image force computation</h2>
      <pre>{`dr  = pos[:, None, :] - pos[None, :, :]   # (N, N, 2)
dr -= L_BOX * np.round(dr / L_BOX)        # minimum-image PBC fold
r2  = np.einsum('ijk,ijk->ij', dr, dr)    # (N, N) squared distances
mask = (r2 < R_CUT**2) & (r2 > 1e-12)
r6i  = (np.where(mask, r2, 1.0) ** (-1)) ** 3
fsc  = np.where(mask, 48.0 / r2 * (r6i**2 - 0.5 * r6i), 0.0)
# F_i = Σ_j fsc[i,j] · (pos_j − pos_i)
return -np.einsum('ij,ijk->ik', fsc, dr)  # (N, 2)`}</pre>
      <p>
        The minimum-image fold wraps each displacement component into
        (−L/2, L/2] so particles near opposite walls feel attraction across the
        periodic boundary. Without it, the box edge acts as a hard wall.
        Sign note: <code>dr[i,j] = pos[i]−pos[j]</code> points from j to i,
        so the force on i from j is <code>fsc × (−dr[i,j])</code> — the
        minus sign makes attraction pull i toward j.
      </p>

      <h2>Velocity Verlet + Berendsen thermostat</h2>
      <pre>{`# Velocity Verlet (symplectic, O(dt²) energy error):
vel += 0.5 * acc * DT           # half-kick
pos += vel * DT; pos %= L_BOX   # drift + periodic wrap
acc  = lj_forces(pos)
vel += 0.5 * acc * DT           # complete kick

# Berendsen rescaling (weak coupling, τ_B = 0.5 τ):
T_curr = np.sum(vel**2) / (2.0 * N_PART)   # 2D kinetic temperature
λ = np.sqrt(1 + (DT / TAU_B) * (T_target / T_curr − 1))
vel *= λ`}</pre>
      <p>
        Velocity Verlet is time-reversible and conserves a modified Hamiltonian,
        unlike simple Euler which injects energy each step (the same instability
        warned against in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly"
          className={lk}
        >
          double-pendulum tutorial
        </Link>
        ). Berendsen thermostat does <em>not</em> sample the canonical ensemble
        rigorously — for production physics use Nosé-Hoover (jax-md, OpenMM).
        For Blender visualisation its advantages outweigh the flaw: fast
        settling, no position-space ringing, and simple implementation.
      </p>

      <h2>Fast fcurve keyframing for 100 objects × 240 frames</h2>
      <p>
        Calling <code>keyframe_insert(&apos;location&apos;)</code> 100×240=24,000
        times takes 24–120 s (1–5 ms per RNA evaluation). The fast path builds
        F-curve keyframe points directly:
      </p>
      <pre>{`act = bpy.data.actions.new(f"atom_{i:03d}")
obj.animation_data_create()
obj.animation_data.action = act
fcu = act.fcurves.new(data_path='location', index=0)
pts = fcu.keyframe_points
pts.add(N_FRAMES)                        # pre-allocate all points
for f in range(N_FRAMES):
    kp = pts[f]
    kp.co           = (float(f+1), float(traj_x[f, i]))
    kp.interpolation = 'LINEAR'
fcu.update()                             # rebuild handle cache`}</pre>
      <p>
        Pre-allocating with <code>pts.add(N_FRAMES)</code> then writing{" "}
        <code>.co</code> directly takes under 3 s for 100 objects × 3 axes ×
        240 frames. The same approach applies to any dense precomputed
        animation — camera rails, wave-baked vertex data, procedural rigs. For
        sparse keyframes, <code>keyframe_insert</code> is fine; beyond a few
        hundred calls, the direct API wins.
      </p>
      <p>
        The shared emission material has its <strong>Color socket
        keyframed</strong> — warm white at frame 1 (hot), cyan at frame 100
        (liquid), violet at frame 240 (crystal) — representing global kinetic
        temperature. The same per-frame scatter-colour approach is discussed in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-instance-on-points-scatter-webxr"
          className={lk}
        >
          crystal garden scatter tutorial
        </Link>
        .
      </p>

      <h2>What to observe</h2>
      <p>
        <strong>Frames 1–80 (T* ≈ 2.0–1.3).</strong> Hot liquid; particles
        move rapidly, white glow. No long-range order.
      </p>
      <p>
        <strong>Frames 80–160 (T* ≈ 1.3–0.6).</strong> Cooling liquid; transient
        equilateral-triangle clusters form and dissolve. Cyan glow.
      </p>
      <p>
        <strong>Frames 160–240 (T* ≈ 0.6–0.35).</strong> Crystal nucleation —
        small hexagonal patches lock in and grow until they meet at grain
        boundaries. Violet glow. The inter-particle spacing in the crystal
        regions converges to r₀ ≈ 1.12σ.
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>Explosion on step 1.</strong> Initial overlap (r ≪ σ) causes
        extreme repulsive forces. The lattice jitter is ±0.08σ — safe. If you
        increase ρ* (lower L_BOX or raise N_PART) check that the minimum
        initial separation stays above 0.85σ.
      </p>
      <p>
        <strong>No crystal by frame 240.</strong> T_END is above the melting
        point at the chosen density. Lower T_END to 0.25 or raise N_SUBSTEPS
        to 12 for more simulation time per frame.
      </p>

      <h2>Outside sources</h2>
      <p>
        <strong>jax-md</strong> (Apache-2.0, Google Brain) — vectorised LJ
        force and Velocity Verlet reference:{" "}
        <a href="https://github.com/google/jax-md" className={lk}
           target="_blank" rel="noreferrer">
          github.com/google/jax-md
        </a>
        . Related: google/jax (Apache-2.0).
      </p>
      <p>
        <strong>OpenMM</strong> (MIT, Stanford) — Berendsen thermostat equations
        and integrator conventions:{" "}
        <a href="https://github.com/openmm/openmm" className={lk}
           target="_blank" rel="noreferrer">
          github.com/openmm/openmm
        </a>
        . Related: openmm/openmmtools (MIT).
      </p>
      <p>
        <strong>NumPy</strong> (BSD-3-Clause) — bundled with Blender 5.1;
        provides the broadcasting and einsum primitives used in{" "}
        <code>lj_forces()</code>:{" "}
        <a href="https://github.com/numpy/numpy" className={lk}
           target="_blank" rel="noreferrer">
          github.com/numpy/numpy
        </a>
        . Related: scipy/scipy (BSD-3-Clause).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-lennard-jones-md-crystal-nucleation-berendsen",
  title:
    "Python numpy LJ-MD: Lennard-Jones Molecular Dynamics — Crystal Nucleation & Berendsen Thermostat (Blender 5.1)",
  subtitle:
    "All-pairs LJ forces via numpy broadcasting; Velocity Verlet; Berendsen cooling from hot liquid to hexagonal crystal; fast fcurve keyframe API.",
  description:
    "Implement 2D Lennard-Jones molecular dynamics in Blender Python: vectorised O(N²) forces with numpy, Velocity Verlet integrator, Berendsen thermostat cooling from T*=2.0 to T*=0.35, and fast object-location fcurve keyframing to animate 100 atoms crystallising into a hexagonal lattice.",
  date: "2026-07-24",
  tags: [
    "blender",
    "python",
    "molecular-dynamics",
    "physics",
    "crystal",
    "numpy",
    "simulation",
    "particles",
    "animation",
    "eevee",
    "keyframes",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-lennard-jones-md-crystal-nucleation-berendsen",
});
