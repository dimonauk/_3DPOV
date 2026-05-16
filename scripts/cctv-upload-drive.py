#!/usr/bin/env python3
"""cctv-upload-drive.py - Upload _std.ply splats to Google Drive + Firestore.

Replaces `scripts/cctv-upload-direct.ts` for splats. Vercel Blob's
Hobby plan caps at 1 GB; the full CCTV batch is ~50 GB. Google Drive
gives us cheap "for now" hosting until the studio decides where the
long-term home is (R2, B2, paid Blob, or Hugging Face dataset).

The browser fetches each splat directly from the Drive API via
`https://www.googleapis.com/drive/v3/files/{fileId}?alt=media&key={KEY}`
so there's no Vercel-egress cost on the page-view path. Drive API
supports CORS for files shared with anyone-with-link.

## First-time setup (one-off, ~3 minutes)

1. Google Cloud Console -> APIs & Services -> Library -> enable
   "Google Drive API" on the existing `gen-lang-client-0149679024`
   project.
2. APIs & Services -> Credentials -> Create -> OAuth client ID
   -> Application type "Desktop app".
   Download the JSON to `D:\\.github\\_3DPOV\\.gdrive-oauth.json`.
3. APIs & Services -> Credentials -> Create -> API key. Restrict it:
   API restrictions -> Drive API only.
   Website restrictions -> *.holoflow.studio, holoflow.studio,
   localhost:3000, *.vercel.app.
   Add to `.env.local` as `NEXT_PUBLIC_DRIVE_API_KEY=...`.
4. `pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib firebase-admin`

## Run

    python scripts/cctv-upload-drive.py --limit 5 --dry-run
    python scripts/cctv-upload-drive.py --limit 21

The first non-dry run pops a browser tab asking you to authorise
access to your own Drive. The token is cached to
`.gdrive-token.json` (gitignored); subsequent runs are non-interactive.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ----- Config ---------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
STAGING_DIR = REPO_ROOT / "scripts" / "cctv-staging"
OAUTH_CLIENT_JSON = REPO_ROOT / ".gdrive-oauth.json"
TOKEN_CACHE_JSON = REPO_ROOT / ".gdrive-token.json"
ENV_LOCAL = REPO_ROOT / ".env.local"

DRIVE_FOLDER_NAME = "Holoflow / cctv-splats"
DRIVE_API_SCOPES = ["https://www.googleapis.com/auth/drive.file"]

GAUSSIAN_COUNT = 1_179_648


# ----- Deferred imports (so --help works without deps) ----------------------


def _import_deps():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    import firebase_admin
    from firebase_admin import credentials, firestore

    return {
        "Request": Request,
        "Credentials": Credentials,
        "InstalledAppFlow": InstalledAppFlow,
        "build": build,
        "MediaFileUpload": MediaFileUpload,
        "firebase_admin": firebase_admin,
        "fb_credentials": credentials,
        "firestore": firestore,
    }


# ----- Env loading (parses .env.local without dotenv dep) -------------------


def load_env_local(path: Path) -> dict[str, str]:
    """Parse Vercel's .env.local file. Handles BOM, quoted multi-line
    values, and the \\n escapes inside the Firebase service-account JSON."""
    out: dict[str, str] = {}
    if not path.exists():
        return out
    raw = path.read_text(encoding="utf-8-sig")
    # Single regex pass: KEY="..." (with embedded \n) or KEY=value
    i = 0
    while i < len(raw):
        # Skip whitespace / blank lines / comments
        while i < len(raw) and raw[i] in " \t\r\n":
            i += 1
        if i >= len(raw):
            break
        if raw[i] == "#":
            while i < len(raw) and raw[i] != "\n":
                i += 1
            continue
        # Read KEY
        key_start = i
        while i < len(raw) and raw[i] != "=" and raw[i] != "\n":
            i += 1
        key = raw[key_start:i].strip()
        if i >= len(raw) or raw[i] != "=":
            continue
        i += 1  # skip =
        # Read value: quoted or until newline
        if i < len(raw) and raw[i] == '"':
            i += 1
            val_start = i
            while i < len(raw) and raw[i] != '"':
                if raw[i] == "\\" and i + 1 < len(raw):
                    i += 2
                else:
                    i += 1
            value = raw[val_start:i]
            i += 1  # skip closing "
            # Expand \n -> newline, \" -> ", \\ -> \
            value = value.replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")
        else:
            val_start = i
            while i < len(raw) and raw[i] != "\n":
                i += 1
            value = raw[val_start:i].strip()
        out[key] = value
    return out


# ----- Drive auth + folder bootstrap ----------------------------------------


def authenticate_drive(deps: dict[str, Any]):
    creds = None
    if TOKEN_CACHE_JSON.exists():
        creds = deps["Credentials"].from_authorized_user_file(
            str(TOKEN_CACHE_JSON), DRIVE_API_SCOPES
        )
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(deps["Request"]())
        else:
            if not OAUTH_CLIENT_JSON.exists():
                raise SystemExit(
                    f"Missing {OAUTH_CLIENT_JSON} - see the docstring at the "
                    f"top of this script for the one-time OAuth setup steps."
                )
            flow = deps["InstalledAppFlow"].from_client_secrets_file(
                str(OAUTH_CLIENT_JSON), DRIVE_API_SCOPES
            )
            creds = flow.run_local_server(port=0)
        TOKEN_CACHE_JSON.write_text(creds.to_json(), encoding="utf-8")
    return deps["build"]("drive", "v3", credentials=creds)


def ensure_folder(drive, name: str) -> str:
    """Find or create the upload target folder. Returns its fileId."""
    safe = name.replace("'", "\\'")
    q = (
        f"name='{safe}' and mimeType='application/vnd.google-apps.folder' "
        f"and trashed=false"
    )
    resp = drive.files().list(q=q, fields="files(id, name)", pageSize=10).execute()
    files = resp.get("files", [])
    if files:
        return files[0]["id"]
    folder = (
        drive.files()
        .create(
            body={"name": name, "mimeType": "application/vnd.google-apps.folder"},
            fields="id",
        )
        .execute()
    )
    return folder["id"]


# ----- Firestore bootstrap --------------------------------------------------


def init_firestore(env: dict[str, str], deps: dict[str, Any]):
    raw = env.get("FIREBASE_ADMIN_SERVICE_ACCOUNT", "")
    if not raw:
        raise SystemExit(
            "FIREBASE_ADMIN_SERVICE_ACCOUNT not set in .env.local - "
            "run `vercel env pull .env.local --environment=development --yes` first."
        )
    # The Vercel-pulled value may have a leading BOM stripped already, but
    # private_key newlines were escaped during env parsing above.
    sa = json.loads(raw)
    if not deps["firebase_admin"]._apps:
        cred = deps["fb_credentials"].Certificate(sa)
        deps["firebase_admin"].initialize_app(cred, {"projectId": sa.get("project_id")})
    return deps["firestore"].client()


# ----- Source discovery -----------------------------------------------------


def find_std_plys() -> list[dict[str, Any]]:
    """Walk per-location dirs under scripts/cctv-staging/."""
    results = []
    if not STAGING_DIR.exists():
        return results
    for sub in STAGING_DIR.iterdir():
        if not sub.is_dir():
            continue
        for ply in sub.glob("*_std.ply"):
            results.append(
                {
                    "path": ply,
                    "slug": sub.name,
                    "mtime": ply.stat().st_mtime,
                    "size": ply.stat().st_size,
                }
            )
    results.sort(key=lambda x: x["mtime"], reverse=True)
    return results


# ----- Upload + Firestore write ---------------------------------------------


def location_title(slug: str) -> str:
    return " ".join(word.capitalize() for word in slug.split("-"))


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(8 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def drive_url(file_id: str, api_key: str | None) -> str:
    """Public-readable Drive URL the browser can fetch.

    If a NEXT_PUBLIC_DRIVE_API_KEY is configured, return the API-style
    URL that returns raw bytes (and supports CORS). Otherwise return the
    user-facing `uc?export=download` URL, which works for <100 MB files
    and shows a virus-scan interstitial above that threshold.
    """
    if api_key:
        return (
            f"https://www.googleapis.com/drive/v3/files/{file_id}"
            f"?alt=media&key={api_key}"
        )
    return f"https://drive.google.com/uc?export=download&id={file_id}"


def upload_one(
    drive,
    db,
    folder_id: str,
    api_key: str | None,
    target: dict[str, Any],
    deps: dict[str, Any],
) -> dict[str, Any]:
    path: Path = target["path"]
    slug: str = target["slug"]

    media = deps["MediaFileUpload"](
        str(path),
        mimetype="application/octet-stream",
        resumable=True,
        chunksize=16 * 1024 * 1024,
    )
    body = {"name": path.name, "parents": [folder_id]}
    request = drive.files().create(body=body, media_body=media, fields="id, name, size")
    response = None
    while response is None:
        status, response = request.next_chunk()

    file_id = response["id"]

    # Anyone with the link can view.
    drive.permissions().create(
        fileId=file_id,
        body={"role": "reader", "type": "anyone"},
        fields="id",
    ).execute()

    title = location_title(slug)
    media_id = str(uuid.uuid4())
    url = drive_url(file_id, api_key)
    record = {
        "id": media_id,
        "kind": "ply",
        "subject": "research",
        "source": "google-drive",
        "url": url,
        "mimeType": "application/octet-stream",
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "uploadedBy": "bench-script:dimonauk@gmail.com",
        "title": title,
        "description": (
            f"CCTV still from {title}, lifted into a 3D Gaussian Splat by "
            f"Apple SHARP via ONNX on the studio bench."
        ),
        "tags": ["cctv", "sharp-onnx", "london"],
        "location": {"slug": slug, "name": title},
        "sizeBytes": target["size"],
        "sha256": sha256_of(path),
        "sourceRef": {
            "googleDrive": {"fileId": file_id},
            "splat": {
                "provider": "sharp-onnx",
                "licence": "research-only",
                "plyFlavour": "standard-3dgs",
                "gaussianCount": GAUSSIAN_COUNT,
            },
        },
        "variants": {"original": url},
    }
    db.collection("media").document(media_id).set(record)
    return {"fileId": file_id, "url": url, "sizeBytes": target["size"]}


# ----- main -----------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env = load_env_local(ENV_LOCAL)
    targets = find_std_plys()
    if args.limit is not None:
        targets = targets[: args.limit]

    print(f"Found {len(find_std_plys())} _std.ply files; {len(targets)} to upload.")

    if args.dry_run:
        for t in targets:
            print(f"  would upload: {t['path']}")
        return 0

    deps = _import_deps()
    try:
        drive = authenticate_drive(deps)
        db = init_firestore(env, deps)
    except Exception as e:
        print(f"Setup failed: {e}", file=sys.stderr)
        return 1

    folder_id = ensure_folder(drive, DRIVE_FOLDER_NAME)
    api_key = env.get("NEXT_PUBLIC_DRIVE_API_KEY") or os.environ.get(
        "NEXT_PUBLIC_DRIVE_API_KEY"
    )
    if not api_key:
        print(
            "warning: NEXT_PUBLIC_DRIVE_API_KEY not set - the stored url "
            "will be the user-facing uc?export=download path, which shows "
            "a virus-scan interstitial for files >100 MB.",
            file=sys.stderr,
        )

    ok = 0
    fail = 0
    for t in targets:
        size_mb = t["size"] / 1024 / 1024
        print(f"  {location_title(t['slug'])} ({size_mb:.0f} MB)...", end="", flush=True)
        try:
            r = upload_one(drive, db, folder_id, api_key, t, deps)
            print(f" -> {r['url']}")
            ok += 1
        except Exception as e:
            print(f"\n  FAILED {t['path']}: {e}", file=sys.stderr)
            fail += 1
    print(f"\nDone - {ok} uploaded, {fail} failed.")
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
