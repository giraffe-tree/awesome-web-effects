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
        elif demo["id"] == "clip-path-menu-curtain":
            if index == 2:
                page.locator('#menu-toggle').click()
            elif index == 4:
                page.wait_for_timeout(900)
            elif index == 7:
                page.locator('#menu-toggle').focus()
                page.keyboard.press("Tab")
            elif index == 9:
                page.keyboard.press("Tab")
            elif index == 11:
                page.keyboard.press("Enter")
            elif index == 12:
                page.wait_for_timeout(900)
            elif index == 15:
                page.locator('#menu-toggle').click()
            elif index == 16:
                page.wait_for_timeout(900)
            elif index == 19:
                page.keyboard.press("Shift+Tab")
            elif index == 21:
                page.keyboard.press("Escape")
            elif index == 22:
                page.wait_for_timeout(900)
            elif index == 25:
                page.locator('#menu-toggle').click()
            elif index == 26:
                page.wait_for_timeout(900)
            elif index == 29:
                page.locator('.menu-link[data-section="artists"]').click()
            elif index == 30:
                page.wait_for_timeout(900)
            elif index == 33:
                page.locator('#menu-toggle').click()
            elif index == 34:
                page.wait_for_timeout(900)
        elif demo["id"] == "playable-brand-minesweeper-footer":
            if index == 2:
                page.locator('.mine-cell[data-index="0"]').click()
            elif index == 3:
                page.wait_for_timeout(360)
            elif index == 6:
                page.locator('.mine-cell[data-index="5"]').click(button="right")
            elif index == 7:
                page.wait_for_timeout(280)
            elif index == 9:
                page.locator('#flag-mode').click()
            elif index == 11:
                page.locator('.mine-cell[data-index="13"]').click()
            elif index == 12:
                page.wait_for_timeout(280)
            elif index == 14:
                page.locator('#flag-mode').click()
            elif index == 16:
                page.locator('.mine-cell[data-index="7"]').click()
            elif index == 17:
                page.wait_for_timeout(520)
            elif index == 20:
                page.locator('#mine-reset').click()
            elif index == 21:
                page.wait_for_timeout(320)
            elif index == 23:
                page.locator('.mine-cell[data-index="18"]').click()
            elif index == 24:
                page.wait_for_timeout(520)
            elif index == 27:
                page.locator('#mine-reset').click()
            elif index == 28:
                page.locator('.mine-cell[data-index="0"]').focus()
                page.keyboard.press("ArrowRight")
            elif index == 29:
                page.keyboard.press("f")
            elif index == 30:
                page.keyboard.press("f")
            elif index == 31:
                page.keyboard.press("Enter")
            elif index == 32:
                page.wait_for_timeout(360)
            elif index == 34:
                page.keyboard.press("Escape")
            elif index == 35:
                page.wait_for_timeout(320)
        elif demo["id"] == "noise-cancellation-audio-comparison":
            if index == 2:
                page.locator('#audio-play').click()
            elif index == 4:
                page.locator('.mix-preset[data-mix="0"]').click()
            elif index == 7:
                box = page.locator('#compare-surface').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .82, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 9:
                box = page.locator('#compare-surface').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .35, box["y"] + box["height"] * .5, steps=5)
                page.mouse.up()
            elif index == 12:
                page.locator('.mix-preset[data-mix="1"]').click()
            elif index == 15:
                page.locator('#audio-play').click()
            elif index == 18:
                page.locator('#compare-surface').focus()
                page.keyboard.press("Home")
            elif index == 20:
                page.keyboard.press("End")
            elif index == 22:
                page.keyboard.press("ArrowRight")
            elif index == 25:
                page.locator('.mix-preset[data-mix="0.5"]').click()
            elif index == 28:
                page.locator('#audio-play').click()
            elif index == 31:
                page.locator('#compare-surface').focus()
                page.keyboard.press("PageDown")
            elif index == 34:
                page.locator('#audio-play').click()
        elif demo["id"] == "audio-equalizer-typography":
            if index == 2:
                page.locator('#tone-button').click()
            elif index == 5:
                box = page.locator('#type-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .18, box["y"] + box["height"] * .54)
                page.mouse.down()
            elif index == 7:
                box = page.locator('#type-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .55, box["y"] + box["height"] * .54, steps=5)
                page.mouse.up()
            elif index == 10:
                page.locator('#type-stage').focus()
                page.keyboard.press("Home")
            elif index == 12:
                page.keyboard.press("ArrowRight")
            elif index == 14:
                page.keyboard.press("End")
            elif index == 17:
                page.locator('#tone-button').click()
            elif index == 20:
                box = page.locator('#type-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .25, box["y"] + box["height"] * .54)
                page.mouse.down()
            elif index == 22:
                box = page.locator('#type-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .75, box["y"] + box["height"] * .54, steps=5)
                page.mouse.up()
            elif index == 24:
                page.locator('#type-stage').focus()
                page.keyboard.press("Space")
            elif index == 27:
                page.keyboard.press("ArrowLeft")
            elif index == 30:
                page.locator('#tone-button').click()
            elif index == 32:
                page.locator('#type-stage').focus()
                page.keyboard.press("Enter")
            elif index == 34:
                page.keyboard.press("Escape")
        elif demo["id"] == "animated-hand-drawn-semantic-annotation":
            if index == 2:
                page.locator('#phrase-attention').click()
            elif index == 3:
                page.wait_for_timeout(650)
            elif index == 6:
                page.locator('#phrase-questions').click()
            elif index == 7:
                page.wait_for_timeout(120)
            elif index == 8:
                page.locator('#phrase-trace').click()
            elif index == 9:
                page.wait_for_timeout(650)
            elif index == 12:
                page.locator('#replay-button').click()
            elif index == 13:
                page.wait_for_timeout(650)
            elif index == 16:
                page.locator('#phrase-trace').click()
            elif index == 17:
                page.wait_for_timeout(650)
            elif index == 20:
                page.locator('#phrase-trace').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 21:
                page.wait_for_timeout(650)
            elif index == 24:
                page.keyboard.press("r")
            elif index == 25:
                page.wait_for_timeout(650)
            elif index == 28:
                page.locator('#reset-button').click()
            elif index == 30:
                page.locator('#phrase-attention').focus()
                page.keyboard.press("Enter")
            elif index == 31:
                page.wait_for_timeout(650)
            elif index == 33:
                page.keyboard.press("Escape")
        elif demo["id"] == "mechanical-split-flap-character-change":
            if index == 2:
                page.locator('#advance-button').click()
            elif index == 3:
                page.wait_for_timeout(900)
            elif index == 6:
                page.locator('#flap-board').click()
            elif index == 7:
                page.wait_for_timeout(900)
            elif index == 10:
                page.locator('#flap-board').focus()
                page.keyboard.press("ArrowRight")
            elif index == 11:
                page.wait_for_timeout(900)
            elif index == 14:
                page.locator('#advance-button').click()
            elif index == 15:
                page.wait_for_timeout(150)
            elif index == 16:
                page.locator('#flap-board').click()
            elif index == 17:
                page.wait_for_timeout(900)
            elif index == 20:
                page.locator('#flap-board').focus()
                page.keyboard.press("ArrowDown")
            elif index == 21:
                page.wait_for_timeout(900)
            elif index == 24:
                page.keyboard.press("Enter")
            elif index == 25:
                page.wait_for_timeout(900)
            elif index == 28:
                page.locator('#reset-button').click()
            elif index == 31:
                page.locator('#flap-board').focus()
                page.keyboard.press("N")
            elif index == 32:
                page.wait_for_timeout(900)
            elif index == 34:
                page.keyboard.press("Home")
        elif demo["id"] == "interactive-vector-state-machine":
            if index == 2:
                page.locator('#talk-button').hover()
                page.mouse.down()
            elif index == 4:
                page.mouse.up()
            elif index == 5:
                page.wait_for_timeout(120)
            elif index == 6:
                page.locator('#confirm-button').click()
            elif index == 8:
                page.wait_for_timeout(520)
            elif index == 10:
                page.locator('#talk-button').hover()
                page.mouse.down()
            elif index == 11:
                page.wait_for_timeout(90)
                page.mouse.up()
            elif index == 12:
                page.locator('#reset-button').click()
            elif index == 14:
                page.wait_for_timeout(420)
            elif index == 16:
                page.locator('#talk-button').focus()
                page.keyboard.down("Enter")
            elif index == 18:
                page.keyboard.up("Enter")
            elif index == 20:
                page.locator('#confirm-button').click()
            elif index == 22:
                page.wait_for_timeout(520)
            elif index == 25:
                page.locator('#talk-button').focus()
                page.keyboard.down("Space")
            elif index == 27:
                page.keyboard.up("Space")
            elif index == 29:
                page.keyboard.press("Escape")
            elif index == 31:
                page.wait_for_timeout(520)
        elif demo["id"] == "pointer-rotated-dot-matrix-globe":
            if index == 2:
                page.locator('#focus-button').click()
            elif index == 5:
                page.locator('#globe-host').focus()
                page.keyboard.press("ArrowRight")
            elif index == 7:
                page.keyboard.press("ArrowDown")
            elif index == 9:
                page.keyboard.press("Enter")
            elif index == 12:
                box = page.locator('#globe-host').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .70, box["y"] + box["height"] * .50)
                page.mouse.down()
            elif index == 14:
                box = page.locator('#globe-host').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .47, box["y"] + box["height"] * .62, steps=6)
                page.mouse.up()
            elif index == 16:
                page.locator('#focus-button').click()
            elif index == 19:
                page.locator('#reset-button').click()
            elif index == 22:
                page.locator('#globe-host').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 24:
                page.keyboard.press("ArrowUp")
            elif index == 26:
                page.keyboard.press("Space")
            elif index == 29:
                box = page.locator('#globe-host').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .45, box["y"] + box["height"] * .55)
                page.mouse.down()
            elif index == 31:
                box = page.locator('#globe-host').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .68, box["y"] + box["height"] * .42, steps=5)
                page.mouse.up()
            elif index == 33:
                page.locator('#globe-host').focus()
                page.keyboard.press("Home")
        elif demo["id"] == "scene-wipe-progressive-page-swap":
            if index == 2:
                page.locator('#scene-toggle').click()
            elif index == 3:
                page.wait_for_timeout(120)
            elif index == 4:
                page.locator('#scene-toggle').click()
                page.locator('#scene-toggle').click()
            elif index == 5:
                page.wait_for_timeout(100)
            elif index == 7:
                page.wait_for_timeout(1000)
            elif index == 10:
                page.locator('#wipe-stage').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 11:
                page.wait_for_timeout(1000)
            elif index == 14:
                page.keyboard.press("ArrowRight")
            elif index == 15:
                page.wait_for_timeout(120)
            elif index == 16:
                page.keyboard.press("ArrowLeft")
                page.keyboard.press("ArrowRight")
            elif index == 17:
                page.wait_for_timeout(120)
            elif index == 19:
                page.wait_for_timeout(1000)
            elif index == 23:
                page.locator('#scene-toggle').click()
            elif index == 24:
                page.wait_for_timeout(1000)
            elif index == 27:
                page.locator('#wipe-stage').focus()
                page.keyboard.press("ArrowRight")
            elif index == 28:
                page.wait_for_timeout(1000)
            elif index == 31:
                page.locator('#scene-toggle').click()
            elif index == 32:
                page.wait_for_timeout(1000)
        elif demo["id"] == "draggable-packed-editorial-wall":
            if index == 2:
                box = page.locator('.story-tile[data-tile-id="night-market"]').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .5, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 4:
                box = page.locator('#packing-field').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .88, box["y"] + box["height"] * .5, steps=6)
                page.mouse.up()
            elif index == 6:
                page.wait_for_timeout(500)
            elif index == 8:
                page.locator('#repack-button').click()
            elif index == 9:
                page.wait_for_timeout(500)
            elif index == 11:
                page.locator('.story-tile[data-tile-id="neon-memory"]').focus()
                page.keyboard.press("ArrowRight")
            elif index == 12:
                page.wait_for_timeout(500)
            elif index == 14:
                page.keyboard.press("ArrowDown")
            elif index == 15:
                page.wait_for_timeout(500)
            elif index == 17:
                page.keyboard.press("Enter")
            elif index == 18:
                page.wait_for_timeout(500)
            elif index == 20:
                page.locator('#repack-button').click()
            elif index == 21:
                page.wait_for_timeout(500)
            elif index == 23:
                box = page.locator('.story-tile[data-tile-id="field-notes"]').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .5, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 24:
                page.mouse.move(box["x"] + box["width"] * .53, box["y"] + box["height"] * .52, steps=3)
                page.mouse.up()
            elif index == 25:
                page.wait_for_timeout(500)
            elif index == 27:
                page.locator('.story-tile[data-tile-id="maker"]').focus()
                page.keyboard.press("Space")
            elif index == 28:
                page.wait_for_timeout(500)
            elif index == 30:
                page.locator('#reset-button').click()
            elif index == 31:
                page.wait_for_timeout(500)
            elif index == 33:
                page.locator('.story-tile[data-tile-id="route-credits"]').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 34:
                page.keyboard.press("Escape")
            elif index == 35:
                page.wait_for_timeout(500)
        elif demo["id"] == "velocity-aware-swipe-drawer":
            if index == 2:
                handle_box = page.locator('#drawer-handle').bounding_box()
                slow_x = handle_box["x"] + handle_box["width"] * .5
                slow_y = handle_box["y"] + handle_box["height"] * .5
                page.mouse.move(slow_x, slow_y)
                page.mouse.down()
            elif index == 3:
                page.mouse.move(slow_x, slow_y - 17)
                page.wait_for_timeout(95)
            elif index == 4:
                page.mouse.move(slow_x, slow_y - 34)
                page.wait_for_timeout(95)
            elif index == 5:
                page.mouse.move(slow_x, slow_y - 50)
                page.wait_for_timeout(95)
            elif index == 6:
                page.mouse.up()
            elif index == 7:
                page.wait_for_timeout(520)
            elif index == 10:
                page.locator('#drawer-handle').focus()
                page.keyboard.press("End")
            elif index == 11:
                page.wait_for_timeout(520)
            elif index == 13:
                page.locator('#start-route').click()
            elif index == 14:
                page.wait_for_timeout(520)
            elif index == 17:
                handle_box = page.locator('#drawer-handle').bounding_box()
                fast_x = handle_box["x"] + handle_box["width"] * .5
                fast_y = handle_box["y"] + handle_box["height"] * .5
                page.mouse.move(fast_x, fast_y)
                page.mouse.down()
            elif index == 18:
                page.mouse.move(fast_x, 177)
                page.mouse.up()
            elif index == 19:
                page.wait_for_timeout(520)
            elif index == 21:
                page.locator('#details-toggle').click()
            elif index == 22:
                page.wait_for_timeout(520)
            elif index == 24:
                page.locator('#drawer-handle').focus()
                page.keyboard.press("ArrowRight")
            elif index == 25:
                page.wait_for_timeout(520)
            elif index == 28:
                handle_box = page.locator('#drawer-handle').bounding_box()
                fast_x = handle_box["x"] + handle_box["width"] * .5
                fast_y = handle_box["y"] + handle_box["height"] * .5
                page.mouse.move(fast_x, fast_y)
                page.mouse.down()
            elif index == 29:
                page.mouse.move(fast_x, 3)
                page.mouse.up()
            elif index == 30:
                page.wait_for_timeout(520)
            elif index == 32:
                page.locator('#drawer-handle').focus()
                page.keyboard.press("Home")
            elif index == 33:
                page.wait_for_timeout(520)
        elif demo["id"] == "spatial-slide-deck-navigation":
            if index == 2:
                page.locator('.control-button[data-direction="right"]').click()
            elif index == 3:
                page.wait_for_timeout(520)
            elif index == 5:
                page.locator('.control-button[data-direction="down"]').click()
            elif index == 6:
                page.wait_for_timeout(520)
            elif index == 8:
                page.locator('#spatial-stage').focus()
                page.keyboard.press("ArrowDown")
            elif index == 9:
                page.wait_for_timeout(520)
            elif index == 11:
                page.keyboard.press("ArrowUp")
            elif index == 12:
                page.keyboard.press("ArrowUp")
            elif index == 13:
                page.wait_for_timeout(520)
            elif index == 15:
                page.keyboard.press("o")
            elif index == 16:
                page.wait_for_timeout(520)
            elif index == 18:
                page.locator('.slide[data-slide-id="proposal"]').click()
            elif index == 19:
                page.wait_for_timeout(520)
            elif index == 21:
                page.locator('.map-node[data-slide-id="access"]').click()
            elif index == 22:
                page.wait_for_timeout(520)
            elif index == 24:
                box = page.locator('#spatial-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .55, box["y"] + box["height"] * .42)
                page.mouse.down()
            elif index == 25:
                page.mouse.move(box["x"] + box["width"] * .55, box["y"] + box["height"] * .78, steps=5)
                page.mouse.up()
            elif index == 26:
                page.wait_for_timeout(520)
            elif index == 28:
                page.locator('#spatial-stage').focus()
                page.keyboard.press("ArrowUp")
            elif index == 29:
                page.keyboard.press("ArrowRight")
            elif index == 30:
                page.keyboard.press("ArrowRight")
            elif index == 31:
                page.wait_for_timeout(520)
            elif index == 33:
                page.keyboard.press("o")
            elif index == 34:
                page.wait_for_timeout(520)
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
            if index == 2:
                page.locator('.sample-control[data-sample="facade"]').click()
            elif index == 3:
                page.wait_for_timeout(260)
            elif index == 5:
                page.mouse.move(210, 110)
            elif index == 6:
                page.wait_for_timeout(260)
            elif index == 8:
                page.mouse.move(270, 78)
            elif index == 10:
                page.wait_for_timeout(1750)
            elif index == 12:
                page.mouse.move(120, 135)
                page.mouse.down()
            elif index == 13:
                page.mouse.move(250, 60, steps=4)
            elif index == 14:
                page.mouse.up()
            elif index == 16:
                page.locator('#ripple-canvas').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 17:
                page.keyboard.press("ArrowUp")
            elif index == 18:
                page.wait_for_timeout(260)
            elif index == 20:
                page.keyboard.press("p")
            elif index == 21:
                page.wait_for_timeout(320)
            elif index == 23:
                page.locator('.sample-control[data-sample="horizon"]').click()
            elif index == 24:
                page.wait_for_timeout(320)
            elif index == 26:
                page.locator('#ripple-canvas').focus()
                page.keyboard.press("Enter")
            elif index == 27:
                page.wait_for_timeout(320)
            elif index == 29:
                page.locator('.sample-control[data-sample="reset"]').click()
            elif index == 30:
                page.wait_for_timeout(320)
            elif index == 32:
                page.locator('.sample-control[data-sample="pool"]').click()
            elif index == 33:
                page.wait_for_timeout(420)
            elif index == 34:
                page.locator('.sample-control[data-sample="reset"]').click()
            elif index == 35:
                page.wait_for_timeout(320)
        elif demo["id"] == "draggable-rigid-body-poster-pile":
            if index == 2:
                page.locator('#next-poster').click()
            elif index == 4:
                page.locator('#place-poster').click()
            elif index == 6:
                page.locator('#reset-posters').click()
            elif index == 8:
                page.locator('#poster-canvas').focus()
                page.keyboard.press("3")
            elif index == 9:
                page.keyboard.press("ArrowLeft")
            elif index == 10:
                page.keyboard.press("Shift+ArrowLeft")
            elif index == 11:
                page.keyboard.press("Enter")
            elif index == 13:
                page.locator('#reset-posters').click()
            elif index == 15:
                page.mouse.move(235, 105)
                page.mouse.down()
            elif index == 16:
                page.mouse.move(210, 100, steps=2)
            elif index == 17:
                page.mouse.move(174, 94, steps=2)
            elif index == 18:
                page.mouse.move(132, 88, steps=2)
            elif index == 19:
                page.mouse.move(98, 82, steps=2)
            elif index == 20:
                page.mouse.up()
            elif index == 22:
                page.wait_for_timeout(260)
            elif index == 25:
                page.wait_for_timeout(420)
            elif index == 28:
                page.wait_for_timeout(520)
            elif index == 30:
                page.locator('#previous-poster').click()
            elif index == 32:
                page.locator('#place-poster').click()
            elif index == 35:
                page.wait_for_timeout(260)
        elif demo["id"] == "point-constructed-generative-corolla":
            if index == 2:
                page.mouse.move(286, 92)
            elif index == 4:
                page.mouse.move(246, 66, steps=4)
            elif index == 6:
                page.mouse.move(214, 142)
                page.mouse.down()
            elif index == 7:
                page.mouse.move(262, 112, steps=3)
            elif index == 9:
                page.mouse.move(304, 72, steps=3)
            elif index == 10:
                page.mouse.up()
            elif index == 12:
                page.locator('#density-up').click()
            elif index == 14:
                page.locator('#tension-up').click()
            elif index == 16:
                page.locator('#lock-button').click()
            elif index == 18:
                page.locator('#lock-button').click()
            elif index == 20:
                page.locator('#corolla-host').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 21:
                page.keyboard.press("ArrowUp")
            elif index == 22:
                page.keyboard.press("]")
            elif index == 23:
                page.keyboard.press("=")
            elif index == 25:
                page.keyboard.press("Enter")
            elif index == 28:
                page.locator('#lock-button').click()
            elif index == 30:
                page.locator('#reset-button').click()
            elif index == 32:
                page.mouse.move(190, 82)
            elif index == 33:
                page.locator('#density-down').click()
            elif index == 35:
                page.locator('#lock-button').click()
        elif demo["id"] == "pointer-injected-gpu-fluid":
            if index == 2:
                page.mouse.move(92, 132)
                page.mouse.down()
            elif index == 3:
                page.mouse.move(122, 116, steps=2)
            elif index == 4:
                page.mouse.move(152, 98, steps=2)
            elif index == 5:
                page.mouse.move(180, 82, steps=2)
            elif index == 6:
                page.mouse.move(204, 70, steps=2)
            elif index == 7:
                page.mouse.up()
            elif index == 9:
                page.wait_for_timeout(260)
            elif index == 10:
                page.locator('.gel[data-gel="magenta"]').click()
            elif index == 11:
                page.mouse.move(236, 126)
                page.mouse.down()
            elif index == 12:
                page.mouse.move(212, 108, steps=2)
            elif index == 13:
                page.mouse.move(184, 92, steps=2)
            elif index == 14:
                page.mouse.move(154, 76, steps=2)
            elif index == 15:
                page.mouse.move(126, 62, steps=2)
            elif index == 16:
                page.mouse.up()
            elif index == 18:
                page.locator('#pause-control').click()
            elif index == 20:
                page.locator('#pause-control').click()
            elif index == 22:
                page.locator('#fluid-canvas').focus()
                page.keyboard.press("ArrowRight")
            elif index == 23:
                page.keyboard.press("ArrowUp")
            elif index == 24:
                page.keyboard.press("3")
            elif index == 25:
                page.keyboard.press("Space")
            elif index == 27:
                page.locator('#save-control').click()
            elif index == 29:
                page.wait_for_timeout(260)
            elif index == 31:
                page.locator('#clear-control').click()
            elif index == 35:
                page.wait_for_timeout(320)
        elif demo["id"] == "emergent-particle-life-colonies":
            if index == 2:
                page.locator('#reset-life').click()
            elif index == 3:
                page.locator('.rule-control[data-rule="cycle"]').click()
            elif index == 4:
                page.locator('.species-control[data-species="1"]').click()
            elif index == 5:
                page.locator('#life-stage').focus()
                page.keyboard.press("1")
            elif index == 7:
                page.mouse.move(164, 94)
                page.mouse.down()
            elif index == 8:
                page.mouse.move(191, 78, steps=3)
            elif index == 9:
                page.mouse.move(220, 104, steps=3)
            elif index == 10:
                page.mouse.up()
            elif index == 12:
                page.locator('#run-toggle').click()
            elif index == 13:
                page.wait_for_timeout(820)
            elif index == 17:
                page.locator('#life-stage').focus()
                page.keyboard.press("q")
            elif index == 18:
                page.keyboard.press("ArrowRight")
            elif index == 19:
                page.keyboard.press(".")
            elif index == 21:
                page.keyboard.press("r")
            elif index == 23:
                page.locator('.rule-control[data-rule="cycle"]').click()
            elif index == 25:
                page.mouse.move(188, 92)
                page.mouse.down()
            elif index == 26:
                page.mouse.move(229, 104, steps=4)
            elif index == 27:
                page.mouse.up()
            elif index == 28:
                page.locator('#run-toggle').click()
            elif index == 30:
                page.wait_for_timeout(1200)
            elif index == 35:
                page.wait_for_timeout(260)
        elif demo["id"] == "sticky-card-stack-accumulation":
            if index == 2:
                page.mouse.wheel(0, -160)
            elif index == 4:
                page.mouse.wheel(0, 180)
            elif index == 5:
                page.mouse.wheel(0, 220)
            elif index == 7:
                page.locator('.chapter-control[data-progress="0.333333"]').click()
            elif index == 9:
                page.mouse.move(230, 142)
                page.mouse.down()
            elif index == 10:
                page.mouse.move(230, 112, steps=3)
            elif index == 11:
                page.mouse.move(230, 72, steps=3)
            elif index == 12:
                page.mouse.up()
            elif index == 14:
                page.locator('#case-shell').focus()
                page.keyboard.press("PageDown")
            elif index == 16:
                page.locator('.chapter-control[data-progress="1"]').click()
            elif index == 18:
                page.mouse.wheel(0, 220)
            elif index == 20:
                page.mouse.wheel(0, -220)
            elif index == 22:
                page.mouse.move(230, 66)
                page.mouse.down()
            elif index == 23:
                page.mouse.move(230, 102, steps=3)
            elif index == 24:
                page.mouse.move(230, 140, steps=3)
            elif index == 25:
                page.mouse.up()
            elif index == 27:
                page.locator('#case-shell').focus()
                page.keyboard.press("2")
            elif index == 29:
                page.locator('#restart-button').click()
            elif index == 31:
                page.locator('.chapter-control[data-progress="0.666667"]').click()
            elif index == 33:
                page.locator('#case-shell').focus()
                page.keyboard.press("End")
            elif index == 35:
                page.mouse.wheel(0, 180)
        elif demo["id"] == "velocity-reactive-marquee":
            if index == 2:
                page.mouse.wheel(0, 4)
            elif index == 5:
                page.mouse.wheel(0, 68)
            elif index == 7:
                page.mouse.wheel(0, -72)
            elif index == 10:
                page.mouse.move(92, 104)
                page.mouse.down()
            elif index == 11:
                page.mouse.move(156, 104, steps=4)
            elif index == 12:
                page.mouse.move(236, 104, steps=4)
                page.mouse.up()
            elif index == 15:
                page.mouse.move(252, 104)
                page.mouse.down()
            elif index == 16:
                page.mouse.move(176, 104, steps=4)
            elif index == 17:
                page.mouse.move(76, 104, steps=4)
                page.mouse.up()
            elif index == 20:
                page.locator('#marquee-stage').focus()
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("Shift+ArrowLeft")
            elif index == 28:
                page.keyboard.press("r")
            elif index == 31:
                page.mouse.wheel(0, 34)
            elif index == 33:
                page.mouse.wheel(0, -38)
            elif index == 35:
                page.locator('#reset-control').click()
        elif demo["id"] == "velocity-spaced-image-trail":
            if index == 1:
                page.locator('.frame-button[data-frame="1"]').click()
            elif index == 2:
                page.mouse.move(126, 142)
                page.mouse.down()
            elif index == 3:
                page.wait_for_timeout(120)
                page.mouse.move(143, 134, steps=2)
            elif index == 4:
                page.wait_for_timeout(120)
                page.mouse.move(161, 125, steps=2)
            elif index == 5:
                page.wait_for_timeout(120)
                page.mouse.move(180, 115, steps=2)
            elif index == 6:
                page.mouse.move(248, 92, steps=3)
            elif index == 7:
                page.mouse.move(302, 72, steps=3)
            elif index == 8:
                page.mouse.up()
            elif index == 10:
                page.locator('#reset-control').click()
            elif index == 12:
                page.locator('.frame-button[data-frame="3"]').click()
            elif index == 14:
                page.locator('#trail-host').focus()
                page.keyboard.press("Shift+ArrowRight")
            elif index == 15:
                page.keyboard.press("ArrowDown")
            elif index == 16:
                page.keyboard.press("Shift+ArrowLeft")
            elif index == 17:
                page.keyboard.press("ArrowUp")
            elif index == 20:
                page.mouse.move(124, 64)
                page.mouse.down()
            elif index == 21:
                page.mouse.move(170, 82, steps=4)
            elif index == 22:
                page.mouse.move(224, 108, steps=4)
            elif index == 23:
                page.mouse.move(286, 138, steps=4)
            elif index == 24:
                page.mouse.up()
            elif index == 27:
                page.locator('#trail-host').focus()
                page.keyboard.press("Shift+ArrowRight")
            elif index == 28:
                page.keyboard.press("Shift+ArrowDown")
            elif index == 29:
                page.keyboard.press("ArrowLeft")
        elif demo["id"] == "refractive-glass-transmission-sculpture":
            viewport_width = page.viewport_size["width"]
            viewport_height = page.viewport_size["height"]
            point = lambda x, y: (round(viewport_width * x), round(viewport_height * y))
            if index == 1:
                page.locator('#grid-button').click()
            elif index == 3:
                page.locator('#studio-button').click()
            elif index == 5:
                page.mouse.move(*point(.76, .67))
                page.mouse.down()
            elif index == 6:
                page.mouse.move(*point(.61, .57), steps=4)
            elif index == 7:
                page.mouse.move(*point(.43, .46), steps=4)
                page.mouse.up()
            elif index == 9:
                page.mouse.move(*point(.34, .54))
                page.mouse.down()
            elif index == 10:
                page.mouse.move(*point(.54, .64), steps=4)
            elif index == 11:
                page.mouse.move(*point(.74, .72), steps=4)
                page.mouse.up()
            elif index == 13:
                page.locator('#glass-host').focus()
                page.keyboard.press("ArrowRight")
            elif index == 14:
                page.keyboard.press("ArrowUp")
            elif index == 15:
                page.keyboard.press("[")
            elif index == 16:
                page.keyboard.press("]")
            elif index == 17:
                page.keyboard.press("g")
            elif index == 18:
                page.keyboard.press("Enter")
            elif index == 20:
                page.locator('#grid-button').click()
            elif index == 22:
                for _ in range(13):
                    page.locator('#ior-up-button').click()
                page.locator('#glass-host').focus()
                page.keyboard.press("]")
            elif index == 24:
                page.locator('#reset-button').click()
            elif index == 26:
                page.locator('#glass-host').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 27:
                page.keyboard.press("]")
            elif index == 28:
                page.locator('#inspect-button').click()
        elif demo["id"] == "draggable-dome-gallery":
            viewport_width = page.viewport_size["width"]
            viewport_height = page.viewport_size["height"]
            point = lambda x, y: (round(viewport_width * x), round(viewport_height * y))
            if index == 2:
                page.mouse.move(*point(.794, .622))
                page.mouse.down()
            elif index == 3:
                page.mouse.move(*point(.656, .556), steps=4)
            elif index == 4:
                page.mouse.move(*point(.475, .472), steps=4)
            elif index == 5:
                page.mouse.up()
            elif index == 7:
                page.wait_for_timeout(260)
            elif index == 8:
                page.mouse.move(*point(.269, .556))
                page.mouse.down()
            elif index == 9:
                page.mouse.move(*point(.438, .639), steps=4)
            elif index == 10:
                page.mouse.move(*point(.656, .711), steps=4)
            elif index == 11:
                page.mouse.up()
            elif index == 12:
                page.wait_for_timeout(320)
            elif index == 14:
                page.locator('#dome-host').focus()
                page.keyboard.press("ArrowRight")
            elif index == 15:
                page.keyboard.press("ArrowUp")
            elif index == 16:
                page.keyboard.press("Shift+ArrowLeft")
            elif index == 17:
                page.keyboard.press("Enter")
            elif index == 18:
                page.wait_for_timeout(380)
            elif index == 20:
                page.locator('#confirm-control').click()
            elif index == 22:
                page.locator('#close-control').click()
            elif index == 24:
                page.locator('#reset-control').click()
            elif index == 26:
                page.locator('#dome-host').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 27:
                page.keyboard.press("ArrowDown")
            elif index == 28:
                page.keyboard.press("Enter")
            elif index == 29:
                page.wait_for_timeout(380)
            elif index == 31:
                page.locator('#confirm-control').click()
        elif demo["id"] == "bending-webgl-gallery-ribbon":
            if index == 2:
                page.mouse.wheel(0, 160)
            elif index == 4:
                page.mouse.wheel(0, -130)
            elif index == 6:
                page.mouse.move(252, 104)
                page.mouse.down()
            elif index == 7:
                page.mouse.move(188, 104, steps=4)
            elif index == 8:
                page.mouse.move(104, 104, steps=4)
                page.mouse.up()
            elif index == 10:
                page.wait_for_timeout(320)
            elif index == 12:
                page.mouse.move(76, 104)
                page.mouse.down()
            elif index == 13:
                page.mouse.move(148, 104, steps=4)
            elif index == 14:
                page.mouse.move(236, 104, steps=4)
                page.mouse.up()
            elif index == 16:
                page.wait_for_timeout(260)
            elif index == 17:
                page.locator('#ribbon-host').focus()
                page.keyboard.press("ArrowRight")
            elif index == 18:
                page.keyboard.press("ArrowUp")
            elif index == 20:
                page.keyboard.press("Enter")
            elif index == 22:
                page.keyboard.press("Escape")
            elif index == 24:
                page.keyboard.press("End")
            elif index == 25:
                page.mouse.wheel(0, 180)
            elif index == 27:
                page.locator('#ribbon-host').focus()
                page.keyboard.press("Home")
            elif index == 28:
                page.mouse.wheel(0, -180)
            elif index == 30:
                page.locator('#reset-button').click()
            elif index == 32:
                page.locator('#ribbon-host').focus()
                page.keyboard.press("ArrowRight")
            elif index == 33:
                page.wait_for_timeout(320)
            elif index == 35:
                page.locator('#inspect-button').click()
        elif demo["id"] == "frame-by-frame-gif-scrubber":
            if index == 2:
                box = page.locator('#gif-slider').bounding_box()
                page.mouse.move(box["x"] + 2, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 3:
                box = page.locator('#gif-slider').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .35, box["y"] + box["height"] * .5, steps=3)
            elif index == 4:
                box = page.locator('#gif-slider').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .7, box["y"] + box["height"] * .5, steps=3)
            elif index == 5:
                box = page.locator('#gif-slider').bounding_box()
                page.mouse.move(box["x"] + box["width"] - 2, box["y"] + box["height"] * .5, steps=3)
                page.mouse.up()
            elif index == 7:
                page.locator('.transport-button[data-action="previous"]').click()
            elif index == 8:
                page.locator('.transport-button[data-action="next"]').click()
            elif index == 10:
                page.locator('#gif-stage').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 11:
                page.keyboard.press("ArrowRight")
            elif index == 12:
                page.keyboard.press("Home")
            elif index == 13:
                page.keyboard.press("End")
            elif index == 15:
                page.locator('.transport-button[data-action="play"]').click()
            elif index == 16:
                page.wait_for_timeout(420)
            elif index == 17:
                page.locator('.transport-button[data-action="play"]').click()
            elif index == 19:
                page.locator('#reset-control').click()
            elif index == 21:
                page.locator('#gif-stage').focus()
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("ArrowRight")
            elif index == 23:
                page.locator('.transport-button[data-action="play"]').click()
            elif index == 24:
                page.wait_for_timeout(260)
            elif index == 25:
                page.locator('.transport-button[data-action="play"]').click()
            elif index == 28:
                box = page.locator('#gif-slider').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .45, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 29:
                box = page.locator('#gif-slider').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .78, box["y"] + box["height"] * .5, steps=4)
                page.mouse.up()
            elif index == 31:
                page.locator('.transport-button[data-action="previous"]').click()
            elif index == 33:
                page.locator('#gif-stage').focus()
                page.keyboard.press("End")
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
            if index == 2:
                page.locator('.view-control[data-view="left"]').click()
            elif index == 4:
                page.locator('.view-control[data-view="right"]').click()
            elif index == 6:
                page.locator('#depth-stage').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 7:
                page.keyboard.press("ArrowLeft")
            elif index == 9:
                page.keyboard.press("1")
            elif index == 11:
                page.keyboard.press("2")
            elif index == 13:
                page.keyboard.press("3")
            elif index == 15:
                page.mouse.move(278, 42)
            elif index == 16:
                page.mouse.move(42, 136, steps=4)
            elif index == 18:
                page.mouse.move(52, 138)
                page.mouse.down()
            elif 19 <= index <= 23:
                progress = (index - 19) / 4
                page.mouse.move(52 + 218 * progress, 138 - 94 * progress)
            elif index == 24:
                page.mouse.up()
            elif index == 26:
                page.keyboard.press("ArrowRight")
            elif index == 27:
                page.keyboard.press("ArrowUp")
            elif index == 29:
                page.keyboard.press("3")
            elif index == 31:
                page.keyboard.press("Home")
            elif index == 34:
                page.locator('.view-control[data-view="right"]').click()
            elif index == 35:
                page.locator('#depth-stage').focus()
                page.keyboard.press("Home")
        elif demo["id"] == "svg-filter-gooey-text-hover":
            if index == 2:
                page.locator('#blend-action').hover()
            elif index == 4:
                page.wait_for_timeout(520)
            elif index == 6:
                page.locator('#blend-action').click()
            elif index == 7:
                page.wait_for_timeout(560)
            elif index == 10:
                page.locator('#formula-panel').hover()
            elif index == 12:
                page.wait_for_timeout(360)
            elif index == 14:
                page.keyboard.press("Tab")
            elif index == 16:
                page.keyboard.press("Escape")
            elif index == 17:
                page.wait_for_timeout(520)
            elif index == 19:
                page.keyboard.press("Enter")
            elif index == 20:
                page.wait_for_timeout(520)
            elif index == 22:
                page.keyboard.press("Escape")
            elif index == 23:
                page.wait_for_timeout(520)
            elif index == 24:
                page.keyboard.press("Tab")
            elif index == 25:
                page.wait_for_timeout(520)
            elif index == 27:
                page.locator('#blend-action').hover()
            elif index == 29:
                page.locator('#blend-action').click()
            elif index == 31:
                page.locator('#formula-panel').hover()
            elif index == 33:
                page.locator('#blend-action').click()
            elif index == 34:
                page.locator('#formula-panel').hover()
            elif index == 35:
                page.wait_for_timeout(520)
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
        if demo["id"] not in {"emergent-particle-life-colonies", "velocity-reactive-marquee", "draggable-dome-gallery", "bending-webgl-gallery-ribbon"}:
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
    elif demo["id"] == "clip-path-menu-curtain":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "dom"
            or interaction["mechanism"] != "css-clip-path-polygon"
            or interaction["inputAdapters"] != ["pointer", "touch", "click", "keyboard"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockDrivesMenu"]
            or not interaction["motionControlsCreated"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputCount"] < 10
            or interaction["openCount"] < 4
            or interaction["closeCount"] < 3
            or interaction["selectionCount"] < 2
            or interaction["syncCount"] < 20
            or interaction["selectedSection"] != "artists"
            or interaction["phase"] != "open"
            or interaction["progress"] != 1
            or interaction["targetProgress"] != 1
            or interaction["motionActive"]
            or not interaction["focusTrapActive"]
            or interaction["focusedIndex"] != 0
            or interaction["lastInput"] != "click:toggle"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-operated publication curtain with staggered links, focus trapping, two semantic selections, Escape, and final open state: {interaction!r}")
    elif demo["id"] == "playable-brand-minesweeper-footer":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticSeededPlay"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["semanticGridValidated"]
            or not interaction["initialStaticVerified"]
            or interaction["bombIndices"] != [5, 13, 18, 26]
            or interaction["inputCount"] < 14
            or interaction["pointerInputCount"] < 9
            or interaction["keyboardInputCount"] < 5
            or interaction["cellActionCount"] < 8
            or interaction["revealActionCount"] < 4
            or interaction["flagActionCount"] < 4
            or interaction["contextFlagCount"] < 1
            or interaction["modeToggleCount"] < 2
            or interaction["resetButtonCount"] < 2
            or interaction["escapeResetCount"] < 1
            or interaction["resetCount"] < 3
            or interaction["keyboardNavigationCount"] < 1
            or interaction["keyboardRevealCount"] < 1
            or interaction["keyboardFlagCount"] < 2
            or interaction["cascadeCellRevealCount"] < 40
            or interaction["gameStartCount"] < 3
            or interaction["winCount"] < 1
            or interaction["lossCount"] < 1
            or interaction["motionStartCount"] < 8
            or interaction["motionCompleteCount"] < 7
            or interaction["phase"] != "ready"
            or interaction["mode"] != "reveal"
            or interaction["focusedIndex"] != 0
            or interaction["revealedIndices"] != []
            or interaction["flaggedIndices"] != []
            or interaction["remainingSafeCount"] != 28
            or interaction["minesRemaining"] != 4
            or interaction["rewardUnlocked"]
            or interaction["animationActive"]
            or interaction["inputKind"] != "keyboard"
            or interaction["lastTrustedEvent"] != "escape-reset"
        ):
            raise RuntimeError(f"{demo['id']} did not capture human reveal cascades, two flag paths, win/reward, loss, keyboard play, and explicit reset: {interaction!r}")
    elif demo["id"] == "noise-cancellation-audio-comparison":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticPlayback"]
            or interaction["automaticCrossfade"]
            or interaction["automaticDividerMotion"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userOwnedMix"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or not interaction["initialFrameStatic"]
            or interaction["initialMix"] != .5
            or interaction["initialPlaying"]
            or interaction["initialAudioContextCreated"]
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 12
            or interaction["pointerInputCount"] < 8
            or interaction["keyboardInputCount"] < 4
            or interaction["dragSessionCount"] < 1
            or interaction["dragUpdateCount"] < 6
            or interaction["presetSelectionCount"] < 3
            or interaction["keyboardMixCount"] < 4
            or interaction["playToggleCount"] < 4
            or interaction["mixMutationCount"] < 10
            or not interaction["audioContextCreated"]
            or not interaction["audioGraphReady"]
            or not interaction["audioStarted"]
            or interaction["playing"]
            or interaction["audioStartCount"] != 1
            or interaction["audioResumeCount"] < 4
            or interaction["sourceStartDelta"] != 0
            or interaction["bufferFrameCount"] <= 0
            or interaction["bufferSampleRate"] <= 0
            or interaction["audioBufferDifference"] <= .01
            or interaction["measuredNoiseReductionDb"] < 25
            or abs(interaction["equalPowerEnergy"] - 1) > .00001
            or abs(interaction["cleanMix"] - .3) > .00001
            or abs(interaction["curtainPosition"] - .7) > .00001
            or interaction["selectedPreset"] != "custom"
            or interaction["previousPreset"] != "split"
            or interaction["mixSource"] != "keyboard"
            or interaction["motionControlCount"] != 1
            or interaction["dragActive"]
            or interaction["phase"] != "reviewing"
            or interaction["inputKind"] != "mouse"
            or interaction["lastInputTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture one human-operated, sample-locked Web Audio restoration comparison: {interaction!r}")
    elif demo["id"] == "audio-equalizer-typography":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockDrivesSpectrum"]
            or not interaction["deterministicSilentFrame"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputAdapters"] != ["pointer", "touch", "click", "keyboard"]
            or interaction["inputCount"] < 12
            or interaction["pointerInputCount"] < 5
            or interaction["keyboardInputCount"] < 7
            or interaction["pointerMoveCount"] < 10
            or interaction["audioToggleCount"] < 9
            or interaction["pitchChangeCount"] < 16
            or not interaction["audioContextCreated"]
            or not interaction["analyserConnected"]
            or not interaction["oscillatorStarted"]
            or interaction["audioContextState"] != "running"
            or interaction["analyserReadCount"] <= 0
            or interaction["analyserFftSize"] != 256
            or interaction["frequencyBinCount"] != 128
            or interaction["word"] != "PULSE"
            or interaction["sliceCount"] != 230
            or interaction["maskPixelCount"] <= 40000
            or not interaction["p5Instance"]
            or interaction["claimedLibrary"] != "p5@2.3.0 + Web Audio"
            or interaction["audioActive"]
            or interaction["latched"]
            or interaction["pointerHolding"]
            or interaction["phase"] != "silent"
            or abs(interaction["pitchNormalized"] - .67) > .00001
            or interaction["frequencyHz"] != 443
            or interaction["peakBin"] != 0
            or interaction["peakMagnitude"] != 0
            or interaction["deformationAmount"] != 0
            or interaction["lastInput"] != "keyboard:Escape"
            or interaction["canvasWidth"] < 64
            or interaction["canvasHeight"] < 64
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-started real analyser materially reshaping the PULSE letterform: {interaction!r}")
    elif demo["id"] == "animated-hand-drawn-semantic-annotation":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticRehearsal"]
            or interaction["automaticReplay"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 10
            or interaction["pointerInputCount"] < 6
            or interaction["keyboardInputCount"] < 4
            or interaction["selectionCount"] < 2
            or interaction["reselectionCount"] < 3
            or interaction["sameSelectionReplayCount"] < 1
            or interaction["replayCount"] < 3
            or interaction["resetButtonCount"] < 1
            or interaction["escapeResetCount"] < 1
            or interaction["resetCount"] < 2
            or interaction["keyboardNavigationCount"] < 1
            or interaction["keyboardSelectCount"] < 1
            or interaction["keyboardShortcutReplayCount"] < 1
            or interaction["geometryMeasureCount"] < 8
            or interaction["geometryRevision"] < 8
            or interaction["motionStartCount"] < 8
            or interaction["motionCompleteCount"] < 7
            or interaction["motionCancelCount"] < 1
            or interaction["selectedPhraseId"] is not None
            or interaction["selectedPhraseText"] is not None
            or interaction["selectionRect"] is not None
            or interaction["overlayRect"] is not None
            or interaction["geometrySource"] != "none"
            or interaction["geometryValidated"]
            or interaction["annotationVisible"]
            or interaction["animationActive"]
            or interaction["phase"] != "idle"
            or interaction["inputKind"] != "keyboard"
            or interaction["lastTrustedEvent"] != "escape-reset"
        ):
            raise RuntimeError(f"{demo['id']} did not capture human-selected Range geometry, interruptible redraw, keyboard navigation, and explicit reset: {interaction!r}")
    elif demo["id"] == "mechanical-split-flap-character-change":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticFallback"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userRequestRequired"]
            or not interaction["initialFrameStatic"]
            or interaction["initialStatusIndex"] != 0
            or interaction["initialStatus"] != "ON TIME "
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 10
            or interaction["pointerInputCount"] < 5
            or interaction["keyboardInputCount"] < 5
            or interaction["transitionRequestCount"] < 8
            or interaction["completedTransitionCount"] < 7
            or interaction["interruptedTransitionCount"] < 1
            or interaction["forcedSettlementCount"] < 1
            or interaction["resetRequestCount"] < 2
            or interaction["clickRequestCount"] < 2
            or interaction["boardRequestCount"] < 2
            or interaction["keyboardRequestCount"] < 4
            or interaction["maximumConcurrentTransitions"] != 1
            or interaction["cadenceMs"] != 75
            or interaction["upperDurationMs"] != 150
            or interaction["lowerDurationMs"] != 170
            or interaction["lowerOffsetMs"] != 125
            or interaction["plannedLandingOrder"] != list(range(8))
            or interaction["characterCount"] != 8
            or interaction["motionControlCount"] != 16
            or interaction["activeMotionControlCount"] != 0
            or interaction["motionPlayCallCount"] < 128
            or interaction["controlRebuildCount"] < 10
            or interaction["controlCancellationCount"] <= 0
            or not interaction["controlsBuiltWithoutAutoplay"]
            or interaction["currentIndex"] != 0
            or interaction["currentStatus"] != "ON TIME "
            or interaction["targetIndex"] is not None
            or interaction["requestedStatus"] is not None
            or interaction["transitionActive"]
            or interaction["activeTransitionCount"] != 0
            or interaction["settledCharacterCount"] != 8
            or interaction["phase"] != "reset"
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastRequestSource"] != "keyboard-Home"
            or not interaction["renderIgnoresPreviewClock"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-operated eight-column departure board with cadence, interruption, completion, and reset evidence: {interaction!r}")
    elif demo["id"] == "interactive-vector-state-machine":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticStateCycle"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 12
            or interaction["pointerInputCount"] < 7
            or interaction["keyboardInputCount"] < 5
            or interaction["pressStartCount"] < 4
            or interaction["captureCompleteCount"] < 4
            or interaction["confirmCount"] < 2
            or interaction["resetButtonCount"] < 1
            or interaction["escapeResetCount"] < 1
            or interaction["resetCount"] < 2
            or interaction["transitionCount"] < 12
            or interaction["motionStartCount"] < 12
            or interaction["motionCompleteCount"] < 4
            or interaction["motionCancelCount"] < 1
            or len(interaction["transitionHistory"]) != 12
            or not all(item["trusted"] for item in interaction["transitionHistory"])
            or interaction["phase"] != "ready"
            or interaction["stateIndex"] != 0
            or interaction["transcript"] is not None
            or interaction["appliedScene"]
            or interaction["activeInput"]
            or interaction["activeInputKind"] is not None
            or interaction["holdDurationMs"] != 0
            or interaction["animationActive"]
            or interaction["inputKind"] != "keyboard"
            or interaction["lastTrustedEvent"] != "escape-reset-agent"
        ):
            raise RuntimeError(f"{demo['id']} did not capture held human input, transcript review, explicit room-scene approval, re-recording, interruption, and reset: {interaction!r}")
    elif demo["id"] == "pointer-rotated-dot-matrix-globe":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["claimedLibrary"] != "p5@2.3.0"
            or not interaction["p5Instance"]
            or interaction["renderer"] != "canvas2d"
            or interaction["projection"] != "orthographic"
            or interaction["inputAdapters"] != ["pointer", "touch", "click", "keyboard"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockDrivesRotation"]
            or not interaction["initialStaticConfirmed"]
            or interaction["initialFrameChecksum"] == 0
            or interaction["inputCount"] < 12
            or interaction["pointerRotations"] < 11
            or interaction["keyboardRotations"] < 4
            or interaction["focusCount"] < 6
            or interaction["resetCount"] < 2
            or interaction["dragging"]
            or interaction["dragDistance"] <= 0
            or interaction["lastInput"] != "keyboard:Home"
            or abs(interaction["yaw"] + 1.5707963267948966) > .000001
            or abs(interaction["pitch"] + .35) > .000001
            or interaction["selectedSiteId"] is not None
            or interaction["nearestSiteId"] is None
            or interaction["pointCount"] != 648
            or interaction["siteCount"] != 8
            or interaction["routeCount"] != 0
            or interaction["visibleSiteCount"] < 1
            or interaction["projectedFrontCount"] < 280
            or interaction["projectedFrontCount"] > 370
            or interaction["spatialChecksum"] == 0
            or interaction["siteChecksum"] == 0
            or interaction["canvasWidth"] < 64
            or interaction["canvasHeight"] < 64
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-rotated geodata globe with real nearest-node focus, routes, keyboard control, and reset: {interaction!r}")
    elif demo["id"] == "scene-wipe-progressive-page-swap":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["task"] != "cultural-venue-day-to-live-program-switch"
            or interaction["automaticFallback"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userRequestRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or interaction["inputCount"] < 10
            or interaction["sceneRequestCount"] < 10
            or interaction["pointerInputCount"] < 5
            or interaction["keyboardInputCount"] < 5
            or interaction["completedTransitionCount"] < 6
            or interaction["interruptedTransitionCount"] < 3
            or interaction["maximumConcurrentTransitions"] != 1
            or interaction["motionPlayCallCount"] < 10
            or interaction["controlCancellationCount"] < 3
            or interaction["displayControlCount"] != 4
            or interaction["controlRebuildCount"] < 1
            or interaction["layoutMeasureCount"] < 1
            or interaction["wipeDurationSeconds"] != .88
            or interaction["currentSceneIndex"] != 0
            or interaction["targetSceneIndex"] is not None
            or interaction["progress"] != 0
            or interaction["phase"] != "settled"
            or interaction["transitionActive"]
            or interaction["activeTransitionCount"] != 0
            or interaction["activeDriverCount"] != 0
            or interaction["clipControlProgress"] != 0
            or interaction["bladeControlProgress"] != 0
            or interaction["railControlProgress"] != 0
            or interaction["contentControlProgress"] != 0
            or interaction["sceneEvidence"]["exhibit"]["theme"] == interaction["sceneEvidence"]["live"]["theme"]
            or interaction["sceneEvidence"]["exhibit"]["layout"] == interaction["sceneEvidence"]["live"]["layout"]
            or interaction["sceneEvidence"]["exhibit"]["graphic"] == interaction["sceneEvidence"]["live"]["graphic"]
            or interaction["lastInputKind"] != "mouse"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastRequestSource"] != "toggle-button"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-operated, fully replaced, reversible two-scene cultural-program wipe: {interaction!r}")
    elif demo["id"] == "draggable-packed-editorial-wall":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticPacking"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["initialPositionsValidated"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 13
            or interaction["pointerInputCount"] < 7
            or interaction["keyboardInputCount"] < 6
            or interaction["dragStartCount"] < 2
            or interaction["pointerMoveCount"] < 9
            or interaction["dragReleaseCount"] < 2
            or interaction["snapBackCount"] < 1
            or interaction["extractCount"] < 3
            or interaction["repackCount"] < 2
            or interaction["keyboardMoveCount"] < 3
            or interaction["keyboardRepackCount"] < 2
            or interaction["buttonRepackCount"] < 2
            or interaction["buttonResetCount"] < 1
            or interaction["escapeResetCount"] < 1
            or interaction["resetCount"] < 2
            or interaction["layoutStartCount"] < 11
            or interaction["layoutCompleteCount"] < 10
            or interaction["layoutCancelCount"] < 1
            or interaction["phase"] != "initial"
            or interaction["selectedTileId"] != "route-credits"
            or interaction["extractedTileId"] is not None
            or interaction["activeDragTileId"] is not None
            or interaction["order"] != ["night-market", "neon-memory", "field-notes", "return-rate", "maker", "route-credits"]
            or interaction["layoutAnimationActive"]
            or interaction["inputKind"] != "keyboard"
            or interaction["lastTrustedEvent"] != "escape-reset"
        ):
            raise RuntimeError(f"{demo['id']} did not capture human drag extraction, five-story repair, keyboard reorder/repack, snap-back, and explicit reset: {interaction!r}")
    elif demo["id"] == "velocity-aware-swipe-drawer":
        page.wait_for_function("!window.__PREVIEW_INTERACTION_STATE__.motionActive && !window.__PREVIEW_INTERACTION_STATE__.dragging", timeout=2_000)
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "dom"
            or interaction["mechanism"] != "velocity-aware-responsive-drawer"
            or interaction["layout"] != "bottom"
            or interaction["axis"] != "y"
            or interaction["openingDirection"] != -1
            or interaction["inputAdapters"] != ["pointer", "touch", "button", "keyboard"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockDrivesDrawer"]
            or not interaction["initialStaticConfirmed"]
            or not interaction["motionControlsCreated"]
            or interaction["inputCount"] < 8
            or interaction["dragCount"] < 3
            or interaction["releaseCount"] < 3
            or interaction["steadyReleaseCount"] < 1
            or interaction["fastReleaseCount"] < 2
            or interaction["keyboardCount"] < 3
            or interaction["buttonCount"] < 2
            or interaction["settleCount"] < 8
            or interaction["resultCount"] != 1
            or len(interaction["releaseHistory"]) < 3
            or not all(item["trusted"] for item in interaction["releaseHistory"])
            or [item["speedBand"] for item in interaction["releaseHistory"][:3]] != ["steady", "fast", "fast"]
            or [item["targetName"] for item in interaction["releaseHistory"][:3]] != ["summary", "preview", "full route"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInput"] != "keyboard:Home"
            or interaction["routeState"] != "active"
            or interaction["resultCount"] != 1
            or interaction["progress"] != 0
            or interaction["targetProgress"] != 0
            or interaction["snapIndex"] != 0
            or interaction["phase"] != "preview"
            or interaction["motionActive"]
            or interaction["dragging"]
            or interaction["pointerCaptured"]
            or interaction["travelDistance"] < 100
            or interaction["speedBand"] != "steady"
            or interaction["releaseDecision"] != "keyboard → preview"
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted slow/fast velocity snaps, responsive bottom-drawer keyboard control, route start, and exact collapsed recovery: {interaction!r}")
    elif demo["id"] == "spatial-slide-deck-navigation":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            interaction["automaticNavigation"]
            or interaction["automaticOverview"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or not interaction["assetLoaded"]
            or interaction["inputCount"] < 14
            or interaction["pointerInputCount"] < 6
            or interaction["keyboardInputCount"] < 8
            or interaction["swipeCount"] < 1
            or interaction["buttonNavigationCount"] < 2
            or interaction["mapSelectionCount"] < 1
            or interaction["slideSelectionCount"] < 1
            or interaction["overviewToggleCount"] < 2
            or interaction["transitionCount"] < 13
            or interaction["motionStartCount"] < 13
            or interaction["motionCompleteCount"] < 8
            or interaction["motionCancelCount"] < 3
            or interaction["mode"] != "overview"
            or interaction["currentId"] != "decision"
            or interaction["position"] != {"x": 3, "y": 0}
            or set(interaction["visitedIds"]) != {"brief", "site", "risk", "access", "proposal", "decision"}
            or interaction["activeInput"]
            or interaction["activeInputKind"] is not None
            or interaction["pointerCaptured"]
            or interaction["animationActive"]
            or interaction["inputKind"] != "keyboard"
            or interaction["lastDirection"] != "overview"
            or interaction["lastTrustedEvent"] != "keyboard-overview"
            or len(interaction["transitionHistory"]) != 12
            or not all(item["trusted"] for item in interaction["transitionHistory"])
        ):
            raise RuntimeError(f"{demo['id']} did not capture a human-navigated six-page harbor review with 2D branches, generated-image evidence, swipe, overview selection, map jump, cancellation, and final topology: {interaction!r}")
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
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "architectural-straight-line-refraction-qa"
            or interaction["automaticFallback"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userInputRequired"]
            or not interaction["inputDrivenRecovery"]
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "sample-control"]
            or not interaction["initialFrameStatic"]
            or interaction["inputCount"] < 17
            or interaction["activationCount"] < 13
            or interaction["resetInputCount"] < 3
            or interaction["pointerInputCount"] < 12
            or interaction["keyboardInputCount"] < 4
            or interaction["pointerActivationCount"] < 7
            or interaction["keyboardActivationCount"] < 3
            or interaction["presetActivationCount"] < 4
            or interaction["recoveryCompletionCount"] < 1
            or interaction["inputKind"] != "mouse"
            or interaction["lastInputSource"] != "reset-control"
            or interaction["lastInputTrusted"] is not True
            or interaction["mode"] != "idle"
            or interaction["phase"] != "idle"
            or interaction["engaged"]
            or interaction["strength"] != 0
            or interaction["selectedSample"] != "none"
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or not interaction["sourceTextureReady"]
            or interaction["sourceNaturalWidth"] != 1280
            or interaction["sourceNaturalHeight"] != 720
            or interaction["shaderDisplacementScale"] != .058
            or interaction["shaderFrontFrequency"] != 34
            or interaction["shaderElasticFrequency"] != 96
            or interaction["previewClockMutationCount"] != 0
            or interaction["renderIgnoresPreviewClock"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted facade/pool/horizon QA probes, pointer drag, keyboard sampling, input-derived WebGL recovery, and explicit reset: {interaction!r}")
    elif demo["id"] == "draggable-rigid-body-poster-pile":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__POSTER_TABLE_STATE__")
        physics = page.evaluate("window.__POSTER_TABLE_PHYSICS__")
        if (
            not assertion
            or interaction["automaticPath"]
            or interaction["captureClockDriven"]
            or interaction["syntheticEvents"]
            or not interaction["imagesReady"]
            or interaction["imageDimensions"] != [[639, 1000], [639, 1000], [800, 1000], [800, 1000]]
            or interaction["inputCount"] < 11
            or interaction["pointerInputCount"] < 1
            or interaction["keyboardInputCount"] < 4
            or interaction["controlInputCount"] < 5
            or interaction["throwCount"] < 1
            or interaction["resetCount"] < 2
            or interaction["phase"] != "idle"
            or interaction["selectedIndex"] != 2
            or interaction["shortlistId"] != "paper"
            or interaction["lastSource"] != "control-review"
            or interaction["lastPointerType"] != "mouse"
            or interaction["pointerCaptured"]
            or interaction["motionActive"]
            or interaction["activeBodyId"] is not None
            or physics["solver"] != "oriented-rectangle-sat"
            or not physics["impulseResponse"]
            or not physics["angularImpulse"]
            or not physics["wallCollisions"]
            or physics["collisionCount"] < 1
            or physics["integrationSteps"] < 1
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted controls, keyboard placement, a real captured pointer throw, collisions, and an explicit final shortlist: assertion={assertion!r}; interaction={interaction!r}; physics={physics!r}")
    elif demo["id"] == "point-constructed-generative-corolla":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["automaticGrowth"]
            or interaction["automaticFocus"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["continuousGrowth"]
            or interaction["runEnabled"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 20
            or interaction["pointerInputCount"] < 14
            or interaction["keyboardInputCount"] < 5
            or interaction["focusMoveCount"] < 10
            or interaction["parameterChangeCount"] < 5
            or interaction["lockCount"] < 3
            or interaction["unlockCount"] < 2
            or interaction["resetCount"] < 1
            or interaction["pointerCaptureCount"] < 1
            or interaction["pointerReleaseCount"] < 1
            or interaction["mode"] != "locked"
            or not interaction["focusActive"]
            or not interaction["dirty"]
            or interaction["density"] != .66
            or interaction["tension"] != .54
            or interaction["inputKind"] != "pointer"
            or interaction["lastTrustedEvent"] != "pointer-toggle-lock"
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["pointCount"] != 3600
            or interaction["visiblePointCount"] < 1500
            or interaction["influencedPointCount"] < 12
            or interaction["transitionCount"] < 16
            or interaction["redrawRequestCount"] < 16
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted pointer/keyboard art-direction pass, parameter changes, reset, and explicit sleeve lock: {interaction!r}")
    elif demo["id"] == "pointer-injected-gpu-fluid":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__FLUID_INTERACTION_STATE__")
        input_state = page.locator('.preview-stage').get_attribute('data-input-state')
        if (
            not assertion
            or interaction["task"] != "stage-haze-colour-mix-review"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or interaction["automaticPath"]
            or interaction["automaticInjection"]
            or interaction["previewClockDriven"]
            or interaction["syntheticEvents"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialChecksumStable"]
            or interaction["inputCount"] < 21
            or interaction["pointerInputCount"] < 12
            or interaction["keyboardInputCount"] < 4
            or interaction["controlInputCount"] < 5
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["pointerMoveInjectionCount"] < 8
            or interaction["keyboardInjectionCount"] < 1
            or interaction["gelSelectionCount"] < 2
            or interaction["pauseToggleCount"] < 2
            or interaction["saveCount"] < 1
            or interaction["clearCount"] < 1
            or interaction["totalInjections"] < 11
            or interaction["maxInjections"] < 11
            or interaction["simulationSteps"] < 10
            or interaction["framebufferPasses"] < 100
            or interaction["selectedGel"] != "amber"
            or interaction["paused"]
            or interaction["saved"]
            or interaction["pointerDown"]
            or interaction["pointerId"] is not None
            or interaction["pendingSplats"]
            or interaction["injections"] != 0
            or any(interaction["gelWeights"].values())
            or interaction["activeFrames"] != 0
            or interaction["lastInputKind"] != "control"
            or interaction["lastInputSource"] != "control-clear"
            or interaction["lastInputTrusted"] is not True
            or input_state != "idle"
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted bidirectional pointer colour injection, keyboard injection, pause/resume, save, and explicit clear on the real framebuffer pipeline: assertion={assertion!r}; input_state={input_state!r}; interaction={interaction!r}")
    elif demo["id"] == "emergent-particle-life-colonies":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PARTICLE_LIFE_STATE__")
        if (
            not assertion
            or interaction["task"] != "bounded-colony-relationship-experiment"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["deterministicInitialization"]
            or interaction["randomSourceUsed"]
            or not interaction["initialStaticConfirmed"]
            or interaction["fixedSeed"] != 590216
            or interaction["inputCount"] < 12
            or interaction["pointerInputCount"] < 2
            or interaction["keyboardInputCount"] < 4
            or interaction["controlInputCount"] < 6
            or interaction["pointerMoveCount"] < 6
            or interaction["runCount"] < 2
            or interaction["resetCount"] < 2
            or interaction["ruleChangeCount"] < 3
            or interaction["interventionCount"] < 3
            or interaction["phase"] != "observed"
            or interaction["running"]
            or interaction["rule"] != "cycle"
            or interaction["selectedSpecies"] != 1
            or interaction["selectedStepBudget"] != 24
            or interaction["remainingSteps"] != 0
            or interaction["completedSteps"] != 24
            or interaction["lastRunSteps"] != 24
            or interaction["simulationStepCount"] != 24
            or interaction["forceEvaluationCount"] < 45000
            or not interaction["interventionActive"]
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["activePointerId"] is not None
            or interaction["lastInput"] != "control-run"
            or interaction["lastInputTrusted"] is not True
            or interaction["p5Instance"] is not True
            or interaction["claimedLibrary"] != "p5@2.3.0"
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted bounded colony experiments, a real pointer intervention, keyboard rule/step input, reset, and a deterministic final observation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "sticky-card-stack-accumulation":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "incident-review-card-stack"
            or interaction["acceptedInputs"] != ["wheel", "mouse", "touch", "pen", "keyboard", "chapter-control"]
            or not interaction["userInputRequired"]
            or not interaction["userOwnedProgress"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or interaction["automaticProgress"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 20
            or interaction["wheelInputCount"] < 6
            or interaction["pointerInputCount"] < 10
            or interaction["keyboardInputCount"] < 3
            or interaction["wheelConsumedCount"] < 3
            or interaction["wheelBoundaryReleaseCount"] < 3
            or interaction["startBoundaryReleaseCount"] < 1
            or interaction["endBoundaryReleaseCount"] < 2
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["dragUpdateCount"] < 8
            or interaction["keyboardSeekCount"] < 3
            or interaction["chapterSelectionCount"] < 3
            or interaction["restartCount"] < 1
            or interaction["progressMutationCount"] < 12
            or interaction["motionControlCount"] != 9
            or interaction["cardStickyCount"] != 4
            or interaction["progress"] != 1
            or interaction["activeIndex"] != 3
            or interaction["activeChapter"] != "response"
            or not interaction["taskComplete"]
            or interaction["finding"] != "3 safeguards shipped"
            or interaction["progressSource"] != "keyboard-End"
            or interaction["inputKind"] != "wheel"
            or interaction["lastBoundary"] != "end"
            or interaction["lastWheelDefaultPrevented"] is not False
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] is not None
            or interaction["lastInputTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted wheel accumulation and boundary release, two captured drags, chapter controls, keyboard navigation, restart, and a completed incident review: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "velocity-reactive-marquee":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-paced-arrival-board"
            or interaction["acceptedInputs"] != ["wheel", "mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["inertiaInputOwned"]
            or not interaction["initialStable"]
            or interaction["inputCount"] < 20
            or interaction["wheelInputCount"] < 5
            or interaction["pointerInputCount"] < 10
            or interaction["keyboardInputCount"] < 3
            or interaction["controlInputCount"] < 1
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["dragUpdateCount"] < 8
            or interaction["resetCount"] < 2
            or interaction["positiveSampleCount"] < 5
            or interaction["negativeSampleCount"] < 5
            or interaction["directionReversalCount"] < 5
            or interaction["maxAbsVelocity"] < 900
            or interaction["segmentWidth"] <= 280
            or interaction["velocity"] != 0
            or interaction["offset"] != 0
            or interaction["inputSource"] != "reset"
            or interaction["lastSignedSample"] != 0
            or interaction["dragging"]
            or interaction["pointerId"] is not None
            or interaction["lastInputKind"] != "control"
            or interaction["lastInputSource"] != "control-reset"
            or interaction["lastInputTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted slow/fast signed wheel velocity, two opposed captured drags, keyboard impulses, repeated reversal, inertia, and exact reset on the real Motion rail: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "velocity-spaced-image-trail":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        sample_gaps = [sample["spawnGap"] for sample in interaction["speedSamples"]]
        sample_speeds = [sample["speed"] for sample in interaction["speedSamples"]]
        spawn_sources = {record["source"] for record in interaction["spawnRecords"]}
        if (
            not assertion
            or interaction["task"] != "human-paced-visual-memory-and-frame-inspection"
            or interaction["mechanism"] != "distance-accumulation-with-speed-mapped-spawn-gap"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or interaction["syntheticInputDispatch"]
            or interaction["initialTrailItems"] != 0
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] < 30
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] < 20
            or interaction["keyboardInputCount"] < 7
            or interaction["controlInputCount"] < 3
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["pointerMoveCount"] < 18
            or interaction["keyboardMoveCount"] < 7
            or interaction["selectionCount"] < 2
            or interaction["resetCount"] < 1
            or interaction["speedSampleCount"] < 20
            or interaction["spawnCount"] < 12
            or interaction["trailItemCount"] < 4
            or interaction["trailItemCount"] > 10
            or not sample_gaps
            or max(sample_gaps) - min(sample_gaps) < 12
            or max(sample_speeds) < 700
            or min(sample_speeds) > 350
            or spawn_sources != {"pointer", "keyboard"}
            or interaction["assetDecodeCount"] != 4
            or interaction["assetDecodeFailureCount"] != 0
            or len(interaction["assetChecksums"]) != 4
            or not interaction["assetChecksumsUnique"]
            or interaction["sampledPixelCount"] != 24576
            or interaction["selectedAssetIndex"] != 3
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] != "none"
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted slow/fast captured traces, keyboard sampling, reset, four unique decoded ImageGen frames, and a nonempty final visual-memory path: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "refractive-glass-transmission-sculpture":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "glass-material-refraction-review"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or interaction["automaticCruise"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["syntheticInputDispatch"]
            or not interaction["userOwnedOrientation"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or not interaction["reducedMotionDiscreteControls"]
            or interaction["inputCount"] < 47
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] < 20
            or interaction["mouseInputCount"] < 20
            or interaction["keyboardInputCount"] < 9
            or interaction["controlInputCount"] < 18
            or interaction["positiveInputCount"] < 12
            or interaction["negativeInputCount"] < 4
            or interaction["reversalCount"] < 2
            or interaction["orientationMutationCount"] < 16
            or interaction["iorMutationCount"] < 15
            or interaction["environmentSwitchCount"] < 5
            or interaction["inspectionCount"] < 4
            or interaction["inspectionClearCount"] < 2
            or interaction["resetCount"] < 1
            or interaction["boundaryAttemptCount"] < 1
            or interaction["maxBoundaryCount"] < 1
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["dragUpdateCount"] < 16
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] is not None
            or interaction["assetCount"] != 2
            or interaction["assetDecodedCount"] != 2
            or not interaction["assetDimensionsValid"]
            or len(interaction["assetChecksums"]) != 2
            or not interaction["assetChecksumsUnique"]
            or interaction["sampledPixelCount"] != 10368
            or not interaction["textureImagesReady"]
            or not interaction["p5Ready"]
            or not interaction["webglReady"]
            or interaction["webglVersion"] not in {"webgl1", "webgl2"}
            or not interaction["shaderCompiled"]
            or not interaction["transmissionShaderVerified"]
            or interaction["shaderPasses"] != interaction["drawCount"]
            or interaction["textureBindCount"] != interaction["drawCount"]
            or interaction["environmentIndex"] != 1
            or not interaction["inspectionActive"]
            or interaction["resultState"] != "grid-inspection"
            or interaction["ior"] != 1.47
            or interaction["inputKind"] != "control"
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted opposed specimen drags, keyboard and control IOR/environment changes, max-IOR boundary, inspection/clear/reset, two unique decoded calibration textures, and the real p5 ray-marched GLSL transmission pass: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "draggable-dome-gallery":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "orbit-and-inspect-material-dome"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["automaticCruise"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutations"] != 0
            or interaction["syntheticDispatch"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or not interaction["userOwnedView"]
            or not interaction["finiteInputInertiaOnly"]
            or interaction["trustedInputCount"] < 31
            or interaction["untrustedInputCount"] != 0
            or interaction["captureCount"] < 2
            or interaction["captureVerifiedCount"] < 2
            or interaction["releaseCount"] < 2
            or interaction["dragMoveCount"] < 16
            or interaction["keyboardInputCount"] < 7
            or interaction["controlInputCount"] < 4
            or interaction["selectionCount"] < 2
            or interaction["resetCount"] < 1
            or interaction["confirmCount"] < 2
            or not interaction["sawPositiveYaw"]
            or not interaction["sawNegativeYaw"]
            or interaction["reversalCount"] < 1
            or not interaction["reverseMathVerified"]
            or not interaction["resetMathVerified"]
            or not interaction["resetSnapshotValid"]
            or len(interaction["decodedAssets"]) != 6
            or len(interaction["textures"]) != 6
            or len(interaction["assetChecksums"]) != 6
            or not interaction["assetChecksumsUnique"]
            or interaction["sampledPixelCount"] != 36864
            or interaction["geometryChecksum"] == 0
            or len(interaction["projections"]) < 6
            or interaction["selected"] < 0
            or interaction["selectedTileIndex"] < 0
            or not interaction["confirmed"]
            or interaction["selectionProgress"] != 1
            or interaction["selectionAnimating"]
            or interaction["dragging"]
            or interaction["pointer"] is not None
            or interaction["velocityYaw"] != 0
            or interaction["velocityPitch"] != 0
            or interaction["lastInputTrusted"] is not True
            or interaction["lastSelectionTrusted"] is not True
            or interaction["lastResetTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted opposed dome drags, finite input-owned inertia, keyboard material selection, close/reset, two shortlist confirmations, six unique decoded textures, and eighteen fixed spherical views: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "bending-webgl-gallery-ribbon":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "tidal-archive-film-review"
            or interaction["acceptedInputs"] != ["wheel", "mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or not interaction["userOwnedPosition"]
            or not interaction["finiteInputInertiaOnly"]
            or interaction["automaticCruise"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 25
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["wheelInputCount"] < 4
            or interaction["pointerInputCount"] < 12
            or interaction["keyboardInputCount"] < 7
            or interaction["controlInputCount"] < 2
            or interaction["positiveInputCount"] < 4
            or interaction["negativeInputCount"] < 4
            or interaction["reversalCount"] < 4
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["dragUpdateCount"] < 8
            or interaction["inertiaStartCount"] < 4
            or interaction["inertiaStepCount"] < 2
            or interaction["bendMutationCount"] < 1
            or interaction["inspectionCount"] < 2
            or interaction["inspectionClearCount"] < 1
            or interaction["resetCount"] < 1
            or interaction["wheelBoundaryReleaseCount"] < 2
            or interaction["startBoundaryCount"] < 1
            or interaction["endBoundaryCount"] < 1
            or interaction["assetCount"] != 5
            or interaction["assetDecodedCount"] != 5
            or not interaction["assetDimensionsValid"]
            or not interaction["assetChecksumsUnique"]
            or interaction["sampledPixelCount"] != 32400
            or not interaction["textureImagesReady"]
            or not interaction["p5Ready"]
            or not interaction["webglReady"]
            or interaction["webglVersion"] not in {"webgl1", "webgl2"}
            or interaction["texturedPanelCount"] != 5
            or interaction["meshVertexCount"] != 360
            or interaction["expectedMeshVertexCount"] != 360
            or interaction["resultState"] != "inspecting"
            or interaction["inspectedIndex"] != interaction["activeIndex"]
            or interaction["inertiaActive"]
            or interaction["velocity"] != 0
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] is not None
            or interaction["inputKind"] != "control"
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted bidirectional wheel/drag browsing, finite inertia, bend control, two-sided boundary release, explicit inspection/clear/reset, and five unique decoded textures on the real p5 WebGL ribbon: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "frame-by-frame-gif-scrubber":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-animation-asset-frame-inspection"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or interaction["syntheticInputDispatch"]
            or interaction["decoder"] != "native-ImageDecoder-completeFramesOnly"
            or not interaction["gifAssetDecoded"]
            or interaction["gifSignature"] != "GIF89a"
            or interaction["gifWidth"] != 480
            or interaction["gifHeight"] != 320
            or interaction["gifByteLength"] != 767684
            or interaction["gifRawChecksum"] != "d9541344f4edc43a137a0e68a856183173463adca25d7cc59aeac33e3c0e2b77"
            or interaction["parsedFrameCount"] != 12
            or interaction["decodedFrameCount"] != 12
            or interaction["completeFrameCount"] != 12
            or interaction["uniqueFrameChecksumCount"] != 12
            or len(set(interaction["frameChecksums"])) != 12
            or set(interaction["disposalMethods"]) != {1, 2}
            or interaction["totalDurationMs"] != 1210
            or len(set(interaction["frameDurationsMs"])) < 5
            or not interaction["gifTrailerFound"]
            or not interaction["firstFramePaused"]
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] < 18
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] < 8
            or interaction["keyboardInputCount"] < 7
            or interaction["controlInputCount"] < 4
            or interaction["rangeInputCount"] < 4
            or interaction["rangeDragCount"] < 2
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["stepCount"] < 7
            or interaction["resetCount"] < 1
            or interaction["playbackStartCount"] < 2
            or interaction["playbackPauseCount"] < 2
            or interaction["playbackFrameAdvanceCount"] < 2
            or interaction["playbackActive"]
            or interaction["currentFrameIndex"] != 11
            or interaction["pointerCaptured"]
            or interaction["activeRangePointerId"] is not None
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted range drags, transport and keyboard stepping, user-started variable-delay playback, reset, twelve unique complete native GIF frames, and disposal-aware final inspection: assertion={assertion!r}; interaction={interaction!r}")
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
            interaction["automaticFallback"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "viewpoint-control"]
            or interaction["inputCount"] < 18
            or interaction["pointerInputCount"] < 8
            or interaction["keyboardInputCount"] < 8
            or interaction["pointerUpdateCount"] < 7
            or interaction["keyboardUpdateCount"] < 4
            or interaction["presetSelectionCount"] < 6
            or interaction["resetCount"] < 2
            or interaction["viewMutationCount"] < 12
            or interaction["inputKind"] != "keyboard"
            or interaction["lastInputSource"] != "keyboard-Home"
            or interaction["lastInputTrusted"] is not True
            or interaction["mode"] != "idle"
            or interaction["engaged"]
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or abs(interaction["x"] - .5) > .001
            or abs(interaction["y"] - .5) > .001
            or interaction["selectedPreset"] != "center"
            or interaction["verdict"] != "partial"
            or interaction["visibilityScore"] != 46
            or interaction["motionControlCount"] != 2
            or not interaction["controlsBuiltWithoutAutoplay"]
            or interaction["layerCount"] != 4
            or interaction["depths"] != [.06, .24, .64, 1]
            or not interaction["depthOrderingValid"]
            or interaction["renderIgnoresPreviewClock"] is not True
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted viewpoint choices, keyboard inspection, pointer hover/drag, four ordered depth planes, and explicit centered recovery: {interaction!r}")
    elif demo["id"] == "svg-filter-gooey-text-hover":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["automaticMorph"]
            or interaction["automaticHover"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["automaticFallback"]
            or interaction["syntheticInput"]
            or not interaction["userInitiatedChangesOnly"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["phase"] != "idle"
            or interaction["added"]
            or interaction["hoverInside"]
            or interaction["focusInside"]
            or interaction["pressed"]
            or interaction["pointerCaptured"]
            or interaction["activeInputKind"] is not None
            or interaction["activePointerType"] is not None
            or abs(interaction["mergeProgress"]) > .001
            or abs(interaction["targetProgress"]) > .001
            or not interaction["visualSettled"]
            or interaction["inputCount"] < 19
            or interaction["pointerInputCount"] < 14
            or interaction["keyboardInputCount"] < 5
            or interaction["hoverEnterCount"] < 3
            or interaction["hoverLeaveCount"] < 3
            or interaction["focusCount"] < 1
            or interaction["blurCount"] < 1
            or interaction["pressCount"] < 3
            or interaction["releaseCount"] < 3
            or interaction["activationCount"] < 3
            or interaction["removalCount"] < 3
            or interaction["escapeRemovalCount"] < 2
            or interaction["transitionCount"] < 9
            or interaction["filterEngagementCount"] < 6
            or interaction["motionStartCount"] < 8
            or interaction["motionCompleteCount"] < 5
            or interaction["inputKind"] != "pointer"
            or interaction["lastTrustedEvent"] != "mouse-hover-leave"
            or interaction["animationActive"]
            or not all(item["trusted"] for item in interaction["transitionHistory"])
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover/focus/press material fusion, persistent regimen add, keyboard removal, and exact idle recovery: {interaction!r}")
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
