# Tensegrity Simplex T3 — Snelson/Fuller Self-Stress

**Blender 5.1 · Python + numpy · CC0**  
Topic: `scripting` | Category: poi-head | WebXR-ready GLB

---

## What this is

A tensegrity is a structure in which a web of continuous cables (tension-only members)
prestresses a set of disconnected struts (compression-only members). The remarkable
property is that the struts *float* — they never touch each other, held apart only by
the cable network. The whole assembly is globally rigid even though no strut contacts
any other.

The **T3 simplex** is the smallest 3-D tensegrity: three struts, nine cables, six nodes.
It was first built by sculptor **Kenneth Snelson** in 1948 and later popularised by
**Buckminster Fuller**, who coined the portmanteau "tensegrity" in 1962.

---

## Force-density method (Schek 1974)

For a structure with `j` nodes, `e` elements and signed incidence matrix `C ∈ ℝ^{e×j}`:

```
D = Cᵀ diag(q) C       force-density matrix (j × j)
```

Each row `k` of `C` has `+1` at the "from" node and `−1` at the "to" node.  
Each `q_k` is the **force density** of element `k`:
- `q_k > 0` → cable (tension): force pulls nodes together
- `q_k < 0` → strut (compression): force pushes nodes apart

Equilibrium requires `D x = 0`, `D y = 0`, `D z = 0` simultaneously.

**Self-stress condition**: for a proper 3-D structure, `nullity(D) = 4`.  
The four null vectors are the x/y/z coordinate arrays of the nodes plus the
all-ones translation vector. This proves the structure has one self-stress mode
and no infinitesimal mechanism.

---

## Analytic force-density ratios for the 30°-twist T3 simplex

Setting the circumradius `R`, height `H`, and bottom-triangle twist `+30°`:

| Element group | Index pairs | q |
|---|---|---|
| Struts (compression) | (0,4),(1,5),(2,3) | **−1** |
| Saddle cables | (0,3),(1,4),(2,5) | **+1** |
| Triangle cables | (0,1),(1,2),(0,2),(3,4),(4,5),(3,5) | **+1/√3 ≈ 0.577** |

Derivation: balance y and z components at node T₀ → `q_strut = −q_saddle`.  
Balance x component → `q_triangle = q_saddle/√3`. Both hold for **any** height H.

This height-independence is non-trivial: it means the same prestress ratio works
whether the structure is extended or nearly flat — only the element *lengths* change.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Expert bpy+numpy script → runs in Blender Text Editor |
| `record.py` | Animation setup for viewport.mp4 export |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

---

## Shape keys

| Key | H | Twist | Description |
|---|---|---|---|
| `SK_Extended` | 0.28 m | +30° | Nominal configuration |
| `SK_Compressed` | 0.07 m | +30° | Near-flat disc |
| `SK_Inverted` | 0.28 m | −30° | Mirror chirality (left-handed isomer) |

---

## Studio interests

- **WebXR poi head**: fits within 0.15 m radius, `holoflow:facet = True`
- **3D print prep**: solid closed-shell cylinders for each element; merge nodes for FDM
- **Cel-shading**: cobalt struts / amber cables read well in flat-lit renders

---

## Outside sources

1. **Snelson KD (1965)** US Patent 3,169,611 "Continuous tension, discontinuous
   compression structures" — Public Domain (patent expired)  
   https://patents.google.com/patent/US3169611A/en  
   Related sibling work: Buckminster Fuller Patent US2986241 (Fuller geodesics)

2. **Schek H-J (1974)** "The force density method for form finding and computation
   of general networks" *Computer Methods in Applied Mechanics and Engineering*
   3(1):115-134. DOI:10.1016/0045-7825(74)90045-0  
   NumPy eigenvalue solver used: https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigvalsh.html
   (BSD-3-Clause, NumPy Developers)

---

*Library entry authored for Holoflow Studio · CC0 · 2026-08-22*
