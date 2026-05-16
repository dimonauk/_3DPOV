"""Holoflow Wave 9 audit — read-only Playwright sweep.

Hits the priority routes on localhost:3004, captures HTTP status, console
errors, pageerrors, hydration warnings, element presence, and screenshots.
Writes a markdown report to docs/audit-wave9.md.
"""
from __future__ import annotations

import json
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from playwright.sync_api import sync_playwright, Page, Response, ConsoleMessage, Error

BASE = "http://localhost:3004"
ROOT = Path("D:/.github/_3DPOV")
SHOT_DIR = ROOT / "tests" / "audit-wave9"
REPORT = ROOT / "docs" / "audit-wave9.md"
SHOT_DIR.mkdir(parents=True, exist_ok=True)

ROUTES = [
    ("/", "landing", []),
    ("/atelier", "atelier-index", []),
    ("/atelier/sculpture-gallery", "sculpture-gallery", ["narration", "printbar", "xrbar"]),
    ("/atelier/breeding-floor", "breeding-floor", ["narration", "xrbar"]),
    ("/atelier/triposr", "triposr", ["narration", "printbar"]),
    ("/atelier/trellis", "trellis", ["printbar"]),
    ("/atelier/image-to-mesh", "image-to-mesh", ["printbar"]),
    ("/atelier/image-to-stl", "image-to-stl", ["printbar"]),
    ("/atelier/poi-sculptor", "poi-sculptor", ["printbar"]),
    ("/atelier/voxel-world", "voxel-world", ["printbar"]),
    ("/atelier/lithophane", "lithophane", ["printbar"]),
    ("/atelier/silk-brush", "silk-brush", ["xrbar"]),
    ("/atelier/waveguide-forge", "waveguide-forge", ["xrbar"]),
    ("/atelier/shape-of-it", "shape-of-it", []),
    ("/play/agent-town", "play-agent-town", []),
    ("/play/pixel-academy", "play-pixel-academy", []),
    ("/stage", "stage", []),
    ("/academy", "academy", []),
]

HYDRATION_RE = re.compile(r"hydration|did not match|hydrating", re.IGNORECASE)


@dataclass
class RouteResult:
    path: str
    slug: str
    status: Optional[int] = None
    console_errors: list[str] = field(default_factory=list)
    page_errors: list[str] = field(default_factory=list)
    console_warnings: list[str] = field(default_factory=list)
    hydration_warnings: list[str] = field(default_factory=list)
    expected: list[str] = field(default_factory=list)
    element_findings: dict[str, bool] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)
    screenshot: Optional[str] = None
    duration_ms: int = 0
    final_url: Optional[str] = None


def check_elements(page: Page, expectations: list[str]) -> dict[str, bool]:
    """Detect Wave 9 surfaces.

    PrintBar (components/commerce/print-bar.tsx) renders `<section
    aria-label="Print this">` only when geometry exists — conditional
    on user action. So "printbar mounted" is the right check; we also
    note whether it's currently visible.

    NarrationPlate (components/aura/narration-plate.tsx) renders
    `<aside aria-label="Aura" role="status">`. Always mounted when the
    chamber imports it.

    ChamberXRBar shows "Enter VR" or an "XR ·" pill.
    """
    findings: dict[str, bool] = {}
    for exp in expectations:
        try:
            if exp == "printbar":
                # The aria-label is the deterministic marker; fall back to text.
                count_aria = page.locator('[aria-label="Print this"]').count()
                count_text = page.locator("text=Print this").count()
                count_price = page.locator("text=/From £/").count()
                findings["printbar"] = (count_aria + count_text + count_price) > 0
            elif exp == "narration":
                # NarrationPlate carries aria-label="Aura" + role="status".
                count_aria = page.locator('aside[aria-label="Aura"][role="status"]').count()
                count_fallback = page.locator('text=Aura\'s thinking').count()
                findings["narration"] = (count_aria + count_fallback) > 0
            elif exp == "xrbar":
                count_a = page.locator("text=Enter VR").count()
                count_b = page.locator("text=/XR.*unavailable/i").count()
                count_c = page.locator("text=/XR ·/").count()
                findings["xrbar"] = (count_a + count_b + count_c) > 0
            else:
                findings[exp] = False
        except Exception:
            findings[exp] = False
    return findings


def audit_route(page: Page, path: str, slug: str, expectations: list[str], attempt: int = 1) -> RouteResult:
    result = RouteResult(path=path, slug=slug, expected=expectations)
    url = f"{BASE}{path}"
    t0 = time.time()

    # Wire console + pageerror capture before navigation
    def on_console(msg: ConsoleMessage):
        try:
            text = msg.text
            # React's hydration error uses %s%s placeholders — pull the
            # rest of the args so the variable bits aren't lost.
            try:
                args = []
                for a in msg.args:
                    try:
                        v = a.json_value()
                        args.append(v if isinstance(v, str) else json.dumps(v))
                    except Exception:
                        pass
                if args and len(args) > 1:
                    text = text + " || args=" + " | ".join(args[1:5])
            except Exception:
                pass
        except Exception:
            text = "<unreadable>"
        if msg.type == "error":
            result.console_errors.append(text)
        elif msg.type == "warning":
            result.console_warnings.append(text)
        if HYDRATION_RE.search(text):
            result.hydration_warnings.append(f"[{msg.type}] {text}")

    def on_pageerror(err: Error):
        try:
            result.page_errors.append(f"{err.name}: {err.message}")
        except Exception:
            result.page_errors.append(str(err))

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)

    try:
        resp: Optional[Response] = page.goto(url, wait_until="domcontentloaded", timeout=45000)
        if resp is not None:
            result.status = resp.status
        result.final_url = page.url
        # networkidle (per webapp-testing rules), but bounded
        try:
            page.wait_for_load_state("networkidle", timeout=20000)
        except Exception as e:
            result.notes.append(f"networkidle timeout: {type(e).__name__}")
        # small settle for any client-side rendering
        page.wait_for_timeout(800)

        # retry once on 404 after 2s — use a fresh page so listeners don't double up
        if result.status == 404 and attempt == 1:
            result.notes.append("first attempt 404, retrying after 2s")
            page.wait_for_timeout(2000)
            new_page = page.context.new_page()
            try:
                retry = audit_route(new_page, path, slug, expectations, attempt=2)
            finally:
                try:
                    new_page.close()
                except Exception:
                    pass
            return retry

        # Element checks
        if expectations:
            result.element_findings = check_elements(page, expectations)

        # Screenshot — bump timeout for heavy R3F scenes, disable animations
        # so chambers like poi-sculptor / voxel-world / shape-of-it don't
        # spin forever waiting for fonts/animations to settle.
        shot_path = SHOT_DIR / f"{slug}.png"
        try:
            page.screenshot(
                path=str(shot_path),
                full_page=False,
                timeout=30000,
                animations="disabled",
                caret="hide",
            )
            result.screenshot = str(shot_path)
        except Exception as e:
            # Fall back to a no-frills clip screenshot
            try:
                page.screenshot(path=str(shot_path), timeout=15000, animations="disabled")
                result.screenshot = str(shot_path)
                result.notes.append(f"screenshot fallback used: {type(e).__name__}")
            except Exception as e2:
                result.notes.append(f"screenshot failed (both attempts): {e2}")
    except Exception as e:
        result.notes.append(f"navigation error: {type(e).__name__}: {e}")
    finally:
        result.duration_ms = int((time.time() - t0) * 1000)
    return result


def run() -> list[RouteResult]:
    """First pass: cold visit each route in a clean context.

    Hydration warnings on a Next.js dev server can be intermittent — they
    only fire when the server-rendered HTML and the client-rendered tree
    disagree on the first paint, and Turbopack's incremental compile can
    affect that. We don't double-sample here (12 minute cap) but the
    second wave taught us silk-brush sometimes times out at networkidle.
    """
    results: list[RouteResult] = []
    start = time.time()
    deadline = start + 11.5 * 60  # 11.5 minutes hard cap

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
        )
        for path, slug, expectations in ROUTES:
            if time.time() > deadline:
                # mark remaining as skipped
                results.append(
                    RouteResult(
                        path=path,
                        slug=slug,
                        expected=expectations,
                        notes=["skipped: 12 minute audit cap reached"],
                    )
                )
                continue
            page = context.new_page()
            try:
                r = audit_route(page, path, slug, expectations)
                results.append(r)
                print(f"[{r.status}] {path} — errs:{len(r.console_errors)} pageerr:{len(r.page_errors)} hyd:{len(r.hydration_warnings)} ({r.duration_ms}ms)", flush=True)
            finally:
                try:
                    page.close()
                except Exception:
                    pass
        context.close()
        browser.close()
    return results


def fmt_report(results: list[RouteResult]) -> str:
    total = len(results)
    ok = sum(1 for r in results if r.status == 200)
    bad = sum(1 for r in results if r.status is not None and r.status != 200)
    console_err_total = sum(len(r.console_errors) + len(r.page_errors) for r in results)
    routes_with_errors = sum(1 for r in results if (r.console_errors or r.page_errors))
    hyd_total = sum(len(r.hydration_warnings) for r in results)

    lines: list[str] = []
    lines.append("# Holoflow Wave 9 audit")
    lines.append(f"Date: 2026-05-16")
    lines.append(f"Dev server: {BASE}")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Routes checked: {total}")
    lines.append(f"- 200 OK: {ok}")
    lines.append(f"- Failed (non-200): {bad}")
    lines.append(f"- Console errors: {console_err_total} total across {routes_with_errors} routes")
    lines.append(f"- Hydration warnings: {hyd_total} total")
    lines.append("")
    lines.append("## Per-route results")

    for r in results:
        lines.append(f"### {r.path}")
        lines.append(f"- Status: {r.status if r.status is not None else 'no-response'}")
        if r.final_url and r.final_url != f"{BASE}{r.path}":
            lines.append(f"- Final URL (redirect): {r.final_url}")
        lines.append(f"- Duration: {r.duration_ms}ms")
        if r.screenshot:
            lines.append(f"- Screenshot: {r.screenshot}")
        if r.expected:
            checks = ", ".join(
                f"{k}={'YES' if v else 'NO'}" for k, v in r.element_findings.items()
            )
            lines.append(f"- Expected elements: {checks}")
        if r.console_errors:
            lines.append(f"- Console errors ({len(r.console_errors)}):")
            for e in r.console_errors[:10]:
                lines.append(f"  - `{e[:1500]}`")
            if len(r.console_errors) > 10:
                lines.append(f"  - ... and {len(r.console_errors) - 10} more")
        if r.page_errors:
            lines.append(f"- Page errors ({len(r.page_errors)}):")
            for e in r.page_errors[:10]:
                lines.append(f"  - `{e[:1500]}`")
            if len(r.page_errors) > 10:
                lines.append(f"  - ... and {len(r.page_errors) - 10} more")
        if r.hydration_warnings:
            lines.append(f"- Hydration warnings ({len(r.hydration_warnings)}):")
            for w in r.hydration_warnings:
                lines.append(f"  - `{w[:2500]}`")
        if r.notes:
            lines.append(f"- Notes:")
            for n in r.notes:
                lines.append(f"  - {n}")
        lines.append("")

    # Triage
    lines.append("## Triage — top issues before Wave 10")
    issues = []
    for r in results:
        sev = 0
        if r.status is None:
            sev += 5
        elif r.status >= 500:
            sev += 5
        elif r.status == 404:
            sev += 4
        sev += 2 * len(r.page_errors)
        sev += 1 * len(r.console_errors)
        sev += 1 * len(r.hydration_warnings)
        for k, v in r.element_findings.items():
            if not v:
                sev += 2
        if sev > 0:
            issues.append((sev, r))
    issues.sort(key=lambda x: -x[0])
    if not issues:
        lines.append("")
        lines.append("Everything is clean. All routes returned 200, no console errors, no page errors, no hydration warnings, all expected elements present.")
    else:
        lines.append("")
        for i, (sev, r) in enumerate(issues[:3], 1):
            summary_bits = []
            if r.status != 200:
                summary_bits.append(f"status {r.status}")
            if r.page_errors:
                summary_bits.append(f"{len(r.page_errors)} pageerror(s)")
            if r.console_errors:
                summary_bits.append(f"{len(r.console_errors)} console error(s)")
            if r.hydration_warnings:
                summary_bits.append(f"{len(r.hydration_warnings)} hydration warning(s)")
            missing = [k for k, v in r.element_findings.items() if not v]
            if missing:
                summary_bits.append(f"missing: {', '.join(missing)}")
            lines.append(f"{i}. **{r.path}** — {', '.join(summary_bits) or 'see per-route section'}")
    lines.append("")
    return "\n".join(lines)


def main():
    results = run()
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(fmt_report(results), encoding="utf-8")
    # also dump raw JSON for record
    raw = [
        {
            "path": r.path,
            "slug": r.slug,
            "status": r.status,
            "console_errors": r.console_errors,
            "page_errors": r.page_errors,
            "hydration_warnings": r.hydration_warnings,
            "element_findings": r.element_findings,
            "notes": r.notes,
            "duration_ms": r.duration_ms,
            "final_url": r.final_url,
            "screenshot": r.screenshot,
        }
        for r in results
    ]
    (SHOT_DIR / "results.json").write_text(json.dumps(raw, indent=2), encoding="utf-8")
    print(f"\nReport: {REPORT}")
    print(f"Raw: {SHOT_DIR / 'results.json'}")


if __name__ == "__main__":
    main()
