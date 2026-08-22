# Hopf Fibration — S³ → S² Fibre Bundle, Linked Circles & Poi Ball (Blender 5.1)

Heinz Hopf's 1931 construction: a principal S¹ bundle over S² with total
space S³.  Every fibre is a great circle on S³; after stereographic projection
to ℝ³ each becomes a circle, and any two distinct fibres are *Hopf-linked* —
each passes exactly once through the interior of the other.  Fibres over a
latitude circle on S² sweep out a torus in ℝ³.  The equatorial latitude yields
the **Clifford torus** (conformal flat torus, major radius R = √2, tube radius
r = 1 in the normalised projection).

This blueprint visualises the fibration as a lattice of interlocked tube circles
forming a 10 cm poi ball, with three shape keys morphing through: equatorial
band → upper/lower hemisphere → near-full sphere.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main bpy script: fibre computation, Bishop-frame tubes, vertex colours, shape keys, GLB export |
| `record.py` | 120-frame Workbench animation script |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

1. Open Blender 5.1.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` and click ▶ **Run Script**.
4. The mesh appears in the viewport; a GLB is written to
   `public/library/glbs/scripting/…/hf_hopf.glb`.
5. Optionally run `record.py` to generate `viewport.mp4`.

## Mathematical notes

- **Hopf invariant**: the linking number of any two fibres = 1 (that's
  what makes the bundle non-trivial; a trivial bundle would have linking
  number 0).
- **Villarceau circles**: any torus contains two families of circles lying
  entirely on the surface — these are exactly the Hopf fibres over the
  two latitudinal circles mapping to the core and co-core of the torus.
- **Clifford torus** (equatorial fibres): the unique embedded flat torus
  in S³ with equal principal curvatures.  In ℝ³ it appears as a standard
  ring torus with R = √2, r = 1.
- **Connection to spin geometry**: the Hopf map is essentially the unit
  quaternion → rotation map (S³ → SO(3)), which is the double cover used
  in all quaternion-based 3D rotation libraries.

## Licence
CC0 — no rights reserved.  Mathematical content (Hopf 1931) is in the
public domain.  bpy script is original studio work released CC0.

## Studio links
- Tutorial: `/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr`
- Codex: see *Hopf fibration*, *Clifford torus*, *principal fibre bundle*
