#!/usr/bin/env python3
"""Capture deterministic GIFs from the repository's real, library-backed preview demos."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO_ROOT = ROOT / "demo" / "preview-demos"
MANIFEST_PATH = DEMO_ROOT / "preview-manifest.json"
OUTPUT_ROOT = ROOT / "demo" / "gifs" / "captured"
DEFAULT_WIDTH = 320
DEFAULT_HEIGHT = 180


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="Comma-separated effect ids to capture")
    parser.add_argument("--fps", type=int, default=12)
    parser.add_argument("--duration", type=float, default=3.0)
    parser.add_argument("--width", type=int, default=DEFAULT_WIDTH)
    parser.add_argument("--height", type=int, default=DEFAULT_HEIGHT)
    parser.add_argument("--skip-install", action="store_true", help="Fail instead of running npm ci when dependencies are absent")
    parser.add_argument("--built", action="store_true", help="Capture the committed static dist pages instead of Vite source pages")
    parser.add_argument("--headed", action="store_true", help="Show Chrome while capturing")
    parser.add_argument("--keep-frames", action="store_true", help="Keep captured PNG frames under tmp/real-preview-frames")
    return parser.parse_args()


def require_command(command: str) -> str:
    path = shutil.which(command)
    if not path:
        raise RuntimeError(f"Required command is missing: {command}")
    return path


def chrome_path() -> str:
    candidates = [
        os.environ.get("CHROME_PATH"),
        shutil.which("google-chrome"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(candidate)
    raise RuntimeError("Chrome/Chromium was not found. Set CHROME_PATH to its executable.")


def available_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def wait_for_server(url: str, process: subprocess.Popen, log_path: Path) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"Vite exited early:\n{log_path.read_text(errors='replace')}")
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status < 500:
                    return
        except Exception:
            time.sleep(.15)
    raise RuntimeError(f"Timed out waiting for Vite. Log:\n{log_path.read_text(errors='replace')}")


def encode_gif(frame_root: Path, output: Path, fps: int) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    filter_graph = (
        "[0:v]split[base][palette_input];"
        "[palette_input]palettegen=max_colors=96:stats_mode=full[palette];"
        "[base][palette]paletteuse=dither=sierra2_4a:diff_mode=rectangle"
    )
    subprocess.run(
        [
            require_command("ffmpeg"), "-hide_banner", "-loglevel", "error",
            "-framerate", str(fps), "-i", str(frame_root / "%04d.png"),
            "-filter_complex", filter_graph,
            "-loop", "0", "-y", str(output),
        ],
        check=True,
    )
    if output.stat().st_size < 4096:
        raise RuntimeError(f"Encoded GIF is unexpectedly small: {output}")


def live_surface_check(page, renderer: str) -> dict:
    return page.evaluate(
        """renderer => {
          const canvases = [];
          const visit = root => {
            root.querySelectorAll?.('*').forEach(element => {
              if (element.tagName === 'CANVAS') canvases.push(element);
              if (element.shadowRoot) visit(element.shadowRoot);
            });
          };
          visit(document);
          const webglContexts = renderer === 'webgl' ? canvases.map(canvas => {
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return gl && !gl.isContextLost();
          }) : [];
          const canvas2dContexts = renderer === 'canvas2d'
            ? canvases.map(canvas => Boolean(canvas.getContext('2d')))
            : [];
          return {
            canvasCount: canvases.length,
            liveWebglContextCount: webglContexts.filter(Boolean).length,
            liveCanvas2dContextCount: canvas2dContexts.filter(Boolean).length,
            svgCount: document.querySelectorAll('svg').length,
            domMechanismCount: document.querySelectorAll('[data-preview-mechanism]').length
          };
        }""",
        renderer,
    )


def capture_demo(page, url: str, demo: dict, frame_root: Path, args: argparse.Namespace) -> tuple[int, int]:
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(f"{error}\n{getattr(error, 'stack', '')}"))
    page.goto(url, wait_until="load", timeout=45_000)
    page.wait_for_function("window.__PREVIEW_READY__ === true || Boolean(window.__PREVIEW_ERROR__)", timeout=30_000)
    failure = page.evaluate("window.__PREVIEW_ERROR__ || null")
    if failure:
        raise RuntimeError(f"{demo['id']} reported a runtime failure:\n{failure}")
    if errors:
        raise RuntimeError(f"{demo['id']} emitted a page error:\n" + "\n".join(errors))

    metadata = page.evaluate("window.__PREVIEW_META__")
    if (
        metadata.get("id") != demo["id"]
        or metadata.get("library") != demo["library"]
        or metadata.get("renderer") != demo.get("renderer", "webgl")
    ):
        raise RuntimeError(f"{demo['id']} metadata mismatch: {metadata!r}")
    renderer = demo.get("renderer", "webgl")
    surface = live_surface_check(page, renderer)
    valid_surface = (
        renderer == "webgl" and surface["liveWebglContextCount"] >= 1
        or renderer == "canvas2d" and surface["liveCanvas2dContextCount"] >= 1
        or renderer == "svg" and surface["svgCount"] >= 1
        or renderer == "dom" and surface["domMechanismCount"] >= 1
    )
    if not valid_surface:
        raise RuntimeError(f"{demo['id']} has no live {renderer} preview surface: {surface!r}")
    if demo.get("runtimeAssertion"):
        if renderer == "dom":
            page.evaluate("async () => await window.__setPreviewTime(0)")
        runtime_assertion = page.evaluate(
            """async () => typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function'
              && Boolean(await window.__PREVIEW_RUNTIME_ASSERT__())"""
        )
        if not runtime_assertion:
            raise RuntimeError(f"{demo['id']} failed its library-specific runtime assertion")

    frame_count = max(2, round(args.duration * args.fps))
    hashes: set[str] = set()
    for index in range(frame_count):
        preview_time = index / args.fps
        page.evaluate("time => window.__setPreviewTime(time)", preview_time)
        frame_path = frame_root / f"{index:04d}.png"
        page.screenshot(path=str(frame_path), type="png")
        hashes.add(hashlib.sha256(frame_path.read_bytes()).hexdigest())

    minimum_unique = min(6, max(2, frame_count // 6))
    if len(hashes) < minimum_unique:
        raise RuntimeError(f"{demo['id']} produced only {len(hashes)} distinct frames; expected at least {minimum_unique}")
    return frame_count, len(hashes)


def main() -> int:
    args = parse_args()
    if args.fps < 1 or args.duration <= 0 or args.width < 64 or args.height < 64:
        raise RuntimeError("fps, duration, width, and height must be positive capture values")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Python Playwright is required: pip install playwright") from error

    manifest = json.loads(MANIFEST_PATH.read_text())
    selected = set(filter(None, (args.only or "").split(',')))
    demos = [demo for demo in manifest["demos"] if not selected or demo["id"] in selected]
    unknown = selected - {demo["id"] for demo in demos}
    if unknown:
        raise RuntimeError(f"Unknown effect id(s): {', '.join(sorted(unknown))}")

    if args.built and not (DEMO_ROOT / "dist" / f"{demos[0]['id']}.html").exists():
        raise RuntimeError(f"Built demos are absent. Run: npm run build --prefix {DEMO_ROOT}")
    if not args.built and not (DEMO_ROOT / "node_modules" / ".bin" / "vite").exists():
        if args.skip_install:
            raise RuntimeError(f"Dependencies are absent. Run: npm ci --prefix {DEMO_ROOT}")
        print("Installing pinned demo runtimes with npm ci…", flush=True)
        subprocess.run([require_command("npm"), "ci"], cwd=DEMO_ROOT, check=True)

    port = available_port()
    base_url = f"http://127.0.0.1:{port}"
    log_root = ROOT / "tmp"
    log_root.mkdir(parents=True, exist_ok=True)
    vite_log = log_root / "real-preview-vite.log"
    with vite_log.open("w") as log_handle:
        server_command = (
            [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(ROOT / "demo")]
            if args.built
            else [require_command("npm"), "run", "dev", "--", "--host", "127.0.0.1", "--port", str(port), "--strictPort"]
        )
        server = subprocess.Popen(
            server_command,
            cwd=ROOT if args.built else DEMO_ROOT,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
        )

    try:
        def demo_url(demo: dict) -> str:
            path = demo["demoPath"] if args.built else f"{demo['id']}.html"
            return f"{base_url}/{path}"

        wait_for_server(demo_url(demos[0]), server, vite_log)
        OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
        persistent_frames = ROOT / "tmp" / "real-preview-frames" if args.keep_frames else None
        if persistent_frames:
            if persistent_frames.exists():
                shutil.rmtree(persistent_frames)
            persistent_frames.mkdir(parents=True)

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=chrome_path(),
                headless=not args.headed,
                args=["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-webgl"],
            )
            context = browser.new_context(
                viewport={"width": args.width, "height": args.height},
                device_scale_factor=1,
                reduced_motion="no-preference",
            )
            for demo in demos:
                page = context.new_page()
                try:
                    if persistent_frames:
                        frame_root = persistent_frames / demo["id"]
                        frame_root.mkdir()
                        frame_count, unique_count = capture_demo(page, demo_url(demo), demo, frame_root, args)
                        encode_gif(frame_root, OUTPUT_ROOT / f"{demo['id']}.gif", args.fps)
                    else:
                        with tempfile.TemporaryDirectory(prefix=f"{demo['id']}-") as temporary:
                            frame_root = Path(temporary)
                            frame_count, unique_count = capture_demo(page, demo_url(demo), demo, frame_root, args)
                            encode_gif(frame_root, OUTPUT_ROOT / f"{demo['id']}.gif", args.fps)
                finally:
                    page.close()
                size_kib = (OUTPUT_ROOT / f"{demo['id']}.gif").stat().st_size / 1024
                print(f"Captured {demo['id']}: {frame_count} frames, {unique_count} unique, {size_kib:.1f} KiB", flush=True)

            context.close()
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()

    print(f"Wrote {len(demos)} real preview GIF(s) to {OUTPUT_ROOT}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"capture-real-preview-gifs: {error}", file=sys.stderr)
        raise SystemExit(1)
