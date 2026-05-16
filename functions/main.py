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

import functools
import io
import json
import logging
import time
import uuid
from typing import Any, Callable

from firebase_functions import https_fn, options

# Module-level logger writes to Cloud Logging by default in the
# Functions runtime. Each request also gets a short request-id printed
# in front of every log line so the entries from one invocation can be
# stitched back together in the dashboard.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chambers")


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


def _chamber(
    name: str,
) -> Callable[
    [Callable[[https_fn.Request], https_fn.Response]],
    Callable[[https_fn.Request], https_fn.Response],
]:
    """Wrap a chamber function with structured logging + safety net.

    Every chamber endpoint goes through this. Responsibilities:

    - Mint a short request-id and prefix every log line with it.
    - Log a `start` line with content-type + content-length + method.
    - Log a `done` line with response status + duration in ms.
    - Catch any unhandled exception, log a stack trace via
      `logger.exception`, and return a 500 JSON error to the caller
      instead of the default Cloud Functions 500 HTML.
    - Reject non-POST methods (and pass OPTIONS through to the CORS
      preflight handler).

    Place this BETWEEN `@https_fn.on_request(...)` and the function
    body — the outer Firebase decorator handles routing + CORS, this
    inner decorator handles logging + error capture.
    """

    def decorator(
        fn: Callable[[https_fn.Request], https_fn.Response],
    ) -> Callable[[https_fn.Request], https_fn.Response]:
        @functools.wraps(fn)
        def wrapper(req: https_fn.Request) -> https_fn.Response:
            request_id = uuid.uuid4().hex[:8]
            started_at = time.monotonic()
            method = req.method or "?"
            content_type = req.content_type or "?"
            content_length = req.content_length or 0

            logger.info(
                "[%s] %s start method=%s content_type=%s bytes=%d",
                request_id,
                name,
                method,
                content_type,
                content_length,
            )

            if method == "OPTIONS":
                # CORS preflight — let the outer Firebase wrapper handle.
                return https_fn.Response("", status=204)

            if method != "POST":
                logger.warning(
                    "[%s] %s 405 wrong method=%s", request_id, name, method
                )
                return _error(f"method not allowed: {method}", status=405)

            try:
                response = fn(req)
                duration_ms = (time.monotonic() - started_at) * 1000
                status = getattr(response, "status_code", "?")
                logger.info(
                    "[%s] %s done status=%s duration=%dms",
                    request_id,
                    name,
                    status,
                    int(duration_ms),
                )
                return response
            except ValueError as exc:
                # Input validation errors land as 400 with the helper's
                # original message (e.g. "missing multipart field 'file'").
                duration_ms = (time.monotonic() - started_at) * 1000
                logger.warning(
                    "[%s] %s 400 ValueError after %dms: %s",
                    request_id,
                    name,
                    int(duration_ms),
                    exc,
                )
                return _error(str(exc), status=400)
            except MemoryError as exc:
                # Distinct from generic 500 — the operator can lift the
                # function's memory ceiling in firebase.json.
                duration_ms = (time.monotonic() - started_at) * 1000
                logger.exception(
                    "[%s] %s OOM after %dms", request_id, name, int(duration_ms)
                )
                return _error(
                    "out of memory; try a smaller input",
                    status=507,
                )
            except Exception as exc:  # noqa: BLE001 — last-line safety net
                duration_ms = (time.monotonic() - started_at) * 1000
                # logger.exception writes the full traceback to Cloud Logging.
                logger.exception(
                    "[%s] %s FAILED after %dms: %s: %s",
                    request_id,
                    name,
                    int(duration_ms),
                    type(exc).__name__,
                    exc,
                )
                return _error(
                    f"internal error: {type(exc).__name__}: {exc}",
                    status=500,
                )

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# /lithophane — image → printable lithophane STL
# ---------------------------------------------------------------------------


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.GB_1,
    timeout_sec=120,
)
@_chamber("lithophane")
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
@_chamber("pixeldetector")
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
@_chamber("remove_bg")
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
@_chamber("probe")
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
# /image_to_stl — image → contour-extruded STL plate
# ---------------------------------------------------------------------------


_IMAGE_TO_STL_MAX_DIMENSION = 2048
_IMAGE_TO_STL_MIN_CONTOUR_AREA = 10.0  # pixels² — drop noise specks


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.GB_1,
    timeout_sec=120,
)
@_chamber("image_to_stl")
def image_to_stl(req: https_fn.Request) -> https_fn.Response:
    """Image → STL plate built by thresholding + contour extrusion.

    Different shape from lithophane: lithophane builds a smooth
    heightmap where darker pixels are thicker. This one thresholds the
    image into a binary mask, finds the outlines of every bright (or
    dark, if inverted) region, and extrudes each region by a fixed
    depth. The result is a flat plate of line-art shapes — the kind of
    thing you print and backlight to read the photograph as cut-outs.

    Body (multipart):
        file: image bytes (any Pillow-readable format)
        threshold: int 0–255 — anything brighter than this is "ink".
            Default 128.
        extrude_mm: float — extrusion depth of the ink regions in mm.
            Default 3.0.
        base_mm: float — base plate thickness. 0 means no base plate
            (ink regions are free-floating shapes). Default 0.5.
        scale: float — mm per source pixel. Default 0.3.
        invert: 0 | 1 — flip dark/bright. Default 0.

    Returns: binary STL with Content-Type model/stl.
    """
    try:
        body, filename, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    threshold = _form_int(req, "threshold", 128)
    extrude_mm = _form_float(req, "extrude_mm", 3.0)
    base_mm = _form_float(req, "base_mm", 0.5)
    scale = _form_float(req, "scale", 0.3)
    invert = _form_int(req, "invert", 0) == 1

    if extrude_mm <= 0:
        return _error("extrude_mm must be > 0", status=400)
    if base_mm < 0:
        return _error("base_mm must be >= 0", status=400)
    if scale <= 0:
        return _error("scale must be > 0", status=400)
    if threshold < 0 or threshold > 255:
        return _error("threshold must be in 0–255", status=400)

    # Heavy imports inside the function so cold-start time for OTHER
    # functions in this deploy doesn't pay for these unless image_to_stl
    # is the one being called.
    import cv2
    import numpy as np
    from stl import mesh as stl_mesh

    arr = np.frombuffer(body, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return _error("could not decode image", status=400)

    rows, cols = img.shape
    if rows > _IMAGE_TO_STL_MAX_DIMENSION or cols > _IMAGE_TO_STL_MAX_DIMENSION:
        return _error(
            f"image too large ({cols}x{rows}); max "
            f"{_IMAGE_TO_STL_MAX_DIMENSION}x{_IMAGE_TO_STL_MAX_DIMENSION}",
            status=400,
        )

    # Threshold → binary mask. THRESH_BINARY keeps "brighter than t" as
    # ink; the invert flag flips that to "darker than t" by swapping
    # the THRESH_BINARY_INV flag.
    thresh_type = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY
    _, mask = cv2.threshold(img, threshold, 255, thresh_type)

    # RETR_CCOMP groups contours into a two-level hierarchy: outer
    # boundaries of ink regions are level 0, holes inside them are
    # level 1. We extrude the outer boundaries and subtract the holes
    # from each top/bottom face by polygon triangulation.
    contours, hierarchy = cv2.findContours(
        mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )

    # Group: each outer contour with the list of hole contours nested
    # inside it. hierarchy[i] = [next, prev, first_child, parent].
    groups: list[tuple[Any, list[Any]]] = []
    if hierarchy is not None and len(contours) > 0:
        h = hierarchy[0]
        # First pass: find outers (parent == -1).
        for i, c in enumerate(contours):
            if h[i][3] != -1:
                continue  # this is a hole; handled by its parent
            if cv2.contourArea(c) < _IMAGE_TO_STL_MIN_CONTOUR_AREA:
                continue
            holes: list[Any] = []
            child = h[i][2]
            while child != -1:
                hc = contours[child]
                if cv2.contourArea(hc) >= _IMAGE_TO_STL_MIN_CONTOUR_AREA:
                    holes.append(hc)
                child = h[child][0]
            groups.append((c, holes))

    if not groups and base_mm <= 0:
        return _error(
            "no extrudable regions detected; try a different threshold "
            "or enable invert",
            status=400,
        )

    # Y-axis flip: image rows go top→down; STL Y goes bottom→up. We
    # mirror so the printed plate matches what the operator sees.
    img_h_mm = rows * scale

    def to_xy(px: float, py: float) -> tuple[float, float]:
        return (px * scale, img_h_mm - py * scale)

    # ----- Triangulate polygons with holes -------------------------------
    # cv2.findContours returns concave polygons + nested holes. The
    # robust route to flat-face triangulation without a heavy mesh dep
    # is the ear-clipping classic: cut each hole into the outer polygon
    # via a "bridge" segment, producing one merged simple polygon per
    # group, then ear-clip that.
    def shoelace(poly: list[tuple[float, float]]) -> float:
        s = 0.0
        n = len(poly)
        for i in range(n):
            x0, y0 = poly[i]
            x1, y1 = poly[(i + 1) % n]
            s += x0 * y1 - x1 * y0
        return 0.5 * s

    def ensure_ccw(poly: list[tuple[float, float]]) -> list[tuple[float, float]]:
        return poly if shoelace(poly) > 0 else list(reversed(poly))

    def ensure_cw(poly: list[tuple[float, float]]) -> list[tuple[float, float]]:
        return poly if shoelace(poly) < 0 else list(reversed(poly))

    def segments_intersect(
        a: tuple[float, float],
        b: tuple[float, float],
        c: tuple[float, float],
        d: tuple[float, float],
    ) -> bool:
        # Open-segment intersection check used to validate bridges.
        def ccw(p: tuple[float, float], q: tuple[float, float], r: tuple[float, float]) -> float:
            return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])

        d1 = ccw(c, d, a)
        d2 = ccw(c, d, b)
        d3 = ccw(a, b, c)
        d4 = ccw(a, b, d)
        if ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and (
            (d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0)
        ):
            return True
        return False

    def merge_hole_into_outer(
        outer: list[tuple[float, float]],
        hole: list[tuple[float, float]],
    ) -> list[tuple[float, float]]:
        # Pick the hole vertex with max x; connect it to a visible
        # outer vertex by a bridge that doesn't cross any other edge.
        h_idx = max(range(len(hole)), key=lambda k: hole[k][0])
        h_pt = hole[h_idx]
        # Sort outer vertices by descending x (greedy: closer to hole's
        # rightmost vertex first), test bridge validity.
        candidate_order = sorted(
            range(len(outer)), key=lambda k: -outer[k][0]
        )
        for o_idx in candidate_order:
            o_pt = outer[o_idx]
            ok = True
            # Check against every outer edge except those touching o_idx
            n_o = len(outer)
            for k in range(n_o):
                if k == o_idx or (k + 1) % n_o == o_idx:
                    continue
                p, q = outer[k], outer[(k + 1) % n_o]
                if segments_intersect(o_pt, h_pt, p, q):
                    ok = False
                    break
            if not ok:
                continue
            n_h = len(hole)
            for k in range(n_h):
                if k == h_idx or (k + 1) % n_h == h_idx:
                    continue
                p, q = hole[k], hole[(k + 1) % n_h]
                if segments_intersect(o_pt, h_pt, p, q):
                    ok = False
                    break
            if not ok:
                continue
            # Splice: outer[0..o_idx] + bridge to hole[h_idx] + hole
            # walked from h_idx (CW for hole) back to h_idx + bridge
            # back to outer[o_idx..end].
            rotated_hole = hole[h_idx:] + hole[:h_idx]
            return (
                outer[: o_idx + 1]
                + rotated_hole
                + [rotated_hole[0]]
                + outer[o_idx:]
            )
        # No valid bridge — drop the hole rather than crash.
        return outer

    def is_convex(
        a: tuple[float, float],
        b: tuple[float, float],
        c: tuple[float, float],
    ) -> bool:
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0

    def point_in_triangle(
        p: tuple[float, float],
        a: tuple[float, float],
        b: tuple[float, float],
        c: tuple[float, float],
    ) -> bool:
        d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1])
        d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1])
        d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1])
        has_neg = d1 < 0 or d2 < 0 or d3 < 0
        has_pos = d1 > 0 or d2 > 0 or d3 > 0
        return not (has_neg and has_pos)

    def ear_clip(poly: list[tuple[float, float]]) -> list[tuple[int, int, int]]:
        # Returns triangle index triples into poly.
        n = len(poly)
        if n < 3:
            return []
        indices = list(range(n))
        tris: list[tuple[int, int, int]] = []
        guard = 0
        max_guard = 3 * n * n  # bail-out for degenerate inputs
        while len(indices) > 3 and guard < max_guard:
            guard += 1
            ear_found = False
            m = len(indices)
            for i in range(m):
                ia = indices[(i - 1) % m]
                ib = indices[i]
                ic = indices[(i + 1) % m]
                a, b, c = poly[ia], poly[ib], poly[ic]
                if not is_convex(a, b, c):
                    continue
                contains = False
                for j in indices:
                    if j in (ia, ib, ic):
                        continue
                    if point_in_triangle(poly[j], a, b, c):
                        contains = True
                        break
                if contains:
                    continue
                tris.append((ia, ib, ic))
                indices.pop(i)
                ear_found = True
                break
            if not ear_found:
                # Degenerate; emit a fan as a last resort and stop.
                for k in range(1, len(indices) - 1):
                    tris.append((indices[0], indices[k], indices[k + 1]))
                return tris
        if len(indices) == 3:
            tris.append((indices[0], indices[1], indices[2]))
        return tris

    # ----- Assemble triangles --------------------------------------------
    # Each ink region contributes: top face (extruded plane), bottom
    # face (same shape, reversed winding), and side walls (quads
    # between top and bottom around every boundary loop — outer +
    # holes).
    top_z = base_mm + extrude_mm
    bottom_z = base_mm  # ink sits on top of the base, if one exists

    triangles: list[list[list[float]]] = []

    def add_tri(
        v0: tuple[float, float, float],
        v1: tuple[float, float, float],
        v2: tuple[float, float, float],
    ) -> None:
        triangles.append([list(v0), list(v1), list(v2)])

    def add_quad(
        v0: tuple[float, float, float],
        v1: tuple[float, float, float],
        v2: tuple[float, float, float],
        v3: tuple[float, float, float],
    ) -> None:
        add_tri(v0, v1, v2)
        add_tri(v0, v2, v3)

    for outer_contour, hole_contours in groups:
        outer_xy = [to_xy(float(p[0][0]), float(p[0][1])) for p in outer_contour]
        # Drop duplicate consecutive points
        outer_xy = [
            pt
            for i, pt in enumerate(outer_xy)
            if i == 0 or pt != outer_xy[i - 1]
        ]
        if len(outer_xy) < 3:
            continue
        outer_xy = ensure_ccw(outer_xy)

        holes_xy: list[list[tuple[float, float]]] = []
        for hc in hole_contours:
            hxy = [to_xy(float(p[0][0]), float(p[0][1])) for p in hc]
            hxy = [pt for i, pt in enumerate(hxy) if i == 0 or pt != hxy[i - 1]]
            if len(hxy) < 3:
                continue
            holes_xy.append(ensure_cw(hxy))

        # Walls: one quad per edge of every loop. Outer walls face
        # outward; hole walls face into the cavity.
        def add_walls(loop: list[tuple[float, float]], outward: bool) -> None:
            n = len(loop)
            for i in range(n):
                x0, y0 = loop[i]
                x1, y1 = loop[(i + 1) % n]
                a = (x0, y0, bottom_z)
                b = (x1, y1, bottom_z)
                c = (x1, y1, top_z)
                d = (x0, y0, top_z)
                if outward:
                    add_quad(a, b, c, d)
                else:
                    add_quad(a, d, c, b)

        add_walls(outer_xy, outward=True)
        for h in holes_xy:
            add_walls(h, outward=False)

        # Triangulate the top + bottom by merging holes into the outer
        # via bridges, then ear-clipping. Same triangle indices serve
        # both faces with opposite winding.
        merged = list(outer_xy)
        for h in holes_xy:
            merged = merge_hole_into_outer(merged, h)
        tri_indices = ear_clip(merged)
        for ia, ib, ic in tri_indices:
            a2 = merged[ia]
            b2 = merged[ib]
            c2 = merged[ic]
            # Top — CCW from above for +Z normal
            add_tri(
                (a2[0], a2[1], top_z),
                (b2[0], b2[1], top_z),
                (c2[0], c2[1], top_z),
            )
            # Bottom — reverse for −Z normal
            add_tri(
                (a2[0], a2[1], bottom_z),
                (c2[0], c2[1], bottom_z),
                (b2[0], b2[1], bottom_z),
            )

    # ----- Base plate, if requested --------------------------------------
    if base_mm > 0:
        w_mm = cols * scale
        h_mm = rows * scale
        b00 = (0.0, 0.0, 0.0)
        b10 = (w_mm, 0.0, 0.0)
        b11 = (w_mm, h_mm, 0.0)
        b01 = (0.0, h_mm, 0.0)
        t00 = (0.0, 0.0, base_mm)
        t10 = (w_mm, 0.0, base_mm)
        t11 = (w_mm, h_mm, base_mm)
        t01 = (0.0, h_mm, base_mm)
        # Top of base (+Z)
        add_quad(t00, t10, t11, t01)
        # Bottom of base (−Z): reverse winding
        add_quad(b00, b01, b11, b10)
        # Sides
        add_quad(b00, b10, t10, t00)  # front (−Y)
        add_quad(b10, b11, t11, t10)  # right (+X)
        add_quad(b11, b01, t01, t11)  # back (+Y)
        add_quad(b01, b00, t00, t01)  # left (−X)

    if not triangles:
        return _error(
            "no geometry produced; try a different threshold or invert",
            status=400,
        )

    tri_array = np.asarray(triangles, dtype=np.float32)
    out = stl_mesh.Mesh(np.zeros(tri_array.shape[0], dtype=stl_mesh.Mesh.dtype))
    for i in range(tri_array.shape[0]):
        out.vectors[i] = tri_array[i]

    buf = io.BytesIO()
    out.save(buf, mode=stl_mesh.Mode.BINARY)
    buf.seek(0)

    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    return _bytes_response(
        buf.getvalue(),
        mimetype="model/stl",
        filename=f"{base}_image_to_stl.stl",
    )


# ---------------------------------------------------------------------------
# /image_resize — resize + transcode an image
# ---------------------------------------------------------------------------


_IMAGE_RESIZE_MAX_DIMENSION = 8192
_IMAGE_RESIZE_ALLOWED_MODES = frozenset({"width", "height", "longest-edge"})
_IMAGE_RESIZE_ALLOWED_FITS = frozenset({"contain", "cover", "stretch"})
_IMAGE_RESIZE_ALLOWED_FORMATS = frozenset({"png", "jpeg", "webp", "avif"})


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.MB_512,
    timeout_sec=60,
)
@_chamber("image_resize")
def image_resize(req: https_fn.Request) -> https_fn.Response:
    """Image → resized + transcoded image.

    Workhorse for every other studio surface: bureau print prep, the
    social-card export, the print-bar product photograph. Pillow does
    the actual transform.

    Body (multipart):
        file: image bytes (any Pillow-readable format)
        mode: "width" | "height" | "longest-edge" — picks which
            dimension the target governs. Default "longest-edge".
        target: int — target dimension in pixels. Default 1920.
        fit: "contain" | "cover" | "stretch" — default "contain".
            "contain" preserves aspect ratio so the chosen dimension is
            exact and the other is computed. "cover" resizes to fill
            then centre-crops. "stretch" disregards aspect ratio.
        format: "png" | "jpeg" | "webp" | "avif" — output format.
            Default "png".
        quality: int 1–100 — for lossy formats. Default 90. Ignored
            for PNG.
        strip_icc: 0 | 1 — strip the source ICC profile. Default 0
            (preserve).

    Returns: image bytes with the matching Content-Type.
    """
    try:
        body, filename, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    mode = (req.form.get("mode") or "longest-edge").strip().lower()
    if mode not in _IMAGE_RESIZE_ALLOWED_MODES:
        return _error(
            f"unknown mode '{mode}'; allowed: "
            f"{sorted(_IMAGE_RESIZE_ALLOWED_MODES)}",
            status=400,
        )

    target = _form_int(req, "target", 1920)
    if target < 16 or target > _IMAGE_RESIZE_MAX_DIMENSION:
        return _error(
            f"target must be 16..{_IMAGE_RESIZE_MAX_DIMENSION}",
            status=400,
        )

    fit = (req.form.get("fit") or "contain").strip().lower()
    if fit not in _IMAGE_RESIZE_ALLOWED_FITS:
        return _error(
            f"unknown fit '{fit}'; allowed: {sorted(_IMAGE_RESIZE_ALLOWED_FITS)}",
            status=400,
        )

    out_format = (req.form.get("format") or "png").strip().lower()
    if out_format not in _IMAGE_RESIZE_ALLOWED_FORMATS:
        return _error(
            f"unknown format '{out_format}'; allowed: "
            f"{sorted(_IMAGE_RESIZE_ALLOWED_FORMATS)}",
            status=400,
        )

    quality = _form_int(req, "quality", 90)
    if quality < 1 or quality > 100:
        return _error("quality must be 1..100", status=400)

    strip_icc = _form_int(req, "strip_icc", 0) == 1

    # Heavy imports inside the function for cold-start hygiene. The
    # AVIF plugin registers itself on import — `import pillow_avif`
    # adds the AVIF codec to Pillow's registry.
    from PIL import Image

    if out_format == "avif":
        try:
            import pillow_avif  # noqa: F401 — side-effect: registers AVIF
        except ImportError:
            return _error(
                "AVIF output unavailable on this deploy",
                status=400,
            )

    try:
        img = Image.open(io.BytesIO(body))
        img.load()
    except Exception as exc:  # noqa: BLE001 — Pillow raises various
        return _error(f"could not decode image: {exc}", status=400)

    src_w, src_h = img.size
    if (
        src_w > _IMAGE_RESIZE_MAX_DIMENSION
        or src_h > _IMAGE_RESIZE_MAX_DIMENSION
    ):
        raise ValueError(
            f"image too large ({src_w}x{src_h}); max "
            f"{_IMAGE_RESIZE_MAX_DIMENSION}x{_IMAGE_RESIZE_MAX_DIMENSION}"
        )
    if src_w < 1 or src_h < 1:
        return _error("source image has zero size", status=400)

    # Resolve target → (target_w, target_h) given mode + fit. For
    # "contain", the non-governed dimension is derived to preserve
    # aspect ratio. For "cover", the governed dimension still leads but
    # the other is forced to a deliberate aspect; we default to keeping
    # the source aspect (i.e. cover = contain for a single target),
    # which is the right behaviour when one number is the answer.
    # "stretch" applies the target as a square unless the operator
    # passes both axes — out of scope for this v1.
    aspect = src_w / src_h

    if mode == "width":
        target_w = target
        target_h = max(1, round(target / aspect))
    elif mode == "height":
        target_h = target
        target_w = max(1, round(target * aspect))
    else:  # longest-edge
        if src_w >= src_h:
            target_w = target
            target_h = max(1, round(target / aspect))
        else:
            target_h = target
            target_w = max(1, round(target * aspect))

    if target_w < 1 or target_h < 1:
        return _error("computed target dimensions are invalid", status=400)

    # ---- Resize ----------------------------------------------------------
    if fit == "stretch":
        resized = img.resize(
            (target_w, target_h),
            resample=Image.Resampling.LANCZOS,
        )
    elif fit == "cover":
        # Resize so the source fills the target box (one axis may
        # exceed target), then centre-crop to (target_w, target_h).
        scale = max(target_w / src_w, target_h / src_h)
        scaled_w = max(target_w, round(src_w * scale))
        scaled_h = max(target_h, round(src_h * scale))
        scaled = img.resize(
            (scaled_w, scaled_h),
            resample=Image.Resampling.LANCZOS,
        )
        left = (scaled_w - target_w) // 2
        top = (scaled_h - target_h) // 2
        resized = scaled.crop((left, top, left + target_w, top + target_h))
    else:  # contain — aspect-preserving, exact on the governed axis
        resized = img.resize(
            (target_w, target_h),
            resample=Image.Resampling.LANCZOS,
        )

    # ---- Mode conversion for output format ------------------------------
    # JPEG can't carry alpha; flatten onto white. PNG/WebP/AVIF keep
    # alpha. Convert P (palette) up to RGBA so resampling didn't smear
    # the palette, then drop alpha for JPEG.
    if resized.mode in ("P", "PA"):
        resized = resized.convert("RGBA")

    if out_format == "jpeg":
        if resized.mode in ("RGBA", "LA"):
            background = Image.new("RGB", resized.size, (255, 255, 255))
            alpha = resized.split()[-1]
            background.paste(resized, mask=alpha)
            resized = background
        elif resized.mode != "RGB":
            resized = resized.convert("RGB")

    # ---- ICC profile passthrough ----------------------------------------
    icc_bytes: bytes | None = None
    if not strip_icc:
        icc = img.info.get("icc_profile")
        if isinstance(icc, bytes) and icc:
            icc_bytes = icc

    # ---- Encode ---------------------------------------------------------
    save_kwargs: dict[str, Any] = {}
    if icc_bytes is not None:
        save_kwargs["icc_profile"] = icc_bytes

    if out_format == "png":
        pil_format = "PNG"
        save_kwargs["optimize"] = True
    elif out_format == "jpeg":
        pil_format = "JPEG"
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
        save_kwargs["progressive"] = True
    elif out_format == "webp":
        pil_format = "WEBP"
        save_kwargs["quality"] = quality
        save_kwargs["method"] = 6
    else:  # avif
        pil_format = "AVIF"
        save_kwargs["quality"] = quality

    buf = io.BytesIO()
    try:
        resized.save(buf, format=pil_format, **save_kwargs)
    except Exception as exc:  # noqa: BLE001 — Pillow encoders raise various
        return _error(
            f"could not encode {out_format}: {exc}",
            status=400,
        )
    buf.seek(0)

    mimetype = "image/jpeg" if out_format == "jpeg" else f"image/{out_format}"
    ext = "jpg" if out_format == "jpeg" else out_format
    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    return _bytes_response(
        buf.getvalue(),
        mimetype=mimetype,
        filename=f"{base}_resized.{ext}",
    )


# ---------------------------------------------------------------------------
# /exif_strip — image → same image with all metadata stripped
# ---------------------------------------------------------------------------


_EXIF_STRIP_MAX_BYTES = 50 * 1024 * 1024  # 50 MB
_EXIF_STRIP_MAX_DIMENSION = 8192


@https_fn.on_request(
    region="us-central1",
    cors=_DEFAULT_CORS,
    memory=options.MemoryOption.MB_256,
    timeout_sec=30,
)
@_chamber("exif_strip")
def exif_strip(req: https_fn.Request) -> https_fn.Response:
    """Image → same image, every metadata block stripped.

    The exact inverse of /probe. Probe READS the dossier; this chamber
    DELETES it. Pixels are untouched — only the EXIF / XMP / IPTC /
    optional ICC sidecars are dropped.

    Body (multipart):
        file: image bytes (any Pillow-readable, encodeable format)
        preserve_icc: 0 | 1 — when 1, keep the ICC colour profile
            (drop only EXIF/XMP/IPTC); when 0 (default), strip
            everything including ICC.

    Response: bytes of the re-saved image, original format preserved.
    Sets an `X-Stripped` header listing the metadata blocks that
    existed in the source and were removed, semicolon-separated
    (e.g. `EXIF; XMP; ICC`).
    """
    try:
        body, filename, _ = _read_uploaded_file(req)
    except ValueError as exc:
        return _error(str(exc))

    if len(body) > _EXIF_STRIP_MAX_BYTES:
        raise ValueError(
            f"image too large ({len(body)} bytes); max {_EXIF_STRIP_MAX_BYTES}"
        )

    preserve_icc = _form_int(req, "preserve_icc", 0) == 1

    # Heavy imports inside the function for cold-start hygiene.
    from PIL import Image

    try:
        img = Image.open(io.BytesIO(body))
        img.load()
    except Exception as exc:  # noqa: BLE001 — Pillow raises various
        raise ValueError(f"could not decode image: {exc}") from exc

    if (
        img.width > _EXIF_STRIP_MAX_DIMENSION
        or img.height > _EXIF_STRIP_MAX_DIMENSION
    ):
        raise ValueError(
            f"image too large: {img.width}x{img.height}; max "
            f"{_EXIF_STRIP_MAX_DIMENSION}x{_EXIF_STRIP_MAX_DIMENSION}"
        )

    # ---- Detect what existed before stripping ---------------------------
    stripped: list[str] = []
    info = img.info or {}

    had_exif = False
    if "exif" in info:
        had_exif = True
    else:
        try:
            ex = img.getexif()
            if ex and len(ex) > 0:
                had_exif = True
        except Exception:  # noqa: BLE001
            pass
    if had_exif:
        stripped.append("EXIF")

    if "XML:com.adobe.xmp" in info or "xmp" in info:
        stripped.append("XMP")

    # IPTC / Photoshop metadata commonly lives under `photoshop` or `iptc`.
    if "iptc" in info or "photoshop" in info:
        stripped.append("IPTC")

    if "comment" in info:
        stripped.append("Comment")

    had_icc = "icc_profile" in info and bool(info.get("icc_profile"))
    if had_icc and not preserve_icc:
        stripped.append("ICC")

    # ---- Resolve output format + extension ------------------------------
    # Pillow's `format` attribute names the decoder it used. For the
    # response we keep the same format; the extension maps via the
    # standard short forms (JPEG → jpg, TIFF → tif), and the MIME type
    # uses Pillow's lower-case format with the JPEG/TIFF fixups.
    src_format = img.format or "PNG"
    fmt_lower = src_format.lower()
    ext_map = {
        "jpeg": "jpg",
        "tiff": "tif",
    }
    src_ext = ext_map.get(fmt_lower, fmt_lower)
    mime_format = "jpeg" if src_ext == "jpg" else (
        "tiff" if src_ext == "tif" else src_ext
    )
    mimetype = f"image/{mime_format}"

    # ---- Re-save without metadata ---------------------------------------
    # By omitting the `exif` kwarg and not passing `xmp` / `iptc`, Pillow
    # writes a clean file. ICC is only kept when explicitly requested.
    save_kwargs: dict[str, Any] = {}
    if preserve_icc and had_icc:
        save_kwargs["icc_profile"] = info["icc_profile"]

    # Pillow can't save palette-mode images straight to JPEG. Mirror the
    # common-sense conversion an operator would do by hand.
    if src_format == "JPEG" and img.mode not in {"RGB", "L", "CMYK"}:
        img = img.convert("RGB")

    out = io.BytesIO()
    try:
        img.save(out, format=src_format, **save_kwargs)
    except Exception as exc:  # noqa: BLE001 — Pillow raises various
        raise ValueError(
            f"could not re-encode as {src_format}: {exc}"
        ) from exc
    out.seek(0)

    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    response = _bytes_response(
        out.getvalue(),
        mimetype=mimetype,
        filename=f"{base}_clean.{src_ext}",
    )
    # The browser CORS preflight needs to see X-Stripped in the exposed
    # headers list, otherwise res.headers.get() returns null in the
    # client. The outer CORS wrapper handles preflight; we set the
    # expose-headers value here so the actual response permits readout.
    response.headers["X-Stripped"] = "; ".join(stripped) if stripped else "none"
    response.headers["Access-Control-Expose-Headers"] = "X-Stripped"
    return response


# ---------------------------------------------------------------------------
# Additional chambers land below (one function each).
# ---------------------------------------------------------------------------
