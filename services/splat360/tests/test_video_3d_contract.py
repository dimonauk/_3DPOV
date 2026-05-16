"""Contract test for the `hangar-gsplat` bench-side route surface.

Exercises the three endpoints the Vercel client at
`D:/.github/_3DPOV/lib/capabilities/viz/splat-generate.server.ts` will
hit:

    POST /video3d/jobs
    GET  /video3d/jobs/{jobId}
    GET  /video3d/jobs/{jobId}/result/std

Uses the `SPLAT360_VIDEO_3D_FAKE` short-circuit so it doesn't need
ffmpeg / COLMAP / gsplat installed. The fake mode emits a syntactically
valid (zero-vertex) standard-3DGS PLY immediately, which is enough to
prove the route shapes line up with the contract.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Activate fake mode BEFORE importing the app so the lifespan picks it
# up. The from_env() read happens inside the lifespan context manager.
os.environ["SPLAT360_VIDEO_3D_FAKE"] = "1"
os.environ.setdefault("SPLAT_VIDEO_AUTH_TOKEN", "")  # auth disabled


@pytest.fixture()
def client(tmp_path: Path):
    # Point the work roots at a tmp dir so the test doesn't pollute the
    # repo's ./work tree.
    os.environ["SPLAT360_WORK"] = str(tmp_path / "work")
    os.environ["SPLAT360_OUT"] = str(tmp_path / "out")
    os.environ["SPLAT360_VIDEO_3D_WORK"] = str(tmp_path / "video3d")
    # Reimport so the module-level app rebinds against the new env.
    import importlib
    import splat360.main as main_mod
    main_mod = importlib.reload(main_mod)
    with TestClient(main_mod.app) as c:
        yield c


def _submit(client: TestClient) -> str:
    """POST a tiny dummy video + params; return the jobId."""
    params = {
        "frameStride": 5,
        "trainer": "gsplat",
        "sfm": "colmap",
        "iterations": 5000,
    }
    files = {
        "video": ("dummy.mp4", b"\x00\x00\x00\x18ftypisom", "video/mp4"),
    }
    data = {"params": json.dumps(params)}
    res = client.post("/video3d/jobs", files=files, data=data)
    assert res.status_code == 200, res.text
    body = res.json()
    assert "jobId" in body
    assert "etaSeconds" in body
    assert isinstance(body["etaSeconds"], int)
    return body["jobId"]


def test_submit_returns_job_id(client: TestClient) -> None:
    job_id = _submit(client)
    assert job_id and isinstance(job_id, str)


def test_status_eventually_done(client: TestClient) -> None:
    job_id = _submit(client)
    # Fake mode finishes synchronously inside the background task, but
    # the TestClient drives BackgroundTasks to completion before the
    # request returns, so the first GET should already show 'done'.
    res = client.get(f"/video3d/jobs/{job_id}")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["state"] in {"done", "running", "queued"}
    # Poll a few times in case the runner is slow.
    for _ in range(20):
        res = client.get(f"/video3d/jobs/{job_id}")
        body = res.json()
        if body["state"] == "done":
            break
    assert body["state"] == "done", body
    # Contract-shaped fields are present.
    assert "frameCount" in body
    assert "registeredImages" in body
    assert "gaussianCount" in body
    assert "sfmDurationSeconds" in body
    assert "trainDurationSeconds" in body


def test_result_std_returns_ply(client: TestClient) -> None:
    job_id = _submit(client)
    # Drain to done.
    for _ in range(20):
        if client.get(f"/video3d/jobs/{job_id}").json()["state"] == "done":
            break
    res = client.get(f"/video3d/jobs/{job_id}/result/std")
    assert res.status_code == 200, res.text
    assert res.headers["content-type"].startswith("application/octet-stream")
    # The fake PLY is a header-only standard-3DGS PLY. It must start
    # with the magic.
    assert res.content.startswith(b"ply\n"), res.content[:32]
    assert b"format binary_little_endian" in res.content
    assert b"element vertex" in res.content


def test_status_unknown_job_is_404(client: TestClient) -> None:
    res = client.get("/video3d/jobs/does-not-exist")
    assert res.status_code == 404


def test_result_before_done_is_409(client: TestClient, monkeypatch) -> None:
    """A result fetch on a still-running job returns 409. Stub the
    driver so the job leaves submit in `running` and stays there."""

    async def _stays_running(job_id, store, config):  # noqa: ARG001
        # Mark running and return. The job sits in `running` forever
        # because nothing else will advance it — exactly the state we
        # want to probe for 409.
        store.mark_running(job_id)

    import splat360.api.video_3d as route_mod
    monkeypatch.setattr(route_mod, "run_job", _stays_running)
    job_id = _submit(client)
    res = client.get(f"/video3d/jobs/{job_id}/result/std")
    assert res.status_code == 409, res.text


def test_bearer_required_when_token_set(tmp_path: Path, monkeypatch) -> None:
    """When SPLAT_VIDEO_AUTH_TOKEN is set, unauthenticated requests
    are rejected with 401."""
    monkeypatch.setenv("SPLAT360_WORK", str(tmp_path / "work"))
    monkeypatch.setenv("SPLAT360_OUT", str(tmp_path / "out"))
    monkeypatch.setenv("SPLAT360_VIDEO_3D_WORK", str(tmp_path / "video3d"))
    monkeypatch.setenv("SPLAT360_VIDEO_3D_FAKE", "1")
    monkeypatch.setenv("SPLAT_VIDEO_AUTH_TOKEN", "secret-token-xyz")
    import importlib
    import splat360.main as main_mod
    main_mod = importlib.reload(main_mod)
    with TestClient(main_mod.app) as c:
        # No auth header -> 401.
        res = c.post(
            "/video3d/jobs",
            files={"video": ("a.mp4", b"\x00", "video/mp4")},
            data={"params": json.dumps({})},
        )
        assert res.status_code == 401
        # Correct token -> 200.
        res = c.post(
            "/video3d/jobs",
            files={"video": ("a.mp4", b"\x00", "video/mp4")},
            data={"params": json.dumps({})},
            headers={"Authorization": "Bearer secret-token-xyz"},
        )
        assert res.status_code == 200, res.text
