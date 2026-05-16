"""Holoflow Studio Cloud Functions for Firebase — chambers backend.

Each `@https_fn.on_request`-decorated function below is a public HTTPS
endpoint deployed as a separate Firebase function. The matching
`/atelier/<name>` chamber on the Next.js side POSTs multipart uploads
and consumes the response.

# CORS posture
Every function sets `cors_origins="*"` so the visitor's browser can
call it directly. There's no auth on these — they're free-tier
visitor tools the studio offers. If a function needs rate-limiting or
auth in the future, switch to a check inside the body.

# Shared helpers
The functions all share the same pattern: read multipart file +
params, run a pure-Python transform, return bytes-with-mimetype or
JSON. The helpers below abstract the multipart parsing so each
function's body is just the transform.

# Adding a new chamber
1. Add a function below with `@https_fn.on_request` decorator
2. Add its deps to `requirements.txt`
3. Build the matching `/atelier/<name>` chamber
4. `firebase deploy --only functions:<name>`
"""

from __future__ import annotations

import io
import json
import logging
from typing import Any

from firebase_functions import https_fn, options

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


_DEFAULT_CORS = options.CorsOptions(
    cors_origins="*",
    cors_methods=["POST", "OPTIONS"],
)


def _read_uploaded_file(
    req: https_fn.Request, field: str = "file"
) -> tuple[bytes, str, str]:
    """Pull a single uploaded file out of the multipart request.

    Returns `(bytes, filename, mimetype)`. Raises `ValueError` if the
    field is missing or the request isn't multipart.
    """
    if field not in req.files:
        raise ValueError(f"missing multipart field '{field}'")
    storage = req.files[field]
    body = storage.read()
    filename = getattr(storage, "filename", None) or "upload"
    mimetype = getattr(storage, "mimetype", None) or "application/octet-stream"
    return body, filename, mimetype


def _form_int(req: https_fn.Request, key: str, default: int) -> int:
    value = req.form.get(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _form_float(req: https_fn.Request, key: str, default: float) -> float:
    value = req.form.get(key)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _bytes_response(
    payload: bytes,
    mimetype: str,
    filename: str | None = None,
) -> https_fn.Response:
    headers = {"Content-Type": mimetype}
    if filename:
        headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return https_fn.Response(payload, headers=headers)


def _json_response(payload: Any, status: int = 200) -> https_fn.Response:
    return https_fn.Response(
        json.dumps(payload),
        status=status,
        headers={"Content-Type": "application/json"},
    )


def _error(message: str, status: int = 400) -> https_fn.Response:
    return _json_response({"error": message}, status=status)


# ---------------------------------------------------------------------------
# /lithophane — image → printable lithophane STL
# ---------------------------------------------------------------------------


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.GB_1,
    timeout_sec=120,
)
def lithophane(req: https_fn.Request) -> https_fn.Response:
    """Image (grayscale or RGB) → STL lithophane mesh.

    Body (multipart):
        file: image bytes (any Pillow-readable format)
        scale: float — 1 unit = N mm of lithophane footprint. Default 0.5.
        layer_height: float — discrete brightness layer thickness in mm.
            Default 0.2.
        num_levels: int — number of brightness levels. Default 10.
        reduction: float — image resolution reduction (0–1). Lower is
            simpler / faster. Default 0.2.

    Returns: binary STL with Content-Type model/stl.
    """
    try:
        body, filename, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    scale = _form_float(req, "scale", 0.5)
    layer_height = _form_float(req, "layer_height", 0.2)
    num_levels = _form_int(req, "num_levels", 10)
    reduction = _form_float(req, "reduction", 0.2)

    # Heavy imports are inside the function so cold-start time for OTHER
    # functions in this deploy doesn't pay for these unless lithophane
    # is the one being called.
    import cv2
    import numpy as np
    from stl import mesh as stl_mesh
    from skimage.transform import rescale

    # Decode bytes → grayscale ndarray
    arr = np.frombuffer(body, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return _error("could not decode image", status=400)

    # Downscale for printability + speed
    img = rescale(
        img.astype(np.float32) / 255.0,
        reduction,
        anti_aliasing=True,
    )

    # Quantise to discrete levels — pixels become layers
    quantised = np.clip(np.round(img * (num_levels - 1)), 0, num_levels - 1)
    # Darker pixels are thicker (more opaque under backlight)
    thickness = (num_levels - quantised) * layer_height

    rows, cols = thickness.shape
    # Build a heightmap mesh: two triangles per pixel, plus a flat base
    # at z=0. Numpy-stl wants a flat triangle list.
    vertices: list[list[float]] = []
    faces: list[list[int]] = []

    def add_pixel(x: int, y: int, h: float) -> None:
        # Top quad of this pixel — 4 verts, 2 tris
        x0, x1 = x * scale, (x + 1) * scale
        y0, y1 = y * scale, (y + 1) * scale
        i = len(vertices)
        vertices.extend(
            [
                [x0, y0, h],
                [x1, y0, h],
                [x1, y1, h],
                [x0, y1, h],
            ]
        )
        faces.append([i, i + 1, i + 2])
        faces.append([i, i + 2, i + 3])

    for y in range(rows):
        for x in range(cols):
            add_pixel(x, y, float(thickness[y, x]))

    vertices_np = np.asarray(vertices, dtype=np.float32)
    faces_np = np.asarray(faces, dtype=np.int32)
    out = stl_mesh.Mesh(np.zeros(faces_np.shape[0], dtype=stl_mesh.Mesh.dtype))
    for i, face in enumerate(faces_np):
        for j in range(3):
            out.vectors[i][j] = vertices_np[face[j], :]

    buf = io.BytesIO()
    out.save(buf, mode=stl_mesh.Mode.BINARY)
    buf.seek(0)

    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    return _bytes_response(
        buf.getvalue(),
        mimetype="model/stl",
        filename=f"{base}_lithophane.stl",
    )


# ---------------------------------------------------------------------------
# /pixeldetector — image → native pixel-art resolution
# ---------------------------------------------------------------------------


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.MB_512,
    timeout_sec=60,
)
def pixeldetector(req: https_fn.Request) -> https_fn.Response:
    """Image → detected native pixel-art resolution.

    Body (multipart):
        file: image bytes (any Pillow-readable format)

    Returns JSON:
        nativeWidth: int — detected native pixel width
        nativeHeight: int — detected native pixel height
        scaleFactor: int — upscale factor (1 = already native)
        confidence: float — 0..1, higher means cleaner native grid

    Algorithm: for each scale factor s in 1..32 (capped at min(w, h)),
    downscale by s using nearest-neighbour, upscale back, measure RMSE
    vs the original. The smallest s where RMSE is near zero is the
    native pixel size.
    """
    try:
        body, _, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    # Heavy imports inside the function for cold-start hygiene.
    import numpy as np
    from PIL import Image

    try:
        img = Image.open(io.BytesIO(body)).convert("RGB")
    except Exception as exc:  # noqa: BLE001 — Pillow raises various
        return _error(f"could not decode image: {exc}", status=400)

    width, height = img.size
    if width > 4096 or height > 4096:
        return _error(
            f"image too large ({width}x{height}); max 4096x4096",
            status=400,
        )
    if width < 2 or height < 2:
        return _error("image too small", status=400)

    arr = np.asarray(img, dtype=np.float32)

    max_scale = min(32, width, height)
    best_scale = 1
    best_rmse = float("inf")
    rmses: list[float] = []
    for s in range(1, max_scale + 1):
        if width % s != 0 or height % s != 0:
            # Non-divisible scale would force interpolation; skip — a
            # clean native grid will have a divisible factor somewhere
            # in the sweep.
            rmses.append(float("inf"))
            continue
        small = img.resize(
            (width // s, height // s),
            resample=Image.Resampling.NEAREST,
        )
        back = small.resize(
            (width, height),
            resample=Image.Resampling.NEAREST,
        )
        back_arr = np.asarray(back, dtype=np.float32)
        rmse = float(np.sqrt(np.mean((arr - back_arr) ** 2)))
        rmses.append(rmse)
        if rmse < best_rmse:
            best_rmse = rmse
            best_scale = s

    # Pick the LARGEST scale factor whose RMSE is within a small
    # tolerance of the minimum — that's the true native grid, not a
    # sub-multiple of it.
    tolerance = max(1.0, best_rmse + 0.5)
    chosen = best_scale
    for s in range(max_scale, 0, -1):
        idx = s - 1
        if idx < len(rmses) and rmses[idx] <= tolerance:
            chosen = s
            break

    # Confidence: 1 when RMSE is 0 (perfect native grid recovery),
    # decays linearly with RMSE up to ~32 (8-bit channels, eyeballed
    # threshold). Clamped to 0..1.
    normalised = min(1.0, best_rmse / 32.0)
    confidence = max(0.0, 1.0 - normalised)

    return _json_response(
        {
            "nativeWidth": width // chosen,
            "nativeHeight": height // chosen,
            "scaleFactor": chosen,
            "confidence": confidence,
        }
    )


# ---------------------------------------------------------------------------
# /remove_bg — image → background-stripped PNG with alpha
# ---------------------------------------------------------------------------


_REMOVE_BG_ALLOWED_MODELS = frozenset(
    {"u2net", "u2net_human_seg", "isnet-general-use"}
)
_REMOVE_BG_MAX_DIMENSION = 4096


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.GB_2,
    timeout_sec=120,
)
def remove_bg(req: https_fn.Request) -> https_fn.Response:
    """Image (any Pillow-readable format) → PNG with background stripped.

    Body (multipart):
        file: image bytes
        model: optional — one of `u2net` (default), `u2net_human_seg`,
            `isnet-general-use`. Picks the rembg session model.

    Returns: PNG with alpha channel, Content-Type image/png.

    Note: first call after a cold start downloads the chosen U^2-Net
    ONNX model (~170 MB) into the function instance's temp dir. Warm
    calls are fast; the first one will take ~30s.
    """
    try:
        body, filename, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    model = req.form.get("model", "u2net")
    if model not in _REMOVE_BG_ALLOWED_MODELS:
        return _error(
            f"unknown model '{model}'; allowed: "
            f"{sorted(_REMOVE_BG_ALLOWED_MODELS)}",
            status=400,
        )

    # Heavy imports inside the function so other chambers don't pay for
    # rembg + onnxruntime on their cold starts.
    from PIL import Image
    from rembg import new_session, remove

    try:
        img = Image.open(io.BytesIO(body))
        img.load()
    except Exception as exc:  # noqa: BLE001 — Pillow raises a zoo of errors
        return _error(f"could not decode image: {exc}", status=400)

    if (
        img.width > _REMOVE_BG_MAX_DIMENSION
        or img.height > _REMOVE_BG_MAX_DIMENSION
    ):
        return _error(
            f"image too large: {img.width}x{img.height}; max "
            f"{_REMOVE_BG_MAX_DIMENSION}x{_REMOVE_BG_MAX_DIMENSION}",
            status=400,
        )

    session = new_session(model)
    out = remove(img, session=session)

    buf = io.BytesIO()
    out.save(buf, format="PNG")
    buf.seek(0)

    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    return _bytes_response(
        buf.getvalue(),
        mimetype="image/png",
        filename=f"{base}_no_bg.png",
    )


# ---------------------------------------------------------------------------
# /probe — image → EXIF + metadata JSON
# ---------------------------------------------------------------------------


_MAX_PROBE_BYTES = 50 * 1024 * 1024  # 50 MB

# EXIF tags surfaced in the response, grouped by section. Anything not
# in this map is dropped — keeps the payload compact and predictable.
_CAMERA_TAGS = ("Make", "Model", "Software", "LensModel", "LensMake")


def _rational_to_float(value: Any) -> float | None:
    """Coerce Pillow's IFDRational / tuples / numbers → float."""
    if value is None:
        return None
    # Pillow's IFDRational has __float__
    try:
        return float(value)
    except (TypeError, ValueError):
        pass
    # Some EXIF readers return (num, den) tuples
    if isinstance(value, tuple) and len(value) == 2:
        num, den = value
        try:
            return float(num) / float(den) if float(den) != 0 else None
        except (TypeError, ValueError, ZeroDivisionError):
            return None
    return None


def _format_exposure_time(value: Any) -> str | None:
    """`0.008` → `'1/125'`. Whole-second exposures kept as seconds."""
    f = _rational_to_float(value)
    if f is None:
        return None
    if f >= 1:
        return f"{f:g}s"
    if f <= 0:
        return None
    denom = round(1.0 / f)
    return f"1/{denom}"


def _format_f_number(value: Any) -> str | None:
    f = _rational_to_float(value)
    if f is None:
        return None
    return f"f/{f:g}"


def _format_focal_length(value: Any) -> str | None:
    f = _rational_to_float(value)
    if f is None:
        return None
    return f"{f:g}mm"


def _parse_exif_datetime(value: Any) -> str | None:
    """EXIF datetimes are `'YYYY:MM:DD HH:MM:SS'`. Normalise to ISO."""
    if not isinstance(value, str) or len(value) < 19:
        return None
    date_part = value[:10].replace(":", "-")
    time_part = value[11:19]
    return f"{date_part}T{time_part}"


def _dms_to_decimal(dms: Any, ref: Any) -> float | None:
    """Convert EXIF GPS DMS triple + N/S/E/W ref to decimal degrees."""
    if dms is None:
        return None
    try:
        d, m, s = (_rational_to_float(x) for x in dms)
    except (TypeError, ValueError):
        return None
    if d is None or m is None or s is None:
        return None
    decimal = d + (m / 60.0) + (s / 3600.0)
    if isinstance(ref, bytes):
        try:
            ref = ref.decode("ascii", errors="replace")
        except Exception:  # noqa: BLE001
            ref = ""
    if isinstance(ref, str) and ref.strip("\x00 ").upper() in {"S", "W"}:
        decimal = -decimal
    return round(decimal, 6)


def _clean_string(value: Any) -> Any:
    """Decode bytes, strip null padding from EXIF strings."""
    if isinstance(value, bytes):
        try:
            value = value.decode("utf-8", errors="replace")
        except Exception:  # noqa: BLE001
            return None
    if isinstance(value, str):
        value = value.strip("\x00 ").strip()
        return value or None
    return value


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.MB_256,
    timeout_sec=30,
)
def probe(req: https_fn.Request) -> https_fn.Response:
    """Image → metadata JSON (dimensions, format, EXIF, ICC profile).

    Body (multipart):
        file: image bytes (any Pillow-readable format)

    Returns JSON with `format`, `width`, `height`, `mode`, `bit_depth`,
    `size_bytes`, `iccProfile`, and an `exif` object grouping camera,
    exposure, GPS, and timestamp fields. An image with no EXIF returns
    `"exif": {}`.
    """
    try:
        body, _, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    if len(body) > _MAX_PROBE_BYTES:
        return _error(
            f"image too large ({len(body)} bytes); max {_MAX_PROBE_BYTES}",
            status=400,
        )

    # Heavy imports inside the function for cold-start hygiene.
    from PIL import ExifTags, Image, ImageCms

    try:
        img = Image.open(io.BytesIO(body))
        img.load()
    except Exception as exc:  # noqa: BLE001 — Pillow raises various
        return _error(f"could not decode image: {exc}", status=400)

    mode = img.mode

    # Bit depth — Pillow encodes this in the mode string.
    bit_depth: int | None
    if mode == "1":
        bit_depth = 1
    elif mode in {"L", "P", "RGB", "RGBA", "CMYK", "YCbCr", "LAB", "HSV"}:
        bit_depth = 8
    elif mode in {"I;16", "I;16B", "I;16L"}:
        bit_depth = 16
    elif mode in {"I", "F"}:
        bit_depth = 32
    else:
        bit_depth = None

    # ICC profile name — Pillow stores raw bytes in info['icc_profile'].
    icc_name: str | None = None
    icc_bytes = img.info.get("icc_profile")
    if icc_bytes:
        try:
            profile = ImageCms.ImageCmsProfile(io.BytesIO(icc_bytes))
            description = ImageCms.getProfileDescription(profile)
            if description:
                icc_name = description.strip() or None
        except Exception:  # noqa: BLE001 — ImageCms raises various
            icc_name = None

    # ---- EXIF ------------------------------------------------------------
    exif_out: dict[str, Any] = {}
    try:
        raw = img.getexif()
    except Exception:  # noqa: BLE001
        raw = None

    if raw:
        # Top-level IFD0 tags (Make/Model/Orientation/DateTime/Software).
        tags: dict[str, Any] = {}
        for tag_id, value in raw.items():
            name = ExifTags.TAGS.get(tag_id, str(tag_id))
            tags[name] = value

        # ExposureTime / FNumber / ISO / FocalLength live in the Exif IFD.
        try:
            exif_ifd = raw.get_ifd(ExifTags.IFD.Exif)
        except Exception:  # noqa: BLE001
            exif_ifd = {}
        for tag_id, value in (exif_ifd or {}).items():
            name = ExifTags.TAGS.get(tag_id, str(tag_id))
            tags.setdefault(name, value)

        # GPS has its own tag table.
        try:
            gps_ifd = raw.get_ifd(ExifTags.IFD.GPSInfo)
        except Exception:  # noqa: BLE001
            gps_ifd = {}
        gps: dict[str, Any] = {}
        for tag_id, value in (gps_ifd or {}).items():
            name = ExifTags.GPSTAGS.get(tag_id, str(tag_id))
            gps[name] = value

        def _put(key: str, value: Any) -> None:
            if value is None:
                return
            if isinstance(value, str) and not value.strip():
                return
            exif_out[key] = value

        # Camera identity
        for k in _CAMERA_TAGS:
            _put(k, _clean_string(tags.get(k)))

        # Image-level
        orientation = tags.get("Orientation")
        if isinstance(orientation, int):
            _put("Orientation", orientation)
        _put("DateTimeOriginal", _parse_exif_datetime(tags.get("DateTimeOriginal")))
        _put("DateTime", _parse_exif_datetime(tags.get("DateTime")))
        _put(
            "DateTimeDigitized",
            _parse_exif_datetime(tags.get("DateTimeDigitized")),
        )

        # Exposure
        _put("ExposureTime", _format_exposure_time(tags.get("ExposureTime")))
        _put("FNumber", _format_f_number(tags.get("FNumber")))
        iso = tags.get("ISOSpeedRatings") or tags.get("PhotographicSensitivity")
        if isinstance(iso, (list, tuple)) and iso:
            iso = iso[0]
        if iso is not None:
            try:
                _put("ISO", int(iso))
            except (TypeError, ValueError):
                pass
        _put("FocalLength", _format_focal_length(tags.get("FocalLength")))
        flf_35 = tags.get("FocalLengthIn35mmFilm")
        if flf_35 is not None:
            try:
                _put("FocalLengthIn35mmFilm", f"{int(flf_35)}mm")
            except (TypeError, ValueError):
                pass
        for k in (
            "ExposureProgram",
            "ExposureBiasValue",
            "MeteringMode",
            "Flash",
            "WhiteBalance",
        ):
            v = tags.get(k)
            if v is None:
                continue
            f = _rational_to_float(v)
            if f is not None:
                _put(k, f)
            elif isinstance(v, (int, str)):
                _put(k, v)

        # GPS — decimal degrees, plus altitude in metres if present.
        lat = _dms_to_decimal(gps.get("GPSLatitude"), gps.get("GPSLatitudeRef"))
        lon = _dms_to_decimal(gps.get("GPSLongitude"), gps.get("GPSLongitudeRef"))
        if lat is not None:
            _put("GPSLatitude", lat)
        if lon is not None:
            _put("GPSLongitude", lon)
        alt = _rational_to_float(gps.get("GPSAltitude"))
        if alt is not None:
            # GPSAltitudeRef: 0 = above sea level, 1 = below.
            ref = gps.get("GPSAltitudeRef")
            if isinstance(ref, bytes) and ref == b"\x01":
                alt = -alt
            elif ref == 1:
                alt = -alt
            _put("GPSAltitude", round(alt, 2))

    payload: dict[str, Any] = {
        "format": img.format,
        "width": img.width,
        "height": img.height,
        "mode": mode,
        "bit_depth": bit_depth,
        "size_bytes": len(body),
        "iccProfile": icc_name,
        "exif": exif_out,
    }
    return _json_response(payload)


# ---------------------------------------------------------------------------
# Additional chambers land below (one function each).
# ---------------------------------------------------------------------------
