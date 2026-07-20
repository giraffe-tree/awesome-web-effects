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
        if demo["id"] == "scroll-scrubbed-master-timeline":
            if index == 2:
                page.mouse.move(244, 92)
            elif index in (3, 6):
                page.mouse.wheel(0, 120)
            elif index == 10:
                page.mouse.move(220, 136)
                page.mouse.down()
            elif 11 <= index <= 14:
                progress = (index - 11) / 3
                page.mouse.move(220, 136 - 64 * progress)
            elif index == 15:
                page.mouse.up()
            elif index == 18:
                page.mouse.click(244, 92)
                page.keyboard.press("End")
            elif index == 19:
                page.wait_for_timeout(420)
            elif index == 22:
                page.mouse.wheel(0, 120)
            elif index == 25:
                page.keyboard.press("PageUp")
            elif index == 26:
                page.wait_for_timeout(420)
            elif index == 29:
                page.keyboard.press("Home")
            elif index == 30:
                page.wait_for_timeout(420)
            elif index == 33:
                page.keyboard.press("End")
            elif index == 34:
                page.wait_for_timeout(420)
        elif demo["id"] == "pinned-horizontal-scroll-scene":
            if index == 2:
                page.mouse.move(238, 96)
            elif index in (3, 6, 9):
                page.mouse.wheel(0, 160)
            elif index == 12:
                page.mouse.move(226, 138)
                page.mouse.down()
            elif 13 <= index <= 16:
                progress = (index - 13) / 3
                page.mouse.move(226, 138 - 68 * progress)
            elif index == 17:
                page.mouse.up()
            elif index == 20:
                page.mouse.click(238, 96)
                page.keyboard.press("End")
            elif index == 22:
                page.mouse.wheel(0, 160)
            elif index == 25:
                page.keyboard.press("Home")
            elif index == 29:
                page.keyboard.press("PageDown")
            elif index == 33:
                page.keyboard.press("End")
        elif demo["id"] == "shared-layout-spring-morph":
            if index == 3:
                page.locator('.queue-option[data-index="1"]').click()
            elif index == 4:
                page.wait_for_timeout(900)
            elif index == 10:
                page.locator('#shared-card').click()
            elif index == 11:
                page.wait_for_timeout(900)
            elif index == 16:
                page.locator('.queue-option[data-index="2"]').click()
            elif index == 17:
                page.wait_for_timeout(900)
            elif index == 23:
                page.keyboard.press("Escape")
            elif index == 24:
                page.wait_for_timeout(900)
            elif index == 28:
                page.locator('.queue-option[data-index="1"]').focus()
                page.keyboard.press("Enter")
            elif index == 29:
                page.wait_for_timeout(900)
            elif index == 34:
                page.keyboard.press("Space")
            elif index == 35:
                page.wait_for_timeout(900)
        elif demo["id"] == "staggered-transform-choreography":
            if index == 3:
                page.locator('#assemble-button').click()
            elif index == 4:
                page.wait_for_timeout(1_150)
            elif index == 10:
                page.locator('.action-card').nth(4).hover()
            elif index == 14:
                page.locator('.action-card').nth(6).click()
            elif index == 18:
                page.locator('#incident-board').focus()
                page.keyboard.press("End")
            elif index == 20:
                page.keyboard.press("ArrowLeft")
            elif index == 23:
                page.locator('#assemble-button').click()
            elif index == 24:
                page.wait_for_timeout(1_150)
            elif index == 28:
                page.locator('#incident-board').focus()
                page.keyboard.press("Enter")
            elif index == 29:
                page.wait_for_timeout(1_150)
            elif index == 34:
                page.locator('.action-card').nth(2).hover()
        elif demo["id"] == "motion-graphics-burst":
            if index == 3:
                page.locator('.burst-node[data-node-id="ingest"]').click()
            elif index == 4:
                page.wait_for_timeout(1_050)
            elif index == 9:
                page.locator('.burst-node[data-node-id="verify"]').click()
            elif index == 10:
                page.wait_for_timeout(350)
            elif index == 11:
                page.wait_for_timeout(800)
            elif index == 15:
                page.locator('.burst-node[data-node-id="verify"]').focus()
                page.keyboard.press("ArrowRight")
            elif index == 16:
                page.keyboard.press("Enter")
            elif index == 17:
                page.wait_for_timeout(1_050)
            elif index == 22:
                page.locator('.burst-node[data-node-id="verify"]').click()
            elif index == 23:
                page.wait_for_timeout(250)
            elif index == 24:
                page.locator('.burst-node[data-node-id="release"]').click()
            elif index == 25:
                page.wait_for_timeout(1_050)
            elif index == 30:
                page.keyboard.press("Escape")
            elif index == 33:
                page.locator('.burst-node[data-node-id="verify"]').click()
            elif index == 34:
                page.wait_for_timeout(1_050)
        elif demo["id"] == "visually-authored-keyframe-sequence":
            if index == 3:
                page.locator('.keyframe-button[data-index="1"]').click()
            elif index == 6:
                page.locator('.keyframe-button[data-index="2"]').click()
            elif index == 9:
                page.locator('.keyframe-button[data-index="3"]').click()
            elif index == 12:
                page.locator('.keyframe-button[data-index="4"]').click()
            elif index == 15:
                page.locator('.keyframe-button[data-index="0"]').click()
            elif index == 18:
                page.locator('#play-button').click()
            elif index == 19:
                page.wait_for_timeout(300)
            elif index == 20:
                page.locator('.keyframe-button[data-index="3"]').click()
            elif index == 22:
                page.locator('#play-button').click()
            elif index == 23:
                page.wait_for_timeout(900)
            elif index == 26:
                page.locator('.keyframe-button[data-index="1"]').click()
                page.locator('#theatre-actor').click()
            elif index == 27:
                page.wait_for_timeout(150)
                page.locator('#play-button').click()
            elif index == 29:
                page.locator('#theatre-actor').click()
            elif index == 31:
                page.locator('#sequence-scrubber').focus()
                page.keyboard.press("End")
            elif index == 33:
                page.locator('.keyframe-button[data-index="2"]').click()
        elif demo["id"] == "compact-svg-shape-tween":
            if index == 3:
                page.locator('#save-control').click()
            elif index == 4:
                page.wait_for_timeout(750)
            elif index == 8:
                page.locator('#shortlist-stage').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 9:
                page.wait_for_timeout(750)
            elif index == 13:
                page.locator('#shortlist-stage').focus()
                page.keyboard.press("Enter")
            elif index == 14:
                page.wait_for_timeout(750)
            elif index == 18:
                page.locator('#save-control').click()
            elif index == 19:
                page.wait_for_timeout(250)
            elif index == 20:
                page.wait_for_timeout(550)
            elif index == 24:
                page.locator('#shortlist-stage').focus()
                page.keyboard.press("ArrowRight")
            elif index == 25:
                page.wait_for_timeout(750)
            elif index == 29:
                page.locator('#shortlist-stage').focus()
                page.keyboard.press("Escape")
            elif index == 30:
                page.wait_for_timeout(750)
            elif index == 34:
                page.locator('#save-control').click()
            elif index == 35:
                page.wait_for_timeout(750)
        elif demo["id"] == "svg-stroke-drawing":
            if index == 3:
                page.locator('#trace-route').click()
            elif index == 4:
                page.wait_for_timeout(700)
            elif index == 5:
                page.wait_for_timeout(1_300)
            elif index == 10:
                page.locator('#route-map').click()
            elif index == 11:
                page.wait_for_timeout(400)
            elif index == 12:
                page.locator('#trace-route').click()
            elif index == 13:
                page.wait_for_timeout(2_000)
            elif index == 18:
                page.keyboard.press("Escape")
            elif index == 21:
                page.locator('#route-map').focus()
                page.keyboard.press("Enter")
            elif index == 22:
                page.wait_for_timeout(2_000)
            elif index == 27:
                page.locator('#clear-route').click()
            elif index == 30:
                page.locator('#trace-route').click()
            elif index == 31:
                page.wait_for_timeout(700)
            elif index == 32:
                page.locator('#route-map').click()
            elif index == 33:
                page.wait_for_timeout(2_000)
        elif demo["id"] == "sketch-style-creative-coding-loop":
            if index == 3:
                box = page.locator('#poster-surface').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .72, box["y"] + box["height"] * .35)
                page.mouse.down()
            elif index == 4:
                box = page.locator('#poster-surface').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .31, box["y"] + box["height"] * .72, steps=5)
            elif index == 5:
                page.mouse.up()
            elif index == 8:
                page.locator('.preset-button[data-preset="surge"]').click()
            elif index == 11:
                page.locator('#density-control').focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 14:
                page.locator('#loop-button').click()
            elif index == 15:
                page.wait_for_timeout(400)
            elif index == 16:
                page.locator('#loop-button').click()
            elif index == 20:
                page.locator('#p5-stage canvas').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 21:
                page.keyboard.press("ArrowUp")
            elif index == 24:
                page.keyboard.press("Space")
            elif index == 25:
                page.wait_for_timeout(300)
            elif index == 26:
                page.keyboard.press("Space")
            elif index == 29:
                page.locator('.preset-button[data-preset="ridge"]').click()
            elif index == 32:
                page.locator('#density-control').focus()
                page.keyboard.press("End")
            elif index == 34:
                page.locator('#p5-stage canvas').focus()
                page.keyboard.press("Home")
        elif demo["id"] == "functional-webgl-draw-commands":
            if index == 3:
                page.locator('#analyze-button').click()
            elif index == 11:
                page.locator('#analyze-button').click()
            elif index == 19:
                box = page.locator('#analysis-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .25, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 20:
                box = page.locator('#analysis-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .75, box["y"] + box["height"] * .5, steps=4)
                page.mouse.up()
            elif index == 22:
                page.locator('#analysis-stage').focus()
                page.keyboard.press("End")
            elif index == 30:
                page.keyboard.press("Home")
            elif index == 34:
                box = page.locator('#analysis-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] - 1, box["y"] + box["height"] * .58)
                page.mouse.down()
                page.mouse.up()
        elif demo["id"] == "autonomous-agent-cursor-constellation":
            if index == 3:
                page.locator('.handoff-node[data-stage="discover"]').click()
            elif index == 4:
                page.wait_for_timeout(850)
            elif index == 8:
                page.locator('.handoff-node[data-stage="compose"]').click()
            elif index == 9:
                page.wait_for_timeout(850)
            elif index == 13:
                page.locator('.handoff-node[data-stage="verify"]').click()
            elif index == 14:
                page.locator('.handoff-node[data-stage="discover"]').click()
            elif index == 15:
                page.wait_for_timeout(850)
            elif index == 19:
                page.locator('#reset-handoff').click()
            elif index == 22:
                page.locator('.handoff-node[data-stage="discover"]').focus()
                page.keyboard.press("End")
                page.keyboard.press("Enter")
            elif index == 23:
                page.wait_for_timeout(850)
            elif index == 27:
                page.keyboard.press("Escape")
            elif index == 30:
                page.locator('.handoff-node[data-stage="discover"]').focus()
                page.keyboard.press("ArrowDown")
                page.keyboard.press("Enter")
            elif index == 31:
                page.wait_for_timeout(850)
        elif demo["id"] == "scroll-linked-multilayer-starfield":
            if index == 2:
                box = page.locator('#sky-viewport').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .7, box["y"] + box["height"] * .55)
                page.mouse.wheel(0, -100)
            elif index == 4:
                page.mouse.wheel(0, 100)
            elif index == 6:
                page.mouse.wheel(0, 100)
            elif index == 8:
                page.locator('.chapter-button[data-index="1"]').click()
            elif index == 11:
                box = page.locator('#sky-viewport').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .78, box["y"] + box["height"] * .76)
                page.mouse.down()
            elif index == 12:
                box = page.locator('#sky-viewport').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .78, box["y"] + box["height"] * .24, steps=5)
                page.mouse.up()
            elif index == 15:
                page.locator('#starfield-stage canvas').focus()
                page.keyboard.press("Home")
            elif index == 17:
                page.keyboard.press("PageDown")
            elif index == 19:
                page.locator('.chapter-button[data-index="2"]').click()
            elif index == 22:
                page.locator('#starfield-stage canvas').focus()
                page.keyboard.press("End")
            elif index == 23:
                box = page.locator('#sky-viewport').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .7, box["y"] + box["height"] * .55)
                page.mouse.wheel(0, 100)
            elif index == 26:
                page.mouse.wheel(0, -100)
            elif index == 28:
                page.locator('.chapter-button[data-index="3"]').click()
            elif index == 31:
                page.locator('.chapter-button[data-index="0"]').click()
            elif index == 34:
                page.locator('#starfield-stage canvas').focus()
                page.keyboard.press("End")
        elif demo["id"] == "card-metadata-to-cta-role-swap":
            if index == 3:
                page.locator('#research-card').hover()
            elif index == 4:
                page.wait_for_timeout(340)
            elif index == 7:
                page.mouse.move(1, 1)
            elif index == 8:
                page.wait_for_timeout(340)
            elif index == 11:
                page.locator('#research-card').hover()
            elif index == 12:
                page.mouse.move(1, 1)
            elif index == 13:
                page.wait_for_timeout(340)
            elif index == 16:
                page.locator('#research-card').focus()
            elif index == 17:
                page.wait_for_timeout(340)
            elif index == 19:
                page.keyboard.press("Enter")
            elif index == 21:
                page.locator('#cta-button').click()
            elif index == 24:
                page.keyboard.press("Escape")
            elif index == 25:
                page.wait_for_timeout(340)
            elif index == 26:
                page.mouse.move(1, 1)
            elif index == 28:
                page.locator('#research-card').hover()
            elif index == 29:
                page.wait_for_timeout(340)
            elif index == 31:
                page.locator('#reset-button').click()
            elif index == 32:
                page.wait_for_timeout(340)
            elif index == 34:
                page.locator('#research-card').focus()
                page.keyboard.press("Space")
            elif index == 35:
                page.wait_for_timeout(340)
        elif demo["id"] == "ascii-orchestration-signal-sweep":
            if index == 3:
                page.locator('#trace-button').click()
            elif index == 14:
                page.locator('#route-stage').focus()
                page.keyboard.press("End")
            elif index == 15:
                page.locator('#direction-button').click()
            elif index == 16:
                page.locator('#route-stage').focus()
                page.keyboard.press("Home")
            elif index == 18:
                page.locator('#trace-button').click()
            elif index == 29:
                box = page.locator('#route-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .8, box["y"] + box["height"] * .58)
                page.mouse.down()
            elif index == 30:
                box = page.locator('#route-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .45, box["y"] + box["height"] * .46, steps=5)
                page.mouse.up()
            elif index == 31:
                page.locator('#route-stage').focus()
                page.keyboard.press("r")
            elif index == 32:
                page.keyboard.press("Home")
            elif index == 34:
                box = page.locator('#route-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] - .01, box["y"] + box["height"] * .56)
                page.mouse.down()
                page.mouse.up()
        elif demo["id"] == "dom-to-3d-scroll-synchronization":
            if index == 2:
                box = page.locator('#sync-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .72, box["y"] + box["height"] * .56)
                page.mouse.wheel(0, -100)
            elif index == 4:
                page.mouse.wheel(0, 100)
            elif index == 6:
                page.mouse.wheel(0, 100)
            elif index == 8:
                page.locator('.section-control[data-section="service"]').click()
            elif index == 11:
                box = page.locator('#scrub-track').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .3, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 12:
                box = page.locator('#scrub-track').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .7, box["y"] + box["height"] * .5, steps=5)
                page.mouse.up()
            elif index == 14:
                page.locator('.section-control[data-section="anchor"]').click()
            elif index == 16:
                page.mouse.wheel(0, 100)
            elif index == 19:
                page.mouse.wheel(0, -100)
            elif index == 21:
                page.locator('#sync-stage').focus()
                page.keyboard.press("Home")
            elif index == 23:
                page.mouse.wheel(0, -100)
            elif index == 25:
                page.locator('.section-control[data-section="service"]').click()
            elif index == 27:
                box = page.locator('#scrub-track').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .63, box["y"] + box["height"] * .5)
                page.mouse.down()
                page.mouse.up()
            elif index == 30:
                page.locator('#sync-stage').focus()
                page.keyboard.press("3")
            elif index == 31:
                page.mouse.wheel(0, 100)
            elif index == 33:
                page.locator('#sync-stage').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 34:
                page.keyboard.press("End")
            elif index == 35:
                page.mouse.wheel(0, 100)
        elif demo["id"] == "blurhash-to-photo-progressive-reveal":
            pointer_x = 230 if .5 <= preview_time < 2.25 else 32
            page.mouse.move(pointer_x, 90)
        elif demo["id"] == "pointer-following-displacement-ripple":
            if index == round(.5 * args.fps):
                page.mouse.move(144, 70)
            elif index == round(1.15 * args.fps):
                page.mouse.move(218, 132)
        elif demo["id"] == "four-corner-hover-crop-marks":
            if index == round(.35 * args.fps):
                page.mouse.move(92, 78)
            elif index == round(1.1 * args.fps):
                page.mouse.move(230, 105)
            elif index == round(1.75 * args.fps):
                page.mouse.move(330, 190)
        elif demo["id"] == "chromatic-channel-drag-portrait":
            if index == 5:
                page.mouse.move(220, 90)
                page.mouse.down()
            elif 6 <= index <= 12:
                progress = (index - 6) / 6
                page.mouse.move(220 + 62 * progress, 90)
            elif 16 <= index <= 20:
                progress = (index - 16) / 4
                page.mouse.move(260 - 82 * progress, 90)
            elif index == 21:
                page.mouse.up()
        elif demo["id"] == "hover-rehearsed-video-style-rail":
            if index == 5:
                page.mouse.move(69, 161)
            elif index == 12:
                page.mouse.move(160, 120)
            elif index == 15:
                page.mouse.move(251, 161)
            elif index == 20:
                page.mouse.click(251, 161)
            elif index == 23:
                page.mouse.move(160, 120)
            elif index == 26:
                page.mouse.move(22, 161)
            elif index == 31:
                page.mouse.move(160, 120)
        elif demo["id"] == "depth-layer-blur-dissolve":
            if index == 3:
                page.mouse.move(1, 146)
                page.mouse.down()
            elif 4 <= index <= 16:
                progress = (index - 4) / 12
                page.mouse.move(1 + 318 * progress, 146)
            elif index == 17:
                page.mouse.up()
            elif index == 20:
                page.mouse.move(319, 146)
                page.mouse.down()
            elif 21 <= index <= 33:
                progress = (index - 21) / 12
                page.mouse.move(319 - 318 * progress, 146)
            elif index == 34:
                page.mouse.up()
        elif demo["id"] == "pointer-driven-multilayer-depth-stage":
            if index == 3:
                page.mouse.move(35, 140)
            elif 4 <= index <= 10:
                progress = (index - 4) / 6
                page.mouse.move(35 + 250 * progress, 140 - 95 * progress)
            elif index == 12:
                page.mouse.move(70, 50)
            elif index == 15:
                page.mouse.move(45, 145)
                page.mouse.down()
            elif 16 <= index <= 24:
                progress = (index - 16) / 8
                page.mouse.move(45 + 230 * progress, 145 - 110 * progress)
            elif index == 25:
                page.mouse.up()
            elif index == 28:
                page.mouse.move(330, 190)
        elif demo["id"] == "track-card-play-state-handoff":
            if index == 3:
                page.mouse.click(276, 64)
            elif index == 11:
                page.mouse.click(160, 120)
            elif index == 20:
                page.mouse.click(260, 120)
            elif index == 29:
                page.mouse.click(276, 64)
        elif demo["id"] == "gesture-sliced-image-shutters":
            if index == 3:
                page.mouse.move(75, 100)
                page.mouse.down()
            elif 4 <= index <= 10:
                progress = (index - 4) / 6
                page.mouse.move(75 + 195 * progress, 100)
            elif index == 11:
                page.mouse.up()
            elif index == 16:
                page.mouse.move(260, 100)
                page.mouse.down()
            elif 17 <= index <= 21:
                progress = (index - 17) / 4
                page.mouse.move(260 - 210 * progress, 100)
            elif index == 22:
                page.mouse.up()
        elif demo["id"] == "duration-aware-hero-film-handoff":
            if index == 3:
                page.mouse.click(35, 156)
            elif index == 4:
                # This preview is intentionally driven by the real HTMLVideoElement
                # clock. Let the 2.4 s opening clip reach its 0.72 s preload window
                # so the GIF records a genuine duration-aware handoff.
                page.wait_for_timeout(2250)
            elif index == 28:
                page.mouse.click(270, 156)
            elif index == 29:
                # Preserve the authored 0.48 s Motion crossfade after the viewer
                # explicitly selects scene four.
                page.wait_for_timeout(550)
            elif index == 35:
                page.mouse.click(35, 156)
        elif demo["id"] == "blurred-autoplay-video-ambience":
            if index == 3:
                page.mouse.click(36, 156)
            elif index == 9:
                page.mouse.click(92, 156)
            elif index == 16:
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.mouse.click(92, 156)
            elif index == 28:
                page.mouse.click(36, 156)
        elif demo["id"] == "perspective-tilt-and-glare":
            if index == 3:
                page.mouse.move(112, 40)
            elif 4 <= index <= 10:
                progress = (index - 4) / 6
                page.mouse.move(112 + 166 * progress, 40 + 88 * progress)
            elif index == 11:
                page.mouse.move(330, 190)
            elif index == 16:
                page.mouse.move(268, 42)
            elif index == 22:
                page.mouse.move(330, 190)
            elif index == 26:
                page.mouse.click(200, 90)
            elif index == 27:
                page.keyboard.press("ArrowLeft")
            elif index == 29:
                page.keyboard.press("ArrowUp")
            elif index == 33:
                page.keyboard.press("Home")
        elif demo["id"] == "delayed-dropdown-promo-sweep":
            if index == 3:
                page.mouse.click(274, 24)
            elif index == 4:
                page.wait_for_timeout(690)
            elif index == 10:
                page.wait_for_timeout(850)
            elif index == 14:
                page.keyboard.press("Escape")
            elif index == 15:
                page.wait_for_timeout(400)
            elif index == 20:
                page.mouse.click(274, 24)
            elif index == 21:
                page.wait_for_timeout(250)
            elif index == 22:
                page.mouse.click(5, 175)
            elif index == 23:
                page.wait_for_timeout(400)
            elif index == 27:
                page.mouse.click(274, 24)
            elif index == 28:
                page.wait_for_timeout(690)
            elif index == 33:
                page.wait_for_timeout(850)
        elif demo["id"] == "inertial-vertical-capability-rail":
            if index == 3:
                page.mouse.move(220, 132)
                page.mouse.down()
            elif 4 <= index <= 8:
                progress = (index - 4) / 4
                page.mouse.move(220, 132 - 92 * progress)
            elif index == 9:
                page.mouse.up()
            elif index == 10:
                page.wait_for_timeout(250)
            elif index == 18:
                page.mouse.click(220, 92)
            elif index == 19:
                page.keyboard.press("End")
            elif index == 20:
                page.wait_for_timeout(700)
            elif index == 27:
                page.keyboard.press("Home")
            elif index == 28:
                page.wait_for_timeout(700)
        elif demo["id"] == "scroll-scrubbed-document-generation-playback":
            if index == 2:
                page.mouse.move(230, 90)
            elif 3 <= index <= 7:
                page.mouse.wheel(0, 120)
            elif index == 8:
                page.mouse.wheel(0, 120)
            elif index == 14:
                page.locator('.chapter-button[data-section="2"]').click()
            elif index == 15:
                page.wait_for_timeout(500)
            elif index == 21:
                page.mouse.click(230, 90)
                page.keyboard.press("Home")
            elif index == 22:
                page.wait_for_timeout(500)
            elif index == 27:
                page.keyboard.press("PageDown")
            elif index == 28:
                page.wait_for_timeout(500)
            elif index == 32:
                page.keyboard.press("End")
            elif index == 33:
                page.wait_for_timeout(500)
        elif demo["id"] == "visibility-gated-agent-terminal-replay":
            if index == 2:
                page.locator("#play-toggle").click()
            elif index in (3, 5, 7):
                page.wait_for_timeout(650)
            elif index == 9:
                page.locator("#play-toggle").click()
            elif index == 13:
                page.mouse.click(250, 108)
                page.keyboard.press("ArrowRight")
            elif index == 14:
                page.wait_for_timeout(300)
            elif index == 18:
                page.keyboard.press("ArrowRight")
            elif index == 19:
                page.wait_for_timeout(300)
            elif index == 23:
                page.keyboard.press("End")
            elif index == 24:
                page.wait_for_timeout(300)
            elif index == 28:
                page.locator("#restart").click()
            elif index == 29:
                page.wait_for_timeout(650)
            elif index == 32:
                page.locator("#play-toggle").click()
        elif demo["id"] == "synchronized-scenario-scene-handoff":
            if index == 3:
                page.locator('.scenario-tab[data-index="1"]').click()
            elif index == 4:
                page.wait_for_timeout(650)
            elif index == 9:
                page.locator("#case-action").click()
            elif index == 15:
                page.locator('.scenario-tab[data-index="2"]').click()
            elif index == 16:
                page.wait_for_timeout(650)
            elif index == 21:
                page.locator("#case-action").click()
            elif index == 25:
                page.mouse.click(250, 110)
                page.keyboard.press("Home")
            elif index == 26:
                page.wait_for_timeout(650)
            elif index == 31:
                page.keyboard.press("ArrowRight")
            elif index == 32:
                page.wait_for_timeout(650)
        elif demo["id"] == "filterable-grid-reflow":
            if index == 3:
                page.locator('.filter-button[data-filter="field-tools"]').click()
            elif index == 4:
                page.wait_for_timeout(600)
            elif index == 10:
                page.locator('.sort-button[data-sort="name"]').click()
            elif index == 11:
                page.wait_for_timeout(600)
            elif index == 17:
                page.locator('.filter-button[data-filter="field-archive"]').click()
            elif index == 18:
                page.wait_for_timeout(600)
            elif index == 24:
                page.keyboard.press("Home")
            elif index == 25:
                page.wait_for_timeout(600)
            elif index == 30:
                page.locator('.sort-button[data-sort="name"]').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 31:
                page.wait_for_timeout(600)
        elif demo["id"] == "device-silhouette-masked-video":
            if index == 3:
                page.locator('[data-device-option="phone"]').click()
            elif index == 4:
                page.wait_for_timeout(600)
            elif index == 8:
                page.locator("#device-play").click()
            elif index in (9, 12):
                page.wait_for_timeout(800)
            elif index == 14:
                page.locator('[data-device-option="watch"]').click()
            elif index == 15:
                page.wait_for_timeout(600)
            elif index == 19:
                page.locator("#device-play").click()
            elif index == 23:
                page.mouse.click(217, 80)
                page.keyboard.press("ArrowLeft")
            elif index == 24:
                page.wait_for_timeout(600)
            elif index == 28:
                page.mouse.move(217, 80)
                page.mouse.down()
                page.mouse.move(180, 80, steps=4)
                page.mouse.up()
            elif index == 29:
                page.wait_for_timeout(600)
            elif index == 33:
                page.keyboard.press("1")
            elif index == 34:
                page.wait_for_timeout(500)
        page.evaluate("time => window.__setPreviewTime(time)", preview_time)
        frame_path = frame_root / f"{index:04d}.png"
        page.screenshot(path=str(frame_path), type="png")
        hashes.add(hashlib.sha256(frame_path.read_bytes()).hexdigest())

    if demo["id"] == "scroll-scrubbed-master-timeline":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.timelineProgress === 1 && !window.__PREVIEW_INTERACTION_STATE__.motionActive",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or not interaction["masterTimelinePaused"]
            or interaction["wheelBoundaryPolicy"] != "release-at-bounds"
            or interaction["inputAdapters"] != ["wheel", "vertical-drag", "keyboard"]
            or interaction["inputCount"] < 9
            or interaction["wheelCount"] < 3
            or interaction["dragMoveCount"] < 4
            or interaction["keyboardCount"] < 4
            or interaction["boundaryReleaseCount"] < 1
            or interaction["timelineProgress"] != 1
            or interaction["phase"] != "settle"
            or interaction["phaseIndex"] != 2
            or interaction["cardStates"] != {"brief": "accepted", "prototype": "verified", "release": "ready"}
            or interaction["evidence"]["release"] != "18/18 checks · rollback 41s"
            or interaction["owners"]["release"] != "Release Captain"
            or interaction["pointerCaptured"]
            or interaction["motionActive"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture human-owned causal timeline scrubbing and boundary release: {interaction!r}")
    elif demo["id"] == "pinned-horizontal-scroll-scene":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["nativeScrollLinked"]
            or not interaction["pinnedElementMatches"]
            or not interaction["scrollTriggerReady"]
            or not interaction["initialStaticConfirmed"]
            or interaction["wheelBoundaryPolicy"] != "release-at-bounds"
            or interaction["inputAdapters"] != ["vertical-wheel", "vertical-drag", "keyboard"]
            or interaction["inputCount"] < 10
            or interaction["wheelCount"] < 4
            or interaction["dragMoveCount"] < 4
            or interaction["keyboardCount"] < 4
            or interaction["boundaryReleaseCount"] < 1
            or interaction["progress"] < .999
            or interaction["panelIndex"] != 3
            or interaction["currentStep"] != "approve"
            or interaction["pointerCaptured"]
            or interaction["triggerEnd"] <= interaction["triggerStart"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-owned one-way pinned route story: {interaction!r}")
    elif demo["id"] == "shared-layout-spring-morph":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.phase === 'compact' && window.__PREVIEW_INTERACTION_STATE__.layoutComplete && !window.__PREVIEW_INTERACTION_STATE__.animationActive",
            timeout=3_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticLayoutChanges"]
            or interaction["syntheticInput"]
            or interaction["automaticFallback"]
            or not interaction["sharedNodeStable"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 6
            or interaction["pointerInputCount"] < 3
            or interaction["keyboardInputCount"] < 3
            or interaction["selectionCount"] < 3
            or interaction["openCount"] < 3
            or interaction["closeCount"] < 3
            or interaction["springStartCount"] < 6
            or interaction["springCompleteCount"] < 6
            or interaction["springCancelCount"] != 0
            or interaction["selectedIndex"] != 1
            or interaction["selectedId"] != "PAY-117"
            or interaction["expanded"]
            or interaction["phase"] != "compact"
            or interaction["animationActive"]
            or not interaction["layoutComplete"]
            or not interaction["compactRectValidated"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture one shared review item opening and returning under real input: {interaction!r}")
    elif demo["id"] == "staggered-transform-choreography":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.mode === 'armed' && !window.__PREVIEW_INTERACTION_STATE__.motionActive",
            timeout=3_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputAdapters"] != ["click", "keyboard", "pointer-selection"]
            or interaction["inputCount"] < 8
            or interaction["clickCount"] < 3
            or interaction["keyboardCount"] < 3
            or interaction["pointerSelectionCount"] < 2
            or interaction["focusSelectionCount"] < 1
            or interaction["animationPlayCount"] < 2
            or interaction["resetCount"] < 1
            or interaction["mode"] != "armed"
            or not interaction["assembled"]
            or interaction["motionActive"]
            or interaction["animationDirection"] != "idle"
            or interaction["animationProgress"] < .999
            or interaction["settledCount"] != 8
            or interaction["selectedIndex"] != 2
            or interaction["selectedTaskId"] != "shed"
            or len(interaction["tasks"]) != 8
            or interaction["staggerStepMs"] != 64
            or any(value != "ready" for value in interaction["taskStates"].values())
        ):
            raise RuntimeError(f"{demo['id']} did not capture real priority-ordered incident assembly, inspection, and clearing: {interaction!r}")
    elif demo["id"] == "motion-graphics-burst":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["automaticTrigger"]
            or interaction["automaticNodeSelection"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userInitiated"]
            or not interaction["eventOwnedTimeline"]
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 8
            or interaction["lastInputTrusted"] is not True
            or interaction["triggerCount"] < 6
            or interaction["burstCount"] != interaction["triggerCount"]
            or interaction["mojsReplayCount"] != interaction["triggerCount"]
            or interaction["pointerTriggerCount"] < 5
            or interaction["keyboardTriggerCount"] < 1
            or interaction["focusMoveCount"] < 1
            or interaction["resetCount"] < 1
            or interaction["interruptionCount"] < 1
            or interaction["nodeTriggerCounts"] != {"ingest": 1, "verify": 3, "release": 2}
            or interaction["selectedNode"] != "verify"
            or interaction["lastTriggeredNode"] != "verify"
            or not interaction["traceActive"]
            or interaction["phase"] != "settled"
            or interaction["isAnimating"]
            or interaction["timelineProgress"] != 1
            or not interaction["mappedToNodeCenter"]
            or interaction["lastOriginDistanceFromNodeCenter"] > .02
            or interaction["coordinateSpace"] != "burst-field-local-css-pixels"
            or interaction["mojsRevision"] != "1.7.1"
            or interaction["mojsTimelineCount"] != 4
            or interaction["svgCount"] < 4
        ):
            raise RuntimeError(f"{demo['id']} did not capture real node-mapped Mo.js bursts, interruption, and reset: {interaction!r}")
    elif demo["id"] == "visually-authored-keyframe-sequence":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPlayback"]
            or interaction["automaticPositionChanges"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 12
            or interaction["pointerInputCount"] < 11
            or interaction["keyboardInputCount"] < 1
            or interaction["scrubInputCount"] < 1
            or interaction["markerClickCount"] < 8
            or interaction["playClickCount"] < 3
            or interaction["pauseClickCount"] < 1
            or interaction["playbackStartCount"] < 3
            or interaction["playbackCompleteCount"] < 1
            or interaction["playbackCancelCount"] < 1
            or interaction["frameAdvanceCount"] < 3
            or interaction["positionSetCount"] < 12
            or not interaction["sequencePositionValidated"]
            or not interaction["actorValuesValidated"]
            or interaction["isPlaying"]
            or interaction["phase"] != "pose-selected"
            or interaction["currentTime"] != 1.5
            or interaction["progress"] != .5
            or interaction["activePoseIndex"] != 2
            or interaction["activePoseId"] != "cross"
            or interaction["lastTrustedEvent"] != "marker-3"
        ):
            raise RuntimeError(f"{demo['id']} did not capture real Theatre.js marker selection, scrub, play, pause, cancellation, and completion: {interaction!r}")
    elif demo["id"] == "compact-svg-shape-tween":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputAdapters"] != ["click", "keyboard", "pointer"]
            or interaction["inputCount"] < 7
            or interaction["keyboardCount"] < 4
            or interaction["pointerActivationCount"] < 3
            or interaction["forwardMorphCount"] < 4
            or interaction["reverseMorphCount"] < 3
            or interaction["kuteVersion"] != "2.2.6"
            or interaction["normalizedPointCount"] < 3
            or interaction["durationMs"] != 680
            or not interaction["saved"]
            or not interaction["targetSaved"]
            or interaction["phase"] != "idle-saved"
            or interaction["motionActive"]
            or interaction["morphProgress"] != 1
            or interaction["activeDirection"] != "idle"
            or interaction["renderedShape"] != "check"
            or interaction["shortlistCount"] != 1
            or interaction["lastInput"] != "pointer:mouse"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real KUTE.js shortlist decision across pointer and keyboard input: {interaction!r}")
    elif demo["id"] == "svg-stroke-drawing":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["automaticReplay"]
            or interaction["automaticTrigger"]
            or interaction["syntheticInputDispatch"]
            or not interaction["eventOwnedTimeline"]
            or not interaction["userInitiated"]
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 8
            or interaction["lastInputTrusted"] is not True
            or interaction["triggerCount"] < 6
            or interaction["playCount"] != interaction["triggerCount"]
            or interaction["completionCount"] < 4
            or interaction["pointerTriggerCount"] < 5
            or interaction["keyboardTriggerCount"] < 1
            or interaction["resetCount"] < 2
            or interaction["interruptionCount"] < 2
            or interaction["semanticOrder"] != ["origin", "leg-one", "waypoint", "leg-two", "destination", "approval"]
            or interaction["expectedPathCount"] != 6
            or interaction["vivusMapCount"] != 6
            or interaction["lastTriggerTarget"] != "route-map"
            or not interaction["routeVisible"]
            or interaction["phase"] != "complete"
            or interaction["isDrawing"]
            or interaction["progress"] != 1
            or interaction["currentFrame"] != interaction["frameLength"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real semantic Vivus route draw, interruption, keyboard trigger, and reset: {interaction!r}")
    elif demo["id"] == "sketch-style-creative-coding-loop":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticLoop"]
            or interaction["automaticFieldChanges"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 12
            or interaction["pointerInputCount"] < 5
            or interaction["keyboardInputCount"] < 7
            or interaction["pointerDragCount"] < 1
            or interaction["pointerMoveCount"] < 5
            or interaction["keyboardAdjustCount"] < 3
            or interaction["densityInputCount"] < 3
            or interaction["presetClickCount"] < 2
            or interaction["loopToggleCount"] < 4
            or interaction["loopStartCount"] < 2
            or interaction["loopPauseCount"] < 2
            or interaction["loopFrameCount"] < 2
            or interaction["currentPreset"] != "ridge"
            or interaction["density"] != 22
            or interaction["focusX"] != .5
            or interaction["focusY"] != .5
            or interaction["loopPhase"] <= .12
            or interaction["isLooping"]
            or interaction["phase"] != "edited"
            or interaction["lastTrustedEvent"] != "field-key-adjust"
            or not interaction["canvasSizeValidated"]
            or not interaction["parametersValidated"]
            or interaction["fieldChecksum"] <= 1
            or len(interaction["fieldSignature"]) <= 16
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real p5 poster edit across drag, presets, density, keyboard, and explicit loop transport: {interaction!r}")
    elif demo["id"] == "functional-webgl-draw-commands":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputAdapters"] != ["pointer", "touch", "click", "keyboard"]
            or interaction["inputCount"] < 6
            or interaction["pointerInputCount"] < 4
            or interaction["keyboardInputCount"] < 2
            or interaction["pointerMoveCount"] < 4
            or interaction["transitionCount"] < 4
            or interaction["drawCommandCount"] != 4
            or interaction["drawCommandIds"] != ["field", "density", "cells", "response-gate"]
            or any(count != interaction["renderCount"] for count in interaction["drawCommandExecutions"].values())
            or interaction["particleCount"] != 1100
            or interaction["populationCounts"] != [759, 253, 88]
            or interaction["rarePopulationRatio"] != .08
            or interaction["dataChecksum"] != 3876023964
            or not interaction["deterministicData"]
            or interaction["randomSourceUsed"]
            or interaction["claimedLibrary"] != "regl@2.1.1"
            or not interaction["realReglContext"]
            or interaction["motionActive"]
            or interaction["dragActive"]
            or interaction["phase"] != "resolved"
            or interaction["progress"] < .985
            or interaction["targetProgress"] < .985
            or interaction["activeDirection"] != "idle"
            or interaction["lastInput"] != "pointer:mouse:drag"
            or interaction["initialFrameChecksum"] == 0
            or interaction["canvasWidth"] < 64
            or interaction["canvasHeight"] < 64
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real four-command regl cell analysis across buttons, drag, and keyboard: {interaction!r}")
    elif demo["id"] == "autonomous-agent-cursor-constellation":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["automaticSelection"]
            or interaction["automaticTrigger"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["eventOwnedTimeline"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or not interaction["initialFrameStatic"]
            or interaction["initialSelectionCount"] != 0
            or interaction["initialPhase"] != "idle"
            or interaction["initialOwner"] is not None
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 10
            or interaction["selectionCount"] < 6
            or interaction["pointerSelectionCount"] < 4
            or interaction["keyboardSelectionCount"] < 2
            or interaction["focusMoveCount"] < 2
            or interaction["resetCount"] < 2
            or interaction["interruptionCount"] < 1
            or interaction["animatedSelectionCount"] < 6
            or interaction["motionCompletionCount"] < 5
            or interaction["motionControlCount"] != 5
            or interaction["artifactUpdateCount"] != interaction["selectionCount"]
            or interaction["stageSelectionCounts"] != {"discover": 2, "compose": 2, "verify": 2}
            or interaction["stageOrder"] != ["discover", "compose", "verify"]
            or interaction["agentOrder"] != ["scout", "maker", "critic"]
            or interaction["evidenceOrder"] != ["interview-moments", "narrative-v3", "claim-checklist"]
            or interaction["selectedStage"] != "compose"
            or interaction["selectedAgent"] != "maker"
            or interaction["selectedEvidence"] != "narrative-v3"
            or interaction["previousStage"] is not None
            or interaction["lastSelectionTarget"] != "stage-compose"
            or interaction["phase"] != "settled"
            or interaction["handoffActive"]
            or interaction["handoffProgress"] != 1
            or interaction["lastInputTrusted"] is not True
            or interaction["activeCursorTargetError"] is None
            or interaction["activeCursorTargetError"] > 2.5
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real named-agent artifact handoff with interruption, reset, and keyboard ownership: {interaction!r}")
    elif demo["id"] == "scroll-linked-multilayer-starfield":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticProgress"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialStaticVerified"]
            or interaction["seedSignature"] != "far:54|mid:34|near:20"
            or interaction["inputCount"] < 14
            or interaction["wheelInputCount"] < 5
            or interaction["wheelPreventCount"] < 3
            or interaction["boundaryReleaseCount"] < 2
            or interaction["pointerInputCount"] < 5
            or interaction["pointerDragCount"] < 1
            or interaction["pointerMoveCount"] < 5
            or interaction["chapterClickCount"] < 4
            or interaction["keyboardInputCount"] < 4
            or interaction["keyboardAdjustCount"] < 4
            or interaction["progressChangeCount"] < 10
            or interaction["dragActive"]
            or interaction["inputKind"] != "keyboard"
            or interaction["lastTrustedEvent"] != "depth-keyboard"
            or interaction["lastProgressSource"] != "trusted-end"
            or interaction["progress"] != 1
            or interaction["chapterIndex"] != 3
            or interaction["chapterId"] != "near-pass"
            or interaction["layerOffsets"] != {"far": .17, "mid": .48, "near": 1}
            or not interaction["layersSeparatedValidated"]
            or not interaction["canvasSizeValidated"]
            or not interaction["progressValidated"]
            or interaction["starChecksum"] <= 1
            or interaction["drawCount"] <= 0
            or interaction["renderCount"] <= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture real wheel, drag, chapter, keyboard, and boundary-owned observatory depth: {interaction!r}")
    elif demo["id"] == "card-metadata-to-cta-role-swap":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialStaticVerified"]
            or not interaction["baselineValidated"]
            or not interaction["metadataVisibleValidated"]
            or not interaction["ctaVisibleValidated"]
            or interaction["inputCount"] < 11
            or interaction["pointerInputCount"] < 8
            or interaction["keyboardInputCount"] < 3
            or interaction["hoverEnterCount"] < 3
            or interaction["hoverLeaveCount"] < 3
            or interaction["focusInCount"] < 2
            or interaction["focusOutCount"] < 1
            or interaction["keyboardToggleCount"] < 2
            or interaction["escapeResetCount"] < 1
            or interaction["buttonResetCount"] < 1
            or interaction["ctaActivationCount"] < 1
            or interaction["handoffStartCount"] < 8
            or interaction["handoffCompleteCount"] < 5
            or interaction["handoffCancelCount"] < 1
            or not interaction["desiredCtaVisible"]
            or interaction["activeRole"] != "cta"
            or interaction["phase"] != "cta"
            or not interaction["focusWithin"]
            or not interaction["touchPinned"]
            or interaction["animationActive"]
            or interaction["inputKind"] != "keyboard"
            or interaction["lastTrustedEvent"] != "space-toggle"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real shared-baseline metadata/CTA handoff across hover, focus, activation, cancellation, and reset: {interaction!r}")
    elif demo["id"] == "ascii-orchestration-signal-sweep":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputAdapters"] != ["pointer", "touch", "click", "keyboard"]
            or interaction["inputCount"] < 9
            or interaction["pointerInputCount"] < 5
            or interaction["keyboardInputCount"] < 4
            or interaction["pointerMoveCount"] < 5
            or interaction["directionChangeCount"] < 2
            or interaction["transitionCount"] < 3
            or interaction["boundaryInputCount"] < 2
            or interaction["routeNodeCount"] != 7
            or interaction["routeSegmentCount"] != 8
            or interaction["revealedNodeCount"] != 7
            or interaction["revealedNodeIds"] != ["edge", "router", "trace", "policy", "repair", "canary", "prod"]
            or interaction["routeChecksum"] <= 0
            or not interaction["deterministicField"]
            or interaction["randomSourceUsed"]
            or not interaction["p5Instance"]
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["motionActive"]
            or interaction["dragActive"]
            or interaction["direction"] != 1
            or interaction["directionLabel"] != "forward"
            or interaction["phase"] != "complete"
            or interaction["boundary"] != "right"
            or not interaction["complete"]
            or interaction["progress"] < .999
            or interaction["targetProgress"] < .999
            or interaction["activeDirection"] != "idle"
            or interaction["lastInput"] != "pointer:mouse:drag"
            or interaction["initialFrameChecksum"] == 0
            or interaction["visibleCellCount"] < 34 * 17
            or interaction["canvasWidth"] < 64
            or interaction["canvasHeight"] < 64
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real bidirectional ASCII incident route across controls, pointer scrub, keyboard, and boundaries: {interaction!r}")
    elif demo["id"] == "dom-to-3d-scroll-synchronization":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["automaticScrub"]
            or interaction["automaticSectionAdvance"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userOwnedProgress"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or not interaction["initialFrameStatic"]
            or interaction["initialProgress"] != 0
            or interaction["initialPhase"] != "idle"
            or interaction["acceptedInputs"] != ["wheel", "mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 16
            or interaction["wheelInputCount"] < 8
            or interaction["wheelConsumedCount"] < 3
            or interaction["wheelNoChangeCount"] < 5
            or interaction["boundaryReleaseCount"] < 5
            or interaction["startBoundaryReleaseCount"] < 2
            or interaction["endBoundaryReleaseCount"] < 3
            or interaction["pointerInputCount"] < 5
            or interaction["keyboardInputCount"] < 4
            or interaction["dragSessionCount"] < 2
            or interaction["dragUpdateCount"] < 7
            or interaction["sectionSelectionCount"] < 3
            or interaction["keyboardSeekCount"] < 4
            or interaction["progressMutationCount"] < 10
            or interaction["boundaryPolicy"] != "release-outward-wheel-at-0-and-1"
            or interaction["progress"] != 1
            or interaction["progressSource"] != "keyboard"
            or interaction["selectedSection"] != "anchor"
            or interaction["selectedSectionIndex"] != 2
            or interaction["documentProgress"] != 1
            or interaction["artifactProgress"] != 1
            or interaction["thumbProgress"] != 1
            or interaction["controlTimeSpread"] > .00001
            or interaction["registrationErrorPx"] > .01
            or interaction["motionControlCount"] != 3
            or interaction["dragActive"]
            or interaction["phase"] != "inspecting"
            or interaction["lastBoundary"] != "end"
            or interaction["lastWheelDefaultPrevented"]
            or interaction["inputKind"] != "wheel"
            or interaction["lastInputTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture one human-owned DOM, spatial artifact, and scrubber registration signal with released boundaries: {interaction!r}")
    elif demo["id"] == "blurhash-to-photo-progressive-reveal":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__()")
        if interaction["pointerEvents"] < 3 or interaction["pointerOverPhoto"]:
            raise RuntimeError(f"{demo['id']} did not capture a real pointer enter/leave sequence: {interaction!r}")
    elif demo["id"] == "pointer-following-displacement-ripple":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPath"]
            or interaction["inputCount"] < 2
            or interaction["inputKind"] != "mouse"
            or interaction["mode"] != "idle"
        ):
            raise RuntimeError(f"{demo['id']} did not capture two real pointer impulses and recovery: {interaction!r}")
    elif demo["id"] == "four-corner-hover-crop-marks":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["revision"] < 2
            or interaction["input"] != "mouse"
            or interaction["phase"] != "idle"
            or interaction["engaged"]
            or not interaction["assetReady"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real pointer enter/move/leave sequence: {interaction!r}")
    elif demo["id"] == "chromatic-channel-drag-portrait":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["inputCount"] < 10
            or interaction["inputKind"] != "mouse"
            or interaction["inputMode"] != "idle"
            or interaction["activePointerId"] is not None
            or interaction["maxObservedShift"] < 17
            or abs(interaction["shift"]) > .15
            or not interaction["ready"]
            or not interaction["channelIntegrity"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real bidirectional drag and spring recovery: {interaction!r}")
    elif demo["id"] == "hover-rehearsed-video-style-rail":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["revision"] < 6
            or interaction["commits"] < 1
            or interaction["committedIndex"] != 4
            or interaction["committedLook"] != "noir"
            or interaction["previewIndex"] is not None
            or interaction["effectiveIndex"] != 4
            or interaction["phase"] != "committed"
            or interaction["input"] != "mouse"
            or not interaction["mediaReady"]
            or interaction["playing"]
            or interaction["mediaTime"] != 0
        ):
            raise RuntimeError(f"{demo['id']} did not preserve rehearsal/rewind/commit state boundaries: {interaction!r}")
    elif demo["id"] == "depth-layer-blur-dissolve":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPath"]
            or interaction["inputCount"] < 20
            or interaction["inputKind"] != "mouse"
            or interaction["mode"] != "idle"
            or interaction["pointerCaptured"]
            or interaction["depthMapVisible"]
            or interaction["progress"] > .01
            or interaction["targetProgress"] > .01
            or not interaction["sourcesReady"]
            or not interaction["maskReady"]
            or min(interaction["bandCoverage"]) <= .05
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real A-to-B-to-A ordinal-depth drag: {interaction!r}")
    elif demo["id"] == "pointer-driven-multilayer-depth-stage":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPath"]
            or interaction["inputCount"] < 15
            or interaction["inputKind"] != "mouse"
            or interaction["mode"] != "idle"
            or interaction["engaged"]
            or interaction["pointerCaptured"]
            or abs(interaction["x"] - .5) > .001
            or abs(interaction["y"] - .5) > .001
        ):
            raise RuntimeError(f"{demo['id']} did not capture real hover, drag, release, and centered recovery: {interaction!r}")
    elif demo["id"] == "track-card-play-state-handoff":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticHandoff"]
            or interaction["inputCount"] < 4
            or interaction["inputKind"] != "mouse"
            or interaction["selected"] != 2
            or interaction["playing"]
            or interaction["mode"] != "paused"
            or not interaction["coversReady"]
            or min(interaction["progress"]) <= 0
            or interaction["completedTracks"] != 0
        ):
            raise RuntimeError(f"{demo['id']} did not preserve three user-driven play-state handoffs and final pause: {interaction!r}")
    elif demo["id"] == "gesture-sliced-image-shutters":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.mode === 'idle' && !window.__PREVIEW_INTERACTION_STATE__.springActive",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["inputCount"] < 14
            or interaction["inputKind"] != "mouse"
            or interaction["releaseCount"] < 2
            or interaction["mode"] != "idle"
            or abs(interaction["open"]) > .001
            or interaction["pointerCaptured"]
            or interaction["keyboardActive"]
            or interaction["springActive"]
            or not interaction["imageReady"]
            or interaction["sourceCount"] != 1
            or not interaction["initialRegistration"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture two real signed drags and exact shared-image registration: {interaction!r}")
    elif demo["id"] == "duration-aware-hero-film-handoff":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or not interaction["mediaDriven"]
            or interaction["inputCount"] < 3
            or interaction["inputKind"] != "mouse"
            or interaction["selectionCount"] < 1
            or interaction["playbackToggleCount"] < 2
            or interaction["playIntent"]
            or interaction["playing"]
            or interaction["phase"] != "paused"
            or interaction["activeIndex"] != 3
            or interaction["incomingIndex"] is not None
            or interaction["handoffCount"] < 2
            or interaction["lastHandoffTo"] != 3
            or not interaction["preloadRequested"][1]
            or interaction["metadataReadyCount"] != 4
            or len(set(round(value, 2) for value in interaction["measuredDurations"])) < 3
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real duration handoff, manual scene handoff, and user pause: {interaction!r}")
    elif demo["id"] == "blurred-autoplay-video-ambience":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["mediaDriven"]
            or interaction["inputCount"] < 5
            or interaction["playToggleCount"] < 2
            or interaction["seekCount"] < 1
            or interaction["realSeekCount"] < 1
            or interaction["ambientToggleCount"] < 2
            or not interaction["ambientEnabled"]
            or not interaction["userInitiated"]
            or not interaction["userInitiatedPlayback"]
            or interaction["playOrigin"] != "user"
            or not interaction["playing"]
            or interaction["paused"]
            or interaction["lastSeekDelta"] != 1
            or not interaction["metadataReady"]
            or not interaction["canPlayReady"]
            or not interaction["firstFrameReady"]
            or interaction["ambientDrawCount"] < 2
            or interaction["lastDrawSource"] != "sharp-film-video"
        ):
            raise RuntimeError(f"{demo['id']} did not capture real playback, seek, and same-source ambience controls: {interaction!r}")
    elif demo["id"] == "perspective-tilt-and-glare":
        interaction = page.evaluate("window.__TILT_GLARE_STATE__")
        if (
            not interaction["ready"]
            or not interaction["imageDecoded"]
            or not interaction["libraryInstance"]
            or interaction["automaticPointerDispatches"] != 0
            or interaction["mouseMoves"] < 8
            or interaction["keyboardSteps"] < 3
            or interaction["inputMode"] != "idle"
            or interaction["activePointerId"] is not None
            or abs(interaction["point"]["x"] - .5) > .001
            or abs(interaction["point"]["y"] - .5) > .001
            or interaction["imageWidth"] != 1280
            or interaction["imageHeight"] != 800
            or interaction["layout"]["cardWidth"] <= 0
            or interaction["layout"]["cardHeight"] <= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture real pointer, keyboard, and centered-reset tilt states: {interaction!r}")
    elif demo["id"] == "delayed-dropdown-promo-sweep":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        counts = interaction["counts"]
        if (
            interaction["automaticFallback"]
            or not interaction["assetReady"]
            or not interaction["initialClosedVerified"]
            or not interaction["open"]
            or interaction["phase"] != "open"
            or interaction["sweep"] != "complete"
            or interaction["delayPending"]
            or counts["automaticOpen"] != 0
            or counts["input"] < 5
            or counts["toggle"] < 3
            or counts["open"] < 3
            or counts["close"] < 2
            or counts["escape"] < 1
            or counts["outside"] < 1
            or counts["delayScheduled"] < 3
            or counts["delayCancelled"] < 1
            or counts["sweepStarted"] < 2
            or counts["sweepCompleted"] < 2
        ):
            raise RuntimeError(f"{demo['id']} did not capture completed, cancelled, and restarted disclosure sweeps: {interaction!r}")
    elif demo["id"] == "inertial-vertical-capability-rail":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.phase === 'idle' && !window.__PREVIEW_INTERACTION_STATE__.motionActive",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticDrift"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputCount"] < 4
            or interaction["inputKind"] != "keyboard"
            or interaction["dragMoveCount"] < 5
            or interaction["releaseCount"] < 2
            or interaction["keyboardCount"] < 2
            or interaction["inertiaCount"] < 1
            or interaction["phase"] != "idle"
            or interaction["motionActive"]
            or interaction["pointerCaptured"]
            or interaction["activeIndex"] != 0
            or interaction["selectedIndex"] != 0
            or abs(interaction["offset"]) > 5
            or abs(interaction["velocity"]) > .01
            or interaction["minOffset"] >= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture real throw inertia and exact keyboard boundary returns: {interaction!r}")
    elif demo["id"] == "scroll-scrubbed-document-generation-playback":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.phase === 'idle' && !window.__PREVIEW_INTERACTION_STATE__.motionActive",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputCount"] < 9
            or interaction["wheelCount"] < 5
            or interaction["keyboardCount"] < 3
            or interaction["chapterClickCount"] < 1
            or interaction["boundaryReleaseCount"] < 1
            or interaction["phase"] != "idle"
            or interaction["motionActive"]
            or interaction["sectionIndex"] != 4
            or interaction["progress"] < .999
            or interaction["cursorLine"] < 2
            or "release-at-bounds" not in interaction["wheelPolicy"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture real reversible document scrubbing and boundary release: {interaction!r}")
    elif demo["id"] == "visibility-gated-agent-terminal-replay":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.phase === 'paused' && !window.__PREVIEW_INTERACTION_STATE__.motionActive",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or not interaction["intersectionKnown"]
            or interaction["intersectionEventCount"] < 1
            or not interaction["pageVisible"]
            or not interaction["intersectionVisible"]
            or interaction["visibilityGateReason"] != "none"
            or interaction["inputCount"] < 6
            or interaction["playToggleCount"] < 3
            or interaction["restartCount"] < 1
            or interaction["scrubCount"] < 3
            or interaction["phase"] != "paused"
            or interaction["playIntent"]
            or interaction["canAdvance"]
            or interaction["motionActive"]
            or interaction["progress"] <= 0
            or interaction["progress"] >= .3
            or interaction["eventIndex"] > 2
        ):
            raise RuntimeError(f"{demo['id']} did not capture operator-owned visible playback, scrub, and restart: {interaction!r}")
    elif demo["id"] == "synchronized-scenario-scene-handoff":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.phase === 'idle'",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        expected_layers = {
            "background": "identity-anomaly-radar",
            "summary": "mfa-reset-payout-change",
            "route": "account-integrity-p0",
            "action": "freeze-verify-owner",
            "perspective": "risk-timeline",
        }
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputCount"] < 6
            or interaction["clickCount"] < 2
            or interaction["keyboardCount"] < 2
            or interaction["switchCount"] < 4
            or interaction["animatedTransitionCount"] < 4
            or interaction["primaryActionCount"] < 2
            or interaction["lastAction"] != "open-cutover-plan"
            or interaction["phase"] != "idle"
            or interaction["activeIndex"] != 1
            or interaction["displayedIndex"] != 1
            or interaction["synchronizedLayers"] != expected_layers
        ):
            raise RuntimeError(f"{demo['id']} did not capture real five-layer scenario and action handoffs: {interaction!r}")
    elif demo["id"] == "filterable-grid-reflow":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.layoutComplete && !window.__PREVIEW_INTERACTION_STATE__.arrangePending",
            timeout=2_000,
        )
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFiltering"]
            or interaction["automaticSorting"]
            or interaction["syntheticInput"]
            or interaction["automaticFallback"]
            or not interaction["imagesReady"]
            or not interaction["assetSourceValid"]
            or not interaction["initialStaticVerified"]
            or interaction["sourceCount"] != 6
            or interaction["totalCount"] != 6
            or interaction["inputCount"] < 5
            or interaction["inputKind"] != "keyboard"
            or interaction["filterChangeCount"] < 3
            or interaction["sortChangeCount"] < 2
            or interaction["arrangeCount"] < 5
            or not interaction["layoutComplete"]
            or interaction["arrangePending"]
            or interaction["filter"] != "all"
            or interaction["sort"] != "curated"
            or interaction["visibleCount"] != 6
        ):
            raise RuntimeError(f"{demo['id']} did not capture real Isotope filtering, sorting, and gap closure: {interaction!r}")
    elif demo["id"] == "device-silhouette-masked-video":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["automaticDeviceSwitch"]
            or interaction["syntheticInputDispatch"]
            or not interaction["mediaDriven"]
            or interaction["sourceKind"] != "local-video"
            or not interaction["sourceConsistency"]["singleVideoElement"]
            or not interaction["sourceConsistency"]["sameSourceAcrossDevices"]
            or interaction["sourceConsistency"]["canvasDrawSourceId"] != "source-video"
            or not interaction["metadataReady"]
            or not interaction["firstFrameReady"]
            or not interaction["canPlayReady"]
            or interaction["videoWidth"] != 1280
            or interaction["videoHeight"] != 720
            or abs(interaction["duration"] - 5.8) > .05
            or not interaction["initiallyPaused"]
            or interaction["autoplayAttempted"]
            or not interaction["userInitiated"]
            or not interaction["userInitiatedPlayback"]
            or interaction["inputCount"] < 7
            or interaction["deviceSwitchCount"] < 5
            or interaction["clickSwitchCount"] < 2
            or interaction["keyboardSwitchCount"] < 2
            or interaction["dragSwitchCount"] < 1
            or interaction["playToggleCount"] < 2
            or interaction["playCount"] < 1
            or interaction["pauseCount"] < 1
            or interaction["frameDrawCount"] < 2
            or interaction["currentTime"] < 1
            or interaction["selectedDevice"] != "desktop"
            or interaction["currentMask"] != "desktop-alpha-mask"
            or interaction["mediaObjectFit"] != "cover"
            or interaction["isPlaying"]
            or not interaction["paused"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture real same-source film playback and three device masks: {interaction!r}")

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
