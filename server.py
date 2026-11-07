#!/usr/bin/env python3
"""
Wattkoll dev server — static files + a tiny proxy for Swedish spot prices.

    python3 server.py            # http://127.0.0.1:8000
    python3 server.py --port 8080 --no-browser

No dependencies. The proxy exists because elprisetjustnu.se does not send CORS
headers; it also caches responses for 30 minutes so the demo does not hammer a
free public API.
"""

from __future__ import annotations

import argparse
import json
import os
import ssl
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from datetime import datetime, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / "data" / "cache"
API = "https://www.elprisetjustnu.se/api/v1/prices/{year}/{month_day}_{area}.json"
AREAS = {"SE1", "SE2", "SE3", "SE4"}
TTL = 30 * 60

_cache: dict[str, tuple[float, dict]] = {}
_lock = threading.Lock()


def _get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "wattkoll/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        # python.org builds on macOS often lack a system CA bundle. The payload
        # is public price data, so a one-off unverified retry is acceptable here.
        if "CERTIFICATE_VERIFY_FAILED" not in str(exc):
            raise
        ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req, timeout=12, context=ctx) as r:
            return json.loads(r.read().decode("utf-8"))


def _normalise(area: str, day: str, raw: list) -> dict:
    slots = [
        {
            "start": x["time_start"],
            "end": x["time_end"],
            "sek": round(float(x["SEK_per_kWh"]), 4),
        }
        for x in raw
    ]
    return {"area": area, "date": day, "source": "elprisetjustnu.se", "slots": slots}


def prices(area: str, day: str | None = None) -> dict:
    area = area.upper()
    if area not in AREAS:
        raise ValueError("unknown price area")
    day = day or datetime.now().strftime("%Y-%m-%d")
    key = f"{day}_{area}"

    with _lock:
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < TTL:
            return hit[1]

    disk = CACHE_DIR / f"{key}.json"
    if disk.exists() and time.time() - disk.stat().st_mtime < TTL:
        data = json.loads(disk.read_text())
    else:
        raw = _get_json(API.format(year=day[:4], month_day=day[5:], area=area))
        data = _normalise(area, day, raw)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        disk.write_text(json.dumps(data, separators=(",", ":")))

    with _lock:
        _cache[key] = (time.time(), data)
    return data


def _fallback(area: str) -> dict | None:
    snap = ROOT / "data" / "prices-snapshot.json"
    if not snap.exists():
        return None
    data = json.loads(snap.read_text())
    if not isinstance(data, dict):
        return None
    return data.get(area) or data.get("SE3")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):  # quieter logs
        if "/api/" in (self.path or ""):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/prices":
            return self._prices(parsed)
        if parsed.path == "/api/health":
            return self._json({"ok": True, "time": datetime.now().isoformat()})
        return super().do_GET()

    def _prices(self, parsed):
        q = parse_qs(parsed.query)
        area = (q.get("area") or ["SE3"])[0]
        day = (q.get("date") or [None])[0]
        try:
            data = prices(area, day)
            data["stats"] = _stats(data["slots"])
            return self._json(data)
        except Exception as exc:  # noqa: BLE001 - degraded mode is a feature
            fallback = _fallback(area)
            if fallback:
                fallback = dict(fallback, degraded=True, error=str(exc))
                fallback["stats"] = _stats(fallback["slots"])
                return self._json(fallback)
            return self._json({"error": str(exc)}, status=502)

    def _json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def _stats(slots):
    v = [s["sek"] for s in slots]
    return {"min": min(v), "max": max(v), "avg": sum(v) / len(v)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    port = args.port
    for _ in range(10):
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            port += 1
    else:
        raise SystemExit("no free port")

    url = f"http://127.0.0.1:{port}"
    print(f"\n  Wattkoll  ->  {url}\n  Ctrl+C to stop\n")
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
