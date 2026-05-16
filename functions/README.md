# functions/ — Holoflow Studio Cloud Functions for Firebase

Python 3.12 HTTPS functions that host the CPU-Python services from the
[`services/`](../services/) tree as visitor-callable backends. The
matching `/atelier/<name>` chambers on the Next.js side call into these
functions.

## Why Firebase Functions, not Vercel Functions

- **Vercel Functions**: easy from Next.js but the heavy image-processing
  Python deps (opencv-python, scikit-image, numpy-stl, rembg, trimesh)
  bloat the cold-start and the 250 MB unzipped function-size cap is
  tight. Vercel functions are best for thin TypeScript / lightweight
  Python.
- **Firebase Functions**: 2nd-gen Python runtime, 8 GB RAM ceiling,
  9-minute timeout, scale-to-zero free tier. Native fit for the CPU-Python
  chambers. Same `gen-lang-client-0149679024` project as Firestore.
- **The bench (Tailscale Funnel + bearer)**: required for GPU work
  (SHARP, gsplat training, 4D-GS). NOT required for the CPU-Python
  chambers since these run as pure Python transforms.

So the chamber backend matrix becomes:

| Chamber type | Backend | Example |
| --- | --- | --- |
| Pure-browser | none | `/atelier/pixelify` |
| CPU-Python transform | Firebase Functions | `/atelier/lithophane`, `/atelier/remove-bg` |
| GPU service (mid-cost) | Bench via Tailscale Funnel | SHARP single-image splat |
| GPU service (heavy) | Bench (operator-triggered) | gsplat / 4D-GS training |

## Functions in this deploy

| Function | Path | What it does |
| --- | --- | --- |
| `lithophane` | `/lithophane` | Image → printable lithophane STL |
| (more landing) |  |  |

## Deploy

One-time setup (operator, on a workstation with the gcloud / firebase CLI):

```pwsh
npm install -g firebase-tools
firebase login
firebase use gen-lang-client-0149679024
```

Per-deploy:

```pwsh
cd D:\.github\_3DPOV
firebase deploy --only functions
```

The `firebase.json` at repo root points at this directory's
`main.py` + `requirements.txt`. Each deploy publishes every function
declared with `@https_fn.on_request` decorator.

After deploy, the URLs look like:

```
https://us-central1-gen-lang-client-0149679024.cloudfunctions.net/lithophane
```

The Vercel-side chambers point at those URLs via the
`NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE` env (production-baked) or
`http://localhost:5001/.../<region>/<func>` (when running the emulator).

## Local emulator

```pwsh
cd D:\.github\_3DPOV
firebase emulators:start --only functions
```

Functions run at `http://localhost:5001/gen-lang-client-0149679024/us-central1/<name>`.

## Dependencies

Listed in `requirements.txt`. Keep them lean — Firebase Functions ship
the full deps list in every deploy. If a chamber needs a heavy ML
model (e.g. `rembg` downloads a U²-Net ONNX on first run), it goes in
`requirements.txt` once; the cold-start downloads and the warm
instances reuse it.

## Pattern (per new chamber)

Each chamber adds one function:

```python
@https_fn.on_request(
    region="us-central1",
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    memory=options.MemoryOption.MB_512,
    timeout_sec=120,
)
def <name>(req: https_fn.Request) -> https_fn.Response:
    # Parse multipart upload + params
    # Run the transform
    # Return bytes (file) or JSON (metadata)
```

Headers, CORS, and method allow-list are uniform across all the
chambers' functions; only the body shape and the transform differ.
