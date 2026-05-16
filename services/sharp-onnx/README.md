# services/sharp-onnx — Apple SHARP via ONNX

Single-image gaussian-splat inference via Apple's SHARP model exported
to ONNX. The bench-side service the Vercel `sharp-onnx` provider in
`lib/capabilities/viz/splat-generate.server.ts` talks to over Tailscale
Funnel.

## What's here

- `inference_onnx.py` — canonical SHARP-ONNX inference helper. Loads
  the FP16 graph through onnxruntime, runs on a 1536×1536 image,
  emits a PLY of ~1.18 M gaussians.
- `convert_sharp_ply.py` — SHARP's PLY is a superset of standard 3DGS
  (extra metadata blocks after the vertex element). Web viewers reject
  the superset. This script strips the trailing blocks and pads zero
  spherical-harmonic coefficients so the output loads in Postshot /
  Spark / `@mkkellogg/gaussian-splats-3d`.
- `batch_cctv.py` — operator helper. Walks a directory of stills and
  runs each through SHARP. Recovers from CUDA-700 context corruption
  by recreating the InferenceSession (a real failure mode on the
  studio bench's RTX 3080 Ti).
- `submit_flat_via_service.sh` — bench helper to submit a directory
  to the FastAPI front (one of the bench's existing wrapper services).

## What's NOT here (gitignored)

- `sharp_fp16.onnx` — the SHARP model weights (~1.3 GB, restricted
  research licence per `apple-amlr`). Operators download separately.
- `.venv/` — Python virtual environment. Each bench host builds its
  own.
- `__pycache__/`, run logs, batch artefacts.

## Licence posture

SHARP outputs are **research-only** (apple-amlr). Records emitted by
this service carry `licence: "research-only"` in
`sourceRef.splat.licence` and the Vercel commerce filter rejects them
automatically. Do not surface these on `/shop` or any editioned
flow — `/research/cctv-3d-archive` is the canonical home.

## Bench-local dev

```pwsh
cd services/sharp-onnx
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install onnxruntime-gpu numpy plyfile pillow
# Drop sharp_fp16.onnx in this directory.
python inference_onnx.py -m sharp_fp16.onnx -i test.png -o test.ply -d 0.5
```

## Bench-to-Vercel bridge

When a Vercel function needs to invoke this, it goes through the
shared FastAPI wrapper exposed at `sharp-onnx-bench.tail99b2a4.ts.net`
with bearer auth. See `holoflow-bench-bridge` skill.
